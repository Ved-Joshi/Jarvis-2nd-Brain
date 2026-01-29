import fs from "fs";
import path from "path";

const DEFAULT_DOCS_DIR = "C:\\Users\\jarvi\\SecondBrain\\docs";
export const DOCS_DIR = process.env.DOCS_DIR || DEFAULT_DOCS_DIR;

export type DocMeta = {
  slug: string;
  title: string;
  updatedAt: number;
  filename: string;
};

function safeReadDir(dir: string) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [] as string[];
  }
}

export function listDocs(): DocMeta[] {
  const files = safeReadDir(DOCS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .map((filename) => {
      const full = path.join(DOCS_DIR, filename);
      const stat = fs.statSync(full);
      const slug = filename.replace(/\.md$/i, "");
      const raw = fs.readFileSync(full, "utf-8");
      const title = extractTitle(raw) || slugToTitle(slug);
      return { slug, title, updatedAt: stat.mtimeMs, filename };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return files;
}

export function readDoc(slug: string) {
  // Prevent path traversal by rejecting slugs with path separators
  if (slug.includes('/') || slug.includes('\\') || slug.includes('..')) {
    return null;
  }
  const filename = `${slug}.md`;
  const full = path.join(DOCS_DIR, filename);
  // Additional check: ensure resolved path is within DOCS_DIR
  if (!path.resolve(full).startsWith(path.resolve(DOCS_DIR))) {
    return null;
  }
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf-8");
  return {
    slug,
    filename,
    title: extractTitle(raw) || slugToTitle(slug),
    updatedAt: fs.statSync(full).mtimeMs,
    content: raw,
  };
}

function extractTitle(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
