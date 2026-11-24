// 一次打包、渲染多张静帧（半分辨率），再拼成印样：比逐张 `remotion still` 省时间。
// 用法：node src/lab/opus/tools/stills.mjs <outDir> <sec1> <sec2> ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...secs] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/lab/opus/index.ts'), publicDir: path.resolve('public')});
const inputProps = {episode: 'lab01', captions: null, meta: null};
const composition = await selectComposition({serveUrl, id: 'Lab01Opus', inputProps});
for (const s of secs) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(s) * 30));
	const output = path.join(outDir, `f_${String(frame).padStart(4, '0')}.png`);
	await renderStill({serveUrl, composition, frame, output, scale: 0.5, inputProps});
	console.log('ok', s, output);
}
