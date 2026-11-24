// 逐字字幕（tools/transcribe.py 产出的 captions.json）与分段（sections.json）的类型。

export type CapChar = {t: string; s: number; e: number; hl: boolean};

export type CapLine = {
	i: number;
	text: string;
	startMs: number;
	endMs: number;
	sentenceEnd: boolean;
	paraEnd?: boolean;
	chars: CapChar[];
};

export type Captions = {
	id: string;
	audio: string;
	durationMs: number;
	voice?: string;
	keywords: string[];
	lines: CapLine[];
};

export type SectionInfo = {
	id: string;
	title: string;
	plannedTime?: string;
	startChar?: number;
	startMs: number;
	firstText?: string;
	endMs: number;
	nextStartMs: number;
};

export type Sections = {durationMs: number; sections: SectionInfo[]};
