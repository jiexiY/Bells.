import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectTaskStatusCard } from "@/components/dashboard/ProjectTaskStatusCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TaskAssignmentSection } from "@/components/dashboard/TaskAssignmentSection";
import { CreateProjectSection } from "@/components/dashboard/CreateProjectSection";
import { ProjectStatusTracker } from "@/components/dashboard/ProjectStatusTracker";
import { ReviewTaskDialog } from "@/components/dashboard/ReviewTaskDialog";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import type { TaskRow } from "@/hooks/useTasks";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanies } from "@/hooks/useCompanies";
import { useMembers } from "@/hooks/useMembers";
import { FolderCheck, Clock, CheckCircle2, BarChart3, Search, CalendarDays, Copy, Check as CheckIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProjectLeadDashboard() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useTasks();
  const updateProject = useUpdateProject();
  const [activeTab, setActiveTab] = useState("all");
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

  const assignedProjects = projects.filter((p) => p.status === "assigned");
  const inProgressProjects = projects.filter((p) => p.status === "in_progress");
  const pendingApprovalProjects = projects.filter((p) => p.status === "pending_approval");
  const completeProjects = projects.filter((p) => p.status === "complete");
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const completionRate = projects.length ? Math.round((completeProjects.length / projects.length) * 100) : 0;

  const handleFeedback = (projectId: string, feedback: "approved" | "declined", comment: string) => {
    if (feedback === "approved") {
      updateProject.mutate({ id: projectId, status: "complete", progress: 100 });
    } else {
      updateProject.mutate({ id: projectId, status: "need_revision" as any });
    }
  };

  const toProject = (p: typeof projects[0]) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    status: p.status as any,
    progress: p.progress,
    leadId: p.lead_id || "",
    leadName: p.lead_name || "",
    department: p.department,
    createdAt: p.created_at,
    dueDate: p.due_date,
  });

  const tabs = [
    { key: "all", label: "All", count: projects.length },
    { key: "assigned", label: "Assigned", count: assignedProjects.length },
    { key: "in_progress", label: "In Progress", count: inProgressProjects.length },
    { key: "pending_approval", label: "Pending Approval", count: pendingApprovalProjects.length },
    { key: "complete", label: "Completed", count: completeProjects.length },
  ];

  const getActiveList = () => {
    switch (activeTab) {
      case "assigned": return assignedProjects;
      case "in_progress": return inProgressProjects;
      case "pending_approval": return pendingApprovalProjects;
      case "complete": return completeProjects;
      default: return projects;
    }
  };

  const filteredList = getActiveList().filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatsCard title="Total Projects" value={projects.length} icon={FolderCheck} description={`${assignedProjects.length} assigned`} />
        <StatsCard title="Completed" value={completeProjects.length} icon={CheckCircle2} description={`${completionRate}% completion rate`} />
        <StatsCard title="In Progress" value={inProgressProjects.length} icon={Clock} />
        <StatsCard title="Avg. Progress" value={`${avgProgress}%`} icon={BarChart3} />
      </div>

      {/* Create Project Section */}
      <CreateProjectSection />

      {/* Project Status Tracker */}
      <ProjectStatusTracker projects={projects} />

      {/* Task Assignment Section */}
      <TaskAssignmentSection
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        assignees={teamLeadsAndMembers.map(m => ({ user_id: m.user_id, name: m.name, role: m.role }))}
        title="Assign Individual Task"
        description="Create and assign individual tasks to team leads and members"
        onTaskClick={(task) => setReviewTask(task)}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({tab.count})
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {filteredList.map((p) => (
          <ProjectCard
            key={p.id}
            project={toProject(p)}
            showFeedbackActions={p.status === "pending_approval"}
            onFeedback={handleFeedback}
          />
        ))}
        {filteredList.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">No projects found</p>
        )}
      </div>

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
              {projects.filter(p => {
                const due = new Date(p.due_date);
                return selectedDate && due.toDateString() === selectedDate.toDateString();
              }).length > 0 ? (
                <div className="space-y-2">
                  {projects.filter(p => {
                    const due = new Date(p.due_date);
                    return selectedDate && due.toDateString() === selectedDate.toDateString();
                  }).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No events on this date</p>
              )}
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
