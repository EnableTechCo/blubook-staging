# Database migrations

This folder is empty until database work is approved. Each approved database change will receive its own dated SQL file here.

Do not add database changes directly in the Supabase dashboard. Create a migration with:

```powershell
pnpm supabase migration new short_change_name
```

Then follow the [Database guide](../../docs/DATABASE_WORKFLOW.md).
