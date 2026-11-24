import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * 读 episodes/<id>/script.txt（管线必备文件，make.py 没有它会直接报错）。
 * 只用来把稿子里的标点对齐回笔记；取不到就返回 null，笔记退回到“停顿 → ，”的兜底写法。
 * undefined = 还在读。
 */
export const useScript = (episode: string | undefined): string | null | undefined => {
	const [text, setText] = useState<string | null | undefined>(episode ? undefined : null);
	const [handle] = useState<number | null>(() => (episode ? delayRender(`Notes: read script.txt of ${episode}`) : null));

	useEffect(() => {
		if (!episode) return;
		let alive = true;
		fetch(staticFile(`episodes/${episode}/script.txt`))
			.then((r) => (r.ok ? r.text() : null))
			.catch(() => null)
			.then((t) => {
				if (alive) setText(t && t.trim() ? t : null);
			});
		return () => {
			alive = false;
		};
	}, [episode]);

	useEffect(() => {
		if (text !== undefined && handle !== null) continueRender(handle);
	}, [text, handle]);

	return text;
};
