import type {MediaUtilsAudioData} from '@remotion/media-utils';
import {visualizeAudio} from '@remotion/media-utils';
import {clamp01} from './theme';

/** 以 sec 为中心、windowSec 宽的 RMS，映射到 0..1 的「响度」（-46dB→0，-12dB→1） */
export const loudnessAt = (data: MediaUtilsAudioData | null, sec: number, windowSec: number): number => {
	if (!data) return 0;
	const ch = data.channelWaveforms[0];
	if (!ch || !ch.length) return 0;
	const sr = data.sampleRate;
	const c = Math.floor(sec * sr);
	const half = Math.max(1, Math.floor((windowSec * sr) / 2));
	const a = Math.max(0, c - half);
	const b = Math.min(ch.length, c + half);
	if (b <= a) return 0;
	const step = Math.max(1, Math.floor((b - a) / 1800));
	let sum = 0;
	let n = 0;
	for (let i = a; i < b; i += step) {
		sum += ch[i] * ch[i];
		n++;
	}
	const rms = Math.sqrt(sum / Math.max(1, n));
	const db = 20 * Math.log10(rms + 1e-9);
	return clamp01((db + 46) / 34);
};

export const SPECTRUM_SAMPLES = 256;

/** 当前帧的频谱（前后几帧加权平滑，避免 30fps 下的抖动），数值已转成 0..1 的对数刻度 */
export const spectrumAt = (data: MediaUtilsAudioData | null, frame: number, fps: number): number[] | null => {
	if (!data) return null;
	const lastFrame = Math.floor(data.durationInSeconds * fps) - 2;
	const weights: [number, number][] = [
		[-2, 0.15],
		[-1, 0.25],
		[0, 0.35],
		[1, 0.25],
	];
	let acc: number[] | null = null;
	let wsum = 0;
	for (const [off, w] of weights) {
		const f = frame + off;
		if (f < 0 || f > lastFrame) continue;
		const bins = visualizeAudio({audioData: data, frame: f, fps, numberOfSamples: SPECTRUM_SAMPLES, optimizeFor: 'speed'});
		if (!acc) acc = new Array(bins.length).fill(0);
		for (let i = 0; i < bins.length; i++) acc[i] += (Number.isFinite(bins[i]) ? bins[i] : 0) * w;
		wsum += w;
	}
	if (!acc || wsum === 0) return null;
	return acc.map((v) => clamp01((20 * Math.log10(v / wsum + 1e-9) + 72) / 52));
};
