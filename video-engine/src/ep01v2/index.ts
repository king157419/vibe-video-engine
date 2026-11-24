import {registerRoot} from 'remotion';
import {EP01v2Root} from './Root';

// EP01v2 的独立入口：npx remotion render src/ep01v2/index.ts EP01v2 out/EP01v2.mp4
registerRoot(EP01v2Root);
