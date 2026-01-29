# Jarvis 2nd Brain

A dark‑mode Next.js app that renders markdown documents from:

```
C:\Users\jarvi\SecondBrain\docs
```

## Getting started
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes
- Drop any `.md` file into the docs folder and it will appear in the sidebar.
- The app renders markdown safely and supports code blocks.
- Default docs path can be overridden with `DOCS_DIR` env var.
