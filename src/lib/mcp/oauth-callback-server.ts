import http from "node:http";
import { URL } from "node:url";

/**
 * Starts a temporary HTTP server on the given port to receive an OAuth callback.
 * Returns a promise that resolves with the authorization code when the callback arrives.
 * The server automatically shuts down after receiving the callback (or on timeout).
 */
export function startOAuthCallbackServer(
  port: number,
  timeoutMs = 300_000 // 5 minutes
): Promise<{ code: string; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`);

      // Handle the OAuth callback
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const errorDesc = url.searchParams.get("error_description");

        if (error) {
          // Show error page and reject
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
                <div style="text-align: center;">
                  <h2 style="color: #dc2626;">Authentication Failed</h2>
                  <p>${errorDesc || error}</p>
                  <p style="color: #666;">You can close this window.</p>
                </div>
              </body>
            </html>
          `);
          cleanup();
          reject(new Error(errorDesc || error || "OAuth error"));
          return;
        }

        if (code) {
          // Show success page and resolve
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
                <div style="text-align: center;">
                  <h2 style="color: #16a34a;">&#10003; Authenticated!</h2>
                  <p>You can close this window and return to Jarvis.</p>
                  <script>setTimeout(() => window.close(), 2000);</script>
                </div>
              </body>
            </html>
          `);
          resolve({ code, cleanup });
          return;
        }

        // Missing code
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing authorization code");
        return;
      }

      // Any other path
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    });

    const cleanup = () => {
      clearTimeout(timer);
      try {
        server.close();
      } catch {
        // ignore
      }
    };

    // Timeout
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("OAuth callback timed out"));
    }, timeoutMs);

    server.on("error", (err) => {
      cleanup();
      reject(
        new Error(
          `Failed to start OAuth callback server on port ${port}: ${err.message}`
        )
      );
    });

    server.listen(port, "127.0.0.1", () => {
      console.log(`[OAuth] Callback server listening on http://localhost:${port}/callback`);
    });
  });
}
