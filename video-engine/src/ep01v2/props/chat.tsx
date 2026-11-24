import React from 'react';
import type {Board, Box, Item, StrokeOpts} from '../../whiteboard';
import {C, check, clamp01, clockFace, easeOut, freehand, HandText, hhmm, moveEase, R, rr, scribble, textW, typingDots} from '../../whiteboard';
import {ISLANDS} from '../world';
import {Prop} from './prop';

// D1 · 涂黑名字的聊天框（家在 OPEN 岛左半边）＋ 句子条（OPEN 岛右上：「如果 TA 不回，就……」那条横线）。
// s01 画出来；s02 在句子条上写字；s03 在它下面弹联想栏（见 bar.tsx）；s07 回来打问号；s10 缩到左上角；s14 原样重现。

const [OX, OY] = ISLANDS.OPEN;
const P = (x: number, y: number): [number, number] => [OX + x, OY + y];
const B = (x0: number, y0: number, x1: number, y1: number): Box => [OX + x0, OY + y0, OX + x1, OY + y1];

/** 当天的分钟数 */
export const hm = (s: string) => {
	const [h, m] = s.split(':').map(Number);
	return h * 60 + m;
};

export class ChatBox extends Prop {
	/** 各部件的世界坐标（家里的位置；道具被移动后用 boxAt(box, t) 换算） */
	readonly box = {
		/** 整个 D1（聊天框 + 句子条），= OPEN 岛 */
		all: ISLANDS.OPEN,
		/** 聊天框外框 */
		panel: B(100, 100, 1020, 840),
		/** 顶栏（头像、名字、状态、时钟） */
		header: B(100, 100, 1020, 262),
		avatar: B(136, 131, 224, 219),
		/** 联系人名字（写两笔后涂黑） */
		name: B(250, 128, 470, 192),
		/** 「对方正在输入…」 */
		status: B(250, 200, 700, 250),
		/** 右上角钟（模拟 + 数字） */
		clock: B(700, 110, 1010, 250),
		/** 消息区 */
		msgs: B(120, 270, 1000, 720),
		/** 你发出去的那条气泡 */
		bubble: B(420, 300, 990, 396),
		/** 输入框 */
		input: B(140, 742, 870, 812),
		send: B(900, 745, 968, 809),
		/** 句子条（横线在 y=420，x 1180–2000；字写在线上方） */
		line: B(1160, 300, 2020, 450),
		/** 句尾牌的位置（句子条右端，bar.tags 滑到这里） */
		tags: B(2030, 330, 2370, 450),
	};
	/** 常用镜头框 */
	readonly views = {
		/** 聊天框 + 周围一点空（z≈1.07） */
		panel: B(40, 60, 1140, 900),
		/** 聊天框 + 句子条（z≈0.85） */
		chatAndLine: B(40, 60, 2300, 960),
		/** 名字特写（z≈1.7：推镜到涂黑的名字，钟也在画里） */
		name: B(60, 60, 1160, 580),
		/** 顶栏（名字 + 状态 + 钟） */
		header: B(90, 70, 1040, 480),
		/** 句子条 + 句尾牌 */
		line: B(1120, 160, 2400, 620),
		/** 句子条 + 下面的联想栏（s03） */
		lineAndBar: B(1120, 180, 2400, 1110),
		/** 整个 OPEN 岛 */
		all: ISLANDS.OPEN,
	};
	/** 句子条：线的两端和字的基线 */
	readonly lineGeo = {x0: OX + 1180, x1: OX + 2000, y: OY + 420, textX: OX + 1190, textY: OY + 398, size: 64};

	private clockKeys: {t: number; dur: number; to: number}[] = [];
	private clockStart = hm('22:47');

	constructor(b: Board) {
		super(b, 'd1', ISLANDS.OPEN);
	}

