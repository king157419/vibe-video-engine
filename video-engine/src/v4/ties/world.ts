/** 「世界」这张网：两千颗星。开头的星带（0–42 s）、1998 的星盘（144.8–200 s）、结尾的星带（247–284 s）都是它。
 *  星带 ↔ 星盘之间是形变（同一颗星从一个位置滑到另一个位置），不是切换。
 *  这里的 t 全部是故事时间（见 time.ts）。 */
import {clamp, easeIn, easeInOut, easeOut, inv, lerp, mulberry32, smooth} from '../kit/util';
import {
	AMBER,
	AMBER_CORE,
	arcPts,
	bez,
	cam,
	camLerp,
	comet,
	drawStranger,
	drawYou,
	drift,
	glow,
	glowAt,
	glowLine,
	glowLines,
	hairSegs,
	ID,
	lerpXY,
	P,
	samp,
	SILVER,
	YOU_CORE,
	type Ctx,
	type View,
} from './draw';
import {
	ADJ,
	BAND,
	BAND_C,
	CHORDS,
	DISC,
	DISC_R,
	DIST,
	edgeKey,
	LDIST,
	LOCAL_EDGES,
	N,
	PATH,
	REMOVED,
	RING_EDGES,
	STARS,
	theta,
	THEM,
	YOU,
	type XY,
} from './model';
import {A, ez, lin, pulse, sm, vis} from './time';
import {drawTitle, type Chord, type TitleGeo} from './title';
import {cliqueDots144, you73At} from './scenes/s1973';

// ================================================================ 时间
const H1 = A.hops1 as unknown as number[]; // 21.2 22.03 23.7 24.53 25.37
const H2 = A.hops2 as unknown as number[]; // 173.6 … 177.77
const FL = A.flood as unknown as number[]; // 洪水 9 层
export const T1 = A.title1;
export const T2 = A.title2;
const CUT = A.cut; // 180.67
const SIL_END = A.silence[1]; // 182.07
/** 用户反馈（2026-10-12）：硬静音那一帧洪水整片一帧消失（单帧变化 35.9），配上突然没声，看着像播放器卡了一下。
 *  现在声音一断，画面在同一帧开始 0.2 故事秒（≈ 0.21 秒）的快速淡出：洪水整层淡到近黑，只剩那根琥珀长弦，
 *  长弦本身不跟着暗（淡出的那一层里它是 0.6，留下的这根从 0 补到 0.6），静音里它是唯一的主角；
 *  静音结束后其余慢慢亮回来，长弦交还给原来那条路（两者相加始终 ≈ 0.5），没有一帧跳的。 */
export const CUT_FADE = 0.2;
/** 画面从哪一帧开始淡：声音断在 176.37 s，落在第 5291 帧（176.367–176.400）里；淡出从上一帧的时刻起算，
 *  所以第 5291 帧（声音断的那一帧）已经暗下去约三成，之后 5 帧落到只剩长弦。曲线是 (1−x)²：第一帧就看得出在「收」 */
export const CUT_PIC = CUT - 0.0367;
const fadeA = (t: number) => Math.pow(1 - clamp((t - CUT_PIC) / CUT_FADE), 2);
const LINE_SIL = 0.6; // 静音开始时长弦的亮度（和洪水里那根一样）
const LINE_BACK = 0.5; // 静音结束时长弦的亮度（= 之后那条路的亮度）
let GHOST: HTMLCanvasElement | null = null;

/** 当前帧属于哪一段 */
const inPrologue = (t: number) => t < 42.3;
const inDisc = (t: number) => t >= 144.8 && t < 202.2;
const inFinale = (t: number) => t >= 246.9;
export const worldActive = (t: number) => inPrologue(t) || inDisc(t) || inFinale(t);

// ================================================================ 镜头
/** 开头的近景程度（1 = 贴近「你」，0 = 全景）：0–5.0 贴近，5.0–7.8 拉出全景 */
const closeK = (t: number) => (t < 5.5 ? 1 : 1 - ez(t, 5.5, 8.0));
/** 信跳五下那几秒，镜头跟着信走 */
const followK = (t: number) => (t < 20.3 || t > 27.8 ? 0 : ez(t, 20.3, 21.2) * (1 - ez(t, 25.5, 27.7)));
const prologueView = (t: number): View => {
	const [dx, dy] = drift(t, 4);
	const Y = BAND[YOU];
	// 全景：7.8 起 1.00 → 1.025；13.8 提问时再慢推到 1.05；33 起片名阶段回到 1.0
	const sFull = 1 + 0.025 * ez(t, 7.8, 13.0) + 0.025 * ez(t, 13.8, 17.8) - 0.04 * ez(t, 32.6, 34.6) + 0.012 * ez(t, 35, 42);
	const hold = t >= 17.8 && t < 20.8 ? 0.4 : 1;
	const full = cam(sFull, 960 - dx * hold, 540 - dy * hold);
	// 近景：「你」放在画面中上部，2.6 倍，慢推到 2.75
	const close = cam(2.6 + 0.18 * lin(t, 0, 5.5), Y[0] - dx * 0.2, Y[1] - dy * 0.2, 960, 440);
	let v = closeK(t) >= 1 ? close : closeK(t) <= 0 ? full : camLerp(close, full, 1 - closeK(t));
	const f = followK(t);
	if (f > 0) {
		// 跟拍：先对准「你 → 5 → 15」那一段，长跳时沿长弦横移到「1016 → 1006 → 陌生人」那一段
		const p0: XY = [440, 580];
		const p1: XY = [1500, 362];
		const along = ez(t, 22.0, 23.75);
		const fp: XY = [lerp(p0[0], p1[0], along) + 22 * lin(t, 23.75, 25.5), lerp(p0[1], p1[1], along) - 6 * lin(t, 23.75, 25.5)];
		v = camLerp(v, cam(1.45, fp[0], fp[1], 960, 470), f);
	}
	return v;
};
export const worldView = (t: number): View => {
	const [dx, dy] = drift(t, 4);
	if (t < 42.3) return prologueView(t);
	if (t < 247) {
		const I = cam(1, 960, 540);
		if (t < 146) return I;
		if (t < 155.3) return cam(1 + 0.03 * lin(t, 146, 155.3), 960 - dx, 540 - dy);
		const V0 = cam(1.03, 960 - drift(155.3, 4)[0], 540 - drift(155.3, 4)[1]);
		// 审片：推近后圆的下缘要在 y ≤ 900（不顶到字幕）。「你」放在 (900, 440)，圆心在右上方画外
		const VY = cam(2.2, DISC[YOU][0], DISC[YOU][1], 900, 440);
		if (t < 159.3) return camLerp(V0, VY, ez(t, 155.3, 159.3));
		const VY2 = cam(2.26, DISC[YOU][0] + 6, DISC[YOU][1] - 3, 900, 440);
		if (t < 161.0) return camLerp(VY, VY2, lin(t, 159.3, 161.0));
		const V1 = cam(1.0, 960, 540);
		if (t < 163.5) return camLerp(VY2, V1, ez(t, 161.0, 163.5));
		const V106 = cam(1.06, 960, 540);
		if (t < 173.2) return camLerp(V1, V106, ez(t, 163.5, 172.8));
		// 2:53：推近，但星盘下缘停在字幕带上方（y ≤ 930），字幕「一百步，塌成了五步」读完再推满
		const V135 = cam(1.35, 960, 470, 960, 420);
		if (t < 177.77) return camLerp(V106, V135, ez(t, 173.2, 177.77));
		const V138 = cam(1.38, 960, 470, 960, 424);
		if (t < 178.4) return camLerp(V135, V138, lin(t, 177.77, 178.4));
		const V156 = cam(1.56, 960, 470);
		if (t < 179.6) return camLerp(V138, V156, ez(t, 178.4, 179.6));
		const V162 = cam(1.62, 960, 470);
		if (t < CUT) return camLerp(V156, V162, ez(t, 179.6, CUT));
		// 审片：静音之后镜头先回到 1.0 再出字幕 → 在近黑的静音里把镜头拉回来（只剩一根弦，看得见它在退）
		const Vb = cam(1.0, 960 - dx, 540 - dy);
		if (t < 193.6) return camLerp(V162, Vb, ez(t, CUT + 0.05, SIL_END - 0.05));
		// 3:14 沿长弦滑过去：焦点下移 70 px，星带整体上移，不进字幕带
		const Va = cam(1.6, BAND[15][0] + 40, BAND[15][1] + 110);
		const Vc = cam(1.6, BAND[1016][0] - 40, BAND[1016][1] + 90);
		if (t < 194.8) return camLerp(Vb, Va, ez(t, 193.6, 194.8));
		if (t < 198.0) return camLerp(Va, Vc, ez(t, 194.8, 198.0));
		return camLerp(Vc, cam(1.0, 960, 540), ez(t, 198.0, 200.2));
	}
	const s = 1 + 0.014 * lin(t, 247.0, 254.3) + 0.04 * ez(t, 254.3, 259.3) + 0.02 * ez(t, 259.3, 274) - 0.074 * ez(t, 274.0, 275.4);
	return cam(s, 960 - dx, 540 - dy);
};

