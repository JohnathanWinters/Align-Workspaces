import { useState, useRef } from "react";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  User,
  Camera,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
} from "lucide-react";

export default function PortalSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <ProfilePhotoSection user={user} />
      <NameSection user={user} />
      <PasswordSection user={user} />
      <EmailSection user={user} />
    </motion.div>
  );
}

function ProfilePhotoSection({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/auth/profile-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        let msg = "Upload failed";
        try { const data = await res.json(); msg = data.message || msg; } catch {}
        throw new Error(msg);
      }
      const updated = await res.json();
      queryClient.setQueryData(["/api/auth/user"], updated);
      toast({ title: "Photo updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5" data-testid="section-profile-photo">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16">
            {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
            <AvatarFallback className="bg-gray-100 text-gray-500">
              <User className="w-7 h-7" />
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            data-testid="button-upload-photo"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Profile Photo</p>
          <p className="text-xs text-gray-500 mt-0.5">Square crop, max 50MB</p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="input-photo-file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function NameSection({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [saving, setSaving] = useState(false);

  const changed = firstName.trim() !== (user.firstName || "") || lastName.trim() !== (user.lastName || "");

  async function handleSave() {
    if (!firstName.trim()) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Update failed");
      }
      const updated = await res.json();
      queryClient.setQueryData(["/api/auth/user"], updated);
      toast({ title: "Name updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5" data-testid="section-name">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-gray-400" />
        <p className="text-sm font-medium text-gray-900">Name</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-500">First Name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 h-9 text-sm"
            data-testid="input-settings-firstname"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Last Name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 h-9 text-sm"
            data-testid="input-settings-lastname"
          />
        </div>
      </div>
      {changed && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 bg-gray-900 text-white text-xs"
            data-testid="button-save-name"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
            Save
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function PasswordSection({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"idle" | "set" | "change">("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const endpoint = user.hasPassword ? "/api/auth/change-password" : "/api/auth/set-password";
      const body = user.hasPassword
        ? { currentPassword, newPassword }
        : { newPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed");
      }
      const updated = await res.json();
      queryClient.setQueryData(["/api/auth/user"], updated);
      toast({ title: user.hasPassword ? "Password changed" : "Password set" });
      setMode("idle");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5" data-testid="section-password">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-900">Password</p>
        </div>
        {user.hasPassword ? (
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Set</span>
          </div>
        ) : (
          <span className="text-xs text-amber-600 font-medium">Not set</span>
        )}
      </div>

      {mode === "idle" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMode(user.hasPassword ? "change" : "set")}
          className="h-8 text-xs"
          data-testid="button-password-action"
        >
          {user.hasPassword ? "Change Password" : "Set Password"}
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {user.hasPassword && (
            <div>
              <Label className="text-xs text-gray-500">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-9 text-sm pr-9"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-gray-500">New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="h-9 text-sm pr-9"
                data-testid="input-new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 h-9 text-sm"
              data-testid="input-confirm-password"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
              className="h-8 bg-gray-900 text-white text-xs"
              data-testid="button-save-password"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
              {user.hasPassword ? "Change" : "Set"} Password
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setMode("idle"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EmailSection({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRequestChange() {
    if (!newEmail.trim()) {
      toast({ title: "Enter a new email", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/request-email-change", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed");
      }
      setSent(true);
      toast({ title: "Confirmation email sent", description: "Check your current email inbox." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5" data-testid="section-email">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4 text-gray-400" />
        <p className="text-sm font-medium text-gray-900">Email</p>
      </div>

      <p className="text-sm text-gray-700 mb-3" data-testid="text-current-email">{user.email}</p>

      {!editing ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setEditing(true); setSent(false); setNewEmail(""); }}
          className="h-8 text-xs"
          data-testid="button-change-email"
        >
          Change Email
        </Button>
      ) : sent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Confirmation sent</p>
              <p className="text-xs text-green-600 mt-0.5">
                We sent a confirmation link to <strong>{user.email}</strong>. Click it to switch your email to <strong>{newEmail}</strong>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setEditing(false); setSent(false); }}
            className="h-7 text-xs mt-2"
          >
            Done
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">New Email</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="mt-1 h-9 text-sm"
              data-testid="input-new-email"
            />
          </div>
          <p className="text-xs text-gray-400">
            A confirmation link will be sent to your current email ({user.email}).
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleRequestChange}
              disabled={sending}
              className="h-8 bg-gray-900 text-white text-xs"
              data-testid="button-send-email-change"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
              Send Confirmation
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
