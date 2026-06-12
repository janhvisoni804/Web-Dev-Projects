// script.js - Core Automata Simulator Editor and Engines

const STATE = {
  machineType: "dfa", // "dfa" | "pda" | "tm"
  
  // Editor data
  nodes: [],
  transitions: [],
  selectedNode: null,
  selectedTransition: null,
  activeTool: "state", // "state" | "transition" | "delete"
  
  // Dragging states
  isDragging: false,
  draggedNode: null,
  
  // Transition arrow link drag
  isLinking: false,
  linkSourceNode: null,
  mousePos: {x: 0, y: 0},
  
  // Pending transition configuration coordinates/data
  pendingTransition: null,

  // Running Simulation state
  isPlaying: false,
  clockSpeedHz: 3,
  timerId: null,
  isHalted: false,
  
  // Simulation input variables
  inputString: "010100",
  currentCharIndex: 0,
  currentNode: null,
  
  // Peripherals execution buffers
  pdaStack: [],
  tmTape: [],
  tmHeadIndex: 0
};

// --- INITIAL BUILDERS ---
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  setupCanvas();
  loadPreset("dfa-even");
});

let canvas, ctx;

function setupCanvas() {
  canvas = document.getElementById("editor-canvas");
  ctx = canvas.getContext("2d");

  // Mouse bindings
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("dblclick", handleDoubleClick);

  // Prevent selection menu
  canvas.addEventListener("contextmenu", e => e.preventDefault());

  // Animation Loop
  function drawLoop() {
    drawGraph();
    requestAnimationFrame(drawLoop);
  }
  requestAnimationFrame(drawLoop);
}

// --- PRESET LOADER SYSTEMS ---
function loadPreset(key) {
  STATE.nodes = [];
  STATE.transitions = [];
  resetSimulationState();

  if (key === "dfa-even") {
    STATE.machineType = "dfa";
    document.getElementById("machine-title-badge").textContent = "DFA";
    document.getElementById("input-string-test").value = "101001";
    document.getElementById("card-pda-stack").classList.add("hidden");
    
    // Help instructions
    document.getElementById("machine-help-text").innerHTML = `
      <strong>DFA: Even Zeros Count</strong>:<br>
      Checks if binary inputs contain an even number of '0' characters.<br>
      - State <code>q_even</code> is final (double-circled).<br>
      - Processes character-by-character.
    `;

    const qEven = { id: "q-even", name: "q_even", x: 220, y: 210, isStart: true, isAccept: true };
    const qOdd = { id: "q-odd", name: "q_odd", x: 460, y: 210, isStart: false, isAccept: false };

    STATE.nodes.push(qEven, qOdd);

    STATE.transitions.push(
      { from: "q-even", to: "q-odd", read: "0" },
      { from: "q-odd", to: "q-even", read: "0" },
      { from: "q-even", to: "q-even", read: "1" },
      { from: "q-odd", to: "q-odd", read: "1" }
    );
  } 
  else if (key === "pda-brackets") {
    STATE.machineType = "pda";
    document.getElementById("machine-title-badge").textContent = "PDA";
    document.getElementById("input-string-test").value = "(())()";
    document.getElementById("card-pda-stack").classList.remove("hidden");

    document.getElementById("machine-help-text").innerHTML = `
      <strong>PDA: Balanced Brackets</strong>:<br>
      Uses stack logic to evaluate balanced bracket sequences.<br>
      - Pushes <code>(</code> onto Stack when read.<br>
      - Pops <code>(</code> from Stack when <code>)</code> read.<br>
      - Lambda jump (ε) to <code>q_accept</code> when finished.
    `;

    const q0 = { id: "pda-q0", name: "q0", x: 160, y: 210, isStart: true, isAccept: false };
    const q1 = { id: "pda-q1", name: "q1", x: 340, y: 210, isStart: false, isAccept: false };
    const q2 = { id: "pda-q2", name: "q2", x: 520, y: 210, isStart: false, isAccept: true };

    STATE.nodes.push(q0, q1, q2);

    STATE.transitions.push(
      // start by pushing base symbol (using ε read, ε pop, push Z0 or simply push bracket)
      { from: "pda-q0", to: "pda-q1", read: "(", pop: "ε", push: "(" },
      { from: "pda-q1", to: "pda-q1", read: "(", pop: "ε", push: "(" },
      { from: "pda-q1", to: "pda-q1", read: ")", pop: "(", push: "ε" },
      { from: "pda-q1", to: "pda-q2", read: "ε", pop: "ε", push: "ε" }
    );
  }
  else if (key === "tm-binary") {
    STATE.machineType = "tm";
    document.getElementById("machine-title-badge").textContent = "Turing Machine";
    document.getElementById("input-string-test").value = "1011";
    document.getElementById("card-pda-stack").classList.add("hidden");

    document.getElementById("machine-help-text").innerHTML = `
      <strong>Turing Machine: Binary Incrementer</strong>:<br>
      Increments a binary input number by 1 (e.g. 1011 -> 1100).<br>
      - <code>q0</code> scans right to find blank <code>B</code>.<br>
      - <code>q1</code> moves left carrying digits/adding 1.<br>
      - <code>q_halt</code> halts when finished.
    `;

    const q0 = { id: "tm-q0", name: "q0", x: 160, y: 210, isStart: true, isAccept: false };
    const q1 = { id: "tm-q1", name: "q1", x: 340, y: 210, isStart: false, isAccept: false };
    const qHalt = { id: "tm-q2", name: "q_halt", x: 520, y: 210, isStart: false, isAccept: true };

    STATE.nodes.push(q0, q1, qHalt);

    STATE.transitions.push(
      // q0 search right
      { from: "tm-q0", to: "tm-q0", read: "0", write: "0", move: "R" },
      { from: "tm-q0", to: "tm-q0", read: "1", write: "1", move: "R" },
      { from: "tm-q0", to: "tm-q1", read: "B", write: "B", move: "L" },
      
      // q1 carry logic
      { from: "tm-q1", to: "tm-q1", read: "1", write: "0", move: "L" },
      { from: "tm-q1", to: "tm-q2", read: "0", write: "1", move: "N" },
      { from: "tm-q1", to: "tm-q2", read: "B", write: "1", move: "N" }
    );
  }

  loadTapeDisplay();
  loadBatchTestCases();
  updatePeripheralsUI();
}

