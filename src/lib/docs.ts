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

function ensureDocsDir() {
  try {
    if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function safeReadDir(dir: string) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [] as string[];
  }
}

export function listDocs(): DocMeta[] {
  ensureDocsDir();
  ensureDailyJournal();
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

export function readDoc(slug?: string) {
  ensureDocsDir();
  if (!slug) return null;
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

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function ensureTaskDoc({
  title,
  planContent,
  slug,
}: {
  title: string;
  planContent: string;
  slug?: string;
}) {
  ensureDocsDir();
  const safeSlug = slug || `task-${slugify(title) || "untitled"}`;
  if (safeSlug.includes('/') || safeSlug.includes('\\') || safeSlug.includes('..')) return null;
  const filename = `${safeSlug}.md`;
  const full = path.join(DOCS_DIR, filename);
  const stamped = `${planContent}\n`;
  try {
    if (!fs.existsSync(full)) {
      const content = `# Task — ${title}\n\n${stamped}`;
      fs.writeFileSync(full, content);
    } else {
      const existing = fs.readFileSync(full, "utf-8");
      const merged = `${existing.trimEnd()}\n\n---\n\n${stamped}`;
      fs.writeFileSync(full, merged);
    }
  } catch {
    return null;
  }
  return safeSlug;
}

function extractTitle(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

export function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function appendToDoc(slug: string, content: string, title?: string) {
  ensureDocsDir();
  if (!slug) return { ok: false, error: "Missing slug" } as const;
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) {
    return { ok: false, error: "Invalid slug" } as const;
  }
  const filename = `${slug}.md`;
  const full = path.join(DOCS_DIR, filename);
  if (!path.resolve(full).startsWith(path.resolve(DOCS_DIR))) {
    return { ok: false, error: "Invalid path" } as const;
  }
  if (!fs.existsSync(full)) {
    const header = `# ${title?.trim() || slugToTitle(slug)}\n\n`;
    fs.writeFileSync(full, header);
  }
  fs.appendFileSync(full, `\n${content.trim()}\n`);
  return { ok: true } as const;
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ensureDailyJournal() {
  const filename = `journal-${todayKey()}.md`;
  const full = path.join(DOCS_DIR, filename);
  if (fs.existsSync(full)) return;
  const content = `# Daily Journal — ${todayKey()}\n\n## Highlights\n- \n\n## Notes\n- \n`;
  try {
    fs.writeFileSync(full, content);
  } catch {
    // ignore
  }
}
