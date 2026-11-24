import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from '../kit/theme';
import {DURATION, Video} from './Video';

export const Root: React.FC = () => (
	<Composition id="V4Ties" component={Video} width={W} height={H} fps={FPS} durationInFrames={Math.round(DURATION * FPS)} />
);
