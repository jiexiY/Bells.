import { useState, useCallback } from "react";
import { Plus, FolderPlus, UserPlus, ChevronDown, ChevronRight, ListTodo, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useTasks, useCreateTask, useDeleteTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/project";

interface CreateProjectSectionProps {
  title?: string;
  description?: string;
  statusFilter?: string;
}

export function CreateProjectSection({
  title = "Create Project",
  description = "Create a new project for your team",
  statusFilter,
}: CreateProjectSectionProps) {
  const { user, profileName } = useAuth();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useMembers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    department: "" as "tech" | "marketing" | "research" | "",
    dueDate: "",
  });

  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
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

  const toggleProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId));
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
          <div className="space-y-2">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const isExpanded = expandedProjectId === project.id;

              return (
                <div key={project.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden transition-all">
                  {/* Project Row - Clickable */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex-shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
                        <ListTodo className="w-3 h-3" />
                        {projectTasks.length}
                      </span>
                      <StatusBadge status={project.status as any} type="project" />
                    </div>
                  </button>

                  {/* Expanded Tasks Panel */}
                  {isExpanded && (
                    <div className="border-t border-border bg-background/50 px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="flex items-center justify-between pt-3 pb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tasks ({projectTasks.length})
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDialog(project.id);
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Assign Task
                        </Button>
                      </div>

                      {projectTasks.length === 0 ? (
                        <div className="text-center py-6">
                          <ListTodo className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-xs text-muted-foreground">No tasks assigned yet</p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-[280px]">
                          <div className="space-y-1.5">
                            {projectTasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-3 text-xs p-2.5 rounded-md bg-card border border-border/50 hover:border-border transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className={cn(
                                    "block truncate",
                                    (task.status === "completed" || task.status === "approved")
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  )}>{task.title}</span>
                                  {task.assignee_name && (
                                    <span className="text-[10px] text-muted-foreground">{task.assignee_name}</span>
                                  )}
                                </div>
                                <span className="ml-auto shrink-0 flex items-center gap-1.5">
                                  <StatusBadge status={task.status as TaskStatus} type="task" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTaskId(task.id);
                                    }}
                                    className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
                                    title="Delete task"
                                  >
                                    <X className="w-3.5 h-3.5 text-destructive" />
                                  </button>
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>
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
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => { if (!open) setDeleteTaskId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTaskId) {
                  deleteTask.mutate(deleteTaskId, {
                    onSuccess: () => toast.success("Task deleted"),
                    onError: (err) => toast.error(err.message),
                  });
                }
                setDeleteTaskId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}