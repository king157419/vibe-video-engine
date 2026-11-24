import React from 'react';
import type {CalculateMetadataFunction} from 'remotion';
import {Composition, staticFile} from 'remotion';
import type {Captions, Numbers, RiceProps} from './data';
import {FPS, H, TAIL_S, W} from './theme';
import {RiceVideo} from './Video';

// 样片二《煮不死的种子》· 16:9。时长 = 配音（captions.json 的 durationMs）+ 3 秒终局卡定格。
const calc: CalculateMetadataFunction<RiceProps> = async ({props}) => {
	const captions: Captions = await fetch(staticFile('v3/rice/captions.json')).then((r) => r.json());
	const numbers: Numbers = await fetch(staticFile('v3/rice/numbers.json')).then((r) => r.json());
	return {
		durationInFrames: Math.ceil((captions.durationMs / 1000 + TAIL_S) * FPS),
		props: {...props, captions, numbers},
	};
};

export const RiceRoot: React.FC = () => (
	<Composition
		id="V3Rice"
		component={RiceVideo}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={FPS * 60}
		defaultProps={{captions: null, numbers: null} as RiceProps}
		calculateMetadata={calc}
	/>
);
