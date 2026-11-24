/** 04 生（163.95–204.45）：灰唱片缩成一个点 → 一生的螺旋（79 圈 × 365）→ 只有 36 颗被想起
 *  → 螺旋像河一样流成一支笔 → 满屏奇观：人生线 A 冲顶，两万八千多个日子铺满整屏 → 硬切全黑、硬静音
 *  → 人生线 B（在 A 下方的平行轨道上）多出五年 → 两颗记忆光点：A 亮金；B 的点更多，光点却更小、更灰。 */
import {clamp, easeInOut, easeOut, hash2, lerp, prog, smooth} from '../../kit/util';
import type {Assets} from '../assets';
import {B_OFF, type Data, lifeA, lifeBext} from '../data';
import {arc, beam, blit, comet, type Ctx, glow, GOLD, GOLD_C, GREY, haze, ICE, ICE_W, mdot, mixc, type P, partial, qbez, rgba, SILVER, star} from '../fx';
import {drawRecord} from './s3';

export const CUT = 188.95;
export const CUT_END = 190.25;
const RIVER_T: P = [200, 640];
const LIFE_W = 3.4;

/** 第 d 天在螺旋里出现的时刻 */
const dayIn = (d: number) => 165.6 + 0.04 * (d / 365);

/** 三次贝塞尔 */
const cub = (a: P, b: P, c: P, d: P, u: number): P => {
	const v = 1 - u;
	const w0 = v * v * v;
	const w1 = 3 * v * v * u;
	const w2 = 3 * v * u * u;
	const w3 = u * u * u;
	return [w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0], w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1]];
};
// 河道：所有日子共用中间两个控制点，中段挤成一条带（像河），不再是一圈套一圈的漏斗
const RIVER_C1: P = [860, 560];
const RIVER_C2: P = [470, 700];

