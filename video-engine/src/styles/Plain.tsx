import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {activeLineIndex} from '../lib/load';
import {ensureFonts, SANS} from '../lib/fonts';
import type {EpisodeProps} from '../lib/types';

ensureFonts();

// 最简样式：只用于验证工具链（字体/音频/字幕时间轴）
export const Plain: React.FC<EpisodeProps> = ({captions}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (!captions) return null;
	const ms = (frame / fps) * 1000;
	const line = captions.lines[activeLineIndex(captions, ms)];
	return (
		<AbsoluteFill style={{backgroundColor: '#111', justifyContent: 'center', alignItems: 'center'}}>
			<Html5Audio src={staticFile(captions.audio)} />
			<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 64, color: '#fff', padding: 80, textAlign: 'center'}}>
				{line?.chars.map((c, i) => (
					<span key={i} style={{color: c.hl ? '#ffcf70' : ms >= c.s ? '#fff' : 'rgba(255,255,255,0.45)'}}>
						{c.t}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};
