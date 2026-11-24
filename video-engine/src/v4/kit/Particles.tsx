import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {GlowCanvas} from './GlowCanvas';
import {C, FONT_ZH, H, W} from './theme';
import {clamp, easeInOut, hexToRgb, mulberry32} from './util';

type Pt = [number, number];
const cache = new Map<string, Pt[]>();

/** 把一段文字采样成点（以文字中心为原点）。等字体加载完再采样（delayRender 保证不会用错字体）。 */
export const useTextPoints = (text: string, size = 160, weight = 400, step = 5, family = FONT_ZH, tracking = 0.25): Pt[] | null => {
	const key = `${text}|${size}|${weight}|${step}|${family}|${tracking}`;
	const [pts, setPts] = useState<Pt[] | null>(cache.get(key) ?? null);
	const [handle] = useState(() => (cache.has(key) ? null : delayRender(`sample text ${text}`)));
	useEffect(() => {
		if (pts) return;
		const font = `${weight} ${size}px "${family}"`;
		document.fonts
			.load(font, text)
			.then(() => {
				const cv = document.createElement('canvas');
				const chars = Array.from(text);
				const adv = size * (1 + tracking);
				cv.width = Math.ceil(adv * chars.length + size);
				cv.height = Math.ceil(size * 1.6);
				const g = cv.getContext('2d')!;
				g.fillStyle = '#fff';
				g.font = font;
				g.textBaseline = 'middle';
				g.textAlign = 'center';
				chars.forEach((ch, i) => g.fillText(ch, size / 2 + adv * (i + 0.5), cv.height / 2));
				const img = g.getImageData(0, 0, cv.width, cv.height).data;
				const out: Pt[] = [];
				const r = mulberry32(text.length * 131 + size);
				for (let y = 0; y < cv.height; y += step)
					for (let x = 0; x < cv.width; x += step) {
						const jx = x + Math.floor(r() * step);
						const jy = y + Math.floor(r() * step);
						if (img[(jy * cv.width + jx) * 4 + 3] > 128) out.push([jx - cv.width / 2, jy - cv.height / 2]);
					}
				cache.set(key, out);
				setPts(out);
				if (handle !== null) continueRender(handle);
			})
			.catch(() => {
				if (handle !== null) continueRender(handle);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);
	return pts;
};

/** 粒子聚字：p=0 时粒子散在画面里（或从 from 点涌出），p=1 时聚成文字。
 *  hold 后可再用 burst（0–1）把字吹散。color 是粒子主色。 */
export const ParticleText: React.FC<{
	text: string;
	p: number;
	cx?: number;
	cy?: number;
	size?: number;
	weight?: number;
	color?: string;
	from?: Pt | 'scatter';
	burst?: number;
	seed?: number;
	dotSize?: number;
	opacity?: number;
	tracking?: number; // 字距（em），要和 TitleCard 收拢后的字距一致才能无缝交接（默认 0.48）
	step?: number;
}> = ({text, p, cx = W / 2, cy = H * 0.42, size = 150, weight = 380, color = C.goldCore, from = 'scatter', burst = 0, seed = 5, dotSize = 1.6, opacity = 1, tracking = 0.48, step = 4}) => {
	const pts = useTextPoints(text, size, weight, step, FONT_ZH, tracking);
	const seeds = useMemo(() => {
		if (!pts) return [];
		const r = mulberry32(seed);
		return pts.map(() => ({
			sx: from === 'scatter' ? r() * W : from[0] + (r() - 0.5) * 30,
			sy: from === 'scatter' ? r() * H : from[1] + (r() - 0.5) * 30,
			cx: (r() - 0.5) * 500,
			cy: (r() - 0.5) * 400,
			d: r() * 0.35,
			b: r(),
			bx: (r() - 0.5) * 2,
			by: (r() - 0.5) * 2 - 0.3,
			tw: r() * 6.28,
		}));
	}, [pts, seed, from]);
	if (!pts || opacity <= 0) return null;
	const [cr, cg, cb] = hexToRgb(color);
	return (
		<GlowCanvas
			opacity={opacity}
			draw={(g, t) => {
				for (let i = 0; i < pts.length; i++) {
					const s = seeds[i];
					const u = easeInOut(clamp((p - s.d) / 0.65));
					const tx = cx + pts[i][0];
					const ty = cy + pts[i][1];
					// 二次贝塞尔：起点 → 控制点 → 目标
					const mx = (s.sx + tx) / 2 + s.cx;
					const my = (s.sy + ty) / 2 + s.cy;
					let x = (1 - u) * (1 - u) * s.sx + 2 * (1 - u) * u * mx + u * u * tx;
					let y = (1 - u) * (1 - u) * s.sy + 2 * (1 - u) * u * my + u * u * ty;
					if (burst > 0) {
						const bb = burst * burst;
						x += s.bx * 600 * bb;
						y += s.by * 400 * bb;
					}
					const a = (0.25 + 0.75 * u) * (1 - burst * 0.9) * (0.75 + 0.25 * Math.sin(t * 3 + s.tw));
					const rad = dotSize * (1.6 - 0.6 * u);
					g.fillStyle = `rgba(${cr},${cg},${cb},${a * 0.22})`;
					g.beginPath();
					g.arc(x, y, rad * 3.2, 0, Math.PI * 2);
					g.fill();
					g.fillStyle = `rgba(255,250,235,${a * 0.85})`;
					g.beginPath();
					g.arc(x, y, rad, 0, Math.PI * 2);
					g.fill();
				}
			}}
		/>
	);
};
