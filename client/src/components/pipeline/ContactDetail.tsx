import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Send, Phone, CalendarDays, Clock, Instagram, Globe, Camera, Home, Star,
  Edit, Pencil, X, Plus, Trash2, Check, CheckCircle, UserPlus, Users,
  MessageCircle, History, ChevronLeft,
} from "lucide-react";
import type { UsePipelineReturn } from "./use-pipeline";
import { PIPELINE_STAGES, ACTIVITY_TYPES, FOLLOW_UP_QUICK_OPTIONS, TEAM_MEMBERS } from "./types";
import { stageOf, getInitials, computeHealthScore, healthColor, healthTextColor, formatFollowUpDate } from "./utils";
import ContactDetailStageBar from "./ContactDetailStageBar";
import LinkifiedText from "./LinkifiedText";
import FunnelVisualization from "./FunnelVisualization";

interface ContactDetailProps {
  pipeline: UsePipelineReturn;
  isMobile?: boolean;
  onCelebrate?: (type: "stage" | "milestone") => void;
}

export default function ContactDetail({ pipeline, isMobile, onCelebrate }: ContactDetailProps) {
  const {
    selectedContact, selectedContactId, activities, contacts,
    selectContact, moveStage, openEdit, handleDelete, updateContact,
    setFollowUpDate, logActivity, newActivity, setNewActivity,
    referralSearch, setReferralSearch, activityJustLogged,
    stageSuggestion, setStageSuggestion,
    editingActivity, setEditingActivity, confirmDeleteActivity, setConfirmDeleteActivity,
    confirmEditActivity, setConfirmEditActivity, showHistoryFor, setShowHistoryFor,
    deleteActivity, saveEditActivity,
    editingFacts, setEditingFacts, factsText, setFactsText, savingFacts, saveFacts,
    allSpaces, allShoots, activitiesMap, stageCounts,
  } = pipeline;

  // If no contact selected, show empty state with stats
  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-stone-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">Select a contact</h3>
        <p className="text-sm text-gray-400 mb-6">Click a contact to see details, log activities, and manage follow-ups.</p>
        <div className="w-full max-w-sm space-y-4">
          <FunnelVisualization stageCounts={stageCounts} />
        </div>
      </div>
    );
  }

  const c = selectedContact;
  const healthScore = computeHealthScore(c, activities.length);
  const callCount = activities.filter(a => a.type === "call").length;
  const textCount = activities.filter(a => a.type === "text").length;
  const emailCount = activities.filter(a => a.type === "email").length;
  const meetingCount = activities.filter(a => a.type === "meeting").length;
  const totalAttempts = callCount + textCount + emailCount;

  const handleMoveStage = async (newStage: string) => {
    await moveStage(c.id, newStage);
    if (newStage === "booked" || newStage === "completed") {
      onCelebrate?.("stage");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <button onClick={() => selectContact(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors mr-1">
              <ChevronLeft className="w-4 h-4 text-stone-500" />
            </button>
          )}
          <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-stone-600">{getInitials(c.name)}</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold text-stone-900 truncate">{c.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${stageOf(c.stage)?.color || "bg-gray-100"}`}>
                {stageOf(c.stage)?.label}
              </span>
              <span className={`text-[10px] font-semibold ${healthTextColor(healthScore)}`}>{healthScore}</span>
              <div className={`w-2 h-2 rounded-full ${healthColor(healthScore)}`} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(c)}>
            <Edit className="w-3 h-3 mr-1" /> Edit
          </Button>
          {!isMobile && (
            <button onClick={() => selectContact(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-stone-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Stage bar */}
        <ContactDetailStageBar currentStage={c.stage} onMove={handleMoveStage} />

        {/* Contact info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
          {c.email && <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-gray-400" /> {c.email}</span>}
          {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}</span>}
          {c.instagram && <span className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-gray-400" /> @{c.instagram.replace("@", "")}</span>}
          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" /> {c.source}</span>
          <span className="flex items-center gap-1.5 capitalize"><Camera className="w-3.5 h-3.5 text-gray-400" /> {c.category}</span>
        </div>

        {/* Linked workspace / photoshoot */}
        {((c as any).spaceId || (c as any).shootId) && (
          <div className="flex flex-wrap gap-2 text-sm">
            {(c as any).spaceId && (() => {
              const space = allSpaces.find((s: any) => s.id === (c as any).spaceId);
              return space ? <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"><Home className="w-3 h-3" /> {space.name}</span> : null;
            })()}
            {(c as any).shootId && (() => {
              const shoot = allShoots.find((s: any) => s.id === (c as any).shootId);
              return shoot ? <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium"><Camera className="w-3 h-3" /> {shoot.title}</span> : null;
            })()}
          </div>
        )}

        {/* Follow-up */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`flex items-center gap-1.5 cursor-pointer hover:opacity-80 relative ${
              c.nextFollowUp && new Date(c.nextFollowUp) <= new Date() ? "text-red-600 font-medium" : c.nextFollowUp ? "text-gray-500" : "text-gray-400"
            }`}
              onClick={() => {
                const input = document.getElementById("detail-followup-picker") as HTMLInputElement;
                if (input) input.showPicker();
              }}>
              <CalendarDays className="w-3.5 h-3.5" />
              {c.nextFollowUp ? `Follow-up: ${new Date(c.nextFollowUp).toLocaleDateString()}` : "Set follow-up"}
              <input id="detail-followup-picker" type="date" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" min={new Date().toISOString().split("T")[0]}
                value={c.nextFollowUp ? new Date(c.nextFollowUp).toISOString().split("T")[0] : ""}
                onChange={e => setFollowUpDate(c.id, e.target.value, c.stage)}
              />
            </span>
            {c.lastContactDate && (
              <span className="flex items-center gap-1.5 text-gray-400"><Clock className="w-3.5 h-3.5" /> Last: {new Date(c.lastContactDate).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOLLOW_UP_QUICK_OPTIONS.map(opt => {
              const dateStr = formatFollowUpDate(opt.days);
              return (
                <button key={opt.label} onClick={() => setFollowUpDate(c.id, dateStr, c.stage)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors">
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Important Facts */}
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wide"><Star className="w-3.5 h-3.5" /> Important Facts</span>
            {!editingFacts && (
              <button onClick={() => { setEditingFacts(true); setFactsText(c.notes || ""); }}
                className="text-amber-600 hover:text-amber-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
            )}
          </div>
          {editingFacts ? (
            <div className="space-y-2">
              <textarea value={factsText} onChange={e => setFactsText(e.target.value)}
                placeholder="Key facts about this client..."
                className="w-full text-sm bg-white border border-amber-200 rounded-lg p-2.5 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y" autoFocus />
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setEditingFacts(false)} className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                <button disabled={savingFacts} onClick={saveFacts}
                  className="px-2.5 py-1 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50">
                  {savingFacts ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            c.notes
              ? <p className="text-sm text-gray-700 whitespace-pre-wrap"><LinkifiedText text={c.notes} /></p>
              : <p className="text-sm text-gray-400 italic">No facts yet — click the pencil to add some.</p>
          )}
        </div>

        {/* Activity stats */}
        {totalAttempts > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {callCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium"><Phone className="w-3 h-3" /> {callCount}</span>}
            {textCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium"><MessageCircle className="w-3 h-3" /> {textCount}</span>}
            {emailCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-[11px] font-medium"><Send className="w-3 h-3" /> {emailCount}</span>}
            {meetingCount > 0 && <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-medium"><Users className="w-3 h-3" /> {meetingCount}</span>}
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-medium">{totalAttempts} total</span>
          </div>
        )}

        {/* Assigned to */}
        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Assigned To</Label>
          <div className="flex flex-wrap gap-1">
            {TEAM_MEMBERS.map(person => {
              const isAssigned = (c as any).assignedTo === person.key;
              return (
                <button key={person.key} onClick={() => updateContact(c.id, { assignedTo: isAssigned ? null : person.key })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    isAssigned ? person.color + " ring-1 ring-black/10" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}>
                  {person.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Log activity */}
        <div className="bg-stone-50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Log Activity</h4>
          <AnimatePresence>
            {stageSuggestion && stageSuggestion.contactId === c.id && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium">
                <span>Move to <strong>{stageSuggestion.label}</strong>?</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { handleMoveStage(stageSuggestion.to); setStageSuggestion(null); }}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">Yes</button>
                  <button onClick={() => setStageSuggestion(null)}
                    className="px-2.5 py-1 bg-white text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 border border-blue-200 transition-colors">No</button>
                </div>
              </motion.div>
            )}
            {activityJustLogged && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> Activity logged!
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_TYPES.map(a => (
              <button key={a.key} onClick={() => setNewActivity(p => ({ ...p, type: a.key }))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  newActivity.type === a.key ? "bg-stone-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}>
                <a.icon className="w-3 h-3" /> {a.label}
              </button>
            ))}
          </div>
          {newActivity.type === "referral" && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Link to contact</span>
              </div>
              {newActivity.referredContactId ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 flex-1">{contacts.find(cc => cc.id === newActivity.referredContactId)?.name || "Unknown"}</span>
                  <button onClick={() => { setNewActivity(p => ({ ...p, referredContactId: "" })); setReferralSearch(""); }} className="text-blue-400 hover:text-blue-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Input value={referralSearch} onChange={e => setReferralSearch(e.target.value)}
                    placeholder="Search contacts..." className="h-8 text-sm bg-white" />
                  {referralSearch.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto z-50">
                      {contacts
                        .filter(cc => cc.id !== c.id && cc.name.toLowerCase().includes(referralSearch.toLowerCase()))
                        .slice(0, 5)
                        .map(cc => (
                          <button key={cc.id} onClick={() => { setNewActivity(p => ({ ...p, referredContactId: cc.id })); setReferralSearch(""); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-medium text-stone-600">{getInitials(cc.name)}</span>
                            </div>
                            <span className="font-medium text-gray-900">{cc.name}</span>
                            {cc.email && <span className="text-xs text-gray-400 ml-auto">{cc.email}</span>}
                          </button>
                        ))}
                      {contacts.filter(cc => cc.id !== c.id && cc.name.toLowerCase().includes(referralSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-400">No contacts found</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <Textarea value={newActivity.note} onChange={e => setNewActivity(p => ({ ...p, note: e.target.value }))}
            placeholder={newActivity.type === "referral" ? "e.g. Beatriz advised me to reach out to Prince..." : "What happened? Quick notes..."}
            className="h-16 text-sm bg-white" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input type="date" value={newActivity.followUpDate}
                  onChange={e => setNewActivity(p => ({ ...p, followUpDate: e.target.value }))}
                  className="h-8 text-xs bg-white border border-gray-200 rounded-md px-2 flex-1 text-gray-700"
                  min={new Date().toISOString().split("T")[0]} />
                {newActivity.followUpDate && (
                  <button onClick={() => setNewActivity(p => ({ ...p, followUpDate: "" }))} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Button size="sm" onClick={logActivity} className="bg-stone-900 hover:bg-stone-800 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Log
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-gray-400 self-center mr-0.5">Next follow-up:</span>
              {FOLLOW_UP_QUICK_OPTIONS.map(opt => {
                const dateStr = formatFollowUpDate(opt.days);
                return (
                  <button key={opt.label} onClick={() => setNewActivity(p => ({ ...p, followUpDate: dateStr }))}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                      newActivity.followUpDate === dateStr
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                    }`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity history */}
        {activities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">History <span className="text-gray-400 font-normal">({activities.length})</span></h4>
            {activities.map((a: any) => {
              const at = ACTIVITY_TYPES.find(t => t.key === a.type);
              const Icon = at?.icon || Edit;
              const referredContact = a.referredContactId ? contacts.find(cc => cc.id === a.referredContactId) : null;
              const isEditing = editingActivity?.id === a.id;
              const isConfirmingDelete = confirmDeleteActivity === a.id;
              const hasEditHistory = a.editHistory && a.editHistory.length > 0;
              return (
                <div key={a.id} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{at?.label || a.type}</span>
                      <span className="text-[10px] text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() + " " + new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      {hasEditHistory && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                      <div className="ml-auto flex items-center gap-1">
                        {!isEditing && !isConfirmingDelete && (
                          <>
                            <button onClick={() => setEditingActivity({ id: a.id, note: a.note || "" })} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => setConfirmDeleteActivity(a.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {referredContact && (
                      <button onClick={() => selectContact(referredContact.id)} className="flex items-center gap-1.5 mt-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors">
                        <UserPlus className="w-3 h-3" /> {referredContact.name}
                      </button>
                    )}
                    {isConfirmingDelete && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs text-red-700 font-medium mb-2">Are you sure you want to delete this activity?</p>
                        <div className="flex gap-2">
                          <button onClick={() => deleteActivity(a.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Yes, delete</button>
                          <button onClick={() => setConfirmDeleteActivity(null)} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}
                    {isEditing && !confirmEditActivity ? (
                      <div className="mt-1.5">
                        <textarea value={editingActivity!.note}
                          onChange={e => setEditingActivity({ id: editingActivity!.id, note: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-stone-400" rows={2} />
                        <div className="flex gap-2 mt-1.5">
                          <button onClick={() => setConfirmEditActivity(true)} className="px-2 py-1 text-xs bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors flex items-center gap-1">
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => { setEditingActivity(null); setConfirmEditActivity(false); }} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : isEditing && confirmEditActivity ? (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-700 font-medium mb-2">Are you sure you want to save these changes?</p>
                        <div className="flex gap-2">
                          <button onClick={saveEditActivity} className="px-2 py-1 text-xs bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors">Yes, save</button>
                          <button onClick={() => setConfirmEditActivity(false)} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Go back</button>
                        </div>
                      </div>
                    ) : (
                      a.note && <p className="text-sm text-gray-600 mt-0.5"><LinkifiedText text={a.note} /></p>
                    )}
                    {hasEditHistory && !isEditing && (
                      <div className="mt-1">
                        <button onClick={() => setShowHistoryFor(showHistoryFor === a.id ? null : a.id)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                          <History className="w-3 h-3" /> {showHistoryFor === a.id ? "Hide history" : "Show history"}
                        </button>
                        {showHistoryFor === a.id && (
                          <div className="mt-1.5 pl-3 border-l-2 border-gray-200 space-y-1.5">
                            {a.editHistory.map((h: { note: string; editedAt: string }, i: number) => (
                              <div key={i} className="text-xs">
                                <span className="text-gray-400">{new Date(h.editedAt).toLocaleDateString()} {new Date(h.editedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                <p className="text-gray-500 line-through">{h.note}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(c.id)}>
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
        <Button size="sm" variant="outline" onClick={() => selectContact(null)}>Close</Button>
      </div>
    </div>
  );
}
