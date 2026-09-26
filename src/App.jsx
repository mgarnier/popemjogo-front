import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Database,
  Flag,
  LoaderCircle,
  MapPinned,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { api } from "./api.js";

const SCOPE_OPTIONS = [
  { id: "nacional", label: "Brasil" },
  { id: "regiao", label: "Região" },
  { id: "estado", label: "Estado" },
];

const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR");
const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value);
}

function formatDate(value) {
  return DATE_FORMATTER.format(new Date(value));
}

function getStatusLabel(status) {
  if (status === "won") return "Acertou";
  if (status === "abandoned") return "Desistiu";
  return "Em andamento";
}

function App() {
  const [screen, setScreen] = useState("game");
  const [scope, setScope] = useState("nacional");
  const [scopeId, setScopeId] = useState("");
  const [regions, setRegions] = useState([]);
  const [states, setStates] = useState([]);
  const [game, setGame] = useState(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getRegions()
      .then((result) => {
        if (active) setRegions(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    api
      .getStates()
      .then((result) => {
        if (active) setStates(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function openHistory() {
    setScreen("history");
    setError("");
    setLoadingHistory(true);
    try {
      setHistory(await api.getHistory());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function startGame(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const nextGame = await api.createGame(scope, scope === "nacional" ? undefined : scopeId);
      setGame(nextGame);
      setGuess("");
      setAttempts([]);
      setFeedback(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitGuess(event) {
    event.preventDefault();
    if (!game || guess === "") return;
    setError("");
    setBusy(true);
    try {
      const result = await api.submitGuess(game.id, guess);
      setAttempts((current) => [...current, { guess: Number(guess), result: result.result }]);
      setFeedback(result);
      if (result.result === "correct") {
        setGame((current) => ({ ...current, status: "won", ...result }));
      }
      setGuess("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function abandonGame() {
    if (!game || !window.confirm("Desistir desta partida e revelar a população?")) return;
    setError("");
    setBusy(true);
    try {
      const result = await api.abandonGame(game.id);
      setGame((current) => ({ ...current, ...result }));
      setFeedback(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    if (!window.confirm("Limpar todo o seu histórico de partidas?")) return;
    setError("");
    setBusy(true);
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function beginAnotherGame() {
    setGame(null);
    setFeedback(null);
    setGuess("");
    setAttempts([]);
    setError("");
    setScreen("game");
  }

  const activeGame = game?.status === "active";
  const completedGame = game && game.status !== "active";
  const scopeLabel = scope === "nacional"
    ? "Brasil"
    : scope === "regiao"
      ? regions.find((region) => String(region.id) === String(scopeId))?.nome
      : states.find((state) => String(state.id) === String(scopeId))?.nome;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={beginAnotherGame} aria-label="População em Jogo, ir para jogar">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>População <b>em Jogo</b></span>
        </button>
        <nav className="main-nav" aria-label="Navegação principal">
          <button
            className={`nav-tab ${screen === "game" ? "is-active" : ""}`}
            onClick={() => setScreen("game")}
          >
            Jogar
          </button>
          <button
            className={`nav-tab ${screen === "history" ? "is-active" : ""}`}
            onClick={openHistory}
          >
            <Clock3 size={16} strokeWidth={1.8} />
            Histórico
            {history.length > 0 && <span className="nav-count">{history.length}</span>}
          </button>
        </nav>
        <div className="source-mark"><span className="source-dot" /> DADOS IBGE</div>
      </header>

      <main>
        <section className="page-intro">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> DESAFIO DEMOGRÁFICO</div>
            <h1>{screen === "history" ? "Seu histórico." : "Quanto você acha que tem?"}</h1>
            <p className="intro-copy">
              {screen === "history"
                ? "Partidas registradas no seu navegador."
                : "Uma cidade brasileira. Um número. Até onde vai o seu palpite?"}
            </p>
          </div>
          <div className="intro-stamp" aria-label="Brasil, dados oficiais">
            <Compass size={17} />
            <span>BRASIL<br /><strong>5.571 MUNICÍPIOS</strong></span>
          </div>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <CircleHelp size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Fechar aviso">×</button>
          </div>
        )}

        {screen === "game" ? (
          <div className="game-layout">
            <section className="game-main" aria-label="Partida">
              {!game && (
                <form className="setup-panel" onSubmit={startGame}>
                  <div className="panel-heading">
                    <div className="step-label"><span>01</span> RECORTE DO MAPA</div>
                    <MapPinned size={20} strokeWidth={1.7} />
                  </div>
                  <div className="scope-control" role="group" aria-label="Escolha a abrangência">
                    {SCOPE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`scope-option ${scope === option.id ? "is-selected" : ""}`}
                        onClick={() => {
                          setScope(option.id);
                          setScopeId("");
                        }}
                      >
                        {option.label}
                        {scope === option.id && <span className="scope-check"><Check size={13} /></span>}
                      </button>
                    ))}
                  </div>
                  {scope !== "nacional" && (
                    <label className="field-label" htmlFor="scope-select">
                      {scope === "regiao" ? "REGIÃO" : "ESTADO"}
                      <span className="select-wrap">
                        <select
                          id="scope-select"
                          required
                          value={scopeId}
                          onChange={(event) => setScopeId(event.target.value)}
                        >
                          <option value="">Selecione {scope === "regiao" ? "uma região" : "um estado"}</option>
                          {(scope === "regiao" ? regions : states).map((item) => (
                            <option key={item.id} value={item.id}>
                              {scope === "estado" ? `${item.nome} (${item.sigla})` : item.nome}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={17} aria-hidden="true" />
                      </span>
                    </label>
                  )}
                  <div className="setup-bottom">
                    <div className="round-note"><Sparkles size={16} /> Município sorteado na hora</div>
                    <button className="button button-primary" type="submit" disabled={busy || (scope !== "nacional" && !scopeId)}>
                      {busy ? <LoaderCircle className="spin" size={17} /> : <>Sortear cidade <ArrowRight size={17} /></>}
                    </button>
                  </div>
                </form>
              )}

              {activeGame && (
                <section className="question-panel">
                  <div className="question-topline">
                    <div className="step-label"><span>02</span> SEU PALPITE</div>
                    <span className="live-label"><span className="live-dot" /> RODADA EM CURSO</span>
                  </div>
                  <div className="mystery-city">
                    <div className="mystery-orbit orbit-one" />
                    <div className="mystery-orbit orbit-two" />
                    <div className="mystery-pin"><MapPinned size={28} strokeWidth={1.55} /></div>
                    <span className="mystery-caption">CIDADE MISTERIOSA</span>
                    <h2>Uma cidade de {scopeLabel || "algum lugar do Brasil"}</h2>
                    <p>A população fica em segredo até você acertar ou desistir.</p>
                  </div>
                  <form className="guess-form" onSubmit={submitGuess}>
                    <label className="field-label" htmlFor="population-guess">POPULAÇÃO ESTIMADA</label>
                    <div className="guess-entry">
                      <input
                        id="population-guess"
                        autoFocus
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        placeholder="Ex.: 125000"
                        value={guess}
                        onChange={(event) => setGuess(event.target.value.replace(/\D/g, ""))}
                        required
                      />
                      <span className="input-suffix">habitantes</span>
                      <button className="button button-primary guess-submit" type="submit" disabled={busy || guess === ""} aria-label="Enviar palpite">
                        {busy ? <LoaderCircle className="spin" size={19} /> : <ArrowRight size={19} />}
                      </button>
                    </div>
                  </form>
                  {feedback && feedback.result !== "correct" && (
                    <div className={`feedback feedback-${feedback.result}`} role="status">
                      {feedback.result === "higher" ? <ArrowUp size={19} /> : <ArrowDown size={19} />}
                      <span>A população é <strong>{feedback.result === "higher" ? "maior" : "menor"}</strong> que {formatNumber(attempts.at(-1)?.guess || 0)}.</span>
                      <small>TENTATIVA {feedback.attempts}</small>
                    </div>
                  )}
                  {attempts.length > 0 && (
                    <div className="attempt-strip" aria-label="Palpites anteriores">
                      <span className="attempt-title">PALPITES</span>
                      {attempts.map((item, index) => (
                        <span className={`attempt-chip attempt-${item.result}`} key={`${item.guess}-${index}`}>
                          {formatNumber(item.guess)}
                          {item.result === "higher" ? <ArrowUp size={12} /> : item.result === "lower" ? <ArrowDown size={12} /> : <Check size={12} />}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="give-up-row">
                    <span><small>{attempts.length}</small> {attempts.length === 1 ? "tentativa" : "tentativas"}</span>
                    <button className="text-button" type="button" disabled={busy} onClick={abandonGame}>
                      <Flag size={15} /> Desistir e revelar
                    </button>
                  </div>
                </section>
              )}

              {completedGame && (
                <section className={`result-panel ${game.status === "won" ? "result-won" : "result-abandoned"}`}>
                  <div className="result-icon">{game.status === "won" ? <Trophy size={25} /> : <Flag size={24} />}</div>
                  <div className="step-label"><span>03</span> {game.status === "won" ? "ACERTOU" : "RESPOSTA REVELADA"}</div>
                  <h2>{game.municipality_name}</h2>
                  <div className="result-population">{formatNumber(game.population)}<span> pessoas</span></div>
                  <div className="result-meta">
                    <span><Database size={15} /> IBGE · estimativa {game.population_reference_year}</span>
                    <span><Clock3 size={15} /> {game.attempts} {game.attempts === 1 ? "tentativa" : "tentativas"}</span>
                  </div>
                  {game.status === "won" && <p className="winning-guess">Seu palpite: <strong>{formatNumber(game.winning_guess)}</strong></p>}
                  <button className="button button-primary" onClick={beginAnotherGame}>
                    Jogar de novo <RotateCcw size={16} />
                  </button>
                </section>
              )}
            </section>

            <aside className="game-aside" aria-label="Informações da rodada">
              <div className="aside-card tolerance-card">
                <div className="aside-kicker">MARGEM DE ACERTO <CircleHelp size={14} /></div>
                <div className="tolerance-value">±5<span>%</span></div>
                <div className="tolerance-rule"><span /> intervalo aceito pelo IBGE <span /></div>
                <div className="tolerance-scale"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
                <div className="scale-labels"><span>MENOR</span><span>POPULAÇÃO REAL</span><span>MAIOR</span></div>
              </div>
              <div className="aside-card source-card">
                <div className="aside-kicker">FONTE DOS DADOS</div>
                <div className="ibge-lockup"><span className="ibge-symbol">i</span><span>IBGE<small>Instituto Brasileiro de<br />Geografia e Estatística</small></span></div>
                <div className="source-divider" />
                <div className="data-stamp"><span className="live-dot" /> Consulta em tempo real</div>
              </div>
              <div className="aside-footnote"><span className="footnote-number">01</span><span>ESTIMATIVA<br />POPULACIONAL</span><span className="footnote-star">✳</span></div>
            </aside>
          </div>
        ) : (
          <section className="history-panel">
            <div className="history-toolbar">
              <div>
                <div className="step-label"><span>H</span> ARQUIVO DE PARTIDAS</div>
                <p>{history.length} {history.length === 1 ? "partida registrada" : "partidas registradas"}</p>
              </div>
              <button className="button button-danger-outline" onClick={clearHistory} disabled={busy || history.length === 0}>
                <Trash2 size={16} /> Limpar histórico
              </button>
            </div>
            {loadingHistory ? (
              <div className="empty-state"><LoaderCircle className="spin" size={23} /><span>Carregando partidas</span></div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Clock3 size={24} /></div>
                <strong>Nenhuma partida por aqui.</strong>
                <button className="text-button" onClick={beginAnotherGame}>Começar a jogar <ArrowRight size={15} /></button>
              </div>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr><th>DATA</th><th>CIDADE</th><th>POPULAÇÃO IBGE</th><th>PALPITE VENCEDOR</th><th>TENTATIVAS</th><th>RESULTADO</th></tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td className="date-cell">{formatDate(item.created_at)}</td>
                        <td className="city-cell">{item.municipality_name}<small>{item.population_reference_year} · IBGE</small></td>
                        <td className="number-cell">{formatNumber(item.population)}</td>
                        <td className="number-cell">{item.winning_guess === null ? <span className="muted-dash">—</span> : formatNumber(item.winning_guess)}</td>
                        <td className="attempt-cell">{item.attempts}</td>
                        <td><span className={`status-pill status-${item.status}`}>{getStatusLabel(item.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="page-footer">
        <span>POPULAÇÃO EM JOGO <b>·</b> DADOS PÚBLICOS DO IBGE</span>
        <button className="footer-play" onClick={screen === "history" ? beginAnotherGame : openHistory}>
          {screen === "history" ? <>Voltar ao jogo <ArrowLeft size={14} /></> : <>Ver histórico <ArrowRight size={14} /></>}
        </button>
      </footer>
    </div>
  );
}

export default App;