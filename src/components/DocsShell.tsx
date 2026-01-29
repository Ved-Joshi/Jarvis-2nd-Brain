import Navbar from "@/components/Navbar";
import CommandPalette from "@/components/CommandPalette";
import { listDocs } from "@/lib/docs";

export default function DocsShell({ children }: { children: React.ReactNode }) {
  const docs = listDocs();
  const simpleDocs = docs.map((d) => ({ slug: d.slug, title: d.title }));

  return (
    <div className="app-shell">
      <Navbar />
      <CommandPalette docs={simpleDocs} />
      {children}
    </div>
  );
}
