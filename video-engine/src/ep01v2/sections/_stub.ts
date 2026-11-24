import type {SectionCtx} from '../ctx';

// 占位用的小工具（架构层维护，section 可以不用）：镜头飞到本岛 + 左上角铅笔写段号。
export const stubIsland = (ctx: SectionCtx, o: {camAt?: number; camDur?: number} = {}) => {
	const at = o.camAt ?? ctx.t0 - 500;
	ctx.cam(null, at, o.camDur ?? 1300, {whoosh: true});
	const [x, y] = ctx.P(70, 110);
	ctx.text(ctx.id, x, y, 56, ctx.t0, {color: ctx.C.pencil, dur: 0, pen: false, nolint: true});
};

/** 在岛上按旁白写一条铅笔灰的占位说明（「待画：……」），anchor 是本段里的一个词 */
export const todo = (ctx: SectionCtx, anchor: string, label: string, col: number, row: number, size = 60) => {
	const [x, y] = ctx.grid(col, row);
	ctx.text(label, x, y, size, ctx.q.at(anchor), {anchor: 'middle', color: ctx.C.pencilDark});
};
