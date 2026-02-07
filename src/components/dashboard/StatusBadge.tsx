import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProjectStatus, TaskStatus } from "@/types/project";

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus;
  type?: "project" | "task";
}

export function StatusBadge({ status, type = "project" }: StatusBadgeProps) {
  const getVariant = () => {
    if (type === "project") {
      switch (status) {
        case "assigned":
          return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
        case "in_progress":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        case "complete":
          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
        default:
          return "";
      }
    } else {
      switch (status) {
        case "declined":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "approved":
          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
        case "unchecked":
          return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
        default:
          return "";
      }
    }
  };

  const getLabel = () => {
    switch (status) {
      case "assigned":
        return "Assigned";
      case "in_progress":
        return "In Progress";
      case "complete":
        return "Complete";
      case "declined":
        return "Declined";
      case "approved":
        return "Approved";
      case "unchecked":
        return "Pending Review";
      default:
        return status;
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium border-0", getVariant())}
    >
      {getLabel()}
    </Badge>
  );
}
