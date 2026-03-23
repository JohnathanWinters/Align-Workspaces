import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  Save,
  Upload,
  MapPin,
  Pencil,
  X,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  location: string | null;
  bio: string | null;
  photoUrl: string | null;
  cropPosition: { x: number; y: number; zoom: number } | null;
  sortOrder: number;
  isActive: number;
}

function adminFetch(url: string, token: string, options: RequestInit & { isFormData?: boolean } = {}) {
  const { isFormData, ...fetchOptions } = options;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";
  return fetch(url, { ...fetchOptions, headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) } });
}

function CropEditor({ member, token, onUpdate }: { member: TeamMember; token: string; onUpdate: (m: TeamMember) => void }) {
  const crop = member.cropPosition || { x: 50, y: 50, zoom: 1 };
  const [x, setX] = useState(crop.x);
  const [y, setY] = useState(crop.y);
  const [zoom, setZoom] = useState(crop.zoom);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const photoSrc = member.photoUrl?.startsWith("/") || member.photoUrl?.startsWith("http")
    ? member.photoUrl : member.photoUrl ? `/objects/${member.photoUrl}` : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/team-members/${member.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ cropPosition: { x, y, zoom } }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        toast({ title: "Crop saved" });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!photoSrc) return null;

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Photo Crop</p>
      <div className="flex gap-4">
        <div className="w-32 aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
          <img
            src={photoSrc}
            alt={member.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${x}% ${y}%`,
              ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` } : {}),
            }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <label className="text-[10px] text-gray-400">Zoom ({Math.round(zoom * 100)}%)</label>
            <input type="range" min="1" max="2" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 accent-[#c4956a]" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">Vertical ({y}%)</label>
            <input type="range" min="0" max="100" step="1" value={y} onChange={(e) => setY(Number(e.target.value))} className="w-full h-1.5 accent-[#c4956a]" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">Horizontal ({x}%)</label>
            <input type="range" min="0" max="100" step="1" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full h-1.5 accent-[#c4956a]" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setX(50); setY(50); setZoom(1); }}>
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </Button>
            <Button size="sm" className="text-xs h-7 bg-[#1a1a1a] text-white" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save Crop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTeamMembers({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", location: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/team-members", token);
      if (res.ok) setMembers(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  useState(() => { loadMembers(); });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/team-members", token, {
        method: "POST",
        body: JSON.stringify({ ...form, sortOrder: members.length }),
      });
      if (res.ok) {
        await loadMembers();
        setForm({ name: "", role: "", location: "", bio: "" });
        setShowAdd(false);
        toast({ title: "Team member added" });
      }
    } catch {
      toast({ title: "Failed to add", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const res = await adminFetch(`/api/admin/team-members/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setMembers(prev => prev.map(m => m.id === id ? updated : m));
        toast({ title: "Updated" });
      }
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    try {
      await adminFetch(`/api/admin/team-members/${id}`, token, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.id !== id));
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handlePhotoUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await adminFetch(`/api/admin/team-members/${id}/photo`, token, {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      if (res.ok) {
        const updated = await res.json();
        setMembers(prev => prev.map(m => m.id === id ? updated : m));
        toast({ title: "Photo uploaded" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <p className="font-serif text-lg text-gray-900">Our Vision — Team Members</p>
          </div>
          <Button size="sm" className="bg-[#1a1a1a] text-white" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Member
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <>
            <AnimatePresence>
              {showAdd && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className="bg-white border-amber-200">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-900">New Team Member</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                        <Input placeholder="Role (e.g. Co-Founder, Align)" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} />
                      </div>
                      <Input placeholder="Location (e.g. Miami, FL)" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
                      <Textarea placeholder="Bio (paragraphs separated by blank lines)" value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button size="sm" className="bg-[#1a1a1a] text-white" onClick={handleAdd} disabled={saving || !form.name.trim()}>
                          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {members.map((member) => {
              const isEditing = editingId === member.id;
              const photoSrc = member.photoUrl?.startsWith("/") || member.photoUrl?.startsWith("http")
                ? member.photoUrl : member.photoUrl ? `/objects/${member.photoUrl}` : null;

              return (
                <Card key={member.id} className="bg-white overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Photo thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative group">
                        {photoSrc ? (
                          <img src={photoSrc} alt={member.name} className="w-full h-full object-cover" style={{
                            objectPosition: `${member.cropPosition?.x ?? 50}% ${member.cropPosition?.y ?? 50}%`,
                          }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Upload className="w-5 h-5" />
                          </div>
                        )}
                        <button
                          onClick={() => { fileInputRef.current?.setAttribute("data-member-id", member.id); fileInputRef.current?.click(); }}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {uploadingId === member.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 text-sm">{member.name}</h3>
                          {!member.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Hidden</span>}
                        </div>
                        <p className="text-xs text-[#c4956a]">{member.role}</p>
                        {member.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{member.location}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditingId(isEditing ? null : member.id)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isEditing && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <EditMemberForm member={member} token={token} onUpdate={(m) => { setMembers(prev => prev.map(p => p.id === m.id ? m : p)); }} />
                          <CropEditor member={member} token={token} onUpdate={(m) => { setMembers(prev => prev.map(p => p.id === m.id ? m : p)); }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const id = fileInputRef.current?.getAttribute("data-member-id");
          if (id && e.target.files?.[0]) handlePhotoUpload(id, e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function EditMemberForm({ member, token, onUpdate }: { member: TeamMember; token: string; onUpdate: (m: TeamMember) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: member.name,
    role: member.role,
    location: member.location || "",
    bio: member.bio || "",
    isActive: member.isActive,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/team-members/${member.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onUpdate(await res.json());
        toast({ title: "Saved" });
      }
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="text-sm" />
        <Input value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Role" className="text-sm" />
      </div>
      <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="text-sm" />
      <Textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio" rows={4} className="text-sm" />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={form.isActive === 1} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked ? 1 : 0 }))} />
          Visible on site
        </label>
        <Button size="sm" className="bg-[#1a1a1a] text-white text-xs" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
