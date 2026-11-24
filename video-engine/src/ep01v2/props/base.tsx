import React from 'react';
import type {Board, Box, Item} from '../../whiteboard';
import {C, CLAUSES, clamp01, FIFTH, hatchBox, qmark, R, sheet} from '../../whiteboard';
import {ISLANDS} from '../world';
import {Prop} from './prop';

// D4 · 底座五格：出事 必须 不行 不在乎 ？（红 橙 蓝 紫 留白）。
// BaseRow 是可以画在任何位置的「一排五格」（D14 核心图里也用它）；Base 是家在 BASE 岛的那一份共享道具。

export class BaseRow {
	readonly cells: Box[];
	constructor(
		readonly b: Board,
		readonly box: Box,
		/** 画出来的条目交给谁收（道具的 items） */
		private sink: (items: Item[]) => void,
		/** 变换组 */
		readonly g?: string,
	) {
		const [x0, y0, x1, y1] = box;
		const w = (x1 - x0) / 5;
		this.cells = [0, 1, 2, 3, 4].map((i) => [x0 + i * w, y0, x0 + (i + 1) * w, y1] as Box);
	}
	private put(fn: () => void) {
		const items = this.b.collect(() => (this.g ? this.b.inGroup(this.g, fn) : fn()));
		this.sink(items);
		return items;
	}
	/** 画前四格（fifth=true 连第五格一起画）。返回画完时刻 */
	frame(t0: number, o: {fifth?: boolean; step?: number} = {}): number {
		const step = o.step ?? 160;
		const n = o.fifth ? 5 : 4;
		this.put(() => {
			for (let i = 0; i < n; i++) {
				const [x0, y0, x1, y1] = this.cells[i];
				this.b.stroke((s) => R.rect(x0, y0, x1 - x0, y1 - y0, {seed: s, roughness: 0.9, bowing: 0.8}), t0 + i * step, 300, {w: 4, dash: i === 4 ? '12 10' : undefined, color: i === 4 ? C.pencilDark : C.ink});
			}
		});
		return t0 + (n - 1) * step + 300;
	}
	/** 第 i 格涂上本色（排线） */
	fill(i: number, t0: number, o: {dur?: number; opacity?: number} = {}): number {
		const c = CLAUSES[i];
		const [x0, y0, x1, y1] = this.cells[i];
		this.put(() => {
			hatchBox(this.b, [x0 + 8, y0 + 8, x1 - 8, y1 - 8], c.color, t0, o.dur ?? 700, {gap: 13, opacity: o.opacity ?? 0.75});
		});
		return t0 + (o.dur ?? 700);
	}
	/** 格子里写字（居中） */
	inside(i: number, text: string, t0: number, o: {size?: number; color?: string; dy?: number} = {}) {
		const [x0, y0, x1, y1] = this.cells[i];
		const size = o.size ?? 64;
		this.put(() => this.b.text(text, (x0 + x1) / 2, (y0 + y1) / 2 + size * 0.36 + (o.dy ?? 0), size, t0, {anchor: 'middle', color: o.color ?? (i < 4 ? CLAUSES[i].deep : C.pencilDark)}));
	}
	/** 格子上方写字（句尾词：出事/必须/不行/不在乎） */
	above(i: number, text: string, t0: number, o: {size?: number; color?: string; gap?: number} = {}) {
		const [x0, y0, x1] = this.cells[i];
		const size = o.size ?? 56;
		this.put(() => this.b.text(text, (x0 + x1) / 2, y0 - (o.gap ?? 22), size, t0, {anchor: 'middle', color: o.color ?? (i < 4 ? CLAUSES[i].deep : C.pencilDark)}));
	}
	/** 格子下方写字（需要名：安全感/自由/价值感/亲密） */
	below(i: number, text: string, t0: number, o: {size?: number; color?: string; gap?: number} = {}) {
		const [x0, , x1, y1] = this.cells[i];
		const size = o.size ?? 52;
		this.put(() => this.b.text(text, (x0 + x1) / 2, y1 + size + (o.gap ?? 14), size, t0, {anchor: 'middle', color: o.color ?? C.ink}));
	}
	/** 第五格：虚线框（如果 frame 没画）+ 中间一个大问号 */
	fifth(t0: number, o: {drawFrame?: boolean} = {}): number {
		const [x0, y0, x1, y1] = this.cells[4];
		this.put(() => {
			if (o.drawFrame !== false) this.b.stroke((s) => R.rect(x0, y0, x1 - x0, y1 - y0, {seed: s, roughness: 0.9}), t0, 320, {w: 4, dash: '12 10', color: C.pencilDark});
			qmark(this.b, (x0 + x1) / 2, (y0 + y1) / 2 - (y1 - y0) * 0.04, (y1 - y0) * 0.62, t0 + 360, 520, {color: FIFTH.color, w: 6});
		});
		return t0 + 900;
	}
	/** 一张小便签盖住第五格一角，写字（「以后揭」） */
	note(t0: number, text = '以后揭', o: {size?: number} = {}) {
		const [, y0, x1] = this.cells[4];
		const size = o.size ?? 52;
		const w = Math.max(220, text.length * size + 40);
		const box: Box = [x1 - w + 40, y0 - 50, x1 + 40, y0 + 50];
		this.put(() => {
			sheet(this.b, box, t0, {tilt: 6, color: C.pencilDark, w: 2.6, r: 6});
			this.b.text(text, (box[0] + box[2]) / 2, (box[1] + box[3]) / 2 + size * 0.36, size, t0 + 300, {anchor: 'middle', color: C.pencilDark});
		});
	}
	/** 第 i 格闪 times 下（本色实底脉冲） */
	flash(i: number, t: number, o: {times?: number; dur?: number} = {}) {
		const [x0, y0, x1, y1] = this.cells[i];
		const color = i < 4 ? CLAUSES[i].color : C.pencil;
		const n = o.times ?? 1;
		const d = o.dur ?? 500;
		this.put(() =>
			this.b.node(
				t,
				(ms) => {
					const u = (ms - t) / d;
					const a = u >= n ? 0 : Math.sin(Math.PI * clamp01(u % 1)) ** 2;
					return a > 0.01 ? <rect x={x0 + 4} y={y0 + 4} width={x1 - x0 - 8} height={y1 - y0 - 8} fill={color} opacity={0.45 * a} /> : null;
				},
				{bb: this.cells[i], dur: n * d},
			),
		);
	}
	/** 四格上方的句尾词 + 下方的需要名，一次写完（t0 起，每格间隔 step） */
	labels(t0: number, what: 'end' | 'need' | 'verb', o: {step?: number} = {}): number {
		const step = o.step ?? 420;
		CLAUSES.forEach((c, i) => {
			if (what === 'end') this.above(i, c.end, t0 + i * step);
			else if (what === 'need') this.below(i, c.need, t0 + i * step);
			else this.inside(i, c.verb, t0 + i * step, {size: 80});
		});
		return t0 + 3 * step + 500;
	}
}

