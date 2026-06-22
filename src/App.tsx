import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Engagement from "@/pages/Engagement";
import AIAssistant from "@/pages/AIAssistant";
import ReportView from "@/pages/ReportView";
import AuthPage from "@/pages/Auth";
import type { User } from "@supabase/supabase-js";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        // If connection fails, proceed to login page
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/clients" 
              element={isAuthenticated ? <Clients /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/engagements" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/engagements/:id" 
              element={isAuthenticated ? <Engagement /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/ai-assistant" 
              element={isAuthenticated ? <AIAssistant /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/reports/:id" 
              element={isAuthenticated ? <ReportView /> : <Navigate to="/login" />} 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
