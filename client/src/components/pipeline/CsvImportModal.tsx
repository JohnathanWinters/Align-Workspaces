import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet } from "lucide-react";
import type { UsePipelineReturn } from "./use-pipeline";

interface CsvImportModalProps {
  pipeline: UsePipelineReturn;
}

export default function CsvImportModal({ pipeline }: CsvImportModalProps) {
  const { showImportCsv, setShowImportCsv, csvText, setCsvText, fileRef, importCsv, handleFileUpload } = pipeline;

  if (!showImportCsv) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={() => setShowImportCsv(false)}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-serif text-lg font-semibold mb-2">Import from CSV / Excel</h2>
        <p className="text-xs text-gray-400 mb-3">Upload a CSV file or paste CSV data. Columns: Name, Email, Phone, Instagram, Source, Category, Stage, Notes, Next Follow-Up</p>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
        <Button variant="outline" size="sm" className="mb-3 h-8 text-xs" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3 h-3 mr-1" /> Choose File
        </Button>
        <Textarea value={csvText} onChange={e => setCsvText(e.target.value)}
          placeholder={"Name,Email,Phone,...\nJohn Doe,john@email.com,555-1234,..."}
          className="h-40 text-xs font-mono" />
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => setShowImportCsv(false)}>Cancel</Button>
          <Button onClick={importCsv} className="bg-stone-900 hover:bg-stone-800 text-white">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Import
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
