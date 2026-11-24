import subsJson from '../../../../public/v4/starry/native/subs.json';
import cue from '../../../../public/v4/starry/native/cue.json';
import metaJson from '../../../../public/v4/starry/native/timeline_meta.json';
import type {Sub} from '../../kit';
export const subs: Sub[] = subsJson;
export const meta = metaJson;
export const DUR = cue.dur;
export const FPS = 30;
