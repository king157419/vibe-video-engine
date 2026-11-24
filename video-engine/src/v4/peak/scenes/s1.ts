/** 01 冷（38.1–87.5）：一只手（霜点勾出的轮廓）浸进一盆 14 °C 的水；两次计时线（60 秒 / 60+30 秒）；
 *  计时线升上来、拆成上下两根（两个选项）、问号留白；揭晓「90 秒」；论文卡。 */
import {clamp, easeInOut, easeOut, hash2, lerp, prog, smooth, win} from '../../kit/util';
import type {Assets} from '../assets';
import {coldP, type Data, HAND_N} from '../data';
import {arc, beam, beamX, blit, type Ctx, DIM, ellipse, glow, GOLD, haze, ICE, ICE_W, mdot, mixc, type P, rgba, type RGB, SILVER, tracePath, WARM} from '../fx';

const P60 = 7.48;
export const UP_Y = 500; // 升上来之后：第一次（60 秒）
export const LO_Y = 620; // 第二次（60 + 30 秒）
export const TIMER_W = 2.8; // 审片修改：1.8 → 2.8
const Q_POS: P = [1320, 560]; // 问号：两根线中间偏右

/** 计时线的亮度（越亮越冷）。2026-10-12 用户反馈「越亮越冷」对比不够：原来 0.25 + 0.75·p/p60（14 °C 段）、
 *  多出的 30 秒 ×0.8（≈ 0.8 → 0.62）—— 这些值在白热芯里全都饱和成一样亮，14 °C 和 15 °C 两段看不出差别。
 *  现在拉开：14 °C 那 60 秒整段都是亮的冰蓝，并且越泡越亮（0.5 → 1.0，按 (p/p60)^1.3，越泡越冷看得见）；
 *  水升到 15 °C 的那 30 秒，分叉一出来 3.6 秒（模拟时间）内就落到 0.32，再慢慢暗到 0.22 —— 一眼看出暗一档，但仍亮着（还是冷）。
 *  （续作者复看：上一版 14 °C 段从 0.1 起，左半段和 15 °C 段一样暗，整根线读成「暗—亮—暗」，14 / 15 的对比被冲淡。） */
export const timerK = (s: number) => {
	if (s <= 60) return 0.5 + 0.5 * Math.pow(coldP(s) / P60, 1.3);
	const u = Math.min(1, (s - 60) / 30);
	return lerp(1, 0.32 - 0.1 * u, smooth(u / 0.12));
};
/** 计时线升上来的进度（57.7–58.9） */
const riseP = (t: number) => easeInOut(prog(t, 57.7, 58.9, (x) => x));
/** 计时线上的点：which 1 = 第一次（60 s），2 = 第二次（90 s）。升上来之前两根重合在 y 780（第二次过了 60 s 往下弯 14 px）；
 *  升上来之后拆成上下两根平行线，左端对齐 */
export const timerPt = (s: number, which: 1 | 2, t: number): P => {
	const r = riseP(t);
	const y0 = 780 + (which === 2 && s > 60 ? 14 * smooth((s - 60) / 30) : 0);
	return [420 + 12 * s, lerp(y0, which === 1 ? UP_Y : LO_Y, r)];
};
const timerPts = (s0: number, s1: number, which: 1 | 2, t: number): P[] => {
	const out: P[] = [];
	const n = Math.max(2, Math.ceil((s1 - s0) / 0.5));
	for (let i = 0; i <= n; i++) out.push(timerPt(s0 + ((s1 - s0) * i) / n, which, t));
	return out;
};

/** 手腕的高度 */
const wristY = (t: number) => {
	if (t < 38.6) return -380;
	if (t < 40.0) return lerp(-380, 330, easeInOut((t - 38.6) / 1.4));
	if (t < 45.1) return 330;
	if (t < 45.9) return lerp(330, 190, easeInOut((t - 45.1) / 0.8));
	if (t < 46.5) return 190;
	if (t < 47.3) return lerp(190, 330, easeInOut((t - 46.5) / 0.8));
	return 330;
};
/** 换手（45.9–46.5）：霜点从这只手的轮廓流到另一只手（镜像）的轮廓 */
const swapP = (t: number) => easeInOut(prog(t, 45.9, 46.5, (x) => x));

