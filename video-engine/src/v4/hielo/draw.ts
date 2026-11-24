import {type Ctx, clamp, comet, dot, easeInOut, easeOut, haze, hair, lerp, line, mulberry32, partial, prog, ring, sample, smooth, win} from '../kit';
import {EV, T, TYPE} from './data.gen';
import {cellCenter, typed} from './type';

// 语义色：金 = 多年以后 / 讲故事的人；玫瑰 = 行刑队 / 危险；冰蓝 = 冰块 / 那个下午
export const GOLD = '#f0d28c';
export const ROSE = '#ee6a7f';
export const ICE = '#a9d4ff';
export const WARM = '#e9dcc0';
export const AMBER = '#d39a4c';

export const PRO = {size: 54, y0: 455, lineH: 78};
export const AX = {y: 470, P: [380, 470] as [number, number], N: [820, 470] as [number, number], F: [1480, 470] as [number, number]};

type P2 = [number, number];
const arc = (a: P2, b: P2, h: number, u: number): P2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - h * 4 * u * (1 - u)];

/** 冰块线框（等角，慢慢转），x,y 是中心 */
export const iceCube = (g: Ctx, x: number, y: number, s: number, rot: number, k: number, color = ICE) => {
	if (k <= 0.01) return;
	const pts3: [number, number, number][] = [];
	for (const X of [-1, 1]) for (const Y of [-1, 1]) for (const Z of [-1, 1]) pts3.push([X, Y, Z]);
	const c = Math.cos(rot), sn = Math.sin(rot);
	const tilt = 0.5;
	const pr = ([X, Y, Z]: [number, number, number]): P2 => {
		const x1 = X * c - Z * sn, z1 = X * sn + Z * c;
		const y1 = Y * Math.cos(tilt) - z1 * Math.sin(tilt);
		return [x + x1 * s, y + y1 * s * 1.15];
	};
	const P = pts3.map(pr);
	const E: [number, number][] = [];
	for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
		const d = pts3[i].reduce((a, v, q) => a + (v !== pts3[j][q] ? 1 : 0), 0);
		if (d === 1) E.push([i, j]);
	}
	haze(g, x, y, s * 2.6, color, 0.16 * k);
	for (const [i, j] of E) line(g, [P[i], P[j]], color, 1.6, 0.55 * k);
	dot(g, x - s * 0.3, y - s * 0.35, s * 0.35, '#ffffff', 0.35 * k);
};

/** 四角星闪 */
const glint = (g: Ctx, x: number, y: number, r: number, color: string, k: number) => {
	if (k <= 0.01) return;
	line(g, [[x - r, y], [x + r, y]], color, 1.4, k);
	line(g, [[x, y - r * 1.3], [x, y + r * 1.3]], color, 1.4, k);
	dot(g, x, y, r * 0.5, color, k);
};

// ---------- 序：打字的火花、片名前的散开 ----------
const drawPrologue = (g: Ctx, t: number) => {
	if (t > T.title + 2.5) return;
	const tw = TYPE.proZh;
	const n = typed(tw, t);
	const dissolve = prog(t, T.title - 0.6, T.title + 1.2, easeInOut);
	for (let i = Math.max(0, n - 6); i < n; i++) {
		const age = t - (tw.t0 + i / tw.cps);
		if (age > 0.9 || dissolve > 0) continue;
		const [cx, cy] = cellCenter(tw, i, PRO.size, PRO.y0, PRO.lineH);
		const r = mulberry32(i * 31 + 7);
		for (let k = 0; k < 7; k++) {
			const a = r() * Math.PI * 2, sp = 30 + r() * 70;
			dot(g, cx + Math.cos(a) * sp * age, cy + Math.sin(a) * sp * age - 20 * age, 2.2 + r() * 2, GOLD, 0.5 * (1 - age / 0.9));
		}
	}
	// 片名前：每个字化成往上飘的光尘
	if (dissolve > 0 && dissolve < 1) {
		const total = tw.lines.reduce((a, l) => a + Array.from(l).length, 0);
		for (let i = 0; i < total; i++) {
			const [cx, cy] = cellCenter(tw, i, PRO.size, PRO.y0, PRO.lineH);
			const r = mulberry32(i * 17 + 3);
			for (let k = 0; k < 5; k++) {
				const e = easeOut(dissolve);
				dot(g, cx + (r() - 0.5) * 50 * e, cy - (40 + r() * 160) * e, 1.6 + r() * 1.6, r() < 0.2 ? ROSE : GOLD, 0.55 * (1 - dissolve));
			}
		}
	}
};

