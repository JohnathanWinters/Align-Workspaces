import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  CheckCheck,
  CheckCircle2,
  Users,
  Camera,
  Plus,
  Trash2,
  Edit,
  FileText,
  ChevronLeft,
  ChevronRight,
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
  MessageSquare,
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
  Pipette,
  Phone,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  CalendarDays,
  CalendarPlus,
  Instagram,
  Globe,
  ChevronDown,
  Menu,
  LayoutDashboard,
  ArrowUpDown,
  Bug,
  Eye,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { EmojiPickerButton } from "@/components/emoji-picker-button";
import { ImageAttachButton, MessageImage } from "@/components/image-attach-button";
import { playNotificationSound } from "@/lib/notification-sound";
import { Badge } from "@/components/ui/badge";
import type { Shoot, User as UserType, GalleryImage, GalleryFolder, PipelineContact } from "@shared/schema";
import AdminTeamMembers from "@/components/admin-team-members";

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
  const headers: Record<string, string> = {};
  // Use Bearer token for legacy/employee auth, session cookie for magic link auth
  if (token && token !== "__session__") {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      ...headers,
      ...(fetchOptions.headers as Record<string, string>),
    },
  });
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Check for auth status query params from redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("auth");
    if (authStatus === "expired") setError("Sign-in link has expired. Please request a new one.");
    else if (authStatus === "invalid") setError("Invalid sign-in link.");
    else if (authStatus === "unauthorized") setError("This email is not authorized for admin access.");
    else if (authStatus === "error") setError("Something went wrong. Please try again.");
    // Clean up URL params
    if (authStatus) {
      window.history.replaceState({}, "", "/admin");
    }
  }, []);

  // Check if already authenticated via session
  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(res => { if (res.ok) return res.json(); throw new Error(); })
      .then(() => onLogin("__session__"))
      .catch(() => {});
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Failed to send sign-in link");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm px-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="font-serif text-2xl text-white mb-2">Check Your Email</h1>
          <p className="text-white/50 text-sm mb-6">
            We sent a sign-in link to <span className="text-white/80">{email}</span>.
            <br />Click the link in the email to access the admin panel.
          </p>
          <p className="text-white/30 text-xs">The link expires in 15 minutes.</p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="mt-6 text-white/40 text-sm hover:text-white/60 transition-colors"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    );
  }

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
          <p className="text-white/50 text-sm">Enter your email to receive a sign-in link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              data-testid="input-admin-email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-10"
            />
          </div>
          {error && <p className="text-red-400 text-sm" data-testid="text-login-error">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !email.trim()}
            data-testid="button-admin-login"
            className="w-full bg-white text-black"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Sign-In Link"}
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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
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

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
    (item) => item.description.trim() && item.amount.trim() && !isNaN(parseFloat(item.amount)) && parseFloat(item.amount) !== 0
  ) && totalAmount > 0;

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
      <div className="border-t border-gray-200 p-2 flex gap-2 items-center">
        <EmojiPickerButton onEmoji={(emoji) => setNewMessage((prev) => prev + emoji)} />
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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
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

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
  storySections: {
    narrativeHook?: string;
    qaSections?: Array<{ question: string; answer: string }>;
    whyStarted?: string;
    whatTheyLove?: string;
    misunderstanding?: string;
  };
  socialLinks: Array<{ platform: string; url: string }> | null;
  credentials: string[] | null;
  yearsInPractice: number | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isFeaturedOfWeek: number;
  isSample: number;
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

