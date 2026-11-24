// 《沙漏与潮水》视觉常量。配色照方案 §4.3：一种颜色从头到尾只代表一样东西。
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const COL = {
	paper: '#f6f1e7', // 纸（底）
	card: '#fbf7ee', // 叠在纸上的便签、小卷
	cardEdge: '#e7dfcf',
	ink: '#2b2b2b', // 墨：线条、人物、文字
	pencil: '#9b958c', // 很淡的辅助线（地平线、刻度）
	sleep: '#8a8580', // 睡意灰：沙漏、灰面积
	sleepText: '#6f6a65', // 睡意灰写字时略加深，保证 36px 能读
	tide: '#3d6fb6', // 清醒蓝：潮水
	drowsy: '#c8553d', // 困：淡红斜线（也用于公式里的“困”字、车祸图钉、方向盘红叉，都是“困/危险”）。审片 P1-2：不再用来表示“错”或“变了的东西”
	// 天色带（天色就是时钟）
	gold: '#f3e3a6',
	noon: '#f7efcf',
	dusk: '#e9a25f',
	indigo: '#2e3a6b',
	deep: '#1f2747',
	pink: '#e8b4b0',
	sun: '#e9a25f',
	lamp: '#f3e3a6',
} as const;

export const FONT_HAND = 'NightHand'; // 霞鹜文楷（子集）
export const FONT_SANS = 'NightSans'; // 思源黑体

/** 主长卷 1 倍时每小时多少像素；playhead 固定在屏幕 x=1560。
 *  审片 P0-2：原来 360 px/小时、playhead 在 1250，一屏只看得到约 3.5 小时，两条线几乎是直的；
 *  改成 160 px/小时、playhead 右移到 1560（右边只剩便签残影），一屏能看约 9.75 小时。 */
export const PX_PER_H = 160;
export const PLAYHEAD_X = 1560;
/** 开卷时长卷左端停在屏幕 x=520（让开左上纸签），playhead 先从左往右走到 1250，镜头才开始跟 */
export const SCROLL_LEFT_X = 520;
/** 审片（第二轮）P1-1“B = 缝”：一屏总览里把潮水拉直到 v=0.45，沙漏线跟着落同样的高度（缝的厚度不变）。
 *  压平后沙漏线 = 0.45 + (沙漏 − 潮水)，范围约 0.15–0.81，整条落在图表区中间 */
export const FLAT_VB = 0.45;
/** 常驻公式条的字号（审片第二轮 P2-6：常驻 48 px、全景 56 px；公式卡本身按 42 px 排版，用缩放得到） */
export const FORMULA_K = 48 / 42;
export const FORMULA_K_PANO = 56 / 42;
