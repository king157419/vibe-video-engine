import {registerRoot} from 'remotion';
import {RiceRoot} from './Root';

// 样片二的独立入口（只注册 V3Rice）：
// node_modules\.bin\remotion.cmd render src\v3\rice\index.ts V3Rice out\v3\rice\final.mp4
registerRoot(RiceRoot);
