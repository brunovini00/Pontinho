"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { applyRound, createGame, GAME_KEY, PLAYERS_KEY, readStorage, rememberedNames, restoreGame, undoRound, writeStorage } from "./game";
import type { Game } from "./game";
import RoundForm from "./round-form";
import Scoreboard from "./scoreboard";
import Setup, { Brand } from "./setup";

function Dialog({ children, onClose, className = "" }: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`dialog ${className}`}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >{children}</dialog>
  );
}

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [names, setNames] = useState(["", "", ""]);
  const [ready, setReady] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [overlay, setOverlay] = useState<"reset" | "celebrate" | null>(null);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [focusScore, setFocusScore] = useState(false);

  useEffect(() => {
    setGame(restoreGame(readStorage(GAME_KEY)));
    setNames(rememberedNames());
    setReady(true);
  }, []);

  function saveGame(next: Game | null) {
    writeStorage(GAME_KEY, next);
    setGame(next);
  }

  function goToScoreboard() {
    setFocusScore(true);
    setRoundOpen(false);
    window.scrollTo(0, 0);
  }

  function startGame(players: string[]) {
    writeStorage(PLAYERS_KEY, players);
    setNames(players);
    saveGame(createGame(players));
    goToScoreboard();
  }

  function saveRound(winnerId: string, losses: Record<string, string>) {
    if (!game) return;
    const result = applyRound(game, winnerId, losses);
    if (!result) return;
    saveGame(result.game);
    setEliminated(result.eliminated);
    if (result.game.finished) setOverlay("celebrate");
    goToScoreboard();
  }

  function resetGame() {
    if (game) setNames(game.players.map(({ name }) => name));
    saveGame(null);
    setEliminated([]);
    setOverlay(null);
    setFocusScore(false);
    window.scrollTo(0, 0);
  }

  if (!ready) return <main className="shell"><header className="site-header"><Brand /></header><p className="muted" role="status">Abrindo a mesa…</p></main>;
  if (!game) return <Setup initialNames={names} onStart={startGame} />;

  const active = game.players.filter(({ active }) => active);
  const champion = game.finished ? active[0] : undefined;
  if (roundOpen) return <RoundForm players={active} round={game.rounds.length + 1} onClose={goToScoreboard} onSave={saveRound} />;

  return (
    <>
      <Scoreboard
        game={game}
        eliminated={eliminated}
        focusAction={focusScore}
        onRound={() => {
          setFocusScore(false);
          setRoundOpen(true);
        }}
        onReset={() => setOverlay("reset")}
        onUndo={() => {
          saveGame(undoRound(game));
          setEliminated([]);
        }}
        onCelebrate={() => setOverlay("celebrate")}
      />
      {overlay === "reset" && (
        <Dialog onClose={() => setOverlay(null)}>
          <h2 id="dialog-title">Começar outra partida?</h2>
          <p>O placar e o histórico atuais serão apagados. Os nomes ficam prontos para a próxima mesa.</p>
          <div className="dialog-actions">
            <button className="button secondary" onClick={() => setOverlay(null)} autoFocus>Cancelar</button>
            <button className="button danger" onClick={resetGame}>Nova partida</button>
          </div>
        </Dialog>
      )}
      {overlay === "celebrate" && champion && (
        <Dialog onClose={() => setOverlay(null)} className="celebration">
          <div className="celebration-deck" aria-hidden="true">
            <span>♦</span><span>♠</span><span>♥</span>
          </div>
          <h2 id="dialog-title">{champion.name} venceu!</h2>
          <p>Último na mesa com {champion.score} pontos.</p>
          <button className="button primary" onClick={() => setOverlay(null)} autoFocus>Ver placar final</button>
        </Dialog>
      )}
    </>
  );
}
