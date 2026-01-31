"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type TaskStatus = "recurring" | "backlog" | "in_progress" | "review";

type Task = {
  id: string;
  title: string;
  description?: string;
  project?: string;
  output?: string;
  status: TaskStatus;
  assignee: "Ved" | "Jarvis";
  tags: string[];
  priority: "low" | "medium" | "high";
  docSlug?: string;
  updatedAt: number;
  createdAt: number;
  recurring?: { cadence: "daily" | "weekly"; lastReset?: string };
};

type Store = { tasks: Task[]; activity: { id: string; text: string; ts: number }[] };

const columns: { key: TaskStatus; title: string }[] = [
  { key: "recurring", title: "Recurring" },
  { key: "backlog", title: "Backlog" },
  { key: "in_progress", title: "In Progress" },
  { key: "review", title: "Review" },
];

const priorityColor: Record<Task["priority"], string> = {
  low: "var(--prio-low)",
  medium: "var(--prio-med)",
  high: "var(--prio-high)",
};

export default function TasksBoard({ docs }: { docs: { slug: string; title: string }[] }) {
  const [store, setStore] = useState<Store>({ tasks: [], activity: [] });
  const [dragId, setDragId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee: "Jarvis" as Task["assignee"],
    priority: "medium" as Task["priority"],
    status: "backlog" as TaskStatus,
    project: "",
    output: "",
    docSlug: "",
  });
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then(setStore)
      .catch(() => setStore({ tasks: [], activity: [] }));
  }, []);

  useEffect(() => {
    if (showModal) {
      const id = setTimeout(() => titleRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [showModal]);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      recurring: [],
      backlog: [],
      in_progress: [],
      review: [],
    };
    for (const t of store.tasks) map[t.status].push(t);
    for (const key of Object.keys(map) as TaskStatus[]) {
      map[key].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return map;
  }, [store.tasks]);

  const docOptions = useMemo(
    () => [...docs].sort((a, b) => a.title.localeCompare(b.title)),
    [docs]
  );

  const formatUpdated = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const save = (tasks: Task[], activityText?: string) => {
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks, activityText }),
    })
      .then((r) => r.json())
      .then(setStore);
  };

  const moveTask = (taskId: string, status: TaskStatus) => {
    const next = store.tasks.map((t) =>
      t.id === taskId ? { ...t, status, updatedAt: Date.now() } : t
    );
    const moved = store.tasks.find((t) => t.id === taskId);
    save(next, moved ? `Moved "${moved.title}" → ${status.replace("_", " ")}` : undefined);
  };

  const updateTask = (taskId: string, patch: Partial<Task>) => {
    const next = store.tasks.map((t) =>
      t.id === taskId ? { ...t, ...patch, updatedAt: Date.now() } : t
    );
    save(next, `Updated "${next.find((t) => t.id === taskId)?.title}"`);
  };

  const addTask = () => {
    setForm({
      title: "",
      description: "",
      assignee: "Jarvis",
      priority: "medium",
      status: "backlog",
      project: "",
      output: "",
      docSlug: "",
    });
    setShowModal(true);
  };

  const createTask = () => {
    if (!form.title.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      project: form.project.trim() || undefined,
      output: form.output.trim() || undefined,
      docSlug: form.docSlug.trim() || undefined,
      status: form.status,
      assignee: form.assignee,
      tags: [],
      priority: form.priority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    save([task, ...store.tasks], `Created "${task.title}"`);
    setShowModal(false);
  };

  const handleModalKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setShowModal(false);
      return;
    }
    if (event.key === "Enter") {
      const target = event.target as HTMLElement;
      if (target.closest("textarea")) return;
      if (!form.title.trim()) return;
      event.preventDefault();
      createTask();
    }
  };

  return (
    <div className="tasks-layout">
      <div className="tasks-header">
        <div>
          <div className="hero">Tasks</div>
          <div className="subhero">Drag cards between columns. Link tasks to docs.</div>
        </div>
        <button className="btn" onClick={addTask}>New Task</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleModalKeyDown}>
            <div className="modal-title">New Task</div>
            <div className="modal-grid">
              <label>
                <span>Title</span>
                <input
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Task title"
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description"
                />
              </label>
              <label>
                <span>Assignee</span>
                <div className="segmented">
                  {(["Ved", "Jarvis"] as Task["assignee"][]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={`seg-btn ${form.assignee === a ? "active" : ""}`}
                      onClick={() => setForm({ ...form, assignee: a })}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                >
                  <option value="recurring">Recurring</option>
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                </select>
              </label>
              <label>
                <span>Project</span>
                <input
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project name"
                />
              </label>
              <label>
                <span>Output / Deliverable</span>
                <input
                  value={form.output}
                  onChange={(e) => setForm({ ...form, output: e.target.value })}
                  placeholder="What does done look like?"
                />
              </label>
              <label>
                <span>Linked Doc (optional)</span>
                <select
                  value={form.docSlug}
                  onChange={(e) => setForm({ ...form, docSlug: e.target.value })}
                >
                  <option value="">No doc linked</option>
                  {docOptions.map((doc) => (
                    <option key={doc.slug} value={doc.slug}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" onClick={createTask} disabled={!form.title.trim()}>
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kanban">
        {columns.map((col) => (
          <div
            key={col.key}
            className="kanban-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragId && moveTask(dragId, col.key)}
          >
            <div className="kanban-col-title">{col.title}</div>
            <div className="kanban-cards">
              {byStatus[col.key].length === 0 && (
                <div className="empty-state">No tasks yet. Drop a card here.</div>
              )}
              {byStatus[col.key].map((t) => (
                <div
                  key={t.id}
                  className="card"
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                >
                  <div className="card-title">{t.title}</div>
                  {t.description && (
                    <div className="card-desc">{t.description}</div>
                  )}
                  {(t.project || t.output) && (
                    <div className="card-mini">
                      {t.project && <span className="pill">📦 {t.project}</span>}
                      {t.output && <span className="pill">🎯 {t.output}</span>}
                    </div>
                  )}
                  <div className="card-meta">
                    <span className="avatar" data-assignee={t.assignee}>
                      {t.assignee === "Ved" ? "🧑🏽‍💻" : "🤖"}
                    </span>
                    <span className="prio-dot" style={{ background: priorityColor[t.priority] }} />
                    <span className="tag-row">
                      {t.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </span>
                  </div>
                  <div className="card-updated">Updated {formatUpdated(t.updatedAt)}</div>
                  <div className="card-actions">
                    <button className="link-btn" onClick={() => {
                      const tag = prompt("Add a tag (comma separated)?", t.tags.join(","));
                      if (tag !== null) {
                        const tags = tag.split(",").map((s) => s.trim()).filter(Boolean);
                        updateTask(t.id, { tags });
                      }
                    }}>Tags</button>
                    <button className="link-btn" onClick={() => {
                      const priority = prompt("Priority: low/medium/high", t.priority);
                      if (priority === "low" || priority === "medium" || priority === "high") {
                        updateTask(t.id, { priority });
                      }
                    }}>Priority</button>
                    <button className="link-btn" onClick={() => {
                      const assignee = prompt("Assignee: Ved or Jarvis", t.assignee);
                      if (assignee === "Ved" || assignee === "Jarvis") {
                        updateTask(t.id, { assignee });
                      }
                    }}>Assignee</button>
                    <button className="link-btn" onClick={() => {
                      const slug = prompt("Link to doc slug?", t.docSlug || "");
                      if (slug !== null) updateTask(t.id, { docSlug: slug || undefined });
                    }}>Link Doc</button>
                  </div>
                  {t.docSlug && (
                    <div className="card-link">
                      <Link href={`/doc/${t.docSlug}`}>📄 {t.docSlug}</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="task-side">
        <div className="panel">
          <div className="panel-title">Jarvis Suggestions</div>
          <div className="suggestion-cards">
            <div className="suggestion-card">Review backlog and pick 1 high‑impact task</div>
            <div className="suggestion-card">Link key tasks to docs for context</div>
            <div className="suggestion-card">Mark recurring tasks you want auto‑reset</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Activity</div>
          <div className="activity">
            {store.activity.slice(0, 10).map((a) => (
              <div key={a.id} className="activity-item">
                <div>{a.text}</div>
                <div className="activity-time">{new Date(a.ts).toLocaleString()}</div>
              </div>
            ))}
            {store.activity.length === 0 && (
              <div className="activity-empty">No activity yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
