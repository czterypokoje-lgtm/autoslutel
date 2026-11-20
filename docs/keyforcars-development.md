# KeyForCars CRM development

This snapshot contains the workshop calendar, CRM reports and the staff assistant.

## Local setup

1. Use Node.js 24 and run `npm ci`.
2. Create `.env.local` with `CRM_INSTALL=keyforcars`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` for a development Supabase project. Keep the service-role key server-side.
3. Apply the repository migrations to that development project, including `0104_kfc_workshop_calendar.sql`. Check the target before running migrations. The optional synthetic workshop seed is in `deploy/keyforcars-demo/workshop-demo-seed.sql`.
4. Run `npm run catalog`, then `npx next dev --webpack --hostname 127.0.0.1 --port 3017`. Open `/admin/login` and sign in with an authorized development account.
5. Check types with `npx tsc --noEmit` and calendar time handling with `node --experimental-strip-types scripts/check-workshop-time.mts`.

## Feature entry points

- Workshop calendar: `/admin/agenda`, implemented under `src/app/admin/agenda`. The panel and agent endpoints share `src/lib/workshopAgenda.ts`.
- Workshop Agent: `/api/agent/workshop/availability` and `/api/agent/workshop/appointments`. Configure the server-only `KFC_WORKSHOP_AGENT_TOKEN` before wiring the ElevenLabs tools. Verify provider configuration separately from this repository.
- Staff Assistant: `src/app/admin/StaffChat.tsx`, `src/app/api/admin/kfc-staff-chat/route.ts` and `src/lib/kfcStaffReports.ts`. It reads and reports CRM data. For natural-language chat, see `deploy/keyforcars-ollama/README.md`.
- Isolated demo deployment: `deploy/keyforcars-demo/README.md`.