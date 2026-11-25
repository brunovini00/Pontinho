"use client";

import { useEffect, useState } from "react";
import { applyRound, createGame, GAME_KEY, PLAYERS_KEY, readStorage, rememberedNames, restoreGame, undoRound, writeStorage } from "./game";
import type { Game } from "./game";
import Dialog from "./dialog";
import RoundForm from "./round-form";
import { ChampionCards, eliminationMessage } from "./round-result";
import Scoreboard from "./scoreboard";
import Setup, { Brand } from "./setup";

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [names, setNames] = useState(["", "", ""]);
  const [ready, setReady] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [overlay, setOverlay] = useState<"reset" | "celebrate" | null>(null);
  const [roundResult, setRoundResult] = useState<{ eliminated: string[] } | null>(null);
  const [focusScreen, setFocusScreen] = useState(false);

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
    setFocusScreen(true);
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
    setRoundResult({ eliminated: result.eliminated });
    if (result.game.finished) setOverlay("celebrate");
    goToScoreboard();
  }

  function resetGame() {
    if (game) setNames(game.players.map(({ name }) => name));
    saveGame(null);
    setRoundResult(null);
    setOverlay(null);
    setFocusScreen(true);
    window.scrollTo(0, 0);
  }

  if (!ready) return <main className="shell"><header className="site-header"><Brand /></header><p className="muted" role="status">Abrindo a mesa…</p></main>;
  if (!game) return <Setup initialNames={names} focusTitle={focusScreen} onStart={startGame} />;

  const active = game.players.filter(({ active }) => active);
  const champion = game.finished ? active[0] : undefined;
  if (roundOpen) return <RoundForm players={active} round={game.rounds.length + 1} onClose={goToScoreboard} onSave={saveRound} />;

  return (
    <>
      <Scoreboard
        game={game}
        roundResult={roundResult}
        focusAction={focusScreen && overlay !== "celebrate"}
        onRound={() => {
          setRoundResult(null);
          setFocusScreen(false);
          setRoundOpen(true);
        }}
        onReset={() => setOverlay("reset")}
        onUndo={() => {
          saveGame(undoRound(game));
          setRoundResult(null);
        }}
        onCelebrate={() => {
          setFocusScreen(false);
          setOverlay("celebrate");
        }}
      />
      {overlay === "reset" && (
        <Dialog
          title="Começar outra partida?"
          description="O placar e o histórico atuais serão apagados. Os nomes ficam prontos para a próxima mesa."
          onClose={() => setOverlay(null)}
        >
          <div className="dialog-actions">
            <button className="button secondary" onClick={() => setOverlay(null)} autoFocus>Cancelar</button>
            <button className="button danger" onClick={resetGame}>Nova partida</button>
          </div>
        </Dialog>
      )}
      {overlay === "celebrate" && champion && (
        <Dialog
          title={`${champion.name} venceu!`}
          description={
            <>
              Último na mesa com {champion.score} pontos.
              {!!roundResult?.eliminated.length && (
                <span className="celebration-elimination">
                  <span className="result-card result-card-out" aria-hidden="true"><span className="skull-mark" /></span>
                  <span>{eliminationMessage(roundResult.eliminated)}</span>
                </span>
              )}
            </>
          }
          visual={<ChampionCards />}
          onClose={() => setOverlay(null)}
          className="celebration"
        >
          <button className="button primary" onClick={() => setOverlay(null)} autoFocus>Ver placar final</button>
        </Dialog>
      )}
    </>
  );
}