// ---------- 一 · 三个时间 ----------
/** 时间轴在「局外人」对比段会缩小、挪到右边 */
const axisCam = (t: number) => {
	const k = prog(t, T.camus, T.camus + 1.2) * (1 - prog(t, T.verb - 0.3, T.verb + 0.8));
	return {s: lerp(1, 0.6, k), dx: lerp(0, 400, k), k};
};
export const axisXY = (t: number, p: P2): P2 => {
	const {s, dx} = axisCam(t);
	return [960 + (p[0] - 960) * s + dx, AX.y + (p[1] - AX.y) * s];
};
/** 注意力光点的位置 */
const attention = (t: number): P2 => {
	const {N, F, P} = AX;
	if (t < T.toSquad) return N;
	if (t < EV.landF) return arc(N, F, 120, easeInOut(inv(T.toSquad, EV.landF, t)));
	if (t < T.toNoon) return F;
	if (t < EV.landP) return arc(F, P, 260, easeInOut(inv(T.toNoon, EV.landP, t)));
	return P;
};
const inv = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
const flare = (g: Ctx, x: number, y: number, t: number, t0: number, color: string, big = 1) => {
	const a = t - t0;
	if (a < 0 || a > 1.4) return;
	ring(g, x, y, 14 + 90 * big * easeOut(a / 1.4), color, 2, 0.8 * (1 - a / 1.4));
	haze(g, x, y, 120 * big, color, 0.5 * Math.exp(-a * 3));
};

const drawCh1 = (g: Ctx, t: number) => {
	const vis = win(t, T.jump3 - 0.4, T.ch2 + 0.2, 0.8, 1.0);
	if (vis <= 0) return;
	const {N, F, P} = AX;
	const grow = prog(t, T.jump3 - 0.4, T.jump3 + 1.2, easeOut);
	const A = (p: P2) => axisXY(t, p);
	const axis = partial(sample((u) => A([lerp(220, 1700, u), AX.y]), 40), grow);
	line(g, axis, '#7d93ab', 1.4, 0.32 * vis);
	for (const p of [P, N, F]) {
		const q = A(p);
		hair(g, [[q[0], q[1] - 10], [q[0], q[1] + 10]], '#9fb2c6', 1, 0.4 * vis * grow);
	}
	// 三个点
	const nK = win(t, T.jump3 + 0.4, 1e9, 0.6, 0) * vis;
	const fK = (t >= EV.landF ? 1 : 0.15 * win(t, T.jump3 + 0.4, 1e9, 0.6, 0)) * vis;
	const pK = (t >= EV.landP ? 1 : 0.15 * win(t, T.jump3 + 0.4, 1e9, 0.6, 0)) * vis;
	const threeFl = t >= EV.three ? 1 + 0.8 * Math.exp(-(t - EV.three) * 2.2) : 1;
	const qn = A(N), qf = A(F), qp = A(P);
	dot(g, qn[0], qn[1], 26, GOLD, 0.8 * nK * threeFl);
	dot(g, qf[0], qf[1], 26, ROSE, 0.85 * fK * threeFl);
	dot(g, qp[0], qp[1], 26, ICE, 0.85 * pK * threeFl);
	flare(g, qf[0], qf[1], t, EV.landF, ROSE);
	flare(g, qp[0], qp[1], t, EV.landP, ICE);
	for (const [q, c] of [[qn, GOLD], [qf, ROSE], [qp, ICE]] as [P2, string][]) flare(g, q[0], q[1], t, EV.three, c, 0.7);
	// 行刑队：六支枪管的暗线
	const rifles = win(t, EV.landF - 0.1, T.camus + 0.6, 0.6, 0.8) * vis;
	if (rifles > 0) for (let i = 0; i < 6; i++) {
		const y = qf[1] - 70 + i * 9;
		hair(g, [[qf[0] + 70 + i * 16, y], [qf[0] + 150 + i * 16, y + 4]], '#d9a3ad', 1.2, 0.5 * rifles);
	}
	// 冰块小线框
	iceCube(g, qp[0], qp[1] - 62, 18, t * 0.4, win(t, EV.landP - 0.1, T.camus + 0.6, 0.5, 0.8) * vis);
	// 注意力光点：带拖尾
	const att = win(t, T.jump3 + 0.6, T.three + 0.6, 0.5, 0.6) * vis;
	if (att > 0) {
		const tail: P2[] = [];
		for (let i = 14; i >= 0; i--) tail.push(A(attention(t - i * 0.035)));
		comet(g, tail, '#fff1d0', 2.6, att);
		const h = A(attention(t));
		dot(g, h[0], h[1], 14, '#fff7e6', att);
	}
	// 《局外人》对照：左边一条小轴，只有一个点
	const cam = win(t, T.camus + 0.2, T.verb, 0.8, 0.6) * vis;
	if (cam > 0) {
		line(g, [[230, AX.y], [700, AX.y]], '#7d93ab', 1.4, 0.3 * cam);
		dot(g, 465, AX.y, 24, GOLD, 0.8 * cam);
	}
	// 「将会」向右、「回想起」向左
	const vb = win(t, T.verb + 1.2, T.prolep + 0.4, 0.4, 0.6) * vis;
	if (vb > 0) {
		const u1 = prog(t, T.verb + 1.3, T.verb + 2.3, easeInOut);
		const u2 = prog(t, T.verb + 2.5, T.verb + 3.6, easeInOut);
		if (u1 > 0) comet(g, sample((u) => [lerp(N[0], F[0], u * u1), AX.y], 18), GOLD, 3, vb);
		if (u2 > 0) comet(g, sample((u) => [lerp(N[0], P[0], u * u2), AX.y], 18), ICE, 3, vb);
	}
	// 预叙：盖住将来的一张纸，掀起左下角
	const pr = win(t, T.prolep - 0.2, T.ch2 + 0.1, 0.6, 0.8) * vis;
	if (pr > 0) {
		const x0 = 1010, x1 = 1730, y0 = 425, y1 = 600;
		const lift = prog(t, T.prolep + 0.8, T.prolep + 2.4, easeInOut);
		const c = 150 * lift;
		const sheet: P2[] = [[x0 + c, y1], [x1, y1], [x1, y0], [x0, y0], [x0, y1 - c]];
		line(g, sheet, '#c8bfae', 1.3, 0.45 * pr, false);
		if (lift > 0) {
			line(g, [[x0, y1 - c], [x0 + c * 0.9, y1 - c * 0.9], [x0 + c, y1]], '#e9dcc0', 1.6, 0.7 * pr);
			haze(g, x0 + c * 0.35, y1 - c * 0.35, 150 * lift, ROSE, 0.45 * pr * lift);
		}
	}
};

