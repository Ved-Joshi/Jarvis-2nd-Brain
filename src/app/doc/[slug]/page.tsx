import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import { listDocs, readDoc } from "@/lib/docs";

/**
 * Render the documentation page for a given slug, showing a sidebar of all docs and the requested doc's content.
 *
 * The component converts the doc's Markdown to HTML, sanitizes it (allowing images and specific attributes), and injects it into the main view. If the document cannot be found, the route short-circuits to a 404 page.
 *
 * @param params - Route parameters
 * @param params.slug - The slug identifying which document to load
 * @returns The rendered documentation page element for the requested slug
 */
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Jarvis 2nd Brain</div>
        <div className="hint">Docs folder: C:\Users\jarvi\SecondBrain\docs</div>
        <div className="doc-list">
          {docs.map((d) => (
            <Link key={d.slug} href={`/doc/${d.slug}`} className="doc-item">
              <div className="doc-title">{d.title}</div>
              <div className="doc-meta">
                Updated {new Date(d.updatedAt).toLocaleString()}
              </div>
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
  );
}