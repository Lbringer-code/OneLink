//Environment Variables
import dotenv from "dotenv";
dotenv.config();

// Database
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema.js";
import { eq } from "drizzle-orm";
export const db = drizzle(process.env.DATABASE_URL || "", { schema });

// Hono
import { Hono } from "hono";
import { serve } from "@hono/node-server";

// CORS
import { cors } from "hono/cors";

// Define context variables type
type Variables = {
  bundle: typeof schema.bundleTable.$inferSelect;
};

const app = new Hono<{ Variables: Variables }>();
app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

//Utils
import { slugify } from "./util.js";
import { validateAdminToken } from "./middleware.js";

// Health Check
app.get("/api", (c) => {
  return c.json({ status: "ok" });
});

// Public routes

// Create a new bundle
app.post("/api/bundle", async (c) => {
  const { title, links } = await c.req.json();

  const uniqueSlug = slugify(title);
  const publicUrl = `${process.env.FRONTEND_URL}/b/${uniqueSlug}`;

  const [bundle] = await db
    .insert(schema.bundleTable)
    .values({
      title,
      slug: uniqueSlug,
      publicUrl,
    })
    .returning();

  if (links && links.length > 0) {
    const linkRecords = links.map(
      (link: { url: string; note?: string; label?: string }) => ({
        ...link,
        bundleId: bundle.id,
      })
    );

    await db.insert(schema.linksTable).values(linkRecords);
  }

  const completeBundle = await db.query.bundleTable.findFirst({
    where: eq(schema.bundleTable.id, bundle.id),
    with: { links: true },
  });

  return c.json(completeBundle);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT) || 8787 }, () => {
  console.log(`Server running on ${process.env.PORT}`);
});

// View bundle
app.get("/api/bundle/:slug", async (c) => {
  const { slug } = c.req.param();

  const bundle = await db.query.bundleTable.findFirst({
    where: eq(schema.bundleTable.slug, slug),
    with: { links: true },
  });

  if (!bundle) {
    return c.json({ error: "Bundle not found" }, 404);
  }

  return c.json({ bundle });
});

// Admin Routes

// View bundle (with admin access)
app.get("/api/bundle/:slug/admin", validateAdminToken, async (c) => {
  const bundle = c.get("bundle");

  const completeBundle = await db.query.bundleTable.findFirst({
    where: eq(schema.bundleTable.id, bundle.id),
    with: { links: true },
  });

  return c.json(completeBundle);
});

// Update bundle title
app.put("/api/bundle/:slug", validateAdminToken, async (c) => {
  const { title } = await c.req.json();
  const bundle = c.get("bundle");

  const [updatedBundle] = await db
    .update(schema.bundleTable)
    .set({ title })
    .where(eq(schema.bundleTable.id, bundle.id))
    .returning();

  return c.json(updatedBundle);
});

// Delete bundle
app.delete("/api/bundle/:slug", validateAdminToken, async (c) => {
  const bundle = c.get("bundle");

  await db
    .delete(schema.bundleTable)
    .where(eq(schema.bundleTable.id, bundle.id));

  return c.json({ message: "Bundle deleted successfully" });
});

// Add new link to bundle
app.post("/api/bundle/:slug/links", validateAdminToken, async (c) => {
  const { url, note, label } = await c.req.json();
  const bundle = c.get("bundle");

  const [newLink] = await db
    .insert(schema.linksTable)
    .values({
      url,
      note,
      label,
      bundleId: bundle.id,
    })
    .returning();

  return c.json(newLink);
});

// Update link
app.put("/api/bundle/:slug/links/:linkId", validateAdminToken, async (c) => {
  const { linkId } = c.req.param();
  const { url, note, label } = await c.req.json();
  const bundle = c.get("bundle");

  const existingLink = await db.query.linksTable.findFirst({
    where: eq(schema.linksTable.id, linkId),
  });

  if (!existingLink || existingLink.bundleId !== bundle.id) {
    return c.json({ error: "Link not found" }, 404);
  }

  const [updatedLink] = await db
    .update(schema.linksTable)
    .set({ url, note, label })
    .where(eq(schema.linksTable.id, linkId))
    .returning();

  return c.json(updatedLink);
});

// Delete link
app.delete("/api/bundle/:slug/links/:linkId", validateAdminToken, async (c) => {
  const { linkId } = c.req.param();
  const bundle = c.get("bundle");

  const existingLink = await db.query.linksTable.findFirst({
    where: eq(schema.linksTable.id, linkId),
  });

  if (!existingLink || existingLink.bundleId !== bundle.id) {
    return c.json({ error: "Link not found" }, 404);
  }

  await db.delete(schema.linksTable).where(eq(schema.linksTable.id, linkId));

  return c.json({ message: "Link deleted successfully" });
});
