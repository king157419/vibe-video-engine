/** 06 今天（244.65–284.5）：诗句散成粒子，落成本片自己的曲线 F(t)（由 cue.json 真算）
 *  → 此刻点按真实时间爬 → 留白（此刻点跟着属和弦一拍一拍地呼吸）→ 峰、终两颗金点 → 和 0:25 同一个动作：一秒一闪、整条熄掉
 *  → 终点飞到中心 → 今天这条线接上它，它成了笔尖 → 片尾片名。
 *  审片修改：曲线不再像折线图 —— 不画 fade_in / fade_out 那两截竖线；静音画成线上的一个断口（两端各一点微光）；
 *  未来段不画点阵，只留一层极淡的连续辉光；纵向拉开；亮度随 F 变（读起来是一道光，不是一张图）；标签只留金色「峰」「终」。 */
import {clamp, easeInOut, hash2, lerp, prog, smooth, win} from '../../kit/util';
import type {Assets} from '../assets';
import type {Data} from '../data';
import {arc, beam, beamX, blit, comet, type Ctx, glow, GOLD, haze, ICE, ICE_W, mdot, mixc, type P, partial, qbez, type RGB, WHITE} from '../fx';
import {toReal} from '../warp';
import {drawTitle} from './title';

const POEM_Y = [400, 480];
const BEAT = 60 / 64;
const CURVE_W = 2.8;

