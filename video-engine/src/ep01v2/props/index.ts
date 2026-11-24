import type {Board} from '../../whiteboard';
import {SuggestBar} from './bar';
import {Base} from './base';
import {ChatBox} from './chat';
import {CoreDiagram} from './core';

export {BaseRow} from './base';
export {chatIcon, hm} from './chat';
export type {BarRow} from './bar';

/** 全片共享的持久道具。Episode 构建时建一次，所有 section 拿到的是同一份。 */
export type Props = {
	/** D1 涂黑名字的聊天框 + 句子条（OPEN 岛） */
	chat: ChatBox;
	/** D3 联想栏 + 句尾词/图标 + 句尾牌（OPEN 岛，句子条下方） */
	bar: SuggestBar;
	/** D4 底座五格（BASE 岛） */
	base: Base;
	/** D14 核心图（CORE 岛） */
	core: CoreDiagram;
};

export const makeProps = (b: Board): Props => ({
	chat: new ChatBox(b),
	bar: new SuggestBar(b),
	base: new Base(b),
	core: new CoreDiagram(b),
});

export {ChatBox, SuggestBar, Base, CoreDiagram};
