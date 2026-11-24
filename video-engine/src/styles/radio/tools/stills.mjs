// 一次打包、批量渲染 Radio 的静帧（检查用）。
// 用法：node src/styles/radio/tools/stills.mjs <outDir> <frame,frame,...> [scale] [propsJson]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {mkdirSync} from 'node:fs';

const [outDir = 'out/radio_v3', framesArg = '0', scaleArg = '0.5', propsArg = '{}'] = process.argv.slice(2);
const frames = framesArg.split(',').map(Number);
const scale = Number(scaleArg);
const extra = JSON.parse(propsArg);
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {episode: 'demo', captions: null, meta: null, ...extra};
const composition = await selectComposition({serveUrl, id: 'Radio', inputProps});
console.log('duration', composition.durationInFrames);
for (const f of frames) {
	const out = path.join(outDir, `f_${String(f).padStart(4, '0')}.png`);
	await renderStill({serveUrl, composition, frame: f, output: out, scale, inputProps});
	console.log('wrote', out);
}
