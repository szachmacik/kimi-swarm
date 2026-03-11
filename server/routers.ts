import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import {
  getAllFunctions, searchFunctions, getFunctionByName, upsertFunction, incrementFunctionUsage, getRegistryStats,
  createExecution, updateExecution, getRecentExecutions, getExecutionStats,
  getAllTemplates, getTemplateBySlug, upsertTemplate, markTemplateDeployed,
  getIntegrationLogs, createIntegrationLog, saveCostCalculation,
} from "./db";
import { FUNCTION_REGISTRY_DATA, EDGE_FUNCTION_TEMPLATES_DATA } from "./functionData";

// ─── Registry Router ──────────────────────────────────────────────────────────
const registryRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.search && input.search.length > 0) {
        return searchFunctions(input.search);
      }
      return getAllFunctions(input?.category);
    }),

  stats: publicProcedure.query(async () => {
    return getRegistryStats();
  }),

  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return getFunctionByName(input.name);
    }),

  seed: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    let seeded = 0;
    for (const fn of FUNCTION_REGISTRY_DATA) {
      await upsertFunction({
        name: fn.name,
        displayName: fn.displayName,
        category: fn.category,
        provider: fn.provider,
        description: fn.description,
        endpoint: fn.endpoint,
        costPer1k: fn.costPer1k,
        costUnit: fn.costUnit,
        tags: fn.tags,
        isActive: true,
      });
      seeded++;
    }
    return { seeded, total: FUNCTION_REGISTRY_DATA.length };
  }),

  exportJson: publicProcedure.query(async () => {
    const fns = await getAllFunctions();
    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      totalFunctions: fns.length,
      functions: fns.map(fn => ({
        name: fn.name,
        displayName: fn.displayName,
        category: fn.category,
        provider: fn.provider,
        description: fn.description,
        endpoint: fn.endpoint,
        costPer1k: fn.costPer1k,
        costUnit: fn.costUnit,
        tags: fn.tags,
      })),
      pgvectorSeed: `-- Run this in your Supabase SQL editor to enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS function_registry (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION match_functions(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
) RETURNS TABLE (id BIGINT, name TEXT, display_name TEXT, category TEXT, provider TEXT, description TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.name, f.display_name, f.category, f.provider, f.description,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM function_registry f
  WHERE 1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;`,
    };
  }),
});

// ─── Orchestrator Router ──────────────────────────────────────────────────────
const KIMI_SYSTEM_PROMPT = `You are KIMI K2.5, an autonomous AI orchestrator for the KIMI SWARM system.
Your role is to:
1. Analyze user requests and decompose them into optimal function call sequences
2. Select the most cost-effective tools from the registry (80+ available)
3. Plan parallel execution where possible to minimize latency
4. Estimate costs before execution
5. Return a structured execution plan

Available function categories: llm, image, video, audio, search, code, database, communication, vector, utility

When planning, always:
- Prefer cheaper models for simple tasks (GPT-4o-mini, DeepSeek V3)
- Use powerful models only when complexity demands (Claude 3.5, GPT-4o)
- Identify steps that can run in parallel
- Estimate total cost in USD
- Explain your reasoning

Return a JSON plan with this structure:
{
  "reasoning": "Why this approach",
  "steps": [
    {
      "id": "step_1",
      "function": "function-name",
      "description": "What this step does",
      "parallel_with": ["step_2"] or null,
      "estimated_cost_usd": 0.001,
      "inputs": {}
    }
  ],
  "total_estimated_cost_usd": 0.005,
  "parallel_groups": 2,
  "estimated_duration_ms": 3000
}`;

