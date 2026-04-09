import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, Check, Loader2, Shield, ShieldCheck, Upload, ExternalLink, AlertCircle, Building2, DollarSign, Star, Clock, Repeat, CalendarDays, Save, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AmenityInput } from "./amenity-input";
import { AvailabilityScheduleEditor, scheduleToDisplayText, type WeekSchedule } from "./availability-schedule-editor";
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

function InsuranceUploadStep({ onComplete, onGetCovered }: { onComplete: () => void; onGetCovered: () => void }) {
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
      const res = await fetch("/api/host/insurance", { method: "POST", body: fd });
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
  const listSteps: ListTab[] = ["details", "pricing", "schedule", "extras"];
  const allStepLabels = ["Details", "Pricing", "Availability", "Extras", "Photos", "Arrival Guide", "Insurance"];
  const listStepLabels: Record<ListTab, string> = { details: "Details", pricing: "Pricing", schedule: "Availability", extras: "Extras", photos: "Photos", arrival: "Arrival Guide" };
  const [schedule, setSchedule] = useState<WeekSchedule>({
    mon: { open: "09:00", close: "17:00" }, tue: { open: "09:00", close: "17:00" },
    wed: { open: "09:00", close: "17:00" }, thu: { open: "09:00", close: "17:00" },
    fri: { open: "09:00", close: "17:00" }, sat: null, sun: null,
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
    bookingTypes: "both", recurringMinBookings: "1", recurringDiscountPercent: "0", recurringDiscountAfter: "0",
  });
  const [amenitiesTags, setAmenitiesTags] = useState<string[]>([]);

  const { data: insuranceStatus, isLoading: insuranceLoading } = useQuery<{ hasInsurance: boolean; status: string }>({
    queryKey: ["/api/host/insurance/status"],
    enabled: isAuthenticated,
  });

  const score = getListCompletionScore(formData, amenitiesTags);

  const recurringPrice = formData.pricePerHour && formData.recurringDiscountPercent && Number(formData.recurringDiscountPercent) > 0
    ? (Number(formData.pricePerHour) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)
    : null;

  const createMutation = useMutation({
    mutationFn: async () => {
      const fullAddress = [formData.address, formData.city, formData.state, formData.zipCode].filter(Boolean).join(", ");
      const payload = {
        ...formData,
        address: fullAddress,
        type: formData.tags[0] || formData.type,
        amenities: amenitiesTags,
        pricePerHour: Number(formData.pricePerHour),
        pricePerDay: formData.pricePerDay ? Number(formData.pricePerDay) : undefined,
        recurringMinBookings: Number(formData.recurringMinBookings) || 1,
        recurringDiscountPercent: formData.recurringDiscountPercent ? Number(formData.recurringDiscountPercent) : null,
        recurringDiscountAfter: formData.recurringDiscountAfter ? Number(formData.recurringDiscountAfter) : 0,
        bookingTypes: formData.bookingTypes === "none" ? "both" : formData.bookingTypes,
        availabilitySchedule: JSON.stringify(schedule),
        availableHours: scheduleToDisplayText(schedule),
      };
      const res = await apiRequest("POST", "/api/spaces", payload);
      return await res.json();
    },
    onSuccess: (space: any) => {
      toast({ title: "Space submitted!", description: "Now let's add some finishing touches." });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      setCreatedSpaceId(space.id);
      setListingSubmitted(true);
      setPostStep("photos");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

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
          <div className="space-y-4">
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps} — {globalStepLabel}</span>
              </div>
              <div className="flex gap-1.5">
                {allStepLabels.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"}`} />
                ))}
              </div>
            </div>
            <div className="px-6 text-center mb-2">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1">Add Photos</h3>
              <p className="text-xs text-stone-400">Upload photos of your space so renters know what to expect. You can always add more later from your portal.</p>
            </div>
            <div className="px-6">
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center">
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    for (const file of Array.from(files)) {
                      const fd = new FormData();
                      fd.append("photo", file);
                      await fetch(`/api/spaces/${createdSpaceId}/photos`, { method: "POST", body: fd });
                    }
                    toast({ title: `${files.length} photo${files.length > 1 ? "s" : ""} uploaded` });
                    queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
                  }} />
                  <Upload className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm text-stone-500 font-medium">Click to upload photos</p>
                  <p className="text-xs text-stone-400 mt-1">JPG, PNG, or WebP</p>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 pb-4 pt-2">
              <button onClick={() => setPostStep("arrival")} className="flex-1 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors">
                Skip
              </button>
              <Button onClick={() => setPostStep("arrival")} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
                Continue
              </Button>
            </div>
          </div>
        ) : listingSubmitted && postStep === "arrival" && createdSpaceId ? (
          <div className="space-y-4">
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps} — {globalStepLabel}</span>
              </div>
              <div className="flex gap-1.5">
                {allStepLabels.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"}`} />
                ))}
              </div>
            </div>
            <div className="px-6 text-center mb-2">
              <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-7 h-7 text-[#c4956a]" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1">Arrival Guide</h3>
              <p className="text-xs text-stone-400">Help your renters find your space. Add parking info, door codes, WiFi, and step-by-step directions with photos.</p>
            </div>
            <div className="px-6">
              <ArrivalGuideEditor spaceId={createdSpaceId} />
            </div>
            <div className="flex items-center gap-2 px-6 pb-4 pt-2">
              <button onClick={() => { if (insuranceStatus?.hasInsurance) { onClose(); } else { setPostStep("insurance"); } }} className="flex-1 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors">
                Skip
              </button>
              <Button onClick={() => { if (insuranceStatus?.hasInsurance) { onClose(); } else { setPostStep("insurance"); } }} className="flex-1 bg-stone-900 text-white hover:bg-stone-800">
                Continue
              </Button>
            </div>
          </div>
        ) : listingSubmitted && postStep === "insurance" && !insuranceStatus?.hasInsurance && !insuranceBypassed ? (
          <div>
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps} — Insurance</span>
              </div>
              <div className="flex gap-1.5">
                {allStepLabels.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"}`} />
                ))}
              </div>
            </div>
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
                <span className="text-xs font-medium text-stone-600">Step {globalStepIndex + 1} of {totalSteps} — {globalStepLabel}</span>
                <span className={`text-xs font-bold ${score.percent === 100 ? "text-emerald-600" : score.percent >= 70 ? "text-amber-600" : "text-stone-400"}`}>{score.percent}%</span>
              </div>
              <div className="flex gap-1.5">
                {allStepLabels.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= globalStepIndex ? "bg-[#c4956a]" : "bg-stone-200"}`} />
                ))}
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
                        <span>Your space will only accept recurring weekly bookings. Single sessions will not be available.</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`rounded-xl border-2 p-4 text-center ${formData.bookingTypes !== "recurring" ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white opacity-40"}`}>
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Hourly Rate</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-stone-400 text-lg">$</span>
                        <input type="number" value={formData.pricePerHour} onChange={e => update("pricePerHour", e.target.value)}
                          className="w-20 text-center text-2xl font-bold text-stone-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0" data-testid="input-list-price" />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">per hour</p>
                    </div>
                    <div className={`rounded-xl border p-4 text-center ${formData.bookingTypes !== "recurring" ? "border-stone-200 bg-white" : "border-stone-200 bg-white opacity-40"}`}>
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
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-emerald-400 text-lg">$</span>
                        <span className="text-2xl font-bold text-emerald-600">{recurringPrice || (formData.pricePerHour || "0")}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">per hour for repeat renters</p>
                    </div>
                  </div>

                  {/* Discount for weekly renters */}
                  {formData.bookingTypes !== "hourly" && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                      <h4 className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                        Give a discount to weekly renters?
                      </h4>
                      <p className="text-[11px] text-stone-500 -mt-1">If someone books your space every week, you can give them a lower rate to keep them coming back.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">How much off? (%)</label>
                          <div className="flex items-center gap-2">
                            <Input type="number" min="0" max="50" placeholder="e.g. 10" value={formData.recurringDiscountPercent} onChange={e => update("recurringDiscountPercent", e.target.value)} />
                            <span className="text-sm text-stone-400 flex-shrink-0">% off</span>
                          </div>
                          {formData.recurringDiscountPercent && Number(formData.recurringDiscountPercent) > 0 && formData.pricePerHour && (
                            <p className="text-[10px] text-emerald-600 mt-1">
                              They'd pay ${(Number(formData.pricePerHour) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)}/hr instead of ${formData.pricePerHour}/hr
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">When does the discount start?</label>
                          <select value={formData.recurringDiscountAfter} onChange={e => update("recurringDiscountAfter", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white">
                            <option value="0">Right away</option>
                            <option value="1">After 1 week</option>
                            <option value="2">After 2 weeks</option>
                            <option value="3">After 3 weeks</option>
                            <option value="5">After 5 weeks</option>
                            <option value="10">After 10 weeks</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

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
                      {Number(formData.recurringMinBookings) > 1 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>This means renters will not be able to book unless they commit to {formData.recurringMinBookings} weeks straight.</span>
                        </div>
                      )}
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
                  <p className="text-xs text-stone-400">Add amenities and details to help renters find your space.</p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amenities</label>
                    <AmenityInput value={amenitiesTags} onChange={setAmenitiesTags} data-testid="input-list-amenities" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Target Profession</label>
                    <Input value={formData.targetProfession} onChange={e => update("targetProfession", e.target.value)} placeholder="e.g. Therapists, Counselors" data-testid="input-list-target" />
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
                    onClick={() => createMutation.mutate()}
                    disabled={!canContinue || createMutation.isPending}
                    size="sm"
                    className="bg-stone-900 text-white hover:bg-stone-800"
                    data-testid="button-submit-list-space"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Submit
                  </Button>
                ) : (
                  <Button size="sm" className="bg-stone-900 text-white hover:bg-stone-800" disabled={!canContinue} onClick={() => setTab(listSteps[listStepIndex + 1])}>
                    Continue
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
