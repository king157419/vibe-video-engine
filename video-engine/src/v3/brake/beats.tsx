import React from 'react';
import type {Cam} from './cam';
import type {Numbers} from './data';
import type {CarState} from './state';
import type {TL} from './timeline';
import {Guess} from './beatGuess';
import {GrayLayout, Stencil, Stuck} from './beat1';
import {Kernel, PerSecond} from './beat3';
import {SixtyAccount} from './beat3c';
import {Curve} from './beatCurve';
import {Rain} from './beatRain';
import {Ball} from './beatBall';
import {Bounds} from './beatBounds';
import {Finale} from './beatFinale';

export type BeatProps = {cam: Cam; t: number; T: TL; N: Numbers; w: CarState; y: CarState; rain: CarState; frame: number};

export const Beats: React.FC<BeatProps> = (p) => (
	<>
		<GrayLayout {...p} />
		{/* 秒尺的引线要压在 Stuck 那对“按米”括号的底板下面，所以先画 */}
		<PerSecond {...p} />
		<Stuck {...p} />
		<Stencil {...p} />
		<Kernel {...p} />
		<SixtyAccount {...p} />
		<Curve {...p} />
		<Rain {...p} />
		<Ball {...p} />
		<Bounds {...p} />
		<Finale {...p} />
		<Guess {...p} />
	</>
);
