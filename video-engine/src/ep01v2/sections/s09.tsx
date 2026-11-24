import React from 'react';
import type {Box, Item, Pt} from '../../whiteboard';
import {badge, bubble, C, CLAUSES, clamp01, easeOut, hatchBox, person, qmark, R, ring, rr, sheet, tag} from '../../whiteboard';
import type {SectionCtx} from '../ctx';

// s09 · 自测：数一数字母（4:53–6:57）  主岛 S09（S08 下面）
// D10：右边四根空计数柱（A红 B橙 C蓝 D紫）；左边五张题卡叠成一摞；每题：题卡落到中央（镜头推进读题），
//   题卡上是这道题的小画（日历/时钟/便签、表格滑进来、群头像+30、九人合照半张脸、听筒+天气+叹气），
//   念到 A 时镜头拉开，四条选项依次弹出、念到哪条哪条亮；停 2 秒：计数柱第一格闪「你加一格」，笔悬在柱子上；
//   下一题落下时上一题连选项缩到左下角的「做完」堆。
// 结尾：题卡收起、柱子放大到中央、柱顶问号；一格被拎出来变回一张纸条（蓝），旁边小人不上色；日历翻页，纸条蓝变橙；底部小字。
// hanzi: 只数句子 被夸也会补

type Q = {n: number; stem: string; a: string[]; dEnd: string; texts: string[]};
const QS: Q[] = [
	{n: 1, stem: '第一题', a: ['A讲砸', 'B今晚', 'C我肯定', 'D反正'], dEnd: 'D反正没人听', texts: ['讲砸就完了', '今晚得再过三遍', '我肯定讲不清', '反正没人听']},
	{n: 2, stem: '第二题', a: ['A不接他', 'B不接就', 'C推掉', 'D就是看我'], dEnd: 'D就是看我好说话', texts: ['不接他会记仇', '不接就没人做', '推掉显得我不行', '就是看我好说话']},
	{n: 3, stem: '第三题', a: ['A下次', 'B以后', 'C他就是', 'D平时'], dEnd: 'D平时做那么多现在才看到', texts: ['下次就惨了', '以后都得这个标准', '他就是客气', '平时做那么多才看到']},
	{n: 4, stem: '第四题', a: ['A他们', 'B得赶紧', 'C我拍照', 'D没人在意'], dEnd: 'D没人在意我', texts: ['他们是不是另有个群', '得赶紧在群里说句话', '我拍照就是难看', '没人在意我']},
	{n: 5, stem: '第五题', a: ['A家里', 'B我得转', 'C是我哪里', 'D有事也'], dEnd: 'D有事也不跟我说', texts: ['家里是不是出事了', '我得转点钱', '是我哪里没做好', '有事也不跟我说']},
];

const CARD: [number, number, number, number] = [720, 160, 1640, 620];
const CARD_C: Pt = [1180, 390];
const BAR_X0 = 1760;
const BAR_STEP = 140;
const BAR_W = 110;
const BAR_Y0 = 200;
const BAR_Y1 = 720;
const CELL = (BAR_Y1 - BAR_Y0) / 5;

