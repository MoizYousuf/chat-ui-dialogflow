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
