// 把剧本作者脚本产出的 JSON（唯一来源）转成 TS 模块，供 Remotion 打包。
// 运行：node src/v4/ties/gen_data.mjs   （在 video-engine 目录）
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('.');
const rd = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const subs = rd(path.join(root, 'public/v4/ties/subs.json'));
const cue = rd(path.join(root, 'public/v4/ties/cue.json'));
const anchors = rd(path.join(root, '../4_第四版资料/ties/ties_anchors.json'));
// 故事时间：第二版时间轴的锚点。画面代码按它写；time.ts 把两份锚点逐个配对，做分段线性映射。
const story = rd(path.join(root, '../4_第四版资料/ties/ties_anchors_story.json'));
const num = rd(path.join(root, '../4_第四版资料/ties/ties_numbers.json'));
const check = {
	path: num.path_you_them,
	chords: num.chords.map((c) => [c.i, c.old, c.new]),
	flood: num.flood_layers_from_you,
	bfs: num.bfs_dist_from_you,
	latticeD: num.lattice.d_you_them,
	C0: num.lattice.clustering,
	C1: num.rewired_graph.clustering,
	keptPct: num.clustering_kept_pct,
	bandKey: num.band_layout.key_nodes_xy,
	nShortest: num.n_shortest_paths_you_them,
};
const facts = {
	milgram: {starters: num.milgram.starters, arrived: num.milgram.arrived, lost: num.milgram.lost},
	gran: {N: num.granovetter.N, often: num.granovetter.often, occ: num.granovetter.occasionally, rare: num.granovetter.rarely},
	fbDegrees: num.facebook_2016.degrees,
};
const out = `// 自动生成：node src/v4/ties/gen_data.mjs（不要手改）。来源：public/v4/ties/subs.json、cue.json，4_第四版资料/ties/ties_anchors.json、ties_numbers.json
/* eslint-disable */
export const SUBS: {t0: number; t1: number; zh: string; en?: string}[] = ${JSON.stringify(subs)};
export const DUR = ${cue.dur};
export const ANCHORS = ${JSON.stringify(anchors)} as const;
export const STORY_ANCHORS = ${JSON.stringify(story)};
export const CHECK = ${JSON.stringify(check)};
export const FACTS = ${JSON.stringify(facts)};
`;
fs.writeFileSync(path.join(root, 'src/v4/ties/data.gen.ts'), out);
console.log('wrote data.gen.ts', out.length, 'bytes; subs', subs.length, 'dur', cue.dur);
