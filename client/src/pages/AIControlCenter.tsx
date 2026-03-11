import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Activity, Database, Zap, AlertCircle, ListTodo, Users } from "lucide-react";
import { toast } from "sonner";

const ACC_URL = "https://qhscjlfavyqkaplcwhxu.supabase.co";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-400",
    inactive: "bg-gray-400",
    error: "bg-red-400",
    pending: "bg-amber-400",
    completed: "bg-blue-400",
    running: "bg-cyan-400 animate-pulse",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-gray-400"}`} />;
}

function AgentCard({ agent, onRefresh }: { agent: any; onRefresh: () => void }) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{agent.name}</span>
              <StatusDot status={agent.status} />
              <Badge variant="outline" className="text-xs">{agent.status}</Badge>
              {agent.name === "kimi" && (
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">KIMI SWARM</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{agent.role || agent.description || "AI Agent"}</p>
            {agent.model && (
              <code className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{agent.model}</code>
            )}
            {agent.config && (
              <div className="mt-2 p-2 rounded bg-muted/20 text-xs text-muted-foreground">
                {typeof agent.config === "object" && Object.entries(agent.config).slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="text-foreground truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task }: { task: any }) {
  const priorityColors: Record<string, string> = {
    critical: "text-red-400 border-red-500/30 bg-red-500/10",
    high: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    low: "text-green-400 border-green-500/30 bg-green-500/10",
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
      <StatusDot status={task.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium text-foreground">{task.title}</span>
          <Badge className={`text-xs border ${priorityColors[task.priority] || "text-muted-foreground border-border bg-muted/20"}`}>
            {task.priority}
          </Badge>
        </div>
        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">{task.status}</span>
          {task.created_by && <span className="text-xs text-muted-foreground">by {task.created_by}</span>}
          {task.created_at && <span className="text-xs text-muted-foreground">{new Date(task.created_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

export default function AIControlCenter() {
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", role: "", description: "", model: "kimi-k2-5", status: "active" as const });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium" as const });

  const { data: agents, refetch: refetchAgents, isLoading: agentsLoading } = trpc.aiControlCenter.listAgents.useQuery();
  const { data: tasks, refetch: refetchTasks, isLoading: tasksLoading } = trpc.aiControlCenter.listTasks.useQuery({ limit: 20 });

  const syncMutation = trpc.integrations.syncToAiControlCenter.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} functions to ai-control-center`);
      refetchAgents();
    },
    onError: (err) => toast.error("Sync failed: " + err.message),
  });

  const addAgentMutation = trpc.aiControlCenter.upsertAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent added to ai-control-center");
      setAddAgentOpen(false);
      setAgentForm({ name: "", role: "", description: "", model: "kimi-k2-5", status: "active" });
      refetchAgents();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const addTaskMutation = trpc.aiControlCenter.addTask.useMutation({
    onSuccess: () => {
      toast.success("Task added to ai-control-center");
      setAddTaskOpen(false);
      setTaskForm({ title: "", description: "", priority: "medium" });
      refetchTasks();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const agentList = Array.isArray(agents) ? agents : [];
  const taskList = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> AI Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage agents and tasks in <code className="text-primary text-xs">qhscjlfavyqkaplcwhxu</code> — KIMI can autonomously modify this project.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="gap-2"
          >
            {syncMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync KIMI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetchAgents(); refetchTasks(); }}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Agents", value: agentList.length, icon: Users, color: "text-primary" },
          { label: "Active", value: agentList.filter((a: any) => a.status === "active").length, icon: Activity, color: "text-green-400" },
          { label: "Total Tasks", value: taskList.length, icon: ListTodo, color: "text-purple-400" },
          { label: "Pending", value: taskList.filter((t: any) => t.status === "pending").length, icon: Clock, color: "text-amber-400" },
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

      <Tabs defaultValue="agents">
        <TabsList className="mb-4 bg-muted/30">
          <TabsTrigger value="agents" className="gap-2 text-xs">
            <Bot className="h-3.5 w-3.5" /> Agents ({agentList.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 text-xs">
            <ListTodo className="h-3.5 w-3.5" /> Tasks ({taskList.length})
          </TabsTrigger>
          <TabsTrigger value="autonomous" className="gap-2 text-xs">
            <Zap className="h-3.5 w-3.5" /> Autonomous Actions
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Agents registered in ai-control-center</p>
            <Dialog open={addAgentOpen} onOpenChange={setAddAgentOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add Agent to ai-control-center</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Agent Name</Label>
                    <Input value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. kimi-researcher" className="bg-muted/20 border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <Input value={agentForm.role} onChange={e => setAgentForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Research & Analysis Agent" className="bg-muted/20 border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this agent do?" className="bg-muted/20 border-border resize-none" rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <Select value={agentForm.model} onValueChange={v => setAgentForm(f => ({ ...f, model: v }))}>
                      <SelectTrigger className="bg-muted/20 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kimi-k2-5">KIMI K2.5</SelectItem>
                        <SelectItem value="moonshot-v1-8k">Moonshot v1 8k</SelectItem>
                        <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => addAgentMutation.mutate(agentForm)}
                    disabled={addAgentMutation.isPending || !agentForm.name || !agentForm.role}
                    className="w-full gap-2"
                  >
                    {addAgentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Agent
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {agentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : agentList.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No agents found</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Sync KIMI" to register KIMI agent</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agentList.map((agent: any) => (
                <AgentCard key={agent.id} agent={agent} onRefresh={refetchAgents} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tasks in ai-control-center queue</p>
            <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add Task for KIMI</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Task Title</Label>
                    <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Analyze Q4 sales data" className="bg-muted/20 border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed task description..." className="bg-muted/20 border-border resize-none" rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <Select value={taskForm.priority} onValueChange={(v: any) => setTaskForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="bg-muted/20 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => addTaskMutation.mutate(taskForm)}
                    disabled={addTaskMutation.isPending || !taskForm.title}
                    className="w-full gap-2"
                  >
                    {addTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : taskList.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <ListTodo className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {taskList.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Autonomous Actions Tab */}
        <TabsContent value="autonomous" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> KIMI Autonomous Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                KIMI has direct Supabase API access to <code className="text-primary">ai-control-center</code>. These are the operations KIMI can perform autonomously:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { action: "Register new agents", desc: "Add specialized sub-agents to the registry", icon: Bot, color: "text-purple-400" },
                  { action: "Create tasks", desc: "Queue new tasks for any registered agent", icon: ListTodo, color: "text-blue-400" },
                  { action: "Update agent status", desc: "Mark agents as active/inactive/error", icon: Activity, color: "text-green-400" },
                  { action: "Sync function registry", desc: "Push 83+ functions to ai-control-center", icon: Database, color: "text-cyan-400" },
                  { action: "Read agent configs", desc: "Access agent configurations and capabilities", icon: CheckCircle2, color: "text-amber-400" },
                  { action: "Monitor task queue", desc: "Check pending/running/completed tasks", icon: Clock, color: "text-orange-400" },
                ].map(cap => (
                  <div key={cap.action} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                    <cap.icon className={`h-4 w-4 ${cap.color} shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{cap.action}</p>
                      <p className="text-xs text-muted-foreground">{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <p className="text-xs font-medium text-amber-400">Security Note</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  All autonomous operations are logged in Sentinel.app and require admin authentication. KIMI uses the service role key stored in Dexter Vault.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick autonomous actions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2 justify-start h-auto py-3"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-cyan-400" />}
                <div className="text-left">
                  <p className="text-xs font-medium">Sync Function Registry</p>
                  <p className="text-xs text-muted-foreground">Push 83 functions to ai-control-center</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="gap-2 justify-start h-auto py-3"
                onClick={() => addAgentMutation.mutate({
                  name: "kimi-researcher",
                  role: "Research & Analysis Agent",
                  description: "KIMI sub-agent for web research and data analysis",
                  model: "kimi-k2-5",
                  status: "active",
                })}
                disabled={addAgentMutation.isPending}
              >
                {addAgentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4 text-purple-400" />}
                <div className="text-left">
                  <p className="text-xs font-medium">Deploy KIMI Researcher</p>
                  <p className="text-xs text-muted-foreground">Register kimi-researcher sub-agent</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
