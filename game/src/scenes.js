// The three scenes of Twin Picture Hunt. Every scene is drawn twice — once per
// panel — from the same seeded decoration, and only the listed differences change
// between the left (variant 0) and right (variant 1) pictures. All art is original
// and drawn here in code; no image files are used anywhere in the game.
import { makeRng, range } from './rng.js';

export const PANEL_WIDTH = 560;
export const PANEL_HEIGHT = 420;

// --- small canvas helpers ----------------------------------------------------
function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function star(ctx, x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function flower(ctx, x, y, petalColor) {
  for (let i = 0; i < 6; i += 1) {
    const angle = (i * Math.PI) / 3;
    circle(ctx, x + Math.cos(angle) * 9, y + Math.sin(angle) * 9, 6, petalColor);
  }
  circle(ctx, x, y, 6, '#fbbf24');
}

function bird(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x - 8, y, 9, Math.PI * 1.15, Math.PI * 1.95);
  ctx.arc(x + 8, y, 9, Math.PI * 1.05, Math.PI * 1.85);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function cloud(ctx, x, y, scale) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 6 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.arc(x + 40 * scale, y, 17 * scale, 0, Math.PI * 2);
  ctx.fill();
}

// --- Round 1: Sunny Park -----------------------------------------------------
function drawPark(ctx, variant) {
  const rng = makeRng(101);
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#bae6fd');
  sky.addColorStop(1, '#e0f2fe');
  rect(ctx, 0, 0, PANEL_WIDTH, 260, '#000000');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_WIDTH, 260);
  rect(ctx, 0, 260, PANEL_WIDTH, 160, '#86c06c');
  ellipse(ctx, 280, 430, 340, 60, '#6da955');

  // Sun, top left. Difference 1: the right picture's sun wears sunglasses.
  circle(ctx, 70, 65, 34, '#fde047');
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    line(ctx, 70 + Math.cos(a) * 42, 65 + Math.sin(a) * 42, 70 + Math.cos(a) * 54, 65 + Math.sin(a) * 54, '#facc15', 4);
  }
  if (variant === 1) {
    rect(ctx, 48, 56, 20, 12, '#1e293b');
    rect(ctx, 72, 56, 20, 12, '#1e293b');
    line(ctx, 68, 62, 72, 62, '#1e293b', 3);
  }
  cloud(ctx, 180, 55, 1);
  cloud(ctx, 330, 90, 0.8);
  // Difference 6: an extra small cloud only in the right picture.
  if (variant === 1) cloud(ctx, 255, 48, 0.55);

  // Difference 2: a bird flies in the left picture only.
  if (variant === 0) bird(ctx, 430, 70);
  bird(ctx, 470, 48);

  // Kite, top right. Difference 5: the kite is missing from the right picture.
  if (variant === 0) {
    ctx.beginPath();
    ctx.moveTo(490, 100);
    ctx.lineTo(512, 122);
    ctx.lineTo(490, 140);
    ctx.lineTo(470, 120);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    line(ctx, 490, 140, 478, 168, '#78350f', 2);
    circle(ctx, 482, 158, 4, '#f59e0b');
    circle(ctx, 478, 170, 4, '#3b82f6');
  }

  // Big tree on the right.
  rect(ctx, 428, 200, 26, 90, '#92400e');
  circle(ctx, 441, 165, 62, '#4d7c0f');
  circle(ctx, 400, 195, 38, '#65a30d');
  circle(ctx, 482, 195, 38, '#65a30d');
  // Difference 4: the left tree carries three apples, the right one two.
  circle(ctx, 415, 175, 8, '#dc2626');
  circle(ctx, 465, 185, 8, '#dc2626');
  if (variant === 0) circle(ctx, 441, 150, 8, '#dc2626');

  // Bench on the left.
  rect(ctx, 90, 300, 130, 10, '#b45309');
  rect(ctx, 90, 322, 130, 10, '#b45309');
  rect(ctx, 98, 290, 10, 70, '#92400e');
  rect(ctx, 202, 290, 10, 70, '#92400e');
  line(ctx, 90, 288, 220, 288, '#92400e', 8);

  // Flower bed along the bottom. Difference 3: one flower is red on the left,
  // violet on the right.
  const beds = [60, 110, 150, 320, 370, 500];
  for (const x of beds) {
    line(ctx, x, 345, x, 325, '#15803d', 3);
    flower(ctx, x, 318, x === 150 ? (variant === 0 ? '#ef4444' : '#8b5cf6') : '#f472b6');
  }
  for (let i = 0; i < 24; i += 1) {
    const x = range(rng, 10, 550);
    const y = range(rng, 268, 410);
    line(ctx, x, y + 8, x, y, '#16a34a', 2);
  }

  // Pond, bottom centre. Difference 7: a duck swims on the left only.
  ellipse(ctx, 205, 375, 90, 30, '#38bdf8');
  ellipse(ctx, 205, 372, 70, 20, '#7dd3fc');
  if (variant === 0) {
    ellipse(ctx, 205, 372, 16, 10, '#f8fafc');
    circle(ctx, 219, 362, 7, '#f8fafc');
    ctx.beginPath();
    ctx.moveTo(226, 360);
    ctx.lineTo(233, 363);
    ctx.lineTo(226, 366);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
  }
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  ctx.fillText('Park', 12, 405);
}

