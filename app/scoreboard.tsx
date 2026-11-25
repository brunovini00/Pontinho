import { useEffect } from "react";
import type { CSSProperties } from "react";
import { getLeader, INITIAL_POINTS } from "./game";
import type { Game, Player } from "./game";
import RoundHistory from "./round-history";
import RoundResult from "./round-result";
import { Brand } from "./setup";

type Props = {
  game: Game;
  roundResult: { eliminated: string[] } | null;
  focusAction: boolean;
  onRound: () => void;
  onReset: () => void;
  onUndo: () => void;
  onCelebrate: () => void;
};

function PlayerRow({ player, isLeader, lost = 0 }: { player: Player; isLeader: boolean; lost?: number }) {
  return (
    <li className="score-row" data-out={!player.active} data-leader={isLeader} data-changed={lost > 0}>
      <span className="player-initial" aria-hidden="true">
        {player.active ? player.name[0]?.toLocaleUpperCase("pt-BR") : <span className="skull-mark" />}
      </span>
      <div className="score-person">
        <strong>{player.name}</strong>
        {!player.active && <small>Eliminado</small>}
        {isLeader && <small className="leader-label">Líder</small>}
        {player.active && (
          <span className="score-track" aria-hidden="true">
            <span style={{
              "--score-start": (player.score + lost) / INITIAL_POINTS,
              "--score-end": player.score / INITIAL_POINTS,
            } as CSSProperties} />
          </span>
        )}
      </div>
      <div className="score-value"><strong>{player.score}</strong><span>pts</span></div>
    </li>
  );
}

export default function Scoreboard({ game, roundResult, focusAction, onRound, onReset, onUndo, onCelebrate }: Props) {
  const active = game.players.filter((player) => player.active).sort((a, b) => b.score - a.score);
  const out = game.players.filter((player) => !player.active);
  const champion = game.finished ? active[0] : undefined;
  const leader = getLeader(game);
  const roundNumber = game.rounds.length + (game.finished ? 0 : 1);
  const last = game.rounds.at(-1);
  const lastWinner = game.players.find(({ id }) => id === last?.winnerId);
  const latestLosses = roundResult ? last?.losses : undefined;

  useEffect(() => {
    if (focusAction) document.getElementById("score-title")?.focus({ preventScroll: true });
  }, [focusAction]);

  return (
    <main className={`shell scoreboard ${game.finished ? "scoreboard-finished" : ""}`}>
      <header className="site-header">
        <Brand />
        <button type="button" className="button secondary" onClick={onReset}>Nova partida</button>
      </header>
      {champion ? (
        <section className="table-banner score-banner champion-banner" aria-labelledby="score-title">
          <div>
            <h1 id="score-title" tabIndex={-1}>{champion.name}</h1>
            <p>Campeão da partida · {champion.score} pts</p>
          </div>
          <button type="button" className="button secondary" onClick={onCelebrate}>Rever celebração</button>
        </section>
      ) : (
        <section className="table-banner score-banner" aria-labelledby="score-title">
          <div><h1 id="score-title" tabIndex={-1}>Placar da mesa</h1><p>Rodada {roundNumber}</p></div>
          <span className="table-suit" aria-hidden="true">♠</span>
        </section>
      )}
      {!game.finished && roundResult && lastWinner && (
        <RoundResult key={last?.id} winner={lastWinner.name} eliminated={roundResult.eliminated} />
      )}
      <section className="score-section" aria-labelledby="active-title">
        <div className="section-heading">
          <div><h2 id="active-title">{champion ? "Resultado final" : "Na mesa"}</h2>
            {!game.finished && !roundResult && lastWinner && <p>Última rodada: {lastWinner.name} venceu</p>}
          </div>
          <strong className="count">{active.length}/{game.players.length}</strong>
        </div>
        <ul className="score-list">
          {active.map((player) => <PlayerRow key={player.id} player={player} isLeader={leader?.id === player.id} lost={latestLosses?.[player.id]} />)}
        </ul>
      </section>
      {out.length > 0 && (
        <section className="score-section eliminated-section" aria-labelledby="out-title">
          <div className="section-heading"><h2 id="out-title">Eliminados</h2><strong className="count">{out.length}</strong></div>
          <ul className="score-list">
            {out.map((player) => <PlayerRow key={player.id} player={player} isLeader={false} lost={latestLosses?.[player.id]} />)}
          </ul>
        </section>
      )}
      <RoundHistory game={game} onUndo={onUndo} />
      {!game.finished && (
        <div className="score-dock">
          <button type="button" className="button primary" onClick={onRound}>Registrar resultado</button>
        </div>
      )}
    </main>
  );
}
