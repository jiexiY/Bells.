import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useProjects } from "@/hooks/useProjects";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderCheck, Clock, CheckCircle2, Users, Plus, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task } from "@/types/project";

export default function TeamLeadDashboard() {
  const { user, department } = useAuth();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: members = [] } = useMembers(department || undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "", projectId: "", dueDate: "" });

  const departmentProjects = projects;
  const departmentTasks = tasks.filter((t) => departmentProjects.some((p) => p.id === t.project_id));

  const uncheckedTasks = departmentTasks.filter((t) => t.status === "unchecked");
  const avgProgress = departmentProjects.length ? Math.round(departmentProjects.reduce((s, p) => s + p.progress, 0) / departmentProjects.length) : 0;

  const handleTaskStatusChange = (taskId: string, status: "approved" | "declined") => {
    updateTask.mutate({ id: taskId, status });
  };

  const handleCreateTask = () => {
    const member = members.find((m) => m.user_id === newTask.assignedTo);
    createTask.mutate({
      title: newTask.title,
      description: newTask.description,
      status: "unchecked",
      project_id: newTask.projectId,
      assigned_to: newTask.assignedTo,
      assigned_by: user?.id || null,
      assignee_name: member?.name || "",
      due_date: newTask.dueDate,
    });
    setNewTask({ title: "", description: "", assignedTo: "", projectId: "", dueDate: "" });
    setDialogOpen(false);
  };

  const toProject = (p: typeof projects[0]) => ({
    id: p.id, name: p.name, description: p.description || "", status: p.status,
    progress: p.progress, leadId: p.lead_id || "", leadName: p.lead_name || "",
    department: p.department, createdAt: p.created_at, dueDate: p.due_date,
  });

  const toTask = (t: typeof tasks[0]): Task => ({
    id: t.id, title: t.title, description: t.description || "", status: t.status,
    projectId: t.project_id, assignedTo: t.assigned_to || "", assignedBy: t.assigned_by || "",
    assigneeName: t.assignee_name || "", dueDate: t.due_date, createdAt: t.created_at,
  });

  if (projectsLoading || tasksLoading) {
    return <DashboardLayout title="Team Lead Dashboard" subtitle="Loading..."><p className="text-muted-foreground">Loading...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Team Lead Dashboard" subtitle={`${(department || "").charAt(0).toUpperCase() + (department || "").slice(1)} Department`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <StatsCard title="Department Projects" value={departmentProjects.length} icon={FolderCheck} />
        <StatsCard title="Pending Review" value={uncheckedTasks.length} icon={Clock} />
        <StatsCard title="Team Members" value={members.length} icon={Users} />
        <StatsCard title="Avg. Progress" value={`${avgProgress}%`} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Department Projects</h2>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All ({departmentProjects.length})</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress</TabsTrigger>
              <TabsTrigger value="pending_approval" className="text-xs sm:text-sm">Pending Approval</TabsTrigger>
              <TabsTrigger value="complete" className="text-xs sm:text-sm">Complete</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentProjects.map((p) => <ProjectCard key={p.id} project={toProject(p)} />)}
              </div>
            </TabsContent>
            {(["in_progress", "pending_approval", "complete"] as const).map((status) => (
              <TabsContent key={status} value={status}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentProjects.filter((p) => p.status === status).map((p) => <ProjectCard key={p.id} project={toProject(p)} />)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task Management</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Assign Task</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign New Task</DialogTitle>
                  <DialogDescription>Create a task and assign it to a team member</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Task Title</Label><Input placeholder="Enter task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Enter task description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={newTask.projectId} onValueChange={(v) => setNewTask({ ...newTask, projectId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>{departmentProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select value={newTask.assignedTo} onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}>
                      <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                      <SelectContent>{members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask}>Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><ListTodo className="w-4 h-4" />Pending Review ({uncheckedTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {uncheckedTasks.map((t) => <TaskCard key={t.id} task={toTask(t)} showActions onStatusChange={handleTaskStatusChange} compact />)}
                  {uncheckedTasks.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No tasks pending review</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
