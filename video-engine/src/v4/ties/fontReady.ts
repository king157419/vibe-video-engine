/** 片名用的字体是否真的就位：kit 的 ensureV4Fonts 等字体文件下载完才把 FontFace 加进 document.fonts，
 *  在那之前 document.fonts.load('… "V4 Serif SC"') 会因为「没有这个字体」立刻返回，取样就落到系统黑体上。
 *  这里只认「document.fonts 里已经有这个 family、而且 status 是 loaded」。 */
import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {FONT_ZH} from '../kit/theme';
import {mulberry32} from '../kit/util';

export const serifReady = (family = FONT_ZH): boolean => {
	if (typeof document === 'undefined') return false;
	let ok = false;
	document.fonts.forEach((f) => {
		if (f.family.replace(/["']/g, '') === family && f.status === 'loaded') ok = true;
	});
	return ok;
};

/** 每 25 ms 看一次，最多等 1000 次（约 25 秒）；只影响加载，不影响画面 */
const waitSerif = (family: string, maxTicks = 1000) =>
	new Promise<void>((resolve) => {
		let n = 0;
		const tick = () => {
			if (serifReady(family) || n++ > maxTicks) resolve();
			else setTimeout(tick, 25);
		};
		tick();
	});

type Pt = [number, number];
const cache = new Map<string, Pt[]>();

/** 和 kit 的 useTextPoints 同一个取样算法（同样的画布、同样的 mulberry32 抖动），只是先等字体真的就位 */
export const useTitlePoints = (text: string, size: number, weight: number, step: number, family: string, tracking: number): Pt[] | null => {
	const key = `${text}|${size}|${weight}|${step}|${family}|${tracking}`;
	const [pts, setPts] = useState<Pt[] | null>(cache.get(key) ?? null);
	const [handle] = useState(() => (cache.has(key) ? null : delayRender(`sample title ${text}`)));
	useEffect(() => {
		if (pts) return;
		const font = `${weight} ${size}px "${family}"`;
		waitSerif(family)
			.then(() => document.fonts.load(font, text))
			.then(() => {
				if (!serifReady(family)) console.error('[ties] title font not ready, sampling fallback');
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
