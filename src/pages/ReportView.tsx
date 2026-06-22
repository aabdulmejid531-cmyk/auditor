import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Loader2, 
  ChevronLeft, 
  Download, 
  FileText, 
  Printer, 
  Share2,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import * as Sonner from "sonner";
import type { Database } from "@/integrations/supabase/database.types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type Engagement = Database["public"]["Tables"]["engagements"]["Row"] & {
  clients: Database["public"]["Tables"]["clients"]["Row"];
};

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchReportData();
  }, [id]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // In this app, the report might be generated on the fly or fetched
      // For this view, we'll try to fetch an existing one or simulate
      const { data: r, error: rErr } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      
      if (rErr) {
        // If report not found by ID, maybe it's an engagement ID?
        // For simplicity, let's assume we fetch by report ID
      }
      setReport(r);

      if (r) {
        const { data: e } = await supabase
          .from("engagements")
          .select("*, clients(*)")
          .eq("id", r.engagement_id)
          .single();
        setEngagement(e as Engagement);
      }
    } catch (error: any) {
      Sonner.toast.error("Error loading report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!report || !engagement) return (
    <div className="p-20 text-center space-y-4">
      <FileText className="h-16 w-16 mx-auto opacity-20" />
      <h3 className="text-xl font-bold">Report Not Found</h3>
      <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="shadow-2xl border-t-8 border-t-primary print:shadow-none print:border-none">
        <CardHeader className="text-center space-y-4 pb-12 border-b">
           <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                 <ShieldCheck className="h-10 w-10" />
              </div>
           </div>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Independent Auditor's Report</h1>
              <p className="text-muted-foreground font-medium italic">Prepared using AuditFlow AI Engine</p>
           </div>
           <div className="grid grid-cols-2 gap-8 text-left pt-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">To the Shareholders of:</p>
                 <p className="font-bold text-lg">{engagement.clients.name}</p>
                 <p className="text-sm">{engagement.clients.address}</p>
                 <p className="text-sm">TIN: {engagement.clients.tin}</p>
              </div>
              <div className="space-y-1 text-right">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement Period:</p>
                 <p className="font-bold">FY {engagement.year_end_period}</p>
                 <p className="text-sm">Report Date: {new Date(report.generated_at!).toLocaleDateString()}</p>
              </div>
           </div>
        </CardHeader>
        <CardContent className="py-12 px-12 space-y-8 prose prose-slate max-w-none">
           <section>
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Opinion</h3>
              <p>
                We have audited the financial statements of <strong>{engagement.clients.name}</strong>, 
                which comprise the statement of financial position as at {engagement.year_end_period}, 
                and the statement of comprehensive income, statement of changes in equity and statement 
                of cash flows for the year then ended, and notes to the financial statements, including 
                a summary of significant accounting policies.
              </p>
              <p className="bg-primary/5 p-4 rounded-lg border border-primary/10 font-medium">
                In our opinion, the accompanying financial statements present fairly, in all material respects, 
                the financial position of the Company as at {engagement.year_end_period}, and its financial performance 
                and its cash flows for the year then ended in accordance with International Financial Reporting Standards (IFRS) 
                as adopted by the Ethiopian Accounting and Auditing Board (AABE).
              </p>
           </section>

           <section>
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Basis for Opinion</h3>
              <p>
                We conducted our audit in accordance with International Standards on Auditing (ISAs). 
                Our responsibilities under those standards are further described in the Auditor’s 
                Responsibilities for the Audit of the Financial Statements section of our report. 
                We are independent of the Company in accordance with the International Ethics 
                Standards Board for Accountants’ Code of Ethics for Professional Accountants (IESBA Code).
              </p>
           </section>

           <section>
              <h3 className="text-xl font-bold border-b pb-2 mb-4">Key Audit Matters</h3>
              <p>
                Key audit matters are those matters that, in our professional judgment, were of 
                most significance in our audit of the financial statements of the current period. 
                These matters were addressed in the context of our audit of the financial statements 
                as a whole, and in forming our opinion thereon, and we do not provide a separate 
                opinion on these matters.
              </p>
              <div className="bg-muted/30 p-6 rounded-xl border space-y-4">
                 {report.content ? (
                   <div dangerouslySetInnerHTML={{ __html: report.content }} />
                 ) : (
                   <p className="italic text-muted-foreground">Detailed findings and AI-generated analysis will be inserted here based on the fieldwork documentation.</p>
                 )}
              </div>
           </section>

           <section className="pt-12">
              <div className="flex flex-col items-end gap-2">
                 <div className="h-20 w-48 border-b-2 border-slate-900 flex items-center justify-center italic text-slate-400">
                    Firm Seal / Signature
                 </div>
                 <p className="font-bold">Authorized Audit Partner</p>
                 <p className="text-sm">Chartered Certified Accountant (Ethiopia)</p>
              </div>
           </section>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t py-6 px-12 text-[10px] text-muted-foreground flex justify-between">
           <p>AuditFlow ID: {report.id}</p>
           <p>&copy; {new Date().getFullYear()} Generated via AuditFlow Ethiopia Compliance Engine</p>
        </CardFooter>
      </Card>
    </div>
  );
}
