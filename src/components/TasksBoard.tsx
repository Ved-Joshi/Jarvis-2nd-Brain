"use client";

import { useEffect, useMemo, useState } from "react";
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
  });
  const [workModeTask, setWorkModeTask] = useState<Task | null>(null);
  const [workModeForm, setWorkModeForm] = useState({
    docSlug: "",
    plan: "",
    nextSteps: "",
  });
  const [workModeSaving, setWorkModeSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then(setStore)
      .catch(() => setStore({ tasks: [], activity: [] }));
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      recurring: [],
      backlog: [],
      in_progress: [],
      review: [],
    };
    for (const t of store.tasks) map[t.status].push(t);
    return map;
  }, [store.tasks]);

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

  const normalizeLines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const toBullets = (text: string) => {
    const lines = normalizeLines(text);
    return lines.length ? lines.map((line) => `- ${line}`).join("\n") : "-";
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const ensureUniqueSlug = (base: string) => {
    const existing = new Set(docs.map((d) => d.slug));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base}-${i}`)) i += 1;
    return `${base}-${i}`;
  };

  const openWorkMode = (task: Task) => {
    setWorkModeTask(task);
    setWorkModeForm({
      docSlug: task.docSlug || "",
      plan: "",
      nextSteps: "",
    });
  };

  const saveWorkMode = async () => {
    if (!workModeTask) return;
    const plan = workModeForm.plan.trim();
    const nextSteps = workModeForm.nextSteps.trim();
    if (!plan && !nextSteps) return;

    let docSlug = workModeForm.docSlug.trim();
    if (!docSlug) {
      const base = slugify(workModeTask.title) || "work-mode";
      docSlug = ensureUniqueSlug(base);
    }

    const planBlock = toBullets(plan);
    const nextBlock = toBullets(nextSteps);
    const workModeOutput = `Work Mode Plan:\n${planBlock}\n\nNext Steps:\n${nextBlock}`;
    const mergedOutput = workModeTask.output
      ? `${workModeTask.output}\n\n---\n\n${workModeOutput}`
      : workModeOutput;

    const timestamp = new Date().toLocaleString();
    const docContent = `## 🧠 Work Mode — ${workModeTask.title}\n_${timestamp}_\n\n**Plan**\n${planBlock}\n\n**Next steps**\n${nextBlock}`;

    setWorkModeSaving(true);
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: docSlug,
          content: docContent,
          title: workModeTask.title,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to update linked doc.");
        return;
      }
      const next = store.tasks.map((t) =>
        t.id === workModeTask.id
          ? {
              ...t,
              output: mergedOutput,
              docSlug,
              status: "in_progress",
              updatedAt: Date.now(),
            }
          : t
      );
      save(next, `Started "${workModeTask.title}" work mode`);
      setWorkModeTask(null);
      setWorkModeForm({ docSlug: "", plan: "", nextSteps: "" });
    } finally {
      setWorkModeSaving(false);
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">New Task</div>
            <div className="modal-grid">
              <label>
                <span>Title</span>
                <input
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

      {workModeTask && (
        <div className="modal-overlay" onClick={() => setWorkModeTask(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Work Mode — {workModeTask.title}</div>
            <div className="modal-grid single">
              <label>
                <span>Linked Doc Slug (optional)</span>
                <input
                  list="doc-slugs"
                  value={workModeForm.docSlug}
                  onChange={(e) => setWorkModeForm({ ...workModeForm, docSlug: e.target.value })}
                  placeholder="Leave blank to auto-create"
                />
                <datalist id="doc-slugs">
                  {docs.map((doc) => (
                    <option key={doc.slug} value={doc.slug} />
                  ))}
                </datalist>
              </label>
              <label>
                <span>Plan</span>
                <textarea
                  rows={4}
                  value={workModeForm.plan}
                  onChange={(e) => setWorkModeForm({ ...workModeForm, plan: e.target.value })}
                  placeholder="Outline the plan (one item per line)"
                />
              </label>
              <label>
                <span>Next Steps</span>
                <textarea
                  rows={4}
                  value={workModeForm.nextSteps}
                  onChange={(e) => setWorkModeForm({ ...workModeForm, nextSteps: e.target.value })}
                  placeholder="What should happen next? (one item per line)"
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setWorkModeTask(null)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={saveWorkMode}
                disabled={workModeSaving}
              >
                {workModeSaving ? "Saving..." : "Start"}
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
                      {t.output && (
                        <span className="pill pill-output">
                          🎯 {t.output.split("\n").find((line) => line.trim()) || t.output}
                        </span>
                      )}
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
                    <button className="link-btn" onClick={() => openWorkMode(t)}>Start</button>
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
