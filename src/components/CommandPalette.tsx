"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DocItem = { slug: string; title: string };
type TaskItem = { id: string; title: string; status: string };

export default function CommandPalette({ docs }: { docs: DocItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks || []))
      .catch(() => setTasks([]));
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const docMatches = docs.filter((d) => d.title.toLowerCase().includes(q));
    const taskMatches = tasks.filter((t) => t.title.toLowerCase().includes(q));
    return { docMatches, taskMatches };
  }, [docs, tasks, query]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={() => setOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="palette-input"
          placeholder="Search docs & tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="palette-section">
          <div className="palette-title">Docs</div>
          {results.docMatches.slice(0, 6).map((doc) => (
            <Link key={doc.slug} href={`/doc/${doc.slug}`} className="palette-item">
              📄 {doc.title}
            </Link>
          ))}
          {results.docMatches.length === 0 && (
            <div className="palette-empty">No docs found</div>
          )}
        </div>
        <div className="palette-section">
          <div className="palette-title">Tasks</div>
          {results.taskMatches.slice(0, 6).map((task) => (
            <div key={task.id} className="palette-item">
              ✅ {task.title}
              <span className="palette-meta">{task.status.replace("_", " ")}</span>
            </div>
          ))}
          {results.taskMatches.length === 0 && (
            <div className="palette-empty">No tasks found</div>
          )}
        </div>
      </div>
    </div>
  );
}
