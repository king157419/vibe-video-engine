import type React from 'react';
import type {EpisodeProps} from '../lib/types';
import {Cards} from './Cards';
import {Illustration, ILLUSTRATION_TAIL_MS} from './Illustration';
import {Notes, NOTES_TAIL_MS} from './Notes';
import {Plain} from './Plain';
import {Radio} from './Radio';
import {Sketch} from './Sketch';

/** tailMs：念完后片尾卡停留时长（不填用 lib/load.ts 的 TAIL_MS） */
export type StyleDef = {id: string; component: React.FC<EpisodeProps>; tailMs?: number};

export const STYLES: StyleDef[] = [
	{id: 'Radio', component: Radio, tailMs: 3600},
	{id: 'Notes', component: Notes, tailMs: NOTES_TAIL_MS},
	{id: 'Illustration', component: Illustration, tailMs: ILLUSTRATION_TAIL_MS},
	{id: 'Cards', component: Cards},
	{id: 'Sketch', component: Sketch},
	{id: 'Plain', component: Plain},
];
