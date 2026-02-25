import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { FolderCheck, Clock, CheckCircle2, Users, Plus, ListTodo, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/project";

export default function TeamLeadDashboard() {
  const { user, department } = useAuth();
  const { activeDepartment } = useCompany();
  const dept = activeDepartment || department;
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const updateProject = useUpdateProject();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: members = [] } = useMembers(dept || undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "", projectId: "", dueDate: "" });

  const departmentProjects = projects;
  const departmentTasks = tasks.filter((t) => departmentProjects.some((p) => p.id === t.project_id));

  // Project status counts
  const assignedProjects = departmentProjects.filter((p) => p.status === "assigned");
  const inProgressProjects = departmentProjects.filter((p) => p.status === "in_progress");
  const pendingApprovalProjects = departmentProjects.filter((p) => p.status === "pending_approval");
  const needRevisionProjects = departmentProjects.filter((p) => p.status === "need_revision");
  const completeProjects = departmentProjects.filter((p) => p.status === "complete");
  const avgProgress = departmentProjects.length ? Math.round(departmentProjects.reduce((s, p) => s + p.progress, 0) / departmentProjects.length) : 0;

  const tabs = [
    { key: "all", label: "All", count: departmentProjects.length },
    { key: "assigned", label: "Assigned", count: assignedProjects.length },
    { key: "in_progress", label: "In Progress", count: inProgressProjects.length },
    { key: "pending_approval", label: "Pending Approval", count: pendingApprovalProjects.length },
    { key: "need_revision", label: "Need Revision", count: needRevisionProjects.length },
    { key: "complete", label: "Completed", count: completeProjects.length },
  ];

  const getActiveList = () => {
    switch (activeTab) {
      case "assigned": return assignedProjects;
      case "in_progress": return inProgressProjects;
      case "pending_approval": return pendingApprovalProjects;
      case "need_revision": return needRevisionProjects;
      case "complete": return completeProjects;
      default: return departmentProjects;
    }
  };

  const filteredList = getActiveList().filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTaskStatusChange = (taskId: string, status: string) => {
    updateTask.mutate({ id: taskId, status: status as any });
  };

  const handleCreateTask = () => {
    const member = members.find((m) => m.user_id === newTask.assignedTo);
    createTask.mutate({
      title: newTask.title,
      description: newTask.description,
      status: "incomplete",
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

  if (projectsLoading || tasksLoading) {
    return <DashboardLayout title="Team Lead Dashboard" subtitle="Loading..."><p className="text-muted-foreground">Loading...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Team Lead Dashboard" subtitle={`${(dept || "").charAt(0).toUpperCase() + (dept || "").slice(1)} Department`}>
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatsCard title="Department Projects" value={departmentProjects.length} icon={FolderCheck} />
        <StatsCard title="In Progress" value={inProgressProjects.length} icon={Clock} />
        <StatsCard title="Team Members" value={members.length} icon={Users} />
        <StatsCard title="Avg. Progress" value={`${avgProgress}%`} icon={CheckCircle2} />
      </div>

      {/* Project Status Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({tab.count})
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Project Cards with task progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {filteredList.map((p) => {
          const projectTasks = departmentTasks.filter(t => t.project_id === p.id);
          const completedTasks = projectTasks.filter(t => t.status === "completed" || t.status === "approved");
          const taskProgress = projectTasks.length ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
          return (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate text-base">{p.name}</h3>
                  <StatusBadge status={p.status as any} type="project" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground font-medium">Project Progress</span>
                    <span className="font-semibold text-foreground">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} showLabel={false} size="sm" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground font-medium">Tasks ({completedTasks.length}/{projectTasks.length})</span>
                    <span className="font-semibold text-foreground">{taskProgress}%</span>
                  </div>
                  <ProgressBar value={taskProgress} showLabel={false} size="sm" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredList.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">No projects found</p>
        )}
      </div>

      {/* Task Management Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Sub-Task Management
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Assign Task</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>Create a sub-task and assign it to a team member</DialogDescription>
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
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {departmentTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground text-sm">{t.title}</h4>
                      <StatusBadge status={t.status as TaskStatus} type="task" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t.assignee_name || "Unassigned"} · Due {new Date(t.due_date).toLocaleDateString()}</p>
                  </div>
                  {(t.status === "pending_approval") && (
                    <div className="flex items-center gap-1 ml-3">
                      <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 px-2"
                        onClick={() => handleTaskStatusChange(t.id, "completed")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                        onClick={() => handleTaskStatusChange(t.id, "need_revision")}>
                        Revise
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {departmentTasks.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No tasks yet. Assign tasks to your team members.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
