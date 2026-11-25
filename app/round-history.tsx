import { useId, useRef, useState } from "react";
import type { Game } from "./game";

export default function RoundHistory({ game, onUndo }: { game: Game; onUndo: () => void }) {
  const [open, setOpen] = useState(false);
  const [undone, setUndone] = useState<number>();
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const count = game.rounds.length;
  const names = new Map(game.players.map(({ id, name }) => [id, name]));

  function undo() {
    if (count === 1) toggle.current?.focus({ preventScroll: true });
    onUndo();
    setUndone(count);
  }

  return (
    <section className="history">
      <button
        ref={toggle}
        type="button"
        id={`${id}-toggle`}
        className="history-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((expanded) => !expanded)}
      >
        <span className="history-icon" aria-hidden="true" />
        <span className="history-label">
          Histórico de rodadas
          <span className="history-count" aria-hidden="true">{count}</span>
          <span className="sr-only">, {count} {count === 1 ? "rodada" : "rodadas"}</span>
        </span>
        <span className="chevron" aria-hidden="true" />
      </button>
      <div
        className="history-panel"
        data-open={open}
        inert={!open}
        aria-hidden={!open}
        id={id}
        role="region"
        aria-labelledby={`${id}-toggle`}
      >
        <div className="history-clip">
          <div className="history-body">
            <div className="history-feedback" role="status">
              {undone !== undefined && <p key={undone}>Rodada {undone} desfeita. Placar restaurado.</p>}
            </div>
            {count === 0 ? (
              <p className="muted">Os resultados aparecem aqui depois da primeira rodada.</p>
            ) : (
              <>
                <button type="button" className="button secondary undo-button" onClick={undo}>Desfazer última rodada</button>
                <ol className="history-list" reversed>
                  {game.rounds.slice().reverse().map((round, index) => (
                    <li key={round.id} className="history-round">
                      <div className="history-round-header">
                        <strong>{names.get(round.winnerId)} venceu</strong>
                        <span>Rodada {count - index}</span>
                      </div>
                      <ul className="history-losses">
                        {Object.entries(round.losses).filter(([playerId, loss]) => playerId !== round.winnerId && loss > 0).map(([playerId, loss]) => (
                          <li key={playerId}><span>{names.get(playerId)}</span> <b>−{loss}</b></li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
