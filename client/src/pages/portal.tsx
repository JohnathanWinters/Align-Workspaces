import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  Camera,
  Calendar,
  Plus,
  LogOut,
  Image,
  Clock,
  CheckCircle,
  Loader2,
  User,
} from "lucide-react";
import type { Shoot } from "@shared/schema";

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

function PortalContent() {
  const { user, logout, isLoggingOut } = useAuth();

  const { data: shoots = [], isLoading } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"],
  });

  const createShoot = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/shoots", {
        title: "New Photoshoot",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shoots"] });
    },
  });

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-3xl text-gray-900 mb-1" data-testid="text-welcome">
                Welcome{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-gray-500 text-sm">
                Manage your photoshoots and view your galleries
              </p>
            </div>
            <Button
              onClick={() => createShoot.mutate()}
              disabled={createShoot.isPending}
              data-testid="button-new-shoot"
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white"
            >
              {createShoot.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              New Photoshoot
            </Button>
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
                  <p className="text-gray-500 text-sm mb-6 max-w-sm">
                    Start designing your first portrait session. We'll guide you through choosing your environment, mood, and style.
                  </p>
                  <Button
                    onClick={() => createShoot.mutate()}
                    disabled={createShoot.isPending}
                    data-testid="button-new-shoot-empty"
                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Shoot
                  </Button>
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
                              <span>{formatDate(shoot.shootDate)}</span>
                            </div>
                          )}
                          {shoot.emotionalImpact && (
                            <div className="flex items-center gap-2">
                              <Image className="w-3.5 h-3.5" />
                              <span className="capitalize">{shoot.emotionalImpact} mood</span>
                            </div>
                          )}
                        </div>
                        {shoot.createdAt && (
                          <p className="text-xs text-gray-400 mt-3">
                            Created {formatDate(shoot.createdAt)}
                          </p>
                        )}
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
            Sign in to view your photoshoot galleries, track your sessions, and start new shoots.
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
