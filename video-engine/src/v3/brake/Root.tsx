import React from 'react';
import type {CalculateMetadataFunction} from 'remotion';
import {Composition, staticFile} from 'remotion';
import type {Captions} from '../../lib/types';
import type {BrakeProps, Numbers} from './data';
import {FPS, H, TAIL_S, W} from './theme';
import {Video} from './Video';

// 时长 = 配音时长 + 2.6 s 片尾（分镜表 §0），不写死
export const calc: CalculateMetadataFunction<BrakeProps> = async ({props}) => {
	const captions: Captions = await fetch(staticFile('v3/brake/captions.json')).then((r) => r.json());
	const numbers: Numbers = await fetch(staticFile('v3/brake/numbers.json')).then((r) => r.json());
	return {
		durationInFrames: Math.ceil(((captions.durationMs / 1000 + TAIL_S) * FPS) - 1e-6),
		props: {...props, captions, numbers},
	};
};


// index.ts 只注册 V3Brake；封面 V3BrakeCover 另有入口 coverEntry.tsx（第三轮从这里挪出去）
export const BrakeRoot: React.FC = () => (
	<>
		<Composition
			id="V3Brake"
			component={Video}
			width={W}
			height={H}
			fps={FPS}
			durationInFrames={300}
			defaultProps={{captions: null, numbers: null}}
			calculateMetadata={calc}
		/>
	</>
);
