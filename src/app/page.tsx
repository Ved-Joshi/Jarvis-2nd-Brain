import Link from "next/link";
import DocsShell from "@/components/DocsShell";
import { listDocs } from "@/lib/docs";

export default function Home() {
  const docs = listDocs();

  return (
    <DocsShell>
      <div className="content">
        <aside className="sidebar">
          <div className="hint">Docs folder: C:\Users\jarvi\SecondBrain\docs</div>
          <div className="doc-list">
            {docs.length === 0 && (
              <div className="empty-state">No documents yet. Drop a .md file into the docs folder.</div>
            )}
            {docs.map((doc) => (
              <Link key={doc.slug} href={`/doc/${doc.slug}`} className="doc-item">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">Updated {new Date(doc.updatedAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </aside>
        <main className="main">
          <div className="hero">Your living knowledge base</div>
          <div className="subhero">
            A clean, Obsidian‑meets‑Linear view of everything we’re building together.
          </div>
          <div className="empty-state">Pick a document on the left to view it here.</div>
        </main>
      </div>
    </DocsShell>
  );
}
