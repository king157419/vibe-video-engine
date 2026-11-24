// 主长卷：天色带 + 生活场景 + 图表（灰面积、蓝线、淡红斜线）+ 钉子。
// 所有元素都只读同一个“故事时间 → 屏幕 x”的映射（Lay），所以天色、两条曲线、小人、钉子永远对齐。
import React from 'react';
import type {Clock, Model, Numbers} from './data';
import {clamp01, darkness, ease, lerp, pulse, ramp, rng, skyColor, wobble} from './data';
import {Arrow, Bracket, Hand, LampGlow, Person, PinHead, Prop, Ring, textW} from './draw';
import {COL} from './theme';

// ---------------------------------------------------------------- 映射
export type HourMap = {h0: number; h1: number; x0: number; x1: number};
export const xm = (m: HourMap, h: number) => m.x0 + ((h - m.h0) * (m.x1 - m.x0)) / (m.h1 - m.h0);
export const hm = (m: HourMap, x: number) => m.h0 + ((x - m.x0) * (m.h1 - m.h0)) / (m.x1 - m.x0);
export const pxh = (m: HourMap) => (m.x1 - m.x0) / (m.h1 - m.h0);

export type Lay = HourMap & {
	skyY0: number;
	skyY1: number;
	v1: number; // v=1 时的 y
	v0: number; // v=0 时的 y（灰面积的底）
	pinY: number;
	pinSize: number;
	pinRow: number; // 钉子错行的行距（宽镜头时防重叠）
	scene: number; // 生活场景带不透明度
	skyLab: number; // 天色带里的钟点字
	axis: number; // 图表下方时间轴
	axisY: number;
	note: number; // 右下“示意，非实测”
	noteX: number;
	noteY: number;
	hMin: number; // 从哪个故事时间开始画
	hMax: number; // 画到哪个故事时间为止（局部放大时裁掉两边）
};
export const yv = (L: Lay, v: number) => L.v0 + (L.v1 - L.v0) * v;
export const mixLay = (a: Lay, b: Lay, u: number): Lay => {
	const o = {} as Lay;
	(Object.keys(a) as (keyof Lay)[]).forEach((k) => {
		o[k] = lerp(a[k], b[k], u);
	});
	return o;
};

// ---------------------------------------------------------------- 天色带
/** 天色带外形：上沿平直，下沿是固定种子的水彩边（按故事时间取值，平移时不抖） */
export const skyPath = (m: HourMap, ha: number, hb: number, y0: number, y1: number, seed = 0) => {
	const xa = xm(m, ha);
	const xb = xm(m, hb);
	if (xb - xa < 1) return '';
	const amp = 5 * clamp01(pxh(m) / 200);
	const n = Math.max(8, Math.ceil((xb - xa) / 24));
	const pts: string[] = [`M${xa.toFixed(1)} ${y0}`, `L${xb.toFixed(1)} ${y0}`];
	for (let k = n; k >= 0; k--) {
		const x = xa + ((xb - xa) * k) / n;
		const h = hm(m, x);
		pts.push(`L${x.toFixed(1)} ${(y1 + amp * wobble(h * 1.7, seed)).toFixed(1)}`);
	}
	return pts.join(' ') + ' Z';
};

export const SkyBand: React.FC<{
	id: string;
	m: HourMap;
	ha: number;
	hb: number;
	y0: number;
	y1: number;
	shift?: number; // 天色按 (h + shift) 取色：伦敦小卷用
	feather?: boolean;
	opacity?: number;
	seed?: number;
}> = ({id, m, ha, hb, y0, y1, shift = 0, feather = false, opacity = 1, seed = 0}) => {
	const d = skyPath(m, ha, hb, y0, y1, seed);
	if (!d) return null;
	const xa = xm(m, ha);
	const xb = xm(m, hb);
	const n = Math.max(8, Math.min(160, Math.ceil((hb - ha) * 5)));
	const featherPx = feather ? 40 : 0;
	const stops: React.ReactNode[] = [];
	for (let k = 0; k <= n; k++) {
		const u = k / n;
		const h = ha + (hb - ha) * u;
		const x = xa + (xb - xa) * u;
		const op = featherPx > 0 ? clamp01((xb - x) / featherPx) : 1;
		stops.push(<stop key={k} offset={u} stopColor={skyColor(h + shift)} stopOpacity={op} />);
	}
	return (
		<g opacity={opacity}>
			<defs>
				<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={xa} y1={0} x2={xb} y2={0}>
					{stops}
				</linearGradient>
			</defs>
			<path d={d} fill={`url(#${id})`} />
		</g>
	);
};

