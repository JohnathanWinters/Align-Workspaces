import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function MagicLinkModal({ spaceId, returnTo: customReturnTo, onClose, onSuccess }: { spaceId: string; returnTo?: string; onClose: () => void; onSuccess: () => void }) {
  const [magicEmail, setMagicEmail] = useState("");
  const [magicName, setMagicName] = useState("");
  const [magicStep, setMagicStep] = useState<"email" | "name" | "sent">("email");
  const [magicError, setMagicError] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  const sendMagicLink = async (email: string, firstName?: string) => {
    setMagicLoading(true);
    setMagicError("");
    try {
      const returnTo = customReturnTo || `/workspaces?book=${encodeURIComponent(spaceId)}`;

      if (firstName) {
        await fetch("/api/auth/magic-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName }),
        });
      }

      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, returnTo }),
      });
      const data = await res.json();

      if (data.needsName) {
        setMagicStep("name");
      } else if (data.sent) {
        setMagicStep("sent");
      } else {
        setMagicError(data.message || "Something went wrong");
      }
    } catch {
      setMagicError("Failed to send sign-in link. Please try again.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-2xl"
          onClick={e => e.stopPropagation()}
          data-testid={`magic-link-modal-${spaceId}`}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-foreground/40 hover:text-foreground/60" data-testid="button-close-magic-modal">
            <X className="w-5 h-5" />
          </button>

          {magicStep === "email" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-[#c4956a]" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1">Sign In to Book</h3>
                <p className="text-sm text-foreground/50">
                  Enter your email and we'll send you a sign-in link.
                </p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (magicEmail.trim()) sendMagicLink(magicEmail.trim());
              }}>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={magicEmail}
                    onChange={e => setMagicEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:border-[#c4956a] focus:ring-1 focus:ring-[#c4956a]/30 outline-none"
                    autoFocus
                    required
                    data-testid="input-magic-email"
                  />
                  {magicError && <p className="text-xs text-red-500">{magicError}</p>}
                  <Button
                    type="submit"
                    disabled={magicLoading || !magicEmail.trim()}
                    className="w-full bg-foreground text-background hover:opacity-90 py-3"
                    data-testid="button-send-magic-link"
                  >
                    {magicLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {magicStep === "name" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <User className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1">Welcome!</h3>
                <p className="text-sm text-foreground/50">
                  Looks like you're new here. What's your first name?
                </p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (magicName.trim()) sendMagicLink(magicEmail.trim(), magicName.trim());
              }}>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={magicName}
                    onChange={e => setMagicName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:border-[#c4956a] focus:ring-1 focus:ring-[#c4956a]/30 outline-none"
                    autoFocus
                    required
                    data-testid="input-magic-name"
                  />
                  {magicError && <p className="text-xs text-red-500">{magicError}</p>}
                  <Button
                    type="submit"
                    disabled={magicLoading || !magicName.trim()}
                    className="w-full bg-foreground text-background hover:opacity-90 py-3"
                    data-testid="button-send-magic-name"
                  >
                    {magicLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending link...</>
                    ) : (
                      "Send Sign-In Link"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {magicStep === "sent" && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Check your email</h3>
              <p className="text-sm text-foreground/50 max-w-xs mx-auto">
                We sent a sign-in link to <span className="font-medium text-foreground/70">{magicEmail}</span>. Tap the link to continue.
              </p>
              <p className="text-xs text-foreground/30">
                The link expires in 15 minutes.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const LIST_SPACE_TYPES = [
  { value: "therapy", label: "Therapy & Counseling" },
  { value: "coaching", label: "Coaching & Consulting" },
  { value: "wellness", label: "Wellness & Holistic" },
  { value: "workshop", label: "Workshops & Classes" },
  { value: "creative", label: "Creative Studio" },
];

export function ListSpaceModal({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showListMagicLink, setShowListMagicLink] = useState(false);
  const [formData, setFormData] = useState({
    name: "", type: "therapy", tags: ["therapy"] as string[], description: "", shortDescription: "",
    address: "", neighborhood: "", pricePerHour: "", pricePerDay: "",
    capacity: "", amenities: "", targetProfession: "", availableHours: "", hostName: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...formData, type: formData.tags[0] || formData.type, amenities: formData.amenities.split(",").map(a => a.trim()).filter(Boolean) };
      await apiRequest("POST", "/api/spaces", payload);
    },
    onSuccess: () => {
      toast({ title: "Space submitted!", description: "Your space listing is pending admin approval." });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

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
          <h2 className="font-serif text-lg font-semibold text-foreground">List Your Space</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground/70 p-1" data-testid="button-close-list-modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Sign In to List Your Space</h3>
              <p className="text-sm text-foreground/50 max-w-sm mx-auto">
                Enter your email to get started. Your listing will be reviewed by our team.
              </p>
            </div>
            {!showListMagicLink ? (
              <Button
                onClick={() => setShowListMagicLink(true)}
                className="w-full bg-foreground text-background hover:opacity-90 py-3"
                data-testid="button-auth-list-space"
              >
                <Mail className="w-4 h-4 mr-2" /> Sign In with Email
              </Button>
            ) : (
              <MagicLinkModal
                spaceId="list-space"
                returnTo="/workspaces"
                onClose={() => setShowListMagicLink(false)}
                onSuccess={() => {
                  setShowListMagicLink(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                }}
              />
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Space Name *</label>
                <Input value={formData.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Sunny Therapy Room" data-testid="input-list-name" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-foreground/50 mb-1.5 block">Categories *</label>
                <div className="flex flex-wrap gap-2">
                  {LIST_SPACE_TYPES.map(t => {
                    const selected = formData.tags.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        type="button"
                        data-testid={`tag-list-${t.value}`}
                        onClick={() => {
                          const next = selected ? formData.tags.filter(x => x !== t.value) : [...formData.tags, t.value];
                          setFormData(prev => ({ ...prev, tags: next, type: next[0] || prev.type }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"}`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Your Name / Business *</label>
                <Input value={formData.hostName} onChange={e => update("hostName", e.target.value)} placeholder="e.g. Dr. Maria Santos" data-testid="input-list-host" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Address *</label>
                <Input value={formData.address} onChange={e => update("address", e.target.value)} placeholder="Full address" data-testid="input-list-address" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Neighborhood</label>
                <Input value={formData.neighborhood} onChange={e => update("neighborhood", e.target.value)} placeholder="e.g. Brickell" data-testid="input-list-neighborhood" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Price per Hour ($) *</label>
                <Input type="number" value={formData.pricePerHour} onChange={e => update("pricePerHour", e.target.value)} placeholder="35" data-testid="input-list-price" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Price per Day ($)</label>
                <Input type="number" value={formData.pricePerDay} onChange={e => update("pricePerDay", e.target.value)} placeholder="200" data-testid="input-list-price-day" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Capacity</label>
                <Input type="number" value={formData.capacity} onChange={e => update("capacity", e.target.value)} placeholder="6" data-testid="input-list-capacity" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Target Profession</label>
                <Input value={formData.targetProfession} onChange={e => update("targetProfession", e.target.value)} placeholder="e.g. Therapists" data-testid="input-list-target" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Available Hours</label>
                <Input value={formData.availableHours} onChange={e => update("availableHours", e.target.value)} placeholder="Mon-Fri 9am-5pm" data-testid="input-list-hours" />
              </div>
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Short Description</label>
              <Input value={formData.shortDescription} onChange={e => update("shortDescription", e.target.value)} placeholder="Brief one-liner" data-testid="input-list-short-desc" />
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Description *</label>
              <Textarea value={formData.description} onChange={e => update("description", e.target.value)} placeholder="Describe your space in detail..." rows={3} data-testid="input-list-description" />
            </div>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Amenities (comma-separated)</label>
              <Input value={formData.amenities} onChange={e => update("amenities", e.target.value)} placeholder="Wi-Fi, Parking, AC" data-testid="input-list-amenities" />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!formData.name || !formData.address || !formData.pricePerHour || !formData.description || !formData.hostName || createMutation.isPending}
              className="w-full bg-foreground text-background hover:opacity-90 py-3"
              data-testid="button-submit-list-space"
            >
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit for Approval"}
            </Button>
            <p className="text-xs text-foreground/40 text-center">Your listing will be reviewed by our team before going live.</p>
            <p className="text-[11px] text-foreground/30 text-center leading-relaxed">
              By listing your workspace, you agree to our{" "}
              <a href="/terms" target="_blank" className="underline hover:text-foreground/50">Terms of Service</a>,{" "}
              <a href="/privacy" target="_blank" className="underline hover:text-foreground/50">Privacy Policy</a>,
              and confirm you have the legal authority to list this space.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
