"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "todo-app.tasks";
const DELETE_ANIMATION_MS = 220;
const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const FILTERS = [
  { id: "all", label: "All tasks" },
  { id: "active", label: "Active" },
  { id: "done", label: "Completed" },
];

const EMPTY_MESSAGES = {
  all: "Nothing on your list yet. Add your first task above.",
  active: "Nothing left to do. Well done.",
  done: "Completed tasks will show up here.",
};

function formatToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [leavingIds, setLeavingIds] = useState([]);
  const [today, setToday] = useState("");

  // Load saved tasks and today's date once the page is in the browser.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTasks(parsed);
      }
    } catch {
      // Corrupted data: start with an empty list.
    }
    setToday(formatToday());
    setLoaded(true);
  }, []);

  // Keep the date correct after midnight, even if the page stays open.
  useEffect(() => {
    const refreshDate = () => setToday(formatToday());
    const timer = setInterval(refreshDate, 60 * 1000);
    document.addEventListener("visibilitychange", refreshDate);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshDate);
    };
  }, []);

  // Save every change so tasks survive a page refresh.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      setError("Couldn't save your tasks. Check that browser storage is enabled.");
    }
  }, [tasks, loaded]);

  function addTask(event) {
    event.preventDefault();
    const title = text.trim();
    if (!title) {
      setError("Type a task before adding it.");
      return;
    }
    setTasks((prev) => [{ id: makeId(), title, done: false }, ...prev]);
    setText("");
    setError("");
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  }

  // Fade the row out first, then remove it from the list.
  function deleteTask(id) {
    setLeavingIds((prev) => [...prev, id]);
    setTimeout(() => {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setLeavingIds((prev) => prev.filter((x) => x !== id));
    }, DELETE_ANIMATION_MS);
  }

  function clearCompleted() {
    setTasks((prev) => prev.filter((task) => !task.done));
  }

  const total = tasks.length;
  const remaining = tasks.filter((task) => !task.done).length;
  const completedCount = total - remaining;
  const percent = total ? Math.round((completedCount / total) * 100) : 0;
  const ringDash = (RING_CIRCUMFERENCE * percent) / 100;

  const counts = { all: total, active: remaining, done: completedCount };

  const visible = tasks.filter((task) => {
    if (filter === "active") return !task.done;
    if (filter === "done") return task.done;
    return true;
  });

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="date">{today}</p>
          <h1 className="title">Tasks</h1>
        </div>

        <div className="summary">
          <div className="ring" role="img" aria-label={`${percent}% complete`}>
            <svg viewBox="0 0 96 96" aria-hidden="true">
              <circle
                className="ring-track"
                cx="48"
                cy="48"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="6"
              />
              <circle
                className="ring-fill"
                cx="48"
                cy="48"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${ringDash} ${RING_CIRCUMFERENCE}`}
              />
            </svg>
            <span className="ring-value">{percent}%</span>
          </div>
          <p className="summary-text" aria-live="polite">
            {remaining} {remaining === 1 ? "task" : "tasks"} left
          </p>
        </div>

        <nav className="nav" aria-label="Filter tasks">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="nav-item"
              aria-current={filter === f.id ? "true" : undefined}
              onClick={() => setFilter(f.id)}
            >
              <span>{f.label}</span>
              <span className="nav-count">{counts[f.id]}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <form className="add-form" onSubmit={addTask} noValidate>
          <label htmlFor="new-task" className="sr-only">
            New task
          </label>
          <input
            id="new-task"
            className="input"
            type="text"
            placeholder="Add a task and press Enter"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "task-error" : undefined}
            autoComplete="off"
            maxLength={200}
          />
          <button type="submit" className="button">
            Add task
          </button>
        </form>
        {error && (
          <p id="task-error" className="error" role="alert">
            {error}
          </p>
        )}

        {visible.length === 0 ? (
          <div className="empty">
            <svg className="empty-art" viewBox="0 0 48 48" aria-hidden="true">
              <rect x="10" y="8" width="28" height="34" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M17 22l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 34h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>{EMPTY_MESSAGES[filter]}</p>
          </div>
        ) : (
          <ul className="list">
            {visible.map((task) => {
              const leaving = leavingIds.includes(task.id);
              return (
                <li
                  key={task.id}
                  className={`item${task.done ? " done" : ""}${leaving ? " leaving" : ""}`}
                >
                  <input
                    id={`task-${task.id}`}
                    type="checkbox"
                    className="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  <label htmlFor={`task-${task.id}`} className="item-label">
                    {task.title}
                  </label>
                  <button
                    type="button"
                    className="delete"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete "${task.title}"`}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="footer">
          <span>
            {total} total · {completedCount} completed
          </span>
          <button
            type="button"
            className="link-button"
            onClick={clearCompleted}
            disabled={completedCount === 0}
          >
            Clear completed
          </button>
        </footer>
      </main>
    </div>
  );
}