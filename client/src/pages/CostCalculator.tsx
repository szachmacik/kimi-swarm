import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingDown, Zap, ArrowUpDown } from "lucide-react";
import { FUNCTION_REGISTRY_DATA } from "../../../server/functionData";

const CATEGORIES = ["all", "llm", "image", "video", "audio", "search", "code"];

const CATEGORY_COLORS: Record<string, string> = {
  llm: "text-purple-400", image: "text-green-400", video: "text-red-400",
  audio: "text-amber-400", search: "text-blue-400", code: "text-cyan-400",
  database: "text-indigo-400", communication: "text-pink-400",
};

export default function CostCalculator() {
  const [category, setCategory] = useState("llm");
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [calls, setCalls] = useState(1000);
  const [sortBy, setSortBy] = useState<"cost" | "name">("cost");

  const { data: comparison, isLoading } = trpc.cost.compare.useQuery({
    category: category === "all" ? undefined : category,
    inputTokens,
    outputTokens,
    calls,
  });

  const sorted = useMemo(() => {
    if (!comparison) return [];
    return [...comparison].sort((a, b) =>
      sortBy === "cost" ? a.totalCost - b.totalCost : a.displayName.localeCompare(b.displayName)
    );
  }, [comparison, sortBy]);

  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const savings = cheapest && mostExpensive ? mostExpensive.totalCost - cheapest.totalCost : 0;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" /> API Cost Calculator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare real-time pricing across 80+ API functions. Find the most cost-effective option for your workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Controls */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Category</Label>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left px-3 py-1.5 rounded text-xs capitalize transition-all ${
                      category === cat
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Input Tokens</Label>
                <Input
                  type="number"
                  value={inputTokens}
                  onChange={e => setInputTokens(Number(e.target.value))}
                  className="bg-muted/20 border-border text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Output Tokens</Label>
                <Input
                  type="number"
                  value={outputTokens}
                  onChange={e => setOutputTokens(Number(e.target.value))}
                  className="bg-muted/20 border-border text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">API Calls / Month</Label>
                <Input
                  type="number"
                  value={calls}
                  onChange={e => setCalls(Number(e.target.value))}
                  className="bg-muted/20 border-border text-sm h-8"
                />
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
              <div className="space-y-1">
                {[
                  { label: "Light usage", it: 500, ot: 200, c: 100 },
                  { label: "Medium", it: 1000, ot: 500, c: 1000 },
                  { label: "Heavy", it: 4000, ot: 2000, c: 10000 },
                  { label: "Enterprise", it: 8000, ot: 4000, c: 100000 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setInputTokens(p.it); setOutputTokens(p.ot); setCalls(p.c); }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                  >
                    {p.label} <span className="opacity-50">({p.c.toLocaleString()} calls)</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary cards */}
          {cheapest && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Cheapest</p>
                  <p className="text-sm font-bold text-green-400">{cheapest.displayName}</p>
                  <p className="text-xs text-green-400">${cheapest.totalCost.toFixed(4)}/mo</p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Most Expensive</p>
                  <p className="text-sm font-bold text-red-400">{mostExpensive?.displayName}</p>
                  <p className="text-xs text-red-400">${mostExpensive?.totalCost.toFixed(4)}/mo</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Max Savings
                  </p>
                  <p className="text-sm font-bold text-amber-400">${savings.toFixed(4)}/mo</p>
                  <p className="text-xs text-muted-foreground">vs most expensive</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sort control */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{sorted.length} functions compared</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortBy(s => s === "cost" ? "name" : "cost")}
              className="gap-1 h-7 text-xs"
            >
              <ArrowUpDown className="h-3 w-3" />
              Sort by {sortBy === "cost" ? "name" : "cost"}
            </Button>
          </div>

          {/* Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">#</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Function</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Provider</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">$/1K tokens</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Per Call</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Monthly ({calls.toLocaleString()} calls)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">Loading...</td></tr>
                    ) : sorted.map((fn, i) => {
                      const isCheapest = i === 0;
                      const isExpensive = i === sorted.length - 1 && sorted.length > 1;
                      const catColor = CATEGORY_COLORS[fn.category] || "text-slate-400";
                      return (
                        <tr key={fn.name} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${isCheapest ? "bg-green-500/5" : ""}`}>
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{fn.displayName}</span>
                              {isCheapest && <Badge className="text-xs bg-green-500/10 text-green-400 border-green-500/20 h-4">Best</Badge>}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{fn.provider}</td>
                          <td className="p-3 text-right font-mono">
                            <span className={catColor}>${fn.costPer1k?.toFixed(4) || "—"}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-muted-foreground">${fn.costPerCall.toFixed(6)}</td>
                          <td className={`p-3 text-right font-mono font-semibold ${isCheapest ? "text-green-400" : isExpensive ? "text-red-400" : "text-foreground"}`}>
                            ${fn.totalCost.toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* KIMI tip */}
          <Card className="bg-primary/5 border-primary/20 border-dashed">
            <CardContent className="p-3 flex items-start gap-3">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">KIMI Cost Optimization:</span> KIMI automatically selects the cheapest model that meets quality requirements for each step. For {calls.toLocaleString()} calls/month, switching from the most expensive to the cheapest option saves <span className="text-green-400 font-medium">${savings.toFixed(2)}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
