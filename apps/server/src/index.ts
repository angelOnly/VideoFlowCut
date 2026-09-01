import { createServer } from "./app.js";

const port = Number(process.env.PORT ?? 3100);
const host = process.env.HOST ?? "127.0.0.1";

const { app } = await createServer({ serveWeb: process.env.SERVE_WEB === "true" });
await app.listen({ port, host });
