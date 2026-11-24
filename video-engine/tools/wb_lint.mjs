// EP01v2 构建期自检（不渲染）：在浏览器里构建整张分镜板，把 section 构建错误和 lint 报告带回来打印。
// 查：cue 找不到 / 段构建报错、屏幕字 < 36px、字写在镜头外、字压进字幕带、条目或镜头跑出本段时间窗、超过 8 秒没动静、write 缺笔顺数据。
// 用法：node tools/wb_lint.mjs [--sec s03] [--all]（默认不显示 info 级）
import {selectComposition} from '@remotion/renderer';
import {COMP, EPISODE, fmt, makeBundle, parseArgs} from './wb_common.mjs';

const args = parseArgs(process.argv.slice(2));
const serveUrl = await makeBundle();
const comp = await selectComposition({serveUrl, id: COMP, inputProps: {episode: EPISODE, lint: true, captions: null, sections: null}});
const rep = comp.props.lintReport;
if (!rep) {
	console.log('no lint report returned');
	process.exit(2);
}
const want = (s) => !args.sec || s === args.sec;
let bad = 0;
if (rep.errors.length) {
	console.log('\n== BUILD ERRORS ==');
	for (const e of rep.errors.filter((e) => want(e.sec))) {
		console.log(`  ${e.sec}: ${e.msg}`);
		bad++;
	}
}
const bySec = {};
for (const m of rep.msgs) {
	if (!want(m.sec) || (m.level === 'info' && !args.all)) continue;
	(bySec[m.sec || '-'] ??= []).push(m);
}
for (const [sec, ms] of Object.entries(bySec).sort()) {
	console.log(`\n== ${sec} ==`);
	for (const m of ms.sort((a, b) => a.t - b.t)) {
		console.log(`  [${m.level}] ${fmt(m.t)}  ${m.msg}`);
		if (m.level !== 'info') bad++;
	}
}
console.log(`\nstats: ${JSON.stringify(rep.stats)}`);
console.log(bad ? `${bad} problem(s)` : 'clean');
process.exit(rep.errors.length ? 1 : 0);
