import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { TaskAssignmentSection } from "@/components/dashboard/TaskAssignmentSection";
import { CreateProjectSection } from "@/components/dashboard/CreateProjectSection";
import { ProjectStatusTracker } from "@/components/dashboard/ProjectStatusTracker";
import { ReviewTaskDialog } from "@/components/dashboard/ReviewTaskDialog";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import type { TaskRow } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { FolderCheck, Clock, CheckCircle2, Users, ListTodo, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const updateTask = useUpdateTask();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewTask, setReviewTask] = useState<TaskRow | null>(null);

  const departmentProjects = projects;
  const departmentTasks = tasks.filter((t) => departmentProjects.some((p) => p.id === t.project_id));

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

      {/* Create Project Section */}
      <CreateProjectSection />

      {/* Project Status Tracker */}
      <ProjectStatusTracker projects={departmentProjects} />

      {/* Task Assignment Section */}
      <TaskAssignmentSection
        projects={departmentProjects.map(p => ({ id: p.id, name: p.name }))}
        assignees={members.map(m => ({ user_id: m.user_id, name: m.name, role: m.role }))}
        title="Assign Individual Task"
        description="Create and assign individual tasks to your team members"
        onTaskClick={(task) => setReviewTask(task)}
      />

      {/* Project Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {tabs.map((tab) => {
          const colorMap: Record<string, string> = {
            all: "bg-primary",
            assigned: "bg-amber-500",
            in_progress: "bg-blue-500",
            pending_approval: "bg-orange-500",
            need_revision: "bg-purple-500",
            complete: "bg-emerald-500",
          };
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-colors border",
                activeTab === tab.key
                  ? "bg-muted border-primary/40 shadow-sm"
                  : "bg-muted/50 border-border hover:bg-muted/80"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", colorMap[tab.key] || "bg-primary")} />
              <div className="min-w-0 text-left">
                <p className="text-xs text-muted-foreground truncate">{tab.label}</p>
                <p className="text-sm font-semibold text-foreground">{tab.count}</p>
              </div>
            </button>
          );
        })}
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

      {/* Task Review Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Task Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {departmentTasks.map((t) => (
                 <div key={t.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border",
                      t.status === "pending_approval" && "cursor-pointer hover:bg-muted/50 transition-colors"
                    )}
                    onClick={() => t.status === "pending_approval" && setReviewTask(t)}
                  >
                   <div className="flex-1 min-w-0 space-y-1">
                     <div className="flex items-center gap-2 flex-wrap">
                       <h4 className="font-medium text-foreground text-sm">{t.title}</h4>
                       <StatusBadge status={t.status as TaskStatus} type="task" />
                     </div>
                     <p className="text-xs text-muted-foreground">{t.assignee_name || "Unassigned"} · Due {new Date(t.due_date).toLocaleDateString()}</p>
                   </div>
                   {(t.status === "pending_approval") && (
                     <div className="flex items-center gap-1 ml-3">
                       <Button size="sm" variant="outline" className="text-primary hover:bg-primary/10 h-8 px-2"
                         onClick={(e) => { e.stopPropagation(); setReviewTask(t); }}>
                         Review
                       </Button>
                     </div>
                   )}
                 </div>
               ))}
               {departmentTasks.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No tasks yet.</p>}
             </div>
           </ScrollArea>
         </CardContent>
       </Card>

       {/* Review Dialog */}
       {reviewTask && (
         <ReviewTaskDialog
           open={!!reviewTask}
           onOpenChange={(open) => { if (!open) setReviewTask(null); }}
           task={reviewTask}
         />
       )}
     </DashboardLayout>
   );
 }
