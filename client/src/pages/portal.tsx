import { useState, useEffect, useCallback, useRef } from "react";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowDown,
  Camera,
  Mail,
  Calendar,
  LogOut,
  Image,
  HelpCircle,
  Clock,
  CheckCircle,
  Loader2,
  User,
  Download,
  ChevronLeft,
  Images,
  Heart,
  Folder,
  FolderOpen,
  MapPin,
  ExternalLink,
  CalendarPlus,
  ChevronRight,
  X,
  Send,
  CheckCircle2,
  Coins,
  Upload,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileImage,
  ImagePlus,
  MessageCircle,
  Building2,
  Menu,
  Star,
  Info,
  Compass,
  Settings,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import type { Shoot, GalleryImage, GalleryFolder } from "@shared/schema";
import PortalSpacesSection from "@/components/portal-spaces";
import PortalMessagesSection, { useUnreadCount } from "@/components/portal-messages";
import PortalSettings from "@/components/portal-settings";
import LoyaltyBadge from "@/components/loyalty-badge";
import ShootProgressBar, { getShootProgressStage } from "@/components/shoot-progress-bar";
import { useToast } from "@/hooks/use-toast";

import { playNotificationSound } from "@/lib/notification-sound";
import { trackEvent } from "@/hooks/use-analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrivalGuideViewer, ArrivalGuideInline } from "@/components/arrival-guide";
import BookingCalendar from "@/components/booking-calendar";

type EditToken = {
  id: string;
  userId: string;
  annualTokens: number;
  purchasedTokens: number;
  annualTokenResetDate: string;
  lastPhotoshootDate: string | null;
};

type EditRequest = {
  id: string;
  userId: string;
  shootId: string | null;
  photoCount: number;
  annualTokensUsed: number;
  purchasedTokensUsed: number;
  notes: string | null;
  status: string;
  createdAt: string;
};

type TokenConfig = {
  pricePerToken: number;
  tokensPerPhoto: number;
};

type EditRequestMessage = {
  id: string;
  editRequestId: string;
  senderId: string;
  senderRole: string;
  senderName: string | null;
  message: string;
  createdAt: string;
};

// Maps emotional impact values to the env image suffix
const moodToSuffix: Record<string, string> = {
  cozy: "cozy",
  bright: "bright",
  powerful: "powerful",
};

function getEnvironmentCoverImage(environment: string | null, emotionalImpact: string | null): string | null {
  if (!environment || environment === "other") return null;
  const suffix = emotionalImpact ? moodToSuffix[emotionalImpact] : null;
  if (suffix) return `/images/env-${environment}-${suffix}.webp`;
  return `/images/env-${environment}.webp`;
}

function getStatusColor(status: string | null) {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50";
    case "scheduled":
      return "text-blue-600 bg-blue-50";
    case "in-progress":
      return "text-amber-600 bg-amber-50";
    case "pending-review":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-3.5 h-3.5" />;
    case "scheduled":
      return <Calendar className="w-3.5 h-3.5" />;
    case "in-progress":
      return <Clock className="w-3.5 h-3.5" />;
    case "pending-review":
      return <Clock className="w-3.5 h-3.5" />;
    default:
      return <Camera className="w-3.5 h-3.5" />;
  }
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "completed":
      return "Completed";
    case "scheduled":
      return "Scheduled";
    case "in-progress":
      return "In Progress";
    case "pending-review":
      return "Pending Review";
    default:
      return "Draft";
  }
}

