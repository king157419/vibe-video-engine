import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../../lib/fonts';
import type {Captions} from '../../lib/types';
import {clamp01, fade, lin} from './anim';
import {buildBoard} from './board';
import {camAt, camTransform, drift, toScreen} from './camera';
import {CaptionBar} from './Captions';
import {Pencil, penAt} from './parts';
import {Bridge, Clock, Dont, Fire, Phone, Stack, Tally} from './scenes';
import {BOIL_EVERY, BOIL_N, H, PAPER, W} from './theme';

ensureFonts();

export type Lab01Props = {captions: Captions | null};

export const Lab01: React.FC<Lab01Props> = ({captions}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const board = useMemo(() => (captions ? buildBoard(captions) : null), [captions]);

	if (!captions || !board) {
		return <AbsoluteFill style={{backgroundColor: PAPER}} />;
	}
	const ms = (frame / fps) * 1000;
	const vi = Math.floor(frame / BOIL_EVERY) % BOIL_N;
	const {T} = board;

	// 镜头 + 火上来时的一点抖动
	const cam = camAt(ms, board.cam);
	const shake = ms >= T.fire && ms < T.fire + 1100 ? Math.sin(((ms - T.fire) / 1100) * Math.PI) : 0;
	const d = drift(ms, shake);
	const tf = camTransform(cam, d);

	const pen = penAt(ms, board.strokes);
	const penPt = pen ? toScreen(cam, d, pen.pt) : null;
	const capOut = 1 - fade(ms, T.end + 900, 500);

	return (
		<AbsoluteFill style={{backgroundColor: PAPER}}>
			<Html5Audio src={staticFile(captions.audio)} />
			<Html5Audio
				src={staticFile('lab/fable/pen.wav')}
				loop
				volume={(f) => {
					const p = penAt((f / fps) * 1000, board.strokes);
					return p && p.drawing ? 0.16 * p.alpha : 0;
				}}
			/>
			<Img src={staticFile('lab/fable/paper.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />

			<svg style={{position: 'absolute', left: 0, top: 0}} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
				<g transform={tf}>
					<Fire b={board} ms={ms} vi={vi} />
					<Phone b={board} ms={ms} vi={vi} />
					<Clock b={board} ms={ms} vi={vi} />
					<Tally b={board} ms={ms} vi={vi} />
					<Bridge b={board} ms={ms} vi={vi} />
					<Stack b={board} ms={ms} vi={vi} />
					<Dont b={board} ms={ms} vi={vi} />
				</g>
			</svg>

			{/* 字幕带底下垫一层纸色，避免画面线条穿过字幕 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 900,
					height: 180,
					background: `linear-gradient(to bottom, rgba(250,248,242,0) 0%, rgba(250,248,242,0.92) 34%, rgba(250,248,242,0.96) 100%)`,
					opacity: clamp01(lin(ms, 0, 300)),
				}}
			/>
			<CaptionBar captions={captions} ms={ms} opacity={capOut} />

			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={W} height={H}>
				{pen && penPt ? <Pencil pt={penPt} alpha={pen.alpha} ms={ms} scale={1.05} /> : null}
			</svg>
		</AbsoluteFill>
	);
};
