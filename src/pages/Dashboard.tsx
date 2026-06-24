import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  ArrowRight,
  Sun,
  Moon,
  Calculator,
  ShieldAlert,
  Scale,
  FileCheck,
  Leaf,
  Lock,
  Layers,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";
import * as Sonner from "sonner";
import type { Database } from "@/integrations/supabase/database.types";
import { useTheme } from "next-themes";

type Engagement = Database["public"]["Tables"]["engagements"]["Row"] & {
  clients: Database["public"]["Tables"]["clients"]["Row"];
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    engagements: 0,
    completed: 0,
    inProgress: 0,
  });
  const [recentEngagements, setRecentEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  // ISA 320 Materiality Calculator State
  const [benchmark, setBenchmark] = useState<"revenue" | "profit" | "assets" | "equity">("revenue");
  const [benchmarkValue, setBenchmarkValue] = useState<number>(2500000); // €2.5M Default
  const [riskFactor, setRiskFactor] = useState<number>(65); // 65% Performance Materiality factor

  // ISA 315 Audit Risk Matrix State
  const [riskMatrix, setRiskMatrix] = useState<Record<string, { inherent: "low" | "medium" | "high", control: "low" | "medium" | "high" }>>({
    cash: { inherent: "low", control: "medium" },
    receivables: { inherent: "medium", control: "medium" },
    inventory: { inherent: "high", control: "high" },
    payables: { inherent: "low", control: "low" },
    revenue: { inherent: "high", control: "medium" },
    payroll: { inherent: "low", control: "low" }
  });

  // CSRD & GDPR Compliance checklists state
  const [complianceChecks, setComplianceChecks] = useState<Record<string, boolean>>({
    csrd_double_materiality: true,
    csrd_scope_1_2: true,
    csrd_scope_3: false,
    csrd_taxonomy: false,
    csrd_supply_chain: false,
    gdpr_data_mapping: true,
    gdpr_consent: true,
    gdpr_dpo: false,
    gdpr_breach_proc: false,
    gdpr_rights: false,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [clientsRes, engagementsRes] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact" }),
        supabase.from("engagements").select("*, clients(*)").order("created_at", { ascending: false })
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (engagementsRes.error) throw engagementsRes.error;

      const engagements = (engagementsRes.data as Engagement[]) || [];
      const completed = engagements.filter(e => e.status === "completed").length;
      const inProgress = engagements.filter(e => e.status !== "completed").length;

      setStats({
        clients: clientsRes.count || 0,
        engagements: engagements.length,
        completed,
        inProgress,
      });

      setRecentEngagements(engagements.slice(0, 5));
    } catch (error: any) {
      Sonner.toast.error("Error fetching dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for ISA 320 Materiality Calculator
  const getBenchmarkRate = () => {
    switch (benchmark) {
      case "revenue": return 0.01;      // 1.0% (standard 0.5% - 2.0% range)
      case "profit": return 0.05;       // 5.0% (standard 5.0% - 10.0% range)
      case "assets": return 0.01;       // 1.0% (standard 1.0% - 2.0% range)
      case "equity": return 0.025;      // 2.5% (standard 2.0% - 5.0% range)
    }
  };

  const getBenchmarkLabel = () => {
    switch (benchmark) {
      case "revenue": return "Total Revenue (ISA 320.A8)";
      case "profit": return "Profit Before Tax (ISA 320.A8)";
      case "assets": return "Total Assets (ISA 320.A8)";
      case "equity": return "Total Equity (ISA 320.A8)";
    }
  };

  const overallMateriality = benchmarkValue * getBenchmarkRate();
  const performanceMateriality = overallMateriality * (riskFactor / 100);
  const clearlyTrivial = performanceMateriality * 0.05; // 5% standard

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
  };

  // Calculations for ISA 315 Audit Risk Matrix
  const getDetectionRisk = (inherent: "low" | "medium" | "high", control: "low" | "medium" | "high") => {
    const scoreMap = { low: 1, medium: 2, high: 3 };
    const score = scoreMap[inherent] + scoreMap[control];
    
    if (score >= 5) {
      return { 
        level: "Low", 
        strategy: "Substantive focus (Extensive sample sizes & details tests)", 
        color: "text-destructive bg-destructive/10 border-destructive/20" 
      };
    } else if (score >= 3) {
      return { 
        level: "Medium", 
        strategy: "Balanced (Moderate sample testing & analytical review)", 
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20" 
      };
    }
    return { 
      level: "High", 
      strategy: "Control reliance (Analytical procedures, minor sample checking)", 
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
    };
  };

  const updateRisk = (area: string, type: "inherent" | "control", value: "low" | "medium" | "high") => {
    setRiskMatrix(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        [type]: value
      }
    }));
  };

  // CSRD and GDPR calculations
  const csrdTotal = 5;
  const csrdCompleted = [
    complianceChecks.csrd_double_materiality,
    complianceChecks.csrd_scope_1_2,
    complianceChecks.csrd_scope_3,
    complianceChecks.csrd_taxonomy,
    complianceChecks.csrd_supply_chain,
  ].filter(Boolean).length;
  const csrdPercent = Math.round((csrdCompleted / csrdTotal) * 100);

  const gdprTotal = 5;
  const gdprCompleted = [
    complianceChecks.gdpr_data_mapping,
    complianceChecks.gdpr_consent,
    complianceChecks.gdpr_dpo,
    complianceChecks.gdpr_breach_proc,
    complianceChecks.gdpr_rights,
  ].filter(Boolean).length;
  const gdprPercent = Math.round((gdprCompleted / gdprTotal) * 100);

  const toggleCompliance = (key: string) => {
    setComplianceChecks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const statusData = [
    { name: "Planning", value: recentEngagements.filter(e => e.status === "planning").length, color: "#818cf8" },
    { name: "Fieldwork", value: recentEngagements.filter(e => e.status === "fieldwork").length, color: "#3b82f6" },
    { name: "Reporting", value: recentEngagements.filter(e => e.status === "reporting").length, color: "#fbbf24" },
    { name: "Completed", value: stats.completed, color: "#10b981" },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Clock className="h-10 w-10 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading European Audit Systems...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <Layers className="h-3 w-3" /> ISA & CSRD Compliant Workspace
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            AuditFlow Pro Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Euro-compliant digital audit portal. Overseeing risk matrices, materiality calculations, and sustainability compliance.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer border-muted-foreground/20"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button 
            asChild 
            variant="outline"
            className="h-10 transition-all duration-300 hover:shadow-md hover:bg-accent border-muted-foreground/20 cursor-pointer"
          >
            <Link to="/clients">
              <Users className="mr-2 h-4 w-4 text-primary" /> Manage Clients
            </Link>
          </Button>
          <Button 
            asChild
            className="h-10 bg-primary text-primary-foreground transition-all duration-300 hover:shadow-lg hover:scale-102 cursor-pointer shadow-indigo-500/10"
          >
            <Link to="/clients">
              <Plus className="mr-2 h-4 w-4" /> New Engagement
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full max-w-4xl p-1 bg-muted/60 backdrop-blur rounded-xl h-11 border">
          <TabsTrigger value="overview" className="rounded-lg text-sm font-medium transition-all">Overview</TabsTrigger>
          <TabsTrigger value="materiality" className="rounded-lg text-sm font-medium transition-all gap-1.5"><Calculator className="h-3.5 w-3.5" /> ISA 320 Materiality</TabsTrigger>
          <TabsTrigger value="risk" className="rounded-lg text-sm font-medium transition-all gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> ISA 315 Risk Matrix</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-lg text-sm font-medium transition-all gap-1.5"><Scale className="h-3.5 w-3.5" /> CSRD & GDPR Compliance</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
          
          {/* Key Counter Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-muted-foreground/10 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Clients</CardTitle>
                <Users className="h-5 w-5 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stats.clients}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Verified corporate entities</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-muted-foreground/10 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Engagements</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stats.inProgress}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Undergoing planning & testing</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-muted-foreground/10 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CSRD ESG Audit Coverage</CardTitle>
                <Leaf className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">
                  {Math.round(csrdPercent)}%
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5 font-medium">
                  Active ESG procedures running
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-muted-foreground/10 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Performance Materiality</CardTitle>
                <Calculator className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">{formatCurrency(performanceMateriality)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Calculated via ISA 320 limits</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Engagements Table and Chart */}
          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4 border border-muted-foreground/10 shadow-xs bg-card/30 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Recent Engagements</CardTitle>
                  <CardDescription className="text-xs">Active European financial audits</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" asChild>
                  <Link to="/clients">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEngagements.length > 0 ? (
                    recentEngagements.map((engagement) => (
                      <div 
                        key={engagement.id} 
                        className="group flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-all duration-200 hover:bg-muted/30 p-2.5 rounded-lg -mx-2.5"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-bold group-hover:text-primary transition-colors">
                            {engagement.clients.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            Period: {engagement.year_end_period} • Status: 
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              engagement.status === "completed" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : engagement.status === "reporting"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                            }`}>
                              {engagement.status}
                            </span>
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border cursor-pointer hover:bg-primary hover:text-white"
                        >
                          <Link to={`/engagements/${engagement.id}`}>
                            Open File
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8 opacity-40 text-muted-foreground" />
                      <span>No active audit engagements found. Create a client first.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border border-muted-foreground/10 bg-card/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Engagement Status</CardTitle>
                <CardDescription className="text-xs">Workflow stage division</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] flex flex-col justify-between">
                {recentEngagements.length > 0 ? (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            background: "rgba(var(--background), 0.8)", 
                            borderRadius: "8px", 
                            borderColor: "rgba(var(--border), 0.5)",
                            fontSize: "12px"
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
                    No status data available
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-3 text-xs pt-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div 
                        className="h-2.5 w-2.5 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: ISA 320 Materiality Calculator */}
        <TabsContent value="materiality" className="animate-in fade-in-50 duration-300">
          <Card className="border border-muted-foreground/10 shadow-xs bg-card/30 backdrop-blur">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-bold">ISA 320 Materiality Calculator</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Calculate planning and performance materiality in accordance with International Standard on Auditing (ISA) 320.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-8 lg:grid-cols-12">
                
                {/* Inputs Column */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="benchmark-select" className="text-sm font-semibold flex items-center gap-1">
                      Materiality Benchmark <span title="ISA 320.A8 lists factors affecting benchmark choices."><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></span>
                    </Label>
                    <Select value={benchmark} onValueChange={(val: any) => setBenchmark(val)}>
                      <SelectTrigger id="benchmark-select" className="w-full bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Select benchmark" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Total Revenue (1.0%)</SelectItem>
                        <SelectItem value="profit">Profit Before Tax (5.0%)</SelectItem>
                        <SelectItem value="assets">Total Assets (1.0%)</SelectItem>
                        <SelectItem value="equity">Total Equity (2.5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benchmark-val" className="text-sm font-semibold">
                      Benchmark Financial Statement Amount (EUR)
                    </Label>
                    <Input 
                      id="benchmark-val"
                      type="number"
                      value={benchmarkValue}
                      onChange={(e) => setBenchmarkValue(Number(e.target.value))}
                      className="bg-background border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        Performance Materiality Ratio: <span className="text-primary font-black">{riskFactor}%</span>
                      </Label>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">ISA 320.A13</span>
                    </div>
                    <Slider 
                      value={[riskFactor]} 
                      onValueChange={(val) => setRiskFactor(val[0])} 
                      min={50} 
                      max={75} 
                      step={5} 
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>50% (High Client Risk)</span>
                      <span>60-65% (Medium Risk)</span>
                      <span>75% (Low Risk)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    <p className="font-bold mb-1">Standard European Benchmark Percentages:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Profit Before Tax (Constant Operations): 5.0% - 10.0%</li>
                      <li>Total Revenues: 0.5% - 2.0% (used: 1.0%)</li>
                      <li>Total Assets: 1.0% - 2.0% (used: 1.0%)</li>
                      <li>Total Equity / Net Assets: 2.0% - 5.0% (used: 2.5%)</li>
                    </ul>
                  </div>
                </div>

                {/* Outputs Column */}
                <div className="lg:col-span-7 bg-muted/30 p-6 rounded-2xl border border-muted flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Calculated Audit Thresholds</h3>
                    
                    <div className="space-y-4">
                      {/* Overall Materiality */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-muted-foreground/5 shadow-xs">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            Overall Planning Materiality <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded font-mono">ISA 320.9</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Threshold for financial statement errors</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-foreground">{formatCurrency(overallMateriality)}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">Based on {getBenchmarkLabel()}</p>
                        </div>
                      </div>

                      {/* Performance Materiality */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 shadow-xs">
                        <div>
                          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                            Performance Materiality <span className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.2 rounded font-mono">ISA 320.11</span>
                          </p>
                          <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">Scope limit for tests and balances</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(performanceMateriality)}</p>
                          <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-mono">{riskFactor}% of Overall</p>
                        </div>
                      </div>

                      {/* Clearly Trivial */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-muted-foreground/5 shadow-xs">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            Clearly Trivial (De Minimis) Limit <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded font-mono">ISA 450.A3</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Threshold below which errors are not accumulated</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-foreground">{formatCurrency(clearlyTrivial)}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">5% of Performance Materiality</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Audit Note:</strong> These calculation metrics will guide the extent of sampling in the substantive procedures phase. Significant anomalies exceeding the Overall Materiality threshold may trigger a qualified audit opinion.
                    </span>
                  </div>

                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: ISA 315 Audit Risk Matrix */}
        <TabsContent value="risk" className="animate-in fade-in-50 duration-300">
          <Card className="border border-muted-foreground/10 shadow-xs bg-card/30 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <CardTitle className="text-xl font-bold">ISA 315 Audit Risk Matrix</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Assess Inherent and Control risk across primary assertion areas to calculate the required Detection Risk and formulate the testing strategy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-xl bg-background shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">Audit Segment</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">Inherent Risk (ISA 315.31)</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">Control Risk (ISA 315.34)</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">Detection Risk Target</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground.h-10 py-3">Substantive Testing Audit Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { key: "cash", label: "Cash & Cash Equivalents" },
                      { key: "receivables", label: "Accounts Receivable" },
                      { key: "inventory", label: "Inventory & Assets" },
                      { key: "payables", label: "Accounts Payable" },
                      { key: "revenue", label: "Revenue & Sales Recognition" },
                      { key: "payroll", label: "Payroll & Labor Expenses" },
                    ].map((row) => {
                      const detRisk = getDetectionRisk(riskMatrix[row.key].inherent, riskMatrix[row.key].control);
                      return (
                        <TableRow key={row.key} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-bold text-sm text-foreground">{row.label}</TableCell>
                          
                          {/* Inherent Risk Dropdown */}
                          <TableCell>
                            <Select 
                              value={riskMatrix[row.key].inherent} 
                              onValueChange={(val: any) => updateRisk(row.key, "inherent", val)}
                            >
                              <SelectTrigger className="w-28 bg-background border-muted-foreground/15 text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low"><span className="text-emerald-500 font-bold">Low</span></SelectItem>
                                <SelectItem value="medium"><span className="text-amber-500 font-bold">Medium</span></SelectItem>
                                <SelectItem value="high"><span className="text-red-500 font-bold">High</span></SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Control Risk Dropdown */}
                          <TableCell>
                            <Select 
                              value={riskMatrix[row.key].control} 
                              onValueChange={(val: any) => updateRisk(row.key, "control", val)}
                            >
                              <SelectTrigger className="w-28 bg-background border-muted-foreground/15 text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low"><span className="text-emerald-500 font-bold">Low</span></SelectItem>
                                <SelectItem value="medium"><span className="text-amber-500 font-bold">Medium</span></SelectItem>
                                <SelectItem value="high"><span className="text-red-500 font-bold">High</span></SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Calculated Detection Risk */}
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${detRisk.color}`}>
                              {detRisk.level} Risk
                            </span>
                          </TableCell>

                          {/* Recommended testing strategy */}
                          <TableCell className="text-xs text-muted-foreground font-medium max-w-xs leading-tight">
                            {detRisk.strategy}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: CSRD & GDPR Compliance Tracker */}
        <TabsContent value="compliance" className="animate-in fade-in-50 duration-300">
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* CSRD Sustainability Audit */}
            <Card className="border border-muted-foreground/10 bg-card/30 backdrop-blur shadow-xs flex flex-col justify-between">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-emerald-500" />
                  <div>
                    <CardTitle className="text-lg font-bold">CSRD Sustainability Audit</CardTitle>
                    <CardDescription className="text-xs">EU Corporate Sustainability Reporting Directive Checklist</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Directive Audit Progress</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">{csrdPercent}%</span>
                  </div>
                  <Progress value={csrdPercent} className="h-2 text-emerald-500" />
                </div>

                <div className="space-y-4">
                  {[
                    { key: "csrd_double_materiality", label: "Double Materiality Assessment (EFRAG Standards)", desc: "Audit if double materiality assessment (impact & financial materiality) is performed." },
                    { key: "csrd_scope_1_2", label: "Scope 1 & Scope 2 Emissions Audit", desc: "Verify calculation, ledger entries, and audit trail of direct/indirect greenhouse gases." },
                    { key: "csrd_scope_3", label: "Scope 3 Supply Chain Disclosures", desc: "Test value chain emission data and calculations for upstream & downstream assets." },
                    { key: "csrd_taxonomy", label: "EU Taxonomy Alignment Verification", desc: "Check percentage alignment with the six environmental objectives of EU Taxonomy." },
                    { key: "csrd_supply_chain", label: "CSDDD Supply Chain Auditing", desc: "Confirm due diligence procedures regarding child labor & ecological impact." }
                  ].map((item) => (
                    <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/10 transition-colors">
                      <Checkbox 
                        id={item.key}
                        checked={complianceChecks[item.key]} 
                        onCheckedChange={() => toggleCompliance(item.key)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <Label htmlFor={item.key} className="text-xs font-bold leading-none cursor-pointer hover:text-primary transition-colors">
                          {item.label}
                        </Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* GDPR Compliance Audit */}
            <Card className="border border-muted-foreground/10 bg-card/30 backdrop-blur shadow-xs flex flex-col justify-between">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg font-bold">GDPR Compliance Audit</CardTitle>
                    <CardDescription className="text-xs">EU General Data Protection Regulation Checklist</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Privacy Audit Progress</span>
                    <span className="text-blue-600 dark:text-blue-400 font-black">{gdprPercent}%</span>
                  </div>
                  <Progress value={gdprPercent} className="h-2 text-blue-500" />
                </div>

                <div className="space-y-4">
                  {[
                    { key: "gdpr_data_mapping", label: "Data Mapping & Inventory Records (Article 30)", desc: "Audit register of personal data processing activities (ROPA) under EU laws." },
                    { key: "gdpr_consent", label: "Consent & Privacy Disclosures (Articles 13 & 14)", desc: "Ensure client privacy policy is transparent and active consent mechanisms are present." },
                    { key: "gdpr_dpo", label: "DPO Appointment & Independence Check", desc: "Confirm appointment of qualified Data Protection Officer if legally required." },
                    { key: "gdpr_breach_proc", label: "72-Hour Data Breach Incident Protocols", desc: "Verify data breach notification processes and logging systems are operating." },
                    { key: "gdpr_rights", label: "Data Subject Access Rights (DSAR)", desc: "Verify automated/manual setups for user data deletion, extraction, and correction." }
                  ].map((item) => (
                    <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/10 transition-colors">
                      <Checkbox 
                        id={item.key}
                        checked={complianceChecks[item.key]} 
                        onCheckedChange={() => toggleCompliance(item.key)}
                        className="mt-0.5 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <Label htmlFor={item.key} className="text-xs font-bold leading-none cursor-pointer hover:text-primary transition-colors">
                          {item.label}
                        </Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