	/** 画聊天框：外框、顶栏分隔线、头像圈、输入框、发送键。返回画完的时刻 */
	frame(t0: number, dur = 1800): number {
		const k = dur / 1800;
		this.draw(() => {
			const b = this.b;
			const [x0, y0, x1, y1] = this.box.panel;
			b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 30), {seed: s, roughness: 0.8, bowing: 0.6}), t0, 620 * k, {w: 4.4});
			b.stroke((s) => R.line(P(110, 262), P(1010, 262), {seed: s, roughness: 0.5}), t0 + 640 * k, 260 * k, {w: 2.6, color: C.pencilDark});
			const a = this.box.avatar;
			b.stroke((s) => R.circle((a[0] + a[2]) / 2, (a[1] + a[3]) / 2, 44, {seed: s, roughness: 0.8}), t0 + 920 * k, 260 * k, {w: 3.4});
			const ib = this.box.input;
			b.stroke((s) => R.path(rr(ib[0], ib[1], ib[2] - ib[0], ib[3] - ib[1], 30), {seed: s, roughness: 0.6}), t0 + 1200 * k, 340 * k, {w: 3, color: C.pencilDark});
			const sd = this.box.send;
			b.stroke((s) => R.circle((sd[0] + sd[2]) / 2, (sd[1] + sd[3]) / 2, 32, {seed: s, roughness: 0.6}), t0 + 1560 * k, 160 * k, {w: 3, color: C.pencilDark});
			b.stroke((s) => R.linear([P(922, 790), P(946, 777), P(922, 764)], {seed: s, roughness: 0.4}), t0 + 1700 * k, 100 * k, {w: 3, color: C.pencilDark, lag: 0});
		});
		return t0 + dur;
	}

	/** 顶部联系人名字：先写两笔，再被来回涂成一团黑。返回涂完的时刻 */
	name(t0: number, o: {write?: number; black?: number} = {}): number {
		const tw = o.write ?? 520;
		const tb = o.black ?? 700;
		this.draw(() => {
			const [x0, y0, , y1] = this.box.name;
			const cy = (y0 + y1) / 2;
			// 两笔「名字」：像草写的两个字
			freehand(this.b, [[x0 + 14, cy + 8], [x0 + 40, cy - 16], [x0 + 64, cy + 12], [x0 + 88, cy - 12]], t0, tw * 0.45, {size: 7, color: C.ink});
			freehand(this.b, [[x0 + 112, cy - 18], [x0 + 124, cy + 16], [x0 + 150, cy - 10], [x0 + 176, cy + 14], [x0 + 196, cy - 6]], t0 + tw * 0.55, tw * 0.45, {size: 7, color: C.ink});
			scribble(this.b, [x0 + 4, y0 + 6, x0 + 212, y1 - 4], t0 + tw + 120, tb, {size: 16, rows: 6});
		});
		return t0 + tw + 120 + tb;
	}

	/** 你发出去的那条气泡（右侧）。返回写完字的时刻 */
	bubble(t0: number, text = '那件事，你考虑得怎么样了？', size = 40): number {
		const [x0, y0, x1, y1] = this.box.bubble;
		this.draw(() => {
			const b = this.b;
			b.stroke((s) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 22), {seed: s, roughness: 0.8}), t0, 320, {w: 3.2});
			b.stroke((s) => R.path(`M${x1 - 4} ${y1 - 20} L${x1 + 18} ${y1 + 6} L${x1 - 26} ${y1 - 2}`, {seed: s, roughness: 0.6}), t0 + 300, 120, {w: 3.2, lag: 0});
			b.text(text, (x0 + x1) / 2, (y0 + y1) / 2 + size * 0.36, size, t0 + 420, {anchor: 'middle'});
		});
		return t0 + 420 + Math.min(900, 70 + Array.from(text).length * 85);
	}

	/**
	 * 「对方正在输入…」：t0 写出灰字，三个点在 [t0+350, t1] 里依次跳 rounds 轮；count=true 时旁边小计数 1、2、3。
	 * 点和字一直留着，直到 statusOff(t) 擦掉。
	 */
	status(t0: number, t1: number, o: {rounds?: number; count?: boolean; text?: string} = {}) {
		const rounds = o.rounds ?? 3;
		const text = o.text ?? '对方正在输入';
		const [x0, , , y1] = this.box.status;
		const size = 38;
		const tx = x0;
		const ty = y1 - 12;
		this.draw(() => {
			const b = this.b;
			const it = b.text(text, tx, ty, size, t0, {color: C.pencilDark, dur: 360});
			this.statusItems.push(it);
			const dx = tx + textW(text, size) + 22;
			const dots = typingDots(b, dx, ty - 10, 6, t0 + 350, t1, {rounds, color: C.pencilDark});
			this.statusItems.push(dots);
			if (o.count !== false) {
				const per = (t1 - t0 - 350) / rounds;
				const times = Array.from({length: rounds}, (_, i) => t0 + 350 + i * per);
				const cnt = b.node(
					times[0],
					(ms) => {
						const n = times.filter((t) => t <= ms).length;
						const pop = 1 + 0.3 * (1 - easeOut(clamp01((ms - times[n - 1]) / 240)));
						const cx = dx + 90;
						return (
							<g transform={`translate(${cx} ${ty}) scale(${pop}) translate(${-cx} ${-ty})`}>
								<HandText x={cx} y={ty} size={32} color={C.pencilDark} anchor="middle">
									{String(n)}
								</HandText>
							</g>
						);
					},
					{bb: [dx + 60, ty - 36, dx + 120, ty + 8], dur: t1 - times[0]},
				);
				this.statusItems.push(cnt);
				times.forEach((t) => b.sound(t, 'tick', 0.25));
			}
		});
	}
	private statusItems: Item[] = [];

	/** 擦掉「对方正在输入…」（橡皮擦的声音） */
	statusOff(t: number, dur = 380) {
		this.b.eraseAll(this.statusItems, t, dur);
		this.statusItems = [];
		this.b.sound(t, 'erase', 0.3);
	}

	/** 右上角的钟：模拟钟 + 数字时间（22:47 起），时间由 clockTo 的关键帧驱动 */
	clock(t0: number, start = '22:47') {
		this.clockStart = hm(start);
		this.draw(() => {
			clockFace(this.b, 'd1clock', OX + 950, OY + 180, 56, t0, (ms) => this.timeAt(ms), {w: 3.4});
			this.b.node(
				t0 + 700,
				(ms) => {
					const u = easeOut(clamp01((ms - t0 - 700) / 300));
					return (
						<HandText x={OX + 868} y={OY + 196} size={44} anchor="end" opacity={u}>
							{hhmm(this.timeAt(ms))}
						</HandText>
					);
				},
				{bb: B(730, 150, 870, 206), textSize: 44, textLen: 5},
			);
		});
	}

	/** 从 t 开始，用 dur 毫秒把钟拨到 hh:mm（指针转，数字跟着跳） */
	clockTo(t: number, dur: number, to: string) {
		this.clockKeys.push({t, dur: Math.max(1, dur), to: hm(to)});
		this.clockKeys.sort((a, c) => a.t - c.t);
		// 指针转动算「在动」（lint 的静止检查用）
		this.b.node(t, () => null, {dur, nolint: true});
	}

	/** 钟在 ms 时刻显示的分钟数 */
	timeAt(ms: number): number {
		let v = this.clockStart;
		for (const k of this.clockKeys) {
			if (k.t > ms) break;
			v = v + (k.to - v) * moveEase(clamp01((ms - k.t) / k.dur));
		}
		return v;
	}

	/** 句子条：一条空白横线。返回画完的时刻 */
	line(t0: number, dur = 520): number {
		const g = this.lineGeo;
		this.draw(() => {
			this.b.stroke((s) => R.line([g.x0, g.y], [g.x1, g.y + 3], {seed: s, roughness: 0.9, bowing: 1}), t0, dur, {w: 4});
		});
		return t0 + dur;
	}

	/**
	 * 在句子条上写字（默认从线的左端写，字号 64）。printed=true：没有笔、像印好的一样淡入（s02「自己长出字」）。
	 * 返回 TextItem（可以 out 擦掉）。
	 */
	lineText(text: string, t0: number, o: {dur?: number; printed?: boolean; color?: string; size?: number; x?: number} = {}) {
		const g = this.lineGeo;
		return this.draw(() => {
			if (o.printed) {
				const it = this.b.text(text, o.x ?? g.textX, g.textY, o.size ?? g.size, t0, {color: o.color, dur: 0});
				const fadeIn = o.dur ?? 600;
				// 印出来：透明度从 0 到 1（用 node 包一层会丢字号 lint，这里直接改 opacity 曲线）
				this.b.node(
					t0,
					(ms) => {
						const u = clamp01((ms - t0) / fadeIn);
						return u < 1 ? <rect x={(o.x ?? g.textX) - 8} y={g.textY - (o.size ?? g.size)} width={textW(text, o.size ?? g.size) + 16} height={(o.size ?? g.size) * 1.3} fill={C.paper} opacity={1 - u} /> : null;
					},
					{bb: [g.textX - 8, g.textY - 70, g.textX + textW(text, o.size ?? g.size) + 8, g.textY + 20], dur: fadeIn, nolint: true},
				);
				return it;
			}
			return this.b.text(text, o.x ?? g.textX, g.textY, o.size ?? g.size, t0, {color: o.color, dur: o.dur});
		});
	}

	/** 句子条右边的小对勾（「补上了吧」） */
	check(t0: number) {
		this.draw(() => check(this.b, OX + 2060, OY + 380, 60, t0, 280));
	}

	/**
	 * 输入框里的字随时间变化：steps = [[t, '？'], [t2, ''], [t3, '？']]。每次变化带一点弹跳，光标一直闪。
	 * 空字符串 = 删掉。
	 */
	input(steps: [number, string][], o: {until?: number; size?: number} = {}) {
		const sorted = [...steps].sort((a, c) => a[0] - c[0]);
		const [x0, y0, , y1] = this.box.input;
		const size = o.size ?? 44;
		const tx = x0 + 30;
		const ty = (y0 + y1) / 2 + size * 0.36;
		this.draw(() => {
			this.b.node(
				sorted[0][0],
				(ms, frame) => {
					if (o.until !== undefined && ms > o.until) return null;
					let i = 0;
					for (let k = 0; k < sorted.length; k++) if (sorted[k][0] <= ms) i = k;
					const s = sorted[i][1];
					const pop = 1 + 0.18 * (1 - easeOut(clamp01((ms - sorted[i][0]) / 200)));
					const caret = frame % 16 < 9;
					const w = textW(s, size);
					return (
						<g>
							<g transform={`translate(${tx} ${ty}) scale(${pop}) translate(${-tx} ${-ty})`}>
								<HandText x={tx} y={ty} size={size}>
									{s}
								</HandText>
							</g>
							{caret ? <rect x={tx + w + 4} y={ty - size * 0.85} width={3} height={size} fill={C.ink} /> : null}
						</g>
					);
				},
				{bb: this.box.input, textSize: size, textLen: 1, dur: sorted[sorted.length - 1][0] - sorted[0][0]},
			);
		});
		sorted.forEach(([t]) => this.b.sound(t, 'tick', 0.2));
	}
}

