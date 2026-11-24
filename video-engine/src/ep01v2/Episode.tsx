import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {Captions, SectionInfo} from '../whiteboard';
import {C, camAt, CaptionBand, clamp01, ensureFonts, FONT_HAND, FPS, Pencil, penAt, SFX, STAGE, toScreen, W, World} from '../whiteboard';
import {buildEpisode} from './build';

ensureFonts();

export type EpisodeProps = {
	episode: string;
	/** QA 模式：关掉镜头漂移/推近和线条呼吸，给 freezedetect 用 */
	qa?: boolean;
	/** wb_lint.mjs 用：calculateMetadata 里构建并自检 */
	lint?: boolean;
	captions: Captions | null;
	sections: SectionInfo[] | null;
	lintReport?: unknown;
};

const PAPER_PX = 2048;
const PAPER_Z = 1.25; // 镜头 z=1.25 时纸纹 1:1
const DISCLAIMER = '读书分享与个人理解，非心理咨询';

export const Episode: React.FC<EpisodeProps> = ({captions, sections, qa}) => {
	const frame = useCurrentFrame();
	const ms = (frame / FPS) * 1000;
	const built = useMemo(() => (captions && sections ? buildEpisode(captions, sections) : null), [captions, sections]);
	const pen = useMemo(() => (built ? built.board.penEvents() : []), [built]);
	if (!captions || !sections || !built) return <AbsoluteFill style={{background: C.paper}} />;
	const {board} = built;
	const view = camAt(board.cams, ms, {drift: !qa, push: !qa});
	const [ox, oy] = toScreen(view, 0, 0);
	const ps = (PAPER_PX * view.z) / PAPER_Z;
	const st = penAt(pen, ms, board);
	const last = sections[sections.length - 1];
	// 片尾免责声明：最后一段开始后在字幕带右侧小字常驻；旁白念完、最后一行字幕消失后移到字幕带正中
	// 集成修正：+1500 时居中声明要到片尾前 0.5 秒才出现；最后一行字幕在旁白结束时已消失，提前到 +300。
	const tEnd = captions.durationMs + 300;
	const aSide = clamp01((ms - last.startMs) / 600) * (1 - clamp01((ms - tEnd) / 300));
	const aMid = clamp01((ms - tEnd - 300) / 500);
	const note = (a: number, align: 'right' | 'center', size: number) =>
		a > 0 ? (
			<div
				style={{
					position: 'absolute',
					top: align === 'right' ? STAGE.bottom + 96 : STAGE.bottom + 50,
					left: 0,
					width: W,
					padding: '0 48px',
					boxSizing: 'border-box',
					textAlign: align,
					fontFamily: FONT_HAND,
					fontSize: size,
					color: C.pencilDark,
					opacity: a,
					letterSpacing: 2,
				}}
			>
				{DISCLAIMER}
			</div>
		) : null;
	const footnote = (
		<>
			{note(aSide, 'right', 26)}
			{note(aMid, 'center', 38)}
		</>
	);
	return (
		<AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					backgroundImage: `url(${staticFile('wb/paper.jpg')})`,
					backgroundSize: `${ps}px ${ps}px`,
					backgroundPosition: `${ox % ps}px ${oy % ps}px`,
				}}
			/>
			<World board={board} view={view} ms={ms} frame={frame} boil={!qa} />
			<Pencil st={st} view={view} ms={ms} />
			<CaptionBand captions={captions} ms={ms} footnote={footnote} />
			{/* 暗角 */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(60,40,20,0.09) 100%)', pointerEvents: 'none'}} />

			<Html5Audio src={staticFile(captions.audio)} />
			<Html5Audio
				src={staticFile(SFX.pencil)}
				loop
				volume={(f) => {
					const t = (f / FPS) * 1000;
					// 前后各看 2 帧做平滑，避免音量突变的咔哒声
					let v = 0;
					for (const d of [-66, -33, 0, 33, 66]) {
						const s = penAt(pen, t + d);
						v += s && s.drawing ? 1 : 0;
					}
					return 0.15 * (v / 5);
				}}
			/>
			{board.whoosh.map((t, k) => (
				<Sequence key={`w${k}`} from={Math.max(0, Math.round((t / 1000) * FPS))} durationInFrames={30}>
					<Html5Audio src={staticFile(SFX.whoosh)} volume={0.2} />
				</Sequence>
			))}
			{board.sfx.map((s, k) => (
				<Sequence key={`s${k}`} from={Math.max(0, Math.round((s.t / 1000) * FPS))} durationInFrames={Math.round(((s.dur ?? 700) / 1000) * FPS)}>
					<Html5Audio src={staticFile(s.src)} volume={s.vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
