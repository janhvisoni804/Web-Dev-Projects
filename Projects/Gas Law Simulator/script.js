(function(){

var R = 0.0821;
var V_MIN = 0.5;
var V_MAX = 2.5;
var BASE_SPEED = 1.8;
var REF_TEMP = 300;
var MAX_PARTICLES = 400;
var COLLISION_HISTORY_LEN = 50;
var PRESSURE_WARN = 5;
var PRESSURE_CRIT = 9;
var PRESSURE_SAFETY = 14;
var PARTICLE_BATCH = 50;
var CHAMBER_PAD = 24;

var state = {
  temperature: 300,
  volumePct: 50,
  particles: [],
  paused: false,
  time: 0,
  collisionCount: 0,
  collisionHistory: [],
  shakeActive: false,
  frameCount: 0
};

var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return document.querySelectorAll(s); };

var canvas = $('#simulation-canvas');
var ctx = canvas.getContext('2d');
var collisionCanvas = $('#collision-graph');
var collisionCtx = collisionCanvas.getContext('2d');
var pressureValue = $('#pressure-value');
var volumeValue = $('#volume-value');
var particleValue = $('#particle-value');
var collisionValue = $('#collision-value');
var displayTemp = $('[data-display="temperature"]');
var displayVol = $('[data-display="volume"]');
var displayCount = $('#display-count');
var statusText = $('#status-text');
var statusBar = $('#status-bar');
var statusPressure = $('#status-pressure');
var cardPressure = $('#card-pressure');
var pressureBar = $('#card-pressure .telem-card-bar div');
var btnPause = $('#btn-pause');
var btnReset = $('#btn-reset');
var btnAdd = $('#btn-add');
var btnRemove = $('#btn-remove');
var sliderTemp = $('#slider-temp');
var sliderVol = $('#slider-vol');

function clamp(v, mn, mx){ return Math.max(mn, Math.min(mx, v)); }

function getVolume(){ return V_MIN + (state.volumePct / 100) * (V_MAX - V_MIN); }

function getPressure(){ return (state.particles.length / 50) * R * state.temperature / getVolume(); }

function getChamberBounds(){
  var cssW = state.cssWidth || 800;
  var cssH = state.cssHeight || 600;
  return {
    left: CHAMBER_PAD,
    top: CHAMBER_PAD,
    right: (state.volumePct / 100) * (cssW - CHAMBER_PAD * 2) + CHAMBER_PAD,
    bottom: cssH - CHAMBER_PAD
  };
}

function getSpeedForTemp(T){
  return BASE_SPEED * Math.sqrt(T / REF_TEMP);
}

function tempColor(T){
  var t = clamp((T - 100) / 900, 0, 1);
  var r = Math.round(59 + (239 - 59) * t);
  var g = Math.round(130 * (1 - t * t * 0.7) + 68 * (t * t * 0.7));
  var b = Math.round(246 * (1 - t));
  return [r, g, b];
}

function createParticle(bounds){
  var pad = 4;
  var w = bounds.right - bounds.left - pad * 2;
  var h = bounds.bottom - bounds.top - pad * 2;
  var angle = Math.random() * Math.PI * 2;
  var speed = getSpeedForTemp(state.temperature) * (0.6 + Math.random() * 0.8);
  return {
    x: bounds.left + pad + Math.random() * w,
    y: bounds.top + pad + Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 3 + Math.random() * 2
  };
}

function spawnParticles(count){
  var bounds = getChamberBounds();
  for(var i=0; i<count; i++){
    if(state.particles.length >= MAX_PARTICLES) break;
    state.particles.push(createParticle(bounds));
  }
  updateParticleDisplay();
}

function removeParticles(count){
  var n = Math.min(count, state.particles.length);
  state.particles.splice(state.particles.length - n, n);
  updateParticleDisplay();
}

function setupCanvas(){
  var rect = canvas.parentElement.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  state.cssWidth = rect.width;
  state.cssHeight = rect.height;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  collisionCanvas.width = collisionCanvas.parentElement.clientWidth || 296;
}

function updateParticleVelocities(oldT, newT){
  var ratio = Math.sqrt(newT / oldT);
  var parts = state.particles;
  for(var i=0; i<parts.length; i++){
    parts[i].vx *= ratio;
    parts[i].vy *= ratio;
  }
}

function constrainParticles(bounds){
  var parts = state.particles;
  for(var i=0; i<parts.length; i++){
    var p = parts[i];
    if(p.x - p.r < bounds.left){ p.x = bounds.left + p.r; p.vx = Math.abs(p.vx); }
    if(p.x + p.r > bounds.right){ p.x = bounds.right - p.r; p.vx = -Math.abs(p.vx); }
    if(p.y - p.r < bounds.top){ p.y = bounds.top + p.r; p.vy = Math.abs(p.vy); }
    if(p.y + p.r > bounds.bottom){ p.y = bounds.bottom - p.r; p.vy = -Math.abs(p.vy); }
  }
}

function updatePhysics(){
  if(state.paused) return 0;

  var bounds = getChamberBounds();
  var parts = state.particles;
  var n = parts.length;
  var collisions = 0;

  for(var i=0; i<n; i++){
    var p = parts[i];
    p.x += p.vx * 0.6;
    p.y += p.vy * 0.6;
  }

  for(var i=0; i<n; i++){
    var p = parts[i];
    if(p.x - p.r < bounds.left){ p.x = bounds.left + p.r; p.vx = Math.abs(p.vx) * 0.98; collisions++; }
    if(p.x + p.r > bounds.right){ p.x = bounds.right - p.r; p.vx = -Math.abs(p.vx) * 0.98; collisions++; }
    if(p.y - p.r < bounds.top){ p.y = bounds.top + p.r; p.vy = Math.abs(p.vy) * 0.98; collisions++; }
    if(p.y + p.r > bounds.bottom){ p.y = bounds.bottom - p.r; p.vy = -Math.abs(p.vy) * 0.98; collisions++; }
  }

  var limit = Math.min(n, 200);
  for(var i=0; i<limit; i++){
    var a = parts[i];
    for(var j=i+1; j<limit; j++){
      var b = parts[j];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      var minDist = a.r + b.r;

      if(dist < minDist && dist > 0.001){
        var nx = dx / dist;
        var ny = dy / dist;
        var overlap = minDist - dist;
        var half = overlap * 0.5;
        a.x -= nx * half;
        a.y -= ny * half;
        b.x += nx * half;
        b.y += ny * half;

        var dvx = a.vx - b.vx;
        var dvy = a.vy - b.vy;
        var dvn = dvx * nx + dvy * ny;

        if(dvn > 0){
          a.vx -= dvn * nx;
          a.vy -= dvn * ny;
          b.vx += dvn * nx;
          b.vy += dvn * ny;
        }
      }
    }
  }

  state.collisionCount = collisions;

  state.collisionHistory.push(collisions);
  if(state.collisionHistory.length > COLLISION_HISTORY_LEN){
    state.collisionHistory.shift();
  }

  return collisions;
}

function render(){
  var cssW = state.cssWidth;
  var cssH = state.cssHeight;
  var dpr = window.devicePixelRatio || 1;

  if(cssW === 0 || cssH === 0) return;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.scale(dpr, dpr);

  var bounds = getChamberBounds();

  ctx.fillStyle = '#05080f';
  ctx.fillRect(bounds.left-2, bounds.top-2, bounds.right-bounds.left+4, bounds.bottom-bounds.top+4);

  var parts = state.particles;
  for(var i=0; i<parts.length; i++){
    var p = parts[i];
    if(p.x < bounds.left || p.x > bounds.right || p.y < bounds.top || p.y > bounds.bottom) continue;
    var col = tempColor(state.temperature);
    var rs = p.r * 2.5;
    var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rs);
    grad.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.25)');
    grad.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rs, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 3;
  ctx.strokeRect(bounds.left, bounds.top, bounds.right-bounds.left, bounds.bottom-bounds.top);

  var pistonX = bounds.right;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pistonX, bounds.top);
  ctx.lineTo(pistonX, bounds.bottom);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(pistonX - 1, bounds.top - 8, 2, 6);
  ctx.fillRect(pistonX - 1, bounds.bottom + 2, 2, 6);

  ctx.fillStyle = '#f59e0b44';
  ctx.fillRect(pistonX - 12, bounds.top + 20, 10, 20);
  ctx.fillRect(pistonX - 12, bounds.bottom - 40, 10, 20);

  ctx.fillStyle = '#1f2937';
  ctx.font = '8px ui-monospace,Consolas,monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(Math.round(state.volumePct) + '%', cssW - 8, cssH - 6);

  renderCollisionGraph();
}