const defaultFeaturedForm = {
  name: "", profession: "", location: "", category: "",
  headline: "", quote: "",
  narrativeHook: "",
  qaSections: [{ question: "", answer: "" }] as Array<{ question: string; answer: string }>,
  whyStarted: "", whatTheyLove: "", misunderstanding: "",
  credentials: [""] as string[],
  yearsInPractice: "",
  ctaLabel: "", ctaUrl: "",
  socialLinks: [] as Array<{ platform: string; url: string }>,
  isFeaturedOfWeek: false,
  seoTitle: "", metaDescription: "",
  yearsHosting: "",
  locationCount: "",
  spaceName: "",
  spaceQuote: "",
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

function AdminSpaceBookings({ spaceId, token }: { spaceId: string; token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    adminFetch(`/api/admin/spaces/${spaceId}/bookings`, token)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [expanded, spaceId, token]);

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-gray-100 text-gray-500",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  };

  const tierLabels: Record<string, string> = {
    standard: "Standard",
    host_referred: "Referred",
    repeat_guest: "Repeat",
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Receipt className="w-4 h-4" />
        Bookings & Transactions
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : !data?.bookings?.length ? (
            <p className="text-xs text-gray-400 text-center py-4">No bookings yet</p>
          ) : (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "Bookings", value: data.summary.paidBookings },
                  { label: "Total Charged", value: `$${(data.summary.totalRevenue / 100).toFixed(0)}` },
                  { label: "Platform Rev", value: `$${(data.summary.totalPlatformRevenue / 100).toFixed(0)}` },
                  { label: "Host Payouts", value: `$${(data.summary.totalHostPayouts / 100).toFixed(0)}` },
                  { label: "Tax Collected", value: `$${(data.summary.totalTax / 100).toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>

              {/* Booking rows */}
              <div className="space-y-1.5">
                {data.bookings.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2.5 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{b.guestName}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[b.status] || "bg-gray-100 text-gray-500"}`}>
                          {b.status}
                        </span>
                        {b.feeTier !== "standard" && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            {tierLabels[b.feeTier] || b.feeTier}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mt-0.5">
                        {b.bookingDate} · {b.bookingStartTime || "–"} · {b.bookingHours}hr
                        {b.guestEmail && <span className="ml-2 text-gray-300">{b.guestEmail}</span>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="font-semibold text-gray-900">${(b.totalCharged / 100).toFixed(2)}</p>
                      <div className="flex items-center gap-2 justify-end text-[10px] text-gray-400">
                        <span>Host: ${(b.hostPayout / 100).toFixed(2)}</span>
                        <span>Align: ${(b.platformRevenue / 100).toFixed(2)}</span>
                        <span>Tax: ${(b.taxAmount / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewsManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden" | "flagged">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "photography" | "workspaces">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const adminFetchLocal = useCallback(async (url: string, opts: any = {}) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (!opts.isFormData) headers["Content-Type"] = "application/json";
    return fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
  }, [token]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [spaceRes, shootRes] = await Promise.all([
        adminFetchLocal("/api/admin/reviews"),
        adminFetchLocal("/api/admin/shoot-reviews"),
      ]);
      const spaceReviews = spaceRes.ok ? (await spaceRes.json()).map((r: any) => ({ ...r, _type: "workspaces" })) : [];
      const shootReviews = shootRes.ok ? (await shootRes.json()).map((r: any) => ({ ...r, _type: "photography" })) : [];
      const merged = [...spaceReviews, ...shootReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(merged);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [adminFetchLocal]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const updateStatus = async (id: string, status: "published" | "hidden" | "flagged", type: string) => {
    const endpoint = type === "photography" ? `/api/admin/shoot-reviews/${id}` : `/api/admin/reviews/${id}`;
    try {
      const res = await adminFetchLocal(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: `Review marked as ${status}` });
        loadReviews();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteReview = async (id: string, type: string) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    const endpoint = type === "photography" ? `/api/admin/shoot-reviews/${id}` : `/api/admin/reviews/${id}`;
    try {
      const res = await adminFetchLocal(endpoint, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Review deleted" });
        loadReviews();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const statusColor = (s: string) => {
    if (s === "published") return "bg-green-100 text-green-700";
    if (s === "hidden") return "bg-yellow-100 text-yellow-700";
    if (s === "flagged") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const filtered = reviews.filter((r) => {
    if (typeFilter !== "all" && r._type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (r.guestName || r.clientName || r.userName || "").toLowerCase();
      const source = (r.spaceName || r.shootTitle || "").toLowerCase();
      return name.includes(q) || source.includes(q);
    }
    return true;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-testid="button-reviews-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">Reviews ({filtered.length})</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="pl-10 bg-white"
              data-testid="input-reviews-search"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-full sm:w-44 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="photography">Photography</SelectItem>
              <SelectItem value="workspaces">Workspaces</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-44 bg-white" data-testid="select-reviews-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="font-serif text-lg text-gray-900 mb-1">No reviews found</h3>
              <p className="text-gray-500 text-sm">
                {statusFilter !== "all" ? `No ${statusFilter} reviews` : "Reviews will appear here once guests leave feedback"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1.5fr_1fr_100px_1.5fr_90px_90px_120px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Source</span>
              <span>Client</span>
              <span>Rating</span>
              <span>Comment</span>
              <span>Status</span>
              <span>Date</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Review rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map((review: any) => (
                <div
                  key={review.id}
                  className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_100px_1.5fr_90px_90px_120px] gap-2 sm:gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors items-center"
                  data-testid={`review-row-${review.id}`}
                >
                  {/* Source */}
                  <div className="flex items-center gap-2 min-w-0">
                    {review._type === "photography" ? (
                      <Camera className="w-4 h-4 text-[#c4956a] shrink-0 hidden sm:block" />
                    ) : (
                      <Building2 className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate" data-testid={`text-review-space-${review.id}`}>
                      {review._type === "photography" ? (review.shootTitle || "Photography") : (review.spaceName || "Workspace")}
                    </span>
                  </div>

                  {/* Client name */}
                  <div className="text-sm text-gray-600 truncate" data-testid={`text-review-guest-${review.id}`}>
                    <span className="sm:hidden text-xs text-gray-400 mr-1">by</span>
                    {review.guestName || review.clientName || review.userName || "Unknown"}
                  </div>

                  {/* Rating */}
                  <div data-testid={`rating-review-${review.id}`}>
                    {renderStars(review.rating || 0)}
                  </div>

                  {/* Comment (truncated) */}
                  <div className="text-sm text-gray-500 truncate" title={review.comment || ""} data-testid={`text-review-comment-${review.id}`}>
                    {review.comment ? (review.comment.length > 60 ? review.comment.slice(0, 60) + "..." : review.comment) : <span className="italic text-gray-300">No comment</span>}
                  </div>

                  {/* Status badge */}
                  <div>
                    <Badge className={`text-[10px] ${statusColor(review.status)} shrink-0`} variant="secondary" data-testid={`badge-review-status-${review.id}`}>
                      {review.status || "unknown"}
                    </Badge>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-400" data-testid={`text-review-date-${review.id}`}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    {review.status !== "published" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(review.id, "published", review._type)}
                        className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Publish"
                        data-testid={`button-review-publish-${review.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {review.status !== "hidden" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(review.id, "hidden", review._type)}
                        className="h-7 px-2 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        title="Hide"
                        data-testid={`button-review-hide-${review.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {review.status !== "flagged" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(review.id, "flagged", review._type)}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Flag"
                        data-testid={`button-review-flag-${review.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteReview(review.id, review._type)}
                      className="h-7 px-2 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                      data-testid={`button-review-delete-${review.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminSpacesManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSpaceId, setExpandedSpaceId] = useState<string | null>(null);
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
      tags: space.tags || [space.type].filter(Boolean),
      description: space.description || "",
      shortDescription: space.shortDescription || "",
      address: space.address || "",
      neighborhood: space.neighborhood || "",
      pricePerHour: space.pricePerHour || 0,
      pricePerDay: space.pricePerDay || 0,
      targetProfession: space.targetProfession || "",
      availabilitySchedule: space.availabilitySchedule || "",
      bufferMinutes: space.bufferMinutes ?? 15,
      hostName: space.hostName || "",
      contactEmail: space.contactEmail || "",
      amenities: (space.amenities || []).join(", "),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      // Auto-derive tags from targetProfession for browse filtering
      const professionToTag: Record<string, string> = {
        "Therapy & Counseling": "therapy",
        "Coaching & Consulting": "coaching",
        "Wellness & Holistic": "wellness",
        "Workshops & Classes": "workshop",
        "Creative Studio": "creative",
      };
      const selectedProfessions = (editForm.targetProfession || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      const derivedTags = selectedProfessions.map((p: string) => professionToTag[p]).filter(Boolean);

      const payload: any = {
        ...editForm,
        pricePerHour: parseInt(editForm.pricePerHour) || 0,
        pricePerDay: parseInt(editForm.pricePerDay) || null,
        bufferMinutes: parseInt(editForm.bufferMinutes) || 15,
        amenities: editForm.amenities.split(",").map((a: string) => a.trim()).filter(Boolean),
        tags: derivedTags.length > 0 ? derivedTags : editForm.tags,
        type: derivedTags[0] || editForm.type,
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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
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
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
                          <label className="block text-xs font-medium text-gray-500 mb-1">Space Name</label>
                          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Space Category</label>
                          <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" data-testid="input-edit-type">
                            <option value="therapy">Therapy & Counseling</option>
                            <option value="coaching">Coaching & Consulting</option>
                            <option value="wellness">Wellness & Holistic</option>
                            <option value="workshop">Workshops & Classes</option>
                            <option value="creative">Creative Studio</option>
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
                          <label className="block text-xs font-medium text-gray-500 mb-1">Host Name</label>
                          <input value={editForm.hostName} onChange={e => setEditForm({ ...editForm, hostName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-host" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Target Professionals</label>
                          <div className="flex flex-wrap gap-2" data-testid="input-edit-profession">
                            {[
                              { value: "therapy", label: "Therapy & Counseling" },
                              { value: "coaching", label: "Coaching & Consulting" },
                              { value: "wellness", label: "Wellness & Holistic" },
                              { value: "workshop", label: "Workshops & Classes" },
                              { value: "creative", label: "Creative Studio" },
                            ].map((t) => {
                              const selected = (editForm.targetProfession || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                              const isSelected = selected.includes(t.label);
                              return (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected ? selected.filter((s: string) => s !== t.label) : [...selected, t.label];
                                    setEditForm({ ...editForm, targetProfession: next.join(", ") });
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
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
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Contact Email</label>
                          <input value={editForm.contactEmail} onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" data-testid="input-edit-email" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Buffer Time Between Bookings</label>
                          <select
                            value={editForm.bufferMinutes}
                            onChange={e => setEditForm({ ...editForm, bufferMinutes: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            data-testid="input-edit-buffer"
                          >
                            <option value="0">No buffer</option>
                            <option value="5">5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                          </select>
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
                      <button
                        onClick={() => setExpandedSpaceId(expandedSpaceId === space.id ? null : space.id)}
                        className="w-full text-left flex items-center gap-3"
                        data-testid={`toggle-space-${space.id}`}
                      >
                        {space.imageUrls?.[0] ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={space.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">{space.name}</h3>
                            {statusBadge(space.approvalStatus)}
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                            <span>{(space.tags && space.tags.length > 0 ? space.tags : [space.type]).map((t: string) => ({ therapy: "Therapy", coaching: "Coaching", wellness: "Wellness", workshop: "Workshop", creative: "Creative", office: "Office", studio: "Creative Studio", gym: "Gym", meeting: "Meeting", art_studio: "Art Studio", photo_studio: "Photo Studio" }[t] || t)).join(", ")}</span>
                            <span>${space.pricePerHour}/hr</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedSpaceId === space.id ? "rotate-90" : ""}`} />
                      </button>
                      {expandedSpaceId === space.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{space.address}</span>
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2 text-xs text-gray-400">
                            {space.pricePerDay > 0 && <span>${space.pricePerDay}/day</span>}
                            {space.isSample === 1 && <span className="text-amber-500">Sample</span>}
                            {space.latitude && space.longitude ? (
                              <span className="text-emerald-500">Mapped</span>
                            ) : (
                              <span className="text-amber-500">No coords</span>
                            )}
                            {space.imageUrls?.length > 0 && <span>{space.imageUrls.length} photo{space.imageUrls.length > 1 ? "s" : ""}</span>}
                          </div>
                          {space.ownerInfo ? (
                            <div className="flex items-center gap-1.5 mb-2">
                              <User className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="text-xs text-blue-600">
                                {[space.ownerInfo.firstName, space.ownerInfo.lastName].filter(Boolean).join(" ") || "Unknown"}
                                {space.ownerInfo.email && <span className="text-gray-400 ml-1">({space.ownerInfo.email})</span>}
                              </span>
                            </div>
                          ) : space.userId ? (
                            <div className="flex items-center gap-1.5 mb-2">
                              <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                              <span className="text-xs text-gray-400">User ID: {space.userId}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mb-2">
                              <User className="w-3 h-3 text-gray-300 flex-shrink-0" />
                              <span className="text-xs text-gray-400">No owner</span>
                            </div>
                          )}
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
                          <AdminSpaceBookings spaceId={space.id} token={token} />
                          <AdminSpacePhotos space={space} token={token} onUpdate={loadSpaces} />
                          <AdminTransferOwnership space={space} token={token} onUpdate={loadSpaces} />
                        </div>
                      )}
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
  const [expandedNom, setExpandedNom] = useState<string | null>(null);

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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-testid="button-nominations-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">Nominations ({nominations.length})</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {nominations.map((nom: any) => {
              const isExpanded = expandedNom === nom.id;
              return (
                <div key={nom.id}>
                  <button
                    onClick={() => setExpandedNom(isExpanded ? null : nom.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
                    data-testid={`button-expand-nomination-${nom.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                      <Heart className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900" data-testid={`text-nominee-name-${nom.id}`}>{nom.nomineeName}</span>
                      <span className="text-xs text-gray-400 ml-2">{nom.nomineeProfession}</span>
                    </div>
                    <Badge className={`text-[10px] ${statusColor(nom.status)} shrink-0`} variant="secondary" data-testid={`badge-nomination-status-${nom.id}`}>
                      {nom.status}
                    </Badge>
                    <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">{new Date(nom.createdAt).toLocaleDateString()}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 ml-11 space-y-3">
                          <p className="text-sm text-gray-700 leading-relaxed italic" data-testid={`text-nominee-reason-${nom.id}`}>"{nom.reason}"</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                            {nom.nominatorName && <span>Nominated by: <span className="text-gray-600">{nom.nominatorName}</span></span>}
                            {nom.nomineeContact && <span>Contact: <span className="text-gray-600">{nom.nomineeContact}</span></span>}
                            <span>{new Date(nom.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Select value={nom.status} onValueChange={(val) => updateStatus(nom.id, val)}>
                              <SelectTrigger className="h-8 w-[130px] text-xs" data-testid={`select-nomination-status-${nom.id}`}>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
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
    subjectName: string;
    subjectProfession: string;
    subjectBio: string;
    beforeImageUrl: string | null;
    category: string;
    cropPosition: { x: number; y: number; zoom: number };
  }>({ environments: [], brandMessages: [], emotionalImpacts: [], colorPalette: [], locationSpaceId: null, subjectName: "", subjectProfession: "", subjectBio: "", beforeImageUrl: null, category: "people", cropPosition: { x: 50, y: 50, zoom: 1 } });
  const [newColorHex, setNewColorHex] = useState("#8B7355");
  const [newColorKeyword, setNewColorKeyword] = useState("");
  const [eyedropperOpen, setEyedropperOpen] = useState(false);
  const [eyedropperHover, setEyedropperHover] = useState<string | null>(null);
  const eyedropperCanvasRef = useRef<HTMLCanvasElement>(null);
  const [portfolioDragIdx, setPortfolioDragIdx] = useState<number | null>(null);
  const [portfolioDragOverIdx, setPortfolioDragOverIdx] = useState<number | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const dropCounter = useRef(0);
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
    const crop = (photo.cropPosition as any) || { x: 50, y: 50, zoom: 1 };
    setTagForm({
      environments: photo.environments || [],
      brandMessages: photo.brandMessages || [],
      emotionalImpacts: photo.emotionalImpacts || [],
      colorPalette: photo.colorPalette || [],
      locationSpaceId: photo.locationSpaceId || null,
      subjectName: (photo as any).subjectName || "",
      subjectProfession: (photo as any).subjectProfession || "",
      subjectBio: (photo as any).subjectBio || "",
      beforeImageUrl: (photo as any).beforeImageUrl || null,
      category: photo.category || "people",
      cropPosition: { x: crop.x, y: crop.y, zoom: crop.zoom ?? 1 },
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

  const openEyedropper = () => {
    setEyedropperHover(null);
    setEyedropperOpen(true);
  };

  const handleEyedropperLoad = (img: HTMLImageElement) => {
    const canvas = eyedropperCanvasRef.current;
    if (!canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
  };

  const sampleColorAt = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = eyedropperCanvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const rect = e.currentTarget.querySelector("img")?.getBoundingClientRect();
    if (!rect) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.round((e.clientX - rect.left) * scaleX);
    const py = Math.round((e.clientY - rect.top) * scaleY);
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    return "#" + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, "0").toUpperCase()).join("");
  };

  const handleEyedropperMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const hex = sampleColorAt(e);
    if (hex) setEyedropperHover(hex);
  };

  const handleEyedropperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const hex = sampleColorAt(e);
    if (hex) {
      setNewColorHex(hex);
      setEyedropperOpen(false);
      setEyedropperHover(null);
    }
  };

  const handlePortfolioDrop = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const reordered = [...filteredAdminPhotos];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setPhotos(prev => {
      const otherCategory = prev.filter(p => (p.category || "people") !== adminCategory);
      return [...otherCategory, ...reordered];
    });
    try {
      await adminFetch("/api/admin/portfolio/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map(p => p.id) }),
      });
    } catch {
      loadPhotos();
    }
  };

  const envOptions = ["restaurant", "office", "nature", "workvan", "urban", "suburban", "gym", "kitchen"];
  const spaceEnvOptions = ["therapy", "coaching", "wellness", "workshop", "creative"];
  const brandOptions = ["assured", "empathy", "confidence", "motivation"];
  const moodOptions = ["cozy", "bright", "powerful"];
  const envLabels: Record<string, string> = { restaurant: "Restaurant", office: "Office", nature: "Nature", workvan: "Work Van", urban: "Urban", suburban: "Suburban", gym: "Gym", kitchen: "Kitchen" };
  const spaceEnvLabels: Record<string, string> = { therapy: "Therapy & Counseling", coaching: "Coaching & Consulting", wellness: "Wellness & Holistic", workshop: "Workshops & Classes", creative: "Creative Studio" };
  const brandLabels: Record<string, string> = { assured: "Welcoming", empathy: "Warm", confidence: "Confident", motivation: "Motivated" };
  const moodLabels: Record<string, string> = { cozy: "Comfortable", bright: "Inspired", powerful: "Reassured" };

  const filteredAdminPhotos = photos.filter(p => (p.category || "people") === adminCategory);

  const onDropUpload = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropCounter.current = 0;
    setDropZoneActive(false);
    if (e.dataTransfer.files?.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const onDragEnterZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setDropZoneActive(true);
    }
  }, []);

  const onDragLeaveZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropCounter.current--;
    if (dropCounter.current === 0) {
      setDropZoneActive(false);
    }
  }, []);

  const onDragOverZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-8"
      onDragEnter={onDragEnterZone}
      onDragLeave={onDragLeaveZone}
      onDragOver={onDragOverZone}
      onDrop={onDropUpload}
    >
      {dropZoneActive && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-[#c4956a] text-center shadow-2xl">
            <Upload className="w-12 h-12 text-[#c4956a] mx-auto mb-4" />
            <p className="text-lg font-medium text-stone-800">Drop photos to upload</p>
            <p className="text-sm text-stone-500 mt-1">They'll be added to {adminCategory}</p>
          </div>
        </div>
      )}
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
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Images className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No {adminCategory} photos yet</p>
          <p className="text-gray-400 text-sm">Drag & drop photos here or click Upload Photos</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-[10px] text-gray-400 mb-2">Drag photos to reorder. Order is preserved on the live site.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredAdminPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => setPortfolioDragIdx(idx)}
                onDragOver={e => { e.preventDefault(); setPortfolioDragOverIdx(idx); }}
                onDragLeave={() => setPortfolioDragOverIdx(null)}
                onDrop={e => { e.preventDefault(); if (portfolioDragIdx !== null) handlePortfolioDrop(portfolioDragIdx, idx); setPortfolioDragIdx(null); setPortfolioDragOverIdx(null); }}
                onDragEnd={() => { setPortfolioDragIdx(null); setPortfolioDragOverIdx(null); }}
                className={`group relative rounded-lg overflow-hidden bg-stone-100 ${adminCategory === "spaces" ? "aspect-[4/3]" : "aspect-[3/4]"} cursor-grab active:cursor-grabbing transition-all ${
                  portfolioDragIdx === idx ? "opacity-40 scale-95" : ""
                } ${portfolioDragOverIdx === idx && portfolioDragIdx !== null && portfolioDragIdx !== idx ? "ring-2 ring-[#c4956a] scale-105" : ""}`}
                data-testid={`card-portfolio-${photo.id}`}
              >
                <img
                  src={photo.imageUrl}
                  alt="Portfolio"
                  className="w-full h-full object-cover pointer-events-none"
                  style={(() => {
                    const c = (photo as any).cropPosition || { x: 50, y: 50, zoom: 1 };
                    return { objectPosition: `${c.x}% ${c.y}%`, ...(c.zoom && c.zoom !== 1 ? { transform: `scale(${c.zoom})`, transformOrigin: `${c.x}% ${c.y}%` } : {}) };
                  })()}
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
                    {(photo.category || "people") === "people" && photo.environments?.slice(0, 2).map(e => (
                      <span key={e} className="bg-white/90 text-[10px] px-1.5 py-0.5 rounded font-medium">{envLabels[e] || e}</span>
                    ))}
                    {(photo.category || "people") === "spaces" && photo.environments?.filter(e => spaceEnvLabels[e]).slice(0, 2).map(e => (
                      <span key={e} className="bg-white/90 text-[10px] px-1.5 py-0.5 rounded font-medium">{spaceEnvLabels[e]}</span>
                    ))}
                    {(photo.category || "people") === "people" && photo.brandMessages?.slice(0, 1).map(b => (
                      <span key={b} className="bg-amber-100/90 text-[10px] px-1.5 py-0.5 rounded font-medium">{brandLabels[b] || b}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Dialog open={!!editingPhoto} onOpenChange={(open) => { if (!open) setEditingPhoto(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
              {editingPhoto && (<>
              <DialogTitle className="text-base flex items-center gap-3">
                <img src={editingPhoto.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                Edit Tags & Keywords
              </DialogTitle>
              <div className="space-y-6">
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

                {tagForm.category === "people" && (
                  <>
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
                  </>
                )}

                {tagForm.category === "spaces" && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Space Category</Label>
                    <p className="text-xs text-gray-400 mb-2">What type of space is this?</p>
                    <div className="flex flex-wrap gap-2">
                      {spaceEnvOptions.map(env => (
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
                          {spaceEnvLabels[env] || env}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tagForm.category === "people" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">Subject Name</Label>
                      <input
                        value={tagForm.subjectName}
                        onChange={e => setTagForm(prev => ({ ...prev, subjectName: e.target.value }))}
                        placeholder="e.g. Edith Caballero"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400"
                        data-testid="input-subject-name"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">Profession</Label>
                      <input
                        value={tagForm.subjectProfession}
                        onChange={e => setTagForm(prev => ({ ...prev, subjectProfession: e.target.value }))}
                        placeholder="e.g. Therapist, Miami FL"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400"
                        data-testid="input-subject-profession"
                      />
                    </div>
                  </div>
                )}
                {tagForm.category === "people" && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Subject Bio</Label>
                    <input
                      value={tagForm.subjectBio}
                      onChange={e => setTagForm(prev => ({ ...prev, subjectBio: e.target.value }))}
                      placeholder="e.g. A therapist whose clients need to feel at ease the moment they walk in."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400"
                      data-testid="input-subject-bio"
                    />
                  </div>
                )}
                {tagForm.category === "people" && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Before Photo</Label>
                    <p className="text-xs text-gray-400 mb-2">Upload their old headshot or selfie for the before/after comparison</p>
                    {tagForm.beforeImageUrl && (
                      <div className="flex items-center gap-3 mb-2">
                        <img src={tagForm.beforeImageUrl} alt="Before" className="w-16 h-16 rounded object-cover border border-gray-200" />
                        <Button variant="ghost" size="sm" onClick={() => setTagForm(prev => ({ ...prev, beforeImageUrl: null }))} data-testid="button-remove-before-image">
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="text-sm"
                      data-testid="input-before-image"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editingPhoto) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const res = await adminFetch(`/api/admin/portfolio/${editingPhoto.id}/before-image`, { method: "POST", body: formData });
                          if (res.ok) {
                            const updated = await res.json();
                            setTagForm(prev => ({ ...prev, beforeImageUrl: updated.beforeImageUrl }));
                            setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
                            toast({ title: "Before photo uploaded" });
                          }
                        } catch {
                          toast({ title: "Upload failed", variant: "destructive" });
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}

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
                      <option key={s.id} value={s.id}>{s.name}{s.neighborhood ? `, ${s.neighborhood}` : ""}</option>
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
                  <Button size="sm" variant="outline" className="mt-2 w-full h-8 text-xs" onClick={openEyedropper} data-testid="button-eyedropper">
                    <Pipette className="w-3 h-3 mr-1.5" /> Pick Color from Photo
                  </Button>
                  <canvas ref={eyedropperCanvasRef} className="hidden" />
                  <AnimatePresence>
                    {eyedropperOpen && editingPhoto && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4"
                        data-testid="modal-eyedropper"
                      >
                        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                          <div className="flex items-center justify-between px-4 py-3 border-b">
                            <div className="flex items-center gap-3">
                              <Pipette className="w-4 h-4 text-stone-500" />
                              <span className="text-sm font-medium">Click anywhere on the photo to pick a color</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {eyedropperHover && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full border-2 border-stone-300 shadow-sm" style={{ backgroundColor: eyedropperHover }} />
                                  <span className="text-xs font-mono text-stone-500">{eyedropperHover}</span>
                                </div>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => { setEyedropperOpen(false); setEyedropperHover(null); }} data-testid="button-close-eyedropper">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div
                            className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-100 cursor-crosshair"
                            onMouseMove={handleEyedropperMove}
                            onClick={handleEyedropperClick}
                          >
                            <img
                              src={editingPhoto.imageUrl}
                              alt="Pick a color"
                              className="max-w-full max-h-[70vh] object-contain rounded select-none"
                              onLoad={e => handleEyedropperLoad(e.currentTarget)}
                              draggable={false}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Crop & Position</Label>
                  <p className="text-xs text-gray-400 mb-3">Adjust how the photo is framed in its card. Drag or use sliders.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div
                      className={`relative overflow-hidden rounded-lg bg-stone-200 flex-shrink-0 cursor-move ${tagForm.category === "spaces" ? "w-64 aspect-[4/3]" : "w-40 aspect-[3/4]"}`}
                      onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startPos = { ...tagForm.cropPosition };
                        const handleMove = (ev: MouseEvent) => {
                          const dx = ((ev.clientX - startX) / rect.width) * 100;
                          const dy = ((ev.clientY - startY) / rect.height) * 100;
                          setTagForm(prev => ({ ...prev, cropPosition: { ...prev.cropPosition, x: Math.max(0, Math.min(100, startPos.x - dx)), y: Math.max(0, Math.min(100, startPos.y - dy)) } }));
                        };
                        const handleUp = () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
                        window.addEventListener("mousemove", handleMove);
                        window.addEventListener("mouseup", handleUp);
                      }}
                      data-testid="crop-preview"
                    >
                      <img
                        src={editingPhoto.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${tagForm.cropPosition.x}% ${tagForm.cropPosition.y}%`,
                          transform: `scale(${tagForm.cropPosition.zoom})`,
                          transformOrigin: `${tagForm.cropPosition.x}% ${tagForm.cropPosition.y}%`,
                        }}
                        draggable={false}
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-12">Zoom</span>
                        <input type="range" min={1} max={2} step={0.05} value={tagForm.cropPosition.zoom} onChange={e => setTagForm(prev => ({ ...prev, cropPosition: { ...prev.cropPosition, zoom: parseFloat(e.target.value) } }))} className="flex-1 accent-stone-700" data-testid="slider-crop-zoom" />
                        <span className="text-xs text-gray-400 tabular-nums w-10 text-right">{Math.round(tagForm.cropPosition.zoom * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-12">Vertical</span>
                        <input type="range" min={0} max={100} step={1} value={tagForm.cropPosition.y} onChange={e => setTagForm(prev => ({ ...prev, cropPosition: { ...prev.cropPosition, y: parseFloat(e.target.value) } }))} className="flex-1 accent-stone-700" data-testid="slider-crop-y" />
                        <span className="text-xs text-gray-400 tabular-nums w-10 text-right">{Math.round(tagForm.cropPosition.y)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-12">Horizontal</span>
                        <input type="range" min={0} max={100} step={1} value={tagForm.cropPosition.x} onChange={e => setTagForm(prev => ({ ...prev, cropPosition: { ...prev.cropPosition, x: parseFloat(e.target.value) } }))} className="flex-1 accent-stone-700" data-testid="slider-crop-x" />
                        <span className="text-xs text-gray-400 tabular-nums w-10 text-right">{Math.round(tagForm.cropPosition.x)}%</span>
                      </div>
                      <button onClick={() => setTagForm(prev => ({ ...prev, cropPosition: { x: 50, y: 50, zoom: 1 } }))} className="text-xs text-stone-500 hover:text-stone-700 underline" data-testid="button-reset-crop">Reset to center</button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setEditingPhoto(null)} data-testid="button-cancel-tags">Cancel</Button>
                  <Button onClick={saveTagEdits} className="bg-stone-900 hover:bg-stone-800 text-white" data-testid="button-save-tags">
                    <Save className="w-4 h-4 mr-2" /> Save Tags
                  </Button>
                </div>
              </div>
              </>)}
            </DialogContent>
          </Dialog>
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
  const spaceFileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [spaceUploadTargetId, setSpaceUploadTargetId] = useState<string | null>(null);
  const [formPortraitPreview, setFormPortraitPreview] = useState<string | null>(null);
  const [formPortraitFile, setFormPortraitFile] = useState<File | null>(null);
  const [cropPosition, setCropPosition] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 50, zoom: 1 });
  const [heroCropPosition, setHeroCropPosition] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 20, zoom: 1 });
  const [spaceCropPosition, setSpaceCropPosition] = useState<{ x: number; y: number; zoom: number }>({ x: 50, y: 50, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHeroDragging, setIsHeroDragging] = useState(false);
  const [isSpaceDragging, setIsSpaceDragging] = useState(false);
  const [expandedPro, setExpandedPro] = useState<string | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Array<{ id: string; name: string; imageUrls: string[] | null; neighborhood: string | null }>>([]);
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
    try {
      const res = await adminFetch("/api/admin/spaces/all");
      if (res.ok) {
        const spaces = await res.json();
        setAllWorkspaces(spaces.map((s: any) => ({ id: s.id, name: s.name, imageUrls: s.imageUrls, neighborhood: s.neighborhood })));
      }
    } catch {}
    setLoading(false);
  }, [adminFetch]);

  const fetchProfessionals = loadData;

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
        storySections: {
          narrativeHook: form.narrativeHook || undefined,
          qaSections: form.qaSections.filter(qa => qa.question.trim() && qa.answer.trim()),
          ...(form.whyStarted ? { whyStarted: form.whyStarted } : {}),
          ...(form.whatTheyLove ? { whatTheyLove: form.whatTheyLove } : {}),
          ...(form.misunderstanding ? { misunderstanding: form.misunderstanding } : {}),
        },
        socialLinks: form.socialLinks.filter(s => s.platform && s.url.trim()),
        credentials: form.credentials.filter(c => c.trim()),
        yearsInPractice: form.yearsInPractice ? parseInt(form.yearsInPractice) : null,
        ctaLabel: form.ctaLabel.trim() || null,
        ctaUrl: form.ctaUrl.trim() || null,
        isFeaturedOfWeek: form.isFeaturedOfWeek ? 1 : 0,
        yearsHosting: form.yearsHosting ? parseInt(form.yearsHosting) : null,
        locationCount: form.locationCount ? parseInt(form.locationCount) : null,
        seoTitle: form.seoTitle || `${form.name} - ${form.profession} | Align`,
        metaDescription: form.metaDescription || form.headline,
        spaceName: form.spaceName?.trim() || null,
        spaceQuote: form.spaceQuote?.trim() || null,
        spaceImageCropPosition: spaceCropPosition,
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
      narrativeHook: pro.storySections.narrativeHook || "",
      qaSections: pro.storySections.qaSections?.length ? pro.storySections.qaSections : [{ question: "", answer: "" }],
      whyStarted: pro.storySections.whyStarted || "",
      whatTheyLove: pro.storySections.whatTheyLove || "",
      misunderstanding: pro.storySections.misunderstanding || "",
      credentials: pro.credentials?.length ? [...pro.credentials] : [""],
      yearsInPractice: pro.yearsInPractice?.toString() || "",
      ctaLabel: pro.ctaLabel || "",
      ctaUrl: pro.ctaUrl || "",
      socialLinks: normalizeSocialLinksAdmin(pro.socialLinks),
      isFeaturedOfWeek: pro.isFeaturedOfWeek === 1,
      seoTitle: pro.seoTitle || "",
      metaDescription: pro.metaDescription || "",
      yearsHosting: "",
      locationCount: "",
      spaceName: (pro as any).spaceName || "",
      spaceQuote: (pro as any).spaceQuote || "",
    });
    setFormPortraitPreview(pro.portraitImageUrl || null);
    setFormPortraitFile(null);
    setCropPosition({ x: pro.portraitCropPosition?.x ?? 50, y: pro.portraitCropPosition?.y ?? 50, zoom: pro.portraitCropPosition?.zoom ?? 1 });
    setHeroCropPosition({ x: pro.heroCropPosition?.x ?? 50, y: pro.heroCropPosition?.y ?? 20, zoom: pro.heroCropPosition?.zoom ?? 1 });
    setSpaceCropPosition({ x: (pro as any).spaceImageCropPosition?.x ?? 50, y: (pro as any).spaceImageCropPosition?.y ?? 50, zoom: (pro as any).spaceImageCropPosition?.zoom ?? 1 });
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
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
        <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
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
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Trust Signals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Years in Practice</Label><Input type="number" value={form.yearsInPractice} onChange={e => setForm({ ...form, yearsInPractice: e.target.value })} placeholder="e.g. 8" /></div>
              <div><Label>CTA Button Label</Label><Input value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} placeholder="e.g. Visit Their Practice" /></div>
            </div>
            <div><Label>CTA URL</Label><Input value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://... (falls back to website social link)" /></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Credentials (max 3)</Label>
                {form.credentials.length < 3 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, credentials: [...form.credentials, ""] })}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Add
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {form.credentials.map((cred, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={cred} onChange={e => { const updated = [...form.credentials]; updated[i] = e.target.value; setForm({ ...form, credentials: updated }); }} placeholder="e.g. LCSW, NCC, RYT" />
                    <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 px-2" onClick={() => setForm({ ...form, credentials: form.credentials.filter((_, j) => j !== i) })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Their Workspace</h3>
            <div>
              <Label>Select Workspace</Label>
              <Select
                value={allWorkspaces.find(w => w.name === form.spaceName)?.id || "__custom"}
                onValueChange={v => {
                  if (v === "__custom") {
                    setForm({ ...form, spaceName: "" });
                  } else {
                    const ws = allWorkspaces.find(w => w.id === v);
                    if (ws) setForm({ ...form, spaceName: ws.name });
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choose a workspace or enter custom" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__custom">Custom name...</SelectItem>
                  {allWorkspaces.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}{ws.neighborhood ? ` — ${ws.neighborhood}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(!allWorkspaces.find(w => w.name === form.spaceName) || !form.spaceName) && (
              <div><Label>Workspace Name</Label><Input value={form.spaceName} onChange={e => setForm({ ...form, spaceName: e.target.value })} placeholder="e.g. Align Studio — Coral Gables" /></div>
            )}
            {(() => {
              const selectedWs = allWorkspaces.find(w => w.name === form.spaceName);
              if (!selectedWs?.imageUrls?.length) return null;
              return (
                <div>
                  <Label>Use a photo from this workspace</Label>
                  <p className="text-xs text-gray-400 mb-2">Click a photo to set it as the workspace image (uploaded after saving)</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedWs.imageUrls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={async () => {
                          if (!editing?.id) {
                            toast({ title: "Save the professional first, then select a workspace photo", variant: "destructive" });
                            return;
                          }
                          setUploading(editing.id);
                          try {
                            const imgRes = await fetch(url);
                            const blob = await imgRes.blob();
                            const fd = new FormData();
                            fd.append("file", blob, "workspace.webp");
                            const res = await adminFetch(`/api/admin/featured/${editing.id}/upload-space-image`, { method: "POST", body: fd, isFormData: true });
                            if (res.ok) toast({ title: "Workspace photo set" });
                          } catch { toast({ title: "Failed to set photo", variant: "destructive" }); }
                          setUploading(null);
                        }}
                        className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-[#c4956a] transition-colors relative group"
                      >
                        <img src={url} alt={`Workspace photo ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use this</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            {editing && (editing as any).spaceImageUrl && (
              <div>
                <Label>Workspace Image Crop</Label>
                <p className="text-xs text-gray-400 mb-2">Drag to reposition how the workspace photo appears in cards and the profile hero</p>
                <div className="flex gap-4 items-start">
                  <div
                    className="w-56 h-36 rounded-lg overflow-hidden bg-stone-200 relative select-none cursor-grab active:cursor-grabbing flex-shrink-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsSpaceDragging(true);
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startPos = { ...spaceCropPosition };
                      const handleMove = (ev: MouseEvent) => {
                        const dx = ev.clientX - startX;
                        const dy = ev.clientY - startY;
                        setSpaceCropPosition(prev => ({
                          ...prev,
                          x: Math.max(0, Math.min(100, startPos.x - (dx / 2.24))),
                          y: Math.max(0, Math.min(100, startPos.y - (dy / 1.44))),
                        }));
                      };
                      const handleUp = () => {
                        setIsSpaceDragging(false);
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      setIsSpaceDragging(true);
                      const startX = touch.clientX;
                      const startY = touch.clientY;
                      const startPos = { ...spaceCropPosition };
                      const handleMove = (ev: TouchEvent) => {
                        ev.preventDefault();
                        const t = ev.touches[0];
                        const dx = t.clientX - startX;
                        const dy = t.clientY - startY;
                        setSpaceCropPosition(prev => ({
                          ...prev,
                          x: Math.max(0, Math.min(100, startPos.x - (dx / 2.24))),
                          y: Math.max(0, Math.min(100, startPos.y - (dy / 1.44))),
                        }));
                      };
                      const cleanup = () => {
                        setIsSpaceDragging(false);
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
                      src={(editing as any).spaceImageUrl}
                      alt="Workspace preview"
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        objectPosition: `${spaceCropPosition.x}% ${spaceCropPosition.y}%`,
                        transform: `scale(${spaceCropPosition.zoom})`,
                        transformOrigin: `${spaceCropPosition.x}% ${spaceCropPosition.y}%`,
                      }}
                      draggable={false}
                    />
                    {!isSpaceDragging && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                          <Move className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 pt-1 flex-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Zoom</Label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(spaceCropPosition.zoom * 100)}%</span>
                      </div>
                      <input type="range" min="1" max="2" step="0.05" value={spaceCropPosition.zoom}
                        onChange={e => setSpaceCropPosition(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Vertical</Label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(spaceCropPosition.y)}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={spaceCropPosition.y}
                        onChange={e => setSpaceCropPosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Horizontal</Label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(spaceCropPosition.x)}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={spaceCropPosition.x}
                        onChange={e => setSpaceCropPosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-stone-700 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-sm"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-xs text-gray-400 w-fit"
                      onClick={() => setSpaceCropPosition({ x: 50, y: 50, zoom: 1 })}>
                      Reset to center
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div><Label>Why This Workspace (their quote)</Label><Textarea value={form.spaceQuote} onChange={e => setForm({ ...form, spaceQuote: e.target.value })} placeholder="What makes this workspace special to them and their practice..." rows={3} /></div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Story</h3>
            <div><Label>Opening Hook (first-person, 2-3 sentences)</Label><Textarea value={form.narrativeHook} onChange={e => setForm({ ...form, narrativeHook: e.target.value })} placeholder="I became a therapist because..." rows={3} data-testid="input-featured-hook" /></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Q&A Sections</Label>
                {form.qaSections.length < 5 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, qaSections: [...form.qaSections, { question: "", answer: "" }] })}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Add Question
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {form.qaSections.map((qa, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">Q&A {i + 1}</span>
                      {form.qaSections.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 px-2 h-6" onClick={() => setForm({ ...form, qaSections: form.qaSections.filter((_, j) => j !== i) })}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <Input value={qa.question} onChange={e => { const updated = [...form.qaSections]; updated[i] = { ...updated[i], question: e.target.value }; setForm({ ...form, qaSections: updated }); }} placeholder="What drew you to this work?" />
                    <Textarea value={qa.answer} onChange={e => { const updated = [...form.qaSections]; updated[i] = { ...updated[i], answer: e.target.value }; setForm({ ...form, qaSections: updated }); }} placeholder="Their answer in first person..." rows={3} />
                  </div>
                ))}
              </div>
            </div>
            {(form.whyStarted || form.whatTheyLove || form.misunderstanding) && (
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">Legacy story sections (old format)</summary>
                <div className="mt-3 space-y-3">
                  <div><Label>Why They Do This Work</Label><Textarea value={form.whyStarted} onChange={e => setForm({ ...form, whyStarted: e.target.value })} rows={3} /></div>
                  <div><Label>What Makes It Meaningful</Label><Textarea value={form.whatTheyLove} onChange={e => setForm({ ...form, whatTheyLove: e.target.value })} rows={3} /></div>
                  <div><Label>A Common Misconception</Label><Textarea value={form.misunderstanding} onChange={e => setForm({ ...form, misunderstanding: e.target.value })} rows={3} /></div>
                </div>
              </details>
            )}
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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" data-testid="button-featured-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">Featured Professionals ({professionals.length})</h1>
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
      <input type="file" ref={spaceFileInputRef} className="hidden" accept="image/*" onChange={async e => {
        const file = e.target.files?.[0];
        if (file && spaceUploadTargetId) {
          setUploading(spaceUploadTargetId);
          try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`/api/admin/featured/${spaceUploadTargetId}/upload-space-image`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
            if (res.ok) { toast({ title: "Space image uploaded" }); fetchProfessionals(); }
          } catch {}
          setUploading(null);
        }
        e.target.value = "";
      }} />

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {professionals.map(pro => {
              const initials = pro.name.split(" ").map(n => n[0]).join("").slice(0, 2);
              const isExpanded = expandedPro === pro.id;
              return (
                <div key={pro.id} data-testid={`admin-featured-card-${pro.id}`}>
                  <button
                    onClick={() => setExpandedPro(isExpanded ? null : pro.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
                    data-testid={`button-expand-featured-${pro.id}`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 shrink-0">
                      {pro.portraitImageUrl ? (
                        <img src={pro.portraitImageUrl} alt={pro.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-300 to-stone-400">
                          <span className="text-sm font-serif text-white/80">{initials}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{pro.name}</span>
                        {pro.isFeaturedOfWeek ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" /> : null}
                      </div>
                      <span className="text-xs text-gray-500">{pro.profession} · {pro.location}</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:inline truncate max-w-[200px] italic">"{pro.headline}"</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 ml-[52px] space-y-3">
                          <p className="text-sm text-gray-600 italic">"{pro.headline}"</p>
                          <p className="text-xs text-gray-400">"{pro.quote}"</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => startEdit(pro)} data-testid={`button-edit-featured-${pro.id}`}>
                              <Edit className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setUploadTargetId(pro.id); fileInputRef.current?.click(); }} data-testid={`button-upload-featured-${pro.id}`}>
                              {uploading === pro.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                              {pro.portraitImageUrl ? "Change Photo" : "Upload Photo"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSpaceUploadTargetId(pro.id); spaceFileInputRef.current?.click(); }}>
                              <Upload className="w-3 h-3 mr-1" />
                              {(pro as any).spaceImageUrl ? "Change Space" : "Space Photo"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/featured/${pro.slug}`, "_blank")} data-testid={`button-view-featured-${pro.id}`}>
                              <ExternalLink className="w-3 h-3 mr-1" /> View
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(pro.id)} data-testid={`button-delete-featured-${pro.id}`}>
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { key: "contacted", label: "Reached Out", color: "bg-purple-100 text-purple-700" },
  { key: "follow-up", label: "Following Up", color: "bg-yellow-100 text-yellow-800" },
  { key: "booked", label: "Scheduled", color: "bg-green-100 text-green-700" },
  { key: "completed", label: "Active Client", color: "bg-emerald-100 text-emerald-700" },
  { key: "lost", label: "Inactive", color: "bg-stone-200 text-stone-500" },
];

const ACTIVITY_TYPES = [
  { key: "call", label: "Phone Call", icon: Phone },
  { key: "text", label: "Text", icon: MessageCircle },
  { key: "email", label: "Email", icon: Send },
  { key: "note", label: "Note", icon: Edit },
  { key: "meeting", label: "Meeting", icon: Users },
  { key: "follow-up", label: "Follow-up", icon: Clock },
];

function PipelineManager({ token, onBack }: { token: string; onBack: () => void }) {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<PipelineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<PipelineContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<PipelineContact | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [newActivity, setNewActivity] = useState({ type: "call", note: "", followUpDays: 0 });
  const [activityJustLogged, setActivityJustLogged] = useState(false);
  const [filter, setFilter] = useState<"all" | "portraits" | "spaces">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [expandedListContact, setExpandedListContact] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", instagram: "", source: "website",
    category: "portraits", stage: "new", notes: "",
    nextFollowUp: "",
  });

  const adminFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    return fetch(url, { ...opts, headers: { ...opts.headers as any, Authorization: `Bearer ${token}` } });
  }, [token]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/pipeline");
      if (res.ok) setContacts(await res.json());
    } catch {} finally { setLoading(false); }
  }, [adminFetch]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const loadActivities = async (contactId: string) => {
    try {
      const res = await adminFetch(`/api/admin/pipeline/${contactId}/activities`);
      if (res.ok) setActivities(await res.json());
    } catch {}
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      const body: any = { ...form };
      if (form.nextFollowUp) body.nextFollowUp = new Date(form.nextFollowUp).toISOString();
      else body.nextFollowUp = null;
      if (editingContact) {
        const res = await adminFetch(`/api/admin/pipeline/${editingContact.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          if (selectedContact?.id === editingContact.id) setSelectedContact(updated);
          toast({ title: "Contact updated" });
        }
      } else {
        const res = await adminFetch("/api/admin/pipeline", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (res.ok) { toast({ title: "Contact added" }); }
      }
      setShowForm(false); setEditingContact(null);
      setForm({ name: "", email: "", phone: "", instagram: "", source: "website", category: "portraits", stage: "new", notes: "", nextFollowUp: "" });
      await loadContacts();
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await adminFetch(`/api/admin/pipeline/${id}`, { method: "DELETE" });
      if (selectedContact?.id === id) setSelectedContact(null);
      await loadContacts();
      toast({ title: "Contact deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const moveStage = async (contact: PipelineContact, newStage: string) => {
    try {
      await adminFetch(`/api/admin/pipeline/${contact.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: newStage }),
      });
      await loadContacts();
    } catch {}
  };

  const logActivity = async () => {
    if (!selectedContact || !newActivity.note.trim()) return;
    try {
      const payload: any = { type: newActivity.type, note: newActivity.note };
      if (newActivity.followUpDays > 0) payload.followUpDays = newActivity.followUpDays;
      const res = await adminFetch(`/api/admin/pipeline/${selectedContact.id}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contact) setSelectedContact(data.contact);
      }
      setNewActivity({ type: "call", note: "", followUpDays: 0 });
      setActivityJustLogged(true);
      setTimeout(() => setActivityJustLogged(false), 3000);
      await loadActivities(selectedContact.id);
      await loadContacts();
      const followUpMsg = newActivity.followUpDays > 0 ? ` · Follow-up set in ${newActivity.followUpDays} days` : "";
      toast({ title: `Activity logged${followUpMsg}` });
    } catch {}
  };

  const importLeads = async () => {
    try {
      const res = await adminFetch("/api/admin/pipeline/import-leads", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Imported ${data.imported} leads` });
        await loadContacts();
      }
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
  };

  const exportCsv = async () => {
    try {
      const res = await adminFetch("/api/admin/pipeline/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "pipeline-contacts.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  const importCsv = async () => {
    if (!csvText.trim()) return;
    try {
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: any = {};
        headers.forEach((h, i) => {
          const key = h === "next follow-up" ? "nextFollowUp" : h === "last contact" ? "lastContactDate" :
            h === "estimated value" ? "estimatedValue" : h;
          row[key] = vals[i] || "";
        });
        return row;
      }).filter(r => r.name);
      const res = await adminFetch("/api/admin/pipeline/import-csv", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Imported ${data.imported} contacts` });
        setShowImportCsv(false); setCsvText("");
        await loadContacts();
      }
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCsvText(ev.target?.result as string || ""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const openEdit = (contact: PipelineContact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name, email: contact.email || "", phone: contact.phone || "",
      instagram: contact.instagram || "", source: contact.source || "website",
      category: contact.category || "portraits", stage: contact.stage,
      notes: contact.notes || "",
      nextFollowUp: contact.nextFollowUp ? new Date(contact.nextFollowUp).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  };

  const openDetail = async (contact: PipelineContact) => {
    setSelectedContact(contact);
    await loadActivities(contact.id);
  };

  const filteredContacts = contacts.filter(c => {
    if (filter !== "all" && c.category !== filter) return false;
    if (stageFilter && c.stage !== stageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
    }
    return true;
  });

  const getStageContacts = (stage: string) => filteredContacts.filter(c => c.stage === stage);

  const stageOf = (key: string) => PIPELINE_STAGES.find(s => s.key === key);

  // Relationship health metrics
  const goingCold = filteredContacts.filter(c => c.lastContactDate && (Date.now() - new Date(c.lastContactDate).getTime()) > 30 * 24 * 60 * 60 * 1000).length;
  const followUpsDue = filteredContacts.filter(c => c.nextFollowUp && new Date(c.nextFollowUp) <= new Date()).length;

  const FOLLOW_UP_OPTIONS = [
    { label: "No follow-up", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "In 2 days", days: 2 },
    { label: "In 3 days", days: 3 },
    { label: "In 1 week", days: 7 },
    { label: "In 2 weeks", days: 14 },
    { label: "In 1 month", days: 30 },
  ];

  const callCount = activities.filter(a => a.type === "call").length;
  const textCount = activities.filter(a => a.type === "text").length;
  const emailCount = activities.filter(a => a.type === "email").length;
  const meetingCount = activities.filter(a => a.type === "meeting").length;
  const totalAttempts = callCount + textCount + emailCount;

  return (
    <>
    <AnimatePresence>
      {selectedContact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-stone-600">{selectedContact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-bold text-stone-900 truncate">{selectedContact.name}</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${stageOf(selectedContact.stage)?.color || "bg-gray-100"}`}>
                    {stageOf(selectedContact.stage)?.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(selectedContact)} data-testid="button-edit-contact-detail"><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                <button onClick={() => setSelectedContact(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Contact info + stats */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
                {selectedContact.email && <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-gray-400" /> {selectedContact.email}</span>}
                {selectedContact.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedContact.phone}</span>}
                {selectedContact.instagram && <span className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-gray-400" /> @{selectedContact.instagram.replace("@", "")}</span>}
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" /> {selectedContact.source}</span>
                <span className="flex items-center gap-1.5 capitalize"><Camera className="w-3.5 h-3.5 text-gray-400" /> {selectedContact.category}</span>
              </div>

              {/* Follow-up + last contact */}
              <div className="flex flex-wrap gap-3 text-sm">
                {selectedContact.nextFollowUp && (
                  <span className={`flex items-center gap-1.5 ${new Date(selectedContact.nextFollowUp.toString().split("T")[0] + "T00:00:00") <= new Date() ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    <CalendarDays className="w-3.5 h-3.5" /> Follow-up: {new Date(selectedContact.nextFollowUp.toString().split("T")[0] + "T00:00:00").toLocaleDateString()}
                  </span>
                )}
                {selectedContact.lastContactDate && (
                  <span className="flex items-center gap-1.5 text-gray-400"><Clock className="w-3.5 h-3.5" /> Last: {new Date(selectedContact.lastContactDate.toString().split("T")[0] + "T00:00:00").toLocaleDateString()}</span>
                )}
              </div>

              {selectedContact.notes && <p className="text-sm text-gray-600 bg-stone-50 rounded-lg p-3">{selectedContact.notes}</p>}

              {totalAttempts > 0 && (
                <div className="flex flex-wrap gap-1.5" data-testid="contact-attempt-stats">
                  {callCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium"><Phone className="w-3 h-3" /> {callCount}</span>}
                  {textCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium"><MessageCircle className="w-3 h-3" /> {textCount}</span>}
                  {emailCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-[11px] font-medium"><Send className="w-3 h-3" /> {emailCount}</span>}
                  {meetingCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-medium"><Users className="w-3 h-3" /> {meetingCount}</span>}
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-medium" data-testid="text-total-attempts">{totalAttempts} total</span>
                </div>
              )}

              {/* Move to stage */}
              <div>
                <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Move to Stage</Label>
                <div className="flex flex-wrap gap-1">
                  {PIPELINE_STAGES.map(s => (
                    <button key={s.key} onClick={() => { moveStage(selectedContact, s.key); setSelectedContact({ ...selectedContact, stage: s.key }); }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${selectedContact.stage === s.key ? s.color + " ring-1 ring-black/10" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                      data-testid={`button-stage-${s.key}`}>{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Log activity */}
              <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Log Activity</h4>
                <AnimatePresence>
                  {activityJustLogged && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium" data-testid="activity-success-banner">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" /> Activity logged!
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_TYPES.map(a => (
                    <button key={a.key} onClick={() => setNewActivity(p => ({ ...p, type: a.key }))}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${newActivity.type === a.key ? "bg-stone-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                      data-testid={`button-activity-type-${a.key}`}><a.icon className="w-3 h-3" /> {a.label}</button>
                  ))}
                </div>
                <Textarea value={newActivity.note} onChange={e => setNewActivity(p => ({ ...p, note: e.target.value }))}
                  placeholder="What happened? Quick notes..." className="h-16 text-sm bg-white" data-testid="input-activity-note" />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select value={String(newActivity.followUpDays)} onValueChange={v => setNewActivity(p => ({ ...p, followUpDays: parseInt(v) }))}>
                      <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-followup-schedule"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FOLLOW_UP_OPTIONS.map(o => (
                          <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={logActivity} className="bg-stone-900 hover:bg-stone-800 text-white" data-testid="button-log-activity">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Log
                  </Button>
                </div>
              </div>

              {/* Activity history */}
              {activities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">History <span className="text-gray-400 font-normal">({activities.length})</span></h4>
                  {activities.map((a: any) => {
                    const at = ACTIVITY_TYPES.find(t => t.key === a.type);
                    const Icon = at?.icon || Edit;
                    return (
                      <div key={a.id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50" data-testid={`activity-${a.id}`}>
                        <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">{at?.label || a.type}</span>
                            <span className="text-[10px] text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() + " " + new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                          </div>
                          {a.note && <p className="text-sm text-gray-600 mt-0.5">{a.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { handleDelete(selectedContact.id); }} data-testid="button-delete-contact-detail">
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedContact(null)}>Close</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="min-h-screen bg-[#faf9f7]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 px-2 flex-shrink-0" onClick={onBack} data-testid="button-pipeline-back">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-serif text-lg sm:text-xl font-semibold truncate" data-testid="text-pipeline-title">Contacts</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={importLeads} data-testid="button-import-leads">
              <ArrowRight className="w-3 h-3 mr-1" /> Import Leads
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowImportCsv(true)} data-testid="button-import-csv">
              <Upload className="w-3 h-3 mr-1" /> Import CSV
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCsv} data-testid="button-export-csv">
              <FileSpreadsheet className="w-3 h-3 mr-1" /> Export CSV
            </Button>
          </div>
          <div className="relative sm:hidden">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setShowActions(!showActions)} data-testid="button-more-actions">
              <Plus className={`w-4 h-4 transition-transform ${showActions ? "rotate-45" : ""}`} />
            </Button>
            <AnimatePresence>
              {showActions && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-40 w-48" data-testid="mobile-actions-menu">
                  <button onClick={() => { importLeads(); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2" data-testid="button-import-leads-mobile">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" /> Import Leads
                  </button>
                  <button onClick={() => { setShowImportCsv(true); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2" data-testid="button-import-csv-mobile">
                    <Upload className="w-3.5 h-3.5 text-gray-400" /> Import CSV
                  </button>
                  <button onClick={() => { exportCsv(); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2" data-testid="button-export-csv-mobile">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400" /> Export CSV
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button size="sm" className="h-8 text-xs bg-stone-900 hover:bg-stone-800 text-white" onClick={() => { setShowForm(true); setEditingContact(null); setForm({ name: "", email: "", phone: "", instagram: "", source: "website", category: "portraits", stage: "new", notes: "", nextFollowUp: "" }); }} data-testid="button-add-contact">
            <Plus className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Add Contact</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(["all", "portraits", "spaces"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                data-testid={`filter-${f}`}>{f === "all" ? "All" : f === "portraits" ? "Portraits" : "Spaces"}</button>
            ))}
          </div>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search contacts..."
            className="h-8 text-xs pl-8" data-testid="input-pipeline-search" />
        </div>
      </div>

      {/* Stats + Pipeline stages unified */}
      <div className="grid grid-cols-3 gap-2 mb-3" data-testid="stat-total-contacts">
        <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Contacts</span>
            <span className="text-lg font-bold text-gray-900">{filteredContacts.length}</span>
          </div>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${followUpsDue > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`} data-testid="stat-follow-ups">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider ${followUpsDue > 0 ? "text-amber-500" : "text-gray-400"}`}>Follow-ups</span>
            <span className={`text-lg font-bold ${followUpsDue > 0 ? "text-amber-600" : "text-gray-900"}`}>{followUpsDue}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Cold</span>
            <span className="text-lg font-bold text-gray-900">{filteredContacts.filter(c => c.lastContactDate && (Date.now() - new Date(c.lastContactDate).getTime()) > 30 * 24 * 60 * 60 * 1000).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4 sm:mb-5">
        {PIPELINE_STAGES.map(stage => {
          const allContacts = contacts.filter(c => {
            if (filter !== "all" && c.category !== filter) return false;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
            }
            return true;
          });
          const count = allContacts.filter(c => c.stage === stage.key).length;
          const isActive = stageFilter === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setStageFilter(isActive ? null : stage.key)}
              className={`rounded-lg border px-2.5 py-2 transition-all text-left ${isActive ? "ring-2 ring-stone-900 border-stone-900 bg-white shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"}`}
              data-testid={`pipeline-column-${stage.key}`}
            >
              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${stage.color}`}>{stage.label}</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-5" data-testid="pipeline-overview">

          {(() => {
            const needsAttention = filteredContacts.filter(c => 
              (c.nextFollowUp && new Date(c.nextFollowUp) <= new Date()) ||
              (c.stage === "new" && c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) > 2 * 24 * 60 * 60 * 1000)
            );
            if (needsAttention.length === 0) return null;
            return (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-500" /> Needs Attention
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {needsAttention.map(c => (
                    <button key={c.id} onClick={() => openDetail(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
                      data-testid={`attention-contact-${c.id}`}>
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-red-600">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                        <span className={`text-[10px] ml-2 px-2 py-0.5 rounded-full font-medium ${stageOf(c.stage)?.color || "bg-gray-100"}`}>{stageOf(c.stage)?.label}</span>
                      </div>
                      <div className="text-right shrink-0">
                        {c.nextFollowUp && new Date(c.nextFollowUp) <= new Date() && (
                          <p className="text-[11px] text-red-500 font-medium">Follow-up overdue</p>
                        )}
                        {c.stage === "new" && c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) > 2 * 24 * 60 * 60 * 1000 && (
                          <p className="text-[11px] text-amber-600 font-medium">New, no action yet</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {(() => {
            const recent = [...filteredContacts]
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .slice(0, 5);
            if (recent.length === 0) return null;
            return (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> Recently Added
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {recent.map(c => (
                    <button key={c.id} onClick={() => openDetail(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
                      data-testid={`recent-contact-${c.id}`}>
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-stone-600">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                        {c.email && <span className="text-xs text-gray-400 ml-2 hidden sm:inline">{c.email}</span>}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${stageOf(c.stage)?.color || "bg-gray-100"}`}>{stageOf(c.stage)?.label}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[2001]"
              onClick={() => { setShowForm(false); setEditingContact(null); }}
            />
            {/* Desktop: right drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[2002] flex-col overflow-y-auto hidden sm:flex"
              data-testid="form-contact"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 flex-shrink-0">
                <h2 className="font-serif text-lg font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
                <button onClick={() => { setShowForm(false); setEditingContact(null); }} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-stone-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Name *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" data-testid="input-contact-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" data-testid="input-contact-email" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" data-testid="input-contact-phone" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Instagram</Label>
                    <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@handle" className="h-9 text-sm" data-testid="input-contact-instagram" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Source</Label>
                    <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                      <SelectTrigger className="h-9 text-sm" data-testid="select-contact-source"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="h-9 text-sm" data-testid="select-contact-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portraits">Portraits</SelectItem>
                        <SelectItem value="spaces">Spaces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Stage</Label>
                    <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                      <SelectTrigger className="h-9 text-sm" data-testid="select-contact-stage"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Next Follow-up</Label>
                  <Input type="date" value={form.nextFollowUp} onChange={e => setForm(p => ({ ...p, nextFollowUp: e.target.value }))} className="h-9 text-sm" data-testid="input-contact-followup" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-20 text-sm" data-testid="input-contact-notes" />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-stone-100 flex-shrink-0">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingContact(null); }} data-testid="button-cancel-contact">Cancel</Button>
                <Button onClick={handleSave} className="bg-stone-900 hover:bg-stone-800 text-white" data-testid="button-save-contact">
                  <Save className="w-4 h-4 mr-1" /> {editingContact ? "Update" : "Add"}
                </Button>
              </div>
            </motion.div>
            {/* Mobile: bottom sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-[2002] flex flex-col max-h-[90vh] sm:hidden"
              data-testid="form-contact-mobile"
            >
              <div className="flex justify-between items-center px-5 py-3 border-b border-stone-100 flex-shrink-0">
                <h2 className="font-serif text-base font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
                <button onClick={() => { setShowForm(false); setEditingContact(null); }} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-stone-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Name *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Instagram</Label>
                  <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@handle" className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Source</Label>
                    <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portraits">Portraits</SelectItem>
                        <SelectItem value="spaces">Spaces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Stage</Label>
                    <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Follow-up</Label>
                    <Input type="date" value={form.nextFollowUp} onChange={e => setForm(p => ({ ...p, nextFollowUp: e.target.value }))} className="h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-16 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3 border-t border-stone-100 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingContact(null); }}>Cancel</Button>
                <Button size="sm" onClick={handleSave} className="bg-stone-900 hover:bg-stone-800 text-white">
                  <Save className="w-4 h-4 mr-1" /> {editingContact ? "Update" : "Add"}
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {showImportCsv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowImportCsv(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()} data-testid="modal-import-csv">
              <h2 className="font-serif text-lg font-semibold mb-2">Import from CSV / Excel</h2>
              <p className="text-xs text-gray-400 mb-3">Upload a CSV file or paste CSV data. Columns: Name, Email, Phone, Instagram, Source, Category, Stage, Notes, Next Follow-Up</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" className="mb-3 h-8 text-xs" onClick={() => fileRef.current?.click()} data-testid="button-choose-file">
                <Upload className="w-3 h-3 mr-1" /> Choose File
              </Button>
              <Textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Name,Email,Phone,...&#10;John Doe,john@email.com,555-1234,..."
                className="h-40 text-xs font-mono" data-testid="input-csv-data" />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" onClick={() => setShowImportCsv(false)}>Cancel</Button>
                <Button onClick={importCsv} className="bg-stone-900 hover:bg-stone-800 text-white" data-testid="button-run-import">
                  <FileSpreadsheet className="w-4 h-4 mr-1" /> Import
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
    </>
  );
}

function RevenueDashboard({ token, onBack }: { token: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"all" | "bookings" | "invoices">("all");

  useEffect(() => {
    setLoading(true);
    adminFetch(`/api/admin/revenue?source=${source}`, token).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token, source]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex justify-center items-center">
        <p className="text-gray-500">No revenue data available yet.</p>
      </div>
    );
  }

  const maxDailyRev = Math.max(...data.dailyRevenue.map((d: any) => d.revenue), 1);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <p className="font-serif text-lg text-gray-900">Revenue Dashboard</p>
          </div>
          <div className="inline-flex bg-stone-100 rounded-full p-0.5 gap-0.5 text-xs">
            {(["all", "bookings", "invoices"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1 rounded-full transition-colors font-medium ${source === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {s === "all" ? "All" : s === "bookings" ? `Bookings${data?.counts?.bookings ? ` (${data.counts.bookings})` : ""}` : `Invoices${data?.counts?.invoices ? ` (${data.counts.invoices})` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Revenue cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today", value: `$${(data.revenue.today / 100).toFixed(2)}`, sub: `${data.bookings.today} bookings` },
            { label: "This Week", value: `$${(data.revenue.week / 100).toFixed(0)}`, sub: `${data.bookings.week} bookings` },
            { label: "This Month", value: `$${(data.revenue.month / 100).toFixed(0)}`, sub: `${data.bookings.month} bookings` },
            { label: "All Time", value: `$${(data.revenue.allTime / 100).toFixed(0)}`, sub: `${data.bookings.allTime} bookings` },
          ].map(({ label, value, sub }) => (
            <Card key={label} className="border-gray-100">
              <CardContent className="p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly target tracker */}
        <Card className="border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Monthly Revenue Target</p>
                <p className="text-xs text-gray-400">$3,000 platform revenue / month</p>
              </div>
              <span className="text-2xl font-bold text-gray-900">{data.target.progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${data.target.progress}%`,
                  backgroundColor: data.target.progress >= 100 ? "#10b981" : data.target.progress >= 60 ? "#c4956a" : "#f59e0b",
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>${(data.target.current / 100).toFixed(0)} earned</span>
              <span>${(data.target.monthly / 100).toFixed(0)} goal</span>
            </div>
            {data.target.grossNeeded > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Need ~${(data.target.grossNeeded / 100).toFixed(0)} more in gross bookings to hit target
              </p>
            )}
          </CardContent>
        </Card>

        {/* Daily revenue chart (last 30 days) */}
        <Card className="border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Daily Revenue (Last 30 Days)</CardTitle>
            <p className="text-xs text-gray-400">{data.bookings.perDay} bookings/day avg</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-32">
              {data.dailyRevenue.map((d: any) => {
                const height = maxDailyRev > 0 ? Math.max(2, (d.revenue / maxDailyRev) * 100) : 2;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className="w-full rounded-t-sm transition-colors bg-[#c4956a]/60 hover:bg-[#c4956a]"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {d.date.slice(5)}: ${(d.revenue / 100).toFixed(0)} ({d.bookings})
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-300">
              <span>{data.dailyRevenue[0]?.date.slice(5)}</span>
              <span>{data.dailyRevenue[data.dailyRevenue.length - 1]?.date.slice(5)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Host & Guest Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Users", value: data.metrics.totalUsers },
            { label: "Active Hosts", value: data.metrics.activeHosts },
            { label: "Total Guests", value: data.metrics.totalGuests },
            { label: "Repeat Guests", value: data.metrics.repeatGuests },
            { label: "Repeat Rate", value: `${data.metrics.repeatConversion}%` },
          ].map(({ label, value }) => (
            <Card key={label} className="border-gray-100">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-semibold text-gray-900">{value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top referrers */}
        {data.topReferrers?.length > 0 && (
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Top Referral Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {data.topReferrers.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.hostName}</p>
                      <p className="text-xs text-gray-400">{r.spaceName} · {r.clicks} clicks · {r.bookings} bookings</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">${(r.revenue / 100).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function TaxReportManager({ token, onBack }: { token: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin/tax-report", token).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const exportCSV = (quarter?: string) => {
    const url = quarter ? `/api/admin/tax-export?quarter=${quarter}` : "/api/admin/tax-export";
    adminFetch(url, token).then(r => r.blob()).then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = quarter ? `align-tax-${quarter}.csv` : "align-tax-all.csv";
      a.click();
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <p className="font-serif text-lg text-gray-900">Tax & Revenue Report</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => exportCSV()} className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export All
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : !data ? (
          <p className="text-center text-gray-500 py-20">No tax data available yet.</p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Tax Collected", value: `$${(data.totals.taxCollected / 100).toFixed(2)}`, sub: "Total FL sales tax" },
                { label: "Platform Revenue", value: `$${(data.totals.platformRevenue / 100).toFixed(2)}`, sub: "Host + guest fees" },
                { label: "Gross Bookings", value: `$${(data.totals.grossBookings / 100).toFixed(2)}`, sub: `${data.totals.bookingCount} bookings` },
                { label: "Blended Take Rate", value: `${data.totals.blendedTakeRate}%`, sub: "Avg platform %" },
              ].map(({ label, value, sub }) => (
                <Card key={label} className="border-gray-100">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quarterly tax summary — for FL DOR remittance */}
            {data.quarterly?.length > 0 && (
              <Card className="border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Quarterly Tax Summary</CardTitle>
                  <p className="text-xs text-gray-400">For Florida DOR sales tax remittance</p>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100">
                    {data.quarterly.map((q: any) => (
                      <div key={q.quarter} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{q.quarter}</p>
                          <p className="text-xs text-gray-400">{q.bookingCount} bookings</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-900">${(q.taxCollected / 100).toFixed(2)}</p>
                          <Button size="sm" variant="ghost" onClick={() => exportCSV(q.quarter)} className="h-7 text-[11px] text-gray-500">
                            <Download className="w-3 h-3 mr-1" /> CSV
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly breakdown */}
            <Card className="border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="text-left py-2 font-medium">Month</th>
                        <th className="text-right py-2 font-medium">Bookings</th>
                        <th className="text-right py-2 font-medium">Gross</th>
                        <th className="text-right py-2 font-medium">Tax</th>
                        <th className="text-right py-2 font-medium">Guest Fees</th>
                        <th className="text-right py-2 font-medium">Host Fees</th>
                        <th className="text-right py-2 font-medium">Platform Rev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.monthly.map((m: any) => (
                        <tr key={m.month} className="hover:bg-gray-50/50">
                          <td className="py-2.5 font-medium text-gray-800">{m.month}</td>
                          <td className="py-2.5 text-right text-gray-600">{m.bookingCount}</td>
                          <td className="py-2.5 text-right text-gray-600">${(m.totalSubtotal / 100).toFixed(0)}</td>
                          <td className="py-2.5 text-right text-gray-600">${(m.totalTaxCollected / 100).toFixed(2)}</td>
                          <td className="py-2.5 text-right text-gray-600">${(m.totalGuestFees / 100).toFixed(2)}</td>
                          <td className="py-2.5 text-right text-gray-600">${(m.totalHostFees / 100).toFixed(2)}</td>
                          <td className="py-2.5 text-right font-medium text-gray-800">${(m.totalPlatformRevenue / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by tier */}
            {data.monthly.length > 0 && (() => {
              const tierTotals: Record<string, { count: number; revenue: number }> = {};
              for (const m of data.monthly) {
                for (const [tier, stats] of Object.entries(m.byTier) as [string, { count: number; revenue: number }][]) {
                  if (!tierTotals[tier]) tierTotals[tier] = { count: 0, revenue: 0 };
                  tierTotals[tier].count += stats.count;
                  tierTotals[tier].revenue += stats.revenue;
                }
              }
              const tierLabels: Record<string, string> = { standard: "Standard", host_referred: "Host Referred", repeat_guest: "Repeat Guest" };
              return Object.keys(tierTotals).length > 0 ? (
                <Card className="border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Revenue by Fee Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-gray-100">
                      {Object.entries(tierTotals).map(([tier, stats]) => (
                        <div key={tier} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{tierLabels[tier] || tier}</p>
                            <p className="text-xs text-gray-400">{stats.count} bookings</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">${(stats.revenue / 100).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </>
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
      "/portrait-builder": "Portrait Builder",
      "/portfolio": "Portfolio",
      "/our-vision": "Our Vision",
      "/portal": "Client Portal",
      "/featured": "Featured",
      "/workspaces": "Workspaces",
      "/browse": "Browse Workspaces",
    };
    return labels[path] || path;
  };

  const eventLabel = (type: string) => {
    const labels: Record<string, string> = {
      shoot_builder_start: "Started shoot builder",
      shoot_builder_complete: "Completed shoot booking",
      space_view: "Viewed a space",
      space_inquiry: "Sent space inquiry",
      space_booking: "Booked a space",
      contact_host_click: "Clicked contact host",
      portfolio_photo_click: "Clicked portfolio photo",
      portfolio_lightbox_view: "Viewed photo lightbox",
      featured_professional_click: "Viewed featured professional",
      gallery_favorite: "Favorited gallery photo",
      gallery_download: "Downloaded gallery photo",
    };
    return labels[type] || type.replace(/_/g, " ");
  };

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const d = Math.floor(hours / 24);
    return `${d}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} data-testid="button-analytics-back" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <p className="font-serif text-lg text-gray-900" data-testid="text-analytics-title">Analytics</p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)} data-testid={`button-analytics-${d}d`}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${days === d ? "bg-[#1a1a1a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >{d}d</button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : !data ? (
          <p className="text-center text-gray-500 py-20">No analytics data available yet.</p>
        ) : (
          <div className="space-y-6">
            {/* ── Key Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-gray-100 cursor-help" title="Total number of pages loaded by real visitors. Bots and crawlers are excluded.">
                <CardContent className="pt-5 pb-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Page Views</p>
                  <p className="text-2xl font-serif text-gray-900 mt-1" data-testid="text-total-views">{data.totalViews.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Last {days} days</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-100 cursor-help" title="Unique browser sessions. One person visiting multiple pages counts as one visitor.">
                <CardContent className="pt-5 pb-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Unique Visitors</p>
                  <p className="text-2xl font-serif text-gray-900 mt-1" data-testid="text-unique-visitors">{data.uniqueVisitors.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Last {days} days</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-100 cursor-help" title="Average time a visitor spends on each page before navigating away. Longer = more engaged.">
                <CardContent className="pt-5 pb-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg. Time on Page</p>
                  <p className="text-2xl font-serif text-gray-900 mt-1" data-testid="text-avg-duration">{formatDuration(data.avgDuration)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Per page view</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-gray-100 cursor-help" title="Percentage of visitors who leave after viewing only one page. Lower is better — means people are exploring.">
                <CardContent className="pt-5 pb-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bounce Rate</p>
                  <p className="text-2xl font-serif text-gray-900 mt-1" data-testid="text-bounce-rate">{data.bounceRate}%</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Single-page sessions</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Conversion Funnels ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white border-gray-100 cursor-help" title="How many visitors start the Portrait Builder vs. how many complete a booking. Higher conversion = better funnel.">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Shoot Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.shootFunnel.starts === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No shoot builder data yet</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Builder Started</span>
                          <span className="text-gray-900 font-medium">{data.shootFunnel.starts}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c4956a] rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Booking Completed</span>
                          <span className="text-gray-900 font-medium">{data.shootFunnel.completes}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.shootFunnel.rate}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">{data.shootFunnel.rate}% conversion</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-100 cursor-help" title="How many visitors view a space listing vs. how many book it. Tracks the full journey from browsing to booking.">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Space Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.spaceFunnel.views === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No space data yet</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Space Views</span>
                          <span className="text-gray-900 font-medium">{data.spaceFunnel.views}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c4956a] rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Inquiries</span>
                          <span className="text-gray-900 font-medium">{data.spaceFunnel.inquiries}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.spaceFunnel.viewToInquiryRate}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Bookings</span>
                          <span className="text-gray-900 font-medium">{data.spaceFunnel.bookings}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.spaceFunnel.inquiryToBookingRate}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-right">{data.spaceFunnel.viewToInquiryRate}% inquiry, {data.spaceFunnel.inquiryToBookingRate}% booking</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Daily Traffic Chart ── */}
            {data.daily.length > 0 && (
              <Card className="bg-white border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Daily Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <div className="flex items-end gap-[3px] h-full">
                      {data.daily.map((d: any, i: number) => {
                        const maxViews = Math.max(...data.daily.map((x: any) => x.views), 1);
                        const viewsH = Math.max((d.views / maxViews) * 100, 1);
                        const visitorsH = Math.max((d.visitors / maxViews) * 100, 1);
                        const date = new Date(d.date + "T12:00:00");
                        const label = `${date.getMonth() + 1}/${date.getDate()}`;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                            <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {label}: {d.views} views, {d.visitors} visitors
                            </div>
                            <div className="w-full flex items-end justify-center gap-[1px]" style={{ height: `${viewsH}%` }}>
                              <div className="flex-1 rounded-t-sm bg-[#c4956a]" style={{ height: "100%" }} />
                              <div className="flex-1 rounded-t-sm bg-gray-300" style={{ height: `${(visitorsH / viewsH) * 100}%` }} />
                            </div>
                            {(i === 0 || i === data.daily.length - 1 || i % Math.ceil(data.daily.length / 7) === 0) && (
                              <span className="text-[9px] text-gray-400 mt-1 leading-none">{label}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 justify-end">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#c4956a]" /><span className="text-[10px] text-gray-500">Views</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-300" /><span className="text-[10px] text-gray-500">Visitors</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Top Pages + Devices/Referrers ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topPages.length === 0 ? (
                    <p className="text-sm text-gray-400">No page data yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.topPages.map((p: any, i: number) => {
                        const maxCount = data.topPages[0]?.count || 1;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-gray-700 truncate max-w-[200px]">{pageLabel(p.page)}</span>
                              <span className="text-xs text-gray-400 tabular-nums">{p.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#c4956a] rounded-full" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-white border-gray-100">
                  <CardHeader className="pb-2">
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
                              <div className="text-2xl font-serif text-gray-900">{pct}%</div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 capitalize">{d.device}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Top Referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.topReferrers.length === 0 ? (
                      <p className="text-sm text-gray-400">No referrer data yet</p>
                    ) : (
                      <div className="space-y-2">
                        {data.topReferrers.slice(0, 5).map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 truncate max-w-[180px]">{r.source}</span>
                            <span className="text-xs text-gray-400 tabular-nums">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Recent User Activity ── */}
            <Card className="bg-white border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Recent User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {!data.recentActivity || data.recentActivity.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No user activity tracked yet. Events will appear as users interact with your site.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.recentActivity.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-[#c4956a]/15 flex items-center justify-center text-[#c4956a] font-semibold text-[10px] shrink-0">
                          {a.userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 truncate">
                            <span className="font-medium">{a.userName}</span>{" "}
                            <span className="text-gray-500">{eventLabel(a.eventType)}</span>
                          </p>
                          {a.path && <p className="text-[10px] text-gray-400 truncate">{a.path}</p>}
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{relativeTime(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Event Counts Summary ── */}
            {data.eventCounts && Object.keys(data.eventCounts).length > 0 && (
              <Card className="bg-white border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Event Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(data.eventCounts).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: any) => (
                      <div key={type} className="p-3 rounded-lg bg-gray-50 text-center">
                        <p className="text-lg font-serif text-gray-900">{count}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{eventLabel(type)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
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

      <main className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
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
                          <SelectItem value="editor">Editor, View & edit photos, chat</SelectItem>
                          <SelectItem value="manager">Manager, Full access except admin settings</SelectItem>
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

function ShootsManager({ token, onBack, onEditShoot, onOpenGallery, onInvoiceShoot }: {
  token: string;
  onBack: () => void;
  onEditShoot: (shoot: Shoot) => void;
  onOpenGallery: (shoot: Shoot) => void;
  onInvoiceShoot: (shoot: Shoot) => void;
}) {
  const { toast } = useToast();
  const [allShoots, setAllShoots] = useState<Shoot[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "in-progress" | "completed" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "client">("date-desc");
  const [messageShoot, setMessageShoot] = useState<Shoot | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [syncingCalendar, setSyncingCalendar] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [shootsRes, usersRes] = await Promise.all([
        adminFetch("/api/admin/shoots", token),
        adminFetch("/api/admin/users", token),
      ]);
      if (shootsRes.ok) setAllShoots(await shootsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const getUserForShoot = useCallback((userId: string) => users.find(u => u.id === userId), [users]);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let result = allShoots.filter((s) => {
      if (statusFilter === "upcoming") {
        return (s.status === "scheduled" || s.status === "pending-review") && s.shootDate && s.shootDate >= today;
      }
      if (statusFilter === "in-progress") return s.status === "in-progress";
      if (statusFilter === "completed") return s.status === "completed";
      if (statusFilter === "draft") return s.status === "draft";
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const user = getUserForShoot(s.userId);
        const clientName = user ? `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase() : "";
        const clientEmail = (user?.email || "").toLowerCase();
        return s.title.toLowerCase().includes(q) || clientName.includes(q) || clientEmail.includes(q) || (s.location || "").toLowerCase().includes(q);
      });
    }

    result.sort((a, b) => {
      if (sortBy === "date-desc") return (b.shootDate || "").localeCompare(a.shootDate || "");
      if (sortBy === "date-asc") return (a.shootDate || "").localeCompare(b.shootDate || "");
      const nameA = getUserForShoot(a.userId);
      const nameB = getUserForShoot(b.userId);
      return `${nameA?.firstName || ""} ${nameA?.lastName || ""}`.localeCompare(`${nameB?.firstName || ""} ${nameB?.lastName || ""}`);
    });

    return result;
  }, [allShoots, statusFilter, searchQuery, sortBy, getUserForShoot, today]);

  const stats = useMemo(() => ({
    total: allShoots.length,
    upcoming: allShoots.filter(s => (s.status === "scheduled" || s.status === "pending-review") && s.shootDate && s.shootDate >= today).length,
    inProgress: allShoots.filter(s => s.status === "in-progress").length,
    completed: allShoots.filter(s => s.status === "completed").length,
  }), [allShoots, today]);

  const handleCalendarSync = async (shoot: Shoot) => {
    setSyncingCalendar(shoot.id);
    try {
      const res = await adminFetch(`/api/admin/shoots/${shoot.id}/calendar`, token, { method: "POST" });
      if (res.ok) {
        toast({ title: "Synced", description: "Shoot added to Google Calendar" });
        await loadData();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to sync to calendar", variant: "destructive" });
    } finally {
      setSyncingCalendar(null);
    }
  };

  const handleCalendarRemove = async (shoot: Shoot) => {
    setSyncingCalendar(shoot.id);
    try {
      const res = await adminFetch(`/api/admin/shoots/${shoot.id}/calendar`, token, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Removed", description: "Shoot removed from Google Calendar" });
        await loadData();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove from calendar", variant: "destructive" });
    } finally {
      setSyncingCalendar(null);
    }
  };

  const loadChatMessages = async (shootId: string) => {
    setLoadingMessages(true);
    try {
      const res = await adminFetch(`/api/admin/shoots/${shootId}/messages`, token);
      if (res.ok) setChatMessages(await res.json());
    } catch { /* ignore */ }
    setLoadingMessages(false);
  };

  const handleSendMessage = async () => {
    if (!messageShoot || !chatInput.trim()) return;
    setSendingMessage(true);
    try {
      const res = await adminFetch(`/api/admin/shoots/${messageShoot.id}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ message: chatInput.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages((prev) => [...prev, msg]);
        setChatInput("");
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessage = (shoot: Shoot) => {
    setMessageShoot(shoot);
    setChatInput("");
    setChatMessages([]);
    loadChatMessages(shoot.id);
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "scheduled") return "bg-blue-100 text-blue-700";
    if (s === "in-progress") return "bg-amber-100 text-amber-700";
    if (s === "pending-review") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Total</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
              <p className="text-xl font-semibold text-blue-600">{stats.upcoming}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">In Progress</p>
              <p className="text-xl font-semibold text-amber-600">{stats.inProgress}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Completed</p>
              <p className="text-xl font-semibold text-green-600">{stats.completed}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="font-serif text-2xl text-gray-900">Shoots</h2>
            <span className="text-sm text-gray-400 font-medium">({filtered.length}{searchQuery || statusFilter !== "all" ? ` of ${allShoots.length}` : ""})</span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, client, or location..."
              className="pl-10 bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters + sort */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <div className="flex gap-1.5">
              {([
                { id: "all" as const, label: "All" },
                { id: "upcoming" as const, label: "Upcoming" },
                { id: "in-progress" as const, label: "In Progress" },
                { id: "completed" as const, label: "Completed" },
                { id: "draft" as const, label: "Draft" },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === f.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer font-medium"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="client">Client Name</option>
              </select>
            </div>
          </div>

          {/* Shoot list */}
          {filtered.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Camera className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="font-serif text-lg text-gray-900 mb-1">
                  {searchQuery || statusFilter !== "all" ? "No matching shoots" : "No shoots yet"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery ? `No shoots match "${searchQuery}".` : "Create a shoot from the Clients tab to get started."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((shoot) => {
                const user = getUserForShoot(shoot.userId);
                const clientName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "No name" : "Unknown";
                const clientEmail = user?.email || "";
                const isSynced = !!shoot.googleCalendarEventId;
                const isSyncing = syncingCalendar === shoot.id;
                const isUpcoming = shoot.shootDate && shoot.shootDate >= today;

                return (
                  <div key={shoot.id} className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      {/* Client avatar */}
                      <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                        {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                        <AvatarFallback className="bg-gray-100 text-gray-500 text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Title + status */}
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{shoot.title}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${statusColor(shoot.status || "draft")}`}>
                            {(shoot.status || "draft").replace("-", " ")}
                          </span>
                          {isSynced && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600 shrink-0 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Synced
                            </span>
                          )}
                        </div>

                        {/* Client + details */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{clientName}</span>
                          {clientEmail && (
                            <>
                              <span>·</span>
                              <span className="truncate">{clientEmail}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          {shoot.shootDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(shoot.shootDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              {shoot.shootTime && ` at ${new Date("2000-01-01T" + shoot.shootTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                            </span>
                          )}
                          {shoot.location && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {shoot.location}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Portrait Builder selections */}
                        {(shoot.environment || shoot.brandMessage || shoot.emotionalImpact || shoot.shootIntent) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {shoot.environment && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-50 text-stone-600 border border-stone-200 capitalize">
                                {shoot.environment === "workvan" ? "Work Van" : shoot.environment.replace("-", " ")}
                              </span>
                            )}
                            {shoot.brandMessage && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                {{ assured: "Welcoming", empathy: "Warm", confidence: "Confident", motivation: "Motivated" }[shoot.brandMessage] || shoot.brandMessage}
                              </span>
                            )}
                            {shoot.emotionalImpact && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                {{ cozy: "Comfortable", bright: "Inspired", powerful: "Reassured" }[shoot.emotionalImpact] || shoot.emotionalImpact}
                              </span>
                            )}
                            {shoot.shootIntent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 capitalize">
                                {shoot.shootIntent.replace("-", " ")}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {/* Quick message */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMessage(shoot)}
                            className="h-7 text-xs px-2.5 text-gray-600 border-gray-200"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Message
                          </Button>

                          {/* Calendar sync */}
                          {shoot.shootDate && (
                            isSynced ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCalendarRemove(shoot)}
                                disabled={isSyncing}
                                className="h-7 text-xs px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              >
                                {isSyncing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CalendarPlus className="w-3 h-3 mr-1" />}
                                Unsync
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCalendarSync(shoot)}
                                disabled={isSyncing}
                                className="h-7 text-xs px-2.5 text-gray-600 border-gray-200"
                              >
                                {isSyncing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CalendarPlus className="w-3 h-3 mr-1" />}
                                Sync Cal
                              </Button>
                            )
                          )}

                          {/* Add to Calendar URL (always available as fallback) */}
                          {shoot.shootDate && (
                            <a
                              href={buildShootCalendarUrl(shoot, clientEmail || undefined)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 text-gray-600 border-gray-200">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Add to Cal
                              </Button>
                            </a>
                          )}

                          <div className="w-px h-4 bg-gray-200 mx-0.5" />

                          <Button variant="outline" size="sm" onClick={() => onOpenGallery(shoot)} className="h-7 text-xs px-2 text-gray-600 border-gray-200">
                            <Images className="w-3 h-3 mr-1" />
                            Gallery
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onEditShoot(shoot)} className="h-7 text-xs px-2 text-gray-600 border-gray-200">
                            <FileText className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onInvoiceShoot(shoot)} className="h-7 text-xs px-2 text-gray-600 border-gray-200">
                            <Receipt className="w-3 h-3 mr-1" />
                            Invoice
                          </Button>

                          {/* Direct contact shortcuts */}
                          {clientEmail && (
                            <a href={`mailto:${clientEmail}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-1.5 text-gray-400 hover:text-gray-600">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {/* Quick Message Modal */}
      <Dialog open={!!messageShoot} onOpenChange={(open) => { if (!open) setMessageShoot(null); }}>
        <DialogContent className="max-w-lg p-0 gap-0 flex flex-col max-h-[80vh]" aria-describedby={undefined}>
          {messageShoot && (() => {
            const user = getUserForShoot(messageShoot.userId);
            const clientName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Client" : "Client";
            return (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <DialogTitle className="font-serif text-lg mb-2">Messages</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                      <AvatarFallback className="bg-gray-200 text-gray-500 text-xs"><User className="w-3 h-3" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{clientName}</p>
                      <p className="text-xs text-gray-500">{user?.email || "No email"}</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{messageShoot.title}</span>
                  </div>
                </div>

                {/* Messages thread */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[400px] bg-gray-50/50">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <Send className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.senderRole === "admin"
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-[10px] mt-1 ${msg.senderRole === "admin" ? "text-gray-400" : "text-gray-400"}`}>
                            {msg.senderName} · {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex gap-2 items-end">
                    <EmojiPickerButton onEmoji={(emoji) => setChatInput((prev) => prev + emoji)} />
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      rows={2}
                      className="resize-none flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !chatInput.trim()}
                      className="bg-[#1a1a1a] text-white self-end h-10 w-10 p-0 shrink-0"
                    >
                      {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Client will also receive an email notification. Press Enter to send.</p>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminDashboard({ token }: { token: string }) {
  const { toast } = useToast();
  const { status: pushStatus, subscribe: subscribePush } = usePushNotifications("admin");
  const [users, setUsers] = useState<UserType[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  type AdminView = "clients" | "create" | "edit" | "gallery" | "tokens" | "shoots" | "employees" | "featured" | "nominations" | "portfolio" | "spaces" | "analytics" | "pipeline" | "tax" | "revenue" | "reviews" | "messages" | "team-members";
  const validViews: AdminView[] = ["clients", "create", "edit", "gallery", "tokens", "shoots", "employees", "featured", "nominations", "portfolio", "spaces", "analytics", "pipeline", "tax", "revenue", "reviews", "messages", "team-members"];
  const getInitialView = (): AdminView => {
    const hash = window.location.hash.replace("#", "");
    return validViews.includes(hash as AdminView) ? (hash as AdminView) : "clients";
  };
  const [view, setViewState] = useState<AdminView>(getInitialView);
  const setView = useCallback((v: AdminView) => {
    setViewState(v);
    window.location.hash = v === "clients" ? "" : v;
  }, []);
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
  const [uploadingUserPhoto, setUploadingUserPhoto] = useState<string | null>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientSort, setClientSort] = useState<"name" | "shoots" | "recent">("name");
  const [clientFilter, setClientFilter] = useState<"all" | "has-shoots" | "no-shoots">("all");
  const [clientPage, setClientPage] = useState(1);
  const CLIENTS_PER_PAGE = 25;
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugPreviewRole, setDebugPreviewRole] = useState<"new" | "photo" | "host" | "both">("new");
  const [debugPreviewOpen, setDebugPreviewOpen] = useState(false);
  const [initialMessageClientId, setInitialMessageClientId] = useState<string | null>(null);

  const sidebarNav = useMemo(() => [
    {
      label: "CRM",
      items: [
        { id: "clients" as const, label: "Clients", icon: Users },
        { id: "shoots" as const, label: "Shoots", icon: Camera },
        { id: "messages" as const, label: "Messages", icon: MessageCircle },
        { id: "pipeline" as const, label: "Contacts", icon: FileSpreadsheet },
      ],
    },
    {
      label: "Content",
      items: [
        { id: "portfolio" as const, label: "Portfolio", icon: Images },
        { id: "featured" as const, label: "Featured", icon: Star },
        { id: "nominations" as const, label: "Nominations", icon: Heart },
        { id: "team-members" as const, label: "Our Vision", icon: Users },
      ],
    },
    {
      label: "Operations",
      items: [
        { id: "spaces" as const, label: "Workspaces", icon: Building2 },
        { id: "employees" as const, label: "Team", icon: Users },
        { id: "reviews" as const, label: "Reviews", icon: MessageSquare },
      ],
    },
    {
      label: "Finance",
      items: [
        { id: "revenue" as const, label: "Revenue", icon: Coins },
        { id: "tax" as const, label: "Tax Report", icon: Receipt },
      ],
    },
    {
      label: "Insights",
      items: [
        { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
      ],
    },
  ], [users.length, shoots.length]);

  // Map sub-views to their parent sidebar item for active highlighting
  const activeNavId = useMemo(() => {
    if (["create", "edit", "gallery", "tokens"].includes(view)) return "clients";
    return view;
  }, [view]);

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        if (!email.includes(q) && !name.includes(q)) return false;
      }
      // Quick filter
      if (clientFilter === "has-shoots") {
        return shoots.some((s) => s.userId === u.id);
      }
      if (clientFilter === "no-shoots") {
        return !shoots.some((s) => s.userId === u.id);
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (clientSort === "name") {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (clientSort === "shoots") {
        const countA = shoots.filter((s) => s.userId === a.id).length;
        const countB = shoots.filter((s) => s.userId === b.id).length;
        return countB - countA;
      }
      // recent: sort by most recent shoot date
      const latestA = shoots.filter((s) => s.userId === a.id).sort((x, y) => (y.shootDate || "").localeCompare(x.shootDate || ""))[0]?.shootDate || "";
      const latestB = shoots.filter((s) => s.userId === b.id).sort((x, y) => (y.shootDate || "").localeCompare(x.shootDate || ""))[0]?.shootDate || "";
      return latestB.localeCompare(latestA);
    });

    return result;
  }, [users, searchQuery, clientFilter, clientSort, shoots]);

  const totalClientPages = Math.max(1, Math.ceil(filteredUsers.length / CLIENTS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (clientPage - 1) * CLIENTS_PER_PAGE;
    return filteredUsers.slice(start, start + CLIENTS_PER_PAGE);
  }, [filteredUsers, clientPage]);

  // Reset page when filters change
  useEffect(() => {
    setClientPage(1);
  }, [searchQuery, clientFilter, clientSort]);

  useEffect(() => {
    if (expandedClient && !filteredUsers.some(u => u.id === expandedClient)) {
      setExpandedClient(null);
    }
  }, [filteredUsers, expandedClient]);

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

  const handleUploadUserPhoto = async (userId: string, file: File) => {
    setUploadingUserPhoto(userId);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await adminFetch(`/api/admin/users/${userId}/photo`, token, {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        toast({ title: "Photo updated" });
      } else {
        toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploadingUserPhoto(null);
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


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[60vh]">
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

    if (view === "team-members") {
      return <AdminTeamMembers token={token} onBack={() => setView("clients")} />;
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

    if (view === "reviews") {
      return <ReviewsManager token={token} onBack={() => setView("clients")} />;
    }

    if (view === "analytics") {
      return <AnalyticsManager token={token} onBack={() => setView("clients")} />;
    }

    if (view === "tax") {
      return <TaxReportManager token={token} onBack={() => setView("clients")} />;
    }

    if (view === "revenue") {
      return <RevenueDashboard token={token} onBack={() => setView("clients")} />;
    }

    if (view === "pipeline") {
      return <PipelineManager token={token} onBack={() => setView("clients")} />;
    }

    if (view === "messages") {
      return (
        <AdminMessagesManager
          token={token}
          onBack={() => setView("clients")}
          initialClientId={initialMessageClientId}
          onClearInitialClient={() => setInitialMessageClientId(null)}
        />
      );
    }

    if (view === "shoots") {
      return (
        <ShootsManager
          token={token}
          onBack={() => setView("clients")}
          onEditShoot={(shoot) => startEdit(shoot)}
          onOpenGallery={(shoot) => openGallery(shoot)}
          onInvoiceShoot={(shoot) => setInvoiceShoot(shoot)}
        />
      );
    }

    if (view === "create" || view === "edit") {
      const isEdit = view === "edit";
      return (
        <div className="min-h-screen bg-[#faf9f7]">
          <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
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
                {isEdit ? "Shoot Details" : "New Photoshoot"}
              </p>
            </div>
          </header>

          <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
                    placeholder="e.g., Spring Brand Refresh"
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

    // Default: Clients view
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
              >
                <BellRing className="w-3.5 h-3.5 mr-1.5" />
                Enable
              </Button>
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats bar */}
            {users.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Total Clients</p>
                  <p className="text-xl font-semibold text-gray-900">{users.length}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Active Shoots</p>
                  <p className="text-xl font-semibold text-gray-900">{shoots.length}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">With Shoots</p>
                  <p className="text-xl font-semibold text-gray-900">{users.filter(u => shoots.some(s => s.userId === u.id)).length}</p>
                </div>
              </div>
            )}

            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="font-serif text-2xl text-gray-900">Clients</h2>
              {users.length > 0 && (
                <span className="text-sm text-gray-400 font-medium">({filteredUsers.length}{searchQuery || clientFilter !== "all" ? ` of ${users.length}` : ""})</span>
              )}
            </div>

            <div className="relative mb-4">
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

            {/* Filter chips + sort */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <div className="flex gap-1.5">
                {([
                  { id: "all" as const, label: "All" },
                  { id: "has-shoots" as const, label: "Has Shoots" },
                  { id: "no-shoots" as const, label: "No Shoots" },
                ] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setClientFilter(f.id)}
                    data-testid={`filter-clients-${f.id}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      clientFilter === f.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={clientSort}
                  onChange={(e) => setClientSort(e.target.value as "name" | "shoots" | "recent")}
                  data-testid="select-client-sort"
                  className="text-xs text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                >
                  <option value="name">Name</option>
                  <option value="shoots">Most Shoots</option>
                  <option value="recent">Recent Activity</option>
                </select>
              </div>
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
              <>
              <input
                ref={userPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  const userId = (e.target as HTMLInputElement).dataset.userId;
                  if (file && userId) handleUploadUserPhoto(userId, file);
                  e.target.value = "";
                }}
              />
              <div className="space-y-1">
                {paginatedUsers.map((user) => {
                  const userShoots = getUserShoots(user.id);
                  const isExpanded = expandedClient === user.id;
                  const displayName = user.firstName || user.lastName
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "No name";
                  return (
                    <div key={user.id} data-testid={`card-client-${user.id}`}>
                      <button
                        onClick={() => setExpandedClient(isExpanded ? null : user.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${isExpanded ? "bg-white shadow-sm ring-1 ring-gray-200" : "bg-white/60 hover:bg-white"}`}
                        data-testid={`button-expand-client-${user.id}`}
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                          <AvatarFallback className="bg-gray-100 text-gray-500 text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email || "No email"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {userShoots.length > 0 && (
                            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                              {userShoots.length} shoot{userShoots.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-white rounded-b-lg shadow-sm ring-1 ring-gray-200 ring-t-0 -mt-1 px-4 pb-4 pt-2">
                              {editingUser === user.id ? (
                                <div className="space-y-2 py-2">
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
                                  <div className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-100">
                                    <Button
                                      size="sm"
                                      onClick={() => startCreate(user)}
                                      data-testid={`button-add-shoot-${user.id}`}
                                      className="bg-[#1a1a1a] text-white h-7 text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Shoot
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => { setSelectedTokenUser(user); setView("tokens"); }}
                                      data-testid={`button-tokens-${user.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      <ImagePlus className="w-3 h-3 mr-1" />
                                      Editor
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditUser(user)}
                                      data-testid={`button-edit-user-${user.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setInitialMessageClientId(user.id);
                                        setView("messages");
                                      }}
                                      data-testid={`button-message-user-${user.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      Message
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingUserPhoto === user.id}
                                      onClick={() => {
                                        if (userPhotoInputRef.current) {
                                          userPhotoInputRef.current.dataset.userId = user.id;
                                          userPhotoInputRef.current.click();
                                        }
                                      }}
                                      data-testid={`button-photo-user-${user.id}`}
                                      className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                    >
                                      {uploadingUserPhoto === user.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                                      Photo
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setDeletingUser(user);
                                        setDeletePassword("");
                                        setDeleteConfirmText("");
                                        setDeleteError("");
                                      }}
                                      data-testid={`button-delete-user-${user.id}`}
                                      className="h-7 text-xs px-2 text-red-500 border-red-200 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                    <div className="flex items-center gap-1.5 ml-auto">
                                      <Badge variant="secondary" className="text-[11px]" data-testid={`badge-annual-tokens-${user.id}`}>
                                        <Coins className="w-3 h-3 mr-1" />
                                        Annual: {tokenMap.get(user.id)?.annualTokens ?? 0}
                                      </Badge>
                                      <Badge variant="secondary" className="text-[11px]" data-testid={`badge-purchased-tokens-${user.id}`}>
                                        <Coins className="w-3 h-3 mr-1" />
                                        Purchased: {tokenMap.get(user.id)?.purchasedTokens ?? 0}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="pt-3">
                                    {userShoots.length === 0 ? (
                                      <p className="text-sm text-gray-400 italic py-1">No photoshoots assigned</p>
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
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Details
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
                                                  {shoot.shootDate && (
                                                    <a
                                                      href={buildShootCalendarUrl(shoot, user.email || undefined)}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      data-testid={`button-calendar-${shoot.id}`}
                                                    >
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs px-2 text-gray-600 border-gray-200"
                                                      >
                                                        <CalendarPlus className="w-3 h-3 mr-1" />
                                                        Calendar
                                                      </Button>
                                                    </a>
                                                  )}
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
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalClientPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Showing {(clientPage - 1) * CLIENTS_PER_PAGE + 1}–{Math.min(clientPage * CLIENTS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={clientPage <= 1}
                      onClick={() => setClientPage(p => p - 1)}
                      className="h-7 w-7 p-0 text-gray-500"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    {Array.from({ length: totalClientPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalClientPages || Math.abs(p - clientPage) <= 1)
                      .reduce<(number | string)[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        typeof p === "string" ? (
                          <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">...</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setClientPage(p)}
                            className={`h-7 min-w-[28px] px-1.5 rounded text-xs font-medium transition-colors ${
                              clientPage === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={clientPage >= totalClientPages}
                      onClick={() => setClientPage(p => p + 1)}
                      className="h-7 w-7 p-0 text-gray-500"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#faf9f7]">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Admin Panel</p>
            <a href="/" className="text-[11px] text-[#c4956a] hover:text-[#a07a52] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-2.5 h-2.5" />
              Back to site
            </a>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sidebarNav.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      setSidebarOpen(false);
                    }}
                    data-testid={`sidebar-nav-${item.id}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors mb-0.5 ${
                      isActive
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Debug Panel */}
        <div className="border-t border-gray-100 px-2 py-2">
          <button
            onClick={() => setDebugOpen(!debugOpen)}
            data-testid="button-toggle-debug"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="font-medium">Debug Tools</span>
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${debugOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {debugOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-2 space-y-3">
                  {/* Portal Preview */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Portal Preview</p>
                    <select
                      value={debugPreviewRole}
                      onChange={(e) => setDebugPreviewRole(e.target.value as typeof debugPreviewRole)}
                      data-testid="select-debug-role"
                      className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400 mb-2"
                    >
                      <option value="new">New User (no data)</option>
                      <option value="photo">Photo Client Only</option>
                      <option value="host">Space Host Only</option>
                      <option value="both">Both Roles</option>
                    </select>
                    <button
                      onClick={() => setDebugPreviewOpen(true)}
                      data-testid="button-open-preview"
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Preview Portal
                    </button>
                  </div>

                  {/* Conditional Flags Reference */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Conditional Flags</p>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">isPhotoClient</span>
                        <span className={`px-1.5 py-0.5 rounded font-mono ${debugPreviewRole === "photo" || debugPreviewRole === "both" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                          {debugPreviewRole === "photo" || debugPreviewRole === "both" ? "true" : "false"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">isSpaceHost</span>
                        <span className={`px-1.5 py-0.5 rounded font-mono ${debugPreviewRole === "host" || debugPreviewRole === "both" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                          {debugPreviewRole === "host" || debugPreviewRole === "both" ? "true" : "false"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">isNewUser</span>
                        <span className={`px-1.5 py-0.5 rounded font-mono ${debugPreviewRole === "new" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                          {debugPreviewRole === "new" ? "true" : "false"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visible Tabs Preview */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Visible Tabs</p>
                    <div className="flex flex-wrap gap-1">
                      {(debugPreviewRole === "photo" || debugPreviewRole === "both" || debugPreviewRole === "new") && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">Shoots</span>
                      )}
                      {(debugPreviewRole === "photo" || debugPreviewRole === "both" || debugPreviewRole === "new") && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">Edits</span>
                      )}
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">Messages</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">Spaces</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">Settings</span>
                    </div>
                  </div>

                  {/* Background Jobs */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Background Jobs</p>
                    <div className="space-y-1.5">
                      <button
                        onClick={async () => {
                          try {
                            await adminFetch("/api/admin/notifications/process", token, { method: "POST" });
                            toast({ title: "Notifications processed" });
                          } catch { toast({ title: "Failed", variant: "destructive" }); }
                        }}
                        data-testid="button-trigger-notifications"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Bell className="w-3 h-3" />
                        Trigger Notifications
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await adminFetch("/api/admin/payouts/process", token, { method: "POST" });
                            const data = await res.json();
                            toast({ title: `Payouts: ${data.completedBookings} completed, ${data.payoutsProcessed} paid` });
                          } catch { toast({ title: "Failed", variant: "destructive" }); }
                        }}
                        data-testid="button-trigger-payouts"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <DollarSign className="w-3 h-3" />
                        Trigger Payouts
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await adminFetch("/api/admin/test-client/seed", token, { method: "POST" });
                            const data = await res.json();
                            toast({ title: data.message || "Test client re-seeded" });
                          } catch { toast({ title: "Failed to re-seed", variant: "destructive" }); }
                        }}
                        data-testid="button-reseed-test-client"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-seed Test Client
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            toast({ title: "Syncing Stripe bookings..." });
                            const res = await adminFetch("/api/admin/stripe-sync", token, { method: "POST" });
                            const data = await res.json();
                            toast({ title: `Stripe sync: ${data.synced} synced, ${data.skipped} skipped${data.errors?.length ? `, ${data.errors.length} errors` : ""}` });
                          } catch { toast({ title: "Stripe sync failed", variant: "destructive" }); }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Sync Stripe Bookings
                      </button>
                    </div>
                  </div>

                  {/* Current Admin State */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Admin State</p>
                    <div className="space-y-1 text-[11px] font-mono">
                      <p className="text-gray-500">view: <span className="text-gray-800">{view}</span></p>
                      <p className="text-gray-500">users: <span className="text-gray-800">{users.length}</span></p>
                      <p className="text-gray-500">shoots: <span className="text-gray-800">{shoots.length}</span></p>
                      <p className="text-gray-500">tokens: <span className="text-gray-800">{allEditTokens.length}</span></p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Debug Portal Preview Modal */}
      <AnimatePresence>
        {debugPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => setDebugPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-violet-600" />
                  <p className="text-sm font-medium text-gray-900">Portal Preview</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                    {debugPreviewRole === "new" && "New User"}
                    {debugPreviewRole === "photo" && "Photo Client"}
                    {debugPreviewRole === "host" && "Space Host"}
                    {debugPreviewRole === "both" && "Both Roles"}
                  </span>
                </div>
                <button onClick={() => setDebugPreviewOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Simulated portal tab bar */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Tab Bar Preview</p>
                  <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-100">
                    {(debugPreviewRole === "photo" || debugPreviewRole === "both" || debugPreviewRole === "new") && (
                      <div className="flex-1 text-center py-2 rounded-md bg-gray-900 text-white text-xs font-medium">Shoots</div>
                    )}
                    {(debugPreviewRole === "photo" || debugPreviewRole === "both" || debugPreviewRole === "new") && (
                      <div className="flex-1 text-center py-2 rounded-md text-gray-500 text-xs">Edits</div>
                    )}
                    <div className="flex-1 text-center py-2 rounded-md text-gray-500 text-xs">Messages</div>
                    <div className="flex-1 text-center py-2 rounded-md text-gray-500 text-xs">Spaces</div>
                    <div className="flex-1 text-center py-2 rounded-md text-gray-500 text-xs">Settings</div>
                  </div>
                </div>

                {/* Content areas preview */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Spaces Sub-tabs</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium">Favorites</span>
                      <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs">My Bookings</span>
                      {(debugPreviewRole === "host" || debugPreviewRole === "both") && (
                        <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs relative">
                          My Spaces
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">H</span>
                          </span>
                        </span>
                      )}
                      {(debugPreviewRole === "host" || debugPreviewRole === "both") && (
                        <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs relative">
                          Earnings
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">H</span>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Conditional Elements</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugPreviewRole === "photo" || debugPreviewRole === "both" || debugPreviewRole === "new" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <span className="text-gray-700">Shoots tab</span>
                        <span className="text-gray-400 ml-auto">isPhotoClient || isNewUser</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugPreviewRole === "photo" || debugPreviewRole === "both" || debugPreviewRole === "new" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <span className="text-gray-700">Edits tab</span>
                        <span className="text-gray-400 ml-auto">isPhotoClient || isNewUser</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugPreviewRole === "host" || debugPreviewRole === "both" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <span className="text-gray-700">My Spaces sub-tab</span>
                        <span className="text-gray-400 ml-auto">isSpaceHost</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugPreviewRole === "host" || debugPreviewRole === "both" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        <span className="text-gray-700">Earnings sub-tab</span>
                        <span className="text-gray-400 ml-auto">isSpaceHost</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-700">Messages tab</span>
                        <span className="text-gray-400 ml-auto">always visible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-700">Spaces tab</span>
                        <span className="text-gray-400 ml-auto">always visible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-700">Settings tab</span>
                        <span className="text-gray-400 ml-auto">always visible</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 border-b border-gray-200 bg-white flex items-center px-3 sm:px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-sm font-medium text-gray-700 truncate">
            {view === "clients" && "Clients"}
            {view === "pipeline" && "Contacts"}
            {view === "portfolio" && "Portfolio"}
            {view === "featured" && "Featured"}
            {view === "nominations" && "Nominations"}
            {view === "employees" && "Team"}
            {view === "spaces" && "Spaces"}
            {view === "reviews" && "Reviews"}
            {view === "analytics" && "Analytics"}
            {view === "revenue" && "Revenue"}
            {view === "tax" && "Tax Report"}
            {view === "create" && "New Photoshoot"}
            {view === "edit" && "Shoot Details"}
            {view === "gallery" && "Gallery"}
            {view === "tokens" && "Edit Tokens"}
            {view === "team-members" && "Our Vision"}
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Modals (rendered outside layout) */}
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

function AdminMessagesManager({ token, onBack, initialClientId, onClearInitialClient }: { token: string; onBack: () => void; initialClientId: string | null; onClearInitialClient: () => void }) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [clientLastRead, setClientLastRead] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await adminFetch("/api/admin/conversations", token);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        return data;
      }
    } catch {}
    return [];
  };

  const loadMessages = async (convoId: string) => {
    setLoadingMessages(true);
    try {
      const res = await adminFetch(`/api/admin/conversations/${convoId}/messages`, token);
      if (res.ok) {
        const data = await res.json();
        const msgs = Array.isArray(data) ? data : data.messages;
        const lastRead = Array.isArray(data) ? null : data.otherPartyLastRead;
        setChatMessages(msgs);
        setClientLastRead(lastRead);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {}
    setLoadingMessages(false);
  };

  const selectConversation = async (convo: any) => {
    setSelectedConvo(convo);
    await loadMessages(convo.id);
    // Mark as read
    adminFetch(`/api/admin/conversations/${convo.id}/read`, token, { method: "POST" }).catch(() => {});
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const convos = await loadConversations();
      // If opened from a client card, auto-select or create that conversation
      if (initialClientId) {
        const existing = convos.find((c: any) => c.clientId === initialClientId);
        if (existing) {
          await selectConversation(existing);
        } else {
          // Create conversation without sending a message
          try {
            const res = await adminFetch(`/api/admin/conversations/${initialClientId}`, token, {
              method: "POST",
            });
            if (res.ok) {
              const newConvo = await res.json();
              setConversations((prev) => [newConvo, ...prev]);
              setSelectedConvo(newConvo);
              setChatMessages([]);
            }
          } catch {}
        }
        onClearInitialClient();
      }
      setLoading(false);
    };
    init();
  }, []);

  // Poll for new conversations/messages
  useEffect(() => {
    const interval = setInterval(async () => {
      await loadConversations();
      if (selectedConvo) {
        const res = await adminFetch(`/api/admin/conversations/${selectedConvo.id}/messages`, token);
        if (res.ok) {
          const data = await res.json();
          const msgs = Array.isArray(data) ? data : data.messages;
          const lastRead = Array.isArray(data) ? null : data.otherPartyLastRead;
          if (msgs.length !== chatMessages.length || lastRead !== clientLastRead) {
            setChatMessages(msgs);
            setClientLastRead(lastRead);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConvo?.id, chatMessages.length]);

  const handleSend = async () => {
    if (!selectedConvo || (!chatInput.trim() && !pendingImage)) return;
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/conversations/${selectedConvo.clientId}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ message: chatInput.trim(), imageUrl: pendingImage || undefined }),
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages((prev) => [...prev, msg]);
        setChatInput("");
        setPendingImage(null);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        loadConversations();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-baseline gap-2 mb-6">
            <h2 className="font-serif text-2xl text-gray-900">Messages</h2>
            <span className="text-sm text-gray-400 font-medium">({conversations.length})</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex" style={{ minHeight: "65vh" }}>
            {/* Conversation List */}
            <div className={`w-full sm:w-80 border-r border-gray-100 flex-shrink-0 overflow-y-auto ${selectedConvo ? "hidden sm:block" : ""}`}>
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Message a client to start</p>
                </div>
              ) : (
                conversations.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConvo?.id === c.id ? "bg-stone-50 border-l-2 border-l-gray-900" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5">
                        {c.clientPhoto && <AvatarImage src={c.clientPhoto} />}
                        <AvatarFallback className="bg-gray-200 text-gray-500 text-xs"><User className="w-3.5 h-3.5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${c.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                            {c.clientName}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {c.latestMessage ? new Date(c.latestMessage.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.clientEmail}</p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <p className={`text-xs truncate ${c.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                            {c.latestMessage ? (c.latestMessage.senderRole === "admin" ? "You: " : "") + c.latestMessage.message : "No messages"}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] rounded-full bg-gray-900 text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">
                              {c.unreadCount > 9 ? "9+" : c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Chat Thread */}
            <div className={`flex-1 flex flex-col ${!selectedConvo ? "hidden sm:flex" : ""}`}>
              {selectedConvo ? (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setSelectedConvo(null)} className="sm:hidden text-gray-500 hover:text-gray-700">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Avatar className="w-8 h-8">
                      {selectedConvo.clientPhoto && <AvatarImage src={selectedConvo.clientPhoto} />}
                      <AvatarFallback className="bg-gray-200 text-gray-500 text-xs"><User className="w-3.5 h-3.5" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedConvo.clientName}</p>
                      <p className="text-xs text-gray-500">{selectedConvo.clientEmail}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50" style={{ maxHeight: "calc(65vh - 130px)" }}>
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <Send className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No messages yet</p>
                      </div>
                    ) : (
                      (() => {
                        const clr = clientLastRead ? new Date(clientLastRead) : null;
                        const adminMsgs = chatMessages.filter((m: any) => m.senderRole === "admin" && m.createdAt);
                        const seenAdminMsgs = clr ? adminMsgs.filter((m: any) => new Date(m.createdAt) <= clr) : [];
                        const lastSeenId = seenAdminMsgs.length > 0 ? seenAdminMsgs[seenAdminMsgs.length - 1].id : null;
                        return chatMessages.map((msg: any) => (
                          <div key={msg.id}>
                            <div className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                msg.senderRole === "admin"
                                  ? "bg-[#1a1a1a] text-white rounded-br-md"
                                  : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                              }`}>
                                {msg.senderRole !== "admin" && (
                                  <p className="text-[10px] font-medium text-gray-400 mb-0.5">{msg.senderName}</p>
                                )}
                                {msg.message && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>}
                                {msg.imageUrl && <MessageImage src={msg.imageUrl} className="mt-1" />}
                                <p className={`text-[10px] mt-1 ${msg.senderRole === "admin" ? "text-gray-400" : "text-gray-300"}`}>
                                  {msg.senderName} · {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            {msg.id === lastSeenId && (
                              <p className="text-[10px] text-gray-400 text-right mr-1 mt-0.5 flex items-center justify-end gap-1">
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                                Seen
                              </p>
                            )}
                          </div>
                        ));
                      })()
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    {pendingImage && (
                      <div className="mb-2 flex items-center gap-2">
                        <img src={pendingImage} alt="Pending" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                        <button onClick={() => setPendingImage(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <EmojiPickerButton onEmoji={(emoji) => setChatInput((prev) => prev + emoji)} />
                      <ImageAttachButton onImageReady={setPendingImage} pendingImage={pendingImage} onClear={() => setPendingImage(null)} uploadUrl="/api/admin/messages/upload-image" />
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        rows={2}
                        className="resize-none flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sending || (!chatInput.trim() && !pendingImage)}
                        className="bg-[#1a1a1a] text-white self-end h-10 w-10 p-0 shrink-0"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Messages sent as Align. Press Enter to send.</p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center px-6">
                  <div>
                    <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Select a conversation</p>
                    <p className="text-xs text-gray-400 mt-1">Or message a client from the Clients tab</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function buildShootCalendarUrl(shoot: Shoot, clientEmail?: string) {
  const title = encodeURIComponent(shoot.title || "Portrait Session");
  const location = shoot.location ? encodeURIComponent(shoot.location) : "";
  const details = encodeURIComponent(
    [
      clientEmail ? `Client: ${clientEmail}` : "",
      shoot.environment ? `Environment: ${shoot.environment}` : "",
      shoot.emotionalImpact ? `Mood: ${shoot.emotionalImpact}` : "",
      "Align Workspaces",
    ].filter(Boolean).join("\n")
  );

  const dateRaw = shoot.shootDate || "";
  const [year, month, day] = dateRaw.split("-").map(Number);

  if (shoot.shootTime) {
    const [hours, minutes] = shoot.shootTime.split(":").map(Number);
    const start = `${dateRaw.replace(/-/g, "")}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
    const endDate = new Date(year, month - 1, day, hours + 2, minutes);
    const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  }

  const startDate = dateRaw.replace(/-/g, "");
  const endD = new Date(year, month - 1, day + 1);
  const endDate = `${endD.getFullYear()}${String(endD.getMonth() + 1).padStart(2, "0")}${String(endD.getDate()).padStart(2, "0")}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    // Check for legacy sessionStorage token first
    return sessionStorage.getItem("admin_token");
  });

  const handleLogin = (t: string) => {
    if (t === "__session__") {
      // Session-based auth (magic link) — no need to store in sessionStorage
      setToken("__session__");
    } else {
      // Legacy password-based auth
      sessionStorage.setItem("admin_token", t);
      sessionStorage.setItem("adminToken", t);
      setToken(t);
    }
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} />;
}
