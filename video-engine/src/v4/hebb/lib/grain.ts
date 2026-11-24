/** 颗粒与光晕（审片修改：暗部色带 + 线条没有 bloom）。不改 kit。
 *  - drawGrain：整帧铺一层确定性的细颗粒（每像素 0–3/255 的三角分布噪声，每帧换一张、换偏移），
 *    放在发光层最上面，把背景暗角和大光晕的 8 位色阶一起抖散。
 *  - bloom：把一组线条画进 1/4 分辨率的离屏画布、模糊一次，再放大用 'lighter' 叠回去 = 一层便宜的光晕。 */
import {hash2, mulberry32} from '../../kit';
import type {Ctx} from './core';

const T = 512;
let tiles: HTMLCanvasElement[] | null = null;
const makeTiles = () => {
	const out: HTMLCanvasElement[] = [];
	for (let k = 0; k < 4; k++) {
		const cv = document.createElement('canvas');
		cv.width = cv.height = T;
		const g = cv.getContext('2d')!;
		const img = g.createImageData(T, T);
		const R = mulberry32(9001 + k * 77);
		for (let i = 0; i < T * T; i++) {
			// 三角分布 0..3（均值 1.5）：白色、alpha = v/255 → 'lighter' 叠上去正好加 v 个色阶
			const v = Math.floor(R() * 2 + R() * 2);
			img.data[i * 4] = 255;
			img.data[i * 4 + 1] = 255;
			img.data[i * 4 + 2] = 255;
			img.data[i * 4 + 3] = v;
		}
		g.putImageData(img, 0, 0);
		out.push(cv);
	}
	return out;
};

export const drawGrain = (g: Ctx, frame: number, amp = 1, W = 1920, H = 1080) => {
	tiles ??= makeTiles();
	const tile = tiles[frame % 4];
	const ox = Math.floor(hash2(frame, 3, 41) * T);
	const oy = Math.floor(hash2(frame, 7, 43) * T);
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'lighter';
	g.globalAlpha = amp;
	for (let x = -ox; x < W; x += T) for (let y = -oy; y < H; y += T) g.drawImage(tile, x, y);
	g.globalAlpha = 1;
};

