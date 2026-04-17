import { Phone, MessageCircle, Send, Users, UserPlus, Edit } from "lucide-react";
import type { PipelineContact, PipelineActivity } from "@shared/schema";

export type { PipelineContact, PipelineActivity };

export const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { key: "contacted", label: "Contact", color: "bg-purple-100 text-purple-700" },
  { key: "booked", label: "Scheduled", color: "bg-yellow-100 text-yellow-700" },
  { key: "completed", label: "Active", color: "bg-emerald-100 text-emerald-700" },
  { key: "lost", label: "Not Interested", color: "bg-stone-200 text-stone-500" },
] as const;

export const ACTIVITY_TYPES = [
  { key: "call", label: "Called", icon: Phone },
  { key: "text", label: "Texted", icon: MessageCircle },
  { key: "email", label: "Emailed", icon: Send },
  { key: "meeting", label: "Met", icon: Users },
  { key: "referral", label: "Referral", icon: UserPlus },
  { key: "note", label: "Note", icon: Edit },
] as const;

export const FOLLOW_UP_QUICK_OPTIONS = [
  { label: "Tomorrow", days: 1 },
  { label: "+2 days", days: 2 },
  { label: "+1 week", days: 7 },
  { label: "+2 weeks", days: 14 },
  { label: "+1 month", days: 30 },
] as const;

export const TEAM_MEMBERS = [
  { key: "armando", label: "Armando", color: "bg-blue-50 text-blue-700" },
  { key: "edith", label: "Edith", color: "bg-purple-50 text-purple-700" },
] as const;

export type StageKey = typeof PIPELINE_STAGES[number]["key"];
export type ActivityTypeKey = typeof ACTIVITY_TYPES[number]["key"];

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  source: string;
  category: string;
  stage: string;
  notes: string;
  assignedTo: string;
  nextFollowUp: string;
  spaceId: string;
  shootId: string;
}

export const EMPTY_FORM: ContactForm = {
  name: "", email: "", phone: "", instagram: "", source: "website",
  category: "portraits", stage: "new", notes: "", assignedTo: "",
  nextFollowUp: "", spaceId: "", shootId: "",
};

export interface StageSuggestion {
  contactId: string;
  from: string;
  to: string;
  label: string;
}

export interface NewActivity {
  type: string;
  note: string;
  followUpDate: string;
  referredContactId: string;
}

export const EMPTY_ACTIVITY: NewActivity = {
  type: "call", note: "", followUpDate: "", referredContactId: "",
};
