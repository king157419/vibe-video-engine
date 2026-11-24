/** HTML 文字层：路标（人名 · 年份）、赫布原话、「突触」、论文卡、示意、LONDON、考上/没考上、大数字、r / l。
 *  每样东西只在需要它的那十几秒出现。 */
import React from 'react';
import {C, FONT_EN, FONT_EN_IT, FONT_ZH, Label, smooth, win} from '../kit';
import {meta, P} from './data';
import {COUNT_YEARS, FIELD_PARTICLES, RL, YI, fmtInt, fmtPct} from './numbers';
import {toScr} from './lib/core';
import {synLabelPos} from './scenes/s1';
import {traceNotes} from './scenes/s2';
import {camIII, hipCopyLabel} from './scenes/s3';
import {BABY_L, BABY_R, RL_LETTER_Y, rlState} from './scenes/s4';
import {hopeNote} from './scenes/s5';

const SIGNS: {t0: number; t1: number; text: string}[] = [
	{t0: 52.7, t1: 57.3, text: '1949 · D. O. HEBB · THE ORGANIZATION OF BEHAVIOR'},
	{t0: 77.9, t1: 83.6, text: '1966 · OSLO · T. LØMO'},
	{t0: 128.8, t1: 135.4, text: '2000 · E. A. MAGUIRE · UCL'},
	{t0: 136.8, t1: 143.0, text: '2011 · WOOLLETT & MAGUIRE'},
	{t0: 184.5, t1: 190.0, text: '1979 · P. R. HUTTENLOCHER'},
];

const Sign: React.FC<{text: string; a: number; y?: number}> = ({text, a, y = 150}) =>
	a <= 0.003 ? null : (
		<div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: a, fontFamily: FONT_EN, fontSize: 16, letterSpacing: '0.32em', paddingLeft: '0.32em', color: '#6a7178', whiteSpace: 'nowrap'}}>{text}</div>
	);

