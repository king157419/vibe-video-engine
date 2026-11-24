/** 片名「峰 终」：粒子从两颗金点涌出 → 聚成字 → 清晰字形接手（同一张画布上采样和绘制，严格对齐）。 */
import {clamp, easeInOut, hash2, smooth} from '../../kit/util';
import type {Assets} from '../assets';
import {TITLE_DX, TITLE_Y} from '../assets';
import type {Data} from '../data';
import {beam, blit, GOLD, GOLD_C, haze, ICE, type Ctx, type P, partial, rgba, star} from '../fx';

export type TitleP = {
	t0: number; // 粒子起飞
	from: [P, P];
	glyphIn: number; // 清晰字形开始接手
	out0: number;
	out1: number;
	mini?: number; // 片名下那条小旋律线开始画的时刻（不画则省略）
};

export const titleCenters: [P, P] = [
	[960 - TITLE_DX, TITLE_Y],
	[960 + TITLE_DX, TITLE_Y],
];

/** 片名下方的小旋律线（母题缩成一枚印章）：x 缩 0.36、y 缩 0.2，放在 y≈528 */
export const miniMap = (p: P): P => [960 + (p[0] - 932) * 0.36, 528 + (p[1] - 436) * 0.2];

export const drawTitle = (g: Ctx, t: number, D: Data, A: Assets, q: TitleP) => {
	if (t < q.t0 || t > q.out1) return;
	const fo = 1 - smooth((t - q.out0) / (q.out1 - q.out0));
	const gA = smooth((t - q.glyphIn) / 0.9) * fo;
	const glyphs = [A.feng, A.zhong];
	let uAvg = 0;
	for (let ci = 0; ci < 2; ci++) {
		const G = glyphs[ci];
		const [cx, cy] = titleCenters[ci];
		const [fx, fy] = q.from[ci];
		const n = G.pts.length;
		let us = 0;
		const streak = new Path2D();
		const glyphFade = 1 - 0.9 * smooth((t - q.glyphIn) / 0.9);
		for (let i = 0; i < n; i++) {
			const d = hash2(i, ci, 51);
			const u = easeInOut(clamp((t - q.t0 - 0.55 * d) / 1.55));
			const u0 = easeInOut(clamp((t - 0.035 - q.t0 - 0.55 * d) / 1.55));
			us += u;
			const sx = fx + (hash2(i, ci, 52) - 0.5) * 18;
			const sy = fy + (hash2(i, ci, 56) - 0.5) * 18;
			const tx = cx + G.pts[i][0];
			const ty = cy + G.pts[i][1];
			const mx = (sx + tx) / 2 + (hash2(i, ci, 53) - 0.5) * 460;
			const my = (sy + ty) / 2 + (hash2(i, ci, 54) - 0.5) * 340;
			const v = 1 - u;
			let x = v * v * sx + 2 * v * u * mx + u * u * tx;
			let y = v * v * sy + 2 * v * u * my + u * u * ty;
			// 飞行中的光痕（0.06 秒前 → 现在）
			if (u > 0.01 && u < 0.97) {
				const v0 = 1 - u0;
				streak.moveTo(v0 * v0 * sx + 2 * v0 * u0 * mx + u0 * u0 * tx, v0 * v0 * sy + 2 * v0 * u0 * my + u0 * u0 * ty);
				streak.lineTo(x, y);
			}
			const tw = hash2(i, ci, 55) * 6.283;
			// 字形接手之后，余下的粒子轻轻往上飘散
			if (gA > 0) {
				x += Math.sin(tw) * 10 * gA;
				y -= 16 * gA * hash2(i, ci, 57);
			}
			// 审片修改：会聚时不再是一团暗灰的「灰尘字」——粒子越近越亮（additive 金色），到 glyphIn 时亮度和实字一样，再交叉淡化
			const a = (0.6 + 0.65 * u) * (0.8 + 0.2 * Math.sin(t * 3.1 + tw)) * glyphFade * fo;
			blit(g, u < 0.6 ? A.spr.goldC : A.spr.gold, x, y, 7 - 3.3 * u, a);
		}
		g.globalAlpha = 1;
		g.lineCap = 'round';
		g.strokeStyle = rgba(GOLD_C, 0.34 * glyphFade * fo);
		g.lineWidth = 1.2;
		g.stroke(streak);
		uAvg += us / n / 2;
	}
	// 两个字的位置先亮起一团暖光，字形接手后变成字的光晕
	for (let ci = 0; ci < 2; ci++) {
		const [cx, cy] = titleCenters[ci];
		haze(g, cx, cy, 210, GOLD, 0.16 * uAvg * uAvg * fo);
	}
	// 光晕版字形比清晰字形早 0.5 s 进来，会聚的最后那一下就已经在发光
	const gGlow = smooth((t - q.glyphIn + 0.5) / 1.0) * fo;
	if (gGlow > 0.003) {
		const breath = 0.5 + 0.08 * Math.sin(t * 1.3);
		for (let ci = 0; ci < 2; ci++) {
			const G = glyphs[ci];
			const [cx, cy] = titleCenters[ci];
			g.globalAlpha = gGlow * breath;
			g.drawImage(G.glow, cx - G.w / 2, cy - G.h / 2);
		}
		g.globalAlpha = 1;
	}
	if (gA > 0.003) {
		for (let ci = 0; ci < 2; ci++) {
			const G = glyphs[ci];
			const [cx, cy] = titleCenters[ci];
			g.globalAlpha = gA * 0.96;
			g.drawImage(G.cv, cx - G.w / 2, cy - G.h / 2);
		}
		g.globalAlpha = 1;
	}
	// 小旋律线：母题缩成一枚印章，峰和终各一粒金
	if (q.mini !== undefined && t >= q.mini) {
		const p = smooth((t - q.mini) / 1.3);
		const pts = partial(D.melPts.filter((_, i) => i % 3 === 0).map(miniMap), p);
		beam(g, pts, ICE, 1.0, 0.55 * fo, false, 0.4);
		const pk = miniMap(D.peakPt);
		const en = miniMap(D.endPt);
		const head = pts[pts.length - 1][0];
		if (head >= pk[0]) star(g, pk[0], pk[1], 5, GOLD, smooth((t - q.mini - 0.45) / 0.4) * fo);
		if (p >= 0.995) star(g, en[0], en[1], 5, GOLD, smooth((t - q.mini - 1.3) / 0.4) * fo);
	}
};
