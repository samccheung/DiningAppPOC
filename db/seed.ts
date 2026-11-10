import { getDb } from "../api/queries/connection";
import { products } from "./schema";

// The menu catalog self-seeds on the first `menu.list` request
// (see api/store-router.ts ensureSeeded). This script exists for manual use:
//   npx tsx db/seed.ts
async function seed() {
  const db = getDb();
  console.log("Seeding database (products self-seed on first menu request)...");
  console.log("Product count:", (await db.select({ id: products.id }).from(products)).length);
  process.exit(0);
}

seed();
