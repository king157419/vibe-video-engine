/** 全屏确定性抖动（最上层），打散暗部渐变（四角压暗、光晕尾巴）的 8 位色带。
 *  零均值：一层用 plus-lighter 加 0–2 级，一层用 difference 减 0–2 级，两层噪声相互独立，
 *  合起来每个像素 −2…+2 级、平均 0（不抬黑位）。噪声块用 mulberry32 一次生成；每帧的偏移由 hash2(frame) 决定。 */
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {hash2, mulberry32} from '../kit/util';

const T = 256;

const makeTile = (seed: number) => {
	if (typeof document === 'undefined') return null;
	const cv = document.createElement('canvas');
	cv.width = T;
	cv.height = T;
	const g = cv.getContext('2d')!;
	const img = g.createImageData(T, T);
	const r = mulberry32(seed);
	for (let i = 0; i < T * T; i++) {
		const v = Math.floor(r() * 3); // 0, 1, 2
		img.data[i * 4] = v;
		img.data[i * 4 + 1] = v;
		img.data[i * 4 + 2] = v;
		img.data[i * 4 + 3] = 255;
	}
	g.putImageData(img, 0, 0);
	return cv;
};

const Layer: React.FC<{seed: number; salt: number; mode: 'plus-lighter' | 'difference'}> = ({seed, salt, mode}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {width: W, height: H} = useVideoConfig();
	const tile = useMemo(() => makeTile(seed), [seed]);
	useLayoutEffect(() => {
		const cv = ref.current;
		if (!cv || !tile) return;
		const g = cv.getContext('2d')!;
		g.globalCompositeOperation = 'source-over';
		g.fillStyle = '#000';
		g.fillRect(0, 0, W, H);
		const ox = Math.floor(hash2(frame, salt, 5) * T);
		const oy = Math.floor(hash2(frame, salt + 1, 5) * T);
		for (let x = -ox; x < W; x += T) for (let y = -oy; y < H; y += T) g.drawImage(tile, x, y);
	});
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none', mixBlendMode: mode}} />;
};

export const Grain: React.FC = () => (
	<>
		<Layer seed={90817} salt={11} mode="plus-lighter" />
		<Layer seed={31337} salt={23} mode="difference" />
	</>
);
