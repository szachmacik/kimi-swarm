import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Zap, Database, Bot, Search, Code2, GitBranch, ArrowRight, ArrowDown, ChevronRight } from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  icon: any;
  description: string;
}

const FLOW_NODES: FlowNode[] = [
  { id: "user", label: "User Prompt", sublabel: "Natural language request", color: "border-blue-500/40 bg-blue-500/10 text-blue-300", icon: Bot, description: "User describes their goal in natural language. No need to know which API to call." },
  { id: "kimi", label: "KIMI K2.5", sublabel: "Orchestrator (128K context)", color: "border-primary/40 bg-primary/10 text-primary", icon: Zap, description: "KIMI analyzes the request, decomposes it into steps, selects optimal functions, and plans parallel execution to minimize cost and latency." },
  { id: "vector", label: "pgvector Search", sublabel: "Semantic function discovery", color: "border-violet-500/40 bg-violet-500/10 text-violet-300", icon: Search, description: "OpenAI text-embedding-3-small (1536d) embeddings enable semantic search across 80+ functions. KIMI finds the best tools for each subtask." },
  { id: "registry", label: "Function Registry", sublabel: "80+ API functions", color: "border-purple-500/40 bg-purple-500/10 text-purple-300", icon: Database, description: "Comprehensive registry of LLM, Image, Video, Audio, Search, Code, Database, and Communication APIs with cost metadata." },
  { id: "parallel", label: "Parallel Executor", sublabel: "Concurrent API calls", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300", icon: GitBranch, description: "Independent steps execute concurrently. KIMI identifies parallelizable operations to minimize total workflow duration." },
  { id: "result", label: "Aggregated Result", sublabel: "Structured output", color: "border-green-500/40 bg-green-500/10 text-green-300", icon: Code2, description: "Results from all parallel and sequential steps are aggregated, post-processed, and returned to the user." },
];

const INTEGRATION_NODES = [
  { label: "ai-control-center", desc: "Agent management, task scheduling, infrastructure control", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Sentinel.app", desc: "Security monitoring, audit logs, anomaly detection for autonomous operations", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { label: "Supabase Edge Functions", desc: "Serverless function deployment via KIMI Auto-Deploy pipeline", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { label: "Vercel", desc: "Frontend deployment and CDN for KIMI SWARM dashboard", color: "text-white", bg: "bg-white/5 border-white/10" },
];

const CATEGORY_APIS = [
  { cat: "LLM", color: "text-purple-400", apis: ["GPT-4o", "Claude 3.5", "Gemini 1.5", "DeepSeek V3", "KIMI K2.5", "Llama 3.3", "Mistral Large"] },
  { cat: "Image", color: "text-green-400", apis: ["DALL-E 3", "Stable Diffusion XL", "Midjourney", "Flux Pro", "Ideogram", "Adobe Firefly"] },
  { cat: "Video", color: "text-red-400", apis: ["Sora", "Runway Gen-3", "Kling AI", "Pika Labs", "Luma Dream Machine"] },
  { cat: "Audio", color: "text-amber-400", apis: ["Whisper", "ElevenLabs", "Suno AI", "Udio", "AssemblyAI"] },
  { cat: "Search", color: "text-blue-400", apis: ["Perplexity", "Tavily", "Brave Search", "Serper", "Exa AI"] },
  { cat: "Code", color: "text-cyan-400", apis: ["GitHub Copilot", "Codestral", "DeepSeek Coder", "Cursor API"] },
];

export default function Architecture() {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(FLOW_NODES[1]);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" /> System Architecture
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive visualization of KIMI SWARM's autonomous orchestration flow and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main flow */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orchestration Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-0">
                {FLOW_NODES.map((node, i) => (
                  <div key={node.id} className="flex flex-col items-center w-full">
                    <button
                      onClick={() => setSelectedNode(node)}
                      className={`w-full max-w-sm p-3 rounded-xl border-2 transition-all text-left ${node.color} ${selectedNode?.id === node.id ? "scale-105 shadow-lg" : "hover:scale-102 opacity-80 hover:opacity-100"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black/20">
                          <node.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{node.label}</p>
                          {node.sublabel && <p className="text-xs opacity-70">{node.sublabel}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                      </div>
                    </button>
                    {i < FLOW_NODES.length - 1 && (
                      <div className="flex flex-col items-center py-1">
                        <div className="w-px h-4 bg-border" />
                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                        <div className="w-px h-4 bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Categories grid */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Function Registry — API Landscape</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORY_APIS.map(cat => (
                  <div key={cat.cat} className="p-3 rounded-lg bg-muted/20 border border-border">
                    <p className={`text-xs font-bold mb-2 ${cat.color}`}>{cat.cat}</p>
                    <div className="space-y-1">
                      {cat.apis.map(api => (
                        <p key={api} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className={`w-1 h-1 rounded-full ${cat.color.replace('text-', 'bg-')} shrink-0`} />
                          {api}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Node detail */}
          {selectedNode && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Component Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-3 rounded-lg border mb-3 ${selectedNode.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <selectedNode.icon className="h-4 w-4" />
                    <span className="font-semibold text-sm">{selectedNode.label}</span>
                  </div>
                  {selectedNode.sublabel && <p className="text-xs opacity-70">{selectedNode.sublabel}</p>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Integrations */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {INTEGRATION_NODES.map(node => (
                <div key={node.label} className={`p-3 rounded-lg border ${node.bg}`}>
                  <p className={`text-xs font-semibold mb-1 ${node.color}`}>{node.label}</p>
                  <p className="text-xs text-muted-foreground">{node.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key metrics */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Architecture Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Function Registry", value: "80+ APIs" },
                { label: "Context Window", value: "128K tokens" },
                { label: "Embedding Dims", value: "1536 (OpenAI)" },
                { label: "Parallel Execution", value: "Unlimited" },
                { label: "Edge Functions", value: "5 templates" },
                { label: "Integrations", value: "4 systems" },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <span className="text-xs font-semibold text-foreground">{m.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* pgvector flow */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">pgvector Semantic Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                {[
                  "1. User prompt → OpenAI embedding (1536d)",
                  "2. Cosine similarity search in function_registry",
                  "3. Top-K functions returned (threshold: 0.7)",
                  "4. KIMI selects optimal subset",
                  "5. Parallel execution plan generated",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-primary shrink-0">{i + 1}.</span>
                    <span>{step.substring(3)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
