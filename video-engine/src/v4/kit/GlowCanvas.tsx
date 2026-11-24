import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Ctx} from './glow';

/** 全画幅 canvas，每帧清空后调用 draw(g, t秒, frame)。默认 'lighter' 叠加（光的相加）。
 *  draw 必须只依赖 t / frame 和预先算好的数据（确定性）。 */
export const GlowCanvas: React.FC<{
	draw: (g: Ctx, t: number, frame: number) => void;
	additive?: boolean;
	opacity?: number;
	style?: React.CSSProperties;
}> = ({draw, additive = true, opacity = 1, style}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {width, height, fps} = useVideoConfig();
	useLayoutEffect(() => {
		const cv = ref.current;
		if (!cv) return;
		const g = cv.getContext('2d');
		if (!g) return;
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'source-over';
		g.clearRect(0, 0, width, height);
		g.globalCompositeOperation = additive ? 'lighter' : 'source-over';
		draw(g, frame / fps, frame);
	});
	return (
		<canvas
			ref={ref}
			width={width}
			height={height}
			style={{position: 'absolute', left: 0, top: 0, width, height, opacity, ...style}}
		/>
	);
};
