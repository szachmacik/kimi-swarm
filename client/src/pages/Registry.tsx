import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Database, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";
import { FUNCTION_REGISTRY_DATA } from "../../../server/functionData";

const CATEGORIES = ["all", "llm", "image", "video", "audio", "search", "code", "database", "communication", "vector", "utility"];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  llm:           { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
  image:         { bg: "bg-green-500/10",  text: "text-green-300",  border: "border-green-500/20" },
  video:         { bg: "bg-red-500/10",    text: "text-red-300",    border: "border-red-500/20" },
  audio:         { bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/20" },
  search:        { bg: "bg-blue-500/10",   text: "text-blue-300",   border: "border-blue-500/20" },
  code:          { bg: "bg-cyan-500/10",   text: "text-cyan-300",   border: "border-cyan-500/20" },
  database:      { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
  communication: { bg: "bg-pink-500/10",   text: "text-pink-300",   border: "border-pink-500/20" },
  vector:        { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20" },
  utility:       { bg: "bg-slate-500/10",  text: "text-slate-300",  border: "border-slate-500/20" },
};

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLES[category] || CATEGORY_STYLES.utility;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {category}
    </span>
  );
}

function FunctionCard({ fn }: { fn: typeof FUNCTION_REGISTRY_DATA[0] }) {
  const tags = fn.tags as string[] || [];
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{fn.displayName}</p>
            <p className="text-xs text-muted-foreground">{fn.provider}</p>
          </div>
          <CategoryBadge category={fn.category} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{fn.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">{tag}</span>
            ))}
            {tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
          </div>
          {fn.costPer1k !== undefined && fn.costPer1k !== null && (
            <span className="text-xs font-mono text-green-400">
              {fn.costPer1k === 0 ? "Free" : `$${fn.costPer1k}`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Registry() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: exportData } = trpc.registry.exportJson.useQuery();

  const filtered = useMemo(() => {
    let fns = FUNCTION_REGISTRY_DATA;
    if (activeCategory !== "all") {
      fns = fns.filter(f => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      fns = fns.filter(f =>
        f.displayName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.provider.toLowerCase().includes(q) ||
        (f.tags as string[]).some(t => t.toLowerCase().includes(q))
      );
    }
    return fns;
  }, [search, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FUNCTION_REGISTRY_DATA.length };
    for (const fn of FUNCTION_REGISTRY_DATA) {
      counts[fn.category] = (counts[fn.category] || 0) + 1;
    }
    return counts;
  }, []);

  const handleExportJson = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kimi-swarm-function-registry.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Registry exported as JSON");
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Function Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {FUNCTION_REGISTRY_DATA.length} API functions across {CATEGORIES.length - 1} categories — ready for KIMI orchestration
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportJson} className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Export JSON
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search functions, providers, tags..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat] || 0;
          const isActive = activeCategory === cat;
          const s = cat !== "all" ? CATEGORY_STYLES[cat] : null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? s ? `${s.bg} ${s.text} ${s.border}` : "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/30 text-muted-foreground border-border hover:border-primary/20"
              }`}
            >
              <span className="capitalize">{cat}</span>
              <span className={`text-xs ${isActive ? "opacity-70" : "opacity-50"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="text-foreground font-medium">{filtered.length}</span> functions
        {search && ` matching "${search}"`}
        {activeCategory !== "all" && ` in ${activeCategory}`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(fn => (
          <FunctionCard key={fn.name} fn={fn} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No functions found for "{search}"</p>
        </div>
      )}

      {/* pgvector info */}
      <Card className="bg-card border-border border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">pgvector Semantic Search Ready</p>
              <p className="text-xs text-muted-foreground mt-1">
                Export the JSON registry and use the included SQL to set up pgvector in Supabase.
                OpenAI text-embedding-3-small (1536d) embeddings enable semantic function discovery.
              </p>
              <Button size="sm" variant="outline" onClick={handleExportJson} className="mt-2 gap-1 text-xs h-7">
                <Download className="h-3 w-3" /> Download with pgvector SQL
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
