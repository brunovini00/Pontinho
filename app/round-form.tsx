import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { parseLoss } from "./game";
import type { Player } from "./game";

const LOSS_STEP = 5;

export default function RoundForm({ players, round, onClose, onSave }: {
  players: Player[];
  round: number;
  onClose: () => void;
  onSave: (winnerId: string, losses: Record<string, string>) => void;
}) {
  const [winnerId, setWinnerId] = useState("");
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [scoring, setScoring] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const winner = players.find(({ id }) => id === winnerId);
  const others = players.filter(({ id }) => id !== winnerId);
  const complete = others.filter((player) => parseLoss(entries[player.id], player.score) !== null).length;
  const valid = Boolean(winner) && complete === others.length;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [scoring]);

  function updateLoss(id: string, value: string) {
    setEntries((previous) => ({ ...previous, [id]: value }));
  }

  function adjust(player: Player, direction: number) {
    const value = parseLoss(entries[player.id], player.score) ?? 0;
    const next = Math.max(1, Math.min(player.score, value + direction * LOSS_STEP));
    updateLoss(player.id, String(next));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (scoring && winner && valid) onSave(winner.id, entries);
    else if (!scoring && winner) setScoring(true);
  }

  return (
    <main className={`shell round-screen ${scoring ? "round-losses" : ""}`}>
      <header className="round-header">
        <button type="button" className="button subtle" onClick={() => scoring ? setScoring(false) : onClose()}>
          {scoring ? "Voltar" : "Cancelar"}
        </button>
        <span>Rodada {round}</span>
        <span className="stage-number" aria-label={`Etapa ${scoring ? 2 : 1} de 2`}>{scoring ? "2" : "1"}/2</span>
      </header>
      <h1 ref={heading} tabIndex={-1} className="screen-title">{scoring ? "Pontos perdidos" : "Quem venceu?"}</h1>
      <form onSubmit={submit}>
        {!scoring && (
          <>
            <p className="round-intro">O vencedor mantém a pontuação.</p>
            <fieldset className="winner-grid">
              <legend className="sr-only">Vencedor da rodada</legend>
              {players.map((player) => (
                <label className="winner-choice" key={player.id}>
                  <input
                    type="radio"
                    name="winner"
                    checked={winnerId === player.id}
                    onChange={() => setWinnerId(player.id)}
                  />
                  <span className="player-initial" aria-hidden="true">{player.name[0]?.toLocaleUpperCase("pt-BR")}</span>
                  <span className="winner-choice-copy"><strong>{player.name}</strong><small>{player.score} pts</small></span>
                  <span className="radio-indicator" aria-hidden="true" />
                </label>
              ))}
            </fieldset>
            <div className="form-actions"><button className="button primary" disabled={!winner}>Continuar</button></div>
          </>
        )}
        {scoring && winner && (
          <>
            <div className="winner-summary">
              <span className="summary-suit" aria-hidden="true">♠</span>
              <p><strong>{winner.name}</strong> venceu</p>
              <span>Sem perda</span>
            </div>
            <div className="loss-progress">
              <span>Informe a perda de cada adversário</span>
              <strong aria-live="polite" aria-label={`${complete} de ${others.length} perdas preenchidas`}>{complete}/{others.length}</strong>
            </div>
            <ul className="loss-list">
              {others.map((player) => {
                const value = entries[player.id] ?? "";
                const parsed = parseLoss(value, player.score);
                const invalid = Boolean(value) && parsed === null;
                const hintId = `loss-hint-${player.id}`;
                return (
                  <li className="loss-row" key={player.id} data-state={invalid ? "error" : parsed !== null ? "filled" : "empty"}>
                    <div className="loss-player">
                      <label htmlFor={`loss-${player.id}`}>{player.name}</label>
                      <small id={hintId}>{invalid ? `Use de 1 a ${player.score}` : parsed === player.score ? "Será eliminado" : `${player.score} pts na mesa`}</small>
                    </div>
                    <div className="loss-control">
                      <button type="button" className="step-button" onClick={() => adjust(player, -1)} disabled={parsed === null || parsed <= 1} aria-label={`Diminuir perda de ${player.name}`}>−</button>
                      <input
                        id={`loss-${player.id}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        pattern="[0-9]*"
                        maxLength={3}
                        placeholder="—"
                        aria-label={`Pontos perdidos por ${player.name}`}
                        aria-describedby={hintId}
                        aria-invalid={invalid || undefined}
                        value={value}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) => updateLoss(player.id, event.target.value)}
                      />
                      <button type="button" className="step-button" onClick={() => adjust(player, 1)} disabled={parsed === player.score} aria-label={`Aumentar perda de ${player.name}`}>+</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="form-actions"><button className="button primary" disabled={!valid}>Registrar rodada</button></div>
          </>
        )}
      </form>
    </main>
  );
}
