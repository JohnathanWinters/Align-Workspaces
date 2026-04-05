import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, MapPin, CheckCircle2, Loader2, ArrowLeft, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type WeekSchedule = Record<string, { open: string; close: string } | null>;

interface ScheduleInfo {
  adminName: string;
  meetingTitle: string;
  meetingDescription: string | null;
  meetingDurationMinutes: number;
  location: string | null;
  maxDaysInAdvance: number;
  timezone: string;
  weeklySchedule: WeekSchedule | null;
}

export default function BookMeetingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [info, setInfo] = useState<ScheduleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    fetch(`/api/book/${slug}`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }).then(setInfo).catch(() => setError("Schedule not found")).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    fetch(`/api/book/${slug}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, slug]);

  const submit = async () => {
    if (!selectedDate || !selectedTime || !form.name || !form.email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/book/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: form.name, guestEmail: form.email, guestPhone: form.phone, date: selectedDate, time: selectedTime, notes: form.notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to book");
      }
      setBooked(true);
    } catch (err: any) {
      alert(err.message);
    } finally { setSubmitting(false); }
  };

  // Generate available dates
  const getAvailableDates = () => {
    if (!info?.weeklySchedule) return [];
    const days: string[] = [];
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = new Date();
    // Start from tomorrow
    for (let i = 1; i <= (info.maxDaysInAdvance || 30); i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayKey = dayKeys[d.getDay()];
      if (info.weeklySchedule[dayKey]) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        days.push(dateStr);
      }
    }
    return days;
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>;
  if (error || !info) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><p className="text-stone-500">Schedule not found</p></div>;

  if (booked) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Meeting Booked!</h1>
          <p className="text-sm text-stone-500 mb-4">
            Your meeting with <strong>{info.adminName}</strong> has been confirmed.
          </p>
          <div className="bg-stone-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <p className="flex items-center gap-2 text-stone-700"><CalendarDays className="w-4 h-4 text-stone-400" /> {formatDate(selectedDate!)}</p>
            <p className="flex items-center gap-2 text-stone-700"><Clock className="w-4 h-4 text-stone-400" /> {formatTime(selectedTime!)} · {info.meetingDurationMinutes} min</p>
            {info.location && <p className="flex items-center gap-2 text-stone-700"><MapPin className="w-4 h-4 text-stone-400" /> {info.location}</p>}
          </div>
          <p className="text-xs text-stone-400 mt-4">A calendar invite has been sent to your email.</p>
        </motion.div>
      </div>
    );
  }

  const availableDates = getAvailableDates();

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#c4956a]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg font-serif font-bold text-[#c4956a]">{info.adminName.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">{info.meetingTitle}</h1>
          <p className="text-sm text-stone-500 mt-1">{info.adminName} · {info.meetingDurationMinutes} min</p>
          {info.meetingDescription && <p className="text-sm text-stone-400 mt-2">{info.meetingDescription}</p>}
          {info.location && <p className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> {info.location}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedTime ? (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                {/* Step 1: Pick a date */}
                <h2 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-[#c4956a]" /> Select a Date
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 max-h-[240px] overflow-y-auto pr-1">
                  {availableDates.slice(0, 21).map(date => {
                    const d = new Date(date + "T12:00:00");
                    const isSelected = selectedDate === date;
                    return (
                      <button key={date} onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-xl border text-left transition-all ${isSelected ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-100 hover:border-stone-300"}`}>
                        <p className="text-xs text-stone-400">{d.toLocaleDateString(undefined, { weekday: "short" })}</p>
                        <p className="text-sm font-semibold text-stone-800">{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Step 2: Pick a time */}
                {selectedDate && (
                  <>
                    <h2 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#c4956a]" /> Available Times — {formatDate(selectedDate)}
                    </h2>
                    {slotsLoading ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">No available times for this date</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map(time => (
                          <button key={time} onClick={() => setSelectedTime(time)}
                            className="px-3 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:border-stone-900 hover:bg-stone-50 transition-all">
                            {formatTime(time)}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                {/* Step 3: Guest info */}
                <button onClick={() => setSelectedTime(null)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mb-4">
                  <ArrowLeft className="w-3 h-3" /> Back to time selection
                </button>

                <div className="bg-stone-50 rounded-xl p-3 mb-4 text-sm">
                  <p className="font-medium text-stone-700">{formatDate(selectedDate!)}</p>
                  <p className="text-stone-500">{formatTime(selectedTime)} · {info.meetingDurationMinutes} min</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-500 mb-1 block flex items-center gap-1"><User className="w-3 h-3" /> Name *</label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</label>
                    <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Phone (optional)</label>
                    <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 mb-1 block">Notes (optional)</label>
                    <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="What would you like to discuss?" />
                  </div>
                  <Button onClick={submit} disabled={!form.name || !form.email || submitting} className="w-full bg-stone-900 text-white hover:bg-stone-800">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Confirm Booking
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-stone-300 mt-6">Powered by Align</p>
      </div>
    </div>
  );
}
