import type { PipelineContact } from "./types";
import { stageOf, getInitials, daysAgo, overdueLabel, noActionLabel, computeHealthScore, healthColor, getRelativeFollowUpLabel } from "./utils";

interface ContactRowProps {
  contact: PipelineContact;
  variant: "attention" | "upcoming" | "default";
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (id: string) => void;
}

export default function ContactRow({
  contact, variant, isSelected, isFocused, onSelect,
}: ContactRowProps) {
  const c = contact;
  const subtitle = c.email || c.phone || null;
  const isOverdue = c.nextFollowUp && new Date(c.nextFollowUp) <= new Date();
  const isNoAction = c.stage === "new" && c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) > 2 * 24 * 60 * 60 * 1000;
  const days = variant === "attention" ? (isOverdue ? daysAgo(c.nextFollowUp) : daysAgo(c.createdAt)) : 0;
  const healthScore = computeHealthScore(c);

  const avatarColors = {
    attention: "bg-red-50 text-red-600",
    upcoming: "bg-blue-50 text-blue-600",
    default: "bg-stone-100 text-stone-600",
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
          isSelected ? "bg-blue-50/60 border-l-2 border-blue-500" : isFocused ? "bg-gray-50 ring-1 ring-inset ring-blue-200" : "hover:bg-gray-50/50 border-l-2 border-transparent"
        }`}
        onClick={() => onSelect(c.id)}
        data-testid={`contact-row-${c.id}`}
        data-contact-id={c.id}
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarColors[variant]}`}>
          <span className="text-xs font-medium">{getInitials(c.name)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stageOf(c.stage)?.color || "bg-gray-100"}`}>
              {stageOf(c.stage)?.label}
            </span>
            {(c as any).assignedTo && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                (c as any).assignedTo === "armando" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
              }`}>
                {(c as any).assignedTo === "armando" ? "A" : "E"}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>

        {/* Health dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${healthColor(healthScore)} opacity-70`} title={`Health: ${healthScore}`} />

        {/* Status text */}
        <div className="text-right shrink-0 w-24">
          {variant === "attention" && isOverdue && (
            <p className={`text-[11px] font-medium ${days >= 7 ? "text-red-600" : "text-red-500"}`}>{overdueLabel(days)}</p>
          )}
          {variant === "attention" && !isOverdue && isNoAction && (
            <p className={`text-[11px] font-medium ${days >= 7 ? "text-amber-700" : "text-amber-600"}`}>{noActionLabel(days)}</p>
          )}
          {variant === "upcoming" && c.nextFollowUp && (
            <p className="text-[11px] text-blue-600 font-medium">{getRelativeFollowUpLabel(new Date(c.nextFollowUp))}</p>
          )}
          {variant === "default" && c.nextFollowUp && (
            <p className={`text-[10px] hidden sm:block ${new Date(c.nextFollowUp) <= new Date() ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {new Date(c.nextFollowUp).toLocaleDateString()}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
