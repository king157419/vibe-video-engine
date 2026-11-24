import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {SANS, SERIF} from '../../lib/fonts';

/**
 * fonts.ts 的 ensureFonts() 是异步把 FontFace 加进 document.fonts 的。
 * measureText 会缓存结果——如果在字体到位前测量，会把回退字体的宽度永久缓存下来。
 * 所以这里等两套字体真正进入 document.fonts 之后才允许测量（之前用估算值，不入缓存）。
 */
const fontsInDocument = (): boolean => {
	if (typeof document === 'undefined' || !document.fonts) return false;
	let sans = false;
	let serif = false;
	document.fonts.forEach((f) => {
		if (f.status !== 'loaded') return;
		const fam = f.family.replace(/["']/g, '');
		if (fam === SANS) sans = true;
		if (fam === SERIF) serif = true;
	});
	return sans && serif;
};

export const useFontsReady = (): boolean => {
	const [ready, setReady] = useState(fontsInDocument);
	const [handle] = useState(() => (ready ? null : delayRender('radio: wait for fonts before measuring text')));
	useEffect(() => {
		if (handle === null) return;
		let tries = 0;
		let timer = 0;
		const tick = () => {
			// 最多等 ~8s；字体加载失败时 ensureFonts 也会放行，这里同样放行（用估算宽度）
			if (fontsInDocument() || tries++ > 320) {
				setReady(true);
				continueRender(handle);
				return;
			}
			timer = window.setTimeout(tick, 25);
		};
		tick();
		return () => window.clearTimeout(timer);
	}, [handle]);
	return ready;
};

/** 预解码 CSS 背景用的颗粒贴图，保证第 0 帧（封面）就带颗粒 */
export const GRAIN_URL = staticFile('styles/radio/grain.png');
let grainDecoded = false;

export const useGrainReady = (): void => {
	const [handle] = useState(() =>
		grainDecoded || typeof window === 'undefined' ? null : delayRender('radio: decode grain texture'),
	);
	useEffect(() => {
		if (handle === null) return;
		const img = new Image();
		img.src = GRAIN_URL;
		img
			.decode()
			.catch(() => undefined)
			.then(() => {
				grainDecoded = true;
				continueRender(handle);
			});
	}, [handle]);
};
