import { NextResponse } from "next/server";
import { addActivity, loadTasks, saveTasks, Task } from "@/lib/tasks";
import { ensureTaskDoc } from "@/lib/docs";

function buildJarvisPlan(task: Task) {
  const contextLines = [
    task.description ? `- ${task.description}` : "- Scope to be clarified",
    task.project ? `- Project: ${task.project}` : null,
  ].filter(Boolean);
  const deliverable = task.output || "TBD";
  return [
    "## Context",
    ...contextLines,
    "",
    "## Plan",
    "- Clarify scope + constraints",
    "- Draft approach and milestones",
    "- Execute and review",
    "",
    "## Updates",
    "- ",
    "",
    "## Decisions",
    "- ",
    "",
    "## Deliverables",
    `- ${deliverable}`,
    "",
    "## Next Steps",
    "- Confirm requirements",
    "- Draft first pass",
    "- Identify blockers",
  ].join("\n");
}

export async function GET() {
  const store = loadTasks();
  return NextResponse.json(store);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { tasks: Task[]; activityText?: string };
  const store = loadTasks();

  if (body.tasks) {
    const previousIds = new Set(store.tasks.map((task) => task.id));
    const nextTasks = body.tasks.map((task) => {
      if (previousIds.has(task.id)) return task;
      if (task.assignee !== "Jarvis") return task;
      const planContent = buildJarvisPlan(task);
      const docSlug = ensureTaskDoc({
        title: task.title,
        planContent,
        slug: task.docSlug,
      });
      const nextOutput = `${planContent}`;
      if (docSlug) {
        addActivity(store, `Auto-linked doc ${docSlug} for "${task.title}"`);
      }
      return {
        ...task,
        output: nextOutput,
        docSlug: docSlug || task.docSlug,
        updatedAt: Date.now(),
      };
    });
    store.tasks = nextTasks;
  }

  if (body.activityText) addActivity(store, body.activityText);
  saveTasks(store);
  return NextResponse.json(store);
}