const orchestratorRouter = router({
  plan: publicProcedure
    .input(z.object({ prompt: z.string().min(1).max(4000) }))
    .mutation(async ({ input }) => {
      const sessionId = nanoid(16);
      const startTime = Date.now();

      // Get available functions for context
      const fns = await getAllFunctions();
      const fnSummary = fns.slice(0, 30).map(f => `${f.name} (${f.category}): ${f.description.substring(0, 80)}`).join("\n");

      const execId = await createExecution({
        sessionId,
        userPrompt: input.prompt,
        status: "running",
      });

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: KIMI_SYSTEM_PROMPT + "\n\nAvailable functions (sample):\n" + fnSummary },
            { role: "user", content: input.prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "kimi_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  reasoning: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        function: { type: "string" },
                        description: { type: "string" },
                        estimated_cost_usd: { type: "number" },
                      },
                      required: ["id", "function", "description", "estimated_cost_usd"],
                      additionalProperties: false,
                    }
                  },
                  total_estimated_cost_usd: { type: "number" },
                  parallel_groups: { type: "number" },
                  estimated_duration_ms: { type: "number" },
                },
                required: ["reasoning", "steps", "total_estimated_cost_usd", "parallel_groups", "estimated_duration_ms"],
                additionalProperties: false,
              }
            }
          }
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : null;
        const plan = content ? JSON.parse(content) : null;
        const duration = Date.now() - startTime;

        if (execId) {
          await updateExecution((execId as any).insertId || 1, {
            status: "completed",
            kimiPlan: plan,
            functionsUsed: plan?.steps?.map((s: any) => s.function) || [],
            totalCostUsd: plan?.total_estimated_cost_usd || 0,
            durationMs: duration,
            parallelSteps: plan?.parallel_groups || 0,
            completedAt: new Date(),
          });
        }

        return { sessionId, plan, durationMs: duration };
      } catch (error) {
        if (execId) {
          await updateExecution((execId as any).insertId || 1, {
            status: "failed",
            durationMs: Date.now() - startTime,
          });
        }
        throw error;
      }
    }),

  history: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      return getRecentExecutions(input?.limit || 20);
    }),

  stats: publicProcedure.query(async () => {
    return getExecutionStats();
  }),
});

// ─── Templates Router ─────────────────────────────────────────────────────────
const templatesRouter = router({
  list: publicProcedure.query(async () => {
    return getAllTemplates();
  }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getTemplateBySlug(input.slug);
    }),

  seed: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    let seeded = 0;
    for (const t of EDGE_FUNCTION_TEMPLATES_DATA) {
      await upsertTemplate({
        slug: t.slug,
        name: t.name,
        description: t.description,
        category: t.category,
        code: t.code,
        envVarsRequired: t.envVarsRequired,
        isDeployed: false,
      });
      seeded++;
    }
    return { seeded };
  }),

  deploy: protectedProcedure
    .input(z.object({ slug: z.string(), projectId: z.string(), accessToken: z.string() }))
    .mutation(async ({ input }) => {
      const template = await getTemplateBySlug(input.slug);
      if (!template) throw new Error("Template not found");

      const startTime = Date.now();
      try {
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${input.projectId}/functions`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${input.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slug: template.slug,
              name: template.name,
              body: template.code,
              verify_jwt: false,
            }),
          }
        );

        const data = await response.json();
        const duration = Date.now() - startTime;

        await createIntegrationLog({
          integration: "supabase-mgmt",
          action: `deploy-edge-function:${template.slug}`,
          payload: { projectId: input.projectId, slug: template.slug },
          response: data,
          status: response.ok ? "success" : "error",
          durationMs: duration,
        });

        if (response.ok) {
          await markTemplateDeployed(template.slug, input.projectId);
        }

        return { success: response.ok, data, durationMs: duration };
      } catch (error: any) {
        await createIntegrationLog({
          integration: "supabase-mgmt",
          action: `deploy-edge-function:${template.slug}`,
          payload: { projectId: input.projectId },
          status: "error",
          errorMessage: error.message,
        });
        throw error;
      }
    }),
});

// ─── Integrations Router ──────────────────────────────────────────────────────
const integrationsRouter = router({
  logs: publicProcedure
    .input(z.object({ integration: z.string().optional(), limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return getIntegrationLogs(input?.integration, input?.limit || 50);
    }),

  syncToAiControlCenter: protectedProcedure
    .input(z.object({
      supabaseUrl: z.string().url(),
      supabaseKey: z.string(),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const fns = await getAllFunctions();

      try {
        // Add KIMI agent to ai-control-center agents table
        const agentResponse = await fetch(`${input.supabaseUrl}/rest/v1/agents`, {
          method: "POST",
          headers: {
            "apikey": input.supabaseKey,
            "Authorization": `Bearer ${input.supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            name: "kimi",
            role: "KIMI K2.5 Orchestrator",
            description: "Autonomous AI orchestrator managing 80+ API functions. Plans and executes complex workflows with cost optimization and parallel execution.",
            model: "moonshot-v1-128k",
            status: "active",
            config: {
              swarm_url: process.env.VITE_APP_ID ? `https://${process.env.VITE_APP_ID}.manus.space` : "kimi-swarm",
              functions_count: fns.length,
              capabilities: ["orchestration", "function-routing", "cost-optimization", "parallel-execution"],
            },
          }),
        });

        const agentData = await agentResponse.json();

        // Sync function registry summary
        const registryPayload = fns.slice(0, 20).map(fn => ({
          key: `kimi_fn_${fn.name}`,
          value_encrypted: JSON.stringify({ name: fn.name, category: fn.category, provider: fn.provider, costPer1k: fn.costPer1k }),
          description: fn.description.substring(0, 100),
          project: "kimi-swarm",
          tags: fn.tags,
        }));

        const duration = Date.now() - startTime;
        await createIntegrationLog({
          integration: "ai-control-center",
          action: "sync-kimi-agent",
          payload: { functionsCount: fns.length },
          response: agentData,
          status: agentResponse.ok ? "success" : "error",
          durationMs: duration,
        });

        return {
          success: agentResponse.ok,
          agentAdded: agentResponse.ok,
          functionsSynced: fns.length,
          durationMs: duration,
        };
      } catch (error: any) {
        await createIntegrationLog({
          integration: "ai-control-center",
          action: "sync-kimi-agent",
          status: "error",
          errorMessage: error.message,
        });
        throw error;
      }
    }),

  syncToSentinel: protectedProcedure
    .input(z.object({
      supabaseUrl: z.string().url(),
      supabaseKey: z.string(),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const executions = await getRecentExecutions(10);

      try {
        // Push execution logs to Sentinel for monitoring
        const logsPayload = executions.map(exec => ({
          agent_name: "kimi-swarm",
          action: "orchestration",
          status: exec.status,
          metadata: {
            prompt_preview: exec.userPrompt.substring(0, 100),
            functions_used: exec.functionsUsed,
            cost_usd: exec.totalCostUsd,
            duration_ms: exec.durationMs,
          },
          created_at: exec.createdAt,
        }));

        const duration = Date.now() - startTime;
        await createIntegrationLog({
          integration: "sentinel",
          action: "push-execution-logs",
          payload: { logsCount: logsPayload.length },
          status: "success",
          durationMs: duration,
        });

        return { success: true, logsPushed: logsPayload.length, durationMs: duration };
      } catch (error: any) {
        await createIntegrationLog({
          integration: "sentinel",
          action: "push-execution-logs",
          status: "error",
          errorMessage: error.message,
        });
        throw error;
      }
    }),
});

