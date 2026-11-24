import {registerRoot} from 'remotion';
import {OpusRoot} from './OpusRoot';

// opus 的独立入口：npx remotion render src/lab/opus/index.ts Lab01Opus out.mp4
registerRoot(OpusRoot);
