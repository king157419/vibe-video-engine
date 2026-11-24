import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_HAND, FONT_SANS} from './theme';

// 霞鹜文楷 LXGW WenKai Medium（SIL OFL 1.1）按本片用字子集化 → public/v3/nightowl/fonts/wenkai-night.ttf
// （3_第三版资料/样片/nightowl/tools/make_font.py 生成）；字幕用思源黑体（public/fonts/NotoSansSC-VF.ttf）。
let started = false;

export const ensureFonts = () => {
	if (started || typeof document === 'undefined') return;
	started = true;
	const handle = delayRender('nightowl fonts');
	const faces = [
		new FontFace(FONT_HAND, `url(${staticFile('v3/nightowl/fonts/wenkai-night.ttf')})`, {weight: '500'}),
		new FontFace(FONT_SANS, `url(${staticFile('fonts/NotoSansSC-VF.ttf')})`, {weight: '100 900'}),
	];
	Promise.all(faces.map((f) => f.load()))
		.then((fs) => {
			fs.forEach((f) => document.fonts.add(f));
			return document.fonts.ready;
		})
		.then(() => continueRender(handle))
		.catch((err) => {
			console.error('font load failed', err);
			continueRender(handle);
		});
};
