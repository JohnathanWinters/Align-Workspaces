import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";
import { PIPELINE_STAGES } from "./types";
import type { UsePipelineReturn } from "./use-pipeline";

interface PipelineFiltersProps {
  pipeline: UsePipelineReturn;
  searchRef?: React.Ref<HTMLInputElement>;
}

export default function PipelineFilters({ pipeline, searchRef }: PipelineFiltersProps) {
  const {
    filter, setFilter, searchQuery, setSearchQuery,
    stageFilter, setStageFilter, assignedFilter, setAssignedFilter,
    sortBy, setSortBy, stageCounts,
  } = pipeline;

  return (
    <div className="space-y-3 mb-4">
      {/* Category + Search + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(["all", "portraits", "spaces"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}>
                {f === "all" ? "All" : f === "portraits" ? "Portraits" : "Workspaces"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search contacts..." className="h-8 text-xs pl-8" />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="h-8 w-auto text-xs gap-1.5">
            <ArrowUpDown className="w-3 h-3 text-gray-400" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="follow-up">Follow-up date</SelectItem>
            <SelectItem value="last-contact">Coldest first</SelectItem>
            <SelectItem value="date-added">Newest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stage filter chips */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
        {PIPELINE_STAGES.map(stage => {
          const count = stageCounts[stage.key] || 0;
          const isActive = stageFilter === stage.key;
          return (
            <button key={stage.key} onClick={() => setStageFilter(isActive ? null : stage.key)}
              className={`rounded-lg border px-2.5 py-2 transition-all text-left ${
                isActive ? "ring-2 ring-stone-900 border-stone-900 bg-white shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"
              }`}>
              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${stage.color}`}>{stage.label}</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Assigned filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Assigned:</span>
        {[
          { key: null as string | null, label: "All" },
          { key: "armando", label: "Armando" },
          { key: "edith", label: "Edith" },
          { key: "unassigned", label: "Unassigned" },
        ].map(opt => (
          <button key={opt.key ?? "all"} onClick={() => setAssignedFilter(opt.key === assignedFilter ? null : opt.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              assignedFilter === opt.key ? "bg-stone-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
