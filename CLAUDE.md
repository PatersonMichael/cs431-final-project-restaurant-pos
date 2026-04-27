# CLAUDE.md

This file is auto-loaded by Claude Code on every session. It establishes the project conventions, the source-of-truth documents, and the rules of engagement for this codebase.

---

## Project

CS431 Restaurant POS — a tab-based point-of-sale web application with three role surfaces (server console, kitchen expediter, manager console). This is a class deliverable, not a production system, but it should feel like a real POS.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + Prisma + TypeScript
- **Database:** MySQL (local)
- **Theme:** Dark only

## Source-of-Truth Documents

Read these before doing anything else. They are authoritative — when in doubt, defer to them.

1. **`docs/PRD.md`** — Product & Software Requirements. Defines features (FR-IDs), API contracts, schema additions, work plan phases, and acceptance criteria. **This is the spec.**
2. **`docs/STYLE_GUIDE.md`** — Frontend style guide. Design tokens, component patterns, density rules. **This is the visual contract.**
3. **`docs/data_dictionary.md`** — The database schema. Field names, types, nullability, FK directions.
4. **`docs/Restaurant_POS_ERD.png`** — ER diagram. Visual reference for the schema.

If any of these conflict with each other, raise it as an open question — do not silently pick one.

## Rules of Engagement

These are non-negotiable.

### What you do not change without asking

- The database schema, beyond the two additive columns specified in PRD §6 (`ORDER_ITEM.fired_at` and `ORDER_ITEM.kitchen_status`).
- The API contracts in PRD §9. If a contract feels wrong, raise it as an open question — do not silently change shapes.
- The list of "out of scope" items in PRD §14. Don't build things that are explicitly deferred.
- The dependency list. No new UI libraries, state libraries, or frameworks beyond what's already approved (lucide-react, @tailwindcss/forms, tailwind-merge, zod). If you think you need one, ask first.

### What you do every time

- Cite FR-IDs (e.g. `FR-TAB-10`) in commit messages and PR descriptions when implementing requirements.
- Cite style guide sections (e.g. `STYLE §5.1`) when making visual choices.
- Run `tsc --noEmit` on both packages before declaring work done. NFR-9 requires `strict: true` to compile clean.
- Update both `frontend/src/types/api.ts` and `backend/src/types/api.ts` in the same change when API contracts shift (NFR-10). Backend is the source of truth.
- Wrap multi-step writes in `prisma.$transaction`. Especially: fire, close-out, electronic payment.
- Recompute totals server-side after any mutation that affects them. Never trust client-supplied totals.

### What you do not do, ever

- Use `any`. Use `unknown` at API boundaries and narrow.
- Compute money math with JS floats. Use Prisma `Decimal` server-side; format strings client-side.
- Pull entire tables to compute aggregates in JS. Use SQL `SUM` / `GROUP BY`. (This is also an explicit assignment requirement.)
- Use raw hex colors or one-off pixel values in components. Tokens only, per STYLE §2 and §4.
- Show stack traces or raw API errors to users. Per NFR-7.
- Add hover-only affordances to anything that needs to work on mobile.
- Run `prisma migrate reset` or any destructive DB command without explicit permission in this session.

## Workflow

The PRD §16 work plan is phased intentionally. Each phase ends with a checkpoint where the human verifies before the next phase starts.

**The current phase is tracked at the top of the most recent commit message** and in `docs/PROGRESS.md` (create this file in Phase 0 if it doesn't exist). Update it as phases complete.

When starting a new phase:
1. Re-read the relevant PRD section.
2. List what you're about to do, by FR-ID.
3. Wait for human acknowledgment before writing code.

When finishing a phase:
1. Run typecheck on both packages.
2. Run the dev servers and smoke-test the new work yourself.
3. Update `docs/PROGRESS.md` with a short summary of what shipped, citing FR-IDs.
4. Hand off to the human for the checkpoint. Do not start the next phase unprompted.

## Code Style

- Function components only. No class components.
- Hooks named `use*`. Custom hooks live in `src/hooks/`.
- Service-layer functions on the backend live in `src/services/` and never touch `req` / `res` directly. Routes are thin.
- Validation lives in `src/schemas/` (zod). Routes call `Schema.parse(req.body)` before invoking services.
- Prisma queries use generated types. `Prisma.OrderGetPayload<{ include: ... }>` for joined shapes — don't hand-roll.
- File names: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- Imports: external → internal absolute → relative, separated by blank lines.
- No barrel exports (`index.ts` re-exporting everything). They break tree-shaking and obscure dependencies.

## Communication

- When you hit ambiguity, stop and ask. Do not guess.
- When you find a bug in existing code, surface it before fixing it. The fix may be out of scope for the current phase.
- When the spec is wrong (it happens), call it out and propose a change to the PRD. Don't work around it silently.
- Brief is better than verbose. The human does not need a recap of what you just did — `git diff` shows that. They need to know what you decided and what you're about to do next.

## Local Setup

Document the actual setup steps in the repo's top-level `README.md`. This file (`CLAUDE.md`) is for conventions; `README.md` is for "how to run it."

If `README.md` is missing or stale when you start, regenerating it accurately is part of Phase 0.
