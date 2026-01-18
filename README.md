# MoLOS-AI-Knowledge Boilerplate

Minimal external module with a single Tasks CRUD flow. This is the reference template for new modules.

## Quickstart

```bash
# 1) Copy into the core app
cp -r MoLOS-AI-Knowledge ../MoLOS/external_modules/

# 2) Sync modules (creates symlinks and runs migrations)
cd ../MoLOS
npm run modules:sync
```

## What this template includes

- One database table: `MoLOS-AI-Knowledge_tasks`
- One API route: `routes/api/+server.ts` -> `/api/MoLOS-AI-Knowledge`
- One UI route: `routes/ui/+page.svelte` -> `/ui/MoLOS-AI-Knowledge`
- Simple store and repository layer

## Docs Index

Start here (short and precise):
- `docs/OVERVIEW.md`
- `docs/FILES.md`
- `docs/DB.md`
- `docs/API.md`
- `docs/UI.md`
- `docs/DEV.md`
- `docs/CHECKLIST.md`
- `docs/AGENT_GUIDE.md`

## If you rename this module

1. Update `manifest.yaml` and `config.ts`
2. Update table prefix in:
   - `lib/server/db/schema/tables.ts`
   - `drizzle/*.sql`
   - `drizzle/meta/*`
3. Update any `fetch("/api/...")` and `href` strings

Keep the module ID stable once deployed to avoid DB migration conflicts.
