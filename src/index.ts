import { Hono } from "hono";
import type { Bindings } from "./types";
import { lub } from "./routes/lub";
import { page } from "./routes/page";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/", page);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/lub", lub);

export default app;
