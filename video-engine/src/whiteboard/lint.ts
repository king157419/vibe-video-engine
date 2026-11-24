import type {Board, Box, Item} from './board';
import {boxHit, boxMat, isIdent} from './board';
import {camAt, stageBox} from './camera';
import {missingHanzi} from './hanzi';
import {MAX_LABEL_CHARS, MIN_TEXT_PX} from './theme';

// 构建期自检：不渲染就能发现的问题（字太小、画在镜头外、压进字幕带、超时、长时间没动静……）。
// 结果由 tools/wb_lint.mjs 打印（通过 calculateMetadata 把报告带回 Node）。

export type LintLevel = 'error' | 'warn' | 'info';
export type LintMsg = {sec: string; level: LintLevel; t: number; msg: string};
export type LintWindow = {id: string; startMs: number; endMs: number; nextStartMs: number};

const fmt = (ms: number) => {
	const s = ms / 1000;
	return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

const textInfo = (it: Item): {size: number; len: number; dur: number; label: string} | null => {
	if (it.nolint) return null;
	if (it.k === 'text') return {size: it.size, len: Array.from(it.s).length, dur: it.dur, label: it.s};
	if (it.k === 'node' && it.textSize) return {size: it.textSize, len: it.textLen ?? 0, dur: it.dur ?? 0, label: '(write)'};
	return null;
};

export const lintBoard = (b: Board, wins: LintWindow[], opts: {idleMs?: number; tailMs?: number} = {}): LintMsg[] => {
	const out: LintMsg[] = [];
	const cams = [...b.cams].sort((a, c) => a.t - c.t);
	const view = (t: number) => camAt(cams, t, {drift: false, push: false});
	const win = Object.fromEntries(wins.map((w) => [w.id, w]));
	const last = wins[wins.length - 1];
	const tail = opts.tailMs ?? 2500;

	for (const it of b.items) {
		const sec = it.sec ?? '';
		const w = win[sec];
		if (w) {
			const hi = w === last ? w.nextStartMs + tail : w.nextStartMs + 400;
			if (it.t0 < w.startMs - 1500 || it.t0 > hi) out.push({sec, level: 'warn', t: it.t0, msg: `item starts at ${fmt(it.t0)}, outside the section window ${fmt(w.startMs)}–${fmt(w.nextStartMs)}`});
		}
		const ti = textInfo(it);
		if (!ti || !it.bb) continue;
		const tc = it.t0 + ti.dur + 250;
		if (it.out !== undefined && it.out <= tc) continue;
		const v = view(tc);
		const g = b.groupAt(it.g, tc);
		const s = Math.abs(g.m[0]);
		const px = ti.size * v.z * s;
		if (px < MIN_TEXT_PX * 0.97) out.push({sec, level: 'warn', t: it.t0, msg: `text ${JSON.stringify(ti.label)} is ${px.toFixed(0)}px on screen (< ${MIN_TEXT_PX}px) at ${fmt(tc)}`});
		if (ti.len > MAX_LABEL_CHARS && it.k === 'text') out.push({sec, level: 'info', t: it.t0, msg: `label ${JSON.stringify(ti.label)} has ${ti.len} chars (> ${MAX_LABEL_CHARS})`});
		const bb: Box = isIdent(g.m) ? it.bb : boxMat(g.m, it.bb);
		const st = stageBox(v);
		if (!boxHit(bb, st)) out.push({sec, level: 'warn', t: it.t0, msg: `text ${JSON.stringify(ti.label)} is written off-screen (camera not on it at ${fmt(tc)})`});
		else if (bb[3] > st[3] + 4 && bb[1] < st[3]) out.push({sec, level: 'warn', t: it.t0, msg: `text ${JSON.stringify(ti.label)} runs into the caption band at ${fmt(tc)}`});
		else if (bb[0] < st[0] - 4 || bb[2] > st[2] + 4 || bb[1] < st[1] - 4) out.push({sec, level: 'info', t: it.t0, msg: `text ${JSON.stringify(ti.label)} is clipped by the frame edge at ${fmt(tc)}`});
	}

	for (const c of cams) {
		const w = win[c.sec ?? ''];
		if (!w) continue;
		if (c.t < w.startMs - 1500 || c.t >= (w === last ? w.nextStartMs + tail : w.nextStartMs)) out.push({sec: w.id, level: 'warn', t: c.t, msg: `camera key at ${fmt(c.t)} is outside the section window`});
	}

	// 长时间没动静：画、擦、镜头、道具移动都算动静
	const idle = opts.idleMs ?? 8000;
	const act: [number, number][] = [];
	for (const it of b.items) {
		const d = it.k === 'node' ? (it.dur ?? 0) : it.dur;
		act.push([it.t0, it.t0 + Math.max(200, d)]);
		if (it.out !== undefined) act.push([it.out, it.out + (it.outDur ?? 450)]);
	}
	for (const c of cams) act.push([c.t, c.t + c.dur]);
	for (const tr of Object.values(b.tracks)) {
		for (const k of tr.keys) act.push([k.t, k.t + k.dur]);
		for (const f of tr.fades) act.push([f.t, f.t + f.dur]);
	}
	for (const e of b.extraPen) act.push([e.t0, e.t1]);
	act.sort((a, c) => a[0] - c[0]);
	for (const w of wins) {
		const lo = w.startMs;
		const hi = w === last ? w.endMs : w.nextStartMs;
		let cur = lo;
		for (const [s, e] of act) {
			if (e < cur) continue;
			if (s > hi) break;
			if (s - cur > idle) out.push({sec: w.id, level: 'warn', t: cur, msg: `nothing moves for ${((s - cur) / 1000).toFixed(1)}s (${fmt(cur)}–${fmt(s)})`});
			cur = Math.max(cur, e);
		}
		if (hi - cur > idle) out.push({sec: w.id, level: 'warn', t: cur, msg: `nothing moves for ${((hi - cur) / 1000).toFixed(1)}s (${fmt(cur)}–${fmt(hi)})`});
	}

	if (missingHanzi.size) out.push({sec: '', level: 'warn', t: 0, msg: `write() used chars without stroke data: ${[...missingHanzi].join('')} — run tools/wb_hanzi.py`});
	return out;
};