// ---------- 二 · 桌下的炸弹 ----------
const TABLE: P2[][] = [
	[[640, 540], [1280, 540], [1200, 480], [720, 480], [640, 540]],
	[[660, 545], [660, 700]],
	[[1260, 545], [1260, 700]],
	[[735, 485], [735, 640]],
	[[1185, 485], [1185, 640]],
];
const BOOK: P2[][] = [
	[[960, 470], [640, 440], [610, 640], [960, 665], [960, 470]],
	[[960, 470], [1280, 440], [1310, 640], [960, 665]],
];
const BOMB: P2 = [960, 640];
const drawCh2 = (g: Ctx, t: number) => {
	const vis = win(t, T.bomb1 - 0.5, EV.page7 + 1.2, 0.8, 1.0);
	const lv = win(t, T.lived - 0.3, T.ch3 + 0.2, 0.6, 0.9);
	if (vis > 0) {
		const tb = 1 - prog(t, T.placed - 0.2, T.placed + 1.0);
		const bk = prog(t, T.placed + 0.2, T.placed + 1.4) * vis;
		const draw = prog(t, T.bomb1 - 0.5, T.bomb1 + 1.3, easeOut);
		for (const seg of TABLE) line(g, partial(seg, draw), WARM, 1.8, 0.55 * vis * tb);
		// 两只杯子 + 闲聊的「……」
		if (tb > 0) {
			ring(g, 860, 500, 16, WARM, 1.6, 0.5 * vis * tb);
			ring(g, 1060, 500, 16, WARM, 1.6, 0.5 * vis * tb);
			const talk = win(t, T.bomb3 + 0.4, T.placed, 0.4, 0.4) * vis * tb;
			for (let i = 0; i < 3; i++) {
				const ph = (t * 1.6 + i * 0.33) % 1;
				dot(g, 930 + i * 30, 430, 5, WARM, talk * (0.3 + 0.7 * Math.sin(ph * Math.PI)));
			}
		}
		// 炸弹：先藏着，爆一下；再亮出来，一直跳
		const flash = t > EV.flash15s ? Math.exp(-(t - EV.flash15s) * 3.5) : 0;
		if (flash > 0.01 && t < T.bomb3) haze(g, BOMB[0], BOMB[1], 520, '#ffd9c8', 0.9 * flash);
		const shown = prog(t, T.bomb3 - 0.2, T.bomb3 + 0.8) * vis;
		const toBook = prog(t, T.placed + 0.2, T.placed + 1.4, easeInOut);
		const bx = BOMB[0], by = lerp(BOMB[1], 690, toBook);
		const beat = 0.75 + 0.25 * Math.sin(t * (6 + 6 * prog(t, T.ch7, EV.page7)));
		if (shown > 0) {
			const r = lerp(40, 14, toBook);
			ring(g, bx, by, r, ROSE, 2.2, 0.7 * shown * (1 - toBook * 0.6));
			dot(g, bx, by, r * 1.4, ROSE, 0.5 * shown * beat);
			if (toBook < 1) {
				const fuse = sample((u) => [bx + 22 + u * 30, by - 30 - u * 30 + Math.sin(u * 4) * 6], 12);
				line(g, fuse, WARM, 1.4, 0.5 * shown * (1 - toBook));
				const sp = fuse[fuse.length - 1];
				dot(g, sp[0], sp[1], 10, GOLD, shown * (1 - toBook) * (0.6 + 0.4 * Math.sin(t * 23)));
			}
		}
		// 十五分钟：炸弹外一圈计时的弧
		const timer = win(t, EV.ding15m - 0.4, T.placed + 0.4, 0.4, 0.6) * vis;
		if (timer > 0) ring(g, bx, by, 70, GOLD, 2, 0.6 * timer, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog(t, EV.ding15m - 0.4, T.placed + 0.4, (x) => x));
		// 书：第一页上一行字，里面一个玫瑰色的点
		if (bk > 0) {
			for (const seg of BOOK) line(g, seg, WARM, 1.6, 0.5 * bk);
			const ln = prog(t, T.placed + 0.8, T.placed + 2.0, easeOut);
			hair(g, partial([[660, 470], [920, 486]], ln), '#cfc3aa', 2, 0.6 * bk);
			if (ln > 0.5) dot(g, 760, 476, 9, ROSE, bk);
			// 翻页：右页的边一页页翻到左边
			const fl = prog(t, T.ch7 + 0.2, EV.page7, (x) => x);
			if (fl > 0 && fl < 1) {
				const ph = (fl * 6) % 1;
				const ang = Math.PI * easeInOut(ph);
				const ex = 960 + Math.cos(ang) * 330;
				line(g, [[960, 470], [ex, 440 - Math.sin(ang) * 60], [ex, 640 - Math.sin(ang) * 40], [960, 665]], '#e9dcc0', 1.2, 0.45 * bk);
			}
		}
	}
	// 行刑队插图上：枪口一点玫瑰色，静音那一帧被吹灭，化成烟往上飘
	const muzzle: P2 = [628, 241];
	const mz = win(t, EV.page7 + 0.8, EV.hush, 0.6, 0);
	if (mz > 0) dot(g, muzzle[0], muzzle[1], 16, ROSE, 0.7 * mz * (0.8 + 0.2 * Math.sin(t * 9)));
	const sm = t - EV.hush;
	if (sm >= 0 && sm < 3.2) {
		const r = mulberry32(99);
		for (let i = 0; i < 26; i++) {
			const vx = (r() - 0.5) * 30, vy = -18 - r() * 30;
			dot(g, muzzle[0] + vx * sm + Math.sin(sm * 2 + i) * 6, muzzle[1] + vy * sm, 3 + r() * 4 + sm * 2, '#b9a0a6', 0.35 * Math.exp(-sm * 0.9) * (sm < 0.05 ? sm / 0.05 : 1));
		}
	}
	// 他活了下来：轴回来，光点越过行刑队一直往右
	if (lv > 0) {
		const {P, F} = AX;
		line(g, [[220, AX.y], [1760, AX.y]], '#7d93ab', 1.4, 0.3 * lv);
		dot(g, P[0], P[1], 20, ICE, 0.6 * lv);
		dot(g, F[0], F[1], 20, ROSE, 0.6 * lv);
		const u = prog(t, T.lived + 0.4, T.lived_end, easeInOut);
		const tail = sample((v) => [lerp(F[0], lerp(F[0], 1780, u), v), AX.y], 24);
		comet(g, tail, GOLD, 3, lv);
		dot(g, tail[tail.length - 1][0], AX.y, 14, '#fff3d6', lv);
	}
};

