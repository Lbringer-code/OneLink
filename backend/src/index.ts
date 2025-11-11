// Hono
import { serve } from "@hono/node-server";
import { Hono } from "hono";
const app = new Hono();

//Environment Variables
import dotenv from "dotenv";
dotenv.config();

// Database
import { drizzle } from "drizzle-orm/neon-http";
const db = drizzle(process.env.DATABASE_URL || "");

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
