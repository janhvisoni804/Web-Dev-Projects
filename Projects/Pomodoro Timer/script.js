// ── Constants ────────────────────────────────────────────
const STORAGE_KEYS = {
  settings: 'pomo-settings',
  stats:    'pomo-stats',
  tasks:    'pomo-tasks',
  theme:    'pomo-theme',
};

const MODE_LABELS = {
  pomodoro: 'Focus Time',
  short:    'Short Break',
  long:     'Long Break',
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 96; // ≈ 603

// ── Default settings ─────────────────────────────────────
const DEFAULT_SETTINGS = {
  pomodoro:    25,
  short:       5,
  long:        15,
  sessions:    4,
  autoBreak:   false,
  autoPomo:    false,
  sound:       true,
  notify:      false,
};

// ── State ─────────────────────────────────────────────────
let settings    = loadSettings();
let stats       = loadStats();
let tasks       = loadTasks();
let mode        = 'pomodoro';
let secondsLeft = settings.pomodoro * 60;
let totalSeconds = secondsLeft;
let running     = false;
let timerId     = null;
let sessionNum  = 1;    // current session within a cycle
let pomodorosToday = todayCount();

// ── DOM refs ─────────────────────────────────────────────
const timerDisplay  = document.getElementById('timer-display');
const sessionLabel  = document.getElementById('session-label');
const sessionCount  = document.getElementById('session-count');
const pomodorosDone = document.getElementById('pomodoros-done');
const ringProgress  = document.getElementById('ring-progress');
const btnStart      = document.getElementById('btn-start');
const btnReset      = document.getElementById('btn-reset');
const btnSkip       = document.getElementById('btn-skip');
const taskInput     = document.getElementById('task-input');
const btnAddTask    = document.getElementById('btn-add-task');
const taskList      = document.getElementById('task-list');
const taskProgress  = document.getElementById('task-progress');
const btnStats      = document.getElementById('btn-stats');
const btnSettings   = document.getElementById('btn-settings');
const btnTheme      = document.getElementById('btn-theme');
const statsPanel    = document.getElementById('stats-panel');
const settingsPanel = document.getElementById('settings-panel');
const overlay       = document.getElementById('overlay');
const btnCloseStats    = document.getElementById('btn-close-stats');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings  = document.getElementById('btn-save-settings');
const btnResetStats    = document.getElementById('btn-reset-stats');

// ── Init ─────────────────────────────────────────────────
function init() {
  applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'dark');
  renderTimer();
  renderSessionInfo();
  renderTasks();
  bindEvents();
  applySettingsToInputs();
}

// ── Timer core ───────────────────────────────────────────
function startTimer() {
  if (running) return;
  running = true;
  btnStart.textContent = 'Pause';
  timerId = setInterval(tick, 1000);
}

function pauseTimer() {
  running = false;
  btnStart.textContent = 'Resume';
  clearInterval(timerId);
}

function resetTimer() {
  pauseTimer();
  btnStart.textContent = 'Start';
  secondsLeft  = settings[mode] * 60;
  totalSeconds = secondsLeft;
  renderTimer();
}

function tick() {
  if (secondsLeft <= 0) {
    onSessionEnd();
    return;
  }
  secondsLeft--;
  renderTimer();
  updateDocTitle();
}

function onSessionEnd() {
  clearInterval(timerId);
  running = false;
  btnStart.textContent = 'Start';
  playSound();

  if (mode === 'pomodoro') {
    // record the completed pomodoro
    recordPomodoro();
    // link pomodoro to active task
    linkPomodoroToTask();

    if (sessionNum >= settings.sessions) {
      sessionNum = 1;
      switchMode('long');
    } else {
      sessionNum++;
      switchMode('short');
    }

    if (settings.autoBreak) startTimer();
  } else {
    switchMode('pomodoro');
    if (settings.autoPomo) startTimer();
  }

  sendNotification();
  renderSessionInfo();
  document.title = 'Pomodoro Timer';
}

