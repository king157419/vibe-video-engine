import type {Captions} from '../../lib/types';

// ───────── numbers.json 的类型（3_第三版资料/样片/brake/numbers.py 写出，片中所有数字的唯一来源） ─────────
export type Dot = {tb: number; t: number; x: number; to_person: number; v: number; phase: string};
export type Scenario = {
	v0: number;
	a: number;
	t_react: number;
	d: number;
	react: number;
	remain: number;
	brake_dist: number;
	stop_dist: number;
	stops: boolean;
	gap: number | null;
	v_hit: number;
	t_brake: number;
	t_total_brake: number;
	frac_used: number;
};
export type Numbers = {
	assumptions: {t_react: number; a_dry: number; a_wet: number; d_person: number; dot_dt: number; px_per_m: number; x0_px: number; x_person_px: number};
	main: {'50': Scenario; '60': Scenario};
	dots: {'50': Dot[]; '60': Dot[]};
	per_meter_time: {first_1m: number; last_1m: number};
	card_a: {pred: number; loss_per_m: number; stop_60_a: number; half_x: number; v_half: number; t_half: number; v_half_naive: number};
	curve_50: {x: number; v: number}[];
	rule_marker_50: {x: number; px: number; v: number};
	rain: Scenario & {dots: Dot[]};
	ball: {v0: number; g: number; dt: number; T_up: number; H: number; points: {t: number; h: number; v: number}[]; t_top_quarter: number};
	cards: {
		ebike_ratio: number;
		phone_60_2s: number;
		low_30: {react: number; brake: number};
		ebike_brake: {'25': number; '35': number};
		split: Record<'30' | '50' | '60', {react: number; brake: number; share: number}>;
		phone_dots: number;
	};
	quiz: {t_react: number; d: number; v_hit: number; remain: number}[];
	quiz_dots: {'30': Dot[]; '40': Dot[]; d_kid: number};
};

export type BrakeProps = {captions: Captions | null; numbers: Numbers | null};

// ───────── 旁白逐字时间 → 锚点 ─────────
const PUNCT = /[\s，。：；？、！—,.:;?!“”"'（）()]/g;

export type Anchors = {
	/** 词 w 在 after 秒之后第一次出现时，第一个字开始的秒数；找不到就报错（锚点写错要立刻暴露） */
	at: (w: string, after: number) => number;
	/** 词 w 在 after 秒之后第一次出现时，最后一个字结束的秒数 */
	end: (w: string, after: number) => number;
	/** 包含词 w 的那一行字幕的结束秒数 */
	lineEnd: (w: string, after: number) => number;
};

export const makeAnchors = (cap: Captions): Anchors => {
	let flat = '';
	const st: number[] = [];
	const en: number[] = [];
	const lineOf: number[] = [];
	cap.lines.forEach((ln, li) => {
		for (const c of ln.chars) {
			const t = c.t.replace(PUNCT, '');
			for (const ch of t) {
				flat += ch;
				st.push(c.s / 1000);
				en.push(c.e / 1000);
				lineOf.push(li);
			}
		}
	});
	const find = (w: string, after: number): [number, number] => {
		const q = w.replace(PUNCT, '');
		let i = flat.indexOf(q);
		while (i >= 0) {
			if (st[i] >= after - 1e-6) return [i, i + q.length - 1];
			i = flat.indexOf(q, i + 1);
		}
		throw new Error(`锚点找不到：“${w}”（${after}s 之后）`);
	};
	return {
		at: (w, after) => st[find(w, after)[0]],
		end: (w, after) => en[find(w, after)[1]],
		lineEnd: (w, after) => cap.lines[lineOf[find(w, after)[0]]].endMs / 1000,
	};
};
