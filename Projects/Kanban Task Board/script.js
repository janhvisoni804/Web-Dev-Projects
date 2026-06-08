(function () {
  const STORAGE_KEY = 'kanban_board_data';
  const COLUMNS = ['todo', 'in-progress', 'done'];

  let tasks = [];
  let nextId = 1;
  let editingId = null;

  /* ---- Elements ---- */
  const board = document.getElementById('board');
  const createBtn = document.getElementById('createBtn');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');
  const taskTitle = document.getElementById('taskTitle');
  const taskDescription = document.getElementById('taskDescription');
  const priorityRadios = document.querySelectorAll('input[name="priority"]');
  const statTotal = document.getElementById('statTotal');
  const statTodo = document.getElementById('statTodo');
  const statProgress = document.getElementById('statProgress');
  const statDone = document.getElementById('statDone');
  const countTodo = document.getElementById('countTodo');
  const countProgress = document.getElementById('countProgress');
  const countDone = document.getElementById('countDone');

  /* ---- Helpers ---- */
  function sanitize(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return String(str).replace(/[&<>"']/g, function (ch) { return map[ch]; });
  }

  function generateId() {
    while (tasks.some(function (t) { return t.id === 'card_' + nextId; })) { nextId++; }
    return 'card_' + nextId++;
  }

  /* ---- Storage ---- */
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data.tasks)) { tasks = data.tasks; }
        if (data.nextId) { nextId = data.nextId; }
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: tasks, nextId: nextId }));
    } catch (e) {}
  }

  /* ---- Render ---- */
  function render() {
    var bodies = {
      'todo': document.querySelector('.column-body[data-status="todo"]'),
      'in-progress': document.querySelector('.column-body[data-status="in-progress"]'),
      'done': document.querySelector('.column-body[data-status="done"]'),
    };

    var counts = { 'todo': 0, 'in-progress': 0, 'done': 0 };

    COLUMNS.forEach(function (col) {
      bodies[col].innerHTML = '';
    });

    tasks.forEach(function (task) {
      var col = task.status;
      if (COLUMNS.indexOf(col) === -1) col = 'todo';
      counts[col]++;
      bodies[col].appendChild(buildCard(task));
    });

    COLUMNS.forEach(function (col) {
      if (counts[col] === 0) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<span class="empty-icon">&#x2501;</span><span>No tasks</span>';
        bodies[col].appendChild(empty);
      }
    });

    statTotal.textContent = tasks.length;
    statTodo.textContent = counts['todo'];
    statProgress.textContent = counts['in-progress'];
    statDone.textContent = counts['done'];
    countTodo.textContent = counts['todo'];
    countProgress.textContent = counts['in-progress'];
    countDone.textContent = counts['done'];
  }

  function buildCard(task) {
    var card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.id = task.id;

    var prioLabel = task.priority || 'low';
    card.innerHTML =
      '<div class="card-prio prio-' + prioLabel + '">' + sanitize(prioLabel) + '</div>' +
      '<div class="card-title">' + sanitize(task.title) + '</div>' +
      (task.description ? '<div class="card-desc">' + sanitize(task.description) + '</div>' : '') +
      '<div class="card-footer">' +
        '<button class="card-edit" data-id="' + task.id + '">Edit</button>' +
        '<button class="card-delete" data-id="' + task.id + '">Delete</button>' +
      '</div>';

    /* ---- Drag Events ---- */
    card.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      document.querySelectorAll('.column-body').forEach(function (b) {
        b.classList.remove('drag-over');
      });
    });

    /* ---- Edit / Delete ---- */
    card.querySelector('.card-edit').addEventListener('click', function () {
      openEditModal(task.id);
    });

    card.querySelector('.card-delete').addEventListener('click', function () {
      deleteTask(task.id);
    });

    return card;
  }

  /* ---- Drag & Drop Columns ---- */
  document.querySelectorAll('.column-body').forEach(function (body) {
    body.addEventListener('dragover', function (e) {
      e.preventDefault();
      body.classList.add('drag-over');
    });

    body.addEventListener('dragleave', function () {
      body.classList.remove('drag-over');
    });

    body.addEventListener('drop', function (e) {
      e.preventDefault();
      body.classList.remove('drag-over');
      var id = e.dataTransfer.getData('text/plain');
      var newStatus = body.dataset.status || 'todo';
      if (!id) return;
      var task = tasks.find(function (t) { return t.id === id; });
      if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveState();
        render();
      }
    });
  });

  /* ---- CRUD ---- */
  function addTask(title, description, priority, status) {
    var task = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'low',
      status: status || 'todo',
    };
    tasks.push(task);
    saveState();
    render();
  }

  function updateTask(id, title, description, priority) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    task.title = title.trim();
    task.description = description.trim();
    task.priority = priority || 'low';
    saveState();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveState();
    render();
  }

  /* ---- Modal ---- */
  function openCreateModal() {
    editingId = null;
    modalTitle.textContent = 'Create Task';
    taskTitle.value = '';
    taskDescription.value = '';
    document.querySelector('input[name="priority"][value="low"]').checked = true;
    modalSave.textContent = 'Create';
    modal.classList.add('active');
    setTimeout(function () { taskTitle.focus(); }, 100);
  }

  function openEditModal(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;
    editingId = id;
    modalTitle.textContent = 'Edit Task';
    taskTitle.value = task.title;
    taskDescription.value = task.description || '';
    var radio = document.querySelector('input[name="priority"][value="' + task.priority + '"]');
    if (radio) radio.checked = true;
    modalSave.textContent = 'Save';
    modal.classList.add('active');
    setTimeout(function () { taskTitle.focus(); }, 100);
  }

  function closeModal() {
    modal.classList.remove('active');
    editingId = null;
  }

  function saveFromModal() {
    var title = taskTitle.value.trim();
    var description = taskDescription.value.trim();
    if (!title) {
      taskTitle.focus();
      return;
    }
    var priority = 'low';
    priorityRadios.forEach(function (r) {
      if (r.checked) priority = r.value;
    });

    if (editingId) {
      updateTask(editingId, title, description, priority);
    } else {
      addTask(title, description, priority, 'todo');
    }
    closeModal();
  }

  /* ---- Event Binds ---- */
  createBtn.addEventListener('click', openCreateModal);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveFromModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  taskTitle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFromModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  /* ---- Boot ---- */
  loadState();
  render();
})();
