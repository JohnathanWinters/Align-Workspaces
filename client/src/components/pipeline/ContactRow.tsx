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
    <div
      className={`grid items-center px-4 py-2.5 transition-colors cursor-pointer ${
        isSelected ? "bg-blue-50/60 border-l-2 border-blue-500" : isFocused ? "bg-gray-50 ring-1 ring-inset ring-blue-200" : "hover:bg-gray-50/50 border-l-2 border-transparent"
      }`}
      style={{ gridTemplateColumns: "32px 1fr 28px 80px 130px" }}
      onClick={() => onSelect(c.id)}
      data-testid={`contact-row-${c.id}`}
      data-contact-id={c.id}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${avatarColors[variant]}`}>
        <span className="text-xs font-medium">{getInitials(c.name)}</span>
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0 px-3">
        <span className="text-sm font-medium text-gray-900 truncate block">{c.name}</span>
        {subtitle && <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>}
      </div>

      {/* Assigned */}
      <div className="flex justify-center">
        {(c as any).assignedTo ? (
          <span className={`text-[10px] w-5 h-5 rounded-full font-medium flex items-center justify-center ${
            (c as any).assignedTo === "armando" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
          }`}>
            {(c as any).assignedTo === "armando" ? "A" : "E"}
          </span>
        ) : (
          <span className="text-[10px] text-gray-300">—</span>
        )}
      </div>

      {/* Stage badge */}
      <div className="flex justify-start pl-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${stageOf(c.stage)?.color || "bg-gray-100"}`}>
          {stageOf(c.stage)?.label}
        </span>
      </div>

      {/* Status + health dot */}
      <div className="flex items-center justify-end gap-2 pl-2">
        {variant === "attention" && isOverdue && (
          <span className={`text-[11px] font-medium whitespace-nowrap ${days >= 7 ? "text-red-600" : "text-red-500"}`}>{overdueLabel(days)}</span>
        )}
        {variant === "attention" && !isOverdue && isNoAction && (
          <span className={`text-[11px] font-medium whitespace-nowrap ${days >= 7 ? "text-amber-700" : "text-amber-600"}`}>{noActionLabel(days)}</span>
        )}
        {variant === "upcoming" && c.nextFollowUp && (
          <span className="text-[11px] text-blue-600 font-medium whitespace-nowrap">{getRelativeFollowUpLabel(new Date(c.nextFollowUp))}</span>
        )}
        {variant === "default" && c.nextFollowUp && (
          <span className={`text-[11px] whitespace-nowrap ${new Date(c.nextFollowUp) <= new Date() ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {new Date(c.nextFollowUp).toLocaleDateString()}
          </span>
        )}
        {variant === "default" && !c.nextFollowUp && (
          <span className="text-[11px] text-gray-300">—</span>
        )}
        <div className={`w-2 h-2 rounded-full shrink-0 ${healthColor(healthScore)} opacity-70`} title={`Health: ${healthScore}`} />
      </div>
    </div>
  );
}
