import {noise2D} from '@remotion/noise';
import {Easing} from 'remotion';
import type {Box, CamKey} from './board';
import {clamp01, lerp} from './board';
import {H, STAGE, STAGE_CY, STAGE_H, W} from './theme';

// 镜头：关键帧 = 「从 t 开始，用 dur 毫秒把这个框装进内容区」。
// - 缩放在对数空间插值；两帧相距很远时（跨岛）中途自动拉远一点再推近（弧线），不会「滑冰」。
// - 到位后每秒慢慢推近 0.45%（最多 3%），再叠一点手持漂移（噪声）。
// - qa 模式（freezedetect 用）关掉推近和漂移，静止就是真静止。

export type View = {cx: number; cy: number; z: number};

export {clamp01, lerp};
export const penEase = Easing.bezier(0.42, 0, 0.3, 1);
export const camEase = Easing.bezier(0.55, 0.05, 0.2, 1); // 起步略慢、落点柔和：像手推镜头
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** 把世界坐标里的一个框装进画面内容区（字幕带之上） */
export const viewOf = (b: Box): View => {
	const bw = Math.max(1, b[2] - b[0]);
	const bh = Math.max(1, b[3] - b[1]);
	const z = Math.min(W / bw, STAGE_H / bh);
	return {cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, z};
};

/** 这个视角下，内容区（字幕带以上）对应的世界框 */
export const stageBox = (v: View): Box => [v.cx - W / 2 / v.z, v.cy - (STAGE_CY - STAGE.top) / v.z, v.cx + W / 2 / v.z, v.cy + (STAGE.bottom - STAGE_CY) / v.z];
/** 整个屏幕（含字幕带）对应的世界框 */
export const screenBox = (v: View): Box => [v.cx - W / 2 / v.z, v.cy - STAGE_CY / v.z, v.cx + W / 2 / v.z, v.cy + (H - STAGE_CY) / v.z];

const mix = (a: View, b: View, t: number, arcZ?: number): View => {
	// 中心点跟着对数缩放走；arcZ：中途要拉远到的缩放（跨岛时）
	let lz = lerp(Math.log(a.z), Math.log(b.z), t);
	if (arcZ !== undefined) {
		const mid = lerp(Math.log(a.z), Math.log(b.z), 0.5);
		const dip = Math.max(0, mid - Math.log(arcZ));
		lz -= dip * Math.sin(Math.PI * t);
	}
	return {cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), z: Math.exp(lz)};
};

/** 两个视角离得远不远：远就算一个弧线要拉远到的 z */
const arcFor = (a: View, b: View): number | undefined => {
	const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
	const span = Math.max(W / a.z, W / b.z);
	if (d < span * 0.9) return undefined;
	const ba = stageBox(a);
	const bb = stageBox(b);
	const u: Box = [Math.min(ba[0], bb[0]), Math.min(ba[1], bb[1]), Math.max(ba[2], bb[2]), Math.max(ba[3], bb[3])];
	return viewOf(u).z * 1.25; // 不必把两边都完整装进来，拉远到能看到「在大纸上移动」就够
};

const PUSH_RATE = 0.0045;
const PUSH_MAX = 0.03;
const push = (sinceArrive: number) => (sinceArrive <= 0 ? 1 : 1 + Math.min(PUSH_MAX, (sinceArrive / 1000) * PUSH_RATE));

export type CamOpts = {drift?: boolean; push?: boolean};

/** 关键帧必须按 t 排好序 */
export const camAt = (keys: CamKey[], ms: number, o: CamOpts = {}): View => {
	const drift = o.drift ?? true;
	const pushOn = o.push ?? true;
	if (!keys.length) return {cx: W / 2, cy: STAGE_CY, z: 1};
	let from = viewOf(keys[0].box);
	const valueAt = (seg: {k: CamKey; from: View; arc?: number}, t: number, withPush: boolean): View => {
		const p = camEase(clamp01((t - seg.k.t) / Math.max(1, seg.k.dur)));
		const v = mix(seg.from, viewOf(seg.k.box), p, seg.arc);
		return withPush && pushOn ? {...v, z: v.z * push(t - (seg.k.t + seg.k.dur))} : v;
	};
	let cur = {k: keys[0], from, arc: undefined as number | undefined};
	for (let i = 1; i < keys.length; i++) {
		const k = keys[i];
		if (k.t > ms) break;
		from = valueAt(cur, k.t, true);
		const to = viewOf(k.box);
		cur = {k, from, arc: arcFor(from, to)};
		}
	const v = keys[0] === cur.k && ms < cur.k.t ? viewOf(cur.k.box) : valueAt(cur, ms, true);
	if (!drift) return v;
	const s = ms / 1000;
	return {
		cx: v.cx + (noise2D('camx', s * 0.23, 0) * 5) / v.z,
		cy: v.cy + (noise2D('camy', 0, s * 0.19) * 4) / v.z,
		z: v.z * (1 + noise2D('camz', s * 0.11, 3) * 0.003),
	};
};

export const toScreen = (v: View, x: number, y: number): [number, number] => [(x - v.cx) * v.z + W / 2, (y - v.cy) * v.z + STAGE_CY];
export const worldTf = (v: View) => `translate(${W / 2} ${STAGE_CY}) scale(${v.z}) translate(${-v.cx} ${-v.cy})`;
