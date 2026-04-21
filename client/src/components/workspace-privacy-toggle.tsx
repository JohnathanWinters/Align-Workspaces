import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Lock, Loader2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";

export default function WorkspacePrivacyToggle({ space }: { space: Space }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPrivate = space.isPrivate === 1;

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`/api/spaces/${space.id}/privacy`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.message || "Failed to update privacy");
        (err as any).code = data.code;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/my-spaces`] });
      qc.invalidateQueries({ queryKey: [`/api/spaces`] });
      toast({
        title: isPrivate ? "Workspace is now public" : "Workspace is now private",
        description: isPrivate
          ? "Visible on the Align marketplace."
          : "Hidden from marketplace. Share your direct booking link with your clients.",
      });
    },
    onError: (err: any) => {
      if (err.code === "NO_SUBSCRIPTION" || err.code === "TIER_LIMIT_REACHED") {
        setShowUpgrade(true);
        return;
      }
      toast({ title: "Couldn't update", description: err.message, variant: "destructive" });
    },
  });

  if (showUpgrade) {
    return (
      <div className="mt-3 p-3 bg-gradient-to-br from-[#faf9f7] to-white border border-[#c4956a]/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-[#c4956a] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-900 mb-1">Upgrade to enable private workspaces</p>
            <p className="text-xs text-stone-500 mb-3 leading-relaxed">
              Private workspaces require an active Align for Studios subscription.
            </p>
            <div className="flex items-center gap-2">
              <Link href="/for-studios">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors">
                  View plans
                  <ExternalLink className="w-3 h-3" />
                </button>
              </Link>
              <button
                onClick={() => setShowUpgrade(false)}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl">
      <div className="flex items-center gap-2.5 min-w-0">
        {isPrivate ? (
          <Lock className="w-4 h-4 text-stone-600 flex-shrink-0" />
        ) : (
          <Globe className="w-4 h-4 text-stone-600 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-900">
            {isPrivate ? "Private workspace" : "Public workspace"}
          </p>
          <p className="text-[11px] text-stone-500 truncate">
            {isPrivate
              ? "Hidden from marketplace — direct link only"
              : "Listed on Align marketplace"}
          </p>
        </div>
      </div>
      <button
        onClick={() => mutation.mutate(!isPrivate)}
        disabled={mutation.isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 flex-shrink-0"
      >
        {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
        {isPrivate ? "Make public" : "Make private"}
      </button>
    </div>
  );
}
