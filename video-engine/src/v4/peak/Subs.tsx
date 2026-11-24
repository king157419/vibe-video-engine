/** kit/Text 的 Subtitles 的一份拷贝，多一件事：hardOut 里列出的时刻，字幕不淡出，和画面的硬切同一帧消失
 *  （审片修改：「一个美好的人生，」陪着满屏奇观，到 188.95 硬切那一帧一起切掉）。样式和 kit 完全一致。 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_EN_IT, FONT_ZH, type Sub} from '../kit/theme';
import {win} from '../kit/util';

export const Subtitles: React.FC<{subs: Sub[]; hardOut?: number[]; bottom?: number; fade?: number; zhSize?: number; enSize?: number}> = ({
	subs,
	hardOut = [],
	bottom = 54,
	fade = 0.35,
	zhSize = 38,
	enSize = 23,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const cur = subs.find((s) => {
		const hard = hardOut.some((h) => Math.abs(h - s.t1) < 1e-3);
		return t >= s.t0 - 0.01 && (hard ? t < s.t1 - 1e-6 : t <= s.t1 + 0.01);
	});
	if (!cur) return null;
	const hard = hardOut.some((h) => Math.abs(h - cur.t1) < 1e-3);
	const a = win(t, cur.t0, cur.t1 + (hard ? 10 : 0), fade, fade);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none'}}>
			<div style={{marginBottom: bottom, textAlign: 'center', opacity: a, maxWidth: 1560}}>
				<div
					style={{
						fontFamily: FONT_ZH,
						fontWeight: 380,
						fontSize: zhSize,
						letterSpacing: '0.06em',
						color: C.text,
						lineHeight: 1.35,
						textShadow: '0 0 18px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)',
					}}
				>
					{cur.zh}
				</div>
				{cur.en ? (
					<div
						style={{
							fontFamily: FONT_EN_IT,
							fontStyle: 'italic',
							fontSize: enSize,
							color: C.en,
							marginTop: 6,
							letterSpacing: '0.01em',
							textShadow: '0 0 12px rgba(0,0,0,0.9)',
						}}
					>
						{cur.en}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};
