import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  ChevronLeft, 
  ClipboardList, 
  CheckCircle2, 
  FileText, 
  MessageSquare,
  AlertCircle,
  Plus,
  Trash2,
  Paperclip,
  Save,
  FileSearch,
  Zap,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import * as Sonner from "sonner";
import type { Database } from "@/integrations/supabase/database.types";

type Engagement = Database["public"]["Tables"]["engagements"]["Row"] & {
  clients: Database["public"]["Tables"]["clients"]["Row"];
};
type Checklist = Database["public"]["Tables"]["checklists"]["Row"];
type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];
type Finding = Database["public"]["Tables"]["findings"]["Row"];
type Procedure = Database["public"]["Tables"]["audit_procedures"]["Row"];

export default function EngagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [items, setItems] = useState<Record<string, ChecklistItem[]>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal/Form states
  const [isFindingOpen, setIsFindingOpen] = useState(false);
  const [newFinding, setNewFinding] = useState({ title: "", description: "", severity: "medium", recommendation: "" });

  useEffect(() => {
    if (id) fetchEngagementData();
  }, [id]);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      const { data: e, error: eErr } = await supabase
        .from("engagements")
        .select("*, clients(*)")
        .eq("id", id)
        .single();
      if (eErr) throw eErr;
      setEngagement(e as Engagement);

      // Fetch related data
      const [checkRes, findRes, procRes] = await Promise.all([
        supabase.from("checklists").select("*").eq("engagement_id", id),
        supabase.from("findings").select("*").eq("engagement_id", id),
        supabase.from("audit_procedures").select("*").eq("engagement_id", id)
      ]);

      if (checkRes.data) {
        setChecklists(checkRes.data);
        const itemPromises = checkRes.data.map(cl => 
          supabase.from("checklist_items").select("*").eq("checklist_id", cl.id).order("order_index")
        );
        const itemResults = await Promise.all(itemPromises);
        const itemMap: Record<string, ChecklistItem[]> = {};
        checkRes.data.forEach((cl, idx) => {
          itemMap[cl.id] = itemResults[idx].data || [];
        });
        setItems(itemMap);
      }
      setFindings(findRes.data || []);
      setProcedures(procRes.data || []);

    } catch (error: any) {
      Sonner.toast.error("Error loading engagement: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string, completed: boolean) => {
    const { error } = await supabase
      .from("checklist_items")
      .update({ is_completed: completed })
      .eq("id", itemId);

    if (error) {
      Sonner.toast.error("Error updating item: " + error.message);
    } else {
      setItems(prev => ({
        ...prev,
        [checklistId]: prev[checklistId].map(i => i.id === itemId ? { ...i, is_completed: completed } : i)
      }));
      // Update checklist progress
      updateProgress(checklistId);
    }
  };

  const updateProgress = async (checklistId: string) => {
    const checklistItems = items[checklistId];
    if (!checklistItems) return;
    const completed = checklistItems.filter(i => i.is_completed).length;
    const total = checklistItems.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    await supabase.from("checklists").update({ completed_percentage: percentage }).eq("id", checklistId);
    setChecklists(prev => prev.map(cl => cl.id === checklistId ? { ...cl, completed_percentage: percentage } : cl));
  };

  const handleCreateFinding = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("findings").insert({
      engagement_id: id,
      ...newFinding
    }).select().single();

    if (error) {
      Sonner.toast.error("Error creating finding: " + error.message);
    } else {
      setFindings([...findings, data]);
      setIsFindingOpen(false);
      setNewFinding({ title: "", description: "", severity: "medium", recommendation: "" });
      Sonner.toast.success("Finding recorded");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-slate-500";
      case "fieldwork": return "bg-blue-500";
      case "reporting": return "bg-amber-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!engagement) return <div className="p-8 text-center">Engagement not found.</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{engagement.clients.name}</h1>
            <Badge className={getStatusColor(engagement.status || "")}>
              {engagement.status?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">Audit Engagement for FY {engagement.year_end_period}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Paperclip className="mr-2 h-4 w-4" /> Evidence Box
          </Button>
          <Button variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            <Zap className="mr-2 h-4 w-4" /> AI Suggest Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="checklists" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="checklists" className="gap-2"><ClipboardList className="h-4 w-4" /> Checklist</TabsTrigger>
          <TabsTrigger value="procedures" className="gap-2"><FileSearch className="h-4 w-4" /> Procedures</TabsTrigger>
          <TabsTrigger value="findings" className="gap-2"><AlertCircle className="h-4 w-4" /> Findings</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="gap-2"><Zap className="h-4 w-4" /> AI Auditor</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileText className="h-4 w-4" /> Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="mt-6 space-y-6">
          <div className="grid gap-6">
            {checklists.map(cl => (
              <Card key={cl.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{cl.title}</CardTitle>
                      <CardDescription>Progress: {Math.round(cl.completed_percentage || 0)}%</CardDescription>
                    </div>
                    <Progress value={cl.completed_percentage || 0} className="w-48" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items[cl.id]?.map(item => (
                    <div key={item.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <Checkbox 
                        id={item.id} 
                        checked={!!item.is_completed} 
                        onCheckedChange={(checked) => handleToggleItem(cl.id, item.id, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <Label 
                          htmlFor={item.id} 
                          className={cn("text-sm font-medium leading-none cursor-pointer", item.is_completed && "text-muted-foreground line-through")}
                        >
                          {item.description}
                        </Label>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                            <Plus className="mr-1 h-3 w-3" /> Add Note
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                            <Paperclip className="mr-1 h-3 w-3" /> Upload Evidence
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full border-dashed border-2 mt-2">
                    <Plus className="mr-2 h-4 w-4" /> Add custom step
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {checklists.length === 0 && (
              <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold">No checklists initialized</h3>
                <p className="text-muted-foreground mb-6">Start with standard Ethiopian audit checklists.</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline">Import IFRS Template</Button>
                  <Button>Initialize All Standard Checklists</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="procedures" className="mt-6 space-y-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <div>
                 <CardTitle>Substantive Procedures</CardTitle>
                 <CardDescription>Documenting specific audit tests performed.</CardDescription>
               </div>
               <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Procedure</Button>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  {procedures.map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-4">
                      <div className="space-y-1">
                        <p className="font-bold">{p.area}</p>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      </div>
                      <Badge variant={p.status === 'done' ? 'default' : 'secondary'}>
                        {p.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                  {procedures.length === 0 && <p className="text-center py-8 text-muted-foreground">No procedures defined yet.</p>}
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="findings" className="mt-6 space-y-6">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold">Audit Findings</h3>
             <Button onClick={() => setIsFindingOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record New Finding</Button>
           </div>
           
           <div className="grid gap-6">
             {findings.map(f => (
               <Card key={f.id} className="border-l-4" style={{ borderLeftColor: f.severity === 'high' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#3b82f6' }}>
                 <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{f.title}</CardTitle>
                      <Badge variant={f.severity === 'high' ? 'destructive' : 'secondary'}>
                        {f.severity?.toUpperCase()} SEVERITY
                      </Badge>
                    </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Issue</h4>
                      <p>{f.description}</p>
                    </div>
                    {f.recommendation && (
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommendation</h4>
                        <p className="bg-primary/5 p-3 rounded-lg border border-primary/10">{f.recommendation}</p>
                      </div>
                    )}
                 </CardContent>
                 <CardFooter className="border-t pt-4">
                    <Button variant="outline" size="sm"><MessageSquare className="mr-2 h-4 w-4" /> Add Management Response</Button>
                 </CardFooter>
               </Card>
             ))}
             {findings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No findings recorded. Good work!</div>
             )}
           </div>
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6">
           <Card className="min-h-[500px] flex flex-col">
             <CardHeader className="border-b bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> AuditFlow AI Assistant
                </CardTitle>
                <CardDescription>Ask about Ethiopian IFRS, common risks, or draft findings.</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 p-6 flex flex-col justify-end">
                <div className="space-y-4 mb-6">
                   <div className="bg-muted p-4 rounded-2xl rounded-bl-none max-w-[80%]">
                      Hello Auditor! I have context for {engagement.clients.name}'s engagement. How can I assist you today?
                   </div>
                   <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" className="rounded-full">What are the risks for {engagement.clients.sector}?</Button>
                      <Button variant="secondary" size="sm" className="rounded-full">Draft finding for missing inventory docs</Button>
                      <Button variant="secondary" size="sm" className="rounded-full">Analyze my findings for patterns</Button>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Input placeholder="Type your question here..." />
                   <Button size="icon"><Save className="h-4 w-4" /></Button>
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6 space-y-6">
           <Card>
             <CardHeader>
                <CardTitle>Audit Report Generation</CardTitle>
                <CardDescription>Compile all findings and procedures into a final report.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 border rounded-xl bg-muted/50">
                      <p className="text-sm font-bold">Client Information</p>
                      <p className="text-xs text-muted-foreground">Synced from profile</p>
                      <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
                   </div>
                   <div className="p-4 border rounded-xl bg-muted/50">
                      <p className="text-sm font-bold">Findings Included</p>
                      <p className="text-xs text-muted-foreground">{findings.length} findings found</p>
                      <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label>Audit Opinion</Label>
                   <Select defaultValue="unqualified">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unqualified">Unqualified Opinion (Clean)</SelectItem>
                        <SelectItem value="qualified">Qualified Opinion</SelectItem>
                        <SelectItem value="adverse">Adverse Opinion</SelectItem>
                        <SelectItem value="disclaimer">Disclaimer of Opinion</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </CardContent>
             <CardFooter className="border-t pt-6 bg-muted/5">
                <Button size="lg" className="w-full">
                   <FileText className="mr-2 h-5 w-5" /> Generate Draft Audit Report
                </Button>
             </CardFooter>
           </Card>
        </TabsContent>
      </Tabs>

      {/* New Finding Dialog */}
      <Dialog open={isFindingOpen} onOpenChange={setIsFindingOpen}>
        <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Record Audit Finding</DialogTitle>
             <DialogDescription>Document an issue discovered during fieldwork.</DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newFinding.title} onChange={e => setNewFinding({...newFinding, title: e.target.value})} placeholder="e.g. Unreconciled bank statement differences" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={newFinding.severity} onValueChange={v => setNewFinding({...newFinding, severity: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description of Issue</Label>
                <Textarea value={newFinding.description} onChange={e => setNewFinding({...newFinding, description: e.target.value})} className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>Audit Recommendation</Label>
                <Textarea value={newFinding.recommendation} onChange={e => setNewFinding({...newFinding, recommendation: e.target.value})} />
              </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsFindingOpen(false)}>Cancel</Button>
             <Button onClick={handleCreateFinding}>Save Finding</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
/**
 * Mock function for report generation
 * In a real app, this would call the AI backend
 */
async function generateReport(engagementId: string) {
  Sonner.toast.promise(
    new Promise((resolve) => setTimeout(resolve, 2000)),
    {
      loading: 'Generating audit report using AI...',
      success: 'Draft report generated successfully',
      error: 'Failed to generate report',
    }
  );
}
