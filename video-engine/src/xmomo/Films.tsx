import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const IV = '#F4ECDF', GOLD = '#F2C27A', LAV = '#C9B3F0', MINT = '#A8E6CF';
const fontCss = `
@font-face{font-family:XSerif;src:url(${staticFile('xmomo/NotoSerif-Regular.ttf')});}
@font-face{font-family:XItal;src:url(${staticFile('xmomo/NotoSerif-Italic.ttf')});}`;
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);

// A line is a list of words; a word wrapped in *stars* is the emphasis: italic, larger, gold
// (lavender / mint for those colour names), and it springs in.
type Line = {text: string; size?: number; color?: string; caps?: boolean};
const Word: React.FC<{w: string; size: number; color: string; delay: number; caps?: boolean}> = ({w, size, color, delay, caps}) => {
	const fr = useCurrentFrame();
	const {fps} = useVideoConfig();
	const m = w.match(/^\*(.+?)\*([.,!?]?)$/);
	if (m) {
		const word = m[1];
		const punct = m[2] || '';
		const lw = word.toLowerCase();
		const colr = lw.startsWith('lavender') ? LAV : lw.startsWith('mint') ? MINT : GOLD;
		const sp = spring({frame: fr - delay, fps, config: {damping: 14, stiffness: 120}});
		return (
			<span style={{fontFamily: 'XItal', fontSize: size * 1.45, color: colr, display: 'inline-block', lineHeight: 1,
				transform: `translateY(${(1 - sp) * 18}px) scale(${0.85 + 0.15 * sp})`, opacity: sp, margin: '0 0.16em'}}>
				{word}<span style={{fontFamily: 'XSerif', fontSize: size, color}}>{punct}</span>
			</span>
		);
	}
	return <span style={{fontFamily: 'XSerif', fontSize: size, color, margin: '0 0.12em', letterSpacing: caps ? '0.22em' : 0}}>{w}</span>;
};
const Caption: React.FC<{lines: Line[]; dur: number; center?: boolean}> = ({lines, dur, center}) => {
	const fr = useCurrentFrame();
	const op = interpolate(fr, [0, 7, dur - 7, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: center ? 'flex-start' : 'flex-end', alignItems: 'center', paddingBottom: center ? 0 : 64, paddingTop: center ? 40 : 0, opacity: op}}>
			{lines.map((l, i) => (
				<div key={i} style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap', marginTop: 6,
					textShadow: '0 2px 14px rgba(0,0,0,.65), 0 0 2px rgba(0,0,0,.5)'}}>
					{(l.text.match(/\*[^*]+\*[.,!?]?|\S+/g) ?? []).map((w, j) => (
						<Word key={j} w={w} size={l.size ?? 40} color={l.color ?? IV} caps={l.caps} delay={6 + i * 4} />
					))}
				</div>
			))}
		</AbsoluteFill>
	);
};
const Scrim: React.FC<{strong?: boolean}> = ({strong}) => (
	<AbsoluteFill style={{background: strong
		? 'linear-gradient(to bottom, rgba(10,6,8,.6) 0%, rgba(10,6,8,.25) 38%, rgba(10,6,8,0) 55%)'
		: 'linear-gradient(to top, rgba(10,6,8,.72) 0%, rgba(10,6,8,.35) 28%, rgba(10,6,8,0) 48%)'}} />
);
const Clip: React.FC<{src: string; push?: boolean}> = ({src, push}) => {
	const fr = useCurrentFrame();
	const sc = push ? 1 + fr * 0.0006 : 1;
	return (
		<AbsoluteFill style={{transform: `scale(${sc})`}}>
			<OffthreadVideo src={staticFile(`xmomo/${src}.mp4`)} muted />
		</AbsoluteFill>
	);
};

