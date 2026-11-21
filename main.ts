// Spot It! — Twin Picture Hunt, a best-spot-the-difference-game entry (Node 22,
// standard library only). The game itself is plain static files under game/
// (index.html plus its ES modules, no library, no network request at all), and
// this program hands it in: it copies game/ and screenshots/ from beside this
// file into /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the game itself with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps, so a local run refuses what the scorer would refuse:
// at most 4 screenshots, each at most 256 KiB; game/ at most 993 files and
// 48 MiB in all, no path under it over 1000 bytes; the dossier text capped at
// 160 KiB. (game/ counts beside /output's own 1000-entry cap.)
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`wrote ${out}/dossier.json (${dossier.length} bytes)`);