/** 星星、太阳、月亮：钉在故事时间上 */
const STARS = (() => {
	const r = rng(7);
	const out: {h: number; v: number; s: number}[] = [];
	for (let h = 18.4; h < 30.4; h += 0.21 + r() * 0.18) out.push({h, v: 0.12 + r() * 0.62, s: 1.6 + r() * 2.2});
	return out;
})();
export const SkyDecor: React.FC<{m: HourMap; ha: number; hb: number; y0: number; y1: number; opacity?: number; shift?: number}> = ({m, ha, hb, y0, y1, opacity = 1, shift = 0}) => {
	const k = Math.max(1, Math.round(40 / (pxh(m) * 0.3)));
	const hgt = y1 - y0;
	const sz = clamp01(pxh(m) / 360) * 0.6 + 0.4;
	const items: React.ReactNode[] = [];
	STARS.forEach((st, i) => {
		if (i % k !== 0) return;
		const h = st.h - shift;
		if (h < ha || h > hb) return;
		const dk = darkness(st.h);
		if (dk < 0.3) return;
		items.push(<circle key={`s${i}`} cx={xm(m, h)} cy={y0 + hgt * st.v} r={st.s * sz} fill="#fffbe8" opacity={0.85 * dk} />);
	});
	const sunR = Math.max(12, 30 * sz) * (hgt / 230) ** 0.5;
	[12.5, 36.5].forEach((hh, i) => {
		const h = hh - shift;
		if (h < ha || h > hb) return;
		items.push(
			<g key={`sun${i}`}>
				<circle cx={xm(m, h)} cy={y0 + hgt * 0.36} r={sunR * 1.5} fill={COL.sun} opacity={0.18} />
				<circle cx={xm(m, h)} cy={y0 + hgt * 0.36} r={sunR} fill={COL.sun} />
			</g>,
		);
	});
	[25.3].forEach((hh, i) => {
		const h = hh - shift;
		if (h < ha || h > hb) return;
		const cx = xm(m, h);
		const cy = y0 + hgt * 0.34;
		items.push(
			<g key={`moon${i}`}>
				<circle cx={cx} cy={cy} r={sunR * 0.85} fill={COL.paper} />
				<circle cx={cx + sunR * 0.42} cy={cy - sunR * 0.2} r={sunR * 0.72} fill={skyColor(hh)} />
			</g>,
		);
	});
	return <g opacity={opacity}>{items}</g>;
};

// ---------------------------------------------------------------- 曲线的屏幕路径
export const samples = (ts: number[], ha: number, hb: number) => {
	const out: number[] = [ha];
	for (const h of ts) if (h > ha + 1e-6 && h < hb - 1e-6) out.push(h);
	out.push(hb);
	return out;
};
/** Catmull-Rom → 三次贝塞尔：让 5 分钟一个的采样点连成光滑的手绘线 */
export const smoothPath = (pts: [number, number][]) => {
	if (pts.length < 2) return '';
	let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		const c1x = p1[0] + (p2[0] - p0[0]) / 6;
		const c1y = p1[1] + (p2[1] - p0[1]) / 6;
		const c2x = p2[0] - (p3[0] - p1[0]) / 6;
		const c2y = p2[1] - (p3[1] - p1[1]) / 6;
		d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
	}
	return d;
};

/** 两条曲线之间 top>bottom 的那几段，做成多边形（斜线区 = 困） */
export const gapPolys = (hs: number[], top: (h: number) => number, bot: (h: number) => number, X: (h: number) => number, Y: (v: number) => number) => {
	const polys: string[] = [];
	let run: {h: number; a: number; b: number}[] = [];
	const flush = () => {
		if (run.length >= 2) {
			const up = run.map((p) => `${X(p.h).toFixed(1)},${Y(p.a).toFixed(1)}`);
			const dn = [...run].reverse().map((p) => `${X(p.h).toFixed(1)},${Y(p.b).toFixed(1)}`);
			polys.push([...up, ...dn].join(' '));
		}
		run = [];
	};
	for (let i = 0; i < hs.length; i++) {
		const h = hs[i];
		const g = top(h) - bot(h);
		if (i > 0) {
			const hp = hs[i - 1];
			const gp = top(hp) - bot(hp);
			if ((gp > 0) !== (g > 0)) {
				const hc = hp + ((h - hp) * gp) / (gp - g);
				const vc = top(hc);
				if (g > 0) {
					run = [{h: hc, a: vc, b: vc}];
				} else {
					run.push({h: hc, a: vc, b: vc});
					flush();
				}
			}
		}
		if (g > 0) run.push({h, a: top(h), b: bot(h)});
	}
	flush();
	return polys;
};

export const HatchDefs: React.FC<{id: string; ox: number; color?: string; gap?: number; sw?: number}> = ({id, ox, color = COL.drowsy, gap = 15, sw = 2.4}) => {
	const T = gap * 10;
	const lines: React.ReactNode[] = [];
	for (let c = -T; c <= 2 * T; c += gap) {
		lines.push(<line key={c} x1={c} y1={T} x2={c + T} y2={0} stroke={color} strokeWidth={sw} strokeLinecap="round" />);
	}
	return (
		<defs>
			<pattern id={id} patternUnits="userSpaceOnUse" width={T} height={T} patternTransform={`translate(${(((ox % T) + T) % T).toFixed(2)} 0)`}>
				{lines}
			</pattern>
		</defs>
	);
};

