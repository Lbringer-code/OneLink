// schema.ts (Drizzle + PostgreSQL)
import { pgTable, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const bundlesTable = pgTable("bundles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  publicUrl: text("public_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => sql`now()`),
});

export const linksTable = pgTable("links", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  note: text("note"),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => bundlesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => sql`now()`),
});

export const bundleRelations = relations(bundlesTable, ({ many }) => ({
  links: many(linksTable),
}));

export const linkRelations = relations(linksTable, ({ one }) => ({
  bundle: one(bundlesTable, {
    fields: [linksTable.bundleId],
    references: [bundlesTable.id],
  }),
}));
