import React from 'react';
import type {Box, Item, Pt} from '../../whiteboard';
import {bubble, C, CLAUSES, clamp01, clockFace, counter, dots, easeOut, HandText, hhmm, letterCard, moveEase, person, R, rr, stopwatch, strike, thought, thumb, arrow} from '../../whiteboard';
import {chatIcon, hm} from '../props';
import type {SectionCtx} from '../ctx';

// s06 · 证据二：换人不换尾（2:32–3:28）  主岛 S06（S05 右边）
// D6：三个并排的聊天框（领导·办公软件 / 家族群 / 领导·周一）。每个框底部一条「就____◯」的句尾槽。
// 「你刚才那个字母」：三个空圈 + 顶部四张字母卡轮流闪；「句尾没换」：三个圈同时红→橙→蓝→紫，一直同色；
// 「换了谁都这样」：三个头像被灰笔划掉；「条款」：三个圈连到一张小协议图标。
// hanzi: 句尾没换

const FW = 700;
const FH = 680;
const FY = 200;
const FX = [130, 850, 1570];

export const build = (ctx: SectionCtx) => {
	const {b, q, t0, tNext, P, B} = ctx;
	const F = (k: number, x: number, y: number): Pt => P(FX[k] + x, FY + y);
	const FB = (k: number, x0: number, y0: number, x1: number, y1: number): Box => B(FX[k] + x0, FY + y0, FX[k] + x1, FY + y1);
	const frameView = (k: number): Box => B(FX[k] - 40, FY - 40, FX[k] + FW + 40, FY + FH + 40);

	// ---- 镜头：整岛 → 框 1 → 框 2 → 框 3 → 整岛 ----
	ctx.cam(null, t0 - 500, 1300, {whoosh: true});
	ctx.cam(frameView(0), q.at('晚上') - 400, 900);
	ctx.cam(frameView(1), q.at('家族群') - 600, 900);
	ctx.cam(frameView(2), q.at('周一') - 400, 900);
	// 集成修正：整岛视图顶边切掉了「证据 ●●○」和「句尾没换」一行的上沿，框往上多放 40。
	ctx.cam(ctx.B(0, -40, 2400, 1120), q.at('你刚才') - 400, 1000);

	// ---- 「第二个证据」：证据 ①②③，② 点亮 ----
	ctx.text('证据', ...P(100, 128), 52, t0, {color: C.pencilDark});
	const d = dots(b, P(280, 110)[0], P(280, 110)[1], 3, 80, 26, t0 + 250);
	d.light(0, t0 + 900);
	d.light(1, q.at('换个人'));

	// ---- 「换个人」：三个空聊天框（外框、顶栏分隔线、头像圈、句尾槽先不画） ----
	const tF = q.at('换');
	const avatars: Pt[] = [];
	for (let k = 0; k < 3; k++) {
		const t = tF + k * 320;
		const [x0, y0] = F(k, 0, 0);
		b.stroke((s) => R.path(rr(x0, y0, FW, FH, 26), {seed: s, roughness: 0.8, bowing: 0.6}), t, 520, {w: 4});
		b.stroke((s) => R.line(F(k, 12, 112), F(k, FW - 12, 112), {seed: s, roughness: 0.5}), t + 520, 160, {w: 2.4, color: C.pencilDark});
		const av = F(k, 60, 56);
		avatars.push(av);
		b.stroke((s) => R.circle(av[0], av[1], 34, {seed: s, roughness: 0.8}), t + 700, 200, {w: 3.2});
	}

	// ---- 「要是只有这个人」：纸角迷你 D1 + 「这个人？」 ----
	chatIcon(b, B(2060, 40, 2300, 190), q.at('只有这个人'), {time: '22:47'});
	const whoTxt = ctx.text('这个人？', ...P(2030, 140), 50, q.at('这个人的事'), {anchor: 'end', color: C.pencilDark});

	// 框里的小时钟（模拟 + 数字），可以拨
	const mkClock = (id: string, k: number, start: string, tt: number) => {
		const keys: {t: number; dur: number; to: number}[] = [];
		const st = hm(start);
		const timeAt = (ms: number) => {
			let v = st;
			for (const kk of keys) {
				if (kk.t > ms) break;
				v = v + (kk.to - v) * moveEase(clamp01((ms - kk.t) / kk.dur));
			}
			return v;
		};
		const [cx, cy] = F(k, FW - 62, 56);
		clockFace(b, id, cx, cy, 34, tt, timeAt, {w: 3, ticks: false});
		const [tx, ty] = F(k, FW - 112, 70);
		b.node(
			tt + 500,
			(ms) => (
				<HandText x={tx} y={ty} size={40} anchor="end">
					{hhmm(timeAt(ms))}
				</HandText>
			),
			{bb: [tx - 130, ty - 40, tx + 4, ty + 10], textSize: 40, textLen: 5},
		);
		return {
			to: (t: number, dur: number, to: string) => {
				keys.push({t, dur, to: hm(to)});
				b.node(t, () => null, {dur, nolint: true});
			},
		};
	};

	// 文件图标（方案）
	const docIcon = (cx: number, cy: number, s: number, t: number) => {
		const w = s * 0.72;
		const x0 = cx - w / 2;
		const y0 = cy - s / 2;
		const f = s * 0.24;
		b.stroke((sd) => R.path(`M${x0} ${y0} L${x0 + w - f} ${y0} L${x0 + w} ${y0 + f} L${x0 + w} ${y0 + s} L${x0} ${y0 + s} Z`, {seed: sd, roughness: 0.6}), t, 300, {w: 3});
		b.stroke((sd) => R.linear([[x0 + w - f, y0], [x0 + w - f, y0 + f], [x0 + w, y0 + f]], {seed: sd, roughness: 0.4}), t + 300, 100, {w: 2.4});
		b.stroke((sd) => R.line([x0 + w * 0.2, cy + s * 0.05], [x0 + w * 0.8, cy + s * 0.05], {seed: sd, roughness: 0.4}), t + 400, 80, {w: 2, color: C.pencilDark});
		b.stroke((sd) => R.line([x0 + w * 0.2, cy + s * 0.22], [x0 + w * 0.65, cy + s * 0.22], {seed: sd, roughness: 0.4}), t + 480, 80, {w: 2, color: C.pencilDark});
	};

	// ================= 框 1：领导 · 办公软件 =================
	ctx.text('领导', ...F(0, 108, 72), 40, q.at('领导'), {color: C.pencilDark});
	const c1 = mkClock('d6c1', 0, '22:40', q.at('晚上'));
	const tPlan = q.at('方案');
	bubble(b, ...F(0, 300, 150), 340, 110, tPlan, {side: 'r'});
	docIcon(...F(0, 360, 205), 70, tPlan + 350);
	ctx.text('方案', ...F(0, 420, 222), 44, tPlan + 650);
	ctx.text('已读', ...F(0, 640, 302), 36, q.at('已读'), {color: C.pencilDark, anchor: 'end'});
	// 「到十一点半，没回」：钟拨到 23:30，左边一个虚线空气泡（本该来的那条）
	c1.to(q.at('十一点半'), 1500, '23:30');
	bubble(b, ...F(0, 60, 350), 320, 90, q.at('没回'), {side: 'l', dashed: true, color: C.pencilDark});
	// 「又打开了两遍」：拇指点文件，文件弹开又合上 ×2，计数 ×1 ×2
	const tOpen = [q.at('打开'), q.at('两遍')];
	thumb(b, ...F(0, 300, 262), 76, tOpen[0] - 400);
	{
		const [ix, iy] = F(0, 360, 205);
		const big = FB(0, 200, 140, 660, 540);
		b.node(
			tOpen[0],
			(ms) => {
				let u = 0;
				for (const t of tOpen) {
					const dt = ms - t;
					if (dt < 0) continue;
					if (dt < 240) u = easeOut(dt / 240);
					else if (dt < 560) u = 1;
					else if (dt < 800) u = 1 - easeOut((dt - 560) / 240);
					else u = 0;
				}
				if (u <= 0.01) return null;
				const x0 = ix - 25 + (big[0] - ix + 25) * u;
				const y0 = iy - 35 + (big[1] - iy + 35) * u;
				const x1 = ix + 25 + (big[2] - ix - 25) * u;
				const y1 = iy + 35 + (big[3] - iy - 35) * u;
				return (
					<g>
						<rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={10} fill={C.card} stroke={C.ink} strokeWidth={3} />
						{[0.25, 0.42, 0.59, 0.76].map((p, i) => (
							<line key={i} x1={x0 + 30} y1={y0 + (y1 - y0) * p} x2={x1 - 30 - (i % 2) * 60} y2={y0 + (y1 - y0) * p} stroke={C.pencil} strokeWidth={2.5} opacity={u} />
						))}
					</g>
				);
			},
			{bb: big, dur: tOpen[1] - tOpen[0] + 800},
		);
		tOpen.forEach((t) => b.sound(t, 'pop', 0.25));
	}
	counter(b, ...F(0, 640, 520), 44, tOpen, {labels: ['×1', '×2'], anchor: 'end', color: C.pencilDark});

	// ================= 框 2：家族群 =================
	ctx.text('家族群', ...F(1, 108, 72), 40, q.at('家族群'), {color: C.pencilDark});
	const tRep = q.at('体检');
	bubble(b, ...F(1, 330, 150), 310, 150, tRep, {side: 'r'});
	{
		// 体检单：小卡片 + 几行灰线 + 一个小圈
		const [x0, y0] = F(1, 380, 168);
		b.stroke((s) => R.rect(x0, y0, 100, 116, {seed: s, roughness: 0.6}), tRep + 350, 260, {w: 2.8});
		[0.3, 0.48, 0.66, 0.84].forEach((p, i) => b.stroke((s) => R.line([x0 + 14, y0 + 116 * p], [x0 + 86 - (i % 2) * 24, y0 + 116 * p], {seed: s, roughness: 0.4}), tRep + 620 + i * 70, 60, {w: 2, color: C.pencilDark, pen: false}));
		b.stroke((s) => R.circle(x0 + 50, y0 + 20, 8, {seed: s, roughness: 0.5}), tRep + 900, 80, {w: 2, color: C.pencilDark});
		ctx.text('体检', ...F(1, 610, 240), 40, tRep + 1000, {anchor: 'end', color: C.pencilDark});
	}
	bubble(b, ...F(1, 60, 330), 150, 78, q.at('嗯') - 200, {side: 'l', text: '嗯', size: 44});
	// 「盯了半分钟」：小秒表走 30 秒
	{
		const tS = q.at('半分钟');
		const [cx, cy] = F(1, 560, 385);
		stopwatch(b, 'd6sw', cx, cy, 40, tS, (ms) => 180 * clamp01((ms - tS - 900) / 1600), {w: 3});
		b.node(tS + 900, () => null, {dur: 1600, nolint: true});
		ctx.text('0:30', cx, cy + 92, 40, tS + 1400, {anchor: 'middle', color: C.pencilDark});
	}
	// 「打电话过去」：听筒 + 通话气泡「你是不是不高兴？」
	{
		const tC = q.at('打电话');
		const [cx, cy] = F(1, 100, 505);
		const s = 60;
		// 听筒：弯把手 + 两头的听/话筒圆头
		b.stroke((sd) => R.path(`M${cx - s * 0.36} ${cy - s * 0.2} Q${cx} ${cy + s * 0.5} ${cx + s * 0.36} ${cy - s * 0.2}`, {seed: sd, roughness: 0.6}), tC, 300, {w: 6});
		b.stroke((sd) => R.ellipse(cx - s * 0.42, cy - s * 0.3, s * 0.3, s * 0.42, {seed: sd, roughness: 0.6}), tC + 300, 140, {w: 3.4});
		b.stroke((sd) => R.ellipse(cx + s * 0.42, cy - s * 0.3, s * 0.3, s * 0.42, {seed: sd, roughness: 0.6}), tC + 440, 140, {w: 3.4});
		bubble(b, ...F(1, 160, 462), 480, 86, q.at('你是不是') - 100, {side: 'l', text: '你是不是不高兴？', size: 40});
	}

	// ================= 框 3：领导 · 周一 =================
	ctx.text('领导', ...F(2, 108, 72), 40, q.at('周一'), {color: C.pencilDark});
	mkClock('d6c3', 2, '09:05', q.at('九点'));
	bubble(b, ...F(2, 60, 140), 400, 86, q.at('来我办公室'), {side: 'l', text: '来我办公室一下', size: 40});
	{
		// 走廊：工位 → 门，小人走过去 1800ms；头上依次冒三个思考泡
		const tW = q.at('三十秒');
		const [dx, dy] = F(2, 90, 440);
		b.stroke((s) => R.rect(dx, dy, 56, 30, {seed: s, roughness: 0.6}), tW, 200, {w: 2.6, color: C.pencilDark});
		b.stroke((s) => R.line(F(2, 160, 470), F(2, 600, 470), {seed: s, roughness: 0.6}), tW + 200, 400, {w: 2.6, dash: '10 12', color: C.pencilDark});
		const [ox, oy] = F(2, 612, 374);
		b.stroke((s) => R.rect(ox, oy, 44, 96, {seed: s, roughness: 0.6}), tW + 600, 240, {w: 3});
		b.stroke((s) => R.circle(ox + 34, oy + 50, 3.5, {seed: s, roughness: 0.3}), tW + 840, 60, {w: 2.6});
		ctx.text('30秒', ...F(2, 380, 536), 36, tW + 300, {anchor: 'middle', color: C.pencilDark});
		const walker = b.track('d6walk', F(2, 170, 470));
		b.inGroup('d6walk', () => person(b, ...F(2, 170, 470), 110, tW + 500, {pose: 'run'}));
		walker.to(tW + 1300, 2200, {x: F(2, 540, 470)[0]});
		const tE = q.at('三套');
		[0, 1, 2].forEach((i) => {
			const box = FB(2, 130 + i * 170, 236, 300 + i * 170, 334);
			thought(b, box, F(2, 250 + i * 150, 372), tE + i * 340, {w: 2.4});
			ctx.text(`解释${i + 1}`, (box[0] + box[2]) / 2, box[3] - 24, 46, tE + i * 340 + 560, {anchor: 'middle', color: C.pencilDark});
		});
	}

	// ================= 「你刚才那个字母」：三个句尾槽 + 空圈；字母卡轮流闪 =================
	const tTail = q.at('字母');
	const circles: Pt[] = [];
	for (let k = 0; k < 3; k++) {
		const t = tTail + k * 260;
		ctx.text('就', ...F(k, 60, 628), 48, t, {color: C.pencilDark});
		b.stroke((s) => R.line(F(k, 120, 612), F(k, FW - 150, 614), {seed: s, roughness: 0.9, bowing: 1}), t + 200, 260, {w: 3, color: C.pencilDark});
		const c = F(k, FW - 92, 598);
		circles.push(c);
		b.stroke((s) => R.circle(c[0], c[1], 42, {seed: s, roughness: 1.1}), t + 460, 320, {w: 3.6});
	}
	const tCards = q.at('放进');
	const cardItems: Item[] = [];
	const cardX = [1020, 1130, 1240, 1350];
	CLAUSES.forEach((c, i) => cardItems.push(...letterCard(b, P(cardX[i], 110)[0], P(cardX[i], 110)[1], 100, c.letter, c.color, tCards + i * 140)));
	const tFlash = q.at('还是它');
	const tSame = q.at('人换了');
	cardItems.push(
		b.node(
			tFlash,
			(ms) => {
				const k = Math.floor((ms - tFlash) / 380) % 4;
				const u = ((ms - tFlash) % 380) / 380;
				const a = Math.sin(Math.PI * u) ** 2 * 0.45;
				const [cx, cy] = P(cardX[k], 110);
				return <rect x={cx - 50} y={cy - 60} width={100} height={120} rx={12} fill={CLAUSES[k].color} opacity={a} />;
			},
			{bb: B(960, 40, 1420, 180), dur: tSame - tFlash},
		),
	);
	ctx.text('还是它？', ...P(1470, 128), 50, tFlash, {color: C.pencilDark});
	b.hover(P(1200, 700), q.end('还是它吧') + 100, tSame - 100);

	// ================= 「人换了，句尾没换」：字母卡收走，三个圈同时红→橙→蓝→紫，然后一直同色地慢慢换 =================
	b.eraseAll(cardItems, tSame, 350);
	b.sound(tSame, 'erase', 0.25);
	ctx.write('句尾没换', ...P(1200, 62), 84, q.at('句尾'), 1100, {anchor: 'middle'});
	const tRed = q.at('没换');
	const COLS = CLAUSES.map((c) => c.color);
	b.node(
		tRed,
		(ms) => {
			const dt = ms - tRed;
			let k: number;
			let since: number;
			if (dt < 4 * 550) {
				k = Math.floor(dt / 550);
				since = dt - k * 550;
			} else {
				const m = Math.floor((dt - 2200) / 1100);
				k = (m + 4) % 4;
				since = dt - 2200 - m * 1100;
			}
			const pop = 1 + 0.14 * (1 - easeOut(clamp01(since / 240)));
			return (
				<g>
					{circles.map(([cx, cy], i) => (
						<circle key={i} cx={cx} cy={cy} r={33 * pop} fill={COLS[k]} opacity={0.88} />
					))}
				</g>
			);
		},
		{bb: B(0, FY + 540, 2400, FY + 660), dur: tNext - tRed},
	);
	[0, 1, 2, 3].forEach((i) => b.sound(tRed + i * 550, 'tick', 0.3));

	// ================= 「换了谁都这样」：三个头像划掉；「这个人？」划掉 =================
	const tWho = q.at('换了谁');
	avatars.forEach(([ax, ay], i) => strike(b, ax - 44, ax + 44, ay, tWho + i * 220, 260, {color: C.pencilDark, size: 9}));
	const tNot = q.at('不只是');
	strike(b, whoTxt.bb![0] - 6, whoTxt.bb![2] + 6, P(0, 124)[1], tNot, 300, {color: C.pencilDark, size: 8});

	// ================= 「条款在跑」：三个圈连到一张小协议 =================
	const tK = q.at('那条');
	const [kx, ky] = P(1200, 985);
	{
		const w = 150;
		const h = 170;
		b.stroke((s) => R.path(rr(kx - w / 2, ky - h / 2, w, h, 10), {seed: s, roughness: 0.7}), tK, 360, {w: 3.4});
		[0.22, 0.36, 0.5, 0.64].forEach((p, i) => b.stroke((s) => R.line([kx - w * 0.36, ky - h / 2 + h * p], [kx + w * 0.36 - (i % 2) * 30, ky - h / 2 + h * p], {seed: s, roughness: 0.5}), tK + 380 + i * 60, 60, {w: 2, color: C.pencilDark, pen: false}));
		b.stroke((s) => R.rect(kx - w * 0.36, ky + h * 0.24, 22, 22, {seed: s, roughness: 0.5}), tK + 640, 100, {w: 2.4, color: C.pencilDark});
		b.stroke((s) => R.linear([[kx - w * 0.33, ky + h * 0.35], [kx - w * 0.27, ky + h * 0.41], [kx - w * 0.18, ky + h * 0.28]], {seed: s, roughness: 0.4}), tK + 740, 100, {w: 2.6, lag: 0});
		b.stroke((s) => R.line([kx - w * 0.16, ky + h * 0.36], [kx + w * 0.36, ky + h * 0.36], {seed: s, roughness: 0.5}), tK + 840, 60, {w: 2, color: C.pencilDark, pen: false});
	}
	circles.forEach(([cx, cy], i) => arrow(b, [cx, cy + 50], [kx + (i - 1) * 36, ky - 92], tK + 200 + i * 200, 420, {color: C.pencilDark, w: 3, bend: (1 - i) * 0.12}));
	ctx.text('条款在跑', kx + 110, ky + 18, 52, q.at('条款'));
};
