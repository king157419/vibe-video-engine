import {type AudioData, useAudioData} from '@remotion/media-utils';
import React, {useMemo} from 'react';
import {Html5Audio, interpolate, staticFile} from 'remotion';

/**
 * 背景音乐：音量跟着人声走 —— 渲染时量一下人声和音乐的响度（门限 RMS，近似 LUFS），
 * 让音乐整体比人声低约 20 dB。这样占位 TTS（约 -24 LUFS）和正式录音（clean_audio.py 归一到 -14 LUFS）
 * 都能得到合适的比例，不用手调。
 * 片头 1s 淡入；人声结束后稍微抬起来一点，片尾卡不是死寂；最后 1.5s 淡出。
 */

const BELOW_VOICE_DB = 20;
// 门限 RMS（不加 K 计权）→ LUFS 的校准量：用 ffmpeg ebur128 对 demo / EP01 人声和默认钢琴实测
// （art-src/illustration/tools/gated.py，同一算法）
const VOICE_TO_LUFS = -0.2;
const MUSIC_TO_LUFS = 1.7;
const GAIN_RANGE_DB: [number, number] = [-36, -2];
const END_SWELL = 1.45; // 片尾卡时 +3 dB

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 400ms 块、75% 重叠的均方功率（各声道平均）；先去掉静音块，再做 -10 dB 的相对门限（仿 BS.1770 的门限方式） */
const gatedDb = (data: AudioData): number | null => {
	const chs = data.channelWaveforms;
	if (!chs.length) return null;
	const len = chs[0].length;
	const n = Math.round(data.sampleRate * 0.4);
	if (len < n) return null;
	const pre = new Float64Array(len + 1);
	for (let k = 0; k < len; k++) {
		// 各声道功率取平均（不先混成单声道：立体声混响相互抵消会让音乐被低估约 3 dB）
		let p = 0;
		for (const c of chs) p += c[k] * c[k];
		pre[k + 1] = pre[k] + p / chs.length;
	}
	const hop = Math.max(1, Math.round(n / 4));
	const blocks: number[] = [];
	for (let i = 0; i + n <= len; i += hop) {
		const p = (pre[i + n] - pre[i]) / n;
		if (p > 1e-7) blocks.push(p);
	}
	if (!blocks.length) return null;
	const rel = (blocks.reduce((a, b) => a + b, 0) / blocks.length) * 0.1;
	const kept = blocks.filter((b) => b > rel);
	const mean = kept.reduce((a, b) => a + b, 0) / Math.max(1, kept.length);
	return 10 * Math.log10(mean);
};

export const Bgm: React.FC<{
	voice: string;
	music: string;
	fps: number;
	totalMs: number;
	/** 片尾卡开始的时刻（ms） */
	endStart: number;
}> = ({voice, music, fps, totalMs, endStart}) => {
	const voiceData = useAudioData(staticFile(voice));
	const musicData = useAudioData(staticFile(music));
	const gain = useMemo(() => {
		if (!voiceData || !musicData) return null;
		const v = gatedDb(voiceData);
		const m = gatedDb(musicData);
		if (v === null || m === null) return null;
		const db = v + VOICE_TO_LUFS - BELOW_VOICE_DB - (m + MUSIC_TO_LUFS);
		return 10 ** (Math.max(GAIN_RANGE_DB[0], Math.min(GAIN_RANGE_DB[1], db)) / 20);
	}, [voiceData, musicData]);
	if (gain === null) return null;
	return (
		<Html5Audio
			src={staticFile(music)}
			loop
			loopVolumeCurveBehavior="extend"
			volume={(f) => {
				const t = (f / fps) * 1000;
				const fadeIn = interpolate(t, [0, 1000], [0, 1], clamp);
				const swell = interpolate(t, [endStart - 100, endStart + 900], [1, END_SWELL], clamp);
				const fadeOut = interpolate(t, [totalMs - 1500, totalMs - 40], [1, 0], clamp);
				return gain * fadeIn * swell * fadeOut;
			}}
		/>
	);
};
