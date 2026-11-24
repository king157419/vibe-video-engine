import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from '../kit/theme';
import {DUR} from './data.gen';
import {Video} from './Video';

export const Root: React.FC = () => (
	<Composition id="V4Hielo" component={Video} width={W} height={H} fps={FPS} durationInFrames={Math.round(DUR * FPS)} />
);
