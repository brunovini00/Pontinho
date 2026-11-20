import { useEffect } from "react";
import { getLeader, INITIAL_POINTS } from "./game";
import type { Game, Player } from "./game";
import { Brand } from "./setup";

type Props = {
  game: Game;
  eliminated: string[];
  focusAction: boolean;
  onRound: () => void;
  onReset: () => void;
  onUndo: () => void;
  onCelebrate: () => void;
};

function PlayerRow({ player, isLeader }: { player: Player; isLeader: boolean }) {
  return (
    <li className="score-row" data-out={!player.active} data-leader={isLeader}>
      <span className="player-initial" aria-hidden="true">
        {player.active ? player.name[0]?.toLocaleUpperCase("pt-BR") : <span className="skull-mark" />}
      </span>
      <div className="score-person">
        <strong>{player.name}</strong>
        {!player.active && <small>Eliminado</small>}
        {isLeader && <small className="leader-label">Líder</small>}
        {player.active && (
          <span className="score-track" aria-hidden="true">
            <span style={{ width: `${player.score / INITIAL_POINTS * 100}%` }} />
          </span>
        )}
      </div>
      <div className="score-value"><strong>{player.score}</strong><span>pts</span></div>
    </li>
  );
}

function History({ game, onUndo }: { game: Game; onUndo: () => void }) {
  const names = new Map(game.players.map(({ id, name }) => [id, name]));
  return (
    <details className="history">
      <summary>
        <span>Histórico de rodadas <span className="history-count">{game.rounds.length}</span></span>
        <span className="chevron" aria-hidden="true" />
      </summary>
      <div className="history-body">
        {game.rounds.length === 0 ? <p className="muted">Os resultados aparecem aqui depois da primeira rodada.</p> : (
          <>
            <button type="button" className="button secondary undo-button" onClick={onUndo}>Desfazer última rodada</button>
            <ol className="history-list" reversed>
              {game.rounds.slice().reverse().map((round, index) => (
                <li key={round.id}>
                  <span>Rodada {game.rounds.length - index}</span>
                  <strong>{names.get(round.winnerId)} venceu</strong>
                  <ul>
                    {Object.entries(round.losses).filter(([id, loss]) => id !== round.winnerId && loss > 0).map(([id, loss]) => (
                      <li key={id}>{names.get(id)} <b>−{loss}</b></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </details>
  );
}

export default function Scoreboard({ game, eliminated, focusAction, onRound, onReset, onUndo, onCelebrate }: Props) {
  const active = game.players.filter((player) => player.active).sort((a, b) => b.score - a.score);
  const out = game.players.filter((player) => !player.active);
  const champion = game.finished ? active[0] : undefined;
  const leader = getLeader(game);
  const roundNumber = game.rounds.length + (game.finished ? 0 : 1);
  const last = game.rounds.at(-1);
  const lastWinner = game.players.find(({ id }) => id === last?.winnerId);
  const formatNames = new Intl.ListFormat("pt-BR");

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
      {eliminated.length > 0 && !game.finished && (
        <p className="elimination-note" role="status">
          <span className="skull-mark" aria-hidden="true" />
          <span><strong>{formatNames.format(eliminated)}</strong> {eliminated.length === 1 ? "saiu da mesa." : "saíram da mesa."}</span>
        </p>
      )}
      <section className="score-section" aria-labelledby="active-title">
        <div className="section-heading">
          <div><h2 id="active-title">{champion ? "Resultado final" : "Na mesa"}</h2>
            {!game.finished && lastWinner && <p>Última rodada: {lastWinner.name} venceu</p>}
          </div>
          <strong className="count">{active.length}/{game.players.length}</strong>
        </div>
        <ul className="score-list">
          {active.map((player) => <PlayerRow key={player.id} player={player} isLeader={leader?.id === player.id} />)}
        </ul>
      </section>
      {out.length > 0 && (
        <section className="score-section eliminated-section" aria-labelledby="out-title">
          <div className="section-heading"><h2 id="out-title">Eliminados</h2><strong className="count">{out.length}</strong></div>
          <ul className="score-list">{out.map((player) => <PlayerRow key={player.id} player={player} isLeader={false} />)}</ul>
        </section>
      )}
      <History game={game} onUndo={onUndo} />
      {!game.finished && (
        <div className="score-dock">
          <button type="button" className="button primary" onClick={onRound}>Registrar resultado</button>
        </div>
      )}
    </main>
  );
}
