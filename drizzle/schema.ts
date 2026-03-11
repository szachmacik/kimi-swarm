import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  float,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Function Registry ────────────────────────────────────────────────────────
export const functionRegistry = mysqlTable("function_registry", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  category: mysqlEnum("category", [
    "llm", "image", "video", "audio", "search",
    "code", "database", "communication", "vector", "utility"
  ]).notNull(),
  provider: varchar("provider", { length: 128 }).notNull(),
  description: text("description").notNull(),
  endpoint: varchar("endpoint", { length: 512 }),
  costPer1k: float("costPer1k"),          // USD per 1000 tokens/calls
  costUnit: varchar("costUnit", { length: 64 }),
  inputSchema: json("inputSchema"),
  outputSchema: json("outputSchema"),
  edgeFunctionTemplate: text("edgeFunctionTemplate"),
  tags: json("tags"),                      // string[]
  isActive: boolean("isActive").default(true).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  avgLatencyMs: int("avgLatencyMs").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunctionRegistry = typeof functionRegistry.$inferSelect;
export type InsertFunctionRegistry = typeof functionRegistry.$inferInsert;

// ─── KIMI Executions ──────────────────────────────────────────────────────────
export const kimiExecutions = mysqlTable("kimi_executions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userPrompt: text("userPrompt").notNull(),
  kimiPlan: json("kimiPlan"),              // { steps: [], reasoning: "" }
  functionsUsed: json("functionsUsed"),    // string[]
  result: text("result"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  totalCostUsd: float("totalCostUsd").default(0),
  durationMs: int("durationMs"),
  parallelSteps: int("parallelSteps").default(0),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type KimiExecution = typeof kimiExecutions.$inferSelect;
export type InsertKimiExecution = typeof kimiExecutions.$inferInsert;

// ─── Edge Function Templates ──────────────────────────────────────────────────
export const edgeFunctionTemplates = mysqlTable("edge_function_templates", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  code: text("code").notNull(),
  envVarsRequired: json("envVarsRequired"),  // string[]
  deployedProjectId: varchar("deployedProjectId", { length: 64 }),
  deployedAt: timestamp("deployedAt"),
  isDeployed: boolean("isDeployed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EdgeFunctionTemplate = typeof edgeFunctionTemplates.$inferSelect;
export type InsertEdgeFunctionTemplate = typeof edgeFunctionTemplates.$inferInsert;

// ─── Integration Logs ─────────────────────────────────────────────────────────
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  integration: mysqlEnum("integration", ["ai-control-center", "sentinel", "supabase-mgmt", "vercel"]).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  payload: json("payload"),
  response: json("response"),
  status: mysqlEnum("status", ["success", "error", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = typeof integrationLogs.$inferInsert;

// ─── Cost Calculations ────────────────────────────────────────────────────────
export const costCalculations = mysqlTable("cost_calculations", {
  id: int("id").autoincrement().primaryKey(),
  functionName: varchar("functionName", { length: 128 }).notNull(),
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  calls: int("calls").default(1),
  estimatedCostUsd: float("estimatedCostUsd").notNull(),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CostCalculation = typeof costCalculations.$inferSelect;
