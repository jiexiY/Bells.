import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { FolderCheck, Clock, CheckCircle2, AlertCircle, RotateCcw, XCircle, FileText, Calendar, Users, Hourglass } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TaskStatusItem {
  key: string;
  label: string;
  color: string;
  count: number;
}

interface ProjectTaskStatusCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    lead_name: string | null;
    due_date: string;
  };
  tasks: Array<{ status: string }>;
  showFeedbackActions?: boolean;
  onFeedback?: (projectId: string, feedback: "approved" | "declined", comment: string) => void;
}

const taskStatuses = [
  { key: "unchecked", label: "Unchecked", color: "bg-slate-400" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { key: "pending_approval", label: "Pending", color: "bg-orange-500" },
  { key: "need_revision", label: "Revision", color: "bg-purple-500" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
  { key: "approved", label: "Approved", color: "bg-green-600" },
  { key: "declined", label: "Declined", color: "bg-red-500" },
  { key: "incomplete", label: "Incomplete", color: "bg-amber-500" },
];

export function ProjectTaskStatusCard({ project, tasks, showFeedbackActions, onFeedback }: ProjectTaskStatusCardProps) {
  const [comment, setComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"approved" | "declined" | null>(null);

  const total = tasks.length;
  const counts: TaskStatusItem[] = taskStatuses
    .map(s => ({ ...s, count: tasks.filter(t => t.status === s.key).length }))
    .filter(s => s.count > 0);

  const handleFeedback = () => {
    if (feedbackType && onFeedback) {
      onFeedback(project.id, feedbackType, comment);
      setComment("");
      setDialogOpen(false);
      setFeedbackType(null);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base truncate">{project.name}</CardTitle>
          <StatusBadge status={project.status} type="project" />
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{project.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Due {formatDate(project.due_date)}
          </span>
          {project.lead_name && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {project.lead_name}
            </span>
          )}
          <span>{total} task{total !== 1 ? "s" : ""}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground text-xs">Progress</span>
            <span className="font-semibold text-xs">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} showLabel={false} size="sm" />
        </div>

        {/* Task status bar */}
        {total > 0 && (
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
            {counts.map(s => (
              <div
                key={s.key}
                className={cn("transition-all duration-500", s.color)}
                style={{ width: `${(s.count / total) * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {counts.map(s => (
            <div key={s.key} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <div className={cn("w-2 h-2 rounded-full shrink-0", s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-xs font-semibold text-foreground">{s.count}</span>
            </div>
          ))}
          {total === 0 && (
            <span className="text-xs text-muted-foreground">No tasks assigned yet</span>
          )}
        </div>

        {/* Feedback Actions */}
        {showFeedbackActions && project.status === "pending_approval" && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setFeedbackType("approved")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-red-50"
                  onClick={() => setFeedbackType("declined")}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Decline
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {feedbackType === "approved" ? "Approve" : "Decline"} Project
                  </DialogTitle>
                  <DialogDescription>
                    Provide feedback for "{project.name}"
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Add your comments..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleFeedback}
                    className={
                      feedbackType === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-destructive hover:bg-destructive/90"
                    }
                  >
                    {feedbackType === "approved" ? "Approve" : "Decline"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
