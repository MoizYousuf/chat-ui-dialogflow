/**
 * server.ts — Custom Node.js entry point
 *
 * Starts a single HTTP server that hosts both the Next.js app (all page and
 * API routes) and the Socket.io WebSocket server. Running them on the same
 * port means the browser can connect to the WebSocket at the same origin as
 * the UI with no CORS issues in development.
 *
 * Start with:  npm run dev   (development)
 *              npm start     (production, after npm run build)
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./src/lib/socket";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

// Spin up Next.js as a request handler — it handles all HTTP,
// while Socket.io intercepts only the WebSocket upgrade requests.
const app = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the same HTTP server before we start listening
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(
      `> Server ready on http://localhost:${port} [${dev ? "development" : "production"}]`
    );
  });
});
