import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Repeat, Clock, Calendar } from "lucide-react";
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

export default function BookingCalendar({ bookings, recurringBookings, onDayClick }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { year, month } = currentMonth;

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      days.push({
        date: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d, isCurrentMonth: false, isToday: false,
      });
    }

    // Current month
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      days.push({
        date: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d, isCurrentMonth: false, isToday: false,
      });
    }

    return days;
  }, [year, month]);

  // Map dates to bookings
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingForCalendar[]>();
    for (const b of bookings) {
      if (!b.bookingDate) continue;
      if (!map.has(b.bookingDate)) map.set(b.bookingDate, []);
      map.get(b.bookingDate)!.push(b);
    }
    return map;
  }, [bookings]);

  // Project recurring booking dates onto visible calendar
  const recurringProjections = useMemo(() => {
    const map = new Map<string, RecurringForCalendar[]>();
    for (const rb of recurringBookings) {
      if (rb.status !== "confirmed" && rb.status !== "active" && rb.status !== "pending_confirmation") continue;
      for (const day of calendarDays) {
        const d = new Date(day.date + "T12:00:00");
        if (d.getDay() !== rb.dayOfWeek) continue;
        if (day.date < rb.startDate) continue;
        if (rb.endDate && day.date > rb.endDate) continue;
        const existing = bookingsByDate.get(day.date) || [];
        if (existing.some(b => b.recurringBookingId === rb.id)) continue;
        if (!map.has(day.date)) map.set(day.date, []);
        map.get(day.date)!.push(rb);
      }
    }
    return map;
  }, [recurringBookings, calendarDays, bookingsByDate]);

  const prevMonth = () => setCurrentMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 });
  const nextMonth = () => setCurrentMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 });
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long" });
  const yearLabel = String(year);

  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) || []) : [];
  const selectedRecurring = selectedDate ? (recurringProjections.get(selectedDate) || []) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl text-[#2c2420] leading-tight">{monthLabel}</h3>
          <p className="text-xs text-stone-400 font-medium">{yearLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goToToday} className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#c4956a] hover:bg-[#c4956a]/10 transition-colors">
            Today
          </button>
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-stone-500" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-stone-400 uppercase tracking-widest pb-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
        {calendarDays.map((day) => {
          const dayBookings = bookingsByDate.get(day.date) || [];
          const dayRecurring = recurringProjections.get(day.date) || [];
          const hasContent = dayBookings.length > 0 || dayRecurring.length > 0;
          const isSelected = selectedDate === day.date;

          // Pick earliest booking by start time for cover photo
          const sorted = [...dayBookings].sort((a, b) => (a.bookingStartTime || "99:99").localeCompare(b.bookingStartTime || "99:99"));
          const earliest = sorted[0];
          const earliestRec = dayRecurring.length > 0
            ? [...dayRecurring].sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
            : null;

          let coverImage: string | null = null;
          let isRecurring = false;
          let isPending = false;
          if (earliest?.spaceImageUrl) {
            coverImage = earliest.spaceImageUrl;
            isRecurring = !!earliest.recurringBookingId;
          } else if (earliestRec?.spaceImage) {
            coverImage = earliestRec.spaceImage;
            isRecurring = true;
            isPending = earliestRec.status === "pending_confirmation";
          }

          const totalCount = dayBookings.length + dayRecurring.length;

          return (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDate(isSelected ? null : day.date);
                if (onDayClick && hasContent) onDayClick(day.date, dayBookings);
              }}
              className={`
                relative aspect-square overflow-hidden transition-all duration-150
                ${day.isCurrentMonth ? "bg-white" : "bg-stone-50/80"}
                ${isSelected ? "z-10 ring-2 ring-[#c4956a] shadow-md" : ""}
                ${hasContent ? "cursor-pointer group" : ""}
              `}
              data-testid={`calendar-day-${day.date}`}
            >
              {/* Cover photo — full bleed with gradient overlay */}
              {coverImage && (
                <>
                  <img
                    src={coverImage}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
                      isPending ? "opacity-35 grayscale-[30%]" : day.isCurrentMonth ? "" : "opacity-25"
                    }`}
                  />
                  {/* Gradient overlays for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
                </>
              )}

              {/* Day number */}
              <div className="relative z-10 p-[3px]">
                <span className={`
                  flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-semibold leading-none
                  ${day.isToday
                    ? "bg-[#c4956a] text-white shadow-sm"
                    : coverImage
                      ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                      : day.isCurrentMonth
                        ? "text-stone-700"
                        : "text-stone-300"
                  }
                `}>
                  {day.day}
                </span>
              </div>

              {/* Bottom indicators */}
              {hasContent && (
                <div className="absolute bottom-[3px] right-[3px] z-10 flex items-center gap-[3px]">
                  {isRecurring && (
                    <span className="w-[18px] h-[18px] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                      <Repeat className="w-[10px] h-[10px] text-[#c4956a]" />
                    </span>
                  )}
                  {totalCount > 1 && (
                    <span className="w-[18px] h-[18px] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[9px] font-bold text-stone-700 shadow-sm">
                      {totalCount}
                    </span>
                  )}
                </div>
              )}

              {/* Empty day dot — subtle indicator for days without bookings */}
              {!hasContent && day.isCurrentMonth && !day.isToday && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDate && (selectedBookings.length > 0 || selectedRecurring.length > 0) && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#c4956a]" />
            <h4 className="text-sm font-semibold text-[#2c2420]">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h4>
          </div>

          <div className="space-y-2">
            {selectedBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow transition-shadow">
                {b.spaceImageUrl ? (
                  <img src={b.spaceImageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-stone-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-[#2c2420] truncate">{b.spaceName}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      b.role === "guest" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {b.role === "guest" ? "Guest" : "Host"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{b.bookingStartTime ? formatTime(b.bookingStartTime) : "TBD"}</span>
                    <span className="text-stone-300">|</span>
                    <span>{b.bookingHours}hr{(b.bookingHours || 0) > 1 ? "s" : ""}</span>
                    {b.recurringBookingId && (
                      <>
                        <span className="text-stone-300">|</span>
                        <span className="flex items-center gap-0.5 text-[#c4956a] font-medium">
                          <Repeat className="w-3 h-3" /> Weekly
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge className={`text-[10px] font-medium flex-shrink-0 ${
                  b.status === "approved" || b.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  b.status === "awaiting_payment" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  b.status === "checked_in" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  b.status === "completed" ? "bg-stone-100 text-stone-500 border-stone-200" :
                  "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {b.status === "awaiting_payment" ? "Pay Now" :
                   b.status === "approved" ? "Confirmed" :
                   b.status === "checked_in" ? "In Session" :
                   b.status || "Unknown"}
                </Badge>
              </div>
            ))}

            {selectedRecurring.map((rb) => (
              <div key={rb.id} className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm ${
                rb.status === "pending_confirmation"
                  ? "bg-amber-50/50 border-amber-200/60"
                  : "bg-[#faf8f5] border-[#e0d5c7]/60"
              }`}>
                {rb.spaceImage ? (
                  <img src={rb.spaceImage} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <Repeat className="w-5 h-5 text-stone-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-[#2c2420] truncate">{rb.spaceName}</p>
                    <Repeat className="w-3.5 h-3.5 text-[#c4956a] flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{formatTime(rb.startTime)}</span>
                    <span className="text-stone-300">|</span>
                    <span>{rb.hours}hr{rb.hours > 1 ? "s" : ""}</span>
                  </div>
                </div>
                <Badge className={`text-[10px] font-medium flex-shrink-0 ${
                  rb.status === "pending_confirmation"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-[#c4956a]/10 text-[#c4956a] border-[#c4956a]/20"
                }`}>
                  {rb.status === "pending_confirmation" ? "Pending" : "Recurring"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no bookings at all */}
      {bookings.length === 0 && recurringBookings.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-stone-400">Bookings will appear on the calendar as you book spaces.</p>
        </div>
      )}
    </div>
  );
}