export const drawS6 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t < 244.4) return;
	const C = D.curve;
	const fc = D.num.film_curve;
	const [g0, g1] = D.gap;
	// 2026-10-12：t 是旧时间轴（动作时刻），本片曲线和「此刻」点用真实时间 tr（曲线由新 cue.json 算，片长 291.4 s）
	const tr = toReal(t);
	const FORMED_AT = toReal(248.6);
	const tc = clamp(tr, D.CT0, D.CT1);
	const xNow = D.fx(tc);
	const yNow = D.fy(D.fc.at(tc));
	// ---------- 诗句散成粒子，落到曲线上 ----------
	const formed = prog(t, 244.8, 248.6, (x) => x); // 曲线从左往右「落成」的进度
	if (t < 249.4) {
		const pts = [...A.poem1.map((q) => ({...q, line: 0})), ...A.poem2.map((q) => ({...q, line: 1}))];
		const N = pts.length;
		// 按 x 排名分配到曲线上（左边的字落到曲线左段）
		const order = pts.map((q, i) => ({i, x: q.p[0] + q.line * 3})).sort((a, b) => a.x - b.x);
		const rank = new Int32Array(N);
		order.forEach((o, r) => (rank[o.i] = r));
		const past = C.filter((c) => c.t <= FORMED_AT);
		for (let i = 0; i < N; i++) {
			const q = pts[i];
			const f = rank[i] / (N - 1);
			const st = 244.8 + 2.3 * f * 0.9 + 0.25 * hash2(i, 1, 61);
			const u = easeInOut(clamp((t - st) / 1.5));
			if (u >= 1) continue;
			const src: P = [960 + q.p[0], POEM_Y[q.line] + q.p[1]];
			const tg = past[Math.min(past.length - 1, Math.floor(f * (past.length - 1)))];
			const dst: P = [tg.x, tg.y];
			const ctl: P = [lerp(src[0], dst[0], 0.4) + (hash2(i, 2, 61) - 0.5) * 140, lerp(src[1], dst[1], 0.5) + 60 + 60 * hash2(i, 3, 61)];
			const [x, y] = qbez(src, ctl, dst, u);
			const gold = q.line === 0 && (q.ci === 5 || q.ci === 6);
			const ice = q.line === 1 && (q.ci === 2 || q.ci === 3);
			// 静止时和压暗后的诗句一样暗，一动起来才亮
			const a = smooth((t - 244.5) / 0.3) * (0.35 + 0.65 * Math.min(1, u * 4)) * (1 - smooth((u - 0.85) / 0.15));
			blit(g, gold ? A.spr.gold : ice ? A.spr.ice : A.spr.iceW, x, y, 3.6, a * 0.85);
		}
		g.globalAlpha = 1;
	}
	// ---------- 本片曲线 ----------
	const curveA = 1 - smooth((t - 270.5) / 2.0);
	if (t >= 244.8 && curveA > 0) {
		const shownT = lerp(D.CT0, FORMED_AT, formed);
		const lim = Math.min(tr, shownT);
		const segA: P[] = [];
		const segB: P[] = [];
		for (const c of C) {
			if (c.t > lim) break;
			(c.t < g0 ? segA : segB).push([c.x, c.y]);
		}
		if (tr <= shownT || formed >= 1) (lim < g0 ? segA : segB).push([xNow, yNow]);
		// 268.95–270.5：一秒一颗小点从左到右一闪，扫过的地方熄到 0.1
		const sweepX = t < 268.95 ? -1e9 : lerp(140, xNow + 20, prog(t, 268.95, 270.5, (x) => x));
		// 沿线走的光脉冲（4.2 s 一次）
		const pulseK = win(t, 249.0, 268.9, 1.0, 0.6);
		const pX = 160 + (xNow - 160) * ((t - 249.0) / 4.2 - Math.floor((t - 249.0) / 4.2));
		const xL = D.fx(D.CT0);
		const qAt = (x: number) => D.fq(D.fc.at(clamp(((x - 160) * D.num.dur) / 1600, D.CT0, D.CT1)));
		const sweepS = (x: number) => smooth((sweepX - x) / 60);
		const lead = (x: number) => smooth((x - xL) / 60); // 左端从暗里淡入（不画竖线）
		// 三层：芯（每处都有，越响越亮）→ 中层（响的地方变粗）→ 外层辉光（只有最响的那几段）
		const fCore = (x: number): [RGB, number] => {
			const q = qAt(x);
			const s = sweepS(x);
			const pulse = 0.55 * pulseK * Math.exp(-(((x - pX) / 70) ** 2));
			return [mixc(ICE, ICE_W, 0.6 * q * q), (lerp(0.32 + 0.95 * q ** 1.5, 0.1, s) + pulse * (1 - s)) * curveA * lead(x)];
		};
		const xr: [number, number] = [xL, D.fx(D.CT1)];
		// 响的地方变粗：沿线每 9 px 一团径向光（宽描边配横向渐变会在响度跳变处出现方形光块，所以不用描边）
		const xEndDrawn = segB.length ? segB[segB.length - 1][0] : segA.length ? segA[segA.length - 1][0] : xL;
		for (let x = xL; x <= xEndDrawn; x += 9) {
			if (x > D.fx(g0) - 3 && x < D.fx(g1) + 3) continue;
			const q = qAt(x);
			if (q < 0.04) continue;
			const k = (1 - sweepS(x)) * curveA * lead(x);
			if (k <= 0.01) continue;
			const c = mixc(ICE, ICE_W, 0.5 * q);
			haze(g, x, 470, 10 + 26 * q * q, c, 0.07 * q * q * k);
			if (q > 0.6) haze(g, x, 470, 40 + 70 * q ** 3, mixc(ICE, ICE_W, 0.3), 0.022 * q ** 4 * k);
		}
		for (const seg of [segA, segB]) {
			if (seg.length < 2) continue;
			beamX(g, seg, CURVE_W, fCore, 200, 0.5, xr, 7.5);
		}
		// 249–270.4：一串光粒沿已经画出的线一直往右流（本片的声音一直在走），越响的地方越亮、越大；扫灭时一起熄
		const flowK = win(t, 249.0, 270.4, 1.2, 0.8);
		const span = xEndDrawn - xL;
		if (flowK > 0 && span > 40) {
			for (let i = 0; i < 90; i++) {
				const sp = 70 + 150 * hash2(i, 1, 249);
				const xx = xL + ((((t - 249.0) * sp + hash2(i, 2, 249) * 2000) % span) + span) % span;
				if (xx > D.fx(g0) - 6 && xx < D.fx(g1) + 6) continue;
				const q = qAt(xx);
				const edge = Math.min(1, (xx - xL) / 60, (xEndDrawn - xx) / 40);
				const a = flowK * (0.18 + 0.82 * q) * (1 - sweepS(xx)) * edge * (0.75 + 0.25 * Math.sin(t * 3 + i));
				if (a <= 0.01) continue;
				blit(g, q > 0.75 ? A.spr.warm : A.spr.iceW, xx, 470 + (hash2(i, 3, 249) - 0.5) * (3 + 8 * q), 2.6 + 4.5 * q, 0.8 * a);
			}
			g.globalAlpha = 1;
		}
		// 静音断口两端各一点微光
		if (lim >= g0) {
			const ga = curveA * (1 - smooth((sweepX - D.fx(g0)) / 60) * 0.85);
			glow(g, D.fx(g0), D.fy(D.fc.at(g0 - 0.01)), 8, ICE_W, 0.7 * ga, 0.35);
			if (lim >= g1) glow(g, D.fx(g1), D.fy(D.fc.at(g1 + 0.01)), 8, ICE_W, 0.55 * ga, 0.35);
		}
		// 还没到的部分：一层极淡的连续辉光（不画点阵 / 虚线），轻轻闪
		if (formed >= 1 && tr < D.CT1) {
			const fut: P[] = [];
			for (const c of C) if (c.t > tr) fut.push([c.x, c.y]);
			if (fut.length >= 2) {
				const sh = 0.75 + 0.25 * Math.sin(t * 2.0);
				beam(g, fut, ICE, 2.0, 0.07 * sh * curveA, false, 0);
			}
		}
		if (sweepX > 0) {
			for (let s = Math.ceil(D.CT0); s <= Math.floor(tc); s++) {
				if (s > g0 && s < g1) continue;
				const x = D.fx(s);
				const d = sweepX - x;
				if (d < 0 || d > 120) continue;
				const fl = Math.exp(-((d / 40) ** 2));
				glow(g, x, D.fy(D.fc.at(s)), 9, ICE_W, 0.9 * fl, 0.4);
			}
		}
		// 此刻点：留白里跟着属和弦一拍一拍地呼吸（0.9375 s）
		const nowK = smooth((t - 248.3) / 0.5) * (1 - smooth((t - 270.5) / 1.0));
		if (nowK > 0) {
			const beatPh = ((t - 255.45) / BEAT) % 1;
			const bt = t > 255.45 && t < 261.45 ? Math.exp(-beatPh * 3.2) : 0;
			const head = segB.length >= 2 ? segB : segA;
			if (head.length >= 2) comet(g, head, 60, ICE_W, CURVE_W, 0.8 * nowK);
			haze(g, xNow, yNow, 50 + 40 * bt, ICE, (0.22 + 0.2 * bt) * nowK);
			glow(g, xNow, yNow, 14 + 6 * bt, ICE_W, nowK, 0.35);
		}
	}
	// ---------- 261.45：峰、终两颗金点 ----------
	const pk: P = [D.fx(fc.peak.t), D.fy(fc.peak.F)];
	const en: P = [D.fx(fc.end.t), D.fy(fc.end.F)];
	if (t >= 261.45 && t < 273.4) {
		const on = smooth((t - 261.45) / 0.35);
		const fl = Math.exp(-(((t - 261.6) / 0.3) ** 2));
		const br = 0.85 + 0.15 * Math.sin((t - 261.45) * 2.0);
		const pkK = on * br * (1 - smooth((t - 270.5) / 0.9));
		mdot(g, pk[0], pk[1], 22, GOLD, pkK * (1 + 0.6 * fl));
		// 终点：270.5–272.7 飞到画面中心，272.7 正好落稳
		const fly = easeInOut(prog(t, 270.5, 272.7, (x) => x));
		const p: P = qbez(en, [lerp(en[0], 960, 0.5), 260], [960, 470], fly);
		const r = lerp(22, 26, fly);
		const land = Math.exp(-(((t - 272.75) / 0.18) ** 2));
		mdot(g, p[0], p[1], r, GOLD, on * (fly > 0 ? 1 : br) * (1 + 0.6 * fl + 0.5 * land));
		if (fly > 0 && fly < 1) {
			const tail: P[] = [];
			for (let q = 0; q <= 14; q++) tail.push(qbez(en, [lerp(en[0], 960, 0.5), 260], [960, 470], easeInOut(prog(t - 0.025 * (14 - q), 270.5, 272.7, (x) => x))));
			comet(g, tail, 200, GOLD, 2.6, 0.9);
		}
		if (fl > 0.01) {
			haze(g, pk[0], pk[1], 140, GOLD, 0.28 * fl);
			haze(g, en[0], en[1], 140, GOLD, 0.28 * fl);
		}
	}
	// ---------- 今天这条线：接到中心那颗点上，它成了笔尖 ----------
	// 2026-10-12 审铃声：原来 273.4 的 bell 响时画面上什么都没发生。现在线画到中心金点、金点变成笔尖的那一刻（275.51 = 片尾旋律第 15 拍）
	// bell 响，画面同一刻闪一下、放一圈冰白的环
	const JOIN = 275.51;
	if (t >= 272.7 && t < 280.0) {
		const lp = easeInOut(prog(t, 273.1, JOIN, (x) => x));
		const fadeL = 1 - smooth((t - 278.5) / 0.8);
		if (lp > 0) {
			const pts = partial(D.todayPts, lp);
			beam(g, pts, ICE, 3.2, 0.95 * fadeL, false, 0.55);
			if (lp < 1) {
				const h = pts[pts.length - 1];
				comet(g, pts, 70, ICE_W, 3.2, 0.9);
				glow(g, h[0], h[1], 13, ICE_W, 0.85, 0.3);
			}
		}
		// 中心那颗点：金 → 冰白，变成笔尖，呼吸；278.5 炸开
		const toIce = smooth((t - (JOIN - 0.05)) / 0.6);
		const br = t > JOIN + 0.6 ? 0.85 + 0.15 * Math.sin((t - JOIN - 0.6) * 2.4) : 1;
		const k = (t < 273.4 ? 1 : br) * (1 - smooth((t - 278.5) / 0.25));
		const c = mixc(GOLD, ICE_W, toIce);
		mdot(g, 960, 470, lerp(26, 16, toIce), c, k);
		if (toIce > 0) glow(g, 960, 470, 6, mixc(c, WHITE, 0.6), k, 0.5);
		const burst = Math.exp(-(((t - 278.55) / 0.2) ** 2));
		if (burst > 0.01) haze(g, 960, 470, 300, ICE_W, 0.38 * burst);
		const jn = t - JOIN;
		if (jn > -0.3 && jn < 1.3) {
			haze(g, 960, 470, 170, ICE_W, 0.3 * Math.exp(-((jn / 0.2) ** 2)));
			const p = jn / 1.1;
			if (p > 0 && p < 1) arc(g, 960, 470, 22 + 110 * Math.sin((Math.PI / 2) * p), ICE_W, 1.3, 0.55 * (1 - p), 0, Math.PI * 2, 0.4);
		}
	}
	// ---------- 片尾片名 ----------
	drawTitle(g, t, D, A, {t0: 278.5, from: [[960, 470], [960, 470]], glyphIn: 280.3, out0: 284.4, out1: 284.6});
	void frame;
};
