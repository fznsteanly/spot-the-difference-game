// The screenshot scenes behind ?shot=start|play|end&seed=N. Each one drives the
// real game state — no fake overlays — so the frame is what a short game really
// looks like, and the same seed always gives the same frame. The clock is frozen
// in shot mode so the timer never ticks between load and capture.
import { ROUNDS } from './scenes.js';
import { createGame, startGame, clickAt, currentRound, nextRound } from './game.js';

/** The three differences the play shot has already found (spread across the scene). */
const PLAY_FOUND_IDS = ['sun-glasses', 'flower-colour', 'kite'];

/**
 * Set `game` to the named scene (start, play or end; any other name is start)
 * and return the screen the page should show over it.
 */
export function stageShot(name, game) {
  const fresh = createGame();
  Object.assign(game, fresh);
  game.frozen = true;
  if (name === 'play') {
    startGame(game);
    const round = currentRound(game);
    // Real clock time: renderFrame ages markers from this stamp, so a fake
    // stamp in the past would make the pop-in radius go negative and throw.
    const now = performance.now();
    for (const id of PLAY_FOUND_IDS) {
      const diff = round.differences.find((d) => d.id === id);
      if (diff) clickAt(game, diff.x, diff.y, 0, now);
    }
    // A mid-round clock: plenty of time left, but the pressure is visible.
    game.timeLeft = 107;
    game.message = 'Three found — four still hiding. Keep looking!';
    return 'play';
  }
  if (name === 'end') {
    startGame(game);
    const now = performance.now();
    // Play every round to completion, instantly, the way a perfect player would.
    for (let roundIndex = 0; roundIndex < ROUNDS.length; roundIndex += 1) {
      const round = currentRound(game);
      for (const diff of round.differences) {
        clickAt(game, diff.x, diff.y, 0, now);
      }
      if (game.screen === 'roundEnd') nextRound(game);
    }
    // Leave the clock where the final round ended (time still on it), as in real play.
    game.message = 'Every difference found — well played!';
    return 'results';
  }
  // Start: the title screen over round 1's scene.
  startGame(game);
  game.screen = 'title';
  game.found = new Set();
  game.foundAt = new Map();
  game.score = 0;
  game.timeLeft = ROUNDS[0].timeLimit;
  game.message = 'Find every difference before time runs out.';
  return 'title';
}
