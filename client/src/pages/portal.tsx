import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowDown,
  Camera,
  Calendar,
  LogOut,
  Image,
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
} from "lucide-react";
import type { Shoot, GalleryImage, GalleryFolder } from "@shared/schema";

function getStatusColor(status: string | null) {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50";
    case "scheduled":
      return "text-blue-600 bg-blue-50";
    case "in-progress":
      return "text-amber-600 bg-amber-50";
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
      "Align Portrait Designer - AlignPhotoDesign.com",
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

function ShootGallery({ shoot, onBack }: { shoot: Shoot; onBack: () => void }) {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

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
    onSuccess: () => {
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

  const folderFilteredImages = showFavoritesOnly
    ? images.filter((img) => favoriteIds.includes(img.id))
    : effectiveFolder
      ? images.filter((img) => img.folderId === effectiveFolder)
      : hasFolders
        ? images.filter((img) => !img.folderId)
        : images;

  const displayedImages = folderFilteredImages;

  const favoritesCount = favoriteIds.length;

  const handleDownloadSingle = (imageId: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `/api/shoots/${shoot.id}/gallery/${imageId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
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
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : images.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Image className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="font-serif text-lg text-gray-900 mb-1">No photos yet</h3>
              <p className="text-gray-500 text-sm">Photos will appear here once they've been uploaded.</p>
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
                      onClick={() => { setSelectedFolder(folder.id); setShowFavoritesOnly(false); }}
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
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedImages.map((image) => {
                  const isFav = favoriteIds.includes(image.id);
                  return (
                    <div
                      key={image.id}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                      data-testid={`client-gallery-image-${image.id}`}
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.originalFilename || image.caption || "Photo"}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleFavoriteMutation.mutate(image.id)}
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
                          onClick={() => handleDownloadSingle(image.id, image.originalFilename || "photo.jpg")}
                          data-testid={`button-download-image-${image.id}`}
                          className="h-7 w-7 p-0 shrink-0 bg-white/90 text-black hover:bg-white pointer-events-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function PortalContent() {
  const { user, logout, isLoggingOut } = useAuth();
  const [selectedShoot, setSelectedShoot] = useState<Shoot | null>(null);

  const { data: shoots = [], isLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"],
    staleTime: 0,
  });

  if (selectedShoot) {
    return (
      <ShootGallery
        shoot={selectedShoot}
        onBack={() => setSelectedShoot(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button
                data-testid="button-back-home"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </button>
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <p className="font-serif text-lg text-gray-900" data-testid="text-portal-title">Client Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8" data-testid="img-user-avatar">
              {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user?.firstName || "User"} />}
              <AvatarFallback className="bg-gray-100 text-gray-500">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 hidden sm:block" data-testid="text-user-name">
              {user?.firstName || user?.email || "Client"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-logout"
              className="text-gray-500 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-3xl text-gray-900 mb-1" data-testid="text-welcome">
                Welcome{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-gray-500 text-sm">
                View your photoshoots and galleries
              </p>
            </div>
            <Link href="/?start=1">
              <Button
                data-testid="button-design-shoot"
                className="bg-[#1a1a1a] text-white hover:bg-black"
              >
                Start Designing Your Shoot
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : shoots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-dashed border-2 border-gray-200 bg-white/50" data-testid="card-empty-state">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Camera className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="font-serif text-xl text-gray-900 mb-2">No photoshoots yet</h3>
                  <p className="text-gray-500 text-sm max-w-sm mb-6">
                    Your photoshoot sessions will appear here once they've been set up. Design your shoot to get started!
                  </p>
                  <Link href="/?start=1">
                    <Button
                      size="lg"
                      data-testid="button-design-shoot-empty"
                      className="text-base px-8 bg-[#1a1a1a] text-white hover:bg-black"
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Start Designing Your Shoot
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {shoots.map((shoot, index) => (
                  <motion.div
                    key={shoot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card
                      className="bg-white hover:shadow-md transition-shadow cursor-pointer group"
                      data-testid={`card-shoot-${shoot.id}`}
                      onClick={() => setSelectedShoot(shoot)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="font-serif text-lg text-gray-900 group-hover:text-black transition-colors">
                            {shoot.title}
                          </CardTitle>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(shoot.status)}`}
                            data-testid={`badge-status-${shoot.id}`}
                          >
                            {getStatusIcon(shoot.status)}
                            {getStatusLabel(shoot.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
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
                        <div className="flex flex-col gap-2.5 mt-3">
                          {shoot.shootDate && (
                            <a
                              href={buildGoogleCalendarUrl(shoot)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-calendar-sync-${shoot.id}`}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#333] transition-colors"
                            >
                              <CalendarPlus className="w-4 h-4" />
                              Add to Google Calendar
                            </a>
                          )}
                          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <Images className="w-3 h-3" />
                            Tap to view gallery
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
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
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center px-6 max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Camera className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="font-serif text-3xl text-white mb-3">Client Portal</h1>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            Sign in to view your photoshoot galleries, track your sessions, and download your photos.
          </p>
          <div className="flex flex-col gap-3">
            <a href="/api/login" data-testid="button-login">
              <Button
                size="lg"
                className="w-full bg-white text-black hover:bg-white/90 text-base"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </a>
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                data-testid="button-back-home-login"
                className="w-full text-white border-white/20 bg-white/5 hover:bg-white/10 text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <PortalContent />;
}
