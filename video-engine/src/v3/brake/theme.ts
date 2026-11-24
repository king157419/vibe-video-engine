// 配色、字体、版式常量（方案 §2.3，一色一义）
export const C = {
	asphalt: '#1d1f22',
	grain1: '#2a2d31',
	grain2: '#34373c',
	wetAsphalt: '#15171a',
	wetGrain1: '#1f2226',
	wetGrain2: '#262a2e',
	white: '#f2efe6', // 50 码的点和读数；斑马线；路面喷字
	shadow: '#0e0f11', // 漆的厚度阴影
	yellow: '#f2c230', // 60 码的点和读数
	gray: '#8b8f96', // 只给错误直觉（押注卡 A 的算法）
	grayText: '#b4b8be', // 同一系的灰，提亮：只用在规则段图例“按米”这种要和亮色并排读的灰字上（第二轮审片 P1-1）
	red: '#e0412f', // 全片只用一次：60 码撞线的“42”和越线那一小段
	car: '#6b6f76',
	carRoof: '#7d8188',
	carSide: '#55595f',
	parked: '#3b3e43',
	parkedRoof: '#45484e',
	skyTop: '#0f1420',
	skyHorizon: '#2a3346',
	ink: '#141517', // 黄底上的黑字
	panel: '#26292d', // 小卡底（比沥青略亮的哑光漆面）
};

export const SANS = 'Noto Sans SC';
export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const TAIL_S = 2.6; // 配音念完后的片尾（分镜表 §0：durationMs + 2.6 s）
export const SUB_TOP = H - 140; // 字幕带上沿：画面焦点不进这一带

// ───────── 俯视“世界”坐标：单位 = 俯视画面像素（缩放 1 时与屏幕一致） ─────────
export const PX_PER_M = 34; // numbers.json assumptions.px_per_m
// 偏离：分镜建议“看见人”那一刻车头 x = 250；整体右移 80 px 到 330，给左边保留的 A 卡腾位置
export const X0 = 330;
export const gx = (m: number) => X0 + m * PX_PER_M;
export const RY50 = 400; // 上路（50 码，白）车道中心
export const RY60 = 680; // 下路（60 码，黄）车道中心
export const LANE = 3.5 * PX_PER_M; // 车道宽 119 px
export const CAR_L = 4.5 * PX_PER_M; // 车长 153 px
export const CAR_W = 1.8 * PX_PER_M; // 车宽 61 px
export const DOT_OFF = 44; // 漆点轨迹在车右侧（俯视里是车的下方，挨着路缘实线），离车道中心 44 px；避开分隔虚线
export const DOT_R = 8;
/** 漆点在屏幕上的半径：随镜头推近变大，但最多放大 1.8 倍（③b 推近到 2.4 倍时，停车前那几个点不至于糊成一团） */
export const dotR = (z: number) => DOT_R * Math.min(z, 1.8);
export const BAND = 540; // 上下两条路的分界（两个平行时空）

export const fmt = (x: number, n = 1) => x.toFixed(n);
