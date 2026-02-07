import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { mockProjects, mockTasks, mockTeamMembers } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderCheck,
  Clock,
  CheckCircle2,
  Users,
  Plus,
  ListTodo,
} from "lucide-react";
import { TaskStatus, ProjectStatus } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Simulating a team lead from the marketing department
const currentLeadId = "tl1";
const currentDepartment = "marketing";

export default function TeamLeadDashboard() {
  const [tasks, setTasks] = useState(mockTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    projectId: "",
    dueDate: "",
  });

  // Filter projects and tasks for this department
  const departmentProjects = mockProjects.filter(
    (p) => p.department === currentDepartment
  );
  const departmentTasks = tasks.filter((t) =>
    departmentProjects.some((p) => p.id === t.projectId)
  );
  const teamMembers = mockTeamMembers.filter(
    (m) => m.role === "member" && m.department === currentDepartment
  );

  const uncheckedTasks = departmentTasks.filter((t) => t.status === "unchecked");
  const approvedTasks = departmentTasks.filter((t) => t.status === "approved");
  const declinedTasks = departmentTasks.filter((t) => t.status === "declined");

  const avgProgress = Math.round(
    departmentProjects.reduce((sum, p) => sum + p.progress, 0) /
      departmentProjects.length || 0
  );

  const handleTaskStatusChange = (taskId: string, status: "approved" | "declined") => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: status as TaskStatus } : t
      )
    );
  };

  const handleCreateTask = () => {
    const member = teamMembers.find((m) => m.id === newTask.assignedTo);
    const task = {
      id: `t${Date.now()}`,
      ...newTask,
      status: "unchecked" as TaskStatus,
      assignedBy: currentLeadId,
      assigneeName: member?.name || "",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTasks((prev) => [...prev, task]);
    setNewTask({ title: "", description: "", assignedTo: "", projectId: "", dueDate: "" });
    setDialogOpen(false);
  };

  return (
    <DashboardLayout
      title="Team Lead Dashboard"
      subtitle={`${currentDepartment.charAt(0).toUpperCase() + currentDepartment.slice(1)} Department`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
        <StatsCard
          title="Department Projects"
          value={departmentProjects.length}
          icon={FolderCheck}
        />
        <StatsCard
          title="Pending Review"
          value={uncheckedTasks.length}
          icon={Clock}
        />
        <StatsCard
          title="Team Members"
          value={teamMembers.length}
          icon={Users}
        />
        <StatsCard
          title="Avg. Progress"
          value={`${avgProgress}%`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Projects Column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Department Projects</h2>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({departmentProjects.length})
              </TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs sm:text-sm">
                Assigned
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
                In Progress
              </TabsTrigger>
              <TabsTrigger value="complete" className="text-xs sm:text-sm">
                Complete
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            {["assigned", "in_progress", "complete"].map((status) => (
              <TabsContent key={status} value={status}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentProjects
                    .filter((p) => p.status === status)
                    .map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Tasks Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task Management</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Assign Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign New Task</DialogTitle>
                  <DialogDescription>
                    Create a task and assign it to a team member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      placeholder="Enter task title"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Enter task description"
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select
                      value={newTask.projectId}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, projectId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select
                      value={newTask.assignedTo}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, assignedTo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Pending Review ({uncheckedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {uncheckedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showActions
                      onStatusChange={handleTaskStatusChange}
                      compact
                    />
                  ))}
                  {uncheckedTasks.length === 0 && (
                    <p className="text-muted-foreground text-center py-8 text-sm">
                      No tasks pending review
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
