import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/AdminLogin";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Registry from "./pages/Registry";
import Orchestrator from "./pages/Orchestrator";
import CostCalculator from "./pages/CostCalculator";
import Templates from "./pages/Templates";
import Architecture from "./pages/Architecture";
import Integrations from "./pages/Integrations";
import SemanticSearch from "./pages/SemanticSearch";
import AIControlCenter from "./pages/AIControlCenter";
import SentinelMonitor from "./pages/SentinelMonitor";
import AutoDeploy from "./pages/AutoDeploy";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Zap } from "lucide-react";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";

/**
 * AuthGate — blokuje dostęp do całego dashboardu dla niezalogowanych.
 * Niezalogowany użytkownik widzi tylko stronę AdminLogin.
 * Zalogowany, ale nie-admin widzi komunikat o braku uprawnień.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Ładowanie sesji
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  // Niezalogowany → strona logowania
  if (!user) {
    return <AdminLogin />;
  }

  // Zalogowany, ale nie admin → brak dostępu
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 inline-flex mb-4">
            <Zap className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-1">
            Your account <span className="text-foreground font-medium">{user.email || user.name}</span> does not have admin privileges.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            This incident has been logged by Sentinel.app.
          </p>
          <button
            onClick={() => window.location.href = "/api/trpc/auth.logout"}
            className="mt-6 text-xs text-muted-foreground hover:text-foreground underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Admin zalogowany → pełny dostęp
  return <>{children}</>;
}

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" component={Home} />
        <Route path="/registry" component={Registry} />
        <Route path="/orchestrator" component={Orchestrator} />
        <Route path="/cost" component={CostCalculator} />
        <Route path="/templates" component={Templates} />
        <Route path="/architecture" component={Architecture} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/semantic-search" component={SemanticSearch} />
        <Route path="/ai-control-center" component={AIControlCenter} />
        <Route path="/sentinel" component={SentinelMonitor} />
        <Route path="/auto-deploy" component={AutoDeploy} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AuthGate>
            <Router />
          </AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
