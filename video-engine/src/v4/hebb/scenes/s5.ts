/** V 望 HOPE 3:43.2–4:12.3：回到黑底，并排两组 A→B（爱听的歌 / 怕过的狗），两根线同样变粗 → 漂开 →
 *  鲁迅《故乡》逐字打出 → 光标下的线落到地平线，变成一条小路，草从两边冒出来（形变 9，直接进 VI）。 */
import {clamp, easeInOut, easeOut, inv, lerp, mix, partial, smooth} from '../../kit';
import {FONT_EN_IT, FONT_ZH} from '../../kit';
import {meta, P} from '../data';
import {type Ctx, type Pt, TAU, cam, camReset, camSet, flare, gline, gring, pulse, spr} from '../lib/core';
import {QUOTE, type Assets, drawLine, quoteFont} from '../lib/title';
import {drawMeadow, roadScreen} from './s6';

const V = meta.V;
const PAIR = V.pairings; // 224.2 … 230.7
// 审片：两组整体 ×1.6（每组 A→B 跨度 240 → 384 px），组间距拉开
const GL = {A: [488, 400] as Pt, B: [872, 400] as Pt};
const GR = {A: [1048, 400] as Pt, B: [1432, 400] as Pt};
export const hopeNote: Pt = [1500, 470];

const nPair = (t: number) => PAIR.reduce((a, tp) => a + easeOut(inv(tp + 0.15, tp + 0.6, t)), 0);

/** 锯齿环（一声狗叫） */
const jag = (g: Ctx, x: number, y: number, r: number, color: string, k: number) => {
	if (k <= 0.003) return;
	const pts: Pt[] = [];
	const n = 26;
	for (let i = 0; i <= n; i++) {
		const a = (i / n) * TAU;
		const rr = r * (i % 2 === 0 ? 1.16 : 0.86);
		pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
	}
	gline(g, pts, color, null, 1.8, k, true);
};
/** 一小段声波（歌）：向右扩散的三道弧 */
const song = (g: Ctx, x: number, y: number, u: number, k: number) => {
	if (u < 0 || u > 1) return;
	for (let j = 0; j < 3; j++) {
		const uu = u - j * 0.12;
		if (uu < 0) continue;
		const r = 26 + 112 * easeOut(uu);
		gring(g, x, y, r, P.leaf, 2.0, 0.75 * k * Math.pow(1 - uu, 1.3), -0.55, 0.55);
	}
};

