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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";

const SPACE_TYPES = [
  { value: "office", label: "Office" },
  { value: "gym", label: "Training Studio" },
  { value: "meeting", label: "Meeting Room" },
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
  const [formData, setFormData] = useState({
    name: space.name || "",
    type: space.type || "office",
    description: space.description || "",
    shortDescription: space.shortDescription || "",
    address: space.address || "",
    neighborhood: space.neighborhood || "",
    pricePerHour: String(space.pricePerHour || ""),
    pricePerDay: String(space.pricePerDay || ""),
    capacity: String(space.capacity || ""),
    amenities: (space.amenities || []).join(", "),
    targetProfession: space.targetProfession || "",
    availableHours: space.availableHours || "",
    hostName: space.hostName || "",
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        pricePerHour: formData.pricePerHour ? Number(formData.pricePerHour) : undefined,
        pricePerDay: formData.pricePerDay ? Number(formData.pricePerDay) : undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        amenities: formData.amenities.split(",").map((a) => a.trim()).filter(Boolean),
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
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Available Hours</label>
          <Input value={formData.availableHours} onChange={(e) => update("availableHours", e.target.value)} data-testid={`edit-input-hours-${space.id}`} />
        </div>
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
  const [formData, setFormData] = useState({
    name: "",
    type: "office",
    description: "",
    shortDescription: "",
    address: "",
    neighborhood: "",
    pricePerHour: "",
    pricePerDay: "",
    capacity: "",
    amenities: "",
    targetProfession: "",
    availableHours: "",
    hostName: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        amenities: formData.amenities.split(",").map((a) => a.trim()).filter(Boolean),
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
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Available Hours</label>
            <Input value={formData.availableHours} onChange={(e) => update("availableHours", e.target.value)} placeholder="Mon-Fri 9am-5pm" data-testid="input-space-hours" />
          </div>
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

export default function PortalSpacesSection({ userId }: { userId: string }) {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-gray-900">My Spaces</h2>
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
