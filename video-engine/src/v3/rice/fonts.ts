import {continueRender, delayRender, staticFile} from 'remotion';
import {HAND, SANS, SERIF} from './theme';

// 只用三种字体（CONTRACT §0.6）：思源黑体、思源宋体（public/fonts/），
// 霞鹜文楷（只用于 K7 里两处“手写改正”）：从 art-src 的完整字体按本片源码用字做的子集，
// 生成脚本 3_第三版资料/样片/rice/make_font.py → public/v3/rice/fonts/wenkai-rice.ttf。
let started = false;

export const ensureFonts = () => {
	if (started || typeof document === 'undefined') return;
	started = true;
	const handle = delayRender('rice fonts');
	const faces = [
		new FontFace(SANS, `url(${staticFile('fonts/NotoSansSC-VF.ttf')})`, {weight: '100 900'}),
		new FontFace(SERIF, `url(${staticFile('fonts/NotoSerifSC-VF.ttf')})`, {weight: '200 900'}),
		new FontFace(HAND, `url(${staticFile('v3/rice/fonts/wenkai-rice.ttf')})`, {weight: '500'}),
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
