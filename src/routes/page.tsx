import { Hono } from "hono";
import type { Bindings } from "../types";
import { LubPage } from "../components/LubPage";

const page = new Hono<{ Bindings: Bindings }>();

page.get("/", (c) => {
  return c.html(<LubPage />);
});

export { page };
