const PLAYER_ID_KEY = "populacao-em-jogo.player-id";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function createPlayerId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

export function getPlayerId() {
  let playerId = window.localStorage.getItem(PLAYER_ID_KEY);
  if (!playerId) {
    playerId = createPlayerId();
    window.localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  return playerId;
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Player-Id": getPlayerId(),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Não foi possível conectar à API do jogo.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(" ")
      : detail;
    throw new Error(message || "Ocorreu um erro ao processar a solicitação.");
  }
  return payload;
}

export const api = {
  getRegions: () => apiRequest("/api/v1/geografia/regioes"),
  getStates: (regionId) => {
    const query = regionId ? `?region_id=${encodeURIComponent(regionId)}` : "";
    return apiRequest(`/api/v1/geografia/estados${query}`);
  },
  createGame: (scope, scopeId) =>
    apiRequest("/api/v1/partidas", {
      method: "POST",
      body: JSON.stringify({ scope, ...(scopeId ? { scope_id: Number(scopeId) } : {}) }),
    }),
  submitGuess: (gameId, guess) =>
    apiRequest(`/api/v1/partidas/${encodeURIComponent(gameId)}/palpites`, {
      method: "PUT",
      body: JSON.stringify({ guess: Number(guess) }),
    }),
  abandonGame: (gameId) =>
    apiRequest(`/api/v1/partidas/${encodeURIComponent(gameId)}/desistencia`, {
      method: "PUT",
    }),
  getHistory: () => apiRequest("/api/v1/historico"),
  clearHistory: () => apiRequest("/api/v1/historico", { method: "DELETE" }),
};