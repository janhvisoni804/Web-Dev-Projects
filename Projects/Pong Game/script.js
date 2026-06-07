const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 500, H = 320;
canvas.width = W;
canvas.height = H;

const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const diffValEl = document.getElementById('diffVal');
const overlay = document.getElementById('overlay');
const resetBtn = document.getElementById('resetBtn');
const modalTitle = document.getElementById('modalTitle');
const moScore = document.getElementById('moScore');
const moWins = document.getElementById('moWins');
const moLosses = document.getElementById('moLosses');

const STORAGE_KEY = 'pong_records';

const PAD_W = 10, PAD_H = 60;
const BALL_R = 6;
const WIN_SCORE = 11;

const DIFFICULTIES = [
  { label: 'Easy', speed: 2.2, offset: 0.4 },
  { label: 'Medium', speed: 3.2, offset: 0.25 },
  { label: 'Hard', speed: 4.5, offset: 0.1 },
];

let diffIdx = 1;
let playerY = H / 2 - PAD_H / 2;
let aiY = H / 2 - PAD_H / 2;
let ball = { x: W / 2, y: H / 2, vx: 3, vy: 0 };
let playerScore = 0;
let aiScore = 0;
let wins = 0;
let losses = 0;
let gameRunning = false;
let animId = null;
let keys = { up: false, down: false };

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const d = JSON.parse(raw); wins = d.wins || 0; losses = d.losses || 0; }
  } catch {}
}

function saveRecords() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ wins, losses })); } catch {}
}

function resetBall(dir) {
  ball.x = W / 2;
  ball.y = H / 2;
  const angle = (Math.random() - 0.5) * 0.8;
  const speed = 3.5;
  ball.vx = dir * speed;
  ball.vy = angle * speed;
}

function resetGame() {
  playerScore = 0;
  aiScore = 0;
  playerY = H / 2 - PAD_H / 2;
  aiY = H / 2 - PAD_H / 2;
  resetBall(Math.random() < 0.5 ? 1 : -1);
  updateHUD();
  overlay.classList.remove('active');
  gameRunning = true;
}

function updateHUD() {
  playerScoreEl.textContent = playerScore;
  aiScoreEl.textContent = aiScore;
  diffValEl.textContent = DIFFICULTIES[diffIdx].label;
}

function endGame(playerWin) {
  gameRunning = false;
  if (animId) cancelAnimationFrame(animId);
  if (playerWin) wins++; else losses++;
  saveRecords();
  modalTitle.textContent = playerWin ? 'You Win!' : 'You Lose';
  modalTitle.className = 'modal-title ' + (playerWin ? 'win' : 'lose');
  moScore.textContent = playerScore + ' - ' + aiScore;
  moWins.textContent = wins;
  moLosses.textContent = losses;
  setTimeout(() => overlay.classList.add('active'), 400);
}

function update() {
  if (!gameRunning) return;

  if (keys.up) playerY -= 4;
  if (keys.down) playerY += 4;
  playerY = Math.max(0, Math.min(H - PAD_H, playerY));

  const diff = DIFFICULTIES[diffIdx];
  const targetY = ball.y - PAD_H / 2;
  const diffMove = targetY - aiY;
  aiY += Math.sign(diffMove) * Math.min(Math.abs(diffMove) * diff.offset, diff.speed);
  aiY = Math.max(0, Math.min(H - PAD_H, aiY));

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }
  if (ball.y + BALL_R > H) { ball.y = H - BALL_R; ball.vy = -Math.abs(ball.vy); }

  const pLeft = 16, pTop = playerY, pRight = pLeft + PAD_W, pBottom = playerY + PAD_H;
  if (ball.x - BALL_R < pRight && ball.x + BALL_R > pLeft && ball.y > pTop && ball.y < pBottom && ball.vx < 0) {
    const hitPos = (ball.y - playerY) / PAD_H;
    const angle = (hitPos - 0.5) * 1.2;
    const speed = Math.min(Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 0.3, 7);
    ball.vx = Math.abs(speed * Math.cos(angle));
    ball.vy = speed * Math.sin(angle);
    ball.x = pRight + BALL_R + 1;
  }

  const aLeft = W - 16 - PAD_W, aTop = aiY, aRight = aLeft + PAD_W, aBottom = aiY + PAD_H;
  if (ball.x + BALL_R > aLeft && ball.x - BALL_R < aRight && ball.y > aTop && ball.y < aBottom && ball.vx > 0) {
    const hitPos = (ball.y - aiY) / PAD_H;
    const angle = (hitPos - 0.5) * 1.2;
    const speed = Math.min(Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 0.3, 7);
    ball.vx = -Math.abs(speed * Math.cos(angle));
    ball.vy = speed * Math.sin(angle);
    ball.x = aLeft - BALL_R - 1;
  }

  if (ball.x + BALL_R < 0) {
    aiScore++;
    updateHUD();
    if (aiScore >= WIN_SCORE) { endGame(false); return; }
    resetBall(1);
  }

  if (ball.x - BALL_R > W) {
    playerScore++;
    updateHUD();
    if (playerScore >= WIN_SCORE) { endGame(true); return; }
    resetBall(-1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, W, H);

  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
  ctx.shadowBlur = 12;
  ctx.fillRect(16, playerY, PAD_W, PAD_H);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(18, playerY + 8, 4, PAD_H - 16);

  ctx.fillStyle = '#ff2a5f';
  ctx.shadowColor = 'rgba(255, 42, 95, 0.3)';
  ctx.shadowBlur = 12;
  ctx.fillRect(W - 16 - PAD_W, aiY, PAD_W, PAD_H);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(W - 22, aiY + 8, 4, PAD_H - 16);

  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(ball.x - 2, ball.y - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.fillText(playerScore, W / 2 - 60, H / 2);
  ctx.fillText(aiScore, W / 2 + 60, H / 2);
}

function loop() {
  update();
  draw();
  if (gameRunning) animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') { keys.up = true; e.preventDefault(); }
  if (e.key === 'ArrowDown' || e.key === 's') { keys.down = true; e.preventDefault(); }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's') keys.down = false;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const my = (e.touches[0].clientY - rect.top) * (H / rect.height);
  playerY = Math.max(0, Math.min(H - PAD_H, my - PAD_H / 2));
}, { passive: false });

canvas.addEventListener('click', () => {
  diffIdx = (diffIdx + 1) % DIFFICULTIES.length;
  diffValEl.textContent = DIFFICULTIES[diffIdx].label;
});

resetBtn.addEventListener('click', () => { resetGame(); loop(); });

loadRecords();
resetGame();
loop();