function renderCollisionGraph(){
  var cvs = collisionCanvas;
  var w = cvs.width;
  var h = cvs.height;
  var cctx = collisionCtx;

  cctx.clearRect(0, 0, w, h);

  var data = state.collisionHistory;
  var len = data.length;
  if(len === 0) return;

  var maxVal = 1;
  for(var i=0; i<len; i++){
    if(data[i] > maxVal) maxVal = data[i];
  }
  maxVal = Math.ceil(maxVal * 1.2);

  var barW = w / COLLISION_HISTORY_LEN;
  var t = state.temperature;
  var baseCol = tempColor(t);

  for(var i=0; i<len; i++){
    var bh = (data[i] / maxVal) * (h - 4);
    var x = i * barW;
    cctx.fillStyle = 'rgba(' + baseCol[0] + ',' + baseCol[1] + ',' + baseCol[2] + ',0.7)';
    cctx.fillRect(x, h - 2 - bh, Math.max(barW - 1, 1), bh);
  }
}

function updateTelemetry(){
  var P = getPressure();
  var V = getVolume();
  var n = state.particles.length;
  var avgColl = 0;
  var hist = state.collisionHistory;
  var hl = hist.length;
  for(var i=0; i<hl; i++) avgColl += hist[i];
  avgColl = hl > 0 ? Math.round(avgColl / hl * 60) : 0;

  pressureValue.textContent = P.toFixed(2) + ' atm';
  volumeValue.textContent = V.toFixed(2) + ' L';
  particleValue.textContent = n;
  collisionValue.textContent = avgColl + ' /s';

  statusPressure.textContent = 'P = ' + P.toFixed(2) + ' atm';

  var pPct = clamp(P / PRESSURE_CRIT, 0, 1.5) * 100;
  pressureBar.style.width = Math.min(pPct, 100) + '%';

  if(P >= PRESSURE_SAFETY){
    cardPressure.setAttribute('data-level', 'critical');
    statusBar.setAttribute('data-level', 'critical');
    statusText.textContent = 'SYSTEM STATUS: CRITICAL PRESSURE OVERLOAD';
    triggerSafetyRelease();
  } else if(P >= PRESSURE_CRIT){
    cardPressure.setAttribute('data-level', 'critical');
    statusBar.setAttribute('data-level', 'critical');
    statusText.textContent = 'SYSTEM STATUS: CRITICAL PRESSURE';
    pressureBar.style.background = '#ef4444';
  } else if(P >= PRESSURE_WARN){
    cardPressure.setAttribute('data-level', 'warning');
    statusBar.setAttribute('data-level', 'elevated');
    statusText.textContent = 'SYSTEM STATUS: ELEVATED PRESSURE';
  } else {
    cardPressure.setAttribute('data-level', 'stable');
    statusBar.setAttribute('data-level', 'stable');
    statusText.textContent = 'SYSTEM STATUS: STABLE';
  }
}

