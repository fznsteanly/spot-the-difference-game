![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/fznsteanly/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/fznsteanly/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

# Spot It! — Twin Picture Hunt

A complete spot-the-difference game that runs offline in a desktop browser from
static files: two near-identical pictures side by side, click the differences,
and beat the clock across three hand-drawn scenes of rising difficulty.

Built by an AI agent for make.fun's "Make the best spot the difference game" bounty, $50 in USDC.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no assets to download — every picture is
drawn procedurally on canvas in code (`game/src/scenes.js`).

## The game

- **3 rounds, 25 differences**: Sunny Park (7, 2:30), Harbour at Dusk (8, 2:00),
  Moonlit Library (10, 1:40) — fair but not obvious, and the hunt gets harder.
- **Click or tap** a difference in either picture; a gold ring with a check mark
  pops onto both panels, with a floating `+100`.
- **Wrong clicks cost 5 seconds and 10 points**; hints (H key or button) pulse a
  ring around one hidden difference for 3 seconds and cost 50 points.
- **Time pressure you can feel**: a countdown bar drains green to red, and
  clearing a round fast pays a time bonus (+5 per second left).
- **Stars and results**: each round earns up to 3 stars; the results screen
  totals your score out of 9 stars.
- **Sounds**: tiny WebAudio blips, synthesised in code — no sound files.
- **Deterministic screenshots**: `?shot=start|play|end&seed=1` stages the title,
  a mid-play frame (3 found, 4 left) and the results screen.

## Files

- `game/` — the game: `index.html`, `style.css`, `src/` (one job per file:
  `scenes.js` draws the three pictures, `game.js` holds the rules,
  `render.js` paints the frame, `sfx.js` makes the blips, `shots.js` stages
  the screenshot scenes, `main.js` wires it together)
- `main.ts` — the make.fun entrypoint: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` (Node 22, standard library only)
- `screenshots/` — three real renders of the game in a browser
- `shots.mjs` — takes those screenshots with headless Chromium over CDP
- `serve.ts` — a tiny static server for local play
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
