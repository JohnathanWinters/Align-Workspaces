import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Shoot, User as UserType } from "@shared/schema";

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
  notes: "",
};

const environments = ["restaurant", "office", "nature", "workvan", "urban", "suburban", "gym"];
const brandMessages = ["assured", "empathy", "confidence", "motivation"];
const emotionalImpacts = ["cozy", "bright", "powerful", "cinematic"];
const shootIntents = ["website", "social-media", "marketing", "personal-brand", "team"];
const statuses = ["draft", "scheduled", "in-progress", "completed"];

function AdminDashboard({ token }: { token: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"clients" | "create" | "edit">("clients");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);
  const [form, setForm] = useState<ShootFormData>(defaultShootForm);
  const [saving, setSaving] = useState(false);

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
      notes: shoot.notes || "",
    });
    setView("edit");
  };

  const startCreate = (user: UserType) => {
    setSelectedUser(user);
    setForm(defaultShootForm);
    setView("create");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
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

          {users.length === 0 ? (
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
              {users.map((user) => {
                const userShoots = getUserShoots(user.id);
                return (
                  <Card key={user.id} className="bg-white" data-testid={`card-client-${user.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                            <AvatarFallback className="bg-gray-100 text-gray-500">
                              <User className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </CardTitle>
                            <p className="text-xs text-gray-500">{user.email || "No email"}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => startCreate(user)}
                          data-testid={`button-add-shoot-${user.id}`}
                          className="bg-[#1a1a1a] text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Add Shoot
                        </Button>
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
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 group"
                              data-testid={`shoot-row-${shoot.id}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Camera className="w-4 h-4 text-gray-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{shoot.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
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
                                        <span>{shoot.shootDate}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(shoot)}
                                  data-testid={`button-edit-shoot-${shoot.id}`}
                                  className="h-8 w-8 p-0 text-gray-500"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteShoot(shoot.id)}
                                  data-testid={`button-delete-shoot-${shoot.id}`}
                                  className="h-8 w-8 p-0 text-red-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
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
