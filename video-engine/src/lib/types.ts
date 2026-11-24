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

/** episodes/<id>/meta.json（可选）：系列/章节/标题等画面信息 */
export type EpisodeMeta = {
	series?: string;
	episodeNo?: string;
	chapter?: string;
	title?: string;
	cover?: string;
	quote?: string;
	images?: string[];
	next?: string; // 下期预告（片尾「关注我 · 下期聊…」）
	book?: string; // 只写书名，不带《》，例如「养育你内心的小孩」
	author?: string; // 例如「丛非从」
	bgm?: string;
	current?: string;
	index?: number;
	indexTitle?: string;
	quoteSource?: string;
	quotePage?: string;
};

export type EpisodeProps = {
	episode: string;
	captions: Captions | null;
	meta: EpisodeMeta | null;
};
