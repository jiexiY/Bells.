import { useState } from "react";
import { useCompanyInvitations, useSendInvitation } from "@/hooks/useInvitations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function InviteMemberPanel() {
  const { data: invitations = [] } = useCompanyInvitations();
  const sendInvite = useSendInvitation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"project_lead" | "team_lead" | "member">("member");
  const [department, setDepartment] = useState<string>("");

  const handleSend = () => {
    if (!email.trim()) return;
    sendInvite.mutate(
      { email, role, department: department as any || undefined },
      {
        onSuccess: () => {
          toast.success("Invitation sent!");
          setEmail("");
          setDepartment("");
        },
        onError: (err: any) => toast.error(err.message),
      }
    );
  };

  const statusIcon = (status: string) => {
    if (status === "pending") return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    if (status === "accepted") return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Email</Label>
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className="h-8 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <Select value={role} onValueChange={v => setRole(v as any)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="team_lead">Team Lead</SelectItem>
              <SelectItem value="project_lead">Project Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tech">Tech</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="research">Research</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button size="sm" className="w-full gap-2" onClick={handleSend} disabled={sendInvite.isPending}>
        <Send className="h-3.5 w-3.5" /> Send Invite
      </Button>

      {invitations.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground">Sent Invitations</p>
          {invitations.slice(0, 5).map(inv => (
            <div key={inv.id} className="flex items-center justify-between text-xs py-1">
              <span className="truncate flex-1 text-foreground">{inv.email}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] capitalize">{inv.role.replace("_", " ")}</Badge>
                {statusIcon(inv.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
