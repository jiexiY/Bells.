import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link2, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUpdateTask } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";

type SubmissionMode = "file" | "link" | "none";

interface SubmitForApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function SubmitForApprovalDialog({ open, onOpenChange, taskId, taskTitle }: SubmitForApprovalDialogProps) {
  const [mode, setMode] = useState<SubmissionMode | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const updateTask = useUpdateTask();
  const { user } = useAuth();

  const reset = () => {
    setMode(null);
    setLinkUrl("");
    setFile(null);
    setUploading(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleSubmit = async () => {
    if (!mode) return;

    try {
      setUploading(true);
      let submissionFileUrl: string | null = null;
      let submissionUrl: string | null = null;

      if (mode === "file" && file) {
        const filePath = `submissions/${taskId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(filePath);
        submissionFileUrl = urlData.publicUrl;
      } else if (mode === "link") {
        submissionUrl = linkUrl;
      }

      updateTask.mutate(
        {
          id: taskId,
          status: "pending_approval" as any,
          submission_type: mode,
          submission_url: submissionUrl,
          submission_file_url: submissionFileUrl,
        } as any,
        {
          onSuccess: () => {
            toast.success("Task submitted for approval");
            handleClose(false);
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to submit");
          },
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = mode === "none" || (mode === "link" && linkUrl.trim()) || (mode === "file" && file);

  const options: { key: SubmissionMode; label: string; description: string; icon: React.ReactNode }[] = [
    { key: "file", label: "Upload a File", description: "Attach a document, image, or other file", icon: <Upload className="w-5 h-5" /> },
    { key: "link", label: "Share a Link", description: "Provide a URL to your work", icon: <Link2 className="w-5 h-5" /> },
    { key: "none", label: "Mark Complete", description: "Submit without any attachment", icon: <CheckCircle className="w-5 h-5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for Approval</DialogTitle>
          <DialogDescription className="line-clamp-1">{taskTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMode(opt.key)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                mode === opt.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40 hover:bg-muted/50 text-foreground"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                mode === opt.key ? "bg-primary/10" : "bg-muted"
              )}>
                {opt.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {mode === "file" && (
          <div className="space-y-2">
            <Label>Choose File</Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>
        )}

        {mode === "link" && (
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || uploading || updateTask.isPending}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Uploading...</> : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
