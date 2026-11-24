import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {BrakeProps} from './data';
import {PaintText} from './paint';
import {C} from './theme';
import {Video} from './Video';

// 封面（1920×1080）：取片中押注定格那一帧（白车“刚好停住”、黄车读数“??”），
// 下方压一条沥青色标题带：路面喷字风格的大标题 + 一句问题。手机缩略图上标题约 45 px 高，能读。
// 用法：remotion still src/v3/brake/coverEntry.tsx V3BrakeCover <out.png> --frame=435
// （第 435 帧 = 14.5 秒：黄车撞线定格、读数“??”。Composition 时长和正片一样，帧号直接对应正片；
//  不用 <Freeze>，因为 1 帧长的 Composition 里 useCurrentFrame 会被夹到 0）
export const COVER_FRAME = 435;

export const Cover: React.FC<BrakeProps> = (props) => (
	<AbsoluteFill style={{background: C.asphalt}}>
		<Video {...props} />
		<svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
			{/* 标题带：盖住字幕和右下角角标；上沿一道白色热熔线 */}
			<rect x={0} y={756} width={1920} height={324} fill={C.asphalt} />
			<rect x={0} y={756} width={1920} height={8} fill={C.white} />
			<rect x={0} y={764} width={1920} height={3} fill={C.shadow} />
			<PaintText x={64} y={1032} size={196} stretch={1.42} weight={900} sh={5}>
				最后几米
			</PaintText>
			{/* 第二轮审片后：问题两行 84 → 100 px，缩到 360 px 宽的手机缩略图上约 19 px 高 */}
			<PaintText x={918} y={884} size={100} weight={800} sh={3}>
				50 码刚好停住
			</PaintText>
			<PaintText x={918} y={1024} size={100} weight={800} color={C.yellow} sh={3}>
				60 码撞上还剩多快？
			</PaintText>
		</svg>
	</AbsoluteFill>
);
