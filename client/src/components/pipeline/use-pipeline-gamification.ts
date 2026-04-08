import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "pipeline_streak";

interface StreakData {
  [date: string]: number; // ISO date string -> activity count
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function loadStreakData(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStreakData(data: StreakData) {
  // Only keep last 60 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const cleaned: StreakData = {};
  for (const [k, v] of Object.entries(data)) {
    if (k >= cutoffStr) cleaned[k] = v;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

function calculateStreak(data: StreakData): number {
  const today = getToday();
  let streak = 0;
  let checkDate = new Date(today);

  // Check if today has activity
  if ((data[today] || 0) > 0) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check yesterday (maybe user hasn't logged yet today)
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days backwards
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if ((data[dateStr] || 0) > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function usePipelineGamification() {
  const [streakData, setStreakData] = useState<StreakData>(loadStreakData);
  const [showCelebration, setShowCelebration] = useState<"stage" | "milestone" | null>(null);

  const todayCount = streakData[getToday()] || 0;
  const streakDays = calculateStreak(streakData);

  const incrementActivity = useCallback(() => {
    setStreakData(prev => {
      const today = getToday();
      const updated = { ...prev, [today]: (prev[today] || 0) + 1 };
      saveStreakData(updated);

      // Check milestone
      const newCount = updated[today]!;
      if (newCount === 5 || newCount === 10 || newCount === 25) {
        setShowCelebration("milestone");
        setTimeout(() => setShowCelebration(null), 2000);
      }

      return updated;
    });
  }, []);

  const celebrate = useCallback((type: "stage" | "milestone") => {
    setShowCelebration(type);
    setTimeout(() => setShowCelebration(null), 2000);
  }, []);

  return {
    todayCount,
    streakDays,
    incrementActivity,
    showCelebration,
    celebrate,
  };
}
