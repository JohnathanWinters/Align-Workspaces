import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Repeat, Clock } from "lucide-react";
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
    const startOffset = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        date: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding (fill to 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        date: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
        isToday: false,
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

  // Project recurring booking dates onto the calendar month
  const recurringProjections = useMemo(() => {
    const map = new Map<string, RecurringForCalendar[]>();
    for (const rb of recurringBookings) {
      if (rb.status !== "confirmed" && rb.status !== "active" && rb.status !== "pending_confirmation") continue;
      // Check each day in the calendar view
      for (const day of calendarDays) {
        const d = new Date(day.date + "T12:00:00");
        if (d.getDay() !== rb.dayOfWeek) continue;
        if (day.date < rb.startDate) continue;
        if (rb.endDate && day.date > rb.endDate) continue;
        // Don't project if an actual booking already exists for this date+recurring
        const existingBookings = bookingsByDate.get(day.date) || [];
        if (existingBookings.some(b => b.recurringBookingId === rb.id)) continue;
        if (!map.has(day.date)) map.set(day.date, []);
        map.get(day.date)!.push(rb);
      }
    }
    return map;
  }, [recurringBookings, calendarDays, bookingsByDate]);

  const prevMonth = () => {
    setCurrentMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) || []) : [];
  const selectedRecurring = selectedDate ? (recurringProjections.get(selectedDate) || []) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-stone-600" />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-stone-800">{monthName}</h3>
          <button onClick={goToToday} className="text-[10px] text-[#c4956a] hover:underline font-medium">Today</button>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-stone-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-stone-400 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-xl overflow-hidden">
        {calendarDays.map((day) => {
          const dayBookings = bookingsByDate.get(day.date) || [];
          const dayRecurring = recurringProjections.get(day.date) || [];
          const hasContent = dayBookings.length > 0 || dayRecurring.length > 0;
          const isSelected = selectedDate === day.date;

          return (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDate(isSelected ? null : day.date);
                if (onDayClick && hasContent) onDayClick(day.date, dayBookings);
              }}
              className={`relative min-h-[72px] p-1 text-left transition-colors ${
                day.isCurrentMonth ? "bg-white" : "bg-stone-50"
              } ${isSelected ? "ring-2 ring-[#c4956a] ring-inset" : ""} ${
                hasContent ? "hover:bg-stone-50 cursor-pointer" : "cursor-default"
              }`}
              data-testid={`calendar-day-${day.date}`}
            >
              {/* Day number */}
              <span className={`text-xs font-medium block ${
                day.isToday
                  ? "w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center"
                  : day.isCurrentMonth ? "text-stone-700" : "text-stone-300"
              }`}>
                {day.day}
              </span>

              {/* Booking thumbnails */}
              <div className="mt-0.5 flex flex-wrap gap-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="relative">
                    {b.spaceImageUrl ? (
                      <img
                        src={b.spaceImageUrl}
                        alt=""
                        className={`w-7 h-7 rounded-md object-cover border-2 ${
                          b.role === "guest" ? "border-blue-300" : "border-green-300"
                        }`}
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center text-[8px] font-bold ${
                        b.role === "guest"
                          ? "border-blue-300 bg-blue-50 text-blue-500"
                          : "border-green-300 bg-green-50 text-green-500"
                      }`}>
                        {b.spaceName?.[0] || "S"}
                      </div>
                    )}
                    {b.recurringBookingId && (
                      <Repeat className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-[#c4956a] bg-white rounded-full" />
                    )}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="w-7 h-7 rounded-md bg-stone-100 flex items-center justify-center text-[9px] font-medium text-stone-500">
                    +{dayBookings.length - 3}
                  </div>
                )}
                {/* Recurring projections (dotted) */}
                {dayRecurring.map((rb) => (
                  <div key={rb.id} className="relative">
                    {rb.spaceImage ? (
                      <img
                        src={rb.spaceImage}
                        alt=""
                        className={`w-7 h-7 rounded-md object-cover border-2 border-dashed ${
                          rb.status === "pending_confirmation" ? "border-amber-300 opacity-60" : "border-[#c4956a] opacity-70"
                        }`}
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-md border-2 border-dashed flex items-center justify-center text-[8px] font-bold ${
                        rb.status === "pending_confirmation"
                          ? "border-amber-300 bg-amber-50 text-amber-500 opacity-60"
                          : "border-[#c4956a] bg-orange-50 text-[#c4956a] opacity-70"
                      }`}>
                        {rb.spaceName?.[0] || "S"}
                      </div>
                    )}
                    <Repeat className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-[#c4956a] bg-white rounded-full" />
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDate && (selectedBookings.length > 0 || selectedRecurring.length > 0) && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h4>

          {selectedBookings.map((b) => (
            <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
              b.role === "guest" ? "border-blue-100 bg-blue-50/30" : "border-green-100 bg-green-50/30"
            }`}>
              {b.spaceImageUrl ? (
                <img src={b.spaceImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-stone-400">
                  {b.spaceName?.[0] || "S"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-800 truncate">{b.spaceName}</p>
                  <Badge className={`text-[10px] ${
                    b.role === "guest" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                  }`}>
                    {b.role === "guest" ? "Guest" : "Host"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{b.bookingStartTime ? formatTime(b.bookingStartTime) : "TBD"}</span>
                  <span>{b.bookingHours}hr{(b.bookingHours || 0) > 1 ? "s" : ""}</span>
                  {b.recurringBookingId && (
                    <span className="flex items-center gap-0.5 text-[#c4956a]">
                      <Repeat className="w-3 h-3" /> Weekly
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Badge className={`text-[10px] ${
                  b.status === "approved" || b.status === "confirmed" ? "bg-green-50 text-green-700" :
                  b.status === "awaiting_payment" ? "bg-amber-50 text-amber-700" :
                  b.status === "checked_in" ? "bg-blue-50 text-blue-700" :
                  b.status === "completed" ? "bg-stone-100 text-stone-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {b.status === "awaiting_payment" ? "Pay Now" : b.status || "Unknown"}
                </Badge>
              </div>
            </div>
          ))}

          {selectedRecurring.map((rb) => (
            <div key={rb.id} className={`flex items-center gap-3 p-3 rounded-xl border border-dashed ${
              rb.status === "pending_confirmation" ? "border-amber-200 bg-amber-50/30" : "border-[#c4956a]/30 bg-orange-50/30"
            }`}>
              {rb.spaceImage ? (
                <img src={rb.spaceImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 opacity-70" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-stone-400">
                  {rb.spaceName?.[0] || "S"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-800 truncate">{rb.spaceName}</p>
                  <Repeat className="w-3.5 h-3.5 text-[#c4956a]" />
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(rb.startTime)}</span>
                  <span>{rb.hours}hr{rb.hours > 1 ? "s" : ""}</span>
                </div>
              </div>
              <Badge className={`text-[10px] ${
                rb.status === "pending_confirmation" ? "bg-amber-50 text-amber-700" : "bg-orange-50 text-[#c4956a]"
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
