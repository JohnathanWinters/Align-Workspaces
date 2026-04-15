import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, Check, Loader2, Shield, ShieldCheck, Upload, ExternalLink, AlertCircle, Building2, DollarSign, Star, Clock, Repeat, CalendarDays, Save, Camera, MapPin, Plus, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AmenityInput } from "./amenity-input";
import { CommitmentTimeline } from "./commitment-timeline";
import { AvailabilityScheduleEditor, scheduleToDisplayText, normalizeSchedule, type WeekSchedule } from "./availability-schedule-editor";
import { ArrivalGuideEditor } from "./arrival-guide";

function MagicLinkModal({ spaceId, returnTo: customReturnTo, onClose, onSuccess }: { spaceId: string; returnTo?: string; onClose: () => void; onSuccess: () => void }) {
  const [magicEmail, setMagicEmail] = useState("");
  const [magicName, setMagicName] = useState("");
  const [magicLastName, setMagicLastName] = useState("");
  const [magicStep, setMagicStep] = useState<"email" | "name" | "sent">("email");
  const [magicError, setMagicError] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  const sendMagicLink = async (email: string, firstName?: string, lastName?: string) => {
    setMagicLoading(true);
    setMagicError("");
    try {
      const returnTo = customReturnTo || `/workspaces?book=${encodeURIComponent(spaceId)}`;

      if (firstName) {
        await fetch("/api/auth/magic-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName, lastName }),
        });
      }

      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, returnTo }),
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

  // Scroll to top when modal opens so it's visible
  useState(() => { window.scrollTo({ top: 0, behavior: "smooth" }); });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center" onClick={onClose}>
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
          className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
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
                <h3 className="font-serif text-lg font-semibold mb-1">Get Started</h3>
                <p className="text-sm text-foreground/50">
                  Enter your email to sign in or create an account.
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
                <h3 className="font-serif text-lg font-semibold mb-1">Sign Up</h3>
                <p className="text-sm text-foreground/50">
                  Welcome! Enter your name to create an account.
                </p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (magicName.trim() && magicLastName.trim()) sendMagicLink(magicEmail.trim(), magicName.trim(), magicLastName.trim());
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
                  <input
                    type="text"
                    placeholder="Last name"
                    value={magicLastName}
                    onChange={e => setMagicLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:border-[#c4956a] focus:ring-1 focus:ring-[#c4956a]/30 outline-none"
                    required
                    data-testid="input-magic-lastname"
                  />
                  {magicError && <p className="text-xs text-red-500">{magicError}</p>}
                  <Button
                    type="submit"
                    disabled={magicLoading || !magicName.trim() || !magicLastName.trim()}
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
              <p className="text-xs text-foreground/30">
                Don't see it? Check your spam or junk folder.
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

const COVERAGE_TYPES = [
  { value: "general_liability", label: "General Liability" },
  { value: "professional_liability", label: "Professional Liability" },
  { value: "property", label: "Property Insurance" },
  { value: "bop", label: "Business Owner's Policy" },
  { value: "other", label: "Other" },
];

export function InsuranceUploadStep({ onComplete, onGetCovered }: { onComplete: () => void; onGetCovered: () => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    carrierName: "", policyNumber: "", coverageType: "general_liability",
    coverageAmount: "1000000", policyExpirationDate: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!form.carrierName || !form.policyNumber || !form.coverageType || !form.coverageAmount || !form.policyExpirationDate || !file) {
      toast({ title: "All fields required", description: "Please fill out every field and upload your declarations page.", variant: "destructive" });
      return;
    }
    const amount = parseInt(form.coverageAmount, 10);
    if (isNaN(amount) || amount < 1000000) {
      toast({ title: "Coverage too low", description: "Minimum coverage amount is $1,000,000.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("carrierName", form.carrierName);
      fd.append("policyNumber", form.policyNumber);
      fd.append("coverageType", form.coverageType);
      fd.append("coverageAmount", form.coverageAmount);
      fd.append("policyExpirationDate", form.policyExpirationDate);
      fd.append("document", file);
      const res = await fetch("/api/host/insurance", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      toast({ title: "Insurance verified", description: "Your coverage has been recorded. You can now list your space." });
      queryClient.invalidateQueries({ queryKey: ["/api/host/insurance/status"] });
      onComplete();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-2">
        <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-7 h-7 text-[#c4956a]" />
        </div>
        <h3 className="font-serif text-lg font-semibold mb-1">Insurance Verification</h3>
        <p className="text-xs text-foreground/50 max-w-sm mx-auto leading-relaxed">
          All hosts must maintain $1M+ general liability insurance. Upload your declarations page to get started.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Insurance Carrier *</label>
          <Input value={form.carrierName} onChange={e => setForm(f => ({ ...f, carrierName: e.target.value }))} placeholder="e.g. State Farm, GEICO" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Policy Number *</label>
            <Input value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} placeholder="Policy #" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Coverage Type *</label>
            <select
              value={form.coverageType}
              onChange={e => setForm(f => ({ ...f, coverageType: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {COVERAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Coverage Amount ($) *</label>
            <Input type="number" value={form.coverageAmount} onChange={e => setForm(f => ({ ...f, coverageAmount: e.target.value }))} placeholder="1000000" min="1000000" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Expiration Date *</label>
            <Input type="date" value={form.policyExpirationDate} onChange={e => setForm(f => ({ ...f, policyExpirationDate: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Declarations Page (PDF or image, max 10MB) *</label>
          <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-stone-300 hover:border-[#c4956a] cursor-pointer transition-colors bg-stone-50/50">
            <Upload className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-500">{file ? file.name : "Choose file..."}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={uploading} className="w-full bg-foreground text-background hover:opacity-90 py-3">
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Verify Insurance</>}
      </Button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-stone-400">or</span></div>
      </div>

      <button
        onClick={onGetCovered}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#c4956a]/30 text-[#c4956a] hover:bg-[#c4956a]/5 transition-colors text-sm font-medium"
      >
        <ExternalLink className="w-4 h-4" />
        Get covered instantly from $17/mo
      </button>
      <p className="text-[10px] text-foreground/30 text-center leading-relaxed">
        Don't have insurance? Get a quote in seconds through our partner Thimble. Policies start at $17/month with $1M+ coverage.
      </p>
    </div>
  );
}

function PhotoUploadStep({
  spaceId,
  globalStepIndex,
  totalSteps,
  globalStepLabel,
  allStepLabels,
  onStepClick,
  onNext,
}: {
  spaceId: string;
  globalStepIndex: number;
  totalSteps: number;
  globalStepLabel: string;
  allStepLabels: string[];
  onStepClick: (i: number) => void;
  onNext: () => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Fetch current photos
  const { data: spaceData } = useQuery<{ imageUrls?: string[] }>({
    queryKey: ["/api/spaces", spaceId, "photos-step"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}`, { credentials: "include" });
      if (!res.ok) return { imageUrls: [] };
      return res.json();
    },
  });

  useEffect(() => {
    if (spaceData?.imageUrls) setPhotos(spaceData.imageUrls);
  }, [spaceData?.imageUrls]);

  const getPhotoUrl = (url: string) => url.startsWith("/") || url.startsWith("http") ? url : `/objects/${url}`;

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const fd = new FormData();
      for (const file of Array.from(files)) {
        fd.append("photos", file);
      }
      const res = await fetch(`/api/spaces/${spaceId}/photos`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setPhotos(updated.imageUrls || []);
      toast({ title: `${files.length} photo${files.length > 1 ? "s" : ""} uploaded` });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "photos-step"] });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!res.ok) throw new Error("Delete failed");
      const updated = await res.json();
      setPhotos(updated.imageUrls || []);
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "photos-step"] });
    } catch {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    }
  };

  const handleSetCover = async (url: string) => {
    const idx = photos.indexOf(url);
    if (idx <= 0) return;
    const newOrder = [url, ...photos.filter(u => u !== url)];
    setPhotos(newOrder);
    try {
      await fetch(`/api/spaces/${spaceId}/photos/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrls: newOrder }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "photos-step"] });
      toast({ title: "Cover photo updated" });
    } catch {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  const handleDragEnd = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const newPhotos = [...photos];
    const [moved] = newPhotos.splice(fromIdx, 1);
    newPhotos.splice(toIdx, 0, moved);
    setPhotos(newPhotos);
    try {
      await fetch(`/api/spaces/${spaceId}/photos/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrls: newPhotos }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "photos-step"] });
    } catch {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps}, {globalStepLabel}</span>
        </div>
        <div className="flex gap-1">
          {allStepLabels.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onStepClick(i)}
              title={label}
              className={`h-2 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"} cursor-pointer hover:opacity-70`}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 text-center mb-2">
          <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-7 h-7 text-[#c4956a]" />
          </div>
          <h3 className="font-serif text-lg font-semibold mb-1">Add Photos</h3>
          <p className="text-xs text-stone-400">Upload photos of your space. The first photo will be the cover. Drag to reorder.</p>
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="px-6 mb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx !== null) handleDragEnd(dragIdx, i);
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                    i === 0 ? "border-[#c4956a]" : dragOverIdx === i ? "border-[#c4956a]/50" : "border-transparent"
                  } ${dragIdx === i ? "opacity-40" : ""}`}
                >
                  <div className="aspect-[4/3] bg-stone-100">
                    <img src={getPhotoUrl(url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  {i === 0 && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[#c4956a] text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      <Star className="w-2.5 h-2.5 fill-current" /> Cover
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <GripVertical className="w-4 h-4 text-white/80 absolute top-1.5 right-1.5" />
                    {i !== 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetCover(url); }}
                        className="p-1.5 bg-white/90 rounded-full text-stone-700 hover:bg-white transition-colors"
                        title="Set as cover"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(url); }}
                      className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-white transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload area */}
        <div className="px-6 pb-4">
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
              e.target.value = "";
            }} />
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${photos.length > 0 ? "border-stone-200 hover:border-stone-300" : "border-stone-200 hover:border-[#c4956a]/40 p-6"}`}>
              {uploading ? (
                <Loader2 className="w-6 h-6 text-stone-300 mx-auto mb-1 animate-spin" />
              ) : (
                <Upload className={`text-stone-300 mx-auto mb-1 ${photos.length > 0 ? "w-5 h-5" : "w-8 h-8 mb-2"}`} />
              )}
              <p className="text-sm text-stone-500 font-medium">{uploading ? "Uploading..." : photos.length > 0 ? "Add more photos" : "Click to upload photos"}</p>
              {photos.length === 0 && <p className="text-xs text-stone-400 mt-1">JPG, PNG, or WebP</p>}
            </div>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 px-6 pb-4 pt-2 flex-shrink-0 border-t border-stone-100">
        <button onClick={onNext} className="flex-1 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors">
          Skip
        </button>
        <Button onClick={onNext} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
          <Save className="w-3.5 h-3.5 mr-1" /> Save & Continue
        </Button>
      </div>
    </div>
  );
}

type ListTab = "details" | "pricing" | "schedule" | "extras" | "photos" | "arrival";

function getListCompletionScore(formData: Record<string, any>, amenitiesTags: string[]) {
  const checks = [
    { label: "Space name", done: !!formData.name },
    { label: "Address", done: !!formData.address },
    { label: "Host name", done: !!formData.hostName },
    { label: "Hourly price", done: !!formData.pricePerHour },
    { label: "Description", done: !!formData.description },
    { label: "Short description", done: !!formData.shortDescription },
    { label: "Amenities", done: amenitiesTags.length > 0 },
    { label: "Neighborhood", done: !!formData.neighborhood },
  ];
  const done = checks.filter(c => c.done).length;
  return { checks, done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
}

export function ListSpaceModal({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showListMagicLink, setShowListMagicLink] = useState(false);
  const [insuranceBypassed, setInsuranceBypassed] = useState(false);
  const [listingSubmitted, setListingSubmitted] = useState(false);
  const [createdSpaceId, setCreatedSpaceId] = useState<string | null>(null);
  const [postStep, setPostStep] = useState<"photos" | "arrival" | "insurance" | null>(null);
  const [tab, setTab] = useState<ListTab>("details");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const listSteps: ListTab[] = ["details", "pricing", "schedule", "extras"];
  const allStepLabels = ["Details", "Pricing", "Availability", "Extras", "Photos", "Arrival Guide", "Insurance"];
  const listStepLabels: Record<ListTab, string> = { details: "Details", pricing: "Pricing", schedule: "Availability", extras: "Extras", photos: "Photos", arrival: "Arrival Guide" };
  const [schedule, setSchedule] = useState<WeekSchedule>({
    mon: [{ open: "09:00", close: "17:00" }], tue: [{ open: "09:00", close: "17:00" }],
    wed: [{ open: "09:00", close: "17:00" }], thu: [{ open: "09:00", close: "17:00" }],
    fri: [{ open: "09:00", close: "17:00" }], sat: null, sun: null,
  });
  const listStepIndex = listSteps.indexOf(tab);
  const isListLastStep = listStepIndex === listSteps.length - 1;
  const totalSteps = 7;
  const globalStepIndex = postStep === "photos" ? 4 : postStep === "arrival" ? 5 : postStep === "insurance" ? 6 : listStepIndex;
  const globalStepLabel = allStepLabels[globalStepIndex] || "";
  const [formData, setFormData] = useState({
    name: "", type: "therapy", tags: ["therapy"] as string[], description: "", shortDescription: "",
    address: "", city: "", state: "FL", zipCode: "", neighborhood: "", pricePerHour: "", pricePerDay: "",
    amenities: "", targetProfession: "", availableHours: "", hostName: "",
    bookingTypes: "hourly", recurringMinBookings: "1", recurringDiscountPercent: "0", recurringDiscountAfter: "0",
  });
  const [amenitiesTags, setAmenitiesTags] = useState<string[]>([]);

  // Check for existing draft space to resume
  useEffect(() => {
    if (!isAuthenticated || draftLoaded) return;
    fetch("/api/my-spaces", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((spaces: any[]) => {
        const draft = spaces.find((s: any) => s.approvalStatus === "draft");
        if (draft) {
          setCreatedSpaceId(draft.id);
          const addrParts = (draft.address || "").split(",").map((s: string) => s.trim());
          setFormData({
            name: draft.name || "", type: draft.type || "therapy",
            tags: draft.tags || [draft.type].filter(Boolean),
            description: draft.description || "", shortDescription: draft.shortDescription || "",
            address: addrParts[0] || "", city: addrParts[1] || "", state: addrParts[2] || "FL", zipCode: addrParts[3] || "",
            neighborhood: draft.neighborhood || "",
            pricePerHour: draft.pricePerHour ? String(draft.pricePerHour) : "",
            pricePerDay: draft.pricePerDay ? String(draft.pricePerDay) : "",
            amenities: "", targetProfession: draft.targetProfession || "",
            availableHours: draft.availableHours || "",
            hostName: draft.hostName || "",
            bookingTypes: draft.bookingTypes || "both",
            recurringMinBookings: String(draft.recurringMinBookings ?? "1"),
            recurringDiscountPercent: String(draft.recurringDiscountPercent ?? "0"),
            recurringDiscountAfter: String(draft.recurringDiscountAfter ?? "0"),
          });
          setAmenitiesTags((draft.amenities || []) as string[]);
          if (draft.availabilitySchedule) {
            try { setSchedule(normalizeSchedule(JSON.parse(draft.availabilitySchedule))); } catch {}
          }
          // Determine which step to resume at
          if (draft.pricePerHour && draft.pricePerHour > 0) {
            if (draft.availabilitySchedule) {
              setTab("extras"); // was on step 4
            } else {
              setTab("schedule"); // was on step 3
            }
          } else if (draft.description) {
            setTab("pricing"); // was on step 2
          }
          toast({ title: "Draft found", description: "Continuing where you left off." });
        }
        setDraftLoaded(true);
      })
      .catch(() => setDraftLoaded(true));
  }, [isAuthenticated, draftLoaded]);

  // Save current step data to server
  const saveStep = async (nextTab?: ListTab) => {
    setSaving(true);
    try {
      const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode].filter(Boolean).join(", ");
      const payload: any = {
        ...formData,
        address: fullAddress,
        type: formData.tags[0] || formData.type,
        amenities: amenitiesTags,
        pricePerHour: Number(formData.pricePerHour) || 0,
        pricePerDay: formData.pricePerDay ? Number(formData.pricePerDay) : undefined,
        recurringMinBookings: Number(formData.recurringMinBookings) || 1,
        recurringDiscountPercent: formData.recurringDiscountPercent ? Number(formData.recurringDiscountPercent) : null,
        recurringDiscountAfter: formData.recurringDiscountAfter ? Number(formData.recurringDiscountAfter) : 0,
        bookingTypes: formData.bookingTypes === "none" ? "both" : formData.bookingTypes,
        availabilitySchedule: JSON.stringify(schedule),
        availableHours: scheduleToDisplayText(schedule),
      };

      if (createdSpaceId) {
        // PATCH existing draft
        if (isListLastStep && nextTab === undefined) {
          payload.approvalStatus = "pending"; // Step 4 submit → mark as complete
        }
        await fetch(`/api/spaces/${createdSpaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        // POST new draft
        payload.isDraft = true;
        const res = await apiRequest("POST", "/api/spaces", payload);
        const space = await res.json();
        setCreatedSpaceId(space.id);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });

      if (isListLastStep && nextTab === undefined) {
        // Final step → go to post-submission
        toast({ title: "Space submitted!", description: "Now let's add some finishing touches." });
        setListingSubmitted(true);
        setPostStep("photos");
      } else if (nextTab) {
        setTab(nextTab);
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const { data: insuranceStatus, isLoading: insuranceLoading } = useQuery<{ hasInsurance: boolean; status: string }>({
    queryKey: ["/api/host/insurance/status"],
    enabled: isAuthenticated,
  });

  const score = getListCompletionScore(formData, amenitiesTags);

  const recurringPrice = formData.pricePerHour && formData.recurringDiscountPercent && Number(formData.recurringDiscountPercent) > 0
    ? (Number(formData.pricePerHour) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)
    : null;
  const recurringPriceDay = formData.pricePerDay && formData.recurringDiscountPercent && Number(formData.recurringDiscountPercent) > 0
    ? (Number(formData.pricePerDay) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)
    : null;

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Building2 className="w-4 h-4 text-[#c4956a] flex-shrink-0" />
            <h2 className="font-serif text-lg font-bold text-stone-900 truncate">List Your Space</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors flex-shrink-0" data-testid="button-close-list-modal">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">Get Started</h3>
              <p className="text-sm text-foreground/50 max-w-sm mx-auto">
                Enter your email to sign up.
              </p>
            </div>
            {!showListMagicLink ? (
              <Button
                onClick={() => setShowListMagicLink(true)}
                className="w-full bg-foreground text-background hover:opacity-90 py-3"
                data-testid="button-auth-list-space"
              >
                <Mail className="w-4 h-4 mr-2" /> Sign Up with Email
              </Button>
            ) : (
              <MagicLinkModal
                spaceId="list-space"
                returnTo="/?list=true"
                onClose={() => setShowListMagicLink(false)}
                onSuccess={() => {
                  setShowListMagicLink(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                }}
              />
            )}
          </div>
        ) : listingSubmitted && postStep === "photos" && createdSpaceId ? (
          <PhotoUploadStep
            spaceId={createdSpaceId}
            globalStepIndex={globalStepIndex}
            totalSteps={totalSteps}
            globalStepLabel={globalStepLabel}
            allStepLabels={allStepLabels}
            onStepClick={(i) => {
              if (i <= 3) { setPostStep(null); setTab(listSteps[i]); }
              else if (i === 4 && createdSpaceId) setPostStep("photos");
              else if (i === 5 && createdSpaceId) setPostStep("arrival");
              else if (i === 6 && createdSpaceId) setPostStep("insurance");
            }}
            onNext={() => setPostStep("arrival")}
          />
        ) : listingSubmitted && postStep === "arrival" && createdSpaceId ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps}, {globalStepLabel}</span>
              </div>
              <div className="flex gap-1">
                {allStepLabels.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (i <= 3) { setPostStep(null); setTab(listSteps[i]); }
                      else if (i === 4 && createdSpaceId) setPostStep("photos");
                      else if (i === 5 && createdSpaceId) setPostStep("arrival");
                      else if (i === 6 && createdSpaceId) setPostStep("insurance");
                    }}
                    disabled={i > 3 && !createdSpaceId}
                    title={label}
                    className={`h-2 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"} ${i <= 3 || createdSpaceId ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 text-center mb-2">
                <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-7 h-7 text-[#c4956a]" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1">Arrival Guide</h3>
                <p className="text-xs text-stone-400">Help your renters find your space. Add parking info, door codes, WiFi, and step-by-step directions with photos.</p>
              </div>
              <div className="px-6">
                <ArrivalGuideEditor spaceId={createdSpaceId} hideSaveButton />
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 pb-4 pt-2 flex-shrink-0 border-t border-stone-100">
              <button onClick={() => { if (insuranceStatus?.hasInsurance) { onClose(); } else { setPostStep("insurance"); } }} className="flex-1 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors">
                Skip
              </button>
              <Button onClick={() => { if (insuranceStatus?.hasInsurance) { onClose(); } else { setPostStep("insurance"); } }} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
                <Save className="w-3.5 h-3.5 mr-1" /> Save & Continue
              </Button>
            </div>
          </div>
        ) : listingSubmitted && postStep === "insurance" && !insuranceStatus?.hasInsurance && !insuranceBypassed ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps}, Insurance</span>
              </div>
              <div className="flex gap-1">
                {allStepLabels.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (i <= 3) { setPostStep(null); setTab(listSteps[i]); }
                      else if (i === 4 && createdSpaceId) setPostStep("photos");
                      else if (i === 5 && createdSpaceId) setPostStep("arrival");
                      else if (i === 6 && createdSpaceId) setPostStep("insurance");
                    }}
                    disabled={i > 3 && !createdSpaceId}
                    title={label}
                    className={`h-2 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"} ${i <= 3 || createdSpaceId ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InsuranceUploadStep
                onComplete={() => { setInsuranceBypassed(true); onClose(); }}
                onGetCovered={() => {
                  window.open("https://www.thimble.com/general-liability-insurance?utm_source=alignworkspaces", "_blank");
                }}
              />
              <div className="px-6 pb-6 -mt-2 space-y-3">
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-stone-400">or</span></div>
                </div>
                <button
                  onClick={() => {
                    toast({
                      title: "Insurance required for bookings",
                      description: "Your listing has been saved but will not receive bookings until insurance is uploaded. You can add it anytime from your Client Portal under Workspaces.",
                      duration: 8000,
                    });
                    onClose();
                  }}
                  className="w-full py-3 rounded-lg border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  Continue Later
                </button>
                <p className="text-[10px] text-center text-stone-400 leading-relaxed">
                  Your space has been submitted but will not appear in search or accept bookings until insurance is verified.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/50 flex-shrink-0">
              {insuranceStatus?.hasInsurance && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Insurance verified</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps}, {globalStepLabel}</span>
                <span className={`text-xs font-bold ${score.percent === 100 ? "text-emerald-600" : score.percent >= 70 ? "text-amber-600" : "text-stone-400"}`}>{score.percent}%</span>
              </div>
              <div className="flex gap-1">
                {allStepLabels.map((label, i) => {
                  const enabled = i <= 3 || !!createdSpaceId;
                  const isActive = i === globalStepIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (i <= 3) { setPostStep(null); setTab(listSteps[i]); }
                        else if (i === 4 && createdSpaceId) setPostStep("photos");
                        else if (i === 5 && createdSpaceId) setPostStep("arrival");
                        else if (i === 6 && createdSpaceId) setPostStep("insurance");
                      }}
                      disabled={!enabled}
                      title={label}
                      className={`flex-1 flex flex-col items-center gap-1 group transition-all ${enabled ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className={`h-2 w-full rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"} ${enabled ? "group-hover:opacity-70" : ""}`} />
                      <span className={`text-[9px] leading-tight transition-colors ${isActive ? "text-[#c4956a] font-semibold" : i <= globalStepIndex ? "text-stone-500" : "text-stone-300"} ${enabled ? "group-hover:text-[#c4956a]" : ""}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {tab === "details" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Space Name *</label>
                      <Input value={formData.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Sunny Therapy Room" data-testid="input-list-name" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Host Name *</label>
                      <Input value={formData.hostName} onChange={e => update("hostName", e.target.value)} placeholder="e.g. Maria S." data-testid="input-list-host" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Categories *</label>
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
                    <label className="text-xs text-gray-500 mb-1 block">Street Address *</label>
                    <Input value={formData.address} onChange={e => update("address", e.target.value)} placeholder="e.g. 245 Miracle Mile" data-testid="input-list-address" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">City *</label>
                      <Input value={formData.city} onChange={e => update("city", e.target.value)} placeholder="e.g. Miami" data-testid="input-list-city" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">State *</label>
                      <Input value={formData.state} onChange={e => update("state", e.target.value)} placeholder="FL" maxLength={2} data-testid="input-list-state" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Zip Code *</label>
                      <Input value={formData.zipCode} onChange={e => update("zipCode", e.target.value)} placeholder="e.g. 33134" data-testid="input-list-zip" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Neighborhood</label>
                      <Input value={formData.neighborhood} onChange={e => update("neighborhood", e.target.value)} placeholder="e.g. Brickell" data-testid="input-list-neighborhood" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
                    <Input value={formData.shortDescription} onChange={e => update("shortDescription", e.target.value)} placeholder="e.g. Bright, private therapy room in the heart of Brickell" data-testid="input-list-short-desc" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description *</label>
                    <Textarea value={formData.description} onChange={e => update("description", e.target.value)} placeholder="e.g. A warm, soundproofed office perfect for therapists and counselors. Features comfortable seating, natural light, a white noise machine, and a private waiting area. Located on the 3rd floor with elevator access." rows={3} data-testid="input-list-description" />
                  </div>
                </div>
              )}

              {tab === "pricing" && (
                <div className="space-y-5">
                  {/* Booking Types */}
                  <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                    <h4 className="text-sm font-medium text-stone-700">Accepted Booking Types</h4>
                    <p className="text-[11px] text-stone-400 -mt-1">Choose how renters can book your space</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        { key: "hourly" as const, icon: Clock, label: "Single Bookings", desc: "One-time hourly or daily sessions" },
                        { key: "recurring" as const, icon: Repeat, label: "Recurring Bookings", desc: "Weekly repeating sessions" },
                      ]).map(opt => {
                        const active = formData.bookingTypes === opt.key || formData.bookingTypes === "both";
                        return (
                          <button key={opt.key} type="button"
                            onClick={() => {
                              const current = formData.bookingTypes;
                              let next: string;
                              if (current === "both") next = opt.key === "hourly" ? "recurring" : "hourly";
                              else if (current === opt.key) next = "none";
                              else if (current === "none") next = opt.key;
                              else next = "both";
                              update("bookingTypes", next);
                            }}
                            className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${active ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white opacity-50 hover:opacity-75"}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${active ? "border-stone-900 bg-stone-900" : "border-stone-300"}`}>
                              {active && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <opt.icon className="w-3.5 h-3.5 text-stone-500" />
                                <span className="text-sm font-medium text-stone-800">{opt.label}</span>
                              </div>
                              <p className="text-[11px] text-stone-400 mt-0.5">{opt.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {formData.bookingTypes === "none" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700">
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>You must select at least one booking type to submit.</span>
                      </div>
                    )}
                    {formData.bookingTypes === "hourly" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Your space will only accept single bookings. Renters can only book one-time hourly or daily sessions.</span>
                      </div>
                    )}
                    {formData.bookingTypes === "recurring" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                        <Repeat className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Your space will only accept recurring weekly bookings. Renters can still book an hourly slot or a full day, but it has to repeat every week.</span>
                      </div>
                    )}
                  </div>

                  {/* How long must they book for */}
                  {formData.bookingTypes !== "hourly" && (
                    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                      <h4 className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-stone-500" />
                        How long should they commit?
                      </h4>
                      <p className="text-[11px] text-stone-500 -mt-1">When someone books a weekly spot, how many weeks should they sign up for at minimum? Pick "No minimum" if you're flexible.</p>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 8, 12].map(n => (
                          <button key={n} type="button" onClick={() => update("recurringMinBookings", String(n))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              String(n) === formData.recurringMinBookings ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                            }`}>
                            {n === 1 ? "No minimum" : `${n} weeks`}
                          </button>
                        ))}
                      </div>
                      <CommitmentTimeline
                        pricePerHour={formData.pricePerHour}
                        pricePerDay={formData.pricePerDay}
                        minCommitmentWeeks={Number(formData.recurringMinBookings) || 1}
                        discountPercent={Number(formData.recurringDiscountPercent) || 0}
                        discountAfterWeeks={Number(formData.recurringDiscountAfter) || 0}
                      />
                    </div>
                  )}

                  {/* Pricing cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border-2 p-4 text-center border-stone-900 bg-stone-50">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Hourly Rate</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-stone-400 text-lg">$</span>
                        <input type="number" value={formData.pricePerHour} onChange={e => update("pricePerHour", e.target.value)}
                          className="w-20 text-center text-2xl font-bold text-stone-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0" data-testid="input-list-price" />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">per hour</p>
                    </div>
                    <div className="rounded-xl border p-4 text-center border-stone-200 bg-white">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Daily Rate</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-stone-400 text-lg">$</span>
                        <input type="number" value={formData.pricePerDay} onChange={e => update("pricePerDay", e.target.value)}
                          className="w-20 text-center text-2xl font-bold text-stone-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0" data-testid="input-list-price-day" />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">per day (optional)</p>
                    </div>
                    <div className={`rounded-xl border p-4 text-center ${formData.bookingTypes !== "hourly" ? "border-2 border-emerald-600 bg-emerald-50" : "border-stone-200 bg-white opacity-40"}`}>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium mb-2">Weekly Regulars</p>
                      {(() => {
                        const hasHourly = !!formData.pricePerHour && Number(formData.pricePerHour) > 0;
                        const hasDaily = !!formData.pricePerDay && Number(formData.pricePerDay) > 0;
                        const hourlyShown = recurringPrice || formData.pricePerHour;
                        const dailyShown = recurringPriceDay || formData.pricePerDay;
                        if (hasHourly && hasDaily) {
                          return (
                            <div className="flex items-center justify-center gap-3">
                              <div>
                                <div className="flex items-baseline justify-center gap-0.5">
                                  <span className="text-emerald-400 text-sm">$</span>
                                  <span className="text-xl font-bold text-emerald-600">{hourlyShown}</span>
                                </div>
                                <p className="text-[9px] text-stone-400">/hr</p>
                              </div>
                              <div className="w-px h-8 bg-emerald-200" />
                              <div>
                                <div className="flex items-baseline justify-center gap-0.5">
                                  <span className="text-emerald-400 text-sm">$</span>
                                  <span className="text-xl font-bold text-emerald-600">{dailyShown}</span>
                                </div>
                                <p className="text-[9px] text-stone-400">/day</p>
                              </div>
                            </div>
                          );
                        }
                        if (hasDaily) {
                          return (
                            <>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-emerald-400 text-lg">$</span>
                                <span className="text-2xl font-bold text-emerald-600">{dailyShown}</span>
                              </div>
                              <p className="text-[10px] text-stone-400 mt-1">per day for repeat renters</p>
                            </>
                          );
                        }
                        return (
                          <>
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-emerald-400 text-lg">$</span>
                              <span className="text-2xl font-bold text-emerald-600">{hourlyShown || "0"}</span>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">per hour for repeat renters</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Discount for weekly renters */}
                  {formData.bookingTypes !== "hourly" && (
                    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                      <h4 className="text-sm font-medium text-emerald-800 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                        Give a discount to weekly renters?
                      </h4>
                      <p className="text-[11px] text-stone-500 -mt-1">If someone books your space every week, you can give them a lower rate to reward recurring bookings.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">How much off? (%)</label>
                          <div className="flex items-center gap-2">
                            <Input type="number" min="0" max="50" placeholder="e.g. 10" value={formData.recurringDiscountPercent} onChange={e => update("recurringDiscountPercent", e.target.value)} />
                            <span className="text-sm text-stone-400 flex-shrink-0">% off</span>
                          </div>
                          {Number(formData.recurringDiscountPercent) > 0 && (formData.pricePerHour || formData.pricePerDay) && (
                            <div className="text-[10px] text-emerald-600 mt-1 space-y-0.5">
                              {formData.pricePerHour && (
                                <p>Hourly: ${(Number(formData.pricePerHour) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)}/hr instead of ${formData.pricePerHour}/hr</p>
                              )}
                              {formData.pricePerDay && (
                                <p>Daily: ${(Number(formData.pricePerDay) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)}/day instead of ${formData.pricePerDay}/day</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">When does the discount start?</label>
                          <select value={formData.recurringDiscountAfter} onChange={e => update("recurringDiscountAfter", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white">
                            <option value="0">Right away</option>
                            <option value="2">2 weeks</option>
                            <option value="3">3 weeks</option>
                            <option value="4">4 weeks</option>
                            <option value="8">8 weeks</option>
                            <option value="12">12 weeks</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {tab === "schedule" && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-400">Set the days and hours your space is available. Click a day to toggle it on or off. Once your space is live, we'll sync your calendar automatically so you never get double-booked.</p>
                  <AvailabilityScheduleEditor value={schedule} onChange={setSchedule} />
                </div>
              )}

              {tab === "extras" && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-400">Add amenities and select who this space is best for.</p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amenities</label>
                    <AmenityInput value={amenitiesTags} onChange={setAmenitiesTags} data-testid="input-list-amenities" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Who is this space for?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LIST_SPACE_TYPES.map(t => {
                        const selected = (formData.targetProfession || "").split(",").map(s => s.trim()).filter(Boolean).includes(t.label);
                        return (
                          <button key={t.value} type="button" onClick={() => {
                            const current = (formData.targetProfession || "").split(",").map(s => s.trim()).filter(Boolean);
                            const next = selected ? current.filter(s => s !== t.label) : [...current, t.label];
                            update("targetProfession", next.join(", "));
                          }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              selected ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                            }`}>
                            {t.label}
                          </button>
                        );
                      })}
                      {/* Custom professions */}
                      {(formData.targetProfession || "").split(",").map(s => s.trim()).filter(Boolean)
                        .filter(s => !LIST_SPACE_TYPES.some(t => t.label === s))
                        .map(custom => (
                          <span key={custom} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c4956a]/10 text-[#946b4a] border border-[#c4956a]/30">
                            {custom}
                            <button type="button" onClick={() => {
                              const current = (formData.targetProfession || "").split(",").map(s => s.trim()).filter(Boolean);
                              update("targetProfession", current.filter(s => s !== custom).join(", "));
                            }} className="text-[#946b4a]/60 hover:text-[#946b4a]">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="text" placeholder="Add a custom profession..." className="flex-1 h-8 text-xs bg-white border border-stone-200 rounded-md px-2.5 outline-none focus:border-stone-400"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (!val) return;
                            const current = (formData.targetProfession || "").split(",").map(s => s.trim()).filter(Boolean);
                            if (!current.some(s => s.toLowerCase() === val.toLowerCase())) {
                              update("targetProfession", [...current, val].join(", "));
                            }
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                      <button type="button" onClick={e => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        const val = input?.value?.trim();
                        if (!val) return;
                        const current = (formData.targetProfession || "").split(",").map(s => s.trim()).filter(Boolean);
                        if (!current.some(s => s.toLowerCase() === val.toLowerCase())) {
                          update("targetProfession", [...current, val].join(", "));
                        }
                        input.value = "";
                      }} className="h-8 px-3 text-xs font-medium bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200 transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
              {listStepIndex > 0 ? (
                <Button size="sm" variant="outline" onClick={() => setTab(listSteps[listStepIndex - 1])}>
                  Back
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              {(() => {
                const stepValid: Record<string, boolean> = {
                  details: !!(formData.name && formData.address && formData.city && formData.state && formData.zipCode && formData.description && formData.hostName),
                  pricing: !!(formData.bookingTypes !== "none" && formData.pricePerHour),
                  schedule: true,
                  extras: true,
                };
                const canContinue = stepValid[tab] ?? true;
                return isListLastStep ? (
                  <Button
                    onClick={() => saveStep()}
                    disabled={!canContinue || saving}
                    size="sm"
                    className="bg-stone-900 text-white hover:bg-stone-800"
                    data-testid="button-submit-list-space"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Save & Continue
                  </Button>
                ) : (
                  <Button size="sm" className="bg-stone-900 text-white hover:bg-stone-800" disabled={!canContinue || saving} onClick={() => saveStep(listSteps[listStepIndex + 1])}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save & Continue
                  </Button>
                );
              })()}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
