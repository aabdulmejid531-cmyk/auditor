import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Mail, Lock, User, Building, Phone, Loader2, AlertCircle, WifiOff } from "lucide-react";
import * as Sonner from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmNote, setShowEmailConfirmNote] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false);
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register states
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowEmailConfirmNote(false);
    setShowConnectionError(false);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check for network/fetch errors
        if (error.message === "Failed to fetch" || error.message.includes("fetch") || error.name === "TypeError") {
          setShowConnectionError(true);
          Sonner.toast.error("Cannot connect to server. Please check your internet connection or try again later.");
        } else if (error.message === "Invalid login credentials" || error.message === "Email not confirmed") {
          setShowEmailConfirmNote(true);
          Sonner.toast.error(
            "Login failed. If you just registered, please check your email to confirm your account, or disable email confirmation in Supabase dashboard."
          );
        } else {
          Sonner.toast.error("Login failed: " + error.message);
        }
      } else {
        Sonner.toast.success("Welcome back to AuditFlow!");
        navigate("/dashboard");
      }
    } catch (err) {
      setShowConnectionError(true);
      Sonner.toast.error("Connection error. Please check your internet connection and try again.");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowEmailConfirmNote(false);
    setShowConnectionError(false);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: fullName,
            firm_name: firmName,
            phone: phone,
          },
        },
      });

      if (error) {
        // Check for network/fetch errors
        if (error.message === "Failed to fetch" || error.message.includes("fetch") || error.name === "TypeError") {
          setShowConnectionError(true);
          Sonner.toast.error("Cannot connect to server. Please check your internet connection or try again later.");
        } else {
          Sonner.toast.error("Registration failed: " + error.message);
        }
      } else {
        if (data.session) {
          // Session exists - email confirmation not required, go straight to dashboard
          Sonner.toast.success("Registration successful! Welcome to AuditFlow.");
          navigate("/dashboard");
        } else {
          // No session means email confirmation is required by Supabase
          // Try to sign in immediately in case confirmation was recently disabled
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: regEmail,
            password: regPassword,
          });
          if (!signInError && signInData.session) {
            Sonner.toast.success("Registration successful! Welcome to AuditFlow.");
            navigate("/dashboard");
          } else {
            // Email confirmation is required
            setShowEmailConfirmNote(true);
            Sonner.toast.info(
              "Account created! Please check your email to confirm your account. If you don't receive an email, disable email confirmation in Supabase dashboard."
            );
          }
        }
      }
    } catch (err) {
      setShowConnectionError(true);
      Sonner.toast.error("Connection error. Please check your internet connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-primary p-3 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AuditFlow Ethiopia</h1>
          <p className="text-muted-foreground mt-2">The AI-Powered Workflow for Modern Auditors</p>
        </div>

        {showConnectionError && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
              <strong>Connection Error:</strong> Unable to reach the server. This could mean:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Your internet connection is down</li>
                <li>The Supabase project is paused (free tier projects pause after inactivity)</li>
                <li>There's a temporary service outage</li>
              </ul>
              <p className="mt-2">
                <strong>To fix:</strong> Check your internet connection, or go to your <strong>Supabase Dashboard</strong> and restore/wake up your project if it's paused.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {showEmailConfirmNote && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>Email confirmation required:</strong> Supabase is configured to require email confirmation. 
              To fix this, go to your <strong>Supabase Dashboard → Authentication → Settings</strong> and 
              disable <strong>"Enable email confirmations"</strong> under Email Settings.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your engagements.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="auditor@firm.com" 
                        className="pl-10" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" 
                        className="pl-10" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join AuditFlow to start managing your engagements.</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="full_name" 
                        placeholder="Abebe Kebede" 
                        className="pl-10" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firm_name">Audit Firm Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="firm_name" 
                        placeholder="Audit Services PLC" 
                        className="pl-10" 
                        value={firmName}
                        onChange={(e) => setFirmName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        placeholder="+251 ..." 
                        className="pl-10" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg_email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="reg_email" 
                        type="email" 
                        placeholder="auditor@firm.com" 
                        className="pl-10" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg_password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="reg_password" 
                        type="password" 
                        placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" 
                        className="pl-10" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
                    Create Auditor Profile
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
        
        <p className="text-center text-xs text-muted-foreground">
          AuditFlow Ethiopia strictly follows IFRS standards and local proclamations.
        </p>
      </div>
    </div>
  );
}
