import React from 'react';
import type {Board, Box, ClauseKey} from '../../whiteboard';
import {arrow, C, CLAUSES, clamp01, clauseOf, penIcon, qmark, R, rr, textW, thumb} from '../../whiteboard';
import {ISLANDS} from '../world';
import {BaseRow} from './base';
import {chatIcon} from './chat';
import {Prop} from './prop';

// D14 · 条款拆解图（核心图 / 本季地图）。家在 CORE 岛。
//
//   事 ──→ 动作 ──→ ┌ 如果TA不回，就 没戏 →然后呢→ 从头找 →然后呢→ 办不成事 ┐ ──  句尾牌   改写栏
//  [聊天框] [拇指?]  └──────────────────────────────────────────────┘     (四色圈)  (竖排)
//                    联想栏（四条候选，只画色条）                               │
//                    底座五格：出事 必须 不行 不在乎 ？  ←─────────────────────┘    工具箱 4×4
//
// s12 按旁白一块块画出来（①事 ②动作 ③一句话 ④句尾+底座 ⑤改写栏+工具箱 ⑥拉远）；s14/s15 回来点亮。
// 每个方法都返回画完的时刻，可以直接串起来：let t = core.event(t0); t = core.action(t) ...

const [OX, OY] = ISLANDS.CORE;
const B = (x0: number, y0: number, x1: number, y1: number): Box => [OX + x0, OY + y0, OX + x1, OY + y1];
const P = (x: number, y: number): [number, number] => [OX + x, OY + y];

const LABEL_Y = 236;
const LABEL_SIZE = 72;
const SENT_SIZE = 70;
const SENT_Y = 472;

export class CoreDiagram extends Prop {
	readonly box = {
		event: B(80, 280, 440, 600),
		action: B(570, 280, 930, 600),
		sentence: B(1060, 300, 2760, 580),
		bar: B(1060, 610, 1900, 930),
		tags: B(2820, 300, 3140, 580),
		base: B(1060, 1080, 2860, 1360),
		rewrite: B(3200, 280, 3570, 900),
		toolbox: B(3200, 1000, 3560, 1360),
		/** 底下空着的一条（s15 画邮件、「完了」用） */
		spare: B(80, 1420, 3560, 1660),
	};
	readonly views = {
		/** 整张图（z≈0.52：只有 70 号以上的字能读） */
		full: B(-80, 100, 3680, 1470),
		/** 事 + 动作 */
		left: B(0, 120, 1120, 700),
		/** 句子条 + 联想栏 */
		sentence: B(980, 120, 2840, 980),
		/** 句尾牌 + 底座 */
		tagsBase: B(1000, 200, 3200, 1440),
		/** 改写栏 + 工具箱 */
		right: B(2860, 140, 3600, 1420),
		/** 底座 */
		base: B(980, 960, 2940, 1440),
	};
	readonly base: BaseRow;
	/** 句子条上各段的位置（世界坐标，基线） */
	readonly chainGeo: {x: number; w: number; text: string; color?: ClauseKey}[];

	constructor(b: Board) {
		super(b, 'd14', ISLANDS.CORE);
		this.base = new BaseRow(b, this.box.base, (items) => this.items.push(...items), this.g);
		const segs: {text: string; color?: ClauseKey; small?: boolean}[] = [
			{text: '如果TA不回，就'},
			{text: '没戏', color: 'red'},
			{text: '→', small: true},
			{text: '从头找', color: 'orange'},
			{text: '→', small: true},
			{text: '办不成事', color: 'blue'},
		];
		let x = OX + 1090;
		this.chainGeo = segs.map((s) => {
			const w = s.small ? 140 : textW(s.text, SENT_SIZE);
			const g = {x, w, text: s.text, color: s.color};
			x += w + 26;
			return g;
		});
	}

	private label(text: string, cx: number, t0: number) {
		this.b.text(text, cx, OY + LABEL_Y, LABEL_SIZE, t0, {anchor: 'middle'});
	}