// --- PERIPHERAL VIEWERS SYNC ---

function loadTapeDisplay() {
  const tapeSlider = document.getElementById("tape-slider");
  tapeSlider.innerHTML = "";

  const input = document.getElementById("input-string-test").value.trim() || "";
  
  if (STATE.machineType === "tm") {
    // Turing Machine tape gets 20 elements, filled with B at ends
    STATE.tmTape = Array(20).fill("B");
    
    // Load input string at offset 4
    const offset = 4;
    for (let i = 0; i < input.length; i++) {
      STATE.tmTape[offset + i] = input[i];
    }
    STATE.tmHeadIndex = offset;
  } else {
    // DFA/PDA simple input tape arrays
    STATE.tmTape = input.split("");
    STATE.tmHeadIndex = STATE.currentCharIndex;
  }

  renderTapeCells();
}

function renderTapeCells() {
  const tapeSlider = document.getElementById("tape-slider");
  tapeSlider.innerHTML = "";

  for (let i = 0; i < STATE.tmTape.length; i++) {
    const cell = document.createElement("div");
    cell.className = "tape-cell";
    cell.textContent = STATE.tmTape[i] === "B" ? "B" : STATE.tmTape[i];
    
    if (i === STATE.tmHeadIndex) {
      cell.classList.add("active-head");
    }
    
    tapeSlider.appendChild(cell);
  }

  // Slide/Center tape head
  const cellWidth = 50; // cell (42px) + gap (8px)
  const offsetTranslate = (STATE.tmHeadIndex * cellWidth);
  const viewportCenter = document.querySelector(".tape-viewport").offsetWidth / 2;
  
  // Center translation
  tapeSlider.style.transform = `translateX(${viewportCenter - offsetTranslate - 21}px)`;
  document.getElementById("lbl-tape-index").textContent = STATE.tmHeadIndex;
}

