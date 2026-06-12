// script.js - Cryptographic Cipher Playground & Brute-Force Cracking Simulator

// Simulation states
const STATE = {
  activeAlgo: "caesar", // "caesar" | "vigenere" | "diffie" | "aes"
  plaintext: "ATTACK AT DAWN",
  ciphertext: "",
  
  // Caesar properties
  caesarShift: 3,

  // Vigenere properties
  vigenereKey: "LEMON",

  // Diffie Hellman properties
  dhAlicePrv: 6,
  dhBobPrv: 15,
  dhG: 5, // generator base
  dhP: 23, // prime modulus

  // AES mock properties
  aesKey: "2b7e151628aed2a6",

  // Brute Force variables
  crackTarget: "LOCK",
  crackSpeedKps: 120, // keys per second base
  checkedKeysCount: 0,
  isCracking: false,
  crackTimerId: null
};

// S-Box visual translation table for simple AES
const S_BOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0
];

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  updateEncryption();
});

// --- UI INIT ---
function initUI() {
  // Select algorithm
  document.getElementById("select-algo").addEventListener("change", (e) => {
    const val = e.target.value;
    STATE.activeAlgo = val;

    // Display appropriate settings
    document.querySelectorAll(".algo-config").forEach(el => el.classList.add("hidden"));
    if (val === "caesar") document.getElementById("config-caesar").classList.remove("hidden");
    if (val === "vigenere") document.getElementById("config-vigenere").classList.remove("hidden");
    if (val === "diffie") document.getElementById("config-diffie").classList.remove("hidden");
    if (val === "aes") document.getElementById("config-aes").classList.remove("hidden");

    document.getElementById("trace-badge").textContent = e.target.options[e.target.selectedIndex].text;
    updateEncryption();
  });

  // caesar slider
  document.getElementById("slider-shift").addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("val-shift").textContent = val;
    STATE.caesarShift = val;
    updateEncryption();
  });

  // inputs listeners
  document.getElementById("input-plaintext").addEventListener("input", (e) => {
    STATE.plaintext = e.target.value;
    updateEncryption();
  });

  document.getElementById("input-key-vigenere").addEventListener("input", (e) => {
    STATE.vigenereKey = e.target.value.toUpperCase().replace(/[^A-Z]/g, "") || "KEY";
    e.target.value = STATE.vigenereKey;
    updateEncryption();
  });

  document.getElementById("input-dh-alice").addEventListener("input", (e) => {
    STATE.dhAlicePrv = parseInt(e.target.value) || 1;
    updateEncryption();
  });

  document.getElementById("input-dh-bob").addEventListener("input", (e) => {
    STATE.dhBobPrv = parseInt(e.target.value) || 1;
    updateEncryption();
  });

  document.getElementById("input-key-aes").addEventListener("input", (e) => {
    STATE.aesKey = e.target.value.substring(0, 16);
    updateEncryption();
  });

  // encrypt button
  document.getElementById("btn-encrypt").addEventListener("click", updateEncryption);

  // brute force triggers
  document.getElementById("btn-crack-start").addEventListener("click", toggleBruteForce);

  // theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const act = document.documentElement.getAttribute("data-theme");
    const next = act === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    
    document.querySelector(".sun-icon").classList.toggle("hidden", next === "light");
    document.querySelector(".moon-icon").classList.toggle("hidden", next === "dark");
  });
}

// --- CIPHER MATHEMATICS ENGINES ---

function encryptCaesar(text, shift) {
  return text.split("").map(char => {
    const code = char.charCodeAt(0);
    // Uppercase
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }
    // Lowercase
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + shift) % 26) + 97);
    }
    return char;
  }).join("");
}

function encryptVigenere(text, key) {
  let keyIndex = 0;
  return text.split("").map(char => {
    const code = char.charCodeAt(0);
    let shift = key[keyIndex % key.length].charCodeAt(0) - 65;

    if (code >= 65 && code <= 90) {
      keyIndex++;
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
      keyIndex++;
      return String.fromCharCode(((code - 97 + shift) % 26) + 97);
    }
    return char;
  }).join("");
}

