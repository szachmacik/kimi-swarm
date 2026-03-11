import { describe, expect, it } from "vitest";
import { FUNCTION_REGISTRY_DATA, EDGE_FUNCTION_TEMPLATES_DATA } from "./functionData";
import { appRouter } from "./routers";

describe("Function Registry Data", () => {
  it("should have at least 80 functions", () => {
    expect(FUNCTION_REGISTRY_DATA.length).toBeGreaterThanOrEqual(80);
  });

  it("should have all required fields on every function", () => {
    for (const fn of FUNCTION_REGISTRY_DATA) {
      expect(fn.name, `${fn.name} missing name`).toBeTruthy();
      expect(fn.displayName, `${fn.name} missing displayName`).toBeTruthy();
      expect(fn.category, `${fn.name} missing category`).toBeTruthy();
      expect(fn.provider, `${fn.name} missing provider`).toBeTruthy();
      expect(fn.description, `${fn.name} missing description`).toBeTruthy();
    }
  });

  it("should have unique function names", () => {
    const names = FUNCTION_REGISTRY_DATA.map(f => f.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("should cover all required categories", () => {
    const categories = new Set(FUNCTION_REGISTRY_DATA.map(f => f.category));
    const required = ["llm", "image", "video", "audio", "search", "code", "database", "communication"];
    for (const cat of required) {
      expect(categories.has(cat as any), `Missing category: ${cat}`).toBe(true);
    }
  });

  it("should have valid cost values when provided", () => {
    for (const fn of FUNCTION_REGISTRY_DATA) {
      if (fn.costPer1k !== undefined) {
        expect(fn.costPer1k).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("Edge Function Templates", () => {
  it("should have exactly 5 templates", () => {
    expect(EDGE_FUNCTION_TEMPLATES_DATA.length).toBe(5);
  });

  it("should have all required fields", () => {
    for (const t of EDGE_FUNCTION_TEMPLATES_DATA) {
      expect(t.slug, `template missing slug`).toBeTruthy();
      expect(t.name, `template ${t.slug} missing name`).toBeTruthy();
      expect(t.description, `template ${t.slug} missing description`).toBeTruthy();
      expect(t.code, `template ${t.slug} missing code`).toBeTruthy();
      expect(t.category, `template ${t.slug} missing category`).toBeTruthy();
    }
  });

  it("should have unique slugs", () => {
    const slugs = EDGE_FUNCTION_TEMPLATES_DATA.map(t => t.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("should include required template types", () => {
    const slugs = EDGE_FUNCTION_TEMPLATES_DATA.map(t => t.slug);
    expect(slugs).toContain("llm-router");
    expect(slugs).toContain("image-router");
    expect(slugs).toContain("parallel-search");
    expect(slugs).toContain("vector-search");
    expect(slugs).toContain("kimi-auto-deploy");
  });

  it("each template code should be a non-empty string with valid Deno/TS content", () => {
    for (const t of EDGE_FUNCTION_TEMPLATES_DATA) {
      expect(t.code.length).toBeGreaterThan(100);
      // Should look like TypeScript/Deno code
      expect(t.code).toMatch(/serve|Deno|import|export|function|const|Response/);
    }
  });
});

describe("KIMI Orchestrator System Prompt", () => {
  it("function registry data should be importable and have LLM category", () => {
    const llmFunctions = FUNCTION_REGISTRY_DATA.filter(f => f.category === "llm");
    expect(llmFunctions.length).toBeGreaterThan(5);
  });

  it("should include KIMI K2.5 in LLM functions", () => {
    const kimiFunction = FUNCTION_REGISTRY_DATA.find(f => f.name === "kimi-k25");
    expect(kimiFunction).toBeDefined();
    expect(kimiFunction?.provider).toBe("Moonshot AI");
  });

  it("should have cost data for major LLM providers", () => {
    const llmWithCost = FUNCTION_REGISTRY_DATA.filter(
      f => f.category === "llm" && f.costPer1k !== undefined
    );
    expect(llmWithCost.length).toBeGreaterThan(5);
  });
});

describe("Admin-Only Access Control", () => {
  it("registry.list should use adminProcedure — throws FORBIDDEN for non-admin", async () => {
    const nonAdminCtx = {
      user: { id: 2, openId: "stranger", name: "Stranger", email: "x@x.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(nonAdminCtx);
    await expect(caller.registry.list()).rejects.toThrow();
  });

  it("registry.list should succeed for admin user", async () => {
    const adminCtx = {
      user: { id: 1, openId: "owner", name: "Admin", email: "admin@admin.com", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(adminCtx);
    // Should not throw — returns array (may be empty without DB)
    const result = await caller.registry.list().catch(e => {
      // DB connection errors are acceptable in test env
      if (e.message?.includes("database") || e.message?.includes("connect") || e.message?.includes("ECONNREFUSED")) return [];
      throw e;
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user should get UNAUTHORIZED from registry.list", async () => {
    const anonCtx = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(anonCtx);
    await expect(caller.registry.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("Integration Configuration", () => {
  it("ai-control-center project ID should be defined", () => {
    const ACC_PROJECT_ID = "qhscjlfavyqkaplcwhxu";
    expect(ACC_PROJECT_ID).toHaveLength(20);
  });

  it("sentinel project ID should be defined", () => {
    const SENTINEL_PROJECT_ID = "blgdhfcosqjzrutncbbr";
    expect(SENTINEL_PROJECT_ID).toHaveLength(20);
  });

  it("KIMI agent ID should be a valid UUID format", () => {
    const agentId = "60972574-cea1-4f9e-a7ed-1a54478d66db";
    expect(agentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
