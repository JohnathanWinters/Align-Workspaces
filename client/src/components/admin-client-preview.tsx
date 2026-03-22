import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  MessageCircle,
  Building2,
  Settings,
  User,
  Calendar,
  Clock,
  CheckCircle,
  MapPin,
  Loader2,
  Heart,
  Folder,
  FolderOpen,
  Images,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Coins,
  Send,
  RefreshCw,
  Eye,
  AlertTriangle,
  Bell,
  Mail,
  XCircle,
  ExternalLink,
} from "lucide-react";

// Types mirroring portal types
interface DemoUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  notificationPreferences: {
    pushMessages?: boolean;
    pushBookings?: boolean;
    emailMessages?: boolean;
    emailBookings?: boolean;
  } | null;
  defaultPortalTab: string | null;
}

interface DemoShoot {
  id: string;
  title: string;
  environment: string | null;
  brandMessage: string | null;
  emotionalImpact: string | null;
  shootIntent: string | null;
  status: string | null;
  shootDate: string | null;
  shootTime: string | null;
  location: string | null;
  notes: string | null;
  durationHours: string | null;
  galleryCount: number;
  coverImageUrl: string | null;
  createdAt: string;
}

interface DemoEditToken {
  annualTokens: number;
  purchasedTokens: number;
  annualTokenResetDate: string;
  lastPhotoshootDate: string | null;
}

interface DemoTokenTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

interface DemoEditRequest {
  id: string;
  shootId: string | null;
  photoCount: number;
  annualTokensUsed: number;
  purchasedTokensUsed: number;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface DemoBooking {
  id: string;
  spaceId: string;
  status: string | null;
  bookingDate: string | null;
  bookingStartTime: string | null;
  bookingHours: number | null;
  paymentAmount: number | null;
  paymentStatus: string | null;
  totalGuestCharged: number | null;
  message: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  refundStatus: string | null;
  feeTier: string | null;
  spaceName: string;
  spaceSlug: string | null;
  spaceImage: string | null;
  createdAt: string;
}

interface DemoMessage {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string | null;
  message: string;
  createdAt: string;
}

interface DemoGalleryImage {
  id: string;
  shootId: string;
  folderId: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  originalFilename: string | null;
  sortOrder: number;
}

interface DemoGalleryFolder {
  id: string;
  shootId: string;
  name: string;
  sortOrder: number;
}

interface DemoEditRequestPhoto {
  id: string;
  imageUrl: string;
  originalFilename: string | null;
  finishedImageUrl: string | null;
  finishedFilename: string | null;
}

interface DemoReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string | null;
  createdAt: string;
}

interface DemoData {
  user: DemoUser;
  shoots: DemoShoot[];
  editTokens: DemoEditToken | null;
  tokenTransactions: DemoTokenTransaction[];
  editRequests: DemoEditRequest[];
  spaceBookings: { guest: DemoBooking[]; host: never[] };
  adminConversation: { id: string } | null;
  adminMessages: DemoMessage[];
  shootReviews: DemoReview[];
  spaceReviews: (DemoReview & { hostResponse?: string })[];
}

function adminFetch(url: string, token: string) {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function formatDate(date: string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCents(cents: number | null) {
  if (!cents) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusColor(status: string | null) {
  switch (status) {
    case "completed": return "text-green-600 bg-green-50";
    case "scheduled": return "text-blue-600 bg-blue-50";
    case "in-progress": return "text-amber-600 bg-amber-50";
    case "pending": return "text-orange-600 bg-orange-50";
    case "confirmed": return "text-blue-600 bg-blue-50";
    case "cancelled": return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "completed": return <CheckCircle className="w-3.5 h-3.5" />;
    case "scheduled": return <Calendar className="w-3.5 h-3.5" />;
    case "in-progress": return <Clock className="w-3.5 h-3.5" />;
    case "confirmed": return <CheckCircle className="w-3.5 h-3.5" />;
    case "cancelled": return <XCircle className="w-3.5 h-3.5" />;
    default: return <Camera className="w-3.5 h-3.5" />;
  }
}

// ── Lightbox ──────────────────────────────────────────────────────
function PreviewLightbox({ images, initialIndex, onClose }: { images: DemoGalleryImage[]; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex);
  const goNext = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose, goNext, goPrev]);

  const current = images[idx];
  if (!current) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
        <X className="w-5 h-5" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{idx + 1} / {images.length}</div>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ChevronRight className="w-6 h-6" /></button>
        </>
      )}
      <motion.img key={current.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} src={current.imageUrl} alt={current.originalFilename || "Photo"} onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">{current.originalFilename || "Photo"}</div>
    </motion.div>
  );
}

