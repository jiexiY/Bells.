import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Mail, Phone, Building2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "project_lead" | "team_lead" | "member";
type Department = "tech" | "marketing" | "research";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginContactMethod, setLoginContactMethod] = useState<"email" | "phone">("email");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<AppRole>("member");
  const [signupDepartment, setSignupDepartment] = useState<Department>("tech");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = loginContactMethod === "email" ? loginEmail : `${loginPhone}@phone.placeholder`;
      await signIn(email, loginPassword);
      navigate("/companies");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = contactMethod === "email" ? signupEmail : `${signupPhone}@phone.placeholder`;
      const dept = signupRole !== "project_lead" ? signupDepartment : undefined;
      await signUp(email, signupPassword, signupName, signupRole, dept);
      toast({ title: "Check your email!", description: "We sent you a confirmation link. Please verify your email to log in." });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: `${provider} login failed`, description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = () => {
    toast({ title: "SSO Coming Soon", description: "Organization SSO login will be available in a future update." });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset link sent", description: "Check your email for the password reset link." });
      setShowForgotPassword(false);
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Bells</h1>
          </div>
          <p className="text-muted-foreground">Log in to access your dashboard</p>
        </div>

        {showForgotPassword ? (
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                  Back to Log In
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Log In</CardTitle>
                  <CardDescription>Choose your preferred login method</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full gap-2" onClick={() => handleOAuth("google")} disabled={loading}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => handleOAuth("apple")} disabled={loading}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.31-3.74 4.25z"/></svg>
                      Apple
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full gap-2" onClick={handleSSO} disabled={loading}>
                    <Building2 className="h-4 w-4" />
                    Log in with SSO (Organization)
                  </Button>

                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or continue manually
                    </span>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Contact method toggle */}
                    <div className="space-y-2">
                      <Label>Contact Method</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={loginContactMethod === "email" ? "default" : "outline"} size="sm" className="flex-1 gap-1" onClick={() => setLoginContactMethod("email")}>
                          <Mail className="h-3.5 w-3.5" /> Email
                        </Button>
                        <Button type="button" variant={loginContactMethod === "phone" ? "default" : "outline"} size="sm" className="flex-1 gap-1" onClick={() => setLoginContactMethod("phone")}>
                          <Phone className="h-3.5 w-3.5" /> Phone
                        </Button>
                      </div>
                    </div>

                    {loginContactMethod === "email" ? (
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input type="tel" placeholder="+1 (555) 000-0000" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} required />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowForgotPassword(true)}>
                          Forgot password?
                        </button>
                      </div>
                      <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Logging in..." : "Log In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Set up your account with your role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full gap-2" onClick={() => handleOAuth("google")} disabled={loading}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => handleOAuth("apple")} disabled={loading}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.31-3.74 4.25z"/></svg>
                      Apple
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full gap-2" onClick={handleSSO} disabled={loading}>
                    <Building2 className="h-4 w-4" />
                    Sign up with SSO (Organization)
                  </Button>

                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or continue manually
                    </span>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Method</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={contactMethod === "email" ? "default" : "outline"} size="sm" className="flex-1 gap-1" onClick={() => setContactMethod("email")}>
                          <Mail className="h-3.5 w-3.5" /> Email
                        </Button>
                        <Button type="button" variant={contactMethod === "phone" ? "default" : "outline"} size="sm" className="flex-1 gap-1" onClick={() => setContactMethod("phone")}>
                          <Phone className="h-3.5 w-3.5" /> Phone
                        </Button>
                      </div>
                    </div>

                    {contactMethod === "email" ? (
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input type="tel" placeholder="+1 (555) 000-0000" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} required />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={signupRole} onValueChange={(v) => setSignupRole(v as AppRole)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project_lead">Project Lead</SelectItem>
                          <SelectItem value="team_lead">Team Lead</SelectItem>
                          <SelectItem value="member">Team Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {signupRole !== "project_lead" && (
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={signupDepartment} onValueChange={(v) => setSignupDepartment(v as Department)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tech">Tech</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="research">Research</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
