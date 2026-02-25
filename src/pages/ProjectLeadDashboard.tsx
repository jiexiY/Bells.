import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { FolderCheck, Clock, CheckCircle2, BarChart3, Search, CalendarDays, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProjectLeadDashboard() {
  const { data: projects = [], isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const assignedProjects = projects.filter((p) => p.status === "assigned");
  const inProgressProjects = projects.filter((p) => p.status === "in_progress");
  const pendingApprovalProjects = projects.filter((p) => p.status === "pending_approval");
  const completeProjects = projects.filter((p) => p.status === "complete");
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
  const completionRate = projects.length ? Math.round((completeProjects.length / projects.length) * 100) : 0;

  const handleFeedback = (projectId: string, feedback: "approved" | "declined", comment: string) => {
    if (feedback === "approved") {
      updateProject.mutate({ id: projectId, status: "complete", progress: 100 });
    }
  };

  const toProject = (p: typeof projects[0]) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    status: p.status,
    progress: p.progress,
    leadId: p.lead_id || "",
    leadName: p.lead_name || "",
    department: p.department,
    createdAt: p.created_at,
    dueDate: p.due_date,
  });

  const tabs = [
    { key: "all", label: "All", list: projects },
    { key: "in_progress", label: "In Progress", list: inProgressProjects },
    { key: "pending_approval", label: "Pending Approval", list: pendingApprovalProjects },
    { key: "complete", label: "Completed", list: completeProjects },
  ];

  const activeList = tabs.find(t => t.key === activeTab)?.list || projects;
  const filteredList = activeList.filter(p =>
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
    <DashboardLayout title="Dashboard" subtitle="Track projects across your organization">
      {/* Search bar */}
      <div className="flex items-center justify-end mb-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Projects" value={projects.length} icon={FolderCheck} description={`↑ ${projects.length} this month`} />
        <StatsCard title="Completed" value={completeProjects.length} icon={CheckCircle2} description={`${completionRate}% completion rate`} />
        <StatsCard title="In Progress" value={inProgressProjects.length} icon={Clock} />
        <StatsCard title="Avg. Progress" value={`${avgProgress}%`} icon={BarChart3} trend={{ value: 5, isPositive: true }} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredList.map((p) => (
          <ProjectCard
            key={p.id}
            project={toProject(p)}
            inviteCode={p.invite_code}
            showFeedbackActions={activeTab !== "complete"}
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Project Calendar
            </CardTitle>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Event
            </Button>
          </div>
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
              {/* Show projects due on selected date */}
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
    </DashboardLayout>
  );
}