function updatePeripheralsUI() {
  // PDA Stack render
  if (STATE.machineType === "pda") {
    const container = document.getElementById("pda-stack-container");
    container.innerHTML = "";
    
    if (STATE.pdaStack.length === 0) {
      container.innerHTML = `<div class="pda-stack-empty">Stack is empty (ε)</div>`;
      return;
    }

    // Stack display list
    for (let i = 0; i < STATE.pdaStack.length; i++) {
      const cell = document.createElement("div");
      cell.className = "pda-stack-cell";
      cell.textContent = STATE.pdaStack[i];
      container.appendChild(cell);
    }
  }
}

// --- GRAPH NODE CANVAS EDITOR ---

function drawGraph() {
  if (!canvas) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  ctx.fillStyle = isDark ? "#02040a" : "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid background subtle lines
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.02)";
  ctx.lineWidth = 1;
  const cellSize = 40;
  for (let x = 0; x < canvas.width; x += cellSize) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += cellSize) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }

  // 1. Draw Transitions links
  STATE.transitions.forEach(t => {
    const fromNode = STATE.nodes.find(n => n.id === t.from);
    const toNode = STATE.nodes.find(n => n.id === t.to);
    if (fromNode && toNode) {
      drawTransitionArrow(fromNode, toNode, t);
    }
  });

  // 2. Draw Linking Drag Vector Line
  if (STATE.isLinking && STATE.linkSourceNode) {
    ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(STATE.linkSourceNode.x, STATE.linkSourceNode.y);
    ctx.lineTo(STATE.mousePos.x, STATE.mousePos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. Draw Nodes states
  STATE.nodes.forEach(n => {
    const isActive = STATE.currentNode && STATE.currentNode.id === n.id;
    const isSelected = STATE.selectedNode && STATE.selectedNode.id === n.id;

    ctx.shadowBlur = 0;

    // Draw main state circle
    ctx.beginPath();
    ctx.arc(n.x, n.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#12182b" : "#ffffff";
    ctx.fill();

    // Borders
    if (isActive) {
      ctx.strokeStyle = "var(--color-rose)";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "var(--color-rose)";
      ctx.lineWidth = 3.5;
    } else if (isSelected) {
      ctx.strokeStyle = "var(--color-cyan)";
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2.5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Accepting double circle border mapping
    if (n.isAccept) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 21, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Start pointing state vector arrow
    if (n.isStart) {
      ctx.strokeStyle = "var(--color-amber)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(n.x - 45, n.y);
      ctx.lineTo(n.x - 26, n.y);
      ctx.stroke();
      
      // arrow head
      ctx.beginPath();
      ctx.moveTo(n.x - 26, n.y);
      ctx.lineTo(n.x - 32, n.y - 5);
      ctx.lineTo(n.x - 32, n.y + 5);
      ctx.closePath();
      ctx.fillStyle = "var(--color-amber)";
      ctx.fill();
    }

    // Name label
    ctx.fillStyle = isDark ? "#ffffff" : "#000000";
    ctx.font = "600 0.85rem var(--font-body)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(n.name, n.x, n.y);
  });
}

function drawTransitionArrow(from, to, transition) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const color = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  // Render label text details
  let label = transition.read;
  if (STATE.machineType === "pda") {
    label = `${transition.read}, ${transition.pop} ➔ ${transition.push}`;
  } else if (STATE.machineType === "tm") {
    label = `${transition.read} ➔ ${transition.write}, ${transition.move}`;
  }

  // Self loop logic
  if (from.id === to.id) {
    ctx.beginPath();
    // draw a loop circle at top of node
    ctx.arc(from.x, from.y - 26, 18, -Math.PI / 6, (7 * Math.PI) / 6, true);
    ctx.stroke();

    // Arrow head for loop
    const arrowX = from.x + 18 * Math.cos(-Math.PI / 6);
    const arrowY = from.y - 26 + 18 * Math.sin(-Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 4, arrowY + 6);
    ctx.lineTo(arrowX - 4, arrowY + 6);
    ctx.fill();

    // label
    ctx.font = "500 0.72rem var(--font-code)";
    ctx.fillStyle = "var(--color-cyan)";
    ctx.fillText(label, from.x, from.y - 54);
    return;
  }

  // Linear connection
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  
  // Calculate boundary offsets
  const startX = from.x + 26 * Math.cos(angle);
  const startY = from.y + 26 * Math.sin(angle);
  const endX = to.x - 26 * Math.cos(angle);
  const endY = to.y - 26 * Math.sin(angle);

  // Bezier arc curves for multi-connections to avoid overlaps
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  // Apply a curved offset perpendicular to the line direction
  const offsetDistance = 22;
  const perpX = -Math.sin(angle) * offsetDistance;
  const perpY = Math.cos(angle) * offsetDistance;
  
  const ctrlX = midX + perpX;
  const ctrlY = midY + perpY;

  // Draw quadratic curve
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();

  // Draw arrow head at end
  const tangentAngle = Math.atan2(endY - ctrlY, endX - ctrlX);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - 8 * Math.cos(tangentAngle - Math.PI / 6), endY - 8 * Math.sin(tangentAngle - Math.PI / 6));
  ctx.lineTo(endX - 8 * Math.cos(tangentAngle + Math.PI / 6), endY - 8 * Math.sin(tangentAngle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  // Draw label text
  ctx.font = "500 0.72rem var(--font-code)";
  ctx.fillStyle = "var(--color-cyan)";
  ctx.fillText(label, ctrlX + perpX * 0.4, ctrlY + perpY * 0.4);
}

// --- MOUSE HANDLERS ---
function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mX = e.clientX - rect.left;
  const mY = e.clientY - rect.top;

  const node = getNodeAt(mX, mY);

  if (STATE.activeTool === "state") {
    if (node) {
      // Drag state
      STATE.isDragging = true;
      STATE.draggedNode = node;
      STATE.selectedNode = node;
    } else {
      // Spawn new state node
      const name = "q" + STATE.nodes.length;
      STATE.nodes.push({
        id: "node-" + Date.now(),
        name,
        x: mX,
        y: mY,
        isStart: STATE.nodes.length === 0,
        isAccept: false
      });
      loadBatchTestCases(); // Refresh checks
    }
  } 
  else if (STATE.activeTool === "transition" && node) {
    STATE.isLinking = true;
    STATE.linkSourceNode = node;
    STATE.mousePos = {x: mX, y: mY};
  } 
  else if (STATE.activeTool === "delete") {
    if (node) {
      // Delete node and its transitions
      STATE.nodes = STATE.nodes.filter(n => n.id !== node.id);
      STATE.transitions = STATE.transitions.filter(t => t.from !== node.id && t.to !== node.id);
      if (STATE.selectedNode === node) STATE.selectedNode = null;
      loadBatchTestCases();
    }
  }
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mX = e.clientX - rect.left;
  const mY = e.clientY - rect.top;

  if (STATE.isDragging && STATE.draggedNode) {
    STATE.draggedNode.x = mX;
    STATE.draggedNode.y = mY;
  } 
  else if (STATE.isLinking) {
    STATE.mousePos = {x: mX, y: mY};
  }
}

function handleMouseUp(e) {
  if (STATE.isLinking && STATE.linkSourceNode) {
    const rect = canvas.getBoundingClientRect();
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;

    const targetNode = getNodeAt(mX, mY);
    if (targetNode) {
      // Open Context Modal modal window to configure transition triggers
      STATE.pendingTransition = { from: STATE.linkSourceNode.id, to: targetNode.id };
      openTransitionDialog();
    }
  }

  STATE.isDragging = false;
  STATE.draggedNode = null;
  STATE.isLinking = false;
  STATE.linkSourceNode = null;
}

function handleDoubleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mX = e.clientX - rect.left;
  const mY = e.clientY - rect.top;

  const node = getNodeAt(mX, mY);
  if (node) {
    // Toggle accepting final state loops
    node.isAccept = !node.isAccept;
    loadBatchTestCases();
  }
}

function getNodeAt(x, y) {
  return STATE.nodes.find(n => Math.hypot(n.x - x, n.y - y) <= 26);
}

// --- CONTEXT CONFIG MODAL ---
function openTransitionDialog() {
  const overlay = document.getElementById("context-overlay");
  overlay.classList.remove("hidden");

  // Show fields based on machine type
  document.getElementById("pda-pop-row").classList.toggle("hidden", STATE.machineType !== "pda");
  document.getElementById("pda-push-row").classList.toggle("hidden", STATE.machineType !== "pda");
  document.getElementById("tm-write-row").classList.toggle("hidden", STATE.machineType !== "tm");
  document.getElementById("tm-move-row").classList.toggle("hidden", STATE.machineType !== "tm");

  // Reset inputs
  document.getElementById("input-read").value = "";
  document.getElementById("input-pop").value = "ε";
  document.getElementById("input-push").value = "ε";
  document.getElementById("input-write").value = "";
  document.getElementById("select-move").value = "R";
}

function closeTransitionDialog() {
  document.getElementById("context-overlay").classList.add("hidden");
  STATE.pendingTransition = null;
}

// --- SIMULATOR EXECUTION CONTROLLER ENGINE ---

function resetSimulationState() {
  pauseClock();
  STATE.currentCharIndex = 0;
  STATE.isHalted = false;
  
  // Set current execution pointer to Start node
  STATE.currentNode = STATE.nodes.find(n => n.isStart) || null;
  
  // Clean tape buffer
  loadTapeDisplay();

  // Reset stack
  if (STATE.machineType === "pda") {
    STATE.pdaStack = ["Z"]; // Initialize stack with starting symbol
  } else {
    STATE.pdaStack = [];
  }
  
  updatePeripheralsUI();
}

function toggleRun() {
  if (STATE.isHalted) {
    resetSimulationState();
  }

  const toggleBtn = document.getElementById("btn-toggle-run");
  if (STATE.isPlaying) {
    pauseClock();
  } else {
    STATE.isPlaying = true;
    toggleBtn.textContent = "⏸ Pause";
    toggleBtn.classList.add("running");
    startClock();
  }
}

function startClock() {
  const interval = 1000 / STATE.clockSpeedHz;
  STATE.timerId = setInterval(() => {
    stepTransition();
  }, interval);
}

function pauseClock() {
  STATE.isPlaying = false;
  const toggleBtn = document.getElementById("btn-toggle-run");
  toggleBtn.textContent = "▶ Run";
  toggleBtn.classList.remove("running");
  clearInterval(STATE.timerId);
}

function stepTransition() {
  if (STATE.isHalted || !STATE.currentNode) return;

  const current = STATE.currentNode;
  let char = "";
  
  if (STATE.machineType === "tm") {
    // Turing machine reads from the tape array
    char = STATE.tmTape[STATE.tmHeadIndex] || "B";
  } else {
    // DFA/PDA reads from input string
    char = STATE.inputString[STATE.currentCharIndex];
  }

  // 1. Query transition rules matching input and memory
  let matched = null;

  if (STATE.machineType === "dfa") {
    matched = STATE.transitions.find(t => t.from === current.id && t.read === char);
  } 
  else if (STATE.machineType === "pda") {
    // PDA transition matches (char, pop) -> push
    // Support epsilon reads and pops
    const topStack = STATE.pdaStack[STATE.pdaStack.length - 1] || "ε";
    
    // Check direct matches
    matched = STATE.transitions.find(t => 
      t.from === current.id && 
      (t.read === char || t.read === "ε") && 
      (t.pop === topStack || t.pop === "ε")
    );
  } 
  else if (STATE.machineType === "tm") {
    matched = STATE.transitions.find(t => t.from === current.id && t.read === char);
  }

  // 2. Resolve transition
  if (matched) {
    // Transition target
    const nextNode = STATE.nodes.find(n => n.id === matched.to);
    STATE.currentNode = nextNode;

    // Apply memory/tape updates
    if (STATE.machineType === "dfa") {
      STATE.currentCharIndex++;
      STATE.tmHeadIndex = STATE.currentCharIndex;
    } 
    else if (STATE.machineType === "pda") {
      // Pop operation
      if (matched.pop !== "ε") {
        STATE.pdaStack.pop();
      }
      // Push operation
      if (matched.push !== "ε") {
        // supports pushing character string or single char
        for (let s of matched.push.split("").reverse()) {
          STATE.pdaStack.push(s);
        }
      }
      
      // Advance input index if we didn't take an epsilon transition
      if (matched.read !== "ε") {
        STATE.currentCharIndex++;
      }
      STATE.tmHeadIndex = STATE.currentCharIndex;
    } 
    else if (STATE.machineType === "tm") {
      // Overwrite tape square value
      STATE.tmTape[STATE.tmHeadIndex] = matched.write;
      
      // Shift head
      if (matched.move === "R") {
        STATE.tmHeadIndex++;
        if (STATE.tmHeadIndex >= STATE.tmTape.length) {
          STATE.tmTape.push("B"); // extend infinite tape right
        }
      } else if (matched.move === "L") {
        STATE.tmHeadIndex = Math.max(0, STATE.tmHeadIndex - 1);
      }
    }

    renderTapeCells();
    updatePeripheralsUI();
  } else {
    // No matching transition rule found. Stop simulation and evaluate acceptance
    STATE.isHalted = true;
    pauseClock();

    let accepted = false;
    if (STATE.machineType === "tm") {
      accepted = STATE.currentNode.isAccept;
    } else if (STATE.machineType === "pda") {
      // PDA accepts if input is empty and we are in accepting state (or stack is empty depending on mode)
      // Here: accepting state
      accepted = STATE.currentCharIndex >= STATE.inputString.length && STATE.currentNode.isAccept;
    } else if (STATE.machineType === "dfa") {
      accepted = STATE.currentCharIndex >= STATE.inputString.length && STATE.currentNode.isAccept;
    }

    const testInput = document.getElementById("input-string-test").value;
    updateBatchTestResult(testInput, accepted);
  }
}

// Run full string verification instantly for batch tests
function evaluateStringInstantly(inputStr) {
  if (STATE.nodes.length === 0) return false;

  let current = STATE.nodes.find(n => n.isStart);
  if (!current) return false;

  if (STATE.machineType === "dfa") {
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      const transition = STATE.transitions.find(t => t.from === current.id && t.read === char);
      if (!transition) return false;
      current = STATE.nodes.find(n => n.id === transition.to);
    }
    return current.isAccept;
  } 
  else if (STATE.machineType === "pda") {
    // Visual stack mock solver
    let pdaStack = ["Z"];
    let charIndex = 0;
    
    // Safety recursion stack limit to prevent loops
    let steps = 0;
    while (charIndex <= inputStr.length && steps < 200) {
      steps++;
      const char = inputStr[charIndex] || "ε";
      const topStack = pdaStack[pdaStack.length - 1] || "ε";
      
      const transition = STATE.transitions.find(t => 
        t.from === current.id && 
        (t.read === char || t.read === "ε") && 
        (t.pop === topStack || t.pop === "ε")
      );
      
      if (!transition) break;
      
      current = STATE.nodes.find(n => n.id === transition.to);
      if (transition.pop !== "ε") pdaStack.pop();
      if (transition.push !== "ε") {
        for (let s of transition.push.split("").reverse()) {
          pdaStack.push(s);
        }
      }
      
      if (transition.read !== "ε") charIndex++;
    }
    return charIndex >= inputStr.length && current.isAccept;
  } 
  else if (STATE.machineType === "tm") {
    // Turing tape solver
    let tmTape = Array(20).fill("B");
    let head = 4;
    for (let i = 0; i < inputStr.length; i++) {
      tmTape[head + i] = inputStr[i];
    }
    
    let steps = 0;
    while (steps < 300) {
      steps++;
      const char = tmTape[head] || "B";
      const transition = STATE.transitions.find(t => t.from === current.id && t.read === char);
      if (!transition) break;
      
      current = STATE.nodes.find(n => n.id === transition.to);
      tmTape[head] = transition.write;
      if (transition.move === "R") {
        head++;
        if (head >= tmTape.length) tmTape.push("B");
      } else if (transition.move === "L") {
        head = Math.max(0, head - 1);
      }
    }
    return current.isAccept;
  }
  return false;
}

