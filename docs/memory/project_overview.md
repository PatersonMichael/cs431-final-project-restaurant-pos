---
name: Project Overview
description: Stack, directory layout, source-of-truth doc names, and current phase
type: project
---

CS431 Restaurant POS — tab-based POS with Server console, Expediter screen, and Manager console.

**Stack:** React + Vite + TypeScript + Tailwind (client/) · Node.js + Express + Prisma + TypeScript (server/) · MySQL

**Source-of-truth docs:**
- `docs/PRD_SRD.md` — spec (CLAUDE.md incorrectly references it as `docs/PRD.md`)
- `docs/STYLE_GUIDE.md` — visual contract
- `docs/data_dictionary.md` — schema field definitions
- `docs/PROGRESS.md` — phase tracker (updated each phase)
- `docs/MEMORY.md` — this index

**Current phase:** Phase 0 complete. Awaiting human checkpoint before Phase 1.

**Why:** Class deliverable (CS431). Single-store, no real auth, no real payments, polling not websockets.

**How to apply:** Read PRD_SRD.md (not PRD.md) for spec. Check PROGRESS.md for current phase before starting work.
