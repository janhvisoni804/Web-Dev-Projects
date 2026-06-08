/**
 * Timing Precision Game - Main Script
 */

// --- DOM Elements ---
const screens = {
  menu: document.getElementById('main-menu'),
  game: document.getElementById('game-screen'),
  gameOver: document.getElementById('game-over-modal'),
  leaderboard: document.getElementById('leaderboard-screen')
};

const UI = {
  livesDisplay: document.getElementById('lives-display'),
  scoreDisplay: document.getElementById('current-score'),
  streakBadge: document.getElementById('streak-badge'),
  streakValue: document.getElementById('streak-value'),
  actionText: document.getElementById('action-text'),
  
  trackWrapper: document.getElementById('track-wrapper'),
  targetZone: document.getElementById('target-zone'),
  cursor: document.getElementById('game-cursor'),
  tapArea: document.getElementById('tap-area'),
  
  finalScore: document.getElementById('final-score'),
  highestStreak: document.getElementById('highest-streak'),
  perfectHits: document.getElementById('perfect-hits'),
  lbList: document.getElementById('lb-list')
};

// --- Game Constants & State ---
const BASE_SPEED = 300; // pixels per second
const MAX_LIVES = 3;
const TARGET_WIDTH = 60; // px
const CURSOR_WIDTH = 6;  // px

let state = {
  isPlaying: false,
  lives: MAX_LIVES,
  score: 0,
  streak: 1,
  highestStreak: 1,
  perfectHits: 0,
  
  speedMultiplier: 1.0,
  cursorPos: 0, // 0.0 to 1.0 representing percentage across track
  direction: 1, // 1 for right, -1 for left
  targetPos: 0.5, // 0.0 to 1.0 representing percentage across track
  
  lastTime: 0,
  animationFrame: null
};

// --- Screen Navigation ---
function switchScreen(screenId) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenId].classList.add('active');
}

function showMainMenu() {
  switchScreen('menu');
  screens.gameOver.classList.add('hidden');
  stopGameLoop();
}

function quitGame() {
  if (confirm("Are you sure you want to quit?")) {
    showMainMenu();
  }
}

function showLeaderboards() {
  switchScreen('leaderboard');
  renderLeaderboard();
}

// --- Game Logic ---

function startGame() {
  // Reset State
  state = {
    isPlaying: true,
    lives: MAX_LIVES,
    score: 0,
    streak: 1,
    highestStreak: 1,
    perfectHits: 0,
    speedMultiplier: 1.0,
    cursorPos: 0,
    direction: 1,
    targetPos: 0.5,
    lastTime: performance.now(),
    animationFrame: null
  };

  // Reset UI
  screens.gameOver.classList.add('hidden');
  updateHUD();
  randomizeTarget();
  
  switchScreen('game');
  
  // Start Loop
  state.animationFrame = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
  state.isPlaying = false;
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
  }
}

function gameLoop(currentTime) {
  if (!state.isPlaying) return;

  // Calculate delta time in seconds
  const deltaTime = (currentTime - state.lastTime) / 1000;
  state.lastTime = currentTime;

  // Update cursor position
  // Get track width
  const trackWidth = UI.trackWrapper.clientWidth;
  
  // Calculate speed in percentage per second
  const actualSpeedPx = BASE_SPEED * state.speedMultiplier;
  const speedPct = actualSpeedPx / trackWidth;

  state.cursorPos += (speedPct * deltaTime) * state.direction;

  // Bounce off edges
  if (state.cursorPos >= 1) {
    state.cursorPos = 1;
    state.direction = -1;
  } else if (state.cursorPos <= 0) {
    state.cursorPos = 0;
    state.direction = 1;
  }

  // Render cursor
  const cursorLeft = state.cursorPos * trackWidth - (CURSOR_WIDTH / 2);
  UI.cursor.style.left = `${cursorLeft}px`;

  state.animationFrame = requestAnimationFrame(gameLoop);
}

function randomizeTarget() {
  // Random position between 10% and 90%
  state.targetPos = 0.1 + (Math.random() * 0.8);
  
  const trackWidth = UI.trackWrapper.clientWidth;
  const targetLeft = state.targetPos * trackWidth - (TARGET_WIDTH / 2);
  UI.targetZone.style.left = `${targetLeft}px`;
}

// --- Interaction / Scoring ---

function handleAction(e) {
  if (e && e.type === 'keydown' && e.code !== 'Space') return;
  if (e) e.preventDefault(); // Prevent scrolling on space
  
  if (!state.isPlaying || screens.gameOver.classList.contains('active')) return;

  evaluateHit();
}

window.addEventListener('keydown', handleAction);
UI.tapArea.addEventListener('mousedown', handleAction);
UI.tapArea.addEventListener('touchstart', handleAction, {passive: false});