// ---------- 三 · 为什么是冰 ----------
const STARS = (() => {
	const r = mulberry32(2024);
	const out: P2[] = [];
	while (out.length < 26) {
		const p: P2 = [320 + r() * 1280, 190 + r() * 480];
		if (Math.hypot(p[0] - 960, p[1] - 430) > 140) out.push(p);
	}
	return out;
})();
export const STAR_LABELS: [number, string, string][] = [[3, '飞毯', 'flying carpets'], [11, '黄花雨', 'rain of yellow flowers'], [19, '升天', 'ascension']];
export const starXY = (i: number) => STARS[i];
const drawCh3 = (g: Ctx, t: number) => {
	const cube = win(t, T.whyice - 0.5, EV.iceReveal + 0.8, 0.8, 0.8);
	if (cube > 0) {
		iceCube(g, 960, 420, 95, t * 0.35, cube);
		const heat = win(t, T.tropic + 0.2, EV.iceReveal + 0.4, 0.8, 0.6);
		if (heat > 0) {
			haze(g, 960, 420, 640, AMBER, 0.32 * heat);
			for (let i = 0; i < 9; i++) {
				const x0 = 560 + i * 100, ph = t * 0.9 + i;
				hair(g, sample((u) => [x0 + Math.sin(u * 9 + ph * 3) * 10, 720 - u * 420 - ((ph * 60) % 80)], 20), AMBER, 1.2, 0.35 * heat);
			}
		}
	}
	// 一件真的事点亮整片
	const st = win(t, T.true1 - 0.3, EV.grandmaReveal + 0.4, 0.6, 0.7);
	if (st > 0) {
		const lit = prog(t, EV.trueIgnite, EV.trueIgnite + 1.6, easeOut);
		STARS.forEach((p, i) => {
			const appear = win(t, T.true1 + i * 0.05, 1e9, 0.4, 0);
			const d = Math.hypot(p[0] - 960, p[1] - 430) / 700;
			const on = clamp((lit - d * 0.6) / 0.4);
			if (on > 0) hair(g, partial([[960, 430], p], on), GOLD, 1, 0.3 * st);
			dot(g, p[0], p[1], 12 + 8 * on, on > 0 ? GOLD : '#b8bcc2', st * appear * (0.5 + 0.6 * on));
		});
		dot(g, 960, 430, 22, ICE, st * (0.6 + 0.6 * lit));
		if (t > EV.trueIgnite) ring(g, 960, 430, 30 + 600 * easeOut((t - EV.trueIgnite) / 1.6), GOLD, 1.5, 0.5 * st * clamp(1 - (t - EV.trueIgnite) / 1.6));
	}
	// 平平地说那一句：冰块的小闪
	const dp = win(t, T.deadpan, T.ch4 + 0.2, 0.6, 0.8);
	if (dp > 0) glint(g, 960, 330, 14, ICE, dp * (0.5 + 0.5 * Math.sin(t * 2)));
};

