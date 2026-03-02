/**
 * Extract OAuth config (clientId, callbackPort) from a server's authConfig JSON.
 */
export function extractOAuthConfig(authConfig: string | null): {
  clientId?: string;
  callbackPort?: number;
} {
  if (!authConfig) return {};
  try {
    const config = JSON.parse(authConfig);
    return {
      clientId: config.clientId,
      callbackPort: config.callbackPort ? Number(config.callbackPort) : undefined,
    };
  } catch {
    return {};
  }
}
