import axios from "axios";
import { ENV } from "./_core/env";

const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api.paypal.com"
  : "https://api.sandbox.paypal.com";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get PayPal access token
 */
export async function getPayPalAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in;

    // Cache token for reuse (expire 1 minute before actual expiry)
    cachedAccessToken = {
      token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000,
    };

    return token;
  } catch (error) {
    console.error("Failed to get PayPal access token:", error);
    throw error;
  }
}

/**
 * Create a PayPal order for tour booking
 */
export async function createPayPalOrder(
  tourId: number,
  tourTitle: string,
  price: number,
  quantity: number,
  returnUrl: string,
  cancelUrl: string
) {
  const accessToken = await getPayPalAccessToken();

  const orderData = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: `tour-${tourId}`,
        amount: {
          currency_code: "EUR",
          value: (price * quantity).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "EUR",
              value: (price * quantity).toFixed(2),
            },
          },
        },
        items: [
          {
            name: tourTitle,
            quantity: quantity.toString(),
            unit_amount: {
              currency_code: "EUR",
              value: price.toFixed(2),
            },
          },
        ],
        description: `Prenotazione tour: ${tourTitle}`,
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      brand_name: "BeeHunter",
      locale: "it-IT",
      user_action: "PAY_NOW",
    },
  };

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to create PayPal order:", error);
    throw error;
  }
}

/**
 * Capture a PayPal order (complete the payment)
 */
export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to capture PayPal order:", error);
    throw error;
  }
}

/**
 * Create a subscription for premium membership
 */
export async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string
) {
  const accessToken = await getPayPalAccessToken();

  const subscriptionData = {
    plan_id: planId,
    subscriber: {
      name: {
        given_name: "BeeHunter",
        surname: "User",
      },
      email_address: "user@beehunter.app",
    },
    application_context: {
      brand_name: "BeeHunter",
      locale: "it-IT",
      return_url: returnUrl,
      cancel_url: cancelUrl,
      user_action: "SUBSCRIBE_NOW",
    },
  };

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
      subscriptionData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to create PayPal subscription:", error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();

  try {
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to get PayPal subscription:", error);
    throw error;
  }
}

/**
 * Verify PayPal webhook signature
 */
export async function verifyPayPalWebhookSignature(
  webhookId: string,
  event: any,
  signatureHeader: string
) {
  const accessToken = await getPayPalAccessToken();

  const verificationData = {
    webhook_id: webhookId,
    event_body: JSON.stringify(event),
    transmission_id: event.id,
    transmission_time: event.create_time,
    cert_url: event.links?.[1]?.href,
    auth_algo: signatureHeader?.split(",")[0]?.split("=")[1],
    transmission_sig: signatureHeader?.split(",")[1]?.split("=")[1],
  };

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      verificationData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Failed to verify PayPal webhook:", error);
    return false;
  }
}

/**
 * Create a billing plan for premium subscription
 */
export async function createPayPalBillingPlan(
  name: string,
  description: string,
  priceAmount: string,
  currency: string = "EUR"
) {
  const accessToken = await getPayPalAccessToken();

  const planData = {
    product_id: "BEEHUNTER_PREMIUM",
    name,
    description,
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1,
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: priceAmount,
            currency_code: currency,
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_amount: "YES",
      payment_failure_threshold: 3,
      setup_fee: {
        value: "0",
        currency_code: currency,
      },
    },
  };

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/plans`,
      planData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to create PayPal billing plan:", error);
    throw error;
  }
}
