const refCanvas = document.getElementById("referenceCanvas");
const playerCanvas = document.getElementById("playerCanvas");
const refCtx = refCanvas.getContext("2d");
const playerCtx = playerCanvas.getContext("2d");

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const resultEl = document.getElementById("result");
const leaderboardEl = document.getElementById("leaderboard");

let timer = 60;
let interval;

// Draw reference pixel art (example: smiley face)
function drawReference() {
  refCtx.fillStyle = "yellow";
  refCtx.fillRect(50, 50, 100, 100);
  refCtx.fillStyle = "black";
  refCtx.fillRect(70, 80, 20, 20);
  refCtx.fillRect(110, 80, 20, 20);
  refCtx.fillRect(80, 120, 40, 20);
}

// Player drawing
let drawing = false;
playerCanvas.addEventListener("mousedown", () => drawing = true);
playerCanvas.addEventListener("mouseup", () => drawing = false);
playerCanvas.addEventListener("mousemove", e => {
  if (!drawing) return;
  const rect = playerCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  playerCtx.fillStyle = "yellow";
  playerCtx.fillRect(Math.floor(x/10)*10, Math.floor(y/10)*10, 10, 10);
});

// Timer
function startTimer() {
  timer = 60;
  timerEl.textContent = `⏱️ ${timer}s`;
  interval = setInterval(() => {
    timer--;
    timerEl.textContent = `⏱️ ${timer}s`;
    if (timer <= 0) {
      clearInterval(interval);
      submitDrawing();
    }
  }, 1000);
}

// Compare accuracy
function submitDrawing() {
  clearInterval(interval);
  const refData = refCtx.getImageData(0,0,200,200).data;
  const playerData = playerCtx.getImageData(0,0,200,200).data;
  let match = 0, total = refData.length/4;
  for (let i=0; i<refData.length; i+=4) {
    if (refData[i] === playerData[i] &&
        refData[i+1] === playerData[i+1] &&
        refData[i+2] === playerData[i+2]) {
      match++;
    }
  }
  const accuracy = ((match/total)*100).toFixed(2);
  resultEl.textContent = `🎯 Accuracy: ${accuracy}%`;
  updateLeaderboard(accuracy);
}

// Leaderboard
function updateLeaderboard(score) {
  const scores = JSON.parse(localStorage.getItem("pixelScores") || "[]");
  scores.push(score);
  scores.sort((a,b) => b-a);
  localStorage.setItem("pixelScores", JSON.stringify(scores));
  leaderboardEl.innerHTML = "<h3>🏆 Leaderboard</h3>" + scores.map((s,i)=>`<p>${i+1}. ${s}%</p>`).join("");
}

startBtn.addEventListener("click", () => {
  playerCtx.clearRect(0,0,200,200);
  drawReference();
  startTimer();
});

submitBtn.addEventListener("click", submitDrawing);
