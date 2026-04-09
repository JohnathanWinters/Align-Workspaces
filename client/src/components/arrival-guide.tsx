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
  steps: ArrivalStep[];
}

const STEP_SUGGESTIONS = [
  { icon: Car, label: "Parking", placeholder: "Where to park" },
  { icon: DoorOpen, label: "Entrance", placeholder: "Which door to use" },
  { icon: Navigation, label: "Finding us", placeholder: "How to find the suite" },
  { icon: CheckCircle2, label: "You're here", placeholder: "What the door looks like" },
];

// ── Host Editor ───────────────────────────────────────────────────
export function ArrivalGuideEditor({ spaceId, hideSaveButton }: { spaceId: string; hideSaveButton?: boolean }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [doorCode, setDoorCode] = useState("");
  const [notes, setNotes] = useState("");
  const [steps, setSteps] = useState<ArrivalStep[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: guide, isLoading } = useQuery<ArrivalGuideData | null>({
    queryKey: ["/api/spaces", spaceId, "arrival-guide"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/arrival-guide`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Initialize form from loaded data
  if (guide && !initialized) {
    setWifiName(guide.wifiName || "");
    setWifiPassword(guide.wifiPassword || "");
    setDoorCode(guide.doorCode || "");
    setNotes(guide.notes || "");
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
        notes: notes.trim() || null,
        steps: steps.map((s, i) => ({ imageUrl: s.imageUrl, caption: s.caption, sortOrder: i })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "arrival-guide"] });
      toast({ title: "Arrival guide saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const handleUpload = async (file: File) => {
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
      const suggestion = STEP_SUGGESTIONS[steps.length] || STEP_SUGGESTIONS[STEP_SUGGESTIONS.length - 1];
      setSteps(prev => [...prev, { imageUrl, caption: "", sortOrder: prev.length }]);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, caption } : s));
  };

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#c4956a]" />
        <h4 className="text-sm font-medium text-gray-900">Arrival Guide</h4>
        <span className="text-[10px] text-gray-400">Help guests find you</span>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const suggestion = STEP_SUGGESTIONS[i] || STEP_SUGGESTIONS[STEP_SUGGESTIONS.length - 1];
          const SugIcon = suggestion.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 shrink-0">
                <img
                  src={step.imageUrl.startsWith("/") || step.imageUrl.startsWith("http") ? step.imageUrl : `/objects/${step.imageUrl}`}
                  alt={step.caption || `Step ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <SugIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">{suggestion.label}</span>
                </div>
                <Input
                  value={step.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder={suggestion.placeholder}
                  className="h-7 text-xs"
                  maxLength={80}
                />
              </div>
              <button onClick={() => removeStep(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {steps.length < 6 && steps.length > 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors text-xs"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {uploading ? "Uploading..." : "Add another step"}
          </button>
        )}

        {steps.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-[#c4956a]/40 transition-colors group"
          >
            <div className="px-5 py-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Wide shot example */}
                <div className="w-24 h-16 rounded-lg bg-stone-100 border border-stone-200 flex flex-col items-center justify-center gap-1 group-hover:border-[#c4956a]/30 transition-colors">
                  <Building2 className="w-6 h-6 text-stone-400 group-hover:text-[#c4956a]/60 transition-colors" />
                  <span className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">Wide</span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400" />
                {/* Close-up example */}
                <div className="w-24 h-16 rounded-lg bg-stone-100 border border-stone-200 flex flex-col items-center justify-center gap-1 group-hover:border-[#c4956a]/30 transition-colors">
                  <ZoomIn className="w-6 h-6 text-stone-400 group-hover:text-[#c4956a]/60 transition-colors" />
                  <span className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">Close-up</span>
                </div>
              </div>
              <p className="text-sm text-stone-600 group-hover:text-stone-700 transition-colors font-medium mb-1.5">
                {uploading ? "Uploading..." : "Add your first step"}
              </p>
              <p className="text-xs text-stone-400 group-hover:text-stone-500 transition-colors leading-relaxed max-w-sm mx-auto">
                Start with a wide shot of the building, then add close-ups of the entrance, hallway, and door so guests can find you easily.
              </p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ""; }}
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
            <FileText className="w-3 h-3" /> Extra Notes
          </label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else" className="h-8 text-xs" />
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

  if (!guide || (!guide.steps?.length && !guide.wifiName && !guide.doorCode)) return null;

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
                {guide.notes && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-gray-600">{guide.notes}</p>
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
