import React from 'react';
import type {Board, Box, Item} from '../../whiteboard';
import {C, chair, CLAUSES, clamp01, clauseOf, door, easeOut, R, rr, shield, stamp, strike, textW} from '../../whiteboard';
import type {ClauseKey} from '../../whiteboard';
import {ISLANDS} from '../world';
import {Prop} from './prop';

// D3 · 输入法联想栏（四条候选 A–D）＋ 句尾词圈色 ＋ 防/关/评/等图标 ＋ 句尾牌（四色圈）。
// 家在 OPEN 岛右下（句子条正下方，和 D14 里「句子条下挂联想栏」一致）。s03 画；s09–s11 用它的颜色和句尾牌。

const [OX, OY] = ISLANDS.OPEN;
const B = (x0: number, y0: number, x1: number, y1: number): Box => [OX + x0, OY + y0, OX + x1, OY + y1];

const ROW_Y0 = 482;
const ROW_H = 118;
const ROW_STEP = 125;

export type BarRow = {
	/** 整行 */
	box: Box;
	/** 字母圈中心 */
	letter: [number, number];
	/** 候选句的起点（基线） */
	text: [number, number];
	/** 句尾词写在这里（起点、基线） */
	tail: [number, number];
	/** 图标中心 */
	icon: [number, number];
	/** 防/关/评/等 的位置（起点、基线） */
	verb: [number, number];
};

export class SuggestBar extends Prop {
	readonly box = {
		/** 下拉联想栏外框 */
		frame: B(1160, 470, 2372, 990),
		/** 句尾牌暂放的那一排（滑到句子条右端之前） */
		staging: B(1300, 1010, 1700, 1100),
		/** 句尾牌的最终位置（句子条右端，= chat.box.tags） */
		tagSlot: B(2030, 330, 2370, 450),
	};
	readonly views = {
		/** 联想栏整体 */
		bar: B(1120, 440, 2400, 1110),
		/** 句子条 + 联想栏 */
		lineAndBar: B(1120, 180, 2400, 1110),
	};
	readonly rows: BarRow[] = CLAUSES.map((_, i) => {
		const y0 = ROW_Y0 + i * ROW_STEP;
		return {
			box: B(1170, y0, 2362, y0 + ROW_H),
			letter: [OX + 1215, OY + y0 + 59],
			text: [OX + 1272, OY + y0 + 76],
			tail: [OX + 1650, OY + y0 + 77],
			icon: [OX + 1985, OY + y0 + 59],
			verb: [OX + 2090, OY + y0 + 82],
		};
	});
	private rowText: string[] = CLAUSES.map((c) => c.sample);
	private tagTrack = 'd3tags';
	private tagCenters: [number, number][] = [];

	constructor(b: Board) {
		super(b, 'd3', [OX + 1140, OY + 460, OX + 2380, OY + 1110]);
	}

