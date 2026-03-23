import { Camera, Scissors, Images, CheckCircle2, CalendarCheck } from "lucide-react";

interface ShootWithGallery {
  status: string | null;
  shootDate: string | null;
  galleryCount?: number;
}

const STAGES = [
  { label: "Booked", icon: CalendarCheck },
  { label: "Shot", icon: Camera },
  { label: "Editing", icon: Scissors },
  { label: "Gallery", icon: Images },
  { label: "Delivered", icon: CheckCircle2 },
];

export function getShootProgressStage(shoot: ShootWithGallery): number {
  const today = new Date().toISOString().split("T")[0];

  if (shoot.status === "completed") return 4;
  if (shoot.status === "in-progress" && (shoot.galleryCount ?? 0) > 0) return 3;
  if (shoot.status === "in-progress") return 2;
  if (
    (shoot.status === "scheduled" || shoot.status === "pending-review") &&
    shoot.shootDate &&
    shoot.shootDate <= today
  )
    return 1;
  if (shoot.status === "scheduled" || shoot.status === "pending-review") return 0;
  return -1;
}

export default function ShootProgressBar({ shoot }: { shoot: ShootWithGallery }) {
  const currentStage = getShootProgressStage(shoot);
  if (currentStage < 0) return null;

  return (
    <div className="py-3 px-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between relative">
        {/* Background track */}
        <div className="absolute top-[11px] left-[14px] right-[14px] h-[2px] bg-gray-200" />
        {/* Filled track */}
        <div
          className="absolute top-[11px] left-[14px] h-[2px] bg-[#1a1a1a] transition-all duration-500"
          style={{ width: `calc(${(currentStage / (STAGES.length - 1)) * 100}% - 28px)` }}
        />

        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isCompleted = i < currentStage;
          const isCurrent = i === currentStage;
          const isPending = i > currentStage;

          return (
            <div key={stage.label} className="flex flex-col items-center z-10 relative" style={{ width: "20%" }}>
              {/* Node */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#1a1a1a] text-white"
                    : isCurrent
                    ? "bg-amber-500 text-white shadow-[0_0_0_4px_rgba(245,158,11,0.2)]"
                    : "bg-white border-2 border-gray-200 text-gray-300"
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>
              {/* Label */}
              <span
                className={`text-[10px] mt-1.5 font-medium leading-tight ${
                  isCompleted
                    ? "text-gray-700"
                    : isCurrent
                    ? "text-amber-600"
                    : "text-gray-300"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
