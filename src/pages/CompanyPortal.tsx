import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanies, useCompanyMemberships, useCreateCompany } from "@/hooks/useCompanies";
import { useUnreadCountByCompany } from "@/hooks/useNotifications";
import { useMyInvitations, useRespondInvitation } from "@/hooks/useInvitations";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, ArrowRight, Mail, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CompanyPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: companies = [], isLoading } = useCompanies();
  const { data: memberships = [] } = useCompanyMemberships();
  const unreadCounts = useUnreadCountByCompany();
  const createCompany = useCreateCompany();
  const { data: pendingInvites = [] } = useMyInvitations();
  const respondInvite = useRespondInvitation();
  const { setActiveCompanyId } = useCompany();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const myCompanies = companies.filter(c =>
    memberships.some(m => m.company_id === c.id)
  );

  const handleEnter = (companyId: string) => {
    setActiveCompanyId(companyId);
    navigate("/");
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCompany.mutate({ name: newName, role: "project_lead" }, {
      onSuccess: () => {
        setNewName("");
        setDialogOpen(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Building2 className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-foreground">Your Organizations</h1>
          <p className="text-muted-foreground mt-1">Select a company to enter its dashboard</p>
        </div>

        <div className="grid gap-4">
          {isLoading && <p className="text-center text-muted-foreground">Loading...</p>}
          {myCompanies.map(company => {
            const membership = memberships.find(m => m.company_id === company.id);
            const unread = unreadCounts[company.id] || 0;
            return (
              <Card
                key={company.id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleEnter(company.id)}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{company.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {membership?.role?.replace("_", " ")} {membership?.department ? `· ${membership.department}` : ""}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && myCompanies.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">You haven't joined any organization yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Pending Invitations
            </h2>
            <div className="grid gap-3">
              {pendingInvites.map(inv => (
                <Card key={inv.id} className="border-primary/20">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground text-sm">You've been invited</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Role: {inv.role.replace("_", " ")}{inv.department ? ` · ${inv.department}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1"
                        disabled={respondInvite.isPending}
                        onClick={() => respondInvite.mutate({ invitation: inv, accept: false }, { onSuccess: () => toast.info("Invitation declined") })}>
                        <X className="h-3.5 w-3.5" /> Decline
                      </Button>
                      <Button size="sm" className="gap-1"
                        disabled={respondInvite.isPending}
                        onClick={() => respondInvite.mutate({ invitation: inv, accept: true }, { onSuccess: () => toast.success("Invitation accepted!") })}>
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Acme Corp" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createCompany.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
