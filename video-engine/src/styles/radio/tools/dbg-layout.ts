// 检查用：在 Node 里用估算宽度跑字幕断行（node 无字体，fontsReady=false）
import {readFileSync} from 'node:fs';
import {layoutCaptionFixed} from '../layout';
const file = process.argv[2] ?? 'public/episodes/demo/captions.json';
const c = JSON.parse(readFileSync(file, 'utf8'));
const font = {family: 'x', weight: 500, letterSpacingEm: 0.04};
for (const l of c.lines) {
	const lay = layoutCaptionFixed(l, font, 72, 760, false, 60);
	console.log(lay.fontSize.toFixed(1), lay.rows.map((r) => r.map((x) => x.t + (x.gapAfter ? ' ' : '')).join('')).join(' / '));
}
