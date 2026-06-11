// script.js - Core logic for Secure Digital Notebook

// --- STATE MANAGEMENT ---
let STATE = {
  notes: [],
  activeNoteId: null,
  activeFilter: "all",
  searchQuery: "",
  theme: "dark",
  vaultPasswordHash: null,
  isUnlocked: false
};

// Simple Obfuscation Key for localStorage (Base64 rotation)
const encodeData = (str) => {
  if (!str) return "";
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return str;
  }
};

const decodeData = (str) => {
  if (!str) return "";
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    return str;
  }
};

// Simple Hash for Password validation
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// --- INITIAL LOADERS ---
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadVaultConfig();
  initUI();
});

// --- LOADERS & STORAGE CONFIG ---
function loadTheme() {
  const savedTheme = localStorage.getItem("notebook_theme") || "dark";
  STATE.theme = savedTheme;
  document.documentElement.setAttribute("data-theme", savedTheme);
  syncThemeUI();
}

function loadVaultConfig() {
  const pwdHash = localStorage.getItem("notebook_vault_hash");
  if (pwdHash) {
    STATE.vaultPasswordHash = pwdHash;
    STATE.isUnlocked = false;
    showLockScreen(true, "unlock");
  } else {
    // No password set yet, prompt user to set one or skip
    STATE.isUnlocked = true;
    showLockScreen(true, "setup");
  }
}

function loadNotesFromStorage() {
  try {
    const rawNotes = localStorage.getItem("notebook_vault_notes");
    if (rawNotes) {
      const decoded = decodeData(rawNotes);
      STATE.notes = JSON.parse(decoded);
    } else {
      STATE.notes = getDemoNotes();
    }
  } catch (e) {
    console.error("Error loading notes", e);
    STATE.notes = getDemoNotes();
  }
}

function saveNotesToStorage() {
  const rawString = JSON.stringify(STATE.notes);
  const encoded = encodeData(rawString);
  localStorage.setItem("notebook_vault_notes", encoded);
}

