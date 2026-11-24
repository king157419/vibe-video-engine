import React from 'react';
import type {CalculateMetadataFunction} from 'remotion';
import {Composition, staticFile} from 'remotion';
import type {Captions} from '../../lib/types';
import {Lab01} from './Lab01';
import type {Lab01Props} from './Lab01';
import {FPS, H, TAIL_MS, W} from './theme';

const calc: CalculateMetadataFunction<Lab01Props> = async ({props}) => {
	const captions: Captions = await fetch(staticFile('episodes/lab01/captions.json')).then((r) => r.json());
	return {durationInFrames: Math.ceil(((captions.durationMs + TAIL_MS) / 1000) * FPS), props: {...props, captions}};
};

export const FableRoot: React.FC = () => (
	<Composition id="Lab01Fable" component={Lab01} width={W} height={H} fps={FPS} durationInFrames={300} defaultProps={{captions: null}} calculateMetadata={calc} />
);
