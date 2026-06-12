// script.js - Core 2D Canvas Physics Engine and Simulator

const STATE = {
  // Simulation Loop
  isPlaying: true,
  fps: 60,
  lastFrameTime: 0,
  dt: 0.16, // fixed time step

  // Sandbox Entities
  particles: [],
  walls: [],
  springs: [],

  // Engine Configuration Settings
  gravityX: 0.0,
  gravityY: 0.5,
  restitution: 0.75,
  friction: 0.01,
  stiffness: 0.05,

  // Tool Selection
  activeTool: "spawn", // "spawn" | "wall" | "spring" | "select"
  selectedColor: "#8b5cf6",
  spawnRadius: 20,
  spawnMass: 2.0,

  // Mouse Interaction States
  mouse: {
    x: 0,
    y: 0,
    isDown: false,
    startX: 0,
    startY: 0
  },
  grabbedParticle: null,
  dragTargetParticle: null
};

// --- INITIAL LOADERS ---
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  setupCanvas();
  loadDefaultEnvironment();
  requestAnimationFrame(loop);
});

// --- CANVAS EVENT BINDINGS ---
let canvas, ctx;

function setupCanvas() {
  canvas = document.getElementById("physics-canvas");
  ctx = canvas.getContext("2d");

  // Mouse bindings
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseUp);

  // Prevent context menu
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}

// --- PHYSICS ENGINE LOGIC ---

// Vector collision math equations
function loop(timestamp) {
  if (!STATE.lastFrameTime) STATE.lastFrameTime = timestamp;
  const elapsed = timestamp - STATE.lastFrameTime;
  
  if (STATE.isPlaying) {
    updatePhysics();
  }
  
  render();
  
  STATE.lastFrameTime = timestamp;
  
  // Update HUD fps
  const fps = Math.round(1000 / (elapsed || 1));
  document.getElementById("stat-fps").textContent = fps > 60 ? 60 : fps;
  document.getElementById("stat-particles").textContent = STATE.particles.length;
  document.getElementById("stat-barriers").textContent = STATE.walls.length;

  requestAnimationFrame(loop);
}

function updatePhysics() {
  const dt = STATE.dt;

  // 1. Apply Gravity and Friction to velocities
  STATE.particles.forEach(p => {
    if (p.isGrabbed) return; // ignore physics updates on active grab
    p.vx += STATE.gravityX * dt;
    p.vy += STATE.gravityY * dt;
    p.vx *= (1 - STATE.friction);
    p.vy *= (1 - STATE.friction);
  });

  // 2. Resolve Spring Constraints tethers (Hooke's Law)
  STATE.springs.forEach(s => {
    const dx = s.p2.x - s.p1.x;
    const dy = s.p2.y - s.p1.y;
    const dist = Math.hypot(dx, dy) || 0.01;
    
    // spring force calculation
    const force = (dist - s.restLength) * STATE.stiffness;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    // Apply forces based on masses
    const mSum = s.p1.mass + s.p2.mass;
    if (!s.p1.isGrabbed) {
      s.p1.vx += fx / s.p1.mass;
      s.p1.vy += fy / s.p1.mass;
    }
    if (!s.p2.isGrabbed) {
      s.p2.vx -= fx / s.p2.mass;
      s.p2.vy -= fy / s.p2.mass;
    }
  });

  // 3. Update Positions
  STATE.particles.forEach(p => {
    if (p.isGrabbed) return;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  });

  // 4. Resolve Wall Segment line boundary collisions
  STATE.particles.forEach(p => {
    STATE.walls.forEach(w => {
      resolveWallCollision(p, w);
    });
  });

  // 5. Resolve Particle-to-Particle elastic collisions (Spatial Grid Partitioning for 300+ particles)
  resolveParticleCollisionsGrid();

  // 6. Resolve Screen boundaries limits
  STATE.particles.forEach(p => {
    if (p.isGrabbed) return;

    // Left/Right
    if (p.x < p.radius) {
      p.x = p.radius;
      p.vx = -p.vx * STATE.restitution;
    } else if (p.x > canvas.width - p.radius) {
      p.x = canvas.width - p.radius;
      p.vx = -p.vx * STATE.restitution;
    }

    // Top/Bottom
    if (p.y < p.radius) {
      p.y = p.radius;
      p.vy = -p.vy * STATE.restitution;
    } else if (p.y > canvas.height - p.radius) {
      p.y = canvas.height - p.radius;
      p.vy = -p.vy * STATE.restitution;
    }
  });
}

