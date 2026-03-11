import { getLoginUrl } from "@/const";
import { Zap, Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">KIMI SWARM</h1>
            <p className="text-xs text-muted-foreground">Autonomous AI Orchestration Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Access restricted badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400 font-medium">Restricted Access — Admin Only</p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Admin Authentication</h2>
              <p className="text-xs text-muted-foreground">Sign in to access the dashboard</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            This platform is restricted to authorized administrators only. Unauthorized access attempts are logged and monitored by <span className="text-red-400 font-medium">Sentinel.app</span>.
          </p>

          <Button
            className="w-full gap-2 h-11 text-sm font-semibold"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            <ShieldCheck className="h-4 w-4" />
            Sign in with Manus
          </Button>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Functions", value: "83" },
                { label: "Templates", value: "5" },
                { label: "Integrations", value: "2" },
              ].map(stat => (
                <div key={stat.label} className="p-2 rounded-lg bg-muted/20">
                  <p className="text-sm font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Monitored by Sentinel.app · Agent ID: 60972574
        </p>
      </div>
    </div>
  );
}
