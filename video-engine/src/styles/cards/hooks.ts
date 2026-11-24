import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {SANS} from '../../lib/fonts';

// ensureFonts() 加载完才把 FontFace 加进 document.fonts，React 不会因此重渲染。
// 排版要 measureText，必须等思源黑体真正可用再量，否则按回退字体排版且被缓存。
export const sansLoaded = (): boolean => {
	if (typeof document === 'undefined' || !document.fonts) return false;
	let ok = false;
	document.fonts.forEach((f) => {
		if (f.status === 'loaded' && f.family.replace(/["']/g, '') === SANS) ok = true;
	});
	return ok;
};

export const useFontsReady = (): boolean => {
	const [ready, setReady] = useState<boolean>(sansLoaded);
	const [handle] = useState<number | null>(() => (sansLoaded() ? null : delayRender('Cards: wait for sans font')));

	useEffect(() => {
		if (ready) return;
		let alive = true;
		let tries = 0;
		const tick = () => {
			if (!alive) return;
			// 最多等 ~10s；字体真失败时也放行（ensureFonts 已打印错误），避免整片渲染超时
			if (sansLoaded() || tries++ > 400) {
				setReady(true);
				return;
			}
			setTimeout(tick, 25);
		};
		tick();
		return () => {
			alive = false;
		};
	}, [ready]);

	// 等 ready=true 的这次渲染提交后再放行截图
	useEffect(() => {
		if (ready && handle !== null) continueRender(handle);
	}, [ready, handle]);

	return ready;
};

/**
 * 读 episodes/<id>/script.txt（管线必备文件）。只用来对齐标点：
 * 行尾是 。！？ 还是 ，：（决定要不要把两句并到一张卡），以及行内停顿原本是 ，还是 、。
 * 读不到返回 null，退回到按停顿时长判断。undefined = 还在读。
 */
export const useScript = (episode: string | undefined): string | null | undefined => {
	const [text, setText] = useState<string | null | undefined>(episode ? undefined : null);
	const [handle] = useState<number | null>(() => (episode ? delayRender(`Cards: read script.txt of ${episode}`) : null));

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
