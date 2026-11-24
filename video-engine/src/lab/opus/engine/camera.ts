import {noise2D} from '@remotion/noise';
import {Easing} from 'remotion';
import type {Box, CamKey} from './board';
import {STAGE, STAGE_CY, W} from './theme';

export type View = {cx: number; cy: number; z: number};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const penEase = Easing.bezier(0.42, 0, 0.3, 1);
export const camEase = Easing.bezier(0.55, 0.05, 0.2, 1); // 起步略慢、落点柔和：像手推镜头
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** 把世界坐标里的一个框装进画面内容区（字幕区之上） */
export const viewOf = (b: Box): View => {
	const bw = b[2] - b[0];
	const bh = b[3] - b[1];
	const z = Math.min(W / bw, (STAGE.bottom - STAGE.top) / bh);
	return {cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, z};
};

const mix = (a: View, b: View, t: number): View => {
	// 缩放在对数空间插值；拉远再推近的大移动时，中心点的移动跟着缩放走，避免「滑冰」
	const lz = lerp(Math.log(a.z), Math.log(b.z), t);
	return {cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), z: Math.exp(lz)};
};

const PUSH_RATE = 0.0045; // 停住以后每秒慢慢推近 0.45%
const PUSH_MAX = 0.03;
const push = (sinceArrive: number) => (sinceArrive <= 0 ? 1 : 1 + Math.min(PUSH_MAX, (sinceArrive / 1000) * PUSH_RATE));

/** 镜头：关键帧之间缓动；到位后缓慢推近；叠一点手持漂移 */
export const camAt = (keys: CamKey[], ms: number, drift = true): View => {
	if (!keys.length) return {cx: W / 2, cy: STAGE_CY, z: 1};
	let from = viewOf(keys[0].box);
	let cur = keys[0];
	let curFrom = from;
	const valueAt = (k: CamKey, f: View, t: number): View => {
		const p = camEase(clamp01((t - k.t) / Math.max(1, k.dur)));
		const v = mix(f, viewOf(k.box), p);
		return {...v, z: v.z * push(t - (k.t + k.dur))};
	};
	for (let i = 1; i < keys.length; i++) {
		const k = keys[i];
		if (k.t > ms) break;
		from = valueAt(cur, curFrom, k.t);
		cur = k;
		curFrom = from;
	}
	const v = keys[0] === cur && ms < cur.t ? viewOf(cur.box) : valueAt(cur, curFrom, ms);
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
