import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {ensureFonts} from '../../lib/fonts';
import {win} from './anim';
import type {BrakeProps} from './data';
import {makeAnchors} from './data';
import type {GroundView} from './Ground';
import {Ground} from './Ground';
import {AssumptionTag, Readouts, SectionSign, SlowTag, SummaryLine, UnitNote} from './hud';
import {drivingCam, OpeningSVG} from './opening';
import {Beats} from './beats';
import {rainState, whiteState, yellowState} from './state';
import {Subtitles} from './Subtitles';
import {buildT} from './timeline';
import {C, FPS, H, W} from './theme';
import {camAt, lookAt, TopWorld} from './top';

ensureFonts();

export const Video: React.FC<BrakeProps> = ({captions, numbers}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const T = useMemo(() => (captions && numbers ? buildT(makeAnchors(captions), numbers) : null), [captions, numbers]);
	if (!captions || !numbers || !T) return <AbsoluteFill style={{background: C.asphalt}} />;
	const N = numbers;
	const opening = t < T.liftB;
	const w = whiteState(t, T, N);
	const y = yellowState(t, T, N);
	const cam = camAt(t, T);
	const look = lookAt(t, T);
	const wet = t >= T.s4 ? win(t, T.s4, T.unlike, 0.8, 0.8) : 0;
	const views: GroundView[] = opening ? [{cam: drivingCam(0, t, T, N)}, {cam: drivingCam(1, t, T, N)}] : [{cam, wet}];
	const slow =
		win(t, T.liftB - 0.2, T.freeze + 0.2, 0.3, 0.3) +
		win(t, T.still35, T.still35 + 1.1, 0.2, 0.3) +
		win(t, T.s3aEnd, T.s3aEnd + N.main['50'].t_total_brake / 0.6 + 0.1, 0.2, 0.3) +
		win(t, T.these10, T.these10 + N.main['60'].t_brake / 0.6 + 0.1, 0.2, 0.3) +
		win(t, T.rainGo, T.rainGo + N.rain.t_brake / 0.6 + 0.1, 0.2, 0.3);
	return (
		<AbsoluteFill style={{background: C.asphalt}}>
			<Ground views={views} />
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
				{opening ? <OpeningSVG t={t} T={T} N={N} /> : <TopWorld cam={cam} t={t} T={T} N={N} w={w} y={y} look={look} frame={frame} />}
				{!opening ? <Beats cam={cam} t={t} T={T} N={N} w={w} y={y} rain={rainState(t, T, N)} frame={frame} /> : null}
				<Readouts t={t} frame={frame} T={T} N={N} w={w} y={y} />
				<UnitNote t={t} T={T} />
				<SectionSign t={t} T={T} />
				<SummaryLine t={t} T={T} />
				<AssumptionTag t={t} T={T} N={N} />
				<SlowTag a={Math.min(1, slow)} text="慢放 0.6×" />
			</svg>
			<Subtitles captions={captions} t={t} />
			<Audio src={staticFile('v3/brake/mix.wav')} />
		</AbsoluteFill>
	);
};
