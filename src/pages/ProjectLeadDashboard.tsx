import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { mockProjects } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderCheck,
  Clock,
  CheckCircle2,
  BarChart3,
  FileText,
} from "lucide-react";
import { ProjectStatus } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProjectLeadDashboard() {
  const [projects, setProjects] = useState(mockProjects);

  const assignedProjects = projects.filter((p) => p.status === "assigned");
  const inProgressProjects = projects.filter((p) => p.status === "in_progress");
  const completeProjects = projects.filter((p) => p.status === "complete");

  const avgProgress = Math.round(
    projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  );

  const handleFeedback = (
    projectId: string,
    feedback: "approved" | "declined",
    comment: string
  ) => {
    console.log(`Project ${projectId}: ${feedback} - ${comment}`);
    if (feedback === "approved") {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: "complete" as ProjectStatus, progress: 100 } : p
        )
      );
    }
  };

  return (
    <DashboardLayout
      title="Project Lead Dashboard"
      subtitle="Overview of all projects and team progress"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <StatsCard
          title="Total Projects"
          value={projects.length}
          icon={FolderCheck}
          description="Active this quarter"
        />
        <StatsCard
          title="In Progress"
          value={inProgressProjects.length}
          icon={Clock}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Completed"
          value={completeProjects.length}
          icon={CheckCircle2}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Avg. Progress"
          value={`${avgProgress}%`}
          icon={BarChart3}
          description="Across all projects"
        />
      </div>

      {/* Projects by Status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="assigned" className="text-xs sm:text-sm">
            Assigned ({assignedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
            In Progress ({inProgressProjects.length})
          </TabsTrigger>
          <TabsTrigger value="complete" className="text-xs sm:text-sm">
            Complete ({completeProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showFeedbackActions
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assigned">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showFeedbackActions
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in_progress">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inProgressProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showFeedbackActions
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="complete">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reports Section */}
      <Card className="mt-6 lg:mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Project Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {completeProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed on {new Date(project.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                    Report Available
                  </span>
                </div>
              ))}
              {completeProjects.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No completed projects yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