// Circle-to-Circle Elastic collision Math
function resolveParticleCollision(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const minDist = p1.radius + p2.radius;

  if (dist >= minDist) return; // no collision

  // Normal vector
  const nx = dx / (dist || 1);
  const ny = dy / (dist || 1);

  // Position overlap correction (avoids stickiness)
  const overlap = minDist - dist;
  const percent = 0.5; // position correction percentage
  const correctionX = nx * overlap * percent;
  const correctionY = ny * overlap * percent;

  if (!p1.isGrabbed) {
    p1.x -= correctionX;
    p1.y -= correctionY;
  }
  if (!p2.isGrabbed) {
    p2.x += correctionX;
    p2.y += correctionY;
  }

  // Relative velocity
  const rvx = p2.vx - p1.vx;
  const rvy = p2.vy - p1.vy;

  // Velocity along normal
  const velAlongNormal = rvx * nx + rvy * ny;

  // Only resolve if velocities are pointing towards each other
  if (velAlongNormal > 0) return;

  // Calculate impulse scalar
  const e = STATE.restitution;
  let impulse = -(1 + e) * velAlongNormal;
  impulse /= (1 / p1.mass + 1 / p2.mass);

  // Apply impulse vectors
  const impulseX = nx * impulse;
  const impulseY = ny * impulse;

  if (!p1.isGrabbed) {
    p1.vx -= (1 / p1.mass) * impulseX;
    p1.vy -= (1 / p1.mass) * impulseY;
  }
  if (!p2.isGrabbed) {
    p2.vx += (1 / p2.mass) * impulseX;
    p2.vy += (1 / p2.mass) * impulseY;
  }
}

// Spatial grid partition to optimize collision detection
function resolveParticleCollisionsGrid() {
  const cellSize = 90; // Larger than maximum diameter (2 * 45 = 90)
  const grid = {};

  // 1. Assign particles to grid cells
  for (let i = 0; i < STATE.particles.length; i++) {
    const p = STATE.particles[i];
    const col = Math.floor(p.x / cellSize);
    const row = Math.floor(p.y / cellSize);
    const cellKey = `${col},${row}`;
    if (!grid[cellKey]) {
      grid[cellKey] = [];
    }
    grid[cellKey].push(p);
  }

  // 2. Resolve collisions between adjacent cells
  const checkedPairs = new Set();

  for (let i = 0; i < STATE.particles.length; i++) {
    const p1 = STATE.particles[i];
    const col = Math.floor(p1.x / cellSize);
    const row = Math.floor(p1.y / cellSize);

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const cellKey = `${col + dc},${row + dr}`;
        const cellParticles = grid[cellKey];
        if (cellParticles) {
          for (let j = 0; j < cellParticles.length; j++) {
            const p2 = cellParticles[j];
            if (p1.id === p2.id) continue;

            // Sort IDs to ensure unique pair checking
            const pairKey = p1.id < p2.id ? `${p1.id}_${p2.id}` : `${p2.id}_${p1.id}`;
            if (checkedPairs.has(pairKey)) continue;

            checkedPairs.add(pairKey);
            resolveParticleCollision(p1, p2);
          }
        }
      }
    }
  }
}

// Circle-to-Line segment rebound math
function resolveWallCollision(p, w) {
  // Vector line segment
  const ldx = w.x2 - w.x1;
  const ldy = w.y2 - w.y1;
  const lenSq = ldx * ldx + ldy * ldy;
  
  if (lenSq === 0) return;

  // Project circle center onto line segment to find closest point
  const t = Math.max(0, Math.min(1, ((p.x - w.x1) * ldx + (p.y - w.y1) * ldy) / lenSq));
  const cx = w.x1 + t * ldx;
  const cy = w.y1 + t * ldy;

  const dx = p.x - cx;
  const dy = p.y - cy;
  const dist = Math.hypot(dx, dy);

  if (dist >= p.radius) return; // no collision

  // Collision Normal vector
  const nx = dx / (dist || 1);
  const ny = dy / (dist || 1);

  // Position overlap correction
  const overlap = p.radius - dist;
  p.x += nx * overlap;
  p.y += ny * overlap;

  // Rebound reflection math
  const dot = p.vx * nx + p.vy * ny;
  if (dot < 0) {
    p.vx -= (1 + STATE.restitution) * dot * nx;
    p.vy -= (1 + STATE.restitution) * dot * ny;
  }
}

