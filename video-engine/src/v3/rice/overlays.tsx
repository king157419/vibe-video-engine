// 常驻层：顶部页签 + 小结残影、底部字幕、全画面白闪。
import React from 'react';
import type {Captions, Timeline} from './data';
import {C, SANS, SERIF} from './theme';
import {easeOut, fade, lin, mix, textW} from './util';

// ---------- 顶部条（y 30–95）：左边页签，右边小结残影 ----------
const tabs = (T: Timeline) => [
	{t: T.miLi - 0.3, no: '01', name: '种子'},
	{t: T.zuo2 - 0.2, no: '02', name: '翻倍'},
	{t: T.meiKe - 0.3, no: '03', name: '加热'},
	{t: T.suoYi - 0.2, no: '04', name: '秒表'},
	{t: T.paoGuoYe - 0.3, no: '05', name: '别的样本'},
];
// 审片后 P1-3：“冰箱这个暂停键也不完全灵”时，旧短签“冰箱停”划一道线、改成“冰箱慢”（rev）；
// 段 7 小结提前到“一天内”出现，拉回镜头挪到“记住两句”，小结完整停留约 2 秒，再随终局卡升起淡出（内容在终局卡的边界行里）
type Summary = {t: number; text: string; short: string; rev?: {t: number; text: string; short: string}};
export const summaries = (T: Timeline): Summary[] => [
	{t: T.faYa1End, text: '芽孢：煮不死', short: '煮不死'},
	{t: T.n1000bEnd, text: '室温：翻倍 ｜ 冰箱：暂停', short: '冰箱停', rev: {t: T.bingXiang5, text: '室温：翻倍 ｜ 冰箱：慢', short: '冰箱慢'}},
	{t: T.chaiBuDiaoEnd, text: '加热杀菌 ≠ 解毒', short: '≠解毒'},
	{t: T.naiReDeDu1End, text: '看室温秒表，不看隔没隔夜', short: '看秒表'},
	{t: T.zaiReEnd, text: '三个样本，同一条链', short: '同一链'},
	{t: T.yiTianNei + 0.35, text: '越热越快 ｜ 冰箱：慢，不是停', short: '越热快'},
];

const CHIP_H = 56;
const CHIP_Y = 62.5;
const BAR_X0 = 446; // 页签右边
const BAR_X1 = 1880;
const fullW = (it: {text: string}) => textW(it.text, 36) + 40;
const shortW = (it: {short: string}) => textW(it.short, 36) + 30;

/**
 * n 条小结可见时每条的位置（二审 S13）：新的从右端插入，能放下几条完整的就放几条（最多 3 条）；
 * 更早的缩成 ≤4 字的短签（36px，深灰描边），从左往右排在页签旁边，不消失。
 */
const layout = (items: {text: string; short: string}[], n: number) => {
	const res: {x: number; w: number; full: boolean}[] = [];
	let k = Math.min(3, n);
	for (; k > 1; k--) {
		let w = 0;
		for (let i = n - k; i < n; i++) w += fullW(items[i]) + 16;
		for (let i = 0; i < n - k; i++) w += shortW(items[i]) + 12;
		if (BAR_X0 + w - 16 <= BAR_X1) break;
	}
	let x = BAR_X1;
	for (let i = n - 1; i >= n - k; i--) {
		const w = fullW(items[i]);
		x -= w;
		res[i] = {x, w, full: true};
		x -= 16;
	}
	let xs = BAR_X0;
	for (let i = 0; i < n - k; i++) {
		const w = shortW(items[i]);
		res[i] = {x: xs, w, full: false};
		xs += w + 12;
	}
	return res;
};

