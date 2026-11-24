import {clamp, easeInOut, easeOut, inv, smooth} from '../kit/util';
import {ANCHORS, STORY_ANCHORS} from './data.gen';

/** 片子的钟（真实时间，和字幕、配乐一致），来自 ties_timeline.py。 */
export const RAW = ANCHORS;

/** 故事时间：各场的动作是按第二版时间轴（ties_anchors_story.json）编排的。之后两轮审片改了字幕长短、留白和静音，
 *  真实时间轴变了，但画面代码继续用故事时间写，只在入口换算一次：
 *  把两份锚点里同名的每个时刻配成一对（真实, 故事），按真实时间排序，中间做分段线性插值。
 *  意思变了的几个锚点不参与配对（片尾署名、渐黑、片长）。 */
type Deep = number | readonly Deep[] | {readonly [k: string]: Deep} | null;
// 2026-10-12：S32 缩短、后面加了一句 S32b，S32 的结束时刻不再对应故事里的 233.5，改用 k2022.hold_end 配对
const SKIP = new Set(['DUR', 'chap_2026a', 'title2.endmark', 'title2.fade', 'S32[1]']);
const flat = (o: Deep, pre: string, out: Map<string, number>) => {
	if (typeof o === 'number') out.set(pre, o);
	else if (Array.isArray(o)) o.forEach((v, i) => flat(v as Deep, `${pre}[${i}]`, out));
	else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) flat(v as Deep, pre ? `${pre}.${k}` : k, out);
};
export const KNOTS: [number, number][] = (() => {
	const r = new Map<string, number>();
	const s = new Map<string, number>();
	flat(RAW as unknown as Deep, '', r);
	flat(STORY_ANCHORS as unknown as Deep, '', s);
	const pairs: [number, number][] = [[0, 0]];
	for (const [k, v] of r) {
		const base = k.replace(/\[\d+\]$/, '');
		if (SKIP.has(base) || SKIP.has(k)) continue;
		const sv = s.get(k);
		if (sv === undefined) continue;
		pairs.push([v, sv]);
	}
	pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const out: [number, number][] = [];
	for (const p of pairs) {
		const last = out[out.length - 1];
		if (last && p[0] - last[0] < 1e-6) continue; // 同一真实时刻只留一个
		if (last && p[1] <= last[1]) {
			console.error('[ties] story map not monotonic at', p, 'after', last);
			continue;
		}
		out.push(p);
	}
	return out;
})();
const interp = (x: number, a: 0 | 1) => {
	const b = (1 - a) as 0 | 1;
	const K = KNOTS;
	if (x <= K[0][a]) return x - K[0][a] + K[0][b];
	for (let i = 1; i < K.length; i++)
		if (x <= K[i][a]) {
			const u = (x - K[i - 1][a]) / (K[i][a] - K[i - 1][a]);
			return K[i - 1][b] + u * (K[i][b] - K[i - 1][b]);
		}
	const L = K[K.length - 1];
	return x - L[a] + L[b];
};
/** 真实时间 → 故事时间 */
export const story = (t: number) => interp(t, 0);
/** 故事时间 → 真实时间 */
export const real = (s: number) => interp(s, 1);

const toStory = (o: Deep): Deep => {
	if (typeof o === 'number') return Math.round(story(o) * 1000) / 1000;
	if (Array.isArray(o)) return o.map(toStory);
	if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toStory(v as Deep)]));
	return o;
};
/** 锚点（故事时间） */
export const A = toStory(RAW as unknown as Deep) as unknown as typeof ANCHORS;

/** 线性区间进度 */
export const lin = (t: number, a: number, b: number) => inv(a, b, t);
/** 缓动区间进度 */
export const ez = (t: number, a: number, b: number) => easeInOut(inv(a, b, t));
export const eo = (t: number, a: number, b: number) => easeOut(inv(a, b, t));
export const sm = (t: number, a: number, b: number) => smooth(inv(a, b, t));
/** [a,b] 内可见，淡入 fi 秒、淡出 fo 秒（smooth） */
export const vis = (t: number, a: number, b: number, fi = 0.5, fo = 0.5) => {
	if (t < a || t > b) return 0;
	return Math.min(fi > 0 ? smooth((t - a) / fi) : 1, fo > 0 ? smooth((b - t) / fo) : 1);
};
/** 一次脉冲：t0 处升起，持续 d 秒回落（0→1→0） */
export const pulse = (t: number, t0: number, d = 0.8) => {
	const x = (t - t0) / d;
	if (x <= 0 || x >= 1) return 0;
	return Math.sin(Math.PI * Math.pow(x, 0.6));
};
export const clamp01 = (x: number) => clamp(x);
