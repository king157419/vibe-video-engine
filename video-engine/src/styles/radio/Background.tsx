import {noise2D} from '@remotion/noise';
import {AbsoluteFill, random} from 'remotion';
import {BG_BOTTOM, BG_TOP} from './theme';
import {GRAIN_URL} from './ready';

type Blob = {x: number; y: number; r: number; rgb: string; a: number; seed: string; drift: number};

// 大而软的暖色光斑（像失焦的台灯/窗外路灯），用 noise 缓慢漂移。
// 手机亮度下要「看得出在动」：透明度约为初版的 1.6 倍，漂移速度 2 倍、幅度 1.4 倍。
const BLOBS: Blob[] = [
	{x: 290, y: 690, r: 620, rgb: '242,184,114', a: 0.33, seed: 'lamp', drift: 170},
	{x: 880, y: 1290, r: 660, rgb: '226,136,80', a: 0.27, seed: 'ember', drift: 196},
	{x: 930, y: 290, r: 430, rgb: '236,164,146', a: 0.15, seed: 'rose', drift: 126},
	{x: 140, y: 1650, r: 520, rgb: '242,184,114', a: 0.19, seed: 'low', drift: 154},
	{x: 600, y: 1020, r: 780, rgb: '96,112,190', a: 0.09, seed: 'cool', drift: 112},
];

// 中景的失焦光圈：大而淡（r 90–140、a ≤ 0.08），都在 SAFE 内的中上部——读作「远处的灯」，而不是镜头上的灰尘
const DOTS = [
	{x: 196, y: 430, r: 120, a: 0.075},
	{x: 812, y: 590, r: 96, a: 0.08},
	{x: 700, y: 960, r: 140, a: 0.06},
];

const softGradient = (rgb: string, a: number) =>
	`radial-gradient(circle closest-side at 50% 50%, rgba(${rgb},${a}) 0%, rgba(${rgb},${a * 0.66}) 20%, rgba(${rgb},${a * 0.34}) 42%, rgba(${rgb},${a * 0.12}) 64%, rgba(${rgb},${a * 0.03}) 82%, rgba(${rgb},0) 100%)`;

// 失焦光圈：暖橙色，近乎平顶、边缘柔和（真实散景是一个均匀的圆盘，而不是一颗亮点）
const discGradient = (a: number) =>
	`radial-gradient(circle closest-side at 50% 50%, rgba(255,196,128,${a}) 0%, rgba(255,192,124,${a * 0.92}) 45%, rgba(255,186,116,${a * 0.62}) 72%, rgba(255,182,112,${a * 0.2}) 90%, rgba(255,180,110,0) 100%)`;

export const Background: React.FC<{t: number; glow: number}> = ({t, glow}) => (
	<AbsoluteFill style={{background: `linear-gradient(180deg, ${BG_TOP} 0%, #10152A 55%, ${BG_BOTTOM} 100%)`}}>
		{BLOBS.map((b, i) => {
			const dx = noise2D(b.seed, t * 0.09, 0) * b.drift;
			const dy = noise2D(b.seed, 0, t * 0.08 + 7) * b.drift;
			const s = 1 + 0.08 * noise2D(`${b.seed}-s`, t * 0.12, 3);
			// 主灯（第一个）随人声轻微「呼吸」
			const breathe = i === 0 ? 0.82 + 0.3 * glow : 0.9 + 0.1 * glow;
			return (
				<div
					key={b.seed}
					style={{
						position: 'absolute',
						left: b.x - b.r,
						top: b.y - b.r,
						width: b.r * 2,
						height: b.r * 2,
						background: softGradient(b.rgb, b.a),
						opacity: breathe,
						transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${s.toFixed(4)})`,
					}}
				/>
			);
		})}
		{DOTS.map((d, i) => {
			const dx = noise2D(`dot${i}`, t * 0.08, 1) * 40;
			const dy = noise2D(`dot${i}`, 2, t * 0.07) * 40;
			const tw = 0.75 + 0.25 * noise2D(`tw${i}`, t * 0.25, 0);
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: d.x - d.r,
						top: d.y - d.r,
						width: d.r * 2,
						height: d.r * 2,
						borderRadius: '50%',
						background: discGradient(d.a),
						opacity: tw,
						transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`,
					}}
				/>
			);
		})}
		{/* 暗角：把视线收拢到中间 */}
		<AbsoluteFill
			style={{
				background:
					'radial-gradient(ellipse 78% 62% at 46% 44%, rgba(5,7,14,0) 55%, rgba(5,7,14,0.38) 82%, rgba(4,6,12,0.66) 100%)',
			}}
		/>
	</AbsoluteFill>
);

/** 静态胶片颗粒：一张预生成贴图，每 2 帧随机平移一次（12–15fps 的颗粒更像胶片） */
export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.065}) => {
	const k = Math.floor(frame / 4);
	// 只做几个像素的整像素抖动：观感上颗粒在「呼吸」，编码器也能用运动补偿预测它（码率低很多）
	const ox = Math.round((random(`radio-grain-x-${k}`) - 0.5) * 8);
	const oy = Math.round((random(`radio-grain-y-${k}`) - 0.5) * 8);
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${GRAIN_URL})`,
				backgroundSize: '384px 384px',
				backgroundRepeat: 'repeat',
				backgroundPosition: `${ox}px ${oy}px`,
				opacity,
				pointerEvents: 'none',
			}}
		/>
	);
};
