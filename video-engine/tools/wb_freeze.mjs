// 找静止画面：ffmpeg freezedetect，报告超过 N 秒（默认 8）没变化的段落，并标出所在 section。
//
// 用法（在 video-engine 下）：
//   node tools/wb_freeze.mjs <video.mp4> [--min 8] [--noise -50dB] [--offset 0]
// 建议对 QA 版渲染跑（关掉镜头漂移和线条呼吸，静止就是真静止；缩到 1/4 分辨率更快）：
//   npx remotion render src/ep01v2/index.ts EP01v2 out/wb/qa.mp4 --props="{\"qa\":true}" --scale=0.25 --concurrency=4
//   node tools/wb_freeze.mjs out/wb/qa.mp4
// 对正式渲染也能跑，但漂移会让画面「一直在动」，要把 --noise 放宽到 -35dB 左右才有意义。
// --offset：视频是用 --frames=a-b 渲的片段时，填片段起点秒数，报告换算回全片时间。
import {spawnSync} from 'node:child_process';
import {fmt, parseArgs, readSections, sectionAt} from './wb_common.mjs';

const args = parseArgs(process.argv.slice(2));
const video = args._[0];
if (!video) {
	console.log('usage: node tools/wb_freeze.mjs <video.mp4> [--min 8] [--noise -50dB] [--offset 0]');
	process.exit(1);
}
const min = parseFloat(args.min ?? '8');
const noise = args.noise ?? '-50dB';
const offset = parseFloat(args.offset ?? '0') * 1000;
const ff = process.env.FFMPEG ?? 'ffmpeg';
const r = spawnSync(ff, ['-hide_banner', '-nostats', '-i', video, '-map', '0:v:0', '-vf', `freezedetect=n=${noise}:d=${min}`, '-f', 'null', '-'], {encoding: 'utf-8', maxBuffer: 1 << 26});
if (r.error) {
	console.log(`ffmpeg failed: ${r.error.message}`);
	process.exit(2);
}
const log = r.stderr;
const starts = [...log.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => parseFloat(m[1]) * 1000);
const ends = [...log.matchAll(/freeze_end: ([\d.]+)/g)].map((m) => parseFloat(m[1]) * 1000);
const sections = readSections();
const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(log);
const total = dur ? (parseInt(dur[1], 10) * 3600 + parseInt(dur[2], 10) * 60 + parseFloat(dur[3])) * 1000 : Infinity;
if (!starts.length) {
	console.log(`no static stretch longer than ${min}s (noise ${noise})`);
	process.exit(0);
}
console.log(`static stretches > ${min}s (noise ${noise}):`);
starts.forEach((s, i) => {
	const e = ends[i] ?? total;
	const a = s + offset;
	const b = e + offset;
	console.log(`  ${fmt(a)} – ${fmt(b)}  (${((e - s) / 1000).toFixed(1)}s)  ${sectionAt(a, sections)}${sectionAt(b, sections) !== sectionAt(a, sections) ? '→' + sectionAt(b, sections) : ''}`);
});
process.exit(3);
