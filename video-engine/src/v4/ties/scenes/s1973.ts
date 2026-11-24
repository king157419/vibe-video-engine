/** 1:31–2:26：你的圈子（米尔格拉姆那一章的尾巴）→ 1973 · 波士顿：格兰诺维特的「弱关系的力量」。
 *  审片（第二轮）：这一段原来是暗底上的小号图论示意（1 px 灰线、半径 150 的六边形），最像课件。
 *  现在：圈子放大到半径 240、慢慢自转，节点是会闪的发光星，线是带光晕的银线；提问那一段改成横贯全画面的一条
 *  「消息之线」，光点沿它往右漂、经过三个人；镜头一直在慢推或横移。 */
import {clamp, easeInOut, lerp, mulberry32, smooth} from '../../kit/util';
import {FACTS} from '../data.gen';
import {AMBER, AMBER_CORE, arcPts, bez, cam, comet, drawYou, drift, glow, glowAt, glowLines, ID, lerpXY, mixHex, P, samp, SILVER, type Ctx, type View} from '../draw';
import type {XY} from '../model';
import {A, ez, lin, pulse, sm, vis} from '../time';

const C: XY = [960, 450];
// 六个朋友：不规则六边形，半径约 240
const FRIENDS0: XY[] = (() => {
	const r = mulberry32(31);
	return Array.from({length: 6}, (_, k) => {
		const a = ((-90 + k * 60 + (r() - 0.5) * 22) * Math.PI) / 180;
		const rr = 240 + (r() - 0.5) * 60;
		return [C[0] + Math.cos(a) * rr, C[1] + Math.sin(a) * rr * 0.92] as XY;
	});
})();
/** 圈子自转：每秒 2.5° */
const rotK7 = (t: number) => ((2.5 * Math.max(0, t - 92.3)) * Math.PI) / 180;
const rot = (p: XY, c: XY, a: number): XY => {
	const dx = p[0] - c[0];
	const dy = p[1] - c[1];
	return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
export const friendsAt = (t: number): XY[] => FRIENDS0.map((p) => rot(p, C, rotK7(t)));
const CL_EDGES: [number, number][] = [];
for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) CL_EDGES.push([a, b]);
// 最右边那个朋友（出口）、最左边那个（入口）（按自转前的形状定）
const RIGHT = FRIENDS0.reduce((bi, p, i) => (p[0] > FRIENDS0[bi][0] ? i : bi), 0);
const LEFT = FRIENDS0.reduce((bi, p, i) => (p[0] < FRIENDS0[bi][0] ? i : bi), 0);
// 在圈子里来回弹五下（每下 0.5 s），每一下都落在另一个人身上，最后一下落在出口
const BOUNCE: number[] = (() => {
	const others = [0, 1, 2, 3, 4, 5].filter((i) => i !== LEFT && i !== RIGHT);
	return [LEFT, others[1], others[3], others[0], others[2], RIGHT];
})();
const EXIT_TO: XY = [2100, 260];

const node = (g: Ctx, v: View, p: XY, k: number, t: number, i: number, color = SILVER) => {
	if (k <= 0.003) return;
	const tw = 0.78 + 0.22 * Math.sin(t * (1.3 + (i % 5) * 0.27) + i * 1.9);
	glow(g, v, p, 34, color, 0.16 * k * tw, 'soft');
	glow(g, v, p, 13, color, 0.85 * k * tw, 'dot');
};

// ---------------------------------------------------------------- 镜头
const view91 = (t: number): View => {
	const [dx, dy] = drift(t, 3);
	return cam(1 + 0.05 * lin(t, 92.6, 103), 960 - dx, 540 - dy);
};
/** 消息光点在世界里的位置：从 (600, 430) 出发，留白里往右漂到「你」的位置 (960, 450) */
const MSG0: XY = [600, 430];
const msgAt = (t: number): XY => [MSG0[0] + (C[0] - MSG0[0]) * sm(t, 109.3, 112.8), lerp(MSG0[1], C[1], ez(t, 112.6, 113.6))];
export const view73 = (t: number): View => {
	const [dx, dy] = drift(t, 3);
	const s = (1 + 0.05 * lin(t, 103, 133.7)) * lerp(1, 0.55 / 1.05, ez(t, 133.7, 137.7));
	// 镜头跟着光点横移，但慢半拍（光点先漂到画面右边，镜头再追上）
	const fx = MSG0[0] + (C[0] - MSG0[0]) * ez(t, 109.7, 114.0);
	return cam(s, fx - dx * 0.5, C[1] - dy * 0.5, 960, 450);
};
/** 交给 1998 那一刻「你」在屏幕上的位置 */
export const you73At = (t: number): XY => P(view73(t), C);