function formatDate(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildGoogleCalendarUrl(shoot: Shoot) {
  const title = encodeURIComponent(shoot.title || "Portrait Session");
  const location = shoot.location ? encodeURIComponent(shoot.location) : "";
  const details = encodeURIComponent(
    [
      shoot.environment ? `Environment: ${shoot.environment}` : "",
      shoot.emotionalImpact ? `Mood: ${shoot.emotionalImpact}` : "",
      "Align Workspaces - AlignPhotoDesign.com",
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

function downloadIcsFile(shoot: Shoot) {
  const title = shoot.title || "Portrait Session";
  const location = shoot.location || "";
  const description = [
    shoot.environment ? `Environment: ${shoot.environment}` : "",
    shoot.emotionalImpact ? `Mood: ${shoot.emotionalImpact}` : "",
    "Align Workspaces - AlignPhotoDesign.com",
  ].filter(Boolean).join("\\n");

  const dateRaw = shoot.shootDate || "";
  const [year, month, day] = dateRaw.split("-").map(Number);
  let dtStart: string;
  let dtEnd: string;

  if (shoot.shootTime) {
    const [hours, minutes] = shoot.shootTime.split(":").map(Number);
    dtStart = `${dateRaw.replace(/-/g, "")}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
    const endDate = new Date(year, month - 1, day, hours + 2, minutes);
    dtEnd = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
  } else {
    dtStart = dateRaw.replace(/-/g, "");
    const endD = new Date(year, month - 1, day + 1);
    dtEnd = `${endD.getFullYear()}${String(endD.getMonth() + 1).padStart(2, "0")}${String(endD.getDate()).padStart(2, "0")}`;
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Align Workspaces//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        data-testid="lightbox-close"
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm" data-testid="lightbox-counter">
        {currentIndex + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            data-testid="lightbox-prev"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            data-testid="lightbox-next"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <motion.img
        key={current.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        src={current.imageUrl}
        alt={current.originalFilename || "Photo"}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
        data-testid="lightbox-image"
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        {current.originalFilename || "Photo"}
      </div>
    </motion.div>
  );
}

function GalleryImageCard({ image, index, isFav, isVisible, onToggleFavorite, onOpenLightbox, onDownload, shootId }: {
  image: GalleryImage;
  index: number;
  isFav: boolean;
  isVisible: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenLightbox: (index: number) => void;
  onDownload: (imageId: string, filename: string) => void;
  shootId: string;
}) {
  return (
    <div
      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
      data-testid={`client-gallery-image-${image.id}`}
      onClick={() => { if (isVisible) onOpenLightbox(index); }}
    >
      <img
        src={image.thumbnailUrl || image.imageUrl}
        alt={image.originalFilename || image.caption || "Photo"}
        className="w-full h-full object-cover"
        loading={isVisible ? "eager" : "lazy"}
        decoding="async"
        sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
      />
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(image.id); }}
        data-testid={`button-favorite-${image.id}`}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isFav
            ? "bg-red-500 text-white shadow-md"
            : "bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50"
        }`}
      >
        <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
      </button>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100 pointer-events-none">
        <p className="text-white text-xs truncate flex-1 mr-2">
          {image.originalFilename || "Photo"}
        </p>
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDownload(image.id, image.originalFilename || "photo.jpg"); }}
          data-testid={`button-download-image-${image.id}`}
          className="h-7 w-7 p-0 shrink-0 bg-white/90 text-black hover:bg-white pointer-events-auto"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
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

function EditRequestCard({ request, getStatusBadge, defaultOpen }: { request: EditRequest; getStatusBadge: (status: string) => JSX.Element; defaultOpen?: boolean }) {
  const [showChat, setShowChat] = useState(defaultOpen ?? false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photos, setPhotos] = useState<EditRequestPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<EditRequestPhoto | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (showChat) return;
    const checkUnread = async () => {
      try {
        const res = await fetch(`/api/edit-requests/${request.id}/messages`, { credentials: "include" });
        if (res.ok) {
          const msgs: EditRequestMessage[] = await res.json();
          const adminMsgs = msgs.filter(m => m.senderRole === "admin");
          const clientMsgs = msgs.filter(m => m.senderRole === "client");
          if (adminMsgs.length > 0) {
            const lastAdmin = adminMsgs[adminMsgs.length - 1];
            const lastClient = clientMsgs.length > 0 ? clientMsgs[clientMsgs.length - 1] : null;
            if (!lastClient || new Date(lastAdmin.createdAt) > new Date(lastClient.createdAt)) {
              setHasUnread(true);
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
  }, [request.id, showChat]);

  const handleChatToggle = () => {
    if (!showChat) setHasUnread(false);
    setShowChat(!showChat);
  };

  const loadPhotos = async () => {
    if (photos.length > 0) return;
    setPhotosLoading(true);
    try {
      const res = await fetch(`/api/edit-requests/${request.id}/photos`, { credentials: "include" });
      if (res.ok) setPhotos(await res.json());
    } catch {} finally {
      setPhotosLoading(false);
    }
  };

  const togglePhotos = () => {
    if (!showPhotos) loadPhotos();
    setShowPhotos(!showPhotos);
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border ${defaultOpen ? "border-amber-200 bg-amber-50/30" : "border-gray-200 bg-white"}`}
      data-testid={`card-edit-request-${request.id}`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900 text-sm">{request.photoCount} photo(s)</span>
            {getStatusBadge(request.status)}
          </div>
          <span className="text-xs text-gray-400">{formatDate(request.createdAt)}</span>
        </div>

        {request.notes && (
          <div className="bg-gray-50 rounded-md px-3 py-2 mb-2">
            <p className="text-xs text-gray-500 font-medium mb-0.5">Editing Instructions</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {request.annualTokensUsed} included + {request.purchasedTokensUsed} purchased sessions
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePhotos}
              data-testid={`button-toggle-photos-${request.id}`}
              className="h-8"
            >
              <Images className="w-3.5 h-3.5 mr-1.5" />
              {showPhotos ? "Hide Photos" : "View Photos"}
            </Button>
            <Button
              variant={showChat ? "default" : "outline"}
              size="sm"
              onClick={handleChatToggle}
              data-testid={`button-toggle-chat-${request.id}`}
              className={`relative h-8 ${showChat ? "bg-[#1a1a1a] text-white" : ""}`}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              {showChat ? "Hide Chat" : "Chat"}
              {hasUnread && !showChat && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {showPhotos && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          {photosLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
          ) : photos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No photos found</p>
          ) : (
            <div className="space-y-3">
              {photos.map(photo => {
                const resolveSrc = (url: string) => url.startsWith("/") || url.startsWith("http") ? url : `/objects/${url}`;
                const originalSrc = resolveSrc(photo.imageUrl);
                const finishedSrc = photo.finishedImageUrl ? resolveSrc(photo.finishedImageUrl) : null;
                return (
                  <div key={photo.id} data-testid={`edit-photo-${photo.id}`}>
                    {finishedSrc ? (
                      <div className="flex gap-2 items-start">
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
                                className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-emerald-600 mb-1 uppercase tracking-wide font-medium">Finished</p>
                          <div
                            className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group cursor-pointer ring-2 ring-emerald-200"
                            onClick={() => setLightboxPhoto({ ...photo, imageUrl: photo.finishedImageUrl!, originalFilename: photo.finishedFilename })}
                          >
                            <img src={finishedSrc} alt={photo.finishedFilename || "Finished"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-end p-1.5 opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); const a = document.createElement("a"); a.href = finishedSrc; a.download = photo.finishedFilename || "finished.jpg"; a.click(); }}
                                data-testid={`button-download-finished-photo-${photo.id}`}
                                className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group cursor-pointer max-w-[50%]"
                        onClick={() => setLightboxPhoto(photo)}
                      >
                        <img src={originalSrc} alt={photo.originalFilename || "Edit request photo"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
                    )}
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
                  const src = lightboxPhoto.imageUrl.startsWith("/") || lightboxPhoto.imageUrl.startsWith("http") ? lightboxPhoto.imageUrl : `/objects/${lightboxPhoto.imageUrl}`;
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
              src={lightboxPhoto.imageUrl.startsWith("/") || lightboxPhoto.imageUrl.startsWith("http") ? lightboxPhoto.imageUrl : `/objects/${lightboxPhoto.imageUrl}`}
              alt={lightboxPhoto.originalFilename || "Edit request photo"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {lightboxPhoto.originalFilename && (
              <p className="text-white/70 text-xs mt-2">{lightboxPhoto.originalFilename}</p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EditRequestChat editRequestId={request.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditRequestChat({ editRequestId }: { editRequestId: string }) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const { data: messages = [], isLoading } = useQuery<EditRequestMessage[]>({
    queryKey: ["/api/edit-requests", editRequestId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/edit-requests/${editRequestId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (messages.length > prevCountRef.current && prevCountRef.current > 0) {
      const newest = messages[messages.length - 1];
      if (newest.senderRole === "admin") {
        playNotificationSound();
      }
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/edit-requests/${editRequestId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/edit-requests", editRequestId, "messages"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 border border-gray-200 rounded-lg bg-white" data-testid={`chat-${editRequestId}`}>
      <div className="max-h-60 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No messages yet. Start a conversation about your edit request.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.senderRole === "client" ? "items-end" : "items-start"}`}
              data-testid={`message-${msg.id}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.senderRole === "client"
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className={`text-[10px] font-medium mb-0.5 ${msg.senderRole === "client" ? "text-white/60" : "text-gray-500"}`}>
                  {msg.senderName || (msg.senderRole === "admin" ? "Armando R." : "You")}
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
          data-testid={`input-chat-message-${editRequestId}`}
          className="text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          data-testid={`button-send-message-${editRequestId}`}
          className="bg-[#1a1a1a] text-white shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function EditTokenSection() {
  const { toast } = useToast();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editInstructions, setEditInstructions] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("token_purchase") === "success") {
      toast({ title: "Purchase Successful", description: "Your retouching sessions have been added to your account." });
      const url = new URL(window.location.href);
      url.searchParams.delete("token_purchase");
      window.history.replaceState({}, "", url.toString());
      queryClient.invalidateQueries({ queryKey: ["/api/edit-tokens"] });
    }
    if (params.get("space_payment") === "success") {
      toast({ title: "Booking confirmed!", description: "Your space has been booked. Check your messages for details." });
      const url = new URL(window.location.href);
      url.searchParams.delete("space_payment");
      window.history.replaceState({}, "", url.toString());
      queryClient.invalidateQueries({ queryKey: ["/api/space-bookings"] });
    }
    if (params.get("stripe_connect") === "return") {
      toast({ title: "Stripe setup updated", description: "Your payout account has been configured." });
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_connect");
      window.history.replaceState({}, "", url.toString());
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/connect/status"] });
    }
    const emailChange = params.get("emailChange");
    if (emailChange) {
      const url = new URL(window.location.href);
      url.searchParams.delete("emailChange");
      window.history.replaceState({}, "", url.toString());
      if (emailChange === "success") {
        toast({ title: "Email updated", description: "Your email has been changed successfully." });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else if (emailChange === "expired") {
        toast({ title: "Link expired", description: "The email change link has expired. Please try again.", variant: "destructive" });
      } else if (emailChange === "taken") {
        toast({ title: "Email unavailable", description: "That email is already in use by another account.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Something went wrong with the email change.", variant: "destructive" });
      }
    }
  }, [toast]);

  const { data: tokenBalance, isLoading: tokensLoading } = useQuery<EditToken>({
    queryKey: ["/api/edit-tokens"],
    queryFn: async () => {
      const res = await fetch("/api/edit-tokens", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch token balance");
      return res.json();
    },
  });

  const { data: editRequests = [], isLoading: requestsLoading } = useQuery<EditRequest[]>({
    queryKey: ["/api/edit-requests"],
    queryFn: async () => {
      const res = await fetch("/api/edit-requests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch edit requests");
      return res.json();
    },
  });

  const { data: tokenConfig } = useQuery<TokenConfig>({
    queryKey: ["/api/edit-tokens/config"],
    queryFn: async () => {
      const res = await fetch("/api/edit-tokens/config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
  });

  const totalTokens = (tokenBalance?.annualTokens ?? 0) + (tokenBalance?.purchasedTokens ?? 0);
  const fileCount = selectedFiles.length;
  const tokensPerPhoto = tokenConfig?.tokensPerPhoto ?? 1;
  const tokenCost = fileCount * tokensPerPhoto;
  const annualAvailable = tokenBalance?.annualTokens ?? 0;
  const purchasedAvailable = tokenBalance?.purchasedTokens ?? 0;
  const annualUsed = Math.min(tokenCost, annualAvailable);
  const purchasedUsed = Math.min(tokenCost - annualUsed, purchasedAvailable);
  const hasEnoughTokens = tokenCost <= totalTokens;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...files]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPhotos = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("photos", file));
      if (editInstructions.trim()) {
        formData.append("notes", editInstructions.trim());
      }
      const res = await fetch("/api/edit-requests", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to submit" }));
        throw new Error(err.message || "Failed to submit edit request");
      }
      const data = await res.json();
      setSelectedFiles([]);
      setEditInstructions("");
      setShowConfirmDialog(false);
      setShowSubmitDialog(false);
      setJustSubmittedId(data.editRequest?.id || null);
      queryClient.invalidateQueries({ queryKey: ["/api/edit-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/edit-requests"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit edit request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyTokens = async () => {
    setIsBuying(true);
    try {
      const res = await fetch("/api/edit-tokens/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: buyQuantity }),
      });
      if (!res.ok) throw new Error("Failed to create checkout");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start purchase.", variant: "destructive" });
    } finally {
      setIsBuying(false);
    }
  };

  const getEditRequestStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-50 text-green-700" data-testid="badge-request-completed"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in-progress":
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700" data-testid="badge-request-in-progress"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700" data-testid="badge-request-pending"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <Card className="bg-gradient-to-br from-stone-50 to-stone-100/50 border-stone-200/60" data-testid="card-token-balance">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Coins className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Photo Retouching</p>
                <p className="text-xs text-gray-500">Color correction, touch-ups & more</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBuyDialog(true)}
              data-testid="button-buy-tokens"
              className="h-8 text-xs"
            >
              <ShoppingCart className="w-3 h-3 mr-1.5" />
              Get More
            </Button>
          </div>
          {tokensLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : tokenBalance ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg px-3 py-2.5 text-center border border-stone-200/60" data-testid="text-annual-tokens">
                  <p className="text-xl font-bold text-gray-900">{tokenBalance.annualTokens}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Included</p>
                </div>
                <div className="bg-white rounded-lg px-3 py-2.5 text-center border border-stone-200/60" data-testid="text-purchased-tokens">
                  <p className="text-xl font-bold text-gray-900">{tokenBalance.purchasedTokens}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Purchased</p>
                </div>
                <div className="bg-white rounded-lg px-3 py-2.5 text-center border border-stone-200/60" data-testid="text-reset-date">
                  <p className="text-xl font-bold text-gray-900">{totalTokens}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Available</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center">Included sessions reset {formatDate(tokenBalance.annualTokenResetDate)}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Unable to load session balance.</p>
          )}

          <Button
            onClick={() => setShowSubmitDialog(true)}
            data-testid="button-open-submit-dialog"
            className="w-full bg-[#1a1a1a] text-white mt-4 font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit Photos for Editing
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showSubmitDialog} onOpenChange={(open) => { if (!isSubmitting) setShowSubmitDialog(open); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="dialog-submit-edit">
          <DialogHeader>
            <DialogTitle>Submit Photos for Editing</DialogTitle>
            <DialogDescription>Upload your photos and describe the edits you'd like.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-testid="dropzone-edit-photos"
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => document.getElementById("edit-photo-input")?.click()}
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Drag & drop photos here, or click to browse</p>
              <p className="text-xs text-gray-400">Accepts image files only</p>
              <input
                id="edit-photo-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-edit-photos"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-md px-2 py-1 text-xs text-gray-700">
                    <FileImage className="w-3 h-3 text-gray-400" />
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      data-testid={`button-remove-file-${i}`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-900 block mb-1.5" htmlFor="edit-instructions">
                What would you like done to these photos?
              </label>
              <Textarea
                id="edit-instructions"
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                placeholder="E.g. Remove background, brighten exposure, color correction, crop for LinkedIn headshot, retouch skin..."
                className="min-h-[80px] text-sm resize-none"
                data-testid="textarea-edit-instructions"
              />
              <p className="text-xs text-gray-400 mt-1">Be specific about what edits you'd like.</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium text-gray-900" data-testid="text-token-cost">
                  This will use {tokenCost} retouching session(s)
                </p>
                {hasEnoughTokens ? (
                  <p className="text-gray-500" data-testid="text-token-breakdown">
                    {annualUsed} from included sessions, {purchasedUsed} from purchased sessions
                  </p>
                ) : (
                  <div className="flex items-start gap-2 text-amber-600" data-testid="text-insufficient-tokens">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>You don't have enough retouching sessions. Please purchase additional sessions to continue.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!hasEnoughTokens || fileCount === 0}
              data-testid="button-submit-edit-request"
              className="w-full bg-[#1a1a1a] text-white"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Submit for Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {justSubmittedId && editRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
          data-testid="banner-submission-success"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Edit request submitted successfully!</p>
              <p className="text-sm text-green-700 mt-0.5">Your photos have been sent. You can chat with your photographer below to discuss the edits.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJustSubmittedId(null)}
                className="mt-2 text-green-700 hover:text-green-900 hover:bg-green-100 h-7 px-2 text-xs"
                data-testid="button-dismiss-success"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {!requestsLoading && editRequests.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2" data-testid="text-past-requests-heading">
            <ImagePlus className="w-4 h-4 text-gray-500" />
            Your Edit Requests
          </h3>
          {editRequests.map((req) => (
            <EditRequestCard
              key={req.id}
              request={req}
              getStatusBadge={getEditRequestStatusBadge}
              defaultOpen={req.id === justSubmittedId}
            />
          ))}
        </div>
      ) : !requestsLoading && editRequests.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="card-edits-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <ImagePlus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-serif text-lg text-gray-900 mb-1.5">No retouching requests yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-5">
              Submit your first photos for professional retouching, we'll handle the rest so your images look their absolute best.
            </p>
            <Button
              onClick={() => setShowSubmitDialog(true)}
              data-testid="button-submit-photos-empty"
              className="bg-[#1a1a1a] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Photos for Retouching
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-confirm-edit">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Edit Request</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  You are about to submit {fileCount} photo(s) for editing. This will use{" "}
                  <span className="font-semibold">{tokenCost} retouching session(s)</span>:
                  <br />
                  {annualUsed} from included sessions and {purchasedUsed} from purchased sessions.
                </p>
                {editInstructions.trim() && (
                  <div className="bg-gray-50 rounded-md p-3 mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Your Instructions</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{editInstructions.trim()}</p>
                  </div>
                )}
                {!editInstructions.trim() && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No instructions provided, you can add them after by chatting with your photographer.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} data-testid="button-cancel-edit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitPhotos}
              disabled={isSubmitting}
              data-testid="button-confirm-edit"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent data-testid="dialog-buy-tokens">
          <DialogHeader>
            <DialogTitle>Get More Retouching Sessions</DialogTitle>
            <DialogDescription>Each session covers one photo edit. Here's what's included:</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">Touch ups</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">Color corrections</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">People / item removals</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">Custom requests, describe what you need in the editing instructions</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm text-gray-700">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                  disabled={buyQuantity <= 1}
                  data-testid="button-decrease-quantity"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center"
                  data-testid="input-token-quantity"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBuyQuantity(Math.min(10, buyQuantity + 1))}
                  disabled={buyQuantity >= 10}
                  data-testid="button-increase-quantity"
                >
                  +
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-gray-500">Price per session</span>
                <span className="text-gray-900" data-testid="text-price-per-token">${tokenConfig?.pricePerToken ?? 5}</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 mt-1 pt-1 border-t border-gray-200">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-semibold text-gray-900" data-testid="text-total-price">
                  ${(tokenConfig?.pricePerToken ?? 5) * buyQuantity}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleBuyTokens}
              disabled={isBuying}
              data-testid="button-purchase-tokens"
              className="bg-[#1a1a1a] text-white"
            >
              {isBuying ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-1.5" />}
              {isBuying ? "Processing..." : "Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShootGallery({ shoot, onBack }: { shoot: Shoot; onBack: () => void }) {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [visitedFolders, setVisitedFolders] = useState<Set<string | null>>(new Set([null]));
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: reviewData, refetch: refetchReview } = useQuery<{ review: any; canReview: boolean }>({
    queryKey: ["/api/shoots", shoot.id, "review"],
    queryFn: async () => {
      const res = await fetch(`/api/shoots/${shoot.id}/review`, { credentials: "include" });
      if (!res.ok) return { review: null, canReview: false };
      return res.json();
    },
    enabled: shoot.status === "completed",
  });

  const handleSubmitReview = async () => {
    if (!reviewRating || submittingReview) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/shoots/${shoot.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: reviewRating, title: reviewTitle.trim() || undefined, comment: reviewComment.trim() || undefined }),
      });
      if (res.ok) {
        refetchReview();
        setReviewRating(0);
        setReviewTitle("");
        setReviewComment("");
      }
    } catch { /* ignore */ }
    setSubmittingReview(false);
  };

  const loadShootMessages = useCallback(async () => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/shoots/${shoot.id}/messages`, { credentials: "include" });
      if (res.ok) setChatMessages(await res.json());
    } catch { /* ignore */ }
    setLoadingChat(false);
  }, [shoot.id]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/shoots/${shoot.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: chatInput.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages((prev) => [...prev, msg]);
        setChatInput("");
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch { /* ignore */ }
    setSendingChat(false);
  };

  useEffect(() => {
    if (showChat) loadShootMessages();
  }, [showChat, loadShootMessages]);

  const { data: images = [], isLoading: imagesLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/shoots", shoot.id, "gallery"],
    queryFn: async () => {
      const res = await fetch(`/api/shoots/${shoot.id}/gallery`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch gallery");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery<GalleryFolder[]>({
    queryKey: ["/api/shoots", shoot.id, "folders"],
    queryFn: async () => {
      const res = await fetch(`/api/shoots/${shoot.id}/folders`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: favoriteIds = [], isLoading: favoritesLoading } = useQuery<string[]>({
    queryKey: ["/api/shoots", shoot.id, "favorites"],
    queryFn: async () => {
      const res = await fetch(`/api/shoots/${shoot.id}/favorites`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json();
    },
    staleTime: 0,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`/api/shoots/${shoot.id}/gallery/${imageId}/favorite`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: (_data, imageId) => {
      trackEvent("gallery_favorite", { imageId, shootId: shoot.id });
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", shoot.id, "favorites"] });
    },
  });

  const isLoading = imagesLoading || favoritesLoading || foldersLoading;

  const hasFolders = folders.length > 0;
  const unsortedCount = images.filter((img) => !img.folderId).length;
  const showUnsorted = unsortedCount > 0 || !hasFolders;

  const effectiveFolder = selectedFolder === null && unsortedCount === 0 && hasFolders
    ? folders[0].id
    : selectedFolder;

  useEffect(() => {
    if (effectiveFolder !== undefined) {
      setVisitedFolders((prev) => {
        if (prev.has(effectiveFolder)) return prev;
        const next = new Set(prev);
        next.add(effectiveFolder);
        return next;
      });
    }
  }, [effectiveFolder]);

  const folderFilteredImages = showFavoritesOnly
    ? images.filter((img) => favoriteIds.includes(img.id))
    : effectiveFolder
      ? images.filter((img) => img.folderId === effectiveFolder)
      : hasFolders
        ? images.filter((img) => !img.folderId)
        : images;

  const displayedImages = [...folderFilteredImages].sort((a, b) =>
    (a.originalFilename || "").localeCompare(b.originalFilename || "")
  );

  const favoritesCount = favoriteIds.length;

  const handleDownloadSingle = (imageId: string, filename: string) => {
    trackEvent("gallery_download", { shootId: shoot.id });
    const link = document.createElement("a");
    link.href = `/api/shoots/${shoot.id}/gallery/${imageId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    trackEvent("gallery_download", { shootId: shoot.id });
    setDownloadingAll(true);
    try {
      const res = await fetch(`/api/shoots/${shoot.id}/download-all`, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${shoot.title.replace(/[^a-zA-Z0-9]/g, "_")}_photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download photos. Please try again.");
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              data-testid="button-back-to-shoots"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <p className="font-serif text-lg text-gray-900" data-testid="text-shoot-gallery-title">{shoot.title}</p>
              <p className="text-xs text-gray-500">{images.length} photos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowChat(!showChat)}
              className={showChat ? "border-[#c4956a] text-[#c4956a]" : ""}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Messages
            </Button>
            {images.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                data-testid="button-download-all"
                className="bg-[#1a1a1a] text-white"
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                {downloadingAll ? "Preparing..." : "Download All"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* In-progress banner */}
      {shoot.status === "in-progress" && (
        <div className="bg-amber-50 border-b border-amber-200/60">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-sm text-amber-700">
              Your photos are being edited. This gallery may update as new edits are completed.
            </p>
          </div>
        </div>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Messages with Align Team</span>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
                {loadingChat ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No messages yet</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderRole === "client" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.senderRole === "client"
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderRole === "client" ? "text-gray-400" : "text-gray-400"}`}>
                          {msg.senderName} · {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-4 py-3 border-t border-gray-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c4956a]/30 focus:border-[#c4956a]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={sendingChat || !chatInput.trim()}
                  className="bg-[#1a1a1a] text-white rounded-lg px-3 py-2 disabled:opacity-40"
                >
                  {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : images.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              {getShootProgressStage(shoot) >= 0 && shoot.status !== "completed" ? (
                <>
                  <div className="w-full max-w-md mb-6">
                    <ShootProgressBar shoot={shoot} />
                  </div>
                  <p className="text-gray-400 text-xs">Photos will appear here as they're uploaded.</p>
                </>
              ) : (
                <>
                  <Image className="w-10 h-10 text-gray-300 mb-3" />
                  <h3 className="font-serif text-lg text-gray-900 mb-1">No photos yet</h3>
                  <p className="text-gray-500 text-sm">Photos will appear here once they've been uploaded.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {showUnsorted && (
                <button
                  onClick={() => { setShowFavoritesOnly(false); setSelectedFolder(null); }}
                  data-testid="button-filter-all"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    !showFavoritesOnly && effectiveFolder === null
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Images className="w-3.5 h-3.5" />
                  {hasFolders ? `Unsorted (${unsortedCount})` : `All (${images.length})`}
                </button>
              )}
              <button
                onClick={() => { setShowFavoritesOnly(true); setSelectedFolder(null); }}
                data-testid="button-filter-favorites"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  showFavoritesOnly
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                Favorites ({favoritesCount})
              </button>
            </div>

            {hasFolders && !showFavoritesOnly && (
              <div className="flex flex-wrap gap-2 mb-6">
                {folders.map((folder) => {
                  const count = images.filter((img) => img.folderId === folder.id).length;
                  const isSelected = effectiveFolder === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setSelectedFolder(folder.id);
                        setShowFavoritesOnly(false);
                        setVisitedFolders((prev) => { if (prev.has(folder.id)) return prev; const next = new Set(prev); next.add(folder.id); return next; });
                      }}
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
                  );
                })}
              </div>
            )}

            {displayedImages.length === 0 && showFavoritesOnly ? (
              <Card className="border-dashed border-2 border-gray-200 bg-white/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Heart className="w-10 h-10 text-gray-300 mb-3" />
                  <h3 className="font-serif text-lg text-gray-900 mb-1">No favorites yet</h3>
                  <p className="text-gray-500 text-sm">Tap the heart icon on any photo to add it to your favorites.</p>
                </CardContent>
              </Card>
            ) : displayedImages.length === 0 && selectedFolder ? (
              <Card className="border-dashed border-2 border-gray-200 bg-white/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Folder className="w-10 h-10 text-gray-300 mb-3" />
                  <h3 className="font-serif text-lg text-gray-900 mb-1">No photos in this folder</h3>
                  <p className="text-gray-500 text-sm">Photos will appear here once they've been added.</p>
                </CardContent>
              </Card>
            ) : showFavoritesOnly ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {displayedImages.map((image, index) => (
                    <GalleryImageCard
                      key={image.id}
                      image={image}
                      index={index}
                      isFav={favoriteIds.includes(image.id)}
                      isVisible={true}
                      onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                      onOpenLightbox={setLightboxIndex}
                      onDownload={handleDownloadSingle}
                      shootId={shoot.id}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {lightboxIndex !== null && (
                    <Lightbox
                      images={displayedImages}
                      initialIndex={lightboxIndex}
                      onClose={() => setLightboxIndex(null)}
                    />
                  )}
                </AnimatePresence>
              </>
            ) : (
              <>
                {(() => {
                  const folderGroups: { folderId: string | null; imgs: typeof images }[] = [];
                  if (hasFolders) {
                    for (const folder of folders) {
                      const folderImgs = images.filter((img) => img.folderId === folder.id);
                      folderGroups.push({ folderId: folder.id, imgs: folderImgs });
                    }
                    const unsorted = images.filter((img) => !img.folderId);
                    if (unsorted.length > 0) {
                      folderGroups.push({ folderId: null, imgs: unsorted });
                    }
                  } else {
                    folderGroups.push({ folderId: null, imgs: images });
                  }
                  const activeFolderId = effectiveFolder;
                  const activeGroup = folderGroups.find((g) => g.folderId === activeFolderId);
                  return (
                    <>
                      {folderGroups
                        .filter((group) => visitedFolders.has(group.folderId))
                        .map((group) => {
                        const isActive = group.folderId === activeFolderId;
                        return (
                          <div
                            key={group.folderId ?? "unsorted"}
                            className={isActive ? "" : "hidden"}
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {group.imgs.map((image, index) => (
                                <GalleryImageCard
                                  key={image.id}
                                  image={image}
                                  index={index}
                                  isFav={favoriteIds.includes(image.id)}
                                  isVisible={isActive}
                                  onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                                  onOpenLightbox={setLightboxIndex}
                                  onDownload={handleDownloadSingle}
                                  shootId={shoot.id}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <AnimatePresence>
                        {lightboxIndex !== null && activeGroup && (
                          <Lightbox
                            images={activeGroup.imgs}
                            initialIndex={lightboxIndex}
                            onClose={() => setLightboxIndex(null)}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}
      </main>

      {/* Review section for completed shoots */}
      {shoot.status === "completed" && (
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {reviewData?.review ? (
              <div className="max-w-xl">
                <h3 className="font-serif text-lg text-gray-900 mb-4">Your Review</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= reviewData.review.rating ? "fill-[#c4956a] text-[#c4956a]" : "text-gray-300"}`} />
                    ))}
                  </div>
                  {reviewData.review.title && <p className="text-sm font-medium text-gray-900 mb-1">{reviewData.review.title}</p>}
                  {reviewData.review.comment && <p className="text-sm text-gray-600">{reviewData.review.comment}</p>}
                  {reviewData.review.adminResponse && (
                    <div className="mt-3 pl-3 border-l-2 border-[#c4956a]/30">
                      <p className="text-xs font-medium text-gray-700">Align Team</p>
                      <p className="text-sm text-gray-500">{reviewData.review.adminResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : reviewData?.canReview ? (
              <div className="max-w-xl">
                <h3 className="font-serif text-lg text-gray-900 mb-1">Share Your Experience</h3>
                <p className="text-sm text-gray-500 mb-4">We'd love to hear how your session went.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoveredStar(s)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setReviewRating(s)}
                        className="p-0.5"
                      >
                        <Star className={`w-6 h-6 transition-colors ${s <= (hoveredStar || reviewRating) ? "fill-[#c4956a] text-[#c4956a]" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Review title (optional)"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c4956a]/30 focus:border-[#c4956a]"
                  />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c4956a]/30 focus:border-[#c4956a] resize-none"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={!reviewRating || submittingReview}
                    className="bg-[#1a1a1a] text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function PortalContent() {
  const { user, logout, isLoggingOut } = useAuth();
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);
  const [expandedOverviewBookingId, setExpandedOverviewBookingId] = useState<string | null>(null);
  const [spacesSubTab, setSpacesSubTab] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTabState] = useState<"overview" | "shoots" | "edits" | "messages" | "spaces" | "settings">(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "overview" || tab === "messages" || tab === "edits" || tab === "spaces" || tab === "settings" || tab === "shoots") return tab;
    return "overview";
  });
  const setActiveTab = useCallback((tab: "overview" | "shoots" | "edits" | "messages" | "spaces" | "settings") => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, []);
  const [tabResolved, setTabResolved] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get("tab");
  });

  // SaaS signup success toast + auto-navigate to Spaces tab
  const { toast: _saasToast } = useToast();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("saas_signup") === "success") {
      _saasToast({
        title: "Welcome to Align for Studios",
        description: "Your 14-day free trial has started. Mark a workspace as private to begin.",
      });
      setActiveTabState("spaces");
      // Clean the URL so refresh doesn't re-trigger
      const url = new URL(window.location.href);
      url.searchParams.delete("saas_signup");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, [_saasToast]);

  const unreadCount = useUnreadCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const portalTabsDrag = useDragScroll();

  const { data: shoots = [], isLoading } = useQuery<(Shoot & { galleryCount?: number; coverImageUrl?: string | null })[]>({
    queryKey: ["/api/shoots"],
    staleTime: 0,
  });

  const { data: editRequests = [] } = useQuery<EditRequest[]>({
    queryKey: ["/api/edit-requests"],
    queryFn: async () => {
      const res = await fetch("/api/edit-requests", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch edit requests");
      return res.json();
    },
  });

  const { data: spaceBookings } = useQuery<{ guestBookings: any[]; hostBookings: any[] }>({
    queryKey: ["/api/space-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/space-bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: mySpaces = [] } = useQuery<any[]>({
    queryKey: ["/api/my-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/my-spaces", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Role detection
  const isPhotoClient = (shoots?.length > 0) || false;
  const isSpaceHost = mySpaces.length > 0;
  const isNewUser = !isPhotoClient && !isSpaceHost;

  // Apply user's saved default tab preference (falls back to overview)
  useEffect(() => {
    if (tabResolved) return;
    if (isLoading) return;

    if (user?.defaultPortalTab) {
      const saved = user.defaultPortalTab;
      if (saved === "my-spaces") {
        setActiveTab("spaces");
        setSpacesSubTab("my-spaces");
      } else if (saved === "past-spaces") {
        setActiveTab("spaces");
        setSpacesSubTab("my-bookings");
      } else if (["overview", "shoots", "edits", "messages", "spaces"].includes(saved)) {
        setActiveTab(saved as typeof activeTab);
      }
    }
    setTabResolved(true);
  }, [isLoading, user, tabResolved]);

  if (selectedShoot) {
    return (
      <>
        <ShootGallery
          shoot={selectedShoot}
          onBack={() => setSelectedShoot(null)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="bg-background/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-[100]">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between relative">
          <a
            href="/"
            data-testid="button-back-home"
            className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors z-10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </a>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold pointer-events-none">
            <span className="hidden sm:inline">Client Portal</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="relative z-[10000]">
              <button
                onClick={() => { setAccountMenuOpen(!accountMenuOpen); setMenuOpen(false); }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                data-testid="button-account-menu"
              >
                <Avatar className="w-7 h-7" data-testid="img-user-avatar">
                  {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user?.firstName || "User"} />}
                  <AvatarFallback className="bg-gray-100 text-gray-500">
                    <User className="w-3.5 h-3.5" />
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={`w-3 h-3 text-foreground/40 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setAccountMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg py-1 min-w-[180px] z-[9999]"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-700">
                        <p className="text-xs font-medium text-stone-700 dark:text-stone-200 truncate">{user?.firstName} {user?.lastName || ""}</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{user?.email || ""}</p>
                      </div>
                      <button
                        onClick={async () => { setAccountMenuOpen(false); await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/portal"; }}
                        data-testid="button-switch-account"
                        className="w-full text-left px-3 py-2 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5" />
                        Switch Account
                      </button>
                      <button
                        onClick={() => { setAccountMenuOpen(false); logout(); }}
                        disabled={isLoggingOut}
                        data-testid="button-logout"
                        className="w-full text-left px-3 py-2 text-xs text-red-500/70 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="relative z-[10000]">
              <button
                onClick={() => { setMenuOpen(!menuOpen); setAccountMenuOpen(false); }}
                data-testid="button-portal-menu"
                className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-foreground transition-colors"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="hidden sm:inline">Menu</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg py-2 min-w-[200px] z-[9999]"
                  >
                    {/* Services */}
                    <Link href="/workspaces">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-spaces-portal">
                        <MapPin className="w-4 h-4" />
                        Align Workspaces
                      </button>
                    </Link>
                    {/* Photography */}
                    <div className="border-t border-stone-100 dark:border-stone-700 my-1" />
                    <Link href="/portraits">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-portraits-portal">
                        <Camera className="w-4 h-4" />
                        Portraits
                      </button>
                    </Link>
                    <Link href="/portfolio">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-portfolio-portal">
                        <Images className="w-4 h-4" />
                        Portfolio
                      </button>
                    </Link>
                    {/* Community */}
                    <div className="border-t border-stone-100 dark:border-stone-700 my-1" />
                    <Link href="/#events" className="w-full text-left px-4 py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-stone-50 transition-colors flex items-center gap-3">
                      <CalendarDays className="w-4 h-4" />
                      Community Events
                    </Link>
                    <Link href="/featured">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-featured-portal">
                        <Star className="w-4 h-4" />
                        Featured Pros
                      </button>
                    </Link>
                    {/* About & Account */}
                    <div className="border-t border-stone-100 dark:border-stone-700 my-1" />
                    <Link href="/our-vision">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-about-portal">
                        <Compass className="w-4 h-4" />
                        Our Vision
                      </button>
                    </Link>
                    <Link href="/support">
                      <button onClick={() => setMenuOpen(false)} className="w-full text-left px-4 py-3 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-3" data-testid="link-support-portal">
                        <HelpCircle className="w-4 h-4" />
                        Support
                      </button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-gray-900 mb-1" data-testid="text-welcome">
                Welcome{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-gray-500 text-sm">
                {isPhotoClient && isSpaceHost
                  ? "Manage your sessions and spaces"
                  : isSpaceHost
                  ? "Manage your spaces and earnings"
                  : isPhotoClient
                  ? "Manage your photoshoots and photo edits"
                  : "Your portal for sessions, spaces, and more"}
              </p>
            </div>
            {isSpaceHost && !isPhotoClient && (
              <Link href="/workspaces">
                <Button
                  data-testid="button-browse-spaces"
                  className="bg-[#1a1a1a] text-white hover:bg-black"
                >
                  Browse Workspaces
                </Button>
              </Link>
            )}
          </div>

          <div className="relative mb-8 -mx-4 sm:mx-0" data-testid="portal-tabs-wrapper">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 sm:hidden" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />
            <div
              ref={portalTabsDrag.ref}
              onMouseDown={portalTabsDrag.onMouseDown}
              onMouseMove={portalTabsDrag.onMouseMove}
              onMouseUp={portalTabsDrag.onMouseUp}
              onMouseLeave={portalTabsDrag.onMouseLeave}
              onDragStart={portalTabsDrag.onDragStart}
              className="flex gap-1 border-b border-gray-200 overflow-x-auto px-4 sm:px-0 sm:justify-center scrollbar-hide cursor-grab select-none"
              style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } as any}
              data-testid="portal-tabs"
            >
              <button
                onClick={() => setActiveTab("overview")}
                data-testid="tab-overview"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                  activeTab === "overview"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Overview
                {activeTab === "overview" && (
                  <motion.div
                    layoutId="portal-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("spaces")}
                data-testid="tab-my-spaces"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                  activeTab === "spaces"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Workspaces
                {activeTab === "spaces" && (
                  <motion.div
                    layoutId="portal-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                  />
                )}
              </button>
              {(isPhotoClient || isNewUser) && (
                <button
                  onClick={() => setActiveTab("shoots")}
                  data-testid="tab-my-shoots"
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                    activeTab === "shoots"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Shoots
                  {activeTab === "shoots" && (
                    <motion.div
                      layoutId="portal-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                    />
                  )}
                </button>
              )}
              {/* Edits tab hidden — accessible via Quick Actions */}
              <button
                onClick={() => setActiveTab("settings")}
                data-testid="tab-settings"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                  activeTab === "settings"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
                {activeTab === "settings" && (
                  <motion.div
                    layoutId="portal-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                  />
                )}
              </button>
            </div>
          </div>

          {isNewUser && !spaceBookings?.guestBookings?.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-white rounded-xl border border-stone-200/60 p-5 sm:p-6"
            >
              <h3 className="font-serif text-lg text-stone-900 mb-1">Welcome to Align</h3>
              <p className="text-sm text-stone-400 mb-4">Here's what you can do from your portal.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setActiveTab("spaces")} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-stone-200/60 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Browse Workspaces</p>
                    <p className="text-[11px] text-stone-400">Find your next session space</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab("messages")} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-stone-200/60 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Messages</p>
                    <p className="text-[11px] text-stone-400">Chat with hosts directly</p>
                  </div>
                </button>
                <button onClick={() => { setActiveTab("spaces"); }} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-stone-200/60 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Save Favorites</p>
                    <p className="text-[11px] text-stone-400">Bookmark spaces you love</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "overview" ? (
            <div className="space-y-6">
              <LoyaltyBadge />
              {/* Week calendar */}
              {(() => {
                const allCal = [
                  ...(spaceBookings?.guestBookings || []).map((b: any) => ({ ...b, _role: "guest" })),
                  ...(spaceBookings?.hostBookings || []).map((b: any) => ({ ...b, _role: "host" })),
                ];
                const calBookings = allCal.map((b: any) => ({
                  id: b.id,
                  bookingDate: b.bookingDate,
                  bookingStartTime: b.bookingStartTime,
                  bookingHours: b.bookingHours,
                  spaceName: b.spaceName || "Space",
                  spaceImageUrl: b.spaceImageUrl || null,
                  status: b.status,
                  paymentStatus: b.paymentStatus,
                  role: b._role || "guest",
                  recurringBookingId: b.recurringBookingId || null,
                }));
                return calBookings.length > 0 ? <BookingCalendar bookings={calBookings} recurringBookings={[]} /> : null;
              })()}

              {/* Upcoming workspace bookings (guest + host) */}
              {(() => {
                const allBookings = [
                  ...(spaceBookings?.guestBookings || []).map((b: any) => ({ ...b, _role: "guest" })),
                  ...(spaceBookings?.hostBookings || []).map((b: any) => ({ ...b, _role: "host" })),
                ].filter((b: any) => b.bookingDate && new Date(b.bookingDate) >= new Date() && b.status !== "cancelled" && b.status !== "rejected")
                  .sort((a: any, b: any) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
                return allBookings.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#c4956a]" /> Upcoming Workspace Bookings</h3>
                    <div className="space-y-2">
                      {allBookings.slice(0, 5).map((b: any) => {
                        const isExpanded = expandedOverviewBookingId === b.id;
                        return (
                          <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <button
                              onClick={() => setExpandedOverviewBookingId(isExpanded ? null : b.id)}
                              className="w-full flex items-center gap-4 p-4 text-left hover:bg-stone-50/50 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-lg bg-[#faf8f5] border border-[#e0d5c7] flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5 text-[#c4956a]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-gray-900 truncate">{b.spaceName || "Workspace"}</p>
                                  <span className={`text-[9px] font-semibold px-1.5 rounded-full border ${b._role === "host" ? "bg-violet-50 text-violet-600 border-violet-200" : "bg-sky-50 text-sky-600 border-sky-200"}`}>
                                    {b._role === "host" ? "Hosting" : "Renting"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{new Date(b.bookingDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{b.bookingStartTime ? ` at ${b.bookingStartTime}` : ""}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.status === "confirmed" || b.status === "approved" ? "bg-green-100 text-green-700" : b.status === "checked_in" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{b.status || "pending"}</span>
                              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-50">
                                <ArrivalGuideInline bookingId={b.id} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Upcoming shoots */}
              {(() => {
                const upcoming = shoots.filter(s => s.shootDate && new Date(s.shootDate) >= new Date()).sort((a, b) => new Date(a.shootDate!).getTime() - new Date(b.shootDate!).getTime());
                return upcoming.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#c4956a]" /> Upcoming Sessions</h3>
                    <div className="space-y-2">
                      {upcoming.slice(0, 3).map(s => (
                        <button key={s.id} onClick={() => setSelectedShoot(s)} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors text-left">
                          <div className="w-10 h-10 rounded-lg bg-[#faf8f5] border border-[#e0d5c7] flex items-center justify-center shrink-0">
                            <Camera className="w-5 h-5 text-[#c4956a]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                            <p className="text-xs text-gray-500">{new Date(s.shootDate!).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{s.shootTime ? ` at ${s.shootTime}` : ""}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Unread messages */}
              {unreadCount > 0 && (
                <button onClick={() => setActiveTab("messages")} className="w-full flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">You have {unreadCount} unread message{unreadCount > 1 ? "s" : ""}</p>
                    <p className="text-xs text-gray-500">Tap to view your conversations</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
                </button>
              )}

              {/* Quick actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/workspaces?from=portal">
                    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                      <Building2 className="w-5 h-5 text-[#c4956a]" />
                      <span className="text-xs font-medium text-gray-700">Browse Workspaces</span>
                    </div>
                  </Link>
                  <button onClick={() => setActiveTab("messages")} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <MessageCircle className="w-5 h-5 text-[#c4956a]" />
                    <span className="text-xs font-medium text-gray-700">Messages</span>
                  </button>
                  <Link href="/portrait-builder?from=portal">
                    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                      <Camera className="w-5 h-5 text-[#c4956a]" />
                      <span className="text-xs font-medium text-gray-700">Book a Shoot</span>
                    </div>
                  </Link>
                  <button onClick={() => setActiveTab("edits")} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <ImagePlus className="w-5 h-5 text-[#c4956a]" />
                    <span className="text-xs font-medium text-gray-700">Request a Photo Edit</span>
                  </button>
                </div>
              </div>

              {/* Empty state for brand new users */}
              {shoots.length === 0 && !spaceBookings?.guestBookings?.length && unreadCount === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">Welcome to Align! Here's what you can do:</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/portraits">
                      <Button className="bg-[#1a1a1a] text-white hover:bg-black"><Camera className="w-4 h-4 mr-2" /> Design Your Portrait</Button>
                    </Link>
                    <Link href="/workspaces">
                      <Button variant="outline"><Building2 className="w-4 h-4 mr-2" /> Explore Workspaces</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "settings" ? (
            <PortalSettings />
          ) : activeTab === "messages" ? (
            <div>
              <button onClick={() => setActiveTab("overview")} className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg px-3 py-2 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Overview
              </button>
              <PortalMessagesSection userId={user?.id || ""} />
            </div>
          ) : activeTab === "spaces" ? (
            <PortalSpacesSection userId={user?.id || ""} initialTab={spacesSubTab} />
          ) : activeTab === "edits" ? (
            <div>
              <button onClick={() => setActiveTab("overview")} className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg px-3 py-2 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Overview
              </button>
              <EditTokenSection />
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : shoots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-dashed border-2 border-[#d4c5b0] bg-[#faf8f5]/60" data-testid="card-empty-state">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 mb-5 text-[#B8860B]/70">
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <ellipse cx="32" cy="56" rx="18" ry="2" fill="currentColor" opacity="0.12" />
                      <rect x="12" y="18" width="40" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="32" cy="33" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="32" cy="33" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
                      <rect x="18" y="22" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
                      <path d="M22 18 L26 10 L38 10 L42 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl text-[#2c2420] mb-2">Your story starts here</h3>
                  <p className="text-[#8a7e72] text-sm max-w-sm mb-6">
                    Get your portrait session in three simple steps.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 text-left max-w-md w-full">
                    <div className="flex-1 bg-[#faf8f5] border border-[#e0d5c7] rounded-lg p-4">
                      <div className="w-7 h-7 rounded-full border-[1.5px] border-[#B8860B] text-[#B8860B] text-xs font-semibold flex items-center justify-center mb-2">1</div>
                      <p className="text-sm font-medium text-[#2c2420]">Design</p>
                      <p className="text-xs text-[#8a7e72] mt-0.5">Choose your environment, mood, and style</p>
                    </div>
                    <div className="flex-1 bg-[#faf8f5] border border-[#e0d5c7] rounded-lg p-4">
                      <div className="w-7 h-7 rounded-full border-[1.5px] border-[#B8860B] text-[#B8860B] text-xs font-semibold flex items-center justify-center mb-2">2</div>
                      <p className="text-sm font-medium text-[#2c2420]">Shoot</p>
                      <p className="text-xs text-[#8a7e72] mt-0.5">We'll schedule and photograph your session</p>
                    </div>
                    <div className="flex-1 bg-[#faf8f5] border border-[#e0d5c7] rounded-lg p-4">
                      <div className="w-7 h-7 rounded-full border-[1.5px] border-[#B8860B] text-[#B8860B] text-xs font-semibold flex items-center justify-center mb-2">3</div>
                      <p className="text-sm font-medium text-[#2c2420]">Gallery</p>
                      <p className="text-xs text-[#8a7e72] mt-0.5">View, favorite, and download your photos</p>
                    </div>
                  </div>
                  <Link href="/portraits">
                    <Button
                      size="lg"
                      data-testid="button-design-shoot-empty"
                      className="text-base px-8 bg-[#1a1a1a] text-white hover:bg-black"
                    >
                      Start Designing Your Shoot
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-md sm:max-w-none mx-auto sm:mx-0">
              <AnimatePresence>
                {shoots.map((shoot, index) => (
                  <motion.div
                    key={shoot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card
                      className="bg-white hover:shadow-md transition-shadow cursor-pointer group h-full overflow-hidden"
                      data-testid={`card-shoot-${shoot.id}`}
                      onClick={() => setSelectedShoot(shoot)}
                    >
                      {(() => {
                        const envImage = shoot.coverImageUrl || getEnvironmentCoverImage(shoot.environment, shoot.emotionalImpact);
                        if (envImage) return (
                          <div className="aspect-[16/9] overflow-hidden">
                            <img src={envImage} alt={shoot.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        );
                        // "Other" or no environment — show a collage of environments
                        return (
                          <div className="aspect-[16/9] overflow-hidden grid grid-cols-3 grid-rows-2">
                            <img src="/images/env-office.webp" alt="" className="w-full h-full object-cover" />
                            <img src="/images/env-nature.webp" alt="" className="w-full h-full object-cover" />
                            <img src="/images/env-urban.webp" alt="" className="w-full h-full object-cover row-span-2" />
                            <img src="/images/env-restaurant.webp" alt="" className="w-full h-full object-cover" />
                            <img src="/images/env-kitchen.webp" alt="" className="w-full h-full object-cover" />
                          </div>
                        );
                      })()}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="font-serif text-lg text-gray-900 group-hover:text-black transition-colors">
                            {shoot.title}
                          </CardTitle>
                          {getShootProgressStage(shoot) < 0 && (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(shoot.status)}`}
                              data-testid={`badge-status-${shoot.id}`}
                            >
                              {getStatusIcon(shoot.status)}
                              {getStatusLabel(shoot.status)}
                            </span>
                          )}
                        </div>
                        {getShootProgressStage(shoot) >= 0 && (
                          <ShootProgressBar shoot={shoot} />
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col">
                        {/* Only show details when progress bar is NOT showing (draft status) */}
                        {getShootProgressStage(shoot) < 0 && (
                          <div className="space-y-2 text-sm text-gray-500">
                            {shoot.environment && (
                              <div className="flex items-center gap-2">
                                <Camera className="w-3.5 h-3.5" />
                                <span className="capitalize">{shoot.environment}</span>
                              </div>
                            )}
                            {shoot.shootDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {formatDate(shoot.shootDate)}
                                  {shoot.shootTime && ` at ${new Date("2000-01-01T" + shoot.shootTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                                </span>
                              </div>
                            )}
                            {shoot.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shoot.location)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`link-location-${shoot.id}`}
                                  className="text-blue-600 hover:underline truncate flex items-center gap-1"
                                >
                                  {shoot.location}
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            )}
                            {shoot.emotionalImpact && (
                              <div className="flex items-center gap-2">
                                <Image className="w-3.5 h-3.5" />
                                <span className="capitalize">{shoot.emotionalImpact} mood</span>
                              </div>
                            )}
                          </div>
                        )}
                        {shoot.shootDate && new Date(shoot.shootDate + "T23:59:59") >= new Date() && (
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={buildGoogleCalendarUrl(shoot)}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`button-calendar-sync-${shoot.id}`}
                              className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#333] transition-colors"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              Google Calendar
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 text-center mt-auto pt-3 pb-1">
                          {shoot.status === "completed" && (shoot.galleryCount ?? 0) > 0
                            ? `View ${shoot.galleryCount} photos`
                            : shoot.status === "in-progress" && (shoot.galleryCount ?? 0) > 0
                            ? `Preview ${shoot.galleryCount} photos`
                            : shoot.status === "in-progress"
                            ? "Photos are being edited"
                            : shoot.status === "scheduled"
                            ? "Session coming up"
                            : (shoot.galleryCount ?? 0) > 0
                            ? `View ${shoot.galleryCount} photos`
                            : null}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Design shoot CTA at bottom of shoots tab */}
          {activeTab === "shoots" && shoots.length > 0 && (
            <div className="mt-6 text-center">
              <Link href="/portraits">
                <Button
                  data-testid="button-design-shoot"
                  className="bg-[#1a1a1a] text-white hover:bg-black"
                >
                  Start Designing Your Shoot
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function PortalLogin() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [step, setStep] = useState<"email" | "name" | "sent">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsShake, setTermsShake] = useState(false);

  const sendMagicLink = async (e?: string, fName?: string, lName?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e || email, firstName: fName, lastName: lName, returnTo: "/portal" }),
      });
      const data = await res.json();
      if (data.needsName) {
        setStep("name");
      } else if (data.sent) {
        setStep("sent");
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch {
      setError("Failed to send sign-in link. Please try again.");
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
        className="text-center px-6 max-w-md w-full"
      >
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <Camera className="w-8 h-8 text-white/80" />
        </div>
        <h1 className="font-serif text-3xl text-white mb-3">Client Portal</h1>
        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          Enter your email to sign in below. If you do not have an account, enter the email you wish to sign up with.
        </p>

        {step === "email" && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!agreedToTerms) {
              setTermsShake(true);
              setTimeout(() => setTermsShake(false), 600);
              return;
            }
            if (email.trim()) sendMagicLink(email.trim());
          }} className="space-y-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:border-white/50 focus:ring-1 focus:ring-white/30 outline-none"
              autoFocus
              required
            />
            <label
              className={`flex items-center justify-center gap-3 cursor-pointer select-none rounded-xl px-4 py-3 transition-all border ${
                termsShake ? "animate-[shake_0.5s_ease-in-out] bg-red-500/10 border-red-400/40" :
                agreedToTerms ? "bg-white/5 border-white/20" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                agreedToTerms ? "bg-white border-white" : termsShake ? "border-red-400" : "border-white/30"
              }`}>
                {agreedToTerms && (
                  <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="sr-only"
              />
              <span className={`text-[11px] leading-relaxed ${termsShake ? "text-red-300" : "text-white/50"}`}>
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-white/70 hover:text-white underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" target="_blank" className="text-white/70 hover:text-white underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
              </span>
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" disabled={loading || !email.trim()} size="lg" className="w-full bg-white text-black hover:bg-white/90 text-base">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : <><Mail className="w-4 h-4 mr-2" /> Send Sign-In Link</>}
            </Button>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); if (firstName.trim() && lastName.trim()) sendMagicLink(email.trim(), firstName.trim(), lastName.trim()); }} className="space-y-3">
            <h2 className="font-serif text-2xl text-white mb-2">Sign Up</h2>
            <p className="text-white/60 text-sm mb-2">Welcome! Enter your name to create an account.</p>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:border-white/50 focus:ring-1 focus:ring-white/30 outline-none"
              autoFocus
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:border-white/50 focus:ring-1 focus:ring-white/30 outline-none"
              required
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" disabled={loading || !firstName.trim() || !lastName.trim()} size="lg" className="w-full bg-white text-black hover:bg-white/90 text-base">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : "Continue"}
            </Button>
          </form>
        )}

        {step === "sent" && (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white/80 text-sm">Check your email for a sign-in link.</p>
            <p className="text-white/40 text-xs">{email}</p>
            <p className="text-white/30 text-xs mt-2">Don't see it? Check your spam or junk folder.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full text-white border-white/20 bg-white/5 hover:bg-white/10 text-base">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
          <Link href="/workspaces">
            <Button variant="outline" size="lg" className="w-full text-white border-white/20 bg-white/5 hover:bg-white/10 text-base">
              <Building2 className="w-4 h-4 mr-2" /> Back to Workspaces
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PortalPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return <PortalLogin />;
  }

  return <PortalContent />;
}
