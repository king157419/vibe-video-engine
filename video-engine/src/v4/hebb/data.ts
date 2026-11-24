/** 数据入口：subs.json / timeline_meta.json / cue.json 由 4_第四版资料/hebb/tools/subs_timeline.py 生成，这里只读不改。
 *
 *  两种时间（审片修改后）：
 *  - 场景时间 τ：timeline_meta.json 里的所有锚点、画面代码里的所有时刻，都是这个时间（和第二稿一样）。
 *  - 播放时间 t：成片的时间。subs.json、cue.json 已经是播放时间。
 *  τ = toScene(t) 由 meta.time_map 分段线性得到：序整体提前 0.8 s，问句后的留白 2.5 → 2.0 s，之后整体提前 1.3 s。
 *  这两段平移都是整帧（24 帧、39 帧），所以每个锚点仍落在原来那一帧上。 */
import subsJson from '../../../public/v4/hebb/subs.json';
import metaJson from '../../../public/v4/hebb/timeline_meta.json';
import cueJson from '../../../public/v4/hebb/cue.json';
import type {Chapter, Sub} from '../kit';
import {C} from '../kit';

export const subs: Sub[] = subsJson;
export const meta = metaJson;
export const DUR = cueJson.dur; // 播放时间的片长
export const FPS = meta.fps;

const TM = meta.time_map as [number, number][]; // [场景, 播放]
const q6 = (v: number) => Math.round(v * 1e6) / 1e6;
const interp = (v: number, from: 0 | 1, to: 0 | 1) => {
	if (v <= TM[0][from]) return TM[0][to] + (v - TM[0][from]);
	for (let i = 1; i < TM.length; i++) {
		const a = TM[i - 1];
		const b = TM[i];
		if (v <= b[from]) return a[to] + ((v - a[from]) * (b[to] - a[to])) / (b[from] - a[from]);
	}
	const z = TM[TM.length - 1];
	return z[to] + (v - z[from]);
};
/** 播放时间 → 场景时间 */
export const toScene = (t: number) => q6(interp(t, 1, 0));
/** 场景时间 → 播放时间 */
export const toPlay = (tau: number) => q6(interp(tau, 0, 1));

/** 章节标签（kit 的 ChapterLabel 按播放时间走，所以这里换算） */
export const chapters: Chapter[] = meta.chapters.map((c) => ({...c, t: toPlay(c.t)}));

/** 全片语义色（timeline_meta.palette）：萤绿 = 线索/声音/未加强；金 = 被点亮/被加强/路；冰蓝只在 V 章「怕」；灰烬只在修剪 */
export const P = {
	leaf: meta.palette.leaf,
	leafDeep: meta.palette.leafDeep,
	chime: meta.palette.chimeRing,
	gold: meta.palette.gold,
	goldCore: meta.palette.goldCore,
	amber: meta.palette.amber,
	ice: meta.palette.ice_fear_only_in_V,
	ash: meta.palette.ash,
	text: C.text,
	dim: C.dim,
	silver: C.silver,
	warmWhite: '#f4f2ea',
	note: '#8a8f93', // 小字（读数、示意、路标、身份标记）：审片要求提亮到 #8a8f93
	label: '#b8bec4', // 只出现一次、又要观众记住的标签（突触、考上 / 没考上）
};

export const A0: [number, number] = meta.coords.A_prologue as [number, number];
export const B0: [number, number] = meta.coords.B_prologue as [number, number];
export const AN: [number, number] = meta.coords.A_neuron as [number, number];
export const BN: [number, number] = meta.coords.B_neuron as [number, number];

export const dings = meta.dings;
