import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";
import "./i18n"; // Initialize i18n
import Navbar from "@/components/navbar";

function ProtectedDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (user.isAdmin) {
    return <Admin />;
  }

  return <Dashboard />;
}

function ProtectedAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (!user.isAdmin) {
    return <Dashboard />;
  }

  return <Admin />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/admin" component={ProtectedAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AnalysisProvider>
            <Toaster />
            <Navbar />
            <Router />
          </AnalysisProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
