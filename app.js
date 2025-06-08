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

  // User identifier (for demo, static username)
  const currentUser = "default_user";

  let tasks = [];
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

  // Update time every minute
  updateDateTime();
  setInterval(updateDateTime, 60000);

  // Fetch tasks from backend API
  async function fetchTasks() {
    try {
      const response = await fetch(`api/tasks.php?user=${currentUser}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      console.error(error);
    }
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

    filteredTasks.forEach((task) => {
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
      checkbox.checked = task.completed == 1;
      checkbox.addEventListener("change", () =>
        toggleTaskStatus(task.id, checkbox.checked)
      );
      li.appendChild(checkbox);

      // Task text
      const taskText = document.createElement("span");
      taskText.textContent = task.text;
      taskText.className =
        task.completed == 1 ? "task-text completed" : "task-text";
      li.appendChild(taskText);

      // Due date display
      if (task.due_date) {
        const dueDateSpan = document.createElement("span");
        const options = { year: "numeric", month: "long", day: "numeric" };
        const dateObj = new Date(task.due_date + "T00:00:00");
        dueDateSpan.textContent = dateObj.toLocaleDateString("id-ID", options);
        dueDateSpan.className = "task-due-date";
        dueDateSpan.style.marginRight = "10px";
        dueDateSpan.style.fontSize = "0.8rem";
        dueDateSpan.style.color = "#666";
        li.appendChild(dueDateSpan);
      }

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
      deleteBtn.addEventListener("click", () => deleteTask(task.id));
      li.appendChild(deleteBtn);

      taskList.appendChild(li);
    });

    // Update tasks counter
    const activeTasks = tasks.filter((task) => task.completed == 0).length;
    tasksCounter.textContent = `${activeTasks} tasks tersisa`;
  }

  // Add new task
  async function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;
    const taskDateInput = document.getElementById("task-date");
    const dueDate = taskDateInput.value; // format: yyyy-mm-dd

    if (!taskText) return;

    const newTask = {
      user: currentUser,
      text: taskText,
      completed: 0,
      priority: priority,
      due_date: dueDate || null,
    };

    try {
      const response = await fetch("api/tasks.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) throw new Error("Failed to add task");
      taskInput.value = "";
      taskDateInput.value = "";
      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }

  // Toggle task status (completed/active)
  async function toggleTaskStatus(id, completed) {
    try {
      const response = await fetch("api/tasks.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: completed ? 1 : 0 }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }

  // Delete task
  async function deleteTask(id) {
    try {
      const response = await fetch("api/tasks.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${id}`,
      });
      if (!response.ok) throw new Error("Failed to delete task");
      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }

  // Clear completed tasks
  async function clearCompleted() {
    const completedTasks = tasks.filter((task) => task.completed == 1);
    for (const task of completedTasks) {
      await deleteTask(task.id);
    }
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
  fetchTasks();
});
