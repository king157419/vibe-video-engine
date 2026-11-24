import React from 'react';
import {Composition} from 'remotion';
import {W, H} from '../kit';
import {DUR, FPS} from './data';
import {Video} from './Video';
export const Root: React.FC = () => <Composition id="V4Baobao" component={Video} width={W} height={H} fps={FPS} durationInFrames={Math.round(DUR * FPS)} />;