// ---------------------------------------------------------------- 1:31–1:43 你的圈子
const drawCircle = (g: Ctx, t: number) => {
	const v = view91(t);
	const emerge = ez(t, 92.3, 93.5);
	const collapse = ez(t, 101.8, 102.9);
	const FR = friendsAt(t);
	const pos = [C, ...FR].map((p, i) => {
		if (i === 0) return lerpXY(C, [960, 430], collapse);
		const e = lerpXY(C, p, emerge);
		return lerpXY(e, [960, 430], collapse);
	});
	const edgeA = 0.42 * sm(t, 92.6, 93.6) * (1 - collapse);
	const segs: XY[][] = CL_EDGES.map(([a, b]) => [pos[a], pos[b]]);
	glowLines(g, v, segs, SILVER, 1.1, edgeA, true);
	// 出口那根琥珀线（97.4 起留着，k 0.5）
	const ex = clamp((t - 97.4) / 0.3);
	if (ex > 0) {
		const line = samp(bez(pos[1 + RIGHT], EXIT_TO, -0.06), 30, 0, ex);
		glowLines(g, v, [line], AMBER, 2.2, (t < 98.2 ? 0.9 : 0.5) * (1 - sm(t, 101.8, 102.6)), true);
	}
	// 朋友
	for (let i = 1; i < 7; i++) node(g, v, pos[i], emerge * (1 - collapse), t, i);
	// 「你」：从俯冲的光点变成「你」，最后缩成一颗琥珀光点
	const youK = sm(t, 92.4, 93.1);
	if (t < 93.1) glow(g, v, C, 14 * (1 + 0.3 * youK), '#fff3dc', 0.9 * sm(t, 92.6, 93.0), 'dot');
	if (collapse < 1) {
		drawYou(g, v, pos[0], youK * (1 - collapse), t, collapse);
		glow(g, v, pos[0], 80, '#fff3dc', 0.1 * youK * (1 - collapse), 'soft');
	}
	if (collapse > 0) {
		glow(g, v, pos[0], lerp(16, 30, collapse), AMBER, collapse, 'dot');
		glow(g, v, pos[0], lerp(60, 150, collapse), AMBER, 0.18 * collapse, 'soft');
	}
	// 琥珀火星：92.4 从左边飞进来，落在一个朋友身上，在圈子里弹五下，出不去；97.4 沿琥珀线跳出圈子
	if (t >= 92.4 && t < 99.2) {
		const at = (tt: number): XY => {
			if (tt < 93.0) return lerpXY([-40, 380], pos[1 + BOUNCE[0]], easeInOut((tt - 92.4) / 0.6));
			if (tt < 95.5) {
				const k = Math.min(4, Math.floor((tt - 93.0) / 0.5));
				const u = (tt - 93.0 - k * 0.5) / 0.5;
				const a = pos[1 + BOUNCE[k]];
				const b = pos[1 + BOUNCE[k + 1]];
				const p = lerpXY(a, b, easeInOut(u));
				const hop = Math.sin(Math.PI * u) * 34; // 弹起来
				return [p[0], p[1] - hop];
			}
			if (tt < 97.4) return pos[1 + RIGHT];
			return bez(pos[1 + RIGHT], EXIT_TO, -0.06)(easeInOut(clamp((tt - 97.4) / 0.6)));
		};
		const tail: XY[] = [];
		for (let j = 15; j >= 0; j--) tail.push(at(Math.max(92.4, t - j * 0.02)));
		const restPulse = t >= 95.5 && t < 97.4 ? 0.8 + 0.2 * Math.sin((t - 95.5) * 6) : 1;
		comet(g, v, tail, AMBER, 3.0, restPulse, 26);
		// 到达的那一下：被碰到的朋友亮一下
		for (let k = 0; k < 6; k++) {
			const tk = 93.0 + k * 0.5;
			const p = pulse(t, tk, 0.45);
			if (p > 0) glow(g, v, pos[1 + BOUNCE[k]], 30, AMBER, 0.6 * p, 'dot');
		}
	}
};

