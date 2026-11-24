import React, {useLayoutEffect, useRef} from 'react';
import type {Cam} from './cam';
import {bbox, toCam} from './cam';
import {C, H, W} from './theme';

// 沥青：一块带固定种子的颗粒“瓦片”，在地面上平铺，全片复用，只随相机平移/投影，不重新随机 → 不闪。
const TILE = 480; // 地面像素
const N_PER_TILE = 2300;

const mulberry32 = (a: number) => () => {
	a |= 0;
	a = (a + 0x6d2b79f5) | 0;
	let t = Math.imul(a ^ (a >>> 15), 1 | a);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Speck = {u: number; v: number; s: number; k: number};
const SPECKS: Speck[] = (() => {
	const r = mulberry32(20261006);
	const out: Speck[] = [];
	for (let i = 0; i < N_PER_TILE; i++) {
		const big = r() < 0.04;
		out.push({u: r() * TILE, v: r() * TILE, s: big ? 3.6 + r() * 2.4 : 1.3 + r() * 2.1, k: big || r() < 0.38 ? 1 : 0});
	}
	return out;
})();

export type GroundView = {cam: Cam; wet?: number; dim?: number};

const mix = (a: string, b: string, s: number) => {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((x, i) => Math.round(x + (pb[i] - x) * s)).join(',')})`;
};

const drawView = (ctx: CanvasRenderingContext2D, v: GroundView) => {
	const c = v.cam;
	const wet = v.wet ?? 0;
	const [cx0, cy0, cw, ch] = bbox(c.clip);
	ctx.save();
	ctx.beginPath();
	c.clip.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
	ctx.closePath();
	ctx.clip();
	ctx.fillStyle = mix(C.asphalt, C.wetAsphalt, wet);
	ctx.fillRect(cx0, cy0, cw, ch);
	const cols = [mix(C.grain1, C.wetGrain1, wet), mix(C.grain2, C.wetGrain2, wet)];
	const top = c.pitch > 1.5707 && Math.abs(c.roll - Math.PI / 2) < 1e-6;
	// 需要画的地面范围（地面像素）
	let gx0: number, gx1: number, gy0: number, gy1: number;
	if (top) {
		const z = c.F / c.pos[2];
		gx0 = c.pos[0] + (cx0 - c.pp[0]) / z - 8;
		gx1 = c.pos[0] + (cx0 + cw - c.pp[0]) / z + 8;
		gy0 = c.pos[1] + (cy0 - c.pp[1]) / z - 8;
		gy1 = c.pos[1] + (cy0 + ch - c.pp[1]) / z + 8;
	} else {
		const reach = 95 * 34;
		gx0 = c.pos[0] - 6 * 34;
		gx1 = c.pos[0] + reach;
		gy0 = c.pos[1] - 45 * 34;
		gy1 = c.pos[1] + 45 * 34;
	}
	const i0 = Math.floor(gx0 / TILE);
	const i1 = Math.floor(gx1 / TILE);
	const j0 = Math.floor(gy0 / TILE);
	const j1 = Math.floor(gy1 / TILE);
	for (let k = 0; k < 2; k++) {
		ctx.beginPath();
		for (let i = i0; i <= i1; i++) {
			for (let j = j0; j <= j1; j++) {
				const ox = i * TILE;
				const oy = j * TILE;
				for (const s of SPECKS) {
					if (s.k !== k) continue;
					const X = ox + s.u;
					const Y = oy + s.v;
					if (top) {
						const z = c.F / c.pos[2];
						const sx = c.pp[0] + (X - c.pos[0]) * z;
						const sy = c.pp[1] + (Y - c.pos[1]) * z;
						const sz = s.s * z;
						if (sx < cx0 - 6 || sx > cx0 + cw + 6 || sy < cy0 - 6 || sy > cy0 + ch + 6) continue;
						ctx.rect(sx - sz / 2, sy - sz / 2, sz, sz);
					} else {
						const q = toCam(c, [X, Y, 0]);
						if (q.z < 40) continue;
						const f = c.F / q.z;
						const sz = Math.min(4.2, s.s * f);
						if (sz < 0.45) continue;
						const a = c.F * q.x / q.z;
						const b = (-c.F * q.y) / q.z;
						const cr = Math.cos(c.roll);
						const sr = Math.sin(c.roll);
						const sx = c.pp[0] + a * cr - b * sr;
						const sy = c.pp[1] + a * sr + b * cr;
						if (sx < cx0 - 20 || sx > cx0 + cw + 20 || sy < cy0 - 20 || sy > cy0 + ch + 20) continue;
						// 透视下颗粒沿“离地平线”方向被压扁：系数 = 相机高度 / 视线长度（掠射角越小越扁）
						const fl = Math.max(0.15, Math.min(1, c.pos[2] / Math.hypot(q.x, q.y, q.z)));
						const w = sz * (Math.abs(cr) + fl * Math.abs(sr));
						const h = sz * (Math.abs(sr) + fl * Math.abs(cr));
						ctx.rect(sx - w / 2, sy - h / 2, w, h);
					}
				}
			}
		}
		ctx.fillStyle = cols[k];
		ctx.fill();
	}
	if (v.dim && v.dim > 0) {
		ctx.fillStyle = `rgba(14,15,17,${v.dim})`;
		ctx.fillRect(cx0, cy0, cw, ch);
	}
	ctx.restore();
};

export const Ground: React.FC<{views: GroundView[]}> = ({views}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const cv = ref.current;
		if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, W, H);
		for (const v of views) drawView(ctx, v);
	});
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};
