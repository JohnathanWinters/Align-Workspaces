import { useState, useRef, useCallback } from "react";
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
    setDragOver(true);
  }, []);

  return (
    <div
      className="mt-3 pt-3 border-t border-gray-100"
      data-testid={`space-photos-${space.id}`}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
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
      {dragOver && (
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
          className="w-full py-6 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-2 text-gray-400 hover:border-[#c4956a] hover:text-[#c4956a] transition-colors"
          data-testid={`button-upload-first-photo-${space.id}`}
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs">Drop photos here or click to upload</span>
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
          <label className="text-xs text-gray-500 mb-1 block">Type</label>
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
          <label className="text-xs text-gray-500 mb-1 block">Your Name / Business</label>
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
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Target Profession</label>
          <Input value={formData.targetProfession} onChange={(e) => update("targetProfession", e.target.value)} data-testid={`edit-input-target-${space.id}`} />
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
            <label className="text-xs text-gray-500 mb-1 block">Type *</label>
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
            <label className="text-xs text-gray-500 mb-1 block">Your Name / Business *</label>
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
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Target Profession</label>
            <Input value={formData.targetProfession} onChange={(e) => update("targetProfession", e.target.value)} placeholder="e.g. Therapists & Counselors" data-testid="input-space-target" />
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
              Connect your bank account to receive payments when guests book your space. Align charges a 7% host fee on each booking.
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
    return bookingDate < now && (b.status === "confirmed" || b.status === "completed");
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
                {booking.paymentAmount && (
                  <p className="text-xs text-gray-500 mt-1">${(booking.paymentAmount / 100).toFixed(2)} paid</p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <Badge className="text-[10px] bg-stone-100 text-stone-600">Completed</Badge>
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

export default function PortalSpacesSection({ userId }: { userId: string }) {
  const [spacesTab, setSpacesTab] = useState<"favorites" | "my-spaces" | "past">("favorites");

  const tabs = [
    { key: "favorites" as const, label: "Favorites", icon: Heart },
    { key: "my-spaces" as const, label: "My Spaces", icon: Building2 },
    { key: "past" as const, label: "Past Spaces", icon: Clock },
  ];

  return (
    <div className="space-y-6">
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
      {spacesTab === "past" && <PastSpacesTab />}
    </div>
  );
}
