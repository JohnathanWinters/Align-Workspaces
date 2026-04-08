import { PIPELINE_STAGES, type PipelineContact } from "./types";

export function stageOf(key: string) {
  return PIPELINE_STAGES.find(s => s.key === key);
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function daysAgo(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function overdueLabel(days: number): string {
  if (days <= 0) return "Due today";
  if (days === 1) return "1 day overdue";
  if (days < 7) return `${days} days overdue`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week overdue" : `${weeks} weeks overdue`;
}

export function noActionLabel(days: number): string {
  if (days === 1) return "Added 1 day ago";
  if (days < 7) return `Added ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "Added 1 week ago" : `Added ${weeks} weeks ago`;
}

export function formatFollowUpDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getRelativeFollowUpLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `in ${diffDays} days`;
}

/** Health score 0-100 for a contact */
export function computeHealthScore(
  contact: PipelineContact,
  activityCount: number = 0
): number {
  let score = 0;

  // Recency (40 pts): how recently was contact last reached
  if (contact.lastContactDate) {
    const days = daysAgo(contact.lastContactDate);
    if (days <= 7) score += 40;
    else if (days <= 14) score += 30;
    else if (days <= 30) score += 15;
    else score += 0;
  }

  // Follow-up compliance (30 pts)
  if (contact.nextFollowUp) {
    const fuDate = new Date(contact.nextFollowUp);
    if (fuDate > new Date()) {
      score += 30; // future follow-up set
    } else {
      const overdueDays = daysAgo(contact.nextFollowUp);
      if (overdueDays <= 3) score += 15;
      // 7+ days overdue = 0
    }
  } else if (contact.stage === "completed") {
    score += 20; // active clients don't always need follow-ups
  }

  // Stage progress (20 pts)
  const stagePoints: Record<string, number> = {
    completed: 20, booked: 15, contacted: 10, new: 5, lost: 0,
  };
  score += stagePoints[contact.stage] || 0;

  // Activity density (10 pts)
  if (activityCount >= 5) score += 10;
  else if (activityCount >= 3) score += 7;
  else if (activityCount >= 1) score += 4;

  return Math.min(100, score);
}

export function healthColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function healthTextColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

/** Check if contact needs attention */
export function needsAttention(c: PipelineContact): boolean {
  return (
    (!!c.nextFollowUp && !isNaN(new Date(c.nextFollowUp).getTime()) && new Date(c.nextFollowUp) <= new Date()) ||
    (c.stage === "new" && !!c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) > 2 * 24 * 60 * 60 * 1000)
  );
}

/** Check if contact has upcoming follow-up (next 7 days, not overdue) */
export function hasUpcomingFollowUp(c: PipelineContact): boolean {
  if (!c.nextFollowUp || isNaN(new Date(c.nextFollowUp).getTime())) return false;
  const fuDate = new Date(c.nextFollowUp);
  const now = new Date();
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  return fuDate > now && fuDate <= weekEnd;
}
