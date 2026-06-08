let currentAngle = 0;
let targetAngle = Math.floor(Math.random() * 360);
let startTime = Date.now();
let level = 1;

const box = document.getElementById("box");
const result = document.getElementById("result");
const levelText = document.getElementById("level");

let isDragging = false;
let lastX = 0;

// Drag rotate
box.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  box.style.cursor = "grabbing";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  box.style.cursor = "grab";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  let delta = e.clientX - lastX;
  lastX = e.clientX;

  currentAngle += delta * 0.4;
  updateRotation();
});

function updateRotation() {
  box.style.transform = `rotate(${currentAngle}deg)`;
}

// Hint system
function getHint(diff) {
  if (diff < 10) return "🔥 Perfect alignment incoming!";
  if (diff < 30) return "🟡 Very close!";
  if (diff < 60) return "🟠 Keep adjusting...";
  return "🧭 Try rotating slowly for better control";
}

// Check score
function checkMatch() {
  const diff = Math.abs(currentAngle - targetAngle) % 360;
  const accuracy = Math.max(0, 100 - (diff / 180) * 100);
  const timeTaken = (Date.now() - startTime) / 1000;

  const hint = getHint(diff);

  if (accuracy > 85) {
    level++;
    levelText.innerText = `Level: ${level}`;
    result.innerText =
      `🎯 Accuracy: ${accuracy.toFixed(1)}% | ⏱️ ${timeTaken.toFixed(1)}s\n🔥 Perfect! Level Up!`;
  } else {
    result.innerText =
      `🎯 Accuracy: ${accuracy.toFixed(1)}% | ⏱️ ${timeTaken.toFixed(1)}s\n${hint}`;
  }
}

// Reset game
function resetGame() {
  targetAngle = Math.floor(Math.random() * 360);
  currentAngle = 0;
  startTime = Date.now();

  updateRotation();

  result.innerText = "🎮 New round started! Start rotating...";
}