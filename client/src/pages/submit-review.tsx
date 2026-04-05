import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, CheckCircle2, ArrowRight, ArrowLeft, User, MessageSquare, Sparkles, Building2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STEP_LABELS = ["Rate", "Review", "You", "Done"];

type ReviewType = "workspaces" | "photography";

const CONFIG: Record<ReviewType, { title: string; subtitle: string; icon: typeof Building2; prompt: string; thankYou: string; gradient: string }> = {
  workspaces: {
    title: "Align Workspaces",
    subtitle: "Share your workspace experience",
    icon: Building2,
    prompt: "How was your workspace experience?",
    thankYou: "Your review helps professionals find great workspaces.",
    gradient: "from-[#c4956a]/30 to-stone-200",
  },
  photography: {
    title: "Align Photography",
    subtitle: "Share your photography experience",
    icon: Camera,
    prompt: "How was your photography session?",
    thankYou: "Your review helps others discover amazing photography.",
    gradient: "from-violet-200/50 to-stone-200",
  },
};

export default function SubmitReviewPage({ params }: { params: { slug: string } }) {
  const type: ReviewType = params.slug === "photography" ? "photography" : "workspaces";
  const config = CONFIG[type];
  const Icon = config.icon;

  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating || !name) return;
    setSubmitting(true);
    try {
      const endpoint = type === "photography" ? "/api/review/photography" : "/api/review/general";
      const nameField = type === "photography" ? "clientName" : "guestName";
      const emailField = type === "photography" ? "clientEmail" : "guestEmail";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, comment, [nameField]: name, [emailField]: email }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setStep(3);
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally { setSubmitting(false); }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Amazing"];
  const ratingColors = ["", "text-red-500", "text-orange-500", "text-amber-500", "text-emerald-500", "text-emerald-600"];
  const activeRating = hoverRating || rating;
  const progress = step === 3 ? 100 : Math.round(((step + (rating ? 0.5 : 0)) / 3) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero */}
      <div className={`relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br ${config.gradient}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
            <Icon className="w-7 h-7 text-[#c4956a]" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">{config.title}</h1>
          <p className="text-stone-600 text-xs mt-0.5">{config.subtitle}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          {/* Progress */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      i < step ? "bg-emerald-500 text-white" : i === step ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"
                    }`}>
                      {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < 3 && <div className={`w-6 h-0.5 rounded ${i < step ? "bg-emerald-400" : "bg-stone-100"}`} />}
                  </div>
                ))}
              </div>
              <span className={`text-xs font-bold ${progress === 100 ? "text-emerald-600" : "text-stone-400"}`}>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : "bg-[#c4956a]"}`} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
            </div>
          </div>

          {/* Steps */}
          <div className="px-5 py-5 min-h-[280px] flex flex-col">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-5 h-5 text-[#c4956a] mb-2" />
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">{config.prompt}</h2>
                  <p className="text-xs text-stone-400 mb-6">Tap a star to rate</p>

                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star className={`w-10 h-10 transition-all ${
                          s <= activeRating ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-stone-200 hover:text-stone-300"
                        }`} />
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeRating > 0 && (
                      <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`text-sm font-semibold ${ratingColors[activeRating]}`}>
                        {ratingLabels[activeRating]}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto pt-6 w-full">
                    <Button onClick={() => setStep(1)} disabled={!rating} className="w-full bg-stone-900 text-white hover:bg-stone-800">
                      Continue <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-[#c4956a]" />
                    <h2 className="font-serif text-lg font-bold text-stone-900">Tell us more</h2>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">Your feedback helps us improve</p>

                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Title (optional)</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarize your experience" maxLength={200} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Your review</label>
                      <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="What did you like? What could be better?" maxLength={2000} />
                      <p className="text-[10px] text-stone-300 text-right mt-1">{comment.length}/2000</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setStep(0)}><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
                    <Button onClick={() => setStep(2)} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
                      Continue <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#c4956a]" />
                    <h2 className="font-serif text-lg font-bold text-stone-900">Almost there!</h2>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">Let us know who you are</p>

                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Your name *</label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maria Santos" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Email (optional)</label>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-stone-50 rounded-xl p-3 mt-3 text-sm space-y-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`} />
                      ))}
                      <span className="text-xs text-stone-500 ml-1">{ratingLabels[rating]}</span>
                    </div>
                    {title && <p className="text-xs font-medium text-stone-700">{title}</p>}
                    {comment && <p className="text-xs text-stone-500 line-clamp-2">{comment}</p>}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setStep(1)}><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
                    <Button onClick={submit} disabled={!name || submitting} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Submit Review
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="font-serif text-xl font-bold text-stone-900 mb-2">Thank you, {name}!</motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="text-sm text-stone-500">{config.thankYou}</motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`} />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[10px] text-stone-300 mt-6">Powered by Align</p>
      </div>
    </div>
  );
}
