import { Project } from "@/types/project";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, FileText, Calendar, Users, Copy, Check as CheckIcon } from "lucide-react";
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
  inviteCode?: string;
  showFeedbackActions?: boolean;
  onFeedback?: (projectId: string, feedback: "approved" | "declined", comment: string) => void;
}

export function ProjectCard({ project, inviteCode, showFeedbackActions = false, onFeedback }: ProjectCardProps) {
  const [comment, setComment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"approved" | "declined" | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      {/* Header: Title + Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-foreground truncate text-base">{project.name}</h3>
          <StatusBadge status={project.status} type="project" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="font-semibold text-foreground">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} showLabel={false} size="sm" />
        </div>

        {/* Meta: Members + Due Date */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>3 members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.dueDate)}</span>
          </div>
        </div>

        {/* Lead Role Badge */}
        <div>
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {project.leadName || "Unassigned"}
          </span>
        </div>

        {/* Invite Code */}
        {inviteCode && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <code className="flex-1 text-xs font-mono bg-muted px-2 py-1.5 rounded text-muted-foreground tracking-wider">
              {inviteCode}
            </code>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCopyCode}>
              {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}

        {/* Feedback Actions */}
        {showFeedbackActions && project.status !== "complete" && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
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
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
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
            <Button size="sm" variant="ghost">
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
