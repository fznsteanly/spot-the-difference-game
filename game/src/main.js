// Boots the game: wires the canvas, HUD and buttons, runs the frame loop, and
// turns clicks and keys into game moves. Reads ?shot=start|play|end for the
// deterministic screenshot scenes (see shots.js); without it, a normal game.
import { PANEL_WIDTH, PANEL_HEIGHT } from './scenes.js';
import {
  createGame, startGame, startRound, tick, clickAt, useHint, nextRound,
  currentRound, differencesLeft, timeText, totalStars, roundStars,
} from './game.js';
import { renderFrame, GAP } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio, playFound, playMiss, playClear } from './sfx.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const game = createGame();

const el = {
  roundName: document.getElementById('roundName'),
  counter: document.getElementById('counter'),
  timerBar: document.getElementById('timerBar'),
  timerText: document.getElementById('timerText'),
  score: document.getElementById('score'),
  hintBtn: document.getElementById('hintBtn'),
  statusMsg: document.getElementById('statusMsg'),
  titleScreen: document.getElementById('titleScreen'),
  roundScreen: document.getElementById('roundScreen'),
  resultsScreen: document.getElementById('resultsScreen'),
  roundHeading: document.getElementById('roundHeading'),
  roundSummary: document.getElementById('roundSummary'),
  roundStars: document.getElementById('roundStars'),
  nextBtn: document.getElementById('nextBtn'),
  finalScore: document.getElementById('finalScore'),
  finalDetail: document.getElementById('finalDetail'),
  finalStars: document.getElementById('finalStars'),
  startBtn: document.getElementById('startBtn'),
  againBtn: document.getElementById('againBtn'),
};

function showOverlay(which) {
  el.titleScreen.classList.toggle('hidden', which !== 'title');
  el.roundScreen.classList.toggle('hidden', which !== 'roundEnd');
  el.resultsScreen.classList.toggle('hidden', which !== 'results');
}

function starsText(count) {
  return '★'.repeat(count) + '☆'.repeat(Math.max(0, 3 - count));
}

/** Push the whole game state into the HUD and overlays. */
export function syncHud() {
  const round = currentRound(game);
  el.roundName.textContent = round.name;
  el.counter.textContent = `Found ${game.found.size} / ${round.differences.length} · ${differencesLeft(game)} left`;
  el.timerText.textContent = timeText(game);
  const fraction = Math.max(0, game.timeLeft / round.timeLimit);
  el.timerBar.style.width = `${fraction * 100}%`;
  el.timerBar.classList.toggle('low', fraction < 0.25);
  el.score.textContent = `Score ${game.score}`;
  el.hintBtn.textContent = `Hint (H) · ${game.hintsLeft} left`;
  el.hintBtn.disabled = game.screen !== 'play' || game.hintsLeft <= 0;
  el.statusMsg.textContent = game.message;
  showOverlay(game.screen === 'play' ? 'none' : game.screen);
  if (game.screen === 'roundEnd') {
    const entry = game.roundScores[game.roundScores.length - 1];
    el.roundHeading.textContent = `${round.name} complete!`;
    el.roundSummary.textContent = `You found ${entry.found} of ${entry.total} differences` +
      (entry.bonus ? `, with a +${entry.bonus} time bonus.` : '.');
    el.roundStars.textContent = starsText(roundStars(entry));
  }
  if (game.screen === 'results') {
    const stars = totalStars(game);
    el.finalScore.textContent = `Final score: ${game.score}`;
    el.finalDetail.textContent = `You found ${game.totalFound} of 25 differences across 3 rounds.`;
    el.finalStars.textContent = `${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, 9 - stars))} (${stars}/9)`;
  }
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  if (x < 0 || x >= PANEL_WIDTH * 2 + GAP || y < 0 || y >= PANEL_HEIGHT) return null;
  if (x >= PANEL_WIDTH && x < PANEL_WIDTH + GAP) return null;
  const panel = x < PANEL_WIDTH ? 0 : 1;
  return { x: x - (panel === 0 ? 0 : PANEL_WIDTH + GAP), y, panel };
}

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  const point = canvasPoint(event);
  if (!point) return;
  const before = game.found.size;
  const result = clickAt(game, point.x, point.y, point.panel, performance.now());
  if (result === 'found') {
    playFound();
    if (game.screen === 'roundEnd' || game.screen === 'results') playClear();
  } else if (result === 'miss') {
    playMiss();
  }
  if (game.found.size !== before || result === 'miss') syncHud();
});

el.hintBtn.addEventListener('click', () => {
  unlockAudio();
  if (useHint(game, performance.now())) syncHud();
});

el.startBtn.addEventListener('click', () => {
  unlockAudio();
  startGame(game);
  syncHud();
});

el.nextBtn.addEventListener('click', () => {
  nextRound(game);
  syncHud();
});

el.againBtn.addEventListener('click', () => {
  startGame(game);
  syncHud();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'h' || event.key === 'H') {
    if (useHint(game, performance.now())) syncHud();
  }
  if (event.key === 'Enter' && game.screen === 'title') {
    startGame(game);
    syncHud();
  }
});

// --- boot --------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const screen = stageShot(shot, game);
  if (screen === 'results') {
    // Keep the finished board visible behind the results card.
    game.found = new Set(currentRound(game).differences.map((d) => d.id));
  }
  syncHud();
} else {
  startRound(game);
  game.screen = 'title';
  syncHud();
}

let last = performance.now();
function frame(now) {
  const outcome = tick(game, Math.min(0.1, (now - last) / 1000));
  last = now;
  if (outcome) syncHud();
  try {
    renderFrame(ctx, game, now);
  } catch (error) {
    // A single bad frame must never freeze the game; the next frame retries.
    console.error('render frame failed', error);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
