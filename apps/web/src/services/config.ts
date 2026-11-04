const search = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();

export const config = {
  /** URL WebSocket du serveur de jeu (vide = mode en ligne désactivé). */
  serverUrl: (import.meta.env.VITE_SERVER_URL as string | undefined) || (import.meta.env.DEV ? "ws://localhost:8787" : ""),
  /** `?turbo=0.1` : durées ×0,1 en solo (développement / démonstration). */
  turbo: Number(search.get("turbo") ?? 0) || 0,
};
