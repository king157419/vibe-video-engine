// lab/fable「手绘讲解」的视觉常量。画布 1920×1080；场景画在一张更大的「世界」纸上，由镜头平移缩放。

export {SANS, SERIF} from '../../lib/fonts';

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const TAIL_MS = 1500; // 念完后停留

export const PAPER = '#FAF8F2';
export const INK = '#2F2A26'; // 主墨线
export const INK_SOFT = '#6A645C'; // 次要线/字
export const FAINT = '#C2BBAF'; // 铅笔草稿 / 退到背景的线
export const AMBER = '#E9A93A'; // 唯一的强调色：需要、关键词、火
export const AMBER_DEEP = '#D48F1E';
export const CAP_INK = '#2B2B2B';
export const CAP_DIM = '#A59E92';

export const inkA = (a: number) => `rgba(47,42,38,${a})`;
export const amberA = (a: number) => `rgba(233,169,58,${a})`;

// 线宽（世界坐标，镜头 1:1 时的像素）
export const LW = {main: 4, thin: 2.6, hair: 1.8, marker: 7};

// 字幕带（屏幕坐标）
export const CAP = {y: 968, size: 46, gapEm: 0.36, fillMs: 140, lead: 120};

// 墨线呼吸：每 N 帧换一版抖动
export const BOIL_EVERY = 9;
export const BOIL_N = 2;
