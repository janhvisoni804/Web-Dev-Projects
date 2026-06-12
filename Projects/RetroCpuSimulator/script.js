// script.js - Assembler and 16-Bit Virtual Machine Interpreter

// VM Memory and State
const VM = {
  ram: new Uint16Array(256), // 256 words (16-bit)
  acc: 0,                   // Accumulator
  pc: 0,                    // Program Counter
  sp: 255,                  // Stack Pointer (starts at end of stack memory 0xFF)
  
  // Status Flags
  flagZ: false,             // Zero Flag
  flagC: false,             // Carry Flag
  flagN: false,             // Negative Flag

  // Execution Control
  isPlaying: false,
  clockSpeedHz: 5,
  timerId: null,
  isHalted: false,
  
  // Highlighting updates for animations
  lastReadAddr: -1,
  lastWriteAddr: -1,
  animTimer: null
};

// Assembly Mnemonics to Opcode mappings
const OPCODES = {
  NOP: 0x00,
  PUSH: 0x01,  // takes immediate argument
  POP: 0x02,
  ADD: 0x03,
  SUB: 0x04,
  LOAD: 0x05,  // takes RAM address argument
  STORE: 0x06, // takes RAM address argument
  HALT: 0x07,
  JMP: 0x08,   // takes jump address argument
  JZ: 0x09,    // takes jump address argument
  JNZ: 0x0A,   // takes jump address argument
  DUP: 0x0B,
  MUL: 0x0C,
  OUT: 0x0D
};

// Inverse mappings for visual memory map descriptions
const OPCODES_INV = Object.fromEntries(Object.entries(OPCODES).map(([k, v]) => [v, k]));

// Sample Presets Assembly Programs
const PRESETS = {
  fibonacci: `; Fibonacci Sequence Generator
; Generates Fibonacci terms, prints them,
; and displays values on the VRAM screen.

PUSH 0
STORE 160      ; First Fibonacci term (F0)
PUSH 1
STORE 161      ; Second Fibonacci term (F1)

LOOP:
LOAD 160
LOAD 161
ADD            ; Accumulate F(n-1) + F(n-2)
DUP
OUT            ; Print sum to console

; Shift terms
LOAD 161
STORE 160      ; F0 = F1
DUP
STORE 161      ; F1 = Sum

; Render value as bit pattern on VRAM
LOAD 161
STORE 240      ; Store at row 0 (0xF0)
LOAD 160
STORE 241      ; Store at row 1 (0xF1)

; Delay/Loop indefinitely
JMP LOOP
`,

  multiplier: `; 16-bit Integer Multiplier
; Multiplies 8 * 6 using repeated addition loop

PUSH 8
STORE 150      ; Factor X
PUSH 6
STORE 151      ; Factor Y (Counter)
PUSH 0
STORE 152      ; Product Accumulator

LOOP:
LOAD 151
JZ END         ; If counter reaches 0, jump to END

LOAD 152
LOAD 150
ADD
STORE 152      ; Product = Product + Factor X

; Decrement Counter
LOAD 151
PUSH 1
SUB
STORE 151      ; Counter = Counter - 1

JMP LOOP

END:
LOAD 152
OUT            ; Prints 48 (0x0030) to console
HALT
`,

  "led-draw": `; LED VRAM Grid Anim Drawer
; Animates diagonals on the 8x8 LED Matrix

LOOP:
PUSH 1
STORE 240      ; Write 1 to row 0
PUSH 2
STORE 241      ; Write 2 to row 1
PUSH 4
STORE 242      ; Write 4 to row 2
PUSH 8
STORE 243      ; Write 8 to row 3
PUSH 16
STORE 244      ; Write 16 to row 4
PUSH 32
STORE 245      ; Write 32 to row 5
PUSH 64
STORE 246      ; Write 64 to row 6
PUSH 128
STORE 247      ; Write 128 to row 7

; Toggle columns after delay
PUSH 255
STORE 240
PUSH 255
STORE 242
PUSH 255
STORE 244
PUSH 255
STORE 246
JMP LOOP
`
};

// On Initial Load
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  loadPreset("fibonacci");
  assembleCode();
});

