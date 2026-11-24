// 一次打包，抽多张静帧：node src/v4/hebb/tools/stills.mjs <outDir> <scale> <frame> [frame...]
// （和 remotion still 等价，只是不用每张都重新打包）
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [, , outDir, scaleArg, ...frames] = process.argv;
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/v4/starry/index.ts')});
const onBrowserLog = (l) => {
	if (String(l.text).includes('[starry]') || l.type === 'error') console.log('[browser]', l.type, l.text);
};
const composition = await selectComposition({serveUrl, id: 'V4Starry', onBrowserLog});
for (const f of frames) {
	const t0 = Date.now();
	await renderStill({composition, serveUrl, output: path.join(outDir, `f_${f}.png`), frame: Number(f), scale: Number(scaleArg), onBrowserLog});
	console.log('frame', f, `${Date.now() - t0} ms`);
}
fs.rmSync(serveUrl, {recursive: true, force: true});

