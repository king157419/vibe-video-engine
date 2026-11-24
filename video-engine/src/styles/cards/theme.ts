// 「知识卡片」样式的配色 / 几何常量 / 小工具
export const C = {
	bg: '#FAF6EF',
	ink: '#1F1F1F',
	card: '#FFFFFF',
	peek1: '#FDFBF7',
	peek2: '#F4EEE4',
	coral: '#E07A6A',
	cream: '#FAF6EF',
	// 非「五种需要」的关键词 chip 用中性色，让珊瑚色只代表「亲密」
	neutralBg: '#EFE9DF',
	strip: '#F2ECE2',
};

// 五种需要（丛非从）：安全感 / 自由 / 价值感 / 意义 / 亲密
export const NEEDS = ['安全感', '自由', '价值感', '意义', '亲密'];
export const NEED_COLORS = ['#4F7CAC', '#6BAA75', '#E0A84F', '#9B6FB5', '#E07A6A'];

// 系列默认书目（meta.book / meta.author 可覆盖）
export const BOOK = {title: '养育你内心的小孩', author: '丛非从'};

/**
 * 字幕 char.s 比实际听到的字头早 ~150ms（TTS 时间戳偏差）。
 * 只加在“跟着声音走”的事件上：卡拉 OK 点亮、关键词划线、chip 飞行、阅读条。卡片/行的出现不加。
 */
export const SYNC_MS = 110;

// 1080x1920；文字全部落在 SAFE(80..910, 220..1440) 内，卡片底色可略超出
export const G = {
	// 卡片
	cardX: 60,
	cardW: 870,
	cardBottom: 1266,
	radius: 36,
	padX: 52,
	padTop: 40,
	padBottom: 46,
	headerH: 44,
	headerGap: 24,
	// 正文（卡拉 OK）
	lh: 1.42,
	lineGap: 10,
	maxFs: 96,
	maxFsBig: 110, // 短句 / 含关键词 / 最后一组 允许更大
	minFs: 58,
	splitBelow: 62, // 单行放不下 62px 就在停顿/非关键词处断成两行
	gapEm: 0.2, // 没有稿子可对齐标点时，停顿渲染成的间距
	bodyPad: 54, // 正文上下留白
	minH: 560, // 卡片最小高度
	// 顶部（胶囊离抖音顶栏再远一点）
	topRowY: 262,
	pillH: 58,
	progressY: 340,
	trackerY: 368,
	trackerH: 64,
	trackerGap: 14,
	cardTopWithTracker: 474,
	cardTopNoTracker: 398,
	// 封面（竖向居中，填满 3:4 主页裁切区）
	coverTop: 404,
	coverBottom: 1420,
	// 书目条
	bookY: 1316,
	bookH: 58,
	// 牌堆
	peek1: 21,
	peek2: 40,
	peekScale1: 0.97,
	peekScale2: 0.94,
	flick: 8, // 顶卡甩走的帧数
	// 五种需要网格
	tileH: 150,
	tileGap: 18,
	// chip 飞行（帧）
	flyPop: 3,
	fly: 12,
};

export const INNER_W = G.cardW - 2 * G.padX; // 766
export const SAFE_X = 80;
export const SAFE_R = 910;

const hex = (h: string): [number, number, number] => {
	const v = parseInt(h.slice(1), 16);
	return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

export const mix = (a: string, b: string, t: number): string => {
	const A = hex(a);
	const B = hex(b);
	return (
		'#' +
		A.map((x, i) =>
			Math.round(x + (B[i] - x) * t)
				.toString(16)
				.padStart(2, '0'),
		).join('')
	);
};

export const alpha = (h: string, a: number): string => {
	const [r, g, b] = hex(h);
	return `rgba(${r},${g},${b},${a.toFixed(3)})`;
};

/** 浅色底（chip / 高亮块） */
export const tint = (c: string, t = 0.82) => mix(c, '#FFFFFF', t);
/** 加深，用于浅底上的文字 */
export const deep = (c: string, t = 0.34) => mix(c, C.ink, t);

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
