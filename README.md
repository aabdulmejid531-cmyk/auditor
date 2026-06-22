# AuditFlow Ethiopia

AuditFlow Ethiopia is a production-ready, AI-powered web application for auditors in Ethiopia that simplifies their daily tasks. The platform automates and streamlines audit workflows, risk assessment, evidence collection, and report generation, all tailored to Ethiopian accounting standards (IFRS as adopted in Ethiopia / local GAAP).

## Tech Stack

- **Frontend:** React 18+ with TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **AI Integration:** OpenAI GPT-4 (Simulated in this version)
- **File Storage:** Supabase Storage (for audit evidence)

## Features

1. **Authentication & Roles:** Secure auditor login with firm-specific data isolation via RLS.
2. **Client Management:** Manage audit clients (TIN, Sector, FY End).
3. **Engagement Tracking:** Lifecycle management from planning to reporting.
4. **Audit Checklists:** Standardized templates for IFRS compliance.
5. **AI Audit Assistant:** Chat interface for risk assessment and financial statement analysis.
6. **Report Generator:** One-click generation of independent auditor reports.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# OPENAI_API_KEY=your_openai_key (for future backend integration)
```

### 2. Database Setup

Run the SQL migrations provided in `supabase/migrations/*.sql` in your Supabase SQL Editor to:
- Create the core tables (`clients`, `engagements`, `checklists`, etc.)
- Set up Row Level Security (RLS) policies.
- Initialize the `audit-evidence` storage bucket.

### 3. Local Development

```bash
# Install dependencies
bun install

# Start the development server
bun run dev
```

## Folder Structure

- `src/pages`: Main application views (Dashboard, Clients, Engagement, AI Assistant, Reports).
- `src/components`: Reusable UI components and the Sidebar.
- `src/integrations/supabase`: Supabase client and auto-generated types.
- `supabase/migrations`: Database schema and security policies.

## Quality Assurance

- **TypeScript:** Strict type safety across the application.
- **Responsiveness:** Mobile-friendly layouts using Tailwind CSS.
- **Security:** Strict RLS policies ensure auditors only access their own client data.
