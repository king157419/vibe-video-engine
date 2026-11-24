import type {CalculateMetadataFunction} from 'remotion';
import {Composition, staticFile} from 'remotion';
import type {Beats, Numbers, Props, Sub} from './data';
import {FPS, H, W} from './theme';
import {Video} from './Video';

/** 片尾在最后一句字幕之后再留的秒数（终局图 + 画面留题；和 build_subs.py 的 TAIL 一致） */
const TAIL_SEC = 3.6;

const calc: CalculateMetadataFunction<Props> = async () => {
	const get = async <T,>(p: string): Promise<T> => (await fetch(staticFile(`v3/nightowl/${p}`))).json();
	const [subs, beats, nums] = await Promise.all([get<Sub[]>('subs.json'), get<Beats>('beats.json'), get<Numbers>('numbers.json')]);
	const lastEnd = subs[subs.length - 1].t1;
	return {
		durationInFrames: Math.ceil((lastEnd + TAIL_SEC) * FPS),
		props: {subs, beats, nums},
	};
};

export const Root: React.FC = () => (
	<Composition
		id="V3Night"
		component={Video}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={5000}
		defaultProps={{subs: null, beats: null, nums: null} as Props}
		calculateMetadata={calc}
	/>
);
