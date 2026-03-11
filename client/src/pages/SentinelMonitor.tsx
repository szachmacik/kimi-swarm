import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Loader2, Activity, Clock, Eye, Lock, Zap, FileText, Bot } from "lucide-react";
import { toast } from "sonner";

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <Badge className={`text-xs border ${colors[severity] || "bg-muted/20 text-muted-foreground border-border"}`}>
      {severity}
    </Badge>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    allow: "bg-green-500/20 text-green-400 border-green-500/30",
    block: "bg-red-500/20 text-red-400 border-red-500/30",
    audit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    alert: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  return (
    <Badge className={`text-xs border ${colors[action] || "bg-muted/20 text-muted-foreground border-border"}`}>
      {action}
    </Badge>
  );
}

function LogEntry({ log }: { log: any }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border hover:border-primary/20 transition-colors">
      <div className="shrink-0 mt-0.5">
        {log.severity === "critical" || log.severity === "high" ? (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        ) : log.severity === "medium" ? (
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-medium text-foreground">{log.event_type || log.action_type || "event"}</span>
          <SeverityBadge severity={log.severity || "info"} />
          {log.agent_name && (
            <span className="text-xs text-primary">{log.agent_name}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{log.description || log.details || log.message || JSON.stringify(log).slice(0, 120)}</p>
        {log.created_at && (
          <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(log.created_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function PolicyCard({ policy }: { policy: any }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
      <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-foreground">{policy.policy_name || policy.name}</span>
          <ActionBadge action={policy.action || "allow"} />
          {policy.is_active !== undefined && (
            <Badge variant="outline" className={`text-xs ${policy.is_active ? "text-green-400 border-green-500/30" : "text-muted-foreground"}`}>
              {policy.is_active ? "active" : "disabled"}
            </Badge>
          )}
        </div>
        {policy.description && <p className="text-xs text-muted-foreground">{policy.description}</p>}
        {policy.resource_pattern && (
          <code className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
            {policy.resource_pattern}
          </code>
        )}
        {policy.conditions && (
          <div className="mt-1 text-xs text-muted-foreground">
            {typeof policy.conditions === "object" ? JSON.stringify(policy.conditions).slice(0, 80) : String(policy.conditions)}
          </div>
        )}
      </div>
    </div>
  );
}

function TrustedAgentCard({ agent }: { agent: any }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
      <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-foreground">{agent.agent_name || agent.name}</span>
          {agent.trust_level !== undefined && (
            <Badge className={`text-xs border ${agent.trust_level >= 80 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
              Trust: {agent.trust_level}
            </Badge>
          )}
          {agent.agent_name === "kimi" && (
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">KIMI SWARM</Badge>
          )}
        </div>
        {agent.description && <p className="text-xs text-muted-foreground">{agent.description}</p>}
        {agent.allowed_operations && (
          <div className="flex flex-wrap gap-1 mt-1">
            {(Array.isArray(agent.allowed_operations) ? agent.allowed_operations : [agent.allowed_operations]).slice(0, 4).map((op: string) => (
              <code key={op} className="text-xs text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded">{op}</code>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SentinelMonitor() {
  const [logLimit, setLogLimit] = useState("20");
  const [logSeverity, setLogSeverity] = useState("all");

  const { data: trustedAgentsData, refetch: refetchAgents, isLoading: agentsLoading } = trpc.sentinel.getTrustedAgents.useQuery();
  const { data: policiesData, refetch: refetchPolicies, isLoading: policiesLoading } = trpc.sentinel.getPolicies.useQuery();
  const { data: logs, refetch: refetchLogs, isLoading: logsLoading } = trpc.sentinel.getLogs.useQuery({
    limit: parseInt(logLimit),
    agentName: undefined,
  });
  const { data: alerts, refetch: refetchAlerts } = trpc.sentinel.getAlerts.useQuery({
    limit: 20,
    severity: logSeverity === "all" ? undefined : logSeverity,
  });
  const { data: healthData, refetch: refetchHealth } = trpc.sentinel.healthCheck.useQuery();
  const { data: metricsData } = trpc.sentinel.getMetrics.useQuery();

  const isLoading = agentsLoading || policiesLoading;

  const logKimiMutation = trpc.sentinel.pushLog.useMutation({
    onSuccess: () => {
      toast.success("Action logged to Sentinel.app");
      refetchLogs();
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  const policies = Array.isArray(policiesData) ? policiesData : [];
  const trustedAgents = Array.isArray(trustedAgentsData) ? trustedAgentsData : [];
  const stats: any = metricsData || {};

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Sentinel Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Security monitoring for KIMI autonomous operations via <code className="text-primary text-xs">blgdhfcosqjzrutncbbr</code>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchAgents(); refetchPolicies(); refetchLogs(); refetchAlerts(); refetchHealth(); }}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Trusted Agents", value: trustedAgents.length || stats.trustedAgents || 0, icon: Bot, color: "text-primary" },
          { label: "Active Policies", value: policies.filter((p: any) => p.is_active !== false).length || stats.activePolicies || 0, icon: Lock, color: "text-green-400" },
          { label: "Total Events", value: stats.totalEvents || (Array.isArray(logs) ? logs.length : 0), icon: Activity, color: "text-purple-400" },
          { label: "Blocked", value: stats.blocked || 0, icon: XCircle, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KIMI Status Banner */}
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
            <Shield className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-400">KIMI is a Trusted Agent</p>
            <p className="text-xs text-muted-foreground">
              Registered in Sentinel.app with trust_level=90 · Policy: <code className="text-green-400">allow kimi-swarm-*</code> · All operations audited
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
            onClick={() => logKimiMutation.mutate({
              action: "health_check",
              status: "info" as const,
              severity: "low" as const,
              metadata: { source: "dashboard" },
            })}
            disabled={logKimiMutation.isPending}
          >
            {logKimiMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Log Health Check
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs">
        <TabsList className="mb-4 bg-muted/30">
          <TabsTrigger value="logs" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" /> Event Logs
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2 text-xs">
            <Lock className="h-3.5 w-3.5" /> Security Policies ({policies.length})
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2 text-xs">
            <Bot className="h-3.5 w-3.5" /> Trusted Agents ({trustedAgents.length})
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={logSeverity} onValueChange={setLogSeverity}>
              <SelectTrigger className="w-36 bg-muted/20 border-border text-xs h-8">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={logLimit} onValueChange={setLogLimit}>
              <SelectTrigger className="w-28 bg-muted/20 border-border text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Last 10</SelectItem>
                <SelectItem value="20">Last 20</SelectItem>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetchLogs()} className="gap-2 h-8">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : !Array.isArray(logs) || logs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No events logged yet</p>
                <p className="text-xs text-muted-foreground mt-1">KIMI operations will appear here automatically</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(logs) ? logs : []).map((log: any, i: number) => (
                <LogEntry key={log.id || i} log={log} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : policies.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No policies found in Sentinel.app</p>
              </CardContent>
            </Card>
          ) : (
            policies.map((policy: any, i: number) => (
              <PolicyCard key={policy.id || i} policy={policy} />
            ))
          )}
        </TabsContent>

        {/* Trusted Agents Tab */}
        <TabsContent value="agents" className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : trustedAgents.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No trusted agents registered</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trustedAgents.map((agent: any, i: number) => (
                <TrustedAgentCard key={agent.id || i} agent={agent} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