// Update encryption display and render the trace panel maps
function updateEncryption() {
  const text = STATE.plaintext;
  let result = "";

  if (STATE.activeAlgo === "caesar") {
    result = encryptCaesar(text, STATE.caesarShift);
    renderCaesarTrace();
  } 
  else if (STATE.activeAlgo === "vigenere") {
    result = encryptVigenere(text, STATE.vigenereKey);
    renderVigenereTrace();
  } 
  else if (STATE.activeAlgo === "diffie") {
    result = "Diffie-Hellman computes keys, not text encryption directly.";
    renderDiffieTrace();
  } 
  else if (STATE.activeAlgo === "aes") {
    result = "Mock AES 128 bit matrix scrambling trace active.";
    renderAesTrace();
  }

  STATE.ciphertext = result;
  document.getElementById("output-ciphertext").textContent = result;
}

// --- VISUAL TRACE RENDERING GRIDS ---

function renderCaesarTrace() {
  const container = document.getElementById("trace-viewport");
  container.innerHTML = `<h3>Caesar Alphabet Grid Trace</h3>`;

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  
  // Original alphabet row
  const origRow = document.createElement("div");
  origRow.className = "trace-array";
  alphabet.forEach((char, idx) => {
    const cell = document.createElement("div");
    cell.className = "trace-cell highlight-cyan";
    cell.textContent = char;
    origRow.appendChild(cell);
  });
  container.appendChild(origRow);

  // Arrow separator
  const arrow = document.createElement("div");
  arrow.innerHTML = `<span>▼ Shifted by ${STATE.caesarShift} places ▼</span>`;
  arrow.style.fontSize = "0.78rem";
  arrow.style.color = "var(--text-sub)";
  container.appendChild(arrow);

  // Shifted row
  const shiftRow = document.createElement("div");
  shiftRow.className = "trace-array";
  alphabet.forEach((char, idx) => {
    const cell = document.createElement("div");
    cell.className = "trace-cell highlight-amber";
    
    const shiftedChar = String.fromCharCode(((char.charCodeAt(0) - 65 + STATE.caesarShift) % 26) + 65);
    cell.textContent = shiftedChar;
    shiftRow.appendChild(cell);
  });
  container.appendChild(shiftRow);
}