// ── Mode switching ───────────────────────────────────────
function switchMode(newMode) {
  mode = newMode;
  secondsLeft  = settings[mode] * 60;
  totalSeconds = secondsLeft;
  document.body.dataset.mode = mode;

  // update tabs
  document.querySelectorAll('.tab').forEach(t => {
    const isActive = t.dataset.mode === mode;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive);
  });

  sessionLabel.textContent = MODE_LABELS[mode];
  renderTimer();
}

// ── Render ────────────────────────────────────────────────
function renderTimer() {
  const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const s = String(secondsLeft % 60).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;

  const ratio  = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  ringProgress.style.strokeDashoffset = offset;
}

function renderSessionInfo() {
  pomodorosToday = todayCount();
  sessionCount.innerHTML  = `Session <strong>${sessionNum}</strong> of <strong>${settings.sessions}</strong>`;
  pomodorosDone.textContent = `${pomodorosToday} 🍅 today`;
}

function updateDocTitle() {
  const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const s = String(secondsLeft % 60).padStart(2, '0');
  document.title = `${m}:${s} — ${MODE_LABELS[mode]}`;
}

// ── Stats ─────────────────────────────────────────────────
function recordPomodoro() {
  const today = dateKey();
  stats.total  = (stats.total  || 0) + 1;
  stats.days   = stats.days || {};
  stats.days[today] = (stats.days[today] || 0) + 1;
  stats.lastDay = today;
  stats.streak  = calcStreak();
  saveStats();
  renderSessionInfo();
}

function todayCount() {
  const d = loadStats();
  return (d.days || {})[dateKey()] || 0;
}

