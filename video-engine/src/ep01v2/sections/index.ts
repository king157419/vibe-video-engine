import type {SectionCtx} from '../ctx';
import {build as s01} from './s01';
import {build as s02} from './s02';
import {build as s03} from './s03';
import {build as s04} from './s04';
import {build as s05} from './s05';
import {build as s06} from './s06';
import {build as s07} from './s07';
import {build as s08} from './s08';
import {build as s09} from './s09';
import {build as s10} from './s10';
import {build as s11} from './s11';
import {build as s12} from './s12';
import {build as s13} from './s13';
import {build as s14} from './s14';
import {build as s15} from './s15';

// 架构层维护：section 顺序 = 构建顺序 = 画面叠放顺序（后面的段画在上面）。section 负责人不要改这个文件。
export const SECTION_BUILDERS: [string, (ctx: SectionCtx) => void][] = [
	['s01', s01],
	['s02', s02],
	['s03', s03],
	['s04', s04],
	['s05', s05],
	['s06', s06],
	['s07', s07],
	['s08', s08],
	['s09', s09],
	['s10', s10],
	['s11', s11],
	['s12', s12],
	['s13', s13],
	['s14', s14],
	['s15', s15],
];
