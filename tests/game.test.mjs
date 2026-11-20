import test from "node:test";
import assert from "node:assert/strict";
import { applyRound, createGame, getLeader, restoreGame, undoRound } from "../app/game.ts";

test("cada adversário precisa de uma perda inteira positiva dentro do saldo", () => {
  const game = createGame(["Ana", "Beto", "Caio"]);
  const [winner, second, third] = game.players;
  for (const invalid of ["", "0", "-1", "1.5", "101", "1e1"]) {
    assert.equal(applyRound(game, winner.id, { [second.id]: "5", [third.id]: invalid }), null);
  }
  assert.equal(applyRound(game, "invalid", { [second.id]: "5", [third.id]: "5" }), null);
});

test("mantém a pontuação do vencedor, elimina a zero e restaura o placar ao desfazer", () => {
  const game = createGame(["Ana", "Beto", "Caio"]);
  const [winner, second, third] = game.players;
  const first = applyRound(game, winner.id, { [second.id]: "99", [third.id]: "100" });
  assert.deepEqual(first.game.players.map(({ score, active }) => [score, active]), [[100, true], [1, true], [0, false]]);
  assert.deepEqual(first.eliminated, ["Caio"]);
  assert.equal(first.game.finished, false);
  const last = applyRound(first.game, second.id, { [winner.id]: "100" });
  assert.equal(last.game.finished, true);
  assert.equal(last.game.players[1].score, 1);
  assert.deepEqual(undoRound(last.game), first.game);
  assert.deepEqual(undoRound(first.game), game);
});

test("recupera partidas antigas com as mesmas chaves e ignora dados inválidos", () => {
  const game = createGame(["Ana", "Beto"]);
  assert.deepEqual(restoreGame(JSON.stringify(game)), game);
  for (const value of ["{", "null", "{}", '{"players":[],"rounds":[]}']) {
    assert.equal(restoreGame(value), null);
  }
});

test("exibe liderança após a primeira rodada quando há um líder único", () => {
  const game = createGame(["Ana", "Beto"]);
  const [first, second] = game.players;
  assert.equal(getLeader(game), undefined);
  const led = applyRound(game, first.id, { [second.id]: "5" }).game;
  assert.equal(getLeader(led)?.id, first.id);
  const tied = applyRound(led, second.id, { [first.id]: "5" }).game;
  assert.equal(getLeader(tied), undefined);
});
