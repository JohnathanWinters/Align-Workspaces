import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react";

export function CalendarSyncSettings({ spaceId }: { spaceId: string }) {
  const { toast } = useToast();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [feedName, setFeedName] = useState("");
  const [copied, setCopied] = useState(false);

  // Google Calendar status
  const { data: gcalStatus } = useQuery<{
    connected: boolean;
    syncEnabled?: boolean;
    lastSyncAt?: string | null;
    lastSyncError?: string | null;
  }>({
    queryKey: ["/api/calendar/google/status"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/google/status", { credentials: "include" });
      if (!res.ok) return { connected: false };
      return res.json();
    },
  });

  // iCal feeds
  const { data: feeds = [] } = useQuery<any[]>({
    queryKey: ["/api/spaces", spaceId, "ical-feeds"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/ical-feeds`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const connectGcal = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/calendar/google/authorize");
      const data = await res.json();
      window.location.href = data.url;
    },
  });

  const disconnectGcal = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/calendar/google/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/google/status"] });
      toast({ title: "Google Calendar disconnected" });
    },
  });

  const toggleSync = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/calendar/google/toggle-sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/google/status"] });
    },
  });

  const addFeed = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/spaces/${spaceId}/ical-feeds`, { feedUrl, feedName: feedName || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "ical-feeds"] });
      setFeedUrl("");
      setFeedName("");
      setShowAddFeed(false);
      toast({ title: "iCal feed added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteFeed = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ical-feeds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", spaceId, "ical-feeds"] });
      toast({ title: "Feed removed" });
    },
  });

  const exportUrl = `${window.location.origin}/api/spaces/${spaceId}/calendar.ics`;

  const copyExportUrl = () => {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Calendar URL copied" });
  };

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-stone-200">
      <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5" />
        Calendar Sync
      </h4>

      {/* Google Calendar */}
      <Card className="border border-stone-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="" className="w-5 h-5" />
              <span className="text-sm font-medium text-stone-700">Google Calendar</span>
            </div>
            {gcalStatus?.connected ? (
              <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Connected
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-stone-100 text-stone-500">Not connected</Badge>
            )}
          </div>

          {gcalStatus?.connected ? (
            <div className="space-y-2">
              <p className="text-xs text-stone-500">
                {gcalStatus.syncEnabled ? "Syncing every 15 minutes" : "Sync paused"}
                {gcalStatus.lastSyncAt && ` · Last sync: ${new Date(gcalStatus.lastSyncAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
              </p>
              {gcalStatus.lastSyncError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {gcalStatus.lastSyncError}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleSync.mutate()}>
                  {gcalStatus.syncEnabled ? "Pause" : "Resume"} Sync
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:text-red-600 border-red-200" onClick={() => disconnectGcal.mutate()}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-stone-500 mb-2">Connect to automatically block times from your Google Calendar and sync new bookings.</p>
              <Button size="sm" className="h-7 text-xs bg-stone-900 text-white hover:bg-stone-800" onClick={() => connectGcal.mutate()} disabled={connectGcal.isPending}>
                {connectGcal.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ExternalLink className="w-3 h-3 mr-1" />}
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* iCal Feed Import */}
      <Card className="border border-stone-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Import Calendars</span>
            </div>
            {!showAddFeed && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddFeed(true)}>
                <Plus className="w-3 h-3 mr-1" /> Add Feed
              </Button>
            )}
          </div>

          <p className="text-xs text-stone-500">Import iCal feeds from Peerspace, Airbnb, or any platform to block those times here.</p>

          <AnimatePresence>
            {showAddFeed && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                <Input
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="Paste iCal feed URL (https://...)"
                  className="text-xs"
                />
                <Input
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  placeholder="Label (optional, e.g. Peerspace)"
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs bg-stone-900 text-white hover:bg-stone-800" onClick={() => addFeed.mutate()} disabled={!feedUrl.trim() || addFeed.isPending}>
                    {addFeed.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Add Feed
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowAddFeed(false); setFeedUrl(""); setFeedName(""); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {feeds.length > 0 && (
            <div className="space-y-2">
              {feeds.map((feed: any) => (
                <div key={feed.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50">
                  <Link2 className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-700 truncate">{feed.feedName || "iCal Feed"}</p>
                    <p className="text-[10px] text-stone-400 truncate">{feed.feedUrl}</p>
                    {feed.lastFetchError && (
                      <p className="text-[10px] text-red-400">{feed.lastFetchError}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteFeed.mutate(feed.id)}
                    className="p-1 rounded-full hover:bg-stone-200 text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* iCal Export */}
      <Card className="border border-stone-200">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Export Calendar</span>
          </div>
          <p className="text-xs text-stone-500">Share this URL with other platforms so they see your Align bookings.</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={exportUrl}
              className="flex-1 text-[11px] bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-500 truncate"
            />
            <button
              onClick={copyExportUrl}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
              title="Copy URL"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
