import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  showLabel = true,
  size = "md",
  className,
}: ProgressBarProps) {
  const getProgressColor = () => {
    if (value >= 75) return "bg-emerald-500";
    if (value >= 50) return "bg-blue-500";
    if (value >= 25) return "bg-amber-500";
    return "bg-slate-400";
  };

  const getHeight = () => {
    switch (size) {
      case "sm":
        return "h-1.5";
      case "lg":
        return "h-3";
      default:
        return "h-2";
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Progress
        value={value}
        className={cn("flex-1", getHeight())}
        style={
          {
            "--progress-color": undefined,
          } as React.CSSProperties
        }
      />
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
          {value}%
        </span>
      )}
    </div>
  );
}
