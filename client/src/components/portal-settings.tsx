import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  ZoomIn,
  ZoomOut,
  X,
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
  const [cropFile, setCropFile] = useState<File | null>(null);

  async function handleUpload(blob: Blob) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", blob, "profile.webp");
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
      setCropFile(null);
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
          <p className="text-xs text-gray-500 mt-0.5">Drag to position, zoom to fit</p>
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
          if (file) setCropFile(file);
          e.target.value = "";
        }}
      />
      <AnimatePresence>
        {cropFile && (
          <PhotoCropModal
            file={cropFile}
            uploading={uploading}
            onConfirm={handleUpload}
            onClose={() => setCropFile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PhotoCropModal({
  file,
  uploading,
  onConfirm,
  onClose,
}: {
  file: File;
  uploading: boolean;
  onConfirm: (blob: Blob) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const containerSize = 280;
  const outputSize = 400;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = containerSize;
    canvas.height = containerSize;

    ctx.clearRect(0, 0, containerSize, containerSize);

    const scale = Math.max(containerSize / img.width, containerSize / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (containerSize - drawW) / 2 + offset.x;
    const drawY = (containerSize - drawH) / 2 + offset.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(containerSize / 2, containerSize / 2, containerSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, containerSize, containerSize);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(containerSize / 2, containerSize / 2, containerSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(containerSize / 2, containerSize / 2, containerSize / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset, containerSize]);

  useEffect(() => {
    if (imgLoaded) drawCanvas();
  }, [imgLoaded, drawCanvas]);

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.5, z - e.deltaY * 0.002)));
  }

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = outputSize;
    offscreen.height = outputSize;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    const ratio = outputSize / containerSize;
    const scale = Math.max(containerSize / img.width, containerSize / img.height) * zoom;
    const drawW = img.width * scale * ratio;
    const drawH = img.height * scale * ratio;
    const drawX = (outputSize - drawW) / 2 + offset.x * ratio;
    const drawY = (outputSize - drawH) / 2 + offset.y * ratio;

    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    offscreen.toBlob(
      (blob) => { if (blob) onConfirm(blob); },
      "image/webp",
      0.9
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-[340px] w-full overflow-hidden"
        data-testid="modal-crop-photo"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">Adjust Photo</p>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="button-crop-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center px-4 pt-4 pb-3">
          <div
            className="rounded-full overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            style={{ width: containerSize, height: containerSize }}
          >
            <canvas
              ref={canvasRef}
              width={containerSize}
              height={containerSize}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className="select-none"
              data-testid="canvas-crop"
            />
          </div>

          <div className="flex items-center gap-3 w-full mt-4 px-2">
            <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={0.5}
              max={3}
              step={0.01}
              className="flex-1"
              data-testid="slider-zoom"
            />
            <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Drag to reposition, use slider to zoom</p>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={uploading || !imgLoaded}
            className="flex-1 h-9 text-sm bg-gray-900 text-white"
            data-testid="button-crop-confirm"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
            Save
          </Button>
        </div>
      </motion.div>
    </motion.div>
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
