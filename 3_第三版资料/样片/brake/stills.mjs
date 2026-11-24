// 一次打包、批量抽静帧（比逐张 `remotion still` 快）。
// 用法（PowerShell，先把 TEMP/TMP 指到 D:\tmp\brake）：
//   node 3_第三版资料\样片\brake\stills.mjs <输出目录> <秒或帧,...> [--scale=0.5] [--frames]
// 例：node stills.mjs D:\desk\claudex\24\video-engine\out\v3\brake\stills 0,2,5.8,7.6 --scale=0.5
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const ENGINE = 'D:/desk/claudex/24/video-engine';
const require = createRequire(path.join(ENGINE, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill} = require('@remotion/renderer');

const [outDir, list, ...rest] = process.argv.slice(2);
const scale = Number((rest.find((a) => a.startsWith('--scale=')) || '--scale=1').split('=')[1]);
const asFrames = rest.includes('--frames');
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(ENGINE, 'src/v3/brake/index.ts'), publicDir: path.join(ENGINE, 'public')});
const comp = await selectComposition({serveUrl, id: 'V3Brake', inputProps: {}});
const items = list.split(',').map((s) => s.trim()).filter(Boolean);
for (const it of items) {
	const frame = asFrames ? Number(it) : Math.round(Number(it) * comp.fps);
	const f = Math.min(comp.durationInFrames - 1, Math.max(0, frame));
	const out = path.join(outDir, `f_${String(f).padStart(5, '0')}.png`);
	await renderStill({composition: comp, serveUrl, output: out, frame: f, scale, imageFormat: 'png', inputProps: {}});
	console.log(`${(f / comp.fps).toFixed(2)}s -> ${out}`);
}
fs.rmSync(serveUrl, {recursive: true, force: true});
console.log(`duration ${comp.durationInFrames} frames`);
