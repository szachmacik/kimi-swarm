import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
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

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/registry" component={Registry} />
        <Route path="/orchestrator" component={Orchestrator} />
        <Route path="/cost" component={CostCalculator} />
        <Route path="/templates" component={Templates} />
        <Route path="/architecture" component={Architecture} />
        <Route path="/integrations" component={Integrations} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
