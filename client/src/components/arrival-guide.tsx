import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Wifi,
  Key,
  ChevronLeft,
  ChevronRight,
  X,
  GripVertical,
  FileText,
  Car,
  DoorOpen,
  Navigation,
  CheckCircle2,
  Building2,
  ZoomIn,
  ArrowRight,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArrivalStep {
  id?: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}

interface ArrivalGuideData {
  id: string;
  spaceId: string;
  wifiName: string | null;
  wifiPassword: string | null;
  doorCode: string | null;
  notes: string | null;
  emergencyPhone: string | null;
  steps: ArrivalStep[];
}

const STEP_SUGGESTIONS = [
  { icon: Car, label: "Parking", placeholder: "Where to park" },
  { icon: DoorOpen, label: "Entrance", placeholder: "Which door to use" },
  { icon: Navigation, label: "Finding us", placeholder: "How to find the suite" },
  { icon: CheckCircle2, label: "You're here", placeholder: "What the door looks like" },
];

const STEP_CATEGORIES = [
  { id: "parking", icon: Car, label: "Where to Park" },
  { id: "enter", icon: DoorOpen, label: "How to Enter" },
  { id: "keys", icon: Key, label: "How to Get Your Keys" },
  { id: "other", icon: FileText, label: "Other" },
] as const;

// ── Host Editor ───────────────────────────────────────────────────
type ShotType = "wide" | "closeup";
type FlowState =
  | { phase: "idle" }
  | { phase: "pick_shot" }                                          // user picks WIDE or CLOSE-UP
  | { phase: "pick_category"; shotType: ShotType }                  // user picks what it's for
  | { phase: "uploading"; shotType: ShotType; category: string }    // uploading photo
  | { phase: "first_done"; firstShot: ShotType; category: string; firstImageUrl: string } // prompt for 2nd
  | { phase: "uploading_second"; firstShot: ShotType; category: string; firstImageUrl: string }; // uploading 2nd