// ── Gallery View ──────────────────────────────────────────────────
function ShootGalleryPreview({ shoot, token, onBack }: { shoot: DemoShoot; token: string; onBack: () => void }) {
  const [images, setImages] = useState<DemoGalleryImage[]>([]);
  const [folders, setFolders] = useState<DemoGalleryFolder[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [imgRes, foldRes, favRes] = await Promise.all([
        adminFetch(`/api/admin/demo-client/shoots/${shoot.id}/gallery`, token),
        adminFetch(`/api/admin/demo-client/shoots/${shoot.id}/folders`, token),
        adminFetch(`/api/admin/demo-client/shoots/${shoot.id}/favorites`, token),
      ]);
      if (imgRes.ok) setImages(await imgRes.json());
      if (foldRes.ok) setFolders(await foldRes.json());
      if (favRes.ok) setFavorites(await favRes.json());
      setLoading(false);
    })();
  }, [shoot.id, token]);

  const filteredImages = images.filter(img => {
    if (showFavoritesOnly) return favorites.includes(img.id);
    if (selectedFolder === null) return true;
    if (selectedFolder === "__unfiled") return !img.folderId;
    return img.folderId === selectedFolder;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h3 className="text-lg font-serif text-gray-900">{shoot.title}</h3>
          <p className="text-xs text-gray-500">{shoot.galleryCount} photos{shoot.location ? ` \u00b7 ${shoot.location}` : ""}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <>
          {/* Folder + filter bar */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setSelectedFolder(null); setShowFavoritesOnly(false); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedFolder === null && !showFavoritesOnly ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              All ({images.length})
            </button>
            {folders.map(f => {
              const count = images.filter(i => i.folderId === f.id).length;
              return (
                <button key={f.id} onClick={() => { setSelectedFolder(f.id); setShowFavoritesOnly(false); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${selectedFolder === f.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {selectedFolder === f.id ? <FolderOpen className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                  {f.name} ({count})
                </button>
              );
            })}
            {images.some(i => !i.folderId) && (
              <button onClick={() => { setSelectedFolder("__unfiled"); setShowFavoritesOnly(false); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedFolder === "__unfiled" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Unfiled ({images.filter(i => !i.folderId).length})
              </button>
            )}
            {favorites.length > 0 && (
              <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSelectedFolder(null); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${showFavoritesOnly ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <Heart className={`w-3 h-3 ${showFavoritesOnly ? "fill-current" : ""}`} />
                Favorites ({favorites.length})
              </button>
            )}
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredImages.map((img, i) => (
              <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setLightboxIndex(i)}>
                <img src={img.thumbnailUrl || img.imageUrl} alt={img.originalFilename || "Photo"} className="w-full h-full object-cover" loading="lazy" />
                {favorites.includes(img.id) && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <p className="text-white text-xs truncate">{img.originalFilename || "Photo"}</p>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {lightboxIndex !== null && (
              <PreviewLightbox images={filteredImages} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ── Shoots Tab ────────────────────────────────────────────────────
function ShootsTab({ data, token }: { data: DemoData; token: string }) {
  const [selectedShoot, setSelectedShoot] = useState<DemoShoot | null>(null);
  const [shootMessages, setShootMessages] = useState<DemoMessage[]>([]);
  const [showMessages, setShowMessages] = useState<string | null>(null);

  const loadMessages = async (shootId: string) => {
    const res = await adminFetch(`/api/admin/demo-client/shoots/${shootId}/messages`, token);
    if (res.ok) setShootMessages(await res.json());
  };

  if (selectedShoot) {
    return <ShootGalleryPreview shoot={selectedShoot} token={token} onBack={() => setSelectedShoot(null)} />;
  }

  return (
    <div className="space-y-4">
      {data.shoots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No shoots yet</p>
          </CardContent>
        </Card>
      ) : (
        data.shoots.map(shoot => {
          const review = data.shootReviews.find(r => (r as any).shootId === shoot.id);
          return (
            <Card key={shoot.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Cover image */}
                  {shoot.coverImageUrl && (
                    <div className="w-24 sm:w-32 shrink-0 cursor-pointer" onClick={() => shoot.galleryCount > 0 && setSelectedShoot(shoot)}>
                      <img src={shoot.coverImageUrl} alt={shoot.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{shoot.title}</h3>
                        {shoot.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {shoot.location}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shoot.status)}`}>
                        {getStatusIcon(shoot.status)}
                        {shoot.status === "completed" ? "Completed" : shoot.status === "scheduled" ? "Scheduled" : shoot.status === "in-progress" ? "In Progress" : shoot.status || "Draft"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      {shoot.shootDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(shoot.shootDate)}
                        </span>
                      )}
                      {shoot.shootTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {shoot.shootTime}
                        </span>
                      )}
                      {shoot.galleryCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Images className="w-3 h-3" /> {shoot.galleryCount} photos
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {shoot.galleryCount > 0 && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedShoot(shoot)}>
                          <Images className="w-3 h-3 mr-1" /> View Gallery
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { if (showMessages === shoot.id) { setShowMessages(null); } else { setShowMessages(shoot.id); loadMessages(shoot.id); } }}>
                        <MessageCircle className="w-3 h-3 mr-1" /> Messages
                      </Button>
                    </div>

                    {review && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-md border border-amber-100">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                          ))}
                          <span className="text-xs font-medium text-amber-700 ml-1">{review.title}</span>
                        </div>
                        <p className="text-xs text-amber-600">{review.comment}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shoot messages */}
                <AnimatePresence>
                  {showMessages === shoot.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100 overflow-hidden">
                      <div className="p-4 max-h-60 overflow-y-auto space-y-2">
                        {shootMessages.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-3">No messages yet</p>
                        ) : (
                          shootMessages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.senderRole === "client" ? "items-end" : "items-start"}`}>
                              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.senderRole === "client" ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-900"}`}>
                                <p className={`text-[10px] font-medium mb-0.5 ${msg.senderRole === "client" ? "text-white/60" : "text-gray-500"}`}>
                                  {msg.senderName || (msg.senderRole === "admin" ? "Armando R." : "Maria")}
                                </p>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                                {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-100 p-3 flex gap-2 opacity-50">
                        <input className="flex-1 text-sm rounded-md border border-gray-200 px-3 py-1.5" placeholder="Preview only — messages disabled" disabled />
                        <Button size="sm" disabled className="bg-[#1a1a1a] text-white"><Send className="w-4 h-4" /></Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ── Edits Tab ─────────────────────────────────────────────────────
function EditsTab({ data, token }: { data: DemoData; token: string }) {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [requestPhotos, setRequestPhotos] = useState<Record<string, DemoEditRequestPhoto[]>>({});
  const [requestMessages, setRequestMessages] = useState<Record<string, DemoMessage[]>>({});
  const [showPhotos, setShowPhotos] = useState<Record<string, boolean>>({});

  const loadPhotos = async (reqId: string) => {
    if (requestPhotos[reqId]) return;
    const res = await adminFetch(`/api/admin/demo-client/edit-requests/${reqId}/photos`, token);
    if (res.ok) {
      const photos = await res.json();
      setRequestPhotos(prev => ({ ...prev, [reqId]: photos }));
    }
  };

  const loadMessages = async (reqId: string) => {
    if (requestMessages[reqId]) return;
    const res = await adminFetch(`/api/admin/demo-client/edit-requests/${reqId}/messages`, token);
    if (res.ok) {
      const msgs = await res.json();
      setRequestMessages(prev => ({ ...prev, [reqId]: msgs }));
    }
  };

  const totalTokens = (data.editTokens?.annualTokens ?? 0) + (data.editTokens?.purchasedTokens ?? 0);

  const getEditStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      completed: { label: "Completed", className: "bg-green-50 text-green-600" },
      "in-progress": { label: "In Progress", className: "bg-amber-50 text-amber-600" },
      pending: { label: "Pending", className: "bg-orange-50 text-orange-600" },
    };
    const c = config[status] || { label: status, className: "bg-gray-50 text-gray-600" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Token balance card */}
      <Card className="bg-gradient-to-br from-stone-50 to-stone-100/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              Retouching Sessions
            </h3>
            <Button variant="outline" size="sm" className="h-7 text-xs opacity-50" disabled>
              Buy More
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalTokens}</p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{data.editTokens?.annualTokens ?? 0}</p>
              <p className="text-xs text-gray-500">Included</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{data.editTokens?.purchasedTokens ?? 0}</p>
              <p className="text-xs text-gray-500">Purchased</p>
            </div>
          </div>
          {data.editTokens?.annualTokenResetDate && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Annual sessions reset {formatDate(data.editTokens.annualTokenResetDate)}
            </p>
          )}

          {/* Transaction history */}
          {data.tokenTransactions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-200/60">
              <p className="text-xs font-medium text-gray-500 mb-2">Recent Activity</p>
              <div className="space-y-1.5">
                {data.tokenTransactions.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{txn.description}</span>
                    <span className={`font-medium ${txn.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                      {txn.amount > 0 ? "+" : ""}{txn.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit photos button (disabled) */}
      <Button className="w-full bg-[#1a1a1a] text-white opacity-50" disabled>
        <ImagePlus className="w-4 h-4 mr-2" /> Submit Photos for Editing (Preview Only)
      </Button>

      {/* Edit requests */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Edit Requests</h3>
        {data.editRequests.map(req => (
          <div key={req.id} className={`rounded-lg overflow-hidden border ${req.status === "in-progress" ? "border-amber-200 bg-amber-50/30" : "border-gray-200 bg-white"}`}>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 text-sm">{req.photoCount} photo(s)</span>
                  {getEditStatusBadge(req.status)}
                </div>
                <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
              </div>

              {req.notes && (
                <div className="bg-gray-50 rounded-md px-3 py-2 mb-2">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Editing Instructions</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {req.annualTokensUsed} included + {req.purchasedTokensUsed} purchased sessions
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => { const next = !showPhotos[req.id]; setShowPhotos(prev => ({ ...prev, [req.id]: next })); if (next) loadPhotos(req.id); }}>
                    <Images className="w-3.5 h-3.5 mr-1.5" />
                    {showPhotos[req.id] ? "Hide Photos" : "View Photos"}
                  </Button>
                  <Button variant={expandedRequest === req.id ? "default" : "outline"} size="sm" className={`h-8 ${expandedRequest === req.id ? "bg-[#1a1a1a] text-white" : ""}`} onClick={() => { const next = expandedRequest === req.id ? null : req.id; setExpandedRequest(next); if (next) loadMessages(req.id); }}>
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    {expandedRequest === req.id ? "Hide Chat" : "Chat"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Photos */}
            {showPhotos[req.id] && (
              <div className="px-4 pb-3 border-t border-gray-100 pt-3">
                {!requestPhotos[req.id] ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                ) : (
                  <div className="space-y-3">
                    {requestPhotos[req.id].map(photo => {
                      const originalSrc = photo.imageUrl;
                      const finishedSrc = photo.finishedImageUrl;
                      return (
                        <div key={photo.id}>
                          {finishedSrc ? (
                            <div className="flex gap-2 items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Original</p>
                                <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                                  <img src={originalSrc} alt={photo.originalFilename || "Original"} className="w-full h-full object-cover" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-emerald-600 mb-1 uppercase tracking-wide font-medium">Finished</p>
                                <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 ring-2 ring-emerald-200">
                                  <img src={finishedSrc} alt={photo.finishedFilename || "Finished"} className="w-full h-full object-cover" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 max-w-[50%]">
                              <img src={originalSrc} alt={photo.originalFilename || "Photo"} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {expandedRequest === req.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-gray-200 p-3 max-h-60 overflow-y-auto space-y-2">
                    {!requestMessages[req.id] ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                    ) : requestMessages[req.id].length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">No messages yet</p>
                    ) : (
                      requestMessages[req.id].map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderRole === "client" ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.senderRole === "client" ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-900"}`}>
                            <p className={`text-[10px] font-medium mb-0.5 ${msg.senderRole === "client" ? "text-white/60" : "text-gray-500"}`}>
                              {msg.senderName || "Unknown"}
                            </p>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                            {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-100 p-2 flex gap-2 opacity-50">
                    <input className="flex-1 text-sm rounded-md border border-gray-200 px-3 py-1.5" placeholder="Preview only" disabled />
                    <Button size="sm" disabled className="bg-[#1a1a1a] text-white"><Send className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Messages Tab ──────────────────────────────────────────────────
function MessagesTab({ data }: { data: DemoData }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Admin Conversation</h3>
      {data.adminMessages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 max-h-[500px] overflow-y-auto space-y-3">
            {data.adminMessages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderRole === "client" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.senderRole === "client" ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-900"}`}>
                  <p className={`text-[10px] font-medium mb-0.5 ${msg.senderRole === "client" ? "text-white/60" : "text-gray-500"}`}>
                    {msg.senderName || (msg.senderRole === "admin" ? "Armando R." : "Maria")}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                  {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </CardContent>
          <div className="border-t p-3 flex gap-2 opacity-50">
            <input className="flex-1 text-sm rounded-md border border-gray-200 px-3 py-1.5" placeholder="Preview only — messages disabled" disabled />
            <Button size="sm" disabled className="bg-[#1a1a1a] text-white"><Send className="w-4 h-4" /></Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Spaces Tab ────────────────────────────────────────────────────
function SpacesTab({ data }: { data: DemoData }) {
  const bookings = data.spaceBookings.guest;

  const getBookingStatusBadge = (b: DemoBooking) => {
    if (b.status === "cancelled") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600"><XCircle className="w-3 h-3" /> Cancelled</span>;
    if (b.checkedOutAt) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600"><CheckCircle className="w-3 h-3" /> Completed</span>;
    if (b.checkedInAt) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"><Clock className="w-3 h-3" /> Checked In</span>;
    if (b.status === "confirmed") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"><Calendar className="w-3 h-3" /> Confirmed</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600">{b.status}</span>;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Space Bookings ({bookings.length})</h3>
      {bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No bookings yet</p>
          </CardContent>
        </Card>
      ) : (
        bookings.map(booking => {
          const review = data.spaceReviews.find(r => (r as any).bookingId === booking.id);
          return (
            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex">
                  {booking.spaceImage && (
                    <div className="w-24 sm:w-32 shrink-0">
                      <img src={booking.spaceImage} alt={booking.spaceName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{booking.spaceName}</h3>
                        {booking.message && <p className="text-xs text-gray-500 mt-0.5 italic">"{booking.message}"</p>}
                      </div>
                      {getBookingStatusBadge(booking)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(booking.bookingDate)}</span>
                      {booking.bookingStartTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.bookingStartTime}</span>}
                      {booking.bookingHours && <span>{booking.bookingHours}h</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-600 font-medium">
                        {formatCents(booking.totalGuestCharged || booking.paymentAmount)}
                      </span>
                      {booking.refundStatus === "full" && <span className="text-red-500">Refunded</span>}
                      {booking.feeTier && <Badge variant="outline" className="text-[10px] h-4">{booking.feeTier.replace("_", " ")}</Badge>}
                    </div>

                    {review && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-md border border-amber-100">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                          ))}
                          <span className="text-xs font-medium text-amber-700 ml-1">{review.title}</span>
                        </div>
                        <p className="text-xs text-amber-600">{review.comment}</p>
                        {review.hostResponse && (
                          <div className="mt-2 pl-3 border-l-2 border-amber-200">
                            <p className="text-[10px] text-amber-500 font-medium">Host Response</p>
                            <p className="text-xs text-amber-600">{review.hostResponse}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────
function SettingsTab({ data }: { data: DemoData }) {
  const user = data.user;
  const prefs = user.notificationPreferences;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Profile</h3>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={user.firstName} />}
              <AvatarFallback className="bg-gray-100 text-gray-500 text-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">First Name</label>
              <input className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm mt-1" value={user.firstName} disabled />
            </div>
            <div>
              <label className="text-xs text-gray-500">Last Name</label>
              <input className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm mt-1" value={user.lastName} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h3>
          <div className="space-y-3">
            {[
              { label: "Push — Messages", value: prefs?.pushMessages },
              { label: "Push — Bookings", value: prefs?.pushBookings },
              { label: "Email — Messages", value: prefs?.emailMessages },
              { label: "Email — Bookings", value: prefs?.emailBookings },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className={`w-9 h-5 rounded-full relative ${item.value ? "bg-green-500" : "bg-gray-200"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${item.value ? "left-[18px]" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function AdminClientPreview({ token, onBack }: { token: string; onBack: () => void }) {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reseeding, setReseeding] = useState(false);
  const [activeTab, setActiveTab] = useState<"shoots" | "edits" | "messages" | "spaces" | "settings">("shoots");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/demo-client/data", token);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const res = await adminFetch("/api/admin/demo-client/seed", token);
      if (!res.ok) throw new Error("Failed to re-seed");
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReseeding(false);
    }
  };

  // Reseed uses POST
  const handleReseedClick = async () => {
    setReseeding(true);
    try {
      const res = await fetch("/api/admin/demo-client/seed", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to re-seed");
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReseeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-gray-600">{error || "No demo client data found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={handleReseedClick} disabled={reseeding}>
            {reseeding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Seed Demo Data
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "shoots" as const, label: "Shoots", icon: Camera, count: data.shoots.length },
    { id: "edits" as const, label: "Edits", icon: ImagePlus, count: data.editRequests.length },
    { id: "messages" as const, label: "Messages", icon: MessageCircle, count: data.adminMessages.length },
    { id: "spaces" as const, label: "Spaces", icon: Building2, count: data.spaceBookings.guest.length },
    { id: "settings" as const, label: "Settings", icon: Settings, count: 0 },
  ];

  return (
    <div className="flex-1 min-h-0">
      {/* Preview banner — sits outside the portal simulation */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-200/60 px-6 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-900">Client Portal Preview — <strong>{data.user.firstName} {data.user.lastName}</strong></p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReseedClick} disabled={reseeding} className="h-7 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs">
          {reseeding ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
          Re-seed Data
        </Button>
      </div>

      {/* Full portal simulation — matches real portal layout exactly */}
      <div className="min-h-screen bg-[#faf9f7]">
        {/* Sticky header — matches portal header */}
        <header className="bg-background/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground/60">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </span>
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#c4956a] font-semibold">
              <span className="hidden sm:inline">Client Portal</span>
            </span>
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                {data.user.profileImageUrl && <AvatarImage src={data.user.profileImageUrl} alt={data.user.firstName} />}
                <AvatarFallback className="bg-gray-100 text-gray-500"><User className="w-3.5 h-3.5" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content — max-w-5xl centered, exactly like the real portal */}
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-6 flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-gray-900 mb-1">
                Welcome, {data.user.firstName}
              </h1>
              <p className="text-gray-500 text-sm">Manage your photoshoots and photo edits</p>
            </div>
            <Button className="bg-[#1a1a1a] text-white hover:bg-black opacity-50 cursor-default">
              Start Designing Your Shoot
            </Button>
          </div>

          {/* Tabs — centered, matches portal tab bar */}
          <div className="relative mb-8 -mx-4 sm:mx-0">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#faf9f7] to-transparent z-10 sm:hidden" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#faf9f7] to-transparent z-10 sm:hidden" />
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto px-4 sm:px-0 sm:justify-center scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && tab.id !== "settings" && (
                    <span className="text-[10px] text-gray-400">({tab.count})</span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div layoutId="preview-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "shoots" && <ShootsTab data={data} token={token} />}
          {activeTab === "edits" && <EditsTab data={data} token={token} />}
          {activeTab === "messages" && <MessagesTab data={data} />}
          {activeTab === "spaces" && <SpacesTab data={data} />}
          {activeTab === "settings" && <SettingsTab data={data} />}
        </main>
      </div>
    </div>
  );
}
