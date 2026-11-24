import type {Numbers} from './data';
import type {TL} from './timeline';
import {carV, carX, SLOW} from './timeline';

// 每辆车在某一画面时刻的“物理时间”（从看见人那一刻算起，秒）。
// 升镜时物理时间暂停；俯视后按 0.6× 慢放，先白后黄（分镜表 §0 第 5 条）。

export type CarState = {tp: number; x: number; v: number; braking: boolean; opacity: number};

const replay = (t: number, start: number, tr: number, dur: number) => tr + Math.min(Math.max(0, (t - start) * SLOW), dur);

/** 车在重放前：在原位淡出，跳回刹车点再淡入 */
const jumpFade = (t: number, at: number) => {
	if (t < at - 0.3 || t > at + 0.25) return 1;
	if (t < at) return (at - t) / 0.3;
	return (t - at) / 0.25;
};

/** 白车一次播放的时长：到最后一个漆点（停住处的那个点，tb = 2.0 s）为止；车在 1.984 s 已停，之后原地不动 */
export const whiteRunDur = (N: Numbers) => Math.max(N.main['50'].t_total_brake, ...N.dots['50'].map((d) => d.tb));

export const whiteState = (t: number, T: TL, N: Numbers): CarState => {
	const s = N.main['50'];
	const tr = s.t_react;
	const stop = whiteRunDur(N);
	let tp: number;
	let opacity = 1;
	if (t < T.brake) tp = t - T.see;
	else if (t < T.wStart) tp = tr;
	else if (t < T.s3aEnd - 0.3) tp = replay(t, T.wStart, tr, stop);
	else {
		// ③a 重放：念完“是按秒掉”后从刹车点重放（让位的 2 秒里开始）
		opacity = jumpFade(t, T.s3aEnd);
		tp = t < T.s3aEnd ? tr + stop : replay(t, T.s3aEnd, tr, stop);
	}
	return {tp, x: carX(s.v0, s.a, tr, tp), v: carV(s.v0, s.a, tr, tp), braking: tp > tr + 1e-6 && tp < tr + s.t_total_brake - 1e-6, opacity};
};

export const yellowState = (t: number, T: TL, N: Numbers): CarState => {
	const s = N.main['60'];
	const tr = s.t_react;
	const hit = s.t_brake;
	let tp: number;
	let opacity = 1;
	if (t < T.brake) tp = t - T.see;
	else if (t < T.yStart) tp = tr;
	else if (t < T.these10 - 0.3) tp = replay(t, T.yStart, tr, hit);
	else {
		opacity = jumpFade(t, T.these10);
		tp = t < T.these10 ? tr + hit : replay(t, T.these10, tr, hit);
	}
	return {tp, x: carX(s.v0, s.a, tr, tp), v: carV(s.v0, s.a, tr, tp), braking: tp > tr + 1e-6 && tp < tr + hit - 1e-6, opacity};
};

/** 第一次播放时已经滴下的点（之后的重放不会再“擦掉”它们） */
export const firstRunTp = (t: number, T: TL, N: Numbers, which: '50' | '60') => {
	const s = N.main[which];
	const tr = s.t_react;
	if (t < T.brake) return t - T.see;
	const start = which === '50' ? T.wStart : T.yStart;
	const dur = which === '50' ? whiteRunDur(N) : s.t_brake;
	if (t < start) return tr;
	return replay(t, start, tr, dur);
};

/** 雨天：同一辆 50 码车，反应段和晴天一样，从刹车点开始刹（④a） */
export const rainState = (t: number, T: TL, N: Numbers): CarState => {
	const s = N.rain;
	const tr = s.t_react;
	const tp = t < T.rainGo ? tr : replay(t, T.rainGo, tr, s.t_brake);
	return {tp, x: carX(s.v0, s.a, tr, tp), v: carV(s.v0, s.a, tr, tp), braking: tp > tr + 1e-6 && tp < tr + s.t_brake - 1e-6, opacity: 1};
};
