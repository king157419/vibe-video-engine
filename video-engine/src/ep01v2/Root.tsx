import React from 'react';
import type {CalculateMetadataFunction} from 'remotion';
import {Composition, staticFile} from 'remotion';
import type {Captions, Sections} from '../whiteboard';
import {FPS, H, W} from '../whiteboard';
import {lintEpisode, TAIL_MS} from './build';
import type {EpisodeProps} from './Episode';
import {Episode} from './Episode';

// EP01v2 · 16:9 手绘白板长片。时长 = 旁白 + 2.5 秒收尾。
const calc: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
	const base = `episodes/${props.episode}`;
	const captions: Captions = await fetch(staticFile(`${base}/captions.json`)).then((r) => r.json());
	const sec: Sections = await fetch(staticFile(`${base}/sections.json`)).then((r) => r.json());
	const lintReport = props.lint ? lintEpisode(captions, sec.sections) : undefined;
	return {
		durationInFrames: Math.ceil(((captions.durationMs + TAIL_MS) / 1000) * FPS),
		props: {...props, captions, sections: sec.sections, lintReport},
	};
};

export const EP01v2Root: React.FC = () => (
	<Composition
		id="EP01v2"
		component={Episode}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={FPS * 60}
		defaultProps={{episode: 'EP01v2', qa: false, lint: false, captions: null, sections: null} as EpisodeProps}
		calculateMetadata={calc}
	/>
);