// ================================================================ 布局
/** 星盘程度（0 = 星带，1 = 星盘） */
const discness = (t: number) => {
	if (t < 144.8 || t >= 202.2) return 0;
	if (t < 187.6) return 1;
	return 1 - ez(t, 187.6, 188.8);
};
/** 1973 → 1998：小圈子先松开，两千颗点从四周沿各自的方向收拢成大圆（144.8–146.0）。
 *  起点和终点在同一个方向上（径向收拢），所以飞行中的轨迹不交叉。 */
const SCATTER: XY[] = (() => {
	const r = mulberry32(1998);
	return Array.from({length: N}, (_, i) => {
		const a = theta(i) + (r() - 0.5) * 0.22;
		const rr = DISC_R * (1.55 + 1.1 * Math.sqrt(r()));
		return [BAND_C[0] + Math.cos(a) * rr * 1.25, BAND_C[1] + Math.sin(a) * rr * 0.95] as XY;
	});
})();
/** 上一幕小圈子里的点，交给离它方向最近的那颗星：它从圈子里的位置起飞 */
const FROM_CLIQUE: Map<number, {p: XY; c: XY}> = (() => {
	const m = new Map<number, {p: XY; c: XY}>();
	const used = new Set<number>([YOU]);
	for (const d of cliqueDots144()) {
		const ang = Math.atan2(d.p[1] - BAND_C[1], d.p[0] - BAND_C[0]);
		let best = -1;
		let bd = 1e9;
		for (let i = 0; i < N; i++) {
			if (used.has(i) || i === THEM) continue;
			let da = Math.abs(theta(i) - ang) % (Math.PI * 2);
			if (da > Math.PI) da = Math.PI * 2 - da;
			if (da < bd) {
				bd = da;
				best = i;
			}
		}
		used.add(best);
		m.set(best, d);
	}
	return m;
})();
const GATHER_D: number[] = (() => {
	const r = mulberry32(73);
	return Array.from({length: N}, () => r() * 0.3);
})();
const G0 = 144.8;
const LOOSE = 0.22; // 小圈子先松开 0.22 秒
const gatherU = (t: number, i: number) => {
	const d = FROM_CLIQUE.has(i) || i === YOU ? LOOSE : GATHER_D[i];
	return easeInOut(clamp((t - G0 - d) / 0.85));
};

/** 1998 推近「你」时的放大镜：「你」附近的星沿圆周拉开（中心 6 倍：相邻两颗在屏幕上隔约 15 px，数得清），
 *  对面一侧相应挤一点（推近时在画外） */
