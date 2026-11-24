// EP01v2 静帧 / 印样：一次打包、一个浏览器，渲染很多张静帧，再拼成带时间标签的印样。
//
// 用法（在 video-engine 下）：
//   node tools/wb_sheet.mjs --at 12.5,1:15,s03,s03+4,s03@end        指定时刻（秒 | m:s | 段号 | 段号±秒 | 段号@end/@mid）
//   node tools/wb_sheet.mjs --range s03-s04 --step 2                一段时间，每 2 秒一张（也可以 --range 60-95 / 1:00-1:35）
//   node tools/wb_sheet.mjs --sections                              每段开头 +1.2s 和段中各一张（整片巡检）
//   可选：--out out/wb/<名字>（默认 out/wb/sheet-<时间戳>） --scale 0.5 --cols 5 --width 480 --par 3 --qa --no-sheet
//
// 输出：<out>/f_<毫秒>.png 和 <out>/sheet.png（标签 = 时间 + 段号）。
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {COMP, EPISODE, FPS, fmt, makeBundle, parseArgs, parseTime, readSections, ROOT, sectionAt} from './wb_common.mjs';

const args = parseArgs(process.argv.slice(2));
const sections = readSections();
const total = sections.durationMs + 2500;

let times = [];
if (args.at) times.push(...String(args.at).split(',').map((t) => parseTime(t, sections)));
if (args.range) {
	const r = String(args.range);
	const secRange = /^(s\d\d)-(s\d\d)$/.exec(r);
	let a;
	let b;
	if (secRange) {
		a = sections.sections.find((s) => s.id === secRange[1]).startMs;
		b = sections.sections.find((s) => s.id === secRange[2]).nextStartMs;
	} else if (/^s\d\d$/.test(r)) {
		const s = sections.sections.find((x) => x.id === r);
		a = s.startMs;
		b = s.nextStartMs;
	} else {
		const [x, y] = r.split('-');
		a = parseTime(x, sections);
		b = parseTime(y, sections);
	}
	const step = parseFloat(args.step ?? '2') * 1000;
	for (let t = a; t <= b; t += step) times.push(t);
}
if (args.sections) {
	for (const s of sections.sections) times.push(s.startMs + 1200, (s.startMs + s.endMs) / 2);
}
if (!times.length) {
	console.log('nothing to render: pass --at, --range or --sections');
	process.exit(1);
}
times = [...new Set(times.map((t) => Math.max(0, Math.min(total - 40, Math.round(t)))))].sort((a, b) => a - b);

const outDir = path.resolve(ROOT, args.out ?? `out/wb/sheet-${Date.now()}`);
fs.mkdirSync(outDir, {recursive: true});
const scale = parseFloat(args.scale ?? '0.5');
const par = parseInt(args.par ?? '3', 10);

const serveUrl = await makeBundle();
const inputProps = {episode: EPISODE, qa: Boolean(args.qa), lint: false, captions: null, sections: null};
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id: COMP, inputProps, puppeteerInstance: browser});
const t0 = Date.now();
const done = [];
let next = 0;
const worker = async () => {
	while (next < times.length) {
		const ms = times[next++];
		const frame = Math.min(composition.durationInFrames - 1, Math.round((ms / 1000) * FPS));
		const output = path.join(outDir, `f_${String(Math.round(ms)).padStart(6, '0')}.png`);
		await renderStill({serveUrl, composition, frame, output, scale, inputProps, puppeteerInstance: browser, overwrite: true});
		done.push({file: output, label: `${fmt(ms)}  ${sectionAt(ms, sections)}`, ms});
		console.log(`ok ${fmt(ms)} ${sectionAt(ms, sections)} -> ${path.relative(ROOT, output)}`);
	}
};
await Promise.all(Array.from({length: Math.min(par, times.length)}, worker));
await browser.close({silent: true});
console.log(`${times.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

if (!args['no-sheet'] && done.length > 1) {
	done.sort((a, b) => a.ms - b.ms);
	const manifest = path.join(outDir, 'sheet.json');
	fs.writeFileSync(manifest, JSON.stringify({cols: parseInt(args.cols ?? '5', 10), width: parseInt(args.width ?? '480', 10), frames: done}, null, 1));
	const py = process.env.WB_PY ?? 'D:\\conda\\miniconda3\\python.exe';
	const r = spawnSync(py, [path.join(ROOT, 'tools/wb_sheet.py'), manifest], {stdio: 'inherit'});
	if (r.status !== 0) console.log('sheet compose failed (set WB_PY to a python with Pillow)');
}