// --- RENDER/DRAW LOOPS ---
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  ctx.fillStyle = isDark ? "#05070a" : "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Grid background
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.03)";
  ctx.lineWidth = 1;
  const cellSize = 40;
  for (let x = 0; x < canvas.width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 1. Draw Spring Cords
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  STATE.springs.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.p1.x, s.p1.y);
    ctx.lineTo(s.p2.x, s.p2.y);
    ctx.stroke();
  });

  // 2. Draw Walls
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 6;
  ctx.shadowBlur = isDark ? 8 : 0;
  ctx.shadowColor = "#f59e0b";
  STATE.walls.forEach(w => {
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    ctx.lineTo(w.x2, w.y2);
    ctx.stroke();
  });
  // reset shadow
  ctx.shadowBlur = 0;

  // 3. Draw Particles
  STATE.particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    
    // Add neon glow
    ctx.shadowBlur = isDark ? 10 : 0;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw little inner specular ring
    ctx.beginPath();
    ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();

    // If grabbed/slinging, draw velocity trajectory line
    if (p.isGrabbed && STATE.activeTool === "select" && STATE.mouse.isDown) {
      const dx = STATE.mouse.x - p.x;
      const dy = STATE.mouse.y - p.y;
      
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - dx, p.y - dy); // inverted launcher vector
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Draw slingshot target circle anchor
      ctx.beginPath();
      ctx.arc(p.x - dx, p.y - dy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee";
      ctx.fill();
    }
  });

  // 4. Temporary Visual overlays during drag operations
  if (STATE.mouse.isDown) {
    if (STATE.activeTool === "wall") {
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(STATE.mouse.startX, STATE.mouse.startY);
      ctx.lineTo(STATE.mouse.x, STATE.mouse.y);
      ctx.stroke();
    } 
    else if (STATE.activeTool === "spring" && STATE.dragTargetParticle) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(STATE.dragTargetParticle.x, STATE.dragTargetParticle.y);
      ctx.lineTo(STATE.mouse.x, STATE.mouse.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// --- MOUSE HANDLERS ---
function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mX = e.clientX - rect.left;
  const mY = e.clientY - rect.top;

  STATE.mouse.isDown = true;
  STATE.mouse.startX = mX;
  STATE.mouse.startY = mY;
  STATE.mouse.x = mX;
  STATE.mouse.y = mY;

  const clickedParticle = getParticleAt(mX, mY);

  if (STATE.activeTool === "spawn") {
    // Spawns immediately on down click
    spawnParticle(mX, mY);
  } 
  else if (STATE.activeTool === "select" && clickedParticle) {
    STATE.grabbedParticle = clickedParticle;
    clickedParticle.isGrabbed = true;
    clickedParticle.vx = 0;
    clickedParticle.vy = 0;
  } 
  else if (STATE.activeTool === "spring" && clickedParticle) {
    STATE.dragTargetParticle = clickedParticle;
  }
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mX = e.clientX - rect.left;
  const mY = e.clientY - rect.top;

  STATE.mouse.x = mX;
  STATE.mouse.y = mY;

  // Update grabbed particle positions
  if (STATE.grabbedParticle && STATE.activeTool === "select") {
    // Do not set position directly to cursor coordinates; instead, 
    // let user drag backwards to calculate launch velocity.
  }
}

function handleMouseUp(e) {
  if (!STATE.mouse.isDown) return;

  const rect = canvas.getBoundingClientRect();
  const mX = e.clientX - rect.left;
  const mY = e.clientY - rect.top;

  if (STATE.activeTool === "wall") {
    // Add Wall segment
    if (Math.hypot(mX - STATE.mouse.startX, mY - STATE.mouse.startY) > 10) {
      STATE.walls.push({
        x1: STATE.mouse.startX,
        y1: STATE.mouse.startY,
        x2: mX,
        y2: mY
      });
    }
  } 
  else if (STATE.activeTool === "spring" && STATE.dragTargetParticle) {
    const endParticle = getParticleAt(mX, mY);
    if (endParticle && endParticle !== STATE.dragTargetParticle) {
      // Create Spring cord
      const dist = Math.hypot(endParticle.x - STATE.dragTargetParticle.x, endParticle.y - STATE.dragTargetParticle.y);
      STATE.springs.push({
        p1: STATE.dragTargetParticle,
        p2: endParticle,
        restLength: dist
      });
    }
  } 
  else if (STATE.activeTool === "select" && STATE.grabbedParticle) {
    // Launch slingshot
    const dx = mX - STATE.grabbedParticle.x;
    const dy = mY - STATE.grabbedParticle.y;
    
    STATE.grabbedParticle.isGrabbed = false;
    
    // slingshot launch formula: velocity is proportional to drag distance vector
    const multiplier = 0.25;
    STATE.grabbedParticle.vx = -dx * multiplier;
    STATE.grabbedParticle.vy = -dy * multiplier;
    
    STATE.grabbedParticle = null;
  }

  STATE.mouse.isDown = false;
  STATE.dragTargetParticle = null;
}

// --- UTILITIES & FACTORIES ---
function getParticleAt(x, y) {
  return STATE.particles.find(p => Math.hypot(p.x - x, p.y - y) <= p.radius);
}

function spawnParticle(x, y, vx = 0, vy = 0, radius = STATE.spawnRadius, mass = STATE.spawnMass) {
  STATE.particles.push({
    id: "p-" + Date.now() + Math.random().toString(36).substring(2, 6),
    x, y, vx, vy, radius, mass,
    color: STATE.selectedColor,
    isGrabbed: false
  });
}

function loadDefaultEnvironment() {
  STATE.particles = [];
  STATE.walls = [];
  STATE.springs = [];
  
  // Floor and ceiling wall lines
  STATE.walls.push({ x1: 20, y1: 400, x2: 700, y2: 400 });
}

// --- PRESETS ---
function loadPreset(presetKey) {
  STATE.particles = [];
  STATE.walls = [];
  STATE.springs = [];

  if (presetKey === "cradle") {
    // Newton's cradle setup
    STATE.gravityY = 0.8;
    STATE.gravityX = 0;
    STATE.restitution = 1.0; // fully elastic bounciness
    document.getElementById("slider-gravity-y").value = 0.8;
    document.getElementById("val-gravity-y").textContent = 0.8;
    document.getElementById("slider-restitution").value = 1.0;
    document.getElementById("val-restitution").textContent = 1.0;

    const startX = 220;
    const startY = 120;
    const anchorY = 60;
    const spacing = 40;
    const length = 180;

    for (let i = 0; i < 5; i++) {
      const pX = startX + i * spacing;
      const pY = startY + length;
      
      const p = {
        id: `cradle-p-${i}`,
        x: pX,
        y: pY,
        vx: 0,
        vy: 0,
        radius: 20,
        mass: 5.0,
        color: i === 0 ? "#f43f5e" : "#8b5cf6",
        isGrabbed: false
      };
      
      // If first ball, elevate it to start the cradle loop swing
      if (i === 0) {
        p.x -= 100;
        p.y -= 30;
      }

      STATE.particles.push(p);

      // Create static anchors
      const anchor = { x: pX, y: anchorY, mass: 100000, isGrabbed: true }; // fixed weight anchor
      
      STATE.springs.push({
        p1: anchor,
        p2: p,
        restLength: length
      });
    }
  } 
  else if (presetKey === "pachinko") {
    // Plinko Grid
    STATE.gravityY = 0.6;
    STATE.gravityX = 0;
    STATE.restitution = 0.5;
    document.getElementById("slider-gravity-y").value = 0.6;
    document.getElementById("val-gravity-y").textContent = 0.6;
    document.getElementById("slider-restitution").value = 0.5;
    document.getElementById("val-restitution").textContent = 0.5;

    // Draw static barriers nodes
    const rows = 4;
    const cols = 7;
    const spacingX = 80;
    const spacingY = 60;
    
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (spacingX / 2);
      for (let c = 0; c < cols; c++) {
        const x = 140 + c * spacingX + offset;
        const y = 100 + r * spacingY;
        
        // Static pins (infinite mass)
        STATE.particles.push({
          id: `pin-${r}-${c}`,
          x, y, vx: 0, vy: 0,
          radius: 8,
          mass: 100000,
          color: "#eab308",
          isGrabbed: true
        });
      }
    }

    // bottom container divider walls
    for (let i = 0; i <= 6; i++) {
      const x = 110 + i * 85;
      STATE.walls.push({ x1: x, y1: 340, x2: x, y2: 410 });
    }
    STATE.walls.push({ x1: 20, y1: 410, x2: 700, y2: 410 });

    // spawn initial balls
    for (let k = 0; k < 6; k++) {
      setTimeout(() => {
        if (STATE.particles.length < 50) {
          spawnParticle(300 + Math.random() * 120, 20, 0, 0, 14, 2);
        }
      }, k * 1200);
    }
  } 
  else if (presetKey === "chaos") {
    // Zero gravity chaos
    STATE.gravityY = 0;
    STATE.gravityX = 0;
    STATE.restitution = 0.9;
    document.getElementById("slider-gravity-y").value = 0;
    document.getElementById("val-gravity-y").textContent = 0;
    document.getElementById("slider-restitution").value = 0.9;
    document.getElementById("val-restitution").textContent = 0.9;

    // Spawn orbital cluster
    spawnParticle(220, 160, 2, -1, 24, 4);
    spawnParticle(420, 220, -2, 1, 20, 3);
    spawnParticle(300, 100, 1, 3, 26, 5);

    // floor walls
    STATE.walls.push({ x1: 50, y1: 360, x2: 670, y2: 360 });
    STATE.walls.push({ x1: 50, y1: 60, x2: 670, y2: 60 });
  }
}