/**
 * 迷你 D1 图标（涂黑名字的小聊天框）：D14 的「事」格、s06 纸角、任何需要「开头那条消息」的地方。
 * 不属于任何道具组；需要跟着别的道具动就传 o.g。
 */
export const chatIcon = (b: Board, box: Box, t0: number, o: StrokeOpts & {time?: string} = {}): Item[] =>
	b.collect(() => {
		const [x0, y0, x1, y1] = box;
		const w = x1 - x0;
		const h = y1 - y0;
		b.stroke((s) => R.path(rr(x0, y0, w, h, Math.min(w, h) * 0.08), {seed: s, roughness: 0.7}), t0, 360, {w: 3.6, ...o});
		b.stroke((s) => R.line([x0 + w * 0.04, y0 + h * 0.24], [x1 - w * 0.04, y0 + h * 0.24], {seed: s, roughness: 0.4}), t0 + 360, 140, {w: 2.2, color: C.pencilDark, ...o});
		scribble(b, [x0 + w * 0.08, y0 + h * 0.06, x0 + w * 0.46, y0 + h * 0.18], t0 + 500, 360, {size: Math.max(6, h * 0.05), g: o.g, out: o.out});
		b.stroke((s) => R.path(rr(x0 + w * 0.4, y0 + h * 0.34, w * 0.5, h * 0.16, h * 0.05), {seed: s, roughness: 0.6}), t0 + 860, 220, {w: 2.8, ...o});
		b.stroke((s) => R.path(rr(x0 + w * 0.06, y0 + h * 0.8, w * 0.7, h * 0.12, h * 0.05), {seed: s, roughness: 0.5}), t0 + 1080, 200, {w: 2.4, color: C.pencilDark, ...o});
		if (o.time) b.text(o.time, x1 - w * 0.06, y0 + h * 0.19, h * 0.13, t0 + 700, {anchor: 'end', color: C.pencilDark, out: o.out, g: o.g, dur: 200, nolint: true});
	});
