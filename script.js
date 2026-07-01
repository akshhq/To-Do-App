/* =========================================================
   MINI TO-DO APP
   Data is stored in localStorage as a CSV string, so it
   survives page refresh without any backend.
   CSV columns: id,text,deadline,completed,createdAt
   ========================================================= */

const STORAGE_KEY = "todos_csv";

// ---------- Element references ----------
const taskListEl   = document.getElementById("taskList");
const emptyStateEl = document.getElementById("emptyState");
const taskCountEl  = document.getElementById("taskCount");
const pageTitleEl  = document.getElementById("pageTitle");

const historyBtn   = document.getElementById("historyBtn");
const historyLabel = document.getElementById("historyLabel");
const addBtn       = document.getElementById("addBtn");

const overlay        = document.getElementById("overlay");
const sheet           = document.getElementById("sheet");
const taskInput       = document.getElementById("taskInput");
const deadlineInput   = document.getElementById("deadlineInput");
const cancelBtn        = document.getElementById("cancelBtn");
const saveBtn          = document.getElementById("saveBtn");

// ---------- App state ----------
let tasks = [];                 // array of task objects, held in memory
let viewMode = "active";        // "active" or "history"

// =========================================================
// CSV HELPERS
// A field is wrapped in quotes only if it needs it (contains
// a comma, quote, or newline). This keeps simple text plain.
// =========================================================

function csvEscapeField(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function tasksToCSV(taskArray) {
  const header = "id,text,deadline,completed,createdAt";
  const rows = taskArray.map(t =>
    [t.id, t.text, t.deadline, t.completed, t.createdAt]
      .map(csvEscapeField)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

// Parses one CSV line into an array of fields, respecting quotes.
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip the escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

function csvToTasks(csvString) {
  const lines = csvString.split("\n").filter(line => line.trim() !== "");
  if (lines.length <= 1) return []; // only header, or empty

  const dataLines = lines.slice(1); // skip header row
  return dataLines.map(line => {
    const [id, text, deadline, completed, createdAt] = parseCSVLine(line);
    return {
      id,
      text,
      deadline,
      completed: completed === "true",
      createdAt
    };
  });
}

// =========================================================
// STORAGE
// =========================================================

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, tasksToCSV(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  tasks = raw ? csvToTasks(raw) : [];
}

// =========================================================
// RENDERING
// =========================================================

function formatDeadlineBadge(task) {
  if (!task.deadline) return { text: "", cls: "none" };
  if (task.completed) return { text: "Done", cls: "" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.deadline + "T00:00:00");

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  const formatted = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (diffDays < 0) return { text: "Overdue · " + formatted, cls: "overdue" };
  if (diffDays === 0) return { text: "Today", cls: "today" };
  return { text: formatted, cls: "" };
}

function render() {
  // Filter tasks for the current view
  const visibleTasks = tasks.filter(t =>
    viewMode === "active" ? !t.completed : t.completed
  );

  // Sort: soonest deadline first (tasks with no deadline go last)
  visibleTasks.sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  taskListEl.innerHTML = "";

  if (visibleTasks.length === 0) {
    emptyStateEl.style.display = "block";
    emptyStateEl.textContent = viewMode === "active"
      ? "Nothing here yet. Tap + to add a task."
      : "No completed tasks yet.";
  } else {
    emptyStateEl.style.display = "none";
  }

  visibleTasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card" + (task.completed ? " completed" : "");

    // Checkbox
    const checkbox = document.createElement("div");
    checkbox.className = "checkbox" + (task.completed ? " checked" : "");
    checkbox.addEventListener("click", () => toggleComplete(task.id));

    // Text + deadline badge
    const body = document.createElement("div");
    body.className = "task-body";

    const textEl = document.createElement("div");
    textEl.className = "task-text";
    textEl.textContent = task.text;
    body.appendChild(textEl);

    const badgeInfo = formatDeadlineBadge(task);
    if (badgeInfo.text) {
      const badge = document.createElement("span");
      badge.className = "badge " + badgeInfo.cls;
      badge.textContent = badgeInfo.text;
      body.appendChild(badge);
    }

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&#10005;"; // × symbol
    deleteBtn.title = "Delete task";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    card.appendChild(checkbox);
    card.appendChild(body);
    card.appendChild(deleteBtn);
    taskListEl.appendChild(card);
  });

  // Header + counters
  const activeCount = tasks.filter(t => !t.completed).length;
  pageTitleEl.textContent = viewMode === "active" ? "To-Do" : "Completed";
  taskCountEl.textContent = viewMode === "active"
    ? activeCount + (activeCount === 1 ? " task" : " tasks")
    : tasks.filter(t => t.completed).length + " completed";

  historyBtn.classList.toggle("active", viewMode === "history");
  historyLabel.textContent = viewMode === "active" ? "Completed" : "Back to list";
}

// =========================================================
// ACTIONS
// =========================================================

function addTask(text, deadline) {
  const newTask = {
    id: Date.now().toString(),
    text: text.trim(),
    deadline: deadline || "",
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  saveTasks();
  render();
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

// =========================================================
// BOTTOM SHEET (add task form)
// =========================================================

function openSheet() {
  taskInput.value = "";
  deadlineInput.value = "";
  overlay.classList.add("show");
  sheet.classList.add("show");
  setTimeout(() => taskInput.focus(), 200);
}

function closeSheet() {
  overlay.classList.remove("show");
  sheet.classList.remove("show");
}

addBtn.addEventListener("click", openSheet);
cancelBtn.addEventListener("click", closeSheet);
overlay.addEventListener("click", closeSheet);

saveBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }
  addTask(text, deadlineInput.value);
  closeSheet();
  viewMode = "active"; // jump back to the active list to see the new task
  render();
});

// Pressing Enter in the text field also saves
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

// =========================================================
// BOTTOM-LEFT TOGGLE (active <-> completed/history view)
// =========================================================

historyBtn.addEventListener("click", () => {
  viewMode = viewMode === "active" ? "history" : "active";
  render();
});

// =========================================================
// INIT
// =========================================================

loadTasks();
render();
