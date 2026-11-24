/** 预先画好的画布资源：发光精灵、片名字形（清晰版 + 光晕版 + 粒子采样点）、诗句采样点。
 *  字体就绪之后在 useMemo 里建一次；采样抖动用 mulberry32，确定性。 */
import {FONT_ZH} from '../kit/theme';
import {mulberry32} from '../kit/util';
import {EMBER, GOLD, GOLD_C, GREY, ICE, ICE_W, makeSprite, type P, PINK, SILVER, WARM} from './fx';

export type Glyph = {cv: HTMLCanvasElement; glow: HTMLCanvasElement; w: number; h: number; pts: P[]};

export const TITLE_SIZE = 150;
export const TITLE_WEIGHT = 470;
export const TITLE_Y = 400;
export const TITLE_DX = 128; // 两个字的中心在 960 ± 128

const sampleCanvas = (cv: HTMLCanvasElement, step: number, seed: number): P[] => {
	const g = cv.getContext('2d')!;
	const img = g.getImageData(0, 0, cv.width, cv.height).data;
	const r = mulberry32(seed);
	const out: P[] = [];
	for (let y = 0; y < cv.height; y += step)
		for (let x = 0; x < cv.width; x += step) {
			const jx = Math.min(cv.width - 1, x + Math.floor(r() * step));
			const jy = Math.min(cv.height - 1, y + Math.floor(r() * step));
			if (img[(jy * cv.width + jx) * 4 + 3] > 140) out.push([jx - cv.width / 2, jy - cv.height / 2]);
		}
	return out;
};

export const makeGlyph = (ch: string, size = TITLE_SIZE, weight = TITLE_WEIGHT, step = 3, seed = 7): Glyph => {
	const w = Math.ceil(size * 1.7);
	const h = Math.ceil(size * 1.7);
	const font = `${weight} ${size}px "${FONT_ZH}"`;
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	const g = cv.getContext('2d')!;
	g.font = font;
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.fillStyle = '#f6f3ea';
	g.fillText(ch, w / 2, h / 2);
	const pts = sampleCanvas(cv, step, seed);
	// 光晕版：同一个字，暖白，两层模糊
	const gl = document.createElement('canvas');
	gl.width = w;
	gl.height = h;
	const q = gl.getContext('2d')!;
	q.font = font;
	q.textAlign = 'center';
	q.textBaseline = 'middle';
	q.filter = 'blur(26px)';
	q.fillStyle = 'rgba(255,214,150,0.55)';
	q.fillText(ch, w / 2, h / 2);
	q.filter = 'blur(9px)';
	q.fillStyle = 'rgba(255,236,200,0.75)';
	q.fillText(ch, w / 2, h / 2);
	q.filter = 'none';
	return {cv, glow: gl, w, h, pts};
};

/** 一行字采样成点（以这一行的中心为原点）；返回每个点属于第几个字 */
export const sampleLine = (text: string, size: number, weight: number, tracking: number, step: number, seed: number) => {
	const chars = Array.from(text);
	const adv = size * (1 + tracking);
	const h = Math.ceil(size * 1.6);
	const n = chars.length;
	const out: {p: P; ci: number}[] = [];
	chars.forEach((ch, ci) => {
		const cv = document.createElement('canvas');
		cv.width = Math.ceil(size * 1.6);
		cv.height = h;
		const g = cv.getContext('2d')!;
		g.font = `${weight} ${size}px "${FONT_ZH}"`;
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillStyle = '#fff';
		g.fillText(ch, cv.width / 2, h / 2);
		// DOM 里同样的字距（letter-spacing = paddingLeft = tracking·em）下，第 ci 个字的中心
		const cx = adv * (ci + 0.5 - n / 2);
		for (const p of sampleCanvas(cv, step, seed + ci)) out.push({p: [cx + p[0], p[1]], ci});
	});
	return out;
};

export const makeAssets = () => {
	const spr = {
		ice: makeSprite(ICE, 0.7),
		iceW: makeSprite(ICE_W, 0.9),
		gold: makeSprite(GOLD, 0.75),
		goldC: makeSprite(GOLD_C, 0.9),
		warm: makeSprite(WARM, 0.85),
		pink: makeSprite(PINK, 0.55),
		ember: makeSprite(EMBER, 0.6),
		silver: makeSprite(SILVER, 0.6),
		grey: makeSprite(GREY, 0.3),
	};
	const feng = makeGlyph('峰', TITLE_SIZE, TITLE_WEIGHT, 3, 11);
	const zhong = makeGlyph('终', TITLE_SIZE, TITLE_WEIGHT, 3, 12);
	// 李商隐两行（和 Overlay 里 DOM 诗句同字号、同字距；只用来做 06 章开头「字散成粒子」）
	const poem1 = sampleLine('此情可待成追忆', 54, 340, 0.3, 3, 21);
	const poem2 = sampleLine('只是当时已惘然', 54, 340, 0.3, 3, 31);
	return {spr, feng, zhong, poem1, poem2};
};
export type Assets = ReturnType<typeof makeAssets>;
