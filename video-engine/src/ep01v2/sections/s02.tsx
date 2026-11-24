import React from 'react';
import type {SectionCtx} from '../ctx';
import type {Item, Pt} from '../../whiteboard';
import {arrow, clamp01, easeOut, freehand, phone, R, rotMat, ring, stopwatch, strike, thumb, wavy} from '../../whiteboard';

// s02 · 定义：隐藏条款（0:21–0:50）
// 开头在 OPEN 的句子条上方（s02 的地盘 [1160,30,2380,290]）：秒表只走一格 → 句子条自己「印」出字 → 圈「如果」「就」+ 小弹簧。
// 「我管它叫」飞到 S02 岛：D2 片名卡 → D13 手机里滚出协议长卷、手指点勾、卷起盖邮戳、循环箭头 → 「事」划掉、「那句话」波浪线。

export const build = (ctx: SectionCtx) => {
	const {b, q, props, C, P, B} = ctx;
	const {chat} = props;
	const g = chat.lineGeo;

	// ---------- 1. 「补得这么快」：句子条旁一个小秒表，指针只走一格就停 ----------
	const lineView = [1120, 10, 2400, 620] as const; // OPEN = 世界坐标
	ctx.cam([...lineView], ctx.t0 - 300, 900);
	const swX = 1290;
	const swY = 175;
	const tTick = q.at('快', {nth: 1}) + 80; // 「快到你没来得及想」
	const extras: Item[] = [];
	extras.push(...stopwatch(b, 's02sw', swX, swY, 78, q.at('补得') + 120, (ms) => 30 * easeOut(clamp01((ms - tTick) / 180)), {w: 3.6}));
	ctx.sfx(tTick, 'tick', 0.35);

	// ---------- 2. 「只能是早就写好的」：句子条上自己长出字（没有笔） ----------
	const tPrint = q.at('写好');
	chat.lineText('如果TA不回，就……', tPrint - 150, {printed: true, dur: 900});
	extras.push(ctx.text('早就写好的', 1720, 220, 60, tPrint + 700, {color: C.pencilDark}));

	// ---------- 3. 「一碰就弹出来的『如果怎样，就会怎样』」：圈「如果」「就」，中间一根小弹簧 ----------
	const ch = g.size; // 句子条字号 64：「如果」= 2 字宽；「TA」= 2×0.62；「不回」2；「，」1 →「就」在第 6.24 字
	const cy = g.textY - ch * 0.34;
	const ruX = g.textX + ch; // 「如果」中心
	const jiuX = g.textX + ch * 6.24 + ch / 2; // 「就」中心
	const tRu = q.at('如果');
	const tJiu = q.at('就会');
	// 两个圈挂在 D1 道具组上：之后淡出/移动时跟着句子条走
	b.inGroup(chat.g, () => {
		ring(b, ruX, cy, ch * 2 + 60, 104, tRu - 120, 420, {w: 4});
		ring(b, jiuX, cy, ch + 56, 100, tJiu - 120, 380, {w: 4});
	});
	const sp0: Pt = [ruX + 40, cy - 70];
	const sp1: Pt = [jiuX - 20, cy - 70];
	const tSpring = q.at('弹') - 60;
	extras.push(b.node(
		tSpring,
		(ms) => {
			const u = clamp01((ms - tSpring) / 350);
			const dt = (ms - tSpring - 350) / 1000;
			const boing = dt > 0 ? Math.sin(dt * 18) * Math.exp(-dt * 3.2) : 0;
			const x0 = sp0[0];
			const x1 = sp1[0] - (sp1[0] - sp0[0]) * 0.22 * boing;
			const n = 7;
			let d = `M${x0} ${sp0[1]}`;
			for (let i = 0; i < n; i++) {
				const a = x0 + ((x1 - x0) * (i + 0.5)) / n;
				const e = x0 + ((x1 - x0) * (i + 1)) / n;
				d += ` C${a - 18} ${sp0[1] - 30} ${a + 18} ${sp0[1] - 30} ${a} ${sp0[1]} S${e - 6} ${sp0[1] + 22} ${e} ${sp0[1]}`;
			}
			const len = 1400;
			return <path d={d} fill="none" stroke={C.ink} strokeWidth={3.4} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - u)} />;
		},
		{bb: [sp0[0] - 30, sp0[1] - 40, sp1[0] + 30, sp0[1] + 30], dur: 2200},
	));
	ctx.sfx(tSpring + 350, 'pop', 0.22);

	// ---------- 4. 「我管它叫：隐藏条款」：飞到 S02，D2 片名卡 ----------
	const tFly = q.at('我管它叫');
	// 飞走后（镜头已不在 OPEN）把秒表、弹簧、「早就写好的」收掉，给 s03 的联想栏腾地方
	b.eraseAll(extras, tFly + 1600, 200);
	ctx.cam(B(560, -20, 1840, 560), tFly - 100, 1200, {whoosh: true});
	const [tx, ty] = P(1200, 80);
	const tTitleEnd = ctx.write('隐藏条款', tx, ty, 170, q.at('隐藏') - 100, 1300, {anchor: 'middle'});
	freehand(b, [P(830, 290), P(1200, 282), P(1575, 294)], tTitleEnd + 60, 420, {size: 11});

	// ---------- 5. 「就像装软件时那一长串协议」：D13 手机 + 长卷 ----------
	const tSoft = q.at('就像');
	const tPhone = Math.max(tSoft + 600, q.at('软件') + 450);
	ctx.cam(B(80, 340, 1560, 1440), tPhone, 1000);
	const ph = {x: 420, y: 370, w: 300, h: 400};
	const scr = phone(b, ...P(ph.x, ph.y), ph.w, ph.h, tPhone + 100, 800, {w: 3.8});
	ctx.text('用户协议', scr.x + scr.w / 2, scr.y + 62, 48, q.at('一长串') - 200, {anchor: 'middle', dur: 300});
	for (let k = 0; k < 4; k++) {
		const y = scr.y + 110 + k * 52;
		wavy(b, scr.x + 26, scr.x + scr.w - 26, y, q.at('一长串') + 150 + k * 110, 180, {color: C.pencil, w: 3, amp: 6, wave: 30, pen: false});
	}

	// 长卷：从手机底边往下滚出来，拖到纸面底部；灰色波浪线 = 一个字没读
	const SX0 = P(380, 0)[0];
	const SX1 = P(760, 0)[0];
	const top = P(0, ph.y + ph.h - 10)[1];
	const L = 560;
	const tOpen = q.at('协议') - 150;
	const tOpenEnd = tOpen + 1100;
	const tRoll = q.at('签得') - 100;
	const tRollEnd = tRoll + 800;
	const hAt = (ms: number) => {
		if (ms < tRoll) return L * easeOut(clamp01((ms - tOpen) / (tOpenEnd - tOpen)));
		return L * (1 - easeOut(clamp01((ms - tRoll) / (tRollEnd - tRoll))));
	};
	const lineYs = Array.from({length: 8}, (_, k) => 44 + k * 50);
	b.node(
		tOpen,
		(ms) => {
			const h = hAt(ms);
			if (h < 2) return null;
			const w = SX1 - SX0;
			return (
				<g>
					<rect x={SX0} y={top} width={w} height={h} fill={C.card} stroke={C.ink} strokeWidth={3.4} />
					{lineYs
						.filter((ly) => ly < h - 30 && ly < L - 120)
						.map((ly, k) => {
							const n = 8;
							let d = `M${SX0 + 30} ${top + ly}`;
							for (let i = 1; i <= n; i++) d += ` Q${SX0 + 30 + ((w - 60) * (i - 0.5)) / n} ${top + ly + (i % 2 ? -8 : 8)} ${SX0 + 30 + ((w - 60) * i) / n} ${top + ly}`;
							return <path key={k} d={d} fill="none" stroke={C.pencil} strokeWidth={3.2} strokeLinecap="round" />;
						})}
					<ellipse cx={SX0 + w / 2} cy={top + h} rx={w / 2 + 12} ry={18} fill={C.card} stroke={C.ink} strokeWidth={3.4} />
				</g>
			);
		},
		{bb: [SX0 - 20, top - 20, SX1 + 20, top + L + 30], dur: tRollEnd - tOpen},
	);
	b.sound(tOpen, 'page', 0.3);

	// 「你点了同意」：卷尾「☑ 我已阅读并同意」，一根手指点勾
	const cbX = SX0 + 26;
	const cbY = top + L - 96;
	const tAgree = q.at('同意');
	const agree = b.collect(() => {
		b.stroke((s) => R.rect(cbX, cbY, 40, 40, {seed: s, roughness: 0.5}), tOpenEnd - 250, 200, {w: 3.2, pen: false});
		ctx.text('已阅读并同意', cbX + 56, cbY + 36, 48, tOpenEnd - 250, {dur: 0});
		thumb(b, cbX + 20, cbY + 40 + 66, 150, tAgree - 650, {w: 3.6});
		b.stroke((s) => R.linear([[cbX + 6, cbY + 20], [cbX + 18, cbY + 34], [cbX + 40, cbY - 6]], {seed: s, roughness: 0.5}), tAgree + 60, 220, {w: 5, lag: 0});
	});
	ctx.sfx(tAgree + 80, 'tick', 0.4);
	// 「一个字没读」
	const noRead = b.collect(() => {
		arrow(b, P(930, 1000), P(780, 950), q.at('一个字') - 100, 360, {w: 3, color: C.pencilDark, bend: 0.12});
		ctx.text('没读', P(950, 0)[0], P(0, 1020)[1], 64, q.at('一个字') + 250, {color: C.pencilDark});
	});
	b.eraseAll([...agree, ...noRead], tRoll, 300);

	// 「它签得很早，之后每次都自动生效」：卷起，盖一个很早的小邮戳；循环箭头转一圈
	const [pmx, pmy] = P(735, 790);
	const tStamp = q.at('很早') - 60;
	b.stroke((s) => R.circle(pmx, pmy, 92, {seed: s, roughness: 1.2}), tStamp, 220, {w: 3.6, pen: false});
	b.stroke((s) => R.circle(pmx, pmy, 72, {seed: s, roughness: 1.4}), tStamp + 60, 200, {w: 2.4, pen: false});
	ctx.text('很早', pmx, pmy + 20, 56, tStamp + 80, {anchor: 'middle', dur: 0});
	for (let k = 0; k < 3; k++) wavy(b, pmx + 100, pmx + 300, pmy - 30 + k * 30, tStamp + 120 + k * 40, 160, {w: 3, amp: 7, wave: 40, pen: false});
	ctx.sfx(tStamp, 'stamp', 0.45);

	const [lx, ly] = P(1230, 770);
	const tLoop = q.at('之后');
	const tLoopEnd = q.end('生效');
	b.groups.s02loop = (ms) => ({m: rotMat(360 * easeOut(clamp01((ms - tLoop - 700) / (tLoopEnd - tLoop - 500))), lx, ly), o: 1});
	b.inGroup('s02loop', () => {
		const pts: Pt[] = [];
		for (let a = 20; a <= 320; a += 20) pts.push([lx + 95 * Math.sin((a * Math.PI) / 180), ly - 95 * Math.cos((a * Math.PI) / 180)]);
		b.stroke((s) => R.curve(pts, {seed: s, roughness: 0.6}), tLoop, 520, {w: 4.4});
		const e = pts[pts.length - 1];
		b.stroke((s) => R.linear([[e[0] - 6, e[1] - 34], e, [e[0] + 30, e[1] + 10]], {seed: s, roughness: 0.4}), tLoop + 520, 140, {w: 4.4, lag: 0});
	});
	ctx.text('自动生效', lx, ly + 190, 64, q.at('自动生效') - 100, {anchor: 'middle'});

	// ---------- 6. 「让你难受的，常常不是事，是你自动补上的那句话」 ----------
	const tHurt = q.at('让你难受');
	ctx.cam(B(1340, 320, 2400, 1100), tHurt - 300, 1000);
	const shiX = P(1720, 0)[0];
	const shiTop = P(0, 380)[1];
	ctx.write('事', shiX, shiTop, 210, tHurt + 500, 700);
	ctx.text('不是', P(1690, 0)[0], shiTop + 150, 64, q.at('不是事') - 100, {anchor: 'end', color: C.pencilDark});
	strike(b, shiX - 40, shiX + 250, shiTop + 110, q.at('事', q.at('不是事')) + 80, 320, {size: 16, tilt: 10});
	ctx.sfx(q.at('事', q.at('不是事')) + 80, 'erase', 0.2);
	const nTop = P(0, 700)[1];
	const nX = P(1560, 0)[0];
	ctx.text('是', P(1530, 0)[0], nTop + 130, 64, q.at('是你自动') - 50, {anchor: 'end', color: C.pencilDark});
	const tNa = q.at('那句话');
	const nEnd = ctx.write('那句话', nX, nTop, 170, q.at('补上') - 150, tNa + 500 - q.at('补上') + 150);
	wavy(b, nX - 10, nX + 540, nTop + 205, nEnd + 40, 520, {w: 5, amp: 11, wave: 52});
	// hanzi: 事那句话隐藏条款
};
