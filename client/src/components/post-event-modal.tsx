import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, CheckCircle, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const EVENT_CATEGORIES = [
  { key: "therapy", label: "Therapy & Counseling", color: "bg-[#f0ebe6] text-[#7a6e62] border-[#d4c9be]" },
  { key: "coaching", label: "Coaching & Consulting", color: "bg-[#f5ede3] text-[#946b4a] border-[#d4b896]" },
  { key: "wellness", label: "Wellness & Holistic", color: "bg-[#eef0eb] text-[#687362] border-[#c4ccbf]" },
  { key: "workshop", label: "Workshops & Classes", color: "bg-[#eeebf0] text-[#706580] border-[#c4bfcc]" },
  { key: "creative", label: "Creative Studios", color: "bg-[#f2ebe8] text-[#8a6560] border-[#d4c0bb]" },
];

export function PostEventModal({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "name" | "sent">("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    eventDate: "",
    eventTime: "",
    endTime: "",
    location: "",
    description: "",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/community-events", form);
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const sendMagicLink = async () => {
    setAuthLoading(true);
    try {
      if (authName) {
        await fetch("/api/auth/magic-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, firstName: authName }),
        });
      }
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, firstName: authName, returnTo: "/" }),
      });
      const data = await res.json();
      if (data.needsName) setAuthStep("name");
      else if (data.sent) setAuthStep("sent");
    } catch {} finally { setAuthLoading(false); }
  };

  const canSubmit = form.title.trim() && form.category && form.eventDate && form.eventTime && form.description.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-serif text-lg font-semibold">Post a Free Event</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1"><X className="w-5 h-5" /></button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-serif text-lg font-semibold mb-2">Event Submitted!</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
              Your event is pending approval. We'll review it and it will appear on the site once approved.
            </p>
            <Button onClick={onClose} className="bg-stone-900 text-white hover:bg-stone-800">Done</Button>
          </div>
        ) : !isAuthenticated ? (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Sign In to Post an Event</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto">
                Enter your email to get started. Your event will be reviewed by our team.
              </p>
            </div>
            {!showAuth ? (
              <Button onClick={() => setShowAuth(true)} className="w-full bg-stone-900 text-white hover:bg-stone-800 py-3">
                <Mail className="w-4 h-4 mr-2" /> Sign In with Email
              </Button>
            ) : authStep === "sent" ? (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Check your email!</p>
                <p className="text-xs text-stone-400 mt-1">Click the link we sent to sign in.</p>
              </div>
            ) : authStep === "name" ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-600">Welcome! What's your first name?</p>
                <Input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="First name" className="h-10" />
                <Button onClick={sendMagicLink} disabled={!authName.trim() || authLoading} className="w-full bg-stone-900 text-white">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="your@email.com" type="email" className="h-10" />
                <Button onClick={sendMagicLink} disabled={!authEmail.includes("@") || authLoading} className="w-full bg-stone-900 text-white">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Sign-In Link"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Event Title *</label>
              <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g., Therapist Networking Mixer" className="h-10" />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1.5 block">Category *</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => update("category", cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.category === cat.key
                        ? cat.color + " ring-1 ring-black/10"
                        : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Date *</label>
                <Input type="date" value={form.eventDate} onChange={e => update("eventDate", e.target.value)} className="h-10 text-sm" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Start *</label>
                <Input type="time" value={form.eventTime} onChange={e => update("eventTime", e.target.value)} className="h-10 text-sm" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">End</label>
                <Input type="time" value={form.endTime} onChange={e => update("endTime", e.target.value)} className="h-10 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">Location</label>
              <Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="e.g., Wynwood, Miami or Virtual" className="h-10" />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">Description *</label>
              <Textarea
                value={form.description}
                onChange={e => update("description", e.target.value)}
                placeholder="What's the event about? Who should attend?"
                className="h-24 text-sm resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-stone-400 text-right mt-1">{form.description.length}/500</p>
            </div>

            <p className="text-[10px] text-stone-400 text-center">
              All events must be free. Your event will be reviewed before appearing publicly.
            </p>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
              className="w-full bg-[#c4956a] text-white hover:bg-[#b8845c] py-3"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
              Submit Event
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
