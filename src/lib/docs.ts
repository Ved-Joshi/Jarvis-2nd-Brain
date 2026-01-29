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

/**
 * Read the entries of a directory, returning an empty array if the directory cannot be read.
 *
 * @param dir - Filesystem path of the directory to read
 * @returns An array of entry names contained in the directory; `[]` if reading fails
 */
function safeReadDir(dir: string) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [] as string[];
  }
}

/**
 * Collects metadata for Markdown documents in the configured docs directory.
 *
 * @returns An array of `DocMeta` objects — one per `.md` file found in `DOCS_DIR` — sorted by modification time with the newest first.
 */
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

/**
 * Retrieve a markdown document by slug from the configured docs directory.
 *
 * @param slug - Document identifier without the `.md` extension
 * @returns The document object containing `slug`, `filename` (e.g. `"slug.md"`), `title`, `updatedAt` (modification time in milliseconds), and `content`; or `null` if the file does not exist.
 */
export function readDoc(slug: string) {
  const filename = `${slug}.md`;
  const full = path.join(DOCS_DIR, filename);
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

/**
 * Extracts the first-level heading from Markdown as the document title.
 *
 * @param markdown - Raw Markdown content to search
 * @returns The trimmed text of the first `#` heading if present, `undefined` otherwise
 */
function extractTitle(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

/**
 * Convert a slug into a human-readable title.
 *
 * @param slug - A string of words separated by hyphens or underscores (e.g., "my-doc_title")
 * @returns A string with separators replaced by spaces and each word capitalized (e.g., "My Doc Title")
 */
function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}