// --- BATCH TEST CASES MANAGERS ---

function loadBatchTestCases() {
  const tableBody = document.getElementById("batch-table-body");
  tableBody.innerHTML = "";

  // Dynamic seed test values based on machine type
  let tests = [];
  if (STATE.machineType === "dfa") {
    tests = ["101001", "0", "00", "111000", "010100"];
  } else if (STATE.machineType === "pda") {
    tests = ["(())", "()()", "(()", "())(", "(())()"];
  } else if (STATE.machineType === "tm") {
    tests = ["1011", "0", "1", "111", "10100"];
  }

  tests.forEach(test => {
    const isAccepted = evaluateStringInstantly(test);
    const row = document.createElement("tr");
    row.id = `test-row-${test}`;
    row.innerHTML = `
      <td><code>${test}</code></td>
      <td class="${isAccepted ? 'accept-row' : 'reject-row'}">${isAccepted ? '🟢 ACCEPT' : '🔴 REJECT'}</td>
    `;
    tableBody.appendChild(row);
  });
}

function updateBatchTestResult(inputStr, isAccepted) {
  const row = document.getElementById(`test-row-${inputStr}`);
  if (row) {
    row.querySelector("td:nth-child(2)").className = isAccepted ? 'accept-row' : 'reject-row';
    row.querySelector("td:nth-child(2)").textContent = isAccepted ? '🟢 ACCEPTED' : '🔴 REJECTED';
  } else {
    // Append new custom test case
    const tableBody = document.getElementById("batch-table-body");
    const newRow = document.createElement("tr");
    newRow.id = `test-row-${inputStr}`;
    newRow.innerHTML = `
      <td><code>${inputStr}</code></td>
      <td class="${isAccepted ? 'accept-row' : 'reject-row'}">${isAccepted ? '🟢 ACCEPTED' : '🔴 REJECTED'}</td>
    `;
    tableBody.appendChild(newRow);
  }
}