/** 家在 BASE 岛的底座（s04 画；s10 让它「从下方滑上来一点」；s12/s15 用 D14 里自己的那一份） */
export class Base extends Prop {
	readonly row: BaseRow;
	readonly box = {
		/** 五格 */
		cells: [ISLANDS.BASE[0] + 300, ISLANDS.BASE[1] + 360, ISLANDS.BASE[0] + 2100, ISLANDS.BASE[1] + 600] as Box,
	};
	readonly views = {
		/** 五格 + 上下的字 */
		row: [ISLANDS.BASE[0] + 180, ISLANDS.BASE[1] + 200, ISLANDS.BASE[0] + 2220, ISLANDS.BASE[1] + 780] as Box,
		all: ISLANDS.BASE,
	};
	constructor(b: Board) {
		super(b, 'd4', ISLANDS.BASE);
		this.row = new BaseRow(b, this.box.cells, (items) => this.items.push(...items), this.g);
	}
	get cells() {
		return this.row.cells;
	}
	frame(t0: number, o: {fifth?: boolean} = {}) {
		return this.row.frame(t0, o);
	}
	fill(i: number, t0: number, o: {dur?: number} = {}) {
		return this.row.fill(i, t0, o);
	}
	labels(t0: number, what: 'end' | 'need' | 'verb', o: {step?: number} = {}) {
		return this.row.labels(t0, what, o);
	}
	above(i: number, text: string, t0: number) {
		return this.row.above(i, text, t0);
	}
	below(i: number, text: string, t0: number) {
		return this.row.below(i, text, t0);
	}
	inside(i: number, text: string, t0: number, o: {size?: number} = {}) {
		return this.row.inside(i, text, t0, o);
	}
	fifth(t0: number, o: {drawFrame?: boolean} = {}) {
		return this.row.fifth(t0, o);
	}
	note(t0: number, text?: string) {
		return this.row.note(t0, text);
	}
	flash(i: number, t: number, o: {times?: number; dur?: number} = {}) {
		return this.row.flash(i, t, o);
	}
}

