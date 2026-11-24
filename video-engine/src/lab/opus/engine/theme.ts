// 设计系统：整季共用的视觉常量。世界坐标 = 一张无限大的纸，镜头在上面平移缩放。

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** 画面内容区（屏幕坐标）：底部 150px 留给阅读字幕 */
export const STAGE = {top: 36, bottom: 930, cx: 960};
export const STAGE_CY = (STAGE.top + STAGE.bottom) / 2;

export const C = {
	paper: '#F6F1E6',
	ink: '#2A2622', // 主墨线、正文
	pencil: '#A0988C', // 铅笔草稿、辅助说明
	pencilDark: '#7C746A',
	amber: '#E49B2F', // 全季母题：「需要」的颜色，只给最底层用
	amberDeep: '#8A5210', // 琥珀色上的字
	red: '#C9492E', // 情绪/划掉，一集最多出现几次
	screen: '#2E2A26', // 手机熄屏
};

export const FONT_HAND = 'LXGW WenKai Opus';
export const FONT_SANS = 'Noto Sans SC';

/** 一个字大约多宽（em）。霞鹜文楷的汉字是等宽 1em，数字/拉丁约半宽 */
export const charEm = (ch: string): number => {
	if (/[⺀-鿿＀-￯　-〿‘-”…]/.test(ch)) return 1;
	if (ch === ' ') return 0.3;
	if (/[0-9]/.test(ch)) return 0.56;
	if (/[:.,'′]/.test(ch)) return 0.3;
	return 0.52;
};
export const textW = (s: string, size: number) => Array.from(s).reduce((a, ch) => a + charEm(ch), 0) * size;
