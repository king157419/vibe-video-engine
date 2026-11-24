import type {CalculateMetadataFunction} from 'remotion';
import {staticFile} from 'remotion';
import type {Captions, EpisodeMeta, EpisodeProps} from './types';

export const FPS = 30;
export const TAIL_MS = 3000; // 念完后留给片尾卡（关注引导 + 读书分享声明）的默认时长；样式可在 styles/index.ts 里单独设 tailMs

export const makeCalc = (tailMs: number = TAIL_MS): CalculateMetadataFunction<EpisodeProps> => async ({props}) => {
	const base = `episodes/${props.episode}`;
	const captions: Captions = await fetch(staticFile(`${base}/captions.json`)).then((r) => r.json());
	let meta: EpisodeMeta | null = null;
	try {
		const r = await fetch(staticFile(`${base}/meta.json`));
		if (r.ok) meta = await r.json();
	} catch {
		meta = null;
	}
	return {
		durationInFrames: Math.ceil(((captions.durationMs + tailMs) / 1000) * FPS),
		props: {...props, captions, meta},
	};
};

export const calcEpisode = makeCalc();

/** 当前时刻正在念的行（行间空隙里保持上一行，直到下一行开始） */
export const activeLineIndex = (captions: Captions, ms: number): number => {
	const {lines} = captions;
	let idx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].startMs <= ms) idx = i;
		else break;
	}
	return idx;
};

/** 句子分组：以 sentenceEnd 为界，返回每行所属组号 */
export const groupOf = (captions: Captions): number[] => {
	const out: number[] = [];
	let g = 0;
	for (const l of captions.lines) {
		out.push(g);
		if (l.sentenceEnd) g++;
	}
	return out;
};