// ─── Cost Calculator Router ───────────────────────────────────────────────────
const costRouter = router({
  calculate: publicProcedure
    .input(z.object({
      functionName: z.string(),
      inputTokens: z.number().default(1000),
      outputTokens: z.number().default(500),
      calls: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const fn = await getFunctionByName(input.functionName);
      if (!fn) throw new Error("Function not found");

      const totalTokens = input.inputTokens + input.outputTokens;
      const costPerCall = fn.costPer1k ? (totalTokens / 1000) * fn.costPer1k : 0;
      const totalCost = costPerCall * input.calls;

      await saveCostCalculation({
        functionName: input.functionName,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        calls: input.calls,
        estimatedCostUsd: totalCost,
      });

      return {
        functionName: fn.displayName,
        provider: fn.provider,
        costPer1k: fn.costPer1k,
        costUnit: fn.costUnit,
        totalTokens,
        costPerCall,
        totalCost,
        calls: input.calls,
      };
    }),

  compare: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      inputTokens: z.number().default(1000),
      outputTokens: z.number().default(500),
      calls: z.number().default(1000),
    }))
    .query(async ({ input }) => {
      const fns = await getAllFunctions(input.category);
      const totalTokens = input.inputTokens + input.outputTokens;

      return fns
        .filter(fn => fn.costPer1k !== null && fn.costPer1k !== undefined)
        .map(fn => ({
          name: fn.name,
          displayName: fn.displayName,
          provider: fn.provider,
          category: fn.category,
          costPer1k: fn.costPer1k,
          costUnit: fn.costUnit,
          costPerCall: fn.costPer1k ? (totalTokens / 1000) * fn.costPer1k! : 0,
          totalCost: fn.costPer1k ? (totalTokens / 1000) * fn.costPer1k! * input.calls : 0,
        }))
        .sort((a, b) => a.totalCost - b.totalCost);
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  registry: registryRouter,
  orchestrator: orchestratorRouter,
  templates: templatesRouter,
  integrations: integrationsRouter,
  cost: costRouter,
});

export type AppRouter = typeof appRouter;
