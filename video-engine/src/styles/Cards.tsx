import {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../lib/fonts';
import type {EpisodeProps} from '../lib/types';
import {useFontsReady, useScript} from './cards/hooks';
import {buildLayout} from './cards/layout';
import {
	Backdrop,
	BookStrip,
	CaptionCardBody,
	CardShell,
	CoverBody,
	deckPoses,
	EndBody,
	Flights,
	NeedsBody,
	Progress,
	TopRow,
	Tracker,
} from './cards/parts';
import {scriptPunct} from './cards/punct';
import {clamp01, G} from './cards/theme';

ensureFonts();

// 样式 D「知识卡片」：奶油点阵底 + 一叠白色卡片。一句话一张卡，顶卡甩走、下面那张（早已排好字）弹上来；
// 卡拉 OK 逐字点亮，关键词色块划线；说到「五种需要」时 chip 从字上飞进顶部追踪条。
export const Cards: React.FC<EpisodeProps> = ({episode, captions, meta}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const ready = useFontsReady();
	const script = useScript(captions ? episode : undefined);
	const punct = useMemo(
		() => (captions && script !== undefined ? scriptPunct(captions, script) : null),
		[captions, script],
	);
	const L = useMemo(
		() => (captions && script !== undefined ? buildLayout(captions, meta, ready, punct, fps) : null),
		[captions, meta, ready, punct, script, fps],
	);

	if (!captions || !L) return <Backdrop frame={frame} />;

	const t = (frame / fps) * 1000;
	const f = (ms: number) => (ms / 1000) * fps;

	// 顶部信息层在封面甩走之后再淡入（不与封面重叠）
	const coverOutF = f(L.coverOutMs);
	const chrome = interpolate(frame, [coverOutF + G.flick, coverOutF + 2 * G.flick], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// 片尾卡本身就汇总了五种需要：追踪条让位
	const endFade = 1 - clamp01((frame - f(L.endInMs)) / 8);

	const poses = deckPoses(L, frame, fps);

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Backdrop frame={frame} />
			<Html5Audio src={staticFile(captions.audio)} />

			{poses.map((pose) => {
				const {item} = pose;
				const dy = (pose.h - item.h) / 2; // 正文锚在卡片竖直中心，卡片高度过渡时不跳
				let body: React.ReactNode = null;
				if (pose.withBody) {
					if (item.kind === 'cover') body = <CoverBody L={L} h={item.h} />;
					else if (item.kind === 'end') body = <EndBody L={L} frame={frame} fps={fps} dy={dy} />;
					else {
						const card = L.cards[item.card];
						body =
							card.kind === 'needs' ? (
								<NeedsBody card={card} total={L.cards.length} frame={frame} fps={fps} dy={dy} />
							) : (
								<CaptionCardBody
									card={card}
									total={L.cards.length}
									captions={captions}
									t={t}
									frame={frame}
									fps={fps}
									disp={L.disp}
									dy={dy}
								/>
							);
					}
				}
				return (
					<CardShell key={pose.idx} pose={pose}>
						{body}
					</CardShell>
				);
			})}

			{/* 书目条常驻：封面上它就是封面底部的出处，之后填补卡片下方空白 */}
			<BookStrip L={L} />

			{/* 顶部信息层在最上面：甩走的卡片从它下面退出 */}
			<TopRow L={L} seriesOpacity={chrome} />
			<Progress p={clamp01(frame / Math.max(1, durationInFrames - 1))} opacity={chrome} />
			{L.hasTracker ? <Tracker L={L} frame={frame} fps={fps} opacity={chrome * endFade} /> : null}
			<Flights L={L} frame={frame} fps={fps} />
		</AbsoluteFill>
	);
};
