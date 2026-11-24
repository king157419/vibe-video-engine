import type {Captions, LintMsg, SectionInfo} from '../whiteboard';
import {Board, C, registerHanzi} from '../whiteboard';
import {lintBoard} from '../whiteboard';
import {makeCtx} from './ctx';
import {HANZI} from './hanzi.generated';
import {makeProps} from './props';
import type {Props} from './props';
import {SECTION_BUILDERS} from './sections';
import {ISLANDS, SECTION_ISLAND} from './world';

registerHanzi(HANZI);

export const TAIL_MS = 3500; // 集成修正：2500 → 3500，片尾居中免责声明原来只露 0.5 秒

export type Built = {board: Board; props: Props; errors: {sec: string; msg: string}[]};

/** 构建整集分镜板：建共享道具，然后按顺序跑 s01…s15 的 build(ctx)。某段出错不影响其它段（错误画在它的岛上）。 */
export const buildEpisode = (captions: Captions, sections: SectionInfo[]): Built => {
	const b = new Board();
	const props = makeProps(b);
	const errors: {sec: string; msg: string}[] = [];
	// 片头：镜头先停在开场岛
	b.curSec = '';
	b.cam(0, props.chat.views.panel, 1);
	for (const [id, build] of SECTION_BUILDERS) {
		const info = sections.find((s) => s.id === id);
		if (!info) {
			errors.push({sec: id, msg: 'missing in sections.json'});
			continue;
		}
		b.curSec = id;
		try {
			build(makeCtx({info, island: SECTION_ISLAND[id], b, captions, sections, props, durationMs: captions.durationMs}));
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			errors.push({sec: id, msg});
			console.error(`[wb] ${id} build failed: ${msg}`);
			const box = ISLANDS[SECTION_ISLAND[id]];
			const cx = (box[0] + box[2]) / 2;
			b.text(`${id} build error`, cx, box[1] + 480, 80, info.startMs, {anchor: 'middle', color: C.error, font: 'sans', dur: 0, nolint: true});
			b.text(msg.slice(0, 90), cx, box[1] + 580, 40, info.startMs, {anchor: 'middle', color: C.error, font: 'sans', dur: 0, nolint: true});
			b.cam(info.startMs, box, 600);
		}
	}
	b.curSec = '';
	// 镜头关键帧按时间排好（稳定排序：同一时刻按加入顺序）
	b.cams = b.cams.map((c, i) => ({c, i})).sort((x, y) => x.c.t - y.c.t || x.i - y.i).map((x) => x.c);
	return {board: b, props, errors};
};

/** 构建 + 自检（tools/wb_lint.mjs 通过 calculateMetadata 取回） */
export const lintEpisode = (captions: Captions, sections: SectionInfo[]): {errors: {sec: string; msg: string}[]; msgs: LintMsg[]; stats: Record<string, number>} => {
	const {board, errors} = buildEpisode(captions, sections);
	const msgs = lintBoard(board, sections.map((s) => ({id: s.id, startMs: s.startMs, endMs: s.endMs, nextStartMs: s.nextStartMs})), {tailMs: TAIL_MS});
	const stats: Record<string, number> = {items: board.items.length, cams: board.cams.length, pen: board.penEvents().length};
	for (const s of sections) stats[`items.${s.id}`] = board.items.filter((it) => it.sec === s.id).length;
	return {errors, msgs, stats};
};
