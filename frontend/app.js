const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const addButton = document.querySelector("#add-button");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const message = document.querySelector("#message");
const taskCount = document.querySelector("#task-count");
const connectionStatus = document.querySelector("#connection-status");

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.error) errorMessage = body.error;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.status === 204 ? null : response.json();
}

function showMessage(text = "") {
  message.textContent = text;
}

function renderTasks(tasks) {
  taskList.replaceChildren();
  emptyState.hidden = tasks.length !== 0;
  taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

  for (const task of tasks) {
    const item = document.createElement("li");
    item.className = `task${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} as completed`);
    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      try {
        await api(`https://render-practice-app.onrender.com/api/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: checkbox.checked })
        });
        await loadTasks();
      } catch (error) {
        showMessage(error.message);
        checkbox.disabled = false;
        checkbox.checked = task.completed;
      }
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;
      try {
        await api(`https://render-practice-app.onrender.com/api/tasks/${task.id}`, { method: "DELETE" });
        showMessage("");
        await loadTasks();
      } catch (error) {
        showMessage(error.message);
        deleteButton.disabled = false;
      }
    });

    item.append(checkbox, title, deleteButton);
    taskList.append(item);
  }
}

async function loadTasks() {
  const tasks = await api("https://render-practice-app.onrender.com/api/tasks");
  renderTasks(tasks);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  addButton.disabled = true;
  showMessage("");
  try {
    await api("https://render-practice-app.onrender.com/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title })
    });
    titleInput.value = "";
    await loadTasks();
    titleInput.focus();
  } catch (error) {
    showMessage(error.message);
  } finally {
    addButton.disabled = false;
  }
});

async function startApp() {
  try {
    await api("https://render-practice-app.onrender.com/api/health");
    connectionStatus.textContent = "Server + database connected";
    await loadTasks();
  } catch (error) {
    connectionStatus.textContent = "Connection problem";
    connectionStatus.classList.add("error");
    showMessage(`${error.message} Check the server and DATABASE_URL.`);
  }
}

startApp();
