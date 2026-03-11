import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import {
  getAllFunctions, searchFunctions, getFunctionByName, upsertFunction, incrementFunctionUsage, getRegistryStats,
  createExecution, updateExecution, getRecentExecutions, getExecutionStats,
  getAllTemplates, getTemplateBySlug, upsertTemplate, markTemplateDeployed,
  getIntegrationLogs, createIntegrationLog, saveCostCalculation,
} from "./db";
import { FUNCTION_REGISTRY_DATA, EDGE_FUNCTION_TEMPLATES_DATA } from "./functionData";
import { verifySupabaseToken, isEmailAllowed, isEmailAdmin } from "./_core/supabaseAuth";
import { SignJWT } from "jose";

// ─── ENV helpers ──────────────────────────────────────────────────────────────
const KIMI_API_KEY = process.env.KIMI_API_KEY || "";
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const SUPABASE_ACC_URL = process.env.SUPABASE_ACC_URL || "";
const SUPABASE_ACC_KEY = process.env.SUPABASE_ACC_KEY || "";

// ai-control-center Supabase
const ACC_URL = "https://qhscjlfavyqkaplcwhxu.supabase.co";
const ACC_KEY = SUPABASE_ACC_KEY || "";

// Sentinel Supabase
const SENTINEL_URL = "https://blgdhfcosqjzrutncbbr.supabase.co";
const SENTINEL_KEY = process.env.SENTINEL_KEY || ACC_KEY;