// ---------------------------------------------------------------- 1:43–2:26 1973
// 消息之线上的人：光点身后（左边）4 个，路上 3 个（留白里依次经过，和 3 个钢琴音对上）
const PINGS = A.pings as unknown as number[];
const BEHIND: XY[] = [1, 2, 3, 4].map((k) => [MSG0[0] - 210 * k + 30 * Math.sin(k * 1.7), MSG0[1]] as XY);
const pingNodes = (): XY[] => PINGS.map((tk) => [msgAt(tk)[0], MSG0[1]] as XY);

const DISC282: {p: XY; d: number; ph: number}[] = (() => {
	const r = mulberry32(282);
	const out: {p: XY; d: number; ph: number}[] = [];
	while (out.length < 282) {
		const a = r() * Math.PI * 2;
		const rr = 400 * Math.sqrt(r());
		if (rr < 70) continue;
		out.push({p: [C[0] + Math.cos(a) * rr * 1.2, C[1] + Math.sin(a) * rr * 0.86], d: r(), ph: r() * 6.28});
	}
	return out;
})();
// 54 个帮忙的人：9 / 30 / 15（16.7% / 55.6% / 27.8% × 54，代码算）
const G = FACTS.gran;
export const ORBIT_R = [138, 262, 400];
const ORBITS = [
	{r: ORBIT_R[0], n: G.often, w: 0.05},
	{r: ORBIT_R[1], n: G.occ, w: 0.032},
	{r: ORBIT_R[2], n: G.rare, w: 0.02},
];
const HELPERS = (() => {
	const r = mulberry32(54);
	const out: {orb: number; a0: number; from: XY; d: number}[] = [];
	ORBITS.forEach((o, oi) => {
		for (let k = 0; k < o.n; k++) {
			const a0 = (k / o.n) * Math.PI * 2 + (r() - 0.5) * (Math.PI / o.n);
			// 从画面四边的黑暗里飞进来
			const side = Math.floor(r() * 4);
			const q = r();
			const from: XY = side === 0 ? [-80, 1080 * q] : side === 1 ? [2000, 1080 * q] : side === 2 ? [1920 * q, -80] : [1920 * q, 1000];
			out.push({orb: oi, a0, from, d: r() * 0.5});
		}
	});
	return out;
})();
const helperPos = (h: (typeof HELPERS)[number], t: number): XY => {
	const o = ORBITS[h.orb];
	const a = h.a0 + o.w * (t - 120);
	return [C[0] + Math.cos(a) * o.r, C[1] + Math.sin(a) * o.r * 0.92];
};
// 内圈 9 个里挑 6 个收到「你」身边（形状同 1:31）
const INNER = HELPERS.map((h, i) => ({h, i})).filter((o) => o.h.orb === 0);
const PICK6 = [0, 2, 3, 5, 6, 8].map((k) => INNER[k].i);
// 另外 5 个小圈子（世界坐标，镜头拉到 0.55 时都在画面里，而且都在字幕带上方：屏幕 y < 860）
const OTHER = (() => {
	const r = mulberry32(1973);
	const centers: XY[] = [
		[C[0] + 1180, C[1] - 560],
		[C[0] - 1200, C[1] - 470],
		[C[0] - 1380, C[1] + 330],
		[C[0] + 1300, C[1] + 400],
		[C[0] - 330, C[1] + 560],
	];
	const ns = [7, 6, 8, 5, 6];
	return centers.map((c, k) => {
		const pts: XY[] = [];
		for (let i = 0; i < ns[k]; i++) {
			const a = (i / ns[k]) * Math.PI * 2 + (r() - 0.5) * 0.7;
			const rr = 125 + (r() - 0.5) * 60;
			pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
		}
		return {c, pts, ph: r() * 6.28, spin: (r() < 0.5 ? -1 : 1) * (1.2 + r())};
	});
})();
const otherPts = (o: (typeof OTHER)[number], t: number) => o.pts.map((p) => rot(p, o.c, ((o.spin * Math.max(0, t - 133.7)) * Math.PI) / 180));
// 右上那个圈子里离「你」最近的一颗：弱关系的一端（按 139.7 时的位置挑）
const UR = OTHER[0];
const TIE_END = (() => {
	const pts = otherPts(UR, 139.7);
	return pts.reduce((bi, p, i) => (Math.hypot(p[0] - C[0], p[1] - C[1]) < Math.hypot(pts[bi][0] - C[0], pts[bi][1] - C[1]) ? i : bi), 0);
})();
const TIE_SRC = (TIE_END + 3) % UR.pts.length;
const TIE_BEND = 0.08;
const tieCurve = (t: number) => bez(C, otherPts(UR, t)[TIE_END], TIE_BEND);
/** 「弱关系 / WEAK TIE」标签的位置：线中点沿法线往弧的凹侧（控制点那一侧）挪开，离线约 40 px（审片：原来线从字中间穿过） */
export const tieLabelAt = (t: number): XY => {
	const v = view73(t);
	const end = otherPts(UR, t)[TIE_END];
	const a = P(v, C);
	const b = P(v, end);
	const m = P(v, tieCurve(t)(0.5));
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const L = Math.hypot(dx, dy) || 1;
	// bez() 的控制点在中点 + (−dy, dx)·bend 一侧
	const n: XY = [(-dy / L) * Math.sign(TIE_BEND), (dx / L) * Math.sign(TIE_BEND)];
	return [m[0] + n[0] * 66, m[1] + n[1] * 66];
};

