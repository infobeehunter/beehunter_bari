import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface NotificationPreference {
  newPOI: boolean;
  weeklyChallenges: boolean;
  specialEvents: boolean;
  friendActivity: boolean;
  promotions: boolean;
}

export default function NotificationSettings() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreference>({
    newPOI: true,
    weeklyChallenges: true,
    specialEvents: true,
    friendActivity: false,
    promotions: false,
  });

  const handleToggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast.success("Notifiche disattivate");
      } else {
        await subscribe();
        toast.success("Notifiche attivate");
      }
    } catch (error) {
      toast.error("Errore durante la configurazione delle notifiche");
    }
  };

  const handleTogglePreference = (key: keyof NotificationPreference) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isSupported) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800">
          Le notifiche push non sono supportate dal tuo browser.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <h3 className="font-bold text-slate-900">Notifiche Push</h3>
              <p className="text-xs text-slate-600">
                {isSubscribed ? "Attivate" : "Disattivate"}
              </p>
            </div>
          </div>
          <Button
            variant={isSubscribed ? "default" : "outline"}
            onClick={handleToggleSubscription}
          >
            {isSubscribed ? "Disattiva" : "Attiva"}
          </Button>
        </div>
      </Card>

      {/* Preferences */}
      {isSubscribed && (
        <Card className="p-4">
          <h3 className="font-bold text-slate-900 mb-3">Preferenze</h3>
          <div className="space-y-3">
            {[
              {
                key: "newPOI" as const,
                label: "Nuovi POI",
                description: "Notifiche su nuovi luoghi scoperti",
              },
              {
                key: "weeklyChallenges" as const,
                label: "Sfide Settimanali",
                description: "Ricorda le sfide attive",
              },
              {
                key: "specialEvents" as const,
                label: "Eventi Speciali",
                description: "Notifiche su eventi e promozioni",
              },
              {
                key: "friendActivity" as const,
                label: "Attività Amici",
                description: "Notifiche su attività degli amici",
              },
              {
                key: "promotions" as const,
                label: "Promozioni",
                description: "Offerte e coupon esclusivi",
              },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{label}</p>
                  <p className="text-xs text-slate-600">{description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={() => handleTogglePreference(key)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-800">
          💡 Le notifiche push ti aiuteranno a rimanere aggiornato su nuovi POI, sfide e
          opportunità per guadagnare XP!
        </p>
      </Card>
    </div>
  );
}