// --- UI INIT ---
function initUI() {
  // Line number count updater
  const editor = document.getElementById("assembly-editor");
  editor.addEventListener("input", updateLineNumbers);
  editor.addEventListener("scroll", () => {
    document.getElementById("line-numbers").scrollTop = editor.scrollTop;
  });

  // Buttons Bindings
  document.getElementById("btn-assemble").addEventListener("click", () => {
    assembleCode();
  });

  document.getElementById("btn-toggle-run").addEventListener("click", toggleRun);
  document.getElementById("btn-step").addEventListener("click", () => {
    if (!VM.isPlaying && !VM.isHalted) {
      stepInstruction();
    }
  });
  document.getElementById("btn-reset").addEventListener("click", resetVM);

  // Speed Hz Slider
  const hzSlider = document.getElementById("slider-hz");
  hzSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("val-hz").textContent = val;
    VM.clockSpeedHz = val;
    if (VM.isPlaying) {
      pauseClock();
      startClock();
    }
  });

  // Preset Selector
  document.getElementById("preset-selector").addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Theme switch
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = activeTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Toggle SVGs
    document.querySelector(".sun-icon").classList.toggle("hidden", newTheme === "light");
    document.querySelector(".moon-icon").classList.toggle("hidden", newTheme === "dark");
  });

  // Render initial peripheral grids
  renderRamView();
  renderLedScreen();
}

function updateLineNumbers() {
  const text = document.getElementById("assembly-editor").value;
  const lines = text.split("\n").length;
  const lineBox = document.getElementById("line-numbers");
  
  let html = "";
  for (let i = 1; i <= Math.max(lines, 1); i++) {
    html += `${i}<br>`;
  }
  lineBox.innerHTML = html;
}

function loadPreset(key) {
  if (PRESETS[key]) {
    document.getElementById("assembly-editor").value = PRESETS[key];
    updateLineNumbers();
    resetVM();
  }
}

// --- RENDER DOM CONTROLS ---

function renderRamView() {
  const container = document.getElementById("ram-view-grid");
  container.innerHTML = "";

  for (let addr = 0; addr < 256; addr++) {
    const cell = document.createElement("div");
    cell.className = "ram-cell";
    cell.id = `ram-${addr}`;
    
    // Distinguish regions (Code/Data, Stack, VRAM)
    if (addr >= 240 && addr <= 247) {
      cell.classList.add("cell-vram");
    } else if (addr >= 224 && addr <= 239) {
      cell.classList.add("cell-stack");
    } else if (addr < 224) {
      cell.classList.add("cell-code");
    }

    const valHex = VM.ram[addr].toString(16).toUpperCase().padStart(4, "0");
    cell.textContent = valHex;

    // Tooltip mapping decoding
    const decoded = decodeInstruction(addr);
    cell.setAttribute("data-tooltip", `Address: 0x${addr.toString(16).toUpperCase().padStart(2, "0")} (${addr})\nValue: 0x${valHex} (${VM.ram[addr]})\n${decoded}`);
    
    container.appendChild(cell);
  }
}

function renderLedScreen() {
  const screen = document.getElementById("led-screen");
  screen.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "led-row";

    for (let col = 0; col < 8; col++) {
      const dot = document.createElement("div");
      dot.className = "led-dot";
      dot.id = `led-${row}-${col}`;
      rowDiv.appendChild(dot);
    }
    screen.appendChild(rowDiv);
  }
}

// Translate raw memory cell contents into visual details
function decodeInstruction(addr) {
  const val = VM.ram[addr];
  if (val === 0) return "NOP / Data";
  
  // opcode check
  const op = OPCODES_INV[val];
  if (op) {
    // Check if it has parameter
    if (["PUSH", "LOAD", "STORE", "JMP", "JZ", "JNZ"].includes(op)) {
      return `${op} [next cell arg]`;
    }
    return op;
  }
  
  // Might be parameter for previous address
  if (addr > 0) {
    const prevOp = OPCODES_INV[VM.ram[addr - 1]];
    if (prevOp && ["PUSH", "LOAD", "STORE", "JMP", "JZ", "JNZ"].includes(prevOp)) {
      return `Arg: ${val} (for ${prevOp})`;
    }
  }
  return "Data Word";
}

// Highlight read/write operations with transient grid outline highlights
function flashMemoryCell(addr, type) {
  const cell = document.getElementById(`ram-${addr}`);
  if (!cell) return;

  cell.style.transition = "none";
  if (type === "read") {
    cell.style.borderColor = "var(--color-cyan)";
    cell.style.boxShadow = "0 0 10px var(--color-cyan-glow)";
  } else if (type === "write") {
    cell.style.borderColor = "var(--color-emerald)";
    cell.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.4)";
  }

  setTimeout(() => {
    cell.style.transition = "border-color 0.4s ease, box-shadow 0.4s ease";
    cell.style.borderColor = "";
    cell.style.boxShadow = "";
  }, 300);
}

