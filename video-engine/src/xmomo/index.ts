// Separate entry for the xmomo ads (does not touch the shared Root). Render with:
// npx remotion render src/xmomo/index.ts XmomoBrand out/xmomo_brand.mp4
import {registerRoot} from 'remotion';
import {XmomoRoot} from './Root';
registerRoot(XmomoRoot);
