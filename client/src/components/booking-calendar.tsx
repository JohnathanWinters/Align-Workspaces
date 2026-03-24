import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Repeat, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingForCalendar {
  id: string;
  bookingDate: string | null;
  bookingStartTime: string | null;
  bookingHours: number | null;
  spaceName: string;
  spaceImageUrl?: string | null;
  status: string | null;
  paymentStatus: string | null;
  role: "guest" | "host";
  recurringBookingId?: string | null;
}

interface RecurringForCalendar {
  id: string;
  dayOfWeek: number;
  startTime: string;
  hours: number;
  startDate: string;
  endDate: string | null;
  status: string | null;
  spaceName: string;
  spaceImage: string | null;
  role: string;
}

interface BookingCalendarProps {
  bookings: BookingForCalendar[];
  recurringBookings: RecurringForCalendar[];
  onDayClick?: (date: string, bookings: BookingForCalendar[]) => void;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Get the Sunday that starts the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function BookingCalendar({ bookings, recurringBookings, onDayClick }: BookingCalendarProps) {
  // Find the best initial week: closest week with a booking, or current week
  const initialWeekStart = useMemo(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const thisWeekStart = getWeekStart(now);

    if (bookings.length === 0) return thisWeekStart;

    // Get all booking dates
    const dates = bookings
      .map(b => b.bookingDate)
      .filter(Boolean)
      .sort() as string[];

    if (dates.length === 0) return thisWeekStart;

    // Find the closest booking date to today (prefer future)
    const todayStr = toDateStr(now);
    const futureDate = dates.find(d => d >= todayStr);
    const pastDate = [...dates].reverse().find(d => d < todayStr);

    let targetDate: string;
    if (futureDate) {
      targetDate = futureDate;
    } else if (pastDate) {
      targetDate = pastDate;
    } else {
      return thisWeekStart;
    }

    return getWeekStart(new Date(targetDate + "T12:00:00"));
  }, [bookings]);

  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build the 7 days of the current week
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayStr = toDateStr(today);

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const dateStr = toDateStr(d);
      return {
        date: dateStr,
        day: d.getDate(),
        dayOfWeek: d.getDay(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isToday: dateStr === todayStr,
      };
    });
  }, [weekStart]);

  // Bookings indexed by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingForCalendar[]>();
    for (const b of bookings) {
      if (!b.bookingDate) continue;
      if (!map.has(b.bookingDate)) map.set(b.bookingDate, []);
      map.get(b.bookingDate)!.push(b);
    }
    return map;
  }, [bookings]);

  // Project recurring bookings onto this week
  const recurringProjections = useMemo(() => {
    const map = new Map<string, RecurringForCalendar[]>();
    for (const rb of recurringBookings) {
      if (rb.status !== "confirmed" && rb.status !== "active" && rb.status !== "pending_confirmation") continue;
      for (const day of weekDays) {
        if (day.dayOfWeek !== rb.dayOfWeek) continue;
        if (day.date < rb.startDate) continue;
        if (rb.endDate && day.date > rb.endDate) continue;
        const existing = bookingsByDate.get(day.date) || [];
        if (existing.some(b => b.recurringBookingId === rb.id)) continue;
        if (!map.has(day.date)) map.set(day.date, []);
        map.get(day.date)!.push(rb);
      }
    }
    return map;
  }, [recurringBookings, weekDays, bookingsByDate]);

  const prevWeek = () => setWeekStart(s => addDays(s, -7));
  const nextWeek = () => setWeekStart(s => addDays(s, 7));
  const goToThisWeek = () => setWeekStart(getWeekStart(new Date()));

  // Week label: "Mar 24 – 30, 2026" or "Mar 28 – Apr 3, 2026"
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const weekLabel = sameMonth
    ? `${weekStart.toLocaleDateString("en-US", { month: "short" })} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : `${weekStart.toLocaleDateString("en-US", { month: "short" })} ${weekStart.getDate()} – ${weekEnd.toLocaleDateString("en-US", { month: "short" })} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) || []) : [];
  const selectedRecurring = selectedDate ? (recurringProjections.get(selectedDate) || []) : [];

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-[#2c2420]">{weekLabel}</h3>
        <div className="flex items-center gap-1">
          <button onClick={goToThisWeek} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#c4956a] hover:bg-[#c4956a]/10 transition-colors mr-1">
            This week
          </button>
          <button onClick={prevWeek} className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          </button>
          <button onClick={nextWeek} className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-[2px] rounded-xl overflow-hidden bg-stone-200">
        {weekDays.map((day) => {
          const dayBookings = bookingsByDate.get(day.date) || [];
          const dayRecurring = recurringProjections.get(day.date) || [];
          const hasContent = dayBookings.length > 0 || dayRecurring.length > 0;
          const isSelected = selectedDate === day.date;

          // Earliest booking for cover photo
          const sorted = [...dayBookings].sort((a, b) => (a.bookingStartTime || "99:99").localeCompare(b.bookingStartTime || "99:99"));
          const earliest = sorted[0];
          const earliestRec = dayRecurring.length > 0
            ? [...dayRecurring].sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
            : null;
          const photoUrl = earliest?.spaceImageUrl || earliestRec?.spaceImage || null;
          const isPending = !earliest && earliestRec?.status === "pending_confirmation";
          const isRecurring = !!earliest?.recurringBookingId || (dayRecurring.length > 0 && !earliest);
          const totalCount = dayBookings.length + dayRecurring.length;

          return (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDate(isSelected ? null : day.date);
                if (onDayClick && hasContent) onDayClick(day.date, dayBookings);
              }}
              className={`
                relative overflow-hidden group flex flex-col
                ${isSelected ? "ring-2 ring-[#c4956a] z-10" : ""}
                ${hasContent ? "cursor-pointer" : ""}
                ${photoUrl ? "bg-stone-900" : "bg-white"}
              `}
              style={{ aspectRatio: "1 / 1.15" }}
              data-testid={`calendar-day-${day.date}`}
            >
              {/* Full-bleed photo */}
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                    isPending ? "opacity-40" : ""
                  }`}
                />
              )}

              {/* Scrim on photo cells */}
              {photoUrl && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/40" />
              )}

              {/* Day name + number */}
              <div className="relative z-10 flex flex-col items-center pt-1.5 gap-0.5">
                <span className={`text-[9px] font-medium uppercase tracking-wide ${
                  photoUrl ? "text-white/70" : "text-stone-400"
                }`}>
                  {DAY_NAMES[day.dayOfWeek]}
                </span>
                <span className={`
                  text-[14px] font-bold leading-none flex items-center justify-center
                  ${day.isToday
                    ? "w-7 h-7 rounded-full bg-[#c4956a] text-white"
                    : photoUrl
                      ? "text-white"
                      : "text-stone-700"
                  }
                `}>
                  {day.day}
                </span>
              </div>

              {/* Bottom indicators */}
              {hasContent && (totalCount > 1 || isRecurring) && (
                <div className="absolute bottom-1.5 inset-x-0 z-10 flex items-center justify-center gap-1">
                  {isRecurring && (
                    <Repeat className={`w-3 h-3 ${photoUrl ? "text-white/80" : "text-[#c4956a]"}`} />
                  )}
                  {totalCount > 1 && (
                    <span className={`text-[9px] font-bold ${photoUrl ? "text-white/80" : "text-stone-400"}`}>
                      +{totalCount - 1}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (selectedBookings.length > 0 || selectedRecurring.length > 0) && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-stone-500">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>

          {selectedBookings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200 shadow-sm">
              {b.spaceImageUrl ? (
                <img src={b.spaceImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-stone-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#2c2420] truncate">{b.spaceName}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    b.role === "guest" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {b.role === "guest" ? "Guest" : "Host"}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {b.bookingStartTime ? formatTime(b.bookingStartTime) : "TBD"} · {b.bookingHours}hr{(b.bookingHours || 0) > 1 ? "s" : ""}
                  {b.recurringBookingId && (
                    <span className="text-[#c4956a] flex items-center gap-0.5 font-medium"><Repeat className="w-3 h-3" />Weekly</span>
                  )}
                </p>
              </div>
              <Badge className={`text-[10px] ${
                b.status === "approved" || b.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                b.status === "awaiting_payment" ? "bg-amber-50 text-amber-700 border-amber-200" :
                b.status === "checked_in" ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-stone-100 text-stone-500 border-stone-200"
              }`}>
                {b.status === "awaiting_payment" ? "Pay Now" :
                 b.status === "approved" ? "Confirmed" :
                 b.status === "checked_in" ? "In Session" :
                 b.status === "completed" ? "Completed" : b.status || ""}
              </Badge>
            </div>
          ))}

          {selectedRecurring.map((rb) => (
            <div key={rb.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
              rb.status === "pending_confirmation" ? "bg-amber-50/40 border-amber-200" : "bg-[#faf8f5] border-[#e0d5c7]"
            }`}>
              {rb.spaceImage ? (
                <img src={rb.spaceImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Repeat className="w-4 h-4 text-stone-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2c2420] truncate">{rb.spaceName}</p>
                <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(rb.startTime)} · {rb.hours}hr{rb.hours > 1 ? "s" : ""}
                </p>
              </div>
              <Badge className={`text-[10px] ${
                rb.status === "pending_confirmation" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-[#c4956a]/10 text-[#c4956a] border-[#c4956a]/20"
              }`}>
                {rb.status === "pending_confirmation" ? "Pending" : "Recurring"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