const Note: React.FC<{x: number; y: number; a: number; text?: string; align?: 'left' | 'center'}> = ({x, y, a, text = '示意', align = 'left'}) =>
	a <= 0.003 ? null : (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(${align === 'center' ? '-50%' : '0'}, -50%)`, opacity: a * 0.7, fontFamily: FONT_ZH, fontWeight: 380, fontSize: 16, letterSpacing: '0.2em', color: P.note, whiteSpace: 'nowrap'}}>{text}</div>
	);

export const Overlay: React.FC<{t: number}> = ({t}) => {
	const els: React.ReactNode[] = [];
	// 路标
	SIGNS.forEach((s, i) => els.push(<Sign key={`s${i}`} text={s.text} a={win(t, s.t0, s.t1, 0.6, 0.6)} />));
	// 赫布原话（斜体英文）+ 署名
	const qa = win(t, 58.5, 69.9, 0.6, 0.6);
	if (qa > 0)
		els.push(
			<div key="hq" style={{position: 'absolute', left: 0, right: 0, top: 212, textAlign: 'center', whiteSpace: 'nowrap'}}>
				<div style={{fontFamily: FONT_EN_IT, fontStyle: 'italic', fontSize: 26, color: P.silver, opacity: qa, letterSpacing: '0.01em'}}>…repeatedly or persistently takes part in firing it…</div>
				<div style={{fontFamily: FONT_EN, fontSize: 16, color: '#6a7178', letterSpacing: '0.3em', marginTop: 14, opacity: win(t, 59.1, 69.9, 0.6, 0.6)}}>— D. O. HEBB, 1949</div>
			</div>,
		);
	// 「突触」：全片唯一一次给物体起名
	const sa = win(t, meta.I.synapse_label[0], meta.I.synapse_label[1], 0.5, 0.5);
	if (sa > 0) {
		const [x, y] = synLabelPos(t);
		els.push(<Label key="syn" x={x} y={y} zh="突触" opacity={0.7 * sa} size={18} color={C.text} />);
	}
	// 证物：1973 年的论文卡
	const pa = win(t, meta.II.paper_card[0], meta.II.paper_card[1], 0.4, 0.4);
	if (pa > 0)
		els.push(
			<div key="paper" style={{position: 'absolute', left: 960 - 260, top: 250 - 75, width: 520, height: 150, boxSizing: 'border-box', border: '1px solid rgba(201,210,220,0.22)', opacity: pa, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12}}>
				<div style={{fontFamily: FONT_EN, fontSize: 14, letterSpacing: '0.3em', color: '#6a7178'}}>THE JOURNAL OF PHYSIOLOGY · 1973</div>
				<div style={{fontFamily: FONT_EN_IT, fontStyle: 'italic', fontSize: 20, color: P.silver}}>Long-lasting potentiation of synaptic transmission…</div>
				<div style={{fontFamily: FONT_EN, fontSize: 14, letterSpacing: '0.3em', color: '#6a7178'}}>T. V. P. BLISS &amp; T. LØMO</div>
			</div>,
		);
	// II 章「示意」
	els.push(<Note key="n2a" x={traceNotes.peak[0]} y={traceNotes.peak[1]} a={win(t, 88.0, 91.6, 0.4, 0.4)} />);
	els.push(<Note key="n2b" x={traceNotes.year[0]} y={traceNotes.year[1]} a={win(t, 104.4, 106.8, 0.4, 0.4)} />);
	// III 章：LONDON + 地图右下「示意」
	const la = win(t, 121.2, 127.6, 0.5, 0.5);
	if (la > 0) {
		const c = camIII(t);
		const [lx, ly] = toScr(c, 618, 118);
		const [nx, ny] = toScr(c, 1262, 812);
		els.push(<div key="ldn" style={{position: 'absolute', left: lx, top: ly, opacity: la * 0.85, fontFamily: FONT_EN, fontSize: 16, letterSpacing: '0.42em', color: '#6a7178'}}>LONDON</div>);
		els.push(<Note key="n3a" x={nx} y={ny} a={la} />);
	}
	// 考上 / 没考上
	const ka = win(t, 144.4, 149.5, 0.5, 0.5);
	if (ka > 0) {
		const c = camIII(t);
		const [x1, y1] = toScr(c, hipCopyLabel.L[0], hipCopyLabel.L[1]);
		const [x2, y2] = toScr(c, hipCopyLabel.R[0], hipCopyLabel.R[1]);
		const [x3, y3] = toScr(c, hipCopyLabel.note[0], hipCopyLabel.note[1]);
		// 审片：18 → 22 px、提亮
		els.push(<Label key="pass" x={x1} y={y1} zh="考上" opacity={0.85 * ka} size={22} color={P.label} />);
		els.push(<Label key="fail" x={x2} y={y2} zh="没考上" opacity={0.85 * ka} size={22} color={P.label} />);
		els.push(<Note key="n3b" x={x3} y={y3} a={ka} align="center" />);
	}
	// 860 亿 → ≈ 2,725 年（同屏只有一个数）
	const ra = win(t, meta.III.readout_86b[0], meta.III.readout_86b[1], 0.6, 0.5);
	const ya = win(t, meta.III.readout_years[0], meta.III.readout_years[1], 0.6, 0.5);
	const big = (key: string, num: string, unit: string, a: number, pre = '') =>
		a <= 0.003 ? null : (
			<div key={key} style={{position: 'absolute', left: 0, right: 0, top: 200, transform: 'translateY(-50%)', textAlign: 'center', opacity: a, whiteSpace: 'nowrap', color: P.gold, textShadow: '0 0 24px rgba(240,210,140,0.45), 0 0 70px rgba(192,138,62,0.35)'}}>
				{pre ? <span style={{fontFamily: FONT_EN, fontSize: 52, marginRight: 14, color: '#c9b27a'}}>{pre}</span> : null}
				<span style={{fontFamily: FONT_EN, fontSize: 72, letterSpacing: '0.04em'}}>{num}</span>
				<span style={{fontFamily: FONT_ZH, fontWeight: 400, fontSize: 56, marginLeft: 16}}>{unit}</span>
			</div>
		);
	els.push(big('r86', String(YI), '亿', ra));
	els.push(<Note key="n86" x={960} y={268} align="center" a={win(t, 153.2, 158.0, 0.5, 0.5) / 0.6} text={`示意 · 画面只画了 ${fmtInt(FIELD_PARTICLES)} 颗`} />);
	els.push(big('ryr', fmtInt(COUNT_YEARS), '年', ya, '≈'));
	// r / l（审片：字母 64 → 104 px 并加光晕；日本那一对模糊到 3.5 px、亮度降到 0.6；字母有极轻的浮动）
	const rl = rlState(t);
	if (rl.vis > 0.003) {
		const letter = (key: string, x: number, ch: string, blur: number, fade: number, ph: number) => (
			<div key={key} style={{position: 'absolute', left: x, top: RL_LETTER_Y + 30 * rl.rise + 3 * Math.sin(t * 1.1 + ph), transform: 'translate(-50%, -50%)', fontFamily: FONT_EN, fontSize: 104, color: C.text, opacity: rl.vis * fade, filter: blur > 0.02 ? `blur(${blur}px)` : undefined, textShadow: '0 0 22px rgba(230,232,232,0.35), 0 0 60px rgba(230,232,232,0.18)'}}>
				{ch}
			</div>
		);
		els.push(letter('rl1', BABY_L[0] - rl.gapL / 2, 'r', 0, 1, 0));
		els.push(letter('rl2', BABY_L[0] + rl.gapL / 2, 'l', 0, 1, 1.7));
		els.push(letter('rr1', BABY_R[0] - rl.gapR / 2, 'r', rl.blurR, rl.fadeR, 3.1));
		els.push(letter('rr2', BABY_R[0] + rl.gapR / 2, 'l', rl.blurR, rl.fadeR, 4.6));
		const p0 = win(t, 209.0, 214.5, 0.5, 0.5);
		const p1 = win(t, 217.0, 221.8, 0.5, 0.5);
		const pct = (key: string, x: number, v: number, a: number) =>
			a <= 0.003 ? null : (
				<div key={key} style={{position: 'absolute', left: x, top: 505, transform: 'translate(-50%, -50%)', fontFamily: FONT_EN, fontSize: 24, letterSpacing: '0.12em', color: '#9aa3aa', opacity: a * rl.vis}}>
					{fmtPct(v)}
				</div>
			);
		els.push(pct('pl0', BABY_L[0], RL.us0, p0));
		els.push(pct('pr0', BABY_R[0], RL.jp0, p0));
		els.push(pct('pl1', BABY_L[0], RL.us1, p1));
		els.push(pct('pr1', BABY_R[0], RL.jp1, p1));
	}
	// V 章「示意」
	els.push(<Note key="n5" x={hopeNote[0]} y={hopeNote[1]} a={win(t, 224.0, 237.5, 0.6, 0.6)} />);
	void smooth;
	return <>{els}</>;
};
