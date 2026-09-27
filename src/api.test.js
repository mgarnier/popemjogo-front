import { afterEach, describe, expect, it, vi } from "vitest";
import { api, apiRequest, getPlayerId } from "./api.js";

const PLAYER_ID = "3f7d8d2c-1c0a-4c1d-9f6e-123456789abc";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockResponse(payload, options = {}) {
  return {
    ok: options.ok ?? true,
    json: vi.fn().mockResolvedValue(payload),
  };
}

describe("getPlayerId", () => {
  it("cria e persiste um identificador quando não existe", () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(PLAYER_ID);

    expect(getPlayerId()).toBe(PLAYER_ID);
    expect(window.localStorage.getItem("populacao-em-jogo.player-id")).toBe(PLAYER_ID);
  });

  it("reutiliza o identificador persistido", () => {
    window.localStorage.setItem("populacao-em-jogo.player-id", PLAYER_ID);
    const randomUuid = vi.spyOn(globalThis.crypto, "randomUUID");

    expect(getPlayerId()).toBe(PLAYER_ID);
    expect(randomUuid).not.toHaveBeenCalled();
  });
});

describe("apiRequest", () => {
  it("envia o identificador e retorna o payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem("populacao-em-jogo.player-id", PLAYER_ID);

    await expect(apiRequest("/api/v1/test")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/test",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "X-Player-Id": PLAYER_ID,
        },
      }),
    );
  });

  it("normaliza erro de rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(apiRequest("/api/v1/test")).rejects.toThrow("Não foi possível conectar à API do jogo.");
  });

  it("traduz detalhes string e erros de validação", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(mockResponse({ detail: "Falha específica" }, { ok: false }))
      .mockResolvedValueOnce(mockResponse({ detail: [{ msg: "Campo inválido" }, { msg: "Outro erro" }] }, { ok: false })));

    await expect(apiRequest("/api/v1/test")).rejects.toThrow("Falha específica");
    await expect(apiRequest("/api/v1/test")).rejects.toThrow("Campo inválido Outro erro");
  });
});

describe("api", () => {
  it("monta as chamadas de geografia, partida e histórico", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await api.getRegions();
    await api.getStates(10);
    await api.createGame("estado", "33");
    await api.submitGuess("game/id", "125000");
    await api.abandonGame("game/id");
    await api.getHistory();
    await api.clearHistory();

    expect(fetchMock.mock.calls.map(([url, options]) => [url, options?.method])).toEqual([
      ["/api/v1/geografia/regioes", undefined],
      ["/api/v1/geografia/estados?region_id=10", undefined],
      ["/api/v1/partidas", "POST"],
      ["/api/v1/partidas/game%2Fid/palpites", "PUT"],
      ["/api/v1/partidas/game%2Fid/desistencia", "PUT"],
      ["/api/v1/historico", undefined],
      ["/api/v1/historico", "DELETE"],
    ]);
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ scope: "estado", scope_id: 33 }));
    expect(fetchMock.mock.calls[3][1].body).toBe(JSON.stringify({ guess: 125000 }));
  });
});