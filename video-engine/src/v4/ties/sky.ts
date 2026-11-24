/** 本片自己的星空层（kit 的 Backdrop 星尘太稀太暗，等于没有）：640 颗确定性的星，
 *  亮度 0.15–0.45，按 hash2 做值噪声闪烁，整体以 6–10 px/s 慢漂（近的快、远的慢）。
 *  四角和字幕带里更暗。只由时间推出，不用 Math.random。 */
import {clamp, hash2, mulberry32, smooth} from '../kit/util';
import {glowAt, type Ctx} from './draw';

const NS = 640;
const DIR: [number, number] = [-0.95, -0.31];
const WRAP_W = 1920 + 120;
const WRAP_H = 1080 + 120;

type Star = {x: number; y: number; v: number; r: number; b: number; f: number; amp: number; warm: boolean};
const STARS: Star[] = (() => {
	const r = mulberry32(4242);
	return Array.from({length: NS}, () => {
		const z = r();
		const u = r();
		return {
			x: r() * WRAP_W,
			y: r() * WRAP_H,
			v: 6 + 4 * z,
			r: 2.6 + 3.4 * z * (0.6 + 0.4 * r()),
			b: 0.15 + 0.3 * Math.pow(u, 1.8),
			f: 0.25 + 0.85 * r(),
			amp: r() < 0.08 ? 0.85 : 0.5,
			warm: r() < 0.14,
		};
	});
})();

/** 值噪声：hash2 在整数格点上取值，格点之间 smoothstep 插值 → 0–1，连续、确定 */
const vnoise = (i: number, x: number) => {
	const n = Math.floor(x);
	const f = smooth(x - n);
	const a = hash2(i, n, 77);
	const b = hash2(i, n + 1, 77);
	return a + (b - a) * f;
};

export const drawSky = (g: Ctx, t: number, k: number) => {
	if (k <= 0.01) return;
	for (let i = 0; i < NS; i++) {
		const s = STARS[i];
		let x = (s.x + DIR[0] * s.v * t) % WRAP_W;
		let y = (s.y + DIR[1] * s.v * t) % WRAP_H;
		if (x < 0) x += WRAP_W;
		if (y < 0) y += WRAP_H;
		x -= 60;
		y -= 60;
		const nx = (x - 960) / 1020;
		const ny = (y - 520) / 640;
		const vign = 1 - 0.6 * clamp(nx * nx + ny * ny);
		const band = y > 945 ? 0.5 : 1;
		const tw = 1 - s.amp + s.amp * vnoise(i, t * s.f + i * 0.37);
		const kk = s.b * tw * vign * band * k;
		if (kk < 0.02) continue;
		glowAt(g, x, y, s.r, s.warm ? '#e9d6b0' : '#c9d4e2', kk, 'star');
	}
};