// ─── KIMI API helper (direct call, not invokeLLM) ─────────────────────────────
async function callKimiAPI(messages: any[], tools?: any[], stream = false) {
  const body: any = {
    model: "moonshot-v1-128k",
    messages,
    temperature: 0.3,
    max_tokens: 4096,
  };
  if (tools) { body.tools = tools; body.tool_choice = "auto"; }
  if (stream) body.stream = true;

  const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIMI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`KIMI API error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Embedding helper (moonshot-v1-embedding) ─────────────────────────────────
async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${KIMI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIMI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "moonshot-v1-embedding", input: text }),
  });
  if (!res.ok) throw new Error(`Embedding error: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

// Cosine similarity between two vectors
function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// ─── KIMI Tool Definitions ────────────────────────────────────────────────────
const KIMI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_functions",
      description: "Search the function registry for tools matching a query",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          category: { type: "string", description: "Optional category filter: llm|image|video|audio|search|code|database|communication|vector|utility" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_function_details",
      description: "Get full details of a specific function by name",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Function name" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_cost",
      description: "Estimate cost for a function call",
      parameters: {
        type: "object",
        properties: {
          function_name: { type: "string" },
          input_tokens: { type: "number" },
          output_tokens: { type: "number" },
          calls: { type: "number" },
        },
        required: ["function_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_edge_function",
      description: "Generate and deploy a Supabase Edge Function for a specific use case",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Edge function name (slug)" },
          description: { type: "string", description: "What the function should do" },
          functions_to_use: { type: "array", items: { type: "string" }, description: "Registry function names to incorporate" },
          project_id: { type: "string", description: "Supabase project ID to deploy to" },
        },
        required: ["name", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_ai_control_center",
      description: "Query or modify the ai-control-center Supabase database",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["list_agents", "add_agent", "update_agent", "list_tasks", "add_task", "list_infrastructure"] },
          payload: { type: "object", description: "Data for the action" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_sentinel",
      description: "Query Sentinel.app for security monitoring data",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["get_logs", "get_alerts", "get_agent_status", "push_log"] },
          payload: { type: "object" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "semantic_search",
      description: "Perform semantic vector search across the function registry",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          threshold: { type: "number", description: "Similarity threshold 0-1 (default 0.7)" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_costs",
      description: "Compare costs across multiple functions for a workload",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          input_tokens: { type: "number" },
          output_tokens: { type: "number" },
          monthly_calls: { type: "number" },
        },
        required: ["category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_execution_plan",
      description: "Create a structured multi-step execution plan for a complex task",
      parameters: {
        type: "object",
        properties: {
          task: { type: "string" },
          budget_usd: { type: "number", description: "Max budget in USD" },
          parallel: { type: "boolean", description: "Allow parallel execution" },
        },
        required: ["task"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deploy_to_coolify",
      description: "Trigger a deployment on Coolify for a registered application",
      parameters: {
        type: "object",
        properties: {
          app_uuid: { type: "string", description: "Coolify application UUID" },
          force: { type: "boolean", description: "Force rebuild" },
        },
        required: ["app_uuid"],
      },
    },
  },
];

// ─── Tool executor ────────────────────────────────────────────────────────────
async function executeTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case "search_functions": {
      const results = await searchFunctions(args.query);
      const filtered = args.category ? results.filter((f: any) => f.category === args.category) : results;
      return filtered.slice(0, args.limit || 5).map((f: any) => ({
        name: f.name, displayName: f.displayName, category: f.category,
        provider: f.provider, description: f.description, costPer1k: f.costPer1k,
      }));
    }
    case "get_function_details": {
      return getFunctionByName(args.name);
    }
    case "estimate_cost": {
      const fn = await getFunctionByName(args.function_name);
      if (!fn) return { error: "Function not found" };
      const tokens = (args.input_tokens || 1000) + (args.output_tokens || 500);
      const costPerCall = fn.costPer1k ? (tokens / 1000) * fn.costPer1k : 0;
      return { function: fn.displayName, costPerCall, totalCost: costPerCall * (args.calls || 1), costPer1k: fn.costPer1k };
    }
    case "generate_edge_function": {
      // Generate code with KIMI
      const codePrompt = `Generate a Supabase Edge Function (Deno TypeScript) for: ${args.description}
Functions to use: ${(args.functions_to_use || []).join(", ")}
Return ONLY the TypeScript code, no explanation.`;
      const codeRes = await callKimiAPI([
        { role: "system", content: "You are an expert Supabase Edge Function developer. Generate clean, production-ready Deno TypeScript code." },
        { role: "user", content: codePrompt },
      ]);
      const code = codeRes.choices?.[0]?.message?.content || "";
      
      if (args.project_id && KIMI_API_KEY) {
        // Deploy to Supabase
        const deployRes = await fetch(`https://api.supabase.com/v1/projects/${args.project_id}/functions`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${KIMI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ slug: args.name, name: args.name, body: code, verify_jwt: false }),
        });
        const deployData = await deployRes.json();
        return { generated: true, deployed: deployRes.ok, code: code.substring(0, 500), deployResponse: deployData };
      }
      return { generated: true, deployed: false, code };
    }
    case "query_ai_control_center": {
      const headers = { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}`, "Content-Type": "application/json" };
      switch (args.action) {
        case "list_agents": {
          const r = await fetch(`${ACC_URL}/rest/v1/agents?select=id,name,role,status,model&limit=20`, { headers });
          return r.json();
        }
        case "add_agent": {
          const r = await fetch(`${ACC_URL}/rest/v1/agents`, {
            method: "POST", headers: { ...headers, "Prefer": "return=representation" },
            body: JSON.stringify(args.payload),
          });
          return r.json();
        }
        case "update_agent": {
          const r = await fetch(`${ACC_URL}/rest/v1/agents?id=eq.${args.payload?.id}`, {
            method: "PATCH", headers: { ...headers, "Prefer": "return=representation" },
            body: JSON.stringify(args.payload),
          });
          return r.json();
        }
        case "list_tasks": {
          const r = await fetch(`${ACC_URL}/rest/v1/tasks?select=*&limit=20&order=created_at.desc`, { headers });
          return r.json();
        }
        case "add_task": {
          const r = await fetch(`${ACC_URL}/rest/v1/tasks`, {
            method: "POST", headers: { ...headers, "Prefer": "return=representation" },
            body: JSON.stringify(args.payload),
          });
          return r.json();
        }
        case "list_infrastructure": {
          const r = await fetch(`${ACC_URL}/rest/v1/infrastructure?select=*&limit=20`, { headers });
          return r.json();
        }
        default: return { error: "Unknown action" };
      }
    }
    case "query_sentinel": {
      const headers = { "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}`, "Content-Type": "application/json" };
      switch (args.action) {
        case "get_logs": {
          const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_audit_logs?select=*&limit=50&order=created_at.desc`, { headers });
          return r.json();
        }
        case "get_alerts": {
          const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_alerts?select=*&limit=20&order=created_at.desc`, { headers });
          return r.json();
        }
        case "get_agent_status": {
          const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_trusted_agents?select=*`, { headers });
          return r.json();
        }
        case "push_log": {
          const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_audit_logs`, {
            method: "POST", headers: { ...headers, "Prefer": "return=representation" },
            body: JSON.stringify({ agent_name: "kimi-swarm", ...args.payload }),
          });
          return r.json();
        }
        default: return { error: "Unknown action" };
      }
    }
    case "semantic_search": {
      const fns = await getAllFunctions();
      const queryEmb = await getEmbedding(args.query);
      const scored = fns.map((fn: any) => {
        const fnEmb = fn.embedding ? (typeof fn.embedding === "string" ? JSON.parse(fn.embedding) : fn.embedding) : null;
        const sim = fnEmb ? cosineSim(queryEmb, fnEmb) : 0;
        return { ...fn, similarity: sim };
      }).filter((f: any) => f.similarity >= (args.threshold || 0.5))
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, args.limit || 5);
      return scored.map((f: any) => ({ name: f.name, displayName: f.displayName, category: f.category, similarity: f.similarity.toFixed(3) }));
    }
    case "compare_costs": {
      const fns = await getAllFunctions(args.category);
      const tokens = (args.input_tokens || 1000) + (args.output_tokens || 500);
      return fns.filter((f: any) => f.costPer1k).map((f: any) => ({
        name: f.name, provider: f.provider,
        monthlyCost: (tokens / 1000) * f.costPer1k * (args.monthly_calls || 1000),
      })).sort((a: any, b: any) => a.monthlyCost - b.monthlyCost).slice(0, 10);
    }
    case "create_execution_plan": {
      const fns = await getAllFunctions();
      const fnList = fns.slice(0, 40).map((f: any) => `${f.name}(${f.category},$${f.costPer1k || 0}/1k)`).join(", ");
      const planRes = await callKimiAPI([
        { role: "system", content: `You are a task planner. Available functions: ${fnList}. Budget: $${args.budget_usd || 0.1}. Parallel: ${args.parallel !== false}.` },
        { role: "user", content: `Create execution plan for: ${args.task}` },
      ]);
      return { plan: planRes.choices?.[0]?.message?.content, task: args.task };
    }
    case "deploy_to_coolify": {
      const COOLIFY_TOKEN = "5|iVCIKkag2PcD4nP8mGstQK3ApaTrpXI03qQ9Ely6bc1871a4";
      const r = await fetch(`https://coolify.ofshore.dev/api/v1/deploy?uuid=${args.app_uuid}&force=${args.force || false}`, {
        headers: { "Authorization": `Bearer ${COOLIFY_TOKEN}` },
      });
      return r.json();
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─── Registry Router ──────────────────────────────────────────────────────────
const registryRouter = router({
  list: adminProcedure
    .input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.search && input.search.length > 0) return searchFunctions(input.search);
      return getAllFunctions(input?.category);
    }),

  stats: adminProcedure.query(async () => getRegistryStats()),

  get: adminProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => getFunctionByName(input.name)),

  // Punkt 1: Semantic search z embeddingami
  semanticSearch: adminProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      threshold: z.number().min(0).max(1).default(0.5),
      limit: z.number().min(1).max(20).default(8),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const fns = await getAllFunctions();

      // Generate embedding for query
      let queryEmbedding: number[];
      try {
        queryEmbedding = await getEmbedding(input.query);
      } catch (e: any) {
        // Fallback: keyword search if embedding fails
        const results = await searchFunctions(input.query);
        return { results: results.slice(0, input.limit).map((f: any) => ({ ...f, similarity: 0.5 })), method: "keyword_fallback", durationMs: Date.now() - startTime };
      }

      // Score all functions
      const scored = fns.map((fn: any) => {
        // Use stored embedding if available, otherwise use description text similarity
        const fnEmb = fn.embedding ? (typeof fn.embedding === "string" ? JSON.parse(fn.embedding) : fn.embedding) : null;
        const sim = fnEmb ? cosineSim(queryEmbedding, fnEmb) : 0;
        return { ...fn, similarity: sim };
      }).filter((f: any) => f.similarity >= input.threshold)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, input.limit);

      return {
        results: scored.map((f: any) => ({
          id: f.id, name: f.name, displayName: f.displayName, category: f.category,
          provider: f.provider, description: f.description, costPer1k: f.costPer1k,
          similarity: parseFloat(f.similarity.toFixed(4)),
        })),
        method: "vector",
        queryEmbeddingDim: queryEmbedding.length,
        durationMs: Date.now() - startTime,
      };
    }),

  // Punkt 1: Seed embeddings for all functions
  seedEmbeddings: adminProcedure.mutation(async () => {
    const fns = await getAllFunctions();
    let seeded = 0, failed = 0;
    const results: any[] = [];

    for (const fn of fns) {
      try {
        const text = `${fn.displayName} ${fn.description} ${fn.category} ${fn.provider}`;
        const embedding = await getEmbedding(text);
        // Store embedding as JSON in the function record
        await upsertFunction({
          name: fn.name,
          displayName: fn.displayName,
          category: fn.category as any,
          provider: fn.provider,
          description: fn.description,
          endpoint: fn.endpoint || undefined,
          costPer1k: fn.costPer1k || undefined,
          costUnit: fn.costUnit || undefined,
          tags: fn.tags as any,
          isActive: fn.isActive,
          // Store embedding as JSON string in edgeFunctionTemplate field temporarily
          edgeFunctionTemplate: JSON.stringify(embedding),
        });
        seeded++;
        results.push({ name: fn.name, status: "ok", dims: embedding.length });
      } catch (e: any) {
        failed++;
        results.push({ name: fn.name, status: "failed", error: e.message });
      }
      // Rate limit: 10 req/s
      await new Promise(r => setTimeout(r, 100));
    }
    return { seeded, failed, total: fns.length, results };
  }),

  seed: adminProcedure.mutation(async () => {
    let seeded = 0;
    for (const fn of FUNCTION_REGISTRY_DATA) {
      await upsertFunction({
        name: fn.name, displayName: fn.displayName, category: fn.category,
        provider: fn.provider, description: fn.description, endpoint: fn.endpoint,
        costPer1k: fn.costPer1k, costUnit: fn.costUnit, tags: fn.tags, isActive: true,
      });
      seeded++;
    }
    return { seeded, total: FUNCTION_REGISTRY_DATA.length };
  }),

  exportJson: adminProcedure.query(async () => {
    const fns = await getAllFunctions();
    return {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      totalFunctions: fns.length,
      functions: fns.map(fn => ({
        name: fn.name, displayName: fn.displayName, category: fn.category,
        provider: fn.provider, description: fn.description, endpoint: fn.endpoint,
        costPer1k: fn.costPer1k, costUnit: fn.costUnit, tags: fn.tags,
      })),
      pgvectorSeed: `CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS function_registry (
  id BIGSERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL, category TEXT NOT NULL, provider TEXT NOT NULL,
  description TEXT NOT NULL, embedding vector(1536), metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION match_functions(query_embedding vector(1536), match_threshold FLOAT DEFAULT 0.7, match_count INT DEFAULT 5)
RETURNS TABLE (id BIGINT, name TEXT, similarity FLOAT) LANGUAGE plpgsql AS $$
BEGIN RETURN QUERY SELECT f.id, f.name, 1-(f.embedding <=> query_embedding) AS similarity
FROM function_registry f WHERE 1-(f.embedding <=> query_embedding) > match_threshold
ORDER BY f.embedding <=> query_embedding LIMIT match_count; END; $$;`,
    };
  }),
});

