import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Zap, Clock, DollarSign, GitBranch, CheckCircle2, Loader2, ChevronRight, Activity } from "lucide-react";
import { toast } from "sonner";

const EXAMPLE_PROMPTS = [
  "Generate a product image, write marketing copy, and send it via email",
  "Search the web for AI news, summarize with GPT-4o-mini, and store in database",
  "Transcribe audio file, translate to Polish, and generate TTS response",
  "Analyze code for bugs, fix them, run tests, and deploy to Supabase Edge Functions",
  "Create a vector embedding of documents and find semantically similar content",
];

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

export default function Orchestrator() {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<KimiPlan | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const planMutation = trpc.orchestrator.plan.useMutation({
    onSuccess: (data) => {
      setPlan(data.plan);
      setSessionId(data.sessionId);
      setDurationMs(data.durationMs);
      toast.success("KIMI plan generated successfully");
    },
    onError: (err) => {
      toast.error("Failed to generate plan: " + err.message);
    },
  });

  const { data: stats } = trpc.orchestrator.stats.useQuery();
  const { data: history } = trpc.orchestrator.history.useQuery({ limit: 10 });

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    setPlan(null);
    planMutation.mutate({ prompt: prompt.trim() });
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> KIMI K2.5 Orchestrator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe your task. KIMI autonomously selects optimal functions, minimizes cost, and plans parallel execution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Input panel */}
        <div className="lg:col-span-2 space-y-4">
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
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ctrl+Enter to submit</span>
                <Button onClick={handleSubmit} disabled={planMutation.isPending || !prompt.trim()} className="gap-2">
                  {planMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  {planMutation.isPending ? "Planning..." : "Generate Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example prompts */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Example workflows:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-muted/30 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-all text-left"
                >
                  {p.substring(0, 55)}...
                </button>
              ))}
            </div>
          </div>

          {/* Plan result */}
          {planMutation.isPending && (
            <Card className="bg-card border-border">
              <CardContent className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">KIMI is analyzing your request and planning the optimal workflow...</span>
              </CardContent>
            </Card>
          )}

          {plan && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> Execution Plan
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{plan.estimated_duration_ms}ms</span>
                    <span className="flex items-center gap-1 text-green-400"><DollarSign className="h-3 w-3" />${plan.total_estimated_cost_usd.toFixed(5)}</span>
                    <span className="flex items-center gap-1 text-cyan-400"><GitBranch className="h-3 w-3" />{plan.parallel_groups} parallel groups</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Reasoning */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">KIMI Reasoning</p>
                  <p className="text-xs text-foreground leading-relaxed">{plan.reasoning}</p>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {plan.steps.map((step, i) => (
                    <StepCard key={step.id} step={step} index={i} />
                  ))}
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <span className="text-xs text-muted-foreground">{plan.steps.length} steps · {plan.parallel_groups} parallel groups · {durationMs}ms planning time</span>
                  <span className="text-sm font-bold text-green-400">Total: ${plan.total_estimated_cost_usd.toFixed(5)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total Runs", value: stats?.total || 0, color: "text-foreground" },
                { label: "Completed", value: stats?.completed || 0, color: "text-green-400" },
                { label: "Failed", value: stats?.failed || 0, color: "text-red-400" },
                { label: "Total Cost", value: `$${(stats?.totalCost || 0).toFixed(4)}`, color: "text-amber-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-3 w-3" /> Recent Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!history || history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No history yet</p>
              ) : (
                history.slice(0, 6).map(exec => (
                  <div key={exec.id} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${exec.status === "completed" ? "bg-green-400" : exec.status === "failed" ? "bg-red-400" : "bg-amber-400"}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{exec.userPrompt.substring(0, 50)}</p>
                      <p className="text-xs text-muted-foreground">${(exec.totalCostUsd || 0).toFixed(5)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
