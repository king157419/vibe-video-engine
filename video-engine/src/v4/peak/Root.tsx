import React from 'react';
import type {CalculateMetadataFunction} from 'remotion';
import {Composition, staticFile} from 'remotion';
import {FPS, H, W} from '../kit/theme';
import type {Cue, Numbers, PeakProps} from './data';
import {Video} from './Video';

// 片长按 cue.json 的 dur（284.5 s = 8535 帧），字幕、配乐表、画面要用的数都从 public/v4/peak/ 读
const calc: CalculateMetadataFunction<PeakProps> = async ({props}) => {
	const [subs, cue, num] = await Promise.all([
		fetch(staticFile('v4/peak/subs.json')).then((r) => r.json()),
		fetch(staticFile('v4/peak/cue.json')).then((r) => r.json() as Promise<Cue>),
		fetch(staticFile('v4/peak/numbers.json')).then((r) => r.json() as Promise<Numbers>),
	]);
	return {durationInFrames: Math.round(cue.dur * FPS), props: {...props, subs, cue, num}};
};

export const PeakRoot: React.FC = () => (
	<Composition
		id="V4Peak"
		component={Video}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={8535}
		defaultProps={{subs: null, cue: null, num: null} as PeakProps}
		calculateMetadata={calc}
	/>
);
