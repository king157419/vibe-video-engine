// 「手绘框架·边画边讲」的全部视觉常量。坐标都是 1080x1920 画布上的像素。

export const PAPER = '#FAFAF7';
export const INK = '#333333'; // 图上的墨线
export const CAP_INK = '#2B2B2B'; // 字幕已念
export const CAP_DIM = '#9A948A'; // 字幕未念
export const AMBER = '#F5B942';
export const FAINT = '#BFBDB8'; // 未点亮的铅笔草稿（手机上也要看得见，约 1.8:1）
export const FAINT_LABEL = '#918C84'; // 未点亮节点的字（约 3.2:1，整张图一直可读）
// 说到“五种需要”但还没逐个圈出来时：草稿先整体加深一档（预告），等被说到再上墨
export const CUE_LINE = '#9C978E';
export const CUE_LABEL = '#6E6961';
export const SOFT = '#5E5A53'; // 次要文字
export const MUTED = '#8C877E';
export const NOTE_FILL = '#FFF5DA';

export const inkA = (a: number) => `rgba(51,51,51,${a})`;
export const amberA = (a: number) => `rgba(245,185,66,${a})`;

// ---- 抖音安全区（比 lib/safe.ts 更严的调研值）----
export const SAFE_L = 80;
export const SAFE_R = 880;
export const SAFE_CX = (SAFE_L + SAFE_R) / 2; // 480：内容的视觉中轴
export const SAFE_W = SAFE_R - SAFE_L;

// ---- 字幕 ----
export const CAP = {
	top: 1280,
	bottom: 1470,
	base: 66,
	min: 50,
	maxChars: 12, // 每行最多字数（不含停顿空白）
	width: 790,
	gapEm: 0.32, // 口播停顿处的小间隔
	lineH: 1.34,
	fillMs: 150, // 单字由灰变墨的时长
};

// ---- 顶部标签 ----
export const TOP_LABEL = {y: 274, size: 34, min: 29, maxW: 760};

// ---- 中心图 ----
export const CENTER = {x: SAFE_CX, y: 742};
export const HEART_W = 236; // 中心“内心的小孩”心形宽度
export const RING_R = 305; // 五个需要围绕中心的半径

// badge：说完五个需要后笔在圈边写的序号 01–05 的位置（圈边上的角度，避开连线和便利贴）
export type NeedDef = {id: string; label: string; alias: string[]; angle: number; dR: number; r: number; seed: number; badge: number};

// 书里的五种需要。顺时针从 12 点开始，恰好也是书里的叙述顺序。角度/半径略加扰动，像手画的而不是正五边形。
export const NEEDS: NeedDef[] = [
	{id: 'safe', label: '安全感', alias: ['安全感', '安全'], angle: -88, dR: 0, r: 93, seed: 11, badge: -40},
	{id: 'free', label: '自由', alias: ['自由'], angle: -21, dR: 6, r: 89, seed: 23, badge: -95},
	{id: 'worth', label: '价值感', alias: ['价值感', '价值'], angle: 56.5, dR: -4, r: 95, seed: 37, badge: 12},
	{id: 'meaning', label: '意义', alias: ['意义'], angle: 124, dR: 5, r: 90, seed: 41, badge: 168},
	{id: 'close', label: '亲密', alias: ['亲密'], angle: 201, dR: -6, r: 93, seed: 53, badge: -140},
];

export const CENTER_LABEL = '内心的小孩';
// 说到这些词中心的心会跳一下；心的轮廓在封面之后立刻画出来，琥珀色要等到“小孩”被正式点名（FILL）才涂上
export const CENTER_ALIAS = ['内心的小孩', '小孩', '孩子'];
export const CENTER_FILL_ALIAS = ['内心的小孩', '小孩'];
// 说到“五种需要”：还没圈完时五个草稿依次加深一跳（预告）；五个都圈完之后再说到，笔在每个圈边写上 01–05（系列路线图）
export const ALL_NEEDS_ALIAS = ['五种需要', '五种需求', '五个需要', '五个需求'];

// ---- 便利贴：图四周预留的空位（x/y 为中心点，maxW 为便利贴最大宽度）----
export type Slot = {x: number; y: number; maxW: number; rot: number};
export const SLOTS: Slot[] = [
	{x: 226, y: 404, maxW: 284, rot: -3},
	{x: 740, y: 404, maxW: 270, rot: 2.6},
	{x: 480, y: 1180, maxW: 250, rot: -1.6},
	{x: 196, y: 1184, maxW: 212, rot: 2.2},
	{x: 764, y: 1182, maxW: 212, rot: -2.4},
];
export const NOTE = {font: 46, minFont: 34, padX: 24, padY: 14, full: 3, oldOpacity: 0.3};

// 口播里常见的“症状词”：关键词不够时（尤其开场钩子段）用它们补便利贴，箭头一律指向中心的小孩（症状 → 小孩）。
// captions.keywords 优先；补的词之间至少隔 gap，全片最多 max 张。否定语境多的词（变强等）不收。
export const SYMPTOMS = [
	'委屈',
	'矫情',
	'被忽略',
	'不重要',
	'睡不着',
	'失眠',
	'焦虑',
	'内耗',
	'讨好',
	'自卑',
	'孤独',
	'愧疚',
	'羞耻',
	'不配',
	'崩溃',
	'玻璃心',
	'小时候',
	'童年',
];
export const LEX = {gap: 2600, max: 5};

// ---- 手绘参数 ----
export const ROUGH = {roughness: 1.4, bowing: 1};
export const STROKE_W = 4;
export const BOIL_EVERY = 8; // 墨线“呼吸”：每 8 帧换一版抖动（约 3.75 次/秒）
export const BOIL_VARIANTS = 3;

// ---- 时间（ms）----
// 封面停留到第一句念完（夹在 min..max），再用 out 毫秒转到正片
export const COVER_MS = {min: 1200, max: 1800, out: 650, fallback: 1400};
export const DRAW = {circle: 620, minCircle: 280, line: 260, minLine: 150, heart: 760, fill: 420, arrow: 360, head: 160, badge: 230, badgeGap: 250};
export const END = {after: 300}; // 最后一句念完多久进入片尾（尾巴太短时自动提前，保证片尾至少 2s）
// 心形在被正式点名之前，每句开头跳一下（lub-dub，至少隔 gap），像心里那个小孩在喊你
export const CALL = {beat: 560, gap: 2600, amp: 0.05};
// 笔闲下来超过 idle 就把镜头缓慢推近（最多 amount），下一笔之前 release 毫秒内拉回
export const PUSH = {idle: 4000, ramp: 2600, amount: 0.04, release: 800, toward: 0.4};
export const MAP_SCALE = {cover: 0.68, end: 0.8};
export const MAP_Y = {cover: 1030, end: 640}; // 各阶段图中心的 y

export const BOOK = '养育你内心的小孩';
export const AUTHOR = '丛非从';
export const CTA = '收藏这张图，下期接着聊';
export const SERIES_FALLBACK = '内心的小孩 · 读书笔记';
export const DISCLAIMER = '读书分享，非心理咨询';
