/** C《赫布》V4Hebb：287.8 秒（2026-10-12 片尾加了三次重新配对，+6.0 s）。字幕是时钟（subs.json，播放时间），画面锚点来自 timeline_meta.json（场景时间）。
 *  播放时间 t = frame / fps；场景时间 τ = toScene(t)（见 data.ts）。画面全部按 τ 画，字幕、章节签、配乐按 t。 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, ChapterLabel, FONT_ZH, GlowCanvas, Subtitles, clamp, ensureV4Fonts, inv, smooth, win} from '../kit';
import {BACKDROP, Backdrop} from './lib/Backdrop';
import {FPS, chapters, meta, subs, toPlay, toScene} from './data';
import {Overlay} from './Overlay';
import {camReset} from './lib/core';
import {drawGrain, eraseEllipse, globalBloom} from './lib/grain';
import {useAssets} from './lib/title';
import {drawEndTitle, drawPrologue, prologueMask} from './scenes/s0';
import {drawWire} from './scenes/s1';
import {drawTrace} from './scenes/s2';
import {drawPaths} from './scenes/s3';
import {blackoutK, drawPrune, drawRL} from './scenes/s4';
import {drawHope} from './scenes/s5';
import {codaMask, drawBecoming, drawCoda} from './scenes/s6';

/** 章与章之间的近黑过渡（场景时间）：星尘也一起压暗 */
const DIMS: [number, number, number, number][] = [
	[170.6, 171.3, 172.0, 172.6], // III → IV：真的暗场约 0.8 s（审片：不要交叉叠印）
	[206.6, 207.3, 207.6, 208.3],
	[222.2, 222.9, 223.2, 223.9],
	[237.5, 238.2, 238.5, 239.2],
	[269.4, 270.0, 270.2, 270.9],
];
const dimAt = (t: number) => {
	let d = 0;
	for (const [a, b, c, e] of DIMS) d = Math.max(d, 0.6 * Math.min(smooth(inv(a, b, t)), 1 - smooth(inv(c, e, t))));
	// 鲁迅那一段是「纯黑」：星尘压到很淡（仍在动）
	d = Math.max(d, 0.45 * smooth(inv(238.3, 239.0, t)) * (1 - smooth(inv(245.9, 248.0, t))));
	// 硬静音（190.4–191.9）：网淡到近黑时，底也一起压暗一半（星尘仍在飘）
	d = Math.max(d, 0.5 * (1 - blackoutK(t)));
	return d;
};

/** 星尘的时钟：序里等光的那 10 秒漂得快一倍（审片：留白里也要有呼吸）。是速度的积分，所以不会跳 */
const dustClock = (tau: number) => {
	const ramp = (x: number, a: number, b: number) => {
		// ∫ smoothstep 的近似：分段，起止各 1 s 缓冲
		if (x <= a) return 0;
		if (x >= b) return b - a;
		return x - a;
	};
	const up = ramp(tau, 11.0, 12.0) * 0.5 + ramp(tau, 12.0, 21.0) + ramp(tau, 21.0, 22.0) * 0.5;
	return tau + up;
};

/** 章节签的位置（kit ChapterLabel：左上 76, 62）；章节签出现的那几秒，把它背后的光擦掉一些 */
const labelErase = (tau: number) => {
	let k = 0;
	for (const c of meta.chapters) k = Math.max(k, win(tau, c.t, c.t + 3.8, 0.8, 1.2));
	return k;
};

/** 身份标记（kit EndMark 只有 0.55 × #5b6168 ≈ 54/255，手机上读不出来）：#8a8f93、16 px */
const EndMark: React.FC<{t: number; from: number; text: string}> = ({t, from, text}) => {
	const a = clamp((t - from) / 0.6);
	if (a <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 42, textAlign: 'center', opacity: a, fontFamily: FONT_ZH, fontWeight: 380, fontSize: 17, color: '#8a8f93', letterSpacing: '0.3em', textShadow: '0 0 10px rgba(0,0,0,0.9)'}}>
			{text}
		</div>
	);
};

export const HebbVideo: React.FC = () => {
	ensureV4Fonts();
	const As = useAssets();
	const frame = useCurrentFrame();
	const t = frame / FPS; // 播放时间
	const tau = toScene(t); // 场景时间
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Backdrop tint={C.bg} dust={150} glow={0.05} dim={dimAt(tau)} mask={prologueMask(tau) ?? codaMask(tau)} clock={dustClock(tau)} />
			<GlowCanvas
				draw={(g, _tt, fr) => {
					const reset = () => {
						camReset(g);
						g.globalAlpha = 1;
						g.globalCompositeOperation = 'lighter';
						g.setLineDash([]);
						g.filter = 'none';
					};
					const steps = [
						() => drawPrologue(g, tau, As),
						() => drawWire(g, tau, As),
						() => drawTrace(g, tau),
						() => drawPaths(g, tau),
						() => drawPrune(g, tau, fr),
						() => drawRL(g, tau),
						() => drawHope(g, tau, As),
						() => drawBecoming(g, tau),
						() => drawCoda(g, tau),
						() => drawEndTitle(g, tau, As),
					];
					for (const s of steps) {
						reset();
						s();
					}
					reset();
					// 章节签背后：线让开（审片：IV 章节签被金路穿过）
					eraseEllipse(g, 200, 82, 330, 92, labelErase(tau));
					// 背景垫到发光层下面（结果和浏览器把两层叠起来一样：C + (1 − α)·B），之后整层不透明，
					// 光晕和颗粒用 'lighter' 叠上去不会把背景盖黑（Backdrop 组件的 layout effect 先于这里执行）
					if (BACKDROP.cv) {
						g.setTransform(1, 0, 0, 1, 0, 0);
						g.globalAlpha = 1;
						g.globalCompositeOperation = 'destination-over';
						g.drawImage(BACKDROP.cv, 0, 0);
						g.globalCompositeOperation = 'lighter';
					}
					// IV 章满屏的线：光晕减半（否则整帧平均亮度超过 50/255）
					const bk = 1 - 0.65 * smooth(inv(177, 185, tau)) * (1 - smooth(inv(205.5, 207.2, tau)));
					globalBloom(g, 0.6 * bk, 0.5 * bk);
					drawGrain(g, fr, 1);
					reset();
				}}
			/>
			<Overlay t={tau} />
			<ChapterLabel chapters={chapters} dur={3.8} />
			<Subtitles subs={subs} />
			<EndMark t={t} from={toPlay(meta.endmark.t[0])} text={meta.endmark.text} />
			<Audio src={staticFile('v4/hebb/mix.wav')} />
		</AbsoluteFill>
	);
};
