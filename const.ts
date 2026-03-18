import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as paypal from "../paypal";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const paymentRouter = router({
  // Create order for tour booking
  createTourOrder: protectedProcedure
    .input(
      z.object({
        tourId: z.number(),
        participants: z.number().min(1),
        totalPrice: z.number().min(0),
        returnUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const tour = await db.getTourById(input.tourId);
      if (!tour) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        const order = await paypal.createPayPalOrder(
          input.tourId,
          tour.title,
          parseFloat(tour.price),
          input.participants,
          input.returnUrl,
          input.cancelUrl
        );

        return {
          success: true,
          orderId: order.id,
          approvalLink: order.links?.find((link: any) => link.rel === "approve")?.href,
        };
      } catch (error) {
        console.error("Failed to create PayPal order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment order",
        });
      }
    }),

  // Capture tour payment
  captureTourPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        tourId: z.number(),
        participants: z.number().min(1),
        totalPrice: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const captureResult = await paypal.capturePayPalOrder(input.orderId);

        if (captureResult.status !== "COMPLETED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment not completed",
          });
        }

        // Create booking with payment info
        await db.createBooking(
          ctx.user.id,
          input.tourId,
          input.participants,
          input.totalPrice,
          input.orderId
        );

        // Award XP for booking
        await db.addUserXP(
          ctx.user.id,
          50,
          "bonus",
          undefined,
          `Booked tour - ${input.participants} participants`
        );

        return {
          success: true,
          message: "Payment completed successfully",
          paymentId: input.orderId,
        };
      } catch (error) {
        console.error("Failed to capture PayPal payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment",
        });
      }
    }),

  // Create premium subscription order
  createPremiumOrder: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        // For now, create a one-time order for premium
        // In production, use billing plans for recurring subscriptions
        const order = await paypal.createPayPalOrder(
          0,
          "BeeHunter Premium - 1 mese",
          9.99,
          1,
          input.returnUrl,
          input.cancelUrl
        );

        return {
          success: true,
          orderId: order.id,
          approvalLink: order.links?.find((link: any) => link.rel === "approve")?.href,
        };
      } catch (error) {
        console.error("Failed to create premium order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create premium order",
        });
      }
    }),

  // Capture premium payment
  capturePremiumPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const captureResult = await paypal.capturePayPalOrder(input.orderId);

        if (captureResult.status !== "COMPLETED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment not completed",
          });
        }

        // Set premium until 30 days from now
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 30);

        // Update user premium status (would need to add this to db.ts)
        // await db.updateUserPremium(ctx.user.id, premiumUntil);

        // Award bonus XP
        await db.addUserXP(
          ctx.user.id,
          500,
          "bonus",
          undefined,
          "Premium subscription activated"
        );

        return {
          success: true,
          message: "Premium subscription activated",
          premiumUntil: premiumUntil.toISOString(),
        };
      } catch (error) {
        console.error("Failed to capture premium payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment",
        });
      }
    }),

  // Get payment status
  getPaymentStatus: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      try {
        // In production, query PayPal API or database for order status
        return {
          orderId: input.orderId,
          status: "pending",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get payment status",
        });
      }
    }),
});
