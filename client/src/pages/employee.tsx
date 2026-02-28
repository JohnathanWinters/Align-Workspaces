import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Users,
  Camera,
  Loader2,
  User,
  Image,
  X,
  Upload,
  Folder,
  FolderOpen,
  Images,
  Search,
  MessageCircle,
  Download,
  ImagePlus,
  LogOut,
  Send,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EmployeeInfo {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface UserType {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Shoot {
  id: string;
  userId: string;
  title: string;
  environment: string;
  brandMessage: string;
  emotionalImpact: string;
  status: string;
  scheduledDate: string | null;
  location: string | null;
  createdAt: string;
}

interface EditRequest {
  id: string;
  userId: string;
  photoCount: number;
  annualTokensUsed: number;
  purchasedTokensUsed: number;
  notes: string | null;
  status: string;
  createdAt: string;
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

interface EditRequestMessage {
  id: string;
  editRequestId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface EditToken {
  id: string;
  userId: string;
  annualTokens: number;
  purchasedTokens: number;
}

const PERMISSIONS: Record<string, string[]> = {
  editor: [
    "view_users", "view_shoots", "view_gallery", "view_edit_requests",
    "upload_finished_photos", "chat_edit_requests", "view_edit_tokens",
  ],
  manager: [
    "view_users", "view_shoots", "view_gallery", "view_edit_requests",
    "upload_finished_photos", "chat_edit_requests", "view_edit_tokens",
    "create_shoots", "edit_shoots", "manage_gallery", "upload_photos",
    "manage_folders", "adjust_tokens",
  ],
};

function hasPermission(role: string, permission: string): boolean {
  return (PERMISSIONS[role] || []).includes(permission);
}

function empFetch(url: string, token: string, options: RequestInit & { isFormData?: boolean } = {}) {
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

function LoginScreen({ onLogin }: { onLogin: (token: string, employee: EmployeeInfo) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(data.token, data.employee);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white/60" />
          </div>
          <h1 className="text-white text-xl font-semibold">Team Portal</h1>
          <p className="text-white/40 text-sm mt-1">Sign in with your employee credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-employee-login">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            data-testid="input-employee-username"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="input-employee-password"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
          />
          {error && <p className="text-red-400 text-sm text-center" data-testid="text-login-error">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !username || !password}
            data-testid="button-employee-login"
            className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function EmployeeDashboard({ token, employee, onLogout }: { token: string; employee: EmployeeInfo; onLogout: () => void }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [allEditTokens, setAllEditTokens] = useState<EditToken[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"clients" | "editor">("clients");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const tokenMap = new Map<string, EditToken>();
  allEditTokens.forEach((t) => tokenMap.set(t.userId, t));

  const loadData = useCallback(async () => {
    try {
      const [usersRes, shootsRes, tokensRes] = await Promise.all([
        empFetch("/api/admin/users", token),
        empFetch("/api/admin/shoots", token),
        empFetch("/api/admin/all-edit-tokens", token),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (shootsRes.ok) setShoots(await shootsRes.json());
      if (tokensRes.ok) setAllEditTokens(await tokensRes.json());
    } catch {}
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadEditRequests = useCallback(async () => {
    try {
      const res = await empFetch("/api/admin/edit-requests", token);
      if (res.ok) setEditRequests(await res.json());
    } catch {}
  }, [token]);

  useEffect(() => {
    if (view === "editor") loadEditRequests();
  }, [view, loadEditRequests]);

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  });

  const getUserName = (u: UserType) => {
    if (u.firstName || u.lastName) return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return u.email || "Unknown";
  };

  const getUserInitials = (u: UserType) => {
    if (u.firstName) return u.firstName.charAt(0).toUpperCase();
    if (u.email) return u.email.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Team Portal</h1>
            <p className="text-xs text-gray-400">
              {employee.displayName} · <span className="capitalize">{employee.role}</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} data-testid="button-employee-logout" className="text-gray-400">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={view === "clients" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("clients")}
            data-testid="button-tab-clients"
            className={view === "clients" ? "bg-[#1a1a1a]" : ""}
          >
            <Users className="w-4 h-4 mr-1.5" />
            Clients
          </Button>
          <Button
            variant={view === "editor" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("editor")}
            data-testid="button-tab-editor"
            className={view === "editor" ? "bg-[#1a1a1a]" : ""}
          >
            <ImagePlus className="w-4 h-4 mr-1.5" />
            Edit Requests
          </Button>
        </div>

        {view === "clients" && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                data-testid="input-search-clients"
                className="pl-9 h-10"
              />
            </div>

            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No clients found</p>
              ) : (
                filteredUsers.map(user => {
                  const userShoots = shoots.filter(s => s.userId === user.id);
                  return (
                    <Card key={user.id} data-testid={`card-client-${user.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-gray-100">
                            <AvatarFallback className="text-sm font-medium">{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{getUserName(user)}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            <p>{userShoots.length} shoot(s)</p>
                            {tokenMap.get(user.id) && (
                              <p>{(tokenMap.get(user.id)!.annualTokens || 0) + (tokenMap.get(user.id)!.purchasedTokens || 0)} tokens</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {userShoots.length === 0 ? (
                          <p className="text-sm text-gray-400 italic py-2">No photoshoots assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {userShoots.map(shoot => (
                              <div key={shoot.id} className="flex items-center justify-between py-1.5 border-t border-gray-100" data-testid={`row-shoot-${shoot.id}`}>
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Camera className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="text-sm text-gray-700 truncate">{shoot.title}</span>
                                </div>
                                <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{shoot.status}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}

        {view === "editor" && (
          <EditRequestsView
            editRequests={editRequests}
            users={users}
            token={token}
            employeeRole={employee.role}
            onRefresh={loadEditRequests}
          />
        )}
      </div>
    </div>
  );
}

function EditRequestsView({ editRequests, users, token, employeeRole, onRefresh }: {
  editRequests: EditRequest[];
  users: UserType[];
  token: string;
  employeeRole: string;
  onRefresh: () => void;
}) {
  const userMap = new Map(users.map(u => [u.id, u]));

  const getUserName = (userId: string) => {
    const u = userMap.get(userId);
    if (!u) return "Unknown";
    if (u.firstName || u.lastName) return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return u.email || "Unknown";
  };

  if (editRequests.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">No edit requests</p>;
  }

  return (
    <div className="space-y-3">
      {editRequests.map(req => (
        <EmployeeEditRequestItem
          key={req.id}
          request={req}
          clientName={getUserName(req.userId)}
          token={token}
          employeeRole={employeeRole}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

function EmployeeEditRequestItem({ request, clientName, token, employeeRole, onRefresh }: {
  request: EditRequest;
  clientName: string;
  token: string;
  employeeRole: string;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [showPhotos, setShowPhotos] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [photos, setPhotos] = useState<EditRequestPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<EditRequestPhoto | null>(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
  const [targetPhotoId, setTargetPhotoId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const finishedInputRef = useRef<HTMLInputElement>(null);
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await empFetch(`/api/admin/edit-requests/${request.id}/messages`, token);
        if (res.ok) {
          const msgs: EditRequestMessage[] = await res.json();
          const adminMessages = msgs.filter(m => m.senderRole !== "client");
          const clientMessages = msgs.filter(m => m.senderRole === "client");
          if (clientMessages.length > 0) {
            const lastClientMsg = clientMessages[clientMessages.length - 1];
            const lastAdminMsg = adminMessages.length > 0 ? adminMessages[adminMessages.length - 1] : null;
            if (!lastAdminMsg || new Date(lastClientMsg.createdAt) > new Date(lastAdminMsg.createdAt)) {
              if (lastSeenRef.current < clientMessages.length) setHasUnread(true);
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
      const res = await empFetch(`/api/admin/edit-requests/${request.id}/photos`, token);
      if (res.ok) setPhotos(await res.json());
    } catch {} finally {
      setPhotosLoading(false);
    }
  };

  const togglePhotos = () => {
    if (!showPhotos) loadPhotos();
    setShowPhotos(!showPhotos);
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
      const res = await empFetch(`/api/admin/edit-photos/${targetPhotoId}/finished`, token, {
        method: "POST",
        body: formData,
        isFormData: true,
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast({ title: "Finished photo uploaded" });
    } catch {
      toast({ title: "Error", description: "Failed to upload", variant: "destructive" });
    } finally {
      setUploadingPhotoId(null);
      setTargetPhotoId(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" data-testid={`emp-edit-request-${request.id}`}>
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

        <p className="text-xs text-gray-500 mb-2">Client: <span className="font-medium text-gray-700">{clientName}</span></p>

        {request.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mb-2">
            <p className="text-xs text-amber-700 font-medium mb-0.5">Client Instructions</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.notes}</p>
          </div>
        )}

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={togglePhotos} data-testid={`button-emp-toggle-photos-${request.id}`} className="h-8">
            <Images className="w-3.5 h-3.5 mr-1.5" />
            {showPhotos ? "Hide Photos" : "View Photos"}
          </Button>
          {hasPermission(employeeRole, "chat_edit_requests") && (
            <Button
              variant={showChat ? "default" : "outline"}
              size="sm"
              onClick={handleChatToggle}
              data-testid={`button-emp-toggle-chat-${request.id}`}
              className={`relative h-8 ${showChat ? "bg-[#1a1a1a] text-white" : ""}`}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              {showChat ? "Hide Chat" : "Chat"}
              {hasUnread && !showChat && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
          )}
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
                  <div key={photo.id} className="flex gap-2 items-start" data-testid={`emp-edit-photo-${photo.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Original</p>
                      <div
                        className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group cursor-pointer"
                        onClick={() => setLightboxPhoto(photo)}
                      >
                        <img src={originalSrc} alt={photo.originalFilename || "Original"} className="w-full h-full object-cover" loading="lazy" />
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
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Finished</p>
                      {finishedSrc ? (
                        <div
                          className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group cursor-pointer"
                          onClick={() => setLightboxPhoto({ ...photo, imageUrl: photo.finishedImageUrl!, originalFilename: photo.finishedFilename })}
                        >
                          <img src={finishedSrc} alt="Finished" className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-end p-1.5 opacity-0 group-hover:opacity-100">
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); const a = document.createElement("a"); a.href = finishedSrc; a.download = photo.finishedFilename || "finished.jpg"; a.click(); }}
                                className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {hasPermission(employeeRole, "upload_finished_photos") && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTargetPhotoId(photo.id); finishedInputRef.current?.click(); }}
                                  className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : hasPermission(employeeRole, "upload_finished_photos") ? (
                        <button
                          onClick={() => { setTargetPhotoId(photo.id); finishedInputRef.current?.click(); }}
                          disabled={isUploading}
                          data-testid={`button-emp-upload-finished-${photo.id}`}
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
                      ) : (
                        <div className="w-full aspect-square rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs">
                          Pending
                        </div>
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <button
                onClick={() => {
                  const src = lightboxPhoto.imageUrl.startsWith("/") ? lightboxPhoto.imageUrl : `/objects/${lightboxPhoto.imageUrl}`;
                  const a = document.createElement("a"); a.href = src; a.download = lightboxPhoto.originalFilename || "photo.jpg"; a.click();
                }}
                className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => setLightboxPhoto(null)} className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxPhoto.imageUrl.startsWith("/") ? lightboxPhoto.imageUrl : `/objects/${lightboxPhoto.imageUrl}`}
              alt={lightboxPhoto.originalFilename || "Photo"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
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
            <EmployeeChat editRequestId={request.id} token={token} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeChat({ editRequestId, token }: { editRequestId: string; token: string }) {
  const [messages, setMessages] = useState<EditRequestMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await empFetch(`/api/admin/edit-requests/${editRequestId}/messages`, token);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
      }
    } catch {}
  }, [editRequestId, token]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await empFetch(`/api/admin/edit-requests/${editRequestId}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        loadMessages();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-gray-100 px-3 pb-3">
      <div className="max-h-60 overflow-y-auto py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No messages yet</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderRole === "client" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.senderRole === "client" ? "bg-gray-100" : "bg-[#1a1a1a] text-white"}`}>
              <p className={`text-[10px] font-medium mb-0.5 ${msg.senderRole === "client" ? "text-gray-500" : "text-white/60"}`}>
                {msg.senderName}
              </p>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-[10px] mt-1 ${msg.senderRole === "client" ? "text-gray-400" : "text-white/40"}`}>
                {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 pt-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[36px] max-h-20 text-sm resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          size="sm"
          className="h-9 w-9 p-0 bg-[#1a1a1a] shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function EmployeePage() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("employee_token"));
  const [employee, setEmployee] = useState<EmployeeInfo | null>(() => {
    const stored = sessionStorage.getItem("employee_info");
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (t: string, emp: EmployeeInfo) => {
    setToken(t);
    setEmployee(emp);
    sessionStorage.setItem("employee_token", t);
    sessionStorage.setItem("employee_info", JSON.stringify(emp));
  };

  const handleLogout = () => {
    setToken(null);
    setEmployee(null);
    sessionStorage.removeItem("employee_token");
    sessionStorage.removeItem("employee_info");
  };

  if (!token || !employee) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <EmployeeDashboard token={token} employee={employee} onLogout={handleLogout} />;
}