// ─── Orchestrator Router (Punkt 2: KIMI K2.5 tool-calling) ───────────────────
const KIMI_SYSTEM_PROMPT = `You are KIMI K2.5, an autonomous AI orchestrator for the KIMI SWARM system.
You have access to 10 tools to manage 83+ API functions, deploy Edge Functions, query ai-control-center, and monitor via Sentinel.

Your capabilities:
1. SEARCH & DISCOVER: Use search_functions and semantic_search to find optimal tools
2. COST OPTIMIZATION: Use estimate_cost and compare_costs to minimize expenses
3. PLAN & EXECUTE: Use create_execution_plan for complex multi-step workflows
4. DEPLOY: Use generate_edge_function to autonomously write and deploy Supabase Edge Functions
5. MANAGE: Use query_ai_control_center to add agents, tasks, and infrastructure
6. MONITOR: Use query_sentinel to check security logs and agent status
7. DEPLOY APPS: Use deploy_to_coolify to trigger deployments

Always:
- Use the cheapest model that meets quality requirements
- Run independent steps in parallel when possible
- Log important actions to Sentinel for audit trail
- Explain your reasoning before taking actions
- Return structured results with cost estimates`;

const orchestratorRouter = router({
  // Punkt 2: Real KIMI K2.5 with tool-calling
  chat: adminProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.string(),
        tool_call_id: z.string().optional(),
        name: z.string().optional(),
      })),
      sessionId: z.string().optional(),
      enableTools: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const sessionId = input.sessionId || nanoid(16);
      const startTime = Date.now();
      const toolCallLog: any[] = [];

      const systemMsg = { role: "system", content: KIMI_SYSTEM_PROMPT };
      let messages: any[] = [systemMsg, ...input.messages];

      const execId = await createExecution({
        sessionId,
        userPrompt: input.messages[input.messages.length - 1]?.content || "",
        status: "running",
      });

      try {
        let finalResponse = "";
        let iterations = 0;
        const MAX_ITERATIONS = 8;

        while (iterations < MAX_ITERATIONS) {
          iterations++;
          const response = await callKimiAPI(messages, input.enableTools ? KIMI_TOOLS : undefined);
          const choice = response.choices?.[0];
          const msg = choice?.message;

          if (!msg) break;

          // Check for tool calls
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            messages.push(msg);

            // Execute all tool calls
            for (const tc of msg.tool_calls) {
              const toolName = tc.function?.name;
              const toolArgs = JSON.parse(tc.function?.arguments || "{}");

              let toolResult: any;
              try {
                toolResult = await executeTool(toolName, toolArgs);
              } catch (e: any) {
                toolResult = { error: e.message };
              }

              toolCallLog.push({ tool: toolName, args: toolArgs, result: toolResult, timestamp: new Date().toISOString() });

              messages.push({
                role: "tool",
                tool_call_id: tc.id,
                name: toolName,
                content: JSON.stringify(toolResult),
              });
            }
          } else {
            // Final response
            finalResponse = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
            messages.push({ role: "assistant", content: finalResponse });
            break;
          }
        }

        const duration = Date.now() - startTime;
        const toolsUsed = Array.from(new Set(toolCallLog.map((t: any) => t.tool)));

        if (execId) {
          await updateExecution((execId as any).insertId || 1, {
            status: "completed",
            kimiPlan: { toolCalls: toolCallLog, iterations },
            functionsUsed: toolsUsed,
            durationMs: duration,
            completedAt: new Date(),
          });
        }

        // Auto-log to Sentinel
        try {
          await executeTool("query_sentinel", {
            action: "push_log",
            payload: {
              action: "kimi-orchestration",
              status: "completed",
              metadata: { tools_used: toolsUsed, duration_ms: duration, iterations },
            },
          });
        } catch (_) { /* non-critical */ }

        return {
          sessionId,
          response: finalResponse,
          toolCalls: toolCallLog,
          toolsUsed,
          iterations,
          durationMs: duration,
          messages: messages.slice(1), // exclude system prompt
        };
      } catch (error: any) {
        if (execId) {
          await updateExecution((execId as any).insertId || 1, {
            status: "failed",
            durationMs: Date.now() - startTime,
          });
        }
        throw error;
      }
    }),

  // Legacy plan endpoint (kept for compatibility)
  plan: adminProcedure
    .input(z.object({ prompt: z.string().min(1).max(4000) }))
    .mutation(async ({ input }) => {
      const sessionId = nanoid(16);
      const startTime = Date.now();
      const fns = await getAllFunctions();
      const fnSummary = fns.slice(0, 30).map((f: any) => `${f.name} (${f.category}): ${f.description.substring(0, 80)}`).join("\n");
      const response = await callKimiAPI([
        { role: "system", content: KIMI_SYSTEM_PROMPT + "\n\nAvailable functions (sample):\n" + fnSummary },
        { role: "user", content: input.prompt },
      ]);
      const plan = response.choices?.[0]?.message?.content;
      return { sessionId, plan, durationMs: Date.now() - startTime };
    }),

  history: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => getRecentExecutions(input?.limit || 20)),

  stats: adminProcedure.query(async () => getExecutionStats()),
});

