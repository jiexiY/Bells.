import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, ClipboardList, Menu, X, Briefcase, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profileName, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    role === "project_lead" && { name: "Project Lead", href: "/project-lead", icon: Briefcase },
    role === "team_lead" && { name: "Team Lead", href: "/team-lead", icon: Users },
    role === "member" && { name: "My Tasks", href: "/member", icon: ClipboardList },
  ].filter(Boolean) as { name: string; href: string; icon: any }[];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="bg-background">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      <nav className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:transform-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Bells</span>
            </Link>
          </div>

          <div className="flex-1 p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Dashboard</p>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname === "/";
              return (
                <Link key={item.name} to={item.href} onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}>
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-border space-y-3">
            {profileName && <p className="text-sm font-medium text-foreground px-3">{profileName}</p>}
            <p className="text-xs text-muted-foreground capitalize px-3">{role?.replace("_", " ")}</p>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
