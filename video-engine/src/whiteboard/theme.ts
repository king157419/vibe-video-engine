// 白板设计系统：整季共用的视觉常量。
// 世界坐标 = 一张很大的纸，镜头在上面平移/缩放。屏幕 1920×1080，底部 150px 是阅读字幕带。

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** 画面内容区（屏幕坐标）。镜头取景时把框装进 [top, bottom]，底部字幕带永远不被画面占用。 */
export const STAGE = {top: 36, bottom: 930, cx: 960};
export const STAGE_H = STAGE.bottom - STAGE.top; // 894
export const STAGE_CY = (STAGE.top + STAGE.bottom) / 2; // 483

/** 屏幕上文字的最小字号（px，1080p，已乘镜头缩放） */
export const MIN_TEXT_PX = 36;
/** 一条屏幕字最多几个字 */
export const MAX_LABEL_CHARS = 12;

export type ClauseKey = 'red' | 'orange' | 'blue' | 'purple';

export const C = {
	paper: '#F6F1E6',
	card: '#FBF8F1', // 叠在纸上的便签/卡片（不透明，用来盖住下面的东西）
	ink: '#2A2622', // 主墨线、正文
	pencil: '#A0988C', // 铅笔草稿、辅助线、次要说明
	pencilDark: '#7C746A',
	shade: '#E4DACB', // 很淡的底色块（格子底、阴影）
	// —— 四种句尾颜色（全季固定语义，只给句尾/条款用） ——
	red: '#C8472F', // 出事 · 防 · 安全感
	redDeep: '#98331F',
	orange: '#E0892A', // 必须 · 关 · 自由
	orangeDeep: '#A35D12',
	blue: '#3D6EA6', // 不行 · 评 · 价值感
	blueDeep: '#2A4F7C',
	purple: '#7E57A0', // 不在乎 · 等 · 亲密
	purpleDeep: '#5A3B78',
	// —— 非语义 ——
	accent: '#C99A2E', // 琥珀强调：尽量不用（和橙色太近）；只给笔杆这类装饰
	hl: '#E3D5B8', // 字幕关键词下面的「牛皮纸色」记号
	screen: '#2E2A26', // 熄屏
	error: '#D0198C', // 只给出错标记用（section 构建失败）
} as const;

export type ClauseInfo = {
	key: ClauseKey;
	letter: 'A' | 'B' | 'C' | 'D';
	color: string;
	deep: string;
	/** 句尾（观众只记这个） */
	end: string;
	/** 口诀：在做什么 */
	verb: string;
	/** 书里的需要名 */
	need: string;
	/** EP01 开头那条消息的四种补法（屏幕短版 ≤6 字，联想栏里写的就是它） */
	sample: string;
	/** 念的全句 */
	sampleFull: string;
	name: string; // 红/橙/蓝/紫
};

/** 四种句尾（顺序固定：A 红 · B 橙 · C 蓝 · D 紫）。第五格：留白 + 问号（C.pencil 虚线）。 */
export const CLAUSES: ClauseInfo[] = [
	{key: 'red', letter: 'A', color: C.red, deep: C.redDeep, end: '出事', verb: '防', need: '安全感', sample: '出什么事了', sampleFull: '是不是出什么事了？', name: '红'},
	{key: 'orange', letter: 'B', color: C.orange, deep: C.orangeDeep, end: '必须', verb: '关', need: '自由', sample: '我得再发一条', sampleFull: '我得再发一条，把话说软点', name: '橙'},
	{key: 'blue', letter: 'C', color: C.blue, deep: C.blueDeep, end: '不行', verb: '评', need: '价值感', sample: '我又说错话了', sampleFull: '是不是我又说错话了？', name: '蓝'},
	{key: 'purple', letter: 'D', color: C.purple, deep: C.purpleDeep, end: '不在乎', verb: '等', need: '亲密', sample: '没把我当回事', sampleFull: '对方就是没把我当回事', name: '紫'},
];
export const CLAUSE: Record<ClauseKey, ClauseInfo> = Object.fromEntries(CLAUSES.map((c) => [c.key, c])) as Record<ClauseKey, ClauseInfo>;
export const clauseIndex = (k: ClauseKey | number): number => (typeof k === 'number' ? k : CLAUSES.findIndex((c) => c.key === k));
export const clauseOf = (k: ClauseKey | number): ClauseInfo => CLAUSES[clauseIndex(k)];

/** 第五格（余量 / 意义感）：EP01 只画问号，不上色 */
export const FIFTH = {end: '？', verb: '？', need: '意义感', color: C.pencil};

export const FONT_HAND = 'LXGW WenKai WB';
export const FONT_SANS = 'Noto Sans SC WB';

/** 一个字大约多宽（em）。霞鹜文楷的汉字是等宽 1em，数字/拉丁约半宽 */
export const charEm = (ch: string): number => {
	if (/[⺀-鿿＀-￯　-〿‘-”…—①-⑳■-◿☀-➿]/.test(ch)) return 1;
	if (ch === ' ') return 0.3;
	if (/[0-9]/.test(ch)) return 0.56;
	if (/[:.,'′;!|]/.test(ch)) return 0.3;
	if (/[A-Z]/.test(ch)) return 0.62;
	return 0.52;
};
export const textW = (s: string, size: number) => Array.from(s).reduce((a, ch) => a + charEm(ch), 0) * size;
