import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { functionRegistry, edgeFunctionTemplates } from "/home/ubuntu/kimi-swarm/drizzle/schema";
import { FUNCTION_REGISTRY_DATA, EDGE_FUNCTION_TEMPLATES_DATA } from "/home/ubuntu/kimi-swarm/server/functionData";
import * as dotenv from "dotenv";
dotenv.config({ path: "/home/ubuntu/kimi-swarm/.env" });

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);

  console.log(`Seeding ${FUNCTION_REGISTRY_DATA.length} functions...`);
  let seeded = 0;
  for (const fn of FUNCTION_REGISTRY_DATA) {
    try {
      await db.insert(functionRegistry).values({
        name: fn.name,
        displayName: fn.displayName,
        category: fn.category,
        provider: fn.provider,
        description: fn.description,
        endpoint: fn.endpoint ?? null,
        costPer1k: fn.costPer1k ?? null,
        costUnit: fn.costUnit ?? null,
        tags: fn.tags,
        isActive: true,
      }).onDuplicateKeyUpdate({
        set: {
          displayName: fn.displayName,
          description: fn.description,
          costPer1k: fn.costPer1k ?? null,
          tags: fn.tags,
        }
      });
      seeded++;
    } catch (e: any) {
      console.error(`Error seeding ${fn.name}:`, e.message);
    }
  }
  console.log(`✓ Seeded ${seeded} functions`);

  console.log(`Seeding ${EDGE_FUNCTION_TEMPLATES_DATA.length} templates...`);
  let tSeeded = 0;
  for (const t of EDGE_FUNCTION_TEMPLATES_DATA) {
    try {
      await db.insert(edgeFunctionTemplates).values({
        slug: t.slug,
        name: t.name,
        description: t.description,
        category: t.category,
        code: t.code,
        envVarsRequired: t.envVarsRequired,
        isDeployed: false,
      }).onDuplicateKeyUpdate({
        set: {
          name: t.name,
          code: t.code,
          description: t.description,
        }
      });
      tSeeded++;
    } catch (e: any) {
      console.error(`Error seeding template ${t.slug}:`, e.message);
    }
  }
  console.log(`✓ Seeded ${tSeeded} templates`);

  await conn.end();
  console.log("Done!");
}

main().catch(console.error);
