import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Search, Zap, Database, Loader2, Star, DollarSign, Clock,
  ChevronRight, Layers, Sparkles, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const EXAMPLE_QUERIES = [
  "generate image from text",
  "speech to text transcription",
  "send email notification",
  "search the web",
  "run code in sandbox",
  "store data in database",
  "translate text to another language",
  "analyze sentiment of text",
];

const CATEGORY_COLORS: Record<string, string> = {
  llm: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  image: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  video: "bg-red-500/20 text-red-400 border-red-500/30",
  audio: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  search: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  code: "bg-green-500/20 text-green-400 border-green-500/30",
  database: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  communication: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  storage: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  analytics: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold ${pct >= 80 ? "text-green-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState([0.5]);
  const [limit, setLimit] = useState([10]);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // Embedding generation state
  const [embedProgress, setEmbedProgress] = useState(0);
  const [embedStatus, setEmbedStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [embedStats, setEmbedStats] = useState<{ seeded: number; failed: number; total: number } | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const searchMutation = trpc.registry.semanticSearch.useMutation({
    onSuccess: (data) => {
      setResults(data.results || []);
      setSearchTime(data.durationMs || null);
      setSearched(true);
      toast.success(`Found ${data.results?.length || 0} similar functions in ${data.durationMs}ms`);
    },
    onError: (err) => {
      toast.error("Search failed: " + err.message);
      setSearched(true);
      setResults([]);
    },
  });

  const { data: registryStats } = trpc.registry.stats.useQuery();

  const seedEmbedMutation = trpc.registry.seedEmbeddings.useMutation({
    onMutate: () => {
      setEmbedStatus("running");
      setEmbedProgress(3);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        setEmbedProgress(p => {
          if (p >= 92) return p;
          return p + Math.random() * 5;
        });
      }, 700);
    },
    onSuccess: (data) => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setEmbedProgress(100);
      setEmbedStatus("done");
      setEmbedStats({ seeded: data.seeded, failed: data.failed, total: data.total });
      toast.success(`Embeddings generated: ${data.seeded}/${data.total} functions indexed`);
    },
    onError: (err) => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setEmbedStatus("error");
      setEmbedProgress(0);
      toast.error("Embedding generation failed: " + err.message);
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(false);
    searchMutation.mutate({
      query: query.trim(),
      threshold: threshold[0],
      limit: limit[0],
    });
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" /> Semantic Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find functions by meaning, not just keywords. Powered by pgvector cosine similarity search.
        </p>
      </div>

      {/* Embedding Generator Panel */}
      <Card className={`border ${embedStatus === "done" ? "border-green-500/30 bg-green-500/5" : embedStatus === "error" ? "border-red-500/30 bg-red-500/5" : embedStatus === "running" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${embedStatus === "done" ? "bg-green-500/10" : embedStatus === "running" ? "bg-primary/10" : "bg-muted/30"}`}>
                {embedStatus === "running" ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : embedStatus === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : embedStatus === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">pgvector Embeddings</p>
                <p className="text-xs text-muted-foreground">
                  {embedStatus === "idle" && "Generate 1536-dim KIMI embeddings for all 83 functions to enable semantic search"}
                  {embedStatus === "running" && "Generating embeddings via moonshot-v1-embedding API… (~60s for 83 functions)"}
                  {embedStatus === "done" && embedStats && `✓ ${embedStats.seeded} indexed, ${embedStats.failed} failed — semantic search is now fully operational`}
                  {embedStatus === "error" && "Generation failed — check KIMI API key and try again"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {embedStatus === "done" && embedStats && (
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <span className="text-green-400 font-medium">{embedStats.seeded} indexed</span>
                  {embedStats.failed > 0 && <span className="text-red-400">{embedStats.failed} failed</span>}
                </div>
              )}
              <Button
                size="sm"
                variant={embedStatus === "done" ? "outline" : "default"}
                onClick={() => { setEmbedProgress(0); seedEmbedMutation.mutate(); }}
                disabled={embedStatus === "running"}
                className="gap-2 shrink-0"
              >
                {embedStatus === "running" ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
                ) : embedStatus === "done" ? (
                  <><RefreshCw className="h-3.5 w-3.5" />Re-generate</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" />Generate Embeddings</>
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {(embedStatus === "running" || (embedStatus === "done" && embedProgress === 100)) && (
            <div className="mt-3 space-y-1.5">
              <Progress value={embedProgress} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {embedStatus === "running"
                    ? `Processing functions… ${Math.round((embedProgress / 100) * 83)}/83`
                    : "Complete"}
                </span>
                <span>{Math.round(embedProgress)}%</span>
              </div>
            </div>
          )}

          {/* Info row when idle */}
          {embedStatus === "idle" && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-cyan-400" />moonshot-v1-embedding</span>
              <span className="flex items-center gap-1"><Database className="h-3 w-3 text-primary" />1536 dimensions</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />Cosine similarity</span>
              <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-purple-400" />83 functions</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Indexed Functions", value: registryStats?.total || 83, icon: Database, color: "text-primary" },
          { label: "Categories", value: Object.keys(registryStats?.byCategory || {}).length || 10, icon: Layers, color: "text-purple-400" },
          { label: "Vector Dims", value: "1536", icon: Zap, color: "text-cyan-400" },
          { label: "Similarity", value: "Cosine", icon: Star, color: "text-amber-400" },
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Search controls */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Search Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Similarity Threshold: {threshold[0].toFixed(2)}</Label>
                <Slider
                  value={threshold}
                  onValueChange={setThreshold}
                  min={0.1}
                  max={0.99}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Broad (0.1)</span>
                  <span>Exact (0.99)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max Results: {limit[0]}</Label>
                <Slider
                  value={limit}
                  onValueChange={setLimit}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground space-y-1">
                <p className="text-foreground font-medium mb-1">How it works:</p>
                <p>1. Query → moonshot-v1-embedding</p>
                <p>2. 1536-dim vector stored in pgvector</p>
                <p>3. Cosine similarity match against registry</p>
                <p>4. Results ranked by semantic relevance</p>
              </div>
            </CardContent>
          </Card>

          {/* Example queries */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Example Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {EXAMPLE_QUERIES.map(q => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded bg-muted/20 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-all flex items-center gap-2"
                >
                  <ChevronRight className="h-3 w-3 shrink-0" />
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Search results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search input */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                    placeholder="Describe what you want to do in natural language…"
                    className="pl-9 bg-muted/20 border-border"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searchMutation.isPending || !query.trim()} className="gap-2 shrink-0">
                  {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
              {searchTime && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {results.length} results in {searchTime}ms
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {searchMutation.isPending && (
            <Card className="bg-card border-border">
              <CardContent className="p-8 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <div>
                  <p className="text-sm text-foreground">Generating embedding and searching…</p>
                  <p className="text-xs text-muted-foreground mt-1">moonshot-v1-embedding → pgvector cosine similarity</p>
                </div>
              </CardContent>
            </Card>
          )}

          {searched && !searchMutation.isPending && results.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No functions found above threshold {threshold[0].toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Try lowering the threshold or rephrasing your query</p>
                {embedStatus === "idle" && (
                  <p className="text-xs text-amber-400 mt-2">Tip: Generate embeddings first for best results</p>
                )}
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((fn: any, i: number) => (
                <Card key={fn.id || i} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">{fn.name}</span>
                          <Badge className={`text-xs border ${CATEGORY_COLORS[fn.category] || "bg-muted/20 text-muted-foreground border-border"}`}>
                            {fn.category}
                          </Badge>
                          {fn.provider && <span className="text-xs text-muted-foreground">{fn.provider}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{fn.description}</p>
                        <SimilarityBar score={fn.similarity || 0} />
                        <div className="flex items-center gap-4 mt-2">
                          {fn.costPer1k && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />${fn.costPer1k}/1k
                            </span>
                          )}
                          {fn.latencyMs && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{fn.latencyMs}ms avg
                            </span>
                          )}
                          {fn.endpoint && (
                            <code className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                              {fn.endpoint}
                            </code>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
