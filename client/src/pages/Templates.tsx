import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, Rocket, CheckCircle2, Copy, ExternalLink, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { EDGE_FUNCTION_TEMPLATES_DATA } from "../../../server/functionData";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  routing:    { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
  search:     { bg: "bg-blue-500/10",   text: "text-blue-300",   border: "border-blue-500/20" },
  vector:     { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20" },
  automation: { bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/20" },
  image:      { bg: "bg-green-500/10",  text: "text-green-300",  border: "border-green-500/20" },
};

function CodeBlock({ code }: { code: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };
  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <pre className="bg-muted/20 border border-border rounded-lg p-4 text-xs text-foreground overflow-x-auto max-h-96 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DeployDialog({ template }: { template: typeof EDGE_FUNCTION_TEMPLATES_DATA[0] }) {
  const [projectId, setProjectId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const deployMutation = trpc.templates.deploy.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${template.name} deployed successfully in ${data.durationMs}ms`);
        utils.templates.list.invalidate();
        setOpen(false);
      } else {
        toast.error("Deployment failed: " + JSON.stringify(data.data));
      }
    },
    onError: (err) => toast.error("Deploy error: " + err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-7 text-xs">
          <Rocket className="h-3.5 w-3.5" /> Deploy
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-primary" /> Deploy to Supabase
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground">
            Deploy <span className="text-foreground font-medium">{template.name}</span> as a Supabase Edge Function via the Management API.
          </p>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Supabase Project ID</Label>
            <Input
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="e.g. abcdefghijklmnop"
              className="bg-muted/20 border-border text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Supabase Access Token</Label>
            <Input
              type="password"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="sbp_..."
              className="bg-muted/20 border-border text-sm h-8"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get from <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/dashboard/account/tokens</a>
            </p>
          </div>
          {template.envVarsRequired && (template.envVarsRequired as string[]).length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-400 mb-1">Required Environment Variables</p>
              <div className="flex flex-wrap gap-1">
                {(template.envVarsRequired as string[]).map(v => (
                  <code key={v} className="text-xs bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">{v}</code>
                ))}
              </div>
            </div>
          )}
          <Button
            onClick={() => deployMutation.mutate({ slug: template.slug, projectId, accessToken })}
            disabled={!projectId || !accessToken || deployMutation.isPending}
            className="w-full gap-2"
          >
            {deployMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {deployMutation.isPending ? "Deploying..." : "Deploy Edge Function"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Templates() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const { data: dbTemplates } = trpc.templates.list.useQuery();
  const seedMutation = trpc.templates.seed.useMutation({
    onSuccess: (data) => toast.success(`${data.seeded} templates seeded to database`),
    onError: () => toast.error("Seed failed — you need to be logged in as admin"),
  });

  const templates = EDGE_FUNCTION_TEMPLATES_DATA;
  const selected = templates.find(t => t.slug === selectedSlug);
  const deployedSlugs = new Set(dbTemplates?.filter(t => t.isDeployed).map(t => t.slug) || []);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" /> Edge Function Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Production-ready Supabase Edge Functions. Deploy directly via KIMI Auto-Deploy pipeline.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="gap-2 shrink-0">
          {seedMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Seed to DB
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Template list */}
        <div className="space-y-3">
          {templates.map(template => {
            const s = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.routing;
            const isDeployed = deployedSlugs.has(template.slug);
            const isSelected = selectedSlug === template.slug;
            return (
              <Card
                key={template.slug}
                className={`bg-card border-border cursor-pointer transition-all ${isSelected ? "border-primary/50 bg-primary/5" : "hover:border-primary/20"}`}
                onClick={() => setSelectedSlug(template.slug)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{template.name}</p>
                        {isDeployed && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />}
                      </div>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border mt-1 ${s.bg} ${s.text} ${s.border}`}>
                        {template.category}
                      </span>
                    </div>
                    <DeployDialog template={template} />
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                  {template.envVarsRequired && (template.envVarsRequired as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(template.envVarsRequired as string[]).slice(0, 3).map(v => (
                        <code key={v} className="text-xs bg-muted/30 px-1 py-0.5 rounded text-muted-foreground">{v}</code>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Code viewer */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card className="bg-card border-border sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" /> {selected.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <DeployDialog template={selected} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </CardHeader>
              <CardContent>
                <CodeBlock code={selected.code} />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <Code2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a template to view its code</p>
                <p className="text-xs text-muted-foreground mt-1">Each template is production-ready and deployable to Supabase Edge Functions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
