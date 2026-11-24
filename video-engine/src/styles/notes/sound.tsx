import {useAudioData} from '@remotion/media-utils';
import type React from 'react';
import {useMemo} from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import type {Captions} from '../../lib/types';

/**
 * 本样式自带的垫乐 + 两个小音效（make_sound.py 合成，无版权问题）。
 * 音量跟着人声走：先量出配音的平均电平，垫乐放在它下面 ~21dB；说话时再压 4dB，停顿时抬回来；
 * 片头 0.4s 淡入，片尾 1.2s 淡出。meta.bgm=false 可整段关掉（比如管线以后统一混配乐）。
 */
const BED = 'styles/notes/bed.m4a';
const SWIPE = 'styles/notes/swipe.wav';
const PAPER = 'styles/notes/paper.wav';
const BED_MEAN_DB = -20.0; // ffmpeg volumedetect 测的 bed.m4a mean_volume（重新生成后要更新）
const UNDER_DB = 20; // 垫乐均值比人声均值低多少（成片里停顿处约低 22dB）
const PAUSE_LIFT = 1.55; // 停顿时抬高 ~3.8dB
const REF_VOICE_DB = -25.6; // 调音效时参考的人声均值（demo 的占位配音）

export type SfxEvent = {ms: number; kind: 'swipe' | 'paper'};

export const NotesSound: React.FC<{fps: number; durationInFrames: number; captions: Captions; events: SfxEvent[]}> = ({fps, durationInFrames, captions, events}) => {
	const voice = useAudioData(staticFile(captions.audio), {sampleRate: 16000});
	const voiceDb = useMemo(() => {
		if (!voice) return null;
		const ch = voice.channelWaveforms[0];
		let s = 0;
		for (let i = 0; i < ch.length; i++) s += ch[i] * ch[i];
		return 10 * Math.log10(s / Math.max(1, ch.length) + 1e-12);
	}, [voice]);

	// 每帧的垫乐音量（说话压低、停顿抬起，前后各平滑一遍，不会一跳一跳）
	const vol = useMemo(() => {
		const n = durationInFrames;
		const speak = new Float32Array(n);
		for (const l of captions.lines) {
			const a = Math.max(0, Math.floor(((l.startMs - 150) / 1000) * fps));
			const b = Math.min(n - 1, Math.ceil(((l.endMs + 250) / 1000) * fps));
			for (let f = a; f <= b; f++) speak[f] = 1;
		}
		const g = new Float32Array(n);
		for (let f = 0; f < n; f++) g[f] = speak[f] ? 1 : PAUSE_LIFT;
		const k = 0.12;
		for (let f = 1; f < n; f++) g[f] = g[f - 1] + (g[f] - g[f - 1]) * k;
		for (let f = n - 2; f >= 0; f--) g[f] = g[f + 1] + (g[f] - g[f + 1]) * k;
		const fadeIn = Math.round(0.4 * fps);
		const fadeOut = Math.round(1.2 * fps);
		for (let f = 0; f < n; f++) {
			const fi = Math.min(1, (f + 1) / fadeIn);
			const fo = Math.min(1, (n - 1 - f) / fadeOut);
			g[f] *= fi * Math.max(0, fo) ** 1.5;
		}
		return g;
	}, [captions, durationInFrames, fps]);

	if (voiceDb === null) return null;
	const base = 10 ** ((voiceDb - BED_MEAN_DB - UNDER_DB) / 20);
	const rel = 10 ** ((voiceDb - REF_VOICE_DB) / 20);
	const sfxLen = Math.ceil(0.5 * fps);

	return (
		<>
			<Html5Audio src={staticFile(BED)} loop loopVolumeCurveBehavior="extend" volume={(f) => base * (vol[Math.min(vol.length - 1, Math.max(0, f))] ?? 0)} />
			{events.map((e, i) => {
				const from = Math.round((e.ms / 1000) * fps);
				if (from < 0 || from >= durationInFrames - 2) return null;
				return (
					<Sequence key={i} from={from} durationInFrames={Math.min(sfxLen, durationInFrames - from)} layout="none">
						<Html5Audio src={staticFile(e.kind === 'swipe' ? SWIPE : PAPER)} volume={rel * (e.kind === 'swipe' ? 0.05 : 0.1)} />
					</Sequence>
				);
			})}
		</>
	);
};
