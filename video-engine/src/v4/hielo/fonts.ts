import {continueRender, delayRender, staticFile} from 'remotion';

/** 打字机字体 Special Elite（Apache 2.0）：西语、法语、德语原文用。
 *  黑体 Noto Sans SC（OFL）：只给「标题党」那一下用。中文正文仍是 kit 的思源宋体。 */
export const FONT_TW = 'Hielo Typewriter';
export const FONT_SANS = 'Hielo Sans SC';
let loaded = false;
export const ensureHieloFonts = () => {
	if (loaded || typeof document === 'undefined') return;
	loaded = true;
	const handle = delayRender('load hielo fonts');
	const faces = [
		new FontFace(FONT_TW, `url(${staticFile('v4/hielo/fonts/SpecialElite-Regular.ttf')})`),
		new FontFace(FONT_SANS, `url(${staticFile('fonts/NotoSansSC-VF.ttf')})`, {weight: '100 900'}),
	];
	Promise.all(faces.map((f) => f.load()))
		.then((fs) => {
			fs.forEach((f) => document.fonts.add(f));
			continueRender(handle);
		})
		.catch((err) => {
			console.error('hielo fonts failed', err);
			continueRender(handle);
		});
};
