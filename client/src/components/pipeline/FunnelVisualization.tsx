import { PIPELINE_STAGES } from "./types";

interface FunnelVisualizationProps {
  stageCounts: Record<string, number>;
}

export default function FunnelVisualization({ stageCounts }: FunnelVisualizationProps) {
  const stages = PIPELINE_STAGES.filter(s => s.key !== "lost");
  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pipeline Funnel</h4>
      <div className="space-y-1.5">
        {stages.map((stage, i) => {
          const count = stageCounts[stage.key] || 0;
          const nextCount = i < stages.length - 1 ? (stageCounts[stages[i + 1].key] || 0) : 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const convRate = count > 0 && i < stages.length - 1 ? Math.round((nextCount / count) * 100) : null;

          return (
            <div key={stage.key}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${stage.color} w-20 text-center`}>{stage.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${stage.color.split(" ")[0]}`}
                    style={{ width: `${Math.max(pct, 4)}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-8 text-right">{count}</span>
              </div>
              {convRate !== null && count > 0 && (
                <div className="flex justify-center">
                  <span className="text-[9px] text-gray-400">{convRate}% →</span>
                </div>
              )}
            </div>
          );
        })}
        {(stageCounts["lost"] || 0) > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-stone-200 text-stone-500 w-24 text-center">Not Interested</span>
            <div className="flex-1" />
            <span className="text-xs font-medium text-gray-400 w-8 text-right">{stageCounts["lost"]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
