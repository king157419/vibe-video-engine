import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {
	Backdrop,
	C,
	ChapterLabel,
	EndMark,
	GlowCanvas,
	Label,
	ParticleText,
	Subtitles,
	TitleCard,
	titleCenterY,
	Typewriter,
	comet,
	dot,
	ensureV4Fonts,
	hair,
	line,
	partial,
	prog,
	ring,
	sample,
	win,
} from '../kit';

const subs = [
	{t0: 1.2, t1: 5.6, zh: '你伸手，去拿一杯水。', en: 'You reach for a glass of water.'},
	{t0: 6.4, t1: 11.5, zh: '看，比较，修正——再看，再比较，再修正。', en: 'Look. Compare. Correct. And again.'},
	{t0: 17, t1: 22, zh: '整个故事，都从这个圆开始。', en: 'The whole story begins with this circle.'},
];

export const Demo: React.FC = () => {
	ensureV4Fonts();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Backdrop />
			{/* 0–12 s：一个点追另一个点 */}
			<GlowCanvas
				draw={(g, tt) => {
					const a = win(tt, 0.5, 12.5, 0.8, 0.8);
					if (a > 0) {
						const pts = sample((u) => [700 + 520 * u + 60 * Math.sin(u * 9), 620 - 260 * u + 80 * Math.sin(u * 5.5)], 160);
						const p = prog(tt, 1, 11, (x) => x);
						const tail = partial(pts, p).slice(-40);
						comet(g, tail, C.cyan, 2.2, a);
						dot(g, 1240, 340, 26, C.gold, a * 0.9);
					}
					// 16–24 s：圆环
					const b = win(tt, 13, 24, 0.8, 1);
					if (b > 0) {
						const pr = prog(tt, 13.2, 16.5);
						ring(g, 960, 470, 190, C.cyan, 1.6, b * 0.8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr);
						const ang = -Math.PI / 2 + tt * 1.3;
						dot(g, 960 + Math.cos(ang) * 190, 470 + Math.sin(ang) * 190, 30, C.gold, b);
						hair(g, [[960 - 260, 470], [960 + 260, 470]], C.silver, 1, 0.12 * b);
						line(g, [[960, 280], [960, 250]], C.gold, 1.2, b * 0.6);
					}
				}}
			/>
			<Label x={1240} y={300} zh="目标" en="target" color={C.gold} opacity={win(t, 2, 12, 0.6, 0.6) * 0.8} size={20} />
			<ChapterLabel chapters={[{t: 0.6, num: '00', zh: '序', en: 'prologue'}, {t: 13, num: '01', zh: '回路', en: 'the loop'}]} />
			<ParticleText text="控制论" p={prog(t, 24, 28)} cy={titleCenterY(360, 92)} size={92} opacity={win(t, 24, 33, 0.3, 1) * (1 - 0.85 * prog(t, 28.2, 29.4))} burst={prog(t, 31.5, 33)} />
			<TitleCard title="控制论" sub="舵手之学" en="cybernetics · the art of steering" p={prog(t, 27.6, 29.6)} out={prog(t, 31, 32.5)} y={360} titleOpacity={prog(t, 28.2, 29.4)} />
			<Typewriter text="那天夜里，窗外下起了" t={t} t0={34} cps={5} y={400} size={58}>
				<span style={{display: 'inline-block', width: 64, borderBottom: `2px solid ${C.gold}`, marginLeft: 10, boxShadow: `0 6px 14px -6px ${C.gold}`}} />
			</Typewriter>
			<Subtitles subs={subs} />
			<EndMark t={t} from={38} />
		</AbsoluteFill>
	);
};
