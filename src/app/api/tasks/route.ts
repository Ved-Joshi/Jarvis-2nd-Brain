import { NextResponse } from "next/server";
import { addActivity, loadTasks, saveTasks, Task } from "@/lib/tasks";

export async function GET() {
  const store = loadTasks();
  return NextResponse.json(store);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { tasks: Task[]; activityText?: string };
  const store = loadTasks();
  store.tasks = body.tasks || [];
  if (body.activityText) addActivity(store, body.activityText);
  saveTasks(store);
  return NextResponse.json(store);
}
