import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {DUR,FPS} from './data';
export const Root: React.FC = () => <Composition id="V4Starry" component={Video} width={1920} height={1080} fps={FPS} durationInFrames={DUR*FPS}/>;