const TIP = 306; // 指尖相对手腕
// 指尖穿过水面 y 560 的时刻：入水、抬出、再入水 —— 由上面的运动反推，涟漪锚在这里
const contacts: number[] = (() => {
	const out: number[] = [];
	let prev = wristY(38) + TIP - 560;
	for (let f = 38 * 30; f < 48 * 30; f++) {
		const t = f / 30;
		const v = wristY(t) + TIP - 560;
		if ((prev < 0 && v >= 0) || (prev >= 0 && v < 0)) out.push(t);
		prev = v;
	}
	return out;
})();

/** 两次试验的模拟时间 */
const sim1 = (t: number) => 60 * prog(t, 40.2, 43.6, (x) => x);
const sim2 = (t: number) => 60 * prog(t, 47.3, 50.7, (x) => x) + 30 * prog(t, 50.7, 52.4, (x) => x);

/** 沿线走的光脉冲：从 x 420 出发，360 px/s，每 per 秒一次；走到线尾 xEnd 就停（末端会闪一下） */
const pulseX = (t: number, t0: number, per: number) => 420 + 360 * ((((t - t0) % per) + per) % per);

const drawHand = (g: Ctx, t: number, D: Data, A: Assets, yw: number, handA: number, cool: number) => {
	const u = swapP(t);
	const src = D.handDots;
	const dst = D.handDotsB;
	// 换手的中途：轮廓线和体温光先退掉，只剩霜点散开（±6 px）再在另一只手上聚回来
	const mid = Math.sin(Math.PI * u);
	const jit = 12 * mid;
	const pts: P[] = new Array(HAND_N);
	for (let i = 0; i < HAND_N; i++) {
		const jx = (hash2(i, 1, 16) - 0.5) * jit;
		const jy = (hash2(i, 2, 16) - 0.5) * jit;
		pts[i] = [960 + lerp(src[i][0], dst[i][0], u) + jx, yw + lerp(src[i][1], dst[i][1], u) + jy];
	}
	// 手的「体温」：轮廓里一层极淡的光，入水后由暖慢慢变冷
	const fillC: RGB = mixc(WARM, ICE, cool);
	const fillPoly = (y0: number, y1: number, k: number, dx: number) => {
		g.save();
		g.beginPath();
		g.rect(0, y0, 1920, y1 - y0);
		g.clip();
		g.translate(dx, 0);
		const gr = g.createLinearGradient(0, yw, 0, yw + TIP);
		gr.addColorStop(0, rgba(fillC, 0.02 * k));
		gr.addColorStop(0.6, rgba(fillC, 0.075 * k));
		gr.addColorStop(1, rgba(fillC, 0.05 * k));
		g.fillStyle = gr;
		tracePath(g, pts, true);
		g.fill();
		// 一条很淡的轮廓线（让霜点连得起来）
		beam(g, pts, ICE, 1.1, 0.26 * k, false, 0.25);
		g.restore();
	};
	const solid = 1 - 0.92 * mid;
	fillPoly(-400, 560, handA * solid, 0);
	fillPoly(560, 1100, 0.6 * handA * solid, 2); // 水下：暗一些，折射偏 2 px
	// 霜点勾边
	for (let i = 0; i < HAND_N; i++) {
		let [x, y] = pts[i];
		let a = 0.5 + 0.5 * Math.sin(t * 2.7 + 6.283 * hash2(i, 3, 16));
		if (y > 560) {
			x += 2;
			a *= 0.6;
		}
		blit(g, A.spr.iceW, x, y, 3.4 + 1.2 * mid, (0.35 + 0.55 * a) * handA * (1 + 0.35 * mid));
	}
	// 前臂：两条霜点线，从手腕往上 170 px 内渐隐（不再一直伸到画面上沿）
	for (const side of [-1, 1]) {
		const wx = lerp(side * 50, side * 50, u);
		for (let q = 0; q < 30; q++) {
			const h = q * 6;
			const fa = Math.pow(1 - h / 180, 1.6);
			const x = 960 + wx + side * 0.025 * h;
			const y = yw - h;
			blit(g, A.spr.iceW, x, y, 3.0, fa * 0.7 * handA * (0.6 + 0.4 * Math.sin(t * 2.3 + q)));
		}
	}
	g.globalAlpha = 1;
	return pts;
};