const PARK_DIFFERENCES = [
  { id: 'sun-glasses', label: 'the sun wears sunglasses', x: 70, y: 65, r: 36 },
  { id: 'bird', label: 'a bird in the sky', x: 430, y: 70, r: 26 },
  { id: 'flower-colour', label: 'the flower changed colour', x: 150, y: 320, r: 26 },
  { id: 'apples', label: 'an apple is missing', x: 441, y: 150, r: 28 },
  { id: 'kite', label: 'the kite vanished', x: 490, y: 120, r: 32 },
  { id: 'cloud', label: 'an extra cloud', x: 255, y: 48, r: 28 },
  { id: 'duck', label: 'the duck on the pond', x: 205, y: 372, r: 28 },
];

// --- Round 2: Harbour at Dusk -----------------------------------------------
function drawHarbour(ctx, variant) {
  const rng = makeRng(202);
  const sky = ctx.createLinearGradient(0, 0, 0, 250);
  sky.addColorStop(0, '#312e81');
  sky.addColorStop(0.6, '#c2410c');
  sky.addColorStop(1, '#fdba74');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_WIDTH, 250);
  for (let i = 0; i < 26; i += 1) {
    star(ctx, range(rng, 20, 540), range(rng, 12, 110), range(rng, 1.5, 3.5), '#fef9c3');
  }
  // Difference 8: a full moon on the left, a crescent on the right.
  circle(ctx, 505, 55, 24, '#fef9c3');
  if (variant === 1) circle(ctx, 515, 50, 22, '#312e81');

  // Sea.
  rect(ctx, 0, 250, PANEL_WIDTH, 170, '#1e40af');
  for (let i = 0; i < 14; i += 1) {
    const y = 265 + i * 10;
    line(ctx, range(rng, 0, 480), y, range(rng, 80, 560), y, 'rgba(147,197,253,0.5)', 2);
  }

  // Lighthouse on the left. Difference 1: its beam shines only on the left.
  rect(ctx, 88, 120, 34, 150, '#f8fafc');
  rect(ctx, 88, 150, 34, 14, '#dc2626');
  rect(ctx, 88, 200, 34, 14, '#dc2626');
  rect(ctx, 84, 100, 42, 22, '#1e293b');
  // Difference 4: the lighthouse window glows on the left, dark on the right.
  rect(ctx, 98, 106, 14, 12, variant === 0 ? '#fde047' : '#0f172a');
  ctx.beginPath();
  ctx.moveTo(105, 100);
  ctx.lineTo(88, 84);
  ctx.lineTo(122, 84);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  if (variant === 0) {
    ctx.beginPath();
    ctx.moveTo(122, 111);
    ctx.lineTo(300, 60);
    ctx.lineTo(300, 150);
    ctx.lineTo(122, 122);
    ctx.closePath();
    ctx.fillStyle = 'rgba(253,224,71,0.35)';
    ctx.fill();
  }

  // Sailboat mid-sea. Difference 2: its flag is red on the left, yellow on the right.
  line(ctx, 330, 150, 330, 240, '#78350f', 4);
  ctx.beginPath();
  ctx.moveTo(330, 150);
  ctx.lineTo(330, 210);
  ctx.lineTo(285, 210);
  ctx.closePath();
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(330, 150);
  ctx.lineTo(330, 200);
  ctx.lineTo(372, 200);
  ctx.closePath();
  ctx.fillStyle = '#fef3c7';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(330, 150);
  ctx.lineTo(358, 158);
  ctx.lineTo(330, 166);
  ctx.closePath();
  ctx.fillStyle = variant === 0 ? '#dc2626' : '#facc15';
  ctx.fill();
  ellipse(ctx, 330, 245, 55, 12, '#92400e');

  // Gulls. Difference 3: three on the left, two on the right.
  bird(ctx, 420, 60);
  bird(ctx, 455, 78);
  if (variant === 0) bird(ctx, 395, 88);

  // Dock along the bottom.
  rect(ctx, 0, 330, 300, 90, '#78350f');
  for (let i = 0; i < 5; i += 1) line(ctx, 0, 350 + i * 16, 300, 350 + i * 16, '#92400e', 2);
  // Difference 7: a coiled rope lies on the dock on the left only.
  if (variant === 0) {
    circle(ctx, 180, 348, 16, '#d6a756');
    circle(ctx, 180, 348, 9, '#a16207');
  }

  // Buoy. Difference 5: orange on the left, green on the right.
  circle(ctx, 470, 330, 14, variant === 0 ? '#ea580c' : '#16a34a');
  rect(ctx, 466, 306, 8, 16, variant === 0 ? '#ea580c' : '#16a34a');

  // Difference 6: a fish jumps out of the sea on the left only.
  if (variant === 0) {
    ellipse(ctx, 250, 348, 16, 7, '#94a3b8');
    ctx.beginPath();
    ctx.moveTo(266, 348);
    ctx.lineTo(276, 342);
    ctx.lineTo(276, 354);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
  }
  ctx.fillStyle = '#fef9c3';
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  ctx.fillText('Harbour', 12, 405);
}

