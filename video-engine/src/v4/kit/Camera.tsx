import React from 'react';
import {AbsoluteFill} from 'remotion';

/** 慢镜头：把内容整体平移/缩放/旋转（以 (ox,oy) 为中心）。镜头一直在动但很慢。 */
export const Camera: React.FC<{
	x?: number;
	y?: number;
	scale?: number;
	rot?: number;
	ox?: number;
	oy?: number;
	children: React.ReactNode;
}> = ({x = 0, y = 0, scale = 1, rot = 0, ox = 960, oy = 540, children}) => (
	<AbsoluteFill
		style={{
			transformOrigin: `${ox}px ${oy}px`,
			transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`,
		}}
	>
		{children}
	</AbsoluteFill>
);

/** 整屏压暗层：章节间的近黑过渡、闪白等。color 默认黑。 */
export const Veil: React.FC<{a: number; color?: string}> = ({a, color = '#000'}) =>
	a <= 0.001 ? null : <AbsoluteFill style={{background: color, opacity: Math.min(1, a)}} />;