// --- UI EVENT ACTIONS BINDING ---
function initUI() {
  // Theme Toggle
  document.getElementById("theme-toggle").addEventListener("click", () => {
    STATE.theme = STATE.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", STATE.theme);
    syncThemeUI();
  });

  // Play/Pause simulation
  const toggleBtn = document.getElementById("btn-toggle-sim");
  toggleBtn.addEventListener("click", () => {
    STATE.isPlaying = !STATE.isPlaying;
    toggleBtn.textContent = STATE.isPlaying ? "⏸ Pause" : "▶ Play";
    toggleBtn.classList.toggle("paused", !STATE.isPlaying);
  });

  // Step debugger button
  document.getElementById("btn-step-sim").addEventListener("click", () => {
    if (!STATE.isPlaying) {
      updatePhysics();
      render();
    }
  });

  // Controls Sliders
  document.getElementById("slider-gravity-y").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-gravity-y").textContent = val;
    STATE.gravityY = val;
  });

  document.getElementById("slider-gravity-x").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-gravity-x").textContent = val;
    STATE.gravityX = val;
  });

  document.getElementById("slider-restitution").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-restitution").textContent = val;
    STATE.restitution = val;
  });

  document.getElementById("slider-friction").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-friction").textContent = val;
    STATE.friction = val;
  });

  document.getElementById("slider-stiffness").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-stiffness").textContent = val;
    STATE.stiffness = val;
  });

  // Spawn Config sliders
  document.getElementById("slider-radius").addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("val-radius").textContent = val;
    STATE.spawnRadius = val;
  });

  document.getElementById("slider-mass").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-mass").textContent = val;
    STATE.spawnMass = val;
  });

  // Colors picker grid
  document.querySelectorAll(".color-palette-grid .color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".color-palette-grid .color-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.selectedColor = btn.dataset.color;
    });
  });

  // Tools Selection triggers
  const tools = ["spawn", "wall", "spring", "select"];
  tools.forEach(t => {
    document.getElementById(`tool-${t}`).addEventListener("click", () => {
      tools.forEach(o => document.getElementById(`tool-${o}`).classList.remove("active"));
      document.getElementById(`tool-${t}`).classList.add("active");
      STATE.activeTool = t;
    });
  });

  // Triggers
  document.getElementById("btn-clear-particles").addEventListener("click", () => {
    STATE.particles = STATE.particles.filter(p => p.isGrabbed); // clear only non-static elements
  });

  document.getElementById("btn-clear-walls").addEventListener("click", () => {
    STATE.walls = [];
    STATE.springs = [];
  });

  // Preset selector
  document.getElementById("preset-selector").addEventListener("change", (e) => {
    if (e.target.value !== "none") {
      loadPreset(e.target.value);
    }
  });
}

function syncThemeUI() {
  const sun = document.querySelector(".sun-icon");
  const moon = document.querySelector(".moon-icon");
  if (STATE.theme === "dark") {
    sun.classList.remove("hidden");
    moon.classList.add("hidden");
  } else {
    sun.classList.add("hidden");
    moon.classList.remove("hidden");
  }
}
