// The Melodic Past — App Logic
// UI rendering, navigation, toasts, and shared utilities

import { LESSONS } from './data.js';
import { getWeekState, isLocked, getCurrentWeek, getCompletedCount, applyDarkMode } from './progress.js';

// ─── Dark Mode (applied via inline script in <head>) ─────────────────────────
export function initDarkMode() {
  applyDarkMode();
}

// ─── Bottom Navigation ───────────────────────────────────────────────────────
export function activateNav(pageName) {
  document.querySelectorAll('[data-nav]').forEach(item => {
    if (item.dataset.nav === pageName) {
      item.classList.add('text-primary');
      item.classList.remove('text-slate-500', 'dark:text-slate-400');
      // Fill active icon
      const icon = item.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    } else {
      item.classList.remove('text-primary');
      item.classList.add('text-slate-500', 'dark:text-slate-400');
    }
  });
}

// ─── Toast Notification ──────────────────────────────────────────────────────
export function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.getElementById('mp-toast');
  if (existing) existing.remove();

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-slate-800 dark:bg-slate-700',
    primary: 'bg-primary'
  };
  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    primary: 'music_note'
  };

  const toast = document.createElement('div');
  toast.id = 'mp-toast';
  toast.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl text-white shadow-xl text-sm font-medium max-w-xs w-full mx-4 transition-all duration-300 opacity-0 translate-y-2 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-base">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });

  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Lesson Card Renderer ────────────────────────────────────────────────────
export function renderLessonCard(lesson, state) {
  const thumbUrl = `https://img.youtube.com/vi/${lesson.youtubeId}/hqdefault.jpg`;
  const weekLabel = `Semana ${lesson.week}`;
  const progressPct = state === 'completed' ? 100 : state === 'active' ? 45 : 0;

  const stateClasses = {
    completed: 'border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-shadow',
    active: 'border-2 border-primary shadow-lg ring-4 ring-primary/5 cursor-pointer',
    locked: 'border border-slate-200 dark:border-slate-800 opacity-75 cursor-not-allowed'
  };
  const stateIcon = {
    completed: '<span class="material-symbols-outlined text-green-500">check_circle</span>',
    active: '<span class="material-symbols-outlined text-primary">rocket_launch</span>',
    locked: '<span class="material-symbols-outlined text-slate-400">lock</span>'
  };
  const stateBadge = {
    completed: `<span class="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">${weekLabel} • Completada</span>`,
    active: `<span class="text-xs font-bold uppercase tracking-wider text-primary">${weekLabel} • Actual</span>`,
    locked: `<span class="text-xs font-bold uppercase tracking-wider text-slate-400">${weekLabel}</span>`
  };
  const progressColor = {
    completed: 'bg-green-500',
    active: 'bg-primary',
    locked: 'bg-slate-200 dark:bg-slate-700'
  };
  const cardBg = {
    completed: 'bg-slate-50 dark:bg-slate-800/50',
    active: 'bg-primary/5',
    locked: 'bg-slate-50 dark:bg-slate-800/50'
  };
  const playIcon = state === 'locked' ? 'lock' : 'play_circle';
  const grayscale = state === 'locked' ? 'grayscale-[0.5]' : '';

  return `
    <div class="bg-white dark:bg-slate-900 rounded-xl p-5 ${stateClasses[state]} ${grayscale}"
         data-week="${lesson.week}" role="${state !== 'locked' ? 'button' : 'presentation'}"
         tabindex="${state !== 'locked' ? '0' : '-1'}">
      <div class="flex items-start justify-between mb-4">
        <div>
          ${stateBadge[state]}
          <h4 class="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">${lesson.grammarTopic}</h4>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${lesson.descriptionES}</p>
        </div>
        ${stateIcon[state]}
      </div>
      <div class="flex items-center gap-4 ${cardBg[state]} p-3 rounded-lg border ${state === 'active' ? 'border-primary/10' : 'border-slate-100 dark:border-slate-800'}">
        <div class="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
          <img class="object-cover w-full h-full" src="${thumbUrl}" alt="${lesson.song} - ${lesson.artist}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="absolute inset-0 bg-primary/20 items-center justify-center hidden">
            <span class="material-symbols-outlined text-primary text-2xl">music_note</span>
          </div>
          <div class="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-xl">${playIcon}</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs ${state === 'active' ? 'text-primary/70' : 'text-slate-500 dark:text-slate-400'} font-medium">Canción destacada</p>
          <p class="text-sm font-bold truncate">"${lesson.song}" - ${lesson.artist}</p>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full ${progressColor[state]} rounded-full transition-all duration-700"
               style="width: ${progressPct}%"></div>
        </div>
        <span class="text-xs font-bold ${state === 'active' ? 'text-primary' : state === 'completed' ? 'text-green-500' : 'text-slate-400'}">${progressPct}%</span>
      </div>
    </div>
  `;
}

// ─── Render All Lesson Cards (index.html) ────────────────────────────────────
export function renderLessonsGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = LESSONS.map(lesson => {
    const state = getWeekState(lesson.week);
    return renderLessonCard(lesson, state);
  }).join('');

  // Delegate click events
  container.addEventListener('click', (e) => {
    const card = e.target.closest('[data-week]');
    if (!card) return;
    const weekNum = parseInt(card.dataset.week);
    if (isLocked(weekNum)) {
      showToast('Completa las lecciones anteriores primero 🔒', 'info');
      return;
    }
    window.location.href = `lesson.html?week=${weekNum}`;
  });

  // Keyboard accessibility
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('[data-week]');
      if (!card) return;
      const weekNum = parseInt(card.dataset.week);
      if (!isLocked(weekNum)) {
        window.location.href = `lesson.html?week=${weekNum}`;
      }
    }
  });
}

// ─── Progress Bar Updater (index.html hero) ──────────────────────────────────
export function updateHeroProgress() {
  const completed = getCompletedCount();
  const total = LESSONS.length;
  const pct = Math.round((completed / total) * 100);

  const heroTitle = document.getElementById('hero-title');
  const heroBar = document.getElementById('hero-bar');
  const heroPct = document.getElementById('hero-pct');
  const startBtn = document.getElementById('start-btn');

  if (heroTitle) heroTitle.textContent = `${completed}/${total} Semanas Completadas`;
  if (heroBar) heroBar.style.width = `${pct}%`;
  if (heroPct) heroPct.textContent = `${pct}%`;
  if (startBtn) {
    const currentWeek = getCurrentWeek();
    startBtn.addEventListener('click', () => {
      window.location.href = `lesson.html?week=${Math.min(currentWeek, total)}`;
    });
  }
}

// ─── Shared Bottom Nav HTML ──────────────────────────────────────────────────
export const NAV_HTML = `
<nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
  <div class="flex max-w-2xl mx-auto px-4 py-2">
    <a href="index.html" data-nav="lessons" class="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors">
      <span class="material-symbols-outlined text-[22px]">school</span>
      <span class="text-[10px] font-bold uppercase tracking-wider">Lecciones</span>
    </a>
    <a href="discover.html" data-nav="discover" class="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors">
      <span class="material-symbols-outlined text-[22px]">explore</span>
      <span class="text-[10px] font-bold uppercase tracking-wider">Explorar</span>
    </a>
    <a href="profile.html" data-nav="profile" class="flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors">
      <span class="material-symbols-outlined text-[22px]">person</span>
      <span class="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
    </a>
  </div>
</nav>
`;
