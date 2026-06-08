const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const timerEl = document.getElementById("timer");
const optionsEl = document.getElementById("options");
const resultEl = document.getElementById("result");
const leaderboardEl = document.getElementById("leaderboard");

let timer = 30;
let interval;
let currentShape;

const shapes = ["Circle", "Square", "Triangle", "Star", "Pentagon"];

function drawShape(shape) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;

  switch(shape) {
    case "Circle":
      ctx.beginPath();
      ctx.arc(200,200,80,0,Math.PI*2);
      ctx.stroke();
      break;
    case "Square":
      ctx.strokeRect(120,120,160,160);
      break;
    case "Triangle":
      ctx.beginPath();
      ctx.moveTo(200,100);
      ctx.lineTo(100,300);
      ctx.lineTo(300,300);
      ctx.closePath();
      ctx.stroke();
      break;
    case "Star":
      // simple star
      ctx.beginPath();
      for(let i=0;i<5;i++){
        ctx.lineTo(200+80*Math.cos((18+i*72)*Math.PI/180),
                   200-80*Math.sin((18+i*72)*Math.PI/180));
        ctx.lineTo(200+35*Math.cos((54+i*72)*Math.PI/180),
                   200-35*Math.sin((54+i*72)*Math.PI/180));
      }
      ctx.closePath();
      ctx.stroke();
      break;
    case "Pentagon":
      ctx.beginPath();
      for(let i=0;i<5;i++){
        ctx.lineTo(200+80*Math.cos((90+i*72)*Math.PI/180),
                   200+80*Math.sin((90+i*72)*Math.PI/180));
      }
      ctx.closePath();
      ctx.stroke();
      break;
  }
}

function startGame() {
  timer = 30;
  timerEl.textContent = `⏱️ ${timer}s`;
  resultEl.textContent = "";
  optionsEl.innerHTML = "";
  currentShape = shapes[Math.floor(Math.random()*shapes.length)];
  drawShape(currentShape);

  // show options
  shapes.forEach(shape => {
    const btn = document.createElement("button");
    btn.textContent = shape;
    btn.onclick = () => checkAnswer(shape);
    optionsEl.appendChild(btn);
  });

  interval = setInterval(() => {
    timer--;
    timerEl.textContent = `⏱️ ${timer}s`;
    if(timer<=0){
      clearInterval(interval);
      resultEl.textContent = "⏳ Time's up!";
    }
  },1000);
}

function checkAnswer(choice) {
  clearInterval(interval);
  if(choice === currentShape){
    resultEl.textContent = "✅ Correct!";
    updateLeaderboard(true);
  } else {
    resultEl.textContent = "❌ Wrong!";
    updateLeaderboard(false);
  }
}

function updateLeaderboard(correct) {
  const scores = JSON.parse(localStorage.getItem("shapeScores") || "[]");
  scores.push(correct ? 1 : 0);
  localStorage.setItem("shapeScores", JSON.stringify(scores));
  const total = scores.length;
  const accuracy = (scores.reduce((a,b)=>a+b,0)/total*100).toFixed(2);
  leaderboardEl.innerHTML = `<h3>🏆 Accuracy</h3><p>${accuracy}% over ${total} rounds</p>`;
}

startBtn.addEventListener("click", startGame);