// ---------------------------------------------------------------- 生活场景（长卷上一段一段的小画）
type Vig = {h: number; kind: string};
export const VIGNETTES: Vig[] = [
	{h: 8.5, kind: 'bedUp'},
	{h: 10.3, kind: 'bus'},
	{h: 13.3, kind: 'office'},
	{h: 17.0, kind: 'walk'},
	{h: 19.3, kind: 'deskAlert'},
	{h: 23.4, kind: 'deskWrite'},
	{h: 25.75, kind: 'deskProp'},
	{h: 27.9, kind: 'deskNod'},
	{h: 32.1, kind: 'walkCup'},
	{h: 35.4, kind: 'officeUp'},
	{h: 38.4, kind: 'officeSlump'},
	{h: 42.4, kind: 'walk'},
];
// 审片 P0-2 后长卷改成 160 px/小时：小画缩到 1.6 倍，放在钉子钟点前约 1.7 小时，
// 镜头停在钉子上时，整幅小画（含右边的窗）已经画完。
export const SCENE_S = 1.6;
// 两条线的名字：一屏（约 9.75 小时）里最多出现一次；第二天 32 点附近留给“沙漏没倒”箭头
const CURVE_LABEL_HOURS = [9.6, 16.8, 25.6];
export const GROUND_Y = 470;
/** 审片 P2-4：一屏里同时有好几幅小画时像好几个人。只有 playhead 处那幅是实的，前面的淡成残影 */
const vigGhost = (i: number, D: number) => {
	const next = VIGNETTES[i + 1];
	if (!next) return 0;
	return clamp01((D - (next.h - 0.6)) / 0.8);
};

/** 场景里的小窗：窗外就是这一刻的天色 */
const SceneWindow: React.FC<{x: number; y: number; w: number; h: number; hour: number}> = ({x, y, w, h, hour}) => {
	const dk = darkness(hour);
	return (
		<g>
			<rect x={x} y={y} width={w} height={h} fill={skyColor(hour)} />
			{dk > 0.4 ? (
				<g opacity={dk}>
					<circle cx={x + w * 0.3} cy={y + h * 0.3} r={2.4} fill="#fffbe8" />
					<circle cx={x + w * 0.72} cy={y + h * 0.22} r={2} fill="#fffbe8" />
					<circle cx={x + w * 0.6} cy={y + h * 0.7} r={1.8} fill="#fffbe8" />
				</g>
			) : null}
			<rect x={x} y={y} width={w} height={h} fill="none" stroke={COL.ink} strokeWidth={3} />
			<line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={COL.ink} strokeWidth={2.4} />
			<line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={COL.ink} strokeWidth={2.4} />
			<line x1={x - 8} y1={y + h + 4} x2={x + w + 8} y2={y + h + 4} stroke={COL.ink} strokeWidth={3} strokeLinecap="round" />
		</g>
	);
};

