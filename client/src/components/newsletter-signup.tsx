import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, Sparkles, Check, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const INTERESTS = [
  { id: "portraits", label: "Portraits", emoji: "\u{1F4F8}" },
  { id: "spaces", label: "New Spaces", emoji: "\u{1F3E2}" },
  { id: "featured", label: "Featured Pros", emoji: "\u2B50" },
  { id: "updates", label: "Updates & News", emoji: "\u{1F4F0}" },
];

type Step = "hidden" | "idle" | "email" | "zip" | "interests" | "done" | "already";

interface NewsletterSignupProps {
  variant?: "dark" | "light";
}

export function NewsletterSignup({ variant = "light" }: NewsletterSignupProps) {
  const isDark = variant === "dark";
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("hidden");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userEmail = user?.email;
    if (userEmail) {
      fetch(`/api/newsletter/status?email=${encodeURIComponent(userEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          setStep(data.subscribed ? "hidden" : "idle");
        })
        .catch(() => setStep("idle"));
    } else {
      setStep("idle");
    }
  }, [user?.email]);

  if (step === "hidden") return null;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          zipCode: zip.trim() || null,
          interests: selected,
        }),
      });
      const data = await res.json();
      setStep(data.alreadySubscribed ? "already" : "done");
    } catch {
      setStep("done");
    }
    setSubmitting(false);
  }

  function toggleInterest(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const bg = isDark ? "bg-white/[0.04]" : "bg-stone-50/80";
  const border = isDark ? "border-white/[0.08]" : "border-stone-200/60";
  const textMuted = isDark ? "text-white/40" : "text-stone-400";
  const textHeading = isDark ? "text-white/90" : "text-stone-800";
  const inputBg = isDark ? "bg-white/[0.06] border-white/10 text-white placeholder:text-white/25" : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-300";
  const chipBase = isDark
    ? "border-white/10 text-white/60 hover:border-white/25 hover:text-white/80"
    : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700";
  const chipActive = isDark
    ? "border-white/30 bg-white/10 text-white"
    : "border-stone-800 bg-stone-800 text-white";
  const btnPrimary = isDark
    ? "bg-white/15 hover:bg-white/25 text-white"
    : "bg-stone-800 hover:bg-stone-900 text-white";

  return (
    <div className={`w-full max-w-lg mx-auto rounded-2xl ${bg} border ${border} overflow-hidden transition-all duration-500`} data-testid="section-newsletter">
      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => {
              if (user?.email) {
                setEmail(user.email);
                setStep("zip");
                setTimeout(() => zipRef.current?.focus(), 100);
              } else {
                setStep("email");
                setTimeout(() => emailRef.current?.focus(), 100);
              }
            }}
            className={`w-full px-5 py-4 flex items-center justify-between group cursor-pointer`}
            data-testid="button-newsletter-open"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-white/10" : "bg-stone-200/80"}`}>
                <Sparkles className={`w-4 h-4 ${isDark ? "text-white/60" : "text-stone-500"}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${textHeading}`}>Stay in the loop</p>
                <p className={`text-[11px] ${textMuted}`}>New spaces, stories & more</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${textMuted} group-hover:translate-x-0.5 transition-transform`} />
          </motion.button>
        )}

        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-5 py-4"
          >
            <p className={`text-xs font-medium ${textMuted} mb-3 tracking-wide uppercase`}>Step 1 of 3</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) {
                  setStep("zip");
                  setTimeout(() => zipRef.current?.focus(), 100);
                }
              }}
              className="flex gap-2"
            >
              <input
                ref={emailRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className={`flex-1 px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/30 ${inputBg}`}
                data-testid="input-newsletter-email"
              />
              <button
                type="submit"
                disabled={!email.trim()}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${btnPrimary}`}
                data-testid="button-newsletter-next-email"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {step === "zip" && (
          <motion.div
            key="zip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-5 py-4"
          >
            <p className={`text-xs font-medium ${textMuted} mb-1 tracking-wide uppercase`}>Step 2 of 3</p>
            <p className={`text-[11px] ${textMuted} mb-3`}>So we can show you nearby spaces</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep("interests");
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textMuted}`} />
                <input
                  ref={zipRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="Zip code"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/30 ${inputBg}`}
                  data-testid="input-newsletter-zip"
                />
              </div>
              <button
                type="submit"
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${btnPrimary}`}
                data-testid="button-newsletter-next-zip"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
            <button
              onClick={() => setStep("interests")}
              className={`text-[11px] ${textMuted} mt-2 hover:underline`}
              data-testid="button-newsletter-skip-zip"
            >
              Skip
            </button>
          </motion.div>
        )}

        {step === "interests" && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-5 py-4"
          >
            <p className={`text-xs font-medium ${textMuted} mb-1 tracking-wide uppercase`}>Step 3 of 3</p>
            <p className={`text-[11px] ${textMuted} mb-3`}>What interests you? Tap all that apply.</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {INTERESTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    selected.includes(item.id) ? chipActive : chipBase
                  }`}
                  data-testid={`button-interest-${item.id}`}
                >
                  <span className="text-base">{item.emoji}</span>
                  {item.label}
                  {selected.includes(item.id) && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => submit()}
              disabled={submitting}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${btnPrimary}`}
              data-testid="button-newsletter-finish"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {selected.length > 0 ? "Subscribe" : "Just subscribe"}
                </span>
              )}
            </button>
          </motion.div>
        )}

        {(step === "done" || step === "already") && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 py-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center ${
                step === "already"
                  ? isDark ? "bg-amber-500/20" : "bg-amber-100"
                  : isDark ? "bg-green-500/20" : "bg-green-100"
              }`}
            >
              {step === "already" ? (
                <Mail className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
              ) : (
                <Check className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
              )}
            </motion.div>
            <p className={`text-sm font-medium ${textHeading}`}>
              {step === "already" ? "You're already subscribed!" : "You're in!"}
            </p>
            <p className={`text-xs ${textMuted} mt-1`}>
              {step === "already" ? "We've got you \u2014 stay tuned." : "We'll keep you posted on what's new."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
