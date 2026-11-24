import React from 'react';
import type {Item} from '../../whiteboard';
import {arrow, bubble, check, clamp01, easeInOut, easeOut, lock, phone, R, ring, rr, scribble, sheet, strike, tag} from '../../whiteboard';
import type {SectionCtx} from '../ctx';

// s13 · 真警报：有时候它说对了（8:58–9:45）  主岛 S13（CORE 右边）
// 整页掀过去 → 「来我办公室一下」聊天框 + 组织架构图一格被虚线框住「组要撤？」
// → D12 两栏：左「概率：外面的事」进度条指针来回晃（不标数字）；右「结局：条款加的」「所以我完了」+ 红色小标签（出事）
// → 两栏下时间线，右端「答案」一把锁 → 左半段：手机里职位卡片在滑 + 闹钟 02:00 → 擦掉，换成三行预案逐行打勾
// → 指针推到偏右、预案往前推、「别多想」写出又划掉 → 右栏收成一张小卡「只管一句话」→ 14 格小日历（睁眼的床 / 没动的饭碗）
// → 门「专业的人」+ 电话 12356；底部一行「心理援助热线 12356」停到本段结束。

export const build = (ctx: SectionCtx) => {
	const {b, q, C, P, B} = ctx;
	const t0 = ctx.t0;
	const grab = (list: Item[], fn: () => void) => list.push(...b.collect(fn));

	// 「但有时候，它说对了」：整页掀过去（page），换一张新纸
	ctx.cam(null, t0 - 450, 1100, {whoosh: true});
	b.sound(t0 + 50, 'page', 0.4);

	// ① 「那条『来我办公室一下』」：聊天框重现（涂黑名字、09:05）
	const intro: Item[] = [];
	grab(intro, () => {
		ctx.write('它说对了', ...P(1200, 40), 96, q.at('说对了') - 150, 900, {anchor: 'middle'});
		const tp = t0 + 500;
		b.stroke((s) => R.path(rr(...P(250, 220), 800, 680, 30), {seed: s, roughness: 0.8}), tp, 520, {w: 4.2});
		b.stroke((s) => R.line(P(262, 330), P(1038, 330), {seed: s, roughness: 0.4}), tp + 520, 200, {w: 2.4, color: C.pencilDark});
		b.stroke((s) => R.circle(...P(318, 276), 32, {seed: s, roughness: 0.7}), tp + 700, 200, {w: 3});
		scribble(b, B(370, 254, 560, 298), tp + 880, 420, {size: 14, rows: 4});
		ctx.text('09:05', ...P(1010, 294), 48, tp + 1100, {anchor: 'end', color: C.pencilDark, dur: 200});
		bubble(b, ...P(300, 400), 520, 104, q.at('来我办公室') - 250, {side: 'l', text: '来我办公室一下', size: 52});
		// 组织架构图：一个框被虚线框住
		const tOrg = q.at('可能真是') - 200;
		const box = (x: number, y: number, t: number) => {
			b.stroke((s) => R.rect(...P(x, y), 200, 90, {seed: s, roughness: 0.7}), t, 240, {w: 3.4});
			[0, 1, 2].forEach((k) => b.stroke((s) => R.circle(...P(x + 50 + k * 50, y + 45), 12, {seed: s, roughness: 0.4}), t + 200 + k * 60, 80, {w: 2.6, pen: false}));
		};
		box(1650, 300, tOrg);
		b.stroke((s) => R.linear([P(1750, 390), P(1750, 450), P(1450, 450), P(1450, 540)], {seed: s, roughness: 0.4}), tOrg + 400, 260, {w: 3});
		b.stroke((s) => R.line(P(1750, 450), P(1750, 540), {seed: s, roughness: 0.4}), tOrg + 620, 120, {w: 3});
		b.stroke((s) => R.linear([P(1750, 450), P(2050, 450), P(2050, 540)], {seed: s, roughness: 0.4}), tOrg + 700, 200, {w: 3});
		box(1350, 540, tOrg + 700);
		box(1650, 540, tOrg + 820);
		box(1950, 540, tOrg + 940);
		const tCut = q.at('撤');
		b.stroke((s) => R.path(rr(...P(1925, 515), 250, 140, 24), {seed: s, roughness: 1}), tCut - 200, 460, {w: 3.4, dash: '12 10', color: C.pencilDark});
		ctx.text('组要撤？', ...P(2050, 745), 56, tCut + 200, {anchor: 'middle'});
	});

	// ② 「分开看」：擦掉，纸分左右两栏
	const tSplit = q.at('分开看');
	b.eraseAll(intro, tSplit - 100, 420);
	b.sound(tSplit - 100, 'erase', 0.25);
	const divider = b.stroke((s) => R.line(P(1200, 110), P(1204, 640), {seed: s, roughness: 0.6}), tSplit + 200, 420, {w: 3.4, color: C.pencilDark});

	const left: Item[] = [];
	const right: Item[] = [];
	// 左栏：概率是外面的事，进度条指针来回晃，不标数字
	const tProb = q.at('概率');
	const tHigh = q.at('概率真高');
	const [bx0, by0] = P(220, 330);
	const [bx1, by1] = P(980, 390);
	grab(left, () => {
		ctx.text('概率：外面的事', ...P(600, 200), 60, tProb - 150);
		b.stroke((s) => R.path(rr(bx0, by0, bx1 - bx0, by1 - by0, 28), {seed: s, roughness: 0.7}), tProb + 500, 460, {w: 3.8});
		ctx.text('低', ...P(240, 450), 44, tProb + 900, {color: C.pencilDark, dur: 120});
		ctx.text('高', ...P(960, 450), 44, tProb + 1000, {anchor: 'end', color: C.pencilDark, dur: 120});
		const tn = tProb + 1000;
		b.node(
			tn,
			(ms) => {
				const u = easeOut(clamp01((ms - tn) / 300));
				const swing = (bx0 + bx1) / 2 + 190 * Math.sin((ms - tn) / 330);
				const push = easeInOut(clamp01((ms - tHigh) / 900));
				const x = swing + (bx1 - 90 - swing) * push;
				return (
					<g opacity={u}>
						<path d={`M${x - 18} ${by0 - 42} L${x + 18} ${by0 - 42} L${x} ${by0 - 10} Z`} fill={C.ink} />
						<line x1={x} y1={by0 - 12} x2={x} y2={by1 + 6} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
					</g>
				);
			},
			{bb: [bx0 - 30, by0 - 50, bx1 + 30, by1 + 10], dur: tHigh + 900 - tn},
		);
		ctx.text('可能是真的', ...P(600, 472), 50, q.at('可能是真的') - 100, {anchor: 'middle', color: C.pencilDark});
	});
	// 右栏：「所以我完了」是条款加上去的（红色小标签：出事）
	const tDone = q.at('所以我完了');
	grab(right, () => {
		ctx.text('结局：条款加的', ...P(1800, 200), 60, tDone - 450, {anchor: 'middle'});
		b.stroke((s) => R.path(rr(...P(1480, 300), 640, 130, 20), {seed: s, roughness: 0.8}), tDone - 100, 420, {w: 4});
		ctx.text('所以我完了', ...P(1800, 386), 60, tDone + 200, {anchor: 'middle'});
		const tAdd = q.at('加上去');
		ctx.text('+', ...P(1430, 392), 90, tAdd - 250, {anchor: 'middle', dur: 160, nolint: true});
		tag(b, B(2030, 250, 2190, 320), '出事', C.red, tAdd, {size: 44, textColor: C.redDeep});
		ctx.text('条款补的', ...P(1800, 520), 48, tAdd + 300, {anchor: 'middle', color: C.pencilDark});
	});

	// ③ 「答案出来之前那一晚」：两栏底下一条时间线，右端「答案」一把锁
	const tLine = q.at('答案出来');
	grab(left, () => {
		b.stroke((s) => R.line(P(150, 830), P(2250, 834), {seed: s, roughness: 0.7}), tLine - 150, 700, {w: 4});
		b.stroke((s) => R.line(P(180, 805), P(180, 857), {seed: s, roughness: 0.3}), tLine - 200, 120, {w: 4});
		ctx.text('今晚', ...P(180, 900), 46, tLine + 100, {anchor: 'middle'});
		lock(b, ...P(2160, 760), 110, tLine + 450);
		ctx.text('答案 ?', ...P(2160, 900), 46, tLine + 800, {anchor: 'middle'});
	});

	// ④ 「你是翻招聘软件翻到两点？」：手机里一排职位卡片在滑，闹钟 02:00
	const tJob = q.at('翻招聘');
	ctx.cam(B(60, 240, 1400, 1000), tJob - 450, 1000);
	const night: Item[] = [];
	grab(night, () => {
		const scr = phone(b, ...P(330, 520), 170, 290, tJob - 150, 700);
		const [sx0, sy0, sw, sh] = [scr.x, scr.y, scr.w, scr.h];
		const tc = tJob + 500;
		const clip = `s13jobs`;
		b.node(
			tc,
			(ms) => {
				const off = ((ms - tc) / 7) % 90;
				return (
					<g>
						<defs>
							<clipPath id={clip}>
								<rect x={sx0} y={sy0} width={sw} height={sh} />
							</clipPath>
						</defs>
						<g clipPath={`url(#${clip})`}>
							{[0, 1, 2, 3, 4].map((k) => {
								const y = sy0 + 10 + k * 90 - off;
								return (
									<g key={k}>
										<rect x={sx0 + 10} y={y} width={sw - 20} height={70} rx={10} fill="none" stroke={C.ink} strokeWidth={3} />
										<line x1={sx0 + 22} y1={y + 24} x2={sx0 + sw - 40} y2={y + 24} stroke={C.pencilDark} strokeWidth={4} strokeLinecap="round" />
										<line x1={sx0 + 22} y1={y + 48} x2={sx0 + sw - 70} y2={y + 48} stroke={C.pencil} strokeWidth={4} strokeLinecap="round" />
									</g>
								);
							})}
						</g>
					</g>
				);
			},
			{bb: [sx0, sy0, sx0 + sw, sy0 + sh], dur: 3000},
		);
		const [kx, ky] = P(660, 650);
		b.stroke((s) => R.circle(kx, ky, 58, {seed: s, roughness: 0.8}), q.at('两点') - 500, 300, {w: 4});
		b.stroke((s) => R.line([kx, ky], [kx + 26, ky - 15], {seed: s, roughness: 0.2}), q.at('两点') - 200, 100, {w: 5, lag: 0});
		b.stroke((s) => R.line([kx, ky], [kx, ky - 44], {seed: s, roughness: 0.2}), q.at('两点') - 100, 100, {w: 3.4, lag: 0});
		b.stroke((s) => R.linear([[kx - 50, ky - 44], [kx - 36, ky - 66], [kx - 16, ky - 56]], {seed: s, roughness: 0.4}), q.at('两点'), 120, {w: 3.4});
		b.stroke((s) => R.linear([[kx + 50, ky - 44], [kx + 36, ky - 66], [kx + 16, ky - 56]], {seed: s, roughness: 0.4}), q.at('两点') + 120, 120, {w: 3.4});
		ctx.text('02:00', ...P(740, 668), 56, q.at('两点') + 150);
	});

	// ⑤ 「还是写好了三行预案，比如问清补偿、改好简历？」：手机擦掉，换成三行便签，逐行打勾
	const tPlan = q.at('还是写好');
	b.eraseAll(night, tPlan, 380);
	b.sound(tPlan, 'erase', 0.25);
	const noteG = 's13note';
	const nb = B(320, 520, 900, 790);
	b.track(noteG, [(nb[0] + nb[2]) / 2, (nb[1] + nb[3]) / 2]).to(tHigh + 300, 500, {x: (nb[0] + nb[2]) / 2 + 30, y: (nb[1] + nb[3]) / 2 - 20, s: 1.1});
	b.inGroup(noteG, () =>
		grab(left, () => {
			sheet(b, nb, tPlan + 300, {w: 3, r: 12, tilt: -1.5});
			const lines: [string, number][] = [
				['1 问清补偿', q.at('问清补偿') - 150],
				['2 改好简历', q.at('改好简历') - 150],
				['3', q.end('改好简历') + 250],
			];
			lines.forEach(([s, t], k) => {
				const y = nb[1] + 72 + k * 78;
				ctx.text(s, nb[0] + 40, y, 48, t, {});
				if (k < 2) check(b, nb[2] - 60, y - 16, 48, t + 700, 220);
			});
			b.stroke((s) => R.line([nb[0] + 90, nb[1] + 226], [nb[0] + 330, nb[1] + 228], {seed: s, roughness: 0.5}), q.end('改好简历') + 400, 240, {w: 3, color: C.pencil});
		}),
	);
	// ⑥ 「概率真高，就去写预案，不用逼自己别多想」：指针推到偏右（上面 node 里）；便签往前推；「别多想」写出又划掉
	const tMust = q.at('别多想');
	grab(left, () => {
		ctx.text('别多想', ...P(1060, 700), 56, tMust - 250);
		strike(b, ...([P(1040, 0)[0], P(1240, 0)[0], P(0, 682)[1]] as [number, number, number]), q.end('别多想') + 50, 320, {size: 12});
	});

	// ⑦ 「还有，这招管的只是一句话」：右栏收成一张小卡片「只管一句话」，其余擦掉
	const tOnly = q.at('还有');
	ctx.cam(null, tOnly - 200, 1100);
	const rg = 's13right';
	const rbox = B(1420, 140, 2240, 560);
	const card = B(200, 200, 720, 380);
	b.track(rg, [(rbox[0] + rbox[2]) / 2, (rbox[1] + rbox[3]) / 2]);
	for (const it of right) it.g = it.g ?? rg;
	b.tracks[rg].fit(tOnly + 100, 700, rbox, card).fade(tOnly + 650, 250, 0);
	b.eraseAll([...left, divider], tOnly + 100, 450);
	b.sound(tOnly + 100, 'erase', 0.2);
	sheet(b, card, tOnly + 700, {w: 3.4, r: 14});
	ctx.text('只管一句话', (card[0] + card[2]) / 2, (card[1] + card[3]) / 2 + 22, 60, q.at('一句话') - 100, {anchor: 'middle'});

	// ⑧ 「如果你已经连着两周睡不着、吃不下」：14 格小日历，格子里交替画睁眼的床、没动的饭碗
	const tTwo = q.at('连着两周');
	const [gx, gy] = P(880, 200);
	const cw = 100;
	ctx.text('连着 2 周', gx + 350, gy - 26, 52, tTwo, {anchor: 'middle'});
	for (let k = 0; k < 14; k++) {
		const x = gx + (k % 7) * cw;
		const y = gy + Math.floor(k / 7) * cw;
		b.stroke((s) => R.rect(x, y, cw, cw, {seed: s, roughness: 0.6}), tTwo + 200 + k * 50, 100, {w: 2.6, pen: k === 0});
	}
	const tSleep = q.at('睡不着');
	const tEat = q.at('吃不下');
	for (let k = 0; k < 14; k++) {
		const x = gx + (k % 7) * cw + cw / 2;
		const y = gy + Math.floor(k / 7) * cw + cw / 2;
		if (k % 2 === 0) {
			const t = tSleep - 200 + (k / 2) * 70;
			// 床 + 一只睁着的眼
			b.stroke((s) => R.linear([[x - 36, y + 26], [x - 36, y + 4], [x + 36, y + 4], [x + 36, y + 26]], {seed: s, roughness: 0.4}), t, 120, {w: 2.6, pen: false});
			b.stroke((s) => R.ellipse(x, y - 20, 34, 20, {seed: s, roughness: 0.4}), t + 60, 100, {w: 2.4, pen: false});
			b.node(t + 150, () => <circle cx={x} cy={y - 20} r={5} fill={C.ink} />, {bb: [x - 6, y - 26, x + 6, y - 14]});
		} else {
			const t = tEat - 250 + ((k - 1) / 2) * 70;
			// 饭碗（满的，没动）+ 一双筷子
			b.stroke((s) => R.path(`M${x - 30} ${y} C${x - 30} ${y + 34} ${x + 30} ${y + 34} ${x + 30} ${y}`, {seed: s, roughness: 0.4}), t, 110, {w: 2.6, pen: false});
			b.stroke((s) => R.path(`M${x - 30} ${y} C${x - 20} ${y - 18} ${x + 20} ${y - 18} ${x + 30} ${y}`, {seed: s, roughness: 0.4}), t + 60, 100, {w: 2.2, color: C.pencilDark, pen: false});
			b.stroke((s) => R.line([x + 8, y - 34], [x + 34, y - 6], {seed: s, roughness: 0.2}), t + 120, 70, {w: 2.4, pen: false});
		}
	}

	// ⑨ 「这张卡就不够用了。去找专业的人，或者打心理援助热线」：箭头指向一扇门「专业的人」；电话；底部固定一行热线
	const tNot = q.at('不够用');
	arrow(b, P(1600, 300), P(1830, 400), tNot, 520, {bend: -0.2, w: 4});
	ctx.text('不够用', ...P(1715, 470), 46, tNot + 300, {anchor: 'middle', color: C.pencilDark});
	const tPro = q.at('专业');
	const [dx, dy] = P(1860, 190);
	b.stroke((s) => R.rect(dx, dy, 250, 430, {seed: s, roughness: 0.6}), tPro - 300, 420, {w: 4});
	b.stroke((s) => R.linear([[dx + 16, dy + 16], [dx + 150, dy + 40], [dx + 150, dy + 400], [dx + 16, dy + 414]], {seed: s, roughness: 0.5}), tPro + 100, 360, {w: 3.6});
	b.stroke((s) => R.circle(dx + 128, dy + 230, 9, {seed: s, roughness: 0.3}), tPro + 440, 80, {w: 3.4});
	ctx.text('专业的人', dx + 125, dy - 28, 56, tPro + 150, {anchor: 'middle'});
	const tTel = q.at('热线');
	const [px, py] = P(1900, 760);
	b.stroke(
		(s) => R.path(`M${px} ${py - 30} C${px - 20} ${py - 10} ${px - 10} ${py + 40} ${px + 30} ${py + 60} L${px + 44} ${py + 44} L${px + 26} ${py + 20} L${px + 14} ${py + 30} C${px + 4} ${py + 20} ${px} ${py} ${px + 6} ${py - 10} L${px + 18} ${py - 22} L${px + 4} ${py - 42} Z`, {seed: s, roughness: 0.5}),
		tTel - 300,
		420,
		{w: 3.6},
	);
	ctx.text('12356', px + 80, py + 36, 64, q.at('一二三五六') - 100, {dur: 500});
	ring(b, px + 165, py + 12, 260, 100, q.end('一二三五六') - 200, 420, {w: 3.6});
	ctx.text('心理援助热线 12356', ...P(1200, 1010), 56, tTel + 100, {anchor: 'middle', color: C.ink});

	// 「整页掀过去」：一张纸盖着本岛，镜头到位后从右往左掀走（最后加入 → 画在最上面）
	const [ix0, iy0, ix1, iy1] = ctx.island.box;
	const f0 = t0 + 150;
	const fd = 650;
	b.node(
		t0 - 450,
		(ms) => {
			const u = easeInOut(clamp01((ms - f0) / fd));
			if (u >= 1) return null;
			const pad = 700;
			const xr = ix1 + pad - (ix1 - ix0 + 2 * pad) * u;
			const curl = 160 * Math.sin(Math.PI * u);
			return (
				<g>
					<rect x={ix0 - pad} y={iy0 - pad} width={Math.max(0, xr - (ix0 - pad))} height={iy1 - iy0 + 2 * pad} fill={C.card} />
					<path d={`M${xr} ${iy0 - pad} L${xr - curl} ${iy0 - pad} L${xr - curl * 0.6} ${iy1 + pad} L${xr} ${iy1 + pad} Z`} fill="#E9E1D2" opacity={u > 0 ? 1 : 0} />
					<line x1={xr} y1={iy0 - pad} x2={xr} y2={iy1 + pad} stroke={C.pencil} strokeWidth={3} opacity={u > 0 ? 0.8 : 0} />
				</g>
			);
		},
		{bb: [ix0 - 700, iy0 - 700, ix1 + 700, iy1 + 700], dur: f0 + fd - (t0 - 450), out: f0 + fd, outDur: 1},
	);
};