function calcStreak() {
  const days = stats.days || {};
  let streak = 0;
  const d = new Date();
  while (true) {
    const k = d.toISOString().split('T')[0];
    if (days[k]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function weekData() {
  const days = (loadStats().days) || {};
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().split('T')[0];
    const label = ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()];
    result.push({ label, count: days[k] || 0, isToday: i === 0 });
  }
  return result;
}

function renderStatsPanel() {
  const s = loadStats();
  const today = (s.days || {})[dateKey()] || 0;
  const weekTotal = weekData().reduce((a, b) => a + b.count, 0);

  document.getElementById('stat-today').textContent  = today;
  document.getElementById('stat-week').textContent   = weekTotal;
  document.getElementById('stat-total').textContent  = s.total || 0;
  document.getElementById('stat-streak').textContent = `${s.streak || 0}🔥`;

  // bars
  const barsEl = document.getElementById('week-bars');
  barsEl.innerHTML = '';
  const data = weekData();
  const max  = Math.max(...data.map(d => d.count), 1);
  data.forEach(({ label, count, isToday }) => {
    const heightPct = Math.round((count / max) * 100);
    const wrap = document.createElement('div');
    wrap.className = 'week-bar-wrap';
    wrap.innerHTML = `
      <div class="week-bar${isToday ? ' today' : ''}" style="height:${heightPct}%" title="${count} pomodoros"></div>
      <span class="week-day">${label}</span>`;
    barsEl.appendChild(wrap);
  });
}

// ── Tasks ─────────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false, pomos: 0 });
  taskInput.value = '';
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function linkPomodoroToTask() {
  // increment pomodoro count on first undone task
  const active = tasks.find(t => !t.done);
  if (active) { active.pomos++; saveTasks(); renderTasks(); }
}

function renderTasks() {
  taskList.innerHTML = '';
  if (!tasks.length) {
    taskList.innerHTML = '<li class="task-empty">No tasks yet. Add one above.</li>';
    taskProgress.textContent = '0 / 0';
    return;
  }
  const done = tasks.filter(t => t.done).length;
  taskProgress.textContent = `${done} / ${tasks.length}`;

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="task-check" ${task.done ? 'checked' : ''} aria-label="Mark task done" />
      <span class="task-text">${escapeHtml(task.text)}</span>
      ${task.pomos ? `<span class="task-pomos">${task.pomos}🍅</span>` : ''}
      <button class="task-del" aria-label="Delete task">✕</button>`;
    li.querySelector('.task-check').addEventListener('change', () => toggleTask(task.id));
    li.querySelector('.task-del').addEventListener('click', () => deleteTask(task.id));
    taskList.appendChild(li);
  });
}

// ── Settings ──────────────────────────────────────────────
function applySettingsToInputs() {
  document.getElementById('set-pomodoro').value  = settings.pomodoro;
  document.getElementById('set-short').value     = settings.short;
  document.getElementById('set-long').value      = settings.long;
  document.getElementById('set-sessions').value  = settings.sessions;
  document.getElementById('set-autobreak').checked = settings.autoBreak;
  document.getElementById('set-autopomo').checked  = settings.autoPomo;
  document.getElementById('set-sound').checked     = settings.sound;
  document.getElementById('set-notify').checked    = settings.notify;
}

function saveSettingsFromInputs() {
  settings.pomodoro  = clamp(parseInt(document.getElementById('set-pomodoro').value), 1, 60);
  settings.short     = clamp(parseInt(document.getElementById('set-short').value),    1, 30);
  settings.long      = clamp(parseInt(document.getElementById('set-long').value),     1, 60);
  settings.sessions  = clamp(parseInt(document.getElementById('set-sessions').value), 1, 10);
  settings.autoBreak = document.getElementById('set-autobreak').checked;
  settings.autoPomo  = document.getElementById('set-autopomo').checked;
  settings.sound     = document.getElementById('set-sound').checked;
  settings.notify    = document.getElementById('set-notify').checked;

  if (settings.notify) requestNotifyPermission();

  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  resetTimer();
  closeAllPanels();
}

// ── Theme ─────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  document.getElementById('btn-theme').textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ── Panels ────────────────────────────────────────────────
function openPanel(panel) {
  panel.hidden = false;
  overlay.hidden = false;
}

function closeAllPanels() {
  statsPanel.hidden    = true;
  settingsPanel.hidden = true;
  overlay.hidden       = true;
}

// ── Notifications & sound ─────────────────────────────────
function requestNotifyPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification() {
  if (!settings.notify) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const msg = mode === 'pomodoro' ? '🍅 Focus session done! Take a break.' : '⏰ Break over. Back to work!';
  new Notification('Pomodoro Timer', { body: msg, icon: '' });
}

function playSound() {
  if (!settings.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (_) { /* audio not available */ }
}

// ── Events ────────────────────────────────────────────────
function bindEvents() {
  btnStart.addEventListener('click', () => running ? pauseTimer() : startTimer());
  btnReset.addEventListener('click', resetTimer);
  btnSkip.addEventListener('click',  onSessionEnd);

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (running) pauseTimer();
      btnStart.textContent = 'Start';
      sessionNum = 1;
      switchMode(tab.dataset.mode);
    });
  });

  btnAddTask.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  btnStats.addEventListener('click', () => { renderStatsPanel(); openPanel(statsPanel); });
  btnSettings.addEventListener('click', () => { applySettingsToInputs(); openPanel(settingsPanel); });
  btnTheme.addEventListener('click', toggleTheme);

  btnCloseStats.addEventListener('click',    closeAllPanels);
  btnCloseSettings.addEventListener('click', closeAllPanels);
  overlay.addEventListener('click',          closeAllPanels);

  btnSaveSettings.addEventListener('click', saveSettingsFromInputs);

  btnResetStats.addEventListener('click', () => {
    if (confirm('Reset all stats? This cannot be undone.')) {
      stats = { total: 0, days: {}, streak: 0 };
      saveStats();
      renderStatsPanel();
      renderSessionInfo();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); running ? pauseTimer() : startTimer(); }
    if (e.code === 'KeyR')  resetTimer();
  });
}

// ── Storage helpers ───────────────────────────────────────
function loadSettings() {
  try {
    return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}'));
  } catch (_) { return { ...DEFAULT_SETTINGS }; }
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || '{}');
  } catch (_) { return {}; }
}

function saveStats() {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');
  } catch (_) { return []; }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

// ── Utility ───────────────────────────────────────────────
function dateKey() {
  return new Date().toISOString().split('T')[0];
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Start ─────────────────────────────────────────────────
init();
