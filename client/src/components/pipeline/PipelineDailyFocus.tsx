import { useState } from "react";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import type { UsePipelineReturn } from "./use-pipeline";
import { getInitials, daysAgo, needsAttention } from "./utils";

interface PipelineDailyFocusProps {
  pipeline: UsePipelineReturn;
}

export default function PipelineDailyFocus({ pipeline }: PipelineDailyFocusProps) {
  const { filteredContacts, selectContact } = pipeline;
  const [collapsed, setCollapsed] = useState(false);

  // Score contacts for daily focus
  const scored = filteredContacts
    .filter(c => c.stage !== "lost" && c.stage !== "completed")
    .map(c => {
      let priority = 0;
      let reason = "";

      // Overdue follow-ups (highest priority)
      if (c.nextFollowUp && new Date(c.nextFollowUp) <= new Date()) {
        const days = daysAgo(c.nextFollowUp);
        priority = 1000 + days;
        reason = days === 0 ? "Follow-up due today" : `${days}d overdue`;
      }
      // New contacts with no action
      else if (c.stage === "new" && c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) > 2 * 24 * 60 * 60 * 1000) {
        const days = daysAgo(c.createdAt);
        priority = 500 + days;
        reason = `New, no action (${days}d)`;
      }
      // Going cold
      else if (c.lastContactDate && (Date.now() - new Date(c.lastContactDate).getTime()) > 14 * 24 * 60 * 60 * 1000) {
        const days = daysAgo(c.lastContactDate);
        priority = 100 + days;
        reason = `Going cold (${days}d)`;
      }
      // Upcoming today/tomorrow
      else if (c.nextFollowUp) {
        const fuDate = new Date(c.nextFollowUp);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((fuDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          priority = 50;
          reason = diffDays <= 0 ? "Due today" : "Due tomorrow";
        }
      }

      return { contact: c, priority, reason };
    })
    .filter(s => s.priority > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  if (scored.length === 0) return null;

  return (
    <div className="mx-2 mb-2">
      <button onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
        <Target className="w-3.5 h-3.5 text-orange-500" />
        Today's Focus
        <span className="text-gray-400 font-normal">({scored.length})</span>
        <div className="ml-auto">
          {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>
      {!collapsed && (
        <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 rounded-xl border border-orange-100/60 divide-y divide-orange-100/50">
          {scored.map(({ contact: c, reason }) => (
            <button key={c.id} onClick={() => selectContact(c.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/50 transition-colors text-left">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-orange-700">{getInitials(c.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate block">{c.name}</span>
              </div>
              <span className="text-[10px] font-medium text-orange-600 shrink-0">{reason}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
