import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, ClipboardList, ArrowRight } from "lucide-react";

const roles = [
  {
    title: "Project Lead",
    description: "Full access to all projects, status tracking, progress monitoring, and approval workflows",
    icon: Briefcase,
    href: "/project-lead",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    title: "Team Lead",
    description: "Manage department projects, assign tasks to team members, and review submissions",
    icon: Users,
    href: "/team-lead",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    title: "Team Member",
    description: "View assigned tasks, track task status, and see feedback from team leads",
    icon: ClipboardList,
    href: "/member",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Bells
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Project management platform with role-based dashboards. Select a view to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {roles.map((role) => (
            <Link key={role.href} to={role.href} className="group">
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${role.color}`}>
                    <role.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {role.title}
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          This is a demo showcasing different dashboard views for each role
        </p>
      </div>
    </div>
  );
}