// ---------------------------------------------------------------- 全局光晕（审片 P1：线太清、没有光）
// 整个发光层画完以后：缩到 1/4 → 只留亮部（contrast 当阈值，暗于约 45/255 的被压成 0，所以大片光雾、星尘不参与）
// → 两档模糊（约 8 px、约 26 px）→ 用 'lighter' 叠回去。线、光点、字都会带上一圈柔光，像参考片的粗光条。
let gb1: HTMLCanvasElement | null = null;
let gb2: HTMLCanvasElement | null = null;
let gb3: HTMLCanvasElement | null = null;
const mk = (w: number, h: number) => {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	return c;
};
export const globalBloom = (g: Ctx, k1 = 0.55, k2 = 0.45, W = 1920, H = 1080) => {
	if (k1 <= 0.003 && k2 <= 0.003) return;
	const w = W / 4;
	const h = H / 4;
	gb1 ??= mk(w, h);
	gb2 ??= mk(w, h);
	gb3 ??= mk(w / 2, h / 2);
	const a = gb1.getContext('2d')!;
	a.setTransform(1, 0, 0, 1, 0, 0);
	a.globalCompositeOperation = 'source-over';
	a.globalAlpha = 1;
	a.filter = 'none';
	a.fillStyle = '#000';
	a.fillRect(0, 0, w, h);
	a.imageSmoothingEnabled = true;
	a.imageSmoothingQuality = 'medium';
	a.drawImage(g.canvas, 0, 0, W, H, 0, 0, w, h);
	const b = gb2.getContext('2d')!;
	b.setTransform(1, 0, 0, 1, 0, 0);
	b.globalCompositeOperation = 'source-over';
	b.filter = 'none';
	b.fillStyle = '#000';
	b.fillRect(0, 0, w, h);
	b.filter = 'contrast(1.55) blur(2px)';
	b.drawImage(gb1, 0, 0);
	b.filter = 'none';
	const c = gb3.getContext('2d')!;
	c.setTransform(1, 0, 0, 1, 0, 0);
	c.globalCompositeOperation = 'source-over';
	c.filter = 'none';
	c.fillStyle = '#000';
	c.fillRect(0, 0, w / 2, h / 2);
	c.filter = 'blur(3px)';
	c.drawImage(gb2, 0, 0, w, h, 0, 0, w / 2, h / 2);
	c.filter = 'none';
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'lighter';
	g.imageSmoothingEnabled = true;
	g.imageSmoothingQuality = 'high';
	g.globalAlpha = clamp01(k1);
	g.drawImage(gb2, 0, 0, w, h, 0, 0, W, H);
	g.globalAlpha = clamp01(k2);
	g.drawImage(gb3, 0, 0, w / 2, h / 2, 0, 0, W, H);
	g.restore();
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 在屏幕坐标里擦掉发光层的一块（羽化椭圆）：章节签、路标背后，不压暗底，只让线让开 */
export const eraseEllipse = (g: Ctx, x: number, y: number, rx: number, ry: number, k: number) => {
	if (k <= 0.003) return;
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'destination-out';
	g.translate(x, y);
	g.scale(1, ry / rx);
	const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
	gr.addColorStop(0, `rgba(0,0,0,${clamp01(k)})`);
	gr.addColorStop(0.6, `rgba(0,0,0,${clamp01(k)})`);
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gr;
	g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
	g.restore();
};
/** 擦掉字幕带里的发光（y0 以下逐渐擦到 k） */
export const eraseBand = (g: Ctx, y0: number, y1: number, k: number, W = 1920, H = 1080) => {
	if (k <= 0.003) return;
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'destination-out';
	const gr = g.createLinearGradient(0, y0, 0, y1);
	gr.addColorStop(0, 'rgba(0,0,0,0)');
	gr.addColorStop(1, `rgba(0,0,0,${clamp01(k)})`);
	g.fillStyle = gr;
	g.fillRect(0, y0, W, y1 - y0);
	g.fillStyle = `rgba(0,0,0,${clamp01(k)})`;
	g.fillRect(0, y1, W, H - y1);
	g.restore();
};

// ---------------------------------------------------------------- bloom
export const DS = 4;
let lo: HTMLCanvasElement | null = null;
let lo2: HTMLCanvasElement | null = null;
/** draw(b, k)：在离屏画布上画（坐标请乘 k = 1/DS，或用 camSetK(b, cam, k)）。k 是叠回去的亮度 */
export const bloom = (g: Ctx, draw: (b: Ctx, k: number) => void, k = 0.3, blur = 1.3, W = 1920, H = 1080) => {
	if (k <= 0.003) return;
	const w = Math.ceil(W / DS);
	const h = Math.ceil(H / DS);
	if (!lo) {
		lo = document.createElement('canvas');
		lo2 = document.createElement('canvas');
		lo.width = lo2!.width = w;
		lo.height = lo2!.height = h;
	}
	const b = lo.getContext('2d')!;
	b.setTransform(1, 0, 0, 1, 0, 0);
	b.globalCompositeOperation = 'source-over';
	b.globalAlpha = 1;
	b.filter = 'none';
	b.clearRect(0, 0, w, h);
	b.globalCompositeOperation = 'lighter';
	draw(b, 1 / DS);
	const b2 = lo2!.getContext('2d')!;
	b2.setTransform(1, 0, 0, 1, 0, 0);
	b2.globalCompositeOperation = 'source-over';
	b2.clearRect(0, 0, w, h);
	b2.filter = `blur(${blur}px)`;
	b2.drawImage(lo, 0, 0);
	b2.filter = 'none';
	g.save();
	g.setTransform(1, 0, 0, 1, 0, 0);
	g.globalCompositeOperation = 'lighter';
	g.imageSmoothingEnabled = true;
	g.imageSmoothingQuality = 'high';
	let kk = k;
	while (kk > 0.003) {
		g.globalAlpha = Math.min(1, kk);
		g.drawImage(lo2!, 0, 0, w * DS, h * DS);
		kk -= 1;
	}
	g.restore();
};
