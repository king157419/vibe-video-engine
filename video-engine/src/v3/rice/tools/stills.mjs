// 抽关键帧：只打包一次、只开一次浏览器，按帧号批量出静帧（比逐个 `remotion still` 快得多）。
// 用法（在 video-engine 下，先把 TEMP 指到 D:\tmp\rice）：
//   node src/v3/rice/tools/stills.mjs out/v3/rice/stills 15 345 585 ...
//   帧号也可以写成秒：12.5s
// 公共目录用精简副本 D:\tmp\rice\pub（只含本片要用的字体、配音、数字），省得每次复制整个 public/。
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [, , outDir, ...args] = process.argv;
const root = process.cwd();
const pub = 'D:/tmp/rice/pub';
const need = ['fonts/NotoSansSC-VF.ttf', 'fonts/NotoSerifSC-VF.ttf', 'v3/rice/captions.json', 'v3/rice/numbers.json', 'v3/rice/mix.wav', 'v3/rice/fonts/wenkai-rice.ttf'];
for (const f of need) {
	const src = path.join(root, 'public', f);
	const dst = path.join(pub, f);
	fs.mkdirSync(path.dirname(dst), {recursive: true});
	if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) fs.copyFileSync(src, dst);
}
const serveUrl = await bundle({entryPoint: path.join(root, 'src/v3/rice/index.ts'), publicDir: pub, outDir: 'D:/tmp/rice/bundle-stills'});
const browser = await openBrowser('chrome');
const inputProps = {};
const comp = await selectComposition({serveUrl, id: 'V3Rice', inputProps, puppeteerInstance: browser});
fs.mkdirSync(outDir, {recursive: true});
const scale = Number(process.env.STILL_SCALE || 1);
for (const a of args) {
	const frame = a.endsWith('s') ? Math.round(parseFloat(a) * 30) : parseInt(a, 10);
	const out = path.join(outDir, `f_${String(frame).padStart(4, '0')}.png`);
	await renderStill({serveUrl, composition: comp, frame, output: out, inputProps, puppeteerInstance: browser, scale});
	console.log('still', frame, (frame / 30).toFixed(2) + 's', out);
}
await browser.close({silent: true});
console.log('duration frames', comp.durationInFrames);