const Vignette: React.FC<{v: Vig; x: number; t: number; S: (h: number) => number; clock: Clock; idx: number; hgK?: number}> = ({v, x, t, S, clock, idx, hgK = 1}) => {
	const s = SCENE_S;
	const y = GROUND_Y;
	const level = S(v.h);
	const seed = 100 + idx * 7;
	const night = darkness(v.h);
	switch (v.kind) {
		case 'bedUp':
			return (
				<g>
					<Prop kind="bed" x={x + 20} y={y} s={s} seed={seed} />
					<Person pose="bedUp" x={x + 20} y={y} s={s} seed={seed + 1} level={level} hgK={hgK} />
				</g>
			);
		case 'bus':
			return (
				<g>
					<Prop kind="busstop" x={x} y={y} s={s} seed={seed} />
					<Hand x={x - 34 * s} y={y - 110 * s} size={36} anchor="middle">
						站
					</Hand>
					<Person pose="stand" x={x + 10} y={y} s={s} seed={seed + 1} level={level} hgK={hgK} />
				</g>
			);
		case 'walk':
		case 'walkCup':
			return (
				<g>
					<Person pose="walk" x={x} y={y} s={s} seed={seed + 1} level={level} hgK={hgK} />
					{v.kind === 'walkCup' ? <Prop kind="handCup" x={x} y={y} s={s} seed={seed + 2} /> : null}
				</g>
			);
		case 'office':
		case 'officeUp':
		case 'officeSlump': {
			const pose = v.kind === 'officeSlump' ? 'slump' : 'sit';
			return (
				<g>
					<Prop kind="chair" x={x} y={y} s={s} seed={seed} />
					<Prop kind="desk" x={x} y={y} s={s} seed={seed + 2} />
					<Prop kind="monitor" x={x} y={y} s={s} seed={seed + 3} />
					{v.kind === 'officeUp' ? <Prop kind="cup" x={x} y={y} s={s} seed={seed + 4} /> : null}
					<Person pose={pose} x={x} y={y} s={s} seed={seed + 1} level={level} hgK={hgK} />
				</g>
			);
		}
		default: {
			// 家里书桌（夜里台灯亮）
			let pose: 'sit' | 'sitNod' | 'sitProp' = 'sit';
			let armRot = 0;
			let headRot = 0;
			if (v.kind === 'deskProp') pose = 'sitProp';
			if (v.kind === 'deskNod') {
				pose = 'sitNod';
				// 头一点一点：慢慢往下垂，猛地抬起（只在镜头停在这里时动）
				const a0 = clock.sub(13).t0;
				const a1 = clock.sub(14).t0;
				if (t > a0 && t < a1 + 0.5) {
					const ph = ((t - a0) % 1.9) / 1.9;
					headRot = ph < 0.78 ? 16 * ease(ph / 0.78) : 16 * (1 - ease((ph - 0.78) / 0.22));
				}
			}
			if (v.kind === 'deskAlert') {
				// 精神地写字：手在纸上小幅来回（镜头停在 21:00 那几秒）
				const a0 = clock.sub(10).t0;
				const a1 = clock.sub(11).t1;
				if (t > a0 && t < a1) armRot = 4 * Math.sin((t - a0) * Math.PI * 2 * 1.6);
			}
			return (
				<g>
					<SceneWindow x={x + 112 * s} y={y - 150 * s} w={52 * s} h={50 * s} hour={v.h} />
					<LampGlow x={x} y={y} s={s} on={night} />
					<Prop kind="chair" x={x} y={y} s={s} seed={seed} />
					<Prop kind="desk" x={x} y={y} s={s} seed={seed + 2} />
					<Prop kind="lamp" x={x} y={y} s={s} seed={seed + 3} />
					<Prop kind="books" x={x} y={y} s={s} seed={seed + 4} />
					<Person pose={pose} x={x} y={y} s={s} seed={seed + 1} level={level} armRot={armRot} headRot={headRot} hgK={hgK} />
				</g>
			);
		}
	}
};

// ---------------------------------------------------------------- 钉子
export type PinState = {text: string; hour: number; p: number; glow?: number};
const PinMark: React.FC<{L: Lay; pin: PinState; i: number; S: (h: number) => number; C: (h: number) => number; row: number; leader: number; match?: number}> = ({
	L,
	pin,
	i,
	S,
	C,
	row,
	leader,
	match = 0,
}) => {
	const x = xm(L, pin.hour);
	const y = L.pinY - row * L.pinRow;
	const s = S(pin.hour);
	const c = C(pin.hour);
	// 平时指向缝的中间（没缝时指向潮水）；压平后（P1-1）往下延长到沙漏线 = B 的那一点
	const target = lerp(s > c ? (s + c) / 2 : c, s, match);
	const ty = yv(L, target);
	const w = textW(pin.text, L.pinSize);
	const op = clamp01(pin.p * 4);
	return (
		<g opacity={op}>
			{leader > 0 ? (
				<line
					x1={x}
					y1={y + 10}
					x2={x}
					y2={ty - 8 * (1 - match)}
					stroke={COL.ink}
					strokeWidth={2 + 0.8 * match}
					strokeDasharray="3 7"
					strokeLinecap="round"
					opacity={lerp(0.55, 0.95, match) * leader * clamp01(pin.p * 2)}
				/>
			) : null}
			{match > 0 ? <circle cx={x} cy={ty} r={8} fill={COL.ink} stroke={COL.paper} strokeWidth={3} opacity={clamp01(match * 2 - 1)} /> : null}
			{pin.glow ? <rect x={x - w / 2 - 14} y={y - L.pinSize * 1.05} width={w + 28} height={L.pinSize * 1.4} rx={10} fill={COL.lamp} opacity={0.9 * pin.glow} /> : null}
			<PinHead x={x - w / 2 - L.pinSize * 0.42} y={y - L.pinSize * 0.62} r={L.pinSize * 0.17} />
			<Hand id={`pin${i}`} x={x} y={y} size={L.pinSize} anchor="middle" wipe={pin.p} halo={COL.paper}>
				{pin.text}
			</Hand>
		</g>
	);
};

// ---------------------------------------------------------------- 主长卷
export type ScrollOpts = {
	pins: PinState[];
	pinLeader: number;
	stagger: boolean;
	hatchDim?: number; // 0 正常；>0 时把 windows 以外的斜线压暗
	windows?: [number, number][];
	blueGlow?: number; // 蓝线闪一下
	grayGlow?: number; // 灰面积闪一下
	blueSeg?: {a: number; b: number; k: number}; // 高亮一段蓝线
	grayDim?: number; // 灰面积整体压暗（突出别的）
	dimScene?: number;
	opacity?: number;
	axisSkip?: {hours: number[]; k: number}; // 车祸钟点出现时，把挨着它们的普通刻度字淡掉（不叠字）
	/** 审片（第二轮）P1-1：压平。f=1 时潮水拉直到 v=vb，沙漏线跟着落同样的高度（每个钟点的缝厚度不变）→ 沙漏线 = vb + (沙漏 − 潮水)，就是 B 的形状；
	 *  match=1 时钉子的虚线往下延长到压平后的沙漏线（B 的谷、峰、谷、再涨处），并点一个墨点 */
	flat?: {f: number; vb: number; match: number};
	idp: string; // svg id 前缀
};

