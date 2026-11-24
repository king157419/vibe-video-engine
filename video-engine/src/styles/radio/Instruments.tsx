import {noise2D} from '@remotion/noise';
import {SERIF} from '../../lib/fonts';
import {SAFE, SAFE_W, W} from '../../lib/safe';
import {amber, clamp01, cream, CX, HEADER_TOP, WAVE_Y} from './theme';

/** 顶部台标：● 系列 · 期数 / 章节。小圆点是 ON-AIR 指示灯，光晕随人声呼吸 */
export const Header: React.FC<{
	series: string | undefined;
	ep: string | undefined;
	chapter: string | undefined;
	level: number;
	onAir: number;
	opacity: number;
}> = ({series, ep, chapter, level, onAir, opacity}) => {
	if (opacity <= 0.002) return null;
	const top = [series, ep].filter(Boolean).join('  ·  ') || 'ON AIR';
	const halo = (0.25 + 0.75 * level) * onAir;
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				top: HEADER_TOP,
				width: SAFE_W,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				opacity,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', maxWidth: SAFE_W, gap: 18}}>
				<div style={{position: 'relative', width: 14, height: 14, flexShrink: 0}}>
					<div
						style={{
							position: 'absolute',
							left: -29,
							top: -29,
							width: 72,
							height: 72,
							borderRadius: '50%',
							background: `radial-gradient(circle closest-side, ${amber(0.55 * halo)} 0%, ${amber(0.18 * halo)} 38%, ${amber(0)} 70%)`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							borderRadius: '50%',
							background: amber(0.35 + 0.6 * onAir),
							boxShadow: `0 0 10px ${amber(0.7 * onAir)}`,
						}}
					/>
				</div>
				<div
					style={{
						fontFamily: SERIF,
						fontWeight: 500,
						fontSize: 36,
						letterSpacing: '0.12em',
						color: cream(0.72),
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{top}
				</div>
			</div>
			{chapter ? (
				<div
					style={{
						marginTop: 12,
						fontFamily: SERIF,
						fontWeight: 400,
						fontSize: 30,
						letterSpacing: '0.16em',
						paddingLeft: '0.16em',
						color: cream(0.55),
						whiteSpace: 'nowrap',
						maxWidth: SAFE_W,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{chapter}
				</div>
			) : null}
		</div>
	);
};

const BARS = 47;
const BAR_GAP = 14;
const MAX_H = 128;
const SPAN = (BARS - 1) * BAR_GAP;
/** 频谱中线那根发丝线的长度 */
const HAIR_W = SPAN + 120;

/**
 * 人声频谱：一排极细的琥珀色竖线，低频在中间、越往两边越淡；透明度最高约 0.42，始终让位给字幕。
 * 包络较平（两端仍有 55%），真实频谱的起伏看得出来，不是每帧都一样的对称「透镜」。
 * 不画进度（抖音自己有进度条）。
 */
export const VoiceBars: React.FC<{spectrum: number[] | null; level: number; t: number; opacity: number}> = ({
	spectrum,
	level,
	t,
	opacity,
}) => {
	if (opacity <= 0.002) return null;
	const mid = (BARS - 1) / 2;
	const bars = [];
	for (let j = 0; j < BARS; j++) {
		const d = Math.abs(j - mid) / mid; // 0 中间 → 1 两端
		const side = j < mid ? -1 : 1;
		let a = 0;
		if (spectrum) {
			// 中间 = 低频（人声基频），两端 = 高频；左右用相邻 bin 略作区分，避免完全镜像的呆板
			const bin = Math.min(spectrum.length - 1, Math.round(2 + Math.pow(d, 1.35) * 46 + (side > 0 ? 1 : 0)));
			a = spectrum[bin];
		}
		const env = 0.55 + 0.45 * (1 - d * d);
		const idle = 0.5 + 0.5 * noise2D('idle', j * 0.35, t * 0.5);
		// 频谱值（对数刻度）在人声时约 0.3–0.8，静音 <0.1：去掉底噪后再放大
		const aa = clamp01((a - 0.12) / 0.75);
		const h = 3 + idle * 5 * (1 - d) + Math.pow(aa, 1.15) * env * MAX_H * (0.45 + 0.55 * level);
		const x = CX - SPAN / 2 + j * BAR_GAP;
		const o = (0.1 + 0.32 * Math.pow(1 - d, 1.4)) * (0.6 + 0.4 * aa);
		bars.push(<rect key={j} x={x - 1.25} y={WAVE_Y - h / 2} width={2.5} height={h} rx={1.25} fill={amber(o)} />);
	}
	const x0 = CX - HAIR_W / 2;
	return (
		<svg
			width={W}
			height={400}
			style={{position: 'absolute', left: 0, top: WAVE_Y - 200, opacity, overflow: 'visible'}}
			viewBox={`0 ${WAVE_Y - 200} ${W} 400`}
		>
			<defs>
				<linearGradient id="radio-hair" x1="0" x2="1" y1="0" y2="0">
					<stop offset="0" stopColor="#F5F1E8" stopOpacity="0" />
					<stop offset="0.15" stopColor="#F5F1E8" stopOpacity="0.12" />
					<stop offset="0.85" stopColor="#F5F1E8" stopOpacity="0.12" />
					<stop offset="1" stopColor="#F5F1E8" stopOpacity="0" />
				</linearGradient>
			</defs>
			<rect x={x0} y={WAVE_Y - 0.5} width={HAIR_W} height={1} fill="url(#radio-hair)" />
			{bars}
		</svg>
	);
};
