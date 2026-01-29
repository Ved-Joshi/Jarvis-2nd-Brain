import fs from "fs";
import path from "path";

const DEFAULT_DATA_DIR = "C:\\Users\\jarvi\\SecondBrain\\data";
export const DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR;
export const TASKS_PATH = path.join(DATA_DIR, "tasks.json");

export type TaskStatus = "recurring" | "backlog" | "in_progress" | "review";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: "Ved" | "Jarvis";
  tags: string[];
  priority: "low" | "medium" | "high";
  docSlug?: string;
  updatedAt: number;
  createdAt: number;
  recurring?: {
    cadence: "daily" | "weekly";
    lastReset?: string; // YYYY-MM-DD
  };
};

export type TaskStore = {
  tasks: Task[];
  activity: { id: string; text: string; ts: number }[];
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadTasks(): TaskStore {
  ensureDataDir();
  if (!fs.existsSync(TASKS_PATH)) {
    const initial: TaskStore = {
      tasks: [],
      activity: [],
    };
    fs.writeFileSync(TASKS_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(TASKS_PATH, "utf-8");
  const store = JSON.parse(raw) as TaskStore;
  return resetRecurring(store);
}

export function saveTasks(store: TaskStore) {
  ensureDataDir();
  fs.writeFileSync(TASKS_PATH, JSON.stringify(store, null, 2));
}

export function addActivity(store: TaskStore, text: string) {
  store.activity.unshift({ id: crypto.randomUUID(), text, ts: Date.now() });
  store.activity = store.activity.slice(0, 25);
}

export function resetRecurring(store: TaskStore) {
  const key = todayKey();
  let changed = false;
  for (const task of store.tasks) {
    if (!task.recurring) continue;
    if (task.recurring.lastReset !== key) {
      task.status = "recurring";
      task.recurring.lastReset = key;
      task.updatedAt = Date.now();
      changed = true;
    }
  }
  if (changed) saveTasks(store);
  return store;
}
