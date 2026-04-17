import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";
import { PIPELINE_STAGES } from "./types";
import type { UsePipelineReturn } from "./use-pipeline";

interface ContactFormProps {
  pipeline: UsePipelineReturn;
}

export default function ContactForm({ pipeline }: ContactFormProps) {
  const { form, setForm, editingContact, showForm, setShowForm, setEditingContact, handleSave, allSpaces, allShoots } = pipeline;

  if (!showForm) return null;

  const close = () => { setShowForm(false); setEditingContact(null); };

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[10000]" onClick={close} />
      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[10001] flex flex-col overflow-y-auto"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-serif text-lg font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
          <button onClick={close} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-stone-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Name *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Phone</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Source</Label>
            <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent style={{ zIndex: 10002 }}>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent style={{ zIndex: 10002 }}>
                  <SelectItem value="portraits">Portraits</SelectItem>
                  <SelectItem value="spaces">Workspaces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Stage</Label>
              <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent style={{ zIndex: 10002 }}>
                  {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Linked Workspace</Label>
              <Select value={form.spaceId || "__none__"} onValueChange={v => setForm(p => ({ ...p, spaceId: v === "__none__" ? "" : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent style={{ zIndex: 10002 }}>
                  <SelectItem value="__none__">None</SelectItem>
                  {allSpaces.filter((s: any) => s.id).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Linked Photoshoot</Label>
              <Select value={form.shootId || "__none__"} onValueChange={v => setForm(p => ({ ...p, shootId: v === "__none__" ? "" : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent style={{ zIndex: 10002 }}>
                  <SelectItem value="__none__">None</SelectItem>
                  {allShoots.filter((s: any) => s.id).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Important Facts</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Key facts about this client..." className="h-20 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-stone-100 flex-shrink-0">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={handleSave} className="bg-stone-900 hover:bg-stone-800 text-white">
            <Save className="w-4 h-4 mr-1" /> {editingContact ? "Update" : "Add"}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
