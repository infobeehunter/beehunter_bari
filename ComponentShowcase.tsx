import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalCheckoutProps {
  orderId: string;
  amount: number;
  description: string;
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

export default function PayPalCheckout({
  orderId,
  amount,
  description,
  onSuccess,
  onError,
  onCancel,
}: PayPalCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Load PayPal script
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.VITE_PAYPAL_CLIENT_ID}&currency=EUR`;
    script.async = true;
    script.onload = () => {
      if (window.paypal && containerRef.current) {
        window.paypal
          .Buttons({
            createOrder: (data: any, actions: any) => {
              return orderId;
            },
            onApprove: (data: any, actions: any) => {
              return actions.order.capture().then((details: any) => {
                onSuccess(details);
                toast.success("Pagamento completato!");
              });
            },
            onError: (err: any) => {
              console.error("PayPal error:", err);
              if (onError) onError(err);
              toast.error("Errore durante il pagamento");
            },
            onCancel: () => {
              if (onCancel) onCancel();
              toast.info("Pagamento annullato");
            },
          })
          .render(containerRef.current);
        setIsLoading(false);
      }
    };
    script.onerror = () => {
      console.error("Failed to load PayPal script");
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [orderId, onSuccess, onError, onCancel]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="font-bold text-slate-900 mb-2">{description}</h3>
        <p className="text-2xl font-bold text-blue-600">€{amount.toFixed(2)}</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
        </div>
      )}

      <div ref={containerRef} />
    </Card>
  );
}
