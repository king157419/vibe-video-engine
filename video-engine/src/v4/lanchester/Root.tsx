import React from 'react';
import {Composition} from 'remotion';
import {LanchesterVideo} from './Video';
import {DUR} from './data';
export const Root: React.FC = () => <Composition id="V4Lanchester" component={LanchesterVideo} width={1920} height={1080} fps={30} durationInFrames={Math.round(DUR * 30)} />;
