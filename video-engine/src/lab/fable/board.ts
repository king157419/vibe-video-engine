import type {Captions} from '../../lib/types';
import type {CamKey} from './camera';
import {cueAt, cueEnd, lineEnd, lineStart} from './cues';
import type {MarkerPath, Stroke} from './parts';
import {arrowGeos, bubbleD, flamePts, heartD, markerEllipse, markerLine, markerRect, roundRectD, scribbleGeo, textTrack, zhengStrokes} from './parts';
import type {Geo, Pt} from './rough';
import {R, variants} from './rough';
import {BOIL_N, LW} from './theme';
import type {Written} from './write';
import {writeText} from './write';

// 分镜：把稿子的每一句话翻成「什么时候、在纸的哪里、画什么」。全部是纯数据，逐帧只做插值。
// 世界坐标：故事区在 x 0–1900，三层图在 x 2300–3500。镜头在 camera.ts 里按 T 平移缩放。

export type Timed<T> = T & {t0: number; dur: number};
export type Drawn = Timed<{geo: Geo[]}>;
export type Text = Timed<{text: string; x: number; y: number; size: number; anchor: 'start' | 'middle' | 'end'}>;

const boil = (seed: number, make: (s: number) => Geo) => variants(BOIL_N, seed, make);

export const buildBoard = (c: Captions) => {
	const strokes: Stroke[] = [];
	const drawn = (geo: Geo[], t0: number, dur: number, lag?: number): Drawn => {
		strokes.push({t0, t1: t0 + dur, geo: geo[0], lag});
		return {geo, t0, dur};
	};
	const seq = (geos: Geo[][], t0: number, each: number, gap = 40): Drawn[] => geos.map((g, i) => drawn(g, t0 + i * (each + gap), each));
	const text = (text: string, x: number, y: number, size: number, t0: number, dur: number, anchor: 'start' | 'middle' | 'end' = 'start'): Text => {
		strokes.push({t0, t1: t0 + dur, geo: textTrack(x, y, size, text, anchor), lag: 0});
		return {text, x, y, size, t0, dur, anchor};
	};
	// 真实笔顺写字：每一笔都登记给笔尖
	const write = (text: string, x: number, yTop: number, size: number, t0: number, dur: number, anchor: 'start' | 'middle' | 'end' = 'start'): Written => {
		const w = writeText(text, x, yTop, size, t0, dur, anchor);
		for (const s of w.strokes) strokes.push({t0: s.t0, t1: s.t0 + s.dur, geo: s.geo, lag: 0});
		return w;
	};
	// 马克笔：一条有粗细的笔迹
	const mark = (m: MarkerPath, t0: number, dur: number): Timed<{m: MarkerPath}> => {
		strokes.push({t0, t1: t0 + dur, geo: m.geo, lag: 0});
		return {m, t0, dur};
	};

	// ---------- 时刻表 ----------
	const T = {
		hook: lineStart(c, 0),
		msg: cueAt(c, 1, '发'),
		clock: cueAt(c, 1, '消'),
		half: cueAt(c, 1, '半'),
		halfEnd: lineEnd(c, 1),
		pick: cueAt(c, 2, '拿'),
		look1: cueAt(c, 2, '看'),
		down: cueAt(c, 3, '放'),
		again: cueAt(c, 3, '又'),
		look2: cueAt(c, 3, '看'),
		ask: cueAt(c, 4, '补'),
		askText: cueAt(c, 4, '在'),
		askEnd: lineEnd(c, 4),
		noreply: cueAt(c, 5, '还'),
		noreplyEnd: lineEnd(c, 5),
		feed: cueAt(c, 6, '点'),
		feedEnd: lineEnd(c, 6),
		tenmin: cueAt(c, 7, '十'),
		like: cueAt(c, 7, '点'),
		likeEnd: cueEnd(c, 7, '赞'),
		fireLine: lineStart(c, 8),
		fire: cueAt(c, 8, '火'),
		fireEnd: lineEnd(c, 8),
		calm: lineStart(c, 9),
		calmWord: cueAt(c, 9, '别'),
		split: cueAt(c, 10, '拆'),
		three: cueAt(c, 10, '三'),
		splitEnd: lineEnd(c, 10),
		top: cueAt(c, 11, '最'),
		thing: cueAt(c, 11, '事情'),
		slow: cueAt(c, 11, '他'),
		slowWord: cueAt(c, 11, '慢'),
		mid: cueAt(c, 12, '中'),
		react: cueAt(c, 12, '你的反应'),
		reactEnd: lineEnd(c, 12),
		look: cueAt(c, 13, '反复'),
		askAgain: cueAt(c, 13, '追问'),
		proof: cueAt(c, 13, '找证据'),
		proofEnd: lineEnd(c, 13),
		bottom: cueAt(c, 14, '最'),
		real: lineStart(c, 15),
		work: cueAt(c, 15, '起作用'),
		confirm: cueAt(c, 16, '你想'),
		important: cueAt(c, 16, '我在'),
		importantEnd: lineEnd(c, 16),
		book: cueAt(c, 17, '书'),
		need: cueAt(c, 17, '需要'),
		needEnd: cueEnd(c, 17, '需要'),
		neglect: cueAt(c, 18, '没'),
		person: cueAt(c, 19, '换一个人'),
		job: cueAt(c, 19, '换一份工作'),
		jobEnd: lineEnd(c, 19),
		back: cueAt(c, 20, '它'),
		shape: cueAt(c, 20, '换'),
		pop: cueAt(c, 20, '冒'),
		popEnd: lineEnd(c, 20),
		advice: lineStart(c, 21),
		dontThink: cueAt(c, 21, '别想太多'),
		dontEnd: lineEnd(c, 21),
		oneThing: cueAt(c, 22, '就'),
		threeLayers: cueAt(c, 22, '把'),
		l1: cueAt(c, 23, '一层', 0),
		l2: cueAt(c, 23, '一层', 1),
		clear: cueAt(c, 23, '画'),
		end: lineEnd(c, 23),
	};

	// ---------- 故事区：手机 ----------
	const PH = {x: 330, y: 110, w: 400, h: 740, r: 46};
	const phone = {
		pivot: [PH.x + PH.w / 2, PH.y + PH.h] as Pt,
		body: drawn(
			boil(11, (s) => R.path(roundRectD(PH.x, PH.y, PH.w, PH.h, PH.r), {seed: s, roughness: 1.2, strokeWidth: LW.main})),
			T.hook,
			1200,
			0.12,
		),
		screen: drawn(
			boil(12, (s) => R.path(roundRectD(PH.x + 22, PH.y + 34, PH.w - 44, PH.h - 68, 30), {seed: s, roughness: 0.9, strokeWidth: LW.thin})),
			T.hook + 1050,
			700,
			0.12,
		),
		speaker: drawn([R.line([PH.x + 170, PH.y + 17], [PH.x + 230, PH.y + 17], {seed: 13, roughness: 0.8, strokeWidth: LW.thin})], T.hook + 1700, 120),
		// 发出去的消息（右侧气泡，内容用波浪线，不替观众编台词）
		sent: drawn(boil(14, (s) => R.path(bubbleD(432, 196, 270, 74, 'right'), {seed: s, roughness: 1.0, strokeWidth: LW.thin})), T.msg, 460, 0.1),
		sentLines: seq([[scribbleGeo(456, 222, 210, 15)], [scribbleGeo(456, 250, 140, 16)]], T.msg + 380, 260, 30),
		// 「在忙吗？」
		ask: drawn(boil(17, (s) => R.path(bubbleD(472, 300, 230, 72, 'right'), {seed: s, roughness: 1.0, strokeWidth: LW.thin})), T.ask, 420, 0.1),
		askText: text('在忙吗？', 587, 350, 36, T.askText, T.askEnd - T.askText, 'middle'),
		// 对方那边：一个空的虚线气泡
		reply: drawn([R.path(bubbleD(362, 402, 220, 72, 'left'), {seed: 19, roughness: 1.0, strokeWidth: LW.thin})], T.noreply, 520, 0.1),
	};

	// ---------- 时钟 ----------
	const CK = {cx: 1180, cy: 330, r: 140};
	const ticks: Geo[] = [];
	for (let k = 0; k < 12; k++) {
		const a = (k / 12) * Math.PI * 2;
		const long = k % 3 === 0;
		const r0 = CK.r - (long ? 22 : 12);
		ticks.push(R.line([CK.cx + Math.sin(a) * r0, CK.cy - Math.cos(a) * r0], [CK.cx + Math.sin(a) * (CK.r - 4), CK.cy - Math.cos(a) * (CK.r - 4)], {seed: 30 + k, roughness: 0.6, strokeWidth: long ? LW.thin : LW.hair, disableMultiStroke: true}));
	}
	const clock = {
		...CK,
		face: drawn(boil(21, (s) => R.circle(CK.cx, CK.cy, CK.r, {seed: s, roughness: 1.1, strokeWidth: LW.main})), T.clock, 560, 0.12),
		ticks: drawn([R.linear([[0, 0]], {seed: 1})], T.clock + 420, 400), // 占位：刻度用 ticksGeo 一次画出
		ticksGeo: ticks,
		// 分针：half 时扫半圈；noreply 时再走一段
		sweep1: {t0: T.half, dur: T.halfEnd - T.half},
		sweep2: {t0: T.noreply, dur: T.noreplyEnd - T.noreply},
		label: write('半小时', CK.cx, 508, 46, T.half + 100, 900, 'middle'),
	};
	strokes.push({t0: T.clock + 420, t1: T.clock + 820, geo: ticks[0]});

	// ---------- 「正」字计数：看了几次 ----------
	const ZG = {x: 800, y: 560, s: 120};
	const zheng = zhengStrokes(ZG.x, ZG.y, ZG.s, 40);
	const tally = {
		...ZG,
		strokes: [drawn([zheng[0]], T.look1, 240), drawn([zheng[1]], T.look2, 240)],
		label: text('看手机', ZG.x + ZG.s / 2, ZG.y + ZG.s + 46, 30, T.look1 + 260, 420, 'middle'),
	};

	// ---------- 朋友圈（画在屏幕里，镜头推近后才看得清） ----------
	const FD = {x: 370, y: 190};
	const post = (y: number, seed: number) => ({
		avatar: R.circle(FD.x + 26, y + 22, 20, {seed, roughness: 0.8, strokeWidth: LW.hair}),
		name: scribbleGeo(FD.x + 58, y + 16, 90, seed + 1, 2),
		l1: scribbleGeo(FD.x + 58, y + 48, 250, seed + 2, 2.5),
		l2: scribbleGeo(FD.x + 58, y + 68, 190, seed + 3, 2.5),
	});
	const p1 = post(FD.y + 60, 50);
	const p2 = post(FD.y + 255, 60);
	const p3 = post(FD.y + 450, 70);
	const feedDur = T.feedEnd - T.feed;
	const each = Math.max(90, (feedDur - 300) / 8);
	const feed = {
		title: text('朋友圈', 530, FD.y + 30, 26, T.feed + 80, 360, 'middle'),
		rule: drawn([R.line([FD.x + 10, FD.y + 44], [FD.x + 310, FD.y + 44], {seed: 49, roughness: 0.6, strokeWidth: LW.hair, disableMultiStroke: true})], T.feed + 300, 200),
		posts: [
			seq([[p1.avatar], [p1.name], [p1.l1], [p1.l2], [R.rect(FD.x + 58, FD.y + 148, 120, 80, {seed: 55, roughness: 0.8, strokeWidth: LW.hair})]], T.feed + 380, each, 20),
			seq([[p2.avatar], [p2.name], [p2.l1], [p2.l2]], T.feed + 380 + 5 * (each + 20), each, 20),
			seq([[p3.avatar], [p3.name], [p3.l1]], T.tenmin - 300, 90, 20),
		],
		time: text('10分钟前', FD.x + 58, FD.y + 348, 22, T.tenmin, 520, 'start'),
		heart: drawn(boil(58, (s) => R.path(heartD(FD.x + 300, FD.y + 340, 30), {seed: s, roughness: 0.9, strokeWidth: LW.thin})), T.like, 360, 0.1),
		heartFill: R.fillPath(heartD(FD.x + 300, FD.y + 340, 30), {seed: 59, hachureGap: 4, fillWeight: 1.5, hachureAngle: -40}),
		heartBox: [FD.x + 280, FD.y + 320, 40, 40] as [number, number, number, number],
		ring: drawn([R.ellipse(FD.x + 190, FD.y + 342, 320, 70, {seed: 61, roughness: 1.4, bowing: 1.2, strokeWidth: 3})], T.likeEnd - 120, 520, 0.1),
	};

	// ---------- 火 ----------
	// 火画在手机右边、时钟下面的空地上：从左到右 = 手机 → 看了几次 → 等了多久 → 火
	const outer = flamePts(1500, 900, 300, 540, 0.04);
	const inner = flamePts(1505, 900, 150, 320, -0.02);
	const innerD = 'M' + inner.map((p) => p.join(' ')).join(' L') + ' Z';
	const outerD = 'M' + outer.map((p) => p.join(' ')).join(' L') + ' Z';
	const fire = {
		outer: drawn(boil(70, (s) => R.curve(outer, {seed: s, roughness: 1.6, bowing: 1.4, strokeWidth: LW.main})), T.fire, 720, 0.12),
		inner: drawn(boil(72, (s) => R.curve(inner, {seed: s, roughness: 1.4, bowing: 1.2, strokeWidth: LW.thin})), T.fire + 260, 520, 0.12),
		fillIn: R.fillPath(innerD, {seed: 74, hachureGap: 9, fillWeight: 2.6, hachureAngle: -60}),
		fillOut: R.fillPath(outerD, {seed: 75, hachureGap: 16, fillWeight: 2, hachureAngle: -60}),
		box: [1330, 340, 340, 580] as [number, number, number, number],
		fillAt: T.fire + 520,
	};

	// ---------- 从故事到三层图的箭头：从火尖上方弧过去，落在三层图左上角外 ----------
	const bridgeCurve = R.curve(
		[
			[1600, 330],
			[1800, 205],
			[2100, 160],
			[2400, 205],
		],
		{seed: 80, roughness: 1.1, bowing: 1.2, strokeWidth: LW.main},
	);
	const bridgeHead = R.linear(
		[
			[2372, 176],
			[2404, 208],
			[2366, 222],
		],
		{seed: 81, roughness: 0.9, strokeWidth: LW.main},
	);
	const bridgeDrawn = [drawn([bridgeCurve], T.split, 620, 0.1), drawn([bridgeHead], T.split + 640, 160)];

	// ---------- 三层图 ----------
	const ST = {x: 2460, w: 880, h: 150, ys: [250, 420, 590], cx: 2900};
	const rectG = (i: number, seed: number, sw: number, rough = 1.2) => boil(seed, (s) => R.rect(ST.x, ST.ys[i], ST.w, ST.h, {seed: s, roughness: rough, strokeWidth: sw}));
	const layerAt = (i: number) => ({x: ST.x, y: ST.ys[i], w: ST.w, h: ST.h, cy: ST.ys[i] + ST.h / 2});
	const stack = {
		...ST,
		layers: [0, 1, 2].map((i) => layerAt(i)),
		outline: seq([rectG(0, 90, LW.thin), rectG(1, 92, LW.thin), rectG(2, 94, LW.thin)], T.three - 100, 420, 60),
		// 说到「最上面一层 / 中间一层 / 最底下一层」时再用粗线描一遍
		trace: [drawn(rectG(0, 100, LW.main, 1.4), T.top, 620, 0.12), drawn(rectG(1, 102, LW.main, 1.4), T.mid, 620, 0.12), drawn(rectG(2, 104, LW.marker - 1, 1.5), T.bottom, 640, 0.12)],
		// 三层的名字：真实笔顺一笔一笔写
		labels: [write('事情', 2420, layerAt(0).cy - 27, 54, T.thing, 900, 'end'), write('你的反应', 2420, layerAt(1).cy - 24, 48, T.react, 1500, 'end')],
		needWord: write('需要', 2372, layerAt(2).cy - 29, 58, T.need, 1000, 'middle'),
		needRing: mark(markerEllipse(2364, layerAt(2).cy + 4, 174, 100, 110, 4), T.needEnd + 120, 560),
		// 底层的琥珀色排线 + 「起作用」的向上箭头
		fill: R.fillRect(ST.x + 6, ST.ys[2] + 6, ST.w - 12, ST.h - 12, {seed: 112, hachureGap: 11, fillWeight: 2.4, hachureAngle: -8}),
		fillBox: [ST.x, ST.ys[2], ST.w, ST.h] as [number, number, number, number],
		fillAt: T.work,
		upArrow: (() => {
			const a = arrowGeos([3410, ST.ys[2] + 120], [3410, ST.ys[0] + 30], 114, 30, {strokeWidth: LW.marker - 1, roughness: 1.3});
			return [drawn([a.line], T.work + 250, 560, 0.1), drawn([a.head], T.work + 830, 180)];
		})(),
		// 顶层内容：小气泡 + 小时钟（呼应开头）
		topA: {
			bubble: drawn([R.path(bubbleD(2532, 292, 160, 62, 'right'), {seed: 120, roughness: 0.9, strokeWidth: LW.thin})], T.slow, 380, 0.1),
			lines: seq([[scribbleGeo(2552, 314, 120, 121, 2.5)], [scribbleGeo(2552, 336, 80, 122, 2.5)]], T.slow + 300, 180, 20),
			clock: drawn([R.circle(2800, 325, 44, {seed: 123, roughness: 0.9, strokeWidth: LW.thin})], T.slowWord, 380, 0.1),
			clockC: [2800, 325] as Pt,
		},
		// 中层内容：正 / 追问气泡 / 放大镜
		midA: {
			zheng: seq(
				zhengStrokes(2540, 455 - 40, 82, 130, LW.thin).map((g) => [g]),
				T.look,
				95,
				20,
			),
			bubble: drawn([R.path(bubbleD(2690, 462, 180, 64, 'right'), {seed: 136, roughness: 0.9, strokeWidth: LW.thin})], T.askAgain, 320, 0.1),
			bubbleText: text('在忙吗？', 2780, 505, 28, T.askAgain + 200, 420, 'middle'),
			glass: drawn([R.circle(2995, 488, 36, {seed: 138, roughness: 0.9, strokeWidth: LW.thin})], T.proof, 320, 0.1),
			handle: drawn([R.line([3022, 514], [3058, 552], {seed: 139, roughness: 0.8, strokeWidth: LW.main})], T.proof + 330, 160),
			glassHeart: drawn([R.path(heartD(2995, 490, 26), {seed: 140, roughness: 0.8, strokeWidth: LW.hair})], T.proof + 480, 260, 0.1),
		},
		// 底层内容
		important: text('我在他那儿是重要的', ST.cx, layerAt(2).cy + 20, 52, T.important, T.importantEnd - T.important, 'middle'),
		underline: mark(markerLine([ST.cx - 244, layerAt(2).cy + 42], [ST.cx + 248, layerAt(2).cy + 46], 150, 3), T.importantEnd - 250, 480),
		// 换一个人 / 换一份工作：顶层内容换掉
		person: {
			head: drawn([R.circle(2640, 306, 28, {seed: 160, roughness: 1.0, strokeWidth: LW.thin})], T.person + 200, 300, 0.1),
			body: drawn(
				[
					R.curve(
						[
							[2580, 380],
							[2606, 342],
							[2640, 336],
							[2674, 342],
							[2700, 380],
						],
						{seed: 162, roughness: 1.0, strokeWidth: LW.thin},
					),
				],
				T.person + 500,
				280,
				0.1,
			),
			lines: seq([[scribbleGeo(2730, 312, 170, 163, 2.5)], [scribbleGeo(2730, 340, 120, 164, 2.5)]], T.person + 760, 160, 20),
		},
		job: {
			box: drawn([R.rect(2586, 300, 108, 76, {seed: 170, roughness: 1.0, strokeWidth: LW.thin})], T.job + 200, 320, 0.1),
			handle: drawn([R.path('M2620 300 L2620 284 L2660 284 L2660 300', {seed: 171, roughness: 0.9, strokeWidth: LW.thin})], T.job + 520, 160, 0.1),
			latch: drawn([R.line([2586, 334], [2694, 334], {seed: 172, roughness: 0.8, strokeWidth: LW.hair, disableMultiStroke: true})], T.job + 680, 120),
			lines: seq([[scribbleGeo(2730, 312, 170, 173, 2.5)], [scribbleGeo(2730, 340, 120, 174, 2.5)]], T.job + 800, 160, 20),
		},
		// 中层换掉后的「新的反应」：先只是几道潦草的线（还不知道会是什么）
		midB: seq([[scribbleGeo(2540, 495, 150, 180, 3)], [scribbleGeo(2730, 495, 150, 181, 3)], [scribbleGeo(2920, 495, 150, 182, 3)]], T.person + 900, 180, 30),
		// 再冒出来一次：小火苗从右上角冒出来
		pop: (() => {
			const pts = flamePts(3410, 236, 110, 190, 0.05);
			const d = 'M' + pts.map((p) => p.join(' ')).join(' L') + ' Z';
			return {
				outline: drawn(boil(190, (s) => R.curve(pts, {seed: s, roughness: 1.5, bowing: 1.3, strokeWidth: LW.main})), T.pop, 460, 0.12),
				fill: R.fillPath(d, {seed: 192, hachureGap: 7, fillWeight: 2.2, hachureAngle: -60}),
				box: [3340, 40, 140, 200] as [number, number, number, number],
			};
		})(),
	};

	// ---------- 「别想太多」（被划掉） ----------
	const DT = {cx: 2900, cy: 118};
	const dont = {
		...DT,
		bubble: drawn([R.ellipse(DT.cx, DT.cy, 420, 118, {seed: 200, roughness: 1.3, bowing: 1.2, strokeWidth: LW.thin})], T.dontThink - 260, 460, 0.1),
		text: text('别想太多', DT.cx, DT.cy + 16, 42, T.dontThink, 640, 'middle'),
		strike: [mark(markerLine([DT.cx - 150, DT.cy - 40], [DT.cx + 150, DT.cy + 44], 202, 3), T.dontEnd + 60, 280), mark(markerLine([DT.cx - 150, DT.cy + 44], [DT.cx + 150, DT.cy - 40], 203, 3), T.dontEnd + 360, 280)],
		gone: T.threeLayers,
	};

	// ---------- 结尾：琥珀色马克笔再描三层 ----------
	const finale = [0, 1, 2].map((i) => mark(markerRect(ST.x, ST.ys[i], ST.w, ST.h, 210 + i * 3, 5), [T.l1, T.l2, T.clear][i], 520));

	// ---------- 镜头：故事区 → 推近朋友圈 → 拉开看火 → 平移到三层图，逐层推近 → 最后拉远看整张纸 ----------
	const cam: CamKey[] = [
		{t: 0, dur: 0, cx: 900, cy: 520, s: 1.02},
		{t: T.pick - 120, dur: 700, cx: 820, cy: 500, s: 1.1},
		{t: T.feed, dur: 950, cx: 530, cy: 470, s: 2.05},
		{t: T.fireLine - 200, dur: 900, cx: 980, cy: 520, s: 0.98},
		{t: T.calm, dur: 1600, cx: 1500, cy: 500, s: 0.8},
		{t: T.split - 100, dur: 2000, cx: 2880, cy: 470, s: 1.06},
		{t: T.top - 200, dur: 900, cx: 2860, cy: 385, s: 1.32},
		{t: T.mid - 200, dur: 900, cx: 2860, cy: 520, s: 1.32},
		{t: T.bottom - 200, dur: 900, cx: 2860, cy: 620, s: 1.32},
		{t: T.book - 200, dur: 1000, cx: 2860, cy: 560, s: 1.12},
		{t: T.neglect - 100, dur: 1100, cx: 2900, cy: 470, s: 1.04},
		{t: T.advice, dur: 900, cx: 2900, cy: 400, s: 1.0},
		{t: T.threeLayers, dur: 2600, cx: 1990, cy: 500, s: 0.58},
	];

	strokes.sort((a, b) => a.t0 - b.t0);
	return {T, phone, clock, tally, feed, fire, bridge: bridgeDrawn, stack, dont, finale, cam, strokes};
};

export type Board = ReturnType<typeof buildBoard>;
