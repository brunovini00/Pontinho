"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Player = { id: string; name: string; score: number; active: boolean };
type Round = { id: string; winnerId: string; losses: Record<string, number>; createdAt: string };
type Game = { players: Player[]; rounds: Round[]; startedAt: string; finished: boolean };

const STORAGE_KEY = "pontinho-game-v1";
const LAST_PLAYERS_KEY = "pontinho-last-players-v1";
const makeId = () => Math.random().toString(36).slice(2, 10);

function Trophy({ small = false }: { small?: boolean }) {
  return <span className={small ? "suit small" : "suit"} aria-hidden="true">♠</span>;
}

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [ready, setReady] = useState(false);
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [winnerId, setWinnerId] = useState("");
  const [losses, setLosses] = useState<Record<string, string>>({});
  const [showRound, setShowRound] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [eliminatedNames, setEliminatedNames] = useState<string[]>([]);
  const [showChampion, setShowChampion] = useState(false);
  const [roundError, setRoundError] = useState("");
  const [roundStep, setRoundStep] = useState<1 | 2>(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const restored: Game = JSON.parse(saved);
        setGame(restored);
        setShowChampion(restored.finished);
      } else {
        const lastPlayers = JSON.parse(localStorage.getItem(LAST_PLAYERS_KEY) || "[]");
        if (Array.isArray(lastPlayers) && lastPlayers.length >= 2) setNames(lastPlayers);
      }
    } catch { /* armazenamento indisponível */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (game) localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    else localStorage.removeItem(STORAGE_KEY);
  }, [game, ready]);

  useEffect(() => {
    if (game?.players.length) localStorage.setItem(LAST_PLAYERS_KEY, JSON.stringify(game.players.map((p) => p.name)));
  }, [game?.players]);

  const activePlayers = useMemo(() => game?.players.filter((p) => p.active) ?? [], [game]);
  const leader = useMemo(() => game && game.rounds.length > 0 ? activePlayers.slice().sort((a, b) => b.score - a.score)[0] : undefined, [activePlayers, game]);
  const roundLosers = winnerId ? activePlayers.filter((p) => p.id !== winnerId) : [];
  const filledLosses = roundLosers.filter((p) => Number(losses[p.id]) > 0).length;
  const roundIsValid = Boolean(winnerId) && roundLosers.length > 0 && roundLosers.every((p) => {
    const loss = Number(losses[p.id]);
    return Number.isFinite(loss) && loss >= 1 && loss <= p.score;
  });

  function addName() { if (names.length < 10) setNames([...names, ""]); }
  function updateName(index: number, value: string) { setNames(names.map((n, i) => i === index ? value : n)); }
  function removeName(index: number) { if (names.length > 2) setNames(names.filter((_, i) => i !== index)); }

  function startGame(e: FormEvent) {
    e.preventDefault();
    const clean = names.map((n) => n.trim()).filter(Boolean);
    if (clean.length < 2) return;
    localStorage.setItem(LAST_PLAYERS_KEY, JSON.stringify(clean));
    setGame({ players: clean.map((name) => ({ id: makeId(), name, score: 100, active: true })), rounds: [], startedAt: new Date().toISOString(), finished: false });
  }

  function openRound() {
    setWinnerId("");
    setLosses(Object.fromEntries(activePlayers.map((p) => [p.id, ""])));
    setRoundError("");
    setRoundStep(1);
    setShowRound(true);
  }

  function saveRound(e: FormEvent) {
    e.preventDefault();
    if (!game || !winnerId) return;
    const missing = activePlayers.filter((p) => {
      if (p.id === winnerId) return false;
      const loss = Number(losses[p.id]);
      return !Number.isFinite(loss) || loss < 1 || loss > p.score;
    });
    if (missing.length) {
      setRoundError(`${missing.length === 1 ? missing[0].name : `${missing.length} jogadores`} ainda precisa perder pontos.`);
      return;
    }
    const parsed = Object.fromEntries(activePlayers.map((p) => [p.id, p.id === winnerId ? 0 : Math.max(0, Number(losses[p.id]) || 0)]));
    const players = game.players.map((p) => {
      if (!p.active || p.id === winnerId) return p;
      const score = Math.max(0, p.score - parsed[p.id]);
      return { ...p, score, active: score > 0 };
    });
    const remaining = players.filter((p) => p.active);
    const justEliminated = players.filter((p) => p.active === false && game.players.find((old) => old.id === p.id)?.active).map((p) => p.name);
    setGame({ ...game, players, rounds: [...game.rounds, { id: makeId(), winnerId, losses: parsed, createdAt: new Date().toISOString() }], finished: remaining.length === 1 });
    setShowRound(false);
    if (justEliminated.length) setEliminatedNames(justEliminated);
  }

  function undoLastRound() {
    if (!game?.rounds.length) return;
    const rounds = game.rounds.slice(0, -1);
    const players = game.players.map((p) => {
      const score = rounds.reduce((total, round) => Math.max(0, total - (round.losses[p.id] || 0)), 100);
      return { ...p, score, active: score > 0 };
    });
    setGame({ ...game, players, rounds, finished: players.filter((p) => p.active).length === 1 });
  }

  function resetGame() {
    const remembered = game?.players.map((p) => p.name) ?? [];
    setGame(null);
    setNames(remembered.length >= 2 ? remembered : ["", "", ""]);
    setConfirmReset(false);
    setShowChampion(false);
  }

  if (!ready) return <main className="loading">Embaralhando…</main>;

  if (!game) return (
    <main className="setup-page">
      <div className="card-decor card-one" aria-hidden="true"><b>A</b><span>♠</span></div>
      <div className="card-decor card-two" aria-hidden="true"><b>K</b><span>♥</span></div>
      <div className="floating-suits" aria-hidden="true"><i>♣</i><i>♦</i><i>♠</i></div>
      <header className="brand"><Trophy /><div><strong>PONTINHO</strong><span>PLACAR</span></div></header>
      <section className="setup-card">
        <div className="eyebrow">NOVA PARTIDA</div>
        <h1>Quem vai<br /><em>entrar no jogo?</em></h1>
        <p className="intro">Adicione os jogadores. Cada um começa com <b>100 pontos</b> — o último na mesa vence.</p>
        <form onSubmit={startGame}>
          <div className="name-list">
            {names.map((name, i) => (
              <label className="name-row" key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <input value={name} onChange={(e) => updateName(i, e.target.value)} placeholder={`Nome do jogador ${i + 1}`} maxLength={20} aria-label={`Nome do jogador ${i + 1}`} />
                {names.length > 2 && <button type="button" className="icon-btn" onClick={() => removeName(i)} aria-label="Remover jogador">×</button>}
              </label>
            ))}
          </div>
          {names.length < 10 && <button type="button" className="add-player" onClick={addName}><span>＋</span> Adicionar jogador</button>}
          <button className="primary" disabled={names.filter((n) => n.trim()).length < 2}>Começar partida <span>→</span></button>
        </form>
      </section>
      <footer>♣ &nbsp; Feito para a mesa &nbsp; ♦</footer>
    </main>
  );

  const champion = game.finished ? activePlayers[0] : null;
  return (
    <main className="game-page">
      <header className="topbar">
        <div className="brand compact"><Trophy small /><div><strong>PONTINHO</strong><span>PLACAR</span></div></div>
        <button className="ghost" onClick={() => setConfirmReset(true)}>Nova partida</button>
      </header>

      {champion && <section className="champion"><span>♛</span><div><small>CAMPEÃO DA PARTIDA</small><h1>{champion.name}</h1><p>Último jogador na mesa com {champion.score} pontos.</p></div><button onClick={() => setShowChampion(true)}>Rever celebração</button></section>}

      <section className="table-status" aria-label="Resumo da partida">
        <div><span>RODADA</span><strong>{game.rounds.length + (game.finished ? 0 : 1)}</strong></div>
        <i />
        <div><span>NA MESA</span><strong>{activePlayers.length}</strong></div>
        <i />
        <div><span>ELIMINADOS</span><strong>{game.players.length - activePlayers.length}</strong></div>
      </section>

      <section className="score-head">
        <div><div className="eyebrow">{game.finished ? "PARTIDA ENCERRADA" : `RODADA ${game.rounds.length + 1}`}</div><h1>Placar <em>da mesa</em></h1></div>
        {!game.finished && <div className="live"><i /> AO VIVO</div>}
      </section>

      <section className="score-list">
        {game.players.slice().sort((a, b) => Number(b.active) - Number(a.active) || b.score - a.score).map((player, index) => (
          <article style={{ "--deal-index": index } as React.CSSProperties} className={`player-card ${!player.active ? "eliminated" : ""} ${player.id === leader?.id && activePlayers.length > 1 ? "leading" : ""}`} key={player.id}>
            <div className="rank">{!player.active ? "×" : String(index + 1).padStart(2, "0")}</div>
            <div className="avatar">{player.name.charAt(0).toUpperCase()}</div>
            <div className="player-info"><h2>{player.name}</h2><span>{!player.active ? "CARTAS NA MESA · ELIMINADO" : player.id === leader?.id && activePlayers.length > 1 ? "♛ NA LIDERANÇA" : game.rounds.length === 0 ? "AGUARDANDO A 1ª RODADA" : "NA MESA"}</span></div>
            <div className="points"><strong>{player.score}</strong><span>PTS</span></div>
            <div className="score-bar"><i style={{ width: `${player.score}%` }} /></div>
          </article>
        ))}
      </section>

      {!game.finished && <div className="action-dock"><button className="primary round-button" onClick={openRound}><span className="button-card">♦</span><b>Registrar resultado</b><span>→</span></button><small>Escolha o vencedor e informe a perda de todos os outros</small></div>}
      <button className="history-link" onClick={() => setShowHistory(!showHistory)}>☷ Histórico de rodadas <span>{game.rounds.length}</span></button>

      {showHistory && <section className="history-panel">
        <div className="panel-title"><h2>Histórico</h2>{game.rounds.length > 0 && <button onClick={undoLastRound}>↶ Desfazer última</button>}</div>
        {!game.rounds.length ? <p className="empty">Nenhuma rodada finalizada ainda.</p> : game.rounds.slice().reverse().map((round, i) => {
          const winner = game.players.find((p) => p.id === round.winnerId);
          return <div className="history-row" key={round.id}><b>R{game.rounds.length - i}</b><div><strong>{winner?.name} venceu</strong><span>{Object.entries(round.losses).filter(([id, n]) => id !== round.winnerId && n > 0).map(([id, n]) => `${game.players.find((p) => p.id === id)?.name} −${n}`).join(" · ")}</span></div></div>;
        })}
      </section>}

      {showRound && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowRound(false)}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="round-title">
          <div className="round-mobile-head"><button type="button" onClick={() => roundStep === 2 ? setRoundStep(1) : setShowRound(false)} aria-label={roundStep === 2 ? "Voltar" : "Fechar"}>{roundStep === 2 ? "←" : "×"}</button><div><span>RODADA {game.rounds.length + 1}</span><b>{roundStep === 1 ? "Escolha o vencedor" : "Informe as perdas"}</b></div><em>{roundStep}/2</em></div>
          <div className="eyebrow desktop-round-label">REGISTRAR RODADA {game.rounds.length + 1}</div>
          <h1 id="round-title">{roundStep === 1 ? <>Quem levou <em>essa mão?</em></> : <>Quanto cada um <em>perdeu?</em></>}</h1>
          <form className="round-form" onSubmit={saveRound}>
            {roundStep === 1 ? <div className="step-panel step-winner"><label className="field-label">TOQUE EM QUEM VENCEU</label><div className="winner-grid">{activePlayers.map((p) => <button type="button" key={p.id} onClick={() => { setWinnerId(p.id); setRoundError(""); }} className={winnerId === p.id ? "selected" : ""}><span>{p.name.charAt(0).toUpperCase()}</span><b>{p.name}</b><small>{p.score} pontos</small><i>✓</i></button>)}</div><div className="step-one-footer"><p>{winnerId ? `${activePlayers.find((p) => p.id === winnerId)?.name} não perderá pontos nesta rodada.` : "Selecione um jogador para continuar."}</p><button type="button" className="primary" disabled={!winnerId} onClick={() => setRoundStep(2)}>Continuar <span>→</span></button></div></div> : <div className="step-panel step-loss"><div className="winner-summary"><span>{activePlayers.find((p) => p.id === winnerId)?.name.charAt(0).toUpperCase()}</span><div><small>VENCEDOR · NÃO PERDE PONTOS</small><b>{activePlayers.find((p) => p.id === winnerId)?.name}</b></div><strong>0</strong></div><div className="loss-title"><label className="field-label">PERDA DOS ADVERSÁRIOS</label><small>Todos são obrigatórios</small></div>
              <div className="loss-progress"><span><i style={{ width: `${(filledLosses / Math.max(1, roundLosers.length)) * 100}%` }} /></span><b>{filledLosses}/{roundLosers.length} preenchidos</b></div>
              <div className="loss-list">{roundLosers.map((p, index) => { const hasLoss = Number(losses[p.id]) >= 1; return <div style={{ "--loss-index": index } as React.CSSProperties} className={`loss-entry ${hasLoss ? "loss-complete" : "loss-missing"}`} key={p.id}><div className="loss-person"><span>{p.name.charAt(0).toUpperCase()}</span><div><b>{p.name}</b><small>{hasLoss ? `Perde ${losses[p.id]} ponto${Number(losses[p.id]) === 1 ? "" : "s"}` : "Informe uma perda"}</small></div></div><div className="loss-control"><button type="button" onClick={() => { setLosses({ ...losses, [p.id]: String(Math.max(1, (Number(losses[p.id]) || 1) - 5)) }); setRoundError(""); }} aria-label={`Diminuir perda de ${p.name}`}>−</button><label><input aria-label={`Pontos perdidos por ${p.name}`} type="number" min="1" max={p.score} inputMode="numeric" placeholder="—" value={losses[p.id] ?? ""} onFocus={(e) => e.currentTarget.select()} onChange={(e) => { setLosses({ ...losses, [p.id]: e.target.value === "" ? "" : String(Math.min(p.score, Math.max(1, Number(e.target.value)))) }); setRoundError(""); }} /><small>PTS</small></label><button type="button" onClick={() => { setLosses({ ...losses, [p.id]: String(Math.min(p.score, (Number(losses[p.id]) || 0) + 5)) }); setRoundError(""); }} aria-label={`Aumentar perda de ${p.name}`}>＋</button></div></div>; })}</div><div className="round-submit"><div className={`round-guidance ${roundIsValid ? "ready" : ""}`} aria-live="polite"><span>{roundIsValid ? "✓" : "!"}</span><p>{roundError || (roundIsValid ? "Tudo preenchido. Agora sim, pode confirmar." : `${roundLosers.length - filledLosses} ${roundLosers.length - filledLosses === 1 ? "jogador ainda precisa" : "jogadores ainda precisam"} perder pontos.`)}</p></div><button type="submit" className="primary" disabled={!roundIsValid}>Aplicar resultado <span>✓</span></button></div></div>}
          </form>
        </section>
      </div>}

      {confirmReset && <div className="modal-backdrop"><section className="modal confirm"><div className="eyebrow">NOVA PARTIDA</div><h1>Encerrar a partida atual?</h1><p>O placar e todo o histórico desta partida serão apagados.</p><div className="confirm-actions"><button className="ghost" onClick={() => setConfirmReset(false)}>Cancelar</button><button className="danger" onClick={resetGame}>Encerrar</button></div></section></div>}

      {eliminatedNames.length > 0 && <div className="elimination-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="elimination-title">
        <div className="thrown-cards" aria-hidden="true"><i>7<span>♣</span></i><i>Q<span>♦</span></i><i>2<span>♠</span></i></div>
        <section className="elimination-card">
          <div className="skull-card" aria-hidden="true"><span>♠</span><b>0</b><span>♠</span></div>
          <div className="eyebrow">FIM DE JOGO</div>
          <h1 id="elimination-title">{eliminatedNames.join(" e ")} {eliminatedNames.length > 1 ? "foram eliminados" : "foi eliminado"}!</h1>
          <p>As cartas foram para a mesa. A disputa continua com {activePlayers.length} {activePlayers.length === 1 ? "jogador" : "jogadores"}.</p>
          <button className="primary" onClick={() => { setEliminatedNames([]); if (game.finished) setShowChampion(true); }}>{game.finished ? "Ver o campeão" : "Continuar a partida"} <span>→</span></button>
        </section>
      </div>}

      {champion && showChampion && eliminatedNames.length === 0 && <div className="champion-stage" role="dialog" aria-modal="true" aria-labelledby="champion-title">
        <div className="spotlight" aria-hidden="true" />
        <div className="suit-confetti" aria-hidden="true">{["♠","♥","♣","♦","♠","♦","♣","♥","♠","♣","♦","♥","♠","♦","♣","♥"].map((suit, i) => <i key={i} style={{ "--i": i } as React.CSSProperties}>{suit}</i>)}</div>
        <div className="winner-cards" aria-hidden="true"><i>A<span>♠</span></i><i>K<span>♦</span></i><i>Q<span>♣</span></i></div>
        <section className="winner-panel">
          <div className="crown" aria-hidden="true">♛</div>
          <div className="eyebrow">A MESA TEM UM DONO</div>
          <p className="winner-kicker">CAMPEÃO DO PONTINHO</p>
          <h1 id="champion-title">{champion.name}</h1>
          <div className="winner-score"><strong>{champion.score}</strong><span>PONTOS RESTANTES</span></div>
          <p>Sobreviveu a {game.rounds.length} {game.rounds.length === 1 ? "rodada" : "rodadas"} e foi o último a permanecer na mesa.</p>
          <button className="primary" onClick={resetGame}>Jogar novamente <span>↻</span></button>
          <button className="winner-secondary" onClick={() => setShowChampion(false)}>Ver placar final</button>
        </section>
      </div>}
    </main>
  );
}
