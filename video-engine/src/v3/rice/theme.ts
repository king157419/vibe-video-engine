// 样片二《煮不死的种子》画面常量。配色照方案 §3.3 + 分镜表 §2：一种颜色从头到尾只代表一样东西。
export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const TAIL_S = 3.0; // 念完后留给终局卡定格的秒数

export const C = {
	bench: '#d9dcd8', // 实验台（画面底）
	benchDeep: '#c6cac5',
	ink: '#23272b', // HUD 文字和刻度
	inkSoft: '#5d6267',
	inkFaint: '#8a8f94',
	field: '#efe6d2', // 显微视野（明场）
	fieldEdge: '#c9bfa8',
	rim: '#7d786b',
	starch: '#fbf7ee', // 米粒（淀粉块）
	starchEdge: '#d8ccb2',
	bac: '#6b4fa0', // 革兰紫：活菌
	bacEdge: '#4d3878',
	spore: '#2f8f8a', // 青：芽孢
	shell: '#1f5f5b', // 芽孢硬壳
	misc: '#9a9486', // 灰：煮饭前的杂菌
	miscEdge: '#7c776b',
	toxin: '#d0417e', // 品红：只代表毒素
	cold: '#dfe9f0', // 冷藏叠色
	coldBar: '#a9c9dc', // 秒表条里的“冰箱时间”
	coldEdge: '#6f9bb5',
	coldInk: '#3f7598', // 冷蓝色的字（冰箱读数）
	warm: '#e2a356', // 秒表条里的“室温时间”
	warmEdge: '#b9782e',
	warmInk: '#9a5a17',
	paper: '#fbf8f1', // 卡片、纸签
	paperEdge: '#d6cfbf',
	meatCooked: '#b48a64', // 卤肉（不带粉）
	meatRaw: '#e3c9b5', // 生肉（不带粉）
	fungus: '#5a4030', // 木耳
	white: '#ffffff',
};

export const SANS = 'Noto Sans SC';
export const SERIF = 'Noto Serif SC';
export const HAND = 'LXGW WenKai Rice';

// 版式（分镜表 §2；双视野直径从 600 收到 580，给下方两行读数多留 20 像素，见自检记录）
export const L = {
	topY: 30,
	topH: 65,
	capTop: 940, // 字幕带上沿：动画焦点不进这一带
	single: {cx: 960, cy: 470, r: 380},
	dualL: {cx: 500, cy: 460, r: 290},
	dualR: {cx: 1420, cy: 460, r: 290},
};