export const drawS1 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t < 38.1 || t > 87.55) return;
	const sceneA = win(t, 38.2, 58.4, 0.7, 1.0);
	// ---------- 水盆 ----------
	if (sceneA > 0) {
		const warm = prog(t, 50.7, 52.4);
		const wc = mixc(ICE, SILVER, warm * 0.8);
		const gr = g.createLinearGradient(0, 560, 0, 700);
		gr.addColorStop(0, rgba(wc, 0.07 * sceneA));
		gr.addColorStop(1, rgba(wc, 0));
		g.fillStyle = gr;
		tracePath(g, [[600, 560], [632, 700], [1288, 700], [1320, 560]], true);
		g.fill();
		beam(g, [[600, 560], [632, 700], [1288, 700], [1320, 560]], DIM, 1.6, 0.5 * sceneA, false, 0.15);
		const wave: P[] = [];
		for (let x = 600; x <= 1320; x += 6) wave.push([x, 560 + 3 * Math.sin((2 * Math.PI * (x + 40 * t)) / 220)]);
		beam(g, wave, wc, 1.5, 0.6 * sceneA, false, 0.35);
		for (const tc of contacts) {
			if (t < tc || t > tc + 1.7) continue;
			const p = (t - tc) / 1.5;
			if (p <= 1) ellipse(g, 960, 562, 280 * easeOut(p), 0.12 * 280 * easeOut(p), ICE, 1.2, 0.6 * (1 - p) * sceneA);
			const p2 = (t - tc - 0.2) / 1.5;
			if (p2 > 0 && p2 <= 1) ellipse(g, 960, 562, 170 * easeOut(p2), 0.12 * 170 * easeOut(p2), ICE, 1.0, 0.4 * (1 - p2) * sceneA);
		}
	}
	// ---------- 手 ----------
	const yw = wristY(t);
	const handA = (1 - smooth((t - 57.4) / 1.0)) * (t >= 38.6 ? 1 : 0);
	if (handA > 0 && yw > -370) {
		const s = t < 47.3 ? sim1(t) : sim2(t);
		const cool = t < 40.0 ? 0 : t < 45.9 ? 1 - Math.exp(-sim1(t) / 14) : t < 47.3 ? lerp(1 - Math.exp(-60 / 14), 0, smooth((t - 45.3) / 1.2)) : 1 - Math.exp(-sim2(t) / 14);
		drawHand(g, t, D, A, yw, handA, cool);
		// 霜点（手背和水下的手指上，一颗颗长出来）
		let nf = (40 * coldP(s)) / 8;
		if (t >= 45.1 && t < 47.3) nf *= 1 - smooth((t - 45.1) / 0.55);
		if (t < 40.2) nf = 0;
		const sx = t < 45.9 ? 1 : t < 46.5 ? 1 - 2 * swapP(t) : -1;
		for (let i = 0; i < D.frost.length; i++) {
			const a = clamp(nf - i);
			if (a <= 0) continue;
			const f = D.frost[i];
			let x = 960 + sx * f.x;
			const y = yw + f.y;
			if (y > 560) x += 2;
			const tw = 0.5 + 0.5 * Math.sin(t * 4.2 + f.ph);
			glow(g, x, y, f.r * 4.6, ICE_W, a * handA * (0.45 + 0.55 * tw), 0.3);
		}
	}
	// ---------- 计时线 ----------
	const rise = riseP(t);
	const lineFade = t > 80.7 ? lerp(1, 0.6, prog(t, 80.7, 82.2)) : 1;
	const upperOut = 1 - smooth((t - 86.6) / 0.8);
	const reveal = prog(t, 68.7, 69.5);
	const s1 = sim1(t);
	const s2 = sim2(t);
	// 第一次那根：第二次开始后压到 0.35；升上来时亮回和第二次一样（两个选项一样亮）；揭晓后压暗
	const m1 = lerp(t < 45.1 ? 1 : lerp(1, 0.35, prog(t, 45.1, 45.9)), 1, rise) * lerp(1, 0.4, reveal) * lineFade * upperOut;
	const m2 = lerp(1, 1.12, reveal) * lineFade;
	const qPhase = win(t, 59.0, 68.7, 0.5, 0.3); // 提问留白里：两根线上同时走光脉冲（同样的速度，上面那根先走到头）
	const afterPhase = win(t, 69.6, 86.6, 0.6, 0.8); // 揭晓之后：下面那根继续走
	const pulse = (x: number, xEnd: number, amp: number, t0: number, per: number) => {
		const px = pulseX(t, t0, per);
		if (px > xEnd + 30) return 0;
		return amp * Math.exp(-(((x - px) / 50) ** 2));
	};
	const kAt = (sMax: number, mul: number, which: 1 | 2) => (x: number): [RGB, number] => {
		const s = clamp((x - 420) / 12, 0, sMax);
		let k = timerK(s) * mul;
		const xEnd = 420 + 12 * sMax;
		k += pulse(x, xEnd, 0.75 * qPhase, 59.2, 3.6);
		if (which === 2) k += pulse(x, xEnd, 0.55 * afterPhase, 70.0, 3.6);
		return [ICE, k];
	};
	if (t >= 40.2 && s1 > 0.2) {
		const pts = timerPts(0, s1, 1, t);
		beamX(g, pts, TIMER_W, kAt(60, m1, 1), 80);
		if (t < 43.8) glow(g, ...timerPt(s1, 1, t), 20, ICE_W, 0.95 * (1 - smooth((t - 43.6) / 0.2)), 0.3);
	}
	// 60 秒处的短竖帽（升上来时收走：竖线会读成坐标刻度）
	if (t >= 43.6 && t < 58.1) {
		const capK = 0.75 * smooth((t - 43.6) / 0.25) * (1 - smooth((t - 57.6) / 0.4));
		beam(g, [[1140, 769], [1140, 791]], ICE, 1.4, capK, false, 0.4);
	}
	if (t >= 47.3 && s2 > 0.2) {
		beamX(g, timerPts(0, s2, 2, t), TIMER_W, kAt(90, m2, 2), 100);
		if (t < 52.6) glow(g, ...timerPt(s2, 2, t), 20, ICE_W, 0.95 * (1 - smooth((t - 52.4) / 0.2)), 0.3);
	}
	// 升上来之后：两个结尾一样亮地呼吸；光脉冲走到头时闪一下
	if (t >= 58.4) {
		const br = 0.8 + 0.2 * Math.sin((2 * Math.PI * (t - 58.4)) / 3);
		const a = smooth((t - 58.4) / 0.6) * lineFade;
		const endFlash = (xEnd: number, t0: number, per: number, amp: number) => {
			const tt = (((t - t0) % per) + per) % per;
			const tr = (xEnd - 420) / 360;
			return amp * Math.exp(-(((tt - tr) / 0.18) ** 2));
		};
		const f1 = endFlash(1140, 59.2, 3.6, qPhase);
		const f2 = endFlash(1500, 59.2, 3.6, qPhase) + endFlash(1500, 70.0, 3.6, 0.7 * afterPhase);
		const e1 = 0.6 * br * a * lerp(1, 0.35, reveal) * upperOut + 0.5 * f1;
		haze(g, 1140, UP_Y, 80, ICE, 0.14 * e1);
		glow(g, 1140, UP_Y, 28, ICE_W, e1, 0.3);
		if (t < 68.7) {
			const e2 = 0.6 * br * a + 0.5 * f2;
			haze(g, 1500, LO_Y, 80, ICE, 0.14 * e2);
			glow(g, 1500, LO_Y, 28, ICE_W, e2, 0.3);
		} else {
			haze(g, 1500, LO_Y, 90, GOLD, 0.12 * f2 * (1 - smooth((t - 85.5) / 1.2)));
		}
	}
	// 问号背后一团呼吸的金光（问号本身是 DOM 字）
	if (t >= 58.2 && t < 68.6) {
		const br = 0.62 + 0.38 * Math.sin((2 * Math.PI * (t - 58.2)) / 3 - Math.PI / 2);
		const a = smooth((t - 58.2) / 1.0) * (1 - smooth((t - 68.25) / 0.2));
		haze(g, Q_POS[0], Q_POS[1] - 5, 190, GOLD, 0.18 * a * br);
		haze(g, Q_POS[0], Q_POS[1] - 5, 70, GOLD, 0.14 * a * br);
	}
	// 2026-10-12 审铃声：原来 68.7 的 bell 响时问号才开始缩，金点 69.2 才落地放环（铃声比画面早半秒）。
	// 现在 68.25 问号缩成金点、68.3–68.7 飞过去，正好在揭晓那一拍（bell、和弦、字幕 L9）落到 90 秒末端，两圈金环
	if (t >= 68.25 && t < 87.5) {
		const fly = easeInOut(prog(t, 68.3, 68.7, (x) => x));
		const b: P = [1500, LO_Y];
		const x = lerp(Q_POS[0], b[0], fly);
		const y = lerp(Q_POS[1], b[1], fly) - 40 * Math.sin(Math.PI * fly);
		const land = t - 68.7;
		const breath = 0.85 + 0.15 * Math.sin(t * 2.1);
		const k = smooth((t - 68.25) / 0.12) * (land > 0 ? breath : 1) * (1 - smooth((t - 85.5) / 1.2));
		mdot(g, x, y, land > 0 ? 14 : 12, GOLD, k);
		if (land > 0 && land < 1.6) {
			for (const d of [0, 0.28]) {
				const p = (land - d) / 1.2;
				if (p > 0 && p < 1) arc(g, b[0], b[1], 160 * easeOut(p), GOLD, 1.4, 0.65 * (1 - p), 0, Math.PI * 2, 0.4);
			}
			haze(g, b[0], b[1], 180, GOLD, 0.2 * (1 - land / 1.6));
		}
	}
	// 74.5–80.4：多出来的那 30 秒上，12 颗霜点冒出来，一闪一闪地往上飘散
	if (t >= 74.5 && t < 80.6) {
		const a = win(t, 74.5, 80.5, 0.6, 0.7);
		// 终版复看：12 颗 → 24 颗，飘得更高（70 → 110 px）、光晕 9 → 12（这 6 秒是全片运动量最低的一段）
		for (let i = 0; i < 24; i++) {
			const s = 60 + (30 * (i + 0.5)) / 24;
			const [x0, y0] = timerPt(s, 2, t);
			const ap = smooth((t - 74.6 - i * 0.06) / 0.3);
			const per = 2.0 + 1.0 * hash2(i, 7, 14);
			const ph = (((t - 74.6 - i * 0.06) / per + hash2(i, 6, 14)) % 1 + 1) % 1;
			const tw = 0.5 + 0.5 * Math.sin(t * 3.7 + 6.283 * hash2(i, 4, 14));
			const x = x0 + (hash2(i, 5, 14) - 0.5) * 12 + 18 * Math.sin(ph * 3 + i);
			const y = y0 - 10 - 110 * ph;
			glow(g, x, y, 12, ICE_W, a * ap * (0.35 + 0.65 * tw) * Math.sin(Math.PI * Math.min(1, ph * 1.4 + 0.15)), 0.3);
		}
	}
	// 80.7–86.7：两根线上冒出缓慢上升的冷气粒子
	if (t >= 80.4 && t < 87.5) {
		const a = win(t, 80.4, 87.4, 1.0, 0.9);
		for (let i = 0; i < 28; i++) {
			const which: 1 | 2 = i % 3 === 0 ? 1 : 2;
			const sMax = which === 1 ? 60 : 90;
			const s = sMax * hash2(i, 1, 81);
			const [x0, y0] = timerPt(s, which, t);
			const per = 3.0 + 1.5 * hash2(i, 2, 81);
			const ph = (((t - 80.4) / per + hash2(i, 3, 81)) % 1 + 1) % 1;
			const x = x0 + 10 * Math.sin(ph * 4 + i);
			const y = y0 - 6 - 90 * ph;
			blit(g, A.spr.ice, x, y, 7, a * 0.45 * Math.sin(Math.PI * ph) * (which === 1 ? 0.6 : 1));
		}
		g.globalAlpha = 1;
	}
	void frame;
};
