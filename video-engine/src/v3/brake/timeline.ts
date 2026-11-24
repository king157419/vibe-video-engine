import type {Anchors, Numbers} from './data';

// 画面动作全部锚在旁白的字上（分镜表 §1 §2 的“锚定的字/词”）。
// at(词, 之后的秒数)：第二个参数只是“从哪儿往后找”，不是动作时间。
export const SLOW = 0.6; // 俯视后物理时间按 0.6 倍慢放
export const GAP_WHITE_TO_YELLOW = 0.13; // “刚好停住”开始后 0.13 s 黄车开播（make_audio.py 用同一个数算配乐静音点）

export const buildT = (A: Anchors, N: Numbers) => {
	const tr = N.assumptions.t_react;
	const see = A.at('有人', 5);
	const brake = see + tr;
	const wStart = A.at('50码这辆', 9) - 0.07;
	const stopTxt = A.at('刚好停住', 12);
	const yStart = stopTxt + GAP_WHITE_TO_YELLOW;
	const freeze = yStart + N.main['60'].t_brake / SLOW;
	const T = {
		// ── 开头 ──
		g50: A.at('50码', 0),
		g60: A.at('60码', 1),
		same: A.at('一样的车', 2),
		d35: A.at('35米', 4),
		see,
		brake,
		liftA: brake + 0.28,
		liftB: brake + 1.48,
		wStart,
		stopTxt,
		yStart,
		freeze,
		ask: A.at('60码这辆', 13.5),
		pick: A.at('先选一个', 17),
		pickEnd: A.end('先选一个', 17),
		reveal: A.at('42码', 21),
		revealEnd: A.end('42码', 21),
		// ── ① 猜 ──
		s1: A.at('研究里', 23),
		quarter: A.at('四分之一', 24),
		subtract: A.at('直接相减', 25),
		f6050: A.at('60减50', 27),
		left10: A.at('剩10码', 28),
		same35: A.at('同样35米', 31),
		equal1: A.at('一样多', 34),
		alsoIs: A.at('也就是', 35.5),
		perMeter: A.at('每走一米', 36),
		equal2: A.at('一样多', 38),
		s1End: A.lineEnd('每走一米', 36),
		// ── ② 卡住 ──
		s2: A.at('拿50码', 40),
		onlyBrake: A.at('只看刹车', 42),
		half: A.at('走到一半', 43.5),
		should25: A.at('该剩25码', 45),
		still35: A.at('还有35码', 47),
		s2End: A.lineEnd('还有35码', 47),
		// ── ③a 只改一处 ──
		s3: A.at('只改一个地方', 49.5),
		bySec: A.at('按秒掉', 52),
		s3aEnd: A.lineEnd('按秒掉', 52),
		p02: A.at('零点二秒', 56),
		minus5: A.at('都少5码', 57),
		t06: A.at('零点六秒', 59.5),
		t14: A.at('一点四秒', 62),
		moreTime: A.at('时间多', 63),
		// ── ③b 合理内核 ──
		s3b: A.at('按米想', 65.5),
		uniform: A.at('匀速时', 67.5),
		mAndS: A.at('米和秒', 69),
		oneBrake: A.at('一刹车', 71),
		lastM: A.at('最后几米', 72.5),
		eachM: A.at('每一米', 73), // 第二轮审片 P1-2：第一米的框锚在这里
		costly: A.at('更费时间', 74.5),
		s3bEnd: A.lineEnd('更费时间', 74.5),
		// ── ③c 60 码的账 ──
		s3c: A.at('再看60码', 76.5),
		r15: A.at('一点五秒', 78.5),
		d42: A.at('四点二米', 80),
		only10: A.at('只剩10米', 82.5),
		these10: A.at('这10米', 84),
		t07: A.at('零点七秒', 85),
		three: A.at('三个点', 87.5),
		hit42: A.at('还有42码', 89.5),
		hitEnd: A.lineEnd('还有42码', 89.5),
		// ── ③d 规则 ──
		s3d: A.at('把每个点', 92.5),
		raise: A.at('竖起来', 93.5),
		raiseEnd: A.lineEnd('竖起来', 93.5),
		flat: A.at('前面平', 96),
		steep: A.at('最后才陡', 97),
		q34: A.at('四分之三', 99),
		halfV: A.at('还剩一半', 100.5),
		halfVEnd: A.end('还剩一半', 100.5), // 第二轮审片 P2：“走完 3/4 → 速度剩 1/2”残影从这里开始
		grayLine: A.at('灰的那条直线', 102),
		byM: A.at('按米掉', 103),
		byS: A.at('按秒掉', 105),
		s3dEnd: A.lineEnd('按秒掉', 105),
		// ── ④a 雨天 ──
		s4: A.at('下雨了', 107),
		twoThree: A.at('两三码', 109),
		again: A.at('还是50码', 110.5),
		// 第二轮审稿：旁白从“停得住吗？/停不住，撞上去还有35码左右”改成估数题“撞上时还剩多快？/35码左右，只滴了六个点”
		canStop: A.at('还剩多快', 110.5), // 读数变“?”（110.5 s 之后找，跳过开头那句同样的问法）
		rainGo: A.lineEnd('还剩多快', 110.5),
		cant: A.at('35码左右', 115), // 车头越线、读数落成 35、雨天刹车路虚线
		about35: A.at('只滴了', 116), // 读数旁“雨天”小标（116 s 之后找，跳过 60 码那句“只滴了三个点”）
		s4End: A.lineEnd('六个点', 116),
		// ── ④b 抛球 ──
		s4b: A.at('再换个', 120),
		unlike: A.at('完全不像', 120.5),
		ball: A.at('扔个球', 122.5),
		longest: A.at('待得最久', 124),
		askEnd: A.lineEnd('待得最久', 124),
		top: A.at('在顶上', 127),
		gravity: A.at('按秒减速', 128.5),
		higher: A.at('越往上', 130),
		quarterB: A.at('四分之一', 132),
		halfT: A.at('一半时间', 133.5),
		sameWhere: A.at('一样在哪', 135.5),
		rule1: A.at('速度按秒掉', 137),
		rule2: A.at('路按米走', 139),
		s4bEnd: A.lineEnd('路按米走', 139),
		// ── ⑤ 边界 ──
		s5: A.at('看手机', 141),
		m33: A.at('33米', 143.5),
		eb25: A.at('25码', 145),
		eb35: A.at('35码', 146.5),
		dbl: A.at('翻倍', 149),
		lower: A.at('车速越低', 150),
		more: A.at('占得越多', 152),
		ice: A.at('结冰打滑', 153),
		s5End: A.lineEnd('结冰打滑', 153),
		// ── 终局 + 留题 ──
		quiz: A.at('留个题', 158),
		school: A.at('学校门口', 159),
		q30: A.at('30码', 160),
		kid: A.at('孩子面前', 161.5),
		q40: A.at('40码', 163),
		howMuch: A.at('还剩多少', 165),
		end: A.lineEnd('还剩多少', 165),
	};
	return T;
};
export type TL = ReturnType<typeof buildT>;

// ───────── 物理（与 numbers.py 同一套公式：反应段匀速 + 刹车段匀减速） ─────────
export const KMH = 3.6;
/** 车头离“看见人”那一刻位置的距离（米）。tp = 从看见人起的物理时间（秒） */
export const carX = (v0kmh: number, a: number, tr: number, tp: number) => {
	const v0 = v0kmh / KMH;
	if (tp <= tr) return v0 * tp;
	const tau = Math.min(tp - tr, v0 / a);
	return v0 * tr + v0 * tau - 0.5 * a * tau * tau;
};
export const carV = (v0kmh: number, a: number, tr: number, tp: number) => {
	const v0 = v0kmh / KMH;
	if (tp <= tr) return v0kmh;
	const tau = Math.min(tp - tr, v0 / a);
	return Math.max(0, v0 - a * tau) * KMH;
};