// Synchronize stack frame elements showing values POP-ing/PUSH-ing
function updateStackUI() {
  const stackContainer = document.getElementById("stack-visualizer");
  stackContainer.innerHTML = "";

  const empty = VM.sp >= 255;
  if (empty) {
    stackContainer.innerHTML = `<div class="stack-empty-msg">Stack is empty</div>`;
    return;
  }

  // Render Stack growing downwards
  for (let i = 255; i >= VM.sp; i--) {
    const cell = document.createElement("div");
    cell.className = "stack-cell";
    if (i === VM.sp) {
      cell.classList.add("sp-highlight");
    }

    const addrStr = `0x${i.toString(16).toUpperCase()}`;
    const valStr = `0x${VM.ram[i].toString(16).toUpperCase().padStart(4, "0")}`;
    
    cell.innerHTML = `
      <span class="stack-adr">${addrStr}</span>
      <span class="stack-val">${valStr}</span>
      <span class="stack-lbl">${i === VM.sp ? "SP ➔" : ""}</span>
    `;

    stackContainer.appendChild(cell);
  }
}

// Sync screen display matrix using lower 8 bits of memory registers 0xF0-0xF7
function updateVramUI() {
  for (let row = 0; row < 8; row++) {
    const addr = 240 + row; // 0xF0 starts at 240
    const val = VM.ram[addr];

    for (let col = 0; col < 8; col++) {
      const bit = (val >> col) & 1;
      const dot = document.getElementById(`led-${row}-${col}`);
      if (dot) {
        dot.classList.toggle("active", bit === 1);
      }
    }
  }
}

// --- VM INTERPRETER/RUN LOOPS ---

function toggleRun() {
  if (VM.isHalted) {
    logConsole("Program halted. Reset execution to restart.", true);
    return;
  }
  
  const toggleBtn = document.getElementById("btn-toggle-run");
  if (VM.isPlaying) {
    pauseClock();
  } else {
    VM.isPlaying = true;
    toggleBtn.textContent = "⏸ Pause";
    toggleBtn.classList.add("running");
    logConsole("Running clock generator...");
    startClock();
  }
}

function startClock() {
  const interval = 1000 / VM.clockSpeedHz;
  VM.timerId = setInterval(() => {
    stepInstruction();
  }, interval);
}

function pauseClock() {
  VM.isPlaying = false;
  const toggleBtn = document.getElementById("btn-toggle-run");
  toggleBtn.textContent = "▶ Run";
  toggleBtn.classList.remove("running");
  clearInterval(VM.timerId);
  logConsole("Simulation paused.");
}

function resetVM() {
  pauseClock();
  VM.isHalted = false;
  
  // Clean registers
  VM.acc = 0;
  VM.pc = 0;
  VM.sp = 255;
  VM.flagZ = false;
  VM.flagC = false;
  VM.flagN = false;

  // Clear visual highlights
  document.querySelectorAll(".ram-cell").forEach(c => c.classList.remove("pc-active"));
  
  // Re-assemble code to load cleanly into memory
  assembleCode();
}

function logConsole(message, isError = false) {
  const consoleBox = document.getElementById("console-output");
  consoleBox.textContent = message;
  consoleBox.classList.toggle("error", isError);
}

function updateRegistersUI() {
  document.getElementById("reg-acc").textContent = `0x${VM.acc.toString(16).toUpperCase().padStart(4, "0")}`;
  document.getElementById("reg-acc-dec").textContent = `(${VM.acc})`;

  document.getElementById("reg-pc").textContent = `0x${VM.pc.toString(16).toUpperCase().padStart(4, "0")}`;
  document.getElementById("reg-pc-dec").textContent = `(${VM.pc})`;

  document.getElementById("reg-sp").textContent = `0x${VM.sp.toString(16).toUpperCase().padStart(2, "0")}`;
  document.getElementById("reg-sp-dec").textContent = `(${VM.sp})`;

  // Flags status indicator lights
  document.getElementById("flag-z").classList.toggle("active", VM.flagZ);
  document.getElementById("flag-c").classList.toggle("active", VM.flagC);
  document.getElementById("flag-n").classList.toggle("active", VM.flagN);
}

// --- ASSEMBLER PARSER ---

