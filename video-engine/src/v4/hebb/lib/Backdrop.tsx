import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {C, hexToRgb, mulberry32} from '../../kit';

/** （赫布专用的背景，审片修改后重写；不改 kit）
 *  - 近黑底 + 画面中上部一团极淡的光（椭圆）；
 *  - 星尘：缓慢漂移、闪烁；跟镜头有一点视差（parallax：镜头推近时星尘也慢慢散开）；
 *  - mask：某一块的星尘乘 k（序里 B 的位置「完全是黑的」），边缘羽化 220 px，不留弧形边；
 *  - 暗角：16:9 椭圆（rx 0.62W，ry 0.62H），从画面中间单调压到四角，四角最暗；
 *  - 颗粒不在这里：放在发光层最上面（lib/grain.ts），连发光层的大光晕一起抖散色带。 */
/** 这一帧画好的背景画布（发光层画完后用 destination-over 垫到自己下面：这样整层光晕可以不透明地叠回去） */
export const BACKDROP: {cv: HTMLCanvasElement | null} = {cv: null};

export const Backdrop: React.FC<{
	tint?: string;
	dust?: number;
	drift?: [number, number];
	glow?: number;
	glowColor?: string;
	seed?: number;
	dim?: number; // 整体再压暗（0–1），用于章节间的近黑过渡
	mask?: {x: number; y: number; r: number; k: number} | null; // 圆内星尘 × k
	parallax?: {s: number; ox: number; oy: number} | null; // 镜头缩放 → 星尘视差
	clock?: number; // 星尘漂移和闪烁用的时钟（秒）；不给就用帧号/fps
}> = ({tint = C.bg, dust = 240, drift = [-6, -2.5], glow = 0.06, glowColor = '#1b2a3a', seed = 11, dim = 0, mask = null, parallax = null, clock}) => {
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
	useLayoutEffect(() => {
		const cv = ref.current;
		if (!cv) return;
		BACKDROP.cv = cv;
		const g = cv.getContext('2d')!;
		const t = clock ?? frame / fps;
		const [r0, g0, b0] = hexToRgb(tint);
		g.setTransform(1, 0, 0, 1, 0, 0);
		g.globalCompositeOperation = 'source-over';
		g.fillStyle = `rgb(${r0},${g0},${b0})`;
		g.fillRect(0, 0, W, H);
		if (glow > 0) {
			const [r1, g1, b1] = hexToRgb(glowColor);
			g.save();
			g.translate(W * 0.5, H * 0.42);
			g.scale(1, 0.62);
			const gr = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.6);
			gr.addColorStop(0, `rgba(${r1},${g1},${b1},${glow})`);
			gr.addColorStop(0.5, `rgba(${r1},${g1},${b1},${glow * 0.45})`);
			gr.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
			g.fillStyle = gr;
			g.fillRect(-W * 0.6, -W * 0.6, W * 1.2, W * 1.2);
			g.restore();
		}
		// 星尘
		g.globalCompositeOperation = 'lighter';
		for (const m of motes) {
			let x = (m.x + drift[0] * t * m.z) % W;
			let y = (m.y + drift[1] * t * m.z) % H;
			if (x < 0) x += W;
			if (y < 0) y += H;
			if (parallax) {
				const k = 1 + (parallax.s - 1) * (0.35 + 0.65 * m.z);
				x = parallax.ox + (x - parallax.ox) * k;
				y = parallax.oy + (y - parallax.oy) * k;
			}
			let a = m.a * (0.55 + 0.45 * Math.sin(t * m.tw * 2 + m.ph));
			if (mask) {
				const d = Math.hypot(x - mask.x, y - mask.y);
				const u = Math.min(1, Math.max(0, (d - mask.r) / 220));
				const f = u * u * (3 - 2 * u);
				a *= mask.k + (1 - mask.k) * f;
			}
			if (a <= 0.004) continue;
			g.fillStyle = `rgba(200,215,235,${a})`;
			g.beginPath();
			g.arc(x, y, m.s, 0, Math.PI * 2);
			g.fill();
		}
		// 暗角：16:9 椭圆，单调压到四角（四角的归一化半径 ≈ 1.14，渐变铺到 1.16）
		g.globalCompositeOperation = 'source-over';
		g.save();
		g.translate(W / 2, H / 2);
		g.scale(1, H / W);
		const R = 1.16 * 0.62 * W;
		const vg = g.createRadialGradient(0, 0, 0, 0, 0, R);
		vg.addColorStop(0, 'rgba(0,0,0,0)');
		vg.addColorStop(0.36, 'rgba(0,0,0,0)');
		vg.addColorStop(0.55, 'rgba(0,0,0,0.12)');
		vg.addColorStop(0.72, 'rgba(0,0,0,0.33)');
		vg.addColorStop(0.86, 'rgba(0,0,0,0.55)');
		vg.addColorStop(1, 'rgba(0,0,0,0.78)');
		g.fillStyle = vg;
		g.fillRect(-W / 2, -W / 2, W, W);
		g.restore();
		if (dim > 0) {
			g.fillStyle = `rgba(0,0,0,${Math.min(1, dim)})`;
			g.fillRect(0, 0, W, H);
		}
	});
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};
