import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, CheckCircle, Calendar, MapPin, Clock, ImagePlus, Download, Copy, Share2, Check } from "lucide-react";
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

const CAT_LABELS: Record<string, string> = {
  therapy: "Therapy & Counseling", coaching: "Coaching & Consulting", wellness: "Wellness & Holistic",
  workshop: "Workshops & Classes", creative: "Creative Studios",
};

function generateShareCard(event: { title: string; eventDate: string; eventTime: string; location?: string | null; hostName: string; category: string }): Promise<Blob> {
  return new Promise((resolve) => {
    const w = 1080, h = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#faf6f1");
    grad.addColorStop(1, "#f0ebe6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Accent bar
    ctx.fillStyle = "#c4956a";
    ctx.fillRect(0, 0, w, 8);

    // "ALIGN" branding
    ctx.fillStyle = "#c4956a";
    ctx.font = "bold 14px sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("ALIGN WORKSPACES", 80, 80);

    // "FREE EVENT" badge
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "bold 13px sans-serif";
    const badgeText = "FREE EVENT";
    const badgeW = ctx.measureText(badgeText).width + 24;
    const badgeX = w - 80 - badgeW;
    ctx.beginPath();
    ctx.roundRect(badgeX, 62, badgeW, 28, 14);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(badgeText, badgeX + 12, 81);

    // Date block
    const date = new Date(event.eventDate + "T00:00:00");
    const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
    const day = String(date.getDate());
    const weekday = date.toLocaleDateString(undefined, { weekday: "long" });

    ctx.fillStyle = "#c4956a";
    ctx.font = "600 28px sans-serif";
    ctx.fillText(month, 80, 200);
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "bold 120px serif";
    ctx.fillText(day, 80, 320);
    ctx.fillStyle = "#8a7e72";
    ctx.font = "500 24px sans-serif";
    ctx.fillText(weekday, 80, 360);

    // Title
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "bold 48px serif";
    const words = event.title.split(" ");
    let line = "", y = 460;
    for (const word of words) {
      const test = line + (line ? " " : "") + word;
      if (ctx.measureText(test).width > w - 160 && line) {
        ctx.fillText(line, 80, y);
        line = word; y += 60;
      } else { line = test; }
    }
    if (line) { ctx.fillText(line, 80, y); y += 60; }

    // Category
    y += 10;
    ctx.fillStyle = "#c4956a";
    ctx.font = "500 22px sans-serif";
    ctx.fillText(CAT_LABELS[event.category] || event.category, 80, y);
    y += 50;

    // Time
    const timeStr = new Date(`2000-01-01T${event.eventTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    ctx.fillStyle = "#5a5248";
    ctx.font = "500 26px sans-serif";
    ctx.fillText(timeStr, 80, y);
    y += 40;

    // Location
    if (event.location) {
      ctx.fillStyle = "#8a7e72";
      ctx.font = "400 24px sans-serif";
      ctx.fillText(event.location, 80, y);
      y += 40;
    }

    // Host
    y = Math.max(y + 20, h - 140);
    ctx.fillStyle = "#8a7e72";
    ctx.font = "400 22px sans-serif";
    ctx.fillText(`Hosted by ${event.hostName}`, 80, y);

    // Bottom bar
    ctx.fillStyle = "#c4956a";
    ctx.fillRect(0, h - 8, w, 8);

    // Footer URL
    ctx.fillStyle = "#b8a08a";
    ctx.font = "400 18px sans-serif";
    ctx.fillText("alignworkspaces.com", 80, h - 30);

    canvas.toBlob(blob => resolve(blob!), "image/png");
  });
}

export function PostEventModal({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLastName, setAuthLastName] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "name" | "sent">("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [submittedEvent, setSubmittedEvent] = useState<{ id: string; title: string; eventDate: string; eventTime: string; location: string; hostName: string; category: string } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardGenerating, setCardGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/community-events/upload-image", { method: "POST", credentials: "include", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      }
    } catch {} finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/community-events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl: imageUrl || undefined }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-events"] });
      setSubmittedEvent({
        id: data.id, title: form.title, eventDate: form.eventDate, eventTime: form.eventTime,
        location: form.location, hostName: user?.firstName || "Anonymous", category: form.category,
      });
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
          body: JSON.stringify({ email: authEmail, firstName: authName, lastName: authLastName }),
        });
      }
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, firstName: authName, lastName: authLastName, returnTo: "/" }),
      });
      const data = await res.json();
      if (data.needsName) setAuthStep("name");
      else if (data.sent) setAuthStep("sent");
    } catch {} finally { setAuthLoading(false); }
  };

  const canSubmit = form.title.trim() && form.category && form.eventDate && form.eventTime && form.description.trim();

  // Share helpers
  const getEventUrl = useCallback(() => {
    return submittedEvent ? `${window.location.origin}/events/${submittedEvent.id}` : "";
  }, [submittedEvent]);

  const getShareText = useCallback(() => {
    if (!submittedEvent) return "";
    const date = new Date(submittedEvent.eventDate + "T00:00:00");
    const dateStr = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const timeStr = new Date(`2000-01-01T${submittedEvent.eventTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const loc = submittedEvent.location ? ` at ${submittedEvent.location}` : "";
    return `Join me for "${submittedEvent.title}" on ${dateStr} at ${timeStr}${loc}! Free for professionals.\n\nRSVP: ${getEventUrl()}`;
  }, [submittedEvent, getEventUrl]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadCard = async () => {
    if (!submittedEvent) return;
    setCardGenerating(true);
    try {
      const blob = await generateShareCard(submittedEvent);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${submittedEvent.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-align.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setCardGenerating(false); }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: submittedEvent?.title, text: getShareText(), url: getEventUrl() });
    } catch {}
  };

  const shareToLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getEventUrl())}`, "_blank");
  const shareToTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`, "_blank");
  const shareToWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, "_blank");

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
          <h2 className="font-serif text-lg font-semibold">{submittedEvent ? "Share Your Event" : "Post a Free Event"}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1"><X className="w-5 h-5" /></button>
        </div>

        {submittedEvent ? (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1">Event Submitted!</h3>
              <p className="text-sm text-stone-500">Pending approval. Share it now so people know it's coming!</p>
            </div>

            {/* Download share card */}
            <button
              onClick={handleDownloadCard}
              disabled={cardGenerating}
              className="w-full flex items-center gap-3 p-4 bg-[#faf6f1] rounded-xl border border-stone-200 hover:border-[#c4956a]/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#c4956a]/10 flex items-center justify-center shrink-0">
                {cardGenerating ? <Loader2 className="w-5 h-5 animate-spin text-[#c4956a]" /> : <Download className="w-5 h-5 text-[#c4956a]" />}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">Download Share Card</p>
                <p className="text-xs text-stone-500">Branded image ready for Instagram, LinkedIn, stories</p>
              </div>
            </button>

            {/* Copy share text */}
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-stone-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900">{copied ? "Copied!" : "Copy Share Text"}</p>
                <p className="text-xs text-stone-500 truncate">{getShareText().split("\n")[0]}</p>
              </div>
            </button>

            {/* Share buttons */}
            <div>
              <p className="text-xs text-stone-500 mb-2">Share directly</p>
              <div className="flex gap-2">
                {typeof navigator !== "undefined" && navigator.share && (
                  <button onClick={handleNativeShare} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                )}
                <button onClick={shareToLinkedIn} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#0077B5] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                  LinkedIn
                </button>
                <button onClick={shareToTwitter} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#1DA1F2] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                  Twitter
                </button>
                <button onClick={shareToWhatsApp} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                  WhatsApp
                </button>
              </div>
            </div>

            <Button onClick={onClose} variant="outline" className="w-full">Done</Button>
          </div>
        ) : !isAuthenticated ? (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Sign In</h3>
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
                <p className="text-xs text-stone-400 mt-1">Don't see it? Check your spam or junk folder.</p>
              </div>
            ) : authStep === "name" ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-600">Welcome! What's your name?</p>
                <Input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="First name" className="h-10" autoFocus />
                <Input value={authLastName} onChange={e => setAuthLastName(e.target.value)} placeholder="Last name" className="h-10" />
                <Button onClick={sendMagicLink} disabled={!authName.trim() || !authLastName.trim() || authLoading} className="w-full bg-stone-900 text-white">
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
              <label className="text-xs text-stone-500 mb-1 block">Banner Photo</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={imageUrl} alt="Event banner" className="w-full h-32 object-cover rounded-lg" />
                  <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-24 border-2 border-dashed border-stone-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-stone-300 transition-colors text-stone-400 hover:text-stone-500"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                  <span className="text-xs">{uploading ? "Uploading..." : "Add a banner photo"}</span>
                </button>
              )}
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
