<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# What this project is

**Kael Neurology** is the single-page website of Dr. Sofia Kael, a *fictional* general clinical neurologist in Boston. It's built to read as a credible real practice while being a portfolio-grade showcase. Its centerpiece is the **Brain Explorer**: a dedicated section with an interactive 3D human brain the Visitor can rotate, Split, X-ray, Isolate and Slice. Selecting a Structure explains what it does and which Conditions Dr. Kael treats there.

- `CONTEXT.md`: the domain glossary. Use its terms (Visitor, Structure, Condition, Slice…) in code and copy.
- `DESIGN.md`: the complete style guide. Follow it for any UI work.
- `docs/adr/`: recorded decisions (e.g. the brain model and its license).

The site is fictional. Never remove the footer disclaimer or the model attribution.

# Runtime

Use Bun

# Language

English.

# Conventions

Prefer the @ alias for imports (configured in tsconfig.json).
