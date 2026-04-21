import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

export default function LoyaltyBadge() {
  const { data } = useQuery<{
    isRepeatGuest: boolean;
    completedBookings: number;
    lifetimeSavings: number;
  }>({
    queryKey: ["/api/guest/loyalty"],
    queryFn: async () => {
      const res = await fetch("/api/guest/loyalty", { credentials: "include" });
      if (!res.ok) return { isRepeatGuest: false, completedBookings: 0, lifetimeSavings: 0 };
      return res.json();
    },
  });

  if (!data?.isRepeatGuest) return null;

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl px-4 py-3" data-testid="loyalty-badge">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
        <Star className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800">Repeat Guest</p>
        <p className="text-xs text-stone-500">
          You get a lower service fee on every booking
          {data.lifetimeSavings > 0 && (
            <>, you've saved <strong>${(data.lifetimeSavings / 100).toFixed(2)}</strong> so far</>
          )}
        </p>
      </div>
    </div>
  );
}
