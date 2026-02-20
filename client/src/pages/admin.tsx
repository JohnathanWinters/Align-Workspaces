import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Lock,
  Users,
  Camera,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  Loader2,
  User,
  Image,
  Save,
  X,
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  Images,
  Search,
  Receipt,
  Send,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Shoot, User as UserType, GalleryImage, GalleryFolder } from "@shared/schema";

function adminFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin(password);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm px-6"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="font-serif text-2xl text-white mb-2">Admin Panel</h1>
          <p className="text-white/50 text-sm">Enter your admin password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            data-testid="input-admin-password"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          {error && <p className="text-red-400 text-sm" data-testid="text-login-error">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !password}
            data-testid="button-admin-login"
            className="w-full bg-white text-black"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

interface ShootFormData {
  title: string;
  environment: string;
  brandMessage: string;
  emotionalImpact: string;
  shootIntent: string;
  status: string;
  shootDate: string;
  shootTime: string;
  location: string;
  notes: string;
}

const defaultShootForm: ShootFormData = {
  title: "",
  environment: "",
  brandMessage: "",
  emotionalImpact: "",
  shootIntent: "",
  status: "draft",
  shootDate: "",
  shootTime: "",
  location: "",
  notes: "",
};

const environments = ["restaurant", "office", "nature", "workvan", "urban", "suburban", "gym"];
const brandMessages = ["assured", "empathy", "confidence", "motivation"];
const emotionalImpacts = ["cozy", "bright", "powerful", "cinematic"];
const shootIntents = ["website", "social-media", "marketing", "personal-brand", "team"];
const statuses = ["draft", "scheduled", "in-progress", "completed"];

