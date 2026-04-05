import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, Check, Loader2, Shield, ShieldCheck, Upload, ExternalLink, AlertCircle, Building2, DollarSign, Star, Clock, Repeat, CalendarDays, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AmenityInput } from "./amenity-input";

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

type ListTab = "details" | "pricing" | "extras";

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
  const [tab, setTab] = useState<ListTab>("details");
  const [formData, setFormData] = useState({
    name: "", type: "therapy", tags: ["therapy"] as string[], description: "", shortDescription: "",
    address: "", neighborhood: "", pricePerHour: "", pricePerDay: "",
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
      const payload = {
        ...formData,
        type: formData.tags[0] || formData.type,
        amenities: amenitiesTags,
        pricePerHour: Number(formData.pricePerHour),
        pricePerDay: formData.pricePerDay ? Number(formData.pricePerDay) : undefined,
        recurringMinBookings: Number(formData.recurringMinBookings) || 1,
        recurringDiscountPercent: formData.recurringDiscountPercent ? Number(formData.recurringDiscountPercent) : null,
        recurringDiscountAfter: formData.recurringDiscountAfter ? Number(formData.recurringDiscountAfter) : 0,
        bookingTypes: formData.bookingTypes === "none" ? "both" : formData.bookingTypes,
      };
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
        ) : insuranceLoading ? (
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : !insuranceStatus?.hasInsurance && !insuranceBypassed ? (
          <InsuranceUploadStep
            onComplete={() => setInsuranceBypassed(true)}
            onGetCovered={() => {
              window.open("https://www.thimble.com/general-liability-insurance?utm_source=alignworkspaces", "_blank");
            }}
          />
        ) : (
          <>
            {/* Completion Score */}
            <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/50 flex-shrink-0">
              {insuranceStatus?.hasInsurance && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Insurance verified</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-stone-600">Listing completeness</span>
                <span className={`text-xs font-bold ${score.percent === 100 ? "text-emerald-600" : score.percent >= 70 ? "text-amber-600" : "text-stone-400"}`}>{score.percent}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${score.percent === 100 ? "bg-emerald-500" : score.percent >= 70 ? "bg-amber-500" : "bg-stone-400"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score.percent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              {score.percent < 100 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {score.checks.filter(c => !c.done).map(c => (
                    <span key={c.label} className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-500">{c.label}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-100 px-6 gap-1 flex-shrink-0">
              {([
                { id: "details" as const, label: "Details", icon: Building2 },
                { id: "pricing" as const, label: "Pricing", icon: DollarSign },
                { id: "extras" as const, label: "Extras", icon: Star },
              ]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                    tab === t.id
                      ? "border-[#c4956a] text-[#c4956a]"
                      : "border-transparent text-stone-400 hover:text-stone-600"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
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
                      <label className="text-xs text-gray-500 mb-1 block">Your Name / Business *</label>
                      <Input value={formData.hostName} onChange={e => update("hostName", e.target.value)} placeholder="e.g. Dr. Maria Santos" data-testid="input-list-host" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Address *</label>
                      <Input value={formData.address} onChange={e => update("address", e.target.value)} placeholder="Full address" data-testid="input-list-address" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Neighborhood</label>
                      <Input value={formData.neighborhood} onChange={e => update("neighborhood", e.target.value)} placeholder="e.g. Brickell" data-testid="input-list-neighborhood" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
                    <Input value={formData.shortDescription} onChange={e => update("shortDescription", e.target.value)} placeholder="Brief one-liner" data-testid="input-list-short-desc" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description *</label>
                    <Textarea value={formData.description} onChange={e => update("description", e.target.value)} placeholder="Describe your space in detail..." rows={3} data-testid="input-list-description" />
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
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Recurring Rate</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-stone-400 text-lg">$</span>
                        <span className="text-2xl font-bold text-emerald-600">{recurringPrice || (formData.pricePerHour || "0")}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">per hour for regulars</p>
                    </div>
                  </div>

                  {/* Minimum Recurring Sessions */}
                  {formData.bookingTypes !== "hourly" && (
                    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                      <h4 className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-stone-500" />
                        Minimum Recurring Sessions
                      </h4>
                      <p className="text-[11px] text-stone-400 -mt-1">How many weekly sessions a renter must commit to</p>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 8, 12].map(n => (
                          <button key={n} type="button" onClick={() => update("recurringMinBookings", String(n))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              String(n) === formData.recurringMinBookings ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                            }`}>
                            {n === 1 ? "No minimum" : `${n} sessions`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recurring Discount */}
                  {formData.bookingTypes !== "hourly" && (
                    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                      <h4 className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                        Recurring Discount
                      </h4>
                      <p className="text-[11px] text-stone-400 -mt-1">Reward loyal renters with a discount on their recurring rate</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Discount Percentage</label>
                          <div className="flex items-center gap-2">
                            <Input type="number" min="0" max="50" placeholder="e.g. 10" value={formData.recurringDiscountPercent} onChange={e => update("recurringDiscountPercent", e.target.value)} />
                            <span className="text-sm text-stone-400 flex-shrink-0">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Discount Kicks In After</label>
                          <select value={formData.recurringDiscountAfter} onChange={e => update("recurringDiscountAfter", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white">
                            <option value="0">Immediately</option>
                            <option value="1">After 1 booking</option>
                            <option value="2">After 2 bookings</option>
                            <option value="3">After 3 bookings</option>
                            <option value="5">After 5 bookings</option>
                            <option value="10">After 10 bookings</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "extras" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amenities</label>
                    <AmenityInput value={amenitiesTags} onChange={setAmenitiesTags} data-testid="input-list-amenities" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Target Profession</label>
                      <Input value={formData.targetProfession} onChange={e => update("targetProfession", e.target.value)} placeholder="e.g. Therapists" data-testid="input-list-target" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Available Hours</label>
                      <Input value={formData.availableHours} onChange={e => update("availableHours", e.target.value)} placeholder="Mon-Fri 9am-5pm" data-testid="input-list-hours" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!formData.name || !formData.address || !formData.pricePerHour || !formData.description || !formData.hostName || formData.bookingTypes === "none" || createMutation.isPending}
                size="sm"
                className="bg-stone-900 text-white hover:bg-stone-800"
                data-testid="button-submit-list-space"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Submit for Approval
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