	/** ① 事：方框 + 迷你涂黑聊天框 + 标签「事」 */
	event(t0: number): number {
		this.draw(() => {
			const [x0, y0, x1, y1] = this.box.event;
			this.b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 18), {seed: s, roughness: 0.8}), t0, 420, {w: 4.4});
			chatIcon(this.b, [x0 + 40, y0 + 34, x1 - 40, y1 - 34], t0 + 420, {time: '23:05'});
			this.label('事', (x0 + x1) / 2, t0 + 1500);
		});
		return t0 + 1800;
	}

	/** ② 动作：箭头 + 方框 + 拇指和问号 + 标签「动作」 */
	action(t0: number): number {
		this.draw(() => {
			arrow(this.b, P(452, 440), P(556, 440), t0, 320, {bend: 0.05, w: 4});
			const [x0, y0, x1, y1] = this.box.action;
			this.b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 18), {seed: s, roughness: 0.8}), t0 + 320, 420, {w: 4.4});
			thumb(this.b, x0 + 130, y0 + 190, 200, t0 + 760);
			qmark(this.b, x0 + 270, y0 + 120, 110, t0 + 1400, 400, {w: 5});
			this.label('动作', (x0 + x1) / 2, t0 + 1500);
		});
		return t0 + 1900;
	}

	/** ③ 一句话：箭头 + 句子条外框 +「如果TA不回，就」；chain=true 时把三段追问也按顺序写完 */
	sentence(t0: number, o: {chain?: boolean; label?: boolean} = {}): number {
		let t = t0;
		this.draw(() => {
			arrow(this.b, P(942, 440), P(1050, 440), t0, 320, {bend: 0.05, w: 4});
			const [x0, y0, x1, y1] = this.box.sentence;
			this.b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 26), {seed: s, roughness: 0.8}), t0 + 320, 520, {w: 4.4});
			const g0 = this.chainGeo[0];
			this.b.text(g0.text, g0.x, OY + SENT_Y, SENT_SIZE, t0 + 840, {dur: 700});
			this.label('一句话', (x0 + x1) / 2, t0 + 1200);
		});
		t = t0 + 1600;
		if (o.chain) for (let k = 0; k < 3; k++) t = this.chain(k, t, {label: o.label}) + 120;
		return t;
	}

	/**
	 * 句子条往右长一段：k=0「没戏」(红圈) · k=1「→然后呢→ 从头找」(橙圈) · k=2「→然后呢→ 办不成事」(蓝圈)。
	 * 箭头上的「然后呢」是 50 号小字：整图全景（z≈0.54）下只有 27px，全景时想干净可以 {label: false}。
	 */
	chain(k: number, t0: number, o: {label?: boolean} = {}): number {
		const segs = k === 0 ? [this.chainGeo[1]] : [this.chainGeo[k * 2], this.chainGeo[k * 2 + 1]];
		let t = t0;
		this.draw(() => {
			for (const s of segs) {
				if (s.text === '→') {
					const y = OY + SENT_Y - SENT_SIZE * 0.32;
					arrow(this.b, [s.x + 4, y], [s.x + s.w - 4, y], t, 300, {bend: 0, w: 3.4, head: 18, color: C.pencilDark});
					if (o.label !== false) this.b.text('然后呢', s.x + s.w / 2, y - 30, 50, t + 120, {anchor: 'middle', color: C.pencilDark, dur: 260});
					t += 420;
				} else {
					const c = clauseOf(s.color ?? 'red');
					const dur = 100 + Array.from(s.text).length * 130;
					this.b.text(s.text, s.x, OY + SENT_Y, SENT_SIZE, t, {dur, color: c.deep});
					this.b.stroke((sd) => R.ellipse(s.x + s.w / 2, OY + SENT_Y - SENT_SIZE * 0.34, s.w + 44, SENT_SIZE * 1.4, {seed: sd, roughness: 1.3, bowing: 1.5}), t + dur + 40, 360, {color: c.color, w: 4});
					t += dur + 420;
				}
			}
		});
		return t;
	}

	/** 句子条下挂的联想栏：四行本色圆点 + 色条（不写字，只示意「四条候选」，全景下也干净） */
	bar(t0: number): number {
		this.draw(() => {
			const [x0, y0, x1, y1] = this.box.bar;
			this.b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 16), {seed: s, roughness: 0.7}), t0, 360, {w: 3, color: C.pencilDark});
			CLAUSES.forEach((c, i) => {
				const y = y0 + 44 + i * 76;
				const t = t0 + 360 + i * 200;
				this.b.stroke((s) => R.circle(x0 + 50, y, 18, {seed: s, roughness: 0.8}), t, 120, {color: c.color, w: 5});
				this.b.stroke((s) => R.line([x0 + 100, y], [x1 - 60, y + 2], {seed: s, roughness: 1.2, bowing: 1}), t + 100, 200, {color: c.color, w: 6});
			});
		});
		return t0 + 360 + 4 * 200 + 120;
	}

	/** ④ 句尾牌（四色圈，lit 那个颜色涂实）+ 标签「句尾」 */
	tags(t0: number, o: {lit?: ClauseKey} = {}): number {
		const centers = this.tagCenters();
		this.draw(() => {
			this.b.stroke((s) => R.line(P(2766, 440), P(2812, 440), {seed: s, roughness: 0.4}), t0, 120, {w: 4});
			CLAUSES.forEach((c, i) => {
				const [x, y] = centers[i];
				const t = t0 + 120 + i * 160;
				this.b.stroke((s) => R.circle(x, y, 52, {seed: s, roughness: 0.9}), t, 260, {color: c.color, w: 4.6});
				this.b.text(c.verb, x, y + 25, 72, t + 200, {anchor: 'middle', color: c.deep, dur: 140});
			});
			this.label('句尾', (this.box.tags[0] + this.box.tags[2]) / 2, t0 + 900);
		});
		if (o.lit) this.lightTag(o.lit, t0 + 1000);
		return t0 + 1300;
	}

	private tagCenters(): [number, number][] {
		return [P(2900, 375), P(3060, 375), P(2900, 505), P(3060, 505)];
	}

	/** 句尾牌上某色亮起（实心本色） */
	lightTag(k: ClauseKey, t: number, o: {hold?: boolean} = {}) {
		const i = CLAUSES.indexOf(clauseOf(k));
		const [x, y] = this.tagCenters()[i];
		const c = CLAUSES[i];
		this.draw(() =>
			this.b.node(
				t,
				(ms) => {
					const u = clamp01((ms - t) / 500);
					const a = o.hold === false ? Math.sin(Math.PI * u) : u;
					return <circle cx={x} cy={y} r={50} fill={c.color} opacity={0.4 * a} />;
				},
				{bb: [x - 56, y - 56, x + 56, y + 56], dur: 500},
			),
		);
	}

	/** 底座五格（四格涂色 + 第五格问号 + 句尾词），再从句尾牌拉一根箭头下来（指向 arrowTo 那一格，默认蓝） */
	baseRow(t0: number, o: {arrowTo?: ClauseKey} = {}): number {
		let t = this.base.frame(t0, {fifth: true, step: 120});
		CLAUSES.forEach((_, i) => this.base.fill(i, t0 + 200 + i * 160, {dur: 420}));
		this.base.fifth(t, {drawFrame: false});
		CLAUSES.forEach((c, i) => this.base.inside(i, c.end, t + 300 + i * 120, {size: 72}));
		t += 900;
		const to = CLAUSES.indexOf(clauseOf(o.arrowTo ?? 'blue'));
		const cell = this.base.cells[to];
		this.draw(() => arrow(this.b, P(2980, 590), [(cell[0] + cell[2]) / 2 + 40, cell[1] - 12], t, 520, {bend: -0.25, w: 4.2}));
		return t + 600;
	}

	/** ⑤ 改写栏（右侧竖排）：lines 默认是 EP01 那一行（最可能 / 我可以）；以「：」结尾的行是灰色小标题。每行 ≤5 字（72 号） */
	rewrite(t0: number, lines: string[] = ['最可能：', '在忙', '我可以：', '不追问', '给截止']): number {
		let t = t0;
		this.draw(() => {
			const [x0, y0, x1, y1] = this.box.rewrite;
			this.b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 18), {seed: s, roughness: 0.8}), t0, 480, {w: 4});
			this.label('改写栏', (x0 + x1) / 2, t0 + 300);
			t = t0 + 800;
			lines.forEach((l, i) => {
				const head = /：$/.test(l);
				this.b.text(l.replace(/：$/, ''), x0 + 30, y0 + 100 + i * 118, head ? 64 : 72, t, {color: head ? C.pencilDark : C.ink});
				t += 120 + Array.from(l).length * 70;
			});
		});
		return t;
	}

	/** 工具箱 4×4（16 格，本季每期一个）：filled 格画上图标（EP01：第 1 格 = 笔） */
	toolbox(t0: number, o: {filled?: number} = {}): number {
		const filled = o.filled ?? 1;
		this.draw(() => {
			const [x0, y0] = this.box.toolbox;
			this.b.text('工具箱', x0 + 180, y0 - 30, 72, t0, {anchor: 'middle'});
			for (let i = 0; i < 16; i++) {
				const cx = x0 + (i % 4) * 90;
				const cy = y0 + Math.floor(i / 4) * 90;
				this.b.stroke((s) => R.rect(cx + 6, cy + 6, 78, 78, {seed: s, roughness: 0.8}), t0 + 300 + i * 50, 140, {w: 2.8, color: i < filled ? C.ink : C.pencil, pen: i < 4});
			}
			if (filled >= 1) penIcon(this.b, x0 + 45, y0 + 45, 64, t0 + 300 + 16 * 50 + 100);
		});
		return t0 + 300 + 16 * 50 + 700;
	}

	/** 空工具格轻闪一下（「以后每期添一样」） */
	flashTools(t: number, o: {from?: number} = {}) {
		const [x0, y0] = this.box.toolbox;
		const from = o.from ?? 1;
		this.draw(() =>
			this.b.node(
				t,
				(ms) => (
					<g>
						{Array.from({length: 16 - from}, (_, k) => {
							const i = k + from;
							const u = clamp01((ms - t - k * 60) / 600);
							const a = Math.sin(Math.PI * u);
							return a > 0.01 ? <rect key={i} x={x0 + (i % 4) * 90 + 8} y={y0 + Math.floor(i / 4) * 90 + 8} width={74} height={74} fill={C.pencil} opacity={0.35 * a} /> : null;
						})}
					</g>
				),
				{bb: this.box.toolbox, dur: 600 + 15 * 60},
			),
		);
	}

	/** 「整图点亮」：各部件的外框依次描一圈粗墨线再淡掉 */
	light(t: number, o: {step?: number; hold?: number} = {}) {
		const step = o.step ?? 160;
		const hold = o.hold ?? 900;
		const parts = [this.box.event, this.box.action, this.box.sentence, this.box.tags, this.box.base, this.box.rewrite, this.box.toolbox];
		this.draw(() =>
			parts.forEach((p, i) => {
				const tt = t + i * step;
				this.b.stroke((s) => R.path(rr(p[0] - 14, p[1] - 14, p[2] - p[0] + 28, p[3] - p[1] + 28, 24), {seed: s, roughness: 1}), tt, 360, {w: 6, color: C.ink, out: tt + 360 + hold, outDur: 500, pen: false});
			}),
		);
		return t + parts.length * step + 360;
	}

	/** 底座第 i 格闪 times 下 */
	baseFlash(k: ClauseKey | number, t: number, times = 2) {
		const i = typeof k === 'number' ? k : CLAUSES.indexOf(clauseOf(k));
		this.base.flash(i, t, {times});
	}

	/** 一口气画完整张图（调试/兜底用）；返回画完时刻 */
	all(t0: number): number {
		let t = this.event(t0);
		t = this.action(t);
		t = this.sentence(t, {chain: true});
		t = this.bar(t);
		t = this.tags(t, {lit: 'blue'});
		t = this.baseRow(t);
		t = this.rewrite(t);
		return this.toolbox(t);
	}
}
