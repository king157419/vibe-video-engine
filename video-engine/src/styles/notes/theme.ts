import {SAFE} from '../../lib/safe';

// 「读书笔记」样式：暖纸 + 墨色 + 荧光笔 + 红铅笔
export const PAPER = '#F4EDE1';
export const CARD = '#FBF7EE';
export const INK = '#2B2622';
export const INK_FRESH = '#7A6858'; // 刚落笔的墨色（稍浅），随后“干”成 INK
export const MARK = '#F6D365';
export const RED = '#C0533A';
export const inkA = (a: number) => `rgba(43,38,34,${a})`;
export const redA = (a: number) => `rgba(192,83,58,${a})`;

// 整个系列讲的是同一本书（meta 里可用 book/author 覆盖）
export const BOOK = '《养育你内心的小孩》';
export const AUTHOR = '丛非从';

// ---------- 版面几何（1080x1920） ----------
// 所有文字都在 SAFE（lib/safe.ts：x 80–880、y 240–1480）内，且底部再收紧到 1440（任务给的抖音底部文案区）
export const TEXT_X = 96; // 正文左缘
export const TEXT_R = SAFE.right; // 880
export const TEXT_W = TEXT_R - TEXT_X; // 784
export const TEXT_BOTTOM = Math.min(SAFE.bottom, 1440);
export const MARGIN_X = 70; // 红色页边线（装饰，安全区外可以）

// 页眉：书名·作者 + 页码 → 双线 → 章节（红）→ 本期标题（常驻，从封面大标题缩上来）
export const HEAD_TOP = Math.max(SAFE.top + 10, 250);
export const HEAD_RULE = HEAD_TOP + 56; // 306
export const CHAPTER_TOP = HEAD_RULE + 16; // 322
export const PT_TOP = CHAPTER_TOP + 44; // 366：本期标题
export const PT_SIZE = 46; // 本期标题最大字号
export const PT_MIN = 34;
export const PT_LH = 58;

// 笔记：横线行距 = 字幕行高
export const ROW = 100;
export const NOTES_TOP = 470; // 第 0 行顶部
// 视窗 6 行（470..1070）：当前句组最多 4 行 + 2 行旧笔记；正在念的行最低落在第 5 行（字心 y≈1020），
// 下方 1150..1430 留给“目录卡”（五种需要），避免整页头重脚轻
export const VISIBLE = 6;
export const ANCHOR = 5; // 当前行最后一行的最大行号（0 起）
export const START_ROW = 2; // 第一句从第 2 行（字心 y≈720）写起：视线落点一开始就在屏幕中部
export const RULE_Y = 91; // 横线在一行里的位置（字脚下方）
export const FADE_TOP = 70; // 视窗在第 0 行上方多留的高度（给滚出去的字渐隐用）
export const MASK_CLEAR = PT_TOP + PT_LH + 14; // 此线以上完全透明（盖不到本期标题）
export const MASK_SOLID = NOTES_TOP; // 此线以下完全不透明
export const GROUP_CAP = 4; // 一个句组最多几行

export const CAP = {
	base: 66,
	min: 58,
	shrinkOk: 0.93, // 只需缩到 base*0.93 以内时宁可缩字也不折行（先收字距，再缩字号）
	weight: 600,
	gapEm: 0.36,
	postPadEm: 0.14, // 行内标点 halt 成半角后再补 0.14em，逗号后不挤也不空
	lsEm: 0.02,
	lsMin: -0.02, // 放不下时先把字距收到这里，再缩字号
};

export const COVER = {
	holdEnd: 22, // 帧：封面完整停留到这里（~0.73s；第 0 帧即封面图）
	morphEnd: 36, // 帧：大标题缩成页眉下的“本期标题”（1.2s）
	revealStartMs: 1150, // 封面期间念过的字从这里开始“追写”
	catchupMs: 30,
};

export const INK_MS = 150; // 单字墨迹显现时长
export const OLD_TEXT = 0.45; // 旧句子透明度（手机上仍可辨认，但不抢当前句）
export const OLD_KW = 0.52; // 旧句子里的关键词只比正文略亮
export const OLD_MARK_FADE = 0.5; // 旧句子荧光笔：0.76*(1-0.5)
export const OLD_ACCENT = 0.5; // 旧句子红铅笔批注
export const FAR_ROWS = 4; // 比当前行高出这么多行的旧笔记再淡一档
export const FAR_FACTOR = 0.75; // 0.45 → 0.34

// 结尾（最后一个字念完之后）：理想时长 ms；尾巴短时按比例压缩，见 Notes.tsx endTimeline
export const END = {
	ideal: 4200, // 建议的片尾总长（金句停 ≥1.2s + 落款写完 + 静止 ≥2s）
	holdMin: 150,
	holdMax: 650,
	glideMin: 450,
	glideMax: 700,
	ctaMin: 420,
	ctaMax: 650,
};
