// 白板引擎的统一出口。section 文件一般只需要：
//   import {R, rr, C, CLAUSES, write, freehand, arrow, ...} from '../../whiteboard';
export * from './board';
export {camAt, camEase, easeInOut, easeOut, penEase, screenBox, stageBox, toScreen, viewOf, worldTf} from './camera';
export type {View} from './camera';
export * from './rough';
export * from './theme';
export * from './types';
export * from './verbs';
export * from './kit';
export {registerHanzi, getHanzi} from './hanzi';
export type {HanziData} from './hanzi';
export {lintBoard} from './lint';
export type {LintMsg, LintLevel, LintWindow} from './lint';
export {CaptionBand, activeLineIndex} from './CaptionBand';
export {World, Pencil, penAt} from './Render';
export type {PenState} from './Render';
export {ensureFonts} from './fonts';