function GalleryManager({ shootId, shootTitle, token, onBack }: { shootId: string; shootTitle: string; token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const [imagesRes, foldersRes] = await Promise.all([
        adminFetch(`/api/admin/shoots/${shootId}/gallery`, token),
        adminFetch(`/api/admin/shoots/${shootId}/folders`, token),
      ]);
      if (imagesRes.ok) setImages(await imagesRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
    } catch {
      toast({ title: "Error", description: "Failed to load gallery", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [shootId, token]);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }
      const uploadFolder = effectiveFolder || selectedFolder;
      if (uploadFolder) {
        formData.append("folderId", uploadFolder);
      }
      const res = await fetch(`/api/admin/shoots/${shootId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const newImages = await res.json();
        toast({ title: "Uploaded", description: `${newImages.length} photo(s) uploaded` });
        await loadGallery();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await adminFetch(`/api/admin/gallery/${imageId}`, token, { method: "DELETE" });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast({ title: "Deleted", description: "Photo removed" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete photo", variant: "destructive" });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await adminFetch("/api/admin/folders", token, {
        method: "POST",
        body: JSON.stringify({ shootId, name: newFolderName.trim(), sortOrder: folders.length }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setNewFolderName("");
        toast({ title: "Created", description: `Folder "${folder.name}" created` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!editFolderName.trim()) return;
    try {
      const res = await adminFetch(`/api/admin/folders/${folderId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: editFolderName.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)));
        setEditingFolderId(null);
        setEditFolderName("");
        toast({ title: "Updated", description: "Folder renamed" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to rename folder", variant: "destructive" });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder and all its photos?")) return;
    try {
      const res = await adminFetch(`/api/admin/folders/${folderId}`, token, { method: "DELETE" });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setImages((prev) => prev.filter((img) => img.folderId !== folderId));
        if (selectedFolder === folderId) setSelectedFolder(null);
        toast({ title: "Deleted", description: "Folder and its photos removed" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete folder", variant: "destructive" });
    }
  };

  const allImagesCount = images.length;
  const rootImagesCount = images.filter((img) => !img.folderId).length;

  const effectiveFolder = selectedFolder === null && rootImagesCount === 0 && folders.length > 0
    ? folders[0].id
    : selectedFolder;

  const filteredImages = effectiveFolder
    ? images.filter((img) => img.folderId === effectiveFolder)
    : images.filter((img) => !img.folderId);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            data-testid="button-back-from-gallery"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <p className="font-serif text-lg text-gray-900" data-testid="text-gallery-title">Gallery</p>
            <p className="text-xs text-gray-500">{shootTitle} &middot; {allImagesCount} photos</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                data-testid="input-new-folder"
                className="max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <Button
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                data-testid="button-create-folder"
                className="bg-[#1a1a1a] text-white"
              >
                <FolderPlus className="w-4 h-4 mr-1.5" />
                Add Folder
              </Button>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                data-testid="button-upload-photos"
                className="bg-[#1a1a1a] text-white"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-1.5" />
                )}
                {uploading ? "Uploading..." : "Upload Photos"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {(rootImagesCount > 0 || folders.length === 0) && (
              <button
                onClick={() => setSelectedFolder(null)}
                data-testid="button-folder-root"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  effectiveFolder === null
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Images className="w-3.5 h-3.5" />
                {folders.length === 0 ? `All (${rootImagesCount})` : `Unsorted (${rootImagesCount})`}
              </button>
            )}
            {folders.map((folder) => {
              const count = images.filter((img) => img.folderId === folder.id).length;
              const isSelected = effectiveFolder === folder.id;
              const isEditing = editingFolderId === folder.id;
              return (
                <div key={folder.id} className="flex items-center gap-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="h-8 w-32 text-sm"
                        data-testid={`input-rename-folder-${folder.id}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFolder(folder.id);
                          if (e.key === "Escape") { setEditingFolderId(null); setEditFolderName(""); }
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleRenameFolder(folder.id)} className="h-8 w-8 p-0" data-testid={`button-save-rename-${folder.id}`}>
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingFolderId(null); setEditFolderName(""); }} className="h-8 w-8 p-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        data-testid={`button-folder-${folder.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {isSelected ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                        {folder.name} ({count})
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                        data-testid={`button-edit-folder-${folder.id}`}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFolder(folder.id)}
                        data-testid={`button-delete-folder-${folder.id}`}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredImages.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Image className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="font-serif text-lg text-gray-900 mb-1">
                  {selectedFolder ? "No photos in this folder" : "No unsorted photos"}
                </h3>
                <p className="text-gray-500 text-sm">
                  Upload photos using the button above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  data-testid={`gallery-image-${image.id}`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.originalFilename || image.caption || "Gallery photo"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                    <p className="text-white text-xs truncate flex-1 mr-2">
                      {image.originalFilename || "Photo"}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteImage(image.id)}
                      data-testid={`button-delete-image-${image.id}`}
                      className="h-7 w-7 p-0 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

interface InvoiceLineItem {
  description: string;
  amount: string;
}

function InvoiceModal({
  shoot,
  token,
  onClose,
}: {
  shoot: Shoot;
  token: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", amount: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [daysUntilDue, setDaysUntilDue] = useState("30");
  const [sending, setSending] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: "" }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const totalAmount = lineItems.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const isValid = lineItems.every(
    (item) => item.description.trim() && item.amount.trim() && !isNaN(parseFloat(item.amount)) && parseFloat(item.amount) > 0
  );

  const handleSend = async () => {
    if (!isValid) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/shoots/${shoot.id}/send-invoice`, token, {
        method: "POST",
        body: JSON.stringify({
          lineItems: lineItems.map((item) => ({
            description: item.description.trim(),
            amount: parseFloat(item.amount),
          })),
          notes: notes.trim() || undefined,
          daysUntilDue: parseInt(daysUntilDue) || 30,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: "Invoice Sent via Stripe", description: `Invoice sent to ${result.sentTo}` });
        onClose();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send Stripe invoice", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <Receipt className="w-4.5 h-4.5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-gray-900" data-testid="text-invoice-title">Send Invoice</h3>
                <p className="text-xs text-gray-500">{shoot.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" data-testid="button-close-invoice">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-sm text-gray-700 font-medium">Line Items</Label>
            <div className="space-y-2 mt-2">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    placeholder="Description (e.g., Portrait session)"
                    data-testid={`input-invoice-desc-${index}`}
                    className="flex-1"
                  />
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      value={item.amount}
                      onChange={(e) => updateLineItem(index, "amount", e.target.value)}
                      placeholder="0.00"
                      data-testid={`input-invoice-amount-${index}`}
                      className="pl-7"
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => removeLineItem(index)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                      data-testid={`button-remove-line-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="mt-2 text-xs"
              data-testid="button-add-line-item"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Line Item
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-lg font-semibold text-gray-900" data-testid="text-invoice-total">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          <div>
            <Label className="text-sm text-gray-700">Payment Due</Label>
            <Select value={daysUntilDue} onValueChange={setDaysUntilDue}>
              <SelectTrigger className="mt-1" data-testid="select-days-due">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Due in 7 days</SelectItem>
                <SelectItem value="14">Due in 14 days</SelectItem>
                <SelectItem value="30">Due in 30 days</SelectItem>
                <SelectItem value="60">Due in 60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-700">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for the client..."
              data-testid="input-invoice-notes"
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3 text-center">Invoice will be created and sent via Stripe</p>
          <div className="flex gap-3">
          <Button
            onClick={handleSend}
            disabled={sending || !isValid}
            data-testid="button-send-invoice"
            className="flex-1 bg-[#1a1a1a] text-white"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {sending ? "Sending..." : "Send Invoice"}
          </Button>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-invoice">
            Cancel
          </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ token }: { token: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"clients" | "create" | "edit" | "gallery">("clients");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);
  const [galleryShoot, setGalleryShoot] = useState<Shoot | null>(null);
  const [form, setForm] = useState<ShootFormData>(defaultShootForm);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceShoot, setInvoiceShoot] = useState<Shoot | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ firstName: "", lastName: "", email: "" });
  const [savingUser, setSavingUser] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return email.includes(q) || name.includes(q);
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, shootsRes] = await Promise.all([
        adminFetch("/api/admin/users", token),
        adminFetch("/api/admin/shoots", token),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (shootsRes.ok) setShoots(await shootsRes.json());
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getUserShoots = (userId: string) => shoots.filter((s) => s.userId === userId);

  const handleCreateShoot = async () => {
    if (!selectedUser || !form.title) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/shoots", token, {
        method: "POST",
        body: JSON.stringify({ ...form, userId: selectedUser.id }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Photoshoot created" });
        setView("clients");
        setForm(defaultShootForm);
        await loadData();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create shoot", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateShoot = async () => {
    if (!editingShoot) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/shoots/${editingShoot.id}`, token, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Photoshoot updated" });
        setView("clients");
        setEditingShoot(null);
        setForm(defaultShootForm);
        await loadData();
      } else {
        toast({ title: "Error", description: "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update shoot", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShoot = async (shootId: string) => {
    if (!confirm("Delete this photoshoot? This cannot be undone.")) return;
    try {
      const res = await adminFetch(`/api/admin/shoots/${shootId}`, token, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Photoshoot removed" });
        await loadData();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const startEdit = (shoot: Shoot) => {
    setEditingShoot(shoot);
    setForm({
      title: shoot.title || "",
      environment: shoot.environment || "",
      brandMessage: shoot.brandMessage || "",
      emotionalImpact: shoot.emotionalImpact || "",
      shootIntent: shoot.shootIntent || "",
      status: shoot.status || "draft",
      shootDate: shoot.shootDate || "",
      shootTime: shoot.shootTime || "",
      location: shoot.location || "",
      notes: shoot.notes || "",
    });
    setView("edit");
  };

  const startCreate = (user: UserType) => {
    setSelectedUser(user);
    setForm(defaultShootForm);
    setView("create");
  };

  const openGallery = (shoot: Shoot) => {
    setGalleryShoot(shoot);
    setView("gallery");
  };

  const startEditUser = (user: UserType) => {
    setEditingUser(user.id);
    setEditUserForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
  };

  const handleSaveUser = async (userId: string) => {
    setSavingUser(true);
    try {
      const res = await adminFetch(`/api/admin/users/${userId}`, token, {
        method: "PATCH",
        body: JSON.stringify(editUserForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        setEditingUser(null);
        toast({ title: "Updated", description: "Client info saved" });
      } else {
        toast({ title: "Error", description: "Failed to update client", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update client", variant: "destructive" });
    } finally {
      setSavingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (view === "gallery" && galleryShoot) {
    return (
      <GalleryManager
        shootId={galleryShoot.id}
        shootTitle={galleryShoot.title}
        token={token}
        onBack={() => { setView("clients"); setGalleryShoot(null); }}
      />
    );
  }

  if (view === "create" || view === "edit") {
    const isEdit = view === "edit";
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => { setView("clients"); setEditingShoot(null); setForm(defaultShootForm); }}
              data-testid="button-back-to-clients"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <p className="font-serif text-lg text-gray-900">
              {isEdit ? "Edit Photoshoot" : "New Photoshoot"}
            </p>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {!isEdit && selectedUser && (
              <div className="flex items-center gap-3 mb-6 p-3 bg-white rounded-lg border border-gray-100">
                <Avatar className="w-10 h-10" data-testid="img-selected-user">
                  {selectedUser.profileImageUrl && <AvatarImage src={selectedUser.profileImageUrl} />}
                  <AvatarFallback className="bg-gray-100 text-gray-500">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <Label className="text-sm text-gray-700">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Professional Headshots - Spring 2026"
                  data-testid="input-shoot-title"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700">Environment</Label>
                  <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                    <SelectTrigger className="mt-1" data-testid="select-environment">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.map((e) => (
                        <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Brand Message</Label>
                  <Select value={form.brandMessage} onValueChange={(v) => setForm({ ...form, brandMessage: v })}>
                    <SelectTrigger className="mt-1" data-testid="select-brand-message">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brandMessages.map((b) => (
                        <SelectItem key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700">Emotional Impact</Label>
                  <Select value={form.emotionalImpact} onValueChange={(v) => setForm({ ...form, emotionalImpact: v })}>
                    <SelectTrigger className="mt-1" data-testid="select-emotional-impact">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {emotionalImpacts.map((e) => (
                        <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Shoot Intent</Label>
                  <Select value={form.shootIntent} onValueChange={(v) => setForm({ ...form, shootIntent: v })}>
                    <SelectTrigger className="mt-1" data-testid="select-shoot-intent">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shootIntents.map((s) => (
                        <SelectItem key={s} value={s}>{s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1" data-testid="select-status">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Shoot Date</Label>
                  <Input
                    type="date"
                    value={form.shootDate}
                    onChange={(e) => setForm({ ...form, shootDate: e.target.value })}
                    data-testid="input-shoot-date"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Shoot Time</Label>
                  <Input
                    type="time"
                    value={form.shootTime}
                    onChange={(e) => setForm({ ...form, shootTime: e.target.value })}
                    data-testid="input-shoot-time"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-700">Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., 123 Main St, Miami, FL 33101"
                  data-testid="input-shoot-location"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-700">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes about this shoot..."
                  data-testid="input-shoot-notes"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={isEdit ? handleUpdateShoot : handleCreateShoot}
                  disabled={saving || !form.title}
                  data-testid="button-save-shoot"
                  className="bg-[#1a1a1a] text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isEdit ? "Update Shoot" : "Create Shoot"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setView("clients"); setEditingShoot(null); setForm(defaultShootForm); }}
                  data-testid="button-cancel"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <p className="font-serif text-lg text-gray-900" data-testid="text-admin-title">Admin Panel</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span data-testid="text-user-count">{users.length} clients</span>
            <span className="mx-2 text-gray-300">|</span>
            <Camera className="w-4 h-4" />
            <span data-testid="text-shoot-count">{shoots.length} shoots</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-serif text-2xl text-gray-900 mb-6">Clients & Photoshoots</h2>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by email or name..."
              data-testid="input-search-clients"
              className="pl-10 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredUsers.length === 0 && searchQuery ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="font-serif text-lg text-gray-900 mb-1">No clients found</h3>
                <p className="text-gray-500 text-sm">
                  No clients match "{searchQuery}". Try a different search.
                </p>
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="font-serif text-lg text-gray-900 mb-1">No clients yet</h3>
                <p className="text-gray-500 text-sm">
                  Clients will appear here after they sign in to the Client Portal.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const userShoots = getUserShoots(user.id);
                return (
                  <Card key={user.id} className="bg-white" data-testid={`card-client-${user.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                          <AvatarFallback className="bg-gray-100 text-gray-500">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          {editingUser === user.id ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={editUserForm.firstName}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                                  placeholder="First name"
                                  data-testid={`input-edit-firstname-${user.id}`}
                                  className="h-8 text-sm"
                                />
                                <Input
                                  value={editUserForm.lastName}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                                  placeholder="Last name"
                                  data-testid={`input-edit-lastname-${user.id}`}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <Input
                                value={editUserForm.email}
                                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                placeholder="Email"
                                type="email"
                                data-testid={`input-edit-email-${user.id}`}
                                className="h-8 text-sm"
                              />
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveUser(user.id)}
                                  disabled={savingUser}
                                  data-testid={`button-save-user-${user.id}`}
                                  className="h-7 bg-[#1a1a1a] text-white text-xs"
                                >
                                  {savingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingUser(null)}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <CardTitle className="text-base font-medium text-gray-900 truncate">
                                    {user.firstName || user.lastName
                                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                      : "No name"}
                                  </CardTitle>
                                  <button
                                    onClick={() => startEditUser(user)}
                                    data-testid={`button-edit-user-${user.id}`}
                                    className="text-gray-400 hover:text-gray-700 shrink-0"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => startCreate(user)}
                                  data-testid={`button-add-shoot-${user.id}`}
                                  className="bg-[#1a1a1a] text-white shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                                  Add Shoot
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{user.email || "No email"}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {userShoots.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-2">No photoshoots assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {userShoots.map((shoot) => (
                            <div
                              key={shoot.id}
                              className="p-3 rounded-lg bg-gray-50"
                              data-testid={`shoot-row-${shoot.id}`}
                            >
                              <div className="flex items-start gap-3">
                                <Camera className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{shoot.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    {shoot.status && (
                                      <span className="capitalize">{shoot.status}</span>
                                    )}
                                    {shoot.environment && (
                                      <>
                                        <span>·</span>
                                        <span className="capitalize">{shoot.environment}</span>
                                      </>
                                    )}
                                    {shoot.shootDate && (
                                      <>
                                        <span>·</span>
                                        <span>
                                          {new Date(shoot.shootDate + "T00:00:00").toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                                          {shoot.shootTime && ` at ${new Date("2000-01-01T" + shoot.shootTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openGallery(shoot)}
                                      data-testid={`button-gallery-${shoot.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      <Images className="w-3 h-3 mr-1" />
                                      Gallery
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEdit(shoot)}
                                      data-testid={`button-edit-shoot-${shoot.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setInvoiceShoot(shoot)}
                                      data-testid={`button-invoice-${shoot.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      <Receipt className="w-3 h-3 mr-1" />
                                      Invoice
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteShoot(shoot.id)}
                                      data-testid={`button-delete-shoot-${shoot.id}`}
                                      className="h-7 text-xs px-2 text-red-500 border-red-200 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {invoiceShoot && (
        <InvoiceModal
          shoot={invoiceShoot}
          token={token}
          onClose={() => setInvoiceShoot(null)}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("admin_token");
  });

  const handleLogin = (t: string) => {
    sessionStorage.setItem("admin_token", t);
    setToken(t);
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} />;
}
