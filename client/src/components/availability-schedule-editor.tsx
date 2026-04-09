import { useState, useEffect } from "react";
import { Clock, Check, Plus, Trash2 } from "lucide-react";

export type TimeBlock = { open: string; close: string };
export type DaySchedule = TimeBlock[] | null;
export type WeekSchedule = {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
};

/** Normalize legacy single-block format { open, close } to array format [{ open, close }] */
export function normalizeSchedule(raw: any): WeekSchedule {
  if (!raw) return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };
  const result: any = {};
  for (const key of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]) {
    const val = raw[key];
    if (!val) {
      result[key] = null;
    } else if (Array.isArray(val)) {
      result[key] = val;
    } else if (val.open && val.close) {
      result[key] = [{ open: val.open, close: val.close }];
    } else {
      result[key] = null;
    }
  }
  return result as WeekSchedule;
}

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
  const norm = normalizeSchedule(schedule);
  const groups: { days: string[]; hours: string }[] = [];
  for (const day of DAYS) {
    const blocks = norm[day.key];
    if (!blocks || blocks.length === 0) continue;
    const hours = blocks.map(b => `${formatTime(b.open)} - ${formatTime(b.close)}`).join(", ");
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
  const norm = normalizeSchedule(schedule);
  const dayKey = getDayOfWeek(dateStr);
  if (!dayKey) return [];
  const blocks = norm[dayKey];
  if (!blocks || blocks.length === 0) return [];
  const slots: string[] = [];
  for (const block of blocks) {
    const [openH, openM] = block.open.split(":").map(Number);
    const [closeH, closeM] = block.close.split(":").map(Number);
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
  }
  return slots;
}

export function getMaxHoursFromSlot(schedule: WeekSchedule, dateStr: string, startTime: string, bufferMinutes: number = 15): number {
  const norm = normalizeSchedule(schedule);
  const dayKey = getDayOfWeek(dateStr);
  if (!dayKey) return 1;
  const blocks = norm[dayKey];
  if (!blocks || blocks.length === 0) return 1;
  const [startH, startM] = startTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  // Find the block that contains this start time
  for (const block of blocks) {
    const [openH, openM] = block.open.split(":").map(Number);
    const [closeH, closeM] = block.close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    if (startMinutes >= openMinutes && startMinutes < closeMinutes) {
      const available = closeMinutes - startMinutes - bufferMinutes;
      return Math.max(1, Math.floor(available / 60));
    }
  }
  return 1;
}

const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: [{ open: "09:00", close: "17:00" }],
  tue: [{ open: "09:00", close: "17:00" }],
  wed: [{ open: "09:00", close: "17:00" }],
  thu: [{ open: "09:00", close: "17:00" }],
  fri: [{ open: "09:00", close: "17:00" }],
  sat: null,
  sun: null,
};

interface ScheduleEditorProps {
  value: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

export function AvailabilityScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const [sameHours, setSameHours] = useState(false);
  const schedule = normalizeSchedule(value) || DEFAULT_SCHEDULE;

