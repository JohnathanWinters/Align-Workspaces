import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Sparkles, CreditCard, ExternalLink, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPayload {
  subscription: {
    id: string;
    tier: "starter" | "growth" | "studio";
    status: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: number;
  } | null;
  limits: {
    workspaces: number;
    activeRenters: number;
    teamSeats: number;
    customBranding: boolean;
    customDomain: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
  } | null;
}

const TIER_LABELS: Record<string, { name: string; price: number }> = {
  starter: { name: "Starter", price: 29 },
  growth: { name: "Growth", price: 99 },
  studio: { name: "Studio", price: 299 },
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function HostSubscriptionCard() {
  const { toast } = useToast();
  const [managing, setManaging] = useState(false);

  const { data, isLoading } = useQuery<SubscriptionPayload>({
    queryKey: ["/api/saas/subscription"],
    queryFn: async () => {
      const res = await fetch("/api/saas/subscription", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load subscription");
      return res.json();
    },
  });

  const handleManage = async () => {
    setManaging(true);
    try {
      const res = await fetch("/api/saas/portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Couldn't open billing portal");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Couldn't open portal", description: err.message, variant: "destructive" });
      setManaging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/60 p-5 mb-5 animate-pulse">
        <div className="h-5 bg-stone-100 rounded w-40 mb-3" />
        <div className="h-4 bg-stone-100 rounded w-64" />
      </div>
    );
  }

  const sub = data?.subscription;

  // No subscription → upgrade CTA
  if (!sub) {
    return (
      <div className="bg-gradient-to-br from-[#faf9f7] to-white rounded-2xl border border-[#c4956a]/30 p-5 sm:p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#c4956a]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#c4956a]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg text-stone-900 mb-1">Run your own bookings directly</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Enable private workspaces, accept bookings from your own clients, and keep 100% of every dollar. No marketplace fees.
            </p>
            <Link href="/for-studios">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors">
                View plans
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tierInfo = TIER_LABELS[sub.tier] ?? { name: sub.tier, price: 0 };
  const isTrial = sub.status === "trialing";
  const isPastDue = sub.status === "past_due";
  const trialDays = isTrial ? daysUntil(sub.trialEndsAt) : null;
  const nextBillingDate = isTrial ? formatDate(sub.trialEndsAt) : formatDate(sub.currentPeriodEnd);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-5 sm:p-6 mb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPastDue ? "bg-red-50" : "bg-[#c4956a]/10"
          }`}>
            {isPastDue ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#c4956a]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-serif text-lg text-stone-900">Align {tierInfo.name}</h3>
              {isTrial && (
                <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Free Trial
                </span>
              )}
              {isPastDue && (
                <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                  Payment Failed
                </span>
              )}
              {sub.cancelAtPeriodEnd === 1 && (
                <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  Cancels Soon
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">
              {isTrial && trialDays !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Trial ends in {trialDays} {trialDays === 1 ? "day" : "days"}
                  {nextBillingDate && <span className="text-stone-400"> · First charge {nextBillingDate}</span>}
                </span>
              )}
              {!isTrial && !isPastDue && nextBillingDate && (
                <span>Next charge: ${tierInfo.price} on {nextBillingDate}</span>
              )}
              {isPastDue && <span>Your last payment failed. Update your card to keep your subscription active.</span>}
            </p>
          </div>
        </div>
        <button
          onClick={handleManage}
          disabled={managing}
          className="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex-shrink-0"
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">{managing ? "Opening..." : "Manage billing"}</span>
        </button>
      </div>
    </div>
  );
}
