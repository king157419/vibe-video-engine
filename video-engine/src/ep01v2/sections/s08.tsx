import React from 'react';
import type {Item, Pt, StrokeOpts} from '../../whiteboard';
import {arrow, bubble, C, freehand, person, R, rr, sheet, shield, strike, wavy} from '../../whiteboard';
import type {SectionCtx} from '../ctx';

// s08 · 自证圆圈：它会自己造证据（4:02–4:53）  主岛 S08（S07 下面）
// D9：左边一个圆圈，四个节点（上 1 / 右 2 / 下 3 / 左 4），节点间弧形箭头。
//   紫色版：不在乎我 → 「随便你」→ 对方抱臂+小盾（「你怎么了？」画出来又擦掉，只剩空气泡）→ 看吧（回到 1，整圈加粗）
//   擦掉节点内容，红色版：肯定没好事 → 招聘软件 + 闹钟 02:00 → 会议桌·答非所问·皱眉 → 看吧（更粗）
//   右边：两个版本并排——节点 1 → 箭头「造的」→ 看吧 + 便签「真的」；圈外「等证据」小人，圈里箭头一直转
//   最后整组缩到左上角，中央写「事」划掉、「那句话」波浪线（答案句第 2 次）
// hanzi: 看吧 事 那句话

export const build = (ctx: SectionCtx) => {
	const {b, q, t0, tNext, P, B, CLAUSES} = ctx;
	const G = 'd9';
	const tr = b.track(G, P(1230, 580));

	ctx.cam(B(80, 40, 1720, 1100), t0 - 500, 1300, {whoosh: true});

	// ---- 圆圈几何 ----
	const [CX, CY] = P(880, 500);
	const RR = 280;
	const NODE_A = [-90, 0, 90, 180];
	const pol = (deg: number, r = RR): Pt => [CX + Math.cos((deg * Math.PI) / 180) * r, CY + Math.sin((deg * Math.PI) / 180) * r];
	const nodes = NODE_A.map((a) => pol(a));
	const arcArrow = (a0: number, a1: number, t: number, o: StrokeOpts = {}) => {
		const n = 14;
		const pts: Pt[] = [];
		for (let i = 0; i <= n; i++) pts.push(pol(a0 + ((a1 - a0) * i) / n));
		b.stroke((s) => R.curve(pts, {seed: s, roughness: 0.8}), t, 420, {w: 3.6, ...o});
		const e = pts[n];
		const rad = ((a1 + 90) * Math.PI) / 180; // 切线方向（顺时针）
		const ux = Math.cos(rad);
		const uy = Math.sin(rad);
		const hl = 26;
		b.stroke((s) => R.linear([[e[0] - ux * hl - uy * hl * 0.6, e[1] - uy * hl + ux * hl * 0.6], e, [e[0] - ux * hl + uy * hl * 0.6, e[1] - uy * hl - ux * hl * 0.6]], {seed: s, roughness: 0.6}), t + 420, 140, {w: 3.6, lag: 0, ...o});
	};
	const arcs: [number, number][] = [
		[-76, -14],
		[14, 76],
		[104, 166],
		[194, 256],
	];
	const dotFill = (i: number, color: string, t: number, out?: number) =>
		b.node(t, () => <circle cx={nodes[i][0]} cy={nodes[i][1]} r={18} fill={color} />, {bb: [nodes[i][0] - 24, nodes[i][1] - 24, nodes[i][0] + 24, nodes[i][1] + 24], out, outDur: 300});
	const thicken = (t: number, w: number) => b.stroke((s) => R.circle(CX, CY, RR, {seed: s, roughness: 1.3, bowing: 1.5}), t, 800, {w});

	b.inGroup(G, () => {
		// ---- 「它会自己造证据」：空圆圈 + 四个节点 ----
		const tC = q.at('造');
		b.stroke((s) => R.circle(CX, CY, RR, {seed: s, roughness: 1.2, bowing: 1.5}), tC, 900, {w: 3.6});
		nodes.forEach(([x, y], i) => b.stroke((s) => R.circle(x, y, 24, {seed: s, roughness: 0.8}), tC + 900 + i * 140, 180, {w: 3.4}));
		ctx.text('它会自己造证据', ...P(1500, 130), 56, q.at('造证据'), {anchor: 'middle'});

		// ================= 紫色版 =================
		const purple: Item[] = b.collect(() => {
			const p = CLAUSES[3];
			const t1 = q.at('不在乎');
			ctx.text('不在乎我', nodes[0][0], nodes[0][1] - 52, 56, t1, {anchor: 'middle', color: p.deep});
			dotFill(0, p.color, t1 + 400);
			arcArrow(...arcs[0], q.at('后来'));
			bubble(b, nodes[1][0] + 60, nodes[1][1] - 60, 270, 92, q.at('随便你') - 150, {side: 'r', text: '随便你', size: 46});
			arcArrow(...arcs[1], q.at('对方看到'));
			// 节点 3：对方抱臂 + 小盾；「你怎么了？」画出来又擦掉，只剩一个空气泡
			const tH = q.at('多半');
			person(b, ...P(760, 1000), 150, tH, {pose: 'hug'});
			shield(b, ...P(760, 815), 50, q.at('护住'), {w: 3});
			ctx.text('先护住自己', ...P(900, 1000), 48, q.at('护住') + 500);
			const tQ = q.at('也不说话');
			const ask = bubble(b, ...P(900, 838), 290, 82, tQ, {side: 'l', text: '你怎么了？', size: 46});
			b.eraseAll(ask, q.end('也不说话') + 100, 300);
			b.sound(q.end('也不说话') + 100, 'erase', 0.25);
			bubble(b, ...P(900, 838), 290, 82, q.end('也不说话') + 450, {side: 'l', dashed: true, color: C.pencilDark});
			arcArrow(...arcs[2], q.at('你心里一句'));
			const tK = q.at('看吧');
			ctx.write('看吧', nodes[3][0] - 44, nodes[3][1] - 30, 64, tK, 700, {anchor: 'end'});
			arcArrow(...arcs[3], q.end('看吧'));
		});
		thicken(q.end('看吧') + 450, 7);

		// ================= 红色版：擦掉节点内容，圈和箭头留着 =================
		const tR = q.at('再比如');
		b.eraseAll(purple, tR, 450);
		b.sound(tR, 'erase', 0.3);
		{
			const r = CLAUSES[0];
			const t1 = q.at('没好事');
			ctx.text('肯定没好事', nodes[0][0], nodes[0][1] - 52, 56, t1, {anchor: 'middle', color: r.deep});
			dotFill(0, r.color, t1 + 400);
			arcArrow(...arcs[0], q.at('那晚'), {w: 5});
			// 节点 2：手机上一排职位卡片在滑；床头闹钟 02:00
			const tJ = q.at('招聘');
			const [px, py] = P(1235, 380);
			b.stroke((s) => R.path(rr(px, py, 170, 280, 18), {seed: s, roughness: 0.7}), tJ, 380, {w: 3.4});
			b.node(
				tJ + 400,
				(ms) => {
					const u = ((ms - tJ - 400) / 1400) % 1;
					return (
						<g>
							<defs>
								<clipPath id="d9phone">
									<rect x={px + 8} y={py + 8} width={154} height={264} />
								</clipPath>
							</defs>
							<g clipPath="url(#d9phone)">
								{[0, 1, 2, 3, 4].map((i) => {
									const y = py + 30 + ((i * 70 - u * 70 + 350) % 350) - 40;
									return (
										<g key={i}>
											<rect x={px + 22} y={y} width={126} height={52} rx={8} fill="none" stroke={C.pencilDark} strokeWidth={2.4} />
											<line x1={px + 34} y1={y + 18} x2={px + 100} y2={y + 18} stroke={C.pencil} strokeWidth={2.4} />
											<line x1={px + 34} y1={y + 36} x2={px + 130} y2={y + 36} stroke={C.pencil} strokeWidth={2.4} />
										</g>
									);
								})}
							</g>
						</g>
					);
				},
				{bb: [px, py, px + 170, py + 280], dur: q.at('第二天') - tJ},
			);
			const tA = q.at('两点');
			const [ax, ay] = P(1520, 470);
			// 闹钟（手画，不用 clockFace：它的指针挂在自己的组里，跟不上整组缩小）
			b.stroke((s) => R.circle(ax, ay, 46, {seed: s, roughness: 0.9}), tA, 400, {w: 3.4});
			b.stroke((s) => R.line([ax, ay], [ax + 22, ay - 12], {seed: s, roughness: 0.4}), tA + 420, 120, {w: 4.4});
			b.stroke((s) => R.line([ax, ay], [ax, ay - 34], {seed: s, roughness: 0.4}), tA + 560, 120, {w: 3});
			b.stroke((s) => R.linear([[ax - 34, ay - 40], [ax - 22, ay - 60], [ax - 8, ay - 46]], {seed: s, roughness: 0.6}), tA + 1100, 120, {w: 3});
			b.stroke((s) => R.linear([[ax + 34, ay - 40], [ax + 22, ay - 60], [ax + 8, ay - 46]], {seed: s, roughness: 0.6}), tA + 1220, 120, {w: 3});
			ctx.text('02:00', ax, ay + 106, 46, tA + 1300, {anchor: 'middle'});
			arcArrow(...arcs[1], q.at('第二天'), {w: 5});
			// 节点 3：会议桌，你嘴边一团乱线，对面领导的眉毛一道折线
			const tM = q.at('开会');
			b.stroke((s) => R.rect(P(880, 930)[0], P(880, 930)[1], 240, 36, {seed: s, roughness: 0.7}), tM, 300, {w: 3});
			person(b, ...P(800, 1010), 150, tM + 300, {pose: 'sit'});
			person(b, ...P(1200, 1010), 150, tM + 900, {pose: 'sit', flip: true});
			const tS = q.at('答非所问');
			const [mx, my] = P(824, 892);
			freehand(b, [[mx, my], [mx + 14, my - 10], [mx + 6, my + 12], [mx + 24, my - 6], [mx + 16, my + 14], [mx + 34, my]], tS, 500, {size: 5, color: C.ink});
			ctx.text('答非所问', ...P(1000, 900), 46, tS + 300, {anchor: 'middle', color: C.pencilDark});
			const tB = q.at('皱');
			const [bx, by] = P(1200, 872);
			freehand(b, [[bx - 22, by - 4], [bx - 8, by - 14], [bx + 4, by - 2], [bx + 20, by - 12]], tB, 300, {size: 6, color: C.ink});
			arcArrow(...arcs[2], q.at('你心里一句', {nth: 1}), {w: 5});
			const tK = q.at('看吧', {nth: 1});
			ctx.write('看吧', nodes[3][0] - 44, nodes[3][1] - 30, 64, tK, 700, {anchor: 'end'});
			arcArrow(...arcs[3], q.end('看吧', {nth: 1}), {w: 5});
			thicken(q.end('看吧', {nth: 1}) + 450, 11);
		}

		// ================= 「两次的证据都是真的，可都是那句话自己造出来的」：右边两栏 =================
		ctx.cam(null, q.at('两次') - 400, 1000);
		const cols: {x: number; label: string; c: (typeof CLAUSES)[number]}[] = [
			{x: 1880, label: '不在乎我', c: CLAUSES[3]},
			{x: 2200, label: '肯定没好事', c: CLAUSES[0]},
		];
		const tTwo = q.at('两次');
		const tTrue = q.at('真的');
		const tMade = q.at('造出来');
		cols.forEach((col, i) => {
			const [x] = P(col.x, 0);
			ctx.text(col.label, x, P(0, 250)[1], 46, tTwo + i * 300, {anchor: 'middle', color: col.c.deep});
			b.stroke((s) => R.circle(x, P(0, 300)[1], 14, {seed: s, roughness: 0.6}), tTwo + 500 + i * 300, 120, {w: 3});
			ctx.text('看吧', x, P(0, 720)[1], 60, tTwo + 900 + i * 300, {anchor: 'middle'});
			sheet(b, B(col.x - 90, 750, col.x + 90, 830), tTrue + i * 300, {tilt: i ? -5 : 5, color: C.pencilDark, w: 2.6, r: 6});
			ctx.text('真的', x, P(0, 808)[1], 46, tTrue + 300 + i * 300, {anchor: 'middle', color: C.pencilDark});
			arrow(b, [x, P(0, 320)[1]], [x, P(0, 640)[1]], tMade + i * 350, 600, {bend: 0.06, w: 3.6});
			ctx.text('造的', x + 26, P(0, 500)[1], 46, tMade + 500 + i * 350);
		});

		// ================= 「等证据来了再说，没用」：圈外小人，圈里箭头一直转 =================
		const tW = q.at('等证据');
		person(b, ...P(250, 1000), 170, tW, {pose: 'stand'});
		const sign = ctx.text('等证据', ...P(250, 790), 50, tW + 500, {anchor: 'middle'});
		b.node(
			tW,
			(ms) => {
				const a = ((-90 + (ms - tW) * 0.2) * Math.PI) / 180;
				const r = RR - 70;
				const p: Pt = [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
				const tx = -Math.sin(a);
				const ty = Math.cos(a);
				const hl = 22;
				return <path d={`M${p[0] - tx * hl - ty * hl * 0.55} ${p[1] - ty * hl + tx * hl * 0.55} L${p[0]} ${p[1]} L${p[0] - tx * hl + ty * hl * 0.55} ${p[1] - ty * hl - tx * hl * 0.55} Z`} fill={C.ink} opacity={0.85} />;
			},
			{bb: [CX - RR, CY - RR, CX + RR, CY + RR], dur: tNext - tW},
		);
		const tNo = q.at('没用');
		strike(b, sign.bb![0] - 8, sign.bb![2] + 8, P(0, 774)[1], tNo, 300, {color: C.pencilDark, size: 10});
		ctx.text('没用', ...P(345, 790), 50, tNo + 350, {color: C.pencilDark});
	});

	// ================= 「让你难受的，常常不是事，是你自动补上的那句话」：整组缩到左上角 =================
	const tL = q.at('让你难受');
	tr.fit(tL, 1100, B(80, 60, 2380, 1100), B(60, 60, 860, 460));
	const tE = q.at('不是事');
	ctx.write('事', ...P(1000, 400), 150, tE, 700, {anchor: 'middle'});
	strike(b, P(920, 480)[0], P(1080, 480)[0], P(0, 480)[1], q.end('不是事') + 100, 320, {size: 14});
	// 「是你自动补上的那句话」念得很靠近段尾：从「补上的」就开始写，念到「那句话」画波浪线
	const tS = q.at('补上的');
	ctx.write('那句话', ...P(1600, 400), 150, tS, 1000, {anchor: 'middle'});
	wavy(b, P(1370, 590)[0], P(1830, 590)[0], P(0, 590)[1], q.at('那句话', tL), 600, {w: 5, amp: 10, wave: 60});
};
