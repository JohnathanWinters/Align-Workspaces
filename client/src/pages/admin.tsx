import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
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
  Pencil,
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  Images,
  Search,
  Receipt,
  Send,
  MapPin,
  Coins,
  MessageCircle,
  Bell,
  BellRing,
  Download,
  ImagePlus,
  Star,
  ExternalLink,
  Move,
  Heart,
  Building2,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { playNotificationSound } from "@/lib/notification-sound";
import { Badge } from "@/components/ui/badge";
import type { Shoot, User as UserType, GalleryImage, GalleryFolder } from "@shared/schema";

interface EditToken {
  id: string;
  userId: string;
  annualTokens: number;
  purchasedTokens: number;
  annualTokenResetDate: string;
  lastPhotoshootDate: string | null;
  createdAt: string;
}

interface TokenTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

interface EditRequest {
  id: string;
  userId: string;
  shootId: string | null;
  photoCount: number;
  annualTokensUsed: number;
  purchasedTokensUsed: number;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface EditRequestMessage {
  id: string;
  editRequestId: string;
  senderId: string;
  senderRole: string;
  senderName: string | null;
  message: string;
  createdAt: string;
}

function adminFetch(url: string, token: string, options: RequestInit & { isFormData?: boolean } = {}) {
  const { isFormData, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(fetchOptions.headers as Record<string, string>),
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

const environments = ["restaurant", "office", "nature", "workvan", "urban", "suburban", "gym", "kitchen"];
const brandMessages = ["assured", "empathy", "confidence", "motivation"];
const emotionalImpacts = ["cozy", "bright", "powerful"];
const shootIntents = ["social-media", "commercial", "team"];
const statuses = ["draft", "pending-review", "scheduled", "in-progress", "completed"];

function GalleryManager({ shootId, shootTitle, token, onBack }: { shootId: string; shootTitle: string; token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [visitedFolders, setVisitedFolders] = useState<Set<string | null>>(new Set([null]));
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shootId, token]);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const uploadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    const imageFiles = fileList.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast({ title: "No images", description: "Only image files are accepted", variant: "destructive" });
      return;
    }
    setUploading(true);
    const BATCH_SIZE = 2;
    let uploaded = 0;
    let failed = 0;
    const totalFiles = imageFiles.length;
    try {
      for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
        const batch = imageFiles.slice(i, i + BATCH_SIZE);
        setUploadProgress(`Uploading ${Math.min(i + batch.length, totalFiles)} of ${totalFiles}...`);
        const formData = new FormData();
        for (const file of batch) {
          formData.append("photos", file);
        }
        const uploadFolder = effectiveFolder || selectedFolder;
        if (uploadFolder) {
          formData.append("folderId", uploadFolder);
        }
        try {
          const res = await fetch(`/api/admin/shoots/${shootId}/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (res.ok) {
            const newImages = await res.json();
            uploaded += newImages.length;
          } else {
            failed += batch.length;
          }
        } catch {
          failed += batch.length;
        }
      }
      if (uploaded > 0) {
        toast({ title: "Uploaded", description: `${uploaded} photo(s) uploaded${failed > 0 ? `, ${failed} failed` : ""}` });
      } else {
        toast({ title: "Error", description: "All uploads failed", variant: "destructive" });
      }
      await loadGallery();
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
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

  useEffect(() => {
    if (!lightboxImage) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImage(null);
      if (e.key === "ArrowLeft") {
        const idx = filteredImages.findIndex((img) => img.id === lightboxImage.id);
        if (idx > 0) setLightboxImage(filteredImages[idx - 1]);
      }
      if (e.key === "ArrowRight") {
        const idx = filteredImages.findIndex((img) => img.id === lightboxImage.id);
        if (idx < filteredImages.length - 1) setLightboxImage(filteredImages[idx + 1]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxImage, filteredImages]);

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
                {uploading ? (uploadProgress || "Uploading...") : "Upload Photos"}
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
                        onClick={() => { setSelectedFolder(folder.id); setVisitedFolders(prev => new Set(prev).add(folder.id)); }}
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

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl transition-all ${dragOver ? "ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50" : ""}`}
            data-testid="drop-zone-gallery"
          >
            {dragOver && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-blue-50/80 border-2 border-dashed border-blue-400 pointer-events-none">
                <div className="text-center">
                  <Upload className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-600 font-medium text-lg">Drop photos here</p>
                  <p className="text-blue-400 text-sm">Images will upload to the selected folder</p>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (() => {
              const folderGroups = [null, ...folders.map(f => f.id)].filter(fId => visitedFolders.has(fId));
              return (
                <>
                  {folderGroups.map(folderId => {
                    const isActive = effectiveFolder === folderId;
                    const groupImages = folderId
                      ? images.filter(img => img.folderId === folderId)
                      : images.filter(img => !img.folderId);
                    return (
                      <div key={folderId ?? "__root"} className={isActive ? "" : "hidden"}>
                        {groupImages.length === 0 ? (
                          <Card className={`border-dashed border-2 bg-white/50 cursor-pointer ${dragOver ? "border-blue-400" : "border-gray-200"}`} onClick={() => !uploading && fileInputRef.current?.click()}>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                              <Upload className="w-10 h-10 text-gray-300 mb-3" />
                              <h3 className="font-serif text-lg text-gray-900 mb-1">
                                {folderId ? "No photos in this folder" : "No unsorted photos"}
                              </h3>
                              <p className="text-gray-500 text-sm">
                                Drag & drop photos here or click to browse
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {groupImages.map((image) => (
                              <div
                                key={image.id}
                                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                data-testid={`gallery-image-${image.id}`}
                                onClick={() => { if (isActive) setLightboxImage(image); }}
                              >
                                <img
                                  src={image.imageUrl}
                                  alt={image.originalFilename || image.caption || "Gallery photo"}
                                  className="w-full h-full object-cover"
                                  loading={isActive ? "eager" : "lazy"}
                                  decoding="async"
                                  sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                                  <p className="text-white text-xs truncate flex-1 mr-2">
                                    {image.originalFilename || "Photo"}
                                  </p>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id); }}
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
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </motion.div>
      </main>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          data-testid="lightbox-overlay"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            data-testid="button-close-lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIdx = filteredImages.findIndex((img) => img.id === lightboxImage.id);
              if (currentIdx > 0) setLightboxImage(filteredImages[currentIdx - 1]);
            }}
            className="absolute left-4 text-white/70 hover:text-white z-10"
            data-testid="button-lightbox-prev"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIdx = filteredImages.findIndex((img) => img.id === lightboxImage.id);
              if (currentIdx < filteredImages.length - 1) setLightboxImage(filteredImages[currentIdx + 1]);
            }}
            className="absolute right-4 text-white/70 hover:text-white z-10"
            data-testid="button-lightbox-next"
          >
            <ChevronLeft className="w-8 h-8 rotate-180" />
          </button>

          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.originalFilename || "Gallery photo"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              data-testid="lightbox-image"
            />
            <p className="text-white/60 text-sm mt-3">
              {lightboxImage.originalFilename || "Photo"}
            </p>
          </div>
        </div>
      )}
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

interface EditRequestPhoto {
  id: string;
  editRequestId: string;
  imageUrl: string;
  originalFilename: string | null;
  finishedImageUrl: string | null;
  finishedFilename: string | null;
  createdAt: string;
}

function AdminEditRequestItem({ request, token, onDeleted }: { request: EditRequest; token: string; onDeleted: () => void }) {
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photos, setPhotos] = useState<EditRequestPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<EditRequestPhoto | null>(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
  const finishedInputRef = useRef<HTMLInputElement>(null);
  const [targetPhotoId, setTargetPhotoId] = useState<string | null>(null);
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await adminFetch(`/api/admin/edit-requests/${request.id}/messages`, token);
        if (res.ok) {
          const msgs: EditRequestMessage[] = await res.json();
          const adminMessages = msgs.filter(m => m.senderRole === "admin");
          const clientMessages = msgs.filter(m => m.senderRole === "client");
          if (clientMessages.length > 0) {
            const lastClientMsg = clientMessages[clientMessages.length - 1];
            const lastAdminMsg = adminMessages.length > 0 ? adminMessages[adminMessages.length - 1] : null;
            if (!lastAdminMsg || new Date(lastClientMsg.createdAt) > new Date(lastAdminMsg.createdAt)) {
              if (lastSeenRef.current < clientMessages.length) {
                setHasUnread(true);
              }
            } else {
              setHasUnread(false);
            }
          }
        }
      } catch {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [request.id, token]);

  const loadPhotos = async () => {
    if (photos.length > 0) return;
    setPhotosLoading(true);
    try {
      const res = await adminFetch(`/api/admin/edit-requests/${request.id}/photos`, token);
      if (res.ok) setPhotos(await res.json());
    } catch {} finally {
      setPhotosLoading(false);
    }
  };

  const togglePhotos = () => {
    if (!showPhotos) loadPhotos();
    setShowPhotos(!showPhotos);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/edit-requests/${request.id}`, token, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const data = await res.json();
      const refundTotal = (data.refunded?.annual || 0) + (data.refunded?.purchased || 0);
      toast({
        title: "Edit request deleted",
        description: refundTotal > 0 ? `${refundTotal} token(s) refunded to client` : undefined,
      });
      onDeleted();
    } catch {
      toast({ title: "Error", description: "Failed to delete edit request", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleChatToggle = () => {
    if (!showChat) {
      setHasUnread(false);
      lastSeenRef.current = Date.now();
    }
    setShowChat(!showChat);
  };

  const handleUploadFinished = async (file: File) => {
    if (!targetPhotoId) return;
    setUploadingPhotoId(targetPhotoId);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await adminFetch(`/api/admin/edit-photos/${targetPhotoId}/finished`, token, {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      if (!res.ok) throw new Error("Failed to upload");
      const updated = await res.json();
      setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast({ title: "Finished photo uploaded" });
    } catch {
      toast({ title: "Error", description: "Failed to upload finished photo", variant: "destructive" });
    } finally {
      setUploadingPhotoId(null);
      setTargetPhotoId(null);
    }
  };

  const totalTokens = request.annualTokensUsed + request.purchasedTokensUsed;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" data-testid={`admin-edit-request-${request.id}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2 text-sm">
            <Camera className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{request.photoCount} photo(s)</span>
            <Badge variant="secondary" className="text-xs capitalize">{request.status}</Badge>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {request.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mb-2">
            <p className="text-xs text-amber-700 font-medium mb-0.5">Client Instructions</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {request.annualTokensUsed > 0 && `Annual: ${request.annualTokensUsed}`}
              {request.annualTokensUsed > 0 && request.purchasedTokensUsed > 0 && ", "}
              {request.purchasedTokensUsed > 0 && `Purchased: ${request.purchasedTokensUsed}`}
              {request.annualTokensUsed === 0 && request.purchasedTokensUsed === 0 && "0 tokens"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePhotos}
                  data-testid={`button-admin-toggle-photos-${request.id}`}
                  className="h-8"
                >
                  <Images className="w-3.5 h-3.5 mr-1.5" />
                  {showPhotos ? "Hide Photos" : "View Photos"}
                </Button>
                <Button
                  variant={showChat ? "default" : "outline"}
                  size="sm"
                  onClick={handleChatToggle}
                  data-testid={`button-admin-toggle-chat-${request.id}`}
                  className={`relative h-8 ${showChat ? "bg-[#1a1a1a] text-white" : ""}`}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  {showChat ? "Hide Chat" : "Reply to Client"}
                  {hasUnread && !showChat && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  data-testid={`button-admin-delete-request-${request.id}`}
                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">
                  Delete{totalTokens > 0 ? ` & refund ${totalTokens} token(s)` : ""}?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  data-testid={`button-confirm-delete-request-${request.id}`}
                  className="h-7"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes, delete"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  data-testid={`button-cancel-delete-request-${request.id}`}
                  className="h-7"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={finishedInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadFinished(file);
          e.target.value = "";
        }}
      />

      {showPhotos && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          {photosLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
          ) : photos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No photos found</p>
          ) : (
            <div className="space-y-3">
              {photos.map(photo => {
                const originalSrc = photo.imageUrl.startsWith("/") ? photo.imageUrl : `/objects/${photo.imageUrl}`;
                const finishedSrc = photo.finishedImageUrl
                  ? (photo.finishedImageUrl.startsWith("/") ? photo.finishedImageUrl : `/objects/${photo.finishedImageUrl}`)
                  : null;
                const isUploading = uploadingPhotoId === photo.id;
                return (
                  <div key={photo.id} className="flex gap-2 items-start" data-testid={`admin-edit-photo-${photo.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Original</p>
                      <div
                        className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group cursor-pointer"
                        onClick={() => setLightboxPhoto(photo)}
                      >
                        <img src={originalSrc} alt={photo.originalFilename || "Original"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-end p-1.5 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); const a = document.createElement("a"); a.href = originalSrc; a.download = photo.originalFilename || "photo.jpg"; a.click(); }}
                            data-testid={`button-download-edit-photo-${photo.id}`}
                            className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Finished</p>
                      {finishedSrc ? (
                        <div
                          className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group cursor-pointer"
                          onClick={() => setLightboxPhoto({ ...photo, imageUrl: photo.finishedImageUrl!, originalFilename: photo.finishedFilename })}
                        >
                          <img src={finishedSrc} alt={photo.finishedFilename || "Finished"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-end p-1.5 opacity-0 group-hover:opacity-100">
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); const a = document.createElement("a"); a.href = finishedSrc; a.download = photo.finishedFilename || "finished.jpg"; a.click(); }}
                                data-testid={`button-download-finished-photo-${photo.id}`}
                                className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setTargetPhotoId(photo.id); finishedInputRef.current?.click(); }}
                                data-testid={`button-replace-finished-${photo.id}`}
                                className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setTargetPhotoId(photo.id); finishedInputRef.current?.click(); }}
                          disabled={isUploading}
                          data-testid={`button-upload-finished-${photo.id}`}
                          className="w-full aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              <span className="text-[10px]">Upload edit</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <button
                onClick={() => {
                  const src = lightboxPhoto.imageUrl.startsWith("/") ? lightboxPhoto.imageUrl : `/objects/${lightboxPhoto.imageUrl}`;
                  const a = document.createElement("a");
                  a.href = src;
                  a.download = lightboxPhoto.originalFilename || "photo.jpg";
                  a.click();
                }}
                data-testid="button-lightbox-download"
                className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxPhoto(null)}
                data-testid="button-lightbox-close"
                className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxPhoto.imageUrl.startsWith("/") ? lightboxPhoto.imageUrl : `/objects/${lightboxPhoto.imageUrl}`}
              alt={lightboxPhoto.originalFilename || "Edit request photo"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {lightboxPhoto.originalFilename && (
              <p className="text-white/70 text-xs mt-2">{lightboxPhoto.originalFilename}</p>
            )}
          </div>
        </div>
      )}

      {showChat && (
        <div className="px-3 pb-3">
          <AdminEditRequestChat editRequestId={request.id} token={token} />
        </div>
      )}
    </div>
  );
}

function AdminEditRequestChat({ editRequestId, token: authToken }: { editRequestId: string; token: string }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<EditRequestMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/edit-requests/${editRequestId}/messages`, authToken);
      if (res.ok) {
        const msgs = await res.json();
        if (!loading && msgs.length > prevCountRef.current) {
          const newest = msgs[msgs.length - 1];
          if (newest.senderRole === "client") {
            playNotificationSound();
          }
        }
        prevCountRef.current = msgs.length;
        setMessages(msgs);
      }
    } catch {} finally { setLoading(false); }
  }, [editRequestId, authToken, loading]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/edit-requests/${editRequestId}/messages`, authToken, {
        method: "POST",
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setNewMessage("");
      await loadMessages();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white" data-testid={`admin-chat-${editRequestId}`}>
      <div className="max-h-60 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No messages yet. Start a conversation with the client.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.senderRole === "admin" ? "items-end" : "items-start"}`}
              data-testid={`admin-message-${msg.id}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.senderRole === "admin"
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className={`text-[10px] font-medium mb-0.5 ${msg.senderRole === "admin" ? "text-white/60" : "text-gray-500"}`}>
                  {msg.senderName || (msg.senderRole === "admin" ? "Armando R." : "Client")}
                </p>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 p-2 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          data-testid={`input-admin-chat-${editRequestId}`}
          className="text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          data-testid={`button-admin-send-${editRequestId}`}
          className="bg-[#1a1a1a] text-white shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function TokenManager({ userId, userName, token, onBack }: { userId: string; userName: string; token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [annual, setAnnual] = useState(0);
  const [purchased, setPurchased] = useState(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tokensRes, txRes, reqRes] = await Promise.all([
        adminFetch(`/api/admin/edit-tokens/${userId}`, token),
        adminFetch(`/api/admin/token-transactions/${userId}`, token),
        adminFetch("/api/admin/edit-requests", token),
      ]);
      if (tokensRes.ok) {
        const data = await tokensRes.json();
        setAnnual(data.annualTokens ?? 0);
        setPurchased(data.purchasedTokens ?? 0);
      }
      if (txRes.ok) setTransactions(await txRes.json());
      if (reqRes.ok) {
        const all: EditRequest[] = await reqRes.json();
        setEditRequests(all.filter((r) => r.userId === userId));
      }
    } catch {
      toast({ title: "Error", description: "Failed to load token data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/edit-tokens/${userId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ annual, purchased }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "Token counts updated" });
      } else {
        toast({ title: "Error", description: "Failed to save tokens", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save tokens", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            data-testid="button-back-from-tokens"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <p className="font-serif text-lg text-gray-900" data-testid="text-tokens-title">Token Management</p>
            <p className="text-xs text-gray-500">{userName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Edit Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <Label className="text-sm text-gray-700">Annual Tokens</Label>
                    <Input
                      type="number"
                      min={0}
                      value={annual}
                      onChange={(e) => setAnnual(parseInt(e.target.value) || 0)}
                      data-testid="input-annual-tokens"
                      className="mt-1 w-32"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">Purchased Tokens</Label>
                    <Input
                      type="number"
                      min={0}
                      value={purchased}
                      onChange={(e) => setPurchased(parseInt(e.target.value) || 0)}
                      data-testid="input-purchased-tokens"
                      className="mt-1 w-32"
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    data-testid="button-save-tokens"
                    className="bg-[#1a1a1a] text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-gray-900">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">No transactions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-transactions">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                          <th className="text-left py-2 pr-4 text-gray-500 font-medium">Type</th>
                          <th className="text-left py-2 pr-4 text-gray-500 font-medium">Amount</th>
                          <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-gray-50" data-testid={`row-transaction-${tx.id}`}>
                            <td className="py-2 pr-4 text-gray-600">
                              {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="py-2 pr-4">
                              <Badge variant="secondary" className="text-xs capitalize">{tx.type}</Badge>
                            </td>
                            <td className="py-2 pr-4 text-gray-900 font-medium">{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</td>
                            <td className="py-2 text-gray-600">{tx.description || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-gray-900">Edit Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {editRequests.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">No edit requests yet</p>
                ) : (
                  <div className="space-y-3">
                    {editRequests.map((req) => (
                      <AdminEditRequestItem key={req.id} request={req} token={token} onDeleted={loadData} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}

interface EmployeeData {
  id: string;
  username: string;
  displayName: string;
  role: string;
  active: number;
  createdAt: string;
}

interface FeaturedProfessional {
  id: string;
  name: string;
  profession: string;
  location: string;
  category: string;
  slug: string;
  portraitImageUrl: string | null;
  portraitCropPosition: { x: number; y: number; zoom?: number } | null;
  heroCropPosition: { x: number; y: number; zoom?: number } | null;
  headline: string;
  quote: string;
  storySections: { whyStarted: string; whatTheyLove: string; misunderstanding: string };
  socialLinks: Array<{ platform: string; url: string }> | null;
  isFeaturedOfWeek: number;
  isSample: number;
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

const defaultFeaturedForm = {
  name: "", profession: "", location: "", category: "",
  headline: "", quote: "",
  whyStarted: "", whatTheyLove: "", misunderstanding: "",
  socialLinks: [] as Array<{ platform: string; url: string }>,
  isFeaturedOfWeek: false,
  seoTitle: "", metaDescription: "",
};

const SOCIAL_PLATFORMS = [
  { value: "website", label: "Website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X (Twitter)" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "snapchat", label: "Snapchat" },
  { value: "threads", label: "Threads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "spotify", label: "Spotify" },
  { value: "reddit", label: "Reddit" },
  { value: "behance", label: "Behance" },
  { value: "dribbble", label: "Dribbble" },
  { value: "medium", label: "Medium" },
  { value: "yelp", label: "Yelp" },
  { value: "github", label: "GitHub" },
  { value: "vimeo", label: "Vimeo" },
  { value: "tumblr", label: "Tumblr" },
];

function normalizeSocialLinksAdmin(links: any): Array<{ platform: string; url: string }> {
  if (Array.isArray(links)) return links;
  if (links && typeof links === "object") {
    return Object.entries(links)
      .filter(([, url]) => typeof url === "string" && url)
      .map(([platform, url]) => ({ platform, url: url as string }));
  }
  return [];
}

const FEATURED_CATEGORIES = [
  "Therapists", "Counselors", "Chefs", "Personal Trainers",
  "Lawyers", "Real Estate Agents",
  "Artists", "Barbers", "Designers", "Entrepreneurs",
];

function AdminSpacePhotos({ space, token, onUpdate }: { space: any; token: string; onUpdate: () => void }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const images: string[] = space.imageUrls || [];

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
        const res = await fetch(`/api/admin/spaces/${space.id}/photos`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error((await res.json()).message || "Upload failed");
        uploaded += batch.length;
      }
      toast({ title: `${uploaded} photo${uploaded > 1 ? "s" : ""} uploaded` });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      if (uploaded > 0) onUpdate();
    }
    setUploading(false);
    setUploadProgress("");
  };

  const handleDelete = async (imageUrl: string) => {
    try {
      const res = await fetch(`/api/admin/spaces/${space.id}/photos`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Photo removed" });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    try {
      const res = await fetch(`/api/admin/spaces/${space.id}/photos/reorder`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: reordered }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      onUpdate();
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
  }, [space.id, token]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  return (
    <div
      className="mt-4 pt-4 border-t border-gray-100"
      data-testid={`admin-space-photos-${space.id}`}
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
          data-testid={`admin-add-photos-${space.id}`}
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
        />
      </div>
      {dragOver && (
        <div className="mb-2 py-6 border-2 border-dashed border-[#c4956a] rounded-lg flex flex-col items-center gap-1 text-[#c4956a] bg-[#c4956a]/5 transition-colors">
          <Upload className="w-5 h-5" />
          <span className="text-xs font-medium">Drop photos here</span>
        </div>
      )}
      {images.length > 0 ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url: string, i: number) => (
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
                data-testid={`admin-space-photo-${space.id}-${i}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Cover</span>
                )}
                <button
                  onClick={() => handleDelete(url)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`admin-delete-photo-${space.id}-${i}`}
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Move className="w-3 h-3 text-white" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Drag to reorder. First photo is the cover image.</p>
        </>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-6 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-1.5 text-gray-400 hover:border-[#c4956a] hover:text-[#c4956a] transition-colors"
          data-testid={`admin-upload-first-photo-${space.id}`}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">Drop photos here or click to upload</span>
        </button>
      )}
    </div>
  );
}

function AdminTransferOwnership({ space, token, onUpdate }: { space: any; token: string; onUpdate: () => void }) {
  const { toast } = useToast();
  const [showTransfer, setShowTransfer] = useState(false);
  const [emailQuery, setEmailQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; firstName?: string; lastName?: string } | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; email: string; firstName?: string; lastName?: string }>>([]);
  const [transferring, setTransferring] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const searchUsers = async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch {}
  };

  const handleInputChange = (val: string) => {
    setEmailQuery(val);
    setSelectedUser(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val), 250);
  };

  const selectUser = (user: { id: string; email: string; firstName?: string; lastName?: string }) => {
    setSelectedUser(user);
    setEmailQuery(user.email || "");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleTransfer = async () => {
    if (!selectedUser && !emailQuery.trim()) return;
    setTransferring(true);
    try {
      const body = selectedUser
        ? { newUserId: selectedUser.id }
        : { email: emailQuery.trim() };
      const res = await fetch(`/api/admin/spaces/${space.id}/transfer`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Transfer failed");
      toast({ title: "Ownership transferred" });
      setShowTransfer(false);
      setEmailQuery("");
      setSelectedUser(null);
      onUpdate();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setTransferring(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mt-3" data-testid={`admin-transfer-${space.id}`}>
      {!showTransfer ? (
        <button
          onClick={() => setShowTransfer(true)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          data-testid={`button-show-transfer-${space.id}`}
        >
          <Move className="w-3 h-3" /> Transfer Ownership
        </button>
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <p className="text-xs font-medium text-gray-600">Transfer to account email:</p>
          <div className="flex gap-2" ref={containerRef}>
            <div className="flex-1 relative">
              <input
                value={emailQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing an email..."
                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
                data-testid={`input-transfer-email-${space.id}`}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
                      data-testid={`suggestion-user-${u.id}`}
                    >
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-gray-900 truncate">{u.email}</p>
                        {(u.firstName || u.lastName) && (
                          <p className="text-[10px] text-gray-400 truncate">{[u.firstName, u.lastName].filter(Boolean).join(" ")}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleTransfer}
              disabled={(!selectedUser && !emailQuery.includes("@")) || transferring}
              className="bg-gray-900 text-white hover:bg-gray-800 text-xs"
              data-testid={`button-confirm-transfer-${space.id}`}
            >
              {transferring ? <Loader2 className="w-3 h-3 animate-spin" /> : "Transfer"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowTransfer(false); setEmailQuery(""); setSelectedUser(null); setSuggestions([]); }} className="text-xs" data-testid={`button-cancel-transfer-${space.id}`}>
              Cancel
            </Button>
          </div>
          {selectedUser && (
            <p className="text-[10px] text-emerald-600">
              Selected: {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ")} ({selectedUser.email})
            </p>
          )}
          {space.ownerInfo && (
            <p className="text-[10px] text-gray-400">
              Current owner: {space.ownerInfo.firstName} {space.ownerInfo.lastName} ({space.ownerInfo.email})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminSpacesManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/spaces/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadSpaces(); }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/spaces/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: `Space ${action}d successfully` });
        loadSpaces();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteSpace = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/spaces/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Space deleted" });
        loadSpaces();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePurgeSamples = async () => {
    const sampleCount = spaces.filter(s => s.isSample === 1).length;
    if (sampleCount === 0) {
      toast({ title: "No sample spaces found" });
      return;
    }
    if (!confirm(`Delete all ${sampleCount} sample spaces? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/spaces/purge-samples", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Deleted ${data.deleted} sample spaces` });
        loadSpaces();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleGeocodeSpace = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/spaces/${id}/geocode`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Geocoded", description: `${name}: ${data.latitude}, ${data.longitude}` });
        loadSpaces();
      } else {
        const err = await res.json();
        toast({ title: "Geocode failed", description: err.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleGeocodeAll = async () => {
    const noCoords = spaces.filter((s: any) => !s.latitude || !s.longitude);
    if (noCoords.length === 0) {
      toast({ title: "All spaces already have coordinates" });
      return;
    }
    if (!confirm(`Geocode ${noCoords.length} spaces without coordinates?`)) return;
    try {
      const res = await fetch("/api/admin/spaces/geocode-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const succeeded = data.results.filter((r: any) => r.success).length;
        toast({ title: `Geocoded ${succeeded} of ${data.results.length} spaces` });
        loadSpaces();
      } else {
        const err = await res.json();
        toast({ title: "Geocode all failed", description: err.message || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const startEdit = (space: any) => {
    setEditingId(space.id);
    setEditForm({
      name: space.name || "",
      type: space.type || "",
      description: space.description || "",
      shortDescription: space.shortDescription || "",
      address: space.address || "",
      neighborhood: space.neighborhood || "",
      pricePerHour: space.pricePerHour || 0,
      pricePerDay: space.pricePerDay || 0,
      capacity: space.capacity || 0,
      targetProfession: space.targetProfession || "",
      availableHours: space.availableHours || "",
      hostName: space.hostName || "",
      contactEmail: space.contactEmail || "",
      amenities: (space.amenities || []).join(", "),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload: any = {
        ...editForm,
        pricePerHour: parseInt(editForm.pricePerHour) || 0,
        pricePerDay: parseInt(editForm.pricePerDay) || null,
        capacity: parseInt(editForm.capacity) || null,
        amenities: editForm.amenities.split(",").map((a: string) => a.trim()).filter(Boolean),
      };
      const res = await fetch(`/api/admin/spaces/${editingId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Space updated successfully" });
        setEditingId(null);
        loadSpaces();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const filtered = (filter === "all" ? spaces : spaces.filter(s => s.approvalStatus === filter)).filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) ||
      (s.address || "").toLowerCase().includes(q) ||
      (s.neighborhood || "").toLowerCase().includes(q) ||
      (s.type || "").toLowerCase().includes(q) ||
      (s.hostName || "").toLowerCase().includes(q) ||
      (s.targetProfession || "").toLowerCase().includes(q) ||
      (s.ownerInfo?.firstName || "").toLowerCase().includes(q) ||
      (s.ownerInfo?.lastName || "").toLowerCase().includes(q) ||
      (s.ownerInfo?.email || "").toLowerCase().includes(q);
  });
  const counts = {
    all: spaces.length,
    pending: spaces.filter(s => s.approvalStatus === "pending").length,
    approved: spaces.filter(s => s.approvalStatus === "approved").length,
    rejected: spaces.filter(s => s.approvalStatus === "rejected").length,
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-emerald-50 text-emerald-700">Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-red-50 text-red-700">Rejected</Badge>;
    return <Badge className="bg-amber-50 text-amber-700">Pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900" data-testid="button-back-spaces">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-lg text-gray-900 flex-1">Manage Spaces</h1>
          {spaces.some((s: any) => !s.latitude || !s.longitude) && (
            <Button size="sm" variant="outline" onClick={handleGeocodeAll} className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs" data-testid="button-geocode-all">
              <MapPin className="w-3 h-3 mr-1" /> Geocode All ({spaces.filter((s: any) => !s.latitude || !s.longitude).length})
            </Button>
          )}
          {spaces.some(s => s.isSample === 1) && (
            <Button size="sm" variant="outline" onClick={handlePurgeSamples} className="border-red-200 text-red-600 hover:bg-red-50 text-xs" data-testid="button-purge-samples">
              <Trash2 className="w-3 h-3 mr-1" /> Purge Samples ({spaces.filter(s => s.isSample === 1).length})
            </Button>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, address, neighborhood, host, type..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors"
            data-testid="input-search-spaces"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              data-testid={`button-filter-spaces-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No spaces found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((space) => (
              <Card key={space.id} className="bg-white" data-testid={`admin-space-${space.id}`}>
                <CardContent className="p-5">
                  {editingId === space.id ? (
                    <div className="space-y-4" data-testid={`edit-form-space-${space.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Editing Space</h3>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                          <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" data-testid="select-edit-type">
                            <option value="office">Office</option>
                            <option value="gym">Training Studio</option>
                            <option value="meeting">Meeting Room</option>
                            <option value="art_studio">Art Studio</option>
                            <option value="photo_studio">Photo/Video Studio</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                          <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-address" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Neighborhood</label>
                          <input value={editForm.neighborhood} onChange={e => setEditForm({ ...editForm, neighborhood: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-neighborhood" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Price/Hour ($)</label>
                          <input type="number" value={editForm.pricePerHour} onChange={e => setEditForm({ ...editForm, pricePerHour: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-price-hour" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Price/Day ($)</label>
                          <input type="number" value={editForm.pricePerDay} onChange={e => setEditForm({ ...editForm, pricePerDay: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-price-day" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Capacity</label>
                          <input type="number" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-capacity" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Host Name</label>
                          <input value={editForm.hostName} onChange={e => setEditForm({ ...editForm, hostName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-host" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Target Profession</label>
                          <input value={editForm.targetProfession} onChange={e => setEditForm({ ...editForm, targetProfession: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-profession" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Available Hours</label>
                          <input value={editForm.availableHours} onChange={e => setEditForm({ ...editForm, availableHours: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-hours" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Contact Email</label>
                          <input value={editForm.contactEmail} onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-email" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Short Description</label>
                        <input value={editForm.shortDescription} onChange={e => setEditForm({ ...editForm, shortDescription: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-short-desc" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]" data-testid="input-edit-description" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Amenities (comma-separated)</label>
                        <input value={editForm.amenities} onChange={e => setEditForm({ ...editForm, amenities: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-amenities" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-gray-900 text-white hover:bg-gray-800" data-testid="button-save-space">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                          Save Changes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} data-testid="button-cancel-edit">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-4 mb-3">
                        {space.imageUrls?.[0] ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={space.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-gray-900">{space.name}</h3>
                            {statusBadge(space.approvalStatus)}
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{space.address}</span>
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                            <span>{space.type}</span>
                            <span>${space.pricePerHour}/hr</span>
                            {space.pricePerDay > 0 && <span>${space.pricePerDay}/day</span>}
                            <span>Cap: {space.capacity || "N/A"}</span>
                            {space.isSample === 1 && <span className="text-amber-500">Sample</span>}
                            {space.latitude && space.longitude ? (
                              <span className="text-emerald-500">Mapped</span>
                            ) : (
                              <span className="text-amber-500">No coords</span>
                            )}
                            {space.imageUrls?.length > 0 && <span>{space.imageUrls.length} photo{space.imageUrls.length > 1 ? "s" : ""}</span>}
                          </div>
                          {space.ownerInfo ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <User className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="text-xs text-blue-600">
                                {[space.ownerInfo.firstName, space.ownerInfo.lastName].filter(Boolean).join(" ") || "Unknown"}
                                {space.ownerInfo.email && <span className="text-gray-400 ml-1">({space.ownerInfo.email})</span>}
                              </span>
                            </div>
                          ) : space.userId ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                              <span className="text-xs text-gray-400">User ID: {space.userId}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-1">
                              <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                              <span className="text-xs text-gray-400">No owner</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {space.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{space.description}</p>
                      )}
                      {space.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {space.amenities.slice(0, 6).map((a: string, i: number) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                          {space.amenities.length > 6 && (
                            <span className="text-[10px] text-gray-400">+{space.amenities.length - 6} more</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => startEdit(space)} className="border-gray-200 text-gray-700 hover:bg-gray-50" data-testid={`button-edit-space-${space.id}`}>
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        {space.approvalStatus !== "approved" && (
                          <Button size="sm" onClick={() => handleAction(space.id, "approve")} className="bg-emerald-600 text-white hover:bg-emerald-700" data-testid={`button-approve-space-${space.id}`}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {space.approvalStatus !== "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => handleAction(space.id, "reject")} className="border-red-200 text-red-600 hover:bg-red-50" data-testid={`button-reject-space-${space.id}`}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        )}
                        {(!space.latitude || !space.longitude) && (
                          <Button size="sm" variant="outline" onClick={() => handleGeocodeSpace(space.id, space.name)} className="border-blue-200 text-blue-600 hover:bg-blue-50" data-testid={`button-geocode-space-${space.id}`}>
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            Geocode
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDeleteSpace(space.id, space.name)} className="border-red-200 text-red-600 hover:bg-red-50" data-testid={`button-delete-space-${space.id}`}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                      <AdminSpacePhotos space={space} token={token} onUpdate={loadSpaces} />
                      <AdminTransferOwnership space={space} token={token} onUpdate={loadSpaces} />
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NominationsManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [nominations, setNominations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const adminFetch = useCallback(async (url: string, opts: any = {}) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (!opts.isFormData) headers["Content-Type"] = "application/json";
    return fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
  }, [token]);

  const loadData = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/nominations");
      setNominations(await res.json());
    } catch {}
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminFetch(`/api/admin/nominations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast({ title: `Marked as ${status}` });
      loadData();
    } catch {}
  };

  const deleteNom = async (id: string) => {
    if (!confirm("Delete this nomination?")) return;
    try {
      await adminFetch(`/api/admin/nominations/${id}`, { method: "DELETE" });
      toast({ title: "Deleted" });
      loadData();
    } catch {}
  };

  const statusColor = (s: string) => {
    if (s === "reviewed") return "bg-blue-100 text-blue-700";
    if (s === "contacted") return "bg-green-100 text-green-700";
    if (s === "declined") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-testid="button-nominations-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">Nominations</h1>
            <span className="text-sm text-gray-500">{nominations.length} total</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : nominations.length === 0 ? (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="font-serif text-lg text-gray-900 mb-1">No nominations yet</h3>
              <p className="text-gray-500 text-sm">Nominations from the featured page will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {nominations.map((nom: any) => (
              <Card key={nom.id} className="bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-base" data-testid={`text-nominee-name-${nom.id}`}>{nom.nomineeName}</h3>
                        <span className="text-sm text-gray-500">{nom.nomineeProfession}</span>
                        <Badge className={`text-[10px] ${statusColor(nom.status)}`} variant="secondary" data-testid={`badge-nomination-status-${nom.id}`}>
                          {nom.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed" data-testid={`text-nominee-reason-${nom.id}`}>"{nom.reason}"</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                        {nom.nominatorName && <span>Nominated by: {nom.nominatorName}</span>}
                        {nom.nomineeContact && <span>Contact: {nom.nomineeContact}</span>}
                        <span>{new Date(nom.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Select value={nom.status} onValueChange={(val) => updateStatus(nom.id, val)}>
                        <SelectTrigger className="h-8 w-[120px] text-xs" data-testid={`select-nomination-status-${nom.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-8 w-8 p-0" onClick={() => deleteNom(nom.id)} data-testid={`button-delete-nomination-${nom.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface PortfolioPhoto {
  id: string;
  imageUrl: string;
  category: string;
  environments: string[];
  brandMessages: string[];
  emotionalImpacts: string[];
  colorPalette: Array<{ hex: string; keyword: string }>;
  locationSpaceId: string | null;
  createdAt: string;
}

function PortfolioManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PortfolioPhoto | null>(null);
  const [adminCategory, setAdminCategory] = useState<"people" | "spaces">("people");
  const [tagForm, setTagForm] = useState<{
    environments: string[];
    brandMessages: string[];
    emotionalImpacts: string[];
    colorPalette: Array<{ hex: string; keyword: string }>;
    locationSpaceId: string | null;
    category: string;
  }>({ environments: [], brandMessages: [], emotionalImpacts: [], colorPalette: [], locationSpaceId: null, category: "people" });
  const [newColorHex, setNewColorHex] = useState("#8B7355");
  const [newColorKeyword, setNewColorKeyword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableSpaces, setAvailableSpaces] = useState<Array<{ id: string; name: string; neighborhood: string | null }>>([]);

  const adminFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    return fetch(url, { ...opts, headers: { ...opts.headers as any, Authorization: `Bearer ${token}` } });
  }, [token]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio-photos");
      if (res.ok) setPhotos(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPhotos();
    fetch("/api/spaces").then(r => r.ok ? r.json() : []).then(setAvailableSpaces).catch(() => {});
  }, [loadPhotos]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("environments", JSON.stringify([]));
      fd.append("brandMessages", JSON.stringify([]));
      fd.append("emotionalImpacts", JSON.stringify([]));
      fd.append("colorPalette", JSON.stringify([]));
      fd.append("category", adminCategory);
      try {
        const res = await adminFetch("/api/admin/portfolio/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
      } catch {
        toast({ title: "Upload failed", description: `Could not upload ${file.name}`, variant: "destructive" });
      }
    }
    await loadPhotos();
    setUploading(false);
    toast({ title: "Upload complete" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this portfolio photo?")) return;
    try {
      await adminFetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
      setPhotos(prev => prev.filter(p => p.id !== id));
      if (editingPhoto?.id === id) setEditingPhoto(null);
      toast({ title: "Photo deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const startEdit = (photo: PortfolioPhoto) => {
    setEditingPhoto(photo);
    setTagForm({
      environments: photo.environments || [],
      brandMessages: photo.brandMessages || [],
      emotionalImpacts: photo.emotionalImpacts || [],
      colorPalette: photo.colorPalette || [],
      locationSpaceId: photo.locationSpaceId || null,
      category: photo.category || "people",
    });
  };

  const saveTagEdits = async () => {
    if (!editingPhoto) return;
    try {
      const res = await adminFetch(`/api/admin/portfolio/${editingPhoto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
        setEditingPhoto(null);
        toast({ title: "Tags updated" });
      }
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const toggleTag = (field: "environments" | "brandMessages" | "emotionalImpacts", value: string) => {
    setTagForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const addColor = () => {
    if (!newColorKeyword.trim()) return;
    setTagForm(prev => ({
      ...prev,
      colorPalette: [...prev.colorPalette, { hex: newColorHex, keyword: newColorKeyword.trim() }],
    }));
    setNewColorKeyword("");
    setNewColorHex("#8B7355");
  };

  const removeColor = (index: number) => {
    setTagForm(prev => ({
      ...prev,
      colorPalette: prev.colorPalette.filter((_, i) => i !== index),
    }));
  };

  const envOptions = ["restaurant", "office", "nature", "workvan", "urban", "suburban", "gym", "kitchen"];
  const brandOptions = ["assured", "empathy", "confidence", "motivation"];
  const moodOptions = ["cozy", "bright", "powerful"];
  const envLabels: Record<string, string> = { restaurant: "Restaurant", office: "Office", nature: "Nature", workvan: "Work Van", urban: "Urban", suburban: "Suburban", gym: "Gym", kitchen: "Kitchen" };
  const brandLabels: Record<string, string> = { assured: "Welcoming", empathy: "Warm", confidence: "Confident", motivation: "Motivated" };
  const moodLabels: Record<string, string> = { cozy: "Comfortable", bright: "Inspired", powerful: "Reassured" };

  const filteredAdminPhotos = photos.filter(p => (p.category || "people") === adminCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-portfolio-back">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="font-serif text-xl font-semibold" data-testid="text-portfolio-title">Portfolio / Our Work</h1>
          <Badge variant="secondary" className="text-xs">{filteredAdminPhotos.length} photos</Badge>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleUpload(e.target.files)}
            data-testid="input-portfolio-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-stone-900 hover:bg-stone-800 text-white"
            data-testid="button-upload-portfolio"
          >
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Photos
          </Button>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-stone-100 rounded-full p-1 gap-1" data-testid="admin-toggle-portfolio-category">
          <button
            onClick={() => setAdminCategory("people")}
            data-testid="admin-toggle-category-people"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              adminCategory === "people"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            People
          </button>
          <button
            onClick={() => setAdminCategory("spaces")}
            data-testid="admin-toggle-category-spaces"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              adminCategory === "spaces"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Spaces
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : filteredAdminPhotos.length === 0 ? (
        <div className="text-center py-20">
          <Images className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No {adminCategory} photos yet</p>
          <p className="text-gray-400 text-sm">Upload photos to showcase your {adminCategory}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredAdminPhotos.map(photo => (
              <div key={photo.id} className="group relative rounded-lg overflow-hidden bg-stone-100 aspect-[3/4]" data-testid={`card-portfolio-${photo.id}`}>
                <img
                  src={photo.imageUrl}
                  alt="Portfolio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end opacity-0 group-hover:opacity-100">
                  <div className="w-full p-2 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() => startEdit(photo)}
                      data-testid={`button-edit-portfolio-${photo.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Tags
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => handleDelete(photo.id)}
                      data-testid={`button-delete-portfolio-${photo.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {(photo.environments?.length > 0 || photo.brandMessages?.length > 0 || photo.emotionalImpacts?.length > 0 || photo.locationSpaceId) && (
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {photo.locationSpaceId && (() => {
                      const sp = availableSpaces.find((s: any) => s.id === photo.locationSpaceId);
                      return sp ? <span className="bg-blue-100/90 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{sp.name}</span> : null;
                    })()}
                    {photo.environments?.slice(0, 2).map(e => (
                      <span key={e} className="bg-white/90 text-[10px] px-1.5 py-0.5 rounded font-medium">{envLabels[e] || e}</span>
                    ))}
                    {photo.brandMessages?.slice(0, 1).map(b => (
                      <span key={b} className="bg-amber-100/90 text-[10px] px-1.5 py-0.5 rounded font-medium">{brandLabels[b] || b}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {editingPhoto && (
            <Card className="border-stone-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-3">
                    <img src={editingPhoto.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                    Edit Tags & Keywords
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPhoto(null)} data-testid="button-close-tag-editor">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTagForm(prev => ({ ...prev, category: "people" }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        tagForm.category === "people" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                      data-testid="tag-category-people"
                    >
                      People
                    </button>
                    <button
                      onClick={() => setTagForm(prev => ({ ...prev, category: "spaces" }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        tagForm.category === "spaces" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                      data-testid="tag-category-spaces"
                    >
                      Spaces
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Environment</Label>
                  <p className="text-xs text-gray-400 mb-2">Where was this shot taken?</p>
                  <div className="flex flex-wrap gap-2">
                    {envOptions.map(env => (
                      <button
                        key={env}
                        onClick={() => toggleTag("environments", env)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          tagForm.environments.includes(env)
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                        data-testid={`tag-env-${env}`}
                      >
                        {envLabels[env] || env}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Brand Message</Label>
                  <p className="text-xs text-gray-400 mb-2">What feeling does this photo communicate?</p>
                  <div className="flex flex-wrap gap-2">
                    {brandOptions.map(b => (
                      <button
                        key={b}
                        onClick={() => toggleTag("brandMessages", b)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          tagForm.brandMessages.includes(b)
                            ? "bg-amber-700 text-white"
                            : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                        }`}
                        data-testid={`tag-brand-${b}`}
                      >
                        {brandLabels[b] || b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Emotional Impact</Label>
                  <p className="text-xs text-gray-400 mb-2">What mood does this photo evoke?</p>
                  <div className="flex flex-wrap gap-2">
                    {moodOptions.map(m => (
                      <button
                        key={m}
                        onClick={() => toggleTag("emotionalImpacts", m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          tagForm.emotionalImpacts.includes(m)
                            ? "bg-blue-700 text-white"
                            : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                        }`}
                        data-testid={`tag-mood-${m}`}
                      >
                        {moodLabels[m] || m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Location (Space)</Label>
                  <p className="text-xs text-gray-400 mb-2">Link this photo to a space where it was taken</p>
                  <select
                    value={tagForm.locationSpaceId || ""}
                    onChange={e => setTagForm(prev => ({ ...prev, locationSpaceId: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400"
                    data-testid="select-location-space"
                  >
                    <option value="">No space linked</option>
                    {availableSpaces.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}{s.neighborhood ? ` — ${s.neighborhood}` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Color Palette</Label>
                  <p className="text-xs text-gray-400 mb-2">Dominant colors in this photo</p>
                  {tagForm.colorPalette.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tagForm.colorPalette.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-full pl-1 pr-2 py-0.5">
                          <div className="w-5 h-5 rounded-full border border-stone-300" style={{ backgroundColor: c.hex }} />
                          <span className="text-xs text-stone-700">{c.keyword}</span>
                          <button onClick={() => removeColor(i)} className="text-stone-400 hover:text-red-500 ml-1" data-testid={`button-remove-color-${i}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={e => setNewColorHex(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                      data-testid="input-color-picker"
                    />
                    <Input
                      value={newColorKeyword}
                      onChange={e => setNewColorKeyword(e.target.value)}
                      placeholder="e.g., Warm Terracotta"
                      className="flex-1 h-8 text-sm"
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addColor())}
                      data-testid="input-color-keyword"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={addColor} data-testid="button-add-color">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setEditingPhoto(null)} data-testid="button-cancel-tags">Cancel</Button>
                  <Button onClick={saveTagEdits} className="bg-stone-900 hover:bg-stone-800 text-white" data-testid="button-save-tags">
                    <Save className="w-4 h-4 mr-2" /> Save Tags
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function FeaturedManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<FeaturedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeaturedProfessional | null>(null);
  const [form, setForm] = useState(defaultFeaturedForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [formPortraitPreview, setFormPortraitPreview] = useState<string | null>(null);
  const [formPortraitFile, setFormPortraitFile] = useState<File | null>(null);
  const [cropPosition, setCropPosition] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 50, zoom: 1 });
  const [heroCropPosition, setHeroCropPosition] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 20, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHeroDragging, setIsHeroDragging] = useState(false);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const heroCropContainerRef = useRef<HTMLDivElement>(null);
  const formPortraitPreviewRef = useRef(formPortraitPreview);
  formPortraitPreviewRef.current = formPortraitPreview;

  useEffect(() => {
    const el = cropContainerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!formPortraitPreviewRef.current) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setCropPosition(prev => ({
        ...prev,
        zoom: Math.max(1, Math.min(2, prev.zoom + delta)),
      }));
    };
    el.addEventListener("wheel", handleWheel, { passive: false });

    const heroEl = heroCropContainerRef.current;
    const handleHeroWheel = (e: WheelEvent) => {
      if (!formPortraitPreviewRef.current) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setHeroCropPosition(prev => ({
        ...prev,
        zoom: Math.max(1, Math.min(2, prev.zoom + delta)),
      }));
    };
    if (heroEl) heroEl.addEventListener("wheel", handleHeroWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (heroEl) heroEl.removeEventListener("wheel", handleHeroWheel);
    };
  }, [showForm]);

  const adminFetch = useCallback(async (url: string, opts: any = {}) => {
    const { isFormData, ...rest } = opts;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (!isFormData) headers["Content-Type"] = "application/json";
    return fetch(url, { ...rest, headers: { ...headers, ...rest.headers } });
  }, [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/featured");
      if (res.ok) setProfessionals(await res.json());
    } catch {}
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const generateSlug = (name: string, profession: string) => {
    return `${name}-${profession}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async () => {
    if (!form.name || !form.profession || !form.category || !form.headline || !form.quote) {
      toast({ title: "Missing fields", description: "Please fill in name, profession, category, headline, and quote", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        profession: form.profession,
        location: form.location,
        category: form.category,
        slug: editing?.slug || generateSlug(form.name, form.profession),
        headline: form.headline,
        quote: form.quote,
        portraitCropPosition: cropPosition,
        heroCropPosition: heroCropPosition,
        storySections: { whyStarted: form.whyStarted, whatTheyLove: form.whatTheyLove, misunderstanding: form.misunderstanding },
        socialLinks: form.socialLinks.filter(s => s.platform && s.url.trim()),
        isFeaturedOfWeek: form.isFeaturedOfWeek ? 1 : 0,
        seoTitle: form.seoTitle || `${form.name} - ${form.profession} | Align`,
        metaDescription: form.metaDescription || form.headline,
      };

      const url = editing ? `/api/admin/featured/${editing.id}` : "/api/admin/featured";
      const method = editing ? "PATCH" : "POST";
      const res = await adminFetch(url, { method, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const savedPro = await res.json();

      if (formPortraitFile && savedPro.id) {
        await handleUploadPortrait(savedPro.id, formPortraitFile);
      }

      toast({ title: editing ? "Updated" : "Created" });
      setShowForm(false);
      setEditing(null);
      setForm(defaultFeaturedForm);
      setFormPortraitFile(null);
      setFormPortraitPreview(null);
      setCropPosition({ x: 50, y: 50, zoom: 1 });
      setHeroCropPosition({ x: 50, y: 20, zoom: 1 });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this professional?")) return;
    try {
      await adminFetch(`/api/admin/featured/${id}`, { method: "DELETE" });
      toast({ title: "Deleted" });
      loadData();
    } catch {}
  };

  const handleUploadPortrait = async (id: string, file: File) => {
    setUploading(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/featured/${id}/upload-portrait`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast({ title: "Portrait uploaded" });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(null);
  };


  const handleRemovePortrait = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/featured/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ portraitImageUrl: null, portraitCropPosition: null }),
      });
      if (!res.ok) throw new Error("Failed to remove portrait");
      toast({ title: "Portrait removed" });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const startEdit = (pro: FeaturedProfessional) => {
    setEditing(pro);
    setForm({
      name: pro.name, profession: pro.profession, location: pro.location,
      category: pro.category, headline: pro.headline, quote: pro.quote,
      whyStarted: pro.storySections.whyStarted,
      whatTheyLove: pro.storySections.whatTheyLove,
      misunderstanding: pro.storySections.misunderstanding,
      socialLinks: normalizeSocialLinksAdmin(pro.socialLinks),
      isFeaturedOfWeek: pro.isFeaturedOfWeek === 1,
      seoTitle: pro.seoTitle || "",
      metaDescription: pro.metaDescription || "",
    });
    setFormPortraitPreview(pro.portraitImageUrl || null);
    setFormPortraitFile(null);
    setCropPosition({ x: pro.portraitCropPosition?.x ?? 50, y: pro.portraitCropPosition?.y ?? 50, zoom: pro.portraitCropPosition?.zoom ?? 1 });
    setHeroCropPosition({ x: pro.heroCropPosition?.x ?? 50, y: pro.heroCropPosition?.y ?? 20, zoom: pro.heroCropPosition?.zoom ?? 1 });
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(defaultFeaturedForm); setFormPortraitFile(null); setFormPortraitPreview(null); setCropPosition({ x: 50, y: 50, zoom: 1 }); setHeroCropPosition({ x: 50, y: 20, zoom: 1 }); }} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">{editing ? "Edit Professional" : "Add Professional"}</h1>
          </div>
        </header>
        <input type="file" ref={formFileInputRef} className="hidden" accept="image/*" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            if (formPortraitPreview?.startsWith("blob:")) URL.revokeObjectURL(formPortraitPreview);
            setFormPortraitFile(file);
            const url = URL.createObjectURL(file);
            setFormPortraitPreview(url);
            setCropPosition({ x: 50, y: 50, zoom: 1 });
            setHeroCropPosition({ x: 50, y: 20, zoom: 1 });
          }
          e.target.value = "";
        }} />
        <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Portrait Photo</h3>
            <div className="flex items-start gap-5">
              <div className="space-y-3 shrink-0">
                <div
                  ref={cropContainerRef}
                  className={`w-40 h-52 rounded-lg overflow-hidden bg-stone-200 relative select-none ${formPortraitPreview ? "cursor-grab active:cursor-grabbing" : ""}`}
                  data-testid="portrait-crop-area"
                  onMouseDown={(e) => {
                    if (!formPortraitPreview) return;
                    e.preventDefault();
                    setIsDragging(true);
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startPos = { ...cropPosition };
                    const handleMove = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX;
                      const dy = ev.clientY - startY;
                      setCropPosition(prev => ({
                        ...prev,
                        x: Math.max(0, Math.min(100, startPos.x - (dx / 1.6))),
                        y: Math.max(0, Math.min(100, startPos.y - (dy / 2.08))),
                      }));
                    };
                    const handleUp = () => {
                      setIsDragging(false);
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    };
                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                  onTouchStart={(e) => {
                    if (!formPortraitPreview) return;
                    e.preventDefault();
                    const touch = e.touches[0];
                    setIsDragging(true);
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    const startPos = { ...cropPosition };
                    const handleMove = (ev: TouchEvent) => {
                      ev.preventDefault();
                      const t = ev.touches[0];
                      const dx = t.clientX - startX;
                      const dy = t.clientY - startY;
                      setCropPosition(prev => ({
                        ...prev,
                        x: Math.max(0, Math.min(100, startPos.x - (dx / 1.6))),
                        y: Math.max(0, Math.min(100, startPos.y - (dy / 2.08))),
                      }));
                    };
                    const cleanup = () => {
                      setIsDragging(false);
                      window.removeEventListener("touchmove", handleMove);
                      window.removeEventListener("touchend", cleanup);
                      window.removeEventListener("touchcancel", cleanup);
                    };
                    window.addEventListener("touchmove", handleMove, { passive: false });
                    window.addEventListener("touchend", cleanup);
                    window.addEventListener("touchcancel", cleanup);
                  }}
                >
                  {formPortraitPreview ? (
                    <>
                      <img
                        src={formPortraitPreview}
                        alt="Portrait preview"
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          objectPosition: `${cropPosition.x}% ${cropPosition.y}%`,
                          transform: `scale(${cropPosition.zoom})`,
                          transformOrigin: `${cropPosition.x}% ${cropPosition.y}%`,
                        }}
                        draggable={false}
                      />
                      {!isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                            <Move className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400">
                      <Camera className="w-8 h-8 text-white/60" />
                    </div>
                  )}
                </div>
                {formPortraitPreview && (
                  <p className="text-[11px] text-gray-400 text-center">Drag to reposition · Scroll to zoom</p>
                )}
              </div>
              <div className="flex flex-col gap-3 pt-1 flex-1">
                <Button variant="outline" size="sm" onClick={() => formFileInputRef.current?.click()} data-testid="button-upload-portrait-form">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {formPortraitPreview ? "Change Photo" : "Upload Photo"}
                </Button>
                {formPortraitPreview && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Zoom</Label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(cropPosition.zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.05"
                        value={cropPosition.zoom}
                        onChange={e => setCropPosition(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                        data-testid="slider-crop-zoom"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Vertical Position</Label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(cropPosition.y)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={cropPosition.y}
                        onChange={e => setCropPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                        data-testid="slider-crop-vertical"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Horizontal Position</Label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(cropPosition.x)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={cropPosition.x}
                        onChange={e => setCropPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                        data-testid="slider-crop-horizontal"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (formPortraitPreview?.startsWith("blob:")) URL.revokeObjectURL(formPortraitPreview);
                        setFormPortraitFile(null);
                        setFormPortraitPreview(null);
                        setCropPosition({ x: 50, y: 50, zoom: 1 });
                        setHeroCropPosition({ x: 50, y: 20, zoom: 1 });
                        if (editing?.portraitImageUrl) {
                          handleRemovePortrait(editing.id);
                          setEditing({ ...editing, portraitImageUrl: null, portraitCropPosition: null, heroCropPosition: null });
                        }
                      }}
                      data-testid="button-remove-portrait-form"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Remove Photo
                    </Button>
                  </>
                )}
                <p className="text-xs text-gray-400">Recommended: 3:4 portrait ratio</p>
              </div>
            </div>
          </div>

          {formPortraitPreview && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Hero Crop (Profile & Featured)</h3>
              <p className="text-xs text-gray-400 mb-2">Controls how the photo appears in the wide hero banner on the profile page and featured section.</p>
              <div className="flex items-start gap-5">
                <div className="space-y-3 shrink-0">
                  <div
                    ref={heroCropContainerRef}
                    className="w-64 h-36 rounded-lg overflow-hidden bg-stone-200 relative select-none cursor-grab active:cursor-grabbing"
                    data-testid="hero-crop-area"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsHeroDragging(true);
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startPos = { ...heroCropPosition };
                      const handleMove = (ev: MouseEvent) => {
                        const dx = ev.clientX - startX;
                        const dy = ev.clientY - startY;
                        setHeroCropPosition(prev => ({
                          ...prev,
                          x: Math.max(0, Math.min(100, startPos.x - (dx / 2.56))),
                          y: Math.max(0, Math.min(100, startPos.y - (dy / 1.44))),
                        }));
                      };
                      const handleUp = () => {
                        setIsHeroDragging(false);
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      setIsHeroDragging(true);
                      const startX = touch.clientX;
                      const startY = touch.clientY;
                      const startPos = { ...heroCropPosition };
                      const handleMove = (ev: TouchEvent) => {
                        ev.preventDefault();
                        const t = ev.touches[0];
                        const dx = t.clientX - startX;
                        const dy = t.clientY - startY;
                        setHeroCropPosition(prev => ({
                          ...prev,
                          x: Math.max(0, Math.min(100, startPos.x - (dx / 2.56))),
                          y: Math.max(0, Math.min(100, startPos.y - (dy / 1.44))),
                        }));
                      };
                      const cleanup = () => {
                        setIsHeroDragging(false);
                        window.removeEventListener("touchmove", handleMove);
                        window.removeEventListener("touchend", cleanup);
                        window.removeEventListener("touchcancel", cleanup);
                      };
                      window.addEventListener("touchmove", handleMove, { passive: false });
                      window.addEventListener("touchend", cleanup);
                      window.addEventListener("touchcancel", cleanup);
                    }}
                  >
                    <img
                      src={formPortraitPreview}
                      alt="Hero preview"
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        objectPosition: `${heroCropPosition.x}% ${heroCropPosition.y}%`,
                        transform: `scale(${heroCropPosition.zoom})`,
                        transformOrigin: `${heroCropPosition.x}% ${heroCropPosition.y}%`,
                      }}
                      draggable={false}
                    />
                    {!isHeroDragging && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                          <Move className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">Drag to reposition · Scroll to zoom</p>
                </div>
                <div className="flex flex-col gap-3 pt-1 flex-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-500">Zoom</Label>
                      <span className="text-xs text-gray-400 tabular-nums">{Math.round(heroCropPosition.zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={heroCropPosition.zoom}
                      onChange={e => setHeroCropPosition(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                      data-testid="slider-hero-zoom"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-500">Vertical</Label>
                      <span className="text-xs text-gray-400 tabular-nums">{Math.round(heroCropPosition.y)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={heroCropPosition.y}
                      onChange={e => setHeroCropPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                      data-testid="slider-hero-vertical"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-500">Horizontal</Label>
                      <span className="text-xs text-gray-400 tabular-nums">{Math.round(heroCropPosition.x)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={heroCropPosition.x}
                      onChange={e => setHeroCropPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                      data-testid="slider-hero-horizontal"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Maria Gonzalez" data-testid="input-featured-name" /></div>
            <div><Label>Profession *</Label><Input value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} placeholder="Licensed Therapist" data-testid="input-featured-profession" /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Coral Gables, FL" data-testid="input-featured-location" /></div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="select-featured-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {FEATURED_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Headline *</Label><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Helping people heal through conversation" data-testid="input-featured-headline" /></div>
          <div><Label>Personal Quote *</Label><Textarea value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} placeholder="A short statement that captures how they see their work..." data-testid="input-featured-quote" rows={2} /></div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Story Sections</h3>
            <div><Label>Why They Do This Work</Label><Textarea value={form.whyStarted} onChange={e => setForm({ ...form, whyStarted: e.target.value })} placeholder="The deeper reason they chose this path..." rows={4} data-testid="input-featured-why" /></div>
            <div><Label>What Makes It Meaningful</Label><Textarea value={form.whatTheyLove} onChange={e => setForm({ ...form, whatTheyLove: e.target.value })} placeholder="The part of the work that matters most to them..." rows={4} data-testid="input-featured-love" /></div>
            <div><Label>A Common Misconception (optional)</Label><Textarea value={form.misunderstanding} onChange={e => setForm({ ...form, misunderstanding: e.target.value })} placeholder="Something people often misunderstand about their profession..." rows={4} data-testid="input-featured-misunderstand" /></div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Social Links</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm({ ...form, socialLinks: [...form.socialLinks, { platform: "", url: "" }] })}
                data-testid="button-add-social"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Link
              </Button>
            </div>
            {form.socialLinks.length === 0 && (
              <p className="text-sm text-gray-400 italic">No social links added yet. Click "Add Link" to get started.</p>
            )}
            <div className="space-y-3">
              {form.socialLinks.map((link, idx) => {
                const usedPlatforms = form.socialLinks.map((s, i) => i !== idx ? s.platform : "").filter(Boolean);
                const availablePlatforms = SOCIAL_PLATFORMS.filter(p => !usedPlatforms.includes(p.value));
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-40 shrink-0">
                      <Select
                        value={link.platform}
                        onValueChange={v => {
                          const updated = [...form.socialLinks];
                          updated[idx] = { ...updated[idx], platform: v };
                          setForm({ ...form, socialLinks: updated });
                        }}
                      >
                        <SelectTrigger data-testid={`select-social-platform-${idx}`}>
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlatforms.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                          {link.platform && !availablePlatforms.find(p => p.value === link.platform) && (
                            <SelectItem value={link.platform}>
                              {SOCIAL_PLATFORMS.find(p => p.value === link.platform)?.label || link.platform}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={link.url}
                        onChange={e => {
                          const updated = [...form.socialLinks];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          setForm({ ...form, socialLinks: updated });
                        }}
                        placeholder="https://..."
                        data-testid={`input-social-url-${idx}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 mt-0.5 px-2"
                      onClick={() => {
                        const updated = form.socialLinks.filter((_, i) => i !== idx);
                        setForm({ ...form, socialLinks: updated });
                      }}
                      data-testid={`button-remove-social-${idx}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">SEO</h3>
            <div><Label>SEO Title</Label><Input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="Auto-generated if left blank" data-testid="input-featured-seo-title" /></div>
            <div><Label>Meta Description</Label><Textarea value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} placeholder="Auto-generated from headline if left blank" rows={2} data-testid="input-featured-meta" /></div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeaturedOfWeek} onChange={e => setForm({ ...form, isFeaturedOfWeek: e.target.checked })} className="rounded" data-testid="checkbox-featured-week" />
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Professional of the Week</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={saving} data-testid="button-save-featured">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editing ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultFeaturedForm); setFormPortraitFile(null); setFormPortraitPreview(null); setCropPosition({ x: 50, y: 50, zoom: 1 }); setHeroCropPosition({ x: 50, y: 20, zoom: 1 }); }}>Cancel</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-testid="button-featured-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">Featured Professionals</h1>
            <span className="text-sm text-gray-500">{professionals.length} profiles</span>
          </div>
          <Button size="sm" onClick={() => { setShowForm(true); setEditing(null); setForm(defaultFeaturedForm); setFormPortraitFile(null); setFormPortraitPreview(null); setCropPosition({ x: 50, y: 50, zoom: 1 }); setHeroCropPosition({ x: 50, y: 20, zoom: 1 }); }} data-testid="button-add-featured">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </header>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
        const file = e.target.files?.[0];
        if (file && uploadTargetId) handleUploadPortrait(uploadTargetId, file);
        e.target.value = "";
      }} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : professionals.length === 0 ? (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Star className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="font-serif text-lg text-gray-900 mb-1">No featured professionals yet</h3>
              <p className="text-gray-500 text-sm mb-4">Add your first professional</p>
              <Button size="sm" onClick={() => { setShowForm(true); setEditing(null); setForm(defaultFeaturedForm); setFormPortraitFile(null); setFormPortraitPreview(null); setCropPosition({ x: 50, y: 50, zoom: 1 }); setHeroCropPosition({ x: 50, y: 20, zoom: 1 }); }}>Add Professional</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map(pro => {
              const initials = pro.name.split(" ").map(n => n[0]).join("").slice(0, 2);
              return (
                <Card key={pro.id} className="overflow-hidden" data-testid={`admin-featured-card-${pro.id}`}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-stone-200 group cursor-pointer"
                    onClick={() => { setUploadTargetId(pro.id); fileInputRef.current?.click(); }}>
                    {pro.portraitImageUrl ? (
                      <img src={pro.portraitImageUrl} alt={pro.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400">
                        <span className="text-4xl font-serif text-white/80">{initials}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      {uploading === pro.id ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white" />}
                    </div>
                    {pro.isFeaturedOfWeek ? (
                      <div className="absolute top-2 right-2"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /></div>
                    ) : null}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-0.5">{pro.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{pro.profession} · {pro.location}</p>
                    <p className="text-xs text-gray-400 mb-3 truncate italic">"{pro.headline}"</p>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => startEdit(pro)} data-testid={`button-edit-featured-${pro.id}`}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/featured/${pro.slug}`, "_blank")} data-testid={`button-view-featured-${pro.id}`}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDelete(pro.id)} data-testid={`button-delete-featured-${pro.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AnalyticsManager({ token, onBack }: { token: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/analytics?days=${days}`, token);
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const pageLabel = (path: string) => {
    const labels: Record<string, string> = {
      "/": "Home",
      "/portraits": "Portraits Landing",
      "/portraits/builder": "Build My Photo",
      "/portfolio": "Portfolio",
      "/about": "Photographers",
      "/portal": "Client Portal",
      "/featured": "Featured",
      "/browse": "Browse Spaces",
    };
    return labels[path] || path;
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              data-testid="button-analytics-back"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <p className="font-serif text-lg text-gray-900" data-testid="text-analytics-title">Analytics</p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                data-testid={`button-analytics-${d}d`}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  days === d ? "bg-[#1a1a1a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !data ? (
          <p className="text-center text-gray-500 py-20">No analytics data available yet.</p>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border-gray-100">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Page Views</p>
                  <p className="text-3xl font-serif text-gray-900 mt-1" data-testid="text-total-views">{data.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Last {days} days</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-100">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Unique Visitors</p>
                  <p className="text-3xl font-serif text-gray-900 mt-1" data-testid="text-unique-visitors">{data.uniqueVisitors.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Last {days} days</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-100">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Avg. Time on Page</p>
                  <p className="text-3xl font-serif text-gray-900 mt-1" data-testid="text-avg-duration">{formatDuration(data.avgDuration)}</p>
                  <p className="text-xs text-gray-400 mt-1">Per page view</p>
                </CardContent>
              </Card>
            </div>

            {data.daily.length > 0 && (
              <Card className="bg-white border-gray-100">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Daily Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <div className="flex items-end gap-[2px] h-full">
                      {data.daily.map((d: any, i: number) => {
                        const prev = data.daily[i - 1];
                        const maxViews = Math.max(...data.daily.map((x: any) => x.views), 1);
                        const viewsHeight = (d.views / maxViews) * 100;
                        const visitorsHeight = (d.visitors / maxViews) * 100;
                        const isUp = !prev || d.views >= prev.views;
                        const date = new Date(d.date + "T12:00:00");
                        const label = `${date.getMonth() + 1}/${date.getDate()}`;
                        const bodyBottom = Math.min(viewsHeight, visitorsHeight);
                        const bodyTop = Math.max(viewsHeight, visitorsHeight);
                        const bodyHeight = Math.max(bodyTop - bodyBottom, 2);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                            <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {label}: {d.views} views, {d.visitors} visitors
                            </div>
                            <div className="relative flex flex-col items-center justify-end" style={{ height: `${Math.max(viewsHeight, 1)}%` }}>
                              <div
                                className="w-[2px] absolute top-0 left-1/2 -translate-x-1/2"
                                style={{
                                  height: `${Math.max(viewsHeight - bodyTop, 0)}%`,
                                  backgroundColor: isUp ? "#c4956a" : "#9ca3af",
                                }}
                              />
                              <div
                                className="w-full rounded-sm transition-colors"
                                style={{
                                  height: `${bodyHeight}%`,
                                  minHeight: "4px",
                                  backgroundColor: isUp ? "#c4956a" : "#d1d5db",
                                  border: `1px solid ${isUp ? "#b38456" : "#9ca3af"}`,
                                }}
                              />
                              {bodyBottom > 1 && (
                                <div
                                  className="w-[2px] absolute bottom-0 left-1/2 -translate-x-1/2"
                                  style={{
                                    height: `${bodyBottom}%`,
                                    backgroundColor: isUp ? "#c4956a" : "#9ca3af",
                                  }}
                                />
                              )}
                            </div>
                            {(i === 0 || i === data.daily.length - 1 || i % Math.ceil(data.daily.length / 7) === 0) && (
                              <span className="text-[9px] text-gray-400 mt-1 leading-none">{label}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 justify-end">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#c4956a] border border-[#b38456]" />
                        <span className="text-[10px] text-gray-500">Up from previous day</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-[#d1d5db] border border-[#9ca3af]" />
                        <span className="text-[10px] text-gray-500">Down from previous day</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-100">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topPages.length === 0 ? (
                    <p className="text-sm text-gray-400">No page data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {data.topPages.map((p: any, i: number) => {
                        const maxCount = data.topPages[0]?.count || 1;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-700 truncate max-w-[200px]" data-testid={`text-page-${i}`}>
                                {pageLabel(p.page)}
                              </span>
                              <span className="text-xs text-gray-400 tabular-nums">{p.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#c4956a] rounded-full transition-all"
                                style={{ width: `${(p.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-white border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-700">Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.devices.length === 0 ? (
                      <p className="text-sm text-gray-400">No device data yet</p>
                    ) : (
                      <div className="flex gap-4">
                        {data.devices.map((d: any) => {
                          const total = data.devices.reduce((s: number, x: any) => s + x.count, 0);
                          const pct = Math.round((d.count / total) * 100);
                          return (
                            <div key={d.device} className="flex-1 text-center">
                              <div className="text-2xl font-serif text-gray-900" data-testid={`text-device-${d.device}`}>{pct}%</div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 capitalize">{d.device}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-700">Top Referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.topReferrers.length === 0 ? (
                      <p className="text-sm text-gray-400">No referrer data yet</p>
                    ) : (
                      <div className="space-y-2">
                        {data.topReferrers.slice(0, 5).map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 truncate max-w-[180px]" data-testid={`text-referrer-${i}`}>{r.source}</span>
                            <span className="text-xs text-gray-400 tabular-nums">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmployeeManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "", displayName: "", role: "editor" });
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/employees", token);
      if (res.ok) setEmployees(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const resetForm = () => {
    setFormData({ username: "", password: "", displayName: "", role: "editor" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.username || !formData.displayName || (!editingId && !formData.password)) {
      toast({ title: "Error", description: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const body: any = { username: formData.username, displayName: formData.displayName, role: formData.role };
        if (formData.password) body.password = formData.password;
        const res = await adminFetch(`/api/admin/employees/${editingId}`, token, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to update");
        }
        toast({ title: "Employee updated" });
      } else {
        const res = await adminFetch("/api/admin/employees", token, {
          method: "POST",
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to create");
        }
        toast({ title: "Employee created" });
      }
      resetForm();
      loadEmployees();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (emp: EmployeeData) => {
    try {
      const res = await adminFetch(`/api/admin/employees/${emp.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ active: emp.active ? 0 : 1 }),
      });
      if (res.ok) {
        loadEmployees();
        toast({ title: emp.active ? "Employee deactivated" : "Employee activated" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/employees/${id}`, token, { method: "DELETE" });
      if (res.ok) {
        loadEmployees();
        toast({ title: "Employee deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const startEdit = (emp: EmployeeData) => {
    setEditingId(emp.id);
    setFormData({ username: emp.username, password: "", displayName: emp.displayName, role: emp.role });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="button-emp-back">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <p className="font-serif text-lg text-gray-900">Team Members</p>
          </div>
          <Button
            size="sm"
            onClick={() => { resetForm(); setShowForm(true); }}
            data-testid="button-add-employee"
            className="bg-[#1a1a1a] h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Employee
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-gray-200">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-medium text-gray-900 text-sm">{editingId ? "Edit Employee" : "New Employee"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Display Name *</label>
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
                        placeholder="e.g. Sarah Johnson"
                        data-testid="input-emp-display-name"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Username *</label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                        placeholder="e.g. sarah"
                        data-testid="input-emp-username"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Password {editingId ? "(leave blank to keep)" : "*"}</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                        placeholder={editingId ? "••••••••" : "Enter password"}
                        data-testid="input-emp-password"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Role</label>
                      <Select value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v }))}>
                        <SelectTrigger className="h-9" data-testid="select-emp-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor — View & edit photos, chat</SelectItem>
                          <SelectItem value="manager">Manager — Full access except admin settings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={resetForm} className="h-8" data-testid="button-emp-cancel">Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 bg-[#1a1a1a]" data-testid="button-emp-save">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                      {editingId ? "Update" : "Create"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No employees yet</p>
            <p className="text-gray-400 text-xs mt-1">Add team members to help manage your photoshoots</p>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map(emp => (
              <Card key={emp.id} className={`${!emp.active ? "opacity-50" : ""}`} data-testid={`card-employee-${emp.id}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 bg-gray-100">
                        <AvatarFallback className="text-sm font-medium">{emp.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.displayName}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">@{emp.username}</p>
                          <Badge variant="secondary" className="text-[10px] capitalize">{emp.role}</Badge>
                          {!emp.active && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(emp)}
                        data-testid={`button-edit-emp-${emp.id}`}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(emp)}
                        data-testid={`button-toggle-emp-${emp.id}`}
                        className={`h-8 px-2 text-xs ${emp.active ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}`}
                      >
                        {emp.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(emp.id)}
                        data-testid={`button-delete-emp-${emp.id}`}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="bg-gray-100 rounded-lg p-4 mt-6">
          <p className="text-xs font-medium text-gray-600 mb-2">Team login URL</p>
          <p className="text-sm text-gray-900 font-mono bg-white rounded px-3 py-2 border border-gray-200 select-all" data-testid="text-team-url">
            {window.location.origin}/team
          </p>
        </div>
      </main>
    </div>
  );
}

function AdminDashboard({ token }: { token: string }) {
  const { toast } = useToast();
  const { status: pushStatus, subscribe: subscribePush } = usePushNotifications("admin");
  const [users, setUsers] = useState<UserType[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"clients" | "create" | "edit" | "gallery" | "tokens" | "employees" | "featured" | "nominations" | "portfolio" | "spaces" | "analytics">("clients");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);
  const [galleryShoot, setGalleryShoot] = useState<Shoot | null>(null);
  const [form, setForm] = useState<ShootFormData>(defaultShootForm);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceShoot, setInvoiceShoot] = useState<Shoot | null>(null);
  const [allEditTokens, setAllEditTokens] = useState<EditToken[]>([]);
  const [selectedTokenUser, setSelectedTokenUser] = useState<UserType | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ firstName: "", lastName: "", email: "" });
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return email.includes(q) || name.includes(q);
  });

  const tokenMap = new Map<string, EditToken>();
  allEditTokens.forEach((t) => tokenMap.set(t.userId, t));

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, shootsRes, tokensRes] = await Promise.all([
        adminFetch("/api/admin/users", token),
        adminFetch("/api/admin/shoots", token),
        adminFetch("/api/admin/all-edit-tokens", token),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (shootsRes.ok) setShoots(await shootsRes.json());
      if (tokensRes.ok) setAllEditTokens(await tokensRes.json());
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

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await adminFetch(`/api/admin/users/${deletingUser.id}`, token, {
        method: "DELETE",
        body: JSON.stringify({ deletePassword }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setShoots((prev) => prev.filter((s) => s.userId !== deletingUser.id));
        setDeletingUser(null);
        setDeletePassword("");
        setDeleteConfirmText("");
        toast({ title: "Deleted", description: "Account and all associated data removed" });
      } else {
        const data = await res.json();
        setDeleteError(data.message || "Failed to delete account");
      }
    } catch {
      setDeleteError("Connection error");
    } finally {
      setDeleteLoading(false);
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

  if (view === "tokens" && selectedTokenUser) {
    const name = `${selectedTokenUser.firstName || ""} ${selectedTokenUser.lastName || ""}`.trim() || selectedTokenUser.email || "Client";
    return (
      <TokenManager
        userId={selectedTokenUser.id}
        userName={name}
        token={token}
        onBack={() => { setView("clients"); setSelectedTokenUser(null); loadData(); }}
      />
    );
  }

  if (view === "employees") {
    return <EmployeeManager token={token} onBack={() => setView("clients")} />;
  }

  if (view === "portfolio") {
    return <PortfolioManager token={token} onBack={() => setView("clients")} />;
  }

  if (view === "featured") {
    return <FeaturedManager token={token} onBack={() => setView("clients")} />;
  }

  if (view === "nominations") {
    return <NominationsManager token={token} onBack={() => setView("clients")} />;
  }

  if (view === "spaces") {
    return <AdminSpacesManager token={token} onBack={() => setView("clients")} />;
  }

  if (view === "analytics") {
    return <AnalyticsManager token={token} onBack={() => setView("clients")} />;
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("portfolio")}
              data-testid="button-manage-portfolio"
              className="h-8 text-xs border-gray-200 text-gray-600"
            >
              <Images className="w-3.5 h-3.5 mr-1.5" />
              Portfolio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("featured")}
              data-testid="button-manage-featured"
              className="h-8 text-xs border-gray-200 text-gray-600"
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Featured
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("nominations")}
              data-testid="button-manage-nominations"
              className="h-8 text-xs border-gray-200 text-gray-600"
            >
              <Heart className="w-3.5 h-3.5 mr-1.5" />
              Nominations
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("employees")}
              data-testid="button-manage-team"
              className="h-8 text-xs border-gray-200 text-gray-600"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Team
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("spaces")}
              data-testid="button-manage-spaces"
              className="h-8 text-xs border-gray-200 text-gray-600"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Spaces
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("analytics")}
              data-testid="button-manage-analytics"
              className="h-8 text-xs border-gray-200 text-gray-600"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Analytics
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {pushStatus === "prompt" && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
            <Bell className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">Get notified when clients message you</p>
              <p className="text-xs text-blue-600">Receive push notifications on this device</p>
            </div>
            <Button
              size="sm"
              onClick={subscribePush}
              data-testid="button-admin-enable-notifications"
              className="bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            >
              <BellRing className="w-3.5 h-3.5 mr-1.5" />
              Enable
            </Button>
          </div>
        )}
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
                                  <button
                                    onClick={() => {
                                      setDeletingUser(user);
                                      setDeletePassword("");
                                      setDeleteConfirmText("");
                                      setDeleteError("");
                                    }}
                                    data-testid={`button-delete-user-${user.id}`}
                                    className="text-gray-400 hover:text-red-500 shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge variant="secondary" className="text-xs" data-testid={`badge-annual-tokens-${user.id}`}>
                                  <Coins className="w-3 h-3 mr-1" />
                                  Annual: {tokenMap.get(user.id)?.annualTokens ?? 0}
                                </Badge>
                                <Badge variant="secondary" className="text-xs" data-testid={`badge-purchased-tokens-${user.id}`}>
                                  <Coins className="w-3 h-3 mr-1" />
                                  Purchased: {tokenMap.get(user.id)?.purchasedTokens ?? 0}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setSelectedTokenUser(user); setView("tokens"); }}
                                  data-testid={`button-tokens-${user.id}`}
                                  className="h-6 text-xs px-2 text-gray-600 border-gray-200"
                                >
                                  <ImagePlus className="w-3 h-3 mr-1" />
                                  Editor
                                </Button>
                              </div>
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

      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                You are about to permanently delete <strong>{deletingUser.firstName} {deletingUser.lastName}</strong>'s account
                ({deletingUser.email}). This will remove all their shoots, gallery images, folders, and favorites.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-700">Type "DELETE" to confirm</Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder='Type "DELETE"'
                  data-testid="input-delete-confirm"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Delete password</Label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter delete password"
                  data-testid="input-delete-password"
                  className="mt-1"
                />
              </div>
            </div>

            {deleteError && (
              <p className="text-red-500 text-sm mt-3" data-testid="text-delete-error">{deleteError}</p>
            )}

            <div className="flex gap-2 mt-5">
              <Button
                variant="outline"
                onClick={() => setDeletingUser(null)}
                className="flex-1"
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={deleteConfirmText !== "DELETE" || !deletePassword || deleteLoading}
                data-testid="button-confirm-delete"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                Delete Account
              </Button>
            </div>
          </motion.div>
        </div>
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
    sessionStorage.setItem("adminToken", t);
    setToken(t);
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} />;
}
