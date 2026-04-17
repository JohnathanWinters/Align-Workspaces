import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { PipelineContact, PipelineActivity, ContactForm, NewActivity, StageSuggestion } from "./types";
import { EMPTY_FORM, EMPTY_ACTIVITY } from "./types";
import { needsAttention, hasUpcomingFollowUp, sortByStageAndOverdue } from "./utils";

export function usePipeline(token: string) {
  const { toast } = useToast();

  // Core data
  const [contacts, setContacts] = useState<PipelineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, PipelineActivity[]>>({});
  const [allSpaces, setAllSpaces] = useState<any[]>([]);
  const [allShoots, setAllShoots] = useState<any[]>([]);

  // Selection
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Filters
  const [filter, setFilter] = useState<"all" | "portraits" | "spaces">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [assignedFilter, setAssignedFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"follow-up" | "last-contact" | "date-added">("follow-up");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<PipelineContact | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);

  // Activity logging
  const [newActivity, setNewActivity] = useState<NewActivity>(EMPTY_ACTIVITY);
  const [referralSearch, setReferralSearch] = useState("");
  const [activityJustLogged, setActivityJustLogged] = useState(false);
  const [stageSuggestion, setStageSuggestion] = useState<StageSuggestion | null>(null);

  // Activity editing
  const [editingActivity, setEditingActivity] = useState<{ id: string; note: string } | null>(null);
  const [confirmDeleteActivity, setConfirmDeleteActivity] = useState<string | null>(null);
  const [confirmEditActivity, setConfirmEditActivity] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  // Facts editing
  const [editingFacts, setEditingFacts] = useState(false);
  const [factsText, setFactsText] = useState("");
  const [savingFacts, setSavingFacts] = useState(false);

  // CSV import
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Quick-log
  const [quickLogContactId, setQuickLogContactId] = useState<string | null>(null);

  // Gamification callback (set from outside)
  const onActivityLoggedRef = useRef<() => void>(() => {});

  // ── API helper ──
  const adminFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    return fetch(url, { ...opts, headers: { ...opts.headers as any, Authorization: `Bearer ${token}` } });
  }, [token]);

  // ── Load data ──
  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/pipeline");
      if (res.ok) setContacts(await res.json());
    } catch {} finally { setLoading(false); }
  }, [adminFetch]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    adminFetch("/api/admin/spaces/all").then(r => r.ok ? r.json() : []).then(d => setAllSpaces(Array.isArray(d) ? d : [])).catch(() => {});
    adminFetch("/api/admin/shoots").then(r => r.ok ? r.json() : []).then(d => setAllShoots(Array.isArray(d) ? d : [])).catch(() => {});
  }, [adminFetch]);

  const loadActivities = useCallback(async (contactId: string) => {
    try {
      const res = await adminFetch(`/api/admin/pipeline/${contactId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivitiesMap(prev => ({ ...prev, [contactId]: data }));
      }
    } catch {}
  }, [adminFetch]);

  // ── Derived state ──
  const selectedContact = useMemo(
    () => selectedContactId ? contacts.find(c => c.id === selectedContactId) || null : null,
    [contacts, selectedContactId]
  );

  const activities = useMemo(
    () => selectedContactId ? activitiesMap[selectedContactId] || [] : [],
    [activitiesMap, selectedContactId]
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (filter !== "all" && c.category !== filter) return false;
      if (stageFilter && c.stage !== stageFilter) return false;
      if (assignedFilter === "unassigned" && (c as any).assignedTo) return false;
      if (assignedFilter && assignedFilter !== "unassigned" && (c as any).assignedTo !== assignedFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "follow-up") {
        const aDate = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : Infinity;
        const bDate = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : Infinity;
        return aDate - bDate;
      }
      if (sortBy === "last-contact") {
        const aDate = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
        const bDate = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
        return aDate - bDate;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [contacts, filter, stageFilter, assignedFilter, searchQuery, sortBy]);

  const attentionContacts = useMemo(() => {
    return filteredContacts.filter(needsAttention).sort(sortByStageAndOverdue);
  }, [filteredContacts]);

  const upcomingContacts = useMemo(() => {
    return filteredContacts.filter(hasUpcomingFollowUp).sort(sortByStageAndOverdue);
  }, [filteredContacts]);

  const restContacts = useMemo(() => {
    const attentionIds = new Set(attentionContacts.map(c => c.id));
    const upcomingIds = new Set(upcomingContacts.map(c => c.id));
    return filteredContacts.filter(c => !attentionIds.has(c.id) && !upcomingIds.has(c.id)).sort(sortByStageAndOverdue);
  }, [filteredContacts, attentionContacts, upcomingContacts]);

  // Flat list for keyboard nav
  const flatContactList = useMemo(() => {
    return [...attentionContacts, ...upcomingContacts, ...restContacts];
  }, [attentionContacts, upcomingContacts, restContacts]);

  const stageCounts = useMemo(() => {
    const filtered = contacts.filter(c => {
      if (filter !== "all" && c.category !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.phone || "").includes(q);
      }
      return true;
    });
    const counts: Record<string, number> = {};
    filtered.forEach(c => { counts[c.stage] = (counts[c.stage] || 0) + 1; });
    return counts;
  }, [contacts, filter, searchQuery]);

  // ── Actions ──
  const selectContact = useCallback(async (id: string | null) => {
    setSelectedContactId(id);
    setEditingFacts(false);
    setStageSuggestion(null);
    setEditingActivity(null);
    setConfirmDeleteActivity(null);
    setConfirmEditActivity(false);
    setShowHistoryFor(null);
    setNewActivity(EMPTY_ACTIVITY);
    setReferralSearch("");
    if (id && !activitiesMap[id]) {
      await loadActivities(id);
    }
  }, [activitiesMap, loadActivities]);

  const moveStage = useCallback(async (contactId: string, newStage: string) => {
    try {
      await adminFetch(`/api/admin/pipeline/${contactId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      await loadContacts();
    } catch {}
  }, [adminFetch, loadContacts]);

  const quickLogActivity = useCallback(async (contactId: string, type: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await adminFetch(`/api/admin/pipeline/${contactId}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      await loadContacts();
      if (selectedContactId === contactId) await loadActivities(contactId);
      onActivityLoggedRef.current();
      toast({ title: `${type === "call" ? "Call" : type === "email" ? "Email" : type === "text" ? "Text" : "Activity"} logged` });
    } catch {}
  }, [adminFetch, loadContacts, loadActivities, selectedContactId, toast]);

  const snoozeFollowUp = useCallback(async (contactId: string, days: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Date();
    next.setDate(next.getDate() + days);
    try {
      await adminFetch(`/api/admin/pipeline/${contactId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextFollowUp: next.toISOString() }),
      });
      await loadContacts();
      toast({ title: `Follow-up snoozed ${days} day${days > 1 ? "s" : ""}` });
    } catch {}
  }, [adminFetch, loadContacts, toast]);

  const setFollowUpDate = useCallback(async (contactId: string, dateStr: string, currentStage?: string) => {
    if (!dateStr) return;
    try {
      const patch: any = { nextFollowUp: new Date(dateStr + "T00:00:00").toISOString() };
      if (currentStage === "new") patch.stage = "contacted";
      await adminFetch(`/api/admin/pipeline/${contactId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await loadContacts();
      toast({ title: currentStage === "new" ? "Follow-up set · Moved to Contact" : "Follow-up date set" });
    } catch {}
  }, [adminFetch, loadContacts, toast]);

  const logActivity = useCallback(async () => {
    if (!selectedContactId) return;
    try {
      const payload: any = { type: newActivity.type, note: newActivity.note };
      if (newActivity.followUpDate) payload.followUpDate = new Date(newActivity.followUpDate + "T00:00:00").toISOString();
      if (newActivity.referredContactId) payload.referredContactId = newActivity.referredContactId;
      await adminFetch(`/api/admin/pipeline/${selectedContactId}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const actType = newActivity.type;
      setNewActivity(EMPTY_ACTIVITY);
      setReferralSearch("");
      setActivityJustLogged(true);
      setTimeout(() => setActivityJustLogged(false), 3000);
      await loadActivities(selectedContactId);
      await loadContacts();
      onActivityLoggedRef.current();
      toast({ title: `Activity logged${newActivity.followUpDate ? " · Follow-up set" : ""}` });
      // Stage suggestion
      const contact = contacts.find(c => c.id === selectedContactId);
      if (contact) {
        if (contact.stage === "new" && ["call", "text", "email", "referral"].includes(actType)) {
          setStageSuggestion({ contactId: selectedContactId, from: "new", to: "contacted", label: "Contact" });
        } else if (contact.stage === "contacted" && actType === "meeting") {
          setStageSuggestion({ contactId: selectedContactId, from: "contacted", to: "booked", label: "Scheduled" });
        }
      }
    } catch {}
  }, [selectedContactId, newActivity, adminFetch, loadActivities, loadContacts, contacts, toast]);

  const quickLogInline = useCallback(async (contactId: string, type: string, note: string, followUpDays?: number) => {
    try {
      const payload: any = { type, note };
      if (followUpDays) {
        const d = new Date();
        d.setDate(d.getDate() + followUpDays);
        payload.followUpDate = d.toISOString();
      }
      await adminFetch(`/api/admin/pipeline/${contactId}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setQuickLogContactId(null);
      await loadContacts();
      if (selectedContactId === contactId) await loadActivities(contactId);
      onActivityLoggedRef.current();
      toast({ title: "Activity logged" });
    } catch {}
  }, [adminFetch, loadContacts, loadActivities, selectedContactId, toast]);

  const deleteActivity = useCallback(async (activityId: string) => {
    if (!selectedContactId) return;
    try {
      const res = await adminFetch(`/api/admin/pipeline/activities/${activityId}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDeleteActivity(null);
        await loadActivities(selectedContactId);
        toast({ title: "Activity deleted" });
      }
    } catch {}
  }, [selectedContactId, adminFetch, loadActivities, toast]);

  const saveEditActivity = useCallback(async () => {
    if (!editingActivity || !selectedContactId) return;
    try {
      const res = await adminFetch(`/api/admin/pipeline/activities/${editingActivity.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editingActivity.note }),
      });
      if (res.ok) {
        setEditingActivity(null);
        setConfirmEditActivity(false);
        await loadActivities(selectedContactId);
        toast({ title: "Activity updated" });
      }
    } catch {}
  }, [editingActivity, selectedContactId, adminFetch, loadActivities, toast]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    try {
      const body: any = { ...form };
      if (form.nextFollowUp) body.nextFollowUp = new Date(form.nextFollowUp).toISOString();
      else if (!editingContact) body.nextFollowUp = new Date().toISOString();
      else body.nextFollowUp = null;
      body.spaceId = form.spaceId || null;
      body.shootId = form.shootId || null;
      body.assignedTo = form.assignedTo || null;
      if (editingContact) {
        await adminFetch(`/api/admin/pipeline/${editingContact.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        toast({ title: "Contact updated" });
      } else {
        await adminFetch("/api/admin/pipeline", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        toast({ title: "Contact added" });
      }
      setShowForm(false); setEditingContact(null);
      setForm(EMPTY_FORM);
      await loadContacts();
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
  }, [form, editingContact, adminFetch, loadContacts, toast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await adminFetch(`/api/admin/pipeline/${id}`, { method: "DELETE" });
      if (selectedContactId === id) setSelectedContactId(null);
      await loadContacts();
      toast({ title: "Contact deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  }, [adminFetch, selectedContactId, loadContacts, toast]);

  const updateContact = useCallback(async (contactId: string, patch: Record<string, any>) => {
    try {
      await adminFetch(`/api/admin/pipeline/${contactId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await loadContacts();
    } catch {}
  }, [adminFetch, loadContacts]);

  const saveFacts = useCallback(async () => {
    if (!selectedContactId) return;
    setSavingFacts(true);
    try {
      const res = await adminFetch(`/api/admin/pipeline/${selectedContactId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: factsText.trim() || null }),
      });
      if (res.ok) {
        setEditingFacts(false);
        await loadContacts();
      }
    } catch {} finally { setSavingFacts(false); }
  }, [selectedContactId, factsText, adminFetch, loadContacts]);

  const openEdit = useCallback((contact: PipelineContact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name, email: contact.email || "", phone: contact.phone || "",
      instagram: contact.instagram || "", source: contact.source || "website",
      category: contact.category || "portraits", stage: contact.stage,
      notes: contact.notes || "", assignedTo: (contact as any).assignedTo || "",
      nextFollowUp: contact.nextFollowUp ? new Date(contact.nextFollowUp).toISOString().split("T")[0] : "",
      spaceId: (contact as any).spaceId || "", shootId: (contact as any).shootId || "",
    });
    setShowForm(true);
  }, []);

  const openAddForm = useCallback(() => {
    setShowForm(true);
    setEditingContact(null);
    setForm(EMPTY_FORM);
  }, []);

  // Import/Export
  const importLeads = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/pipeline/import-leads", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Imported ${data.imported} leads` });
        await loadContacts();
      }
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
  }, [adminFetch, loadContacts, toast]);

  const syncSpaceContacts = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/pipeline/sync-space-contacts", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Synced ${data.total} workspaces · ${data.created} new contact${data.created === 1 ? "" : "s"}` });
        await loadContacts();
      }
    } catch { toast({ title: "Sync failed", variant: "destructive" }); }
  }, [adminFetch, loadContacts, toast]);

  const exportCsv = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/pipeline/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "pipeline-contacts.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  }, [adminFetch, toast]);

  const importCsv = useCallback(async () => {
    if (!csvText.trim()) return;
    try {
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: any = {};
        headers.forEach((h, i) => {
          const key = h === "next follow-up" ? "nextFollowUp" : h === "last contact" ? "lastContactDate" :
            h === "estimated value" ? "estimatedValue" : h;
          row[key] = vals[i] || "";
        });
        return row;
      }).filter(r => r.name);
      const res = await adminFetch("/api/admin/pipeline/import-csv", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Imported ${data.imported} contacts` });
        setShowImportCsv(false); setCsvText("");
        await loadContacts();
      }
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
  }, [csvText, adminFetch, loadContacts, toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCsvText(ev.target?.result as string || ""); };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  return {
    // Data
    contacts, loading, allSpaces, allShoots,
    selectedContact, selectedContactId, activities, activitiesMap,
    filteredContacts, attentionContacts, upcomingContacts, restContacts,
    flatContactList, stageCounts,
    focusedIndex, setFocusedIndex,

    // Filters
    filter, setFilter, searchQuery, setSearchQuery,
    stageFilter, setStageFilter, assignedFilter, setAssignedFilter,
    sortBy, setSortBy,

    // Selection
    selectContact,

    // Actions
    moveStage, quickLogActivity, snoozeFollowUp, setFollowUpDate,
    logActivity, quickLogInline, deleteActivity, saveEditActivity,
    handleSave, handleDelete, updateContact, saveFacts,
    openEdit, openAddForm, loadContacts, loadActivities,
    importLeads, syncSpaceContacts, exportCsv, importCsv, handleFileUpload,

    // Form state
    showForm, setShowForm, editingContact, setEditingContact, form, setForm,

    // Activity state
    newActivity, setNewActivity, referralSearch, setReferralSearch,
    activityJustLogged, stageSuggestion, setStageSuggestion,
    editingActivity, setEditingActivity,
    confirmDeleteActivity, setConfirmDeleteActivity,
    confirmEditActivity, setConfirmEditActivity,
    showHistoryFor, setShowHistoryFor,

    // Facts state
    editingFacts, setEditingFacts, factsText, setFactsText, savingFacts,

    // CSV
    showImportCsv, setShowImportCsv, csvText, setCsvText, fileRef,

    // Quick-log
    quickLogContactId, setQuickLogContactId,

    // Gamification hook
    onActivityLoggedRef,
  };
}

export type UsePipelineReturn = ReturnType<typeof usePipeline>;
