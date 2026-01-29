"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TaskStatus = "recurring" | "backlog" | "in_progress" | "review";

type Task = {
  id: string;
  title: string;
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
    const title = prompt("Task title?");
    if (!title) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      status: "backlog",
      assignee: "Jarvis",
      tags: [],
      priority: "medium",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    save([task, ...store.tasks], `Created "${title}"`);
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
          <ul className="suggestions">
            <li>Review backlog and pick 1 high‑impact task</li>
            <li>Link key tasks to docs for context</li>
            <li>Mark recurring tasks you want auto‑reset</li>
          </ul>
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
