/** 2026-10-12 用户反馈修改：时间轴加长了三处，画面代码里的动作时刻仍按 10-08 版（284.5 s）的旧时间轴写，
 *  这里把成片的真实时间 t 映射回旧时间 τ（toOld），反过来用 toReal。
 *  字幕、配乐、本片曲线（06 章）都是真实时间：subs.json / cue.json / numbers.json 由 build_timeline.py 重新生成。
 *
 *  ① 冷水 L7 拆成两句（+4.2 s）：旧 52.4–57.4（手还在水里，计时线已画完）拉成 52.4–61.6，画面放慢到 0.54 倍；
 *     这一段新加的读数「14 °C → 15 °C · +1 °C」按真实时间画（Overlay.tsx 的 TempReadout），和两句字幕对齐。
 *  ② 硬静音 1.3 → 3.0 s（+1.7 s）：旧 188.95–190.25 拉成 193.15–196.15。人生线 A 停在原地，星尘照常漂（Backdrop 用真实时间）。
 *  ③ L27「第二种人生：…」字数变多（+1.0 s）：旧 193.0–197.45（B 的平台一段画出来）拉成 198.9–204.35。
 *  其余各段都是整体平移（斜率 1），动作快慢不变。 */
const KN: [number, number][] = [
	[0, 0],
	[52.4, 52.4],
	[61.6, 57.4],
	[193.15, 188.95],
	[196.15, 190.25],
	[198.9, 193.0],
	[204.35, 197.45],
	[291.4, 284.5],
];

const interp = (x: number, a: 0 | 1) => {
	const b = (1 - a) as 0 | 1;
	if (x <= KN[0][a]) return x;
	for (let i = 1; i < KN.length; i++) {
		if (x <= KN[i][a]) {
			const [p, q] = [KN[i - 1], KN[i]];
			return p[b] + ((x - p[a]) * (q[b] - p[b])) / (q[a] - p[a]);
		}
	}
	const last = KN[KN.length - 1];
	return last[b] + (x - last[a]);
};

/** 真实时间 → 旧时间轴 */
export const toOld = (t: number) => interp(t, 0);
/** 旧时间轴 → 真实时间 */
export const toReal = (tau: number) => interp(tau, 1);
/** 真实时间轴上的硬切时刻（= cue.json 的 silences[0][0]） */
export const CUT_REAL = 193.15;
