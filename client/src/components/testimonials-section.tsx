import { useQuery } from "@tanstack/react-query";
import { Star, Camera, Building2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  guestName?: string;
  clientName?: string;
  photoUrl?: string;
  createdAt: string;
  adminResponse?: string;
  hostResponse?: string;
}

interface TestimonialsData {
  photography: Review[];
  workspaces: Review[];
}

export function TestimonialsSection() {
  const { data } = useQuery<TestimonialsData>({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60000,
  });

  const allReviews = [
    ...(data?.photography || []).map((r) => ({ ...r, _type: "photography" as const })),
    ...(data?.workspaces || []).map((r) => ({ ...r, _type: "workspaces" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (allReviews.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-3">What Our Clients Say</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Real feedback from photography clients and workspace guests.</p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {allReviews.map((review) => (
            <div
              key={`${review._type}-${review.id}`}
              className="break-inside-avoid bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
            >
              {/* Type badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {review._type === "photography" ? (
                    <>
                      <Camera className="w-3.5 h-3.5 text-[#c4956a]" />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-[#c4956a]">Portrait Client</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400">Workspace Guest</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= review.rating ? "fill-[#c4956a] text-[#c4956a]" : "text-gray-200"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              {review.title && (
                <p className="text-sm font-medium text-gray-900 mb-1">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              )}

              {/* Response */}
              {(review.adminResponse || review.hostResponse) && (
                <div className="mt-3 pl-3 border-l-2 border-[#c4956a]/20">
                  <p className="text-xs font-medium text-gray-500">Align Team</p>
                  <p className="text-xs text-gray-400">{review.adminResponse || review.hostResponse}</p>
                </div>
              )}

              {/* Author */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2.5">
                {review.photoUrl ? (
                  <img src={review.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-400 text-xs font-bold">
                    {(review.clientName || review.guestName || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 block truncate">
                    {review.clientName || review.guestName || "Client"}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
