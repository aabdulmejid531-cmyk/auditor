import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  ClipboardCheck, 
  FileSearch, 
  BarChart3,
  CheckCircle2,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">AuditFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
            <Zap className="h-3 w-3" /> AI-Powered Audit Platform
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
            Streamline Audit Workflows <br className="hidden md:block" />
            <span className="text-primary">With Intelligence.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AuditFlow Ethiopia automates risk assessment, evidence collection, and report generation tailored to IFRS and local standards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link to="/login">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              Book a Demo
            </Button>
          </div>
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale transition-all hover:grayscale-0">
             <div className="flex items-center justify-center gap-2 font-bold text-xl"><Lock className="h-5 w-5" /> Secure</div>
             <div className="flex items-center justify-center gap-2 font-bold text-xl"><CheckCircle2 className="h-5 w-5" /> Compliant</div>
             <div className="flex items-center justify-center gap-2 font-bold text-xl"><Zap className="h-5 w-5" /> Fast</div>
             <div className="flex items-center justify-center gap-2 font-bold text-xl"><BarChart3 className="h-5 w-5" /> Insights</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Built for Ethiopian Auditors</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Modern tools designed to meet the rigorous standards of AABE and IFRS adoption.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-muted/30 border space-y-4">
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ClipboardCheck className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold">Standard Checklists</h3>
               <p className="text-muted-foreground">Pre-configured templates for risk assessment, internal controls, and substantive procedures.</p>
            </div>
            <div className="p-8 rounded-2xl bg-muted/30 border space-y-4">
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold">AI Audit Assistant</h3>
               <p className="text-muted-foreground">Intelligent chat to help you draft findings, analyze anomalies, and suggest audit programs.</p>
            </div>
            <div className="p-8 rounded-2xl bg-muted/30 border space-y-4">
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileSearch className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold">Evidence Repository</h3>
               <p className="text-muted-foreground">Securely store and link audit evidence to specific procedures with strict RLS protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t mt-auto px-4 bg-muted/20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-bold">AuditFlow Ethiopia</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AuditFlow. Designed for IFRS compliance in Ethiopia.
          </p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
