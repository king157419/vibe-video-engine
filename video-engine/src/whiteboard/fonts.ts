import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_HAND, FONT_SANS} from './theme';

// 手写体：霞鹜文楷 LXGW WenKai Medium（SIL OFL 1.1，github.com/lxgw/LxgwWenKai），
// 用 tools/wb_font.py 子集化（稿子全部用字 + GB2312 一级字 + ASCII + 常用标点/符号），
// 放在 public/wb/fonts/wenkai-sub.ttf。section 不需要再子集化。
// 字幕：思源黑体 Noto Sans SC（OFL，项目已有 public/fonts/）。
let started = false;

export const ensureFonts = () => {
	if (started || typeof document === 'undefined') return;
	started = true;
	const handle = delayRender('wb fonts');
	const faces = [
		new FontFace(FONT_HAND, `url(${staticFile('wb/fonts/wenkai-sub.ttf')})`, {weight: '500'}),
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