export const ScrollWorld: React.FC<{
	L: Lay;
	D: number;
	t: number;
	model: Model;
	nums: Numbers;
	clock: Clock;
	o: ScrollOpts;
	children?: React.ReactNode;
}> = ({L, D, t, model, nums, clock, o, children}) => {
	const pph = pxh(L);
	const ha = Math.max(L.hMin, hm(L, -60));
	const hb = Math.min(D, L.hMax, hm(L, 1980));
	if (hb <= ha) return null;
	const X = (h: number) => xm(L, h);
	const Y = (v: number) => yv(L, v);
	const hs = samples(nums.main.t, ha, hb);
	const wk = clamp01(pph / 360) * 0.8 + 0.2;
	// 压平（P1-1）：两条线在同一钟点往同一方向挪同样的量，缝的厚度不变
	const ff = o.flat ? o.flat.f : 0;
	const vb = o.flat ? o.flat.vb : 0;
	const dv = (h: number) => (ff > 0 ? ff * (vb - model.C(h)) : 0);
	const Sx = (h: number) => model.S(h) + dv(h);
	const Cx = (h: number) => model.C(h) + dv(h);
	// 灰面积（沙漏）
	const sPts: [number, number][] = hs.map((h) => [X(h), Y(Sx(h)) + 1.3 * wk * wobble(h * 4, 1)]);
	const grayPoly = `${sPts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} ${X(hb).toFixed(1)},${L.v0} ${X(ha).toFixed(1)},${L.v0}`;
	// 蓝线（潮水）：两笔，像手画的复描
	const cPts: [number, number][] = hs.map((h) => [X(h), Y(Cx(h)) + 1.5 * wk * wobble(h * 3.3, 2) * (1 - ff)]);
	const cPts2: [number, number][] = hs.map((h) => [X(h) + 0.8, Y(Cx(h)) + 1.6 + 2.0 * wk * wobble(h * 2.1, 5) * (1 - ff)]);
	// 斜线区（困）
	const polys = gapPolys(hs, Sx, Cx, X, Y);
	const xD = X(D);
	const id = o.idp;
	const hatchOx = X(8);
	const dim = o.hatchDim ?? 0;
	let winPolys: string[] = [];
	if (dim > 0 && o.windows) {
		winPolys = o.windows.flatMap(([a, b]) => {
			const aa = Math.max(a, ha);
			const bb = Math.min(b, hb);
			return bb > aa ? gapPolys(samples(nums.main.t, aa, bb), Sx, Cx, X, Y) : [];
		});
	}
	const sceneOp = L.scene * (1 - (o.dimScene ?? 0) * 0.55);
	const feather = D < 43.99;
	const grayGlow = o.grayGlow ?? 0;
	const blueGlow = o.blueGlow ?? 0;
	return (
		<g opacity={o.opacity ?? 1}>
			<HatchDefs id={`${id}hatch`} ox={hatchOx} />
			<defs>
				<linearGradient id={`${id}feather`} gradientUnits="userSpaceOnUse" x1={xD - 30} x2={xD + 6} y1={0} y2={0}>
					<stop offset={0} stopColor="#fff" />
					<stop offset={1} stopColor="#000" />
				</linearGradient>
				<mask id={`${id}reveal`} maskUnits="userSpaceOnUse" x={-200} y={0} width={2400} height={1080}>
					<rect x={-200} y={0} width={xD + 200 + 10} height={1080} fill={feather ? `url(#${id}feather)` : '#fff'} />
				</mask>
			</defs>
			{/* 天色带 */}
			<SkyBand id={`${id}sky`} m={L} ha={ha} hb={hb} y0={L.skyY0} y1={L.skyY1} feather={feather} />
			<g mask={`url(#${id}reveal)`}>
				<SkyDecor m={L} ha={ha} hb={hb} y0={L.skyY0} y1={L.skyY1} />
				{L.skyLab > 0.01 ? (
					<g opacity={L.skyLab}>
						{Array.from({length: 13}, (_, k) => 9 + k * 3)
							.filter((h) => h >= ha && h <= hb)
							.map((h) => {
								const x = X(h);
								const dk = darkness(h);
								const c = dk > 0.45 ? '#f6f1e7' : COL.ink;
								// 审片 P2-5：左上纸签、公式卡（48 px 后右缘约 x=521）盖住的那一段不写钟点；
								// 第二轮 P2-5：playhead 处的钟点字等整串都进了画面再淡入，不再切成半个字
								const under = clamp01((x - 545) / 40);
								const whole = clamp01((xD - 34 - (x + 8 + textW('00:00', 36))) / 24);
								const lop = under * whole;
								if (lop <= 0) return null;
								return (
									<g key={h} opacity={lop}>
										<line x1={x} y1={L.skyY1 - 12} x2={x} y2={L.skyY1 + 2} stroke={c} strokeWidth={2.4} opacity={0.75} />
										<Hand x={x + 8} y={L.skyY1 - 18} size={36} color={c} opacity={0.85}>
											{`${String(h % 24).padStart(2, '0')}:00`}
										</Hand>
									</g>
								);
							})}
					</g>
				) : null}
				{/* 生活场景 */}
				{sceneOp > 0.01 ? (
					<g opacity={sceneOp}>
						<line x1={X(ha)} y1={GROUND_Y + 2} x2={X(hb)} y2={GROUND_Y + 2} stroke={COL.pencil} strokeWidth={2} opacity={0.6} />
						{VIGNETTES.map((v, i) => {
							const x = X(v.h);
							if (x < -400 || x > 2300 || v.h - 0.6 > D) return null;
							const ghost = vigGhost(i, D);
							// 审片第二轮 P2-12：只留当前和上一幅（上一幅是残影），再早的淡掉，免得一屏三四张一样的书桌
							const gone = vigGhost(i + 1, D);
							if (gone >= 1) return null;
							return (
								<g key={i} opacity={(1 - 0.84 * ghost) * (1 - gone)}>
									<Vignette v={v} x={x} t={t} S={model.S} clock={clock} idx={i} hgK={lerp(1.45, 1, ghost)} />
								</g>
							);
						})}
					</g>
				) : null}
			</g>
			{/* 图表。压平时灰面积淡下去（它此刻不再是“沙漏有多满”），只留沙漏线和斜线（缝） */}
			<g opacity={1 - 0.6 * (o.grayDim ?? 0)}>
				<polygon points={grayPoly} fill={COL.sleep} opacity={(0.4 + 0.25 * grayGlow) * (1 - 0.8 * ff)} />
				<path d={smoothPath(sPts)} fill="none" stroke={COL.sleep} strokeWidth={3 + 3 * grayGlow + 4 * ff} strokeLinecap="round" />
			</g>
			<g opacity={dim > 0 ? 1 - 0.75 * dim : 1}>
				{polys.map((p, i) => (
					<polygon key={i} points={p} fill={`url(#${id}hatch)`} opacity={0.9} />
				))}
			</g>
			{dim > 0
				? winPolys.map((p, i) => <polygon key={`w${i}`} points={p} fill={`url(#${id}hatch)`} opacity={0.9 * dim} />)
				: null}
			{o.blueSeg && o.blueSeg.k > 0 ? (
				<path
					d={smoothPath(samples(nums.main.t, Math.max(ha, o.blueSeg.a), Math.min(hb, o.blueSeg.b)).map((h) => [X(h), Y(Cx(h))]))}
					fill="none"
					stroke={COL.tide}
					strokeWidth={16}
					strokeLinecap="round"
					opacity={0.28 * o.blueSeg.k}
				/>
			) : null}
			{blueGlow > 0 ? <path d={smoothPath(cPts)} fill="none" stroke={COL.tide} strokeWidth={16} strokeLinecap="round" opacity={0.3 * blueGlow} /> : null}
			<path d={smoothPath(cPts)} fill="none" stroke={COL.tide} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
			<path d={smoothPath(cPts2)} fill="none" stroke={COL.tide} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
			{/* 两条线的名字：贴在线旁边，隔一段写一次（只在 1 倍平移时） */}
			{/* 审片 P2-6：“沙漏”永远写在灰面积上沿的上方（白纸上），不再灰字压灰底；“潮水”写在蓝线外侧，带纸色描边 */}
			{L.scene > 0.01
				? CURVE_LABEL_HOURS.filter((h) => h > ha + 0.25 && h < hb - 0.25 && X(h) > 480).map((h) => {
						const sv = model.S(h);
						const cv = model.C(h);
						const up = sv > cv;
						return (
							<g key={`lab${h}`} opacity={L.scene}>
								<Hand x={X(h)} y={Y(sv) - 14} size={38} anchor="middle" color={COL.sleepText} halo={COL.paper}>
									沙漏
								</Hand>
								<Hand x={X(h)} y={up ? Y(cv) + 46 : Y(cv) - 14} size={38} anchor="middle" color={COL.tide} halo={COL.paper}>
									潮水
								</Hand>
							</g>
						);
					})
				: null}
			{/* 图表下方时间轴（宽镜头时） */}
			{L.axis > 0.01 ? (
				<g opacity={L.axis}>
					<line x1={X(Math.max(ha, 20))} y1={L.axisY} x2={X(hb)} y2={L.axisY} stroke={COL.ink} strokeWidth={2.4} />
					{Array.from({length: 10}, (_, k) => 8 + k * 4)
						.filter((h) => h >= ha - 0.01 && h <= hb + 0.01)
						.map((h) => {
							const near = o.axisSkip ? o.axisSkip.hours.some((c) => Math.abs(c - h) < 2.6) : false;
							const lop = near && o.axisSkip ? 1 - o.axisSkip.k : 1;
							return (
								<g key={h}>
									<line x1={X(h)} y1={L.axisY} x2={X(h)} y2={L.axisY + 10} stroke={COL.ink} strokeWidth={2.4} />
									<Hand x={X(h)} y={L.axisY + 46} size={36} anchor="middle" color={COL.sleepText} opacity={lop}>
										{`${String(h % 24).padStart(2, '0')}:00`}
									</Hand>
								</g>
							);
						})}
				</g>
			) : null}
			{/* 示意标注 */}
			{L.note > 0.01 ? (
				<Hand x={L.noteX} y={L.noteY} size={36} anchor="end" color={COL.sleepText} opacity={L.note}>
					示意，非实测
				</Hand>
			) : null}
			{/* 钉子 */}
			{o.pins.map((p, i) =>
				p.p > 0 && p.hour >= ha - 0.01 && p.hour <= hb + 0.01 ? (
					<PinMark key={i} L={L} pin={p} i={i} S={Sx} C={Cx} row={o.stagger ? i % 2 : 0} leader={o.pinLeader} match={o.flat ? o.flat.match : 0} />
				) : null,
			)}
			{children}
		</g>
	);
};

