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

export default function BookingCalendar({ bookings, recurringBookings, onDayClick }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { year, month } = currentMonth;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      days.push({ date: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, isCurrentMonth: false, isToday: false });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      days.push({ date: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingForCalendar[]>();
    for (const b of bookings) {
      if (!b.bookingDate) continue;
      if (!map.has(b.bookingDate)) map.set(b.bookingDate, []);
      map.get(b.bookingDate)!.push(b);
    }
    return map;
  }, [bookings]);

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
  const goToToday = () => { const now = new Date(); setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() }); };

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) || []) : [];
  const selectedRecurring = selectedDate ? (recurringProjections.get(selectedDate) || []) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-lg text-[#2c2420]">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button onClick={goToToday} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#c4956a] hover:bg-[#c4956a]/8 transition-colors mr-1">
            Today
          </button>
          <button onClick={prevMonth} className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-stone-400" />
          </button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-t border-l border-stone-200 rounded-lg overflow-hidden">
        {calendarDays.map((day) => {
          const dayBookings = bookingsByDate.get(day.date) || [];
          const dayRecurring = recurringProjections.get(day.date) || [];
          const hasBookings = dayBookings.length > 0;
          const hasRecurring = dayRecurring.length > 0;
          const hasContent = hasBookings || hasRecurring;
          const isSelected = selectedDate === day.date;

          // Earliest booking for the photo badge
          const sorted = [...dayBookings].sort((a, b) => (a.bookingStartTime || "99:99").localeCompare(b.bookingStartTime || "99:99"));
          const earliest = sorted[0];
          const earliestRec = dayRecurring.length > 0
            ? [...dayRecurring].sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
            : null;
          const photoUrl = earliest?.spaceImageUrl || earliestRec?.spaceImage || null;
          const totalCount = dayBookings.length + dayRecurring.length;

          return (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDate(isSelected ? null : day.date);
                if (onDayClick && hasContent) onDayClick(day.date, dayBookings);
              }}
              className={`
                relative flex flex-col items-center py-1.5 border-r border-b border-stone-200 transition-colors min-h-[60px]
                ${day.isCurrentMonth ? "bg-white" : "bg-stone-50/60"}
                ${isSelected ? "bg-[#c4956a]/5" : hasContent ? "hover:bg-stone-50" : ""}
              `}
              data-testid={`calendar-day-${day.date}`}
            >
              {/* Day number */}
              <span className={`
                text-[12px] font-medium leading-none mb-1
                ${day.isToday
                  ? "w-6 h-6 rounded-full bg-[#c4956a] text-white flex items-center justify-center"
                  : day.isCurrentMonth
                    ? "text-stone-700"
                    : "text-stone-300"
                }
              `}>
                {day.day}
              </span>

              {/* Space photo badge — circular, centered */}
              {hasContent && (
                <div className="flex flex-col items-center gap-[3px] mt-auto">
                  {photoUrl ? (
                    <div className="relative">
                      <img
                        src={photoUrl}
                        alt=""
                        className={`w-8 h-8 rounded-full object-cover border-2 shadow-sm ${
                          hasBookings
                            ? earliest?.role === "host" ? "border-emerald-300" : "border-blue-300"
                            : earliestRec?.status === "pending_confirmation" ? "border-amber-300 opacity-70" : "border-[#c4956a]/50"
                        }`}
                      />
                      {(earliest?.recurringBookingId || hasRecurring) && (
                        <Repeat className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-[#c4956a] bg-white rounded-full p-[1px]" />
                      )}
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center text-[9px] font-bold ${
                      earliestRec?.status === "pending_confirmation"
                        ? "border-amber-300 text-amber-400 bg-amber-50"
                        : "border-[#c4956a]/40 text-[#c4956a]/60 bg-[#c4956a]/5"
                    }`}>
                      {(earliest?.spaceName || earliestRec?.spaceName || "S")[0]}
                    </div>
                  )}

                  {/* Count indicator */}
                  {totalCount > 1 && (
                    <span className="text-[8px] font-bold text-stone-400 leading-none">
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
