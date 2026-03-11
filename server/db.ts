import { eq, desc, like, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, functionRegistry, kimiExecutions, edgeFunctionTemplates, integrationLogs, costCalculations, type InsertFunctionRegistry, type InsertKimiExecution, type InsertEdgeFunctionTemplate, type InsertIntegrationLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Function Registry ────────────────────────────────────────────────────────
export async function getAllFunctions(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== "all") {
    return db.select().from(functionRegistry)
      .where(and(eq(functionRegistry.isActive, true), eq(functionRegistry.category, category as any)))
      .orderBy(desc(functionRegistry.usageCount));
  }
  return db.select().from(functionRegistry)
    .where(eq(functionRegistry.isActive, true))
    .orderBy(desc(functionRegistry.usageCount));
}

export async function searchFunctions(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(functionRegistry)
    .where(and(
      eq(functionRegistry.isActive, true),
      sql`(${functionRegistry.displayName} LIKE ${`%${query}%`} OR ${functionRegistry.description} LIKE ${`%${query}%`} OR ${functionRegistry.provider} LIKE ${`%${query}%`})`
    ))
    .orderBy(desc(functionRegistry.usageCount))
    .limit(20);
}

export async function getFunctionByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(functionRegistry).where(eq(functionRegistry.name, name)).limit(1);
  return result[0];
}

export async function upsertFunction(fn: InsertFunctionRegistry) {
  const db = await getDb();
  if (!db) return;
  await db.insert(functionRegistry).values(fn).onDuplicateKeyUpdate({
    set: { displayName: fn.displayName, description: fn.description, costPer1k: fn.costPer1k, tags: fn.tags, updatedAt: new Date() }
  });
}

export async function incrementFunctionUsage(name: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(functionRegistry)
    .set({ usageCount: sql`${functionRegistry.usageCount} + 1` })
    .where(eq(functionRegistry.name, name));
}

export async function getRegistryStats() {
  const db = await getDb();
  if (!db) return { total: 0, byCategory: {} };
  const all = await db.select({ category: functionRegistry.category, count: sql<number>`count(*)` })
    .from(functionRegistry)
    .where(eq(functionRegistry.isActive, true))
    .groupBy(functionRegistry.category);
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const row of all) {
    byCategory[row.category] = Number(row.count);
    total += Number(row.count);
  }
  return { total, byCategory };
}

// ─── KIMI Executions ──────────────────────────────────────────────────────────
export async function createExecution(exec: InsertKimiExecution) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(kimiExecutions).values(exec);
  return result;
}

export async function updateExecution(id: number, updates: Partial<typeof kimiExecutions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(kimiExecutions).set(updates).where(eq(kimiExecutions.id, id));
}

export async function getRecentExecutions(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kimiExecutions).orderBy(desc(kimiExecutions.createdAt)).limit(limit);
}

export async function getExecutionStats() {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, failed: 0, totalCost: 0, avgDuration: 0 };
  const stats = await db.select({
    total: sql<number>`count(*)`,
    completed: sql<number>`sum(case when ${kimiExecutions.status} = 'completed' then 1 else 0 end)`,
    failed: sql<number>`sum(case when ${kimiExecutions.status} = 'failed' then 1 else 0 end)`,
    totalCost: sql<number>`sum(${kimiExecutions.totalCostUsd})`,
    avgDuration: sql<number>`avg(${kimiExecutions.durationMs})`,
  }).from(kimiExecutions);
  const s = stats[0];
  return {
    total: Number(s?.total || 0),
    completed: Number(s?.completed || 0),
    failed: Number(s?.failed || 0),
    totalCost: Number(s?.totalCost || 0),
    avgDuration: Number(s?.avgDuration || 0),
  };
}

// ─── Edge Function Templates ──────────────────────────────────────────────────
export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(edgeFunctionTemplates).orderBy(edgeFunctionTemplates.name);
}

export async function getTemplateBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(edgeFunctionTemplates).where(eq(edgeFunctionTemplates.slug, slug)).limit(1);
  return result[0];
}

export async function upsertTemplate(template: InsertEdgeFunctionTemplate) {
  const db = await getDb();
  if (!db) return;
  await db.insert(edgeFunctionTemplates).values(template).onDuplicateKeyUpdate({
    set: { name: template.name, code: template.code, description: template.description, updatedAt: new Date() }
  });
}

export async function markTemplateDeployed(slug: string, projectId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(edgeFunctionTemplates)
    .set({ isDeployed: true, deployedProjectId: projectId, deployedAt: new Date() })
    .where(eq(edgeFunctionTemplates.slug, slug));
}

// ─── Integration Logs ─────────────────────────────────────────────────────────
export async function createIntegrationLog(log: InsertIntegrationLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(integrationLogs).values(log);
}

export async function getIntegrationLogs(integration?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (integration) {
    return db.select().from(integrationLogs)
      .where(eq(integrationLogs.integration, integration as any))
      .orderBy(desc(integrationLogs.createdAt)).limit(limit);
  }
  return db.select().from(integrationLogs).orderBy(desc(integrationLogs.createdAt)).limit(limit);
}

// ─── Cost Calculations ────────────────────────────────────────────────────────
export async function saveCostCalculation(data: { functionName: string; inputTokens: number; outputTokens: number; calls: number; estimatedCostUsd: number; userId?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(costCalculations).values(data);
}
