(function () {
  var STORAGE_KEY = 'step_counter_logs';

  /* ---- DOM refs ---- */
  var tileSteps = document.getElementById('tileSteps');
  var tileDist = document.getElementById('tileDist');
  var tileCal = document.getElementById('tileCal');
  var tilePct = document.getElementById('tilePct');
  var fDate = document.getElementById('fDate');
  var fSteps = document.getElementById('fSteps');
  var fGoal = document.getElementById('fGoal');
  var logBtn = document.getElementById('logBtn');
  var canvas = document.getElementById('ringCanvas');
  var ctx = canvas.getContext('2d');
  var canvasWrap = document.getElementById('canvasWrap');
  var chartKey = document.getElementById('chartKey');
  var ledgerBody = document.getElementById('ledgerBody');
  var ledgerCount = document.getElementById('ledgerCount');
  var clearBtn = document.getElementById('clearBtn');
  var seedBtn = document.getElementById('seedBtn');

  /* ---- state ---- */
  var logs = [];

  /* ---- storage ---- */
  function loadLogs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (Array.isArray(d) && d.length) { logs = d; return; }
      }
    } catch (e) {}
    logs = seedData();
    saveLogs();
  }
  function saveLogs() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); } catch (e) {} }

  function seedData() {
    var data = [];
    for (var i = 14; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var ds = d.toISOString().slice(0,10);
      var goal = 10000;
      var steps = Math.floor(Math.random() * 6000 + 4000);
      data.push({ id: Date.now() + i, date: ds, steps: steps, targetGoal: goal });
    }
    return data;
  }

  /* ---- math ---- */
  function distKm(steps) { return (steps * 0.75) / 1000; }
  function calKcal(steps) { return steps * 0.04; }
  function compPct(steps, goal) { return goal > 0 ? (steps / goal) * 100 : 0; }

  function calcTotals() {
    var steps = 0, cal = 0, pctSum = 0, count = logs.length;
    logs.forEach(function (l) {
      steps += l.steps;
      cal += calKcal(l.steps);
      pctSum += compPct(l.steps, l.targetGoal);
    });
    return { steps: steps, dist: distKm(steps), cal: cal, pct: count > 0 ? pctSum / count : 0 };
  }

  /* ---- validation ---- */
  function validate(date, steps, goal) {
    if (!date) { return 'Please select a date.'; }
    if (!steps || steps < 1 || !Number.isInteger(Number(steps))) { return 'Steps must be a positive integer.'; }
    if (Number(steps) > 200000) { return 'Steps exceed reasonable limit (200k).'; }
    if (!goal || goal < 1) { return 'Daily goal must be a positive number.'; }
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].date === date) { return 'A log entry already exists for ' + date + '.'; }
    }
    return null;
  }

  function sanitize(str) {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<\/?[^>]+(>|$)/g, '').trim();
  }

  /* ---- canvas rings ---- */
  function drawRings() {
    var wrapRect = canvasWrap.getBoundingClientRect();
    var size = Math.min(wrapRect.width, wrapRect.height, 260);
    if (size < 40) return;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    var cx = size / 2, cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (logs.length === 0) {
      ctx.fillStyle = '#1a1d2e';
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.font = Math.round(size * 0.05) + 'px "SF Mono",Consolas,monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('No data', cx, cy);
      chartKey.innerHTML = '';
      return;
    }

    var show = logs.slice(-7);
    var ringGap = size * 0.055;
    var rMax = size * 0.42;
    var count = Math.min(show.length, 7);
    var ringW = (rMax - ringGap * (count - 1)) / count;
    if (ringW < 3.5) ringW = 3.5;

    var colors = ['#00f0ff','#10b981','#f59e0b','#8b5cf6','#ff2a5f','#f97316','#06b6d4'];

    for (var i = 0; i < count; i++) {
      var l = show[i];
      var r = rMax - i * (ringW + ringGap);
      var pct = compPct(l.steps, l.targetGoal) / 100;
      var color = pct >= 1 ? '#10b981' : pct >= 0.75 ? '#00f0ff' : '#f59e0b';

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = ringW;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = ringW;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    var avgPct = calcTotals().pct;
    ctx.fillStyle = avgPct >= 100 ? '#10b981' : avgPct >= 75 ? '#00f0ff' : '#f59e0b';
    ctx.font = 'bold ' + Math.round(size * 0.07) + 'px "SF Mono",Consolas,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(avgPct.toFixed(1) + '%', cx, cy - size * 0.01);
    ctx.fillStyle = '#475569';
    ctx.font = Math.round(size * 0.035) + 'px "SF Mono",Consolas,monospace';
    ctx.fillText('avg completion', cx, cy + size * 0.055);

    /* key */
    chartKey.innerHTML =
      '<span class="key-dot"><span class="key-swatch" style="background:#10b981"></span>Goal Met</span>' +
      '<span class="key-dot"><span class="key-swatch" style="background:#00f0ff"></span>75%+</span>' +
      '<span class="key-dot"><span class="key-swatch" style="background:#f59e0b"></span>Below 75%</span>';
  }

  /* ---- render ---- */
  function renderTele() {
    var t = calcTotals();
    tileSteps.textContent = t.steps.toLocaleString();
    tileDist.textContent = t.dist.toFixed(2) + ' km';
    tileCal.textContent = Math.round(t.cal).toLocaleString() + ' kcal';
    tilePct.textContent = t.pct.toFixed(1) + '%';
    tilePct.style.color = t.pct >= 100 ? '#10b981' : t.pct >= 75 ? '#00f0ff' : '#f59e0b';
  }

  function renderLedger() {
    ledgerBody.innerHTML = '';
    if (logs.length === 0) { ledgerCount.textContent = '0 entries'; return; }
    ledgerCount.textContent = logs.length + ' entries';
    var sorted = logs.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    sorted.forEach(function (l) {
      var pct = compPct(l.steps, l.targetGoal);
      var met = pct >= 100;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + l.date + '</td>' +
        '<td>' + l.steps.toLocaleString() + ' / ' + l.targetGoal.toLocaleString() + '</td>' +
        '<td>' + pct.toFixed(1) + '%</td>' +
        '<td><span class="badge badge-' + (met ? 'p' : 'f') + '">' + (met ? 'ACHIEVED' : 'MISSED') + '</span></td>';
      ledgerBody.appendChild(tr);
    });
  }

  function refresh() {
    renderTele();
    drawRings();
    renderLedger();
  }

  /* ---- log entry ---- */
  function handleLog() {
    var date = sanitize(fDate.value);
    var stepsStr = sanitize(fSteps.value);
    var goalStr = sanitize(fGoal.value);
    var steps = parseInt(stepsStr);
    var goal = parseInt(goalStr);

    var err = validate(date, steps, goal);
    if (err) {
      animateShake();
      return;
    }

    logs.push({ id: Date.now(), date: date, steps: steps, targetGoal: goal });
    saveLogs();
    refresh();
    fDate.value = ''; fSteps.value = '';
    fDate.focus();
  }

  function animateShake() {
    document.getElementById('app').classList.remove('shake');
    void document.getElementById('app').offsetWidth;
    document.getElementById('app').classList.add('shake');
  }

  /* ---- clear / seed ---- */
  function clearData() {
    if (!confirm('Clear all activity logs?')) return;
    logs = []; saveLogs(); refresh();
  }
  function seedDataFn() {
    logs = seedData(); saveLogs(); refresh();
  }

  /* ---- bootstrap ---- */
  function boot() {
    loadLogs();
    fDate.value = new Date().toISOString().slice(0,10);
    refresh();

    logBtn.addEventListener('click', handleLog);
    clearBtn.addEventListener('click', clearData);
    seedBtn.addEventListener('click', seedDataFn);
    clearBtn.className = 'foot-btn';
    seedBtn.className = 'foot-btn';

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(drawRings, 80);
    });
  }

  boot();
})();
