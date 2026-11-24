/** v4 公共主题：暗底、光是颜料、一屏一件事。片子可以覆盖颜色，但要保持「暗底 + 2–3 个语义色」。 */
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const FONT_ZH = 'V4 Serif SC';
export const FONT_EN = 'V4 Serif';
export const FONT_EN_IT = 'V4 Serif Italic';

export const C = {
	bg: '#03050a', // 近黑偏蓝
	bgWarm: '#070504', // 近黑偏暖（可选）
	text: '#e6e8e8',
	en: '#8a8f93',
	dim: '#5b6168',
	faint: '#2a3038',
	gold: '#f0d28c',
	goldCore: '#fff7d6',
	amber: '#c08a3e',
	cyan: '#8adcef',
	cyanDeep: '#3f8fa6',
	pink: '#ee5c80',
	ice: '#a9c8ff',
	silver: '#c9d2dc',
};

export type Sub = {t0: number; t1: number; zh: string; en?: string};
export type Chapter = {t: number; num: string; zh: string; en: string};
