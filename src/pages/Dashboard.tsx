import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Plus,
  ArrowRight,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

  const statusData = [
    { name: "Planning", value: recentEngagements.filter(e => e.status === "planning").length, color: "#94a3b8" },
    { name: "Fieldwork", value: recentEngagements.filter(e => e.status === "fieldwork").length, color: "#3b82f6" },
    { name: "Reporting", value: recentEngagements.filter(e => e.status === "reporting").length, color: "#f59e0b" },
    { name: "Completed", value: stats.completed, color: "#10b981" },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditor Dashboard</h1>
          <p className="text-muted-foreground">Welcome to AuditFlow Ethiopia. Here's your firm's overview.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 transition-all duration-200 hover:scale-105 hover:shadow-md"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button 
            asChild 
            variant="outline"
            className="transition-all duration-200 hover:shadow-md hover:bg-accent"
          >
            <Link to="/clients">
              <Users className="mr-2 h-4 w-4" /> Manage Clients
            </Link>
          </Button>
          <Button 
            asChild
            className="transition-all duration-200 hover:shadow-md"
          >
            <Link to="/clients">
              <Plus className="mr-2 h-4 w-4" /> New Engagement
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">Registered audit clients</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Engagements</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Audits</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">This fiscal year</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.engagements > 0 ? Math.round((stats.completed / stats.engagements) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Engagements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEngagements.length > 0 ? (
                recentEngagements.map((engagement) => (
                  <div 
                    key={engagement.id} 
                    className="group flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 transition-all duration-200 hover:bg-muted/30 p-2 rounded-lg -mx-2"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                        {engagement.clients.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        FY: {engagement.year_end_period} • Status: <span className="capitalize">{engagement.status}</span>
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Link to={`/engagements/${engagement.id}`}>
                        Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No engagements found.</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 group cursor-pointer">
                  <div 
                    className="h-3 w-3 rounded-full transition-all duration-200 group-hover:scale-110"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="group-hover:text-foreground transition-colors">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