export function ArrivalGuideEditor({ spaceId, hideSaveButton }: { spaceId: string; hideSaveButton?: boolean }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [doorCode, setDoorCode] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [steps, setSteps] = useState<ArrivalStep[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [customCaption, setCustomCaption] = useState("");
  const [flow, setFlow] = useState<FlowState>({ phase: "idle" });

  const { data: guide, isLoading } = useQuery<ArrivalGuideData | null>({
    queryKey: ["/api/spaces", spaceId, "arrival-guide"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/arrival-guide`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Sync form from server data on load and after refetch
  if (guide && !initialized) {
    setWifiName(guide.wifiName || "");
    setWifiPassword(guide.wifiPassword || "");
    setDoorCode(guide.doorCode || "");
    setEmergencyPhone(guide.emergencyPhone || "");
    setSteps(guide.steps || []);
    setInitialized(true);
  }
  if (!guide && !initialized && !isLoading) {
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/spaces/${spaceId}/arrival-guide`, {
        wifiName: wifiName.trim() || null,
        wifiPassword: wifiPassword.trim() || null,
        doorCode: doorCode.trim() || null,
        emergencyPhone: emergencyPhone.trim() || null,
        steps: steps.map((s, i) => ({ imageUrl: s.imageUrl, caption: s.caption, sortOrder: i })),
      });
    },
    onSuccess: () => {
      setInitialized(false); // allow re-sync from server
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "arrival-guide"] });
      toast({ title: "Arrival guide saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/spaces/${spaceId}/arrival-guide/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { imageUrl } = await res.json();
      return imageUrl;
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const autoSave = async (newSteps: ArrivalStep[]) => {
    try {
      await apiRequest("PUT", `/api/spaces/${spaceId}/arrival-guide`, {
        wifiName: wifiName.trim() || null,
        wifiPassword: wifiPassword.trim() || null,
        doorCode: doorCode.trim() || null,
        emergencyPhone: emergencyPhone.trim() || null,
        steps: newSteps.map((s, i) => ({ imageUrl: s.imageUrl, caption: s.caption, sortOrder: i })),
      });
      setInitialized(false);
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "arrival-guide"] });
    } catch { /* silent — user can still manually save */ }
  };

  const handleFileSelected = async (file: File) => {
    if (flow.phase === "uploading") {
      const imageUrl = await uploadPhoto(file);
      if (imageUrl) {
        setFlow({ phase: "first_done", firstShot: flow.shotType, category: flow.category, firstImageUrl: imageUrl });
      } else {
        setFlow({ phase: "idle" });
      }
    } else if (flow.phase === "uploading_second") {
      const imageUrl = await uploadPhoto(file);
      if (imageUrl) {
        const secondShot: ShotType = flow.firstShot === "wide" ? "closeup" : "wide";
        const newSteps = [
          ...steps,
          { imageUrl: flow.firstImageUrl, caption: `${flow.category} — ${flow.firstShot === "wide" ? "Wide" : "Close-up"}`, sortOrder: steps.length },
          { imageUrl, caption: `${flow.category} — ${secondShot === "wide" ? "Wide" : "Close-up"}`, sortOrder: steps.length + 1 },
        ];
        setSteps(newSteps);
        autoSave(newSteps);
      }
      setFlow({ phase: "idle" });
    }
  };

  const removeStep = async (index: number) => {
    const step = steps[index];
    const updatedSteps = steps.filter((_, i) => i !== index);
    setSteps(updatedSteps);
    try {
      await fetch(`/api/spaces/${spaceId}/arrival-guide/image`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl: step.imageUrl }),
      });
      await apiRequest("PUT", `/api/spaces/${spaceId}/arrival-guide`, {
        wifiName: wifiName.trim() || null,
        wifiPassword: wifiPassword.trim() || null,
        doorCode: doorCode.trim() || null,
        emergencyPhone: emergencyPhone.trim() || null,
        steps: updatedSteps.map((s, i) => ({ imageUrl: s.imageUrl, caption: s.caption, sortOrder: i })),
      });
      setInitialized(false);
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "arrival-guide"] });
    } catch {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    }
  };

  const imgSrc = (url: string) => url.startsWith("/") || url.startsWith("http") ? url : `/objects/${url}`;

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>;
  }

  const secondShotLabel = flow.phase === "first_done"
    ? (flow.firstShot === "wide" ? "Close-up" : "Wide")
    : "";

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#c4956a]" />
        <h4 className="text-sm font-medium text-gray-900">Arrival Guide</h4>
        <span className="text-[10px] text-gray-400">Help guests find you</span>
      </div>

      {/* Completed steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const isWide = step.caption?.includes("Wide");
          const StepIcon = isWide ? Building2 : ZoomIn;
          return (
            <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 shrink-0">
                <img src={imgSrc(step.imageUrl)} alt={step.caption || `Step ${i + 1}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <StepIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">{step.caption || `Step ${i + 1}`}</span>
                </div>
              </div>
              <button onClick={() => removeStep(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* ── Flow: pick shot type (WIDE or CLOSE-UP) ── */}
        {flow.phase === "idle" && steps.length < 12 && (
          <div
            className="w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-[#c4956a]/30 transition-colors cursor-pointer"
            onClick={() => setFlow({ phase: "pick_shot" })}
          >
            <div className="px-5 py-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-24 h-16 rounded-lg bg-stone-100 border border-stone-200 flex flex-col items-center justify-center gap-1">
                  <Building2 className="w-6 h-6 text-stone-400" />
                  <span className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">Wide</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
                <div className="w-24 h-16 rounded-lg bg-stone-100 border border-stone-200 flex flex-col items-center justify-center gap-1">
                  <ZoomIn className="w-6 h-6 text-stone-400" />
                  <span className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">Close-up</span>
                </div>
              </div>
              <p className="text-sm text-stone-600 font-medium mb-1.5">
                {steps.length === 0 ? "Add your first step" : "Add another step"}
              </p>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                Each step includes a wide shot and a close-up so guests can find you easily.
              </p>
            </div>
          </div>
        )}

        {flow.phase === "pick_shot" && (
          <div className="rounded-xl border-2 border-[#c4956a]/40 bg-[#c4956a]/5 p-4 space-y-3">
            <p className="text-sm font-medium text-stone-700 text-center">Start with a wide or close-up shot?</p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => setFlow({ phase: "pick_category", shotType: "wide" })}
                className="flex flex-col items-center gap-2 w-28 py-4 rounded-xl border-2 border-stone-200 bg-white hover:border-[#c4956a] transition-all">
                <Building2 className="w-7 h-7 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Wide</span>
              </button>
              <button type="button" onClick={() => setFlow({ phase: "pick_category", shotType: "closeup" })}
                className="flex flex-col items-center gap-2 w-28 py-4 rounded-xl border-2 border-stone-200 bg-white hover:border-[#c4956a] transition-all">
                <ZoomIn className="w-7 h-7 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">Close-up</span>
              </button>
            </div>
            <button type="button" onClick={() => setFlow({ phase: "idle" })} className="w-full text-center text-[10px] text-stone-400 hover:text-stone-600 mt-1">Cancel</button>
          </div>
        )}

        {/* ── Flow: pick category ── */}
        {flow.phase === "pick_category" && (
          <div className="rounded-xl border-2 border-[#c4956a]/40 bg-[#c4956a]/5 p-4 space-y-3">
            <p className="text-sm font-medium text-stone-700 text-center">
              What is this {flow.shotType === "wide" ? "wide" : "close-up"} shot of?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STEP_CATEGORIES.filter(c => c.id !== "other").map(cat => {
                const Icon = cat.icon;
                return (
                  <button key={cat.id} type="button"
                    onClick={() => { setFlow({ phase: "uploading", shotType: flow.shotType, category: cat.label }); setTimeout(() => fileInputRef.current?.click(), 50); }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:border-[#c4956a]/50 hover:text-[#c4956a] transition-all">
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
              <div className="col-span-2 flex items-center gap-2">
                <input type="text" value={customCaption} onChange={(e) => setCustomCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customCaption.trim()) {
                      setFlow({ phase: "uploading", shotType: flow.shotType, category: customCaption.trim() });
                      setCustomCaption("");
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }
                  }}
                  placeholder="Other — type a custom label..."
                  className="flex-1 h-9 text-xs bg-white border border-stone-200 rounded-lg px-3 outline-none focus:border-[#c4956a]/50" maxLength={60} />
                <button type="button"
                  onClick={() => {
                    if (customCaption.trim()) {
                      setFlow({ phase: "uploading", shotType: flow.shotType, category: customCaption.trim() });
                      setCustomCaption("");
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }
                  }}
                  disabled={!customCaption.trim()}
                  className="h-9 px-3 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-30 transition-colors">Add</button>
              </div>
            </div>
            <button type="button" onClick={() => setFlow({ phase: "pick_shot" })} className="w-full text-center text-[10px] text-stone-400 hover:text-stone-600 mt-1">Back</button>
          </div>
        )}

        {/* ── Flow: uploading first photo ── */}
        {flow.phase === "uploading" && (
          <div className="rounded-xl border-2 border-[#c4956a]/40 bg-[#c4956a]/5 p-4 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#c4956a] mx-auto mb-2" />
            <p className="text-xs text-stone-500">
              Uploading {flow.shotType === "wide" ? "wide" : "close-up"} shot for <strong>{flow.category}</strong>...
            </p>
          </div>
        )}

        {/* ── Flow: first photo done, prompt for second ── */}
        {flow.phase === "first_done" && (
          <div className="rounded-xl border-2 border-[#c4956a]/40 bg-[#c4956a]/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <img src={imgSrc(flow.firstImageUrl)} alt="First shot" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs text-stone-400">{flow.firstShot === "wide" ? "Wide" : "Close-up"} shot uploaded</p>
                <p className="text-sm font-medium text-stone-700">{flow.category}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />
            </div>
            <div className="border-t border-[#c4956a]/20 pt-3 text-center">
              <p className="text-sm font-medium text-stone-700 mb-3">
                Now add the {secondShotLabel.toLowerCase()} shot for {flow.category}
              </p>
              <button type="button"
                onClick={() => {
                  setFlow({ phase: "uploading_second", firstShot: flow.firstShot, category: flow.category, firstImageUrl: flow.firstImageUrl });
                  setTimeout(() => fileInputRef.current?.click(), 50);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors">
                {flow.firstShot === "wide" ? <ZoomIn className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                Upload {secondShotLabel} Photo
              </button>
            </div>
            <button type="button" onClick={() => {
              // Skip second photo — just add the first one
              const newSteps = [...steps, { imageUrl: flow.firstImageUrl, caption: `${flow.category} — ${flow.firstShot === "wide" ? "Wide" : "Close-up"}`, sortOrder: steps.length }];
              setSteps(newSteps);
              autoSave(newSteps);
              setFlow({ phase: "idle" });
            }} className="w-full text-center text-[10px] text-stone-400 hover:text-stone-600 mt-1">Skip — add only the first photo</button>
          </div>
        )}

        {/* ── Flow: uploading second photo ── */}
        {flow.phase === "uploading_second" && (
          <div className="rounded-xl border-2 border-[#c4956a]/40 bg-[#c4956a]/5 p-4 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#c4956a] mx-auto mb-2" />
            <p className="text-xs text-stone-500">
              Uploading {flow.firstShot === "wide" ? "close-up" : "wide"} shot for <strong>{flow.category}</strong>...
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); e.target.value = ""; }}
        />
      </div>

      {/* Extras */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            <Wifi className="w-3 h-3" /> WiFi Name
          </label>
          <Input value={wifiName} onChange={(e) => setWifiName(e.target.value)} placeholder="Network name" className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            <Wifi className="w-3 h-3" /> WiFi Password
          </label>
          <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Password" className="h-8 text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            <Key className="w-3 h-3" /> Door / Gate Code
          </label>
          <Input value={doorCode} onChange={(e) => setDoorCode(e.target.value)} placeholder="e.g. #204" className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
            <Phone className="w-3 h-3" /> Emergency Phone
          </label>
          <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="(555) 123-4567" className="h-8 text-xs" type="tel" />
        </div>
      </div>

      {!hideSaveButton && (
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-[#1a1a1a] text-white text-xs"
          size="sm"
        >
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
          Save Arrival Guide
        </Button>
      )}
    </div>
  );
}

// ── Guest Viewer ──────────────────────────────────────────────────
export function ArrivalGuideViewer({ bookingId }: { bookingId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  const { data: guide } = useQuery<ArrivalGuideData | null>({
    queryKey: ["/api/space-bookings", bookingId, "arrival-guide"],
    queryFn: async () => {
      const res = await fetch(`/api/space-bookings/${bookingId}/arrival-guide`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (!guide || (!guide.steps?.length && !guide.wifiName && !guide.doorCode && !guide.emergencyPhone)) return null;

  const hasSteps = guide.steps && guide.steps.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 py-1.5 rounded-md hover:bg-stone-50 transition-colors border border-stone-200"
      >
        <Navigation className="w-3.5 h-3.5" />
        Arrival Guide
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl overflow-hidden max-w-md w-full max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#c4956a]" />
                  <span className="text-sm font-medium text-gray-900">Getting There</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step viewer */}
              {hasSteps && (
                <div className="relative">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={(() => {
                        const url = guide.steps[currentStep].imageUrl;
                        return url.startsWith("/") || url.startsWith("http") ? url : `/objects/${url}`;
                      })()}
                      alt={guide.steps[currentStep].caption || `Step ${currentStep + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Step caption overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                        {currentStep + 1}
                      </span>
                      <p className="text-white text-sm font-medium">
                        {guide.steps[currentStep].caption || STEP_SUGGESTIONS[currentStep]?.label || `Step ${currentStep + 1}`}
                      </p>
                    </div>
                  </div>
                  {/* Nav arrows */}
                  {guide.steps.length > 1 && (
                    <>
                      {currentStep > 0 && (
                        <button
                          onClick={() => setCurrentStep(i => i - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-gray-700 flex items-center justify-center hover:bg-white shadow"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                      {currentStep < guide.steps.length - 1 && (
                        <button
                          onClick={() => setCurrentStep(i => i + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-gray-700 flex items-center justify-center hover:bg-white shadow"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  {/* Step dots */}
                  {guide.steps.length > 1 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {guide.steps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentStep(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? "bg-white" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="px-4 py-3 space-y-2.5 overflow-y-auto">
                {guide.wifiName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500">WiFi:</span>
                    <span className="font-medium text-gray-900">{guide.wifiName}</span>
                    {guide.wifiPassword && <span className="text-gray-400">/ {guide.wifiPassword}</span>}
                  </div>
                )}
                {guide.doorCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500">Access code:</span>
                    <span className="font-medium text-gray-900 font-mono">{guide.doorCode}</span>
                  </div>
                )}
                {guide.emergencyPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500">Emergency:</span>
                    <a href={`tel:${guide.emergencyPhone}`} className="font-medium text-gray-900 hover:text-[#c4956a] transition-colors">{guide.emergencyPhone}</a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
