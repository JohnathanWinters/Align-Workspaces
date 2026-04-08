import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Send, Users, Check, X } from "lucide-react";
import { FOLLOW_UP_QUICK_OPTIONS } from "./types";
import { formatFollowUpDate } from "./utils";

interface ContactRowQuickLogProps {
  contactId: string;
  onLog: (contactId: string, type: string, note: string, followUpDays?: number) => void;
  onClose: () => void;
}

const QUICK_TYPES = [
  { key: "call", label: "Call", icon: Phone, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "text", label: "Text", icon: MessageCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "email", label: "Email", icon: Send, color: "bg-violet-50 text-violet-700 border-violet-200" },
  { key: "meeting", label: "Meeting", icon: Users, color: "bg-amber-50 text-amber-700 border-amber-200" },
];

export default function ContactRowQuickLog({ contactId, onLog, onClose }: ContactRowQuickLogProps) {
  const [type, setType] = useState("call");
  const [note, setNote] = useState("");
  const [followUpDays, setFollowUpDays] = useState<number | null>(null);
  const [logged, setLogged] = useState(false);

  const handleLog = () => {
    setLogged(true);
    onLog(contactId, type, note, followUpDays || undefined);
  };

  if (logged) {
    return (
      <motion.div
        initial={{ height: 44, opacity: 1 }}
        animate={{ height: 0, opacity: 0 }}
        transition={{ delay: 0.5, duration: 0.2 }}
        className="overflow-hidden bg-emerald-50 border-t border-emerald-100 flex items-center justify-center"
      >
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium py-2">
          <Check className="w-4 h-4" /> Logged!
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 flex items-center gap-2 flex-wrap">
        {/* Type pills */}
        <div className="flex items-center gap-1">
          {QUICK_TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                type === t.key ? t.color : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}>
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>

        {/* Note input */}
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Quick note..."
          className="flex-1 min-w-[120px] h-7 text-xs bg-white border border-gray-200 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-stone-400"
          onKeyDown={e => { if (e.key === "Enter") handleLog(); if (e.key === "Escape") onClose(); }}
          autoFocus
        />

        {/* Follow-up quick buttons */}
        <div className="flex items-center gap-1">
          {[
            { label: "+1d", days: 1 },
            { label: "+3d", days: 3 },
            { label: "+1w", days: 7 },
          ].map(opt => (
            <button key={opt.days} onClick={() => setFollowUpDays(followUpDays === opt.days ? null : opt.days)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                followUpDays === opt.days
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 text-stone-500 hover:bg-stone-100"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button onClick={handleLog}
          className="h-7 px-3 bg-stone-900 text-white rounded-md text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1">
          <Check className="w-3 h-3" /> Log
        </button>
        <button onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}