export const drawS4 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t < 163.95 || t > 204.5) return;
	const days = D.num.life.days;
	const S = D.spiral;
	// ---------- 灰唱片缩成一颗点 ----------
	if (t < 165.8) {
		const sh = easeInOut(prog(t, 164.35, 165.6, (x) => x));
		if (sh < 1) drawRecord(g, Math.min(t, 163.9), D, {k: 0.6 * (1 - sh * 0.3), scale: 1 - sh, toIce: sh, crackK: 0.15 * (1 - sh)});
		const k = smooth((t - 164.9) / 0.6);
		if (k > 0) {
			const c = 1 / Math.max(1, t >= 165.6 ? 1.6 : 1); // 镜头切到 1.6 时，点的屏幕大小不变
			haze(g, 960, 470, 50 * c, ICE_W, 0.3 * k);
			glow(g, 960, 470, 15 * c, ICE_W, k, 0.3);
		}
	}
	// ---------- 一生的螺旋 ----------
	if (t >= 165.6 && t < 181.2) {
		// 审片修改：熄到 0.17/0.42（原 0.06/0.42 等于看不见），留成一个幽灵圆盘
		const fadeAll = lerp(1, 0.2 / 0.42, prog(t, 171.0, 172.6));
		const numA = clamp(Math.min((t - 168.8) / 0.5, (172.0 - t) / 0.7));
		const rot = t > 171 ? ((0.5 * Math.PI) / 180) * (t - 171) : 0;
		const cr = Math.cos(rot);
		const sr = Math.sin(rot);
		const leaving = t >= 177.0;
		const NB = 16;
		const buckets: Path2D[] = Array.from({length: NB}, () => new Path2D());
		const bucketA = new Float32Array(NB);
		const fresh: number[] = [];
		const gold: number[] = [];
		const baseA = 0.42 * fadeAll;
		const bandA = (r: number) => baseA * (1 - 0.8 * numA * smooth((210 - r) / 90));
		// 1.1 px 的点排成同心的螺线会出摩尔纹：点改成 1.4 px，并用 hash2 在半径方向抖 ±0.6 px；透明度相应压一档
		const DOT = 1.4;
		const AK = 0.7;
		if (!leaving) for (let b = 0; b < 10; b++) bucketA[b] = AK * bandA(b * 25 + 12.5);
		for (let d = 0; d < days; d++) {
			const ta = dayIn(d);
			if (t < ta) break;
			const jr = (hash2(d, 3, 79) - 0.5) * 1.2;
			const ox = S[2 * d] - 960;
			const oy = S[2 * d + 1] - 470;
			const rr = D.spiralR[d];
			const sx = 960 + ox * (1 + jr / rr);
			const sy = 470 + oy * (1 + jr / rr);
			let x = 960 + (sx - 960) * cr - (sy - 470) * sr;
			let y = 470 + (sx - 960) * sr + (sy - 470) * cr;
			let a = baseA;
			let bi = 0;
			if (!leaving) bi = Math.min(9, Math.floor(rr / 25));
			else {
				// 同一圈的日子不再一起走（那样看到的是一圈圈缩小的环 = 漏斗）：外圈先走，再加 1.4 s 的随机延迟，圈就散成一股流
				const tl = 177.0 + 1.8 * (1 - d / days) + 1.4 * hash2(d, 9, 79);
				const u = clamp((t - tl) / 1.8);
				if (u >= 1) continue;
				if (u > 0) {
					const e = easeInOut(u);
					const c1: P = [lerp(x, RIVER_C1[0], 0.85), lerp(y, RIVER_C1[1], 0.85)];
					[x, y] = cub([x, y], c1, RIVER_C2, RIVER_T, e);
					a = lerp(a, 0.42, smooth(u * 4)) * (1 - smooth((u - 0.8) / 0.2));
				}
				bi = Math.min(NB - 1, Math.floor((a / 0.42) * NB));
			}
			if (D.goldenSet.has(d) && t > 171.0) {
				gold.push(d, x, y, a);
				continue;
			}
			if (t - ta < 0.3) {
				fresh.push(x, y, 1 - (t - ta) / 0.3);
				continue;
			}
			buckets[bi].rect(x - DOT / 2, y - DOT / 2, DOT, DOT);
		}
		if (leaving) for (let b = 0; b < NB; b++) bucketA[b] = AK * ((b + 0.5) / NB) * 0.42;
		const dayC = mixc(SILVER, ICE, 0.5);
		buckets.forEach((p, i) => {
			if (bucketA[i] <= 0.002) return;
			g.fillStyle = rgba(dayC, bucketA[i]);
			g.fill(p);
		});
		for (let i = 0; i < fresh.length; i += 3) blit(g, A.spr.iceW, fresh[i], fresh[i + 1], 3.6, 0.55 * fresh[i + 2]);
		g.globalAlpha = 1;
		// 36 颗被想起的日子：饱和的金，r 3.5，光晕约 20 px，慢慢闪
		const gk = smooth((t - 171.0) / 1.6);
		for (let i = 0; i < gold.length; i += 4) {
			const d = gold[i];
			const tw = 0.65 + 0.35 * Math.sin(t * 1.5 + 6.283 * hash2(d, 1, 36));
			const x = gold[i + 1];
			const y = gold[i + 2];
			const lv = leaving ? Math.min(1, clamp(gold[i + 3] / 0.06)) : 1;
			const k = gk * tw * lv;
			haze(g, x, y, 22, GOLD, 0.4 * k);
			glow(g, x, y, 9, GOLD, 0.9 * k, 0.25);
			glow(g, x, y, 3.5, GOLD_C, k, 0.5);
		}
		// 螺旋生长的那一头
		if (t < 168.9) {
			const d = Math.min(days - 1, Math.floor(((t - 165.6) / 0.04) * 365));
			glow(g, S[2 * d], S[2 * d + 1], 14, ICE_W, 0.85, 0.3);
		}
	}
	// ---------- 河流汇成笔尖 ----------
	if (t >= 177.5 && t < 184.2) {
		const arrived = smooth((t - 177.6) / 3.4);
		const breath = t > 181 ? 0.85 + 0.15 * Math.sin((t - 181) * 2.2) : 1;
		const k = arrived * breath * (1 - smooth((t - 183.6) / 0.5));
		haze(g, RIVER_T[0], RIVER_T[1], 130, ICE, 0.24 * k);
		glow(g, RIVER_T[0], RIVER_T[1], 22, ICE_W, k, 0.3);
	}
	// ---------- 满屏奇观：人生线 A ----------
	// 笔越画越快（u = x²）；走过的地方日子一颗颗亮起，整段已画过的线都在持续往外喷，飞向铺满整个画面的落点（easeOut）。
	// 每颗画成一段 0.07 s 前 → 现在的光痕（刚出发时最快，像烟花）；最后 1.5 s 整体推向金色（金 = 记忆）。
	const W = D.wow;
	// 183.4–183.9：笔尖的光晕慢慢升起来（不再在 183.75 一帧跳大）
	const penUp = smooth((t - 183.35) / 0.55);
	if (t >= 183.35 && t < CUT) {
		const x = prog(t, 183.75, 188.75, (q) => q);
		const up = x * x;
		const pen = lifeA(up);
		const glowUp = smooth((t - 184.6) / 3.9);
		const goldUp = smooth((t - 187.2) / 1.5);
		const pos = (k: number, age: number): P => {
			const du = W[6 * k + 5];
			const e = easeOut(age / du) + 0.03 * Math.max(0, age - du);
			return [lerp(W[6 * k], W[6 * k + 2], e), lerp(W[6 * k + 1], W[6 * k + 3], e)];
		};
		if (t >= 183.75) {
			// 底层：沿人生线和笔尖的大片辉光（不是整屏平涂），越到最后越金
			haze(g, 960, 520, 1300, mixc(ICE, GOLD, 0.3 + 0.6 * goldUp), 0.09 * glowUp);
			haze(g, pen[0], pen[1], 700 + 500 * x, mixc(ICE_W, GOLD, 0.25 + 0.7 * goldUp), 0.08 + 0.13 * glowUp);
			const NB = 3;
			const paths: Path2D[] = Array.from({length: NB * 2}, () => new Path2D());
			const halo: number[] = [];
			const goldFrac = lerp(0.2, 0.9, Math.max(glowUp * 0.45, goldUp));
			for (let k = 0; k < days; k++) {
				const te = W[6 * k + 4];
				const age = t - te;
				if (age < 0) continue;
				const [px, py] = pos(k, age);
				if (py > 1180 || py < -100 || px < -120 || px > 2040) continue;
				const [qx, qy] = pos(k, Math.max(0, age - 0.07));
				const fadeSub = py > 905 ? 0.4 : 1; // 字幕带里的点画淡一档
				const gold = hash2(k, 3, 7) < goldFrac;
				const tier = fadeSub < 1 ? 0 : hash2(k, 4, 7) < 0.25 ? 2 : 1;
				const path = paths[(gold ? NB : 0) + tier];
				path.moveTo(qx, qy);
				path.lineTo(px + 0.01, py);
				if (age < 0.5 && halo.length < 1500) halo.push(px, py, 1 - age / 0.5);
			}
			g.lineCap = 'round';
			const tierA = [0.18, 0.72, 1.0];
			const tierW = [1.2, 1.5, 2.3];
			for (let i = 0; i < NB * 2; i++) {
				const gold = i >= NB;
				const tier = i % NB;
				g.strokeStyle = rgba(gold ? mixc(GOLD_C, GOLD, 0.35 + 0.55 * goldUp) : mixc(ICE, ICE_W, 0.6), tierA[tier] * (gold ? 1.0 : 0.85));
				g.lineWidth = tierW[tier] + 0.6 * glowUp;
				g.stroke(paths[i]);
			}
			for (let i = 0; i < halo.length; i += 3) blit(g, glowUp > 0.45 ? A.spr.gold : A.spr.iceW, halo[i], halo[i + 1], 6 + 5 * halo[i + 2], 0.42 * halo[i + 2]);
			g.globalAlpha = 1;
			const pts = D.lifeAPts.filter((p) => p[0] <= pen[0]);
			pts.push(pen);
			beam(g, pts, mixc(ICE, mixc(ICE_W, GOLD, goldUp), x), LIFE_W, 0.8 + 0.7 * x, false, 0.75);
			comet(g, pts, 120 + 160 * x, mixc(ICE_W, GOLD_C, glowUp), LIFE_W, 1.0);
		}
		haze(g, pen[0], pen[1], (180 + 160 * x) * penUp, mixc(ICE_W, GOLD, 0.2 + 0.6 * glowUp), (0.3 + 0.2 * x) * penUp);
		star(g, pen[0], pen[1], (12 + 12 * x) * (0.6 + 0.4 * penUp), mixc(ICE_W, GOLD_C, glowUp), 1.25 * penUp);
	}
	// ---------- 硬切：满屏的日子、光晕、笔尖和声音在同一帧消失 ----------
	// 2026-10-12 用户反馈「多停一会，都没反应过来就继续了」：硬静音 1.3 → 3.0 s（warp.ts 把这 1.3 s 拉成真实的 3.0 s）。
	// 3 秒只剩一颗金点、星尘也冻住，会像播放器卡住；所以静音里人生线 A 本身留着（暗到 0.29，停在它冲到的最高处，一动不动），
	// 终点一颗金点，星尘照常漂（Backdrop 用真实时间）—— 读得出是「这一生停在这里」。音乐回来时线 A 亮回 0.5。
	const Aend = lifeA(1);
	const Bend = lifeBext(1);
	if (t >= CUT && t < 204.5) {
		const backA = t < CUT_END ? 0.58 : lerp(0.58, 1, smooth((t - CUT_END) / 0.7));
		const mem = smooth((t - 198.05) / 0.6);
		const endFade = 1 - smooth((t - 203.65) / 0.8);
		// 线 A（不带那些点）
		if (backA > 0) beam(g, D.lifeAPts, ICE, 2.8, 0.5 * backA * lerp(1, 0.6, mem) * endFade, false, 0.45);
		// A 的金点：静音时 r 20 不动；198.05 合成记忆光点 r 30（亮金，最大）
		// 2026-10-12 审铃声：198.05 的 bell 原来只配一个 0.5 倍的小闪，看不出来；现在同一刻金点闪亮、放两圈金环（和 1:13 冷水揭晓同一个动作）
		const flash = Math.exp(-(((t - 198.12) / 0.22) ** 2));
		const brA = t > 198.9 ? 1 + 0.07 * Math.sin((t - 198.9) * 2.2) : 1;
		mdot(g, Aend[0], Aend[1], lerp(20, 30, mem), GOLD, (1 + 0.9 * flash) * endFade * brA);
		const ring = t - 198.05;
		if (ring > 0 && ring < 1.6) {
			for (const d of [0, 0.28]) {
				const p = (ring - d) / 1.2;
				if (p > 0 && p < 1) arc(g, Aend[0], Aend[1], 26 + 130 * easeOut(p), GOLD, 1.4, 0.6 * (1 - p), 0, Math.PI * 2, 0.4);
			}
			haze(g, Aend[0], Aend[1], 170, GOLD, 0.22 * (1 - ring / 1.6));
		}
		// 第二支笔：线 B，在 A 下方 100 px 的平行轨道上，形状完全相同
		if (t >= 191.0) {
			const pb = easeInOut(prog(t, 191.0, 193.0, (q) => q));
			const pe = prog(t, 193.0, 196.0, (q) => q);
			const bp = partial(D.lifeBPts, pb);
			const kB = 0.75 * lerp(1, 0.6, mem) * endFade;
			const cB = mixc(ICE, SILVER, 0.2);
			beam(g, bp, cB, 2.6, kB, false, 0.4);
			const ext = partial(D.lifeBExtPts, pe);
			const tailK = lerp(0.75 * lerp(1, 0.6, mem), 0.3, smooth((t - 203.65) / 0.8));
			if (pe > 0) beam(g, ext, cB, 2.6, tailK, false, 0.4);
			// 平台上 1825 颗暗点，一颗接一颗，一闪一闪
			const nP = D.num.life.plateau_days;
			const shown = Math.floor(pe * nP);
			const pd = new Path2D();
			const pd2 = new Path2D();
			for (let i = 0; i < shown; i++) {
				const v = (i + 0.5) / nP;
				const [x, y] = lifeBext(v);
				const px = x - 0.8 + (hash2(i, 1, 5) - 0.5) * 3;
				const py = y - 0.8 + (hash2(i, 2, 5) - 0.5) * 9;
				(Math.sin(t * 2.5 + 6.283 * hash2(i, 3, 5)) > 0.3 ? pd2 : pd).rect(px, py, 1.6, 1.6);
			}
			g.fillStyle = rgba(ICE_W, 0.45 * lerp(1, 0.55, mem) * endFade);
			g.fill(pd);
			g.fillStyle = rgba(ICE_W, 0.8 * lerp(1, 0.55, mem) * endFade);
			g.fill(pd2);
			// 笔尖（带彗星尾巴）
			const head = pe > 0 ? ext[ext.length - 1] : bp[bp.length - 1];
			const penK = smooth((t - 191.0) / 0.2) * (1 - smooth((t - 196.0) / 0.6));
			if (penK > 0) {
				comet(g, pe > 0 ? [...bp, ...ext] : bp, 90, ICE_W, 2.6, 0.8 * penK);
				glow(g, head[0], head[1], 17, ICE_W, 0.9 * penK, 0.3);
			}
			// 198.05：B 的峰和终收成一颗记忆光点 —— 更小、更灰（低分），不是「更暗更暖」（那和前三章「越亮越难受」打架）
			if (t >= 198.05) {
				const dst: P = Bend;
				const src: P = [1300, 350 + B_OFF];
				const u = easeInOut(prog(t, 198.05, 198.9, (q) => q));
				if (u < 1) {
					const [x, y] = qbez(src, [1430, 330 + B_OFF], dst, u);
					mdot(g, x, y, 9, mixc(GOLD, GREY, 0.5), 0.8 * (1 - u));
				}
				const brB = t > 198.9 ? 1 + 0.07 * Math.sin((t - 198.9) * 2.2 + Math.PI) : 1;
				mdot(g, dst[0], dst[1], 15, mixc(GOLD, GREY, 0.62), 0.75 * smooth((t - 198.3) / 0.6) * endFade * brB);
			}
		}
	}
	void frame;
};