const HARBOUR_DIFFERENCES = [
  { id: 'beam', label: 'the lighthouse beam', x: 210, y: 105, r: 32 },
  { id: 'flag', label: 'the boat flag colour', x: 344, y: 158, r: 24 },
  { id: 'gulls', label: 'a third gull', x: 395, y: 88, r: 26 },
  { id: 'window', label: 'the lighthouse window glow', x: 105, y: 112, r: 22 },
  { id: 'buoy', label: 'the buoy colour', x: 470, y: 322, r: 26 },
  { id: 'fish', label: 'a jumping fish', x: 256, y: 348, r: 26 },
  { id: 'rope', label: 'the coiled rope', x: 180, y: 348, r: 26 },
  { id: 'moon', label: 'the moon shape', x: 505, y: 55, r: 28 },
];

// --- Round 3: Moonlit Library -----------------------------------------------
function drawLibrary(ctx, variant) {
  const rng = makeRng(303);
  rect(ctx, 0, 0, PANEL_WIDTH, PANEL_HEIGHT, '#1e1b4b');
  rect(ctx, 0, 300, PANEL_WIDTH, 120, '#7c2d12');

  // Window with night sky. Difference 7: a moon on the left, a star on the right.
  rect(ctx, 440, 30, 100, 120, '#0f172a');
  rect(ctx, 444, 34, 92, 112, '#1e3a8a');
  line(ctx, 490, 34, 490, 146, '#78350f', 4);
  line(ctx, 444, 90, 536, 90, '#78350f', 4);
  if (variant === 0) circle(ctx, 512, 60, 14, '#fef9c3');
  else star(ctx, 512, 60, 14, '#fef9c3');
  for (let i = 0; i < 8; i += 1) {
    star(ctx, range(rng, 450, 530), range(rng, 100, 140), range(rng, 1.5, 3), '#e0e7ff');
  }

  // Bookshelves.
  const shelfColors = ['#b91c1c', '#1d4ed8', '#15803d', '#b45309', '#7e22ce', '#0e7490'];
  for (let row = 0; row < 3; row += 1) {
    const y = 40 + row * 80;
    rect(ctx, 30, y, 240, 66, '#78350f');
    for (let i = 0; i < 12; i += 1) {
      const x = 36 + i * 19;
      const h = 52 + ((i * 7 + row * 3) % 10);
      // Difference 2: one spine is red on the left, teal on the right.
      const color = row === 1 && i === 6 ? (variant === 0 ? '#b91c1c' : '#0e7490') : shelfColors[(i + row) % shelfColors.length];
      rect(ctx, x, y + 58 - h, 15, h, color);
    }
  }

  // Clock above the desk. Difference 4: the hands read 10:10 on the left, 3:00 on the right.
  circle(ctx, 280, 70, 28, '#fef3c7');
  circle(ctx, 280, 70, 28, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(280, 70, 28, 0, Math.PI * 2);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.stroke();
  if (variant === 0) {
    line(ctx, 280, 70, 266, 54, '#1e293b', 3);
    line(ctx, 280, 70, 296, 56, '#1e293b', 3);
  } else {
    line(ctx, 280, 70, 280, 48, '#1e293b', 3);
    line(ctx, 280, 70, 300, 70, '#1e293b', 3);
  }
  circle(ctx, 280, 70, 3, '#1e293b');

  // Ladder leaning on the shelves. Difference 10: a rung is missing on the right.
  line(ctx, 40, 300, 80, 130, '#a16207', 6);
  line(ctx, 70, 300, 110, 130, '#a16207', 6);
  for (let i = 0; i < 5; i += 1) {
    if (variant === 1 && i === 2) continue;
    const y = 270 - i * 32;
    line(ctx, 47 + (300 - y) * 0.235, y, 77 + (300 - y) * 0.235, y, '#a16207', 5);
  }

  // Potted plant. Difference 5: five leaves on the left, three on the right.
  rect(ctx, 78, 250, 30, 34, '#b45309');
  const leaves = variant === 0 ? 5 : 3;
  for (let i = 0; i < leaves; i += 1) {
    const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.5;
    ellipse(ctx, 93 + Math.cos(a) * 18, 240 + Math.sin(a) * 20, 8, 16, '#16a34a');
  }

  // Desk with candle and teacup.
  rect(ctx, 100, 300, 220, 16, '#92400e');
  rect(ctx, 110, 316, 12, 84, '#78350f');
  rect(ctx, 298, 316, 12, 84, '#78350f');
  // Difference 1: the candle burns on the left; on the right it is out.
  rect(ctx, 116, 272, 10, 28, '#fef3c7');
  if (variant === 0) {
    ctx.beginPath();
    ctx.ellipse(121, 264, 6, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(121, 266, 3, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(121, 266, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#451a03';
    ctx.fill();
  }
  // Teacup. Difference 8: steam rises on the left only.
  ellipse(ctx, 180, 292, 16, 8, '#f8fafc');
  rect(ctx, 196, 288, 8, 8, '#f8fafc');
  if (variant === 0) {
    ctx.beginPath();
    ctx.moveTo(176, 284);
    ctx.quadraticCurveTo(170, 272, 176, 262);
    ctx.quadraticCurveTo(182, 252, 176, 242);
    ctx.strokeStyle = 'rgba(226,232,240,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Painting. Difference 9: a gold frame on the left, dark wood on the right.
  rect(ctx, 360, 120, 60, 50, variant === 0 ? '#f59e0b' : '#451a03');
  rect(ctx, 366, 126, 48, 38, '#7dd3fc');
  ctx.beginPath();
  ctx.moveTo(366, 164);
  ctx.lineTo(390, 132);
  ctx.lineTo(414, 164);
  ctx.closePath();
  ctx.fillStyle = '#166534';
  ctx.fill();
  circle(ctx, 402, 136, 7, '#fef9c3');

  // Rug. Difference 6: the rug's stripe is gold on the left, crimson on the right.
  ellipse(ctx, 300, 372, 150, 34, '#991b1b');
  ellipse(ctx, 300, 372, 120, 24, variant === 0 ? '#f59e0b' : '#dc2626');
  ellipse(ctx, 300, 372, 80, 14, '#991b1b');

  // Difference 3: a cat naps on the rug on the left only.
  if (variant === 0) {
    ellipse(ctx, 430, 360, 34, 14, '#334155');
    circle(ctx, 460, 352, 12, '#334155');
    ctx.beginPath();
    ctx.moveTo(452, 344);
    ctx.lineTo(454, 336);
    ctx.lineTo(458, 344);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(462, 344);
    ctx.lineTo(464, 336);
    ctx.lineTo(468, 344);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();
    ellipse(ctx, 400, 362, 16, 6, '#334155');
  }
  ctx.fillStyle = '#c7d2fe';
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  ctx.fillText('Library', 12, 405);
}

const LIBRARY_DIFFERENCES = [
  { id: 'candle', label: 'the candle flame', x: 121, y: 266, r: 26 },
  { id: 'book-spine', label: 'a book spine colour', x: 155, y: 112, r: 24 },
  { id: 'cat', label: 'the cat on the rug', x: 430, y: 356, r: 30 },
  { id: 'clock', label: 'the clock hands', x: 280, y: 70, r: 30 },
  { id: 'plant', label: 'the plant leaves', x: 93, y: 228, r: 26 },
  { id: 'rug-stripe', label: 'the rug stripe colour', x: 300, y: 372, r: 28 },
  { id: 'window-moon', label: 'moon or star in the window', x: 512, y: 60, r: 26 },
  { id: 'steam', label: 'steam over the teacup', x: 178, y: 262, r: 24 },
  { id: 'painting', label: 'the painting frame', x: 390, y: 145, r: 26 },
  { id: 'ladder-rung', label: 'a missing ladder rung', x: 62, y: 206, r: 24 },
];

// --- the round list ----------------------------------------------------------
export const ROUNDS = [
  { name: 'Round 1 · Sunny Park', timeLimit: 150, hints: 3, draw: drawPark, differences: PARK_DIFFERENCES },
  { name: 'Round 2 · Harbour at Dusk', timeLimit: 120, hints: 2, draw: drawHarbour, differences: HARBOUR_DIFFERENCES },
  { name: 'Round 3 · Moonlit Library', timeLimit: 100, hints: 2, draw: drawLibrary, differences: LIBRARY_DIFFERENCES },
];