// End card. The logo slot shows the word mark until a logo file in /public is passed as props.logo.
const EndCard: React.FC<{logo: string; shop?: boolean}> = ({logo, shop}) => {
	const fr = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = spring({frame: fr, fps, config: {damping: 20}});
	const b = spring({frame: fr - 8, fps, config: {damping: 14, stiffness: 110}});
	const c = interpolate(fr, [16, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const line = interpolate(fr, [4, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, #3A1426 0%, #12060c 70%, #070305 100%)', alignItems: 'center', justifyContent: 'center', color: IV}}>
			<div style={{opacity: a, transform: `translateY(${(1 - a) * 12}px)`, textAlign: 'center'}}>
				{logo ? <Img src={staticFile(logo)} style={{height: 84}} /> :
					<div style={{fontFamily: 'XSerif', fontSize: 104, letterSpacing: '0.04em', lineHeight: 1}}>xmomo</div>}
			</div>
			<div style={{width: 260 * line, height: 1, background: GOLD, margin: '22px 0 26px', opacity: 0.8}} />
			<div style={{opacity: b, transform: `scale(${0.9 + 0.1 * b})`, fontFamily: 'XItal', color: GOLD, fontSize: 58, lineHeight: 1.1}}>15% off your first order</div>
			<div style={{opacity: c, fontFamily: 'XSerif', fontSize: 24, letterSpacing: '0.3em', marginTop: 16}}>CODE WELCOME15</div>
			<div style={{opacity: c, fontFamily: 'XSerif', fontSize: 30, marginTop: 30}}>{shop ? 'Shop now at ' : ''}xmomoshop.com</div>
			<div style={{opacity: c * 0.7, position: 'absolute', bottom: 34, fontFamily: 'XSerif', fontSize: 17, color: '#cdb9ae'}}>Free shipping over $99 · 30-day returns</div>
		</AbsoluteFill>
	);
};

const Font = () => <style>{fontCss}</style>;
type Cap = [number, number, Line[], boolean?];
const Captions: React.FC<{caps: Cap[]}> = ({caps}) => (
	<>
		{caps.map(([a, b, lines, center], i) => (
			<Sequence key={i} from={f(a)} durationInFrames={f(b - a)}>
				<Caption lines={lines} dur={f(b - a)} center={center} />
			</Sequence>
		))}
	</>
);

// ================= brand film, 30 s =================
const BRAND: [string, number, number][] = [['s1', 0, 3], ['s2', 3, 7], ['s3', 7, 12], ['s4', 12, 15], ['s5', 15, 18], ['s6', 18, 21], ['s7', 21, 24], ['s8', 24, 27]];
export const Brand: React.FC<{logo: string}> = ({logo}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Font />
		{BRAND.map(([s, a, b]) => (
			<Sequence key={s} from={f(a)} durationInFrames={f(b - a)}><Clip src={s} /></Sequence>
		))}
		<Sequence durationInFrames={f(27)}><Scrim /></Sequence>
		<Captions caps={[
			[0.3, 3.0, [{text: 'Cotton *soaks* it up.'}]],
			[3.3, 7.0, [{text: '30 seconds on.', size: 36}, {text: '*8 hours* to lose it.'}]],
			[7.4, 12.0, [{text: 'Silk absorbs *less.*'}]],
			[12.2, 15.0, [{text: '22 MOMME · 6A GRADE · 100% MULBERRY SILK', size: 24, color: GOLD, caps: true}]],
			[15.3, 18.0, [{text: 'SILK PILLOWCASE', size: 25, color: GOLD, caps: true}, {text: '*Less* friction than cotton.'}]],
			[18.3, 21.0, [{text: '3D SLEEP MASK', size: 25, color: GOLD, caps: true}, {text: '*Zero* pressure.'}]],
			[21.3, 24.0, [{text: 'REVERSIBLE SILK BONNET', size: 25, color: GOLD, caps: true}, {text: '*Lavender* or *mint.*'}]],
			[24.3, 27.0, [{text: "Beauty sleep shouldn't be a *metaphor.*"}]],
		]} />
		<Sequence from={f(27)} durationInFrames={f(3)}><EndCard logo={logo} /></Sequence>
	</AbsoluteFill>
);

// ================= ad, 15 s: the pain in the first 3 s, then the fix =================
const AD: [string, number, number, boolean?][] = [['s1', 0, 3, true], ['a2', 3, 5], ['a3', 5, 9], ['s5', 9, 12]];
export const Ad: React.FC<{logo: string}> = ({logo}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<Font />
		{AD.map(([s, a, b, push]) => (
			<Sequence key={s} from={f(a)} durationInFrames={f(b - a)}><Clip src={s} push={push} /></Sequence>
		))}
		<Sequence durationInFrames={f(3)}><Scrim strong /></Sequence>
		<Sequence from={f(3)} durationInFrames={f(9)}><Scrim /></Sequence>
		<Captions caps={[
			[0.0, 3.0, [{text: 'Your pillowcase is', size: 54}, {text: '*drinking* your skincare.', size: 54}], true],
			[3.1, 5.0, [{text: '*8 hours* on cotton.'}]],
			[5.2, 9.0, [{text: 'Silk absorbs *less.*'}, {text: 'Your skincare stays on your skin.', size: 30}]],
			[9.2, 12.0, [{text: 'SILK PILLOWCASE · 22 MOMME', size: 25, color: GOLD, caps: true}, {text: '*Pure* mulberry silk.'}]],
		]} />
		<Sequence from={f(12)} durationInFrames={f(3)}><EndCard logo={logo} shop /></Sequence>
	</AbsoluteFill>
);
