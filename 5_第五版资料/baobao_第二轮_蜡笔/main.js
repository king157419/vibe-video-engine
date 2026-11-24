// 入口：?test=sheet 打开人物设定页；否则渲染正片
import { makeComp } from './gl.js';
import { BOIL } from './crayon.js';
const Q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('gl'));
window.DUR = 1;
await document.fonts.load('400 40px "WenKai"', '宝宝Aa');
const M = await import('./film.js');
window.DUR = M.DUR; window.EV = M.EV; window.SUBS = M.SUBS; window.TEXTS = M.TEXTS;
const test = Q.get('test');
window.render = test ? (t => { BOIL.step = Math.floor(t * 12); M.sheet(comp, t, test); })
                     : (t => { BOIL.step = Math.floor(t * 12 + 1e-6); M.frame(comp, t); });
window.READY = true;