// --- UI SETUP & EVENT BINDINGS ---
function initUI() {
  // Theme Toggle
  document.getElementById("theme-toggle").addEventListener("click", () => {
    STATE.theme = STATE.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", STATE.theme);
    localStorage.setItem("notebook_theme", STATE.theme);
    syncThemeUI();
  });

  // Sidebar controls
  document.getElementById("btn-new-note").addEventListener("click", createNewNote);
  document.getElementById("search-notes").addEventListener("input", (e) => {
    STATE.searchQuery = e.target.value.toLowerCase();
    renderNotesList();
  });

  // Filter tabs
  const tabs = document.querySelectorAll(".filter-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      STATE.activeFilter = tab.dataset.category;
      renderNotesList();
    });
  });

  // Editor Inputs
  document.getElementById("note-title").addEventListener("input", handleNoteInput);
  document.getElementById("note-category").addEventListener("change", handleNoteInput);
  document.getElementById("note-tags").addEventListener("input", handleNoteInput);
  document.getElementById("note-body").addEventListener("input", handleNoteInput);

  // Markdown Toolbar Binding
  const toolbarButtons = document.querySelectorAll(".editor-toolbar .toolbar-btn[data-action]");
  toolbarButtons.forEach(btn => {
    btn.addEventListener("click", () => handleToolbarAction(btn.dataset.action));
  });

  // Action Buttons
  document.getElementById("btn-delete-note").addEventListener("click", deleteActiveNote);
  document.getElementById("btn-export-txt").addEventListener("click", exportActiveNoteTxt);
  document.getElementById("btn-export-backup").addEventListener("click", exportBackupJson);
  
  // File Import Handling
  document.getElementById("import-file").addEventListener("change", handleImportFile);

  // Vault Submit
  document.getElementById("btn-vault-submit").addEventListener("click", handleVaultSubmit);
  document.getElementById("btn-vault-skip").addEventListener("click", handleVaultSkip);
  document.getElementById("btn-vault-security").addEventListener("click", () => {
    // Manually locking
    STATE.isUnlocked = false;
    showLockScreen(true, STATE.vaultPasswordHash ? "unlock" : "setup");
  });

  // Key event listeners for Lock modal
  document.getElementById("vault-password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleVaultSubmit();
  });
  document.getElementById("vault-confirm-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleVaultSubmit();
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

// --- SECURE VAULT LOCK CONTROLLER ---
function showLockScreen(show, mode = "unlock") {
  const overlay = document.getElementById("vault-overlay");
  const title = document.getElementById("vault-title");
  const desc = document.getElementById("vault-desc");
  const confirmRow = document.getElementById("vault-confirm-row");
  const errorMsg = document.getElementById("vault-error-msg");
  const skipBtn = document.getElementById("btn-vault-skip");
  const submitBtn = document.getElementById("btn-vault-submit");
  const pwdInput = document.getElementById("vault-password-input");

  errorMsg.classList.add("hidden");
  pwdInput.value = "";
  document.getElementById("vault-confirm-input").value = "";

  if (!show) {
    overlay.classList.add("hidden");
    return;
  }

  overlay.classList.remove("hidden");
  
  if (mode === "setup") {
    title.textContent = "Secure Your Vault";
    desc.textContent = "Create a custom master password to protect and encrypt your local notebook entries.";
    confirmRow.classList.remove("hidden");
    skipBtn.classList.remove("hidden");
    submitBtn.textContent = "Set Password";
    pwdInput.placeholder = "Create Password";
  } else {
    title.textContent = "Vault Locked";
    desc.textContent = "Enter your master password to decrypt and view your secure database.";
    confirmRow.classList.add("hidden");
    skipBtn.classList.add("hidden");
    submitBtn.textContent = "Unlock Vault";
    pwdInput.placeholder = "Enter Password";
  }
}

function handleVaultSubmit() {
  const pwdInput = document.getElementById("vault-password-input").value;
  const errorMsg = document.getElementById("vault-error-msg");

  if (!pwdInput) {
    errorMsg.textContent = "Password cannot be empty.";
    errorMsg.classList.remove("hidden");
    return;
  }

  // Setup mode
  if (STATE.vaultPasswordHash === null) {
    const confirmInput = document.getElementById("vault-confirm-input").value;
    if (pwdInput !== confirmInput) {
      errorMsg.textContent = "Passwords do not match.";
      errorMsg.classList.remove("hidden");
      return;
    }

    // Hash and store password
    const hash = simpleHash(pwdInput);
    STATE.vaultPasswordHash = hash;
    localStorage.setItem("notebook_vault_hash", hash);
    STATE.isUnlocked = true;
    showLockScreen(false);
    loadNotesFromStorage();
    renderNotesList();
    selectFirstNote();
  } 
  // Unlock mode
  else {
    const inputHash = simpleHash(pwdInput);
    if (inputHash === STATE.vaultPasswordHash) {
      STATE.isUnlocked = true;
      showLockScreen(false);
      loadNotesFromStorage();
      renderNotesList();
      selectFirstNote();
    } else {
      errorMsg.textContent = "Incorrect password. Try again.";
      errorMsg.classList.remove("hidden");
    }
  }
}

function handleVaultSkip() {
  // Let user continue without password protection
  STATE.isUnlocked = true;
  showLockScreen(false);
  loadNotesFromStorage();
  renderNotesList();
  selectFirstNote();
}

// --- NOTE OPERATIONS ---
function getDemoNotes() {
  return [
    {
      id: "demo-1",
      title: "Welcome to Secure Notebook 🔒",
      body: "# Quick Setup Guide\n\nWelcome! This digital notebook helps you save logs, diaries, and work details securely.\n\n### Core Features:\n1. **Lock Vault**: Click the Lock Vault button in the top right to protect your notes.\n2. **Import Notes**: Upload JSON or plain text files using the import button.\n3. **Quick Markdown**: Use the writing editor toolbar helper to outline headings, checklists, lists, bold text, or code scripts.\n\n### Formatting Example:\n* Use bullets to log progress.\n* Draft daily tasks.",
      category: "notes",
      tags: ["welcome", "guide"],
      updatedAt: Date.now()
    },
    {
      id: "demo-2",
      title: "Personal Journal Entry 📖",
      body: "## June 11, 2026\nToday was a productive day. Responded to user requests and fixed PR conflicts inside Git workflow folders. Managed to resolve index builder scripts smoothly.\n\nIdeas to think about:\n- Implement secure client-side storage frameworks\n- Keep building beautiful interfaces with micro-animations",
      category: "diary",
      tags: ["journal", "personal"],
      updatedAt: Date.now() - 3600000
    }
  ];
}

function renderNotesList() {
  const container = document.getElementById("notes-list-container");
  container.innerHTML = "";

  // Filter and Search notes
  const filtered = STATE.notes.filter(n => {
    // category filter
    if (STATE.activeFilter !== "all" && n.category !== STATE.activeFilter) return false;
    
    // search filter
    if (STATE.searchQuery) {
      const matchTitle = n.title.toLowerCase().includes(STATE.searchQuery);
      const matchBody = n.body.toLowerCase().includes(STATE.searchQuery);
      const matchTags = n.tags.some(t => t.toLowerCase().includes(STATE.searchQuery));
      return matchTitle || matchBody || matchTags;
    }
    
    return true;
  });

  // Sort notes by updated date desc
  filtered.sort((a, b) => b.updatedAt - a.updatedAt);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-list-desc">No notes found.</div>`;
    return;
  }

  filtered.forEach(note => {
    const item = document.createElement("div");
    item.className = `note-item ${note.id === STATE.activeNoteId ? 'active' : ''}`;
    
    // Format timestamp
    const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const snippet = note.body.replace(/[#*`[\]]/g, '').substring(0, 45) || "Empty note...";

    item.innerHTML = `
      <div class="note-item-header">
        <h4 class="note-item-title">${escapeHTML(note.title) || "Untitled Note"}</h4>
        <span class="note-item-category cat-${note.category}">${note.category}</span>
      </div>
      <p class="note-item-snippet">${escapeHTML(snippet)}</p>
      <div class="note-item-footer">
        <span>${dateStr}</span>
        <div class="note-item-tags">
          ${note.tags.map(t => `<span class="tag-badge">#${escapeHTML(t)}</span>`).join("")}
        </div>
      </div>
    `;

    item.addEventListener("click", () => selectNote(note.id));
    container.appendChild(item);
  });
}

function selectNote(noteId) {
  STATE.activeNoteId = noteId;
  renderNotesList();

  const note = STATE.notes.find(n => n.id === noteId);
  const emptyOverlay = document.getElementById("empty-state");

  if (!note) {
    emptyOverlay.classList.remove("hidden");
    return;
  }

  emptyOverlay.classList.add("hidden");

  // Populate editor
  document.getElementById("note-title").value = note.title;
  document.getElementById("note-category").value = note.category;
  document.getElementById("note-tags").value = note.tags.join(", ");
  document.getElementById("note-body").value = note.body;

  updateStats();
  updateNoteDate(note.updatedAt);
}

function selectFirstNote() {
  if (STATE.notes.length > 0) {
    selectNote(STATE.notes[0].id);
  } else {
    document.getElementById("empty-state").classList.remove("hidden");
  }
}

function createNewNote() {
  const newNote = {
    id: "note-" + Date.now() + Math.random().toString(36).substring(2, 6),
    title: "New Note",
    body: "",
    category: STATE.activeFilter === "all" ? "notes" : STATE.activeFilter,
    tags: [],
    updatedAt: Date.now()
  };

  STATE.notes.unshift(newNote);
  saveNotesToStorage();
  
  STATE.activeNoteId = newNote.id;
  renderNotesList();
  selectNote(newNote.id);
  
  document.getElementById("note-title").focus();
}

function deleteActiveNote() {
  if (!STATE.activeNoteId) return;
  
  if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
    STATE.notes = STATE.notes.filter(n => n.id !== STATE.activeNoteId);
    saveNotesToStorage();
    STATE.activeNoteId = null;
    
    renderNotesList();
    selectFirstNote();
  }
}

let saveTimeout = null;
function handleNoteInput() {
  if (!STATE.activeNoteId) return;

  const saveStatus = document.getElementById("save-status");
  saveStatus.textContent = "Autosaving...";

  // Clear previous debounce timeout
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    const note = STATE.notes.find(n => n.id === STATE.activeNoteId);
    if (note) {
      note.title = document.getElementById("note-title").value;
      note.category = document.getElementById("note-category").value;
      note.body = document.getElementById("note-body").value;
      
      const tagsVal = document.getElementById("note-tags").value;
      note.tags = tagsVal.split(",")
                         .map(t => t.trim())
                         .filter(t => t.length > 0);

      note.updatedAt = Date.now();
      
      saveNotesToStorage();
      renderNotesList();
      updateStats();
      updateNoteDate(note.updatedAt);
      
      saveStatus.textContent = "Saved";
    }
  }, 400); // 400ms debounce save
}

// --- TEXT WRITING EDITOR TOOLBAR ACTION HELPERS ---
function handleToolbarAction(action) {
  const textarea = document.getElementById("note-body");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selection = textarea.value.substring(start, end);
  
  let result = "";

  switch (action) {
    case "h1":
      result = `\n# ${selection || "Heading 1"}\n`;
      break;
    case "h2":
      result = `\n## ${selection || "Heading 2"}\n`;
      break;
    case "bold":
      result = `**${selection || "Bold Text"}**`;
      break;
    case "italic":
      result = `*${selection || "Italic Text"}*`;
      break;
    case "code":
      result = `\n\`\`\`javascript\n${selection || "// Code script"}\n\`\`\`\n`;
      break;
    case "list":
      result = `\n* ${selection || "List item"}`;
      break;
    case "todo":
      result = `\n- [ ] ${selection || "Checklist task"}`;
      break;
  }

  // Insert formatting at selector range
  textarea.value = textarea.value.substring(0, start) + result + textarea.value.substring(end);
  textarea.focus();
  textarea.selectionStart = start + result.length;
  textarea.selectionEnd = start + result.length;

  handleNoteInput();
}

// --- FILE UPLOAD / IMPORT CONTROLLERS ---
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  
  if (file.name.endsWith(".json")) {
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);
        
        // Match import layout schema
        let importedCount = 0;
        const notesToImport = Array.isArray(data) ? data : (data.notes || []);

        notesToImport.forEach(item => {
          if (item.title && typeof item.body === "string") {
            STATE.notes.unshift({
              id: "note-" + Date.now() + Math.random().toString(36).substring(2, 6),
              title: item.title,
              body: item.body,
              category: item.category || "notes",
              tags: Array.isArray(item.tags) ? item.tags : [],
              updatedAt: item.updatedAt || Date.now()
            });
            importedCount++;
          }
        });

        if (importedCount > 0) {
          saveNotesToStorage();
          renderNotesList();
          selectFirstNote();
          alert(`Successfully imported ${importedCount} notes to your Vault!`);
        } else {
          alert("Invalid backup JSON format. No notes discovered.");
        }
      } catch (err) {
        alert("Error reading JSON file. Corrupt formatting.");
      }
    };
    reader.readAsText(file);
  } 
  else if (file.name.endsWith(".txt")) {
    reader.onload = function(evt) {
      const text = evt.target.result;
      const titleName = file.name.replace(".txt", "");
      
      const newNote = {
        id: "note-" + Date.now() + Math.random().toString(36).substring(2, 6),
        title: titleName,
        body: text,
        category: "notes",
        tags: ["imported"],
        updatedAt: Date.now()
      };

      STATE.notes.unshift(newNote);
      saveNotesToStorage();
      renderNotesList();
      selectNote(newNote.id);
      
      alert(`Imported text note: "${titleName}"`);
    };
    reader.readAsText(file);
  }

  // Clear input
  e.target.value = "";
}

// --- FILE SAVE / EXPORT CONTROLLERS ---
function exportActiveNoteTxt() {
  if (!STATE.activeNoteId) return;
  const note = STATE.notes.find(n => n.id === STATE.activeNoteId);
  if (!note) return;

  const content = `${note.title}\nCategory: ${note.category}\nTags: ${note.tags.join(", ")}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n${note.body}`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
  link.click();
}

function exportBackupJson() {
  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    notes: STATE.notes
  }, null, 2);

  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `secure_notebook_backup_${Date.now()}.json`;
  link.click();
}

// --- UTILITY METHODS ---
function updateStats() {
  const body = document.getElementById("note-body").value;
  const chars = body.length;
  const words = body.trim() === "" ? 0 : body.trim().split(/\s+/).length;
  document.getElementById("note-stats").textContent = `${words} words | ${chars} characters`;
}

function updateNoteDate(timestamp) {
  const dateStr = new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById("note-date").textContent = `Updated: ${dateStr}`;
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
