import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {activeLineIndex} from '../../lib/load';
import type {Captions, EpisodeProps} from '../../lib/types';
import {camAt, clamp01, toScreen} from './engine/camera';
import {ensureFonts} from './engine/fonts';
import {Pencil, penAt, World} from './engine/Render';
import {C, FONT_SANS, FPS, H, STAGE, W} from './engine/theme';
import {buildLab01} from './lab01.board';

ensureFonts();

const PAPER_PX = 2048;
const PAPER_Z = 1.25; // 镜头 z=1.25 时纸纹 1:1

/** 阅读字幕：底部一行，关键词琥珀色，念到时下面扫出一道琥珀笔迹 */
const Subtitle: React.FC<{captions: Captions; ms: number}> = ({captions, ms}) => {
	const i = activeLineIndex(captions, ms);
	if (i < 0) return null;
	const line = captions.lines[i];
	const next = captions.lines[i + 1];
	// 行尾停顿很长时（>1.2s）提前隐藏
	const hideAt = next ? Math.min(next.startMs, line.endMs + 1200) : line.endMs + 1500;
	const aIn = clamp01((ms - line.startMs + 60) / 160);
	const aOut = 1 - clamp01((ms - hideAt) / 200);
	const a = Math.min(aIn, aOut);
	if (a <= 0) return null;
	const size = 46;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				width: W,
				top: STAGE.bottom + 36,
				textAlign: 'center',
				fontFamily: FONT_SANS,
				fontSize: size,
				fontWeight: 500,
				letterSpacing: 2,
				color: C.ink,
				opacity: a,
				transform: `translateY(${(1 - aIn) * 8}px)`,
			}}
		>
			{line.chars.map((c, k) => {
				const said = ms >= c.s;
				if (c.t.trim() === '') return <span key={k} style={{display: 'inline-block', width: size * 0.5}} />;
				if (!c.hl) return <span key={k}>{c.t}</span>;
				const u = clamp01((ms - c.s) / Math.max(60, c.e - c.s));
				return (
					<span key={k} style={{position: 'relative', color: said ? C.amberDeep : C.ink, fontWeight: 700}}>
						<span
							style={{
								position: 'absolute',
								left: -2,
								right: -2,
								bottom: 2,
								height: 12,
								background: C.amber,
								opacity: 0.45,
								transformOrigin: 'left',
								transform: `scaleX(${u})`,
								borderRadius: 6,
							}}
						/>
						<span style={{position: 'relative'}}>{c.t}</span>
					</span>
				);
			})}
		</div>
	);
};

export const Lab01Opus: React.FC<EpisodeProps> = ({captions}) => {
	const frame = useCurrentFrame();
	const ms = (frame / FPS) * 1000;
	const board = useMemo(() => (captions ? buildLab01(captions) : null), [captions]);
	const pen = useMemo(() => (board ? board.penEvents() : []), [board]);
	if (!captions || !board) return <AbsoluteFill style={{background: C.paper}} />;
	const view = camAt(board.cams, ms);
	const [ox, oy] = toScreen(view, 0, 0);
	const ps = (PAPER_PX * view.z) / PAPER_Z;
	const st = penAt(pen, ms);
	return (
		<AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					backgroundImage: `url(${staticFile('lab/opus/paper.jpg')})`,
					backgroundSize: `${ps}px ${ps}px`,
					backgroundPosition: `${ox % ps}px ${oy % ps}px`,
				}}
			/>
			<World board={board} view={view} ms={ms} frame={frame} />
			<Pencil st={st} view={view} ms={ms} />
			{/* 字幕区：纸色渐隐，画面内容不压字幕 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: STAGE.bottom - 20,
					width: W,
					height: H - STAGE.bottom + 20,
					background: `linear-gradient(to bottom, rgba(246,241,230,0) 0px, rgba(246,241,230,0.88) 40px, rgba(246,241,230,0.94) 100%)`,
				}}
			/>
			<Subtitle captions={captions} ms={ms} />
			{/* 暗角 */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(60,40,20,0.10) 100%)', pointerEvents: 'none'}} />

			<Html5Audio src={staticFile(captions.audio)} />
			<Html5Audio
				src={staticFile('lab/opus/pencil.wav')}
				loop
				volume={(f) => {
					const t = (f / FPS) * 1000;
					// 前后各看 2 帧做平滑，避免音量突变的咔哒声
					let v = 0;
					for (const d of [-66, -33, 0, 33, 66]) {
						const s = penAt(pen, t + d);
						v += s && s.drawing ? 1 : 0;
					}
					return 0.16 * (v / 5);
				}}
			/>
			{board.whoosh.map((t, k) => (
				<Sequence key={`w${k}`} from={Math.max(0, Math.round((t / 1000) * FPS))} durationInFrames={30}>
					<Html5Audio src={staticFile('lab/opus/whoosh.wav')} volume={0.22} />
				</Sequence>
			))}
			{board.sfx.map((s, k) => (
				<Sequence key={`s${k}`} from={Math.max(0, Math.round((s.t / 1000) * FPS))} durationInFrames={15}>
					<Html5Audio src={staticFile(s.src)} volume={s.vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