export const drawHope = (g: Ctx, t: number, As: Assets | null) => {
	if (t < 223.2 || t > 252.6) return;
	// ---------------- 两组 A→B
	if (t < 238.4) {
		camSet(g, cam(1 + 0.015 * inv(223.2, 238.3, t), 960, 400));
		const vis = smooth(inv(223.4, 224.0, t)) * (1 - smooth(inv(237.5, 238.3, t)));
		const drift = easeInOut(inv(231.0, 237.5, t));
		const dimK = lerp(1, 0.5, drift);
		const rise = 1 - easeOut(inv(223.4, 224.2, t));
		const n = nPair(t); // 0 → 6
		const wl = 1 + (3 * n) / 6;
		const kl = 0.4 + (0.6 * n) / 6;
		for (const [grp, side, colB] of [
			[GL, -1, P.gold],
			[GR, 1, P.ice],
		] as [typeof GL, number, string][]) {
			const dx = side * 90 * drift;
			const A: Pt = [grp.A[0] + dx, grp.A[1] + 18 * rise];
			const B: Pt = [grp.B[0] + dx, grp.B[1] + 18 * rise];
			const k = vis * dimK;
			// 连线：两组同一个增量
			gline(g, [[A[0] + 26, A[1]], [B[0] - 26, B[1]]], P.leaf, colB, wl * 1.1, kl * k);
			let fa = 0;
			let fb = 0;
			for (const tp of PAIR) {
				fa = Math.max(fa, pulse(t, tp, 0.04, 0.3));
				fb = Math.max(fb, side < 0 ? pulse(t, tp + 0.15, 0.1, 0.5) : pulse(t, tp + 0.12, 0.02, 0.18));
				if (side < 0) song(g, A[0], A[1], (t - tp) / 0.9, k);
				else {
					const u = (t - tp) / 0.5;
					if (u >= 0 && u <= 1) jag(g, A[0], A[1], 22 + 96 * easeOut(u), P.chime, 0.85 * k * Math.pow(1 - u, 1.2));
				}
			}
			const br = 0.9 + 0.1 * Math.sin(t * 1.9 + side);
			spr(g, A[0], A[1], 40, P.leaf, (0.8 + 0.6 * fa) * k * br);
			spr(g, A[0], A[1], 150, P.leaf, 0.14 * k * (1 + fa), 'soft');
			spr(g, B[0], B[1], 40, colB, (0.6 + 0.9 * fb) * k * br);
			spr(g, B[0], B[1], 130, colB, 0.11 * k, 'soft');
			if (fb > 0.01) {
				if (side < 0) {
					spr(g, B[0], B[1], 240, P.amber, 0.3 * fb * k, 'soft');
					spr(g, B[0], B[1], 96, P.gold, 0.8 * fb * k);
				} else {
					spr(g, B[0], B[1], 200, P.ice, 0.32 * fb * k, 'soft');
					spr(g, B[0], B[1], 74, '#eef4ff', 0.9 * fb * k);
					flare(g, B[0], B[1], 420, P.ice, 0.6 * fb * k, 0.012);
				}
			}
		}
	}
	// ---------------- 环境光（两组）
	if (t < 238.4) {
		const va = smooth(inv(223.4, 224.4, t)) * (1 - smooth(inv(237.0, 238.3, t))) * lerp(1, 0.6, easeInOut(inv(231.0, 237.5, t)));
		spr(g, 680, 400, 480, P.amber, 0.08 * va, 'soft');
		spr(g, 1240, 400, 480, P.ice, 0.06 * va, 'soft');
	}
	// ---------------- 鲁迅
	if (t >= 238.3 && As) {
		camReset(g);
		const qa = smooth(inv(238.3, 238.6, t)) * (1 - smooth(inv(250.5, 251.3, t)));
		const chars = Array.from(QUOTE.text);
		const nTyped = Math.max(0, Math.min(chars.length, Math.floor((t - QUOTE.t0) * QUOTE.cps)));
		const lay = As.quote;
		if (qa > 0.003) {
			g.save();
			g.translate(960, QUOTE.y + 10);
			g.scale(1, 0.24);
			spr(g, 0, 0, 760, P.amber, 0.06 * qa, 'soft');
			g.restore();
			g.globalCompositeOperation = 'source-over';
			drawLine(g, QUOTE.text, lay, quoteFont(), QUOTE.y, `rgba(230,232,232,${qa})`, nTyped);
			const sa = smooth(inv(242.2, 242.7, t)) * qa;
			if (sa > 0) {
				g.font = `360 16px "${FONT_ZH}"`;
				g.textAlign = 'center';
				g.fillStyle = `rgba(91,97,104,${sa})`;
				g.fillText('— 鲁迅 · 1921', 960, QUOTE.y + 70);
			}
			const ea = smooth(inv(242.6, 243.1, t)) * qa;
			if (ea > 0) {
				g.font = `italic 400 20px "${FONT_EN_IT}"`;
				g.textAlign = 'center';
				g.fillStyle = `rgba(138,143,147,${ea})`;
				g.fillText('At first the earth had no roads. Where many people walk, a road appears.', 960, QUOTE.y + 108);
			}
			g.globalCompositeOperation = 'lighter';
		}
		// 光标（金）：跟在已打出的字后面
		const lastX = nTyped > 0 ? lay.xs[nTyped - 1] + lay.ws[nTyped - 1] / 2 : lay.left - 8;
		const cx = lastX + 12;
		const blink = Math.floor(t * 2.2) % 2 === 0 ? 1 : 0.2;
		const cA = smooth(inv(QUOTE.t0 - 0.6, QUOTE.t0 - 0.3, t)) * (1 - smooth(inv(250.6, 251.4, t)));
		const top = QUOTE.y - QUOTE.size * 0.47;
		const bot = QUOTE.y + QUOTE.size * 0.48;
		const dripping = t >= 245.9;
		const ck = cA * (dripping ? 1 : blink);
		if (ck > 0.003) {
			g.fillStyle = `rgba(240,210,140,${ck})`;
			g.fillRect(cx - 1.5, top, 3, bot - top);
			spr(g, cx, (top + bot) / 2, 18, P.gold, 0.22 * ck, 'soft');
		}
		// ---------------- 形变 9：光标下面那条线 → 落到地平线 → 一条小路 → 草地
		if (dripping && t < 252.3) {
			const road = roadScreen(252.5); // 近 → 远
			const far = road[road.length - 1];
			const drip: Pt[] = [];
			for (let i = 0; i <= 24; i++) {
				const u = i / 24;
				drip.push([lerp(cx, far[0], easeInOut(u)), lerp(bot, far[1], u)]);
			}
			const dp = easeInOut(inv(245.9, 247.0, t));
			const dk = 1 - smooth(inv(250.8, 251.8, t));
			gline(g, partial(drip, dp), P.gold, null, 1.4, 0.9 * dk);
			if (dp < 1) {
				const hd = partial(drip, dp);
				const h = hd[hd.length - 1];
				spr(g, h[0], h[1], 14, P.goldCore, 0.9);
			}
			const roadP = easeInOut(inv(247.0, 249.6, t));
			const grassT0 = 247.2;
			drawMeadow(g, t, {
				K: 1,
				ambK: easeInOut(inv(245.9, 247.5, t)),
				roadP,
				roadFromFar: true,
				grassOn: (b) => {
					if (b.wide) return 0;
					// 草从路两边一根根冒出来：离路越近、离地平线越近（路先到那里）越早
					const tb = grassT0 + 1.4 * (1 - b.Z / 16) * 0.8 + 2.9 * Math.pow(clamp(b.dR / 3), 0.6) + 0.5 * b.grow;
					return smooth(inv(tb, tb + 0.5, t));
				},
				branchK: 0.4 * smooth(inv(248.4, 249.8, t)),
				oldK: 0.4 * smooth(inv(249.0, 251.0, t)),
				wideK: 0,
				runner: false,
			});
		}
	}
	void mix;
	void clamp;
};
