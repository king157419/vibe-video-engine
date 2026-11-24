import type {Board, Box, Item, Pt, Track} from '../../whiteboard';
import {boxCenter} from '../../whiteboard';

/**
 * 共享道具的基类。一个道具 = 一个变换组（g）+ 家（home，世界坐标框）+ 它画过的所有条目。
 * - 所有画东西的方法都带显式时刻（ms），谁调用、什么时候调用都行；条目记在调用它的 section 名下。
 * - 在道具身上补画自己的东西：b.inGroup(prop.g, () => {...}) 或 {g: prop.g}，道具移动时一起动。
 * - 移动：moveTo(t, dur, box) 把「家」整体放进 box；back(t, dur) 回家；fade(t, dur, to) 整体淡出/淡入。
 */
export class Prop {
	readonly track: Track;
	items: Item[] = [];
	constructor(
		readonly b: Board,
		readonly g: string,
		readonly home: Box,
	) {
		this.track = b.track(g, boxCenter(home));
	}
	/** 在这个道具的组里画（条目会被记下，erase 时一起擦） */
	protected draw<T>(fn: () => T): T {
		let r: T | undefined;
		const items = this.b.collect(() => {
			r = this.b.inGroup(this.g, fn);
		});
		this.items.push(...items);
		return r as T;
	}
	/** t 时开始，用 dur 毫秒把整个道具（home 框）等比放进 box */
	moveTo(t: number, dur: number, box: Box) {
		this.track.fit(t, dur, this.home, box);
		return this;
	}
	/** 回到原位 */
	back(t: number, dur = 900) {
		this.track.back(t, dur);
		return this;
	}
	/** 整体透明度（0 = 隐去，1 = 正常） */
	fade(t: number, dur: number, to: number) {
		this.track.fade(t, dur, to);
		return this;
	}
	/** 把这个道具到目前为止画过的所有东西在 t 时擦掉 */
	erase(t: number, dur = 450) {
		this.b.eraseAll(this.items, t, dur);
		this.b.sound(t, 'erase', 0.25);
		return this;
	}
	/** 世界坐标里某个点在 ms 时刻的位置（道具被移动后） */
	where(p: Pt, ms: number): Pt {
		const {m} = this.b.groupAt(this.g, ms);
		return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
	}
	/** 某个框在 ms 时刻的位置（给镜头用：cam(prop.boxAt(box, t), t)） */
	boxAt(b: Box, ms: number): Box {
		const a = this.where([b[0], b[1]], ms);
		const c = this.where([b[2], b[3]], ms);
		return [a[0], a[1], c[0], c[1]];
	}
}
