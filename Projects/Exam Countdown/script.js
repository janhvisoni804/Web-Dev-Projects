(function () {
  var STORAGE_KEY = 'exam_countdown_data';

  var exams = [];
  var tickId = null;

  /* ---- Elements ---- */
  var deck = document.getElementById('deck');
  var totalExamsEl = document.getElementById('totalExams');
  var totalPendingEl = document.getElementById('totalPending');
  var createBtn = document.getElementById('createBtn');
  var modal = document.getElementById('modal');
  var modalOverlay = document.getElementById('modalOverlay');
  var cancelBtn = document.getElementById('cancelBtn');
  var examForm = document.getElementById('examForm');
  var fSubject = document.getElementById('fSubject');
  var fDate = document.getElementById('fDate');
  var fMilestones = document.getElementById('fMilestones');
  var dateAlert = document.getElementById('dateAlert');
  var saveBtn = document.getElementById('saveBtn');

  /* ---- Seed data ---- */
  function seedData() {
    var now = new Date();
    function futureDate(days, hours) {
      var d = new Date(now);
      d.setDate(d.getDate() + days);
      d.setHours(hours || 10, 0, 0, 0);
      return d.toISOString().slice(0, 16);
    }
    return [
      { id: Date.now() + 1, subject: 'Database Management Systems', dateCode: futureDate(45), milestones: [
        { id: 'm1', text: 'ER Diagrams & Normalization', done: false },
        { id: 'm2', text: 'SQL Queries Practice', done: false },
        { id: 'm3', text: 'Transaction & Concurrency', done: false },
        { id: 'm4', text: 'Indexing & B+ Trees', done: false },
      ]},
      { id: Date.now() + 2, subject: 'Universal Human Values', dateCode: futureDate(30), milestones: [
        { id: 'm5', text: 'Unit 1 — Harmony in Self', done: false },
        { id: 'm6', text: 'Unit 2 — Harmony in Family', done: false },
        { id: 'm7', text: 'Unit 3 — Harmony in Society', done: false },
      ]},
      { id: Date.now() + 3, subject: 'Network Security', dateCode: futureDate(60, 14), milestones: [
        { id: 'm8', text: 'Cryptography Basics', done: false },
        { id: 'm9', text: 'Authentication Protocols', done: false },
        { id: 'm10', text: 'Firewall & IDS', done: false },
        { id: 'm11', text: 'Web Security', done: false },
        { id: 'm12', text: 'Practice Problems', done: false },
      ]},
    ];
  }

  /* ---- Storage ---- */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          exams = parsed;
          return;
        }
      }
    } catch (e) {}
    exams = seedData();
    saveData();
  }

  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(exams)); } catch (e) {}
  }

  /* ---- XSS strip ---- */
  function sanitize(str) {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<\/?[^>]+(>|$)/g, '')
              .trim();
  }

  /* ---- Render ---- */
  function render() {
    var now = new Date();
    var pendingTotal = 0;
    var urgentCount = 0;
    var html = '';

    for (var i = 0; i < exams.length; i++) {
      var ex = exams[i];
      var examDate = new Date(ex.dateCode);
      var diff = examDate - now;
      var expired = diff <= 0;
      var absDiff = Math.abs(diff);
      var days = Math.floor(absDiff / 86400000);
      var hours = Math.floor((absDiff % 86400000) / 3600000);
      var minutes = Math.floor((absDiff % 3600000) / 60000);
      var seconds = Math.floor((absDiff % 60000) / 1000);

      var total = ex.milestones.length;
      var done = 0;
      for (var j = 0; j < ex.milestones.length; j++) {
        if (ex.milestones[j].done) done++;
      }
      pendingTotal += total - done;
      var pct = total > 0 ? Math.round((done / total) * 100) : 0;

      var isUrgent = !expired && diff <= 86400000;
      if (isUrgent) urgentCount++;

      var dateLabel = expired ? 'Overdue' : ex.dateCode.slice(0, 10);

      html += '<div class="card' + (isUrgent ? ' urgent' : '') + '" data-idx="' + i + '">';
      html += '<div class="card-subject">' + esc(ex.subject) + '</div>';
      html += '<div class="card-date">' + esc(dateLabel) + '</div>';
      html += '<div class="countdown-row">';
      if (expired) {
        html += '<div class="count-block"><div class="count-num" style="color:#ef4444">OVERDUE</div></div>';
      } else {
        html += '<div class="count-block"><div class="count-num" id="cd-' + ex.id + '-d">' + pad(days, 2) + '</div><div class="count-lbl">Days</div></div>';
        html += '<div class="count-block"><div class="count-num" id="cd-' + ex.id + '-h">' + pad(hours, 2) + '</div><div class="count-lbl">Hours</div></div>';
        html += '<div class="count-block"><div class="count-num" id="cd-' + ex.id + '-m">' + pad(minutes, 2) + '</div><div class="count-lbl">Min</div></div>';
        html += '<div class="count-block"><div class="count-num" id="cd-' + ex.id + '-s">' + pad(seconds, 2) + '</div><div class="count-lbl">Sec</div></div>';
      }
      html += '</div>';

      /* progress bar */
      html += '<div class="progress-wrap">';
      html += '  <div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '  <div class="progress-text">' + pct + '% Complete</div>';
      html += '</div>';

      /* milestones */
      html += '<div class="card-milestones" id="ms-' + ex.id + '">';
      for (var j = 0; j < ex.milestones.length; j++) {
        var m = ex.milestones[j];
        html += '<div class="milestone' + (m.done ? ' done' : '') + '">';
        html += '  <input type="checkbox" data-eid="' + ex.id + '" data-mid="' + m.id + '"' + (m.done ? ' checked' : '') + '>';
        html += '  <label>' + esc(m.text) + '</label>';
        html += '  <button class="del-milestone" data-eid="' + ex.id + '" data-mid="' + m.id + '">✕</button>';
        html += '</div>';
      }
      html += '</div>';

      html += '<div class="card-actions">';
      html += '  <button class="toggle-ms" data-id="' + ex.id + '">Show Tasks</button>';
      html += '  <button class="del-card" data-id="' + ex.id + '">Delete</button>';
      html += '</div>';
      html += '</div>';
    }

    deck.innerHTML = html;
    totalExamsEl.textContent = exams.length;
    totalPendingEl.textContent = pendingTotal;

    /* bind card clicks to toggle milestones */
    var toggleBtns = deck.querySelectorAll('.toggle-ms');
    for (var i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.dataset.id);
        var el = document.getElementById('ms-' + id);
        if (el) {
          el.classList.toggle('open');
          this.textContent = el.classList.contains('open') ? 'Hide Tasks' : 'Show Tasks';
        }
      });
    }

    /* bind milestone checkbox changes */
    var checkboxes = deck.querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener('change', function () {
        var eid = parseInt(this.dataset.eid);
        var mid = this.dataset.mid;
        toggleMilestone(eid, mid, this.checked);
      });
    }

    /* bind milestone delete */
    var delMils = deck.querySelectorAll('.del-milestone');
    for (var i = 0; i < delMils.length; i++) {
      delMils[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var eid = parseInt(this.dataset.eid);
        var mid = this.dataset.mid;
        deleteMilestone(eid, mid);
      });
    }

    /* bind card delete */
    var delCards = deck.querySelectorAll('.del-card');
    for (var i = 0; i < delCards.length; i++) {
      delCards[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.dataset.id);
        deleteExam(id);
      });
    }
  }

  /* ---- Countdown tick ---- */
  function tick() {
    var now = new Date();
    for (var i = 0; i < exams.length; i++) {
      var ex = exams[i];
      var diff = new Date(ex.dateCode) - now;
      if (diff <= 0) continue;
      var absDiff = Math.abs(diff);
      var days = Math.floor(absDiff / 86400000);
      var hours = Math.floor((absDiff % 86400000) / 3600000);
      var minutes = Math.floor((absDiff % 3600000) / 60000);
      var seconds = Math.floor((absDiff % 60000) / 1000);

      var dEl = document.getElementById('cd-' + ex.id + '-d');
      var hEl = document.getElementById('cd-' + ex.id + '-h');
      var mEl = document.getElementById('cd-' + ex.id + '-m');
      var sEl = document.getElementById('cd-' + ex.id + '-s');
      if (dEl) dEl.textContent = pad(days, 2);
      if (hEl) hEl.textContent = pad(hours, 2);
      if (mEl) mEl.textContent = pad(minutes, 2);
      if (sEl) sEl.textContent = pad(seconds, 2);
    }
  }

  /* ---- Helpers ---- */
  function pad(n, len) {
    var s = String(Math.max(0, n));
    while (s.length < len) s = '0' + s;
    return s;
  }

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ---- Mutations ---- */
  function toggleMilestone(eid, mid, checked) {
    for (var i = 0; i < exams.length; i++) {
      if (exams[i].id === eid) {
        for (var j = 0; j < exams[i].milestones.length; j++) {
          if (exams[i].milestones[j].id === mid) {
            exams[i].milestones[j].done = checked;
            saveData();
            render();
            return;
          }
        }
      }
    }
  }

  function deleteMilestone(eid, mid) {
    for (var i = 0; i < exams.length; i++) {
      if (exams[i].id === eid) {
        exams[i].milestones = exams[i].milestones.filter(function (m) { return m.id !== mid; });
        saveData();
        render();
        return;
      }
    }
  }

  function deleteExam(id) {
    if (!confirm('Delete this exam tracker?')) return;
    exams = exams.filter(function (e) { return e.id !== id; });
    saveData();
    render();
  }

  /* ---- Modal ---- */
  function openModal() {
    modal.classList.remove('modal-hidden');
    fSubject.value = '';
    fDate.value = '';
    fMilestones.value = '';
    dateAlert.classList.add('alert-hidden');
    saveBtn.disabled = false;
  }

  function closeModal() {
    modal.classList.add('modal-hidden');
  }

  createBtn.addEventListener('click', openModal);
  modalOverlay.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  /* date validation on input */
  fDate.addEventListener('change', function () {
    validateDate();
  });

  function validateDate() {
    var val = fDate.value;
    if (!val) { dateAlert.classList.add('alert-hidden'); return true; }
    var selected = new Date(val);
    var now = new Date();
    if (selected <= now) {
      dateAlert.classList.remove('alert-hidden');
      dateAlert.classList.remove('flash');
      void dateAlert.offsetWidth;
      dateAlert.classList.add('flash');
      saveBtn.disabled = true;
      return false;
    }
    dateAlert.classList.add('alert-hidden');
    saveBtn.disabled = false;
    return true;
  }

  examForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var subject = sanitize(fSubject.value);
    if (!subject) { fSubject.focus(); return; }

    var dateVal = fDate.value;
    if (!dateVal) { fDate.focus(); return; }
    if (!validateDate()) return;

    var milestonesText = fMilestones.value;
    var lines = milestonesText.split('\n').filter(function (l) { return sanitize(l).length > 0; });
    var milestones = [];
    for (var i = 0; i < lines.length; i++) {
      milestones.push({ id: 'm' + Date.now() + '-' + i, text: sanitize(lines[i]), done: false });
    }
    if (milestones.length === 0) {
      milestones.push({ id: 'm' + Date.now(), text: 'General Preparation', done: false });
    }

    exams.push({
      id: Date.now(),
      subject: subject,
      dateCode: dateVal,
      milestones: milestones,
    });

    saveData();
    render();
    closeModal();
  });

  /* ---- Boot ---- */
  loadData();
  render();
  tickId = setInterval(tick, 1000);
})();
