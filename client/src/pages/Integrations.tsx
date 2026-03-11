import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plug, CheckCircle2, XCircle, Loader2, RefreshCw, Bot, Shield, Database, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const AI_CONTROL_CENTER_URL = "https://qhscjlfavyqkaplcwhxu.supabase.co";
const SENTINEL_URL = "https://blgdhfcosqjzrutncbbr.supabase.co";

function StatusBadge({ status }: { status: "success" | "error" | "pending" | "idle" }) {
  if (status === "success") return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Connected</Badge>;
  if (status === "error") return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Error</Badge>;
  if (status === "pending") return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Syncing...</Badge>;
  return <Badge variant="outline" className="text-muted-foreground text-xs">Not synced</Badge>;
}

export default function Integrations() {
  const { user } = useAuth();
  const [accKey, setAccKey] = useState("");
  const [sentinelKey, setSentinelKey] = useState("");
  const [accStatus, setAccStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [sentinelStatus, setSentinelStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const { data: logs, refetch: refetchLogs } = trpc.integrations.logs.useQuery({ limit: 30 });

  const syncAccMutation = trpc.integrations.syncToAiControlCenter.useMutation({
    onMutate: () => setAccStatus("pending"),
    onSuccess: (data) => {
      setAccStatus("success");
      toast.success(`KIMI agent synced to ai-control-center (${data.synced} functions)`);
      refetchLogs();
    },
    onError: (err) => {
      setAccStatus("error");
      toast.error("Sync failed: " + err.message);
    },
  });

  const syncSentinelMutation = trpc.integrations.syncToSentinel.useMutation({
    onMutate: () => setSentinelStatus("pending"),
    onSuccess: (data) => {
      setSentinelStatus("success");
      toast.success(`${data.logsPushed} execution logs pushed to Sentinel.app`);
      refetchLogs();
    },
    onError: (err) => {
      setSentinelStatus("error");
      toast.error("Sync failed: " + err.message);
    },
  });

  const accLogs = logs?.filter(l => l.integration === "ai-control-center") || [];
  const sentinelLogs = logs?.filter(l => l.integration === "sentinel") || [];
  const supabaseLogs = logs?.filter(l => l.integration === "supabase-mgmt") || [];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" /> Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect KIMI SWARM with ai-control-center and Sentinel.app for autonomous agent management and monitoring.
        </p>
      </div>

      {!user && (
        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-sm text-amber-400">Sign in to use integration sync features.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ai-control-center */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-400" /> ai-control-center
              </CardTitle>
              <StatusBadge status={accStatus} />
            </div>
            <p className="text-xs text-muted-foreground">Supabase project: <code className="text-primary">qhscjlfavyqkaplcwhxu</code></p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground space-y-1">
              <p className="text-blue-400 font-medium mb-1">What this sync does:</p>
              <p>• Adds KIMI K2.5 agent to the <code className="bg-muted/50 px-1 rounded">agents</code> table</p>
              <p>• Syncs function registry metadata to <code className="bg-muted/50 px-1 rounded">app_secrets</code></p>
              <p>• Enables KIMI to autonomously manage tasks via Supabase API</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Service Role Key (ai-control-center)</Label>
              <Input
                type="password"
                value={accKey}
                onChange={e => setAccKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="bg-muted/20 border-border text-xs h-8 font-mono"
              />
            </div>

            <Button
              onClick={() => syncAccMutation.mutate()}
              disabled={syncAccMutation.isPending || !user}
              className="w-full gap-2"
              size="sm"
            >
              {syncAccMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync KIMI Agent
            </Button>

            {/* Recent logs */}
            {accLogs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Recent sync logs:</p>
                {accLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/20">
                    {log.status === "success" ? <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" /> : <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                    <span className="text-muted-foreground truncate">{log.action}</span>
                    {log.durationMs && <span className="text-muted-foreground ml-auto shrink-0">{log.durationMs}ms</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentinel.app */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" /> Sentinel.app
              </CardTitle>
              <StatusBadge status={sentinelStatus} />
            </div>
            <p className="text-xs text-muted-foreground">Supabase project: <code className="text-primary">blgdhfcosqjzrutncbbr</code></p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-muted-foreground space-y-1">
              <p className="text-red-400 font-medium mb-1">What this sync does:</p>
              <p>• Pushes KIMI execution logs to Sentinel monitoring</p>
              <p>• Enables security audit of autonomous operations</p>
              <p>• Tracks cost, duration, and function usage patterns</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Service Role Key (Sentinel.app)</Label>
              <Input
                type="password"
                value={sentinelKey}
                onChange={e => setSentinelKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="bg-muted/20 border-border text-xs h-8 font-mono"
              />
            </div>

            <Button
              onClick={() => syncSentinelMutation.mutate()}
              disabled={syncSentinelMutation.isPending || !user}
              className="w-full gap-2"
              size="sm"
              variant="outline"
            >
              {syncSentinelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Push Execution Logs
            </Button>

            {sentinelLogs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Recent sync logs:</p>
                {sentinelLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/20">
                    {log.status === "success" ? <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" /> : <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                    <span className="text-muted-foreground truncate">{log.action}</span>
                    {log.durationMs && <span className="text-muted-foreground ml-auto shrink-0">{log.durationMs}ms</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All integration logs */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Integration Activity Log
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => refetchLogs()} className="h-7 gap-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No integration activity yet</p>
              <p className="text-xs mt-1">Sync with ai-control-center or Sentinel.app to see logs here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">Integration</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Action</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Duration</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="p-2">
                        <span className={`font-medium ${log.integration === "ai-control-center" ? "text-blue-400" : log.integration === "sentinel" ? "text-red-400" : "text-green-400"}`}>
                          {log.integration}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground font-mono">{log.action}</td>
                      <td className="p-2">
                        {log.status === "success"
                          ? <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> success</span>
                          : <span className="text-red-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> error</span>
                        }
                      </td>
                      <td className="p-2 text-right text-muted-foreground">{log.durationMs ? `${log.durationMs}ms` : "—"}</td>
                      <td className="p-2 text-right text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supabase Edge Function deploy logs */}
      {supabaseLogs.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-green-400" /> Edge Function Deploy History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {supabaseLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-2 rounded bg-muted/20 text-xs">
                {log.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                <span className="text-foreground font-mono">{log.action}</span>
                <span className="text-muted-foreground ml-auto">{log.durationMs}ms</span>
                <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
