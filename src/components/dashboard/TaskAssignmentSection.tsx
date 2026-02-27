import { useState } from "react";
import { Plus, ListTodo, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTask, useTasks } from "@/hooks/useTasks";
import type { TaskStatus } from "@/types/project";

interface Assignee {
  user_id: string;
  name: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
}

interface TaskAssignmentSectionProps {
  projects: Project[];
  assignees: Assignee[];
  title?: string;
  description?: string;
}

export function TaskAssignmentSection({
  projects,
  assignees,
  title = "Assign Tasks",
  description = "Create and assign tasks to team members",
}: TaskAssignmentSectionProps) {
  const { user } = useAuth();
  const createTask = useCreateTask();
  const { data: allTasks = [] } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    projectId: "",
    dueDate: "",
  });

  // Only show tasks relevant to the listed projects
  const projectIds = new Set(projects.map((p) => p.id));
  const recentTasks = allTasks
    .filter((t) => projectIds.has(t.project_id))
    .slice(0, 8);

  // Two-step flow: create unassigned task first, then assign
  const [step, setStep] = useState<"create" | "assign">("create");
  const [createdTaskTitle, setCreatedTaskTitle] = useState("");

  const handleCreate = () => {
    if (!newTask.title || !newTask.dueDate) return;

    if (step === "create" && !newTask.assignedTo) {
      // If no assignee yet, move to assign step
      setCreatedTaskTitle(newTask.title);
      setStep("assign");
      return;
    }

    const member = assignees.find((a) => a.user_id === newTask.assignedTo);
    createTask.mutate({
      title: newTask.title,
      description: newTask.description,
      status: "incomplete",
      project_id: newTask.projectId || null,
      assigned_to: newTask.assignedTo || null,
      assigned_by: user?.id || null,
      assignee_name: member?.name || "",
      due_date: newTask.dueDate,
    });
    setNewTask({ title: "", description: "", assignedTo: "", projectId: "", dueDate: "" });
    setStep("create");
    setDialogOpen(false);
  };

  const handleSkipAssign = () => {
    const member = assignees.find((a) => a.user_id === newTask.assignedTo);
    createTask.mutate({
      title: newTask.title,
      description: newTask.description,
      status: "incomplete",
      project_id: newTask.projectId,
      assigned_to: null,
      assigned_by: user?.id || null,
      assignee_name: "",
      due_date: newTask.dueDate,
    });
    setNewTask({ title: "", description: "", assignedTo: "", projectId: "", dueDate: "" });
    setStep("create");
    setDialogOpen(false);
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setStep("create"); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{step === "create" ? "Create Task" : `Assign "${createdTaskTitle}"`}</DialogTitle>
              <DialogDescription>
                {step === "create"
                  ? "Create a task — you can assign it right after"
                  : "Assign the task to a team member, or skip to leave it unassigned"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {step === "create" ? (
                <>
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      placeholder="Enter task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the task..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={newTask.projectId} onValueChange={(v) => setNewTask({ ...newTask, projectId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={newTask.assignedTo} onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((a) => (
                        <SelectItem key={a.user_id} value={a.user_id}>
                          {a.name} <span className="text-muted-foreground capitalize">({a.role.replace("_", " ")})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              {step === "create" ? (
                <>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newTask.title || !newTask.projectId || !newTask.dueDate}>
                    Next: Assign
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleSkipAssign}>Skip (Unassigned)</Button>
                  <Button onClick={handleCreate} disabled={!newTask.assignedTo}>
                    Assign & Create
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {recentTasks.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No tasks assigned yet. Click "New Task" to get started.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-2">
              {recentTasks.map((t) => {
                const project = projects.find((p) => p.id === t.project_id);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground text-sm">{t.title}</h4>
                        <StatusBadge status={t.status as TaskStatus} type="task" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.assignee_name || "Unassigned"} · {project?.name || "Unknown project"} · Due{" "}
                        {new Date(t.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
