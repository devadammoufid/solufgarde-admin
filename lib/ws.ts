// lib/ws.ts - Build WebSocket URLs for Socket.IO gateways

export const getMessagesWsUrl = (): string => {
  // Priority: explicit env var
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.endsWith('/messages') ? explicit : `${explicit.replace(/\/$/, '')}/messages`;

  // Try to derive from API base URL host
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (api) {
    try {
      const u = new URL(api);
      const host = u.hostname;
      const protocol = u.protocol === 'https:' ? 'https' : 'http';
      // Use default port for https; for http use 8081 as dev default
      const portPart = u.protocol === 'https:' ? '' : ':8081';
      return `${protocol}://${host}${portPart}/messages`;
    } catch {}
  }

  // Fallback to localhost
  return 'http://localhost:8081/messages';
};