// ---------- 四 · 第一句会传染 ----------
// 床放大 1.5 倍，以 (960, 600) 为中心
const BED: P2[][] = ([
	[[760, 610], [1160, 610]],
	[[760, 560], [1160, 560], [1160, 610]],
	[[760, 480], [760, 640]],
	[[1160, 540], [1160, 640]],
	[[790, 545], [840, 532], [870, 545]],
] as P2[][]).map((seg) => seg.map(([x, y]) => [960 + (x - 960) * 1.5, 600 + (y - 600) * 1.5] as P2));
const rot = (p: P2, o: P2, a: number): P2 => [o[0] + (p[0] - o[0]) * Math.cos(a) - (p[1] - o[1]) * Math.sin(a), o[1] + (p[0] - o[0]) * Math.sin(a) + (p[1] - o[1]) * Math.cos(a)];
const BOOKS = (() => {
	const r = mulberry32(1200);
	return Array.from({length: 2600}, () => ({x: r() * 1920, y: r() * 1080, d: r() * 0.9, s: 1 + r() * 2.2, tw: r() * 6.28, c: r() < 0.15 ? ICE : r() < 0.3 ? ROSE : GOLD}));
})();
const drawCh4 = (g: Ctx, t: number) => {
	const bed = win(t, T.bogota - 0.3, T.twenty + 0.3, 0.8, 0.8);
	if (bed > 0) {
		const a0 = t - EV.bedFlip;
		const ang = a0 > 0 ? -0.32 * Math.exp(-a0 * 2.2) * Math.cos(a0 * 9) * (a0 < 0.12 ? a0 / 0.12 : 1) : 0;
		const o: P2 = [1260, 660];
		for (const seg of BED) line(g, seg.map((p) => rot(p, o, ang)), WARM, 1.8, 0.5 * bed);
		haze(g, 1380, 430, 120, AMBER, 0.4 * bed);
		dot(g, 1380, 430, 12, AMBER, 0.85 * bed);
		// 读书的人（一个小光点）被掀起来，掉到床外
		let pp: P2 = rot([840, 520], o, ang);
		if (a0 > 0) {
			const u = clamp(a0 / 1.1);
			pp = [lerp(840, 1420, u), 520 - 300 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + (u > 0.87 ? (u - 0.87) * 1100 : 0)];
			pp[1] = Math.min(pp[1], 660);
		}
		dot(g, pp[0], pp[1], 15, GOLD, bed);
	}
	// 1947 → 1967
	const yr = win(t, T.twenty - 0.2, EV.spectacle + 0.3, 0.6, 0.4);
	if (yr > 0) {
		const u = prog(t, T.twenty + 0.4, T.twenty + 2.2, easeInOut);
		line(g, [[560, 470], [1360, 470]], '#7d93ab', 1.4, 0.3 * yr);
		dot(g, 560, 470, 16, GOLD, 0.7 * yr);
		if (u > 0) comet(g, sample((v) => [lerp(560, lerp(560, 1360, u), v), 470], 20), GOLD, 3, yr);
		if (u >= 1) dot(g, 1360, 470, 22, GOLD, yr * (1 + Math.exp(-(t - T.twenty - 2.2) * 3)));
	}
	// 一千两百万册：满屏
	const sp = t - EV.spectacle;
	const sv = win(t, EV.spectacle - 0.1, T.memes - 0.2, 0.1, 1.2);
	if (sv > 0) {
		for (const b of BOOKS) {
			const u = easeOut(clamp((sp - b.d) / 1.6));
			if (u <= 0) continue;
			const fall = Math.max(0, t - T.pattern) * 40 * (0.5 + b.s * 0.3);
			const x = lerp(1360, b.x, u), y = lerp(470, b.y, u) + fall;
			dot(g, x, y, b.s * 2.2, b.c, sv * (0.35 + 0.35 * Math.sin(t * 3 + b.tw)) * u);
		}
		haze(g, 960, 540, 900, GOLD, 0.25 * sv * Math.exp(-Math.max(0, sp) * 0.8));
	}
};

// ---------- 五 · 收尾 ----------
const drawCh5 = (g: Ctx, t: number) => {
	const ic = win(t, T.iceagain - 0.2, T.memoir + 1.0, 0.8, 0.8);
	if (ic > 0) {
		haze(g, 590, 210, 260, ICE, 0.42 * ic);
		iceCube(g, 790, 120, 30, t * 0.5, ic);
	}
	const qd = t - EV.quoteDone;
	if (qd > 0 && qd < 2) haze(g, 960, 520, 700, GOLD, 0.35 * Math.exp(-qd * 2));
	const bl = win(t, T.yours - 0.2, 1e9, 0.8, 0);
	if (bl > 0) {
		iceCube(g, 960, 300, 30, t * 0.45, bl * 0.9);
		const fg = t - EV.finalGlint;
		if (fg > 0) glint(g, 960 - 10, 290, 40 * Math.exp(-fg * 1.2) + 10, '#ffffff', Math.exp(-fg * 0.9));
	}
};

export const drawAll = (g: Ctx, t: number) => {
	drawPrologue(g, t);
	drawCh1(g, t);
	drawCh2(g, t);
	drawCh3(g, t);
	drawCh4(g, t);
	drawCh5(g, t);
};
export {smooth};