function updateParticleDisplay(){
  displayCount.textContent = state.particles.length;
}

function triggerSafetyRelease(){
  if(state.shakeActive) return;
  state.shakeActive = true;

  var vp = $('#viewport');
  vp.classList.add('shake');
  setTimeout(function(){ vp.classList.remove('shake'); }, 500);

  var release = Math.max(1, Math.floor(state.particles.length * 0.25));
  removeParticles(release);

  setTimeout(function(){ state.shakeActive = false; }, 600);
}

function tick(timestamp){
  if(state.lastTime === 0) state.lastTime = timestamp;
  var dt = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;
  if(dt > 0.1) dt = 0.016;

  state.time += state.paused ? 0 : dt;

  updatePhysics();
  updateTelemetry();
  render();

  requestAnimationFrame(tick);
}

function handleResize(){
  setupCanvas();
  var bounds = getChamberBounds();
  constrainParticles(bounds);
}

function bindControls(){
  sliderTemp.addEventListener('input', function(){
    var newT = parseFloat(this.value);
    var oldT = state.temperature;
    state.temperature = newT;
    updateParticleVelocities(oldT, newT);
    displayTemp.textContent = Math.round(newT) + ' K';
  });

  sliderVol.addEventListener('input', function(){
    var newV = parseFloat(this.value);
    state.volumePct = newV;
    displayVol.textContent = Math.round(newV) + '%';
    var bounds = getChamberBounds();
    constrainParticles(bounds);
  });

  btnPause.addEventListener('click', function(){
    state.paused = !state.paused;
    this.textContent = state.paused ? 'RESUME MOVEMENT' : 'PAUSE SIMULATION';
  });

  btnReset.addEventListener('click', function(){
    state.temperature = 273;
    state.volumePct = 50;
    sliderTemp.value = 273;
    sliderVol.value = 50;
    displayTemp.textContent = '273 K';
    displayVol.textContent = '50%';

    state.particles = [];
    spawnParticles(100);
    state.collisionHistory = [];
    state.collisionCount = 0;
    state.time = 0;
    state.paused = false;
    btnPause.textContent = 'PAUSE SIMULATION';

    var bounds = getChamberBounds();
    constrainParticles(bounds);
  });

  btnAdd.addEventListener('click', function(){
    spawnParticles(PARTICLE_BATCH);
    var bounds = getChamberBounds();
    constrainParticles(bounds);
  });

  btnRemove.addEventListener('click', function(){
    removeParticles(PARTICLE_BATCH);
  });
}

function init(){
  setupCanvas();
  bindControls();
  spawnParticles(100);

  window.addEventListener('resize', handleResize);

  requestAnimationFrame(tick);
}

init();

})();