function evaluateHit() {
  const trackWidth = UI.trackWrapper.clientWidth;
  
  // Calculate centers in pixels
  const cursorCenter = state.cursorPos * trackWidth;
  const targetCenter = state.targetPos * trackWidth;
  
  // Distance between centers
  const distance = Math.abs(cursorCenter - targetCenter);
  
  // Hit logic
  const halfTarget = TARGET_WIDTH / 2;
  const perfectThreshold = 5; // px for "Perfect"
  
  if (distance <= perfectThreshold) {
    // Perfect Hit
    const points = 500 * state.streak;
    state.score += points;
    state.streak++;
    state.perfectHits++;
    state.speedMultiplier += 0.05;
    
    showActionText("PERFECT!", "anim-perfect");
    flashBody("flash-perfect");
    
  } else if (distance <= halfTarget) {
    // Good Hit (Inside zone)
    const points = 100 * state.streak;
    state.score += points;
    // Streak maintained, not increased
    state.speedMultiplier += 0.02;
    
    showActionText("GOOD", "anim-good");
    
  } else {
    // Miss
    state.lives--;
    state.streak = 1; // Reset streak
    state.speedMultiplier = 1.0; // Reset speed
    
    showActionText("MISS", "anim-miss");
    flashBody("flash-miss");
    
    if (state.lives <= 0) {
      endGame();
      return;
    }
  }

  // Update max streak
  if (state.streak > state.highestStreak) {
    state.highestStreak = state.streak;
  }

  updateHUD();
  
  // Short pause, then next target
  stopGameLoop();
  setTimeout(() => {
    if (state.lives > 0) {
      randomizeTarget();
      state.isPlaying = true;
      state.lastTime = performance.now();
      state.animationFrame = requestAnimationFrame(gameLoop);
    }
  }, 400); // 400ms pause for visual feedback
}

// --- UI Updates ---

function updateHUD() {
  UI.scoreDisplay.textContent = state.score;
  UI.streakValue.textContent = state.streak;
  
  if (state.streak >= 5) {
    UI.streakBadge.classList.add('high-streak');
  } else {
    UI.streakBadge.classList.remove('high-streak');
  }

  // Update Lives Hearts
  const hearts = Array.from(UI.livesDisplay.children);
  hearts.forEach((heart, idx) => {
    if (idx < state.lives) {
      heart.classList.add('active');
    } else {
      heart.classList.remove('active');
    }
  });
}

function showActionText(text, animClass) {
  UI.actionText.textContent = text;
  
  // Reset animations
  UI.actionText.className = 'action-text';
  void UI.actionText.offsetWidth; // trigger reflow
  
  UI.actionText.classList.add(animClass);
}

function flashBody(animClass) {
  document.body.classList.remove('flash-perfect', 'flash-miss');
  void document.body.offsetWidth;
  document.body.classList.add(animClass);
}

// --- Game Over & Leaderboards ---

function endGame() {
  stopGameLoop();
  
  UI.finalScore.textContent = state.score;
  UI.highestStreak.textContent = `x${state.highestStreak}`;
  UI.perfectHits.textContent = state.perfectHits;
  
  saveScore(state.score);
  
  setTimeout(() => {
    screens.gameOver.classList.remove('hidden');
  }, 500);
}

function saveScore(score) {
  if (score === 0) return;
  let scores = JSON.parse(localStorage.getItem('timing_game_lb')) || [];
  scores.push({
    score: score,
    date: new Date().toLocaleDateString()
  });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10); // Top 10
  localStorage.setItem('timing_game_lb', JSON.stringify(scores));
}

function renderLeaderboard() {
  UI.lbList.innerHTML = '';
  let scores = JSON.parse(localStorage.getItem('timing_game_lb')) || [];
  
  if (scores.length === 0) {
    UI.lbList.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">No scores yet. Play a game!</p>`;
    return;
  }

  scores.forEach((s, index) => {
    const li = document.createElement('li');
    li.className = 'lb-item';
    li.innerHTML = `
      <span class="lb-rank">#${index + 1}</span>
      <span class="lb-date">${s.date}</span>
      <span class="lb-score">${s.score} pts</span>
    `;
    UI.lbList.appendChild(li);
  });
}

// Handle window resize gracefully
window.addEventListener('resize', () => {
  if (state.isPlaying) {
    // The relative CSS positioning mostly handles it, but we can snap cursor to percentage
    const trackWidth = UI.trackWrapper.clientWidth;
    const cursorLeft = state.cursorPos * trackWidth - (CURSOR_WIDTH / 2);
    UI.cursor.style.left = `${cursorLeft}px`;
    
    const targetLeft = state.targetPos * trackWidth - (TARGET_WIDTH / 2);
    UI.targetZone.style.left = `${targetLeft}px`;
  }
});
