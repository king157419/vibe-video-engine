// 样片二《煮不死的种子》主组件。所有画面只由帧号推出：t = frame / 30，动作锚在旁白逐字时间上。
import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {BetCards} from './cards';
import type {RiceProps} from './data';
import {buildTimeline} from './data';
import {DualScene} from './dual';
import {FinalScene} from './final';
import {ensureFonts} from './fonts';
import {GrainMacro, Kitchen, pushState} from './kitchen';
import {CaptionBand, Flash, TopBar} from './overlays';
import {PartsScene} from './parts';
import {BoundaryScene, HotterScene, SamplesScene} from './samples';
import {barShapes, StopwatchScene} from './stopwatch';
import {C, FPS} from './theme';

export const RiceVideo: React.FC<RiceProps> = ({captions, numbers}) => {
	ensureFonts();
	const frame = useCurrentFrame();
	const T = useMemo(() => (captions ? buildTimeline(captions) : null), [captions]);
	if (!captions || !numbers || !T) return <AbsoluteFill style={{background: C.bench}} />;
	const t = frame / FPS;
	const num = numbers;
	const bars = barShapes(num);
	const ps = pushState(T, t);
	const flashes = [T.zhuFan + 0.12, T.chaoTou3End + 0.27];
	return (
		<AbsoluteFill style={{background: C.bench, overflow: 'hidden'}}>
			{/* 段 0–1：厨房、押注、推进一粒饭 */}
			{t < T.zuanJin + 1.5 ? (
				<div style={{position: 'absolute', inset: 0, opacity: ps.kitchenOp}}>
					<Kitchen T={T} t={t} />
				</div>
			) : null}
			{t > T.zuanJin + 0.9 && t < T.zuanJin + 2.6 ? <GrainMacro op={ps.macroOp} /> : null}
			{/* 段 2：认零件 */}
			{t >= T.zuanJin + 1.3 && t < T.zuo2 ? <PartsScene T={T} t={t} irisU={ps.iris} /> : null}
			{/* 段 3–4：双视野（段 5 开头压扁成秒表条） */}
			{t >= T.zuo2 && t < T.suoYi + 1.4 ? <DualScene T={T} t={t} num={num} barA={bars.A} barB={bars.B} /> : null}
			{/* 段 5：秒表条（段末淡出；残影是右上角两条改好的链，在 BetCards 里） */}
			{t >= T.suoYi && t < T.naiReDeDu1End + 1.0 ? <StopwatchScene T={T} t={t} num={num} /> : null}
			{/* 段 6–7：别的样本、对照、边界 */}
			{t >= T.paoGuoYe - 0.2 && t < T.bingXiang5 + 0.6 ? <SamplesScene T={T} t={t} num={num} /> : null}
			<HotterScene T={T} t={t} num={num} />
			<BoundaryScene T={T} t={t} />
			{/* 段 8：收束 */}
			<FinalScene T={T} t={t} num={num} />
			{/* 常驻层 */}
			<BetCards T={T} t={t} />
			<TopBar T={T} t={t} />
			<Flash times={flashes} t={t} />
			<CaptionBand cap={captions} t={t} T={T} />
			<Html5Audio src={staticFile('v3/rice/mix.wav')} />
		</AbsoluteFill>
	);
};
