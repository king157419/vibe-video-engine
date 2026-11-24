import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_HAND, FONT_SANS} from './theme';

// 手写体：霞鹜文楷 LXGW WenKai Medium（SIL OFL 1.1，github.com/lxgw/LxgwWenKai v1.522），
// 用 tools/subset_font.py 按本集用到的字子集化，放在 public/lab/opus/fonts/。
// 字幕：思源黑体 Noto Sans SC（OFL，项目已有）。
let started = false;

export const ensureFonts = () => {
	if (started || typeof document === 'undefined') return;
	started = true;
	const handle = delayRender('opus fonts');
	const faces = [
		new FontFace(FONT_HAND, `url(${staticFile('lab/opus/fonts/wenkai-sub.ttf')})`, {weight: '500'}),
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
