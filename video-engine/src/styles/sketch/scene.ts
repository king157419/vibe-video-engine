import type {Captions} from '../../lib/types';
import type {Geo, Pt} from './rough';
import {R, variants} from './rough';
import type {NeedDef, Slot} from './theme';
import {
	ALL_NEEDS_ALIAS,
	BOIL_VARIANTS,
	CALL,
	CENTER,
	CENTER_ALIAS,
	CENTER_FILL_ALIAS,
	DRAW,
	HEART_W,
	LEX,
	NEEDS,
	NOTE,
	PUSH,
	RING_R,
	ROUGH,
	SLOTS,
	SYMPTOMS,
} from './theme';

// 把字幕“读”一遍，排出整条片子的作画计划：哪个需要什么时候被圈出来、
// 哪个关键词贴成便利贴贴在哪、箭头指向谁、笔什么时候在哪。全部是纯数据，逐帧只做插值。

export type Measure100 = (text: string) => number;

export type Hit = {t: number; e: number};

export type Badge = {x: number; y: number; r: number; geo: Geo; num: string; t: number | null};

export type NeedNode = {
	def: NeedDef;
	x: number;
	y: number;
	r: number;
	faint: Geo[];
	ink: Geo[];
	fill: string;
	connFaint: string;
	conn: Geo[];
	labelSize: number;
	on: number | null; // 第一次被说到（开始圈）的时刻
	circleDur: number; // 圈这一笔用多久（口播列举很快时自动缩短，避免几笔叠在一起）
	lineStart: number; // 连到中心的那一笔
	lineDur: number;
	fillAt: number; // 琥珀色排线开始
	cue: number | null; // 说到“五种需要”时草稿先加深（预告）的时刻
	hits: number[]; // 每次被说到
	badge: Badge;
};

export type HeartNode = {
	poly: Pt[];
	faint: Geo[];
	ink: Geo[];
	fill: string;
	lines: string[];
	labelSize: number;
	on: number | null; // 墨线轮廓（封面一结束就画）
	fillOn: number | null; // 琥珀色（“小孩”被正式点名时）
	hits: number[];
};

export type StickyNote = {
	text: string;
	glyphs: string[];
	font: number;
	x: number;
	y: number;
	w: number;
	h: number;
	rot: number;
	t0: number; // 出现
	old: number; // 变旧（淡到 30%）的时刻
	gone: number; // 被新便利贴顶掉的时刻
	hits: number[];
	keep: boolean; // 片尾时是否留在图上（上方的便利贴不挡片尾文字）
	box: Geo;
	arrow: Geo;
	head: Geo;
	tape: number; // 胶带偏移
	target: Pt; // 箭头指向的节点中心
};

export type PenStroke = {t0: number; t1: number; geo: Geo; lag: number};

/** 笔闲下来时镜头缓慢推近：tIn 开始推，tOut 前拉回；s 为最大缩放，focus 为推近的中心（图坐标） */
export type Push = {tIn: number; tOut: number; s: number; focus: Pt};

export type Scene = {
	needs: NeedNode[];
	heart: HeartNode;
	notes: StickyNote[];
	ripples: number[]; // 说到“五种需要”（预告那一跳）
	calls: number[]; // 心被正式点名之前，每个句组开头心跳一下
	pen: PenStroke[];
	pushes: Push[];
};

const V = BOIL_VARIANTS;

// ---------- 文本匹配 ----------
type LineIndex = {glyphs: string[]; owner: number[]; toks: {s: number; e: number}[]};

const indexLines = (captions: Captions): LineIndex[] =>
	captions.lines.map((l) => {
		const glyphs: string[] = [];
		const owner: number[] = [];
		l.chars.forEach((c, i) => {
			Array.from(c.t.replace(/\s+/gu, '')).forEach((g) => {
				glyphs.push(g);
				owner.push(i);
			});
		});
		return {glyphs, owner, toks: l.chars.map((c) => ({s: c.s, e: c.e}))};
	});

