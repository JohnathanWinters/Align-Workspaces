import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, ArrowRight, Upload, FileSpreadsheet, Flame, Home } from "lucide-react";
import type { UsePipelineReturn } from "./use-pipeline";

interface PipelineHeaderProps {
  pipeline: UsePipelineReturn;
  onBack: () => void;
  streak: { todayCount: number; streakDays: number };
}

export default function PipelineHeader({ pipeline, onBack, streak }: PipelineHeaderProps) {
  const { openAddForm, importLeads, syncSpaceContacts, exportCsv, setShowImportCsv } = pipeline;
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="sm" className="h-8 px-2 flex-shrink-0" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-serif text-lg sm:text-xl font-semibold truncate">Contacts</h1>
        {/* Streak badge */}
        {streak.todayCount > 0 && (
          <motion.div
            key={streak.todayCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[11px] font-semibold"
          >
            <Flame className="w-3 h-3" />
            {streak.todayCount} today
          </motion.div>
        )}
        {streak.streakDays >= 2 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[11px] font-semibold">
            <Flame className="w-3 h-3" />
            {streak.streakDays}d streak
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={importLeads}>
            <ArrowRight className="w-3 h-3 mr-1" /> Import Leads
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={syncSpaceContacts}>
            <Home className="w-3 h-3 mr-1" /> Sync Workspaces
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowImportCsv(true)}>
            <Upload className="w-3 h-3 mr-1" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCsv}>
            <FileSpreadsheet className="w-3 h-3 mr-1" /> Export CSV
          </Button>
        </div>
        {/* Mobile actions */}
        <div className="relative sm:hidden">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setShowActions(!showActions)}>
            <Plus className={`w-4 h-4 transition-transform ${showActions ? "rotate-45" : ""}`} />
          </Button>
          <AnimatePresence>
            {showActions && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-40 w-48">
                <button onClick={() => { importLeads(); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" /> Import Leads
                </button>
                <button onClick={() => { syncSpaceContacts(); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-gray-400" /> Sync Workspaces
                </button>
                <button onClick={() => { setShowImportCsv(true); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-gray-400" /> Import CSV
                </button>
                <button onClick={() => { exportCsv(); setShowActions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-gray-400" /> Export CSV
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button size="sm" className="h-8 text-xs bg-stone-900 hover:bg-stone-800 text-white" onClick={openAddForm}>
          <Plus className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">Add Contact</span>
        </Button>
      </div>
    </div>
  );
}