// --- UI EVENT BINDINGS CONTROLLER ---

function initUI() {
  // Tool buttons selection
  const tools = ["state", "transition", "delete"];
  tools.forEach(t => {
    document.getElementById(`tool-${t}`).addEventListener("click", () => {
      tools.forEach(o => document.getElementById(`tool-${o}`).classList.remove("active"));
      document.getElementById(`tool-${t}`).classList.add("active");
      STATE.activeTool = t;
    });
  });

  // Clear board
  document.getElementById("btn-clear-board").addEventListener("click", () => {
    STATE.nodes = [];
    STATE.transitions = [];
    resetSimulationState();
    loadBatchTestCases();
  });

  // Action runs
  document.getElementById("btn-toggle-run").addEventListener("click", toggleRun);
  document.getElementById("btn-step").addEventListener("click", () => {
    if (!STATE.isPlaying && !STATE.isHalted) {
      stepTransition();
    }
  });
  document.getElementById("btn-reset").addEventListener("click", resetSimulationState);

  // Speed clock slider
  const hzSlider = document.getElementById("slider-hz");
  hzSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("val-hz").textContent = val;
    STATE.clockSpeedHz = val;
    if (STATE.isPlaying) {
      pauseClock();
      startClock();
    }
  });

  // Presets dropdown
  document.getElementById("preset-selector").addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Save Transition overlay triggers
  document.getElementById("btn-save-transition").addEventListener("click", () => {
    const read = document.getElementById("input-read").value.trim() || "ε";
    const pop = document.getElementById("input-pop").value.trim() || "ε";
    const push = document.getElementById("input-push").value.trim() || "ε";
    const write = document.getElementById("input-write").value.trim() || "B";
    const move = document.getElementById("select-move").value;

    if (STATE.pendingTransition) {
      const newT = {
        from: STATE.pendingTransition.from,
        to: STATE.pendingTransition.to,
        read
      };

      if (STATE.machineType === "pda") {
        newT.pop = pop;
        newT.push = push;
      } else if (STATE.machineType === "tm") {
        newT.write = write;
        newT.move = move;
      }

      STATE.transitions.push(newT);
      loadBatchTestCases();
    }
    closeTransitionDialog();
  });

  document.getElementById("btn-cancel-transition").addEventListener("click", closeTransitionDialog);

  // Input evaluator button
  document.getElementById("btn-test-eval").addEventListener("click", () => {
    const inputVal = document.getElementById("input-string-test").value.trim();
    if (inputVal) {
      STATE.inputString = inputVal;
      resetSimulationState();
      toggleRun();
    }
  });

  // Theme support
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const active = document.documentElement.getAttribute("data-theme");
    const next = active === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    
    document.querySelector(".sun-icon").classList.toggle("hidden", next === "light");
    document.querySelector(".moon-icon").classList.toggle("hidden", next === "dark");
  });
}
