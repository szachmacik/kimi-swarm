import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Database, Bot, DollarSign, Code2, Zap, Activity, TrendingUp, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { FUNCTION_REGISTRY_DATA } from "../../../server/functionData";

const CATEGORY_COLORS: Record<string, string> = {
  llm: "text-purple-400", image: "text-green-400", video: "text-red-400",
  audio: "text-amber-400", search: "text-blue-400", code: "text-cyan-400",
  database: "text-indigo-400", communication: "text-pink-400", vector: "text-violet-400", utility: "text-gray-400",
};

const CATEGORY_BG: Record<string, string> = {
  llm: "bg-purple-500/10 border-purple-500/20", image: "bg-green-500/10 border-green-500/20",
  video: "bg-red-500/10 border-red-500/20", audio: "bg-amber-500/10 border-amber-500/20",
  search: "bg-blue-500/10 border-blue-500/20", code: "bg-cyan-500/10 border-cyan-500/20",
  database: "bg-indigo-500/10 border-indigo-500/20", communication: "bg-pink-500/10 border-pink-500/20",
  vector: "bg-violet-500/10 border-violet-500/20", utility: "bg-gray-500/10 border-gray-500/20",
};

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-400', '-500/10')}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: registryStats } = trpc.registry.stats.useQuery();
  const { data: orchStats } = trpc.orchestrator.stats.useQuery();
  const { data: recentExecs } = trpc.orchestrator.history.useQuery({ limit: 5 });

  // Count categories from static data
  const categoryCounts: Record<string, number> = {};
  for (const fn of FUNCTION_REGISTRY_DATA) {
    categoryCounts[fn.category] = (categoryCounts[fn.category] || 0) + 1;
  }

  const quickActions = [
    { label: "Browse Registry", desc: "Explore 80+ API functions", icon: Database, path: "/registry", color: "text-purple-400" },
    { label: "KIMI Orchestrator", desc: "Plan autonomous workflows", icon: Bot, path: "/orchestrator", color: "text-blue-400" },
    { label: "Cost Calculator", desc: "Compare API pricing", icon: DollarSign, path: "/cost", color: "text-green-400" },
    { label: "Edge Templates", desc: "Deploy to Supabase", icon: Code2, path: "/templates", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero */}
      <div className="relative rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(oklch(0.65 0.22 265 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.22 265 / 0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-xs">KIMI K2.5 Powered</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">KIMI SWARM</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Autonomous AI orchestration platform. KIMI K2.5 intelligently routes requests across 80+ API functions — LLM, Image, Video, Audio, Search, Code, Database, and Communication — with cost optimization and parallel execution.
          </p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => setLocation("/orchestrator")} className="gap-2">
              <Bot className="h-4 w-4" /> Start Orchestrating
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLocation("/registry")} className="gap-2">
              <Database className="h-4 w-4" /> View Registry
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Functions" value={FUNCTION_REGISTRY_DATA.length} sub="across 10 categories" icon={Database} color="text-purple-400" />
        <StatCard title="Executions" value={orchStats?.total || 0} sub={`${orchStats?.completed || 0} completed`} icon={Activity} color="text-blue-400" />
        <StatCard title="Total Cost Saved" value={`$${((orchStats?.totalCost || 0)).toFixed(4)}`} sub="via cost optimization" icon={TrendingUp} color="text-green-400" />
        <StatCard title="Avg Duration" value={orchStats?.avgDuration ? `${Math.round(orchStats.avgDuration)}ms` : "—"} sub="per orchestration" icon={Clock} color="text-amber-400" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <Card key={action.path} className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer group" onClick={() => setLocation(action.path)}>
              <CardContent className="p-4">
                <action.icon className={`h-6 w-6 ${action.color} mb-3 group-hover:scale-110 transition-transform`} />
                <p className="font-medium text-sm text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Registry by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]?.replace('text-', 'bg-')}`} />
                  <span className="text-sm capitalize text-foreground">{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CATEGORY_COLORS[cat]?.replace('text-', 'bg-')}`} style={{ width: `${(count / FUNCTION_REGISTRY_DATA.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent executions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Orchestrations</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentExecs || recentExecs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orchestrations yet</p>
                <p className="text-xs mt-1">Use KIMI Orchestrator to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExecs.map(exec => (
                  <div key={exec.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                    {exec.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" /> :
                     exec.status === "failed" ? <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" /> :
                     <Loader2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0 animate-spin" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground truncate">{exec.userPrompt}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">${(exec.totalCostUsd || 0).toFixed(5)}</span>
                        {exec.durationMs && <span className="text-xs text-muted-foreground">{exec.durationMs}ms</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
