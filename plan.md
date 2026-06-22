# Plan: Fix Authentication and Enhance Auditor Dashboard

Fix the "invalid credentials" login issue, build an interactive auditor-centric dashboard, and implement a dark/light mode toggle.

## Scope Summary
- **Auth Fix:** Debug and resolve the "invalid credentials" error during login.
- **Dashboard Enhancement:** Redesign `src/pages/Dashboard.tsx` to reflect an auditor's workflow (active engagements, client stats, recent AI activity).
- **Theme Toggle:** Add a theme switch (light/dark) in the `Navbar` or `Sidebar`.

## Auth & RLS model
**Auth in scope:** yes
**Model:** supabase_auth
**RLS strategy:** `auditor_id = auth.uid()` for all tables.
**Frontend implication:** Ensure the login flow correctly handles `signInWithPassword` and provides feedback.

## Migration baseline
**Local migrations in project:** existing (`supabase/migrations/...`)
**User confirmed proceed on connected DB:** yes

## Affected Areas
- `src/pages/Auth.tsx`: Login logic and error handling.
- `src/pages/Dashboard.tsx`: UI overhaul for auditor flow.
- `src/components/Navbar.tsx` or `src/components/Sidebar.tsx`: Addition of theme toggle.
- `src/App.tsx`: Theme state management (if not already handled by Tailwind/CSS).

## Phases

### Phase 1: Authentication Debugging & Fix
- **Owner:** `quick_fix_engineer`
- **Task:** Investigate `src/pages/Auth.tsx`. Check if the login method matches the registration method (e.g., if confirmation was removed, ensure auto-confirm or correct sign-in params). Add logging to catch the exact error from Supabase.
- **Deliverable:** Working login flow.

### Phase 2: Theme Toggle Implementation
- **Owner:** `frontend_engineer`
- **Task:** Implement a dark/light mode toggle. 
    - Create a theme provider or use a simple `useEffect` in `App.tsx` to toggle the `.dark` class on `document.documentElement`.
    - Add a button/switch in `src/components/Sidebar.tsx` or `src/components/Navbar.tsx`.
- **Deliverable:** Global theme switching capability.

### Phase 3: Auditor Flow Dashboard
- **Owner:** `frontend_engineer`
- **Task:** Redesign `src/pages/Dashboard.tsx`.
    - Include summary cards: Total Clients, Active Engagements, Pending Findings.
    - Add a "Recent Engagements" list/table.
    - Add a "Quick Actions" section (New Client, Start Engagement, Ask AI).
    - Use the existing `src/components/ui/chart.tsx` for visual progress.
- **Deliverable:** Auditor-focused interactive dashboard.

## Execution Handoff

**Plan status:** ready

**Dispatch order:**
1. quick_fix_engineer — Fix login credentials issue first to allow testing the dashboard.
2. frontend_engineer — Implement theme toggle and auditor dashboard.

**Per-agent instructions:**

### 1. quick_fix_engineer
- **Phases:** Phase 1
- **Scope:** Debug `src/pages/Auth.tsx`. The user reports "invalid credentials" even with correct info. Check if the login logic correctly handles the removed email verification or if there's a mismatch in the `signInWithPassword` call.
- **Files:** `src/pages/Auth.tsx`
- **Depends on:** none
- **Acceptance criteria:** Successfully log in with valid credentials without getting the error.

### 2. frontend_engineer
- **Phases:** Phase 2 & 3
- **Scope:** 
    - Add a theme toggle (Sun/Moon icon) to the top of `src/components/Sidebar.tsx` or `src/components/Navbar.tsx`. 
    - Redesign `src/pages/Dashboard.tsx` to be an auditor's workspace. Use Shadcn components (Cards, Tables, Progress) to show engagement status and client metrics.
- **Files:** `src/pages/Dashboard.tsx`, `src/components/Sidebar.tsx`, `src/App.tsx` (for theme state)
- **Depends on:** Phase 1
- **Acceptance criteria:** Theme toggles correctly between light and dark. Dashboard shows audit-relevant data (mock or real) and looks professional.
