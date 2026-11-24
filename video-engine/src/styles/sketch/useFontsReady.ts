import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {SANS, SERIF} from '../../lib/fonts';

// ensureFonts() 异步把 FontFace 加进 document.fonts，但不会触发 React 重渲染。
// 排版要用 measureText（结果会被缓存），必须等两种字体都可用后再量。
const loaded = (): boolean => {
	if (typeof document === 'undefined' || !document.fonts) return false;
	const ok = new Set<string>();
	document.fonts.forEach((f) => {
		if (f.status === 'loaded') ok.add(f.family.replace(/["']/g, ''));
	});
	return ok.has(SANS) && ok.has(SERIF);
};

export const useFontsReady = (): boolean => {
	const [ready, setReady] = useState<boolean>(loaded);
	const [handle] = useState<number | null>(() => (loaded() ? null : delayRender('Sketch: wait for fonts')));

	useEffect(() => {
		if (ready) return;
		let alive = true;
		let tries = 0;
		const tick = () => {
			if (!alive) return;
			// 最多等 ~10s；真加载失败也放行，避免整片渲染超时
			if (loaded() || tries++ > 400) {
				setReady(true);
				return;
			}
			setTimeout(tick, 25);
		};
		tick();
		return () => {
			alive = false;
		};
	}, [ready]);

	useEffect(() => {
		if (ready && handle !== null) continueRender(handle);
	}, [ready, handle]);

	return ready;
};
