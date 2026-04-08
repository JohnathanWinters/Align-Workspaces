import { Check } from "lucide-react";
import { PIPELINE_STAGES } from "./types";

interface ContactDetailStageBarProps {
  currentStage: string;
  onMove: (stage: string) => void;
}

export default function ContactDetailStageBar({ currentStage, onMove }: ContactDetailStageBarProps) {
  const activeIdx = PIPELINE_STAGES.findIndex(s => s.key === currentStage);

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((stage, i) => {
        const isActive = stage.key === currentStage;
        const isPast = i < activeIdx && currentStage !== "lost";
        const isLost = stage.key === "lost";

        return (
          <button
            key={stage.key}
            onClick={() => onMove(stage.key)}
            className={`flex-1 relative group transition-all ${isLost ? "flex-none w-auto" : ""}`}
            data-testid={`stage-step-${stage.key}`}
          >
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
              isActive
                ? `${stage.color} border-current ring-1 ring-black/10`
                : isPast
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : isLost && currentStage === "lost"
                    ? `${stage.color} border-current ring-1 ring-black/10`
                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600"
            }`}>
              {isPast && <Check className="w-3 h-3" />}
              <span className="truncate">{stage.label}</span>
            </div>
            {/* Connector line */}
            {i < PIPELINE_STAGES.length - 2 && !isLost && (
              <div className={`absolute top-1/2 -right-1 w-2 h-0.5 ${isPast ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
