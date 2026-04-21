import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, CreditCard, Lock, Palette, Link as LinkIcon, Copy, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";

interface SubscriptionPayload {
  subscription: {
    tier: string;
    status: string;
  } | null;
}

export default function HostOnboardingChecklist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  const { data: subData } = useQuery<SubscriptionPayload>({
    queryKey: ["/api/saas/subscription"],
    queryFn: async () => {
      const res = await fetch("/api/saas/subscription", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: mySpaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Only show for active subscribers
  const activeSub = subData?.subscription && ["trialing", "active", "past_due"].includes(subData.subscription.status);
  if (!activeSub) return null;

  const stripeConnected = !!user && (user as any).stripeOnboardingComplete === "true";
  const privateSpaces = mySpaces.filter(s => s.isPrivate === 1);
  const hasPrivateWorkspace = privateSpaces.length > 0;
  const hasBranding = privateSpaces.some(s => s.brandPrimaryColor || s.brandLogoUrl);

  const allDone = stripeConnected && hasPrivateWorkspace && hasBranding;
  if (allDone) return null;

  const firstPrivate = privateSpaces[0];
  const bookingUrl = firstPrivate ? `${window.location.origin}/w/${firstPrivate.slug}` : null;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Couldn't start Stripe onboarding");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Couldn't connect Stripe", description: err.message, variant: "destructive" });
      setConnecting(false);
    }
  };

  const copyLink = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast({ title: "Link copied", description: "Share it with your clients to start taking bookings." });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#faf9f7] to-white rounded-2xl border border-[#c4956a]/30 p-5 sm:p-6 mb-5">
      <div className="mb-4">
        <h3 className="font-serif text-lg text-stone-900">Get your booking page live</h3>
        <p className="text-xs text-stone-500 mt-1">A few quick steps to start taking bookings from your own clients.</p>
      </div>

      <ul className="space-y-3">
        <Step
          done={stripeConnected}
          icon={CreditCard}
          title="Connect Stripe for direct payouts"
          description="Required so bookings pay you directly — Align never touches the money."
          action={!stripeConnected ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
            >
              {connecting && <Loader2 className="w-3 h-3 animate-spin" />}
              Connect Stripe
            </button>
          ) : null}
        />

        <Step
          done={hasPrivateWorkspace}
          icon={Lock}
          title="Mark a workspace as private"
          description="Hides it from the Align marketplace. Use the toggle on each workspace card below."
        />

        <Step
          done={hasBranding}
          icon={Palette}
          title="Customize your branding (optional)"
          description="Add your logo and accent color so the booking page feels like yours."
        />
      </ul>

      {bookingUrl && (
        <div className="mt-5 pt-4 border-t border-stone-200/70">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-3.5 h-3.5 text-[#c4956a]" />
            <p className="text-xs font-medium text-stone-900">Your booking link</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 font-mono truncate">
              {bookingUrl}
            </code>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg text-xs font-medium transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <p className="text-[11px] text-stone-500 mt-2">Share this with your clients — they can book without creating an Align account.</p>
        </div>
      )}
    </div>
  );
}

function Step({
  done,
  icon: Icon,
  title,
  description,
  action,
}: {
  done: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <Circle className="w-5 h-5 text-stone-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className={`w-4 h-4 ${done ? "text-emerald-600" : "text-stone-500"}`} />
          <p className={`text-sm font-medium ${done ? "text-stone-500 line-through" : "text-stone-900"}`}>{title}</p>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed">{description}</p>
        {!done && action && <div className="mt-2">{action}</div>}
      </div>
    </li>
  );
}
