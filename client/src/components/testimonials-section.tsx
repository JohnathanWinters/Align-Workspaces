import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, Camera, Building2 } from "lucide-react";
import { useDragScroll } from "@/hooks/use-drag-scroll";

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
  const [activeTab, setActiveTab] = useState<"workspaces" | "photography">("photography");

  const { data } = useQuery<TestimonialsData>({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60000,
  });

  const photographyReviews = (data?.photography || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const workspaceReviews = (data?.workspaces || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const reviews = activeTab === "workspaces" ? workspaceReviews : photographyReviews;
  const drag = useDragScroll();

  if (photographyReviews.length === 0 && workspaceReviews.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-[#faf9f7]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-3">What Our Clients Say</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Real feedback from our community.</p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-stone-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setActiveTab("workspaces")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "workspaces"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Workspaces
            </button>
            <button
              onClick={() => setActiveTab("photography")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "photography"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Photography
            </button>
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No reviews yet for this category.</p>
        ) : (
          <>
          {/* Mobile: horizontal carousel */}
          <div
            ref={drag.ref}
            onMouseDown={drag.onMouseDown}
            onMouseMove={drag.onMouseMove}
            onMouseUp={drag.onMouseUp}
            onMouseLeave={drag.onMouseLeave}
            onDragStart={drag.onDragStart}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 sm:hidden cursor-grab select-none"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } as any}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="snap-start flex-shrink-0 w-[80%] bg-white rounded-xl border border-gray-100 p-5"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-[#c4956a] text-[#c4956a]" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                {review.title && (
                  <p className="text-sm font-medium text-gray-900 mb-1">{review.title}</p>
                )}
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                )}
                {(review.adminResponse || review.hostResponse) && (
                  <div className="mt-3 pl-3 border-l-2 border-[#c4956a]/20">
                    <p className="text-xs font-medium text-gray-500">Align Team</p>
                    <p className="text-xs text-gray-400">{review.adminResponse || review.hostResponse}</p>
                  </div>
                )}
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
          {/* Desktop: masonry columns */}
          <div className="hidden sm:block columns-2 lg:columns-3 gap-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="break-inside-avoid bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-[#c4956a] text-[#c4956a]" : "text-gray-200"}`}
                    />
                  ))}
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
          </>
        )}
      </div>
    </section>
  );
}
