import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS, H, W} from '../kit/theme';
import {Demo} from './Demo';

const Root: React.FC = () => React.createElement(Composition, {id: 'V4KitDemo', component: Demo, width: W, height: H, fps: FPS, durationInFrames: 40 * FPS});

registerRoot(Root);
