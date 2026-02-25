import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Settings,
  Activity,
  Bell,
  Shield,
  Building2,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "general", label: "General", icon: Settings },
  { id: "status", label: "Status", icon: Activity },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "workspaces", label: "Workspaces", icon: Building2 },
];

const timezones = [
  "Eastern Time (ET) — UTC-5",
  "Central Time (CT) — UTC-6",
  "Mountain Time (MT) — UTC-7",
  "Pacific Time (PT) — UTC-8",
  "GMT — UTC+0",
  "Central European (CET) — UTC+1",
  "India Standard (IST) — UTC+5:30",
  "Japan Standard (JST) — UTC+9",
];

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  job_title: string;
  timezone: string;
  avatar_url: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    job_title: "",
    timezone: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, phone, bio, job_title, timezone, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            name: data.name || "",
            email: data.email || "",
            phone: (data as any).phone || "",
            bio: (data as any).bio || "",
            job_title: (data as any).job_title || "",
            timezone: (data as any).timezone || "",
            avatar_url: (data as any).avatar_url || "",
          });
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
        job_title: profile.job_title,
        timezone: profile.timezone,
        avatar_url: profile.avatar_url,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
    }
  };

  const nameParts = profile.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const initials = (firstName[0] || "") + (lastName[0] || "");

  const setFirstName = (v: string) =>
    setProfile((p) => ({ ...p, name: `${v} ${lastName}`.trim() }));
  const setLastName = (v: string) =>
    setProfile((p) => ({ ...p, name: `${firstName} ${v}`.trim() }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">W</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Active
          </span>
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-muted text-xs font-medium">
              {initials.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex max-w-6xl mx-auto">
        {/* Sidebar */}
        <nav className="w-60 shrink-0 border-r min-h-[calc(100vh-65px)] p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-8">
          {activeTab === "profile" && (
            <div className="bg-card border rounded-xl p-8 max-w-3xl">
              <h2 className="text-xl font-semibold text-foreground">Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage how others see you in your workspace.
              </p>

              <Separator className="my-6" />

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {initials.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-card border flex items-center justify-center shadow-sm hover:bg-muted transition-colors">
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-foreground">Profile photo</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG or GIF. Max 5MB.</p>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              {/* Job title */}
              <div className="space-y-2 mb-6 max-w-sm">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Job title
                </Label>
                <Input
                  value={profile.job_title}
                  onChange={(e) => setProfile((p) => ({ ...p, job_title: e.target.value }))}
                  placeholder="e.g. Product Designer"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2 mb-1">
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">Brief description for your profile.</p>
              </div>

              {/* Timezone */}
              <div className="space-y-2 mb-8 max-w-sm mt-6">
                <Label>Time zone</Label>
                <Select
                  value={profile.timezone}
                  onValueChange={(v) => setProfile((p) => ({ ...p, timezone: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="mb-6" />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          )}

          {activeTab !== "profile" && (
            <div className="bg-card border rounded-xl p-8 max-w-3xl flex items-center justify-center min-h-[300px]">
              <p className="text-muted-foreground">
                {sidebarItems.find((s) => s.id === activeTab)?.label} settings coming soon.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
