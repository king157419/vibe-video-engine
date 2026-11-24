/** 字体：和 kit/fonts.ts 加载同样的三套字体（同名），但返回一个「已就绪」状态。
 *  画布上要画字（片名、粒子采样），必须等字体真的加载完再画，否则第一帧会用错字体。 */
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_EN, FONT_EN_IT, FONT_ZH} from '../kit/theme';

let promise: Promise<void> | null = null;

const load = () => {
	if (!promise) {
		const faces = [
			new FontFace(FONT_ZH, `url(${staticFile('fonts/NotoSerifSC-VF.ttf')})`, {weight: '200 900'}),
			new FontFace(FONT_EN, `url(${staticFile('fonts/NotoSerif-Regular.ttf')})`, {weight: '400'}),
			new FontFace(FONT_EN_IT, `url(${staticFile('fonts/NotoSerif-Italic.ttf')})`, {weight: '400', style: 'italic'}),
		];
		promise = Promise.all(faces.map((f) => f.load()))
			.then((fs) => {
				fs.forEach((f) => document.fonts.add(f));
				return Promise.all([
					document.fonts.load(`500 150px "${FONT_ZH}"`, '峰终'),
					document.fonts.load(`340 54px "${FONT_ZH}"`, '此情可待成追忆'),
					document.fonts.load(`400 20px "${FONT_EN}"`, 'A'),
					document.fonts.load(`italic 400 20px "${FONT_EN_IT}"`, 'A'),
				]);
			})
			.then(() => undefined);
	}
	return promise;
};

export const useFontsReady = () => {
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('peak fonts'));
	useEffect(() => {
		load()
			.then(() => setReady(true))
			.catch((e) => {
				console.error('peak fonts failed', e);
				setReady(true);
			});
	}, []);
	useEffect(() => {
		if (ready) continueRender(handle);
	}, [ready, handle]);
	return ready;
};
