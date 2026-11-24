import React from 'react';
import {Composition} from 'remotion';
import {H, W} from '../kit';
import {DUR, FPS} from './data';
import {HebbVideo} from './Video';

export const Root: React.FC = () => <Composition id="V4Hebb" component={HebbVideo} width={W} height={H} fps={FPS} durationInFrames={Math.round(DUR * FPS)} />;