const lensK = (t: number) => (t < 155.0 || t > 163.6 ? 0 : ez(t, 155.3, 159.3) * (1 - ez(t, 161.0, 163.5)));
const LENS_M = 6;
/** 星盘刚聚成时慢慢自转（146–155.3 转 5°，约 0.55°/s），之后停在正位 */
const discRot = (t: number) => (t >= 155.3 ? 0 : ((-5 * (1 - ez(t, 145.4, 155.3))) * Math.PI) / 180);
const rotAbout = (p: XY, a: number): XY => {
	if (a === 0) return p;
	const dx = p[0] - BAND_C[0];
	const dy = p[1] - BAND_C[1];
	return [BAND_C[0] + dx * Math.cos(a) - dy * Math.sin(a), BAND_C[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
const lensPos = (i: number, k: number): XY => {
	let d = (((i - YOU) % N) + N) % N;
	if (d > N / 2) d -= N;
	const M = 1 + (LENS_M - 1) * k;
	const x = (Math.PI * d) / N;
	const d2 = (N / Math.PI) * Math.atan(M * Math.tan(x));
	return discAt(YOU + d2);
};
const SPREAD_K = 1.5;
const SPREAD_W = 40;
const spread2K = (t: number) => (t < 172.5 || t > SIL_END ? 0 : ez(t, 172.5, 173.5) * (1 - ez(t, CUT + 0.05, SIL_END - 0.05)));
const discAt = (fi: number): XY => {
	const th = ((155 + (360 * fi) / N) * Math.PI) / 180;
	return [BAND_C[0] + DISC_R * Math.cos(th), BAND_C[1] + DISC_R * Math.sin(th)];
};

const posAt = (t: number, i: number, dn: number): XY => {
	if (t >= G0 && t < 146.1) {
		const u = gatherU(t, i);
		let s: XY;
		if (i === YOU) s = you73At(G0);
		else {
			const fc = FROM_CLIQUE.get(i);
			if (fc) {
				// 先松开：离圈子中心再远 40%
				const lo = easeOut(clamp((t - G0) / LOOSE));
				s = [fc.p[0] + (fc.p[0] - fc.c[0]) * 0.4 * lo, fc.p[1] + (fc.p[1] - fc.c[1]) * 0.4 * lo];
			} else s = SCATTER[i];
		}
		return lerpXY(s, rotAbout(DISC[i], discRot(t)), u);
	}
	if (dn >= 1) {
		const lk = lensK(t);
		if (lk > 0) return lensPos(i, lk);
		const s2 = spread2K(t);
		if (s2 > 0) {
			// 一百步塌成五步时，「你」和陌生人身边的星沿圆周局部拉开（中心 2.5 倍），五跳里的短跳数得出来
			for (const c of [YOU, THEM]) {
				let d = (((i - c) % N) + N) % N;
				if (d > N / 2) d -= N;
				if (Math.abs(d) < 170) return discAt(c + d * (1 + SPREAD_K * s2 * Math.exp(-((d / SPREAD_W) ** 2))));
			}
		}
		return rotAbout(DISC[i], discRot(t));
	}
	if (dn <= 0) return BAND[i];
	return lerpXY(BAND[i], DISC[i], dn);
};

// ================================================================ 小工具
const tw = (t: number, i: number) => 0.8 + 0.2 * Math.sin(t * (0.7 + (i % 5) * 0.21) + STARS.ph[i]);
/** 星盘上的星闪得更明显（1/3 的星大幅闪烁） */
const twDisc = (t: number, i: number) => (i % 3 === 0 ? 0.5 + 0.5 * Math.sin(t * (1.1 + (i % 7) * 0.23) + STARS.ph[i]) : tw(t, i));
const DC: XY = [BAND_C[0], BAND_C[1]];

/** 邻居线：星盘上画成微微鼓起的弧（编织带），星带上是直的刻纹。edges: [a, b, j] */
const drawEdges = (
	g: Ctx,
	v: View,
	edges: [number, number, number][],
	pos: XY[],
	dn: number,
	color: string,
	w: number,
	a: number,
	keep?: (e: [number, number, number]) => boolean,
	batches = 10,
	bulgeOf?: (e: [number, number, number], len: number) => number,
) => {
	if (a <= 0.002) return;
	const {s, ox, oy} = v;
	g.lineWidth = w;
	g.lineCap = 'round';
	for (let bj = 1; bj <= batches; bj++) {
		g.beginPath();
		let n = 0;
		for (const e of edges) {
			if (batches > 1 && e[2] !== bj) continue;
			if (keep && !keep(e)) continue;
			const p = pos[e[0]];
			const q = pos[e[1]];
			const mx = (p[0] + q[0]) / 2;
			const my = (p[1] + q[1]) / 2;
			let cx = mx;
			let cy = my;
			if (dn > 0) {
				const nx = mx - DC[0];
				const ny = my - DC[1];
				const L = Math.hypot(nx, ny) || 1;
				const bulge = bulgeOf ? bulgeOf(e, Math.hypot(q[0] - p[0], q[1] - p[1])) : (e[2] % 2 ? 1 : -1) * (2 + 1.9 * e[2]) * dn;
				cx += (nx / L) * bulge;
				cy += (ny / L) * bulge;
			}
			g.moveTo(p[0] * s + ox, p[1] * s + oy);
			g.quadraticCurveTo(cx * s + ox, cy * s + oy, q[0] * s + ox, q[1] * s + oy);
			n++;
		}
		if (n) {
			g.strokeStyle = hexA(color, a);
			g.stroke();
		}
		if (batches === 1) break;
	}
};
const hexA = (hex: string, a: number) => {
	const h = parseInt(hex.slice(1), 16);
	return `rgba(${(h >> 16) & 255},${(h >> 8) & 255},${h & 255},${clamp(a)})`;
};

// ---------------------------------------------------------------- 星带刻纹（预渲染）
/** 审片 P0：19,805 根刻线各自用 0.0075–0.016 的透明度描，每根只贡献 1–2 级亮度，8 位取整后整片一起跳级（单帧闪烁）。
 *  改成：只画大致沿星带走向的邻居线（和切线夹角 < 45°，去掉径向的「铁屑」），按 j 分 10 批、每批 0.12 预渲染到一张
 *  2 倍分辨率的离屏画布上；每帧 drawImage，globalAlpha = 需要的透明度 ÷ 0.12。亮度变化就分摊到几十个灰阶上。 */
const ENG_A = 0.12;
const ENG_SC = 2;
const ENG_EDGES: [number, number, number][] = LOCAL_EDGES.filter(([a, b]) => {
	const p = BAND[a];
	const q = BAND[b];
	const mx = (p[0] + q[0]) / 2 - BAND_C[0];
	const my = (p[1] + q[1]) / 2 - BAND_C[1];
	const th = Math.atan2(my / 330, mx / 700);
	const tx = -700 * Math.sin(th);
	const ty = 330 * Math.cos(th);
	const dx = q[0] - p[0];
	const dy = q[1] - p[1];
	return Math.abs(dx * tx + dy * ty) / (Math.hypot(dx, dy) * Math.hypot(tx, ty) + 1e-9) > 0.707;
});
let ENG_BMP: HTMLCanvasElement | null = null;
const engraveBitmap = () => {
	if (ENG_BMP) return ENG_BMP;
	const c = document.createElement('canvas');
	c.width = 1920 * ENG_SC;
	c.height = 1080 * ENG_SC;
	const g = c.getContext('2d')!;
	g.globalCompositeOperation = 'lighter';
	g.lineCap = 'round';
	g.lineWidth = 0.8 * ENG_SC;
	g.strokeStyle = hexA(SILVER, ENG_A);
	for (let bj = 1; bj <= 10; bj++) {
		g.beginPath();
		for (const e of ENG_EDGES) {
			if (e[2] !== bj) continue;
			const p = BAND[e[0]];
			const q = BAND[e[1]];
			g.moveTo(p[0] * ENG_SC, p[1] * ENG_SC);
			g.lineTo(q[0] * ENG_SC, q[1] * ENG_SC);
		}
		g.stroke();
	}
	ENG_BMP = c;
	return c;
};
/** a：和原来 drawEdges 一样含义的「每批透明度」 */
const drawEngrave = (g: Ctx, v: View, a: number) => {
	if (a <= 0.0004) return;
	const bmp = engraveBitmap();
	g.save();
	g.globalAlpha = clamp(a / ENG_A);
	g.imageSmoothingEnabled = true;
	g.imageSmoothingQuality = 'high';
	g.drawImage(bmp, v.ox, v.oy, 1920 * v.s, 1080 * v.s);
	g.restore();
};

/** 信走的路：每一跳的曲线 */
const hopCurves = (pos: XY[], nodes: number[], bends: number[]) => nodes.slice(1).map((b, k) => bez(pos[nodes[k]], pos[b], bends[k]));
const routeAt = (t: number, depart: number, arr: number[], curves: ((u: number) => XY)[]): XY => {
	if (t <= depart) return curves[0](0);
	for (let k = 0; k < arr.length; k++) {
		const t0 = k === 0 ? depart : arr[k - 1];
		if (t <= arr[k]) return curves[k](easeInOut((t - t0) / (arr[k] - t0)));
	}
	return curves[curves.length - 1](1);
};
const routeTail = (t: number, depart: number, arr: number[], curves: ((u: number) => XY)[], n = 16, dt = 0.022) => {
	const out: XY[] = [];
	for (let j = n - 1; j >= 0; j--) out.push(routeAt(Math.max(depart, t - j * dt), depart, arr, curves));
	return out;
};
/** 已经走过的那几段线：完成的整段，正在走的那段画到当前位置 */
const routeLines = (t: number, depart: number, arr: number[], curves: ((u: number) => XY)[]) =>
	curves.map((c, k) => {
		const t0 = k === 0 ? depart : arr[k - 1];
		if (t <= t0) return [] as XY[];
		const u = t >= arr[k] ? 1 : easeInOut((t - t0) / (arr[k] - t0));
		return samp(c, 36, 0, u);
	});

/** 中间人身上留下的琥珀细环（审片：手机上数得出四个人） */
const midRings = (g: Ctx, t: number, v: View, pos: XY[], arr: number[], a: number) => {
	for (let k = 1; k <= 4; k++) {
		const t0 = arr[k - 1];
		const sp = P(v, pos[PATH[k]]);
		const z = Math.pow(v.s, 0.35);
		const kk = a * clamp((t - t0) / 0.25) * (1 + 0.6 * pulse(t, t0, 0.5));
		ringAt(g, sp, 13 * z, kk);
		if (kk > 0.005) glowAt(g, sp[0], sp[1], 14 * z, AMBER, 0.7 * kk, 'dot');
	}
};
const ringAt = (g: Ctx, sp: XY, r: number, k: number) => {
	if (k <= 0.005) return;
	glowLines(g, ID, [arcPts(sp[0], sp[1], r, 0, Math.PI * 2, 40)], AMBER, 1.3, 0.8 * k, true);
};

// 「你」和「陌生人」各自的 20 根邻居线（按 1, 1999, 2, 1998 … 的顺序长出来）
const nbrOrder = (c: number) => {
	const out: number[] = [];
	for (let j = 1; j <= 10; j++) out.push((c + j) % N, (c - j + N) % N);
	return out;
};
const YOU_NB = nbrOrder(YOU);
/** 开头近景里「你」的小圈子：20 个邻居围着「你」排成一个松散的圈（世界坐标的偏移，2.6 倍时半径约 150–200 px） */
const RING20: XY[] = (() => {
	const r = mulberry32(20);
	return YOU_NB.map((nb, k) => {
		// 按长出来的先后错开撒满一整圈（相邻两根隔 7/20 圈），任何时刻看都是一个圈，不是一把扇子
		const a = -Math.PI / 2 + (2 * Math.PI * ((k * 7) % 20)) / 20 + (r() - 0.5) * 0.2;
		const rr = 58 + 16 * r();
		return [Math.cos(a) * rr, Math.sin(a) * rr * 0.8] as XY;
	});
})();
const ringK = (t: number) => ez(t, 3.0, 4.3) * (1 - ez(t, 6.0, 7.7));
const THEM_NB = nbrOrder(THEM);

// 回扣（3:14）：长弦两端各自的小圈子（自己 + 星带上离它最近的 4 个邻居，完全连通）
const clique5 = (c: number) => {
	const nb = [...ADJ[c]].filter((x) => Math.abs(((x - c + N + N / 2) % N) - N / 2) <= 10);
	nb.sort((a, b) => Math.hypot(BAND[a][0] - BAND[c][0], BAND[a][1] - BAND[c][1]) - Math.hypot(BAND[b][0] - BAND[c][0], BAND[b][1] - BAND[c][1]));
	return [c, ...nb.slice(0, 4)];
};
const CL15 = clique5(15);
const CL1016 = clique5(1016);
/** 审片：小圈子只有约 40 px 宽，看不见。镜头 1.6 倍时把四个邻居沿各自方向推到离中心 28 px（屏幕约 45 px） */
const cliqueK = (t: number) => (t < 194 || t > 200.4 ? 0 : vis(t, 194.4, 200.0, 0.8, 0.8));
const spreadClique = (pos: XY[], cl: number[], k: number, R0 = 28) => {
	const c = pos[cl[0]];
	cl.slice(1).forEach((i, q) => {
		const p = pos[i];
		let dx = p[0] - c[0];
		let dy = p[1] - c[1];
		let L = Math.hypot(dx, dy);
		if (L < 1) {
			dx = Math.cos(q * 1.57);
			dy = Math.sin(q * 1.57);
			L = 1;
		}
		// 四个点均匀散开一点，避免挤在同一侧
		const a0 = Math.atan2(dy, dx);
		const a1 = a0 * 0.5 + (q * Math.PI) / 2 * 0.5 + 0.4;
		const ang = lerp(a0, a1, 0.6);
		const R = lerp(L, R0, k);
		pos[i] = [lerp(p[0], c[0] + Math.cos(ang) * R, k), lerp(p[1], c[1] + Math.sin(ang) * R, k)];
	});
};
// 回扣时依次亮一下的另外 6 根弦：在星带上跨得最远的几根里均匀挑
const FLASH6 = (() => {
	const scored = CHORDS.map(([i, , c], k) => ({k, d: Math.hypot(BAND[i][0] - BAND[c][0], BAND[i][1] - BAND[c][1])}))
		.filter((o) => ![15].includes(CHORDS[o.k][0]))
		.sort((a, b) => b.d - a.d)
		.slice(0, 60);
	return [0, 9, 19, 29, 39, 49].map((q) => scored[q].k);
})();

// 结尾：「你」身上长出的 24 根琥珀线，目标星用 mulberry32(2026) 另起一串挑，都在星带对侧半圈
export const LINES24 = (() => {
	const r = mulberry32(2026);
	const out: number[] = [];
	while (out.length < 24) {
		const c = 500 + Math.floor(r() * 1000);
		if (out.every((o) => Math.abs(o - c) > 12) && c !== THEM) out.push(c);
	}
	return out.map((c, k) => ({c, bend: (r() - 0.5) * 0.18, t0: 254.3 + (k * (5.0 - 0.6)) / 23}));
})();
// CLAUDE 那颗星：离 (420, 250) 最近的星
export const CLAUDE_STAR = (() => {
	let best = 0;
	let bd = 1e9;
	for (let i = 0; i < N; i++) {
		const d = Math.hypot(BAND[i][0] - 420, BAND[i][1] - 250);
		if (d < bd && i !== YOU && i !== THEM) {
			bd = d;
			best = i;
		}
	}
	return best;
})();
// CLAUDE → 邻居（一小跳）→ 长弦 → 「你」身边一颗星 → 「你」
const CLAUDE_ROUTE = (() => {
	const c = CLAUDE_STAR;
	let n1 = c;
	let bd = 0;
	for (let j = 1; j <= 10; j++) {
		const x = (c + j) % N;
		const d = Math.hypot(BAND[x][0] - BAND[c][0], BAND[x][1] - BAND[c][1]);
		if (d > bd && d < 90) {
			bd = d;
			n1 = x;
		}
	}
	let n2 = 1996;
	let best = 1e9;
	for (const x of YOU_NB) {
		const d = Math.hypot(BAND[x][0] - BAND[YOU][0], BAND[x][1] - BAND[YOU][1]);
		const sc = Math.abs(d - 55);
		if (sc < best && BAND[x][1] < BAND[YOU][1] + 20) {
			best = sc;
			n2 = x;
		}
	}
	return [c, n1, n2, YOU];
})();

// ================================================================ 片名星座（两次）
let TG1: TitleGeo | null = null;
let TG2: TitleGeo | null = null;
export const setTitleGeo = (a: TitleGeo | null, b: TitleGeo | null) => {
	TG1 = a;
	TG2 = b;
};
const titleTaken = (geo: TitleGeo | null) => {
	const s = new Uint8Array(N);
	if (geo) for (const x of geo.star) s[x] = 1;
	return s;
};
let TAKEN1: Uint8Array | null = null;
let TAKEN2: Uint8Array | null = null;

// ================================================================ 画
export const drawWorld = (g: Ctx, t: number) => {
	if (!worldActive(t)) return;

	const v = worldView(t);
	const dn = discness(t);
	const pos: XY[] = new Array(N);
	for (let i = 0; i < N; i++) pos[i] = posAt(t, i, dn);
	const ck = cliqueK(t);
	if (ck > 0) {
		spreadClique(pos, CL15, ck);
		spreadClique(pos, CL1016, ck);
	}
	// 开头近景：「你」的 20 个邻居从星带里浮出来，围着「你」排成一圈（3.0–4.2），镜头拉出全景时（5.2–7.4）滑回星带
	const rk = t < 7.5 ? ringK(t) : 0;
	if (rk > 0) {
		const c = BAND[YOU];
		YOU_NB.forEach((nb, k) => {
			const q = RING20[k];
			pos[nb] = lerpXY(pos[nb], [c[0] + q[0], c[1] + q[1]], rk);
		});
	}
	const ek = inPrologue(t) ? endCliqueK(t) : 0;
	if (ek > 0) {
		spreadClique(pos, CL15, ek, 48 / v.s);
		spreadClique(pos, CL1016, ek, 48 / v.s);
	}
	if (inPrologue(t)) drawPrologue(g, t, v, pos);
	else if (inDisc(t)) {
		// 硬静音的头 0.2 秒：洪水照常往下演（cutT = ∞），画在离屏画布上，整层按 1 → 0 叠回来
		if (t >= CUT_PIC && t < CUT_PIC + CUT_FADE) {
			const a = fadeA(t);
			if (!GHOST) {
				GHOST = document.createElement('canvas');
				GHOST.width = 1920;
				GHOST.height = 1080;
			}
			const gg = GHOST.getContext('2d') as Ctx;
			gg.setTransform(1, 0, 0, 1, 0, 0);
			gg.globalCompositeOperation = 'source-over';
			gg.clearRect(0, 0, 1920, 1080);
			gg.globalCompositeOperation = 'lighter';
			drawDisc(gg, t, v, pos, dn, Infinity);
			g.globalAlpha = a;
			g.drawImage(GHOST, 0, 0);
			g.globalAlpha = 1;
		}
		drawDisc(g, t, v, pos, dn, CUT_PIC);
	} else drawFinale(g, t, v, pos);
};

// ---------------------------------------------------------------- 0:00–0:42 开头
/** 开头长弦两端的小圈子（审片：0:30.8 那两个圈子只是淡淡的划痕）：15 号、1016 号各自和身边 4 颗星，
 *  在长弦变亮前 0.5 秒散开成屏幕上半径约 48 px 的五点全连通小圈子 */
const endCliqueK = (t: number) => (t < 29.8 || t > 34.6 ? 0 : vis(t, 29.9, 34.4, 0.6, 0.6));
const drawPrologue = (g: Ctx, t: number, v: View, pos: XY[]) => {
	if (TG1 && !TAKEN1) TAKEN1 = titleTaken(TG1);
	const t1 = T1;
	const fadeIn = 0.25 + 0.75 * sm(t, 0, 1.6); // 第 0 帧就有极淡的（虚焦的）星带
	const youOn = sm(t, 1.8, 2.5);
	const ck = closeK(t);
	const fk = followK(t);
	const out = 1 - sm(t, t1.out[0], t1.out[1]);
	// 星带整体亮度：你亮起后其余压到 0.6；近景时再压到约 0.33；信跳的时候 ×0.6；30.5 起 0.4；33.7 起 0.3；星飞走后 0.15；40.3–41.3 淡出
	const later =
		lerp(1, 0.6, fk) *
		lerp(1, 0.4 / 0.6, sm(t, 30.5, 31.5)) *
		lerp(1, 0.3 / 0.4, sm(t, t1.dim, t1.dim + 0.6)) *
		lerp(1, 0.15 / 0.3, sm(t, t1.fly[0], t1.fly[1])) *
		out;
	const band = fadeIn * lerp(1, 0.6, youOn) * lerp(1, 0.55, ck) * later;
	// 刻纹（审片：全景时再减半，让星本身当主角）：近景不画；9.0–11.5 亮一倍（每颗星都只牵着身边的人），13 以后回落一点
	const engBase = lerp(0.004, 0.009, sm(t, 9.0, 11.5)) * lerp(1, 0.72, sm(t, 13.0, 14.5));
	drawEngrave(g, v, engBase * (1 - ck) * fadeIn * later * lerp(1, 0.75, youOn));

	// 涟漪（17.8–20.8，纯环 BFS，每 0.278 s 一层）+ 21.2–22.0 淡掉：星本身按层亮起、变大，波前处一团柔光沿星带走
	const rp = t >= A.ripple[0] && t < 22.2 ? 1 - sm(t, 21.2, 22.0) : 0;
	const L = (t - A.ripple[0]) / 0.278;
	if (rp > 0 && L > 0) {
		for (const dir of [1, -1]) {
			const f = L * 10;
			const i0 = Math.floor(f);
			const fr = f - i0;
			const a = pos[(((dir * i0) % N) + N) % N];
			const b = pos[(((dir * (i0 + 1)) % N) + N) % N];
			const wp = lerpXY(a, b, fr);
			glow(g, v, wp, 80, '#b8c8dc', 0.2 * rp, 'soft');
			glow(g, v, wp, 30, '#dfe8f2', 0.28 * rp, 'soft');
		}
	}

	// 「你」的圈子：3.0–5.0 一根接一根长出来（审片：1.2 px 带光晕，看得出是一个小圈子）
	const youP = pos[YOU];
	const circleA = lerp(0.36, 0.62, ck) * (1 - 0.3 * sm(t, 12.6, 13.6)) * lerp(1, 0.55, fk) * lerp(1, 0.6, sm(t, 30.5, 31.5)) * out * (1 - sm(t, t1.dim, t1.fly[0] + 0.6));
	{
		const segs: XY[][] = [];
		YOU_NB.forEach((nb, k) => {
			const u = easeInOut(clamp((t - 3.0 - k * 0.085) / 0.32));
			if (u > 0) segs.push([youP, lerpXY(youP, pos[nb], u)]);
		});
		if (segs.length) glowLines(g, v, segs, SILVER, 1.2, circleA, true);
	}
	// 长弦两端的两个小圈子（30.0 起）
	const ek = endCliqueK(t) * out;
	if (ek > 0.002) {
		const segs: XY[][] = [];
		for (const cl of [CL15, CL1016]) for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) segs.push([pos[cl[a]], pos[cl[b]]]);
		glowLines(g, v, segs, SILVER, 1.1, 0.5 * ek, true);
	}

	// 星
	const taken = TAKEN1;
	const flyStarted = t >= t1.fly[0];
	for (let i = 0; i < N; i++) {
		if (i === YOU || i === THEM) continue;
		if (flyStarted && taken && taken[i]) continue;
		let k = STARS.lum[i] * tw(t, i) * band;
		const nbk = YOU_NB.indexOf(i);
		if (nbk >= 0) k *= 1 + 1.4 * sm(t, 3.0 + nbk * 0.085, 3.4 + nbk * 0.085) * (1 - 0.4 * sm(t, 12.6, 13.6));
		let r = STARS.rad[i] * 3.4;
		if (rp > 0 && LDIST[i] <= L) {
			// 被涟漪碰到：星本身变亮、变大（1.4 倍），波前那一层最亮
			const w = Math.exp(-(L - LDIST[i]) / 1.2);
			k = Math.max(k, 0.12) * (1 + (1.6 + 2.6 * w) * rp);
			r *= 1 + 0.4 * rp;
		}
		if (ek > 0 && (CL15.includes(i) || CL1016.includes(i))) {
			glow(g, v, pos[i], 11, SILVER, 0.7 * ek, 'dot');
			k *= 1 + 1.5 * ek;
		}
		// 近景：圈子里的 20 颗星对焦（浮出来、带光晕），其余虚成光斑
		if (nbk >= 0 && ck > 0.01) glow(g, v, pos[i], 9, SILVER, 0.7 * ck * sm(t, 3.0 + nbk * 0.085, 3.5 + nbk * 0.085) * later, 'dot');
		const blur = nbk >= 0 ? 0 : ck;
		if (blur > 0.01) glow(g, v, pos[i], r * 2.6, SILVER, k * 0.5 * blur, 'soft');
		glow(g, v, pos[i], r, SILVER, k * 1.3 * (1 - 0.65 * blur), 'star');
	}
	// 「你」与陌生人（片名开始后随星带一起退）
	const charA = out * (1 - sm(t, t1.dim, t1.dim + 1.2) * 0.7) * (1 - sm(t, t1.fly[0], t1.fly[1]));
	if (ck > 0.01) glow(g, v, youP, 70, YOU_CORE, 0.2 * youOn * ck, 'soft');
	drawYou(g, v, youP, youOn * fadeIn * charA, t);
	drawStranger(g, v, pos[THEM], sm(t, 6.5, 7.2) * charA * (1 + 1.4 * pulse(t, H1[4], 1.2)), t);

	// 信：14.4 在「你」的核心里出现一粒琥珀光，呼吸；20.8 出发
	const curves = hopCurves(pos, PATH, [0.12, 0.1, -0.08, 0.1, 0.12]);
	if (t >= 14.4 && t < A.depart1 + 0.05) {
		const a = sm(t, 14.4, 15.2);
		const r = 22 + 5 * (1 - Math.cos((t - 14.4) * 2.6));
		glow(g, v, youP, r, AMBER, 0.9 * a, 'dot');
		glow(g, v, youP, r * 2.6, AMBER, 0.16 * a, 'soft');
	}
	// 走过的线（审片：长弦 3 px 核心 + 约 20 px 光晕）
	if (t >= A.depart1) {
		const lines = routeLines(t, A.depart1, H1, curves);
		const shortK = 0.65 * lerp(1, 0.25, sm(t, 30.5, 31.2)) * (1 - sm(t, t1.dim, t1.fly[0] + 0.4)) * out;
		const longK = (t < H1[2] ? 0.9 : lerp(0.7, 1.0, sm(t, 30.5, 31.2)) + 0.25 * pulse(t, 32.0, 1.2)) * out;
		// 长弦在片名起飞时交给片名（变成桥）
		const longLine = t < t1.fly[0];
		glowLines(g, v, lines.filter((_, k) => k !== 2), AMBER, 1.8, shortK);
		if (longLine) glowLines(g, v, [lines[2]], AMBER, 2.4, longK);
		// 四个中间人：发光点 + 琥珀细环，信经过时亮起，留到 29.7
		midRings(g, t, v, pos, H1, vis(t, 21.0, 29.7, 0.01, 0.6));
		// 彗星
		if (t < H1[4] + 0.6) {
			const tail = routeTail(t, A.depart1, H1, curves, H1[1] < t && t < H1[2] ? 20 : 16);
			const k = 1 - sm(t, H1[4], H1[4] + 0.5);
			comet(g, v, tail, AMBER, 3.2, k, 28);
		}
		// 到达：陌生人闪一下（光晕 r 60 扩散后回落）
		const fe = (t - H1[4]) / 1.1;
		if (fe > 0 && fe < 1) {
			glow(g, v, pos[THEM], 28 + 52 * Math.sqrt(fe), SILVER, 0.95 * (1 - fe), 'dot');
			glowLines(g, ID, [arcPts(P(v, pos[THEM])[0], P(v, pos[THEM])[1], 14 + 80 * fe)], SILVER, 1.2, 0.55 * (1 - fe), false);
		}
		// 32.0 一颗小光点沿长弦跑一趟
		const ru = (t - 32.0) / 1.25;
		if (ru > 0 && ru < 1) {
			const p = curves[2](easeInOut(ru));
			glow(g, v, p, 16, AMBER_CORE, 0.95 * Math.sin(Math.PI * ru), 'star');
			glow(g, v, p, 36, AMBER, 0.4 * Math.sin(Math.PI * ru), 'soft');
		}
	}
	// 片名
	if (TG1 && t >= t1.fly[0] - 0.01) {
		const chord: Chord = (() => {
			const a = pos[15];
			const b = pos[1016];
			const c = bezCtl(a, b, -0.08);
			return {a: P(v, a), b: P(v, b), c: P(v, c)};
		})();
		drawTitle(
			g,
			t,
			TG1,
			{
				fly: t1.fly as unknown as [number, number],
				lift: [t1.fly[0] + 0.1, t1.fly[0] + 1.3],
				bridge: t1.bridge as unknown as [number, number],
				hair: t1.hair as unknown as [number, number],
				land: t1.land,
				out: t1.out as unknown as [number, number],
				flash: 38.5,
			},
			(s) => P(v, pos[s]),
			chord,
			1.0,
		);
	}
};
const bezCtl = (a: XY, b: XY, bend: number): XY => {
	const mx = (a[0] + b[0]) / 2;
	const my = (a[1] + b[1]) / 2;
	return [mx - (b[1] - a[1]) * bend, my + (b[0] - a[0]) * bend];
};
const hairLinesW = (g: Ctx, v: View, segs: XY[][], color: string, w: number, a: number) => {
	if (a <= 0.002) return;
	const flat: number[] = [];
	for (const s of segs) flat.push(s[0][0], s[0][1], s[1][0], s[1][1]);
	hairSegs(g, v, flat, color, w, a);
};

// ---------------------------------------------------------------- 2:24.8–3:22 星盘
const chordStart = (k: number) => 167.4 + (k * (172.6 - 0.25 - 167.4)) / (CHORDS.length - 1);
const LIT_T: number[] = DIST.map((d) => (d === 0 ? H2[4] : FL[d - 1]));
/** 「你」两侧各 200 颗星（放大镜下看得见的那一段） */
const nearYou = (i: number, w = 200) => {
	let d = (((i - YOU) % N) + N) % N;
	if (d > N / 2) d -= N;
	return Math.abs(d) <= w;
};
const LOCAL_RING = RING_EDGES.filter((e) => nearYou(e[0]) && nearYou(e[1]));
const YOU_RING = RING_EDGES.filter((e) => e[0] === YOU || e[1] === YOU);
const SAMPLES = [N - 40, 40, 85];
const SAMPLE_RING = RING_EDGES.filter((e) => SAMPLES.includes(e[0]) || SAMPLES.includes(e[1]));

/** 洪水的光雾：从琥珀径向衰减到深橙再到黑，四角保持暗 */
const floodGlow = (g: Ctx, x: number, y: number, r: number, k: number) => {
	if (k <= 0.003) return;
	const gr = g.createRadialGradient(x, y, 0, x, y, r);
	gr.addColorStop(0, `rgba(240,184,104,${clamp(k)})`);
	gr.addColorStop(0.18, `rgba(234,166,74,${clamp(0.8 * k)})`);
	gr.addColorStop(0.45, `rgba(176,96,30,${clamp(0.45 * k)})`);
	gr.addColorStop(0.75, `rgba(80,34,8,${clamp(0.16 * k)})`);
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gr;
	g.fillRect(x - r, y - r, 2 * r, 2 * r);
};

/** 洪水的放射光芒：72 道，从星盘边缘往外长，第 6 层（179.43）起冲出去，180.3 碰到画面四边 */
const RAYS = (() => {
	const r = mulberry32(178);
	return Array.from({length: 72}, (_, k) => ({a: (k / 72) * Math.PI * 2 + (r() - 0.5) * 0.05, w: 0.6 + 0.8 * r(), L: 0.75 + 0.5 * r(), k: 0.5 + 0.5 * r()}));
})();
const drawRays = (g: Ctx, t: number, c: XY, R: number) => {
	const grow = ez(t, FL[5] - 0.15, FL[8] + 0.15);
	if (grow <= 0) return;
	const len = 1500 * grow;
	g.lineCap = 'round';
	for (const ray of RAYS) {
		const ca = Math.cos(ray.a);
		const sa = Math.sin(ray.a);
		const L = len * ray.L;
		const n = 6;
		for (let j = 0; j < n; j++) {
			const r0 = R * 0.96 + (L * j) / n;
			const r1 = R * 0.96 + (L * (j + 1)) / n;
			const a = 0.26 * ray.k * Math.pow(1 - j / n, 1.6);
			g.strokeStyle = `rgba(242,194,122,${clamp(a * 0.25)})`;
			g.lineWidth = 7 * ray.w;
			g.beginPath();
			g.moveTo(c[0] + ca * r0, c[1] + sa * r0);
			g.lineTo(c[0] + ca * r1, c[1] + sa * r1);
			g.stroke();
			g.strokeStyle = `rgba(255,232,190,${clamp(a)})`;
			g.lineWidth = 1.4 * ray.w;
			g.stroke();
		}
	}
};
/** 洪水的迸发：每颗星被点亮（最早从第 6 层那一刻）就向外迸出一粒光，带一小段尾巴，1.3 秒内冲出画面 */
const BURST = (() => {
	const r = mulberry32(179);
	return Array.from({length: N}, () => ({v: 520 + 520 * r(), j: (r() - 0.5) * 0.12}));
})();
const drawBurst = (g: Ctx, t: number, v: View, c: XY) => {
	if (t < FL[5]) return;
	const flat: number[] = [];
	for (let i = 0; i < N; i += 2) {
		const t0 = Math.max(LIT_T[i], FL[5]);
		const e = t - t0;
		if (e <= 0 || e > 1.4) continue;
		const p = P(v, DISC[i]);
		const a0 = Math.atan2(p[1] - c[1], p[0] - c[0]) + BURST[i].j;
		const d = BURST[i].v * e * (1 - 0.25 * e);
		const x = p[0] + Math.cos(a0) * d;
		const y = p[1] + Math.sin(a0) * d;
		if (x < -40 || y < -40 || x > 1960 || y > 1120) continue;
		const k = 1 - e / 1.4;
		glowAt(g, x, y, 9, AMBER, 0.55 * k, 'star');
		const tl = Math.min(d, 46);
		flat.push(x - Math.cos(a0) * tl, y - Math.sin(a0) * tl, x, y);
	}
	hairSegs(g, ID, flat, '#f6d9a8', 1.1, 0.28);
};

const drawDisc = (g: Ctx, t: number, v: View, pos: XY[], dn: number, cutT: number = CUT_PIC) => {
	const cut = t >= cutT && t < SIL_END;
	const back = sm(t, SIL_END, SIL_END + 1.6); // 静音后安静地亮回来
	const gather = sm(t, 144.8, 145.9);
	const toAvatars = 1 - sm(t, 200.3, 201.3);
	const quietAfter = t >= SIL_END ? back : 1;
	const lk = lensK(t);

	// ---------- 编织带 / 刻纹
	if (!cut) {
		let braid = 0;
		const edges = RING_EDGES;
		if (t >= 154.3) {
			const sweep = clamp((t - 154.3) / 1.6);
			braid = dn * 0.15 * clamp((v.s - 1) / 1.2 + 0.32) * (1 - 0.6 * vis(t, 160.6, 167.4, 0.5, 0.8)) * (1 - 0.35 * sm(t, 166.9, 168)) * quietAfter;
			// 审片：推近 2.2 倍时整圈编织线糊成一根有摩尔纹的白管子 → 推近时整圈的编织线退掉，
			// 只把「你」附近约 400 颗星画成单独的星，每颗向两边各 10 个邻居画一道可数的细弧
			const ringBraid = braid * (1 - 0.9 * lk);
			const lim = sweep * 1000;
			const keepSweep = (e: [number, number, number]) => Math.min(e[0], N - e[0]) <= lim;
			const removedFade = (e: [number, number, number]) => !REMOVED.has(edgeKey(e[0], e[1]));
			const notLocal = (e: [number, number, number]) => lk <= 0 || !(nearYou(e[0]) && nearYou(e[1]));
			if (t < 167.4) drawEdges(g, v, edges, pos, dn, SILVER, 0.8, ringBraid, sweep < 1 ? (e) => keepSweep(e) && notLocal(e) : notLocal);
			else {
				drawEdges(g, v, edges, pos, dn, SILVER, 0.8, braid, removedFade);
				const flat: number[] = [];
				CHORDS.forEach(([i, o], k) => {
					const u = 1 - clamp((t - chordStart(k)) / 0.25);
					if (u > 0.02) flat.push(pos[i][0], pos[i][1], pos[o][0], pos[o][1]);
				});
				hairSegs(g, v, flat, SILVER, 0.8, braid * 2);
			}
			// 放大镜下：每根邻居线画成向外（或向内）鼓起的小弧，看得出每颗点只牵着身边的人
			if (lk > 0.01) {
				const bulge = (e: [number, number, number], len: number) => (e[2] % 2 ? 1 : -0.7) * 0.34 * len;
				// 整片邻居弧只留一层很淡的纹理；「你」的 20 道弧最亮，另外三颗星（左 40、右 40、右 85）各自的 20 道弧也清楚，
				// 看得出每个人都只牵着身边的人
				drawEdges(g, v, LOCAL_RING, pos, 1, SILVER, 1.0, 0.03 * lk * quietAfter, undefined, 10, bulge);
				drawEdges(g, v, SAMPLE_RING, pos, 1, SILVER, 1.0, 0.3 * lk * quietAfter, undefined, 1, bulge);
				drawEdges(g, v, YOU_RING, pos, 1, '#eef2f8', 1.3, 0.6 * lk, undefined, 1, bulge);
			}
			// 编织带的柔光
			if (dn > 0.5) glowLines(g, v, [arcPts(DC[0], DC[1], 360, 0, Math.PI * 2, 180)], SILVER, 6, 0.022 * dn * sweep * quietAfter * (1 - 0.6 * sm(t, 177.6, 178.2)) * (1 - 0.85 * lk), false);
		}
		// 星带模式（回扣）：刻纹。形变中用矢量画，落定后用预渲染的那张
		if (dn < 1 && t > 187.6) {
			const a = 0.014 * (1 - dn) * toAvatars;
			if (dn > 0.001) drawEdges(g, v, ENG_EDGES, pos, 0, SILVER, 0.8, a);
			else drawEngrave(g, v, a);
		}
	}

	// ---------- 涟漪：纯环上「你 → 陌生人」100 步（160.9–166.9）
	const rp = t >= 160.9 && t < 167.0 ? 1 - sm(t, 166.1, 166.9) : 0;
	let L = 0;
	if (rp > 0) {
		const c = A.crawl;
		if (t < c.slow[1]) L = (t - c.slow[0]) / 0.278;
		else {
			const tau = Math.min(t, c.fast_end) - c.slow[1];
			const T = c.fast_end - c.slow[1];
			const v0 = 1 / 0.278;
			const a3 = (100 - 6 - v0 * T) / (T * T * T);
			L = 6 + v0 * tau + a3 * tau * tau * tau;
		}
		L = Math.min(L, 100.01);
	}
	// 审片：原来是一段实心亮弧沿细圆绕圈，像加载进度圈 → 只让星一颗颗依次点亮，带光晕和逐渐衰减的拖尾（见下面「星」）

	// ---------- 195 根弦
	const chordsOn = t >= 167.4 && !cut;
	const lit = (i: number) => t >= LIT_T[i] && t < cutT;
	const flood = t >= H2[4] && t < cutT;
	if (chordsOn && dn > 0) {
		const base = (t < SIL_END ? 0.35 : 0.25 * back) * (1 - sm(t, 187.6, 188.4));
		const polys: XY[][] = [];
		const litPolys: XY[][] = [];
		CHORDS.forEach(([i, , c], k) => {
			const u = easeInOut(clamp((t - chordStart(k)) / 0.25));
			if (u <= 0) return;
			const seg: XY[] = [pos[i], lerpXY(pos[i], pos[c], u)];
			if (flood && lit(i) && lit(c)) litPolys.push(seg);
			else polys.push(seg);
		});
		glowLines(g, v, polys, AMBER, 1.0, base, false);
		// 洪水里亮起的弦：细而清楚，不再用宽光晕层层叠（圆心那块白饼就是它们叠出来的）
		if (litPolys.length) thinGlow(g, v, litPolys, '#f2c27a', 0.62);
	}
	// 硬静音：只剩 15 → 1016 那一根亮着（主角）；淡出的 0.2 秒里从 0 补到 0.6（和淡出那层里的同一根相加不变），
	// 静音里慢慢落到 0.5；静音结束后交还给那条路（路从 0 亮回 0.5，这根从 0.5 退到 0）
	if (t >= cutT && t < SIL_END + 1.7) {
		const lk = cut ? (1 - fadeA(t)) * lerp(LINE_SIL, LINE_BACK, sm(t, cutT + CUT_FADE, SIL_END)) : LINE_BACK * (1 - back);
		glowLines(g, v, [[pos[15], pos[1016]]], AMBER, 2.4, lk);
	}

	// ---------- 洪水的光雾（满屏奇观）
	if (flood) {
		let nl = 0;
		for (let i = 0; i < N; i++) if (lit(i)) nl++;
		const f = nl / N;
		const fs = Math.sqrt(f);
		const sp = P(v, DC);
		// 审片：峰值时整屏铺成平的灰棕色、圆心过曝 → 只留一层从圆心往外衰减的金色光雾（四角保持深靛），
		// 不再整屏抬底；第 6 层起放射光芒和迸出的星点一路冲到画面四边，做成真正的「满」
		floodGlow(g, sp[0], sp[1], (520 + 560 * fs) * v.s * 0.7, 0.1 + 0.3 * fs);
		const flat: number[] = [];
		for (const [a, b] of LOCAL_EDGES) if (lit(a) && lit(b)) flat.push(pos[a][0], pos[a][1], pos[b][0], pos[b][1]);
		hairSegs(g, v, flat, '#e8dcc8', 1.1, 0.2);
		drawRays(g, t, sp, DISC_R * v.s);
		drawBurst(g, t, v, sp);
	}

	// ---------- 星
	if (!cut) {
		// 审片：星盘上的两千颗星太暗，看不出是两千个人 → 0.36 → 0.5
		const discDim = lerp(1, 0.5, dn) * (1 - 0.55 * rp);
		const starA = gather * quietAfter * toAvatars;
		const gathering = t >= 144.8 && t < 146.1;
		for (let i = 0; i < N; i++) {
			if (i === YOU || i === THEM) continue;
			let k = STARS.lum[i] * (dn > 0.5 ? twDisc(t, i) : tw(t, i)) * discDim * starA;
			if (gathering) {
				const u = gatherU(t, i);
				k = STARS.lum[i] * discDim * lerp(FROM_CLIQUE.has(i) ? 2.6 : 1.4, 1, u) * lerp(FROM_CLIQUE.has(i) ? 1 : sm(t, 144.8, 145.3), 1, u);
			}
			if (t > 194 && (CL15.includes(i) || CL1016.includes(i))) k *= 1 + 2.6 * cliqueK(t);
			const p = pos[i];
			if (rp > 0 && LDIST[i] <= L) {
				// 波前：最前面一层整层亮；身后的拖尾只留三颗里的一颗、慢慢暗下去，读起来是一颗颗星依次点亮（不是连续的实弧）
				const back = L - LDIST[i];
				const w = Math.exp(-back / 3.0);
				if (back < 1.0) {
					glow(g, v, p, 11, '#e8eef6', (0.3 + 0.9 * w) * rp, 'star');
					glow(g, v, p, 26, '#cfdcec', 0.3 * rp, 'soft');
				} else if (i % 3 === 0) glow(g, v, p, 10, '#e8eef6', (0.08 + 0.85 * w) * rp, 'star');
			}
			if (flood && lit(i)) {
				const e = t - LIT_T[i];
				glow(g, v, p, 16, AMBER, 1.0 * Math.exp(-e / 0.22), 'dot');
				glow(g, v, p, 7, '#f3f0ea', 0.7 * smooth(e / 0.3), 'star');
				continue;
			}
			// 放大镜下星更小更清楚
			// 放大镜下：「你」附近的星是一颗颗清楚的亮星；被挤到远处的那一侧压暗（不再挤成一根白管子）
			const near = nearYou(i) ? 1 : 0;
			let dd = Math.abs(((((i - YOU) % N) + N) % N) - (N / 2)) ;
			dd = N / 2 - dd;
			const farDim = 1 - 0.85 * lk * clamp((dd - 160) / 120);
			const r = STARS.rad[i] * lerp(3.4, 2.6, dn) * (1 + 0.25 * lk * near);
			glow(g, v, p, r, SILVER, k * (1 + 1.8 * lk * near) * farDim, 'star');
		}
	}

	// ---------- 汇聚时的短拖尾（只有星点 + 很短的尾巴）
	if (t >= 144.8 && t < 146.1) {
		const flat1: number[] = [];
		const flat2: number[] = [];
		for (let i = 0; i < N; i += 3) {
			const u = gatherU(t, i);
			if (u <= 0.02 || u >= 0.98) continue;
			const q1 = posAt(t - 0.067, i, dn);
			const q2 = posAt(t - 0.133, i, dn);
			flat1.push(q1[0], q1[1], pos[i][0], pos[i][1]);
			flat2.push(q2[0], q2[1], q1[0], q1[1]);
		}
		const ta = gather * (1 - sm(t, 145.6, 146.0));
		hairSegs(g, v, flat1, SILVER, 1, 0.1 * ta);
		hairSegs(g, v, flat2, SILVER, 1, 0.035 * ta);
	}
	// ---------- 「你」和陌生人
	const youK = (cut ? 0 : 1) * (t >= SIL_END ? back : 1) * toAvatars;
	const amberYou = flood ? 0.4 : 0;
	if (!cut) drawYou(g, v, pos[YOU], youK, t, amberYou);
	const themK = t >= 154.3 ? sm(t, 154.3, 155.0) : 0;
	if (!cut) drawStranger(g, v, pos[THEM], themK * (t >= SIL_END ? back : 1) * toAvatars * (1 + 1.6 * pulse(t, 165.6, 1.0)) * (flood ? 1.4 : 1), t);
	if (rp > 0 && L > 2) {
		for (const dir of [1, -1]) {
			const idx = (((dir * Math.round(10 * Math.min(L, 100))) % N) + N) % N;
			glow(g, v, pos[idx], 18, SILVER, 0.7 * rp * (L < 100 ? 1 : 0), 'dot');
		}
	}

	// ---------- 信：走开头那条路，一百步塌成五步（173.2 → 177.77）
	if (t >= 173.2 && !cut) {
		const curves = hopCurves(pos, PATH, [0, 0, 0, 0, 0].map((b, k) => (k === 2 ? -0.08 : 0.12) * (1 - dn)));
		const lines = routeLines(t, 173.2, H2, curves);
		const k = t < SIL_END ? 0.6 : 0.5 * back;
		const shortK = k * (t > 189.9 ? lerp(1, 0.25, sm(t, 190.0, 190.8)) : 1) * toAvatars;
		// 静音后长弦从 0 亮回来（静音里那根单独画的长弦同时退掉，两者相加不跳）
		const longK = (t < 176.1 ? 0.95 : t > 189.9 ? lerp(k, 1.0, sm(t, 190.0, 190.8)) + 0.3 * pulse(t, 190.0, 1.4) : k) * toAvatars;
		glowLines(g, v, lines.filter((_, j) => j !== 2), AMBER, 1.8, shortK);
		glowLines(g, v, [lines[2]], AMBER, 2.4, longK);
		if (t < H2[4] + 0.5) {
			const tail = routeTail(t, 173.2, H2, curves, 20, 0.02);
			comet(g, v, tail, AMBER, 3.2, 1 - sm(t, H2[4], H2[4] + 0.4), 28);
		}
		// 五次落地：落到的那颗星上闪一圈琥珀细环（和五个钢琴音对上，数得出「五」）
		for (let k5 = 0; k5 < 5; k5++) {
			const t0 = H2[k5];
			const a = vis(t, t0, t0 + 0.55, 0.03, 0.3);
			if (a <= 0) continue;
			// 审片：每个落点闪一个 r 22 的小环（序号 1–4 由 Overlays 挂出）
			ringAt(g, P(v, pos[PATH[k5 + 1]]), 22 * (1 + 0.2 * clamp((t - t0) / 0.4)), a);
			glow(g, v, pos[PATH[k5 + 1]], 16, AMBER, 0.8 * a, 'dot');
		}
		// 3:07 回扣：四个中间人身上的细环回来（和 0:27 那一帧一样）
		if (t > 188.0 && t < 193.4) midRings(g, t, v, pos, [188.4, 188.4, 188.4, 188.4], vis(t, 188.4, 192.8, 0.5, 0.6) * toAvatars);
	}
	// 177.77 到达：陌生人爆亮（光晕 r 120 + 三圈同心环扩散）
	if (t >= H2[4] && t < cutT) {
		const e = t - H2[4];
		const pt = P(v, pos[THEM]);
		glow(g, v, pos[THEM], 120 * (0.6 + 0.4 * Math.min(1, e / 0.3)), '#f4efe2', 1.0 * Math.exp(-e / 0.9), 'dot');
		for (let r = 0; r < 3; r++) {
			const q = (e - r * 0.18) / 1.4;
			if (q > 0 && q < 1) glowLines(g, ID, [arcPts(pt[0], pt[1], 30 + 260 * easeOutQ(q))], AMBER, 1.4, 0.8 * (1 - q), false);
		}
	}

	// ---------- 洪水时四角留深靛：把这一层的光朝四角抠掉一部分（底下的深靛背景透出来），放射光仍然碰到画面四边
	if (flood) {
		const m = 0.62 * sm(t, FL[2], FL[5]);
		const gr = g.createRadialGradient(960, 540, 420, 960, 540, 1150);
		gr.addColorStop(0, 'rgba(0,0,0,0)');
		gr.addColorStop(0.55, `rgba(0,0,0,${0.35 * m})`);
		gr.addColorStop(1, `rgba(0,0,0,${m})`);
		g.save();
		g.globalCompositeOperation = 'destination-out';
		g.fillStyle = gr;
		g.fillRect(0, 0, 1920, 1080);
		g.restore();
	}
	// ---------- 回扣（3:07）：小圈子 + 6 根弦依次亮一下
	if (t > 194) {
		const ca = cliqueK(t) * toAvatars;
		if (ca > 0) {
			const segs: XY[][] = [];
			for (const cl of [CL15, CL1016]) for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) segs.push([pos[cl[a]], pos[cl[b]]]);
			hairLinesW(g, v, segs, SILVER, 1.1, 0.62 * ca);
			for (const cl of [CL15, CL1016]) for (const i of cl) glow(g, v, pos[i], 9, SILVER, 0.55 * ca, 'dot');
		}
		FLASH6.forEach((ck, q) => {
			const p = pulse(t, 197.5 + q * 0.3, 0.75);
			if (p <= 0) return;
			const [i, , c] = CHORDS[ck];
			glowLines(g, v, [samp(bez(pos[i], pos[c], -0.06), 30)], AMBER, 1.2, 0.75 * p);
			glow(g, v, pos[i], 10, AMBER, 0.6 * p, 'dot');
			glow(g, v, pos[c], 10, AMBER, 0.6 * p, 'dot');
		});
	}
};
const easeOutQ = (x: number) => 1 - Math.pow(1 - x, 2.2);
/** 细发光线：只有两层（没有 9 倍宽的外晕），很多根交叠时不会糊成一块 */
const thinGlow = (g: Ctx, v: View, polys: XY[][], color: string, k: number) => {
	const h = parseInt(color.slice(1), 16);
	const c = `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;
	g.lineCap = 'round';
	g.beginPath();
	for (const pts of polys) {
		g.moveTo(pts[0][0] * v.s + v.ox, pts[0][1] * v.s + v.oy);
		for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * v.s + v.ox, pts[i][1] * v.s + v.oy);
	}
	g.strokeStyle = `rgba(${c},${clamp(0.1 * k)})`;
	g.lineWidth = 3.2;
	g.stroke();
	g.strokeStyle = `rgba(${c},${clamp(0.55 * k)})`;
	g.lineWidth = 1.1;
	g.stroke();
};

// ---------------------------------------------------------------- 4:07–4:44 结尾
const drawFinale = (g: Ctx, t: number, v: View, pos: XY[]) => {
	if (TG2 && !TAKEN2) TAKEN2 = titleTaken(TG2);
	const t2 = T2;
	const fadeIn = sm(t, 247.0, 248.6);
	let band = fadeIn * 0.6;
	band *= lerp(1, 0.5, sm(t, t2.start, t2.start + 0.6));
	band *= lerp(1, 0.5, sm(t, t2.fly[0], t2.fly[1]));
	const out = 1 - sm(t, t2.card_out[0], t2.card_out[1]);
	band *= out;
	drawEngrave(g, v, 0.02 * band);

	// 24 根琥珀线
	const youP = pos[YOU];
	const flash = t < 259.7 ? 0.3 : t < 261.6 ? lerp(0.3, 0.75, sm(t, 259.7, 260.4)) - (0.75 - 0.4) * sm(t, 260.6, 261.6) : 0.4;
	const lk = flash * lerp(1, 0.15 / 0.4, sm(t, 264.5, 265.3)) * (1 - sm(t, t2.start, t2.start + 1.2)) * out;
	const polys: XY[][] = [];
	for (const L of LINES24) {
		const u = easeInOut(clamp((t - L.t0) / 0.6));
		if (u <= 0) continue;
		polys.push(samp(bez(youP, pos[L.c], L.bend), 30, 0, u));
	}
	glowLines(g, v, polys, AMBER, 1.2, lk, false);

	// 星
	const taken = TAKEN2;
	const flyStarted = t >= t2.fly[0];
	const far = new Set(LINES24.map((l) => l.c));
	for (let i = 0; i < N; i++) {
		if (i === YOU || i === THEM) continue;
		if (flyStarted && taken && taken[i]) continue;
		let k = STARS.lum[i] * tw(t, i) * band * 1.3;
		if (far.has(i)) {
			const L = LINES24.find((l) => l.c === i)!;
			const reach = sm(t, L.t0 + 0.5, L.t0 + 0.7);
			k *= 1 + 1.2 * reach * (1 - sm(t, 264.5, 265.5)) + 3 * pulse(t, 259.9 + (i % 7) * 0.04, 1.0);
		}
		if (i === CLAUDE_STAR) k *= 1 + 4 * vis(t, 264.7, 268.9, 0.4, 1.0);
		glow(g, v, pos[i], STARS.rad[i] * 3, SILVER, k, 'star');
	}
	if (t >= 264.7 && t < 269) glow(g, v, pos[CLAUDE_STAR], 18, SILVER, 0.8 * vis(t, 264.7, 268.9, 0.4, 1.0), 'dot');

	// CLAUDE 寄来的信：一小跳，一根长弦穿过星带中间，再一小跳，267.7 落进「你」
	const cr = CLAUDE_ROUTE;
	const ccurves = hopCurves(pos, cr, [0.15, -0.38, 0.12]);
	const carr = [265.9, 267.2, 267.7];
	if (t >= 265.4 && t < 268.4) {
		const tail = routeTail(t, 265.4, carr, ccurves, 16, 0.022);
		comet(g, v, tail, AMBER, 3.0, 1 - sm(t, 267.7, 268.2), 24);
	}
	if (t >= 265.4) {
		const lines = routeLines(t, 265.4, carr, ccurves);
		glowLines(g, v, lines, AMBER, 1.6, 0.5 * (1 - sm(t, 268.0, 270.0)) * out, false);
	}
	// 「你」：落进来后被染成琥珀
	const amber = sm(t, 267.7, 268.4) * (1 - 0.5 * sm(t, 272.7, 274.0));
	const charA = out * (1 - sm(t, t2.fly[0], t2.fly[1]));
	drawYou(g, v, youP, fadeIn * charA * (1 + 0.8 * pulse(t, 267.7, 1.0)), t, amber);
	if (t >= 267.7 && t < 270.4) glow(g, v, youP, 22, AMBER, 0.8 * sm(t, 267.7, 267.9), 'dot');

	// 你寄出去的信：270.4 沿一道长长的琥珀弧飞向开头那个陌生人，272.7 到达
	const arcB = -0.32;
	const arcFn = bez(youP, pos[THEM], arcB);
	if (t >= 270.4) {
		const u = easeInOut(clamp((t - 270.4) / (272.7 - 270.4)));
		const lineK = 0.75 * out;
		if (t < t2.fly[0]) glowLine(g, v, samp(arcFn, 60, 0, u), AMBER, 2.2, lineK);
		if (t < 273.2) {
			const tail: XY[] = [];
			for (let j = 15; j >= 0; j--) tail.push(arcFn(easeInOut(clamp((t - j * 0.024 - 270.4) / 2.3))));
			comet(g, v, tail, AMBER, 3.2, 1 - sm(t, 272.7, 273.2), 28);
		}
	}
	const themOn = sm(t, 272.5, 272.9) * charA;
	drawStranger(g, v, pos[THEM], themOn * (1 + 1.5 * pulse(t, 272.7, 1.2)), t);
	if (t >= 272.7 && t < 274) {
		const fe = (t - 272.7) / 1.1;
		if (fe < 1) glow(g, v, pos[THEM], 24 + 46 * Math.sqrt(fe), SILVER, 0.9 * (1 - fe), 'dot');
	}

	// 片尾片名：桥是你刚寄出去的那道弧
	if (TG2 && t >= t2.fly[0] - 0.01) {
		const a = youP;
		const b = pos[THEM];
		const c = bezCtl(a, b, arcB);
		drawTitle(
			g,
			t,
			TG2,
			{
				fly: t2.fly as unknown as [number, number],
				lift: [t2.fly[0] + 0.1, t2.bridge[0] - 0.05],
				bridge: t2.bridge as unknown as [number, number],
				hair: [276.6, 277.5],
				land: t2.land,
				out: t2.card_out as unknown as [number, number],
				flash: 279.4,
			},
			(s) => P(v, pos[s]),
			{a: P(v, a), b: P(v, b), c: P(v, c)},
			0.75,
		);
	}
};

// ================================================================ 给 DOM 标签用的位置
/** i < 0：星带 / 星盘的中心 */
export const worldScreen = (t: number, i: number): XY => {
	const v = worldView(t);
	return P(v, i < 0 ? BAND_C : posAt(t, i, discness(t)));
};
export const rippleL = (t: number) => {
	const c = A.crawl;
	if (t < c.slow[0]) return 0;
	if (t < c.slow[1]) return (t - c.slow[0]) / 0.278;
	const tau = Math.min(t, c.fast_end) - c.slow[1];
	const T = c.fast_end - c.slow[1];
	const v0 = 1 / 0.278;
	const a3 = (100 - 6 - v0 * T) / (T * T * T);
	return Math.min(100, 6 + v0 * tau + a3 * tau * tau * tau);
};
export {easeIn, inv};
