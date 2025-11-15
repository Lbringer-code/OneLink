// schema.ts (Drizzle + PostgreSQL)
import { pgTable, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const bundleTable = pgTable("bundle", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  publicUrl: text("public_url"),
  adminToken: uuid("admin_token").defaultRandom().notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const linksTable = pgTable("links", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  note: text("note"),
  label: varchar("label", { length: 255 }),
  bundleId: uuid("bundle_id")
    .notNull()
    .references(() => bundleTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const bundleRelations = relations(bundleTable, ({ many }) => ({
  links: many(linksTable),
}));

export const linkRelations = relations(linksTable, ({ one }) => ({
  bundle: one(bundleTable, {
    fields: [linksTable.bundleId],
    references: [bundleTable.id],
  }),
}));
