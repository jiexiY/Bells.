import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/project";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, FileText, Calendar, User } from "lucide-react";
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
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  showFeedbackActions?: boolean;
  onFeedback?: (projectId: string, feedback: "approved" | "declined", comment: string) => void;
}

export function ProjectCard({ project, showFeedbackActions = false, onFeedback }: ProjectCardProps) {
  const [comment, setComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"approved" | "declined" | null>(null);

  const handleFeedback = () => {
    if (feedbackType && onFeedback) {
      onFeedback(project.id, feedbackType, comment);
      setComment("");
      setDialogOpen(false);
      setFeedbackType(null);
    }
  };

  const getDepartmentColor = () => {
    switch (project.department) {
      case "tech":
        return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400";
      case "marketing":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      case "research":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
      default:
        return "";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getDepartmentColor()}`}>
                {project.department}
              </span>
              <StatusBadge status={project.status} type="project" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} showLabel={false} />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{project.leadName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{new Date(project.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        {showFeedbackActions && project.status !== "complete" && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setFeedbackType("approved")}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFeedback}
                    className={
                      feedbackType === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }
                  >
                    {feedbackType === "approved" ? "Approve" : "Decline"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="ghost">
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
