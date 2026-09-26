import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

const mockedApi = vi.hoisted(() => ({
  getRegions: vi.fn(),
  getStates: vi.fn(),
  createGame: vi.fn(),
  submitGuess: vi.fn(),
  abandonGame: vi.fn(),
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
}));

vi.mock("./api.js", () => ({ api: mockedApi }));

const REGIONS = [
  { id: 3, nome: "Sudeste" },
  { id: 4, nome: "Sul" },
];
const STATES = [{ id: 35, nome: "São Paulo", sigla: "SP" }];

const ACTIVE_GAME = {
  id: "game-123",
  scope: "nacional",
  status: "active",
  attempts: 0,
};

const COMPLETED_GAME = {
  ...ACTIVE_GAME,
  status: "won",
  municipality_name: "São Paulo",
  population: 123456,
  population_reference_year: 2026,
  attempts: 1,
  winning_guess: 123000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.getRegions.mockResolvedValue(REGIONS);
  mockedApi.getStates.mockResolvedValue(STATES);
  mockedApi.createGame.mockResolvedValue(ACTIVE_GAME);
  mockedApi.submitGuess.mockResolvedValue({ result: "higher", attempts: 1 });
  mockedApi.abandonGame.mockResolvedValue({
    status: "abandoned",
    municipality_name: "Berizal",
    population: 4264,
    population_reference_year: 2026,
    attempts: 0,
  });
  mockedApi.getHistory.mockResolvedValue([]);
  mockedApi.clearHistory.mockResolvedValue({ deleted_games: 1 });
});

describe("App", () => {
  it("carrega as opções de geografia", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Região" }));
    expect(await screen.findByRole("option", { name: "Sudeste" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Estado" }));
    expect(screen.getByRole("option", { name: "São Paulo (SP)" })).toBeInTheDocument();
    expect(mockedApi.getRegions).toHaveBeenCalledTimes(1);
    expect(mockedApi.getStates).toHaveBeenCalledTimes(1);
  });

  it("exige uma região antes de iniciar uma partida regional", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Região" }));

    expect(screen.getByRole("button", { name: /Sortear cidade/ })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "REGIÃO" }), "3");
    expect(screen.getByRole("button", { name: /Sortear cidade/ })).toBeEnabled();
  });

  it("inicia uma partida e mantém a cidade em segredo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Sortear cidade/ }));
    await waitFor(() => expect(mockedApi.createGame).toHaveBeenCalledWith("nacional", undefined));

    expect(screen.getByText("CIDADE MISTERIOSA")).toBeInTheDocument();
    expect(screen.getByText("A população fica em segredo até você acertar ou desistir.")).toBeInTheDocument();
    expect(screen.queryByText("São Paulo")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar palpite" })).toBeDisabled();
  });

  it("exibe o feedback de um palpite incorreto e registra a tentativa", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Sortear cidade/ }));
    const guessInput = await screen.findByRole("textbox", { name: "POPULAÇÃO ESTIMADA" });
    await user.type(guessInput, "1000");
    await user.click(screen.getByRole("button", { name: "Enviar palpite" }));

    expect(await screen.findByRole("status")).toHaveTextContent("A população é maior que 1.000.");
    expect(screen.getByText("1", { selector: "small" }).parentElement).toHaveTextContent("1 tentativa");
    expect(mockedApi.submitGuess).toHaveBeenCalledWith("game-123", "1000");
  });

  it("mostra o resultado ao acertar", async () => {
    const user = userEvent.setup();
    mockedApi.submitGuess.mockResolvedValue({
      result: "correct",
      attempts: 1,
      municipality_name: COMPLETED_GAME.municipality_name,
      population: COMPLETED_GAME.population,
      population_reference_year: COMPLETED_GAME.population_reference_year,
      winning_guess: COMPLETED_GAME.winning_guess,
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Sortear cidade/ }));
    await user.type(await screen.findByRole("textbox", { name: "POPULAÇÃO ESTIMADA" }), "123000");
    await user.click(screen.getByRole("button", { name: "Enviar palpite" }));

    expect(await screen.findByText("ACERTOU")).toBeInTheDocument();
    expect(screen.getByText("São Paulo")).toBeInTheDocument();
    expect(screen.getByText("123.456", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Seu palpite:", { exact: false })).toHaveTextContent("123.000");
  });

  it("confirma desistência e revela a resposta", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Sortear cidade/ }));
    await user.click(await screen.findByRole("button", { name: /Desistir e revelar/ }));

    expect(window.confirm).toHaveBeenCalledWith("Desistir desta partida e revelar a população?");
    expect(await screen.findByText("RESPOSTA REVELADA")).toBeInTheDocument();
    expect(screen.getByText("Berizal")).toBeInTheDocument();
    expect(screen.getByText("4.264", { exact: false })).toBeInTheDocument();
    expect(mockedApi.abandonGame).toHaveBeenCalledWith("game-123");
  });

  it("carrega e limpa o histórico após confirmação", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedApi.getHistory.mockResolvedValue([{
      id: "history-1",
      created_at: "2026-09-26T12:00:00Z",
      municipality_name: "Berizal",
      population: 4264,
      population_reference_year: 2026,
      winning_guess: null,
      attempts: 2,
      status: "abandoned",
    }]);
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Histórico/ }));
    expect(await screen.findByText("Berizal")).toBeInTheDocument();
    expect(screen.getByText("Desistiu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Limpar histórico/ }));
    await waitFor(() => expect(mockedApi.clearHistory).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Nenhuma partida por aqui.")).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalledWith("Limpar todo o seu histórico de partidas?");
  });

  it("exibe falha ao carregar regiões", async () => {
    mockedApi.getRegions.mockRejectedValue(new Error("Serviço indisponível"));
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível");
  });

  it("não limpa o histórico quando a confirmação é cancelada", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    mockedApi.getHistory.mockResolvedValue([{
      id: "history-1",
      created_at: "2026-09-26T12:00:00Z",
      municipality_name: "Berizal",
      population: 4264,
      population_reference_year: 2026,
      winning_guess: null,
      attempts: 2,
      status: "abandoned",
    }]);
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Histórico/ }));
    await screen.findByText("Berizal");
    await user.click(screen.getByRole("button", { name: /Limpar histórico/ }));

    expect(mockedApi.clearHistory).not.toHaveBeenCalled();
    expect(screen.getByText("Berizal")).toBeInTheDocument();
  });
});
