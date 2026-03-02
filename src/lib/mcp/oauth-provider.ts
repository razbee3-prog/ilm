import type {
  OAuthClientProvider,
  OAuthDiscoveryState,
} from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientMetadata,
  OAuthClientInformationMixed,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { db } from "@/lib/db";
import { oauthState } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

interface OAuthProviderOptions {
  serverId: string;
  serverUrl: string;
  /** Pre-configured client ID (from .mcp.json oauth config) */
  clientId?: string;
  /** OAuth callback port (from .mcp.json oauth config) — used to match
   *  the redirect_uri registered with the OAuth provider. */
  callbackPort?: number;
}

/**
 * OAuthClientProvider implementation backed by SQLite.
 * One instance per MCP server (keyed by server ID).
 *
 * Supports both:
 * - Pre-configured client IDs (e.g., Slack, Gmail) — skips dynamic registration
 * - Dynamic client registration — for servers that support it
 *
 * For servers with a callbackPort, the redirect URI uses
 * `http://localhost:{callbackPort}/callback` to match what the
 * OAuth app has registered (same pattern as desktop MCP clients).
 */
export class JarvisOAuthProvider implements OAuthClientProvider {
  private serverId: string;
  private serverUrl: string;
  private preConfiguredClientId?: string;
  private _callbackPort?: number;
  private _pendingAuthUrl: URL | null = null;

  constructor(options: OAuthProviderOptions) {
    this.serverId = options.serverId;
    this.serverUrl = options.serverUrl;
    this.preConfiguredClientId = options.clientId;
    this._callbackPort = options.callbackPort;
  }

  get callbackPort(): number | undefined {
    return this._callbackPort;
  }

  get redirectUrl(): string | URL {
    if (this._callbackPort) {
      // Use the callbackPort to match the registered redirect URI
      // (same pattern as desktop MCP clients like Claude Desktop)
      return new URL(`http://localhost:${this._callbackPort}/callback`);
    }
    // Fallback for servers without callbackPort — use our own app route
    return new URL("/api/oauth/callback", APP_URL);
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Jarvis AI Agent Platform",
      redirect_uris: [String(this.redirectUrl)],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post", // required by Anthropic-hosted MCP servers
    };
  }

  async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
    // First check if we have saved client info from dynamic registration
    const rows = await db
      .select()
      .from(oauthState)
      .where(eq(oauthState.id, this.serverId));
    if (rows[0]?.clientInfo) {
      return JSON.parse(rows[0].clientInfo);
    }

    // Fall back to pre-configured client ID (for servers that don't support
    // dynamic registration, like Slack, Gmail, etc.)
    if (this.preConfiguredClientId) {
      return {
        client_id: this.preConfiguredClientId,
      } as OAuthClientInformationMixed;
    }

    return undefined;
  }

  async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
    await this.upsert({ clientInfo: JSON.stringify(info) });
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    const rows = await db
      .select()
      .from(oauthState)
      .where(eq(oauthState.id, this.serverId));
    if (rows[0]?.tokens) {
      return JSON.parse(rows[0].tokens);
    }
    return undefined;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    await this.upsert({ tokens: JSON.stringify(tokens) });
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    // Store the URL so our API route can return it to the frontend
    this._pendingAuthUrl = authorizationUrl;
    console.log(
      `[OAuth] Authorization required for ${this.serverId}: ${authorizationUrl}`
    );
  }

  /**
   * Get the pending authorization URL (set by redirectToAuthorization).
   */
  get pendingAuthUrl(): URL | null {
    return this._pendingAuthUrl;
  }

  /** Clear the pending auth URL after it's been consumed */
  clearPendingAuthUrl(): void {
    this._pendingAuthUrl = null;
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await this.upsert({ codeVerifier });
  }

  async codeVerifier(): Promise<string> {
    const rows = await db
      .select()
      .from(oauthState)
      .where(eq(oauthState.id, this.serverId));
    return rows[0]?.codeVerifier || "";
  }

  async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
    await this.upsert({ discoveryState: JSON.stringify(state) });
  }

  async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
    const rows = await db
      .select()
      .from(oauthState)
      .where(eq(oauthState.id, this.serverId));
    if (rows[0]?.discoveryState) {
      return JSON.parse(rows[0].discoveryState);
    }
    return undefined;
  }

  async invalidateCredentials(
    scope: "all" | "client" | "tokens" | "verifier" | "discovery"
  ): Promise<void> {
    if (scope === "all") {
      await db.delete(oauthState).where(eq(oauthState.id, this.serverId));
    } else if (scope === "tokens") {
      await this.upsert({ tokens: null });
    } else if (scope === "client") {
      await this.upsert({ clientInfo: null });
    } else if (scope === "verifier") {
      await this.upsert({ codeVerifier: null });
    } else if (scope === "discovery") {
      await this.upsert({ discoveryState: null });
    }
  }

  // ─── Helper ────────────────────────────────────────────────

  private async upsert(
    data: Partial<{
      tokens: string | null;
      clientInfo: string | null;
      codeVerifier: string | null;
      discoveryState: string | null;
    }>
  ) {
    const existing = await db
      .select()
      .from(oauthState)
      .where(eq(oauthState.id, this.serverId));

    if (existing.length > 0) {
      await db
        .update(oauthState)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(oauthState.id, this.serverId));
    } else {
      await db.insert(oauthState).values({
        id: this.serverId,
        ...data,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/** Cache of providers per server ID (so state persists across requests) */
const providerCache = new Map<string, JarvisOAuthProvider>();

/**
 * Get (or create) an OAuth provider for the given server.
 * Pass `clientId` and `callbackPort` from the server's authConfig.
 */
export function getOAuthProvider(
  serverId: string,
  serverUrl: string,
  clientId?: string,
  callbackPort?: number
): JarvisOAuthProvider {
  let provider = providerCache.get(serverId);
  if (!provider) {
    provider = new JarvisOAuthProvider({ serverId, serverUrl, clientId, callbackPort });
    providerCache.set(serverId, provider);
  }
  return provider;
}
