import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Zap, Clock, DollarSign, GitBranch, CheckCircle2, Loader2,
  Activity, Terminal, Play, RotateCcw, ChevronDown, ChevronRight,
  Wrench, AlertCircle, TrendingUp, Sparkles, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface ExampleTask {
  title: string;
  category: string;
  prompt: string;
  tools: string[];
  estimatedCost: string;
  estimatedTime: string;
  colorClass: string;
}

const EXAMPLE_TASKS: ExampleTask[] = [
  {
    title: "AI Content Pipeline",
    category: "Marketing",
    prompt: "Generate a product image for a SaaS dashboard app, write 3 variants of marketing copy in English and Polish, calculate the total cost of all API calls, and send the results via email to the owner.",
    tools: ["image_generation", "kimi_chat", "deepl_translate", "cost_calculator", "resend_email"],
    estimatedCost: "$0.08",
    estimatedTime: "~25s",
    colorClass: "text-pink-400 border-pink-500/30 bg-pink-500/5",
  },
  {
    title: "Web Research & Summarize",
    category: "Research",
    prompt: "Search the web for the 5 latest AI model releases in 2025, extract key details (model name, company, capabilities, pricing), summarize them in a structured table, store the results in the kimi_executions database, and generate a semantic embedding for future search.",
    tools: ["web_search", "kimi_chat", "supabase_insert", "moonshot_embedding"],
    estimatedCost: "$0.02",
    estimatedTime: "~15s",
    colorClass: "text-blue-400 border-blue-500/30 bg-blue-500/5",
  },
  {
    title: "Audio → Multilingual Text",
    category: "Audio/NLP",
    prompt: "Transcribe an audio file using Whisper, detect the language, translate the transcript to English, Polish, and German in parallel, generate a TTS audio response in each language, and return all 3 audio files with cost breakdown.",
    tools: ["whisper_transcribe", "deepl_translate", "elevenlabs_tts", "parallel_execution"],
    estimatedCost: "$0.05",
    estimatedTime: "~30s",
    colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  },
  {
    title: "Code Review & Auto-Deploy",
    category: "DevOps",
    prompt: "Analyze this TypeScript code for bugs and security issues, generate a fixed version, write unit tests with Vitest, deploy the fixed code as a Supabase Edge Function named 'kimi-auto-fix', and log the deployment result to Sentinel.app for audit.",
    tools: ["kimi_chat", "code_execution", "supabase_deploy", "sentinel_log"],
    estimatedCost: "$0.03",
    estimatedTime: "~20s",
    colorClass: "text-green-400 border-green-500/30 bg-green-500/5",
  },
  {
    title: "Semantic Document Search",
    category: "Vector Search",
    prompt: "Take these 10 product descriptions, generate pgvector embeddings for each using moonshot-v1-embedding, store them in the function_registry table, then perform a semantic search for 'payment processing with fraud detection' and return the top 5 most similar results with similarity scores.",
    tools: ["moonshot_embedding", "pgvector_upsert", "pgvector_search", "supabase_query"],
    estimatedCost: "$0.01",
    estimatedTime: "~10s",
    colorClass: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
  },
  {
    title: "Full Landing Page Build",
    category: "Web Dev",
    prompt: "Build a complete SaaS landing page: generate a hero image with DALL-E 3, write compelling copy with KIMI K2.5, create responsive HTML/CSS/JS, deploy as a Supabase Edge Function, register the URL in ai-control-center, and return the live URL with performance metrics.",
    tools: ["dalle3_image", "kimi_chat", "code_generation", "supabase_deploy", "acc_register"],
    estimatedCost: "$0.12",
    estimatedTime: "~45s",
    colorClass: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  },
  {
    title: "AI Control Center Sync",
    category: "Integration",
    prompt: "Connect to ai-control-center Supabase, list all active agents and their last execution times, identify any agents that haven't run in 24h, create a new task for each idle agent with priority=high, and send a Sentinel.app security audit report with the findings.",
    tools: ["supabase_query", "acc_agents_list", "acc_task_create", "sentinel_audit"],
    estimatedCost: "$0.01",
    estimatedTime: "~8s",
    colorClass: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5",
  },
  {
    title: "Cost Optimizer Analysis",
    category: "Analytics",
    prompt: "Analyze the last 50 KIMI executions from the database, calculate total API costs per category (LLM, Image, Audio, Search), identify the 3 most expensive operations, suggest cheaper alternatives from the function registry using semantic search, and generate a cost optimization report.",
    tools: ["supabase_query", "cost_calculator", "semantic_search", "kimi_chat"],
    estimatedCost: "$0.02",
    estimatedTime: "~12s",
    colorClass: "text-orange-400 border-orange-500/30 bg-orange-500/5",
  },
];

interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
  cost: number;
}

interface PlanStep {
  id: string;
  function: string;
  description: string;
  estimated_cost_usd: number;
  parallel_with?: string[] | null;
}

interface KimiPlan {
  reasoning: string;
  steps: PlanStep[];
  total_estimated_cost_usd: number;
  parallel_groups: number;
  estimated_duration_ms: number;
}

function ToolCallCard({ tc, index }: { tc: ToolCall; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-2.5 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-500/20 text-purple-400 text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <Wrench className="h-3.5 w-3.5 text-purple-400 shrink-0" />
        <code className="text-xs text-purple-300 font-mono flex-1">{tc.tool}</code>
        <span className="text-xs text-green-400">${tc.cost.toFixed(5)}</span>
        <span className="text-xs text-muted-foreground">{tc.durationMs}ms</span>
        {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="p-3 space-y-2 bg-muted/10">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Input:</p>
            <pre className="text-xs text-foreground bg-muted/30 p-2 rounded overflow-auto max-h-32 font-mono">
              {JSON.stringify(tc.input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Output:</p>
            <pre className="text-xs text-foreground bg-muted/30 p-2 rounded overflow-auto max-h-32 font-mono">
              {typeof tc.output === "string" ? tc.output : JSON.stringify(tc.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, index }: { step: PlanStep; index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{step.description}</span>
          {step.parallel_with && step.parallel_with.length > 0 && (
            <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
              <GitBranch className="h-3 w-3 mr-1" /> parallel
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <code className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{step.function}</code>
          <span className="text-xs text-green-400">${step.estimated_cost_usd.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}

function ExampleTaskCard({ task, onSelect }: { task: ExampleTask; onSelect: (prompt: string) => void }) {
  return (
    <Card className={`bg-card border cursor-pointer hover:scale-[1.01] transition-all group ${task.colorClass}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{task.title}</p>
            <Badge variant="outline" className={`text-xs mt-1 border ${task.colorClass}`}>{task.category}</Badge>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-green-400 font-mono font-bold">{task.estimatedCost}</p>
            <p className="text-xs text-muted-foreground">{task.estimatedTime}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.prompt}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {task.tools.slice(0, 3).map(t => (
              <code key={t} className="text-xs bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded">{t}</code>
            ))}
            {task.tools.length > 3 && (
              <span className="text-xs text-muted-foreground">+{task.tools.length - 3}</span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelect(task.prompt)}
            className={`text-xs gap-1 h-7 opacity-0 group-hover:opacity-100 transition-opacity ${task.colorClass}`}
          >
            Try <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Orchestrator() {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<KimiPlan | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; toolCalls?: ToolCall[]; durationMs?: number; cost?: number }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("examples");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const planMutation = trpc.orchestrator.plan.useMutation({
    onSuccess: (data) => {
      if (typeof data.plan === "string") {
        try { setPlan(JSON.parse(data.plan)); } catch { setPlan(null); }
      } else {
        setPlan(data.plan as KimiPlan | null);
      }
      setSessionId(data.sessionId);
      setDurationMs(data.durationMs);
      toast.success("KIMI plan generated");
    },
    onError: (err) => toast.error("Plan failed: " + err.message),
  });

  const chatMutation = trpc.orchestrator.chat.useMutation({
    onSuccess: (data) => {
      const assistantMsg = {
        role: "assistant" as const,
        content: data.response,
        toolCalls: (data.toolCalls || []) as ToolCall[],
        durationMs: data.durationMs,
        cost: (data as any).totalCost || 0,
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      toast.success(`KIMI responded in ${data.durationMs}ms`);
    },
    onError: (err) => {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
      toast.error("KIMI error: " + err.message);
    },
  });

  const { data: stats } = trpc.orchestrator.stats.useQuery();
  const { data: history } = trpc.orchestrator.history.useQuery({ limit: 10 });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handlePlan = () => {
    if (!prompt.trim()) return;
    setPlan(null);
    planMutation.mutate({ prompt: prompt.trim() });
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user" as const, content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    chatMutation.mutate({
      messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
      enableTools: true,
    });
    setChatInput("");
  };

  const handleSelectExample = (taskPrompt: string) => {
    setChatInput(taskPrompt);
    setPrompt(taskPrompt);
    setActiveTab("chat");
    toast.success("Example loaded — press Send or Generate Plan");
  };

  const handleReset = () => {
    setChatMessages([]);
    setPlan(null);
    setPrompt("");
    setChatInput("");
    setSessionId(null);
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> KIMI K2.5 Orchestrator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous workflow planning with real tool-calling. KIMI selects functions, minimizes cost, executes in parallel.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 shrink-0">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Runs", value: stats?.total || 0, icon: Activity, color: "text-foreground" },
          { label: "Completed", value: stats?.completed || 0, icon: CheckCircle2, color: "text-green-400" },
          { label: "Failed", value: stats?.failed || 0, icon: AlertCircle, color: "text-red-400" },
          { label: "Total Cost", value: `$${(stats?.totalCost || 0).toFixed(4)}`, icon: DollarSign, color: "text-amber-400" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-muted/30">
              <TabsTrigger value="examples" className="gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Examples
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2 text-xs">
                <Bot className="h-3.5 w-3.5" /> KIMI Chat
              </TabsTrigger>
              <TabsTrigger value="plan" className="gap-2 text-xs">
                <GitBranch className="h-3.5 w-3.5" /> Workflow Planner
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 text-xs">
                <Clock className="h-3.5 w-3.5" /> History
              </TabsTrigger>
            </TabsList>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">8 ready-to-run autonomous workflows — click any card to load it into KIMI Chat</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXAMPLE_TASKS.map(task => (
                  <ExampleTaskCard key={task.title} task={task} onSelect={handleSelectExample} />
                ))}
              </div>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-3">
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <ScrollArea className="h-[420px] p-4">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                        <Bot className="h-10 w-10 text-primary/40" />
                        <div>
                          <p className="text-sm font-medium text-foreground">KIMI K2.5 is ready</p>
                          <p className="text-xs text-muted-foreground mt-1">Chat with KIMI and watch it call tools autonomously</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md">
                          {EXAMPLE_TASKS.slice(0, 3).map(t => (
                            <button
                              key={t.title}
                              onClick={() => { setChatInput(t.prompt); }}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left ${t.colorClass}`}
                            >
                              {t.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`mb-4 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
                        <div className={`max-w-[85%] ${msg.role === "user" ? "order-1" : "order-2"}`}>
                          {msg.role === "user" ? (
                            <div className="bg-primary/10 border border-primary/20 rounded-xl rounded-tr-sm px-3 py-2">
                              <p className="text-sm text-foreground">{msg.content}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {msg.toolCalls && msg.toolCalls.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Wrench className="h-3 w-3" /> Tool calls ({msg.toolCalls.length})
                                  </p>
                                  {msg.toolCalls.map((tc, j) => (
                                    <ToolCallCard key={j} tc={tc} index={j} />
                                  ))}
                                </div>
                              )}
                              <div className="bg-muted/20 border border-border rounded-xl rounded-tl-sm px-3 py-2">
                                <Streamdown className="text-sm text-foreground prose prose-sm prose-invert max-w-none">{msg.content}</Streamdown>
                                {(msg.durationMs || msg.cost) && (
                                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                                    {msg.durationMs && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{msg.durationMs}ms</span>}
                                    {msg.cost !== undefined && <span className="text-xs text-green-400 flex items-center gap-1"><DollarSign className="h-3 w-3" />${msg.cost.toFixed(5)}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-muted/20 border border-border rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          <span className="text-xs text-muted-foreground">KIMI is thinking and calling tools...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </ScrollArea>
                  <Separator />
                  <div className="p-3 flex gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                      placeholder="Ask KIMI to plan a workflow, call tools, analyze data..."
                      className="min-h-[60px] max-h-[120px] bg-muted/20 border-border resize-none text-sm"
                    />
                    <Button
                      onClick={handleChat}
                      disabled={chatMutation.isPending || !chatInput.trim()}
                      className="shrink-0 self-end gap-2"
                    >
                      {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Workflow Planner Tab */}
            <TabsContent value="plan" className="space-y-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Describe your workflow</span>
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g. Generate product images, write SEO copy, translate to 5 languages, and send via email..."
                    className="min-h-[120px] bg-muted/20 border-border resize-none text-sm"
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handlePlan(); }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Ctrl+Enter to submit</span>
                    <Button onClick={handlePlan} disabled={planMutation.isPending || !prompt.trim()} className="gap-2">
                      {planMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                      {planMutation.isPending ? "Planning..." : "Generate Plan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick-load from examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_TASKS.map(t => (
                    <button
                      key={t.title}
                      onClick={() => setPrompt(t.prompt)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${t.colorClass}`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>

              {planMutation.isPending && (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">KIMI is analyzing and planning the optimal workflow...</span>
                  </CardContent>
                </Card>
              )}

              {plan && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" /> Execution Plan
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{plan.estimated_duration_ms}ms</span>
                        <span className="flex items-center gap-1 text-green-400"><DollarSign className="h-3 w-3" />${plan.total_estimated_cost_usd?.toFixed(5)}</span>
                        <span className="flex items-center gap-1 text-cyan-400"><GitBranch className="h-3 w-3" />{plan.parallel_groups} parallel</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">KIMI Reasoning</p>
                      <p className="text-xs text-foreground leading-relaxed">{plan.reasoning}</p>
                    </div>
                    <div className="space-y-2">
                      {plan.steps?.map((step, i) => <StepCard key={step.id} step={step} index={i} />)}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <span className="text-xs text-muted-foreground">{plan.steps?.length} steps · {plan.parallel_groups} parallel groups · {durationMs}ms planning</span>
                      <span className="text-sm font-bold text-green-400">Total: ${plan.total_estimated_cost_usd?.toFixed(5)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Recent Executions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!history || history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No executions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((exec: any) => (
                        <div key={exec.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${exec.status === "completed" ? "bg-green-400" : exec.status === "failed" ? "bg-red-400" : "bg-amber-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate font-medium">{exec.prompt}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">{exec.status}</span>
                              {exec.durationMs && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{exec.durationMs}ms</span>}
                              {exec.totalCost && <span className="text-xs text-green-400 flex items-center gap-1"><DollarSign className="h-3 w-3" />${parseFloat(exec.totalCost).toFixed(5)}</span>}
                              {exec.toolsUsed && <span className="text-xs text-purple-400">{JSON.parse(exec.toolsUsed || "[]").length} tools</span>}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs shrink-0 ${exec.status === "completed" ? "border-green-500/30 text-green-400" : exec.status === "failed" ? "border-red-500/30 text-red-400" : "border-amber-500/30 text-amber-400"}`}>
                            {exec.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Session info */}
          {sessionId && (
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                <code className="text-xs text-primary font-mono">{sessionId}</code>
                {durationMs && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {durationMs}ms planning
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* KIMI capabilities */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KIMI Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Tool Calling", desc: "83 registered functions", color: "bg-purple-500/20 text-purple-400" },
                { label: "Parallel Exec", desc: "Multi-function groups", color: "bg-cyan-500/20 text-cyan-400" },
                { label: "Cost Optimizer", desc: "Cheapest path first", color: "bg-green-500/20 text-green-400" },
                { label: "Auto-Deploy", desc: "Edge Function writing", color: "bg-amber-500/20 text-amber-400" },
                { label: "Semantic Search", desc: "pgvector similarity", color: "bg-blue-500/20 text-blue-400" },
              ].map(cap => (
                <div key={cap.label} className="flex items-center gap-2">
                  <Badge className={`text-xs ${cap.color} border-0`}>{cap.label}</Badge>
                  <span className="text-xs text-muted-foreground">{cap.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent cost trend */}
          {history && history.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" /> Cost Trend (last 5)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {history.slice(0, 5).map((exec: any) => (
                  <div key={exec.id} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${exec.status === "completed" ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{(exec.prompt || "").substring(0, 25)}...</span>
                    <span className="text-xs text-green-400 shrink-0">${parseFloat(exec.totalCost || "0").toFixed(4)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
