import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import DocsShell from "@/components/DocsShell";
import DocsList from "@/components/DocsList";
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
          <DocsList docs={docs} activeSlug={doc.slug} />
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
