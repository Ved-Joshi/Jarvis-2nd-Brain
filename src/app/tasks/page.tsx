import DocsShell from "@/components/DocsShell";
import TasksBoard from "@/components/TasksBoard";
import { listDocs } from "@/lib/docs";

export default function TasksPage() {
  const docs = listDocs().map((d) => ({ slug: d.slug, title: d.title }));
  return (
    <DocsShell>
      <div className="tasks-page">
        <TasksBoard docs={docs} />
      </div>
    </DocsShell>
  );
}
