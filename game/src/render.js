// Draws the whole game onto the canvas: both panels side by side, the gold ring
// on every difference found, the floating score popups, the red cross on a wrong
// click, and the pulsing hint ring. Panels are 560x420 with a 40px gap.
import { PANEL_WIDTH, PANEL_HEIGHT } from './scenes.js';
import { currentRound } from './game.js';

export const GAP = 40;
const MARKER_COLOR = '#f59e0b';
const MARKER_FOUND = '#16a34a';

function panelOrigin(panel) {
  return panel === 0 ? 0 : PANEL_WIDTH + GAP;
}

/** Draw one panel's scene, clipped to its rectangle. */
function drawPanel(ctx, scene, variant) {
  const originX = panelOrigin(variant);
  ctx.save();
  ctx.beginPath();
  ctx.rect(originX, 0, PANEL_WIDTH, PANEL_HEIGHT);
  ctx.clip();
  ctx.translate(originX, 0);
  scene.draw(ctx, variant);
  ctx.restore();
}

/** A satisfying ring around a found difference, popping in just after the click. */
function drawFoundMarker(ctx, diff, ageMs) {
  const pop = ageMs < 180 ? Math.max(0.1, 0.6 + (ageMs / 180) * 0.4) : 1;
  const r = diff.r * pop;
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, r, 0, Math.PI * 2);
  ctx.strokeStyle = MARKER_COLOR;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, r - 7, 0, Math.PI * 2);
  ctx.strokeStyle = MARKER_FOUND;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Check mark in the middle of the ring.
  ctx.beginPath();
  ctx.moveTo(diff.x - 10, diff.y);
  ctx.lineTo(diff.x - 3, diff.y + 8);
  ctx.lineTo(diff.x + 11, diff.y - 8);
  ctx.strokeStyle = MARKER_FOUND;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/** A fading red cross where a wrong click landed. */
function drawWrongMark(ctx, mark, ageMs) {
  const alpha = Math.max(0, 1 - ageMs / 900);
  const s = 12;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(mark.x - s, mark.y - s);
  ctx.lineTo(mark.x + s, mark.y + s);
  ctx.moveTo(mark.x + s, mark.y - s);
  ctx.lineTo(mark.x - s, mark.y + s);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

/** The hint's pulsing dashed circle around one still-hidden difference. */
function drawHintRing(ctx, diff, now) {
  const pulse = 1 + 0.12 * Math.sin(now / 180);
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, diff.r * pulse + 6, 0, Math.PI * 2);
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Floating "+100" text that rises and fades after a find. */
function drawPopup(ctx, popup, ageMs) {
  const alpha = Math.max(0, 1 - ageMs / 1100);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '900 22px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#16a34a';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  const y = popup.y - 30 - ageMs / 40;
  ctx.strokeText(popup.text, popup.x - 18, y);
  ctx.fillText(popup.text, popup.x - 18, y);
  ctx.restore();
}

/** Paint one full frame. `now` is performance.now(). */
export function renderFrame(ctx, game, now) {
  const round = currentRound(game);
  ctx.clearRect(0, 0, PANEL_WIDTH * 2 + GAP, PANEL_HEIGHT);
  drawPanel(ctx, round, 0);
  drawPanel(ctx, round, 1);

  // Divider between the pictures.
  ctx.beginPath();
  ctx.moveTo(PANEL_WIDTH + GAP / 2, 0);
  ctx.lineTo(PANEL_WIDTH + GAP / 2, PANEL_HEIGHT);
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (const diff of round.differences) {
    if (!game.found.has(diff.id)) continue;
    const age = Math.max(0, now - (game.foundAt.get(diff.id) ?? now));
    for (let panel = 0; panel < 2; panel += 1) {
      ctx.save();
      ctx.translate(panelOrigin(panel), 0);
      drawFoundMarker(ctx, diff, age);
      ctx.restore();
    }
  }

  if (game.hintTarget && now < game.hintUntil) {
    const target = round.differences.find((d) => d.id === game.hintTarget);
    if (target) {
      for (let panel = 0; panel < 2; panel += 1) {
        ctx.save();
        ctx.translate(panelOrigin(panel), 0);
        drawHintRing(ctx, target, now);
        ctx.restore();
      }
    }
  }

  for (const mark of game.wrongMarks) {
    const age = Math.max(0, now - mark.at);
    if (age > 900) continue;
    ctx.save();
    ctx.translate(panelOrigin(mark.panel), 0);
    drawWrongMark(ctx, mark, age);
    ctx.restore();
  }

  for (const popup of game.popups) {
    const age = Math.max(0, now - popup.at);
    if (age > 1100) continue;
    ctx.save();
    ctx.translate(panelOrigin(popup.panel), 0);
    drawPopup(ctx, popup, age);
    ctx.restore();
  }
}
