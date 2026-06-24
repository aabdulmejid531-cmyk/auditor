import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Building2, 
  MapPin, 
  Hash,
  Briefcase,
  Loader2,
  Trash2,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import * as Sonner from "sonner";
import type { Database } from "@/integrations/supabase/database.types";
import { useNavigate } from "react-router-dom";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEngageOpen, setIsEngageOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form states for new client
  const [name, setName] = useState("");
  const [tin, setTin] = useState("");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");
  const [fiscalYearEnd, setFiscalYearEnd] = useState("");

  // Form states for new engagement
  const [yearEnd, setYearEnd] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    if (error) {
      Sonner.toast.error("Error fetching clients: " + error.message);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Safety net: ensure a profile row exists for this user before inserting
    // the client (which has a FK → profiles.id). This handles the case where
    // the on_auth_user_created trigger did not fire during registration.
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userData.user.id,
        full_name: userData.user.user_metadata?.full_name ?? null,
        firm_name: userData.user.user_metadata?.firm_name ?? null,
        phone:     userData.user.user_metadata?.phone     ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      Sonner.toast.error("Profile sync failed: " + profileError.message);
      return;
    }

    const { error } = await supabase.from("clients").insert({
      name,
      tin,
      sector,
      address,
      fiscal_year_end: fiscalYearEnd,
      auditor_id: userData.user.id
    });

    if (error) {
      Sonner.toast.error("Error adding client: " + error.message);
    } else {
      Sonner.toast.success("Client added successfully");
      setIsAddOpen(false);
      resetClientForm();
      fetchClients();
    }
  };


  const handleCreateEngagement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const { data, error } = await supabase.from("engagements").insert({
      client_id: selectedClient.id,
      year_end_period: yearEnd,
      start_date: startDate,
      status: "planning"
    }).select().single();

    if (error) {
      Sonner.toast.error("Error creating engagement: " + error.message);
    } else {
      Sonner.toast.success("Engagement created successfully");
      setIsEngageOpen(false);
      navigate(`/engagements/${data.id}`);
    }
  };

  const resetClientForm = () => {
    setName("");
    setTin("");
    setSector("");
    setAddress("");
    setFiscalYearEnd("");
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your audit portfolio and start new engagements.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle>Add Audit Client</DialogTitle>
                <DialogDescription>
                  Register a new company for audit engagements.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tin" className="text-right">TIN</Label>
                  <Input id="tin" value={tin} onChange={(e) => setTin(e.target.value)} className="col-span-3" placeholder="Taxpayer ID" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sector" className="text-right">Sector</Label>
                  <Input id="sector" value={sector} onChange={(e) => setSector(e.target.value)} className="col-span-3" placeholder="e.g. Manufacturing" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fy" className="text-right">FY End</Label>
                  <Input id="fy" type="date" value={fiscalYearEnd} onChange={(e) => setFiscalYearEnd(e.target.value)} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Client Profile</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-background p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or TIN..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">{client.name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4" /> TIN: {client.tin || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {client.address || "No address provided"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" /> Sector: {client.sector || "Other"}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedClient(client);
                      setIsEngageOpen(true);
                    }}
                  >
                    New Engagement
                  </Button>
                  <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No clients found. Add your first client to start auditing.</p>
            </div>
          )}
        </div>
      )}

      {/* New Engagement Dialog */}
      <Dialog open={isEngageOpen} onOpenChange={setIsEngageOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateEngagement}>
            <DialogHeader>
              <DialogTitle>New Audit Engagement</DialogTitle>
              <DialogDescription>
                Start a new audit cycle for {selectedClient?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="period" className="text-right">FY End</Label>
                <Input id="period" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start" className="text-right">Start Date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Initialize Audit Engagement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
