# AGENTS.md

Project rules live in `CLAUDE.md` — read that first. This file exists for one
reason: the block below is a generated index of the Next.js documentation that
ships with the installed version, so an agent looks up how _this_ Next works
instead of recalling an older major.

Regenerate it after a Next upgrade with:

```
npx @next/codemod agents-md --output AGENTS.md
```

Everything between the NEXT-AGENTS-MD markers is generated. Do not hand-edit it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