function assembleCode() {
  const code = document.getElementById("assembly-editor").value;
  const lines = code.split("\n");
  
  // Reset RAM buffer
  VM.ram.fill(0);

  const labels = {};
  let currentBytecodeAddr = 0;

  // PASS 1: Identify Labels & compute positions
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (rawLine === "" || rawLine.startsWith(";")) continue; // Skip comments/empty

    // Strip comments on same line
    const cleanLine = rawLine.split(";")[0].trim();
    
    // Label declaration (e.g. LOOP:)
    if (cleanLine.endsWith(":")) {
      const labelName = cleanLine.slice(0, -1).trim();
      labels[labelName] = currentBytecodeAddr;
      continue;
    }

    // Parse opcode tokens
    const tokens = cleanLine.split(/\s+/);
    const opcode = tokens[0].toUpperCase();

    if (!OPCODES.hasOwnProperty(opcode)) {
      logConsole(`Line ${i + 1}: Unknown instruction mnemonic "${opcode}"`, true);
      return;
    }

    // Determine instruction size: instructions with argument take 2 words, others take 1
    const size = ["PUSH", "LOAD", "STORE", "JMP", "JZ", "JNZ"].includes(opcode) ? 2 : 1;
    currentBytecodeAddr += size;
  }

  // PASS 2: Compile to bytecode and output to RAM
  currentBytecodeAddr = 0;
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (rawLine === "" || rawLine.startsWith(";")) continue;

    const cleanLine = rawLine.split(";")[0].trim();
    if (cleanLine.endsWith(":")) continue;

    const tokens = cleanLine.split(/\s+/);
    const opcode = tokens[0].toUpperCase();
    const opVal = OPCODES[opcode];

    VM.ram[currentBytecodeAddr] = opVal;
    currentBytecodeAddr++;

    // Parameter checks
    if (["PUSH", "LOAD", "STORE", "JMP", "JZ", "JNZ"].includes(opcode)) {
      const argToken = tokens[1];
      if (argToken === undefined) {
        logConsole(`Line ${i + 1}: Missing argument for instruction "${opcode}"`, true);
        return;
      }

      let argVal = 0;
      // Is label jump target?
      if (labels.hasOwnProperty(argToken)) {
        argVal = labels[argToken];
      } else {
        // Numeric value
        argVal = parseInt(argToken, 10);
        if (isNaN(argVal)) {
          logConsole(`Line ${i + 1}: Invalid numeric argument/label label "${argToken}"`, true);
          return;
        }
      }

      VM.ram[currentBytecodeAddr] = argVal;
      currentBytecodeAddr++;
    }
  }

  // Refresh view
  renderRamView();
  updateStackUI();
  updateVramUI();
  updateRegistersUI();
  logConsole("Code assembled successfully. Compiled bytecode loaded into RAM.");
}

// --- VM CLOCK EXECUTION STEPPER ---

