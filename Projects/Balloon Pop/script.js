const sky = document.getElementById('sky');
const scoreVal = document.getElementById('scoreVal');
const multiVal = document.getElementById('multiVal');
const timerVal = document.getElementById('timerVal');
const bestVal = document.getElementById('bestVal');
const overlay = document.getElementById('overlay');
const resetBtn = document.getElementById('resetBtn');
const moScore = document.getElementById('moScore');
const moBest = document.getElementById('moBest');

const STORAGE_KEY = 'balloonpop_best';
const ROUND_TIME = 45;
const COLORS = [
  { fill: '#ff2a5f', shadow: 'rgba(255,42,95,0.35)' },
  { fill: '#00f0ff', shadow: 'rgba(0,240,255,0.35)' },
  { fill: '#a855f7', shadow: 'rgba(168,85,247,0.35)' },
];

const SIZE_RANGE = [44, 72];
const BASE_SPAWN = 1200;
const BASE_DURATION = 4000;

let score = 0;
let bestScore = 0;
let timeLeft = ROUND_TIME;
let multiplier = 1;
let spawnInterval = BASE_SPAWN;
let floatDuration = BASE_DURATION;
let spawnTimer = null;
let timerInterval = null;
let popping = false;
let gameRunning = false;

function loadBest() {
  try {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY));
    if (!isNaN(saved) && saved > 0) { bestScore = saved; bestVal.textContent = bestScore; }
  } catch {}
}

function saveBest(v) {
  try { localStorage.setItem(STORAGE_KEY, v); } catch {}
}

function updateHUD() {
  scoreVal.textContent = score;
  multiVal.textContent = multiplier.toFixed(1) + '×';
  timerVal.textContent = timeLeft;
  bestVal.textContent = bestScore;
}

function calcDifficulty() {
  const bumps = Math.floor(score / 40);
  spawnInterval = Math.max(400, BASE_SPAWN - bumps * 50);
  floatDuration = Math.max(1800, BASE_DURATION - bumps * 100);
  multiplier = 1 + bumps * 0.2;
}

function spawnBalloon() {
  if (!gameRunning) return;
  calcDifficulty();

  const size = SIZE_RANGE[0] + Math.random() * (SIZE_RANGE[1] - SIZE_RANGE[0]);
  const ci = Math.floor(Math.random() * COLORS.length);
  const color = COLORS[ci];
  const maxX = sky.clientWidth - size;
  const x = Math.random() * Math.max(maxX, 0);
  const y = sky.clientHeight - size + 10;

  const el = document.createElement('div');
  el.className = 'balloon';
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = x + 'px';
  el.style.bottom = '0';
  el.style.background = `radial-gradient(circle at 35% 30%, ${color.fill}, rgba(0,0,0,0.3))`;
  el.style.boxShadow = `0 0 20px ${color.shadow}`;
  el.style.animationDuration = (floatDuration / 1000) + 's';
  el.innerHTML = '<div class="shine"></div>';

  el.addEventListener('click', (e) => { e.stopPropagation(); popBalloon(el); });
  el.addEventListener('touchstart', (e) => { e.preventDefault(); popBalloon(el); }, { passive: false });

  el._popped = false;

  el.addEventListener('animationend', () => {
    if (!el._popped && sky.contains(el)) {
      el.remove();
      if (gameRunning) missBalloon();
    }
  });

  sky.appendChild(el);
}

function popBalloon(el) {
  if (el._popped || !gameRunning) return;
  el._popped = true;

  const rect = el.getBoundingClientRect();
  const skyRect = sky.getBoundingClientRect();
  const cx = rect.left - skyRect.left + rect.width / 2;
  const cy = rect.top - skyRect.top + rect.height / 2;
  const color = el.style.background;

  spawnParticles(cx, cy, color, 10);

  el.classList.add('pop');
  setTimeout(() => { if (el.parentNode) el.remove(); }, 300);

  score += Math.round(10 * multiplier);
  updateHUD();
}

function spawnParticles(cx, cy, color, count) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const a = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    const dx = Math.cos(a) * dist;
    const dy = Math.sin(a) * dist;
    const sz = 3 + Math.random() * 5;
    p.style.width = sz + 'px';
    p.style.height = sz + 'px';
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.background = color;
    p.style.boxShadow = `0 0 6px ${color}`;
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.animation = `particleFade 0.5s ease-out forwards`;
    sky.appendChild(p);
    setTimeout(() => p.remove(), 550);
  }
}

function missBalloon() {
  if (!gameRunning) return;
  sky.classList.remove('shake');
  void sky.offsetWidth;
  sky.classList.add('shake');
}

function tick() {
  timeLeft--;
  timerVal.textContent = timeLeft;
  if (timeLeft <= 0) endGame();
}

function endGame() {
  gameRunning = false;
  if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  document.querySelectorAll('.balloon').forEach(el => {
    if (!el._popped) { el.style.animationPlayState = 'paused'; }
  });

  if (score > bestScore) { bestScore = score; bestVal.textContent = bestScore; saveBest(bestScore); }
  moScore.textContent = score;
  moBest.textContent = bestScore;
  setTimeout(() => overlay.classList.add('active'), 500);
}

function resetGame() {
  document.querySelectorAll('.balloon, .particle').forEach(el => el.remove());
  score = 0;
  timeLeft = ROUND_TIME;
  multiplier = 1;
  spawnInterval = BASE_SPAWN;
  floatDuration = BASE_DURATION;
  if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  overlay.classList.remove('active');
  updateHUD();
  gameRunning = true;
  spawnTimer = setInterval(spawnBalloon, spawnInterval);
  timerInterval = setInterval(tick, 1000);
}

loadBest();
resetGame();
