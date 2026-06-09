(function () {
  var STORAGE_KEY = 'memory_booster_data';

  var gridSize = 4;
  var sequence = [];
  var playerSeq = [];
  var level = 1;
  var score = 0;
  var streak = 0;
  var best = 0;
  var isFlashing = false;
  var isInputLocked = true;
  var flashIndex = 0;
  var history = [];

  /* ---- Elements ---- */
  var grid = document.getElementById('grid');
  var gridWrap = document.getElementById('gridWrap');
  var statusText = document.getElementById('statusText');
  var telLevel = document.getElementById('telLevel');
  var telMulti = document.getElementById('telMulti');
  var telStreak = document.getElementById('telStreak');
  var telBest = document.getElementById('telBest');
  var telScore = document.getElementById('telScore');
  var historyList = document.getElementById('historyList');
  var historyEmpty = document.getElementById('historyEmpty');
  var newBtn = document.getElementById('newBtn');
  var resetBtn = document.getElementById('resetBtn');

  /* ---- Storage ---- */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d.best) best = d.best;
        if (d.history) history = d.history;
      }
    } catch (e) {}
  }

  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ best: best, history: history })); } catch (e) {}
  }

  /* ---- Grid ---- */
  function buildGrid() {
    grid.style.gridTemplateColumns = 'repeat(' + gridSize + ', 1fr)';
    grid.innerHTML = '';
    var total = gridSize * gridSize;
    for (var i = 0; i < total; i++) {
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.idx = i;
      tile.addEventListener('click', function () { onTileClick(parseInt(this.dataset.idx)); });
      grid.appendChild(tile);
    }
  }

  function getTiles() { return grid.querySelectorAll('.tile'); }

  /* ---- Sequence ---- */
  function generateSequence() {
    var len = 2 + Math.floor(level * 0.8);
    if (len > 12) len = 12;
    var total = gridSize * gridSize;
    var seq = [];
    for (var i = 0; i < len; i++) {
      seq.push(Math.floor(Math.random() * total));
    }
    return seq;
  }

  function flashSequence() {
    if (sequence.length === 0) return;
    isFlashing = true;
    isInputLocked = true;
    flashIndex = 0;
    disableTiles(true);
    flashNext();
  }

  function flashNext() {
    if (flashIndex >= sequence.length) {
      isFlashing = false;
      isInputLocked = false;
      playerSeq = [];
      disableTiles(false);
      statusText.textContent = 'Your turn \u2014 repeat the pattern';
      return;
    }

    var tiles = getTiles();
    var idx = sequence[flashIndex];
    tiles[idx].classList.add('flash');
    statusText.textContent = 'Watching... ' + (flashIndex + 1) + ' / ' + sequence.length;

    setTimeout(function () {
      tiles[idx].classList.remove('flash');
      flashIndex++;
      setTimeout(flashNext, 120);
    }, 500);
  }

  /* ---- Player input ---- */
  function onTileClick(idx) {
    if (isFlashing || isInputLocked) return;

    var tiles = getTiles();
    var expected = sequence[playerSeq.length];

    if (idx === expected) {
      tiles[idx].classList.add('hit');
      playerSeq.push(idx);

      if (playerSeq.length === sequence.length) {
        isInputLocked = true;
        disableTiles(true);
        roundSuccess();
      }
    } else {
      tiles[idx].classList.add('wrong');
      isInputLocked = true;
      disableTiles(true);
      roundFail();
    }
  }

  function disableTiles(disabled) {
    getTiles().forEach(function (t) { t.disabled = disabled; });
  }

  /* ---- Round outcomes ---- */
  function roundSuccess() {
    var multi = 1 + (level - 1) * 0.2;
    var points = Math.round(sequence.length * 10 * multi);
    score += points;
    streak++;
    if (streak > best) best = streak;

    statusText.textContent = '\u2705 Level ' + level + ' complete! +' + points + ' pts';
    updateTele();

    setTimeout(function () {
      level++;
      if (level >= 4) gridSize = 5;
      buildGrid();
      startRound();
    }, 1200);
  }

  function roundFail() {
    streak = 0;
    gridWrap.classList.remove('shake');
    void gridWrap.offsetWidth;
    gridWrap.classList.add('shake');

    var total = sequence.length;
    var correct = playerSeq.length;
    var pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    addHistory(level, score, pct);

    statusText.textContent = '\u274C Wrong! Reached level ' + level + ' (' + correct + '/' + total + ')';
    updateTele();

    setTimeout(function () {
      level = 1;
      score = 0;
      gridSize = 4;
      buildGrid();
      updateTele();
      statusText.textContent = 'Press "New Exercise" to begin';
    }, 1800);
  }

  /* ---- History ---- */
  function addHistory(lvl, sc, acc) {
    history.unshift({
      level: lvl,
      score: sc,
      accuracy: acc,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
    if (history.length > 30) history = history.slice(0, 30);
    saveData();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) { historyEmpty.style.display = 'flex'; return; }
    historyEmpty.style.display = 'none';
    history.forEach(function (h) {
      var div = document.createElement('div');
      div.className = 'history-entry';
      div.innerHTML = '<span class="his-level">Lv ' + h.level + '</span> <span class="his-score">' + h.score + 'pts</span> <span class="his-acc">' + h.accuracy + '%</span> <span class="his-date">' + h.date + '</span>';
      historyList.appendChild(div);
    });
  }

  /* ---- Telemetry ---- */
  function updateTele() {
    telLevel.textContent = level;
    telMulti.textContent = '\u00D7' + (1 + (level - 1) * 0.2).toFixed(1);
    telStreak.textContent = streak;
    telBest.textContent = best;
    telScore.textContent = score;
  }

  /* ---- Start / Reset ---- */
  function startRound() {
    sequence = generateSequence();
    updateTele();
    setTimeout(function () { flashSequence(); }, 400);
  }

  function newExercise() {
    level = 1;
    score = 0;
    streak = 0;
    gridSize = 4;
    buildGrid();
    updateTele();
    statusText.textContent = 'Generating pattern...';
    startRound();
  }

  function resetProgress() {
    if (!confirm('Reset all progress and history?')) return;
    best = 0;
    history = [];
    saveData();
    level = 1;
    score = 0;
    streak = 0;
    gridSize = 4;
    buildGrid();
    updateTele();
    renderHistory();
    statusText.textContent = 'Progress reset';
  }

  newBtn.addEventListener('click', newExercise);
  resetBtn.addEventListener('click', resetProgress);

  /* ---- Boot ---- */
  loadData();
  buildGrid();
  updateTele();
  renderHistory();
})();