	/** 弹出联想栏：外框 + 四个空格（行分隔线） */
	frame(t0: number, dur = 700): number {
		this.draw(() => {
			const [x0, y0, x1, y1] = this.box.frame;
			this.b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 22), {seed: s, roughness: 0.7}), t0, dur * 0.6, {w: 3.4, color: C.pencilDark});
			for (let i = 1; i < 4; i++) {
				const y = OY + ROW_Y0 + i * ROW_STEP - 4;
				this.b.stroke((s) => R.line([x0 + 20, y], [x1 - 20, y], {seed: s, roughness: 0.4}), t0 + dur * 0.6 + i * 60, dur * 0.2, {w: 2, color: C.pencil, pen: false});
			}
		});
		this.b.sound(t0, 'pop', 0.25);
		return t0 + dur;
	}

	/** 第 i 行写出字母 + 候选句（默认 CLAUSES[i].sample，如「出什么事了」）。返回写完时刻 */
	row(i: number, t0: number, o: {text?: string; size?: number} = {}): number {
		const c = CLAUSES[i];
		const r = this.rows[i];
		const text = o.text ?? c.sample;
		this.rowText[i] = text;
		const size = o.size ?? 50;
		const dur = Math.min(900, 70 + Array.from(text).length * 85);
		this.draw(() => {
			this.b.stroke((s) => R.circle(r.letter[0], r.letter[1], 34, {seed: s, roughness: 0.8}), t0, 240, {w: 3.4, color: c.color});
			this.b.text(c.letter, r.letter[0], r.letter[1] + 15, 42, t0 + 160, {anchor: 'middle', color: c.color, weight: 700, dur: 140});
			this.b.text(text, r.text[0], r.text[1], size, t0 + 320, {dur});
		});
		return t0 + 320 + dur;
	}

	/** 「别看前半句」：用灰笔把第 i 行候选句的前半截涂掉（frac = 涂掉的比例） */
	strikeHead(i: number, t0: number, o: {frac?: number; dur?: number} = {}) {
		const r = this.rows[i];
		const w = textW(this.rowText[i], 50) * (o.frac ?? 0.55);
		this.draw(() => strike(this.b, r.text[0] - 6, r.text[0] + w, r.text[1] - 16, t0, o.dur ?? 300, {color: C.pencil, size: 16, tilt: 4}));
	}

	/** 句尾词（默认 CLAUSES[i].end：出事/必须/不行/不在乎）写出来，再用本色圈起来。返回圈完时刻 */
	tail(i: number, t0: number, o: {word?: string} = {}): number {
		const c = CLAUSES[i];
		const r = this.rows[i];
		const word = o.word ?? c.end;
		const size = 54;
		const w = textW(word, size);
		const dur = 120 + Array.from(word).length * 150;
		this.draw(() => {
			this.b.text(word, r.tail[0], r.tail[1], size, t0, {color: c.deep, dur});
			this.b.stroke((s) => R.ellipse(r.tail[0] + w / 2, r.tail[1] - size * 0.34, w + 70, 96, {seed: s, roughness: 1.4, bowing: 1.6}), t0 + dur + 60, 420, {color: c.color, w: 4.4});
		});
		return t0 + dur + 480;
	}

	/** 第 i 行旁边的图标：盾（防）/ 关上的门（关）/ 打分印章（评）/ 挂钟的空椅子（等），用本色 */
	icon(i: number, t0: number, o: {size?: number} = {}): number {
		const c = CLAUSES[i];
		const [cx, cy] = this.rows[i].icon;
		const s = o.size ?? 96;
		this.draw(() => {
			const oo = {color: c.color};
			if (i === 0) shield(this.b, cx, cy, s, t0, oo);
			else if (i === 1) door(this.b, cx, cy, s, t0, oo);
			else if (i === 2) stamp(this.b, cx, cy - 4, s, t0, oo);
			else chair(this.b, cx, cy, s, t0, oo);
		});
		return t0 + (i === 1 ? 1240 : 900);
	}

	/** 口诀字（防/关/评/等），写在图标右边 */
	verb(i: number, t0: number, o: {text?: string} = {}): number {
		const c = CLAUSES[i];
		const [x, y] = this.rows[i].verb;
		const text = o.text ?? `· ${c.verb}`;
		this.draw(() => this.b.text(text, x, y, 64, t0, {color: c.deep, dur: 260}));
		return t0 + 260;
	}

	/** 一行闪一下（念到哪块亮哪块）：本色淡底，times 次 */
	flash(i: number, t: number, o: {times?: number; dur?: number; hold?: boolean} = {}) {
		const c = CLAUSES[i];
		const [x0, y0, x1, y1] = this.rows[i].box;
		const n = o.times ?? 1;
		const d = o.dur ?? 520;
		this.draw(() =>
			this.b.node(
				t,
				(ms) => {
					const u = (ms - t) / d;
					let a: number;
					if (o.hold && u >= n - 0.5) a = 0.5;
					else a = u >= n ? 0 : Math.sin(Math.PI * (u % 1)) ** 2;
					return a > 0.01 ? <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={14} fill={c.color} opacity={0.22 * a} /> : null;
				},
				{bb: this.rows[i].box, dur: n * d},
			),
		);
	}

	/**
	 * 句尾牌：四个本色小圈，圈里写防/关/评/等。
	 * slideAt 省略：直接画在句子条右端；给了：先在联想栏下面排成一行，slideAt 时整排滑到句子条右端。
	 * 返回画完（或滑完）的时刻。
	 */
	tags(t0: number, o: {slideAt?: number; slideDur?: number} = {}): number {
		const slot = this.box.tagSlot;
		const cy = (slot[1] + slot[3]) / 2;
		const target: [number, number][] = CLAUSES.map((_, i) => [slot[0] + 44 + i * 84, cy]);
		const st = this.box.staging;
		const scy = (st[1] + st[3]) / 2;
		const staged: [number, number][] = CLAUSES.map((_, i) => [st[0] + 44 + i * 100, scy]);
		const pos = o.slideAt === undefined ? target : staged;
		this.tagCenters = target;
		const g = o.slideAt === undefined ? this.g : this.tagTrack;
		if (o.slideAt !== undefined) {
			const c0: [number, number] = [(staged[0][0] + staged[3][0]) / 2, scy];
			const tr = this.b.track(this.tagTrack, c0);
			tr.to(o.slideAt, o.slideDur ?? 900, {x: (target[0][0] + target[3][0]) / 2, y: cy, s: 84 / 100});
			this.b.sound(o.slideAt, 'whoosh', 0.12);
		}
		const items: Item[] = this.b.collect(() =>
			this.b.inGroup(g, () => {
				CLAUSES.forEach((c, i) => {
					const [x, y] = pos[i];
					const tt = t0 + i * 180;
					this.b.stroke((s) => R.circle(x, y, 36, {seed: s, roughness: 0.9}), tt, 260, {color: c.color, w: 4.2});
					this.b.text(c.verb, x, y + 16, 46, tt + 200, {anchor: 'middle', color: c.deep, dur: 140});
				});
			}),
		);
		this.items.push(...items);
		return o.slideAt !== undefined ? o.slideAt + (o.slideDur ?? 900) : t0 + 3 * 180 + 340;
	}

	/** 句尾牌上第 i 个（或颜色 key）亮起来：实心本色底；hold=false 时只闪一下 */
	tagLight(k: number | ClauseKey, t: number, o: {hold?: boolean; dur?: number} = {}) {
		const c = clauseOf(k);
		const i = CLAUSES.indexOf(c);
		const [x, y] = this.tagCenters[i] ?? [0, 0];
		const d = o.dur ?? 600;
		this.draw(() =>
			this.b.node(
				t,
				(ms) => {
					const u = clamp01((ms - t) / d);
					const a = o.hold === false ? Math.sin(Math.PI * u) : easeOut(u);
					return <circle cx={x} cy={y} r={34 * (0.8 + 0.2 * a)} fill={c.color} opacity={0.35 * a} />;
				},
				{bb: [x - 40, y - 40, x + 40, y + 40], dur: d},
			),
		);
	}
}
