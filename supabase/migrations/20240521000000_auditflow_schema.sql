-- AuditFlow Ethiopia Schema Migration

-- 1. Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firm_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Create clients table
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auditor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tin TEXT,
  sector TEXT,
  address TEXT,
  fiscal_year_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view their own clients"
  ON public.clients FOR SELECT
  USING (auditor_id = auth.uid());

CREATE POLICY "Auditors can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auditor_id = auth.uid());

CREATE POLICY "Auditors can update their own clients"
  ON public.clients FOR UPDATE
  USING (auditor_id = auth.uid());

CREATE POLICY "Auditors can delete their own clients"
  ON public.clients FOR DELETE
  USING (auditor_id = auth.uid());

-- 3. Create engagements table
CREATE TABLE public.engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  year_end_period DATE NOT NULL,
  audit_team TEXT[],
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'fieldwork', 'reporting', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view engagements for their clients"
  ON public.engagements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = engagements.client_id AND clients.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can insert engagements for their clients"
  ON public.engagements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = engagements.client_id AND clients.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can update engagements for their clients"
  ON public.engagements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = engagements.client_id AND clients.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can delete engagements for their clients"
  ON public.engagements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = engagements.client_id AND clients.auditor_id = auth.uid()
  ));

-- 4. Create checklists table
CREATE TABLE public.checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view checklists for their engagements"
  ON public.checklists FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = checklists.engagement_id AND c.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can manage checklists for their engagements"
  ON public.checklists FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = checklists.engagement_id AND c.auditor_id = auth.uid()
  ));

-- 5. Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  evidence_urls TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view checklist items for their engagements"
  ON public.checklist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.checklists cl
    JOIN public.engagements e ON cl.engagement_id = e.id
    JOIN public.clients c ON e.client_id = c.id
    WHERE cl.id = checklist_items.checklist_id AND c.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can manage checklist items for their engagements"
  ON public.checklist_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.checklists cl
    JOIN public.engagements e ON cl.engagement_id = e.id
    JOIN public.clients c ON e.client_id = c.id
    WHERE cl.id = checklist_items.checklist_id AND c.auditor_id = auth.uid()
  ));

-- 6. Create audit_procedures table
CREATE TABLE public.audit_procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view procedures for their engagements"
  ON public.audit_procedures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = audit_procedures.engagement_id AND c.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can manage procedures for their engagements"
  ON public.audit_procedures FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = audit_procedures.engagement_id AND c.auditor_id = auth.uid()
  ));

-- 7. Create findings table
CREATE TABLE public.findings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  recommendation TEXT,
  management_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view findings for their engagements"
  ON public.findings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = findings.engagement_id AND c.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can manage findings for their engagements"
  ON public.findings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = findings.engagement_id AND c.auditor_id = auth.uid()
  ));

-- 8. Create reports table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  pdf_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors can view reports for their engagements"
  ON public.reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = reports.engagement_id AND c.auditor_id = auth.uid()
  ));

CREATE POLICY "Auditors can manage reports for their engagements"
  ON public.reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.engagements e
    JOIN public.clients c ON e.client_id = c.id
    WHERE e.id = reports.engagement_id AND c.auditor_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_clients_auditor_id ON public.clients(auditor_id);
CREATE INDEX idx_engagements_client_id ON public.engagements(client_id);
CREATE INDEX idx_checklists_engagement_id ON public.checklists(engagement_id);
CREATE INDEX idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);
CREATE INDEX idx_audit_procedures_engagement_id ON public.audit_procedures(engagement_id);
CREATE INDEX idx_findings_engagement_id ON public.findings(engagement_id);
CREATE INDEX idx_reports_engagement_id ON public.reports(engagement_id);
