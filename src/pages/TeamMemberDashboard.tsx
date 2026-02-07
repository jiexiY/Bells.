import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { mockTasks, mockProjects } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Simulating a team member from the marketing department
const currentMemberId = "m1";

export default function TeamMemberDashboard() {
  // Filter tasks assigned to this member
  const myTasks = mockTasks.filter((t) => t.assignedTo === currentMemberId);

  const uncheckedTasks = myTasks.filter((t) => t.status === "unchecked");
  const approvedTasks = myTasks.filter((t) => t.status === "approved");
  const declinedTasks = myTasks.filter((t) => t.status === "declined");

  const getProject = (projectId: string) =>
    mockProjects.find((p) => p.id === projectId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "declined":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const TaskItem = ({ task }: { task: typeof myTasks[0] }) => {
    const project = getProject(task.projectId);
    const isOverdue = new Date(task.dueDate) < new Date() && task.status === "unchecked";

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-medium text-foreground">{task.title}</h3>
                  {project && (
                    <p className="text-sm text-muted-foreground">
                      {project.name}
                    </p>
                  )}
                </div>
                <StatusBadge status={task.status} type="task" />
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-500"
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  {isOverdue && <AlertCircle className="w-3 h-3" />}
                </div>
              </div>

              {task.status === "declined" && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mt-2">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <span className="font-medium">Feedback:</span> Please revise and resubmit. Check the requirements again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout
      title="My Tasks"
      subtitle="View your assigned tasks and their status"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 lg:mb-8">
        <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{uncheckedTasks.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {approvedTasks.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Needs Revision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
              {declinedTasks.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All Tasks ({myTasks.length})
          </TabsTrigger>
          <TabsTrigger value="unchecked" className="text-xs sm:text-sm">
            Pending ({uncheckedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm">
            Approved ({approvedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="declined" className="text-xs sm:text-sm">
            Declined ({declinedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              myTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="unchecked">
          <div className="space-y-3">
            {uncheckedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">All tasks have been reviewed</p>
                </CardContent>
              </Card>
            ) : (
              uncheckedTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-3">
            {approvedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No approved tasks yet</p>
                </CardContent>
              </Card>
            ) : (
              approvedTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="declined">
          <div className="space-y-3">
            {declinedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-emerald-500/50 mb-4" />
                  <p className="text-muted-foreground">No declined tasks - great work!</p>
                </CardContent>
              </Card>
            ) : (
              declinedTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
