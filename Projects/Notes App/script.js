const KEY = "wdp.notes.v1";
const $ = (s) => document.querySelector(s);
const list = $("#list"), editor = $("#editor"), empty = $("#empty");
const titleEl = $("#title"), bodyEl = $("#body"), tagsEl = $("#tags"), previewEl = $("#preview");
const searchEl = $("#search");

let notes = load();
let activeId = null;
let query = "";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save() { localStorage.setItem(KEY, JSON.stringify(notes)); }
function uid() { return Math.random().toString(36).slice(2, 9); }

function parseTags(text) {
  const set = new Set();
  for (const m of (text || "").matchAll(/(?:^|\s)#([a-z0-9][\w-]{0,30})/gi)) set.add(m[1].toLowerCase());
  return [...set];
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\b(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|\s)#([a-z0-9][\w-]{0,30})/gi, '$1<span class="tag-inline">#$2</span>');
}

function renderList() {
  const q = query.trim().toLowerCase();
  const visible = notes
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((n) => {
      if (!q) return true;
      const hay = (n.title + " " + n.body + " " + n.tags.join(" ")).toLowerCase();
      return hay.includes(q);
    });

  list.replaceChildren();
  for (const n of visible) {
    const li = document.createElement("div");
    li.className = "list__item";
    li.setAttribute("aria-current", n.id === activeId);
    li.innerHTML = `<h3>${escapeHtml(n.title || "Untitled")}</h3><p>${escapeHtml(n.body.slice(0, 120))}</p>`;
    li.addEventListener("click", () => open(n.id));
    list.appendChild(li);
  }
}

function renderEditor() {
  const n = notes.find((x) => x.id === activeId);
  if (!n) { editor.hidden = true; empty.hidden = false; return; }
  editor.hidden = false; empty.hidden = true;
  if (document.activeElement !== titleEl) titleEl.value = n.title;
  if (document.activeElement !== bodyEl) bodyEl.value = n.body;
  tagsEl.replaceChildren();
  for (const t of n.tags) {
    const el = document.createElement("li"); el.textContent = "#" + t; tagsEl.appendChild(el);
  }
  previewEl.innerHTML = n.body ? linkify(n.body) : '<span style="color:var(--muted)">Preview appears here. Links and #tags become live.</span>';
}

function open(id) { activeId = id; renderList(); renderEditor(); titleEl.focus(); }

function create() {
  const n = { id: uid(), title: "", body: "", tags: [], updatedAt: Date.now() };
  notes.unshift(n); save(); open(n.id);
}

function update() {
  const n = notes.find((x) => x.id === activeId); if (!n) return;
  n.title = titleEl.value;
  n.body = bodyEl.value;
  n.tags = parseTags(n.body);
  n.updatedAt = Date.now();
  save(); renderList(); renderEditor();
}

function remove() {
  notes = notes.filter((x) => x.id !== activeId);
  activeId = null; save(); renderList(); renderEditor();
}

$("#new").addEventListener("click", create);
$("#delete").addEventListener("click", remove);
$("#close").addEventListener("click", () => { activeId = null; renderList(); renderEditor(); });
titleEl.addEventListener("input", update);
bodyEl.addEventListener("input", update);
searchEl.addEventListener("input", (e) => { query = e.target.value; renderList(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { activeId = null; renderList(); renderEditor(); } });

if (!notes.length) {
  notes = [{
    id: uid(),
    title: "Welcome",
    body: "Type freely. Drop links like https://github.com/cu-sanjay/Web-Dev-Projects and use #tags such as #welcome to organise.",
    tags: ["welcome"],
    updatedAt: Date.now(),
  }];
  save();
}
renderList();
renderEditor();