/** 交给 1998：144.8 那一刻所有小圈子里的点在屏幕上的位置，以及各自圈子的中心（世界的星从这里起飞） */
export const cliqueDots144 = (): {p: XY; c: XY}[] => {
	const t = 144.8;
	const v = view73(t);
	const out: {p: XY; c: XY}[] = [];
	const cc = P(v, C);
	for (const f of friendsAt(t)) out.push({p: P(v, f), c: cc});
	for (const o of OTHER) {
		const oc = P(v, o.c);
		for (const p of otherPts(o, t)) out.push({p: P(v, p), c: oc});
	}
	return out;
};

const draw73 = (g: Ctx, t: number) => {
	const v = view73(t);
	const handed = t >= 144.8; // 144.8 起小圈子里的点交给 1998 的星盘（同一位置起飞），这里不再画点
	// ---------- 消息光点（103–113.6）
	const becomeYou = ez(t, 112.9, 113.7);
	const breathe = 0.85 + 0.15 * Math.sin((t - 103) * 1.7);
	const msgP = msgAt(t);
	// 消息之线：横贯全画面的一根极淡银线，从光点往两边长出去（103.8–106），光点变成「你」后收走
	const threadA = sm(t, 103.6, 105.0) * (1 - sm(t, 113.0, 114.6));
	if (threadA > 0) {
		const half = 2000 * ez(t, 103.8, 106.2);
		glowLines(g, v, [[[MSG0[0] - half, MSG0[1]], [C[0] + half, MSG0[1]]]], '#9fb0c8', 1.0, 0.14 * threadA, false);
		// 线上的人：身后 4 个、路上 3 个
		BEHIND.forEach((p, k) => node(g, v, p, 0.5 * threadA * sm(t, 104.4 + 0.35 * k, 105.2 + 0.35 * k), t, k + 20));
		pingNodes().forEach((p, k) => {
			const tk = PINGS[k];
			const hit = pulse(t, tk - 0.05, 0.9);
			node(g, v, p, threadA * (0.45 + 1.4 * hit) * sm(t, 105.0 + 0.3 * k, 105.8 + 0.3 * k), t, k + 30);
			if (t > tk - 0.05 && t < tk + 0.8) {
				const e = (t - tk + 0.05) / 0.85;
				const sp = P(v, p);
				glowLines(g, ID, [arcPts(sp[0], sp[1], 12 + 34 * e, 0, Math.PI * 2, 40)], SILVER, 1.1, 0.6 * (1 - e) * threadA, false);
			}
		});
	}
	if (becomeYou < 1 && t < 114) {
		const k = 1 - becomeYou;
		// 往右漂的时候身后拖一条看得见的彗尾
		const dr = sm(t, 109.3, 109.9) * (1 - sm(t, 112.5, 113.2));
		if (dr > 0.01) {
			const tail: XY[] = [];
			for (let j = 18; j >= 0; j--) tail.push(msgAt(Math.max(103, t - j * 0.06)));
			comet(g, v, tail, AMBER, 3.2, 0.75 * dr * k, 0);
		}
		glow(g, v, msgP, 150, AMBER, 0.2 * breathe * k, 'soft');
		glow(g, v, msgP, 30, AMBER, breathe * k, 'dot');
		glow(g, v, msgP, 11, AMBER_CORE, 0.8 * k, 'star');
	}
	// 「你」
	const youOn = becomeYou * (handed ? 0 : 1);
	// ---------- 282 个刚换工作的人：从四周的黑暗里慢慢聚拢、闪烁着进来（114–116.5），120.0–120.8 整片淡出
	const a282 = vis(t, 113.9, 120.8, 0.4, 0.8);
	if (a282 > 0) {
		const ang = 0.012 * (t - 114);
		for (let i = 0; i < DISC282.length; i++) {
			const d = DISC282[i];
			const u = ez(t, 113.9 + 0.9 * d.d, 115.7 + 0.9 * d.d);
			if (u <= 0) continue;
			const p0 = rot(d.p, C, ang);
			const q: XY = [C[0] + (p0[0] - C[0]) * lerp(2.3, 1, u), C[1] + (p0[1] - C[1]) * lerp(2.3, 1, u)];
			const tw = 0.6 + 0.4 * Math.sin(t * 1.6 + d.ph);
			glow(g, v, q, 8, SILVER, 0.55 * a282 * u * tw, 'star');
		}
	}
	// ---------- 三圈轨道（发光的细环，慢慢转）
	const orbA = vis(t, 120.6, 127.4, 1.0, 0.6);
	if (orbA > 0)
		ORBITS.forEach((o, oi) => {
			const ring = arcPts(C[0], C[1], o.r, 0, Math.PI * 2, 200).map(([x, y]) => [x, C[1] + (y - C[1]) * 0.92] as XY);
			glowLines(g, v, [ring], '#8ea0c4', 1.0, (0.2 - 0.04 * oi) * orbA, false);
		});
	// 54 个帮忙的人
	if (t >= 120.6 && t < 128.5) {
		const FR = friendsAt(t);
		for (let i = 0; i < HELPERS.length; i++) {
			const h = HELPERS[i];
			const fly = easeInOut(clamp((t - 120.6 - h.d) / 0.9));
			if (fly <= 0) continue;
			let p = lerpXY(h.from, helperPos(h, t), fly);
			const picked = PICK6.indexOf(i);
			let a = 1;
			if (h.orb > 0) a = 1 - sm(t, 126.8, 127.4);
			else if (picked < 0) a = 1 - sm(t, 126.8, 127.6);
			else p = lerpXY(p, FR[picked], ez(t, 126.8, 127.9));
			if (a <= 0) continue;
			const am = h.orb > 0 ? sm(t, 122.6, 123.1) : 0;
			const col = mixHex(SILVER, AMBER, am);
			const up = h.orb === 2 ? 1 + 0.9 * sm(t, 123.2, 123.6) : 1;
			if (t >= 127.9 && picked >= 0) continue; // 127.9 起由小圈子接手
			node(g, v, p, 0.8 * a * up, t, i, col);
		}
	}
	// ---------- 小圈子（127.4 起）：完全连通的 7 个点，慢慢自转
	const cliqueA = sm(t, 127.5, 128.2);
	if (t >= 127.9 && cliqueA > 0) {
		const cl = [C, ...friendsAt(t)];
		const fadeL = 1 - sm(t, 144.8, 145.3);
		glowLines(g, v, CL_EDGES.map(([a, b]) => [cl[a], cl[b]]), SILVER, 1.1, 0.42 * cliqueA * fadeL, true);
		// 128.6 / 130.8：一颗琥珀火星在一个朋友身上亮起，0.4 秒内沿 21 根线传遍整个圈子
		for (const t0 of [128.6, 130.8]) {
			const e = t - t0;
			if (e < 0 || e > 1.6) continue;
			const src = t0 === 128.6 ? 2 : 4;
			const seg: XY[][] = [];
			for (const [a, b] of CL_EDGES) {
				const fromSrc = a === src || b === src;
				const u = clamp((e - (fromSrc ? 0 : 0.2)) / 0.2);
				if (u <= 0 || e > 0.9) continue;
				const [p, q] = a === src ? [cl[a], cl[b]] : b === src ? [cl[b], cl[a]] : [cl[a], cl[b]];
				seg.push([p, lerpXY(p, q, u)]);
			}
			glowLines(g, v, seg, AMBER, 1.8, 0.8 * (1 - clamp((e - 0.4) / 0.5)), true);
			const fl = pulse(t, t0 + 0.4, 1.0);
			for (let i = 0; i < 7; i++) glow(g, v, cl[i], 34, AMBER, 0.7 * fl, 'dot');
			glow(g, v, cl[src], 18, AMBER_CORE, 0.95 * (1 - clamp(e / 0.5)), 'star');
		}
		if (!handed) for (let i = 1; i < 7; i++) node(g, v, cl[i], cliqueA, t, i);
	}
	if (youOn > 0) {
		drawYou(g, v, C, youOn * (1 + 0.9 * pulse(t, 137.4, 1.0)), t);
		glow(g, v, C, 80, '#fff3dc', 0.1 * youOn, 'soft');
	}
	// ---------- 另外 5 个小圈子（133.7 起，镜头拉远时从黑暗里显出来）
	const othA = sm(t, 134.2, 136.0);
	if (othA > 0) {
		const dim = 1 - 0.4 * sm(t, 139.3, 140.0);
		const fadeL = 1 - sm(t, 144.8, 145.3);
		for (const o of OTHER) {
			const pts = otherPts(o, t);
			const segs: XY[][] = [];
			for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) segs.push([pts[a], pts[b]]);
			glowLines(g, v, segs, SILVER, 1.0, 0.36 * othA * dim * fadeL, true);
			if (!handed) pts.forEach((p, i) => node(g, v, p, 0.85 * othA * dim, t, i + 40));
		}
		// 唯一伸出圈子的线：右上那个圈子里的一颗 ↔「你」（审片：2.5–3 px 核心 + 光晕）
		const tie = samp(tieCurve(t), 50, 0, ez(t, 134.6, 135.8));
		const tk = 0.6 * othA + 0.4 * sm(t, 139.5, 139.9) + 0.7 * pulse(t, 139.7, 1.3);
		glowLines(g, v, [tie], AMBER, 2.4, tk * (1 - sm(t, 144.6, 145.2)), true);
		// 136.0：右上圈子里冒出一颗新的琥珀火星，沿这根线一路飞到「你」
		if (t >= 136.0 && t < 138.0) {
			const UP = otherPts(UR, t);
			const at = (tt: number): XY => {
				if (tt < 136.5) return lerpXY(UP[TIE_SRC], UP[TIE_END], easeInOut((tt - 136.0) / 0.5));
				return bez(UP[TIE_END], C, -TIE_BEND)(easeInOut(clamp((tt - 136.5) / 0.9)));
			};
			const tail: XY[] = [];
			for (let j = 15; j >= 0; j--) tail.push(at(Math.max(136.0, t - j * 0.025)));
			comet(g, v, tail, AMBER, 3.0, 1 - sm(t, 137.4, 137.9), 26);
		}
	}
	void glowAt;
};

export const draw1973 = (g: Ctx, t: number) => {
	if (t >= 90.6 && t < 103.05) drawCircle(g, t);
	if (t >= 103 && t < 145.8) draw73(g, t);
};
export {smooth, ID};
