// 真实笔顺数据（hanzi-writer-data）的登记处。
// 各集的 hanzi.generated.ts 由 tools/wb_hanzi.py 扫描 write(...) 调用自动生成，
// Episode 启动时 registerHanzi(HANZI) 一次；write() 在这里查字。

export type HanziData = {strokes: string[]; medians: number[][][]};

const REG: Record<string, HanziData> = {};
const warned = new Set<string>();

export const registerHanzi = (data: Record<string, HanziData>) => {
	Object.assign(REG, data);
};

export const getHanzi = (ch: string): HanziData | undefined => REG[ch];

/** 缺字只警告一次（write 会退回用字体逐字擦出） */
export const warnMissing = (ch: string, word: string) => {
	if (warned.has(ch)) return;
	warned.add(ch);
	if (/[\u3400-\u9fff]/.test(ch)) {
		missingHanzi.add(ch);
		console.warn(`[wb] no stroke data for "${ch}" (in "${word}"). Run: D:\\conda\\miniconda3\\python.exe tools/wb_hanzi.py`);
	}
};

/** 本次构建里缺笔顺数据的汉字（lint 报告用） */
export const missingHanzi = new Set<string>();
