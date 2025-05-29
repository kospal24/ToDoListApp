document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const taskInput = document.getElementById("task-input");
  const addTaskBtn = document.getElementById("add-task");
  const taskList = document.getElementById("task-list");
  const tasksCounter = document.getElementById("tasks-counter");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const prioritySelect = document.getElementById("priority-select");
  const currentDateEl = document.getElementById("current-date");
  const currentTimeEl = document.getElementById("current-time");
  const userName = document.getElementById("user-name");
  const userPosition = document.getElementById("user-position");

  // Tasks array
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";

  // Update date and time
  function updateDateTime() {
    const now = new Date();

    // Format date: Hari, Tanggal Bulan Tahun
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    currentDateEl.textContent = now.toLocaleDateString("id-ID", options);

    // Format time: HH:MM
    currentTimeEl.textContent = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Update time every second
  updateDateTime();
  setInterval(updateDateTime, 60000); // Update every minute

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Render tasks based on current filter
  function renderTasks() {
    let filteredTasks;

    if (currentFilter === "active") {
      filteredTasks = tasks.filter((task) => !task.completed);
    } else if (currentFilter === "completed") {
      filteredTasks = tasks.filter((task) => task.completed);
    } else {
      filteredTasks = [...tasks];
    }

    taskList.innerHTML = "";

    filteredTasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = "task-item";

      // Priority indicator
      const priorityIndicator = document.createElement("span");
      priorityIndicator.className = `priority-indicator priority-${task.priority}`;
      li.appendChild(priorityIndicator);

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => toggleTaskStatus(index));
      li.appendChild(checkbox);

      // Task text
      const taskText = document.createElement("span");
      taskText.textContent = task.text;
      taskText.className = task.completed ? "task-text completed" : "task-text";
      li.appendChild(taskText);

      // Priority badge
      const priorityBadge = document.createElement("span");
      priorityBadge.className = `priority-badge ${task.priority}`;
      priorityBadge.textContent =
        task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      li.appendChild(priorityBadge);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Hapus";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", () => deleteTask(index));
      li.appendChild(deleteBtn);

      taskList.appendChild(li);
    });

    // Update tasks counter
    const activeTasks = tasks.filter((task) => !task.completed).length;
    tasksCounter.textContent = `${activeTasks} tasks tersisa`;
  }
  // Add new task
  function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (taskText) {
      tasks.push({
        text: taskText,
        completed: false,

        priority: priority,
        createdAt: new Date().toISOString(),
      });

      taskInput.value = "";
      saveTasks();
      renderTasks();
    }
  }

  // Toggle task status (completed/active)
  function toggleTaskStatus(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
  }

  // Delete task
  function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }

  // Clear completed tasks
  function clearCompleted() {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
  }

  // Event Listeners
  addTaskBtn.addEventListener("click", addTask);

  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  // Filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      btn.classList.add("active");

      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Initialize
  renderTasks();
});
