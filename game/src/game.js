// The rules of Twin Picture Hunt: rounds, timer, scoring, hints and wrong clicks.
// Pure state — no DOM or canvas here — so shots.js can drive it headlessly.
import { ROUNDS } from './scenes.js';

export const POINTS_PER_FIND = 100;
export const WRONG_CLICK_POINTS = 10;
export const WRONG_CLICK_SECONDS = 5;
export const HINT_COST = 50;
export const TIME_BONUS_PER_SECOND = 5;

/** A fresh game state, sitting on the title screen of round 1. */
export function createGame() {
  return {
    screen: 'title', // title | play | roundEnd | results
    roundIndex: 0,
    found: new Set(),
    foundAt: new Map(), // difference id -> performance.now() when found
    score: 0,
    timeLeft: ROUNDS[0].timeLimit,
    hintsLeft: ROUNDS[0].hints,
    hintTarget: null, // difference id currently highlighted by a hint
    hintUntil: 0,
    wrongMarks: [], // {x, y, panel, at} fading red crosses
    popups: [], // {x, y, panel, text, at} floating score text
    roundScores: [],
    totalFound: 0,
    frozen: false, // shot mode: the clock never ticks
    message: 'Find every difference before time runs out.',
  };
}

export function currentRound(game) {
  return ROUNDS[game.roundIndex];
}

export function differencesLeft(game) {
  return currentRound(game).differences.length - game.found.size;
}

/** Start (or restart) the current round with a fresh timer and hints. */
export function startRound(game) {
  const round = currentRound(game);
  game.found = new Set();
  game.foundAt = new Map();
  game.timeLeft = round.timeLimit;
  game.hintsLeft = round.hints;
  game.hintTarget = null;
  game.wrongMarks = [];
  game.popups = [];
  game.screen = 'play';
  game.message = `Find all ${round.differences.length} differences!`;
}

/** Begin the whole game from round 1. */
export function startGame(game) {
  game.roundIndex = 0;
  game.score = 0;
  game.roundScores = [];
  game.totalFound = 0;
  startRound(game);
}

function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function timeText(game) {
  return formatTime(game.timeLeft);
}

/** Tick the clock down by dt seconds; returns 'timeout' when the round ends. */
export function tick(game, dt) {
  if (game.screen !== 'play' || game.frozen) return null;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    return endRound(game, false);
  }
  return null;
}

function endRound(game, cleared) {
  const round = currentRound(game);
  const bonus = cleared ? Math.ceil(game.timeLeft) * TIME_BONUS_PER_SECOND : 0;
  const roundScore = game.found.size * POINTS_PER_FIND + bonus;
  game.score += bonus;
  game.roundScores.push({ round: game.roundIndex, found: game.found.size, total: round.differences.length, bonus, cleared });
  game.totalFound += game.found.size;
  if (game.roundIndex + 1 < ROUNDS.length && cleared) {
    game.screen = 'roundEnd';
    game.message = cleared
      ? `Round clear! Time bonus +${bonus}.`
      : 'Time up — the round ends here.';
  } else {
    game.screen = 'results';
    game.message = cleared ? 'Every difference found — well played!' : 'Time up — here is how you did.';
  }
  return cleared ? 'cleared' : 'timeout';
}

/**
 * Handle a click at panel coordinates (x, y) on panel 0 (left) or 1 (right).
 * Returns 'found' | 'already' | 'miss'. A found difference is marked on both panels.
 */
export function clickAt(game, x, y, panel, now) {
  if (game.screen !== 'play') return 'idle';
  const round = currentRound(game);
  for (const diff of round.differences) {
    const dx = x - diff.x;
    const dy = y - diff.y;
    if (dx * dx + dy * dy <= diff.r * diff.r) {
      if (game.found.has(diff.id)) return 'already';
      game.found.add(diff.id);
      game.foundAt.set(diff.id, now);
      game.score += POINTS_PER_FIND;
      game.popups.push({ x: diff.x, y: diff.y, panel, text: `+${POINTS_PER_FIND}`, at: now });
      game.hintTarget = null;
      if (game.found.size === round.differences.length) {
        game.message = 'All differences found!';
        endRound(game, true);
      } else {
        game.message = `Found it — ${diff.label}! ${differencesLeft(game)} left.`;
      }
      return 'found';
    }
  }
  game.score = Math.max(0, game.score - WRONG_CLICK_POINTS);
  game.timeLeft = Math.max(0, game.timeLeft - WRONG_CLICK_SECONDS);
  game.wrongMarks.push({ x, y, panel, at: now });
  game.message = `Not a difference — minus ${WRONG_CLICK_SECONDS} seconds.`;
  return 'miss';
}

/** Spend a hint: highlight one still-hidden difference for a few seconds. */
export function useHint(game, now) {
  if (game.screen !== 'play' || game.hintsLeft <= 0) return null;
  const round = currentRound(game);
  const remaining = round.differences.filter((d) => !game.found.has(d.id));
  if (remaining.length === 0) return null;
  const target = remaining[Math.floor(now / 997) % remaining.length];
  game.hintsLeft -= 1;
  game.score = Math.max(0, game.score - HINT_COST);
  game.hintTarget = target.id;
  game.hintUntil = now + 3000;
  game.message = `Hint: look near “${target.label}” — minus ${HINT_COST} points.`;
  return target;
}

/** Move on after a cleared round: next round, or the results screen. */
export function nextRound(game) {
  if (game.screen !== 'roundEnd') return;
  game.roundIndex += 1;
  startRound(game);
}

/** Stars for a finished round: 3 for a clear with half the time left, else by finds. */
export function roundStars(entry) {
  if (!entry.cleared) return entry.found >= entry.total - 1 ? 1 : 0;
  if (entry.bonus >= 300) return 3;
  if (entry.bonus >= 120) return 2;
  return 1;
}

export function totalStars(game) {
  return game.roundScores.reduce((sum, entry) => sum + roundStars(entry), 0);
}
