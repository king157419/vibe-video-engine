import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from './theme';
import {hexToRgb, mulberry32} from './util';

/** 背景：近黑底 + 四角压暗 + 极淡的星尘（缓慢漂移、闪烁）+ 细颗粒（抖动色带，防止暗部出现色阶）。
 *  dust 是星尘数量；drift 是每秒漂移像素；tint 是底色；glow 是画面中上部一团极淡的光（0 关）。 */
export const Backdrop: React.FC<{
	tint?: string;
	dust?: number;
	drift?: [number, number];
	glow?: number;
	glowColor?: string;
	seed?: number;
	dim?: number; // 整体再压暗（0–1），用于章节间的近黑过渡
}> = ({tint = C.bg, dust = 240, drift = [-6, -2.5], glow = 0.06, glowColor = '#1b2a3a', seed = 11, dim = 0}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const {width: W, height: H, fps} = useVideoConfig();
	const motes = useMemo(() => {
		const r = mulberry32(seed);
		return Array.from({length: dust}, () => ({
			x: r() * W,
			y: r() * H,
			s: 0.4 + r() * 1.3,
			a: 0.07 + r() * 0.26,
			tw: 0.5 + r() * 1.6,
			ph: r() * 6.28,
			z: 0.3 + r() * 0.7,
		}));
	}, [dust, seed, W, H]);
	const grain = useMemo(() => {
		if (typeof document === 'undefined') return null;
		const cv = document.createElement('canvas');
		cv.width = 256;
		cv.height = 256;
		const g = cv.getContext('2d')!;
		const img = g.createImageData(256, 256);
		const r = mulberry32(seed + 99);
		for (let i = 0; i < 256 * 256; i++) {
			const v = Math.floor(r() * 255);
			img.data[i * 4] = v;
			img.data[i * 4 + 1] = v;
			img.data[i * 4 + 2] = v;
			img.data[i * 4 + 3] = 255;
		}
		g.putImageData(img, 0, 0);
		return cv;
	}, [seed]);
	useLayoutEffect(() => {
		const cv = ref.current;
		if (!cv) return;
		const g = cv.getContext('2d')!;
		const t = frame / fps;
		const [r0, g0, b0] = hexToRgb(tint);
		g.globalCompositeOperation = 'source-over';
		g.fillStyle = `rgb(${r0},${g0},${b0})`;
		g.fillRect(0, 0, W, H);
		if (glow > 0) {
			const [r1, g1, b1] = hexToRgb(glowColor);
			const gr = g.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.6);
			gr.addColorStop(0, `rgba(${r1},${g1},${b1},${glow})`);
			gr.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
			g.fillStyle = gr;
			g.fillRect(0, 0, W, H);
		}
		// 星尘
		g.globalCompositeOperation = 'lighter';
		for (const m of motes) {
			let x = (m.x + drift[0] * t * m.z) % W;
			let y = (m.y + drift[1] * t * m.z) % H;
			if (x < 0) x += W;
			if (y < 0) y += H;
			const a = m.a * (0.55 + 0.45 * Math.sin(t * m.tw * 2 + m.ph));
			g.fillStyle = `rgba(200,215,235,${a})`;
			g.beginPath();
			g.arc(x, y, m.s, 0, Math.PI * 2);
			g.fill();
		}
		// 暗角
		g.globalCompositeOperation = 'source-over';
		const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
		vg.addColorStop(0, 'rgba(0,0,0,0)');
		vg.addColorStop(1, 'rgba(0,0,0,0.75)');
		g.fillStyle = vg;
		g.fillRect(0, 0, W, H);
		if (dim > 0) {
			g.fillStyle = `rgba(0,0,0,${Math.min(1, dim)})`;
			g.fillRect(0, 0, W, H);
		}
		// 颗粒（每帧换偏移，抖散暗部色阶）
		if (grain) {
			g.globalAlpha = 0.035;
			g.globalCompositeOperation = 'overlay';
			const ox = (frame * 73) % 256;
			const oy = (frame * 151) % 256;
			for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) g.drawImage(grain, x, y);
			g.globalAlpha = 1;
			g.globalCompositeOperation = 'source-over';
		}
	});
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};
