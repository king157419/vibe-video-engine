import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {SERIF} from '../../lib/fonts';

// ensureFonts() 在字体加载完后才把 FontFace 加进 document.fonts，但 React 不会因此重渲染。
// 排版要用 measureText 量宽度，必须等衬线字体真的可用再量，否则会按回退字体排版且被缓存。
const serifLoaded = (): boolean => {
	if (typeof document === 'undefined' || !document.fonts) return false;
	let ok = false;
	document.fonts.forEach((f) => {
		if (f.family.replace(/["']/g, '') === SERIF && f.status === 'loaded') ok = true;
	});
	return ok;
};

export const useFontsReady = (): boolean => {
	const [ready, setReady] = useState<boolean>(serifLoaded);
	const [handle] = useState<number | null>(() => (serifLoaded() ? null : delayRender('Notes: wait for serif font')));

	useEffect(() => {
		if (ready) return;
		let alive = true;
		let tries = 0;
		const tick = () => {
			if (!alive) return;
			// 最多等 ~10s；字体真加载失败时也放行（ensureFonts 已打印错误），避免整片渲染超时
			if (serifLoaded() || tries++ > 400) {
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

	// 等 ready=true 的这次渲染提交之后再放行截图
	useEffect(() => {
		if (ready && handle !== null) continueRender(handle);
	}, [ready, handle]);

	return ready;
};
