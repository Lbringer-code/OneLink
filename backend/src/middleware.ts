import { createMiddleware } from "hono/factory";

import * as schema from "./db/schema.js";
import { db } from "./index.js";
import { eq } from "drizzle-orm";

export const validateAdminToken = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Admin token required" }, 401);
  }

  const slug = c.req.param("slug");

  if (!slug) {
    return c.json({ error: "Bundle slug required" }, 400);
  }

  const bundle = await db.query.bundleTable.findFirst({
    where: eq(schema.bundleTable.slug, slug),
  });

  if (!bundle) {
    return c.json({ error: "Bundle not found" }, 404);
  }

  if (bundle.adminToken !== token) {
    return c.json({ error: "Invalid admin token" }, 403);
  }

  c.set("bundle", bundle);
  await next();
});
