import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function GDPRConsentBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [consents, setConsents] = useState({
    privacy: false,
    marketing: false,
    analytics: false,
    cookies: false,
  });

  const recordConsentMutation = trpc.gdpr.recordConsent.useMutation({
    onSuccess: () => {
      toast.success("Preferenze salvate");
      setIsVisible(false);
      localStorage.setItem("gdpr-consent", JSON.stringify(consents));
    },
    onError: () => {
      toast.error("Errore nel salvataggio delle preferenze");
    },
  });

  useEffect(() => {
    // Check if user already gave consent
    const savedConsent = localStorage.getItem("gdpr-consent");
    if (!savedConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsents = {
      privacy: true,
      marketing: true,
      analytics: true,
      cookies: true,
    };
    setConsents(allConsents);
    if (user) {
      recordConsentMutation.mutate({
        consentType: "privacy",
        granted: true,
      });
    } else {
      localStorage.setItem("gdpr-consent", JSON.stringify(allConsents));
      setIsVisible(false);
    }
  };

  const handleRejectAll = () => {
    const minimalConsents = {
      privacy: true,
      marketing: false,
      analytics: false,
      cookies: false,
    };
    setConsents(minimalConsents);
    if (user) {
      recordConsentMutation.mutate({
        consentType: "privacy",
        granted: true,
      });
    } else {
      localStorage.setItem("gdpr-consent", JSON.stringify(minimalConsents));
      setIsVisible(false);
    }
  };

  const handleSavePreferences = () => {
    if (user) {
      recordConsentMutation.mutate({
        consentType: "privacy",
        granted: consents.privacy,
      });
    } else {
      localStorage.setItem("gdpr-consent", JSON.stringify(consents));
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black bg-opacity-50">
      <Card className="max-w-2xl mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gestione Consensi</h3>
              <p className="text-sm text-slate-600">
                Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Consent Options */}
          <div className="space-y-3 mb-6">
            {[
              {
                key: "privacy",
                label: "Privacy Essenziale",
                description: "Necessario per il funzionamento del sito",
                disabled: true,
              },
              {
                key: "cookies",
                label: "Cookie Funzionali",
                description: "Ricordare le tue preferenze",
              },
              {
                key: "analytics",
                label: "Analytics",
                description: "Comprendere come utilizzi BeeHunter",
              },
              {
                key: "marketing",
                label: "Marketing",
                description: "Offerte personalizzate e promozioni",
              },
            ].map(({ key, label, description, disabled }) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                <input
                  type="checkbox"
                  checked={consents[key as keyof typeof consents]}
                  onChange={(e) =>
                    setConsents((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  disabled={disabled}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{label}</p>
                  <p className="text-xs text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="text-xs text-slate-600 mb-6 space-y-1">
            <p>
              Leggi la nostra{" "}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              {" e "}
              <a href="/cookie-policy" className="text-blue-600 hover:underline">
                Cookie Policy
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRejectAll}
              disabled={recordConsentMutation.isPending}
            >
              Rifiuta Tutto
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSavePreferences}
              disabled={recordConsentMutation.isPending}
            >
              Salva Preferenze
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleAcceptAll}
              disabled={recordConsentMutation.isPending}
            >
              Accetta Tutto
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
