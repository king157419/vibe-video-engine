import {noise2D} from '@remotion/noise';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, staticFile} from 'remotion';
import {H, W} from '../../lib/safe';
import {MOVES, type Scene} from './scenes';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const DISSOLVE_PRE = 420;
export const DISSOLVE_POST = 180; // 交叉溶解约 600ms，略早于新句子开口

// 开场镜头的「推近」：在第 2 句开口时，约 0.9s 内再推近 9%，并把主体往画面中心带一点
const BEAT_ZOOM = 0.09;
const BEAT_CENTER = 0.22;
const BEAT_SPAN: [number, number] = [-200, 700];

/** 插画层：Ken Burns 慢推 + 交叉溶解。只挂载当前可见的 1~2 张图。 */
export const Scenes: React.FC<{scenes: Scene[]; ms: number}> = ({scenes, ms}) => (
	<AbsoluteFill style={{backgroundColor: '#15131c'}}>
		{scenes.map((sc, k) => {
			const from = k === 0 ? 0 : sc.startMs - DISSOLVE_PRE;
			const to = k === scenes.length - 1 ? sc.endMs : sc.endMs + DISSOLVE_POST;
			if (ms < from || ms > to) return null;
			const fadeIn =
				k === 0
					? 1
					: interpolate(ms, [from, sc.startMs + DISSOLVE_POST], [0, 1], {
							...clamp,
							easing: Easing.inOut(Easing.sin),
						});
			const m = MOVES[sc.move % MOVES.length];
			const p = interpolate(ms, [from, Math.max(from + 1, to)], [0, 1], clamp);
			const e = Easing.inOut(Easing.sin)(p) * 0.35 + p * 0.65; // 近似匀速，首尾稍缓
			const s0 = m.s0 + (m.s1 - m.s0) * e;
			let x = m.x0 + (m.x1 - m.x0) * e;
			let y = m.y0 + (m.y1 - m.y0) * e;
			let s = s0;
			if (sc.beat !== undefined) {
				const push = interpolate(ms, [sc.beat + BEAT_SPAN[0], sc.beat + BEAT_SPAN[1]], [0, 1], {
					...clamp,
					easing: Easing.inOut(Easing.cubic),
				});
				// 主体点（相对画面中心）在屏幕上的位置 = T + s·f；推近时让它向中心收一点
				const fx = (sc.focus[0] - 0.5) * W;
				const fy = (sc.focus[1] - 0.5) * H;
				s = s0 * (1 + BEAT_ZOOM * push);
				const k2 = 1 - BEAT_CENTER * push;
				x = (x + s0 * fx) * k2 - s * fx;
				y = (y + s0 * fy) * k2 - s * fy;
			}
			// 不露出图片边缘
			x = Math.max(-(W / 2) * (s - 1), Math.min((W / 2) * (s - 1), x));
			y = Math.max(-(H / 2) * (s - 1), Math.min((H / 2) * (s - 1), y));
			return (
				<AbsoluteFill key={`${k}-${sc.img}`} style={{opacity: fadeIn}}>
					<Img
						src={staticFile(sc.img)}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `translate(${x}px, ${y}px) scale(${s})`,
							transformOrigin: '50% 50%',
						}}
					/>
					{/* 亮图（晨光床单 / 夕阳天空）额外压暗，随本镜头一起交叉溶解 */}
					{sc.lift > 0 ? (
						<AbsoluteFill
							style={{
								background: `linear-gradient(180deg, rgba(14,10,18,0) 44%, rgba(14,10,18,${0.22 * sc.lift}) 58%, rgba(14,10,18,${0.42 * sc.lift}) 72%, rgba(14,10,18,${0.36 * sc.lift}) 100%)`,
							}}
						/>
					) : null}
					{sc.topLift > 0 ? (
						<AbsoluteFill
							style={{
								background: `linear-gradient(180deg, rgba(14,10,18,${0.5 * sc.topLift}) 0%, rgba(14,10,18,${0.36 * sc.topLift}) 14%, rgba(14,10,18,${0.14 * sc.topLift}) 24%, rgba(14,10,18,0) 32%)`,
							}}
						/>
					) : null}
				</AbsoluteFill>
			);
		})}
	</AbsoluteFill>
);

/** 调色 + 暗角 + 漂移的暖光 + 浮尘光点（都是渐变，不用 blur） */
export const Grade: React.FC<{ms: number}> = ({ms}) => {
	const t = ms / 1000;
	const lx = 22 + noise2D('leak-x', t * 0.05, 0) * 14;
	const ly = 16 + noise2D('leak-y', 0, t * 0.05) * 8;
	const la = 0.16 + 0.06 * noise2D('leak-a', t * 0.12, 3);
	return (
		<>
			{/* 暖色调：上暖下冷 */}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(255,184,112,0.10) 0%, rgba(255,160,96,0.05) 45%, rgba(40,26,70,0.10) 100%)',
				}}
			/>
			{/* 缓慢漂移的漏光 */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at ${lx}% ${ly}%, rgba(255,176,98,${la}) 0%, rgba(255,176,98,${la * 0.4}) 22%, rgba(255,176,98,0) 48%)`,
				}}
			/>
			<Motes t={t} />
			{/* 暗角 */}
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse 125% 88% at 50% 42%, rgba(0,0,0,0) 52%, rgba(8,6,14,0.46) 100%)',
				}}
			/>
		</>
	);
};

const MOTES = 9;
// 画面主体（人物）大致所在区域：光点经过这里时淡掉，免得像头顶的亮斑 / 镜头脏点
const SUBJECT = {x0: 250, x1: 830, y0: 450, y1: 1300};
const SUBJECT_FEATHER = 90;

const subjectMask = (x: number, y: number) => {
	const dx = Math.max(SUBJECT.x0 - x, x - SUBJECT.x1, 0);
	const dy = Math.max(SUBJECT.y0 - y, y - SUBJECT.y1, 0);
	return Math.min(1, Math.max(dx, dy) / SUBJECT_FEATHER);
};

const Motes: React.FC<{t: number}> = ({t}) => (
	<>
		{Array.from({length: MOTES}).map((_, i) => {
			const rx = random(`mote-x-${i}`);
			const ry = random(`mote-y-${i}`);
			const rs = random(`mote-s-${i}`);
			const rv = random(`mote-v-${i}`);
			const speed = 8 + rv * 16; // px/s，缓缓上升
			const span = H + 240;
			const y = ((((ry * span - t * speed) % span) + span) % span) - 120;
			const x = rx * W + noise2D(`mote-sway-${i}`, t * 0.07, i) * 40;
			const r = 2 + rs * 3;
			const tw = 0.5 + 0.5 * noise2D(`mote-tw-${i}`, t * 0.35, 7);
			const a = (0.05 + 0.17 * tw * (0.5 + 0.5 * rs)) * subjectMask(x, y);
			if (a < 0.01) return null;
			const R = r * 3.2;
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: x - R,
						top: y - R,
						width: R * 2,
						height: R * 2,
						borderRadius: '50%',
						background: `radial-gradient(circle, rgba(255,222,168,${a}) 0%, rgba(255,210,150,${a * 0.45}) 28%, rgba(255,200,140,0) 68%)`,
					}}
				/>
			);
		})}
	</>
);
