/** 画面里出现的每一个数，都在这里由常数算出来（常数照抄 timeline_meta.json）。 */
import {meta} from './data';

const N = meta.numbers;

// II 章：回应峰高（示意倍数），以及「1 年」刻度下 10 小时那一截的像素宽
export const PEAK_BASE = meta.II.peak_base_px; // 56
export const PEAK_AFTER = meta.II.peak_base_px * meta.II.peak_multiplier_illustrative; // 56 * 1.8 = 100.8
export const AXIS_W = meta.II.axis_w_px; // 1400
export const HOURS_PER_YEAR = 365.25 * 24; // 8766
export const TEN_H_PX = (N.bliss_lomo_max_hours / HOURS_PER_YEAR) * AXIS_W; // 10 / 8766 * 1400 = 1.597

// III 章：860 亿，一秒数一个要数多少年；画面实际画了多少颗
export const NEURONS = N.neurons; // 8.6e10
export const COUNT_YEARS = N.neurons / (365.25 * 86400); // 2725.2
export const FIELD_PARTICLES = N.particles_drawn_max; // 4000（画面上真的就画这么多颗）

// IV 章：乱网顶点 6000 条，成年后密度是顶点的 1 / 1.5，剪掉的是差额
export const TANGLE_PEAK = N.tangle_lines_peak; // 6000
export const TANGLE_KEPT = Math.round(N.tangle_lines_peak / N.synapse_density_peak_over_adult); // 4000
export const TANGLE_CUT = TANGLE_PEAK - TANGLE_KEPT; // 2000
export const GOLD_EVERY = meta.IV.gold_line_every; // 每 5 条有 1 条是金色

// IV 章 r/l：两对字母的间距按正确率离 50%（瞎猜）有多远来算
const K = N.kuhl;
const GAP0 = meta.IV.rl_gap_px.start_both; // 120
export const RL = {
	us0: K.us_6to8m,
	us1: K.us_10to12m,
	jp0: K.jp_6to8m,
	jp1: K.jp_10to12m,
	gap0: GAP0,
	gapUS: (GAP0 * (K.us_10to12m - 50)) / (K.us_6to8m - 50), // 208.5
	gapJP: (GAP0 * (K.jp_10to12m - 50)) / (K.jp_6to8m - 50), // 80.8
	blurJP: meta.IV.rl_jp_blur_max_px,
};

// 格式化
export const fmtInt = (v: number) => Math.floor(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const fmtPct = (v: number) => `${v.toFixed(1)}%`;
/** 860 亿：8.6e10 / 1e8 */
export const YI = Math.round(NEURONS / 1e8); // 860

// 自洽检查（渲染日志里能看到；不一致就说明剧本数据被改过）
export const checks = {
	peakAfterMatches: Math.abs(PEAK_AFTER - meta.II.peak_after_px) < 0.05,
	tenHpxMatches: Math.abs(TEN_H_PX - meta.II.ten_h_px_on_year_axis) < 0.05,
	yearsMatches: Math.abs(COUNT_YEARS - N.neurons_count_years) < 0.1,
	keptMatches: TANGLE_KEPT === N.tangle_lines_after_prune,
	gapUSMatches: Math.abs(RL.gapUS - meta.IV.rl_gap_px.us_end) < 0.1,
	gapJPMatches: Math.abs(RL.gapJP - meta.IV.rl_gap_px.jp_end) < 0.1,
};
