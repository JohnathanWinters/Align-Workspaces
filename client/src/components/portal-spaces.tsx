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
  CheckCircle2,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  Heart,
  Clock,
  CalendarDays,
  Share2,
  Link2,
  Copy,
  BarChart3,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";
import { AvailabilityScheduleEditor, scheduleToDisplayText, type WeekSchedule } from "./availability-schedule-editor";

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
              {space.capacity && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{space.capacity} people</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                data-testid={`button-edit-space-${space.id}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <Badge className={statusColors[space.approvalStatus || "pending"]}>
              {space.approvalStatus || "pending"}
            </Badge>
          </div>
        </div>
        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <EditSpaceForm space={space} onClose={() => setEditing(false)} />
            </motion.div>
          )}
        </AnimatePresence>
        <SpacePhotoManager space={space} />
      </CardContent>
    </Card>
  );
}

function EditSpaceForm({ space, onClose }: { space: Space; onClose: () => void }) {
  const { toast } = useToast();
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
    capacity: String(space.capacity || ""),
    amenities: (space.amenities || []).join(", "),
    targetProfession: space.targetProfession || "",
    hostName: space.hostName || "",
    bufferMinutes: String(space.bufferMinutes ?? 15),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        pricePerHour: formData.pricePerHour ? Number(formData.pricePerHour) : undefined,
        pricePerDay: formData.pricePerDay ? Number(formData.pricePerDay) : undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        bufferMinutes: Number(formData.bufferMinutes),
        amenities: formData.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        availabilitySchedule: JSON.stringify(schedule),
        availableHours: scheduleToDisplayText(schedule),
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

  return (
    <div className="space-y-4 pt-3 border-t border-gray-100 mt-3" data-testid={`edit-space-form-${space.id}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Edit Details</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" data-testid={`button-cancel-edit-space-${space.id}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Space Name</label>
          <Input value={formData.name} onChange={(e) => update("name", e.target.value)} data-testid={`edit-input-name-${space.id}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Space Category</label>
          <select
            value={formData.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            data-testid={`edit-select-type-${space.id}`}
          >
            {SPACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Host Name</label>
          <Input value={formData.hostName} onChange={(e) => update("hostName", e.target.value)} data-testid={`edit-input-host-${space.id}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Address</label>
          <Input value={formData.address} onChange={(e) => update("address", e.target.value)} data-testid={`edit-input-address-${space.id}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Neighborhood</label>
          <Input value={formData.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} data-testid={`edit-input-neighborhood-${space.id}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Price/Hour ($)</label>
          <Input type="number" value={formData.pricePerHour} onChange={(e) => update("pricePerHour", e.target.value)} data-testid={`edit-input-price-hour-${space.id}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Price/Day ($)</label>
          <Input type="number" value={formData.pricePerDay} onChange={(e) => update("pricePerDay", e.target.value)} data-testid={`edit-input-price-day-${space.id}`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Capacity</label>
          <Input type="number" value={formData.capacity} onChange={(e) => update("capacity", e.target.value)} data-testid={`edit-input-capacity-${space.id}`} />
        </div>
        <div className="col-span-2">
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
      <AvailabilityScheduleEditor value={schedule} onChange={setSchedule} />
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Buffer Time Between Bookings</label>
        <div className="flex items-center gap-2">
          <select
            value={formData.bufferMinutes}
            onChange={(e) => update("bufferMinutes", e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            data-testid={`edit-select-buffer-${space.id}`}
          >
            <option value="0">No buffer</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Time reserved between bookings for prep or cleanup</p>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
        <Input value={formData.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} data-testid={`edit-input-short-desc-${space.id}`} />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Description</label>
        <Textarea value={formData.description} onChange={(e) => update("description", e.target.value)} rows={3} data-testid={`edit-input-description-${space.id}`} />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Amenities (comma-separated)</label>
        <Input value={formData.amenities} onChange={(e) => update("amenities", e.target.value)} data-testid={`edit-input-amenities-${space.id}`} />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          size="sm"
          className="bg-gray-900 text-white hover:bg-black"
          data-testid={`button-save-edit-space-${space.id}`}
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save Changes
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} data-testid={`button-cancel-edit-space-btn-${space.id}`}>
          Cancel
        </Button>
      </div>
    </div>
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
    capacity: "",
    amenities: "",
    targetProfession: "",
    hostName: "",
    bufferMinutes: "15",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        bufferMinutes: Number(formData.bufferMinutes),
        amenities: formData.amenities.split(",").map((a) => a.trim()).filter(Boolean),
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
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Capacity</label>
            <Input type="number" value={formData.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="6" data-testid="input-space-capacity" />
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
          <label className="text-xs text-gray-500 mb-1 block">Amenities (comma-separated)</label>
          <Input value={formData.amenities} onChange={(e) => update("amenities", e.target.value)} placeholder="Wi-Fi, Parking, AC, Sound insulated" data-testid="input-space-amenities" />
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

function FavoritesTab() {
  const { data: favoriteSpaces = [], isLoading } = useQuery<Space[]>({
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (favoriteSpaces.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="empty-favorites">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Browse spaces and tap the heart icon to save your favorites here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
              <p className="text-xs text-gray-500 mt-1">${space.pricePerHour}/hr · Up to {space.capacity} guests</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => removeFavorite.mutate(space.id)}
                className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                data-testid={`button-unfavorite-${space.id}`}
              >
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </button>
              <a href={`/spaces/${space.slug}`} className="text-xs text-[#c4956a] hover:underline" data-testid={`link-view-space-${space.id}`}>
                View
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PastSpacesTab() {
  const { data: bookingsData, isLoading } = useQuery<{ guest: any[]; host: any[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const bookings = bookingsData?.guest || [];

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
  const pastBookings = bookings.filter((b: any) => {
    if (!b.bookingDate) return false;
    const bookingDate = new Date(b.bookingDate);
    return bookingDate < now && (b.status === "confirmed" || b.status === "completed" || b.status === "approved");
  });

  if (pastBookings.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="empty-past-spaces">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 mb-2">No past bookings</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Spaces you've booked will appear here after your session.
          </p>
        </CardContent>
      </Card>
    );
  }

  const spaceMap = new Map(allSpaces.map(s => [s.id, s]));

  return (
    <div className="grid gap-3">
      {pastBookings.map((booking: any) => {
        const space = spaceMap.get(booking.spaceId);
        return (
          <Card key={booking.id} className="overflow-hidden border border-gray-100" data-testid={`card-past-booking-${booking.id}`}>
            <div className="flex gap-4 p-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {space && (space.imageUrls as string[])?.[0] ? (
                  <img src={(space.imageUrls as string[])[0]} alt={space?.name || "Space"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-300" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">{space?.name || "Space"}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <CalendarDays className="w-3 h-3" />
                  {booking.bookingDate} · {booking.bookingStartTime} · {booking.bookingHours}hr
                </p>
                {(booking.totalGuestCharged || booking.paymentAmount) && (
                  <p className="text-xs text-gray-500 mt-1">${((booking.totalGuestCharged || booking.paymentAmount) / 100).toFixed(2)} paid</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge className="text-[10px] bg-stone-100 text-stone-600">Completed</Badge>
                {booking.feeTier === "repeat_guest" && (
                  <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    <Star className="w-2.5 h-2.5 mr-0.5" /> Loyalty discount
                  </Badge>
                )}
                {booking.feeTier === "host_referred" && (
                  <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Referred
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MySpacesTab() {
  const [showForm, setShowForm] = useState(false);

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
  const { data, isLoading } = useQuery<{
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

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!data?.hasSpaces || !data.allTime) {
    return (
      <div className="text-center py-12 text-stone-500">
        <DollarSign className="w-8 h-8 mx-auto mb-3 text-stone-300" />
        <p className="text-sm font-medium mb-1">No earnings yet</p>
        <p className="text-xs text-stone-400">Earnings will appear here once guests book your spaces.</p>
      </div>
    );
  }

  const tierLabels: Record<string, string> = { standard: "Standard", referral: "Referred", repeat: "Repeat guest" };

  return (
    <div className="space-y-5">
      {/* This month callout */}
      {data.thisMonth.savedVsPeerspace > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-sm text-emerald-800">
            You saved <strong>${(data.thisMonth.savedVsPeerspace / 100).toFixed(2)}</strong> vs Peerspace's 20% fee this month
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">This Month</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">${(data.thisMonth.earnings / 100).toFixed(2)}</p>
          <p className="text-xs text-stone-400 mt-0.5">{data.thisMonth.bookingCount} booking{data.thisMonth.bookingCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">All Time</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">${(data.allTime.totalEarnings / 100).toFixed(2)}</p>
          <p className="text-xs text-stone-400 mt-0.5">{data.allTime.bookingCount} booking{data.allTime.bookingCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Bookings by Type</p>
        <div className="space-y-2.5">
          {Object.entries(data.tierBreakdown).filter(([, count]) => count > 0).map(([tier, count]) => {
            const total = data.allTime.bookingCount || 1;
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
        <span className="text-sm font-semibold text-stone-800">{data.allTime.avgFeePercent}%</span>
      </div>
    </div>
  );
}

function PayoutsTab() {
  const { data, isLoading } = useQuery<{
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

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!data?.payouts?.length) {
    return (
      <div className="text-center py-12 text-stone-500">
        <CreditCard className="w-8 h-8 mx-auto mb-3 text-stone-300" />
        <p className="text-sm font-medium mb-1">No payouts yet</p>
        <p className="text-xs text-stone-400">Payouts will appear here after your bookings are completed.</p>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    processing: "bg-blue-50 text-blue-700",
    pending: "bg-amber-50 text-amber-700",
    held: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-lg font-semibold text-stone-900">${(data.summary.totalPaid / 100).toFixed(0)}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">Paid Out</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-lg font-semibold text-stone-900">${(data.summary.totalPending / 100).toFixed(0)}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-lg font-semibold text-emerald-700">${(data.summary.savedVsPeerspace / 100).toFixed(0)}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">Saved</p>
        </div>
      </div>

      {/* Payout list */}
      <div className="space-y-2">
        {data.payouts.map((p) => (
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
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusStyles[p.payoutStatus] || "bg-stone-100 text-stone-600"}`}>
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
  );
}

function ReferralLinksTab() {
  const { toast } = useToast();

  const { data: mySpaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: links = [], isLoading } = useQuery<ReferralLink[]>({
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

  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
  const totalBookings = links.reduce((sum, l) => sum + (l.bookingCount || 0), 0);
  const totalRevenue = links.reduce((sum, l) => sum + (l.totalRevenueGenerated || 0), 0);
  const totalSaved = links.reduce((sum, l) => sum + (l.savedAmount || 0), 0);

  const hasMasterLink = links.some(l => !l.spaceId);

  if (mySpaces.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 text-stone-500">
        <Share2 className="w-8 h-8 mx-auto mb-3 text-stone-300" />
        <p className="text-sm font-medium mb-1">No spaces to share yet</p>
        <p className="text-xs text-stone-400">Add a space first, then create referral links to earn lower fees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
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

      {/* Existing links */}
      {isLoading ? (
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
  );
}

type SpacesTabKey = "favorites" | "my-spaces" | "earnings" | "payouts" | "referrals" | "past";

export default function PortalSpacesSection({ userId, initialTab }: { userId: string; initialTab?: SpacesTabKey }) {
  const [spacesTab, setSpacesTab] = useState<SpacesTabKey>(initialTab || "favorites");
  const [tabResolved, setTabResolved] = useState(!!initialTab);

  // Fetch counts to auto-detect best sub-tab
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Space[]>({
    queryKey: ["/api/space-favorites"],
    queryFn: async () => {
      const res = await fetch("/api/space-favorites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: mySpaces = [], isLoading: mySpacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery<{ guest: any[]; host: any[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (tabResolved) return;
    // Wait until all queries have finished loading before resolving
    if (favoritesLoading || mySpacesLoading || bookingsLoading) return;

    const hasFavorites = favorites.length > 0;
    const hasMySpaces = mySpaces.length > 0;
    const pastBookings = [...(bookingsData?.guest || []), ...(bookingsData?.host || [])];
    const hasPast = pastBookings.length > 0;

    const tabs = [
      hasFavorites && { key: "favorites" as const, time: 0 },
      hasMySpaces && { key: "my-spaces" as const, time: Math.max(...mySpaces.map(s => new Date(s.createdAt || 0).getTime())) },
      hasPast && { key: "past" as const, time: Math.max(...pastBookings.map((b: any) => new Date(b.createdAt || 0).getTime())) },
    ].filter(Boolean) as { key: SpacesTabKey; time: number }[];

    if (tabs.length === 1) {
      setSpacesTab(tabs[0].key);
    } else if (tabs.length > 1) {
      // Pick most recently active
      tabs.sort((a, b) => b.time - a.time);
      setSpacesTab(tabs[0].key);
    }

    setTabResolved(true);
  }, [favorites, mySpaces, bookingsData, tabResolved, favoritesLoading, mySpacesLoading, bookingsLoading]);

  const isHost = mySpaces.length > 0;

  const tabs = [
    { key: "favorites" as const, label: "Favorites", icon: Heart },
    { key: "my-spaces" as const, label: "My Spaces", icon: Building2 },
    ...(isHost ? [
      { key: "earnings" as const, label: "Earnings", icon: DollarSign },
      { key: "payouts" as const, label: "Payouts", icon: CreditCard },
      { key: "referrals" as const, label: "Referrals", icon: Share2 },
    ] : []),
    { key: "past" as const, label: "Past", icon: Clock },
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

      {spacesTab === "favorites" && <FavoritesTab />}
      {spacesTab === "my-spaces" && <MySpacesTab />}
      {spacesTab === "earnings" && <EarningsTab />}
      {spacesTab === "payouts" && <PayoutsTab />}
      {spacesTab === "referrals" && <ReferralLinksTab />}
      {spacesTab === "past" && <PastSpacesTab />}
    </div>
  );
}
