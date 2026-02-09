import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderCheck, Clock, CheckCircle2, BarChart3, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProjectLeadDashboard() {
  const { data: projects = [], isLoading } = useProjects();
  const updateProject = useUpdateProject();

  const assignedProjects = projects.filter((p) => p.status === "assigned");
  const inProgressProjects = projects.filter((p) => p.status === "in_progress");
  const completeProjects = projects.filter((p) => p.status === "complete");
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;

  const handleFeedback = (projectId: string, feedback: "approved" | "declined", comment: string) => {
    if (feedback === "approved") {
      updateProject.mutate({ id: projectId, status: "complete", progress: 100 });
    }
  };

  // Map DB rows to ProjectCard's expected shape
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

  if (isLoading) {
    return <DashboardLayout title="Project Lead Dashboard" subtitle="Loading..."><p className="text-muted-foreground">Loading projects...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Project Lead Dashboard" subtitle="Overview of all projects and team progress">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <StatsCard title="Total Projects" value={projects.length} icon={FolderCheck} description="Active this quarter" />
        <StatsCard title="In Progress" value={inProgressProjects.length} icon={Clock} />
        <StatsCard title="Completed" value={completeProjects.length} icon={CheckCircle2} />
        <StatsCard title="Avg. Progress" value={`${avgProgress}%`} icon={BarChart3} description="Across all projects" />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All ({projects.length})</TabsTrigger>
          <TabsTrigger value="assigned" className="text-xs sm:text-sm">Assigned ({assignedProjects.length})</TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Progress ({inProgressProjects.length})</TabsTrigger>
          <TabsTrigger value="complete" className="text-xs sm:text-sm">Complete ({completeProjects.length})</TabsTrigger>
        </TabsList>

        {[
          { value: "all", list: projects },
          { value: "assigned", list: assignedProjects },
          { value: "in_progress", list: inProgressProjects },
        ].map(({ value, list }) => (
          <TabsContent key={value} value={value}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {list.map((p) => (
                <ProjectCard key={p.id} project={toProject(p)} showFeedbackActions onFeedback={handleFeedback} />
              ))}
              {list.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No projects</p>}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="complete">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completeProjects.map((p) => <ProjectCard key={p.id} project={toProject(p)} />)}
            {completeProjects.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No completed projects</p>}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-6 lg:mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Recent Project Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {completeProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Completed on {new Date(p.due_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">Report Available</span>
                </div>
              ))}
              {completeProjects.length === 0 && <p className="text-muted-foreground text-center py-8">No completed projects yet</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