  useEffect(() => {
    const enabledDays = DAYS.filter((d) => schedule[d.key] !== null && schedule[d.key]!.length > 0);
    if (enabledDays.length > 1) {
      const first = schedule[enabledDays[0].key];
      const allSame = enabledDays.every((d) => {
        const s = schedule[d.key];
        if (!s || !first || s.length !== first.length) return false;
        return s.every((b, i) => b.open === first[i].open && b.close === first[i].close);
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
      const template = firstEnabled ? schedule[firstEnabled] : [{ open: "09:00", close: "17:00" }];
      onChange({ ...schedule, [key]: template!.map(b => ({ ...b })) });
    }
  };

  const updateBlockTime = (key: keyof WeekSchedule, blockIndex: number, field: "open" | "close", val: string) => {
    if (sameHours) {
      const newSchedule = { ...schedule };
      for (const day of DAYS) {
        const blocks = newSchedule[day.key];
        if (blocks && blocks[blockIndex]) {
          newSchedule[day.key] = blocks.map((b, i) => i === blockIndex ? { ...b, [field]: val } : b);
        }
      }
      onChange(newSchedule);
    } else {
      const blocks = schedule[key];
      if (blocks && blocks[blockIndex]) {
        onChange({ ...schedule, [key]: blocks.map((b, i) => i === blockIndex ? { ...b, [field]: val } : b) });
      }
    }
  };

  const addBlock = (key: keyof WeekSchedule) => {
    const blocks = schedule[key];
    if (!blocks) return;
    const lastBlock = blocks[blocks.length - 1];
    const [lastCloseH] = lastBlock.close.split(":").map(Number);
    const newOpen = lastBlock.close;
    const newCloseH = Math.min(lastCloseH + 2, 23);
    const newClose = `${String(newCloseH).padStart(2, "0")}:00`;
    if (sameHours) {
      const newSchedule = { ...schedule };
      for (const day of DAYS) {
        if (newSchedule[day.key]) {
          newSchedule[day.key] = [...newSchedule[day.key]!, { open: newOpen, close: newClose }];
        }
      }
      onChange(newSchedule);
    } else {
      onChange({ ...schedule, [key]: [...blocks, { open: newOpen, close: newClose }] });
    }
  };

  const removeBlock = (key: keyof WeekSchedule, blockIndex: number) => {
    const blocks = schedule[key];
    if (!blocks || blocks.length <= 1) return;
    if (sameHours) {
      const newSchedule = { ...schedule };
      for (const day of DAYS) {
        const dayBlocks = newSchedule[day.key];
        if (dayBlocks && dayBlocks.length > blockIndex) {
          newSchedule[day.key] = dayBlocks.filter((_, i) => i !== blockIndex);
        }
      }
      onChange(newSchedule);
    } else {
      onChange({ ...schedule, [key]: blocks.filter((_, i) => i !== blockIndex) });
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
            newSchedule[day.key] = template.map(b => ({ open: b.open, close: b.close }));
          }
        }
        onChange(newSchedule);
      }
    }
    setSameHours(!sameHours);
  };

  const renderBlocks = (dayKey: keyof WeekSchedule, dayLabel: string, blocks: TimeBlock[]) => (
    <div key={dayKey} className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
      {blocks.map((block, bi) => (
        <div key={bi} className="flex items-center gap-2">
          {bi === 0 && <span className="text-xs text-gray-600 w-10 font-medium shrink-0">{dayLabel}</span>}
          {bi > 0 && <span className="w-10 shrink-0" />}
          <select
            value={block.open}
            onChange={(e) => updateBlockTime(dayKey, bi, "open", e.target.value)}
            className="flex-1 h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
          >
            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
          </select>
          <span className="text-xs text-gray-400">to</span>
          <select
            value={block.close}
            onChange={(e) => updateBlockTime(dayKey, bi, "close", e.target.value)}
            className="flex-1 h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
          >
            {TIME_OPTIONS.filter((t) => t > block.open).map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
          </select>
          {blocks.length > 1 && (
            <button type="button" onClick={() => removeBlock(dayKey, bi)} className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {blocks.length <= 1 && <span className="w-[26px] shrink-0" />}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addBlock(dayKey)}
        className="flex items-center gap-1 text-[11px] text-[#c4956a] hover:text-[#b07d52] transition-colors ml-10 mt-1"
      >
        <Plus className="w-3 h-3" /> Add time block
      </button>
    </div>
  );

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
          const isEnabled = schedule[day.key] !== null && schedule[day.key]!.length > 0;
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
          const firstEnabled = DAYS.find((d) => schedule[d.key] && schedule[d.key]!.length > 0);
          if (!firstEnabled) return null;
          return renderBlocks(firstEnabled.key, "All days", schedule[firstEnabled.key]!);
        })()
      ) : (
        <div className="space-y-1.5">
          {DAYS.map((day) => {
            const blocks = schedule[day.key];
            if (!blocks || blocks.length === 0) return null;
            return renderBlocks(day.key, day.short, blocks);
          })}
        </div>
      )}
    </div>
  );
}
