import { Camera, Scissors, CheckCircle2, CalendarCheck, MapPin, Clock } from "lucide-react";

interface ShootWithGallery {
  status: string | null;
  shootDate: string | null;
  shootTime: string | null;
  location: string | null;
  galleryCount?: number;
}

const STAGES = [
  { label: "Booked", icon: CalendarCheck },
  { label: "Shot", icon: Camera },
  { label: "Editing", icon: Scissors },
  { label: "Delivered", icon: CheckCircle2 },
];

export function getShootProgressStage(shoot: ShootWithGallery): number {
  const today = new Date().toISOString().split("T")[0];

  if (shoot.status === "completed") return 3;
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

function formatShootDate(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShootTime(time: string): string {
  const d = new Date("2000-01-01T" + time);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StageDetail({ shoot, stage }: { shoot: ShootWithGallery; stage: number }) {
  if (stage === 0) {
    // Booked — show date, time, location
    return (
      <div className="space-y-1">
        {shoot.shootDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>
              {formatShootDate(shoot.shootDate)}
              {shoot.shootTime && ` at ${formatShootTime(shoot.shootTime)}`}
            </span>
          </div>
        )}
        {shoot.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shoot.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              {shoot.location}
            </a>
          </div>
        )}
      </div>
    );
  }

  if (stage === 1) {
    // Shot — session complete, now the work begins
    return (
      <p className="text-xs text-gray-500 leading-relaxed">
        Session complete — now we bring your photos to life with color correction, retouching, and final polish.
      </p>
    );
  }

  if (stage === 2) {
    // Editing
    const hasPhotos = (shoot.galleryCount ?? 0) > 0;
    return (
      <p className="text-xs text-gray-500 leading-relaxed">
        {hasPhotos
          ? `${shoot.galleryCount} photo${shoot.galleryCount === 1 ? "" : "s"} ready to preview — more may be added as editing continues.`
          : "Your photos are being color-graded and retouched to match your vision."}
      </p>
    );
  }

  if (stage === 3) {
    // Delivered
    const count = shoot.galleryCount ?? 0;
    return (
      <p className="text-xs text-gray-500 leading-relaxed">
        {count > 0
          ? `Your gallery is ready — ${count} photo${count === 1 ? "" : "s"} to view and download.`
          : "Your gallery is ready."}
      </p>
    );
  }

  return null;
}

export default function ShootProgressBar({ shoot }: { shoot: ShootWithGallery }) {
  const currentStage = getShootProgressStage(shoot);
  if (currentStage < 0) return null;

  return (
    <div className="pt-3 pb-1 px-1" onClick={(e) => e.stopPropagation()}>
      {/* Progress nodes */}
      <div className="flex items-center justify-between relative">
        {/* Background track */}
        <div className="absolute top-[11px] left-[16px] right-[16px] h-[2px] bg-gray-200" />
        {/* Filled track */}
        <div
          className="absolute top-[11px] left-[16px] h-[2px] bg-[#1a1a1a] transition-all duration-500"
          style={{ width: `calc(${(currentStage / (STAGES.length - 1)) * 100}% - 32px)` }}
        />

        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isCompleted = i < currentStage;
          const isCurrent = i === currentStage;

          return (
            <div key={stage.label} className="flex flex-col items-center z-10 relative" style={{ width: "25%" }}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#1a1a1a] text-white"
                    : isCurrent
                    ? "bg-amber-500 text-white shadow-[0_0_0_4px_rgba(245,158,11,0.15)]"
                    : "bg-white border-2 border-gray-200 text-gray-300"
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>
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

      {/* Contextual detail for current stage */}
      <div className="mt-3 px-1">
        <StageDetail shoot={shoot} stage={currentStage} />
      </div>
    </div>
  );
}
