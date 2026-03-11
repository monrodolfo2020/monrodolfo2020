// The Melodic Past — Progress Tracking Module
// All localStorage read/write logic lives here

const STORAGE_KEY = 'melodic_past_progress';

const DEFAULT_PROGRESS = {
  completedWeeks: [],
  currentWeek: 1,
  darkMode: false,
  profileName: 'Estudiante',
  streakDays: 0,
  lastActivity: null,
  joinDate: new Date().toISOString().split('T')[0]
};

export function getProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const fresh = { ...DEFAULT_PROGRESS, joinDate: new Date().toISOString().split('T')[0] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(updates) {
  const current = getProgress();
  const merged = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function markWeekComplete(weekNum) {
  const progress = getProgress();
  if (!progress.completedWeeks.includes(weekNum)) {
    progress.completedWeeks.push(weekNum);
  }
  // Advance current week if this was the active one
  if (weekNum >= progress.currentWeek) {
    progress.currentWeek = weekNum + 1;
  }
  // Update streak
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastActivity) {
    const last = new Date(progress.lastActivity);
    const now = new Date(today);
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      progress.streakDays = (progress.streakDays || 0) + 1;
    } else if (diffDays > 1) {
      progress.streakDays = 1;
    }
  } else {
    progress.streakDays = 1;
  }
  progress.lastActivity = today;
  saveProgress(progress);
  return progress;
}

export function isCompleted(weekNum) {
  return getProgress().completedWeeks.includes(weekNum);
}

export function isLocked(weekNum) {
  return weekNum > getProgress().currentWeek;
}

export function getCurrentWeek() {
  return getProgress().currentWeek;
}

export function getCompletedCount() {
  return getProgress().completedWeeks.length;
}

export function getStreakDays() {
  return getProgress().streakDays || 0;
}

export function getWeekState(weekNum) {
  if (isCompleted(weekNum)) return 'completed';
  if (isLocked(weekNum)) return 'locked';
  return 'active';
}

export function toggleDarkMode() {
  const progress = getProgress();
  const newMode = !progress.darkMode;
  saveProgress({ darkMode: newMode });
  if (newMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return newMode;
}

export function applyDarkMode() {
  const progress = getProgress();
  if (progress.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function getLevel() {
  const count = getCompletedCount();
  if (count < 3) return { name: 'Beginner', es: 'Principiante', color: 'text-blue-500' };
  if (count < 6) return { name: 'Elementary', es: 'Elemental', color: 'text-green-500' };
  if (count < 9) return { name: 'Pre-Intermediate', es: 'Pre-Intermedio', color: 'text-yellow-500' };
  if (count < 12) return { name: 'Intermediate', es: 'Intermedio', color: 'text-orange-500' };
  return { name: 'Upper-Intermediate', es: 'Avanzado', color: 'text-primary' };
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