// ---------------------------------------------------------------- 长卷上的讲解标注（只在 1 倍平移时出现）
export const ScrollNotes: React.FC<{L: Lay; t: number; model: Model; clock: Clock; opacity: number}> = ({L, t, model, clock, opacity}) => {
	if (opacity <= 0.01) return null;
	const X = (h: number) => xm(L, h);
	const Y = (v: number) => yv(L, v);
	const s11 = clock.sub(11).t0;
	// ⑪ 潮水峰顶高亮 + “压住”箭头
	const peakX = X(21);
	const peakY = Y(model.C(21));
	const ringP = ramp(t, s11 + 0.5, 0.6);
	const pressP = ramp(t, s11 + 3.0, 0.8);
	const sTop = Y(model.S(21));
	// ⑮ “沙漏没倒”箭头改由 NotEmptyArrow 画（按故事时间，压成一屏后留作残影）
	return (
		<g opacity={opacity}>
			{/* 审片 P2-3：圈画在峰顶下方一点，不压上面的钉子“很精神” */}
			{ringP > 0 ? <Ring k="peak" cx={peakX} cy={peakY + 12} rx={74} ry={30} p={ringP} color={COL.tide} w={3.5} /> : null}
			{pressP > 0 ? (
				<g>
					<Arrow k="press" a={[peakX + 40, peakY + 30]} b={[peakX + 40, sTop - 10]} p={pressP} color={COL.ink} w={3} bend={0.0} head={16} />
					<Hand x={peakX + 62} y={(peakY + sTop) / 2 + 18} size={36} wipe={clamp01(pressP * 1.5 - 0.3)} id="press">
						压住
					</Hand>
				</g>
			) : null}
		</g>
	);
};

