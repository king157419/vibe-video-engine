// 封面专用入口（不进正片，index.ts 只注册 V3Brake）。出封面：
//   remotion still src/v3/brake/coverEntry.tsx V3BrakeCover out/v3/brake/cover.png --frame=435
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Cover} from './Cover';
import {calc} from './Root';
import {FPS, H, W} from './theme';

const CoverRoot: React.FC = () => (
	<Composition
		id="V3BrakeCover"
		component={Cover}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={300}
		defaultProps={{captions: null, numbers: null}}
		calculateMetadata={calc}
	/>
);

registerRoot(CoverRoot);
