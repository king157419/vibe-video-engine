import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_EN, FONT_EN_IT, FONT_ZH} from './theme';

let loaded = false;

/** 在 Composition 组件顶部调用一次。全部是 SIL OFL 字体（思源宋体 / Noto Serif）。 */
export const ensureV4Fonts = () => {
	if (loaded || typeof document === 'undefined') return;
	loaded = true;
	const handle = delayRender('load v4 fonts');
	const faces = [
		new FontFace(FONT_ZH, `url(${staticFile('fonts/NotoSerifSC-VF.ttf')})`, {weight: '200 900'}),
		new FontFace(FONT_EN, `url(${staticFile('fonts/NotoSerif-Regular.ttf')})`, {weight: '400'}),
		new FontFace(FONT_EN_IT, `url(${staticFile('fonts/NotoSerif-Italic.ttf')})`, {weight: '400', style: 'italic'}),
	];
	Promise.all(faces.map((f) => f.load()))
		.then((fs) => {
			fs.forEach((f) => document.fonts.add(f));
			continueRender(handle);
		})
		.catch((err) => {
			console.error('v4 font load failed', err);
			continueRender(handle);
		});
};
