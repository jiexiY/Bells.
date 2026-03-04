import { useState } from "react";
import { Plus, FolderPlus, ListTodo, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/project";

interface CreateProjectSectionProps {
  title?: string;
  description?: string;
}

export function CreateProjectSection({
  title = "Create Project",
  description = "Create a new project for your team",
}: CreateProjectSectionProps) {
  const { user, profileName } = useAuth();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "" as "tech" | "marketing" | "research" | "",
    dueDate: "",
  });

  // Task assignment dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.department || !form.dueDate) return;
    createProject.mutate(
      {
        name: form.name,
        description: form.description || null,
        department: form.department as "tech" | "marketing" | "research",
        due_date: form.dueDate,
        status: "assigned",
        progress: 0,
        lead_id: user?.id || null,
        lead_name: profileName || null,
      },
      {
        onSuccess: () => {
          toast.success("Project created successfully");
          setForm({ name: "", description: "", department: "", dueDate: "" });
          setDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleAssignTask = () => {
    if (!taskForm.title || !taskForm.dueDate) return;
    const member = members.find((m) => m.user_id === taskForm.assignedTo);
    createTask.mutate(
      {
        title: taskForm.title,
        description: taskForm.description || null,
        status: "incomplete",
        project_id: taskProjectId || null,
        assigned_to: taskForm.assignedTo || null,
        assigned_by: user?.id || null,
        assignee_name: member?.name || "",
        due_date: taskForm.dueDate,
      },
      {
        onSuccess: () => {
          toast.success("Task assigned successfully");
          setTaskForm({ title: "", description: "", assignedTo: "", dueDate: "" });
          setTaskDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const openTaskDialog = (projectId: string) => {
    setTaskProjectId(projectId);
    setTaskForm({ title: "", description: "", assignedTo: "", dueDate: "" });
    setTaskDialogOpen(true);
  };

  const hasProjects = projects.length > 0;

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Set up a new project for your organization</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the project..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!form.name || !form.department || !form.dueDate || createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!hasProjects ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "New Project" to create and assign a project to your team.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              return (
                <Card key={project.id} className="border border-border bg-muted/30">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-foreground truncate">{project.name}</h4>
                      <StatusBadge status={project.status as any} type="project" />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full text-xs h-7"
                      onClick={() => openTaskDialog(project.id)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Assign Task
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {projectTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No tasks yet</p>
                    ) : (
                      <ScrollArea className="max-h-[200px]">
                        <div className="space-y-1.5 mt-2">
                          {projectTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-xs p-2 rounded bg-background/60 border border-border/50"
                            >
                              <div className={cn(
                                "w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center",
                                (task.status === "completed" || task.status === "approved")
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/40"
                              )}>
                                {(task.status === "completed" || task.status === "approved") && (
                                  <svg className="w-2 h-2 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={cn(
                                "truncate flex-1",
                                (task.status === "completed" || task.status === "approved")
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              )}>{task.title}</span>
                              <span className="ml-auto scale-90">
                                <StatusBadge status={task.status as TaskStatus} type="task" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Assign Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Create a task for {projects.find(p => p.id === taskProjectId)?.name || "this project"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                placeholder="Enter task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the task..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={taskForm.assignedTo} onValueChange={(v) => setTaskForm({ ...taskForm, assignedTo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.name} ({m.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignTask} disabled={!taskForm.title || !taskForm.dueDate || createTask.isPending}>
              {createTask.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
