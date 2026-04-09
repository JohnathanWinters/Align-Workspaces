import { useState, useEffect } from "react";
import { Clock, Check } from "lucide-react";

export type DaySchedule = { open: string; close: string } | null;
export type WeekSchedule = {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
};

const DAYS: { key: keyof WeekSchedule; label: string; short: string }[] = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function scheduleToDisplayText(schedule: WeekSchedule): string {
  const groups: { days: string[]; hours: string }[] = [];
  for (const day of DAYS) {
    const s = schedule[day.key];
    if (!s) continue;
    const hours = `${formatTime(s.open)} - ${formatTime(s.close)}`;
    const existing = groups.find((g) => g.hours === hours);
    if (existing) {
      existing.days.push(day.short);
    } else {
      groups.push({ days: [day.short], hours });
    }
  }
  if (groups.length === 0) return "Not set";
  return groups.map((g) => {
    const dayStr =
      g.days.length > 2
        ? `${g.days[0]}-${g.days[g.days.length - 1]}`
        : g.days.join(", ");
    return `${dayStr} ${g.hours}`;
  }).join(" · ");
}

export function getDayOfWeek(dateStr: string): keyof WeekSchedule | null {
  const date = new Date(dateStr + "T12:00:00");
  const dayIndex = date.getDay();
  const map: (keyof WeekSchedule)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[dayIndex] || null;
}

export function getAvailableTimeSlots(schedule: WeekSchedule, dateStr: string, bufferMinutes: number = 15): string[] {
  const dayKey = getDayOfWeek(dateStr);
  if (!dayKey) return [];
  const daySchedule = schedule[dayKey];
  if (!daySchedule) return [];
  const slots: string[] = [];
  const [openH, openM] = daySchedule.open.split(":").map(Number);
  const [closeH, closeM] = daySchedule.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const step = 60 + bufferMinutes;
  for (let i = 0; ; i++) {
    const m = openMinutes + i * step;
    if (m + 60 > closeMinutes) break;
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

export function getMaxHoursFromSlot(schedule: WeekSchedule, dateStr: string, startTime: string, bufferMinutes: number = 15): number {
  const dayKey = getDayOfWeek(dateStr);
  if (!dayKey) return 1;
  const daySchedule = schedule[dayKey];
  if (!daySchedule) return 1;
  const [startH, startM] = startTime.split(":").map(Number);
  const [closeH, closeM] = daySchedule.close.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const closeMinutes = closeH * 60 + closeM;
  const available = closeMinutes - startMinutes - bufferMinutes;
  return Math.max(1, Math.floor(available / 60));
}

const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { open: "09:00", close: "17:00" },
  tue: { open: "09:00", close: "17:00" },
  wed: { open: "09:00", close: "17:00" },
  thu: { open: "09:00", close: "17:00" },
  fri: { open: "09:00", close: "17:00" },
  sat: null,
  sun: null,
};

interface ScheduleEditorProps {
  value: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

export function AvailabilityScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const [sameHours, setSameHours] = useState(false);
  const schedule = value || DEFAULT_SCHEDULE;

  useEffect(() => {
    const enabledDays = DAYS.filter((d) => schedule[d.key] !== null);
    if (enabledDays.length > 1) {
      const first = schedule[enabledDays[0].key];
      const allSame = enabledDays.every((d) => {
        const s = schedule[d.key];
        return s && first && s.open === first.open && s.close === first.close;
      });
      setSameHours(allSame);
    }
  }, []);

  const toggleDay = (key: keyof WeekSchedule) => {
    const current = schedule[key];
    if (current) {
      onChange({ ...schedule, [key]: null });
    } else {
      const firstEnabled = DAYS.find((d) => schedule[d.key])?.key;
      const template = firstEnabled ? schedule[firstEnabled] : { open: "09:00", close: "17:00" };
      onChange({ ...schedule, [key]: { ...template! } });
    }
  };

  const updateTime = (key: keyof WeekSchedule, field: "open" | "close", val: string) => {
    if (sameHours) {
      const newSchedule = { ...schedule };
      for (const day of DAYS) {
        if (newSchedule[day.key]) {
          newSchedule[day.key] = { ...newSchedule[day.key]!, [field]: val };
        }
      }
      onChange(newSchedule);
    } else {
      const current = schedule[key];
      if (current) {
        onChange({ ...schedule, [key]: { ...current, [field]: val } });
      }
    }
  };

  const toggleSameHours = () => {
    if (!sameHours) {
      const firstEnabled = DAYS.find((d) => schedule[d.key])?.key;
      if (firstEnabled) {
        const template = schedule[firstEnabled]!;
        const newSchedule = { ...schedule };
        for (const day of DAYS) {
          if (newSchedule[day.key]) {
            newSchedule[day.key] = { open: template.open, close: template.close };
          }
        }
        onChange(newSchedule);
      }
    }
    setSameHours(!sameHours);
  };

  return (
    <div className="space-y-3" data-testid="availability-schedule-editor">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Weekly Availability
        </label>
        <button
          type="button"
          onClick={toggleSameHours}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            sameHours
              ? "bg-stone-900 text-white border-stone-900"
              : "bg-white text-stone-500 border-stone-300 hover:border-stone-400"
          }`}
          data-testid="toggle-same-hours"
        >
          {sameHours && <Check className="w-3 h-3" />}
          Same hours every day
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {DAYS.map((day) => {
          const isEnabled = schedule[day.key] !== null;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isEnabled
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
              data-testid={`toggle-day-${day.key}`}
            >
              {day.short}
            </button>
          );
        })}
      </div>

      {sameHours ? (
        (() => {
          const firstEnabled = DAYS.find((d) => schedule[d.key]);
          if (!firstEnabled) return null;
          const s = schedule[firstEnabled.key]!;
          return (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
              <span className="text-xs text-gray-500 w-20">All days</span>
              <select
                value={s.open}
                onChange={(e) => updateTime(firstEnabled.key, "open", e.target.value)}
                className="flex-1 h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
                data-testid="select-same-open"
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
              <span className="text-xs text-gray-400">to</span>
              <select
                value={s.close}
                onChange={(e) => updateTime(firstEnabled.key, "close", e.target.value)}
                className="flex-1 h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
                data-testid="select-same-close"
              >
                {TIME_OPTIONS.filter((t) => t > s.open).map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
            </div>
          );
        })()
      ) : (
        <div className="space-y-1.5">
          {DAYS.map((day) => {
            const s = schedule[day.key];
            if (!s) return null;
            return (
              <div key={day.key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                <span className="text-xs text-gray-600 w-10 font-medium">{day.short}</span>
                <select
                  value={s.open}
                  onChange={(e) => updateTime(day.key, "open", e.target.value)}
                  className="flex-1 h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
                  data-testid={`select-open-${day.key}`}
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
                <span className="text-xs text-gray-400">to</span>
                <select
                  value={s.close}
                  onChange={(e) => updateTime(day.key, "close", e.target.value)}
                  className="flex-1 h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
                  data-testid={`select-close-${day.key}`}
                >
                  {TIME_OPTIONS.filter((t) => t > s.open).map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
