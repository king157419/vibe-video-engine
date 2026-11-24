// wb_sheet / wb_lint 共用：打包一次、解析时间写法、读分段。
import {bundle} from '@remotion/bundler';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FPS = 30;
export const ENTRY = path.join(ROOT, 'src/ep01v2/index.ts');
export const COMP = 'EP01v2';
export const EPISODE = 'EP01v2';

export const readSections = () => JSON.parse(fs.readFileSync(path.join(ROOT, `public/episodes/${EPISODE}/sections.json`), 'utf-8'));

/** 解析时间：75 | 75.5 | 1:15 | 1:15.5 | 75000ms | s03 (= 段首 +1.0s) | s03+2.5 | s03-1 | s03@end (= 段尾 -0.5s) | s03@mid → 毫秒 */
export const parseTime = (tok, sections) => {
	const t = tok.trim();
	let m = /^(s\d\d)(?:@(end|mid)|([+-]\d+(?:\.\d+)?))?$/.exec(t);
	if (m) {
		const s = sections.sections.find((x) => x.id === m[1]);
		if (!s) throw new Error(`unknown section ${m[1]}`);
		if (m[2] === 'end') return s.endMs - 500;
		if (m[2] === 'mid') return (s.startMs + s.endMs) / 2;
		return s.startMs + (m[3] !== undefined ? parseFloat(m[3]) * 1000 : 1000);
	}
	if ((m = /^(\d+)ms$/.exec(t))) return parseInt(m[1], 10);
	if ((m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(t))) return (parseInt(m[1], 10) * 60 + parseFloat(m[2])) * 1000;
	if (/^\d+(?:\.\d+)?$/.test(t)) return parseFloat(t) * 1000;
	throw new Error(`bad time "${tok}"`);
};

export const fmt = (ms) => {
	const s = ms / 1000;
	return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

export const sectionAt = (ms, sections) => {
	let id = sections.sections[0].id;
	for (const s of sections.sections) if (s.startMs - 1 <= ms) id = s.id;
	return id;
};

export const makeBundle = async () => {
	const t = Date.now();
	// 固定输出目录（D: 盘，每次覆盖），避免在 %TEMP% 里堆积 remotion-webpack-bundle-*。
	const outDir = path.join(ROOT, 'out/wb/_bundle', String(process.pid));
	const serveUrl = await bundle({entryPoint: ENTRY, publicDir: path.join(ROOT, 'public'), outDir, onProgress: () => undefined});
	process.on('exit', () => {
		try {
			fs.rmSync(outDir, {recursive: true, force: true});
		} catch {}
	});
	console.log(`bundled in ${((Date.now() - t) / 1000).toFixed(1)}s`);
	return serveUrl;
};

/** 简单的命令行参数：--key value / --flag */
export const parseArgs = (argv) => {
	const out = {_: []};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith('--')) {
			const k = a.slice(2);
			const v = argv[i + 1];
			if (v === undefined || v.startsWith('--')) out[k] = true;
			else {
				out[k] = v;
				i++;
			}
		} else out._.push(a);
	}
	return out;
};