/** 车祸图钉（红）：落到时间轴上，往上拉一条虚线 */
export const AccidentPins: React.FC<{L: Lay; t: number; drops: number[]; hours: number[]; labelOp: number; topY: number; size?: number; r?: number}> = ({L, t, drops, hours, labelOp, topY, size = 48, r = 11}) => (
	<g>
		{hours.map((h, i) => {
			const p = ramp(t, drops[i], 0.5);
			if (p <= 0 || h < L.hMin - 0.01 || h > L.hMax + 0.01) return null;
			const x = xm(L, h);
			const yAxis = L.v0;
			const y = lerp(yAxis - 120, yAxis, ease(p));
			const line = clamp01((p - 0.6) / 0.4);
			return (
				<g key={h}>
					<line x1={x} y1={yAxis} x2={x} y2={lerp(yAxis, topY, line)} stroke={COL.drowsy} strokeWidth={2.6} strokeDasharray="8 8" opacity={0.85} />
					<PinHead x={x} y={y - r * 1.3} r={r} color={COL.drowsy} />
					{labelOp > 0 ? (
						<Hand x={x} y={L.axisY + 46} size={size} anchor="middle" color={COL.drowsy} opacity={labelOp * clamp01(p * 2)} halo={COL.paper}>
							{`${String(h % 24).padStart(2, '0')}:00`}
						</Hand>
					) : null}
				</g>
			);
		})}
	</g>
);

