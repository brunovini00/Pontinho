export type Player = { id: string; name: string; score: number; active: boolean };
export type Round = { id: string; winnerId: string; losses: Record<string, number>; createdAt: string };
export type Game = { players: Player[]; rounds: Round[]; startedAt: string; finished: boolean };

export const INITIAL_POINTS = 100;
export const MAX_PLAYERS = 10;
export const NAME_LIMIT = 20;
export const GAME_KEY = "pontinho-game-v1";
export const PLAYERS_KEY = "pontinho-last-players-v1";

function id() {
  return Math.random().toString(36).slice(2, 10);
}

export function createGame(names: string[]): Game {
  return {
    players: names.map((name) => ({ id: id(), name, score: INITIAL_POINTS, active: true })),
    rounds: [],
    startedAt: new Date().toISOString(),
    finished: false,
  };
}

export function parseLoss(value: string | undefined, balance: number) {
  if (!value || !/^\d+$/.test(value)) return null;
  const loss = Number(value);
  return Number.isInteger(loss) && loss > 0 && loss <= balance ? loss : null;
}

export function applyRound(game: Game, winnerId: string, entries: Record<string, string>) {
  const active = game.players.filter((player) => player.active);
  if (game.finished || active.length < 2 || !active.some((player) => player.id === winnerId)) return null;

  const losses: Record<string, number> = { [winnerId]: 0 };
  for (const player of active) {
    if (player.id === winnerId) continue;
    const loss = parseLoss(entries[player.id], player.score);
    if (loss === null) return null;
    losses[player.id] = loss;
  }

  const eliminated: string[] = [];
  const players = game.players.map((player) => {
    if (!player.active || player.id === winnerId) return player;
    const score = player.score - losses[player.id];
    if (score === 0) eliminated.push(player.name);
    return { ...player, score, active: score > 0 };
  });
  const round = { id: id(), winnerId, losses, createdAt: new Date().toISOString() };
  return {
    game: { ...game, players, rounds: [...game.rounds, round], finished: players.filter((player) => player.active).length === 1 },
    eliminated,
  };
}

export function undoRound(game: Game): Game {
  const round = game.rounds.at(-1);
  if (!round) return game;
  const players = game.players.map((player) => {
    const score = player.score + (round.losses[player.id] ?? 0);
    return { ...player, score, active: score > 0 };
  });
  return { ...game, players, rounds: game.rounds.slice(0, -1), finished: false };
}

export function getLeader(game: Game) {
  if (!game.rounds.length || game.finished) return undefined;
  const active = game.players.filter((player) => player.active);
  const topScore = Math.max(...active.map((player) => player.score));
  const leaders = active.filter((player) => player.score === topScore);
  return leaders.length === 1 ? leaders[0] : undefined;
}

export function restoreGame(raw: string | null): Game | null {
  if (raw === null) return null;
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved.startedAt !== "string" || typeof saved.finished !== "boolean") return null;
    if (!Array.isArray(saved.players) || saved.players.length < 2 || saved.players.length > MAX_PLAYERS) return null;
    const validPlayers = saved.players.every((p: Player) => p && typeof p.id === "string" &&
      typeof p.name === "string" && p.name.trim() && Number.isFinite(p.score) && p.score >= 0 &&
      p.score <= INITIAL_POINTS && p.active === (p.score > 0));
    if (!validPlayers) return null;
    const ids = new Set<string>(saved.players.map((player: Player) => player.id));
    const activeCount = saved.players.filter((player: Player) => player.active).length;
    if (ids.size !== saved.players.length || activeCount === 0 || saved.finished !== (activeCount === 1)) return null;
    if (!Array.isArray(saved.rounds) || !saved.rounds.every((round: Round) =>
      round && typeof round.id === "string" && ids.has(round.winnerId) && typeof round.createdAt === "string" &&
      round.losses && typeof round.losses === "object" && !Array.isArray(round.losses) &&
      Object.entries(round.losses).every(([key, loss]) => ids.has(key) && Number.isFinite(loss) && loss >= 0 && loss <= INITIAL_POINTS)
    )) return null;
    return saved;
  } catch {
    return null;
  }
}

export function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A partida continua disponível em memória quando o navegador bloqueia o armazenamento.
  }
}

export function rememberedNames(): string[] {
  try {
    const value: unknown = JSON.parse(readStorage(PLAYERS_KEY) ?? "null");
    if (Array.isArray(value) && value.length >= 2 && value.length <= MAX_PLAYERS &&
        value.every((name) => typeof name === "string" && name.trim())) return value;
  } catch {
    // O usuário ainda pode iniciar uma partida nova.
  }
  return ["", "", ""];
}
