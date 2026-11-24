// 一次打开浏览器，按秒数抽多张静帧（自检用）。
// 用法（PowerShell，先把 TEMP 指到 D 盘，并先 remotion bundle 到 D:\tmp\nightowl\bundle）：
//   node 3_第三版资料\样片\nightowl\tools\stills.mjs D:\tmp\nightowl\bundle out\v3\nightowl\stills 0.3 5 12 ...
//   秒数后面可以加 @0.5 表示缩放（默认 0.5）
import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire('D:/desk/claudex/24/video-engine/package.json');
const {renderStill, selectComposition} = require('@remotion/renderer');

const [, , serveUrl, outDir, ...secs] = process.argv;
fs.mkdirSync(outDir, {recursive: true});
let scale = 0.5;
const list = [];
for (const s of secs) {
	if (s.startsWith('@')) scale = parseFloat(s.slice(1));
	else list.push(parseFloat(s));
}
const composition = await selectComposition({serveUrl, id: 'V3Night', inputProps: {}});
for (const sec of list) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(sec * 30));
	const output = path.join(outDir, `s_${sec.toFixed(2).padStart(6, '0')}.png`);
	await renderStill({composition, serveUrl, output, frame, scale, imageFormat: 'png', logLevel: 'error'});
	console.log(output);
}
