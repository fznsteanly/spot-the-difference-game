// Take Spot It!'s screenshots with headless Chromium over CDP (Node 22 stdlib only).
// Usage: node shots.mjs   (expects the game served at http://127.0.0.1:8080)
// Writes screenshots/1-start.jpg, 2-play.jpg, 3-end.jpg — each a real render of
// game/ in the browser. Every shot's game state is asserted in-page before capture.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CHROME = join(homedir(), '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const BASE = 'http://127.0.0.1:8080';
const PORT = 9223;
const OUT = new URL('./screenshots', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevTools() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('devtools did not come up');
}

async function newTab() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  if (!res.ok) throw new Error(`new tab failed: ${res.status}`);
  return res.json();
}

class Tab {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async waitReady() {
    for (let i = 0; i < 60; i++) {
      try {
        const state = await this.evaluate(`document.readyState`);
        if (state === 'complete') {
          await sleep(400);
          if ((await this.evaluate(`document.readyState`)) === 'complete') return;
        }
      } catch { /* target not ready yet */ }
      await sleep(250);
    }
    throw new Error('page did not reach readyState complete');
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error('evaluate failed: ' + JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async shot(name) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    const buf = Buffer.from(data, 'base64');
    const file = join(OUT, name);
    writeFileSync(file, buf);
    console.log(`${name}: ${buf.length} bytes`);
    if (buf.length > 256 * 1024) throw new Error(`${name} over 256 KiB`);
    return file;
  }
}

async function openTab(url) {
  const tab = new Tab((await newTab()).webSocketDebuggerUrl);
  await tab.ready();
  await tab.send('Page.enable');
  await tab.send('Runtime.enable');
  await tab.send('Page.navigate', { url });
  await tab.waitReady();
  await sleep(800);
  return tab;
}

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--window-size=1280,800', 'about:blank',
], { stdio: 'ignore' });

try {
  await waitForDevTools();

  // 1 — title screen over round 1's park scene.
  {
    const tab = await openTab(`${BASE}/?shot=start&seed=1`);
    const check = await tab.evaluate(`(() => ({
      titleVisible: !document.getElementById('titleScreen').classList.contains('hidden'),
      title: document.querySelector('#titleScreen h1').textContent,
      round: document.getElementById('roundName').textContent,
      counter: document.getElementById('counter').textContent,
      canvas: document.getElementById('gameCanvas').width,
    }))()`);
    console.log('start check:', JSON.stringify(check));
    if (!check.titleVisible || check.title !== 'SPOT IT!') throw new Error('start: title screen not showing');
    if (!check.counter.includes('0 / 7')) throw new Error('start: expected 0 / 7 counter');
    await tab.shot('1-start.jpg');
    tab.ws.close();
  }

  // 2 — mid-play: 3 differences found with gold ring markers, 4 still unfound.
  {
    const tab = await openTab(`${BASE}/?shot=play&seed=1`);
    const check = await tab.evaluate(`(() => ({
      titleHidden: document.getElementById('titleScreen').classList.contains('hidden'),
      counter: document.getElementById('counter').textContent,
      timer: document.getElementById('timerText').textContent,
      score: document.getElementById('score').textContent,
      status: document.getElementById('statusMsg').textContent,
    }))()`);
    console.log('play check:', JSON.stringify(check));
    if (!check.titleHidden) throw new Error('play: title screen still showing');
    if (!check.counter.includes('Found 3 / 7') || !check.counter.includes('4 left')) {
      throw new Error('play: expected "Found 3 / 7 · 4 left"');
    }
    if (check.timer !== '1:47') throw new Error(`play: expected timer 1:47, got ${check.timer}`);
    if (!check.score.includes('300')) throw new Error('play: expected score 300');
    await tab.shot('2-play.jpg');
    tab.ws.close();
  }

  // 3 — results screen after all three rounds, fully-marked board behind it.
  {
    const tab = await openTab(`${BASE}/?shot=end&seed=1`);
    const check = await tab.evaluate(`(() => ({
      resultsVisible: !document.getElementById('resultsScreen').classList.contains('hidden'),
      finalScore: document.getElementById('finalScore').textContent,
      detail: document.getElementById('finalDetail').textContent,
      stars: document.getElementById('finalStars').textContent,
    }))()`);
    console.log('end check:', JSON.stringify(check));
    if (!check.resultsVisible) throw new Error('end: results screen not showing');
    if (!check.detail.includes('25 of 25')) throw new Error('end: expected 25 of 25 differences');
    if (!check.finalScore.includes('4350')) throw new Error(`end: expected score 4350, got ${check.finalScore}`);
    if (!check.stars.includes('(9/9)')) throw new Error(`end: expected 9/9 stars, got ${check.stars}`);
    await tab.shot('3-end.jpg');
    tab.ws.close();
  }

  console.log('all screenshots ok');
} finally {
  chrome.kill();
}