function stepInstruction() {
  if (VM.isHalted) return;

  const pc = VM.pc;
  if (pc >= 224) {
    logConsole("Program Counter reached out-of-bounds stack space boundary. Halting.", true);
    VM.isHalted = true;
    pauseClock();
    return;
  }

  // Fetch opcode instruction
  const opcode = VM.ram[pc];
  const mnemonic = OPCODES_INV[opcode];
  
  // Highlight PC address in RAM viewer grid
  document.querySelectorAll(".ram-cell").forEach(c => c.classList.remove("pc-active"));
  const activeCell = document.getElementById(`ram-${pc}`);
  if (activeCell) activeCell.classList.add("pc-active");

  if (!mnemonic) {
    logConsole(`Clock instruction error: Unknown opcode "0x${opcode.toString(16)}" at PC ${pc}`, true);
    VM.isHalted = true;
    pauseClock();
    return;
  }

  // Advance PC
  VM.pc++;

  // Decode instruction type
  switch (mnemonic) {
    case "NOP":
      // Do nothing
      break;

    case "PUSH": {
      // Fetch argument parameter
      const val = VM.ram[VM.pc];
      flashMemoryCell(VM.pc, "read");
      VM.pc++;
      
      // SP grows downwards (SP starts at 255)
      VM.sp--;
      if (VM.sp < 224) { // Stack Overflow boundaries Check
        logConsole("Stack Overflow: SP crossed into variables space (addresses < 224)", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      
      VM.ram[VM.sp] = val;
      flashMemoryCell(VM.sp, "write");
      break;
    }

    case "POP": {
      if (VM.sp >= 255) {
        logConsole("Stack Underflow: Attempted to pop empty stack frame", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      
      flashMemoryCell(VM.sp, "read");
      VM.acc = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0; // zero out popped memory cell
      VM.sp++;
      break;
    }

    case "ADD": {
      if (VM.sp > 253) {
        logConsole("Arithmetic Error: Requires 2 values on stack to ADD", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      // Pop value 1
      const val1 = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;

      // Pop value 2
      const val2 = VM.ram[VM.sp];
      
      // Calculate
      const sum = val1 + val2;
      
      // Write back to stack
      VM.ram[VM.sp] = sum & 0xFFFF; // limit to 16-bit
      
      // Set status flags
      updateFlags(sum);
      break;
    }

    case "SUB": {
      if (VM.sp > 253) {
        logConsole("Arithmetic Error: Requires 2 values on stack to SUB", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      // Pop value 1 (subtrahend y)
      const val1 = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;

      // Pop value 2 (minuend x)
      const val2 = VM.ram[VM.sp];
      
      // Calculate (x - y)
      const diff = val2 - val1;
      
      VM.ram[VM.sp] = diff & 0xFFFF;
      updateFlags(diff);
      break;
    }

    case "MUL": {
      if (VM.sp > 253) {
        logConsole("Arithmetic Error: Requires 2 values on stack to MUL", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      const val1 = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;

      const val2 = VM.ram[VM.sp];
      
      const prod = val1 * val2;
      VM.ram[VM.sp] = prod & 0xFFFF;
      updateFlags(prod);
      break;
    }

    case "LOAD": {
      const addr = VM.ram[VM.pc];
      flashMemoryCell(VM.pc, "read");
      VM.pc++;

      if (addr > 255) {
        logConsole(`Memory Error: Address ${addr} is out-of-bounds`, true);
        VM.isHalted = true;
        pauseClock();
        return;
      }

      const val = VM.ram[addr];
      flashMemoryCell(addr, "read");

      // Push onto stack
      VM.sp--;
      if (VM.sp < 224) {
        logConsole("Stack Overflow during LOAD", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      VM.ram[VM.sp] = val;
      flashMemoryCell(VM.sp, "write");
      break;
    }

    case "STORE": {
      const addr = VM.ram[VM.pc];
      flashMemoryCell(VM.pc, "read");
      VM.pc++;

      if (addr > 255) {
        logConsole(`Memory Error: Address ${addr} is out-of-bounds`, true);
        VM.isHalted = true;
        pauseClock();
        return;
      }

      if (VM.sp >= 255) {
        logConsole("Stack Underflow during STORE operation", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }

      // Pop value
      const val = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;

      // Store in memory
      VM.ram[addr] = val;
      flashMemoryCell(addr, "write");
      break;
    }

    case "JMP": {
      const target = VM.ram[VM.pc];
      flashMemoryCell(VM.pc, "read");
      VM.pc = target;
      break;
    }

    case "JZ": {
      const target = VM.ram[VM.pc];
      flashMemoryCell(VM.pc, "read");
      VM.pc++;

      if (VM.sp >= 255) {
        logConsole("Stack Underflow during JZ branch check", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }

      const top = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;

      if (top === 0) {
        VM.pc = target;
      }
      break;
    }

    case "JNZ": {
      const target = VM.ram[VM.pc];
      flashMemoryCell(VM.pc, "read");
      VM.pc++;

      if (VM.sp >= 255) {
        logConsole("Stack Underflow during JNZ branch check", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }

      const top = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;

      if (top !== 0) {
        VM.pc = target;
      }
      break;
    }

    case "DUP": {
      if (VM.sp >= 255) {
        logConsole("Stack Error: Cannot DUP an empty stack frame", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      const top = VM.ram[VM.sp];
      
      VM.sp--;
      if (VM.sp < 224) {
        logConsole("Stack Overflow during DUP operation", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      VM.ram[VM.sp] = top;
      flashMemoryCell(VM.sp, "write");
      break;
    }

    case "OUT": {
      if (VM.sp >= 255) {
        logConsole("Stack Underflow: OUT requires stack arguments", true);
        VM.isHalted = true;
        pauseClock();
        return;
      }
      const topVal = VM.ram[VM.sp];
      VM.ram[VM.sp] = 0;
      VM.sp++;
      
      // Output to debugger console
      logConsole(`CONSOLE OUTPUT ➔ Value: ${topVal}  (Hex: 0x${topVal.toString(16).toUpperCase()})`);
      break;
    }

    case "HALT": {
      VM.isHalted = true;
      pauseClock();
      logConsole("CPU Clock Execution halted. Program completed successfully.");
      break;
    }
  }

  // Refresh peripherals
  renderRamView();
  updateStackUI();
  updateVramUI();
  updateRegistersUI();
}

function updateFlags(result) {
  VM.flagZ = (result & 0xFFFF) === 0;
  VM.flagC = result > 0xFFFF || result < 0;
  
  // 16-bit signed negative bit check (bit 15)
  VM.flagN = (result & 0x8000) !== 0;
}
