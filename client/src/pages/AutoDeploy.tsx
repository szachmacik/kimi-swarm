import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Code2, CheckCircle2, XCircle, Loader2, RefreshCw, Zap, Terminal, Clock, Play, GitBranch, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TEMPLATE_SNIPPETS: Record<string, string> = {
  "llm-router": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const KIMI_KEY = Deno.env.get("KIMI_API_KEY")!;
const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

serve(async (req) => {
  const { prompt, model = "kimi-k2-5", maxTokens = 2048 } = await req.json();
  
  const isKimi = model.startsWith("kimi") || model.startsWith("moonshot");
  const apiUrl = isKimi 
    ? "https://api.moonshot.cn/v1/chat/completions"
    : "https://api.deepseek.com/v1/chat/completions";
  const apiKey = isKimi ? KIMI_KEY : DEEPSEEK_KEY;
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Authorization": \`Bearer \${apiKey}\`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  
  const data = await response.json();
  return new Response(JSON.stringify({
    content: data.choices?.[0]?.message?.content,
    model,
    usage: data.usage,
  }), { headers: { "Content-Type": "application/json" } });
});`,

  "parallel-search": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { query, engines = ["brave", "serper"] } = await req.json();
  
  const searches = engines.map(async (engine: string) => {
    if (engine === "brave") {
      const r = await fetch(\`https://api.search.brave.com/res/v1/web/search?q=\${encodeURIComponent(query)}&count=5\`, {
        headers: { "Accept": "application/json", "X-Subscription-Token": Deno.env.get("BRAVE_API_KEY")! },
      });
      return { engine, results: await r.json() };
    }
    return { engine, results: [] };
  });
  
  const results = await Promise.all(searches);
  return new Response(JSON.stringify({ query, results, timestamp: new Date().toISOString() }), {
    headers: { "Content-Type": "application/json" },
  });
});`,

  "vector-search": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { query, threshold = 0.7, limit = 10 } = await req.json();
  
  // Generate embedding via OpenAI
  const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": \`Bearer \${Deno.env.get("OPENAI_API_KEY")}\`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
  });
  const { data } = await embeddingRes.json();
  const embedding = data[0].embedding;
  
  // pgvector similarity search
  const { data: results, error } = await supabase.rpc("match_functions", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });
  
  return new Response(JSON.stringify({ query, results: results || [], error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});`,

  "kimi-autodeploy": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const KIMI_KEY = Deno.env.get("KIMI_API_KEY")!;
const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN")!;
const PROJECT_REF = Deno.env.get("SUPABASE_PROJECT_REF")!;

serve(async (req) => {
  const { task, functionName } = await req.json();
  
  // 1. KIMI generates the Edge Function code
  const kimiRes = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": \`Bearer \${KIMI_KEY}\`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "kimi-k2-5",
      messages: [
        { role: "system", content: "You are an expert Deno/TypeScript developer. Write a complete Supabase Edge Function for the given task. Return ONLY the TypeScript code, no markdown." },
        { role: "user", content: task },
      ],
    }),
  });
  const kimiData = await kimiRes.json();
  const code = kimiData.choices[0].message.content;
  
  // 2. Deploy to Supabase via Management API
  const deployRes = await fetch(\`https://api.supabase.com/v1/projects/\${PROJECT_REF}/functions\`, {
    method: "POST",
    headers: { "Authorization": \`Bearer \${SUPABASE_ACCESS_TOKEN}\`, "Content-Type": "application/json" },
    body: JSON.stringify({ slug: functionName, name: functionName, body: code, verify_jwt: false }),
  });
  
  const deployData = await deployRes.json();
  return new Response(JSON.stringify({ success: deployRes.ok, functionName, code, deploy: deployData }), {
    headers: { "Content-Type": "application/json" },
  });
});`,

  "image-router": `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { prompt, provider = "dall-e-3", size = "1024x1024", quality = "standard" } = await req.json();
  
  const providers: Record<string, () => Promise<string>> = {
    "dall-e-3": async () => {
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Authorization": \`Bearer \${Deno.env.get("OPENAI_API_KEY")}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size, quality }),
      });
      const d = await r.json();
      return d.data[0].url;
    },
    "stable-diffusion": async () => {
      const r = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
        method: "POST",
        headers: { "Authorization": \`Bearer \${Deno.env.get("STABILITY_API_KEY")}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ text_prompts: [{ text: prompt }], cfg_scale: 7, height: 1024, width: 1024, steps: 30, samples: 1 }),
      });
      const d = await r.json();
      return \`data:image/png;base64,\${d.artifacts[0].base64}\`;
    },
  };
  
  const imageUrl = await (providers[provider] || providers["dall-e-3"])();
  return new Response(JSON.stringify({ url: imageUrl, provider, prompt }), {
    headers: { "Content-Type": "application/json" },
  });
});`,
};