export const build = (ctx: SectionCtx) => {
	const {b, q, t0, P, B} = ctx;
	ctx.cam(null, t0 - 500, 1300, {whoosh: true});

	// 手画小钟（静态指针）：min = 当天分钟数
	const clock = (cx: number, cy: number, r: number, min: number, t: number, label: string) => {
		b.stroke((s) => R.circle(cx, cy, r, {seed: s, roughness: 0.9, bowing: 1}), t, 420, {w: 3.6});
		for (let k = 0; k < 12; k += 3) {
			const a = ((k * 30 - 90) * Math.PI) / 180;
			b.stroke((s) => R.line([cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78], [cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9], {seed: s, roughness: 0.3}), t + 420 + k * 20, 50, {w: 2.6, pen: false, boil: false});
		}
		const ha = ((((min / 60) % 12) * 30 - 90) * Math.PI) / 180;
		const ma = (((min % 60) * 6 - 90) * Math.PI) / 180;
		b.stroke((s) => R.line([cx, cy], [cx + Math.cos(ha) * r * 0.5, cy + Math.sin(ha) * r * 0.5], {seed: s, roughness: 0.4}), t + 520, 140, {w: 5});
		b.stroke((s) => R.line([cx, cy], [cx + Math.cos(ma) * r * 0.74, cy + Math.sin(ma) * r * 0.74], {seed: s, roughness: 0.4}), t + 660, 140, {w: 3.4});
		ctx.text(label, cx, cy + r + 58, 46, t + 800, {anchor: 'middle'});
	};

	// ================= 「来数一次」：右上四根空计数柱 =================
	const tBars = q.at('数');
	const barsTr = b.track('d10bars', P(2040, 520));
	const barX = (i: number) => BAR_X0 + i * BAR_STEP;
	b.inGroup('d10bars', () => {
		CLAUSES.forEach((c, i) => {
			const t = tBars + i * 200;
			const [x0, y0] = P(barX(i), BAR_Y0);
			b.stroke((s) => R.rect(x0, y0, BAR_W, BAR_Y1 - BAR_Y0, {seed: s, roughness: 0.9, bowing: 0.8}), t, 420, {w: 4});
			for (let k = 1; k < 5; k++) b.stroke((s) => R.line([x0 + 6, y0 + k * CELL], [x0 + BAR_W - 6, y0 + k * CELL], {seed: s, roughness: 0.4}), t + 420 + k * 60, 60, {w: 2, dash: '8 8', color: C.pencil, pen: false});
			badge(b, x0 + BAR_W / 2, P(0, 790)[1], 40, c.letter, tBars + 900 + i * 220, {color: c.color});
			ctx.text(c.name, x0 + BAR_W / 2, P(0, 884)[1], 46, tBars + 1100 + i * 220, {anchor: 'middle', color: c.deep});
		});
	});
	// 集成修正：计数柱放大到中央后柱顶问号会压在这行标题上（且镜头把它切在顶边），「数一数」时擦掉标题。
	const titleItems = b.collect(() => {
		ctx.write('只数句子', ...P(1180, 40), 72, q.at('只数句子'), 1500, {anchor: 'middle'});
	});

	// ================= 「五个场景」：左边五张题卡叠成一摞（1 在最上、最下面） =================
	const tDeck = q.at('五个场景');
	const deckBox = (n: number): Box => {
		const y0 = 190 + (5 - n) * 70;
		return B(120, y0, 620, y0 + 320);
	};
	const deckItems: Item[][] = [[], [], [], [], [], []];
	for (let n = 5; n >= 1; n--) {
		const box = deckBox(n);
		const t = tDeck + (5 - n) * 140;
		deckItems[n] = b.collect(() => {
			sheet(b, box, t, {w: 3, r: 12});
			ctx.text(String(n), box[0] + 40, box[1] + 62, 48, t + 300, {color: C.pencilDark});
		});
	}
	ctx.text('最近7天', ...P(370, 160), 48, q.at('七天'), {anchor: 'middle', color: C.pencilDark});

	// ================= 「顺序和刚才一样：A红 B橙 C蓝 D紫」：柱底字母逐个闪 =================
	['A红', 'B橙', 'C蓝', 'D紫'].forEach((w, i) => {
		const t = q.at(w);
		const [cx, cy] = P(barX(i) + BAR_W / 2, 790);
		b.node(t, (ms) => <circle cx={cx} cy={cy} r={54} fill={CLAUSES[i].color} opacity={0.45 * Math.sin(Math.PI * clamp01((ms - t) / 700)) ** 2} />, {bb: [cx - 60, cy - 60, cx + 60, cy + 60], dur: 700, g: 'd10bars'});
		b.sound(t, 'tick', 0.28);
	});

	// ================= 五道题 =================
	const cardView = B(680, 110, 1680, 660);
	const allCardItems: Item[] = [];
	QS.forEach((qq, qi) => {
		const g = `d10c${qq.n}`;
		const tFall = q.at(qq.stem);
		const tN = qi < 4 ? q.at(QS[qi + 1].stem) : q.at('数一数');
		const tr = b.track(g, P(...CARD_C));
		const db = deckBox(qq.n);
		tr.to(tFall - 1, 1, {x: (db[0] + db[2]) / 2, y: (db[1] + db[3]) / 2, s: 0.54}).to(tFall, 650, {});
		b.eraseAll(deckItems[qq.n], tFall, 200);
		b.sound(tFall, 'page', 0.35);
		ctx.cam(cardView, tFall - 200, 900);
		const items = b.collect(() =>
			b.inGroup(g, () => {
				sheet(b, B(...CARD), tFall, {w: 3.4, r: 14});
				ctx.text(String(qq.n), P(760, 222)[0], P(760, 222)[1], 48, tFall + 400, {color: C.pencilDark});
				illustrate(qq.n);
				// 四条选项：念到哪条弹哪条，念到哪条哪条亮
				const tA = qq.a.map((w) => q.at(w));
				tA.forEach((t, i) => {
					const c = CLAUSES[i];
					const row = B(740, 650 + i * 105, 1620, 742 + i * 105);
					tag(b, row, '', c.color, t, {hatch: true});
					badge(b, row[0] + 56, (row[1] + row[3]) / 2, 40, c.letter, t + 120, {color: c.color});
					ctx.text(qq.texts[i], row[0] + 112, (row[1] + row[3]) / 2 + 18, 50, t + 250, {color: c.deep});
					b.sound(t, 'pop', 0.22);
				});
				const tD = q.end(qq.dEnd);
				b.node(
					tA[0],
					(ms) => {
						let k = -1;
						for (let i = 0; i < 4; i++) if (tA[i] <= ms) k = i;
						if (k < 0 || ms > tD + 600) return null;
						const row = B(740, 650 + k * 105, 1620, 742 + k * 105);
						const u = clamp01((ms - tA[k]) / 260);
						return <rect x={row[0] + 4} y={row[1] + 4} width={row[2] - row[0] - 8} height={row[3] - row[1] - 8} rx={12} fill={CLAUSES[k].color} opacity={0.26 * u} />;
					},
					{bb: B(740, 650, 1620, 1060), dur: tD + 600 - tA[0]},
				);
				// 镜头：念到 A 时拉开
				ctx.cam(null, tA[0] - 300, 800);
			}),
		);
		allCardItems.push(...items);
		// 停 2 秒（不在题卡组里，留在计数柱上）：计数柱第一格闪，「你加一格」，笔悬在柱子上
		const tP = q.end(qq.dEnd) + 250;
		b.node(
			tP,
			(ms) => {
				if (ms > tN - 150) return null;
				const a = Math.sin(((ms - tP) / 700) * Math.PI) ** 2 * 0.5;
				return (
					<g>
						{CLAUSES.map((c, i) => {
							const [x0, y0] = P(barX(i) + 8, BAR_Y1 - CELL + 8);
							return <rect key={i} x={x0} y={y0} width={BAR_W - 16} height={CELL - 16} fill={c.color} opacity={a} />;
						})}
					</g>
				);
			},
			{bb: B(BAR_X0, BAR_Y1 - CELL, BAR_X0 + 4 * BAR_STEP, BAR_Y1), dur: tN - tP - 150, g: 'd10bars'},
		);
		ctx.text('你加一格', ...P(2040, 150), 46, tP, {anchor: 'middle', color: C.pencilDark, out: tN - 150, outDur: 200});
		b.hover(P(2040, 420), tP + 300, tN - 200);
		// 下一题落下时，这一题连选项缩到左下角的「做完」堆
		if (qi < 4) {
			const k = qi;
			tr.to(tN, 700, {x: P(320 + k * 14, 869 - k * 8)[0], y: P(0, 869 - k * 8)[1], s: 0.36});
			b.sound(tN + 200, 'page', 0.2);
		}
	});

	function illustrate(n: number) {
		if (n === 1) {
			// 日历「周日」 + 时钟 22:10 + 便签「明早例会 · 讲 5 分钟」
			const tCal = q.at('周日');
			const [x0, y0] = P(790, 250);
			b.stroke((s) => R.rect(x0, y0, 160, 170, {seed: s, roughness: 0.7}), tCal, 320, {w: 3.4});
			b.stroke((s) => R.line([x0, y0 + 40], [x0 + 160, y0 + 40], {seed: s, roughness: 0.4}), tCal + 320, 100, {w: 2.6});
			[40, 120].forEach((dx, i) => b.stroke((s) => R.line([x0 + dx, y0 - 16], [x0 + dx, y0 + 16], {seed: s, roughness: 0.4}), tCal + 420 + i * 60, 60, {w: 3.4}));
			ctx.text('周日', x0 + 80, y0 + 128, 48, tCal + 560, {anchor: 'middle'});
			clock(...P(1150, 350), 80, 22 * 60 + 10, q.at('十点'), '22:10');
			const tNote = q.at('例会');
			sheet(b, B(1300, 250, 1600, 440), tNote, {tilt: -4, color: C.pencilDark, w: 2.6, r: 6});
			ctx.text('明早例会', ...P(1450, 330), 44, tNote + 300, {anchor: 'middle'});
			ctx.text('讲5分钟', ...P(1450, 400), 44, q.at('五分钟'), {anchor: 'middle'});
		} else if (n === 2) {
			clock(...P(850, 350), 75, 17 * 60 + 52, q.at('五点'), '17:52');
			// 做了一半的表格从左边滑进来
			// （用 node 画：组不能嵌套，表格要跟着题卡一起走）
			const tT = q.at('表格');
			{
				const [x0, y0] = P(1010, 240);
				const filled: [number, number][] = [];
				for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) if (r < 2 || c < 1) filled.push([r, c]);
				b.node(
					tT,
					(ms) => {
						const u = easeOut(clamp01((ms - tT) / 700));
						const nf = Math.floor(clamp01((ms - tT - 500) / 1400) * (filled.length + 1));
						return (
							<g transform={`translate(${-520 * (1 - u)} 0)`} fill="none" strokeLinecap="round">
								<rect x={x0} y={y0} width={300} height={200} stroke={C.ink} strokeWidth={3} />
								{[1, 2, 3].map((k) => (
									<line key={`h${k}`} x1={x0} y1={y0 + k * 50} x2={x0 + 300} y2={y0 + k * 50} stroke={C.pencilDark} strokeWidth={2} />
								))}
								{[1, 2].map((k) => (
									<line key={`v${k}`} x1={x0 + k * 100} y1={y0} x2={x0 + k * 100} y2={y0 + 200} stroke={C.pencilDark} strokeWidth={2} />
								))}
								{filled.slice(0, nf).map(([r, c]) => (
									<line key={`f${r}${c}`} x1={x0 + c * 100 + 16} y1={y0 + r * 50 + 25} x2={x0 + c * 100 + 84 - (r % 2) * 20} y2={y0 + r * 50 + 25} stroke={C.ink} strokeWidth={3} />
								))}
							</g>
						);
					},
					{bb: [x0 - 520, y0, x0 + 300, y0 + 200], dur: 1900},
				);
				b.sound(tT, 'whoosh', 0.12);
			}
			bubble(b, ...P(1340, 262), 270, 86, q.at('帮我'), {side: 'l', text: '帮我收个尾？', size: 42});
		} else if (n === 3) {
			// 【钩】被夸也会补？
			ctx.write('被夸也会补？', ...P(1180, 210), 64, q.at('夸'), 1400, {anchor: 'middle'});
			const tG = q.at('三十个人');
			for (let i = 0; i < 6; i++) {
				const [cx, cy] = P(820 + i * 62, 380);
				b.stroke((s) => R.circle(cx, cy, 24, {seed: s, roughness: 0.8}), tG + i * 90, 160, {w: 3});
			}
			badge(b, P(1220, 380)[0], P(1220, 380)[1], 38, '30', tG + 600, {w: 3});
			bubble(b, ...P(1290, 330), 320, 90, q.at('这次做得不错'), {side: 'l', text: '这次做得不错', size: 42});
			qmark(b, ...P(1600, 480), 64, q.end('不错') + 250, 420, {w: 5});
		} else if (n === 4) {
			// 九个人的合照，最右边一个只画半张脸，被画框切掉
			const tF = q.at('合照');
			const fr = B(880, 230, 1460, 560);
			b.stroke((s) => R.rect(fr[0], fr[1], fr[2] - fr[0], fr[3] - fr[1], {seed: s, roughness: 0.7}), tF, 500, {w: 4});
			const tP9 = q.at('九个人');
			for (let i = 0; i < 9; i++) {
				const [cx, cy] = P(900 + i * 70, 380);
				const t = tP9 + i * 130;
				if (i < 8) {
					b.stroke((s) => R.circle(cx, cy, 24, {seed: s, roughness: 0.8}), t, 150, {w: 3});
					b.stroke((s) => R.curve([[cx - 34, cy + 80], [cx - 30, cy + 44], [cx, cy + 30], [cx + 30, cy + 44], [cx + 34, cy + 80]], {seed: s, roughness: 0.7}), t + 150, 120, {w: 3});
				} else {
					// 半张脸：只画左半个圆和左半边肩
					const pts: Pt[] = [];
					for (let k = 0; k <= 10; k++) {
						const a = ((90 + 18 * k) * Math.PI) / 180;
						pts.push([cx + Math.cos(a) * 24, cy + Math.sin(a) * 24]);
					}
					b.stroke((s) => R.curve(pts, {seed: s, roughness: 0.8}), t, 150, {w: 3});
					b.stroke((s) => R.curve([[cx - 34, cy + 80], [cx - 30, cy + 44], [cx, cy + 30]], {seed: s, roughness: 0.7}), t + 150, 120, {w: 3});
				}
			}
			const tH = q.at('半张');
			ring(b, P(1452, 400)[0], P(1452, 400)[1], 110, 150, tH, 420, {color: C.pencilDark, w: 3});
			ctx.text('9人·半张脸', ...P(1170, 528), 44, q.at('半张脸') + 300, {anchor: 'middle', color: C.pencilDark});
		} else {
			// 听筒 + 云和太阳 + 计时 2:00 + 叹气 + 「没事。」
			const tC = q.at('打电话');
			{
				const [cx, cy] = P(830, 340);
				const s = 90;
				b.stroke((sd) => R.path(`M${cx - s * 0.36} ${cy - s * 0.2} Q${cx} ${cy + s * 0.5} ${cx + s * 0.36} ${cy - s * 0.2}`, {seed: sd, roughness: 0.6}), tC, 300, {w: 7});
				b.stroke((sd) => R.ellipse(cx - s * 0.42, cy - s * 0.3, s * 0.3, s * 0.42, {seed: sd, roughness: 0.6}), tC + 300, 140, {w: 3.6});
				b.stroke((sd) => R.ellipse(cx + s * 0.42, cy - s * 0.3, s * 0.3, s * 0.42, {seed: sd, roughness: 0.6}), tC + 440, 140, {w: 3.6});
			}
			const tW = q.at('天气');
			{
				const [sx, sy] = P(1010, 300);
				b.stroke((s) => R.circle(sx, sy, 28, {seed: s, roughness: 0.7}), tW, 240, {w: 3});
				for (let k = 0; k < 8; k++) {
					const a = (k * 45 * Math.PI) / 180;
					b.stroke((s) => R.line([sx + Math.cos(a) * 38, sy + Math.sin(a) * 38], [sx + Math.cos(a) * 52, sy + Math.sin(a) * 52], {seed: s, roughness: 0.4}), tW + 240 + k * 40, 50, {w: 2.6, pen: false});
				}
				const [cx, cy] = P(1090, 370);
				b.stroke((s) => R.path(`M${cx - 60} ${cy + 20} Q${cx - 70} ${cy - 10} ${cx - 40} ${cy - 12} Q${cx - 30} ${cy - 45} ${cx + 5} ${cy - 30} Q${cx + 35} ${cy - 45} ${cx + 45} ${cy - 12} Q${cx + 75} ${cy - 8} ${cx + 60} ${cy + 20} Z`, {seed: s, roughness: 0.7}), tW + 600, 420, {w: 3});
			}
			const tM = q.at('两分钟');
			{
				const [cx, cy] = P(1260, 330);
				b.stroke((s) => R.circle(cx, cy, 50, {seed: s, roughness: 0.8}), tM, 300, {w: 3.4});
				b.stroke((s) => R.rect(cx - 8, cy - 66, 16, 12, {seed: s, roughness: 0.4}), tM + 300, 100, {w: 3});
				b.node(
					tM + 400,
					(ms) => {
						const u = clamp01((ms - tM - 400) / 1600);
						const a = u * 4 * Math.PI - Math.PI / 2;
						const large = (u * 720) % 360 > 180 ? 1 : 0;
						const r = 38;
						return (
							<g>
								{u > 0.01 ? <path d={`M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 ${large} 1 ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r} Z`} fill={C.ink} opacity={0.12} /> : null}
								<line x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke={C.ink} strokeWidth={3.6} strokeLinecap="round" />
							</g>
						);
					},
					{bb: [cx - 52, cy - 52, cx + 52, cy + 52], dur: 1600},
				);
				ctx.text('2:00', cx, cy + 108, 46, tM + 1500, {anchor: 'middle'});
			}
			const tS = q.at('叹口气');
			{
				const [x, y] = P(1440, 300);
				[0, 1, 2].forEach((i) => b.stroke((s) => R.curve([[x + i * 22, y + 40], [x + i * 22 + 10, y + 20], [x + i * 22 - 6, y], [x + i * 22 + 8, y - 22 - i * 8]], {seed: s, roughness: 0.6}), tS + i * 140, 220, {w: 2.4, color: C.pencilDark}));
			}
			bubble(b, ...P(1380, 385), 230, 88, q.at('没事'), {side: 'l', text: '没事。', size: 46});
		}
	}

	// ================= 「数一数，哪个字母最多」：题卡收起，计数柱放大到中央，柱顶问号 =================
	const tCount = q.at('数一数');
	b.eraseAll(allCardItems, tCount, 500);
	b.eraseAll(titleItems, tCount, 500);
	b.sound(tCount, 'erase', 0.3);
	ctx.cam(B(540, 80, 1780, 1080), tCount - 200, 1000);
	const FROM = B(1740, 120, 2340, 920);
	const TO = B(600, 120, 1720, 1030);
	barsTr.fit(tCount + 300, 1000, FROM, TO);
	const fs = Math.min((TO[2] - TO[0]) / (FROM[2] - FROM[0]), (TO[3] - TO[1]) / (FROM[3] - FROM[1]));
	const mapPt = (p: Pt): Pt => [(TO[0] + TO[2]) / 2 + fs * (p[0] - (FROM[0] + FROM[2]) / 2), (TO[1] + TO[3]) / 2 + fs * (p[1] - (FROM[1] + FROM[3]) / 2)];
	const tMost = q.at('最多');
	b.inGroup('d10bars', () => {
		CLAUSES.forEach((_, i) => qmark(b, P(barX(i) + BAR_W / 2, 150)[0], P(0, 150)[1], 70, tMost + i * 160, 420, {w: 5}));
	});

	// ================= 「颜色是给一句话的，不是给一个人的」 =================
	ctx.cam(null, q.at('但是注意') - 300, 900);
	const tSlip = q.at('一句话');
	const cell = mapPt(P(barX(2) + BAR_W / 2, BAR_Y1 - CELL / 2));
	const slipTr = b.track('d10slip', P(360, 440));
	slipTr.to(tSlip - 1, 1, {x: cell[0], y: cell[1], s: (BAR_W * fs) / 520}).to(tSlip, 900, {});
	b.sound(tSlip, 'pop', 0.3);
	const tSwap = q.at('就换了');
	b.inGroup('d10slip', () => {
		const box = B(100, 380, 620, 500);
		sheet(b, box, tSlip, {w: 3, r: 10});
		hatchBox(b, [box[0] + 6, box[1] + 6, box[2] - 6, box[3] - 6], C.blue, tSlip + 300, 500, {gap: 18, opacity: 0.22, pen: false, out: tSwap});
		ctx.text('我肯定讲不清', ...P(360, 458), 50, tSlip + 500, {anchor: 'middle', color: C.blueDeep, out: tSwap, outDur: 300});
		// 「明天可能就换了」：蓝变橙，句子也换成另一句
		hatchBox(b, [box[0] + 6, box[1] + 6, box[2] - 6, box[3] - 6], C.orange, tSwap, 500, {gap: 18, opacity: 0.22, pen: false});
		ctx.text('今晚得再过三遍', ...P(360, 458), 50, tSwap + 300, {anchor: 'middle', color: C.orangeDeep});
	});
	const tPer = q.at('一个人');
	person(b, ...P(360, 800), 200, tPer, {pose: 'stand'});
	ctx.text('给句子，不给人', ...P(360, 890), 48, tPer + 900, {anchor: 'middle'});
	// 日历翻页
	const tFlip = q.at('明天');
	{
		const [x0, y0] = P(110, 200);
		const tCal = tFlip - 1500;
		b.stroke((s) => R.rect(x0, y0, 140, 140, {seed: s, roughness: 0.7}), tCal, 320, {w: 3});
		b.stroke((s) => R.line([x0, y0 + 36], [x0 + 140, y0 + 36], {seed: s, roughness: 0.4}), tCal + 320, 100, {w: 2.6});
		[36, 104].forEach((dx, i) => b.stroke((s) => R.line([x0 + dx, y0 - 14], [x0 + dx, y0 + 14], {seed: s, roughness: 0.4}), tCal + 420 + i * 60, 60, {w: 3}));
		ctx.text('今', x0 + 70, y0 + 112, 60, tCal + 600, {anchor: 'middle', out: tFlip + 380, outDur: 60});
		b.node(
			tFlip,
			(ms) => {
				const u = easeOut(clamp01((ms - tFlip) / 420));
				if (u >= 1) return null;
				return <rect x={x0 + 3} y={y0 + 38} width={134} height={100 * (1 - u)} fill={C.card} stroke={C.ink} strokeWidth={2} />;
			},
			{bb: [x0, y0, x0 + 140, y0 + 140], dur: 420},
		);
		b.sound(tFlip, 'page', 0.35);
		ctx.text('明', x0 + 70, y0 + 112, 60, tFlip + 420, {anchor: 'middle', dur: 200});
	}
	// 「这不是诊断，只是一个习惯」：底部一行小字
	ctx.text('不是诊断，是习惯', ...P(1160, 1086), 48, q.at('诊断'), {anchor: 'middle', color: C.pencilDark});
};
