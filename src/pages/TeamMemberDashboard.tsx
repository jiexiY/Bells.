import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ArrowUpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { TaskRow } from "@/hooks/useTasks";
import type { ProjectRow } from "@/hooks/useProjects";
import type { TaskStatus } from "@/types/project";

function TaskItem({ task, projects, onSubmitForApproval }: { task: TaskRow; projects: ProjectRow[]; onSubmitForApproval?: (taskId: string) => void }) {
  const project = projects.find((p) => p.id === task.project_id);
  const isOverdue = new Date(task.due_date) < new Date() && !["completed", "approved"].includes(task.status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "need_revision": return <XCircle className="w-5 h-5 text-purple-500" />;
      case "pending_approval": return <ArrowUpCircle className="w-5 h-5 text-orange-500" />;
      case "in_progress": return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 mt-0.5">{getStatusIcon(task.status)}</div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-medium text-foreground">{task.title}</h3>
                {project && <p className="text-sm text-muted-foreground">{project.name}</p>}
              </div>
              <StatusBadge status={task.status as TaskStatus} type="task" />
            </div>
            {task.description && <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                {isOverdue && <AlertCircle className="w-3 h-3" />}
              </div>
            </div>
            {task.status === "need_revision" && (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 mt-2">
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <span className="font-medium">Revision Needed:</span> Please revise and resubmit.
                </p>
              </div>
            )}
            {(task.status === "in_progress" || task.status === "need_revision" || task.status === "incomplete") && onSubmitForApproval && (
              <Button size="sm" variant="outline" className="mt-2 gap-1.5"
                onClick={() => onSubmitForApproval(task.id)}>
                <ArrowUpCircle className="w-3.5 h-3.5" />
                Submit for Approval
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamMemberDashboard() {
  const { data: myTasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const incompleteTasks = myTasks.filter((t) => t.status === "incomplete" || t.status === "unchecked");
  const inProgressTasks = myTasks.filter((t) => t.status === "in_progress");
  const pendingApprovalTasks = myTasks.filter((t) => t.status === "pending_approval");
  const needRevisionTasks = myTasks.filter((t) => t.status === "need_revision" || t.status === "declined");
  const completedTasks = myTasks.filter((t) => t.status === "completed" || t.status === "approved");

  const tabs = [
    { key: "all", label: "All", count: myTasks.length },
    { key: "incomplete", label: "Incomplete", count: incompleteTasks.length },
    { key: "in_progress", label: "In Progress", count: inProgressTasks.length },
    { key: "pending_approval", label: "Pending Approval", count: pendingApprovalTasks.length },
    { key: "need_revision", label: "Need Revision", count: needRevisionTasks.length },
    { key: "completed", label: "Completed", count: completedTasks.length },
  ];

  const getActiveList = () => {
    switch (activeTab) {
      case "incomplete": return incompleteTasks;
      case "in_progress": return inProgressTasks;
      case "pending_approval": return pendingApprovalTasks;
      case "need_revision": return needRevisionTasks;
      case "completed": return completedTasks;
      default: return myTasks;
    }
  };

  const filteredList = getActiveList().filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitForApproval = (taskId: string) => {
    updateTask.mutate({ id: taskId, status: "pending_approval" as any });
  };

  const handleStartTask = (taskId: string) => {
    updateTask.mutate({ id: taskId, status: "in_progress" as any });
  };

  if (tasksLoading) {
    return <DashboardLayout title="My Tasks" subtitle="Loading..."><p className="text-muted-foreground">Loading tasks...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title="My Tasks" subtitle="View your assigned tasks and their status">
      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Incomplete</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{incompleteTasks.length}</p></CardContent>
        </Card>
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />In Progress</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{inProgressTasks.length}</p></CardContent>
        </Card>
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><ArrowUpCircle className="w-3.5 h-3.5" />Pending</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{pendingApprovalTasks.length}</p></CardContent>
        </Card>
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />Revision</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{needRevisionTasks.length}</p></CardContent>
        </Card>
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Completed</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{completedTasks.length}</p></CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
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

      {/* Task List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No tasks in this category</p>
            </CardContent>
          </Card>
        ) : (
          filteredList.map((t) => (
            <TaskItem key={t.id} task={t} projects={projects} onSubmitForApproval={handleSubmitForApproval} />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
