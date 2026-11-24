import React from 'react';
import {arrow, clamp01, easeInOut, easeOut, letterCard, R} from '../../whiteboard';
import type {SectionCtx} from '../ctx';
import {ARROW_Y, LINE_SIZE, LINE_Y, MB, MEMO, mixHex, MP, reg, ringOf} from '../local/s10_layout';

// s11 · 发现：红变蓝（7:42–7:59）  主岛 MEMO（s10 那张备忘录，链「没戏了 → 得从头找 → 办不成事」已经在纸上）
// 拉远看整条链 → 红圈闪两下「像红的」→ 橙圈闪一下 → 蓝圈放大，第一句的红圈沿箭头滑到最后、变成蓝的（Swap）
// → 角落 A–D 字母卡被一层薄纸盖住「表层」→ 句子条上方一根长箭头：左端色点变空心，只有末端实心。

export const build = (ctx: SectionCtx) => {
	const {b, q, C, CLAUSES} = ctx;

	// 「注意看颜色」：拉远，整条链同屏；s10 的辅助画（麦克风、追问格、「我会很烦」……）擦掉
	ctx.cam(MB(40, 230, 1860, 1110), ctx.t0 - 400, 1100);
	const tClean = q.at('注意看') + 700;
	if (reg.aux.length) {
		b.eraseAll(reg.aux, tClean, 500);
		ctx.sfx(tClean, 'erase', 0.22);
	}

	/** 在某个圈上闪 times 下（本色加粗 + 淡淡的底） */
	const flash = (i: number, color: string, t: number, times: number, per = 620) => {
		const r = ringOf(i);
		const [cx, cy] = MP(r.cx, r.cy);
		b.node(
			t,
			(ms) => {
				const u = (ms - t) / per;
				if (u < 0 || u >= times) return null;
				const a = Math.sin(Math.PI * (u % 1)) ** 2;
				return (
					<g>
						<ellipse cx={cx} cy={cy} rx={r.w / 2 + 6} ry={r.h / 2 + 4} fill={color} opacity={0.2 * a} />
						<ellipse cx={cx} cy={cy} rx={r.w / 2 + 6} ry={r.h / 2 + 4} fill="none" stroke={color} strokeWidth={4 + 8 * a} opacity={0.9 * a} />
					</g>
				);
			},
			{bb: [cx - r.w / 2 - 20, cy - r.h / 2 - 20, cx + r.w / 2 + 20, cy + r.h / 2 + 20], dur: times * per},
		);
	};
	const under = (i: number, s: string, color: string, t: number) => {
		const r = ringOf(i);
		ctx.text(s, ...MP(r.cx, LINE_Y + 98), 50, t, {anchor: 'middle', color, dur: 320});
	};

	// 「第一句『没戏了』，听着像红的」：红圈闪两下
	flash(1, C.red, q.at('没戏了') + 60, 2);
	under(1, '像红的', C.redDeep, q.at('像红') - 100);
	// 「中间『得从头找』，是橙的」：橙圈闪一下
	flash(3, C.orange, q.at('得从头找') + 100, 1, 760);
	under(3, '是橙的', C.orangeDeep, q.at('橙') - 250);

	// 「追到底，『办不成事』，是蓝的」：蓝圈放大；第一句的红圈沿箭头滑到最后，一路变成蓝色（Swap）
	const tDeep = q.at('追到底');
	const r1 = ringOf(1);
	const r5 = ringOf(5);
	const [ax, ay] = MP(r1.cx, r1.cy);
	const [zx, zy] = MP(r5.cx, r5.cy);
	// 蓝圈放大并留着（更粗的第二道）
	b.node(
		tDeep,
		(ms) => {
			const u = easeOut(clamp01((ms - tDeep) / 420));
			const s = 1 + 0.16 * u;
			return <ellipse cx={zx} cy={zy} rx={(r5.w / 2) * s} ry={(r5.h / 2) * s} fill="none" stroke={C.blue} strokeWidth={3 + 4 * u} opacity={0.35 + 0.55 * u} />;
		},
		{bb: [zx - r5.w, zy - r5.h, zx + r5.w, zy + r5.h], dur: 420},
	);
	const tSwap = tDeep + 380;
	const swapDur = Math.max(1100, q.at('蓝的') - 150 - tSwap);
	if (reg.rings.red) {
		reg.rings.red.out = tSwap;
		reg.rings.red.outDur = 120;
	}
	// 原来的位置只留一圈铅笔虚线（「以为是红的」）
	b.stroke((seed) => R.ellipse(ax, ay, r1.w, r1.h, {seed, roughness: 1.1, bowing: 1.2}), tSwap + 60, 300, {w: 2.6, dash: '8 10', color: C.pencil, pen: false});
	b.node(
		tSwap,
		(ms) => {
			const u = clamp01((ms - tSwap) / swapDur);
			const e = easeInOut(u);
			const x = ax + (zx - ax) * e;
			const y = ay + (zy - ay) * e - Math.sin(Math.PI * e) * 120; // 沿箭头上方跳过去
			const w = r1.w + (r5.w + 26 - r1.w) * e;
			const h = r1.h + 14 * e;
			const col = mixHex(C.red, C.blue, clamp01((e - 0.25) / 0.6));
			return <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} fill="none" stroke={col} strokeWidth={5} transform={`rotate(${-4 + 8 * e} ${x} ${y})`} />;
		},
		{bb: [ax - r1.w, ay - r1.h - 140, zx + r5.w, zy + r5.h], dur: swapDur},
	);
	ctx.sfx(tSwap, 'whoosh', 0.14);
	ctx.sfx(tSwap + swapDur, 'pop', 0.3);
	under(5, '是蓝的', C.blueDeep, q.at('蓝的') - 150);

	// 「你开头打的那个字母，可能只是最上面一层」：角落 A–D 字母卡，被一层薄纸盖住，纸上写「表层」
	const tCards = q.at('字母');
	const K = MEMO.cards;
	CLAUSES.forEach((c, i) => letterCard(b, ...MP(K.xs[i], K.y), K.s, c.letter, c.color, tCards - 250 + i * 130));
	const tVeil = q.at('最上面');
	const veil = MB(180, 800, 680, 962);
	b.node(
		tVeil,
		(ms) => {
			const u = easeOut(clamp01((ms - tVeil) / 420));
			const dy = (1 - u) * -60;
			return <rect x={veil[0]} y={veil[1] + dy} width={veil[2] - veil[0]} height={veil[3] - veil[1]} rx={10} fill={C.card} opacity={0.8 * u} stroke={C.pencil} strokeWidth={3} />;
		},
		{bb: [veil[0], veil[1] - 60, veil[2], veil[3]], dur: 420},
	);
	ctx.sfx(tVeil, 'page', 0.2);
	ctx.text('表层', (veil[0] + veil[2]) / 2, (veil[1] + veil[3]) / 2 + 20, 60, tVeil + 380, {anchor: 'middle', color: C.pencilDark});

	// 「颜色要追到底，才算数」：句子条上方一根长箭头；左端色点变空心，只有末端是实心
	const tLong = q.at('颜色要');
	const ly = ARROW_Y - LINE_SIZE - 40;
	const [lx0, lyW] = MP(210, ly);
	const [lx1] = MP(1710, ly);
	const dot = (x: number, color: string, t: number, hollowAt?: number) =>
		b.node(
			t,
			(ms) => {
				const u = easeOut(clamp01((ms - t) / 240));
				const h = hollowAt === undefined ? 0 : clamp01((ms - hollowAt) / 360);
				return <circle cx={x} cy={lyW} r={20 * u} fill={color} fillOpacity={1 - h} stroke={color} strokeWidth={5} />;
			},
			{bb: [x - 26, lyW - 26, x + 26, lyW + 26], dur: hollowAt === undefined ? 240 : hollowAt + 360 - t},
		);
	dot(lx0, C.red, tLong, q.at('才算数'));
	arrow(b, [lx0 + 30, lyW], [lx1 - 34, lyW], tLong + 200, 700, {bend: 0, w: 4.2, head: 24});
	dot(lx1, C.blue, tLong + 920);
	ctx.text('追到底才算数', (lx0 + lx1) / 2, lyW - 30, 50, q.at('才算数') - 300, {anchor: 'middle'});
};
