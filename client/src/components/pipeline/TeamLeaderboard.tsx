import { Trophy } from "lucide-react";
import type { UsePipelineReturn } from "./use-pipeline";
import { TEAM_MEMBERS } from "./types";

interface TeamLeaderboardProps {
  pipeline: UsePipelineReturn;
}

export default function TeamLeaderboard({ pipeline }: TeamLeaderboardProps) {
  const { contacts } = pipeline;

  // Count contacts assigned to each team member
  const counts = TEAM_MEMBERS.map(member => {
    const assigned = contacts.filter(c => (c as any).assignedTo === member.key);
    const active = assigned.filter(c => c.stage !== "lost").length;
    return { ...member, total: assigned.length, active };
  });

  const max = Math.max(...counts.map(c => c.active), 1);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5" /> Team
      </h4>
      <div className="space-y-2">
        {counts.map(member => (
          <div key={member.key} className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-700 w-16">{member.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${member.key === "armando" ? "bg-blue-400" : "bg-purple-400"}`}
                style={{ width: `${(member.active / max) * 100}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-500 w-12 text-right">{member.active} active</span>
          </div>
        ))}
      </div>
    </div>
  );
}
