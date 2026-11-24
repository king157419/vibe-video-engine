import React from 'react';
import {Composition} from 'remotion';
import {makeCalc} from '../../lib/load';
import {FPS, H, W} from './engine/theme';
import {Lab01Opus} from './Lab01';

export const OpusRoot: React.FC = () => (
	<Composition
		id="Lab01Opus"
		component={Lab01Opus}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={1860}
		defaultProps={{episode: 'lab01', captions: null, meta: null}}
		calculateMetadata={makeCalc(1500)}
	/>
);
