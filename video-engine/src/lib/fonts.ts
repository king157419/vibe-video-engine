import {continueRender, delayRender, staticFile} from 'remotion';

// 只用免费可商用（SIL OFL）的思源字体，避免微软雅黑/楷体等商用字体版权风险
export const SANS = 'Noto Sans SC';
export const SERIF = 'Noto Serif SC';

let loaded = false;

export const ensureFonts = () => {
	if (loaded || typeof document === 'undefined') return;
	loaded = true;
	const handle = delayRender('load fonts');
	const faces = [
		new FontFace(SANS, `url(${staticFile('fonts/NotoSansSC-VF.ttf')})`, {weight: '100 900'}),
		new FontFace(SERIF, `url(${staticFile('fonts/NotoSerifSC-VF.ttf')})`, {weight: '200 900'}),
	];
	Promise.all(faces.map((f) => f.load()))
		.then((fs) => {
			fs.forEach((f) => document.fonts.add(f));
			continueRender(handle);
		})
		.catch((err) => {
			console.error('font load failed', err);
			continueRender(handle);
		});
};