/**
 * 审片 P0-1：“沙漏没倒”。原来的箭头往右下画，表达成了“沙漏在倒”，正好和字幕相反。
 * 现在贴着灰面积上沿（沙漏）往右上画：从当晚 00:00 起，一路跟着沙漏涨到第二天 15:00。
 * 按故事时间画，所以长卷平移、压成一屏时都跟着走，留作残影。
 */
export const NotEmptyArrow: React.FC<{
	L: Lay;
	model: Model;
	h0: number;
	h1: number;
	label: number; // 标签写出进度
	labelH: number; // 标签放在哪个钟点上方
	opacity: number;
	glow?: number;
	off?: number; // 箭头在沙漏线上方多少像素
	ls?: number; // 标签字号
	lift?: number; // 标签再往上挪多少像素（审片第二轮 P2-2：一屏总览里 C 的线从标签底下擦过，标签上提）
}> = ({L, model, h0, h1, label, labelH, opacity, glow = 0, off = 22, ls = 52, lift = 0}) => {
	if (opacity <= 0.01 || h1 <= h0 + 0.05) return null;
	const X = (h: number) => xm(L, h);
	const Y = (v: number) => yv(L, v);
	const n = Math.max(8, Math.ceil((h1 - h0) * 4));
	const pts: [number, number][] = [];
	for (let k = 0; k <= n; k++) {
		const h = h0 + ((h1 - h0) * k) / n;
		pts.push([X(h), Y(model.S(h)) - off + 1.4 * wobble(h * 2.7, 9)]);
	}
	const [bx, by] = pts[pts.length - 1];
	const [ax, ay] = pts[Math.max(0, pts.length - 4)];
	const tl = Math.hypot(bx - ax, by - ay) || 1;
	const ux = (bx - ax) / tl;
	const uy = (by - ay) / tl;
	const hd = 22;
	const p1 = [bx - ux * hd - uy * hd * 0.55, by - uy * hd + ux * hd * 0.55].map((v) => v.toFixed(1)).join(',');
	const p2 = [bx - ux * hd + uy * hd * 0.55, by - uy * hd - ux * hd * 0.55].map((v) => v.toFixed(1)).join(',');
	const tip = [bx.toFixed(1), by.toFixed(1)].join(',');
	const d = smoothPath(pts);
	const lx = X(labelH);
	const ly = Y(model.S(labelH)) - off - 20 - lift;
	const lw = textW('沙漏没倒', ls);
	return (
		<g opacity={opacity}>
			{glow > 0 ? <path d={d} fill="none" stroke={COL.lamp} strokeWidth={18} strokeLinecap="round" opacity={0.95 * glow} /> : null}
			<path d={d} fill="none" stroke={COL.paper} strokeWidth={9} strokeLinecap="round" opacity={0.8} />
			<path d={d} fill="none" stroke={COL.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
			<polyline points={[p1, tip, p2].join(' ')} fill="none" stroke={COL.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
			{label > 0 && labelH > h0 && labelH < h1 ? (
				<g>
					{glow > 0 ? <rect x={lx - lw / 2 - 14} y={ly - ls} width={lw + 28} height={ls * 1.3} rx={10} fill={COL.lamp} opacity={0.9 * glow} /> : null}
					<Hand id="notempty" x={lx} y={ly} size={ls} anchor="middle" color={COL.ink} wipe={label} halo={COL.paper}>
						沙漏没倒
					</Hand>
				</g>
			) : null}
		</g>
	);
};

/**
 * 二审：字幕 #15 改成“下午潮水一低，又塌一次”，钟点“2–4点”挪到画面上：
 * 蓝线 14:00–16:00 一段下方画一道手绘短括号，写“2–4点”（墨色、48 px，不压线）。按故事时间画，压成一屏后留作残影。
 */
export const AfternoonDip: React.FC<{L: Lay; model: Model; ha: number; hb: number; p: number; opacity: number; labelShift?: number}> = ({L, model, ha, hb, p, opacity, labelShift = 0}) => {
	if (opacity <= 0.01 || p <= 0) return null;
	const X = (h: number) => xm(L, h);
	const Y = (v: number) => yv(L, v);
	// 括号的横线放在这一段蓝线最低点下方 26 px
	let low = 0;
	for (let h = ha; h <= hb + 1e-6; h += 0.1) low = Math.max(low, Y(model.C(h)));
	const y = low + 26;
	const x0 = X(ha);
	const x1 = X(hb);
	return (
		<g opacity={opacity}>
			<g transform={`translate(${x0.toFixed(1)} ${y.toFixed(1)})`}>
				<Bracket k={`dip_${Math.round(x1 - x0)}`} x0={0} x1={Math.round(x1 - x0)} y={0} up={false} p={p} w={3} />
			</g>
			<Hand x={(x0 + x1) / 2 + labelShift} y={y + 54} size={48} anchor="middle" color={COL.ink} opacity={clamp01(p * 2 - 0.6)} halo={COL.paper}>
				2–4点
			</Hand>
		</g>
	);
};

export {pulse};