export default function AutoDeploy() {
  const [selectedTemplate, setSelectedTemplate] = useState("llm-router");
  const [functionName, setFunctionName] = useState("kimi-llm-router");
  const [projectRef, setProjectRef] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [kimiTask, setKimiTask] = useState("");

  const { data: templates } = trpc.templates.list.useQuery();
  const { data: executions, refetch: refetchExec } = trpc.orchestrator.history.useQuery({ limit: 10 });

  const deployMutation = trpc.templates.deploy.useMutation({
    onSuccess: (data) => {
      setDeployResult(data);
      toast.success(`Edge Function "${functionName}" deployed successfully!`);
      refetchExec();
    },
    onError: (err) => {
      toast.error("Deploy failed: " + err.message);
    },
  });

  const kimiGenerateMutation = trpc.orchestrator.chat.useMutation({
    onSuccess: (data) => {
      const code = data.response;
      setCustomCode(code);
      setUseCustom(true);
      toast.success("KIMI generated Edge Function code!");
    },
    onError: (err: any) => toast.error("KIMI error: " + err.message),
  });

  const handleDeploy = () => {
    if (!projectRef || !accessToken) {
      toast.error("Please provide Supabase Project Ref and Access Token");
      return;
    }
    const code = useCustom ? customCode : TEMPLATE_SNIPPETS[selectedTemplate];
    deployMutation.mutate({
      slug: selectedTemplate,
      projectId: projectRef,
      accessToken,
    });
  };

  const handleKimiGenerate = () => {
    if (!kimiTask.trim()) return;
    kimiGenerateMutation.mutate({
      messages: [{ role: "user" as const, content: `Write a complete Supabase Edge Function (Deno TypeScript) for this task: ${kimiTask}\n\nReturn ONLY the TypeScript code without markdown code blocks.` }],
      enableTools: false,
    });
  };

  const templateList = Array.isArray(templates) ? templates : [];
  const executionList = Array.isArray(executions) ? executions : [];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" /> Auto-Deploy Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          KIMI autonomously writes Edge Function code and deploys it via Supabase Management API.
        </p>
      </div>

      {/* Pipeline visualization */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { step: "1", label: "Task Description", icon: Terminal, color: "text-blue-400" },
              { step: "→", label: "", icon: null, color: "" },
              { step: "2", label: "KIMI K2.5 Writes Code", icon: Zap, color: "text-primary" },
              { step: "→", label: "", icon: null, color: "" },
              { step: "3", label: "Code Review", icon: Code2, color: "text-purple-400" },
              { step: "→", label: "", icon: null, color: "" },
              { step: "4", label: "Supabase Deploy API", icon: Rocket, color: "text-green-400" },
              { step: "→", label: "", icon: null, color: "" },
              { step: "5", label: "Edge Function Live", icon: CheckCircle2, color: "text-cyan-400" },
            ].map((s, i) => s.icon ? (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/20 border border-border">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.step}. {s.label}</span>
              </div>
            ) : (
              <span key={i} className="text-muted-foreground/40 text-sm">→</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Configuration */}
        <div className="space-y-4">
          <Tabs defaultValue="template">
            <TabsList className="bg-muted/30 mb-4">
              <TabsTrigger value="template" className="text-xs gap-2">
                <Package className="h-3.5 w-3.5" /> Templates
              </TabsTrigger>
              <TabsTrigger value="kimi" className="text-xs gap-2">
                <Zap className="h-3.5 w-3.5" /> KIMI Generate
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs gap-2">
                <Code2 className="h-3.5 w-3.5" /> Custom Code
              </TabsTrigger>
            </TabsList>

            {/* Template tab */}
            <TabsContent value="template" className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Select Template</Label>
                <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); setUseCustom(false); setFunctionName(`kimi-${v}`); }}>
                  <SelectTrigger className="bg-muted/20 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm-router">LLM Router (KIMI + DeepSeek)</SelectItem>
                    <SelectItem value="image-router">Image Router (DALL-E + SD)</SelectItem>
                    <SelectItem value="parallel-search">Parallel Search (Multi-engine)</SelectItem>
                    <SelectItem value="vector-search">Vector Search (pgvector)</SelectItem>
                    <SelectItem value="kimi-autodeploy">KIMI Auto-Deploy (Meta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">{selectedTemplate}.ts</span>
                </div>
                <pre className="p-3 text-xs text-muted-foreground overflow-auto max-h-48 font-mono leading-relaxed">
                  {TEMPLATE_SNIPPETS[selectedTemplate]?.slice(0, 600)}...
                </pre>
              </div>
            </TabsContent>

            {/* KIMI Generate tab */}
            <TabsContent value="kimi" className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Describe what the Edge Function should do</Label>
                <Textarea
                  value={kimiTask}
                  onChange={e => setKimiTask(e.target.value)}
                  placeholder="e.g. Create an Edge Function that accepts a URL, scrapes the page content, and returns a summary using KIMI K2.5..."
                  className="bg-muted/20 border-border resize-none"
                  rows={4}
                />
              </div>
              <Button
                onClick={handleKimiGenerate}
                disabled={kimiGenerateMutation.isPending || !kimiTask.trim()}
                className="w-full gap-2"
              >
                {kimiGenerateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Generate with KIMI K2.5
              </Button>
              {useCustom && customCode && (
                <div className="rounded-lg bg-green-500/5 border border-green-500/20 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-green-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs text-green-400">KIMI generated code ready</span>
                  </div>
                  <pre className="p-3 text-xs text-muted-foreground overflow-auto max-h-48 font-mono leading-relaxed">
                    {customCode.slice(0, 500)}...
                  </pre>
                </div>
              )}
            </TabsContent>

            {/* Custom Code tab */}
            <TabsContent value="custom" className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Edge Function Code (Deno TypeScript)</Label>
                <Textarea
                  value={customCode}
                  onChange={e => { setCustomCode(e.target.value); setUseCustom(true); }}
                  placeholder={`import { serve } from "https://deno.land/std@0.168.0/http/server.ts";\n\nserve(async (req) => {\n  return new Response("Hello from KIMI!");\n});`}
                  className="bg-muted/20 border-border resize-none font-mono text-xs"
                  rows={10}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Deploy config */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" /> Deploy Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Function Name</Label>
                <Input value={functionName} onChange={e => setFunctionName(e.target.value)} placeholder="my-edge-function" className="bg-muted/20 border-border font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Supabase Project Ref</Label>
                <Input value={projectRef} onChange={e => setProjectRef(e.target.value)} placeholder="qhscjlfavyqkaplcwhxu" className="bg-muted/20 border-border font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Supabase Access Token (PAT)</Label>
                <Input value={accessToken} onChange={e => setAccessToken(e.target.value)} type="password" placeholder="sbp_..." className="bg-muted/20 border-border font-mono text-sm" />
              </div>
              <Button
                onClick={handleDeploy}
                disabled={deployMutation.isPending || !projectRef || !accessToken}
                className="w-full gap-2"
              >
                {deployMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Deploy Edge Function
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results & History */}
        <div className="space-y-4">
          {/* Deploy result */}
          {deployResult && (
            <Card className={`border ${deployResult.success ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {deployResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  {deployResult.success ? "Deployed Successfully" : "Deploy Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deployResult.functionUrl && (
                  <div className="p-2 rounded bg-muted/20 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Function URL:</p>
                    <code className="text-xs text-primary break-all">{deployResult.functionUrl}</code>
                  </div>
                )}
                {deployResult.error && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">{deployResult.error}</p>
                  </div>
                )}
                {deployResult.durationMs && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Deployed in {deployResult.durationMs}ms
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent executions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" /> Recent Deployments
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => refetchExec()} className="h-7 w-7 p-0">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {executionList.length === 0 ? (
                <div className="text-center py-6">
                  <Rocket className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-xs text-muted-foreground">No deployments yet</p>
                </div>
              ) : (
                executionList.slice(0, 8).map((exec: any) => (
                  <div key={exec.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border">
                    <div className="shrink-0 mt-0.5">
                      {exec.status === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      ) : exec.status === "error" ? (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">{exec.functionName || exec.tool || "deployment"}</span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${exec.status === "success" ? "text-green-400 border-green-500/30" : exec.status === "error" ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30"}`}>
                          {exec.status}
                        </Badge>
                      </div>
                      {exec.durationMs && <p className="text-xs text-muted-foreground">{exec.durationMs}ms</p>}
                      {exec.createdAt && <p className="text-xs text-muted-foreground/60">{new Date(exec.createdAt).toLocaleString()}</p>}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Info box */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-foreground font-medium">Autonomous Deploy Notes</p>
                  <p>KIMI can deploy Edge Functions autonomously when given a task description. The Supabase PAT is stored in Dexter Vault and retrieved automatically.</p>
                  <p>All deployments are logged to Sentinel.app for security auditing.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
