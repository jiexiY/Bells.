import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/hooks/useTasks";
import type { ProjectRow } from "@/hooks/useProjects";

function TaskItem({ task, projects }: { task: TaskRow; projects: ProjectRow[] }) {
  const project = projects.find((p) => p.id === task.project_id);
  const isOverdue = new Date(task.due_date) < new Date() && task.status === "unchecked";

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "declined": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
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
              <StatusBadge status={task.status} type="task" />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                {isOverdue && <AlertCircle className="w-3 h-3" />}
              </div>
            </div>
            {task.status === "declined" && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mt-2">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <span className="font-medium">Feedback:</span> Please revise and resubmit.
                </p>
              </div>
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

  const uncheckedTasks = myTasks.filter((t) => t.status === "unchecked");
  const approvedTasks = myTasks.filter((t) => t.status === "approved");
  const declinedTasks = myTasks.filter((t) => t.status === "declined");

  if (tasksLoading) {
    return <DashboardLayout title="My Tasks" subtitle="Loading..."><p className="text-muted-foreground">Loading tasks...</p></DashboardLayout>;
  }

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <Card><CardContent className="py-12 text-center"><Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">{message}</p></CardContent></Card>
  );

  return (
    <DashboardLayout title="My Tasks" subtitle="View your assigned tasks and their status">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 lg:mb-8">
        <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" />Pending Review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{uncheckedTasks.length}</p></CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Approved</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{approvedTasks.length}</p></CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2"><XCircle className="w-4 h-4" />Needs Revision</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-700 dark:text-red-400">{declinedTasks.length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Tasks ({myTasks.length})</TabsTrigger>
          <TabsTrigger value="unchecked" className="text-xs sm:text-sm">Pending ({uncheckedTasks.length})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm">Approved ({approvedTasks.length})</TabsTrigger>
          <TabsTrigger value="declined" className="text-xs sm:text-sm">Declined ({declinedTasks.length})</TabsTrigger>
        </TabsList>

        {[
          { value: "all", list: myTasks, emptyIcon: FileText, emptyMsg: "No tasks assigned yet" },
          { value: "unchecked", list: uncheckedTasks, emptyIcon: CheckCircle, emptyMsg: "All tasks have been reviewed" },
          { value: "approved", list: approvedTasks, emptyIcon: FileText, emptyMsg: "No approved tasks yet" },
          { value: "declined", list: declinedTasks, emptyIcon: CheckCircle, emptyMsg: "No declined tasks - great work!" },
        ].map(({ value, list, emptyIcon, emptyMsg }) => (
          <TabsContent key={value} value={value}>
            <div className="space-y-3">
              {list.length === 0 ? <EmptyState icon={emptyIcon} message={emptyMsg} /> : list.map((t) => <TaskItem key={t.id} task={t} projects={projects} />)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}
