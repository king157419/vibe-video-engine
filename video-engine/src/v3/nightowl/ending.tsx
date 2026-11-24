// 边界（全景前的一屏）+ 终局全景的附加物（边界一行、示意标注、留题、AI 标识）。
import React from 'react';
import type {Clock, Model, Numbers} from './data';
import {clamp01, ramp} from './data';
import {Bracket, Hand, PinHead, Prop, Wheel} from './draw';
import type {HourMap} from './scroll';
import {smoothPath, xm} from './scroll';
import {COL} from './theme';

const ROWS = [
	{key: 'M', label: '早起的人', y: 420},
	{key: 'N', label: '一般人', y: 570},
	{key: 'E', label: '夜猫子', y: 720},
] as const;

export const Boundary: React.FC<{t: number; clock: Clock; nums: Numbers; model: Model; opacity: number}> = ({t, clock, nums, model, opacity}) => {
	if (opacity <= 0) return null;
	const s27 = clock.sub(27);
	const s28 = clock.sub(28);
	const m: HourMap = {h0: 23, h1: 35, x0: 300, x1: 880};
	const trough = nums.keys.tideTrough;
	const bracketP = ramp(t, s27.t0 + 3.0, 0.6);
	const wheelP = ramp(t, s28.t0 + 0.4, 0.6);
	const cross = ramp(t, s28.t0 + 3.0, 0.7);
	const hs: number[] = [];
	for (let h = m.h0; h <= m.h1 + 1e-6; h += 0.1) hs.push(h);
	const tr = (k: 'M' | 'N' | 'E') => 24 + nums.chronotype[k];
	return (
		<g opacity={opacity}>
			{/* 左半屏：三个人的潮水，谷底早晚不同 */}
			{[24, 27, 30, 33].map((h) => (
				<g key={h} opacity={ramp(t, s27.t0, 0.5)}>
					<line x1={xm(m, h)} y1={318} x2={xm(m, h)} y2={330} stroke={COL.ink} strokeWidth={2.2} />
					<Hand x={xm(m, h)} y={306} size={36} anchor="middle" color={COL.sleepText}>
						{`${String(h % 24).padStart(2, '0')}:00`}
					</Hand>
				</g>
			))}
			<line x1={m.x0} y1={330} x2={m.x1} y2={330} stroke={COL.ink} strokeWidth={2.2} opacity={ramp(t, s27.t0, 0.5)} />
			{ROWS.map((r, i) => {
				const p = ramp(t, s27.t0 + 0.25 * i, 1.0);
				const shift = tr(r.key) - (24 + trough);
				const amp = 62;
				const yy = (v: number) => r.y + amp - ((v - 0.36) / 0.5) * amp * 2;
				const pts: [number, number][] = hs.filter((h) => h <= m.h0 + (m.h1 - m.h0) * p).map((h) => [xm(m, h), yy(model.Cshift(h, shift))]);
				const xt = xm(m, tr(r.key));
				return (
					<g key={r.key}>
						<Hand x={70} y={r.y + 14} size={40} opacity={clamp01(p * 3)}>
							{r.label}
						</Hand>
						<path d={smoothPath(pts)} fill="none" stroke={COL.tide} strokeWidth={4.2} strokeLinecap="round" />
						{p > 0.95 ? <line x1={xt} y1={r.y + amp + 6} x2={xt} y2={800} stroke={COL.tide} strokeWidth={2.4} strokeDasharray="6 8" opacity={0.8} /> : null}
						{p > 0.95 ? <circle cx={xt} cy={yy(0.36)} r={6} fill={COL.tide} /> : null}
					</g>
				);
			})}
			{bracketP > 0 ? (
				<g>
					<Bracket k="chrono" x0={xm(m, tr('M'))} x1={xm(m, tr('E'))} y={812} p={bracketP} w={3} />
					<Hand x={(xm(m, tr('M')) + xm(m, tr('E'))) / 2} y={866} size={48} anchor="middle" opacity={clamp01(bracketP * 2 - 0.6)}>
						约2小时
					</Hand>
				</g>
			) : null}
			{/* 右半屏：方向盘（主卷的早上那一段由 ScrollWorld 画） */}
			{wheelP > 0 ? <Wheel cx={1745} cy={590} r={88} cross={cross} opacity={wheelP} /> : null}
		</g>
	);
};

/**
 * 终局全景的附加物。审片 P1-6：终局图单独截图时也要看得懂——
 * (a) 字幕结束后在“?”上方写出留题；(b) 三枚红图钉旁一行小注；(c) AI 标识放进右下角常驻。
 */
export const FinaleExtras: React.FC<{t: number; clock: Clock; opacity: number}> = ({t, clock, opacity}) => {
	if (opacity <= 0) return null;
	const pano = clock.cam('panorama');
	const lines = ramp(t, pano + 2.0, 0.8);
	const q = ramp(t, clock.ev('全景右下问题区'), clock.evDur('全景右下问题区'));
	const qText = ramp(t, clock.ev('画面留题一行'), clock.evDur('画面留题一行'));
	const ai = ramp(t, clock.ev('AI 标识'), clock.evDur('AI 标识'));
	return (
		<g opacity={opacity}>
			<g opacity={lines}>
				<Hand x={1300} y={784} size={36} anchor="end" color={COL.sleepText}>
					曲线为示意，非实测
				</Hand>
				<PinHead x={428} y={760} r={8} color={COL.drowsy} />
				<Hand x={448} y={784} size={36} color={COL.drowsy}>
					犯困车祸高峰（英国，1995）
				</Hand>
				<Hand x={60} y={850} size={42}>
					潮水早晚因人而异 · 缓一口气≠恢复，别开车
				</Hand>
			</g>
			{q > 0 ? (
				<g opacity={q}>
					<Prop kind="bed" x={1560} y={510} s={1.5} seed={701} w={3} />
					<Hand x={1740} y={512} size={120} anchor="middle" color={COL.ink}>
						?
					</Hand>
				</g>
			) : null}
			{qText > 0 ? (
				<g>
					<Hand id="qline1" x={1370} y={612} size={48} wipe={clamp01(qText * 2)}>
						考前9点躺下，
					</Hand>
					<Hand id="qline2" x={1370} y={674} size={48} wipe={clamp01(qText * 2 - 1)}>
						11点才睡着：哪股力？
					</Hand>
				</g>
			) : null}
			{ai > 0 ? (
				<Hand x={1880} y={904} size={36} anchor="end" color={COL.sleepText} opacity={ai}>
					画面、字幕、配乐由 Claude 用代码生成
				</Hand>
			) : null}
		</g>
	);
};
