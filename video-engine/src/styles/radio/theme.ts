import {Easing} from 'remotion';
import {SAFE} from '../../lib/safe';

// 「深夜电台」配色：深蓝夜色 + 暖琥珀灯光 + 米白字
export const BG_TOP = '#0B0F1A';
export const BG_BOTTOM = '#161C30';
export const AMBER = '#F2B872';
export const TEXT = '#F5F1E8';

export const amber = (a: number) => `rgba(242,184,114,${a.toFixed(3)})`;
export const cream = (a: number) => `rgba(245,241,232,${a.toFixed(3)})`;
/** 关键词点亮：从「和普通未念字一样的 35% 米白」过渡到「满琥珀」（避免未念关键词在深蓝上显得发灰发棕） */
export const creamToAmber = (p: number, fromA = 0.35) => {
	const k = p < 0 ? 0 : p > 1 ? 1 : p;
	const r = Math.round(245 + (242 - 245) * k);
	const g = Math.round(241 + (184 - 241) * k);
	const b = Math.round(232 + (114 - 232) * k);
	return `rgba(${r},${g},${b},${(fromA + (1 - fromA) * k).toFixed(3)})`;
};

/** 所有前景内容都以 SAFE 矩形的水平中线为轴（避开右侧按钮列） */
export const CX = (SAFE.left + SAFE.right) / 2;

// 纵向布局（1080x1920）
export const HEADER_TOP = 238;
export const CAPTION_Y = 806; // 42% 高度
export const WAVE_Y = 1120;

// 时间（ms）
// 封面 → 题眼：第 0 帧是完整封面；150ms 起钩子上移缩成题眼（副标题、光晕立即收掉），
// 以 70% 亮度挂在字幕上方，直到第一句念完 +250ms 再淡出。声音和第一句字幕照常在 ~0.1s / 0.25s 开始。
export const COVER_HOLD_MS = 150; // 封面完整停留
export const COVER_MOVE_MS = 450; // 钩子上移+缩小成题眼
export const HEADLINE_Y = 470; // 题眼中心
export const HEADLINE_SCALE = 0.5;
export const HEADLINE_OPACITY = 0.7;
export const HEADLINE_AFTER_FIRST_MS = 250; // 第一句念完后题眼再停多久
export const HEADLINE_FADE_MS = 300;
export const CAPTION_REVEAL_MS = 250; // 有封面时，第一行字幕最早出现的时间（会被第一行的时长再夹一次）
export const ENTER_MS = 220; // 行入场：淡入+上浮
export const ENTER_LEAD_MS = 100; // 行比声音早一点出现（但绝不早于上一行念完）
export const EXIT_MS = 320; // 上一行：上飘+淡出
export const EXIT_LEAD_MS = 340; // 有停顿时，旧行最多提前多久离场（保证新行升起时旧行已几乎看不见）
export const TIGHT_GAP_MS = 300; // 两句之间的空隙小于它时：旧行在念完那一刻就快速离场
export const FAST_EXIT_MS = 180;
export const FAST_ENTER_AFTER_MS = 90; // 快速离场开始后多久新行才出现（此时旧行 <15%）
export const KARAOKE_LEAD_MS = 15; // 字几乎与声音同时亮（逐字时间戳与音频起音的整体偏差只有 ~20ms）
export const ONSET_GAP_MS = 100; // 静音超过它（或原文空格处）之后的第一个字：TTS 词边界比真正发声早 ~150ms（词内间隙只有 0–14ms）
export const ONSET_DELAY_MS = 120; // 这类字推迟这么久再亮

// 收尾：最后一句念完后原地不动、保持点亮；结尾卡在它下面长出来（不缩小、不赶走金句）
export const FINAL_MIN_HOLD_MS = 200; // 最后一句念完后至少停这么久，结尾卡才开始出现
export const FINAL_HOLD_MS = 1200; // 尾巴够长时最多停这么久
export const END_LINE_GAP = 34; // 最后一句与结尾卡之间的空隙
export const END_GROUP_Y = 880; // 「最后一句 + 结尾卡」整体的目标垂直中心
export const END_MAX_LIFT = 140; // 最后一句最多上移这么多（只平移，不缩小）
export const CTA_MIN_MS = 1700; // 希望「关注我」完整可见的时长（尾巴够长时会更久）
export const END_IN_MS = 720; // 结尾卡分段进场总时长（尾巴短时会被压缩）

// 画面「内容时刻」：书名牌、关键词胶囊（位于频谱下方、抖音底部文案之上）
export const MOMENT_Y = 1300;
export const MOMENT_MAXW = 740;
export const MOMENT_IN_MS = 420;
export const MOMENT_OUT_MS = 420;

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** 期数显示成人话：EP00 → 序章，EP03 / 3 / 第3期 → 第3期；认不出的原样返回 */
export const episodeLabel = (raw: string | undefined): string | undefined => {
	const s = raw?.trim();
	if (!s) return undefined;
	const m = /^(?:ep|e|no\.?|第)?\s*0*(\d+)\s*(?:期|集|话)?$/i.exec(s);
	if (!m) return s;
	const n = Number(m[1]);
	return n === 0 ? '序章' : `第${n}期`;
};
