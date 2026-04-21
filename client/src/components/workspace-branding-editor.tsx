import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Space } from "@shared/schema";

export default function WorkspaceBrandingEditor({ space }: { space: Space }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(space.brandLogoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(space.brandPrimaryColor || "#c4956a");
  const [buttonColor, setButtonColor] = useState(space.brandButtonColor || "#1c1917");
  const [hideAlign, setHideAlign] = useState(space.hideAlignBranding === 1);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${space.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandLogoUrl: logoUrl.trim() || null,
          brandPrimaryColor: primaryColor,
          brandButtonColor: buttonColor,
          hideAlignBranding: hideAlign,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || "Failed to save branding");
        (err as any).code = data.code;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/my-spaces`] });
      qc.invalidateQueries({ queryKey: [`/api/spaces/${space.slug}`] });
      toast({ title: "Branding saved", description: "Changes are live on your booking page." });
    },
    onError: (err: any) => {
      if (err.code === "TIER_REQUIRED") {
        toast({
          title: "Upgrade required",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
      }
    },
  });

  return (
    <div className="mt-3 border border-stone-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Palette className="w-4 h-4 text-stone-600 flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-xs font-medium text-stone-900">Branding</p>
            <p className="text-[11px] text-stone-500">Logo, colors, and white label</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-stone-100">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">Logo URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">PNG or SVG on transparent background looks best.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">Accent color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-stone-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-2 py-2 rounded-lg border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">Button color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-stone-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="flex-1 px-2 py-2 rounded-lg border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer">
            <input
              type="checkbox"
              checked={hideAlign}
              onChange={(e) => setHideAlign(e.target.checked)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-900">Hide "Powered by Align" footer</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Requires the Studio plan. Full white-label mode.</p>
            </div>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
            >
              {save.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Save branding
            </button>
            {space.slug && (
              <a
                href={`/w/${space.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium transition-colors"
              >
                Preview page
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