/** 找出 words 在全片的所有出现；claimed 在多组词之间共享，长词优先，避免“安全感”又被当成“安全” */
const findHits = (idx: LineIndex[], words: string[], claimed: boolean[][]): Hit[] => {
	const hits: Hit[] = [];
	const sorted = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length);
	idx.forEach((li, n) => {
		for (const w of sorted) {
			const k = Array.from(w);
			for (let i = 0; i + k.length <= li.glyphs.length; i++) {
				if (!k.every((ch, j) => li.glyphs[i + j] === ch)) continue;
				if (claimed[n].slice(i, i + k.length).some(Boolean)) continue;
				for (let j = 0; j < k.length; j++) claimed[n][i + j] = true;
				hits.push({t: li.toks[li.owner[i]].s, e: li.toks[li.owner[i + k.length - 1]].e});
			}
		}
	});
	return hits.sort((a, b) => a.t - b.t);
};

// ---------- 几何 ----------
const heartPoly = (): Pt[] => {
	const raw: Pt[] = [];
	const N = 56;
	for (let i = 0; i < N; i++) {
		const t = (i / N) * Math.PI * 2;
		raw.push([16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
	}
	const xs = raw.map((p) => p[0]);
	const ys = raw.map((p) => p[1]);
	const s = HEART_W / (Math.max(...xs) - Math.min(...xs));
	const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
	return raw.map(([x, y]) => [CENTER.x + x * s, CENTER.y + (y - cy) * s + 6]);
};

/** 从 c 出发沿 dir 的射线与多边形的交点距离 */
const rayHit = (poly: Pt[], c: Pt, dir: Pt): number => {
	let best = Infinity;
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		const ex = b[0] - a[0];
		const ey = b[1] - a[1];
		const den = dir[0] * ey - dir[1] * ex;
		if (Math.abs(den) < 1e-9) continue;
		const qx = a[0] - c[0];
		const qy = a[1] - c[1];
		const t = (qx * ey - qy * ex) / den;
		const u = (qx * dir[1] - qy * dir[0]) / den;
		if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
	}
	return Number.isFinite(best) ? best : 110;
};

const norm = (x: number, y: number): Pt => {
	const l = Math.hypot(x, y) || 1;
	return [x / l, y / l];
};


// ---------- 主函数 ----------
const BADGE_R = 28;

export const buildScene = (
	captions: Captions,
	measureSerif600: Measure100,
	opts: {revealFrom: number; endStart: number},
): Scene => {
	const idx = indexLines(captions);
	const fresh = () => idx.map((l) => l.glyphs.map(() => false));
	const claimed = fresh();

	// 1) 说到“五种需要”
	const allHits = findHits(idx, ALL_NEEDS_ALIAS, claimed).map((h) => Math.max(opts.revealFrom, h.t));

	// 2) 中心的心：封面一结束就用笔勾出墨线轮廓（全片第一笔），“小孩”被正式点名时再涂满琥珀色
	const heart = heartPoly();
	const heartOn = opts.revealFrom + 150;
	const heartDone = heartOn + DRAW.heart;
	const centerHits = findHits(idx, CENTER_ALIAS, fresh()).map((h) => h.t);
	const fillHit = findHits(idx, CENTER_FILL_ALIAS, fresh())
		.map((h) => h.t - 80)
		.find((t) => t >= heartDone - 100);
	const fillOn = fillHit ?? heartDone - 120;

	// 3) 五个需要
	const needFrom = heartDone + 60;
	const needs: NeedNode[] = NEEDS.map((def, i) => {
		const a = (def.angle * Math.PI) / 180;
		const x = CENTER.x + Math.cos(a) * (RING_R + def.dR);
		const y = CENTER.y + Math.sin(a) * (RING_R + def.dR);
		const r = def.r;
		const toC = norm(CENTER.x - x, CENTER.y - y);
		const from: Pt = [x + toC[0] * (r + 12), y + toC[1] * (r + 12)];
		const hd = rayHit(heart, [CENTER.x, CENTER.y], [-toC[0], -toC[1]]);
		const to: Pt = [CENTER.x - toC[0] * (hd + 14), CENTER.y - toC[1] * (hd + 14)];
		const hits = findHits(idx, def.alias, claimed).map((h) => h.t);
		const labelW = measureSerif600(def.label);
		const ba = (def.badge * Math.PI) / 180;
		const bx = x + Math.cos(ba) * r;
		const by = y + Math.sin(ba) * r;
		return {
			def,
			x,
			y,
			r,
			faint: variants(V, def.seed + 5, (seed) =>
				R.circle(x, y, r, {seed, roughness: 1.1, bowing: 0.8, strokeWidth: 2.5, disableMultiStroke: true}),
			),
			ink: variants(V, def.seed, (seed) => R.circle(x, y, r, {seed, ...ROUGH})),
			fill: R.fillEllipse(x, y, r * 2 - 16, r * 2 - 16, {seed: def.seed + 3, roughness: 1.1, hachureGap: 9, fillWeight: 3.4, hachureAngle: -38 + i * 7}),
			connFaint: R.line(from, to, {seed: def.seed + 9, roughness: 0.6, bowing: 0.6, disableMultiStroke: true}).subs[0]?.d ?? '',
			conn: variants(V, def.seed + 2, (seed) => R.line(from, to, {seed, roughness: 1.2, bowing: 1.4})),
			labelSize: Math.min(46, ((r * 2 - 40) / Math.max(1, labelW)) * 100),
			on: hits.length ? Math.max(needFrom, hits[0] - 80) : null,
			circleDur: DRAW.circle,
			lineStart: 0,
			lineDur: DRAW.line,
			fillAt: 0,
			cue: null,
			hits: hits.map((t) => Math.max(opts.revealFrom, t)),
			badge: {
				x: bx,
				y: by,
				r: BADGE_R,
				geo: R.circle(bx, by, BADGE_R, {seed: def.seed * 3 + 61, roughness: 1.1, bowing: 0.9, strokeWidth: 3}),
				num: String(i + 1).padStart(2, '0'),
				t: null,
			},
		};
	});

	// 口播列举得很快（安全感、自由、价值感… 间隔 0.4–0.7s）时，每个圈缩短笔时，连线来不及就留到这一串说完再补
	const order = needs
		.map((_, i) => i)
		.filter((i) => needs[i].on !== null)
		.sort((a, b) => (needs[a].on as number) - (needs[b].on as number));
	order.forEach((i, k) => {
		if (k > 0) needs[i].on = Math.max(needs[i].on as number, (needs[order[k - 1]].on as number) + DRAW.minCircle + 60);
	});
	let pending: number[] = [];
	order.forEach((i, k) => {
		const n = needs[i];
		const on = n.on as number;
		const nextOn = k + 1 < order.length ? (needs[order[k + 1]].on as number) : Infinity;
		n.circleDur = Math.max(DRAW.minCircle, Math.min(DRAW.circle, nextOn - on - 60));
		n.fillAt = on + n.circleDur - 80;
		const ls = on + n.circleDur - 40;
		const ld = Math.min(DRAW.line, nextOn - ls - 30);
		if (ld < DRAW.minLine) {
			pending.push(i);
			return;
		}
		n.lineStart = ls;
		n.lineDur = ld;
		let t = ls + ld + 40;
		pending.forEach((j) => {
			needs[j].lineStart = t;
			needs[j].lineDur = DRAW.minLine + 60;
			t += DRAW.minLine + 80;
		});
		pending = [];
	});

	// 4) “五种需要”：还没圈完 → 草稿整体加深（预告）；五个都圈完之后再说到 → 笔在圈边写 01–05
	const allInked = needs.every((n) => n.on !== null) ? Math.max(...needs.map((n) => n.lineStart + n.lineDur)) : Infinity;
	const ripples: number[] = [];
	let badgeHit: number | null = null;
	for (const t of allHits) {
		if (t >= allInked + 150) {
			if (badgeHit === null && t < opts.endStart - 1800) badgeHit = t;
			else ripples.push(t);
			continue;
		}
		ripples.push(t);
		needs.forEach((n, i) => {
			if (n.cue === null && (n.on === null || n.on > t + 200)) n.cue = t + i * 110;
		});
	}
	if (badgeHit !== null) {
		const b0 = badgeHit + 150;
		needs.forEach((n, i) => (n.badge.t = b0 + i * DRAW.badgeGap));
	}

	const closed = [...heart, heart[0], heart[1]];
	const heartNode: HeartNode = {
		poly: heart,
		faint: variants(V, 71, (seed) => R.curve(closed, {seed, roughness: 1.0, bowing: 0.8, strokeWidth: 2.5, disableMultiStroke: true})),
		ink: variants(V, 73, (seed) => R.curve(closed, {seed, roughness: 1.2, bowing: 1})),
		fill: R.fillPolygon(heart, {seed: 77, roughness: 1.0, hachureGap: 9, fillWeight: 3.4, hachureAngle: -45}),
		lines: ['内心的', '小孩'],
		labelSize: 42,
		on: heartOn,
		fillOn,
		// 轮廓/填色本身已经有一跳，这里只留之后的“被说到”
		hits: centerHits.filter((t) => t > heartDone - 200 && Math.abs(t - 80 - fillOn) > 250).map((t) => Math.max(opts.revealFrom, t)),
	};

	// 5) 其他关键词 → 便利贴（需要词、中心词不重复贴）；关键词不够时用“症状词”补
	const needWords = NEEDS.flatMap((n) => n.alias);
	const isNeedWord = (k: string) => needWords.some((w) => w.includes(k) || k.includes(w));
	const isCenterWord = (k: string) => CENTER_ALIAS.some((w) => w.includes(k) || k.includes(w));
	const kwList = [...new Set(captions.keywords.map((k) => k.trim()).filter((k) => k && !isNeedWord(k) && !isCenterWord(k)))];
	type KwEv = {text: string; hits: Hit[]; lex: boolean};
	const kwEvents: KwEv[] = [];
	kwList
		.sort((a, b) => b.length - a.length)
		.forEach((text) => {
			const hits = findHits(idx, [text], claimed);
			if (hits.length) kwEvents.push({text, hits, lex: false});
		});
	const lexCands: KwEv[] = [];
	[...SYMPTOMS]
		.sort((a, b) => b.length - a.length)
		.forEach((text) => {
			const hits = findHits(idx, [text], claimed).filter((h) => h.t >= opts.revealFrom + 200 && h.t < opts.endStart - 1500);
			if (hits.length) lexCands.push({text, hits, lex: true});
		});
	lexCands.sort((a, b) => a.hits[0].t - b.hits[0].t);
	const taken = kwEvents.map((e) => e.hits[0].t);
	let nLex = 0;
	lexCands.forEach((c) => {
		const t = c.hits[0].t;
		if (nLex >= LEX.max || taken.some((u) => Math.abs(u - t) < LEX.gap)) return;
		taken.push(t);
		nLex++;
		kwEvents.push(c);
	});
	kwEvents.sort((a, b) => a.hits[0].t - b.hits[0].t);

	// 最近被点亮/提到的需要（箭头优先指向它；太久以前的就指向中心）
	const needEvents = needs.flatMap((n, i) => n.hits.map((t) => ({t, i})));
	const heartTarget = {c: [CENTER.x, CENTER.y] as Pt, r: null, node: -1};
	const targetFor = (t: number): {c: Pt; r: number | null; node: number} => {
		const recent = needEvents.filter((e) => e.t <= t + 150 && e.t >= t - 3500).sort((a, b) => b.t - a.t)[0];
		const heartRecent = heartNode.hits.some((h) => h <= t + 150 && h >= t - 3500);
		if (recent && !(heartRecent && heartNode.hits.some((h) => h > recent.t))) {
			const n = needs[recent.i];
			return {c: [n.x, n.y], r: n.r, node: recent.i};
		}
		return heartTarget;
	};

	const obstacles = [...needs.map((n) => ({c: [n.x, n.y] as Pt, r: n.r + 14})), {c: [CENTER.x, CENTER.y] as Pt, r: HEART_W / 2}];
	const slotUsed: (number | null)[] = SLOTS.map(() => null);
	const notes: StickyNote[] = [];
	let lastPenEnd = -Infinity;
	// 笔一次只能画一样：画心/圈需要/写序号的时段里不插便利贴，顺延到笔空下来
	const busy: [number, number][] = [[heartOn, heartDone]];
	needs.forEach((n) => {
		if (n.on !== null) busy.push([n.on, Math.max(n.on + n.circleDur, n.lineStart + n.lineDur)]);
		if (n.badge.t !== null) busy.push([n.badge.t, n.badge.t + DRAW.badge]);
	});
	busy.sort((p, q) => p[0] - q[0]);
	const NOTE_PEN = 60 + DRAW.arrow + DRAW.head;
	const freeFrom = (t: number) => {
		let x = t;
		for (const [b0, b1] of busy) if (x < b1 && x + NOTE_PEN > b0) x = b1 + 40;
		return x;
	};

	kwEvents.forEach((ev, k) => {
		let t0 = freeFrom(Math.max(opts.revealFrom + 200, ev.hits[0].t - 120, lastPenEnd + 60));
		if (t0 > opts.endStart - 600) return;
		// 症状词一律指向中心的小孩
		const target = ev.lex ? heartTarget : targetFor(ev.hits[0].t);
		const glyphs = Array.from(ev.text);
		const textW100 = measureSerif600(ev.text);

		// 满了就把最旧的一张挪走
		if (!slotUsed.some((s) => s === null)) {
			const oldest = slotUsed.reduce<number>((m, s) => (s !== null && (m < 0 || notes[s].t0 < notes[m].t0) ? s : m), -1);
			const si = slotUsed.indexOf(oldest);
			notes[oldest].gone = t0;
			slotUsed[si] = null;
			t0 += 280;
		}

		// 箭头路线：在若干弯度里找一条不穿过其他圈/心/仍在画面上的便利贴的弧线（越短、越不弯越好）
		const targetIdx = target.node >= 0 ? target.node : obstacles.length - 1;
		const live = notes.filter((n) => n.gone > t0);
		const boxes = live.map((n) => ({x0: n.x - n.w / 2 - 14, x1: n.x + n.w / 2 + 14, y0: n.y - n.h / 2 - 14, y1: n.y + n.h / 2 + 14}));
		// 画面上已有的箭头：新箭头别跟它们交叉，箭头尖也别挤在同一处（几张便利贴都指向心时容易扎堆在心尖）
		const arrowPts: Pt[] = [];
		const arrowEnds: Pt[] = [];
		live.forEach((n) => {
			const ps = n.arrow.subs[0]?.pts ?? [];
			for (let q = 0; q + 1 < ps.length; q += 4) arrowPts.push([ps[q], ps[q + 1]]);
			arrowEnds.push(n.arrow.end);
		});
		const arrowClear = (p: Pt) => arrowPts.reduce((m, ap) => Math.min(m, Math.hypot(ap[0] - p[0], ap[1] - p[1]) - 12), Infinity);
		const clearAt = (p: Pt) => {
			let c = Infinity;
			obstacles.forEach((o, oi) => {
				if (oi !== targetIdx) c = Math.min(c, Math.hypot(o.c[0] - p[0], o.c[1] - p[1]) - o.r);
			});
			boxes.forEach((bx) => {
				const dx = Math.max(bx.x0 - p[0], 0, p[0] - bx.x1);
				const dy = Math.max(bx.y0 - p[1], 0, p[1] - bx.y1);
				c = Math.min(c, dx === 0 && dy === 0 ? -Math.min(p[0] - bx.x0, bx.x1 - p[0], p[1] - bx.y0, bx.y1 - p[1]) : Math.hypot(dx, dy));
			});
			return c;
		};
		const endToward = (from: Pt): Pt => {
			const back = norm(from[0] - target.c[0], from[1] - target.c[1]);
			const dEnd = target.r !== null ? target.r + 14 : rayHit(heart, target.c, back) + 14;
			return [target.c[0] + back[0] * dEnd, target.c[1] + back[1] * dEnd];
		};
		type Route = {a: Pt; mid: Pt; b: Pt; cost: number; clear: number};
		const route = (sx: number, sy: number, w: number, h: number): Route => {
			// 便利贴边框上朝向 p 的点
			const border = (p: Pt): Pt => {
				const dir = norm(p[0] - sx, p[1] - sy);
				const kx = Math.abs(dir[0]) > 1e-6 ? w / 2 / Math.abs(dir[0]) : Infinity;
				const ky = Math.abs(dir[1]) > 1e-6 ? h / 2 / Math.abs(dir[1]) : Infinity;
				const kk = Math.min(kx, ky) + 10;
				return [sx + dir[0] * kk, sy + dir[1] * kk];
			};
			const a0 = border(target.c);
			const b0 = endToward(a0);
			const len0 = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
			const nrm = norm(-(b0[1] - a0[1]), b0[0] - a0[0]);
			let bestR: Route | null = null;
			for (const kf of [0.14, -0.14, 0.26, -0.26, 0.38, -0.38, 0.5, -0.5]) {
				const m0: Pt = [(a0[0] + b0[0]) / 2 + nrm[0] * len0 * kf, (a0[1] + b0[1]) / 2 + nrm[1] * len0 * kf];
				const a = border(m0);
				const b = endToward(m0);
				const mid: Pt = [(a[0] + b[0]) / 2 + nrm[0] * len0 * kf, (a[1] + b[1]) / 2 + nrm[1] * len0 * kf];
				// 用过 mid 的二次贝塞尔近似 roughjs 的样条
				const c: Pt = [2 * mid[0] - (a[0] + b[0]) / 2, 2 * mid[1] - (a[1] + b[1]) / 2];
				let L = 0;
				let minC = Infinity;
				let minA = Infinity;
				let prev = a;
				for (let s = 1; s <= 28; s++) {
					const t = s / 28;
					const u = 1 - t;
					const p: Pt = [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
					L += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
					prev = p;
					if (t > 0.04 && t < 0.97) minC = Math.min(minC, clearAt(p));
					if (t > 0.04 && t < 0.9) minA = Math.min(minA, arrowClear(p));
				}
				let cost = L + Math.abs(kf) * len0 * 0.3;
				if (minC < 0) cost += 5000 - minC * 30;
				else if (minC < 22) cost += (22 - minC) * 6;
				if (minA < 0) cost += 900 - minA * 12;
				else if (minA < 18) cost += (18 - minA) * 8;
				arrowEnds.forEach((e) => {
					const d = Math.hypot(e[0] - b[0], e[1] - b[1]);
					if (d < 72) cost += (72 - d) * 14;
				});
				if (!bestR || cost < bestR.cost) bestR = {a, mid, b, cost, clear: minC};
			}
			return bestR as Route;
		};

		type Pick = {si: number; score: number; font: number; w: number; h: number; r: Route};
		let best: Pick | null = null;
		SLOTS.forEach((slot: Slot, si) => {
			if (slotUsed[si] !== null) return;
			const maxText = slot.maxW - NOTE.padX * 2;
			const font = Math.max(NOTE.minFont, Math.min(NOTE.font, (maxText / Math.max(1, textW100)) * 100));
			const w = Math.min(slot.maxW, (textW100 / 100) * font + NOTE.padX * 2);
			const h = font * 1.3 + NOTE.padY * 2;
			const r = route(slot.x, slot.y, w, h);
			let score = r.cost;
			if (font < NOTE.font) score += (NOTE.font - font) * 25;
			// 快结束时贴的便利贴放到图上方，片尾时能留在画面里
			if (t0 > opts.endStart - 6000 && slot.y > CENTER.y) score += 400;
			// 箭头太短（贴着目标）不好看
			if (Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]) < 70) score += 200;
			// 与最近一张便利贴隔开一点
			const prev = notes[notes.length - 1];
			if (prev && prev.gone > t0 && Math.hypot(prev.x - slot.x, prev.y - slot.y) < 320) score += 120;
			if (!best || score < best.score) best = {si, score, font, w, h, r};
		});
		const pick = best as Pick | null;
		if (!pick) return;
		const slot = SLOTS[pick.si];
		const {a, b, mid} = pick.r;
		const tan = norm(b[0] - mid[0], b[1] - mid[1]);
		const rot = (v: Pt, deg: number): Pt => {
			const r = (deg * Math.PI) / 180;
			return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)];
		};
		const h1 = rot([-tan[0], -tan[1]], 28);
		const h2 = rot([-tan[0], -tan[1]], -28);
		const HL = 24;
		const seed = 300 + k * 17;
		const tArrow = t0 + 60;
		const tHead = tArrow + DRAW.arrow;
		const note: StickyNote = {
			text: ev.text,
			glyphs,
			font: pick.font,
			x: slot.x,
			y: slot.y,
			w: pick.w,
			h: pick.h,
			rot: slot.rot,
			t0,
			old: Infinity,
			gone: Infinity,
			hits: ev.hits.slice(1).map((h) => h.t),
			// 片尾只留上方的关键词便利贴（症状词是讲解过程，收藏的图保持干净）
			keep: slot.y < CENTER.y && !ev.lex,
			box: R.rect(slot.x - pick.w / 2, slot.y - pick.h / 2, pick.w, pick.h, {seed, roughness: 1.1, bowing: 0.8, strokeWidth: 2.5}),
			arrow: R.curve([a, mid, b], {seed: seed + 1, roughness: 1.1, bowing: 1.2, strokeWidth: 3.5}),
			head: R.linear(
				[
					[b[0] + h1[0] * HL, b[1] + h1[1] * HL],
					b,
					[b[0] + h2[0] * HL, b[1] + h2[1] * HL],
				],
				{seed: seed + 2, roughness: 0.9, bowing: 0.5, strokeWidth: 3.5, disableMultiStroke: true},
			),
			tape: ((k * 37) % 40) - 20,
			target: target.c,
		};
		slotUsed[pick.si] = notes.length;
		notes.push(note);
		lastPenEnd = tHead + DRAW.head;
	});
	// 只保留最新的 NOTE.full 张是满墨，其余淡到 30%
	notes.forEach((n, i) => {
		const newer = notes.slice(i + 1).filter((m) => m.t0 < n.gone);
		if (newer.length >= NOTE.full) n.old = newer[NOTE.full - 1].t0;
	});

	// 5b) 序号的位置：写的那一刻画面上已有箭头/便利贴，在圈边找一处最空的地方（默认角度优先）
	needs.forEach((n, i) => {
		const tb = n.badge.t;
		if (tb === null) return;
		const pts: Pt[] = [];
		notes
			.filter((m) => m.t0 <= tb && m.gone > tb)
			.forEach((m) => {
				const ps = m.arrow.subs[0]?.pts ?? [];
				for (let q = 0; q + 1 < ps.length; q += 2) pts.push([ps[q], ps[q + 1]]);
			});
		const boxes = notes.filter((m) => m.t0 <= tb && m.gone > tb);
		const toC = norm(CENTER.x - n.x, CENTER.y - n.y);
		for (let k = 0; k <= 10; k++) {
			const d = n.r + 12 + k * 14;
			pts.push([n.x + toC[0] * d, n.y + toC[1] * d]);
		}
		const labelHalf = ((measureSerif600(n.def.label) / 100) * n.labelSize * 1.04) / 2 + 2;
		let bestA = n.def.badge;
		let bestS = -Infinity;
		for (let k = 0; k < 12; k++) {
			const off = (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * 30;
			const a = ((n.def.badge + off) * Math.PI) / 180;
			const bx = n.x + Math.cos(a) * n.r;
			const by = n.y + Math.sin(a) * n.r;
			const R0 = BADGE_R + 4;
			let clear = 60;
			pts.forEach((p) => (clear = Math.min(clear, Math.hypot(p[0] - bx, p[1] - by) - R0)));
			boxes.forEach((m) => {
				const dx = Math.max(m.x - m.w / 2 - bx, 0, bx - (m.x + m.w / 2));
				const dy = Math.max(m.y - m.h / 2 - 14 - by, 0, by - (m.y + m.h / 2));
				clear = Math.min(clear, Math.hypot(dx, dy) - R0);
			});
			needs.forEach((o, j) => {
				if (j !== i) clear = Math.min(clear, Math.hypot(o.x - bx, o.y - by) - o.r - R0);
			});
			clear = Math.min(clear, Math.hypot(CENTER.x - bx, CENTER.y - by) - HEART_W / 2 - R0);
			// 别压到圈里的字
			const lx = Math.max(Math.abs(bx - n.x) - labelHalf, 0);
			const ly = Math.max(Math.abs(by - n.y) - n.labelSize * 0.56, 0);
			clear = Math.min(clear, Math.hypot(lx, ly) - BADGE_R - 3);
			// 安全区（图坐标 = 正片时的屏幕坐标）
			clear = Math.min(clear, bx - R0 - 90, 870 - (bx + R0), by - R0 - 318, 1250 - (by + R0));
			const score = Math.min(clear, 40) - Math.abs(off) * 0.08;
			if (score > bestS) {
				bestS = score;
				bestA = n.def.badge + off;
			}
		}
		const a = (bestA * Math.PI) / 180;
		const bx = n.x + Math.cos(a) * n.r;
		const by = n.y + Math.sin(a) * n.r;
		n.badge = {...n.badge, x: bx, y: by, geo: R.circle(bx, by, BADGE_R, {seed: n.def.seed * 3 + 61, roughness: 1.1, bowing: 0.9, strokeWidth: 3})};
	});

	// 6) 笔的路线
	const pen: PenStroke[] = [{t0: heartOn, t1: heartDone, geo: heartNode.ink[0], lag: 0.1}];
	needs.forEach((n) => {
		if (n.on === null) return;
		pen.push({t0: n.on, t1: n.on + n.circleDur, geo: n.ink[0], lag: 0.12});
		pen.push({t0: n.lineStart, t1: n.lineStart + n.lineDur, geo: n.conn[0], lag: 0.06});
		if (n.badge.t !== null) pen.push({t0: n.badge.t, t1: n.badge.t + DRAW.badge, geo: n.badge.geo, lag: 0.1});
	});
	notes.forEach((n) => {
		const ta = n.t0 + 60;
		pen.push({t0: ta, t1: ta + DRAW.arrow, geo: n.arrow, lag: 0.06});
		pen.push({t0: ta + DRAW.arrow, t1: ta + DRAW.arrow + DRAW.head, geo: n.head, lag: 0});
	});
	pen.sort((p, q) => p.t0 - q.t0);

	// 7) 心被正式点名（涂色）之前：每句开头心跳一下（相邻至少隔 CALL.gap；跳完之前不能碰上涂色）
	const calls: number[] = [];
	captions.lines.forEach((l) => {
		const t = l.startMs;
		if (t < heartOn + DRAW.heart * 0.8) return;
		if (t + CALL.beat + 100 > fillOn) return;
		if (calls.length && t - calls[calls.length - 1] < CALL.gap) return;
		calls.push(t);
	});

	// 8) 镜头：笔闲下来超过 PUSH.idle 就朝最近画过的地方缓慢推近，下一笔开始前拉回。推近幅度以不出安全区为限。
	const act: [number, number][] = pen.map((p) => [p.t0, p.t1]);
	act.push([fillOn, fillOn + DRAW.fill + 200]);
	act.push([opts.endStart - 200, Infinity]);
	act.sort((p, q) => p[0] - q[0]);
	const focusEv: {t: number; pt: Pt}[] = [
		{t: heartOn, pt: [CENTER.x, CENTER.y]},
		{t: fillOn, pt: [CENTER.x, CENTER.y]},
	];
	needs.forEach((n) => {
		if (n.on !== null) focusEv.push({t: n.on, pt: [n.x, n.y]});
	});
	notes.forEach((n) => focusEv.push({t: n.t0, pt: n.target}));
	focusEv.sort((p, q) => p.t - q.t);
	const LIM = {x0: 82, x1: 878, y0: 318, y1: 1262};
	const maxScale = (f: Pt, t: number): number => {
		let s = 1 + PUSH.amount;
		const fit = (v: number, fv: number, lo: number, hi: number) => {
			if (v > fv + 1) s = Math.min(s, (hi - fv) / (v - fv));
			else if (v < fv - 1) s = Math.min(s, (fv - lo) / (fv - v));
		};
		const box = (x0: number, y0: number, x1: number, y1: number) => {
			fit(x0, f[0], LIM.x0, LIM.x1);
			fit(x1, f[0], LIM.x0, LIM.x1);
			fit(y0, f[1], LIM.y0, LIM.y1);
			fit(y1, f[1], LIM.y0, LIM.y1);
		};
		needs.forEach((n) => {
			box(n.x - n.r - 6, n.y - n.r - 6, n.x + n.r + 6, n.y + n.r + 6);
			if (n.badge.t !== null && n.badge.t <= t) box(n.badge.x - 30, n.badge.y - 30, n.badge.x + 30, n.badge.y + 30);
		});
		notes.forEach((n) => {
			if (n.t0 <= t && n.gone > t) box(n.x - n.w / 2 - 4, n.y - n.h / 2 - 16, n.x + n.w / 2 + 6, n.y + n.h / 2 + 8);
		});
		return s;
	};
	const pushes: Push[] = [];
	let idleFrom = opts.revealFrom;
	for (const [a0, a1] of act) {
		if (a0 - idleFrom > PUSH.idle + 700) {
			const last = focusEv.filter((e) => e.t <= idleFrom).pop();
			const p = last ? last.pt : ([CENTER.x, CENTER.y] as Pt);
			const focus: Pt = [CENTER.x + (p[0] - CENTER.x) * PUSH.toward, CENTER.y + (p[1] - CENTER.y) * PUSH.toward];
			const s = maxScale(focus, idleFrom);
			if (s > 1.006 && a0 - 150 - (idleFrom + PUSH.idle) > 1500) pushes.push({tIn: idleFrom + PUSH.idle, tOut: a0 - 150, s, focus});
		}
		idleFrom = Math.max(idleFrom, a1);
	}

	return {needs, heart: heartNode, notes, ripples, calls, pen, pushes};
};
