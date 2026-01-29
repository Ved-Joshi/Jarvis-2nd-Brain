"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type DocItem = { slug: string; title: string; updatedAt: number };

export default function DocsList({
  docs,
  activeSlug,
}: {
  docs: DocItem[];
  activeSlug?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) =>
      `${doc.title} ${doc.slug}`.toLowerCase().includes(q)
    );
  }, [docs, query]);

  return (
    <div className="doc-list-wrap">
      <input
        className="doc-search"
        placeholder="Search docs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="doc-count">
        Showing {filtered.length} of {docs.length}
      </div>
      <div className="doc-list">
        {filtered.length === 0 && (
          <div className="empty-state">No matches. Try a different search.</div>
        )}
        {filtered.map((doc) => (
          <Link
            key={doc.slug}
            href={`/doc/${doc.slug}`}
            className={`doc-item ${activeSlug === doc.slug ? "active" : ""}`}
          >
            <div className="doc-title">{doc.title}</div>
            <div className="doc-meta">Updated {new Date(doc.updatedAt).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