const Chip: React.FC<{x: number; w: number; text: string; full: boolean; op: number; strike?: number; textOp?: number; text2?: string}> = ({x, w, text, full, op, strike = 0, textOp = 1, text2}) =>
	op <= 0.001 ? null : (
		<g opacity={op}>
			<rect x={x} y={CHIP_Y - CHIP_H / 2} width={w} height={CHIP_H} rx={full ? CHIP_H / 2 : 12} fill={C.paper} stroke={full ? '#a9a59a' : C.inkSoft} strokeWidth={full ? 2.5 : 3} />
			<text x={x + w / 2} y={CHIP_Y + 13} textAnchor="middle" fontFamily={SANS} fontWeight={full ? 500 : 600} fontSize={36} fill={full ? C.ink : C.inkSoft} opacity={textOp}>
				{text}
			</text>
			{text2 && textOp < 1 ? (
				<text x={x + w / 2} y={CHIP_Y + 13} textAnchor="middle" fontFamily={SANS} fontWeight={full ? 500 : 600} fontSize={36} fill={C.ink} opacity={1 - textOp}>
					{text2}
				</text>
			) : null}
			{strike > 0 ? <line x1={x + 10} y1={CHIP_Y + 2} x2={x + 10 + (w - 20) * strike} y2={CHIP_Y - 2} stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={textOp} /> : null}
		</g>
	);

export const TopBar: React.FC<{T: Timeline; t: number}> = ({T, t}) => {
	const allOut = 1 - lin(t, T.jiZhu + 0.9, T.jiZhu + 1.4);
	if (allOut <= 0 || t < T.miLi - 0.3) return null;
	const tb = tabs(T);
	let cur = -1;
	for (let i = 0; i < tb.length; i++) if (t >= tb[i].t) cur = i;
	const sm = summaries(T);
	let n = 0;
	for (const s of sm) if (t >= s.t) n++;
	const u = n > 0 ? easeOut(lin(t, sm[n - 1].t, sm[n - 1].t + 0.55)) : 1;
	const now = layout(sm, n);
	const prev = layout(sm, Math.max(0, n - 1));
	return (
		<svg width={1920} height={120} style={{position: 'absolute', left: 0, top: 0, opacity: allOut}}>
			{/* 页签：像实验记录本的页签 */}
			{tb.map((tab, i) => {
				if (i !== cur && i !== cur - 1) return null;
				const tIn = tab.t;
				const op = i === cur ? lin(t, tIn, tIn + 0.35) : 1 - lin(t, tb[cur].t, tb[cur].t + 0.25);
				const dy = i === cur ? (1 - easeOut(lin(t, tIn, tIn + 0.35))) * -20 : 0;
				const label = `记录 ${tab.no}  ${tab.name}`;
				const w = textW(label, 40) + 56;
				return (
					<g key={i} opacity={op} transform={`translate(0,${dy})`}>
						<path d={`M40,95 L40,38 Q40,30 48,30 L${40 + w - 18},30 Q${40 + w - 8},30 ${40 + w - 4},40 L${40 + w + 10},95 Z`} fill={C.paper} stroke={C.paperEdge} strokeWidth={2.5} />
						<rect x={40} y={30} width={10} height={65} fill={C.inkSoft} />
						<text x={68} y={78} fontFamily={SERIF} fontWeight={600} fontSize={40} fill={C.ink}>
							{label}
						</text>
					</g>
				);
			})}
			{/* 小结残影 */}
			{sm.slice(0, n).map((s, i) => {
				const a = now[i];
				const isNew = i === n - 1;
				if (isNew) return <Chip key={i} x={a.x} w={a.w} text={s.text} full op={lin(u, 0.4, 1)} />;
				const b = prev[i];
				// 旧的先让位（前 60%），新的随后淡入（后 60%），避免叠在一起
				const um = easeOut(lin(u, 0, 0.6));
				if (a.full === b.full || u >= 1) {
					if (s.rev && t >= s.rev.t) {
						// 划掉旧说法（0.4 秒），停 0.2 秒，再换成新说法
						const strike = lin(t, s.rev.t + 0.1, s.rev.t + 0.5);
						const swap = 1 - lin(t, s.rev.t + 0.7, s.rev.t + 1.05);
						return (
							<Chip
								key={i}
								x={mix(b.x, a.x, um)}
								w={a.w}
								text={a.full ? s.text : s.short}
								text2={a.full ? s.rev.text : s.rev.short}
								full={a.full}
								op={1}
								strike={strike}
								textOp={swap}
							/>
						);
					}
					return <Chip key={i} x={mix(b.x, a.x, um)} w={a.w} text={a.full ? s.text : s.short} full={a.full} op={1} />;
				}
				// 完整 → 短签：交叉淡化
				return (
					<g key={i}>
						<Chip x={b.x} w={b.w} text={s.text} full op={1 - lin(u, 0, 0.45)} />
						<Chip x={a.x} w={a.w} text={s.short} full={false} op={lin(u, 0.3, 0.75)} />
					</g>
				);
			})}
		</svg>
	);
};

