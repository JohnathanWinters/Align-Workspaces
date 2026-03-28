import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  X,
  Camera,
  ImagePlus,
  Trash2,
  Upload,
  GripVertical,
  Pencil,
  Save,
  Check,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  Heart,
  CalendarDays,
  Share2,
  Link2,
  Copy,
  BarChart3,
  Star,
  FolderHeart,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  TrendingUp,
  Repeat,
  Pause,
  Play,
  XCircle,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";
import { AvailabilityScheduleEditor, scheduleToDisplayText, type WeekSchedule } from "./availability-schedule-editor";
import { ArrivalGuideEditor } from "./arrival-guide";
import BookingCalendar from "./booking-calendar";
import { CalendarSyncSettings } from "./calendar-sync-settings";
import { AmenityInput } from "./amenity-input";

const SPACE_TYPES = [
  { value: "therapy", label: "Therapy & Counseling" },
  { value: "coaching", label: "Coaching & Consulting" },
  { value: "wellness", label: "Wellness & Holistic" },
  { value: "workshop", label: "Workshops & Classes" },
  { value: "creative", label: "Creative Studio" },
];

function SpacePhotoManager({ space }: { space: Space }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const images: string[] = (space.imageUrls || []) as string[];
  const BATCH_SIZE = 2;

  const handleUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    try {
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        setUploadProgress(`${uploaded}/${files.length}`);
        const formData = new FormData();
        batch.forEach((f) => formData.append("photos", f));
        const res = await fetch(`/api/spaces/${space.id}/photos`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Upload failed");
        }
        uploaded += batch.length;
      }
      toast({ title: `${uploaded} photo${uploaded > 1 ? "s" : ""} uploaded` });
      queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      if (uploaded > 0) queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });
    }
    setUploading(false);
    setUploadProgress("");
  };

  const deleteMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const res = await fetch(`/api/spaces/${space.id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Photo removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    try {
      const res = await fetch(`/api/spaces/${space.id}/photos/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: reordered }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Reorder failed");
      queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [space.id]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOver(false);
  }, []);

  return (
    <div
      className="mt-3 pt-3 border-t border-gray-100"
      data-testid={`space-photos-${space.id}`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={(e) => { dragCounter.current = 0; onDrop(e); }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <Camera className="w-3 h-3" /> Photos ({images.length})
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-[#c4956a] hover:text-[#b3845c] font-medium flex items-center gap-1 disabled:opacity-50"
          data-testid={`button-add-photos-${space.id}`}
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
          {uploading ? `Uploading ${uploadProgress}...` : "Add Photos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
            e.target.value = "";
          }}
          data-testid={`input-space-photos-${space.id}`}
        />
      </div>
      {images.length > 0 && dragOver && (
        <div className="mb-2 py-6 border-2 border-dashed border-[#c4956a] rounded-lg flex flex-col items-center gap-1 text-[#c4956a] bg-[#c4956a]/5 transition-colors">
          <Upload className="w-5 h-5" />
          <span className="text-xs font-medium">Drop photos here</span>
        </div>
      )}
      {images.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(i)); setDragIdx(i); }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIdx(i); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const from = parseInt(e.dataTransfer.getData("text/plain")); if (!isNaN(from)) handleReorder(from, i); setDragIdx(null); setDragOverIdx(null); }}
                className={`relative group rounded-lg overflow-hidden aspect-[4/3] bg-gray-100 cursor-grab active:cursor-grabbing transition-all ${
                  dragIdx === i ? "opacity-40 scale-95" : ""
                } ${dragOverIdx === i && dragIdx !== null && dragIdx !== i ? "ring-2 ring-[#c4956a] scale-105" : ""}`}
                data-testid={`space-photo-${space.id}-${i}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Cover</span>
                )}
                <button
                  onClick={() => deleteMutation.mutate(url)}
                  disabled={deleteMutation.isPending}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-delete-photo-${space.id}-${i}`}
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical className="w-3 h-3 text-white" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Drag to reorder. First photo is the cover image.</p>
        </>
      )}
      {images.length === 0 && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full py-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 transition-colors ${
            dragOver ? "border-[#c4956a] text-[#c4956a] bg-[#c4956a]/5" : "border-gray-200 text-gray-400 hover:border-[#c4956a] hover:text-[#c4956a]"
          }`}
          data-testid={`button-upload-first-photo-${space.id}`}
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs">{dragOver ? "Drop photos here" : "Drop photos here or click to upload"}</span>
        </button>
      )}
    </div>
  );
}

function SpaceCard({ space, statusColors }: { space: Space; statusColors: Record<string, string> }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Card className="bg-white" data-testid={`my-space-${space.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900 text-sm">{space.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{space.address}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${space.pricePerHour}/hr</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                data-testid={`button-edit-space-${space.id}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <Badge className={statusColors[space.approvalStatus || "pending"]}>
                {space.approvalStatus || "pending"}
              </Badge>
            </div>
          </div>
          <SpacePhotoManager space={space} />
        </CardContent>
      </Card>
      <AnimatePresence>
        {editing && (
          <EditSpaceModal space={space} onClose={() => setEditing(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

type EditTab = "details" | "pricing" | "schedule" | "extras";

function getCompletionScore(formData: Record<string, string>, images: string[], amenitiesTags?: string[]) {
  const checks = [
    { label: "Space name", done: !!formData.name },
    { label: "Address", done: !!formData.address },
    { label: "Host name", done: !!formData.hostName },
    { label: "Hourly price", done: !!formData.pricePerHour },
    { label: "Description", done: !!formData.description },
    { label: "Short description", done: !!formData.shortDescription },
    { label: "Photos", done: images.length >= 1 },
    { label: "Amenities", done: amenitiesTags ? amenitiesTags.length > 0 : !!formData.amenities },
    { label: "Daily price", done: !!formData.pricePerDay },
    { label: "Neighborhood", done: !!formData.neighborhood },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
}

function EditSpaceModal({ space, onClose }: { space: Space; onClose: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<EditTab>("details");
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    try {
      return space.availabilitySchedule ? JSON.parse(space.availabilitySchedule) : {
        mon: { open: "09:00", close: "17:00" }, tue: { open: "09:00", close: "17:00" },
        wed: { open: "09:00", close: "17:00" }, thu: { open: "09:00", close: "17:00" },
        fri: { open: "09:00", close: "17:00" }, sat: null, sun: null,
      };
    } catch { return { mon: { open: "09:00", close: "17:00" }, tue: { open: "09:00", close: "17:00" }, wed: { open: "09:00", close: "17:00" }, thu: { open: "09:00", close: "17:00" }, fri: { open: "09:00", close: "17:00" }, sat: null, sun: null }; }
  });
  const [formData, setFormData] = useState({
    name: space.name || "",
    type: space.type || "therapy",
    description: space.description || "",
    shortDescription: space.shortDescription || "",
    address: space.address || "",
    neighborhood: space.neighborhood || "",
    pricePerHour: String(space.pricePerHour || ""),
    pricePerDay: String(space.pricePerDay || ""),
    amenities: "",
    targetProfession: space.targetProfession || "",
    hostName: space.hostName || "",
    bufferMinutes: String(space.bufferMinutes ?? 15),
    cancellationPolicy: (space as any).cancellationPolicy || "flexible",
    recurringDiscountPercent: String((space as any).recurringDiscountPercent ?? "0"),
    recurringDiscountAfter: String((space as any).recurringDiscountAfter ?? "3"),
  });
  const [amenitiesTags, setAmenitiesTags] = useState<string[]>((space.amenities || []) as string[]);

  const images: string[] = (space.imageUrls || []) as string[];
  const score = getCompletionScore(formData, images, amenitiesTags);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        pricePerHour: formData.pricePerHour ? Number(formData.pricePerHour) : undefined,
        pricePerDay: formData.pricePerDay ? Number(formData.pricePerDay) : undefined,
        bufferMinutes: Number(formData.bufferMinutes),
        recurringDiscountPercent: formData.recurringDiscountPercent ? Number(formData.recurringDiscountPercent) : null,
        recurringDiscountAfter: formData.recurringDiscountAfter ? Number(formData.recurringDiscountAfter) : 0,
        amenities: amenitiesTags,
        availabilitySchedule: JSON.stringify(schedule),
        availableHours: scheduleToDisplayText(schedule),
        cancellationPolicy: formData.cancellationPolicy,
      };
      await apiRequest("PATCH", `/api/spaces/${space.id}`, payload);
    },
    onSuccess: () => {
      toast({ title: "Space updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const tabs: { id: EditTab; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Details", icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: "pricing", label: "Pricing", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "schedule", label: "Schedule", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "extras", label: "Extras", icon: <Star className="w-3.5 h-3.5" /> },
  ];

  const recurringPrice = formData.pricePerHour && formData.recurringDiscountPercent && Number(formData.recurringDiscountPercent) > 0
    ? (Number(formData.pricePerHour) * (1 - Number(formData.recurringDiscountPercent) / 100)).toFixed(0)
    : null;

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        data-testid={`edit-space-form-${space.id}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Pencil className="w-4 h-4 text-[#c4956a] flex-shrink-0" />
            <h2 className="font-serif text-lg font-bold text-stone-900 truncate">{space.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Completion Score */}
        <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/50">
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
              {score.checks.filter((c) => !c.done).map((c) => (
                <span key={c.label} className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-500">{c.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-6 gap-1 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                tab === t.id
                  ? "border-[#c4956a] text-[#c4956a]"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              {t.icon}
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
                  <label className="text-xs text-gray-500 mb-1 block">Space Name</label>
                  <Input value={formData.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Sunny Therapy Room" data-testid={`edit-input-name-${space.id}`} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Space Category</label>
                  <select value={formData.type} onChange={(e) => update("type", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" data-testid={`edit-select-type-${space.id}`}>
                    {SPACE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Host Name</label>
                  <Input value={formData.hostName} onChange={(e) => update("hostName", e.target.value)} placeholder="e.g. Maria S." data-testid={`edit-input-host-${space.id}`} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Address</label>
                  <Input value={formData.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. 245 Miracle Mile, Coral Gables, FL 33134" data-testid={`edit-input-address-${space.id}`} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Neighborhood</label>
                  <Input value={formData.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} placeholder="e.g. Brickell" data-testid={`edit-input-neighborhood-${space.id}`} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
                <Input value={formData.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} placeholder="e.g. A calm, private suite perfect for therapy sessions" data-testid={`edit-input-short-desc-${space.id}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <Textarea value={formData.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="e.g. Fully furnished therapy room with natural light, sound insulation, and a private waiting area. Ideal for therapists, counselors, and coaches." data-testid={`edit-input-description-${space.id}`} />
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-stone-900 bg-stone-50 p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Hourly Rate</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-stone-400 text-lg">$</span>
                    <input
                      type="number"
                      value={formData.pricePerHour}
                      onChange={(e) => update("pricePerHour", e.target.value)}
                      className="w-20 text-center text-2xl font-bold text-stone-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      data-testid={`edit-input-price-hour-${space.id}`}
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">per hour</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Daily Rate</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-stone-400 text-lg">$</span>
                    <input
                      type="number"
                      value={formData.pricePerDay}
                      onChange={(e) => update("pricePerDay", e.target.value)}
                      className="w-20 text-center text-2xl font-bold text-stone-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                      data-testid={`edit-input-price-day-${space.id}`}
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">per day (optional)</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Recurring Rate</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-stone-400 text-lg">$</span>
                    <span className="text-2xl font-bold text-emerald-600">{recurringPrice || (formData.pricePerHour || "0")}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">per hour for regulars</p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                <h4 className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                  Recurring Discount
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Discount Percentage</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" max="50" placeholder="e.g. 10" value={formData.recurringDiscountPercent} onChange={(e) => update("recurringDiscountPercent", e.target.value)} data-testid={`edit-input-recurring-discount-${space.id}`} />
                      <span className="text-sm text-stone-400 flex-shrink-0">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kicks In After</label>
                    <select value={formData.recurringDiscountAfter} onChange={(e) => update("recurringDiscountAfter", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" data-testid={`edit-select-recurring-after-${space.id}`}>
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
            </div>
          )}

          {tab === "schedule" && (
            <div className="space-y-4">
              <AvailabilityScheduleEditor value={schedule} onChange={setSchedule} />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Buffer Time Between Bookings</label>
                <select value={formData.bufferMinutes} onChange={(e) => update("bufferMinutes", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" data-testid={`edit-select-buffer-${space.id}`}>
                  <option value="0">No buffer</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Time reserved between bookings for prep or cleanup</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cancellation Policy</label>
                <select value={formData.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" data-testid={`edit-select-cancellation-${space.id}`}>
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  {formData.cancellationPolicy === "flexible"
                    ? "Full refund up to 24 hours before the booking"
                    : formData.cancellationPolicy === "moderate"
                    ? "Full refund up to 5 days before; 50% refund after that"
                    : "50% refund up to 7 days before; no refund after that"}
                </p>
              </div>
              <ArrivalGuideEditor spaceId={space.id} />
              <CalendarSyncSettings spaceId={space.id} />
            </div>
          )}

          {tab === "extras" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amenities</label>
                <AmenityInput value={amenitiesTags} onChange={setAmenitiesTags} data-testid={`edit-input-amenities-${space.id}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Target Professionals</label>
                <div className="flex flex-wrap gap-2" data-testid={`edit-input-target-${space.id}`}>
                  {SPACE_TYPES.map((t) => {
                    const selected = (formData.targetProfession || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                    const isSelected = selected.includes(t.label);
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected ? selected.filter((s: string) => s !== t.label) : [...selected, t.label];
                          update("targetProfession", next.join(", "));
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? "border-gray-800 bg-gray-800 text-white"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={onClose} data-testid={`button-cancel-edit-space-btn-${space.id}`}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            size="sm"
            className="bg-stone-900 text-white hover:bg-black"
            data-testid={`button-save-edit-space-${space.id}`}
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewSpaceForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<WeekSchedule>({
    mon: { open: "09:00", close: "17:00" }, tue: { open: "09:00", close: "17:00" },
    wed: { open: "09:00", close: "17:00" }, thu: { open: "09:00", close: "17:00" },
    fri: { open: "09:00", close: "17:00" }, sat: null, sun: null,
  });
  const [formData, setFormData] = useState({
    name: "",
    type: "therapy",
    description: "",
    shortDescription: "",
    address: "",
    neighborhood: "",
    pricePerHour: "",
    pricePerDay: "",
    amenities: "",
    targetProfession: "",
    hostName: "",
    bufferMinutes: "15",
  });
  const [newAmenitiesTags, setNewAmenitiesTags] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        bufferMinutes: Number(formData.bufferMinutes),
        amenities: newAmenitiesTags,
        availabilitySchedule: JSON.stringify(schedule),
        availableHours: scheduleToDisplayText(schedule),
      };
      await apiRequest("POST", "/api/spaces", payload);
    },
    onSuccess: () => {
      toast({ title: "Space submitted!", description: "Your space listing is pending admin approval." });
      queryClient.invalidateQueries({ queryKey: ["/api/my-spaces"] });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white border-gray-200" data-testid="form-new-space">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-lg text-gray-900">List a New Space</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" data-testid="button-close-space-form">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Space Name *</label>
            <Input value={formData.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Sunny Therapy Room" data-testid="input-space-name" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Space Category *</label>
            <select
              value={formData.type}
              onChange={(e) => update("type", e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
              data-testid="select-space-type"
            >
              {SPACE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Host Name *</label>
            <Input value={formData.hostName} onChange={(e) => update("hostName", e.target.value)} placeholder="e.g. Dr. Maria Santos" data-testid="input-host-name" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Address *</label>
            <Input value={formData.address} onChange={(e) => update("address", e.target.value)} placeholder="Full address" data-testid="input-space-address" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Neighborhood</label>
            <Input value={formData.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} placeholder="e.g. Brickell" data-testid="input-space-neighborhood" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Price per Hour ($) *</label>
            <Input type="number" value={formData.pricePerHour} onChange={(e) => update("pricePerHour", e.target.value)} placeholder="35" data-testid="input-space-price-hour" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Price per Day ($)</label>
            <Input type="number" value={formData.pricePerDay} onChange={(e) => update("pricePerDay", e.target.value)} placeholder="200" data-testid="input-space-price-day" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Target Professionals</label>
            <div className="flex flex-wrap gap-2" data-testid="input-space-target">
              {SPACE_TYPES.map((t) => {
                const selected = (formData.targetProfession || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                const isSelected = selected.includes(t.label);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? selected.filter((s: string) => s !== t.label) : [...selected, t.label];
                      update("targetProfession", next.join(", "));
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-gray-800 bg-gray-800 text-white"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AvailabilityScheduleEditor value={schedule} onChange={setSchedule} />

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Buffer Time Between Bookings</label>
          <select
            value={formData.bufferMinutes}
            onChange={(e) => update("bufferMinutes", e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            data-testid="select-space-buffer"
          >
            <option value="0">No buffer</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes (default)</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
          <p className="text-[10px] text-gray-400 mt-1">Time reserved between bookings for prep or cleanup</p>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
          <Input value={formData.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} placeholder="Brief one-liner about your space" data-testid="input-space-short-desc" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Description *</label>
          <Textarea value={formData.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe your space in detail..." rows={3} data-testid="input-space-description" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amenities</label>
          <AmenityInput value={newAmenitiesTags} onChange={setNewAmenitiesTags} data-testid="input-space-amenities" />
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!formData.name || !formData.address || !formData.pricePerHour || !formData.description || !formData.hostName || createMutation.isPending}
          className="w-full bg-gray-900 text-white hover:bg-black"
          data-testid="button-submit-space"
        >
          {createMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
          ) : (
            "Submit for Approval"
          )}
        </Button>
        <p className="text-xs text-gray-400 text-center">Your listing will be reviewed by our team before going live.</p>
      </CardContent>
    </Card>
  );
}

function StripeConnectSection({ hasSpaces }: { hasSpaces: boolean }) {
  const { toast } = useToast();

  const { data: connectStatus, isLoading } = useQuery<{
    connected: boolean;
    onboardingComplete: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  }>({
    queryKey: ["/api/stripe/connect/status"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/connect/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/connect/onboard");
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const dashboardMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return null;
  if (!hasSpaces && !connectStatus?.connected) return null;

  if (connectStatus?.onboardingComplete) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30" data-testid="stripe-connect-complete">
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Payouts active</p>
              <p className="text-xs text-emerald-600">Earnings are deposited to your bank account automatically.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dashboardMutation.mutate()}
            disabled={dashboardMutation.isPending}
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            data-testid="button-stripe-dashboard"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Stripe Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 bg-gradient-to-br from-white to-stone-50" data-testid="stripe-connect-setup">
      <CardContent className="py-6 px-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-stone-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Set up payouts to receive earnings</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Connect your bank account to receive payments when guests book your space. Keep 87.5% of every booking — or 92% when you refer clients.
            </p>
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-stone-50 border border-stone-100">
              <ShieldCheck className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <p className="text-[11px] text-stone-500">
                Payments are securely processed by Stripe. Your earnings are automatically deposited to your bank account.
              </p>
            </div>
            <Button
              onClick={() => onboardMutation.mutate()}
              disabled={onboardMutation.isPending}
              size="sm"
              className="bg-gray-900 text-white hover:bg-black text-xs"
              data-testid="button-connect-stripe"
            >
              {onboardMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <CreditCard className="w-3 h-3 mr-1" />
              )}
              {connectStatus?.connected ? "Continue Setup" : "Connect with Stripe"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SavedTab() {
  const { toast } = useToast();

  // Favorites
  const { data: favoriteSpaces = [], isLoading: favLoading } = useQuery<Space[]>({
    queryKey: ["/api/space-favorites"],
    queryFn: async () => {
      const res = await fetch("/api/space-favorites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (spaceId: string) => {
      await apiRequest("DELETE", `/api/space-favorites/${spaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/space-favorites"] });
    },
  });

  // Wishlists
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: wishlists = [], isLoading: wlLoading } = useQuery<{ id: string; name: string; items: any[]; itemCount: number }[]>({
    queryKey: ["/api/wishlists"],
    queryFn: async () => {
      const res = await fetch("/api/wishlists", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/wishlists", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlists"] });
      setNewName("");
      setCreating(false);
      toast({ title: "Collection created" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/wishlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlists"] });
      toast({ title: "Collection deleted" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ collectionId, spaceId }: { collectionId: string; spaceId: string }) => {
      await apiRequest("DELETE", `/api/wishlists/${collectionId}/items/${spaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlists"] });
      toast({ title: "Space removed from collection" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/wishlists/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlists"] });
      setRenamingId(null);
      toast({ title: "Collection renamed" });
    },
  });

  if (favLoading || wlLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasFavorites = favoriteSpaces.length > 0;
  const hasWishlists = wishlists.length > 0;

  if (!hasFavorites && !hasWishlists && !creating) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="empty-saved">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 mb-2">No saved spaces yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mb-4">
            Browse spaces and tap the heart icon to save favorites, or create collections to organize them.
          </p>
          <Button
            onClick={() => setCreating(true)}
            size="sm"
            variant="outline"
            data-testid="button-create-first-collection"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Collection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Favorites Section */}
      {hasFavorites && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" />
            Favorites
          </h3>
          <div className="grid gap-3">
            {favoriteSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden border border-gray-100" data-testid={`card-favorite-${space.id}`}>
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {(space.imageUrls as string[])?.[0] ? (
                      <img src={(space.imageUrls as string[])[0]} alt={space.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{space.name}</h4>
                    {space.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {space.address}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">${space.pricePerHour}/hr</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeFavorite.mutate(space.id)}
                      className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                      data-testid={`button-unfavorite-${space.id}`}
                    >
                      <Heart className="w-4 h-4 text-stone-600 fill-stone-600" strokeWidth={2.5} />
                    </button>
                    <a href={`/spaces/${space.slug}`} className="text-xs text-[#c4956a] hover:underline" data-testid={`link-view-space-${space.id}`}>
                      View
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Collections Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <FolderHeart className="w-3.5 h-3.5" />
            Collections
          </h3>
          {!creating && (
            <Button
              onClick={() => setCreating(true)}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              data-testid="button-create-collection"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          )}
        </div>

        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Collection name..."
                      className="flex-1"
                      data-testid="input-collection-name"
                      onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) createMutation.mutate(newName.trim()); }}
                    />
                    <Button
                      size="sm"
                      onClick={() => createMutation.mutate(newName.trim())}
                      disabled={!newName.trim() || createMutation.isPending}
                      className="bg-gray-900 text-white hover:bg-black"
                      data-testid="button-save-collection"
                    >
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setCreating(false); setNewName(""); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasWishlists && !creating ? (
          <p className="text-xs text-gray-400 text-center py-4">No collections yet. Create one to organize your saved spaces.</p>
        ) : (
          <div className="space-y-3">
            {wishlists.map((wl) => (
              <Card key={wl.id} className="bg-white overflow-hidden" data-testid={`card-wishlist-${wl.id}`}>
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => { if (renamingId !== wl.id) setExpandedId(expandedId === wl.id ? null : wl.id); }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {renamingId === wl.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            data-testid={`input-rename-${wl.id}`}
                            onKeyDown={(e) => { if (e.key === "Enter" && renameValue.trim()) renameMutation.mutate({ id: wl.id, name: renameValue.trim() }); if (e.key === "Escape") setRenamingId(null); }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => renameMutation.mutate({ id: wl.id, name: renameValue.trim() })}
                            disabled={!renameValue.trim() || renameMutation.isPending}
                          >
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setRenamingId(null)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <FolderHeart className="w-4 h-4 text-[#c4956a] flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-sm truncate">{wl.name}</span>
                          <Badge className="bg-stone-100 text-stone-600 text-[10px]">{wl.itemCount} space{wl.itemCount !== 1 ? "s" : ""}</Badge>
                        </>
                      )}
                    </div>
                    {renamingId !== wl.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenamingId(wl.id); setRenameValue(wl.name); }}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          data-testid={`button-rename-${wl.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(wl.id); }}
                          className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          data-testid={`button-delete-collection-${wl.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === wl.id ? null : wl.id); }}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          data-testid={`button-expand-${wl.id}`}
                        >
                          {expandedId === wl.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedId === wl.id && wl.items && wl.items.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-100"
                      >
                        <div className="space-y-2">
                          {wl.items.map((item: any) => (
                            <div key={item.spaceId || item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                              <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.spaceName || "Space"} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Building2 className="w-4 h-4 text-gray-300" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.spaceName || "Space"}</p>
                                {item.address && <p className="text-xs text-gray-500 truncate">{item.address}</p>}
                              </div>
                              <button
                                onClick={() => removeItemMutation.mutate({ collectionId: wl.id, spaceId: item.spaceId || item.id })}
                                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                data-testid={`button-remove-item-${item.spaceId || item.id}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {expandedId === wl.id && (!wl.items || wl.items.length === 0) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-100"
                      >
                        <p className="text-xs text-gray-400 text-center py-3">No spaces in this collection yet.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecurringBookingsSection() {
  const { toast } = useToast();
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const { data: recurringBookings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/recurring-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/recurring-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/recurring-bookings/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-bookings"] });
      toast({ title: "Recurring booking updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/recurring-bookings/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-bookings"] });
      toast({ title: "Recurring booking confirmed!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/recurring-bookings/${id}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-bookings"] });
      toast({ title: "Recurring booking declined" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return null;
  if (recurringBookings.length === 0) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": case "active":
        return <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case "pending_confirmation":
        return <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 animate-pulse">Pending</Badge>;
      case "paused":
        return <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Paused</Badge>;
      case "declined":
        return <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200">Declined</Badge>;
      case "cancelled":
        return <Badge className="text-[10px] bg-stone-100 text-stone-500 border-stone-200">Cancelled</Badge>;
      default:
        return <Badge className="text-[10px] bg-gray-100 text-gray-600">{status}</Badge>;
    }
  };

  // Check if user can confirm/decline (they're the other party from the requester)
  const canConfirm = (rb: any) => {
    if (rb.status !== "pending_confirmation") return false;
    // If the requester was the guest, only the host can confirm (role === "host")
    // If the requester was the host, only the guest can confirm (role === "guest")
    return (rb.requestedByRole === "guest" && rb.role === "host") ||
           (rb.requestedByRole === "host" && rb.role === "guest");
  };

  const isActiveStatus = (status: string) => status === "active" || status === "confirmed";

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <Repeat className="w-3.5 h-3.5" />
        Recurring Bookings
      </h3>
      {recurringBookings.map((rb: any) => (
        <Card key={rb.id} className={`overflow-hidden ${rb.status === "pending_confirmation" ? "border-2 border-amber-200" : "border border-gray-100"}`} data-testid={`card-recurring-${rb.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {rb.spaceImage && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={rb.spaceImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{rb.spaceName || "Space"}</h4>
                    {getStatusBadge(rb.status)}
                    {rb.role && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        rb.role === "host" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      }`}>
                        {rb.role === "host" ? "Host" : "Guest"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {DAY_NAMES[rb.dayOfWeek] || `Day ${rb.dayOfWeek}`}
                    </span>
                    {rb.startTime && <span>{rb.startTime}</span>}
                    {rb.hours && <span>{rb.hours}hr{rb.hours > 1 ? "s" : ""}</span>}
                    {rb.pricePerHour > 0 && (
                      <span className="font-medium text-gray-700">
                        {rb.discountActive ? (
                          <>
                            <span className="line-through text-gray-400 mr-1">${rb.pricePerHour}/hr</span>
                            <span className="text-emerald-600">${rb.effectiveRate}/hr</span>
                          </>
                        ) : (
                          <>${rb.pricePerHour}/hr</>
                        )}
                      </span>
                    )}
                  </div>
                  {rb.recurringDiscountPercent > 0 && (
                    <div className="mt-1.5">
                      {rb.discountActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-medium">
                          <Check className="w-2.5 h-2.5" />
                          {rb.recurringDiscountPercent}% recurring discount applied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 font-medium">
                          {rb.recurringDiscountPercent}% discount after {rb.recurringDiscountAfter - rb.completedInSeries} more booking{(rb.recurringDiscountAfter - rb.completedInSeries) !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                  {rb.status === "pending_confirmation" && (
                    <p className="text-xs text-amber-600 mt-1.5 font-medium">
                      {canConfirm(rb) ? "Awaiting your confirmation" : "Waiting for other party to confirm"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Confirmation buttons */}
                {canConfirm(rb) && (
                  <>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => confirmMutation.mutate(rb.id)}
                      disabled={confirmMutation.isPending || declineMutation.isPending}
                      data-testid={`button-confirm-${rb.id}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => declineMutation.mutate(rb.id)}
                      disabled={confirmMutation.isPending || declineMutation.isPending}
                      data-testid={`button-decline-${rb.id}`}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Decline
                    </Button>
                  </>
                )}
                {/* Active/confirmed management buttons */}
                {isActiveStatus(rb.status) && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: rb.id, status: "paused" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-pause-${rb.id}`}
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => updateStatusMutation.mutate({ id: rb.id, status: "cancelled" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-cancel-recurring-${rb.id}`}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {rb.status === "paused" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: rb.id, status: "confirmed" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-resume-${rb.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => updateStatusMutation.mutate({ id: rb.id, status: "cancelled" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-cancel-recurring-${rb.id}`}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MyBookingsTab() {
  const { data: bookingsData, isLoading } = useQuery<{ guestBookings: any[]; hostBookings: any[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: recurringData = [] } = useQuery<any[]>({
    queryKey: ["/api/recurring-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/recurring-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const guestBookings = (bookingsData?.guestBookings || []).map((b: any) => ({ ...b, _role: "guest" }));
  const hostBookings = (bookingsData?.hostBookings || []).map((b: any) => ({ ...b, _role: "host" }));
  const bookings = [...guestBookings, ...hostBookings];

  // Map bookings for the calendar
  const calendarBookings = bookings.map((b: any) => ({
    id: b.id,
    bookingDate: b.bookingDate,
    bookingStartTime: b.bookingStartTime,
    bookingHours: b.bookingHours,
    spaceName: b.spaceName || "Space",
    spaceImageUrl: b.spaceImageUrl || null,
    status: b.status,
    paymentStatus: b.paymentStatus,
    role: b._role || b.role || "guest",
    recurringBookingId: b.recurringBookingId || null,
  }));

  const { data: allSpaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces?includeSamples=true");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const now = new Date();
  const activeStatuses = ["confirmed", "approved", "checked_in"];
  const pastStatuses = ["confirmed", "completed", "approved", "checked_in"];

  const upcomingBookings = bookings.filter((b: any) => {
    if (!b.bookingDate) return false;
    const bookingDate = new Date(b.bookingDate + "T23:59:59");
    return bookingDate >= now && activeStatuses.includes(b.status);
  });

  const pastBookings = bookings.filter((b: any) => {
    if (!b.bookingDate) return false;
    const bookingDate = new Date(b.bookingDate + "T23:59:59");
    return bookingDate < now && pastStatuses.includes(b.status);
  });

  if (upcomingBookings.length === 0 && pastBookings.length === 0 && recurringData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="empty-my-bookings">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CalendarDays className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-serif text-xl text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Spaces you've booked will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const spaceMap = new Map(allSpaces.map(s => [s.id, s]));

  const formatBookingDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatBookingTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatPaidDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const renderBookingCard = (booking: any, variant: "upcoming" | "past") => {
    const space = spaceMap.get(booking.spaceId);
    const isExpanded = expandedBookingId === booking.id;
    const amount = booking._role === "host"
      ? (booking.hostPayoutAmount || booking.hostEarnings || 0)
      : (booking.totalGuestCharged || booking.paymentAmount || 0);
    const amountLabel = booking._role === "host" ? "earned" : "paid";

    return (
      <Card key={booking.id} className="overflow-hidden border border-gray-100" data-testid={`card-${variant}-booking-${booking.id}`}>
        {/* Collapsed row — always visible */}
        <button
          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-50/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-medium text-gray-900 text-sm truncate">{booking.spaceName || space?.name || "Space"}</h4>
              <span className={`text-[9px] font-semibold px-1.5 py-0 rounded-full border ${
                booking._role === "host" ? "bg-violet-50 text-violet-600 border-violet-200" : "bg-sky-50 text-sky-600 border-sky-200"
              }`}>
                {booking._role === "host" ? "Hosting" : "Renting"}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {booking.bookingDate ? formatBookingDate(booking.bookingDate) : "TBD"}
              {amount > 0 && (
                <span className="text-stone-400"> · <span className="text-stone-600 font-medium">${(amount / 100).toFixed(2)}</span> {amountLabel}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {booking.status === "checked_in" ? (
              <Badge className="text-[10px] bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                In Session
              </Badge>
            ) : booking.noShow === 1 ? (
              <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200">No-Show</Badge>
            ) : variant === "upcoming" ? (
              <Badge className="text-[10px] bg-blue-50 text-blue-700">Upcoming</Badge>
            ) : (
              <Badge className="text-[10px] bg-stone-100 text-stone-600">Completed</Badge>
            )}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </div>
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                <div className="flex gap-3 mt-3">
                  {space && (space.imageUrls as string[])?.[0] && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={(space.imageUrls as string[])[0]} alt={space?.name || "Space"} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-stone-600">
                      {booking.bookingStartTime && (
                        <>{formatBookingTime(booking.bookingStartTime)} · </>
                      )}
                      {booking.bookingHours}hr{(booking.bookingHours || 0) > 1 ? "s" : ""}
                      {booking._role === "host" && booking.userName && (
                        <span className="text-stone-400"> · {booking.userName}</span>
                      )}
                    </p>
                    {booking.createdAt && (
                      <p className="text-[11px] text-stone-400">Booked {formatPaidDate(booking.createdAt)}</p>
                    )}
                    {booking.checkedInAt && (
                      <p className="text-[11px] text-stone-400 flex items-center gap-2">
                        <span>In: {new Date(booking.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                        {booking.checkedOutAt && <span>Out: {new Date(booking.checkedOutAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>}
                        {(booking.overtimeMinutes ?? 0) > 0 && <span className="text-amber-600">{booking.overtimeMinutes}m overtime</span>}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {booking.feeTier === "repeat_guest" && (
                        <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          <Star className="w-2.5 h-2.5 mr-0.5" /> Loyalty
                        </Badge>
                      )}
                      {booking.feeTier === "host_referred" && (
                        <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Referred</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar View */}
      <BookingCalendar
        bookings={calendarBookings}
        recurringBookings={recurringData}
      />

      {/* Recurring Bookings Management */}
      <RecurringBookingsSection />

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Upcoming ({upcomingBookings.length})</h3>
          {upcomingBookings.map((booking: any) => renderBookingCard(booking, "upcoming"))}
        </div>
      )}

      {/* Past */}
      {pastBookings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Past ({pastBookings.length})</h3>
          {pastBookings.map((booking: any) => renderBookingCard(booking, "past"))}
        </div>
      )}
    </div>
  );
}

function MySpacesTab() {
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const { data: mySpaces = [], isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <StripeConnectSection hasSpaces={mySpaces.length > 0} />

      {/* Host Guide — prominent button near the top */}
      {mySpaces.length > 0 && (
        <>
          <button
            onClick={() => setShowGuide(true)}
            className="w-full rounded-xl border border-[#c4956a]/20 bg-[#c4956a]/5 px-5 py-3.5 text-left flex items-center justify-between hover:bg-[#c4956a]/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c4956a]/15 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#c4956a]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Host Guide</h3>
                <p className="text-[11px] text-stone-500">Tips on pricing, bookings, referrals, and more</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
          <AnimatePresence>
            {showGuide && (
              <motion.div
                className="fixed inset-0 z-[2000] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGuide(false)}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
                  initial={{ y: 40, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 40, opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", damping: 28, stiffness: 350 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-[#c4956a]" />
                      <h2 className="font-serif text-lg font-bold text-stone-900">Host Guide</h2>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4 text-stone-500" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <HostGuideContent />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 text-sm">Your Listings</h3>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="bg-gray-900 text-white hover:bg-black"
            data-testid="button-add-space"
          >
            <Plus className="w-4 h-4 mr-1" />
            List a Space
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <NewSpaceForm onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {spacesLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : mySpaces.length === 0 && !showForm ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="empty-spaces">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-serif text-xl text-gray-900 mb-2">No spaces listed</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              Have a workspace in Miami? List it here and connect with professionals looking for a space.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-gray-900 text-white hover:bg-black" data-testid="button-add-space-empty">
              <Plus className="w-4 h-4 mr-1" /> List Your First Space
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mySpaces.map((space) => (
            <SpaceCard key={space.id} space={space} statusColors={statusColors} />
          ))}
        </div>
      )}

    </div>
  );
}

interface ReferralLink {
  id: string;
  hostId: string;
  spaceId: string | null;
  uniqueCode: string;
  clickCount: number;
  bookingCount: number;
  totalRevenueGenerated: number;
  spaceName: string;
  spaceSlug: string;
  savedAmount: number;
  createdAt: string;
}

function EarningsTab() {
  const { toast } = useToast();
  const [showPerformance, setShowPerformance] = useState(false);

  // Analytics data (merged from former HostAnalyticsTab)
  const { data: analytics } = useQuery<{
    spaces: Array<{
      id: string; name: string; bookingCount: number; completedBookings: number;
      revenue: number; avgRating: number | null; occupancyRate: number | null;
    }>;
    totals: { totalBookings: number; completedBookings: number; totalRevenue: number; avgRating: number | null };
  }>({
    queryKey: ["/api/host/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/host/analytics", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Earnings data
  const { data: earningsData, isLoading: earningsLoading } = useQuery<{
    hasSpaces: boolean;
    allTime: { totalEarnings: number; totalHostFees: number; bookingCount: number; avgFeePercent: string };
    thisMonth: { earnings: number; hostFees: number; bookingCount: number; savedVsPeerspace: number };
    tierBreakdown: { standard: number; referral: number; repeat: number };
  }>({
    queryKey: ["/api/host/earnings"],
    queryFn: async () => {
      const res = await fetch("/api/host/earnings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Payouts data
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery<{
    payouts: Array<{
      id: string; spaceName: string; bookingDate: string; bookingHours: number;
      bookingAmount: number; hostFeeAmount: number; feeTier: string;
      payoutAmount: number; payoutStatus: string; createdAt: string;
    }>;
    summary: { totalEarnings: number; totalPaid: number; totalPending: number; payoutCount: number; savedVsPeerspace: number };
  }>({
    queryKey: ["/api/host/payouts"],
    queryFn: async () => {
      const res = await fetch("/api/host/payouts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Referral links data
  const { data: mySpaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: links = [], isLoading: linksLoading } = useQuery<ReferralLink[]>({
    queryKey: ["/api/host/referral-links"],
    queryFn: async () => {
      const res = await fetch("/api/host/referral-links", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (spaceId: string | null) => {
      const res = await apiRequest("POST", "/api/host/referral-links", { spaceId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/host/referral-links"] });
      toast({ title: "Referral link created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/host/referral-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/host/referral-links"] });
      toast({ title: "Referral link removed" });
    },
  });

  const copyLink = (code: string, spaceSlug?: string) => {
    const baseUrl = window.location.origin;
    const url = spaceSlug
      ? `${baseUrl}/spaces/${spaceSlug}?ref=${code}`
      : `${baseUrl}/workspaces?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const shareLink = (code: string, spaceSlug?: string, spaceName?: string) => {
    const baseUrl = window.location.origin;
    const url = spaceSlug
      ? `${baseUrl}/spaces/${spaceSlug}?ref=${code}`
      : `${baseUrl}/workspaces?ref=${code}`;
    const text = spaceName
      ? `Check out ${spaceName} on Align`
      : "Check out these workspaces on Align";

    if (navigator.share) {
      navigator.share({ title: text, url }).catch(() => {});
    } else {
      copyLink(code, spaceSlug);
    }
  };

  if (earningsLoading || payoutsLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!earningsData?.hasSpaces || !earningsData.allTime) {
    return (
      <div className="text-center py-12 text-stone-500">
        <DollarSign className="w-8 h-8 mx-auto mb-3 text-stone-300" />
        <p className="text-sm font-medium mb-1">No earnings yet</p>
        <p className="text-xs text-stone-400">Earnings will appear here once guests book your spaces.</p>
      </div>
    );
  }

  const tierLabels: Record<string, string> = { standard: "Standard", referral: "Referred", repeat: "Repeat guest" };

  const payoutStatusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    processing: "bg-blue-50 text-blue-700",
    pending: "bg-amber-50 text-amber-700",
    held: "bg-red-50 text-red-700",
  };

  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
  const totalBookings = links.reduce((sum, l) => sum + (l.bookingCount || 0), 0);
  const totalRevenue = links.reduce((sum, l) => sum + (l.totalRevenueGenerated || 0), 0);
  const totalSaved = links.reduce((sum, l) => sum + (l.savedAmount || 0), 0);
  const hasMasterLink = links.some(l => !l.spaceId);

  return (
    <div className="space-y-5">
      {/* 1. Savings callout */}
      {earningsData.thisMonth.savedVsPeerspace > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-sm text-emerald-800">
            You saved <strong>${(earningsData.thisMonth.savedVsPeerspace / 100).toFixed(2)}</strong> vs Peerspace's 20% fee this month
          </p>
        </div>
      )}

      {/* 2. Summary cards - merged earnings + payouts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">This Month</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">${(earningsData.thisMonth.earnings / 100).toFixed(2)}</p>
          <p className="text-xs text-stone-400 mt-0.5">{earningsData.thisMonth.bookingCount} booking{earningsData.thisMonth.bookingCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">All Time</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">${(earningsData.allTime.totalEarnings / 100).toFixed(2)}</p>
          <p className="text-xs text-stone-400 mt-0.5">{earningsData.allTime.bookingCount} booking{earningsData.allTime.bookingCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {payoutsData?.summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
            <p className="text-lg font-semibold text-stone-900">${(payoutsData.summary.totalPaid / 100).toFixed(0)}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Paid Out</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
            <p className="text-lg font-semibold text-stone-900">${(payoutsData.summary.totalPending / 100).toFixed(0)}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
            <p className="text-lg font-semibold text-emerald-700">${(payoutsData.summary.savedVsPeerspace / 100).toFixed(0)}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Saved</p>
          </div>
        </div>
      )}

      {/* 3. Tier breakdown */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Bookings by Type</p>
        <div className="space-y-2.5">
          {Object.entries(earningsData.tierBreakdown).filter(([, count]) => count > 0).map(([tier, count]) => {
            const total = earningsData.allTime.bookingCount || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={tier}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-600">{tierLabels[tier] || tier}</span>
                  <span className="text-stone-800 font-medium">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: tier === "referral" ? "#c4956a" : tier === "repeat" ? "#f59e0b" : "#78716c",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avg fee */}
      <div className="flex items-center justify-between bg-stone-50 rounded-lg px-4 py-3">
        <span className="text-sm text-stone-600">Average service fee</span>
        <span className="text-sm font-semibold text-stone-800">{earningsData.allTime.avgFeePercent}%</span>
      </div>

      {/* 4. Payout history list */}
      {payoutsData?.payouts && payoutsData.payouts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider pt-2">Payout History</h3>
          <div className="space-y-2">
            {payoutsData.payouts.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{p.spaceName}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                    <CalendarDays className="w-3 h-3" />
                    {p.bookingDate} · {p.bookingHours}hr
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-stone-900">${(p.payoutAmount / 100).toFixed(2)}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${payoutStatusStyles[p.payoutStatus] || "bg-stone-100 text-stone-600"}`}>
                      {p.payoutStatus === "paid" ? "Paid" : p.payoutStatus === "processing" ? "Processing" : p.payoutStatus === "held" ? "On hold" : "Pending"}
                    </span>
                    {p.payoutStatus === "paid" && (
                      <span className="text-[9px] text-emerald-600 font-medium">Fast pay</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Referral links section */}
      <div className="border-t border-stone-200 pt-5 mt-2 space-y-6">
        <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Referral Links</h3>

        {/* Referral stats summary */}
        {links.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Link clicks", value: totalClicks.toLocaleString() },
              { label: "Bookings", value: totalBookings.toLocaleString() },
              { label: "Revenue", value: `$${(totalRevenue / 100).toFixed(0)}` },
              { label: "Fee savings", value: `$${(totalSaved / 100).toFixed(0)}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-stone-50 rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-stone-900">{value}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        )}

        {totalSaved > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
            Your referral bookings saved you <strong>${(totalSaved / 100).toFixed(2)}</strong> in service fees
          </div>
        )}

        {/* Generate links */}
        {mySpaces.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Create referral links</p>
            <div className="space-y-2">
              {!hasMasterLink && (
                <button
                  onClick={() => createMutation.mutate(null)}
                  disabled={createMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-stone-300 hover:border-[#c4956a] hover:bg-stone-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#c4956a]/10 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-4 h-4 text-[#c4956a]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Master referral link</p>
                    <p className="text-xs text-stone-400">One link for all your listings — lower service fee on referred bookings</p>
                  </div>
                </button>
              )}
              {mySpaces
                .filter(space => !links.some(l => l.spaceId === space.id))
                .map(space => (
                  <button
                    key={space.id}
                    onClick={() => createMutation.mutate(space.id)}
                    disabled={createMutation.isPending}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-stone-300 hover:border-[#c4956a] hover:bg-stone-50 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {space.imageUrls?.[0] ? (
                        <img src={space.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">{space.name}</p>
                      <p className="text-xs text-stone-400">Create link for this space</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Existing links */}
        {linksLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        ) : links.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Your referral links</p>
            {links.map((link) => {
              const url = link.spaceSlug
                ? `${window.location.origin}/spaces/${link.spaceSlug}?ref=${link.uniqueCode}`
                : `${window.location.origin}/workspaces?ref=${link.uniqueCode}`;

              return (
                <div key={link.id} className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-[#c4956a]" />
                      <span className="text-sm font-medium text-stone-800">{link.spaceName}</span>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(link.id)}
                      className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={url}
                      className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-500 truncate"
                    />
                    <button
                      onClick={() => copyLink(link.uniqueCode, link.spaceSlug)}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
                      title="Copy link"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                    </button>
                    <button
                      onClick={() => shareLink(link.uniqueCode, link.spaceSlug, link.spaceName)}
                      className="p-2 rounded-lg bg-[#c4956a]/10 hover:bg-[#c4956a]/20 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#c4956a]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> {link.clickCount || 0} clicks
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {link.bookingCount || 0} bookings
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> ${((link.totalRevenueGenerated || 0) / 100).toFixed(0)} revenue
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* How it works */}
        <div className="bg-stone-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-stone-600">How referral links work</p>
          <ul className="text-xs text-stone-500 space-y-1.5">
            <li>Share your link with clients — when they book through it, your service fee is lower</li>
            <li>Your clients pay the same fee either way — the savings are yours</li>
            <li>Referral credit lasts 30 days after a client clicks your link</li>
            <li>If a client clicks your link but books a different space from you, the savings still apply</li>
          </ul>
        </div>
      </div>

      {/* 6. Performance (merged from Analytics tab) */}
      {analytics?.totals && (
        <div className="border-t border-stone-200 pt-5 mt-2">
          <button
            onClick={() => setShowPerformance(!showPerformance)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Performance
            </h3>
            {showPerformance ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>

          <AnimatePresence>
            {showPerformance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
                    <p className="text-xl font-semibold text-stone-900">{analytics.totals.totalBookings}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Total Bookings</p>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
                    <p className="text-xl font-semibold text-stone-900">{analytics.totals.completedBookings}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Completed</p>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
                    <p className="text-xl font-semibold text-stone-900">${(analytics.totals.totalRevenue / 100).toFixed(2)}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Revenue</p>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
                    <p className="text-xl font-semibold text-stone-900">
                      {analytics.totals.avgRating != null ? analytics.totals.avgRating.toFixed(1) : "--"}
                    </p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Avg Rating</p>
                  </div>
                </div>

                {analytics.spaces.length > 0 && (
                  <div className="space-y-2">
                    {analytics.spaces.map((space) => (
                      <div key={space.id} className="bg-white rounded-xl border border-stone-200 p-4" data-testid={`analytics-space-${space.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-stone-800 truncate">{space.name}</h4>
                          {space.avgRating != null && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium text-stone-700">{space.avgRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div>
                            <p className="text-lg font-semibold text-stone-900">{space.bookingCount}</p>
                            <p className="text-[10px] text-stone-400 uppercase">Bookings</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-stone-900">{space.completedBookings}</p>
                            <p className="text-[10px] text-stone-400 uppercase">Completed</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-stone-900">${(space.revenue / 100).toFixed(2)}</p>
                            <p className="text-[10px] text-stone-400 uppercase">Revenue</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-stone-900">
                              {space.occupancyRate != null ? `${Math.round(space.occupancyRate)}%` : "--"}
                            </p>
                            <p className="text-[10px] text-stone-400 uppercase">Occupancy</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// WishlistsTab removed — merged into SavedTab above
// HostAnalyticsTab removed — merged into EarningsTab above

// ── Host Guide ──────────────────────────────────────────────────────
type HostGuideSection = {
  icon: any;
  title: string;
  description: string;
  details: string[];
  status?: "complete" | "action-needed";
};

function HostGuideContent() {
  const { data: mySpaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: connectStatus } = useQuery<{
    connected: boolean;
    onboardingComplete: boolean;
  }>({
    queryKey: ["/api/stripe/connect/status"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/connect/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: referralLinks = [] } = useQuery<any[]>({
    queryKey: ["/api/host/referral-links"],
    queryFn: async () => {
      const res = await fetch("/api/host/referral-links", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: arrivalGuides = [] } = useQuery<{ spaceId: string }[]>({
    queryKey: ["/api/my-spaces/arrival-guides-status"],
    queryFn: async () => {
      // Check each space for an arrival guide
      const results: { spaceId: string }[] = [];
      for (const space of mySpaces) {
        try {
          const res = await fetch(`/api/spaces/${space.id}/arrival-guide`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data) results.push({ spaceId: space.id });
          }
        } catch {}
      }
      return results;
    },
    enabled: mySpaces.length > 0,
  });

  const hasListing = mySpaces.length > 0;
  const stripeConnected = connectStatus?.onboardingComplete ?? false;
  const hasReferralLink = referralLinks.length > 0;
  const hasArrivalGuide = arrivalGuides.length > 0;

  // Quick start steps
  const quickStartSteps = [
    { label: "List Your Space", done: hasListing, tab: "my-spaces" as const },
    { label: "Connect Stripe", done: stripeConnected, tab: "earnings" as const },
    { label: "Share Your Link", done: hasReferralLink, tab: "earnings" as const },
  ];
  const firstIncompleteStep = quickStartSteps.find((s) => !s.done);
  const allComplete = quickStartSteps.every((s) => s.done);

  const phases: {
    label: string;
    number: number;
    description: string;
    featured?: boolean;
    sections: HostGuideSection[];
  }[] = [
    {
      label: "Getting Started",
      number: 1,
      description: "The essentials to start earning",
      featured: true,
      sections: [
        {
          icon: Building2,
          title: "List Your Space",
          description: "Create a listing with photos, pricing, amenities, and availability. Once submitted, our team reviews and approves it.",
          status: hasListing ? "complete" : "action-needed",
          details: [
            "Set your own hourly and daily rates — you control the pricing",
            "Showcase your space with multiple photos via simple drag & drop",
            "Set your weekly availability so guests only book when you're open",
            "Avoid back-to-back stress — add buffer time between bookings (5–60 min)",
            "Protect yourself with the right cancellation policy: Flexible, Moderate, or Strict",
            "Attract your ideal guests — target specific professions like therapists or photographers",
          ],
        },
        {
          icon: DollarSign,
          title: "Earnings & Fees",
          description: "You keep the majority of every booking. Align takes a small platform fee so we can keep running.",
          details: [
            "Keep 87.5% of every booking — our standard host fee is just 12.5%",
            "Save even more with referrals — your host fee drops to 8% on referred bookings",
            "Offer recurring booking discounts (up to 50% off) to attract weekly regulars",
            "Your payout is never affected by guest fees — they pay a separate 5–7% + tax",
            "Get paid directly to your bank account through Stripe Connect",
            "Stay on top of your income — track earnings, payouts, and savings in the Earnings tab",
          ],
        },
        {
          icon: CreditCard,
          title: "Stripe Connect",
          description: "Connect your Stripe account to receive payouts directly to your bank. This is required to receive payments.",
          status: stripeConnected ? "complete" : "action-needed",
          details: [
            "Get set up in minutes — one-time onboarding through Stripe's secure flow",
            "Receive payouts on Stripe's standard schedule, directly to your bank",
            "Hands-off payments — guests pay and you receive funds automatically",
            "No Stripe account yet? Align holds your funds and transfers them after the booking completes",
          ],
        },
      ],
    },
    {
      label: "Managing Your Space",
      number: 2,
      description: "Tools to run your space smoothly",
      sections: [
        {
          icon: CalendarDays,
          title: "Booking Management",
          description: "Manage all your incoming bookings from the My Spaces tab. Communicate with guests before and after booking.",
          details: [
            "Answer questions before they book — guests can message you with direct inquiries",
            "Know exactly when guests arrive and leave — overtime is flagged automatically",
            "Stay in control of schedule changes — approve or decline reschedule requests",
            "Protect your time — mark no-shows so you have a record if a guest doesn't arrive",
            "Never miss an appointment — bookings auto-sync to your Google Calendar",
          ],
        },
        {
          icon: Repeat,
          title: "Recurring Bookings & Discounts",
          description: "Build steady income with weekly recurring bookings. Offer a discount to reward loyal guests who commit to a regular schedule.",
          details: [
            "Guests or hosts can propose a recurring weekly booking — the other party confirms or declines",
            "Individual bookings are auto-created each week, so both sides have full visibility",
            "Set a recurring discount (up to 50%) in your space settings to incentivize regulars",
            "Control when the discount kicks in — immediately, or after 1, 2, 3, 5, or 10 completed bookings",
            "Guests see the discount on your listing page and in their recurring booking card",
            "Pause or cancel a recurring series anytime — both host and guest have full control",
            "If a guest has 3 consecutive unpaid bookings, the series auto-pauses to protect you",
          ],
        },
        {
          icon: MapPin,
          title: "Arrival Guide",
          description: "Help guests find your space with step-by-step visual directions, WiFi credentials, and access codes. On the day of their booking, guests automatically receive the guide by email.",
          status: hasArrivalGuide ? "complete" : "action-needed",
          details: [
            "Add up to 6 photo steps — show parking, entrance, wayfinding, and your door",
            "Share WiFi name, password, and door/gate codes securely with confirmed guests",
            "Include extra notes for anything guests should know before arriving",
            "Guests receive the arrival guide by email on the morning of their booking",
            "The guide is also accessible in the guest's portal for confirmed bookings",
            "Edit your arrival guide anytime from the My Spaces tab when editing a space",
          ],
        },
        {
          icon: CalendarDays,
          title: "Calendar Sync",
          description: "Connect your Google Calendar or import iCal feeds from other platforms to prevent double bookings. Your Align bookings also export as a feed for other platforms.",
          details: [
            "Connect your Google Calendar to automatically block times when you're busy",
            "Import iCal feeds from Peerspace, Airbnb, or any platform that exports .ics URLs",
            "Your Align calendar exports as a feed — paste the URL into other platforms to sync both ways",
            "External events sync every 15 minutes — no manual updates needed",
            "Blocked times from external calendars show as unavailable to guests booking your space",
          ],
        },
        {
          icon: Star,
          title: "Reviews & Badges",
          description: "After completed bookings, guests can leave reviews. High performance earns you badges that appear on your listing.",
          details: [
            "Build relationships — respond to guest reviews directly from your portal",
            "Stand out with earned badges: Superhost (90%+ response rate + 5 bookings), Responsive, Experienced",
            "Showcase quality — earn the Top Rated badge with 4.5+ stars and 3+ reviews",
            "Build instant credibility — all approved listings get a Verified badge",
            "Get noticed as a newcomer — the New badge shows automatically for your first 30 days",
          ],
        },
        {
          icon: TrendingUp,
          title: "Analytics Dashboard",
          description: "Track your performance across all your spaces in the Analytics tab.",
          details: [
            "See the full picture — total bookings, completions, and cancellations at a glance",
            "Know what's working — view revenue breakdown per space",
            "Track your reputation — monitor your average rating and review count",
            "Optimize your schedule — occupancy rate estimates show your space's demand",
          ],
        },
      ],
    },
    {
      label: "Growing Your Business",
      number: 3,
      description: "Reach more guests and earn more",
      sections: [
        {
          icon: Link2,
          title: "Referral Program",
          description: "Generate referral links to share with potential guests. When they book through your link, you pay a lower host fee.",
          status: hasReferralLink ? "complete" : "action-needed",
          details: [
            "Share one link for all your spaces or create links for specific listings",
            "Promote anywhere — social media, email, or embed on your own website",
            "Keep more of each booking — referred bookings cost you only 8% (vs 12.5% standard)",
            "See what's working — track clicks, bookings, and revenue per link",
            "Guests have 30 days to book after clicking your link — you still get credit",
          ],
        },
        {
          icon: Share2,
          title: "Visibility & Discovery",
          description: "Your space is discoverable by guests through search, map view, and recommendations.",
          details: [
            "Get found when it matters — guests can search by date and time availability",
            "Show up on the map — your space appears with a location pin filtered by type",
            "Get recommended — your space shows in \"You might also like\" on similar listings",
            "Stay top of mind — guests can save your space to wishlists and favorites",
            "Build trust with speed — your response time shows on your listing, and fast replies rank higher",
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="font-serif text-xl font-bold text-[#2c2420]">Host Guide</h2>
        <p className="text-sm text-[#8a7e72] mt-1">Your roadmap to hosting on Align</p>
      </div>

      {/* Quick Start Banner */}
      <div className="bg-[#faf8f5] border border-[#e0d5c7] rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B] mb-3">
          {allComplete ? "You're all set" : "Quick Start"}
        </p>
        <div className="flex items-center gap-0">
          {quickStartSteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  step.done
                    ? "bg-[#B8860B] text-white"
                    : "border-[1.5px] border-[#B8860B] text-[#B8860B]"
                }`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium truncate ${step.done ? "text-[#8a7e72] line-through" : "text-[#2c2420]"}`}>
                  {step.label}
                </span>
              </div>
              {i < quickStartSteps.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${step.done ? "bg-[#B8860B]" : "bg-[#d4c5b0]"}`} />
              )}
            </div>
          ))}
        </div>
        {firstIncompleteStep && (
          <button
            onClick={() => {
              const tabButton = document.querySelector(`[data-testid="tab-spaces-${firstIncompleteStep.tab}"]`);
              if (tabButton) (tabButton as HTMLButtonElement).click();
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2c2420] text-white text-xs font-medium hover:bg-[#1a1a1a] transition-colors"
          >
            {firstIncompleteStep.label === "List Your Space" && "Create Your First Listing"}
            {firstIncompleteStep.label === "Connect Stripe" && "Connect Stripe Account"}
            {firstIncompleteStep.label === "Share Your Link" && "Create a Referral Link"}
            <ChevronDown className="w-3 h-3 -rotate-90" />
          </button>
        )}
      </div>

      {/* Phases */}
      {phases.map((phase) => (
        <div key={phase.number}>
          {/* Phase header */}
          <div className="flex items-center gap-3 mb-3 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B]">
              Phase {phase.number}
            </span>
            <div className="h-px flex-1 bg-[#e0d5c7]" />
          </div>
          <div className="mb-4">
            <h3 className="font-serif text-base font-semibold text-[#2c2420]">{phase.label}</h3>
            <p className="text-xs text-[#8a7e72] mt-0.5">{phase.description}</p>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {phase.sections.map((section) => (
              <HostGuideCard key={section.title} section={section} featured={phase.featured} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HostGuideCard({ section, featured }: { section: HostGuideSection; featured?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = section.icon;

  return (
    <div className={`rounded-xl overflow-hidden ${
      featured
        ? "border-[1.5px] border-[#d4c5b0] bg-[#faf8f5]/40"
        : "border border-stone-200"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3.5 p-4 text-left hover:bg-[#faf8f5]/60 transition-colors"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          featured ? "bg-[#B8860B]/10" : "bg-stone-100"
        }`}>
          <Icon className={`w-4.5 h-4.5 ${featured ? "text-[#B8860B]" : "text-stone-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#2c2420]">{section.title}</h3>
            {section.status === "complete" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            {section.status === "action-needed" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#8a7e72] bg-stone-100 px-2 py-0.5 rounded-full">
                Set up
              </span>
            )}
          </div>
          <p className="text-xs text-[#8a7e72] mt-0.5 leading-relaxed">{section.description}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#B8860B]/60 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#B8860B]/60 flex-shrink-0 mt-1" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 pl-16">
              <ul className="space-y-1.5">
                {section.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#5c5248]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B8860B]/70 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SpacesTabKey = "calendar" | "saved" | "my-spaces" | "earnings";

// Map legacy tab values to new consolidated tabs
function resolveLegacyTab(tab: string): SpacesTabKey {
  switch (tab) {
    case "favorites": case "wishlists": return "saved";
    case "my-bookings": case "past": return "calendar";
    case "analytics": case "host-guide": case "payouts": case "referrals": return "earnings";
    case "my-spaces": return "my-spaces";
    case "earnings": return "earnings";
    case "calendar": return "calendar";
    case "saved": return "saved";
    default: return "calendar";
  }
}

export default function PortalSpacesSection({ userId, initialTab }: { userId: string; initialTab?: string }) {
  const resolvedInitialTab = initialTab ? resolveLegacyTab(initialTab) : undefined;
  const [spacesTab, setSpacesTab] = useState<SpacesTabKey>(resolvedInitialTab || "calendar");
  const [tabResolved, setTabResolved] = useState(!!initialTab);

  // Fetch counts to auto-detect best sub-tab
  const { data: mySpaces = [], isLoading: mySpacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery<{ guestBookings: any[]; hostBookings: any[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (tabResolved) return;
    if (mySpacesLoading || bookingsLoading) return;

    const hasMySpaces = mySpaces.length > 0;
    const allBookings = [...(bookingsData?.guestBookings || []), ...(bookingsData?.hostBookings || [])];
    const hasBookings = allBookings.length > 0;

    // Default to calendar if user has bookings, otherwise my-spaces for hosts, saved for guests
    if (hasBookings) {
      setSpacesTab("calendar");
    } else if (hasMySpaces) {
      setSpacesTab("my-spaces");
    } else {
      setSpacesTab("calendar");
    }

    setTabResolved(true);
  }, [mySpaces, bookingsData, tabResolved, mySpacesLoading, bookingsLoading]);

  const isHost = mySpaces.length > 0;

  const tabs = [
    { key: "saved" as const, label: "Saved", icon: Heart },
    { key: "calendar" as const, label: "Calendar", icon: CalendarDays },
    { key: "my-spaces" as const, label: "My Workspaces", icon: Building2 },
    ...(isHost ? [{ key: "earnings" as const, label: "Earnings", icon: DollarSign }] : []),
  ];

  const { data: loyaltyData } = useQuery<{
    isRepeatGuest: boolean;
    completedBookings: number;
    lifetimeSavings: number;
  }>({
    queryKey: ["/api/guest/loyalty"],
    queryFn: async () => {
      const res = await fetch("/api/guest/loyalty", { credentials: "include" });
      if (!res.ok) return { isRepeatGuest: false, completedBookings: 0, lifetimeSavings: 0 };
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Repeat guest loyalty badge */}
      {loyaltyData?.isRepeatGuest && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl px-4 py-3" data-testid="loyalty-badge">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800">Repeat Guest</p>
            <p className="text-xs text-stone-500">
              You get a lower service fee on every booking
              {loyaltyData.lifetimeSavings > 0 && (
                <> — you've saved <strong>${(loyaltyData.lifetimeSavings / 100).toFixed(2)}</strong> so far</>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-stone-100 rounded-lg p-1" data-testid="spaces-subtabs">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSpacesTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              spacesTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            data-testid={`tab-spaces-${key}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {spacesTab === "calendar" && <MyBookingsTab />}
      {spacesTab === "saved" && <SavedTab />}
      {spacesTab === "my-spaces" && <MySpacesTab />}
      {spacesTab === "earnings" && <EarningsTab />}
    </div>
  );
}
