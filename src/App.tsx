import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CompanyPortal from "./pages/CompanyPortal";
import ProjectLeadDashboard from "./pages/ProjectLeadDashboard";
import TeamLeadDashboard from "./pages/TeamLeadDashboard";
import TeamMemberDashboard from "./pages/TeamMemberDashboard";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

function RoleRouter() {
  const { user, loading } = useAuth();
  const { activeCompanyId, activeRole } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!activeCompanyId) return <Navigate to="/companies" replace />;

  switch (activeRole) {
    case "project_lead":
      return <ProjectLeadDashboard />;
    case "team_lead":
      return <TeamLeadDashboard />;
    case "member":
      return <TeamMemberDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">No role assigned for this organization. Please contact an administrator.</p>
        </div>
      );
  }
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  const { activeRole } = useCompany();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (allowedRoles && activeRole && !allowedRoles.includes(activeRole)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/companies" element={<ProtectedRoute><CompanyPortal /></ProtectedRoute>} />
                <Route path="/" element={<RoleRouter />} />
                <Route path="/project-lead" element={<ProtectedRoute><ProjectLeadDashboard /></ProtectedRoute>} />
                <Route path="/team-lead" element={<ProtectedRoute><TeamLeadDashboard /></ProtectedRoute>} />
                <Route path="/member" element={<ProtectedRoute><TeamMemberDashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
