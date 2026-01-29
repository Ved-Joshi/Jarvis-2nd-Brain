import Link from "next/link";
import { listDocs } from "@/lib/docs";

/**
 * Render the application's main page with a two-pane layout: a sidebar listing documents and a main content area.
 *
 * The sidebar displays the app brand, a hint for the docs folder, and a list of documents returned by `listDocs()`
 * (or an empty-state prompt when no documents exist). The main area shows the hero, a descriptive subhero, and a
 * placeholder prompting the user to pick a document.
 *
 * @returns The React element for the page containing the sidebar and main content layout
 */
export default function Home() {
  const docs = listDocs();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Jarvis 2nd Brain</div>
        <div className="hint">Docs folder: C:\Users\jarvi\SecondBrain\docs</div>
        <div className="doc-list">
          {docs.length === 0 && (
            <div className="empty-state">No documents yet. Drop a .md file into the docs folder.</div>
          )}
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/doc/${doc.slug}`} className="doc-item">
              <div className="doc-title">{doc.title}</div>
              <div className="doc-meta">
                Updated {new Date(doc.updatedAt).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </aside>
      <main className="main">
        <div className="hero">Your living knowledge base</div>
        <div className="subhero">
          A clean, Obsidian-meets-Linear view of everything we’re building together.
        </div>
        <div className="empty-state">
          Pick a document on the left to view it here.
        </div>
      </main>
    </div>
  );
}