function renderVigenereTrace() {
  const container = document.getElementById("trace-viewport");
  container.innerHTML = `<h3>Vigenère Character Shifts Trace</h3>`;

  const text = STATE.plaintext.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 10);
  const key = STATE.vigenereKey;

  if (text.length === 0) {
    container.innerHTML += `<p style='color:var(--text-mute)'>Type letters in Plaintext to trace shifts.</p>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "trace-array";

  for (let i = 0; i < text.length; i++) {
    const tChar = text[i];
    const kChar = key[i % key.length];
    const shift = kChar.charCodeAt(0) - 65;
    const cChar = String.fromCharCode(((tChar.charCodeAt(0) - 65 + shift) % 26) + 65);

    const cellWrapper = document.createElement("div");
    cellWrapper.className = "trace-cell-wrapper";

    const labelTop = document.createElement("span");
    labelTop.className = "trace-cell-label";
    labelTop.textContent = `Key: ${kChar} (+${shift})`;

    const cell = document.createElement("div");
    cell.className = "trace-cell highlight-cyan";
    cell.textContent = `${tChar}➔${cChar}`;

    cellWrapper.appendChild(labelTop);
    cellWrapper.appendChild(cell);
    grid.appendChild(cellWrapper);
  }

  container.appendChild(grid);
}

function renderDiffieTrace() {
  const container = document.getElementById("trace-viewport");
  container.innerHTML = `<h3>Diffie-Hellman Key Exchange (Color Mix Metaphor)</h3>`;

  // Standard DH formula: A = g^a mod p
  const g = STATE.dhG;
  const p = STATE.dhP;
  const a = STATE.dhAlicePrv;
  const b = STATE.dhBobPrv;

  // Compute public keys
  const alicePub = powerMod(g, a, p);
  const bobPub = powerMod(g, b, p);

  // Compute shared secrets
  const aliceSecret = powerMod(bobPub, a, p);
  const bobSecret = powerMod(alicePub, b, p);

  // Map values to HSL hues (0 to 360)
  const commonColor = `hsl(${(g * 360 / p) % 360}, 90%, 50%)`;
  const alicePrvColor = `hsl(${(a * 360 / p) % 360}, 90%, 50%)`;
  const bobPrvColor = `hsl(${(b * 360 / p) % 360}, 90%, 50%)`;
  const alicePubColor = `hsl(${(alicePub * 360 / p) % 360}, 90%, 50%)`;
  const bobPubColor = `hsl(${(bobPub * 360 / p) % 360}, 90%, 50%)`;
  const sharedColor = `hsl(${(aliceSecret * 360 / p) % 360}, 95%, 45%)`;

  const flow = document.createElement("div");
  flow.className = "dh-exchange-flow";

  flow.innerHTML = `
    <!-- Alice Private -->
    <div class="dh-party">
      <span class="dh-label-name">Alice (Private)</span>
      <div class="color-blob" style="background-color: ${alicePrvColor};" title="Private Key: ${a}"></div>
      <span>Private Key: <b>${a}</b></span>
    </div>

    <!-- Common Base -->
    <div class="dh-party" style="border-color: var(--color-cyan)">
      <span class="dh-label-name">Base (Public)</span>
      <div class="color-blob" style="background-color: ${commonColor};" title="Generator G: ${g}, Prime P: ${p}"></div>
      <span>G: <b>${g}</b>, P: <b>${p}</b></span>
    </div>

    <!-- Bob Private -->
    <div class="dh-party">
      <span class="dh-label-name">Bob (Private)</span>
      <div class="color-blob" style="background-color: ${bobPrvColor};" title="Private Key: ${b}"></div>
      <span>Private Key: <b>${b}</b></span>
    </div>
  `;
  container.appendChild(flow);

  // Exchanged Public keys
  const separator = document.createElement("div");
  separator.innerHTML = `<span>▼ Compute & Exchange Public Keys ($G^{prv} \\bmod P$) ▼</span>`;
  separator.style.fontSize = "0.78rem";
  separator.style.margin = "12px 0";
  separator.style.color = "var(--text-sub)";
  container.appendChild(separator);

  const exchange = document.createElement("div");
  exchange.className = "dh-exchange-flow";
  exchange.innerHTML = `
    <!-- Alice Public -->
    <div class="dh-party">
      <span class="dh-label-name">Alice Public (A)</span>
      <div class="color-blob" style="background-color: ${alicePubColor};"></div>
      <span>A = 5^${a} mod 23 = <b>${alicePub}</b></span>
    </div>

    <!-- Bob Public -->
    <div class="dh-party">
      <span class="dh-label-name">Bob Public (B)</span>
      <div class="color-blob" style="background-color: ${bobPubColor};"></div>
      <span>B = 5^${b} mod 23 = <b>${bobPub}</b></span>
    </div>
  `;
  container.appendChild(exchange);

  // Shared Secret result
  const secretSep = document.createElement("div");
  secretSep.innerHTML = `<span>▼ Compute Shared Secret ($Secret = Public^{prv} \\bmod P$) ▼</span>`;
  secretSep.style.fontSize = "0.78rem";
  secretSep.style.margin = "12px 0";
  secretSep.style.color = "var(--text-sub)";
  container.appendChild(secretSep);

  const secretResult = document.createElement("div");
  secretResult.className = "dh-party";
  secretResult.style.borderColor = "var(--color-emerald)";
  secretResult.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.2)";
  secretResult.innerHTML = `
    <span class="dh-label-name">Shared Secret Key (S)</span>
    <div class="color-blob" style="background-color: ${sharedColor};"></div>
    <span>Secret Match: <b>${aliceSecret}</b> (Alice) == <b>${bobSecret}</b> (Bob)</span>
  `;
  container.appendChild(secretResult);
}

function renderAesTrace() {
  const container = document.getElementById("trace-viewport");
  container.innerHTML = `<h3>Simple AES Matrix Transformation Trace</h3>`;

  const inputHex = "536F6D654E656F6E4B6579734D617478"; // Hex value for ATTACK AT DAWN equivalent
  
  // Setup 4x4 State matrix
  const matrix = [];
  for (let i = 0; i < 16; i++) {
    matrix.push(inputHex.substring(i * 2, i * 2 + 2));
  }

  // 1. Initial State Matrix
  const grid1 = document.createElement("div");
  grid1.className = "aes-matrix-grid";
  matrix.forEach(byte => {
    const cell = document.createElement("div");
    cell.className = "trace-cell highlight-cyan";
    cell.textContent = byte;
    grid1.appendChild(cell);
  });
  
  const block1 = document.createElement("div");
  block1.className = "dh-party";
  block1.appendChild(document.createTextNode("1. Input State"));
  block1.appendChild(grid1);

  // 2. SubBytes Matrix (lookup values from S-Box)
  const grid2 = document.createElement("div");
  grid2.className = "aes-matrix-grid";
  matrix.forEach((byte, idx) => {
    const val = parseInt(byte, 16);
    const subVal = S_BOX[val % S_BOX.length].toString(16).toUpperCase().padStart(2, "0");
    const cell = document.createElement("div");
    cell.className = "trace-cell highlight-amber";
    cell.textContent = subVal;
    grid2.appendChild(cell);
  });

  const block2 = document.createElement("div");
  block2.className = "dh-party";
  block2.appendChild(document.createTextNode("2. SubBytes (S-Box)"));
  block2.appendChild(grid2);

  const row = document.createElement("div");
  row.className = "dh-exchange-flow";
  row.appendChild(block1);
  row.appendChild(block2);
  container.appendChild(row);
}

// Modular exponentiation utility
function powerMod(base, exp, mod) {
  let res = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) res = (res * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return res;
}

// --- PASSWORD CRACKER SIMULATOR ---

function toggleBruteForce() {
  const btn = document.getElementById("btn-crack-start");
  
  if (STATE.isCracking) {
    stopCracking();
  } else {
    startCracking();
  }
}

function startCracking() {
  const pass = document.getElementById("input-crack-pass").value.toUpperCase().replace(/[^A-Z]/g, "") || "LOCK";
  document.getElementById("input-crack-pass").value = pass;
  
  STATE.crackTarget = pass;
  STATE.checkedKeysCount = 0;
  STATE.isCracking = true;

  const btn = document.getElementById("btn-crack-start");
  btn.textContent = "⏹ Stop";
  btn.classList.add("cracking");

  // Calculate Metrics
  const charSetSize = 26; // A-Z
  const combinations = Math.pow(charSetSize, pass.length);
  const entropy = Math.round(pass.length * Math.log2(charSetSize));

  document.getElementById("metric-entropy").textContent = `${entropy} bits`;
  document.getElementById("metric-combinations").textContent = combinations.toLocaleString();
  
  // Set cracking speed depending on password complexity to make simulation realistic
  if (pass.length <= 4) {
    STATE.crackSpeedKps = Math.round(combinations / 120) || 5;
  } else {
    STATE.crackSpeedKps = 125000;
  }
  
  document.getElementById("metric-speed").textContent = `${STATE.crackSpeedKps.toLocaleString()} keys/s`;

  // Draw guess grid cells
  const grid = document.getElementById("rolling-board-grid");
  grid.innerHTML = "";
  for (let i = 0; i < pass.length; i++) {
    const cell = document.createElement("div");
    cell.className = "guess-cell";
    cell.id = `guess-cell-${i}`;
    cell.textContent = "*";
    grid.appendChild(cell);
  }

  runCrackerTick();
}

function stopCracking() {
  STATE.isCracking = false;
  const btn = document.getElementById("btn-crack-start");
  btn.textContent = "⚡ Crack";
  btn.classList.remove("cracking");
  cancelAnimationFrame(STATE.crackTimerId);
}

function runCrackerTick() {
  if (!STATE.isCracking) return;

  const pass = STATE.crackTarget;
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const combinations = Math.pow(26, pass.length);

  // Increment keys tested
  const keysStep = Math.ceil(STATE.crackSpeedKps / 60); // 60 frames/sec
  STATE.checkedKeysCount = Math.min(combinations, STATE.checkedKeysCount + keysStep);

  document.getElementById("metric-checked").textContent = STATE.checkedKeysCount.toLocaleString();

  // Render visual guesses
  const progressRatio = STATE.checkedKeysCount / combinations;
  document.getElementById("brute-progress-fill").style.width = (progressRatio * 100) + "%";

  const timeEstimate = STATE.checkedKeysCount / STATE.crackSpeedKps;
  document.getElementById("metric-time").textContent = timeEstimate.toFixed(2) + "s";

  for (let i = 0; i < pass.length; i++) {
    const cell = document.getElementById(`guess-cell-${i}`);
    
    // Simulate gradual locking of columns based on progress ratio
    const lockThreshold = (i + 1) / pass.length;
    if (progressRatio >= lockThreshold || STATE.checkedKeysCount >= combinations) {
      cell.textContent = pass[i];
      cell.classList.add("matched");
    } else {
      // Roll random letters
      cell.textContent = alpha[Math.floor(Math.random() * alpha.length)];
      cell.classList.remove("matched");
    }
  }

  if (STATE.checkedKeysCount >= combinations) {
    stopCracking();
    document.getElementById("metric-time").textContent = (combinations / STATE.crackSpeedKps).toFixed(2) + "s (Done)";
  } else {
    STATE.crackTimerId = requestAnimationFrame(runCrackerTick);
  }
}
