/** kit/Backdrop 的一份拷贝，多了两件事：
 *  1. 时间由外面传入（tt），硬静音那 1.3 秒星尘和颗粒都冻住，之后接着走不跳；
 *  2. 一层极淡的点阵（参考片的暗底上也有），只在近处可见，几乎不增加细节密度。 */
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useVideoConfig} from 'remotion';
import {C} from '../kit/theme';
import {hexToRgb, mulberry32} from '../kit/util';

export const Backdrop: React.FC<{tt: number; gf: number; dust?: number; drift?: [number, number]; glow?: number; seed?: number; dustK?: number}> = ({
	tt,
	gf,
	dust = 240,
	drift = [-6, -2.5],
	glow = 0.15,
	seed = 11,
	dustK = 1,
}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const {width: W, height: H} = useVideoConfig();
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
	// 审片修改：抖动层。中部径向光在 8 bit 里有一圈圈色带，叠一层逐帧变化的 0–2 LSB 噪声（每个通道独立），底色先压低 1 LSB 抵掉均值
	const dither = useMemo(() => {
		if (typeof document === 'undefined') return null;
		const cv = document.createElement('canvas');
		cv.width = 256;
		cv.height = 256;
		const g = cv.getContext('2d')!;
		const img = g.createImageData(256, 256);
		const r = mulberry32(seed + 7);
		for (let i = 0; i < 256 * 256; i++) {
			img.data[i * 4] = Math.floor(r() * 3);
			img.data[i * 4 + 1] = Math.floor(r() * 3);
			img.data[i * 4 + 2] = Math.floor(r() * 3);
			img.data[i * 4 + 3] = 255;
		}
		g.putImageData(img, 0, 0);
		return cv;
	}, [seed]);
	// 点阵：间距 32 px，极暗
	const grid = useMemo(() => {
		if (typeof document === 'undefined') return null;
		const cv = document.createElement('canvas');
		cv.width = W;
		cv.height = H;
		const g = cv.getContext('2d')!;
		for (let y = 14; y < H; y += 32)
			for (let x = 14; x < W; x += 32) {
				const d = Math.hypot((x - W / 2) / W, (y - H * 0.45) / H);
				const a = 0.05 * Math.max(0, 1 - d * 1.5);
				if (a <= 0.004) continue;
				g.fillStyle = `rgba(150,170,200,${a})`;
				g.fillRect(x, y, 1.2, 1.2);
			}
		return cv;
	}, [W, H]);
	useLayoutEffect(() => {
		const cv = ref.current;
		if (!cv) return;
		const g = cv.getContext('2d')!;
		const t = tt;
		const [r0, g0, b0] = hexToRgb(C.bg);
		g.globalCompositeOperation = 'source-over';
		g.globalAlpha = 1;
		g.fillStyle = `rgb(${Math.max(0, r0 - 1)},${Math.max(0, g0 - 1)},${Math.max(0, b0 - 1)})`;
		g.fillRect(0, 0, W, H);
		if (glow > 0) {
			// 过渡加宽：多几个色标，按 (1−d)² 的形状衰减
			const gr = g.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.66);
			for (let i = 0; i <= 8; i++) {
				const u = i / 8;
				gr.addColorStop(u, `rgba(27,42,58,${(glow * (1 - u) * (1 - u) * (1 + u)).toFixed(4)})`);
			}
			g.fillStyle = gr;
			g.fillRect(0, 0, W, H);
		}
		g.globalCompositeOperation = 'lighter';
		if (grid) g.drawImage(grid, 0, 0);
		for (const m of motes) {
			let x = (m.x + drift[0] * t * m.z) % W;
			let y = (m.y + drift[1] * t * m.z) % H;
			if (x < 0) x += W;
			if (y < 0) y += H;
			const a = dustK * m.a * (0.55 + 0.45 * Math.sin(t * m.tw * 2 + m.ph));
			g.fillStyle = `rgba(200,215,235,${a})`;
			g.beginPath();
			g.arc(x, y, m.s, 0, Math.PI * 2);
			g.fill();
		}
		g.globalCompositeOperation = 'source-over';
		const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
		vg.addColorStop(0, 'rgba(0,0,0,0)');
		vg.addColorStop(1, 'rgba(0,0,0,0.75)');
		g.fillStyle = vg;
		g.fillRect(0, 0, W, H);
		if (grain) {
			g.globalAlpha = 0.035;
			g.globalCompositeOperation = 'overlay';
			const ox = (gf * 73) % 256;
			const oy = (gf * 151) % 256;
			for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) g.drawImage(grain, x, y);
			g.globalAlpha = 1;
			g.globalCompositeOperation = 'source-over';
		}
		if (dither) {
			g.globalCompositeOperation = 'lighter';
			const ox = (gf * 97) % 256;
			const oy = (gf * 59) % 256;
			for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) g.drawImage(dither, x, y);
			g.globalCompositeOperation = 'source-over';
		}
	});
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};
