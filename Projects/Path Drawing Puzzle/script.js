const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");
const leaderboardEl = document.getElementById("leaderboard");

let timer = 20;
let interval;
let referencePath = [];
let playerPath = [];
let drawing = false;

// Generate random reference path
function generatePath() {
  referencePath = [];
  ctx.clearRect(0,0,400,400);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let x = Math.floor(Math.random()*300)+50;
  let y = Math.floor(Math.random()*300)+50;
  ctx.moveTo(x,y);
  referencePath.push([x,y]);
  for(let i=0;i<5;i++){
    x += Math.floor(Math.random()*100-50);
    y += Math.floor(Math.random()*100-50);
    ctx.lineTo(x,y);
    referencePath.push([x,y]);
  }
  ctx.stroke();
}

// Player drawing
canvas.addEventListener("mousedown", e => {
  drawing = true;
  playerPath = [];
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const rect = canvas.getBoundingClientRect();
  ctx.moveTo(e.clientX-rect.left, e.clientY-rect.top);
  playerPath.push([e.clientX-rect.left, e.clientY-rect.top]);
});
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", e => {
  if(!drawing) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX-rect.left, e.clientY-rect.top);
  ctx.stroke();
  playerPath.push([e.clientX-rect.left, e.clientY-rect.top]);
});

// Timer
function startTimer() {
  timer = 20;
  timerEl.textContent = `⏱️ ${timer}s`;
  interval = setInterval(() => {
    timer--;
    timerEl.textContent = `⏱️ ${timer}s`;
    if(timer<=0){
      clearInterval(interval);
      submitPath();
    }
  },1000);
}

// Compare paths
function submitPath() {
  clearInterval(interval);
  let match = 0;
  const len = Math.min(referencePath.length, playerPath.length);
  for(let i=0;i<len;i++){
    const [rx,ry] = referencePath[i];
    const [px,py] = playerPath[i];
    const dist = Math.sqrt((rx-px)**2+(ry-py)**2);
    if(dist < 20) match++;
  }
  const accuracy = ((match/len)*100).toFixed(2);
  resultEl.textContent = `🎯 Accuracy: ${accuracy}%`;
  updateLeaderboard(accuracy);
}

// Leaderboard
function updateLeaderboard(score) {
  const scores = JSON.parse(localStorage.getItem("pathScores") || "[]");
  scores.push(score);
  scores.sort((a,b)=>b-a);
  localStorage.setItem("pathScores", JSON.stringify(scores));
  leaderboardEl.innerHTML = "<h3>🏆 Leaderboard</h3>" + scores.map((s,i)=>`<p>${i+1}. ${s}%</p>`).join("");
}

startBtn.addEventListener("click", () => {
  ctx.clearRect(0,0,400,400);
  generatePath();
  startTimer();
});

submitBtn.addEventListener("click", submitPath);

const resetBtn = document.getElementById("resetBtn");

function resetGame() {
  clearInterval(interval);
  ctx.clearRect(0,0,400,400);
  resultEl.textContent = "";
  playerPath = [];
  referencePath = [];
  timerEl.textContent = "⏱️ 20s";
}

resetBtn.addEventListener("click", () => {
  resetGame();
  generatePath();    
  startTimer();     
});
