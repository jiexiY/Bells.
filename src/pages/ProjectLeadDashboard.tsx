import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { TaskAssignmentSection } from "@/components/dashboard/TaskAssignmentSection";
import { CreateProjectSection } from "@/components/dashboard/CreateProjectSection";
import { ReviewTaskDialog } from "@/components/dashboard/ReviewTaskDialog";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import type { TaskRow } from "@/hooks/useTasks";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanies } from "@/hooks/useCompanies";
import { useMembers } from "@/hooks/useMembers";
import { FolderCheck, Clock, CheckCircle2, Users, Search, CalendarDays, Copy, Check as CheckIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function ProjectLeadDashboard() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks();
  const updateProject = useUpdateProject();
  const [activeTab, setActiveTab] = useState("all");
  const [showCards, setShowCards] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [codeCopied, setCodeCopied] = useState(false);
  const [reviewTask, setReviewTask] = useState<TaskRow | null>(null);
  const { activeCompanyId } = useCompany();
  const { data: companies = [] } = useCompanies();
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const { data: allMembers = [] } = useMembers();
  const teamLeadsAndMembers = allMembers.filter(m => m.role === "team_lead" || m.role === "member");

  const handleCopyInviteCode = () => {
    if (activeCompany?.invite_code) {
      navigator.clipboard.writeText(activeCompany.invite_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Individual tasks = tasks NOT linked to any project
  const individualTasks = tasks.filter((t) => !t.project_id);
  const projectTasks = tasks.filter((t) => projects.some((p) => p.id === t.project_id));

  // Map task statuses to tab categories
  const getTaskTabKey = (status: string): string => {
    switch (status) {
      case "unchecked":
      case "incomplete": return "assigned";
      case "in_progress": return "in_progress";
      case "pending_approval": return "pending_approval";
      case "need_revision":
      case "declined": return "need_revision";
      case "completed":
      case "approved": return "complete";
      default: return "assigned";
    }
  };

  // Combined items (projects + individual tasks)
  type StatusItem = { type: "project"; data: typeof projects[0] } | { type: "task"; data: TaskRow };
  const allItems: StatusItem[] = [
    ...projects.map(p => ({ type: "project" as const, data: p })),
    ...individualTasks.map(t => ({ type: "task" as const, data: t })),
  ];

  const getItemTabKey = (item: StatusItem) =>
    item.type === "project" ? item.data.status : getTaskTabKey(item.data.status);

  const assignedItems = allItems.filter(i => getItemTabKey(i) === "assigned");
  const inProgressItems = allItems.filter(i => getItemTabKey(i) === "in_progress");
  const pendingApprovalItems = allItems.filter(i => getItemTabKey(i) === "pending_approval");
  const needRevisionItems = allItems.filter(i => getItemTabKey(i) === "need_revision");
  const completeItems = allItems.filter(i => getItemTabKey(i) === "complete");

  const getStatusWeight = (status: string) => {
    switch (status) {
      case "complete": case "completed": case "approved": return 100;
      case "pending_approval": return 75;
      case "need_revision": return 55;
      case "in_progress": return 20;
      default: return 0;
    }
  };
  const totalItems = projects.length + individualTasks.length;
  const avgProgress = totalItems > 0
    ? Math.round(
        (projects.reduce((s, p) => s + getStatusWeight(p.status), 0) +
         individualTasks.reduce((s, t) => s + getStatusWeight(t.status), 0)) / totalItems
      )
    : 0;

  const tabs = [
    { key: "all", label: "All", count: allItems.length },
    { key: "assigned", label: "Assigned", count: assignedItems.length },
    { key: "in_progress", label: "In Progress", count: inProgressItems.length },
    { key: "pending_approval", label: "Pending Approval", count: pendingApprovalItems.length },
    { key: "need_revision", label: "Need Revision", count: needRevisionItems.length },
    { key: "complete", label: "Completed", count: completeItems.length },
  ];

  const getActiveItems = (): StatusItem[] => {
    switch (activeTab) {
      case "assigned": return assignedItems;
      case "in_progress": return inProgressItems;
      case "pending_approval": return pendingApprovalItems;
      case "need_revision": return needRevisionItems;
      case "complete": return completeItems;
      default: return allItems;
    }
  };

  const filteredItems = getActiveItems().filter(item => {
    const name = item.type === "project" ? item.data.name : item.data.title;
    const desc = item.type === "project" ? (item.data.description || "") : (item.data.description || "");
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <p className="text-muted-foreground">Loading projects...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Project Lead Dashboard" subtitle="Track projects across your organization">
      {/* Invite Code Banner */}
      {activeCompany?.invite_code && (
        <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 w-fit">
          <span className="text-sm font-medium text-foreground">Workspace Invite Code:</span>
          <code className="text-sm font-mono bg-card px-3 py-1.5 rounded border border-border tracking-widest font-semibold text-primary">
            {activeCompany.invite_code}
          </code>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCopyInviteCode}>
            {codeCopied ? <CheckIcon className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </Button>
        </div>
      )}

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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        <StatsCard title="Total Projects" value={projects.length} icon={FolderCheck} />
        <StatsCard title="Avg. Progress" value={`${avgProgress}%`} icon={CheckCircle2} />
      </div>

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
              onClick={() => {
                if (activeTab === tab.key) {
                  setShowCards(!showCards);
                } else {
                  setActiveTab(tab.key);
                  setShowCards(true);
                }
              }}
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

      {/* Cards for projects and tasks */}
      {showCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {filteredItems.map((item) => {
            if (item.type === "project") {
              const p = item.data;
              const pTasks = projectTasks.filter(t => t.project_id === p.id);
              const completedTasks = pTasks.filter(t => t.status === "completed" || t.status === "approved");
              const taskProgress = pTasks.length ? Math.round((completedTasks.length / pTasks.length) * 100) : 0;
              return (
                <Card key={`project-${p.id}`} className="hover:shadow-md transition-shadow">
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
                        <span className="text-muted-foreground font-medium">Tasks ({completedTasks.length}/{pTasks.length})</span>
                        <span className="font-semibold text-foreground">{taskProgress}%</span>
                      </div>
                      <ProgressBar value={taskProgress} showLabel={false} size="sm" />
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              const t = item.data;
              return (
                <Card
                  key={`task-${t.id}`}
                  className="hover:shadow-md transition-shadow border-l-4 border-l-accent cursor-pointer"
                  onClick={() => setReviewTask(t)}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold text-foreground truncate text-base">{t.title}</h3>
                      </div>
                      <StatusBadge status={t.status as any} type="task" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                    {t.assignee_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{t.assignee_name}</span>
                      </div>
                    )}
                    {t.due_date && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{new Date(t.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
          })}
          {filteredItems.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-12">No items found</p>
          )}
        </div>
      )}

      {/* Projects Section */}
      <CreateProjectSection title="Projects" description="Manage your organization's projects" statusFilter={activeTab} />

      {/* Task Assignment Section */}
      <TaskAssignmentSection
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        assignees={teamLeadsAndMembers.map(m => ({ user_id: m.user_id, name: m.name, role: m.role }))}
        title="Individual Tasks"
        description="Create and assign tasks to team leads and members"
        onTaskClick={(task) => setReviewTask(task)}
      />

      {/* Project Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Project Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg border border-border"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-3">
                {selectedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </h3>
              {(() => {
                const dueDateProjects = projects.filter(p => {
                  const due = new Date(p.due_date);
                  return selectedDate && due.toDateString() === selectedDate.toDateString();
                });
                const dueDateTasks = tasks.filter(t => {
                  const due = new Date(t.due_date);
                  return selectedDate && due.toDateString() === selectedDate.toDateString();
                });
                return dueDateProjects.length > 0 || dueDateTasks.length > 0 ? (
                  <div className="space-y-2">
                    {dueDateProjects.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Project</span>
                      </div>
                    ))}
                    {dueDateTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="text-sm font-medium">{t.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Task</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No events on this date</p>
                );
              })()}
            </div>
          </div>
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