// ─── Templates Router (Punkt 3: Auto-deploy Edge Functions) ──────────────────
const templatesRouter = router({
  list: adminProcedure.query(async () => getAllTemplates()),

  get: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => getTemplateBySlug(input.slug)),

  seed: adminProcedure.mutation(async () => {
    let seeded = 0;
    for (const t of EDGE_FUNCTION_TEMPLATES_DATA) {
      await upsertTemplate({ slug: t.slug, name: t.name, description: t.description, category: t.category, code: t.code, envVarsRequired: t.envVarsRequired, isDeployed: false });
      seeded++;
    }
    return { seeded };
  }),

  // Punkt 3: KIMI generates and deploys Edge Function
  generateAndDeploy: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(64),
      description: z.string().min(10).max(1000),
      projectId: z.string().min(1),
      accessToken: z.string().min(1),
      functionsToUse: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      // Step 1: KIMI generates the code
      const codePrompt = `Generate a production-ready Supabase Edge Function (Deno TypeScript) for the following use case:

Name: ${input.name}
Description: ${input.description}
Functions/APIs to integrate: ${(input.functionsToUse || []).join(", ")}

Requirements:
- Use Deno/TypeScript syntax
- Handle CORS properly
- Include error handling
- Add JSDoc comments
- Use environment variables for API keys
- Return JSON responses

Return ONLY the TypeScript code.`;

      const codeRes = await callKimiAPI([
        { role: "system", content: "You are an expert Supabase Edge Function developer. Generate clean, production-ready Deno TypeScript code with proper error handling and CORS support." },
        { role: "user", content: codePrompt },
      ]);

      const generatedCode = codeRes.choices?.[0]?.message?.content || "";

      // Step 2: Deploy to Supabase
      let deployResult: any = null;
      let deployed = false;

      try {
        const deployRes = await fetch(`https://api.supabase.com/v1/projects/${input.projectId}/functions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${input.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: input.name,
            name: input.name,
            body: generatedCode,
            verify_jwt: false,
          }),
        });

        deployResult = await deployRes.json();
        deployed = deployRes.ok;

        // If already exists, update it
        if (!deployRes.ok && deployResult?.message?.includes("already exists")) {
          const updateRes = await fetch(`https://api.supabase.com/v1/projects/${input.projectId}/functions/${input.name}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ slug: input.name, name: input.name, body: generatedCode, verify_jwt: false }),
          });
          deployResult = await updateRes.json();
          deployed = updateRes.ok;
        }
      } catch (e: any) {
        deployResult = { error: e.message };
      }

      const duration = Date.now() - startTime;

      // Step 3: Save to templates DB
      await upsertTemplate({
        slug: input.name,
        name: input.name,
        description: input.description,
        category: "kimi-generated",
        code: generatedCode,
        envVarsRequired: [],
        isDeployed: deployed,
        deployedProjectId: deployed ? input.projectId : undefined,
        deployedAt: deployed ? new Date() : undefined,
      });

      // Step 4: Log to integration_logs
      await createIntegrationLog({
        integration: "supabase-mgmt",
        action: `kimi-generate-deploy:${input.name}`,
        payload: { name: input.name, description: input.description, projectId: input.projectId },
        response: deployResult,
        status: deployed ? "success" : "error",
        durationMs: duration,
      });

      // Step 5: Notify Sentinel
      try {
        await executeTool("query_sentinel", {
          action: "push_log",
          payload: {
            action: "edge-function-deployed",
            status: deployed ? "success" : "failed",
            metadata: { function_name: input.name, project_id: input.projectId, duration_ms: duration },
          },
        });
      } catch (_) { /* non-critical */ }

      return {
        name: input.name,
        generated: true,
        deployed,
        code: generatedCode,
        deployResult,
        durationMs: duration,
        functionUrl: deployed ? `https://${input.projectId}.supabase.co/functions/v1/${input.name}` : null,
      };
    }),

  // Deploy existing template
  deploy: adminProcedure
    .input(z.object({ slug: z.string(), projectId: z.string(), accessToken: z.string() }))
    .mutation(async ({ input }) => {
      const template = await getTemplateBySlug(input.slug);
      if (!template) throw new Error("Template not found");

      const startTime = Date.now();
      const deployRes = await fetch(`https://api.supabase.com/v1/projects/${input.projectId}/functions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slug: template.slug, name: template.name, body: template.code, verify_jwt: false }),
      });

      const data = await deployRes.json();
      const duration = Date.now() - startTime;

      await createIntegrationLog({
        integration: "supabase-mgmt",
        action: `deploy-edge-function:${template.slug}`,
        payload: { projectId: input.projectId, slug: template.slug },
        response: data, status: deployRes.ok ? "success" : "error", durationMs: duration,
      });

      if (deployRes.ok) await markTemplateDeployed(template.slug, input.projectId);
      return { success: deployRes.ok, data, durationMs: duration };
    }),
});

// ─── AI Control Center Router (Punkt 4) ──────────────────────────────────────
const aiControlCenterRouter = router({
  // List all agents
  listAgents: adminProcedure.query(async () => {
    const r = await fetch(`${ACC_URL}/rest/v1/agents?select=*&order=created_at.desc&limit=50`, {
      headers: { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}` },
    });
    if (!r.ok) throw new Error(`ACC error: ${r.status}`);
    return r.json();
  }),

  // Add or update agent
  upsertAgent: adminProcedure
    .input(z.object({
      name: z.string(),
      role: z.string(),
      description: z.string().optional(),
      model: z.string().optional(),
      status: z.enum(["active", "inactive", "error"]).default("active"),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const r = await fetch(`${ACC_URL}/rest/v1/agents`, {
        method: "POST",
        headers: {
          "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}`,
          "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      await createIntegrationLog({ integration: "ai-control-center", action: "upsert-agent", payload: input, response: data, status: r.ok ? "success" : "error" });
      return data;
    }),

  // List tasks
  listTasks: adminProcedure
    .input(z.object({ limit: z.number().default(20), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const statusFilter = input?.status ? `&status=eq.${input.status}` : "";
      const r = await fetch(`${ACC_URL}/rest/v1/tasks?select=*&order=created_at.desc&limit=${input?.limit || 20}${statusFilter}`, {
        headers: { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}` },
      });
      if (!r.ok) return [];
      return r.json();
    }),

  // Add task
  addTask: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      agent_id: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const r = await fetch(`${ACC_URL}/rest/v1/tasks`, {
        method: "POST",
        headers: {
          "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}`,
          "Content-Type": "application/json", "Prefer": "return=representation",
        },
        body: JSON.stringify({ ...input, status: "pending", created_by: "kimi-swarm" }),
      });
      const data = await r.json();
      await createIntegrationLog({ integration: "ai-control-center", action: "add-task", payload: input, response: data, status: r.ok ? "success" : "error" });
      return data;
    }),

  // List infrastructure
  listInfrastructure: adminProcedure.query(async () => {
    const r = await fetch(`${ACC_URL}/rest/v1/infrastructure?select=*&limit=30`, {
      headers: { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}` },
    });
    if (!r.ok) return [];
    return r.json();
  }),

  // Sync KIMI registry to ACC
  syncRegistry: adminProcedure.mutation(async () => {
    const fns = await getAllFunctions();
    const startTime = Date.now();

    // Update KIMI agent config with latest registry stats
    const r = await fetch(`${ACC_URL}/rest/v1/agents?name=eq.kimi`, {
      method: "PATCH",
      headers: {
        "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}`,
        "Content-Type": "application/json", "Prefer": "return=representation",
      },
      body: JSON.stringify({
        config: {
          functions_count: fns.length,
          last_sync: new Date().toISOString(),
          categories: Array.from(new Set(fns.map((f: any) => f.category))),
          swarm_url: "https://kimi-swarm.ofshore.dev",
        },
      }),
    });

    const data = await r.json();
    const duration = Date.now() - startTime;
    await createIntegrationLog({ integration: "ai-control-center", action: "sync-registry", payload: { count: fns.length }, response: data, status: r.ok ? "success" : "error", durationMs: duration });
    return { synced: fns.length, durationMs: duration, success: r.ok };
  }),

  // Get project context
  getProjectContext: adminProcedure.query(async () => {
    const r = await fetch(`${ACC_URL}/rest/v1/manus_project_context?project_name=eq.kimi-swarm&select=*`, {
      headers: { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}` },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data[0] || null;
  }),
});

// ─── Sentinel Router (Punkt 5) ────────────────────────────────────────────────
const sentinelRouter = router({
  // Get audit logs
  getLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50), agentName: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const agentFilter = input?.agentName ? `&agent_name=eq.${input.agentName}` : "";
      const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_audit_logs?select=*&order=created_at.desc&limit=${input?.limit || 50}${agentFilter}`, {
        headers: { "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}` },
      });
      if (!r.ok) return [];
      return r.json();
    }),

  // Get alerts
  getAlerts: adminProcedure
    .input(z.object({ limit: z.number().default(20), severity: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const sevFilter = input?.severity ? `&severity=eq.${input.severity}` : "";
      const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_alerts?select=*&order=created_at.desc&limit=${input?.limit || 20}${sevFilter}`, {
        headers: { "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}` },
      });
      if (!r.ok) return [];
      return r.json();
    }),

  // Get trusted agents
  getTrustedAgents: adminProcedure.query(async () => {
    const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_trusted_agents?select=*`, {
      headers: { "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}` },
    });
    if (!r.ok) return [];
    return r.json();
  }),

  // Get agent policies
  getPolicies: adminProcedure.query(async () => {
    const r = await fetch(`${SENTINEL_URL}/rest/v1/ai_agent_policies?select=*&order=created_at.desc`, {
      headers: { "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}` },
    });
    if (!r.ok) return [];
    return r.json();
  }),

  // Push log to Sentinel
  pushLog: adminProcedure
    .input(z.object({
      action: z.string(),
      status: z.enum(["success", "failed", "warning", "info"]).default("info"),
      metadata: z.record(z.string(), z.any()).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
    }))
    .mutation(async ({ input }) => {
      const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_audit_logs`, {
        method: "POST",
        headers: {
          "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}`,
          "Content-Type": "application/json", "Prefer": "return=representation",
        },
        body: JSON.stringify({
          agent_name: "kimi-swarm",
          action: input.action,
          status: input.status,
          severity: input.severity,
          metadata: input.metadata || {},
          created_at: new Date().toISOString(),
        }),
      });
      const data = await r.json();
      return { success: r.ok, data };
    }),

  // Create alert
  createAlert: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const r = await fetch(`${SENTINEL_URL}/rest/v1/shield_alerts`, {
        method: "POST",
        headers: {
          "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}`,
          "Content-Type": "application/json", "Prefer": "return=representation",
        },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          severity: input.severity,
          source: "kimi-swarm",
          metadata: input.metadata || {},
          status: "open",
          created_at: new Date().toISOString(),
        }),
      });
      const data = await r.json();
      return { success: r.ok, data };
    }),

  // Health check — ping all integrations
  healthCheck: adminProcedure.query(async () => {
    const checks = await Promise.allSettled([
      fetch(`${ACC_URL}/rest/v1/agents?select=count&limit=1`, { headers: { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}` } }).then(r => ({ name: "ai-control-center", ok: r.ok, status: r.status })),
      fetch(`${SENTINEL_URL}/rest/v1/shield_trusted_agents?select=count&limit=1`, { headers: { "apikey": SENTINEL_KEY, "Authorization": `Bearer ${SENTINEL_KEY}` } }).then(r => ({ name: "sentinel", ok: r.ok, status: r.status })),
      fetch(`${KIMI_BASE_URL}/models`, { headers: { "Authorization": `Bearer ${KIMI_API_KEY}` } }).then(r => ({ name: "kimi-api", ok: r.ok, status: r.status })),
    ]);

    return checks.map((c, i) => {
      if (c.status === "fulfilled") return c.value;
      return { name: ["ai-control-center", "sentinel", "kimi-api"][i], ok: false, error: c.reason?.message };
    });
  }),

  // Get execution metrics from local DB
  getMetrics: adminProcedure.query(async () => {
    const stats = await getExecutionStats();
    const logs = await getIntegrationLogs(undefined, 100);
    const integrationStats = logs.reduce((acc: any, log: any) => {
      acc[log.integration] = acc[log.integration] || { total: 0, success: 0, error: 0 };
      acc[log.integration].total++;
      if (log.status === "success") acc[log.integration].success++;
      if (log.status === "error") acc[log.integration].error++;
      return acc;
    }, {});
    return { executions: stats, integrations: integrationStats };
  }),
});

// ─── Integrations Router ──────────────────────────────────────────────────────
const integrationsRouter = router({
  logs: adminProcedure
    .input(z.object({ integration: z.string().optional(), limit: z.number().default(50) }).optional())
    .query(async ({ input }) => getIntegrationLogs(input?.integration, input?.limit || 50)),

  syncToAiControlCenter: adminProcedure.mutation(async () => {
    const fns = await getAllFunctions();
    const startTime = Date.now();
    const r = await fetch(`${ACC_URL}/rest/v1/agents?name=eq.kimi`, {
      method: "PATCH",
      headers: { "apikey": ACC_KEY, "Authorization": `Bearer ${ACC_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify({ config: { functions_count: fns.length, last_sync: new Date().toISOString(), swarm_url: "https://kimi-swarm.ofshore.dev" } }),
    });
    const data = await r.json();
    const duration = Date.now() - startTime;
    await createIntegrationLog({ integration: "ai-control-center", action: "sync-registry", payload: { count: fns.length }, response: data, status: r.ok ? "success" : "error", durationMs: duration });
    return { synced: fns.length, durationMs: duration, success: r.ok };
  }),

  syncToSentinel: adminProcedure.mutation(async () => {
    const executions = await getRecentExecutions(10);
    const startTime = Date.now();
    for (const exec of executions) {
      await executeTool("query_sentinel", {
        action: "push_log",
        payload: { action: "orchestration-sync", status: exec.status, metadata: { prompt: exec.userPrompt?.substring(0, 100), cost: exec.totalCostUsd } },
      });
    }
    const duration = Date.now() - startTime;
    await createIntegrationLog({ integration: "sentinel", action: "push-execution-logs", payload: { count: executions.length }, status: "success", durationMs: duration });
    return { success: true, logsPushed: executions.length, durationMs: duration };
  }),
});

// ─── Cost Calculator Router ───────────────────────────────────────────────────
const costRouter = router({
  calculate: adminProcedure
    .input(z.object({ functionName: z.string(), inputTokens: z.number().default(1000), outputTokens: z.number().default(500), calls: z.number().default(1) }))
    .mutation(async ({ input }) => {
      const fn = await getFunctionByName(input.functionName);
      if (!fn) throw new Error("Function not found");
      const totalTokens = input.inputTokens + input.outputTokens;
      const costPerCall = fn.costPer1k ? (totalTokens / 1000) * fn.costPer1k : 0;
      const totalCost = costPerCall * input.calls;
      await saveCostCalculation({ functionName: input.functionName, inputTokens: input.inputTokens, outputTokens: input.outputTokens, calls: input.calls, estimatedCostUsd: totalCost });
      return { functionName: fn.displayName, provider: fn.provider, costPer1k: fn.costPer1k, costUnit: fn.costUnit, totalTokens, costPerCall, totalCost, calls: input.calls };
    }),

  compare: adminProcedure
    .input(z.object({ category: z.string().optional(), inputTokens: z.number().default(1000), outputTokens: z.number().default(500), calls: z.number().default(1000) }))
    .query(async ({ input }) => {
      const fns = await getAllFunctions(input.category);
      const totalTokens = input.inputTokens + input.outputTokens;
      return fns.filter(fn => fn.costPer1k !== null && fn.costPer1k !== undefined)
        .map(fn => ({ name: fn.name, displayName: fn.displayName, provider: fn.provider, category: fn.category, costPer1k: fn.costPer1k, costUnit: fn.costUnit, costPerCall: fn.costPer1k ? (totalTokens / 1000) * fn.costPer1k! : 0, totalCost: fn.costPer1k ? (totalTokens / 1000) * fn.costPer1k! * input.calls : 0 }))
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
  
  exchangeSupabaseToken: publicProcedure
    .input(z.object({ accessToken: z.string(), refreshToken: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const payload = await verifySupabaseToken(input.accessToken);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Nieprawidłowy token Supabase" });
      const email = payload.email ?? "";
      if (!isEmailAllowed(email)) throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostępu — email nie jest na liście dozwolonych" });
      const isAdmin = isEmailAdmin(email);
      const openId = `supabase:${payload.sub}`;
      await db.upsertUser({
        openId,
        name: payload.user_metadata?.full_name ?? payload.user_metadata?.name ?? email.split("@")[0] ?? null,
        email,
        loginMethod: "supabase_otp",
        lastSignedIn: new Date(),
        ...(isAdmin ? { role: "admin" } : {}),
      });
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "ofshore-secret-2026");
      const sessionToken = await new SignJWT({ openId, email, role: isAdmin ? "admin" : "user" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("365d")
        .sign(secret);
      ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions());
      return { success: true, role: isAdmin ? "admin" : "user" };
    }),
}),
  registry: registryRouter,
  orchestrator: orchestratorRouter,
  templates: templatesRouter,
  integrations: integrationsRouter,
  cost: costRouter,
  aiControlCenter: aiControlCenterRouter,
  sentinel: sentinelRouter,
});

export type AppRouter = typeof appRouter;
