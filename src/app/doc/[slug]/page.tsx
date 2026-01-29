import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import DocsShell from "@/components/DocsShell";
import { listDocs, readDoc } from "@/lib/docs";

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = readDoc(params.slug);
  const docs = listDocs();

  if (!doc) return notFound();

  const html = sanitizeHtml(marked.parse(doc.content) as string, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt"],
      code: ["class"],
    },
  });

  return (
    <DocsShell>
      <div className="content">
        <aside className="sidebar">
          <div className="hint">Docs folder: C:\Users\jarvi\SecondBrain\docs</div>
          <div className="doc-list">
            {docs.map((d) => (
              <Link key={d.slug} href={`/doc/${d.slug}`} className="doc-item">
                <div className="doc-title">{d.title}</div>
                <div className="doc-meta">Updated {new Date(d.updatedAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </aside>
        <main className="main">
          <div className="hero">{doc.title}</div>
          <div className="subhero">Updated {new Date(doc.updatedAt).toLocaleString()}</div>
          <div className="doc-view" dangerouslySetInnerHTML={{ __html: html }} />
        </main>
      </div>
    </DocsShell>
  );
}
