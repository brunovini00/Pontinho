"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Player = { id: string; name: string; score: number; active: boolean };
type Round = { id: string; winnerId: string; losses: Record<string, number>; createdAt: string };
type Game = { players: Player[]; rounds: Round[]; startedAt: string; finished: boolean };

const STORAGE_KEY = "pontinho-game-v1";
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setGame(JSON.parse(saved));
    } catch { /* armazenamento indisponível */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (game) localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    else localStorage.removeItem(STORAGE_KEY);
  }, [game, ready]);

  const activePlayers = useMemo(() => game?.players.filter((p) => p.active) ?? [], [game]);
  const leader = useMemo(() => activePlayers.slice().sort((a, b) => b.score - a.score)[0], [activePlayers]);

  function addName() { if (names.length < 10) setNames([...names, ""]); }
  function updateName(index: number, value: string) { setNames(names.map((n, i) => i === index ? value : n)); }
  function removeName(index: number) { if (names.length > 2) setNames(names.filter((_, i) => i !== index)); }

  function startGame(e: FormEvent) {
    e.preventDefault();
    const clean = names.map((n) => n.trim()).filter(Boolean);
    if (clean.length < 2) return;
    setGame({ players: clean.map((name) => ({ id: makeId(), name, score: 100, active: true })), rounds: [], startedAt: new Date().toISOString(), finished: false });
  }

  function openRound() {
    setWinnerId("");
    setLosses(Object.fromEntries(activePlayers.map((p) => [p.id, ""])));
    setShowRound(true);
  }

  function saveRound(e: FormEvent) {
    e.preventDefault();
    if (!game || !winnerId) return;
    const parsed = Object.fromEntries(activePlayers.map((p) => [p.id, p.id === winnerId ? 0 : Math.max(0, Number(losses[p.id]) || 0)]));
    const players = game.players.map((p) => {
      if (!p.active || p.id === winnerId) return p;
      const score = Math.max(0, p.score - parsed[p.id]);
      return { ...p, score, active: score > 0 };
    });
    const remaining = players.filter((p) => p.active);
    setGame({ ...game, players, rounds: [...game.rounds, { id: makeId(), winnerId, losses: parsed, createdAt: new Date().toISOString() }], finished: remaining.length === 1 });
    setShowRound(false);
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

  function resetGame() { setGame(null); setNames(["", "", ""]); setConfirmReset(false); }

  if (!ready) return <main className="loading">Embaralhando…</main>;

  if (!game) return (
    <main className="setup-page">
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

      {champion && <section className="champion"><span>♛</span><div><small>TEMOS UM CAMPEÃO</small><h1>{champion.name}</h1><p>Último jogador na mesa com {champion.score} pontos.</p></div></section>}

      <section className="score-head">
        <div><div className="eyebrow">{game.finished ? "PARTIDA ENCERRADA" : `RODADA ${game.rounds.length + 1}`}</div><h1>Placar <em>da mesa</em></h1></div>
        {!game.finished && <div className="live"><i /> AO VIVO</div>}
      </section>

      <section className="score-list">
        {game.players.slice().sort((a, b) => Number(b.active) - Number(a.active) || b.score - a.score).map((player, index) => (
          <article className={`player-card ${!player.active ? "eliminated" : ""} ${player.id === leader?.id && activePlayers.length > 1 ? "leading" : ""}`} key={player.id}>
            <div className="rank">{!player.active ? "×" : String(index + 1).padStart(2, "0")}</div>
            <div className="avatar">{player.name.charAt(0).toUpperCase()}</div>
            <div className="player-info"><h2>{player.name}</h2><span>{!player.active ? "FORA DO JOGO" : player.id === leader?.id && activePlayers.length > 1 ? "♛ NA LIDERANÇA" : "NA MESA"}</span></div>
            <div className="points"><strong>{player.score}</strong><span>PTS</span></div>
            <div className="score-bar"><i style={{ width: `${player.score}%` }} /></div>
          </article>
        ))}
      </section>

      {!game.finished && <button className="primary round-button" onClick={openRound}>Finalizar rodada <span>→</span></button>}
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
          <button className="close" onClick={() => setShowRound(false)} aria-label="Fechar">×</button>
          <div className="eyebrow">FINALIZAR RODADA {game.rounds.length + 1}</div>
          <h1 id="round-title">Quem levou <em>essa mão?</em></h1>
          <form onSubmit={saveRound}>
            <label className="field-label">VENCEDOR DA RODADA</label>
            <div className="winner-grid">{activePlayers.map((p) => <button type="button" key={p.id} onClick={() => setWinnerId(p.id)} className={winnerId === p.id ? "selected" : ""}><span>{p.name.charAt(0).toUpperCase()}</span>{p.name}<i>✓</i></button>)}</div>
            {winnerId && <><div className="loss-title"><label className="field-label">PONTOS PERDIDOS</label><small>O vencedor não perde pontos</small></div>
              <div className="loss-list">{activePlayers.filter((p) => p.id !== winnerId).map((p) => <label key={p.id}><span>{p.name}</span><div><b>−</b><input type="number" min="0" max="100" inputMode="numeric" placeholder="0" value={losses[p.id] ?? ""} onChange={(e) => setLosses({ ...losses, [p.id]: e.target.value })} /><small>PTS</small></div></label>)}</div></>}
            <button className="primary" disabled={!winnerId}>Confirmar resultado <span>✓</span></button>
          </form>
        </section>
      </div>}

      {confirmReset && <div className="modal-backdrop"><section className="modal confirm"><div className="eyebrow">NOVA PARTIDA</div><h1>Encerrar a partida atual?</h1><p>O placar e todo o histórico desta partida serão apagados.</p><div className="confirm-actions"><button className="ghost" onClick={() => setConfirmReset(false)}>Cancelar</button><button className="danger" onClick={resetGame}>Encerrar</button></div></section></div>}
    </main>
  );
}