// ---------- 底部字幕：单行、固定位置、思源黑体 40px、半透明浅灰条 ----------
const activeLine = (cap: Captions, ms: number) => {
	let idx = -1;
	for (let i = 0; i < cap.lines.length; i++) {
		if (cap.lines[i].startMs - 60 <= ms) idx = i;
		else break;
	}
	return idx;
};

export const CaptionBand: React.FC<{cap: Captions; t: number; T: Timeline}> = ({cap, t, T}) => {
	const ms = t * 1000;
	const i = activeLine(cap, ms);
	const line = i >= 0 ? cap.lines[i] : null;
	const last = i === cap.lines.length - 1;
	let a = 0;
	if (line) {
		const next = cap.lines[i + 1];
		// 最后一句：一念完就让位给片尾声明（二审 S12，不留空档）
		const hideAt = next ? Math.min(next.startMs - 60, line.endMs + 900) : line.endMs;
		a = Math.min(lin(ms, line.startMs - 60, line.startMs + 80), 1 - lin(ms, hideAt, hideAt + 160));
	}
	const disc = fade(t, T.lastCapEnd + 0.08, Infinity, 0.25);
	const bar: React.CSSProperties = {
		background: 'rgba(0,0,0,0.64)',
		borderRadius: 12,
		fontFamily: SANS,
		fontWeight: 500,
		color: '#f6f4ee',
		whiteSpace: 'nowrap',
	};
	return (
		<div style={{position: 'absolute', left: 0, top: 940, width: 1920, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			{line && a > 0 && !(last && disc >= 1) ? (
				<div style={{...bar, opacity: a, padding: '6px 34px 8px', fontSize: 40, lineHeight: '56px', letterSpacing: 1}}>
					{line.chars.map((c, k) => {
						const txt = c.t.replace(/\s+$/, '');
						const gap = /\s$/.test(c.t) ? <span style={{display: 'inline-block', width: 20}} /> : null;
						return (
							<React.Fragment key={k}>
								<span style={{fontWeight: c.hl ? 700 : 500}}>{txt}</span>
								{gap}
							</React.Fragment>
						);
					})}
				</div>
			) : null}
			{disc > 0 ? (
				<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disc}}>
					<div style={{...bar, padding: '6px 30px 8px', fontSize: 36, lineHeight: '50px', textAlign: 'center'}}>
						<div>科普内容，不构成医疗建议</div>
						<div>画面由 Claude 用代码生成 · 配音为 AI 合成（占位）</div>
					</div>
				</div>
			) : null}
		</div>
	);
};

// ---------- 全画面白闪：#ffffff 0.3 秒（9 帧），淡出 3 帧；不配任何声音 ----------
export const Flash: React.FC<{times: number[]; t: number}> = ({times, t}) => {
	let o = 0;
	for (const f of times) {
		if (t >= f && t < f + 0.3) o = 1;
		else if (t >= f + 0.3 && t < f + 0.4) o = Math.max(o, 1 - (t - f - 0.3) / 0.1);
	}
	if (o <= 0) return null;
	return <div style={{position: 'absolute', inset: 0, background: '#ffffff', opacity: o}} />;
};
