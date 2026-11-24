// 《宝宝》第二版：一大张纸上画着十几页小画，镜头在纸上移动（横移、下摇、推、拉）。
// 时间轴全部由字幕表推出来：每句字幕的时长按字数算，画面动作挂在字幕的开始时间上。
import { layer, clear, line, fill, dab, text, handCircle, ellipse, smooth, xf, CAM, BOIL, W, H, sx, sy } from './crayon.js';
import { group, clearGroup, part, tube, curve, knock } from './rig.js';
import { person } from './people.js';
import { PAL } from './pal.js';
import { clamp, lerp, hash, track, ss, eio, eo } from '/core/lib.js';
const K = PAL.crayon;
const pr = (t, a, b) => clamp((t - a) / (b - a));
export const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 3;
const snap = t => Math.ceil(t / BEAT - 1e-6) * BEAT;
const FONT = 'WenKai';

// ———————————————— 字幕表 ————————————————
// [id, 中文, English] 或 ['#名字', 秒数]（无字的段落，留给画面）
const SCRIPT = [
  ['o1', '他们都二十八岁。', 'They are both twenty-eight.'],
  ['#bb1', 0.6],
  ['o3', '一声“宝宝”，他在她的画里，小了二十岁。', 'One "baby", and in her picture he is twenty years younger.'],
  ['#bb2', 1.0],
  ['o5', '喂她一口，她也变小了。', 'One bite later, she is small too.'],
  ['o6', '你在 TA 面前，几岁？', 'How old are you, around them?'],
  ['#title', 4.4],
  ['c1a', '这几年，大家都爱把自己往小了叫。', 'Lately, everyone calls themselves smaller.'],
  ['c1b', '恋人之间：叠字、婴语、喂饭。', 'Between lovers: doubled words, baby talk, feeding.'],
  ['c1c', '看见好吃的，喊“妈妈”。', 'Something tasty? Cry "Mom!"'],
  ['c1d', '手把手的细致教程，叫“妈妈级”。', 'A hand-holding tutorial is "mom-level".'],
  ['c1e', '打游戏输了，叫“爸爸”。', 'Lose a game, call the winner "Dad".'],
  ['c1f', '直播间里，陌生人都是“宝宝们”。', 'In a livestream, strangers are all "babies".'],
  ['c1g', '大家都抢着，当最小的那个。', 'Everyone scrambles to be the youngest.'],
  ['c1h', '为什么？偏偏是在最亲的人面前。', 'Why? And why with the people closest to us?'],
  ['c2a', '精神分析里有个词：退行。', 'Psychoanalysis has a word for it: regression.'],
  ['c2b', '人在某些时候，会退回更小的样子。', 'At times, we slip back to a younger self.'],
  ['c2c', '累了、病了、怕了，都会。它本身不是病。', 'Tired, ill, afraid: everyone does. It is not an illness.'],
  ['c2d', '1987 年，两位心理学家提出：恋爱也是一种依恋。', 'In 1987, two psychologists proposed: love is a form of attachment.'],
  ['c2e', '小孩敢跑出去，是因为知道能跑回来。', 'A toddler dares to wander because it can run back.'],
  ['c2f', '依恋理论把这个人，叫“安全基地”。', 'Attachment theory calls that person a "secure base".'],
  ['c2g', '白天在外面当大人；回到安全基地，才敢变回小孩。', 'Out there we act grown-up. At the secure base, we dare to be small.'],
  ['c3a', '丛非从在《养育你内心的小孩》里，把关系分成三种状态。', 'In Nurturing Your Inner Child, Cong Feicong names three states of a relationship.'],
  ['c3b', '母婴式：一个要，一个给。', 'Mother-infant: one takes, one gives.'],
  ['c3c', '矛盾式：两个人都等着被照顾。', 'Conflicted: both wait to be looked after.'],
  ['c3d', '成人式：两个能照顾好自己的人，一起分享。', 'Adult: two people who can care for themselves, sharing.'],
  ['c3e', '他认为，母婴式本身没问题；问题是一直待在“宝宝”的位置上，出不来。', 'He thinks mother-infant is fine; the trouble is being stuck as the "baby".'],
  ['c4a', '也有人，连“亲爱的”都叫不出口。', 'And some can never say "darling".'],
  ['#hush', 2.6],
  ['c4b', '他们的爱，在筷子上。', 'Their love is in the chopsticks.'],
  ['c4c', '夹菜，也是在喂。', 'Putting food in your bowl is feeding, too.'],
  ['c4d', '人类学家阎云翔在黑龙江下岬村听到：', 'Anthropologist Yan Yunxiang heard, in Xiajia village, Heilongjiang:'],
  ['c4e', '有姑娘希望丈夫别像她爸那样只会训人，要会说好听的。', 'a young woman hoped her husband would not just scold like her father, but say sweet things.'],
  ['c4f', '社会学家吉登斯说：现代的关系，越来越靠“两个人在一起好不好”来维系。', 'Sociologist Giddens: modern ties rest more and more on whether two people are good together.'],
  ['c4g', '过日子的爱，可以不说；要确认的爱，得说出来。', 'Love in daily chores can go unsaid. Love that needs confirming must be spoken.'],
  ['c4h', '“宝宝”，就是最省力的一句确认。', '"Baby" is the easiest confirmation there is.'],
  ['c4i', '以前我们往上叫：叔叔、阿姨、大哥，是尊重。', 'We used to call upward: uncle, auntie, big brother. That was respect.'],
  ['c4j', '现在往下叫：宝宝、妈妈，是想被照顾。', 'Now we call downward: baby, mom. That is wanting care.'],
  ['c5a', '所以，叫一声“宝宝”，不是变幼稚。', 'So calling someone "baby" is not being childish.'],
  ['c5b', '是在说：在你面前，我可以不逞强。', 'It says: with you, I do not have to be strong.'],
  ['c5c', '好的爱是轮流的：今天你当小孩，我来照顾；明天换我。', 'Good love takes turns: today you are the child and I look after you. Tomorrow, me.'],
  ['c5d', '然后，两个人都还能长回大人。', 'And both can still grow back into grown-ups.'],
  ['#wash', 9.0],
  ['c5e', '你在 TA 面前，几岁？', 'How old are you, around them?'],
  ['#end', 3.4],
];
const zhLen = s => [...s].filter(c => /[㐀-鿿＀-￯]/.test(c)).length;
export const T = {}; export const SUBS = [];
{
  let t = 0;
  for (const it of SCRIPT) {
    if (it[0][0] === '#') { const t0 = snap(t + 0.15); T[it[0].slice(1)] = t0; t = t0 + it[1]; continue; }
    const [id, zh, en] = it; const n = zhLen(zh) + [...en].length / 9;
    const d = Math.max(2.5, n / 5.2 + 1.1);
    const t0 = id === 'o1' ? 0 : snap(t + 0.25);
    T[id] = t0; SUBS.push({ id, t0, t1: t0 + d, zh, en, text: zh + ' / ' + en }); t = t0 + d;
  }
  T.end1 = t;
}
export const DUR = +(T.end1).toFixed(3);
const S = id => SUBS.find(s => s.id === id);
const at = id => T[id];

// ———————————————— 纸上的版面：每页一个中心点 ————————————————
const R = {
  table: [960, 540], title: [960, 1840],
  v1: [2860, 1840], v2: [4660, 1840], v3: [6460, 1840], v4: [8260, 1840], v5: [10060, 1840], door: [11860, 1840],
  regress: [11860, 3140], base: [10060, 3140], commute: [8260, 3140], three: [6460, 3140],
  table2: [6460, 4440], village: [8260, 4440], split: [10060, 4440], ladder: [11860, 4440],
  seesaw: [11860, 5740],
};
// 镜头：每个镜头 [开始时间, 页名, dx, dy, 缩放]；两镜之间用 0.9 秒横移/下摇
const SHOTS = [
  [0, 'table', 0, 90, 1.22], [at('o6'), 'table', 0, 60, 1.4],
  [at('title'), 'title', 0, 0, 1.0],
  [at('c1a'), 'v1', 0, 110, 1.35], [at('c1c'), 'v2', 0, 90, 1.25], [at('c1d'), 'v3', 0, 30, 1.15], [at('c1e'), 'v4', 0, 90, 1.25],
  [at('c1f'), 'v5', 0, 60, 1.1], [at('c1g'), 'door', 0, 40, 1.05], [at('c1h'), 'door', -60, 70, 1.3],
  [at('c2a'), 'regress', 0, 40, 1.1], [at('c2c'), 'regress', 0, 90, 1.2],
  [at('c2d'), 'base', 0, 60, 1.1], [at('c2f'), 'base', -300, 70, 1.25], [at('c2g'), 'commute', 0, 20, 1.0],
  [at('c3a'), 'three', 0, 0, 1.0], [at('c3e'), 'three', -560, 40, 1.6],
  [at('c4a'), 'table2', 0, 90, 1.22], [at('hush'), 'table2', 0, 80, 1.45], [at('c4c'), 'table2', 0, 90, 1.22],
  [at('c4d'), 'village', 0, 40, 1.1], [at('c4f'), 'split', 0, 30, 1.08], [at('c4i'), 'ladder', 0, 40, 1.08],
  [at('c5a'), 'seesaw', 0, 160, 1.25], [at('wash') - 0.2, 'seesaw', 0, 0, 1.0], [at('c5e') + 0.4, 'seesaw', 0, 260, 0.46], [at('end') + 0.6, 'seesaw', 0, 1500, 1.0],
];
const camKeys = [];
SHOTS.forEach((s, i) => {
  const [t, r, dx, dy, z] = s, c = [R[r][0] + dx, R[r][1] + dy, z];
  const prev = SHOTS[i - 1];
  const sameRegion = prev && prev[1] === r;
  const moveT = i === 0 ? 0 : sameRegion ? (i === SHOTS.length - 2 ? 3.2 : 1.6) : 0.85;
  if (i > 0) camKeys.push([Math.max(t - moveT, camKeys[camKeys.length - 1][0] + 0.01), camKeys[camKeys.length - 1][1]]);
  camKeys.push([t + (i === 0 ? 0 : 0.0), c]);
});
const camT = track(camKeys);

// ———————————————— 事件（给配乐和音效） ————————————————
export const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
SHOTS.forEach((s, i) => { if (i && SHOTS[i - 1][1] !== s[1]) ev(s[0] - 0.95, 'pan', { dur: 0.95 }); });
// 每一次「变小」都是一声钟琴（画面重点）；变大是一声竖笛短音
const SHRINK = [];   // [时间, 名字]
const shrink = (t, who, big = false) => { SHRINK.push([t, who]); ev(t, big ? 'grow' : 'shrink', { who }); };

// 开场
const OP = { bubble1: 1.25, shrink1: 3 * BEAT * 1 + BEAT * 2, feedStart: 0, bubble2: 0, shrink2: 0 };
OP.shrink1 = snap(Math.max(2.5, at('o3') - 0.3));
OP.feedStart = at('o3') + 1.2; OP.bubble2 = at('bb2') - 0.5; OP.shrink2 = snap(at('bb2') + 0.5);
shrink(OP.shrink1, 'him'); shrink(OP.shrink2, 'her');
ev(OP.bubble1, 'pop'); ev(OP.bubble2, 'pop');
ev(at('title') + 0.7, 'title', { dur: 2.2 });
// 第一章：每个小画一出现，就有一个人变小
const V = { v1: at('c1b') + 0.5, v2: at('c1c') + 1.0, v3: at('c1d') + 1.1, v4: at('c1e') + 1.0, v5: at('c1f') + 1.2 };
for (const k in V) shrink(snap(V[k]), k);
ev(at('c1e') + 1.0, 'bassoon');
const DOOR = { pull: at('c1g') };
// 第二章
const RG = { kid: snap(at('c2b') + 1.0), trio: at('c2c') + 0.3 };
shrink(RG.kid, 'regress');
const BASE = { out: at('c2e') + 0.2, back: at('c2e') + 2.6, roof: at('c2f') + 0.6 };
ev(BASE.roof, 'roof');
const COM = { walk0: at('c2g') + 0.2, door: at('c2g') + 3.6 };
shrink(snap(COM.door), 'commute'); ev(COM.door - 0.3, 'door');
const THREE = { p1: at('c3b'), p2: at('c3c'), p3: at('c3d'), pre: at('c3a') + 2.2 };
ev(THREE.p2 + 0.6, 'wah');
// 第三章：硬静音，只有筷子碰碗
const HUSH = { t0: at('hush'), chop: at('hush') + 1.15, dropT: at('hush') + 1.6 };
ev(HUSH.t0, 'silence', { dur: at('c4b') - HUSH.t0 });
ev(HUSH.chop, 'chop'); ev(HUSH.dropT, 'bowl');
const SPLIT = { bub: snap(at('c4h') + 0.3) };
ev(SPLIT.bub, 'pop');
const LAD = { up: at('c4i') + 0.6, down: snap(at('c4j') + 0.8) };
shrink(LAD.down, 'ladder');
// 第四章：跷跷板 + 水彩
const SEE = { t0: at('c5a'), level: at('c5d') + 0.4 };
const SEE_FLIPS = []; for (let k = 0; ; k++) { const t = snap(at('c5c') - 0.6 + k * BAR); if (t > SEE.level - 0.4) break; SEE_FLIPS.push(t); ev(t, 'creak', { k }); }
ev(snap(SEE.level), 'grow', { who: 'both' });
const WASH_T = { t0: at('wash') + 0.9, t1: at('wash') + 5.4 };
ev(at('wash'), 'breath', { dur: 0.9 });
ev(WASH_T.t0, 'brush', { dur: WASH_T.t1 - WASH_T.t0 });
ev(WASH_T.t0 + (WASH_T.t1 - WASH_T.t0) * 0.5, 'reveal');
ev(at('end') + 0.6, 'out');
// 音乐段落
[['open', 0], ['title', at('title')], ['one', at('c1a')], ['two', at('c2a')], ['three', at('c3a')], ['four', at('c4a')], ['hush', at('hush')], ['back', at('c4b')],
 ['five', at('c5a')], ['wash', at('wash')], ['tail', at('c5e')], ['end', DUR]].forEach(([id, t]) => ev(t, 'cue', { id }));

// ———————————————— 图层 ————————————————
const G = group(), TOP = group(), WAX = layer(), WASH = layer(), SUBK = layer(), SUBT = layer();
let TX = [];   // 本帧屏幕上的字（readcheck 用）
export const TEXTS = () => TX;
const say = (id, str, x, y, o) => {      // 写在纸上的字（世界坐标）
  const w = text(o.L || TOP.l, str, sx(x), sy(y), { font: FONT, col: K.ink, p: 0.95, ...o, size: (o.size ?? 54) * CAM.s });
  const al = o.align === 'left' ? 0 : o.align === 'right' ? 1 : 0.5;
  const x0 = sx(x) - w * al, h = (o.size ?? 54) * CAM.s;
  if ((o.reveal ?? 1) > 0.01 && x0 > -5 && x0 + w < W + 5 && sy(y) - h > -5 && sy(y) < H + 5 && !o.noCheck) TX.push({ id, text: str, x0, y0: sy(y) - h, x1: x0 + w, y1: sy(y) + h * 0.25 });
  return w;
};
function bubble(id, str, x, y, tail, o = {}) {   // 对白泡泡：先画出轮廓再写字
  const p = o.draw ?? 1; if (p <= 0) return;
  const g = TOP.l.g; g.save(); g.font = `400 ${o.size ?? 52}px "${FONT}"`; const tw = g.measureText(str).width; g.restore();
  const hw = tw / 2 + 34, hh = (o.size ?? 52) * 0.85;
  const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a); pts.push([x + Math.sign(c) * Math.pow(Math.abs(c), 0.55) * hw * (1 + 0.04 * Math.sin(a * 5 + x)), y + Math.sign(s) * Math.pow(Math.abs(s), 0.6) * hh]); }
  const bub = smooth(pts, 3);
  part(TOP, bub, o.fillCol ? { col: o.fillCol, p: 0.35, gap: 10, w: 12, seed: 700 + x } : null, { w: 5, seed: 701 + x, draw: p }, { occ: false });
  if (tail) line(TOP.l, [[x + tail[0] * 0.3, y + hh * 0.8], tail.map((v, i) => v + [x, y][i])], { w: 5, seed: 702 + x, draw: p });
  say(id, str, x, y + (o.size ?? 52) * 0.36, { size: o.size ?? 52, reveal: pr(p, 0.5, 1), seed: 703 + x, col: o.col ?? K.ink });
}

// 共用小物件
const ground = (y, x0 = 40, x1 = 1880, seed = 1) => line(G.l, [[x0, y + 4], [960, y - 4], [x1, y + 2]], { w: 5, seed, p: 0.7 });
function bowl(x, y, o = {}) {
  part(G, smooth([[x - 46, y - 8], [x + 46, y - 8], [x + 36, y + 26], [x - 36, y + 26]], 3), { col: o.col ?? K.sky, p: 0.55, gap: 8, w: 9, seed: 500 + x }, { w: 4.5, seed: 501 + x });
  if (o.rice !== false) { line(G.l, smooth([[x - 44, y - 8], [x - 20, y - 30], [x + 20, y - 30], [x + 44, y - 8]], 4, false), { w: 4.5, seed: 502 + x }); for (let k = 0; k < 5; k++) dab(G.l, x - 24 + k * 12, y - 16 - (k % 2) * 6, 2.5, { col: K.ochre, p: 0.6, seed: 503 + k }); }
  if (o.meat) for (let k = 0; k < o.meat; k++) part(G, smooth([[x - 14 + k * 18, y - 24], [x - 2 + k * 18, y - 24], [x - 1 + k * 18, y - 12], [x - 15 + k * 18, y - 12]], 2), { col: K.red, p: 0.9, gap: 4, w: 6, seed: 505 + k }, { w: 3.5, seed: 506 + k });
}
function porkPlate(x, y, s = 1) {
  part(G, ellipse(x, y, 120 * s, 34 * s, 36), { col: K.white, p: 0.4, gap: 10, w: 10, seed: 520 }, { w: 4.5, seed: 521 });
  for (let k = 0; k < 7; k++) {
    const cx = x - 70 * s + (k % 4) * 46 * s + (k > 3 ? 22 * s : 0), cy = y - 14 * s - (k > 3 ? 20 * s : 0);
    part(G, smooth([[cx - 18 * s, cy - 14 * s], [cx + 18 * s, cy - 16 * s], [cx + 20 * s, cy + 12 * s], [cx - 18 * s, cy + 14 * s]], 2), { col: K.red, p: 0.92, gap: 5, w: 7, seed: 522 + k, cross: true }, { w: 4, seed: 523 + k });
    line(G.l, [[cx - 12 * s, cy - 4 * s], [cx + 12 * s, cy - 6 * s]], { w: 3, col: K.yellow, seed: 524 + k, p: 0.7 });
  }
}
function table(x0, x1, y, o = {}) {      // 小孩画法的桌子：桌面梯形 + 前沿 + 四条腿
  const top = [[x0 + 40, y - 50], [x1 - 40, y - 50], [x1, y], [x0, y]];
  part(G, [...top], { col: K.ochre, p: 0.85, gap: 9, w: 11, seed: 540, ang: 0.15 }, { w: 6, seed: 541 });
  part(G, [[x0, y], [x1, y], [x1, y + 22], [x0, y + 22]], { col: K.brown, p: 0.8, gap: 7, w: 9, seed: 542 }, { w: 6, seed: 543 });
  for (const lx of [x0 + 24, x1 - 24]) part(G, [[lx - 9, y + 22], [lx + 9, y + 22], [lx + 9, o.floor], [lx - 9, o.floor]], { col: K.brown, p: 0.8, gap: 6, w: 8, seed: 544 + lx }, { w: 5, seed: 545 + lx });
}
function chair(x, floor, seat, side) {
  part(G, [[x - 52, floor - seat - 12], [x + 52, floor - seat - 12], [x + 52, floor - seat + 6], [x - 52, floor - seat + 6]], { col: K.brown, p: 0.75, gap: 7, w: 9, seed: 560 + x }, { w: 5, seed: 561 + x });
  for (const lx of [x - 44, x + 44]) line(G.l, [[lx, floor - seat + 6], [lx, floor]], { w: 7, col: K.brown, seed: 562 + lx });
  line(G.l, [[x - side * 50, floor - seat - 12], [x - side * 50, floor - seat - 190]], { w: 7, col: K.brown, seed: 563 + x });
}
function heart(x, y, r, seed, o = {}) {
  const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push([x + r * 16 * Math.pow(Math.sin(a), 3) / 16, y - r * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16]); }
  part(o.TOPL ? TOP : G, pts, { col: o.col ?? K.red, p: 0.85, gap: 5, w: 7, seed }, { w: 4, seed: seed + 1, col: o.col ?? K.red, draw: o.draw ?? 1 });
}
function chopsticks(hand, tip, o = {}) {
  for (const k of [0, 1]) line(G.l, [[hand[0], hand[1] - 4 + k * 8], [tip[0], tip[1] + k * 6]], { w: 4.5, col: K.brown, seed: 580 + k, p: 0.95 });
  if (o.meat) part(G, smooth([[tip[0] - 12, tip[1] - 8], [tip[0] + 12, tip[1] - 9], [tip[0] + 13, tip[1] + 9], [tip[0] - 11, tip[1] + 10]], 2), { col: K.red, p: 0.92, gap: 4, w: 6, seed: 585 }, { w: 3.5, seed: 586 });
}
const isSmall = (who, t) => SHRINK.some(([st, w]) => w === who && t >= st);

// ———————————————— 每一页 ————————————————
const PAGES = {
  // 开场：饭桌两头坐着两个二十八岁的人
  table(t) {
    const F = 880; ground(F, 40, 1880, 3);
    // 墙上的窗和吊灯
    part(G, [[820, 120], [1100, 120], [1100, 330], [820, 330]], { col: K.sky, p: 0.35, gap: 12, w: 12, seed: 600 }, { w: 5, seed: 601 });
    line(G.l, [[960, 120], [960, 330]], { w: 4, seed: 602 }); line(G.l, [[820, 225], [1100, 225]], { w: 4, seed: 603 });
    line(G.l, [[1340, 0], [1340, 150]], { w: 4, seed: 604 });
    part(G, smooth([[1290, 196], [1340, 140], [1390, 196]], 4, false).concat([[1290, 196]]), { col: K.yellow, p: 0.9, gap: 6, w: 9, seed: 605 }, { w: 5, seed: 606 });
    const himSmall = isSmall('him', t), herSmall = isSmall('her', t);
    chair(560, F, 180, -1); chair(1360, F, 180, 1);
    const feeding = t > OP.feedStart && t < OP.shrink2 + 1.6;
    const reach = feeding ? eo(pr(t, OP.feedStart, OP.feedStart + 0.8)) : 0;
    const him = person(G, { x: 560, y: F, seat: 180, kid: himSmall, s: himSmall ? 0.8 : 1, shirt: K.sky, hair: 'short', seed: 1000,
      expr: himSmall ? (feeding ? 'open' : 'smile') : 'smile', arms: 'table', armTo: feeding ? { R: [lerp(700, 1250, reach), lerp(690, herSmall ? 640 : 585, reach)] } : null, swing: t * 3 });
    const her = person(G, { x: 1360, y: F, seat: 180, kid: herSmall, s: herSmall ? 0.8 : 1, shirt: K.pink, hair: 'long', seed: 2000,
      expr: herSmall ? 'smile' : (t > OP.bubble2 + 0.2 && t < OP.shrink2 ? 'open' : t > OP.bubble1 && t < OP.shrink1 ? 'blush' : 'smile'), arms: 'table', swing: t * 3 + 1 });
    table(700, 1220, 700, { floor: F });
    bowl(800, 640); bowl(1120, 640); porkPlate(960, 652, 0.8);
    if (feeding) chopsticks(him._hand, [him._hand[0] + 60, him._hand[1] - 6], { meat: t < OP.shrink2 });
    if (t > OP.bubble1 && t < OP.shrink1 + 2.0) bubble('bb1', '宝宝～', 1460, 400, [-60, 60], { draw: pr(t, OP.bubble1, OP.bubble1 + 0.45) });
    if (t > OP.bubble2 && t < OP.shrink2 + 1.4) bubble('bb2', '啊——张嘴', 450, 380, [60, 80], { draw: pr(t, OP.bubble2, OP.bubble2 + 0.45) });
    if (t < 3.0 || t > at('o5') - 0.5) say('age', t < OP.shrink2 ? '28' : '?', 960, 300, { size: 0, reveal: 0, noCheck: true });
  },
  // 片名
  title(t) {
    const t0 = at('title');
    say('title', '宝宝', 960, 560, { size: 300, col: K.red, reveal: pr(t, t0 + 0.7, t0 + 1.5), seed: 31, stroke: 3 });
    say('sub1', '退行 · 弗洛伊德 · 1900', 960, 700, { size: 54, reveal: pr(t, t0 + 1.7, t0 + 2.3), seed: 32 });
    say('sub2', 'Regression · Freud · 1900', 960, 770, { size: 34, reveal: pr(t, t0 + 2.2, t0 + 2.6), seed: 33, p: 0.8 });
    // 片名下画一个小奶嘴
    if (t > t0 + 2.6) { part(G, handCircle(1290, 470, 34, 34, 0, 30), { col: K.yellow, p: 0.85, gap: 6, w: 8, seed: 34 }, { w: 5, seed: 35 }); line(G.l, ellipse(1290, 470, 16, 16, 20), { w: 5, col: K.pink, seed: 36 }); }
  },
  v1(t) {   // 恋人之间
    const F = 820; ground(F, 200, 1720, 5);
    const sm = isSmall('v1', t);
    person(G, { x: 820, y: F, kid: sm, s: sm ? 0.9 : 1, shirt: K.sky, hair: 'short', seed: 1100, arms: { R: [sm ? 52 : 90, sm ? 30 : 70] }, expr: 'smile' });
    person(G, { x: 1100, y: F, kid: sm, s: sm ? 0.9 : 1, shirt: K.pink, hair: 'long', seed: 1200, arms: { L: [sm ? -52 : -90, sm ? 30 : 70] }, expr: sm ? 'blush' : 'smile' });
    const t0 = at('c1b');
    bubble('v1a', '吃饭饭', 560, 380, [60, 70], { draw: pr(t, t0 + 0.2, t0 + 0.6) });
    bubble('v1b', '睡觉觉', 1380, 330, [-70, 80], { draw: pr(t, t0 + 0.9, t0 + 1.3) });
    if (t > t0 + 1.4) heart(960, 420, 34, 1300, { draw: pr(t, t0 + 1.4, t0 + 1.8) });
  },
  v2(t) {   // 看见好吃的喊妈妈
    const F = 820; ground(F, 200, 1720, 6);
    table(1060, 1560, 640, { floor: F }); porkPlate(1310, 590, 1.1);
    const sm = isSmall('v2', t);
    person(G, { x: 760, y: F, kid: sm, s: sm ? 1.0 : 1, shirt: K.green, hair: 'short', seed: 1400, arms: sm ? 'up' : 'rest', expr: sm ? 'open' : 'flat' });
    if (sm) bubble('v2a', '妈妈！我要吃这个！', 760, 360, [0, 90], { draw: pr(t, V.v2, V.v2 + 0.5) });
  },
  v3(t) {   // 妈妈级教程
    const F = 820; ground(F, 200, 1720, 7);
    part(G, [[980, 250], [1500, 270], [1490, 740], [970, 730]], { col: K.white, p: 0.3, gap: 12, w: 12, seed: 1500 }, { w: 5, seed: 1501 });
    say('v3t', '妈妈级教程', 1235, 345, { size: 58, col: K.red, seed: 1502, reveal: pr(t, at('c1d') + 0.1, at('c1d') + 0.6) });
    ['第 1 步：先看这里', '第 2 步：再点这里', '第 3 步：好啦，真棒！'].forEach((s, i) => say('v3s' + i, s, 1020, 440 + i * 90, { size: 40, align: 'left', seed: 1503 + i, reveal: pr(t, at('c1d') + 0.5 + i * 0.3, at('c1d') + 0.9 + i * 0.3) }));
    const sm = isSmall('v3', t);
    person(G, { x: 700, y: F, kid: sm, s: sm ? 1.0 : 1, shirt: K.orange, hair: 'long', seed: 1600, arms: { R: [sm ? 60 : 110, sm ? -20 : -40] }, expr: sm ? 'wow' : 'flat' });
    if (sm) line(G.l, [[1000, 640], [1030, 600], [1060, 640]], { w: 6, col: K.red, seed: 1604 });
  },
  v4(t) {   // 输了叫爸爸
    const F = 820; ground(F, 200, 1720, 8);
    // 手柄
    part(G, smooth([[860, 600], [1060, 600], [1100, 660], [1060, 700], [990, 680], [930, 680], [860, 700], [820, 660]], 4), { col: K.orange, p: 0.85, gap: 7, w: 9, seed: 1700 }, { w: 5, seed: 1701 });
    dab(G.l, 890, 645, 9, { col: K.ink, seed: 1702 }); dab(G.l, 1030, 640, 7, { col: K.red, seed: 1703 }); dab(G.l, 1050, 660, 7, { col: K.green, seed: 1704 });
    const sm = isSmall('v4', t);
    const win = person(G, { x: 560, y: F, kid: false, s: sm ? 1.12 : 1, shirt: K.yellow, hair: 'short', seed: 1800, arms: 'up', expr: sm ? 'open' : 'smile' });
    if (sm) line(G.l, smooth([[win._head[0] - 26, win._head[1] + 16], [win._head[0], win._head[1] + 10], [win._head[0] + 26, win._head[1] + 16]], 4, false), { w: 7, col: K.brown, seed: 1805 });   // 赢的人长出胡子
    person(G, { x: 1380, y: F, kid: sm, s: 1, shirt: K.sky, hair: 'short', seed: 1900, arms: sm ? 'rest' : 'up', expr: sm ? 'cry' : 'smile' });
    if (sm) bubble('v4a', '爸爸……', 1380, 420, [0, 80], { draw: pr(t, V.v4 + 0.2, V.v4 + 0.6) });
  },
  v5(t) {   // 直播间
    part(G, [[560, 200], [1360, 200], [1360, 760], [560, 760]], { col: K.ink, p: 0.25, gap: 14, w: 12, seed: 2100 }, { w: 7, seed: 2101 });
    part(G, [[600, 240], [1320, 240], [1320, 720], [600, 720]], { col: K.sky, p: 0.35, gap: 12, w: 12, seed: 2102 }, { w: 4, seed: 2103 });
    dab(G.l, 1270, 280, 12, { col: K.red, seed: 2104 }); say('v5live', '直播', 1200, 292, { size: 32, col: K.red, seed: 2105, noCheck: true });
    const wave = Math.floor(t * 4) % 2;
    person(G, { x: 960, y: 760, kid: false, s: 1.15, shirt: K.pink, hair: 'bun', seed: 2200, arms: { R: [70, wave ? -110 : -80] }, expr: 'open' });
    bubble('v5a', '宝宝们～', 1520, 330, [-90, 60], { draw: pr(t, at('c1f') + 0.3, at('c1f') + 0.8) });
    // 观众：一排小头像，变小那一下全成了小孩
    const sm = isSmall('v5', t);
    for (let k = 0; k < 5; k++) person(G, { x: 620 + k * 170, y: 1010, kid: sm, s: sm ? 0.6 : 0.62, shirt: [K.green, K.yellow, K.orange, K.violet, K.sky][k], hair: k % 2 ? 'long' : 'short', seed: 2300 + k * 37, arms: 'rest', expr: 'smile' });
    for (let k = 0; k < 4; k++) { const u = ((t - at('c1f')) * 0.45 + k * 0.25) % 1; if (t > at('c1f') + 0.6) heart(1430 + 40 * Math.sin(k + u * 5), 700 - 420 * u, 18, 2400 + k * 3, { TOPL: true, col: K.pink }); }
  },
  door(t) { // 门框上的身高刻度 = 辈分尺
    const F = 900; ground(F, 200, 1720, 9);
    part(G, [[700, 120], [1220, 120], [1220, F], [1150, F], [1150, 190], [770, 190], [770, F], [700, F]], { col: K.ochre, p: 0.85, gap: 9, w: 11, seed: 2500 }, { w: 6, seed: 2501 });
    [['28 岁', 300], ['18 岁', 450], ['8 岁', 620], ['3 岁', 740], ['1 岁', 820]].forEach(([s, y], i) => { line(G.l, [[1150, y], [1100, y]], { w: 5, col: K.red, seed: 2502 + i }); say('dr' + i, s, 1240, y + 14, { size: 38, align: 'left', seed: 2510 + i, noCheck: true }); });
    // 五个小人挤在最底下的几格
    const cols = [K.sky, K.green, K.orange, K.sky, K.pink];
    cols.forEach((c, k) => person(G, { x: 820 + k * 70, y: F, kid: true, s: 0.62 + (k % 2) * 0.06, shirt: c, hair: k % 2 ? 'long' : 'short', seed: 2600 + k * 41, arms: k === 2 ? 'up' : 'rest', expr: k === 4 ? 'open' : 'smile' }));
    // 28 岁那一格空着
    if (t > at('c1h')) say('dq', '？', 960, 330, { size: 120, col: K.red, seed: 2520, reveal: pr(t, at('c1h') + 0.3, at('c1h') + 0.6) });
  },
  regress(t) {
    const F = 860; ground(F, 200, 1720, 10);
    say('rg', '退行', 960, 330, { size: 170, col: K.violet, seed: 2700, reveal: pr(t, at('c2a') + 0.3, at('c2a') + 1.1), stroke: 2 });
    // 掉头的箭头
    if (t > at('c2a') + 1.0) line(G.l, smooth([[1180, 200], [1330, 230], [1340, 330], [1220, 360]], 6, false), { w: 6, col: K.red, seed: 2701, draw: pr(t, at('c2a') + 1.0, at('c2a') + 1.6) });
    if (t > at('c2a') + 1.6) line(G.l, [[1250, 330], [1215, 362], [1258, 382]], { w: 6, col: K.red, seed: 2702 });
    if (t < RG.trio) {
      const sm = isSmall('regress', t);
      person(G, { x: 960, y: F, kid: sm, s: 1, shirt: K.green, hair: 'short', seed: 2800, arms: sm ? 'hug' : 'rest', expr: sm ? 'pout' : 'flat' });
    } else {
      const lab = [['累了', 640, 'sleep'], ['病了', 960, 'blush'], ['怕了', 1280, 'cry']];
      lab.forEach(([s, x, e], k) => {
        const on = t > RG.trio + k * 0.6;
        if (!on) return;
        person(G, { x, y: F, kid: true, s: 0.85, shirt: [K.sky, K.pink, K.yellow][k], hair: k === 1 ? 'long' : 'short', seed: 2900 + k * 53, arms: k === 2 ? 'hug' : 'rest', expr: e, tilt: k === 0 ? 0.3 : 0 });
        say('rgl' + k, s, x, 560, { size: 50, seed: 2950 + k, reveal: pr(t, RG.trio + k * 0.6, RG.trio + k * 0.6 + 0.3) });
        if (k === 1) line(G.l, [[x + 30, 640], [x + 80, 600]], { w: 6, col: K.red, seed: 2960 });   // 体温计
        if (k === 0) say('zz', 'z z', x + 70, 620, { size: 40, seed: 2961, noCheck: true });
      });
    }
  },
  base(t) {   // 安全基地：小孩跑出去又跑回来
    const F = 860; ground(F, 120, 1800, 11);
    say('hs', 'Hazan & Shaver · 1987', 960, 160, { size: 40, seed: 3000, reveal: pr(t, at('c2d') + 0.3, at('c2d') + 0.8), p: 0.85 });
    person(G, { x: 520, y: F, kid: false, s: 1.05, shirt: K.pink, hair: 'long', seed: 3100, arms: t > BASE.back + 1.2 ? 'hug' : 'open', expr: 'smile' });
    // 一朵花在远处
    line(G.l, [[1500, F], [1500, F - 90]], { w: 6, col: K.green, seed: 3101 });
    for (let k = 0; k < 5; k++) dab(G.l, 1500 + 22 * Math.cos(k * 1.256), F - 112 + 22 * Math.sin(k * 1.256), 14, { col: K.yellow, seed: 3102 + k });
    // 小孩的路线：出去 → 到花 → 回来（12fps 步进）
    const q = Math.floor(t * 12) / 12;
    let x = 700;
    if (q > BASE.out && q < BASE.back) x = lerp(700, 1400, ss(pr(q, BASE.out, BASE.out + 1.8)));
    else if (q >= BASE.back) x = lerp(1400, 640, ss(pr(q, BASE.back, BASE.back + 1.4)));
    if (t > BASE.out) for (let k = 0; k < 14; k++) { const dx = 720 + k * 52; if (dx < Math.max(x, t > BASE.back ? 1400 : x)) dab(G.l, dx, F + 30, 4, { col: K.ink, p: 0.5, seed: 3110 + k }); }
    person(G, { x, y: F, kid: true, s: 0.8, shirt: K.yellow, hair: 'short', seed: 3200, arms: t > BASE.back + 1.2 ? 'up' : 'rest', expr: 'smile' });
    if (t > BASE.roof) {   // 给妈妈头上画一个屋顶：她就是「基地」
      line(G.l, [[330, 470], [520, 330], [710, 470]], { w: 8, col: K.red, seed: 3300, draw: pr(t, BASE.roof, BASE.roof + 0.6) });
      say('sb', '安全基地', 520, 300, { size: 52, col: K.red, seed: 3301, reveal: pr(t, BASE.roof + 0.4, BASE.roof + 0.9) });
    }
  },
  commute(t) {   // 白天在城里，晚上进门
    const F = 860; ground(F, 60, 1860, 12);
    for (let k = 0; k < 4; k++) { const x = 140 + k * 150, h = 380 + (k % 2) * 120; part(G, [[x, F - h], [x + 120, F - h], [x + 120, F], [x, F]], { col: K.ink, p: 0.22, gap: 12, w: 12, seed: 3400 + k }, { w: 5, seed: 3401 + k }); for (let r = 0; r < 4; r++) dab(G.l, x + 40 + (r % 2) * 40, F - h + 60 + Math.floor(r / 2) * 80, 10, { col: K.yellow, p: 0.7, seed: 3410 + k * 4 + r }); }
    say('city', '外面', 400, 330, { size: 48, seed: 3420, noCheck: true });
    // 家
    part(G, [[1360, 560], [1700, 560], [1700, F], [1360, F]], { col: K.ochre, p: 0.7, gap: 9, w: 11, seed: 3430 }, { w: 6, seed: 3431 });
    part(G, [[1320, 570], [1530, 400], [1740, 570]], { col: K.red, p: 0.85, gap: 8, w: 10, seed: 3432 }, { w: 6, seed: 3433 });
    part(G, [[1580, 640], [1660, 640], [1660, 720], [1580, 720]], { col: K.yellow, p: 0.9, gap: 6, w: 9, seed: 3434 }, { w: 4, seed: 3435 });
    const doorOpen = t > COM.door - 0.4;
    part(G, [[1400, 680], [1500, 680], [1500, F], [1400, F]], { col: doorOpen ? K.yellow : K.brown, p: 0.85, gap: 7, w: 9, seed: 3436 }, { w: 5, seed: 3437 });
    if (doorOpen) person(G, { x: 1450, y: F, kid: false, s: 0.62, shirt: K.pink, hair: 'long', seed: 3500, arms: 'open', expr: 'smile' });
    const q = Math.floor(t * 12) / 12, u = ss(pr(q, COM.walk0, COM.door));
    const x = lerp(760, 1300, u), sm = isSmall('commute', t);
    const step = Math.floor(t * 4) % 2;
    person(G, { x, y: F, kid: sm, s: sm ? 0.62 : 1, shirt: K.sky, hair: 'short', seed: 3600, arms: sm ? 'up' : { L: [step ? -20 : 10, 105], R: [step ? 10 : -20, 105] }, expr: sm ? 'open' : 'flat' });
    if (!sm) part(G, [[x + 30, F - 160], [x + 80, F - 160], [x + 80, F - 110], [x + 30, F - 110]], { col: K.brown, p: 0.8, gap: 6, w: 8, seed: 3601 }, { w: 4, seed: 3602 });   // 公文包
  },
  three(t) {   // 丛非从：三种状态
    say('cf', '丛非从《养育你内心的小孩》', 960, 150, { size: 44, seed: 3700, reveal: pr(t, at('c3a') + 0.3, at('c3a') + 0.9) });
    const box = (k, lab, t0) => {
      const x0 = 120 + k * 580;
      line(G.l, [[x0, 230], [x0 + 520, 236], [x0 + 516, 860], [x0 - 4, 856], [x0, 230]], { w: 6, seed: 3710 + k, draw: pr(t, at('c3a') + 0.8 + k * 0.3, at('c3a') + 1.4 + k * 0.3) });
      if (t > t0) say('tl' + k, lab, x0 + 260, 930, { size: 52, col: K.red, seed: 3720 + k, reveal: pr(t, t0, t0 + 0.4) });
      return x0;
    };
    const a = box(0, '母婴式', THREE.p1), b = box(1, '矛盾式', THREE.p2), c = box(2, '成人式', THREE.p3);
    if (t > THREE.pre) { person(G, { x: a + 170, y: 820, kid: false, s: 1, shirt: K.pink, hair: 'long', seed: 3800, arms: 'hug', expr: 'smile' }); person(G, { x: a + 360, y: 820, kid: true, s: 0.85, shirt: K.yellow, hair: 'short', seed: 3810, arms: 'up', expr: 'open' }); }
    if (t > THREE.pre + 0.6) { const w = Math.floor(t * 6) % 2; person(G, { x: b + 160, y: 820, kid: true, s: 0.85, shirt: K.sky, hair: 'short', seed: 3820, arms: 'up', expr: 'cry', tilt: w ? 0.06 : -0.06 }); person(G, { x: b + 360, y: 820, kid: true, s: 0.85, shirt: K.pink, hair: 'long', seed: 3830, arms: 'up', expr: 'cry', tilt: w ? -0.06 : 0.06 }); }
    if (t > THREE.pre + 1.2) {
      person(G, { x: c + 150, y: 820, kid: false, s: 1, shirt: K.sky, hair: 'short', seed: 3840, arms: { R: [70, 20] }, expr: 'smile' });
      person(G, { x: c + 370, y: 820, kid: false, s: 1, shirt: K.green, hair: 'long', seed: 3850, arms: { L: [-70, 20] }, expr: 'smile' });
      part(G, handCircle(c + 260, 610, 26, 3860, 0, 24), { col: K.red, p: 0.9, gap: 5, w: 8, seed: 3861 }, { w: 4, seed: 3862 });
      line(G.l, [[c + 260, 586], [c + 266, 566]], { w: 4, col: K.brown, seed: 3863 });
    }
  },
  table2(t) {   // 同一张桌子，换成一对中年夫妻
    const F = 880; ground(F, 40, 1880, 13);
    part(G, [[820, 120], [1100, 120], [1100, 330], [820, 330]], { col: K.sky, p: 0.35, gap: 12, w: 12, seed: 4600 }, { w: 5, seed: 4601 });
    line(G.l, [[960, 120], [960, 330]], { w: 4, seed: 4602 }); line(G.l, [[820, 225], [1100, 225]], { w: 4, seed: 4603 });
    chair(560, F, 180, -1); chair(1360, F, 180, 1);
    const reach = eo(pr(t, HUSH.t0 + 0.2, HUSH.chop)) * (1 - ss(pr(t, HUSH.dropT + 0.3, HUSH.dropT + 1.2)));
    const fedHer = t > HUSH.dropT;
    const him = person(G, { x: 560, y: F, seat: 180, kid: false, shirt: K.violet, hair: 'greyShort', glasses: true, seed: 4000, expr: 'flat', arms: 'table', armTo: reach > 0.01 ? { R: [lerp(700, 1060, reach), lerp(690, 600, reach)] } : null });
    person(G, { x: 1360, y: F, seat: 180, kid: false, s: fedHer ? 0.93 : 1, shirt: K.green, hair: 'greyBun', seed: 4100, expr: fedHer ? 'blush' : 'flat', arms: 'table' });
    table(700, 1220, 700, { floor: F });
    bowl(800, 640); bowl(1120, 640, { meat: fedHer ? 1 : 0 }); porkPlate(960, 652, 0.8);
    if (reach > 0.01) chopsticks(him._hand, [him._hand[0] + 70, him._hand[1] - 18], { meat: !fedHer });
  },
  village(t) {   // 阎云翔：下岬村的一个姑娘
    const F = 860; ground(F, 160, 1760, 14);
    part(G, [[300, 560], [700, 560], [700, F], [300, F]], { col: K.ochre, p: 0.75, gap: 9, w: 11, seed: 4700 }, { w: 6, seed: 4701 });
    part(G, [[260, 570], [500, 420], [740, 570]], { col: K.brown, p: 0.8, gap: 8, w: 10, seed: 4702 }, { w: 6, seed: 4703 });
    for (let k = 0; k < 3; k++) { const u = ((t * 0.4 + k / 3) % 1); line(G.l, [[620 + 10 * Math.sin(u * 6 + k), 420 - u * 160], [630 + 10 * Math.sin(u * 6 + k + 1), 400 - u * 160]], { w: 5, col: K.ink, p: 0.4 * (1 - u), seed: 4704 + k }); }
    part(G, [[600, 380], [650, 380], [650, 470], [600, 470]], { col: K.red, p: 0.7, gap: 6, w: 8, seed: 4705 }, { w: 4, seed: 4706 });
    say('vl', '黑龙江 · 下岬村', 500, 950, { size: 42, seed: 4707, reveal: pr(t, at('c4d') + 0.3, at('c4d') + 0.8) });
    say('vy', 'Yan, 2003', 1640, 1000, { size: 30, seed: 4708, p: 0.7, noCheck: true });
    person(G, { x: 980, y: F, kid: false, s: 1.05, shirt: K.red, hair: 'long', seed: 4800, arms: 'rest', expr: t > at('c4e') + 2.6 ? 'smile' : 'flat' });
    if (t > at('c4e') + 0.3) {   // 想法泡泡：训人的爸爸 ✗ ，会说好听话的 ✓
      const p = pr(t, at('c4e') + 0.3, at('c4e') + 0.8);
      part(TOP, smooth([[1150, 260], [1700, 250], [1720, 560], [1160, 580]], 5), null, { w: 5, seed: 4810, draw: p }, { occ: false });
      dab(TOP.l, 1110, 620, 12, { col: K.ink, p: 0.7, seed: 4811 }); dab(TOP.l, 1070, 670, 8, { col: K.ink, p: 0.7, seed: 4812 });
      if (p >= 1) {
        person(TOP, { x: 1300, y: 520, kid: false, s: 0.6, shirt: K.brown, hair: 'short', seed: 4820, arms: { R: [60, -60] }, expr: 'flat' });
        for (let k = 0; k < 3; k++) line(TOP.l, [[1350 + k * 16, 330 + k * 10], [1370 + k * 16, 345 + k * 10], [1352 + k * 16, 360 + k * 10]], { w: 4, col: K.ink, seed: 4821 + k });
        if (t > at('c4e') + 1.6) { line(TOP.l, [[1220, 300], [1420, 520]], { w: 8, col: K.red, seed: 4825 }); line(TOP.l, [[1420, 300], [1220, 520]], { w: 8, col: K.red, seed: 4826 }); }
        if (t > at('c4e') + 2.4) heart(1580, 400, 60, 4830, { TOPL: true, draw: pr(t, at('c4e') + 2.4, at('c4e') + 2.8) });
      }
    }
  },
  split(t) {   // 过日子的爱 / 说出来的爱
    line(G.l, [[960, 120], [966, 960]], { w: 5, seed: 4900, p: 0.6 });
    say('sp1', '过日子', 480, 200, { size: 64, seed: 4901, reveal: pr(t, at('c4g') + 0.2, at('c4g') + 0.6) });
    say('sp2', '说出来', 1440, 200, { size: 64, seed: 4902, reveal: pr(t, at('c4g') + 1.8, at('c4g') + 2.2) });
    say('gd', 'Giddens, 1992', 1640, 1000, { size: 30, seed: 4903, p: 0.7, noCheck: true });
    // 左：锅、碗、一摞衣服
    part(G, [[260, 520], [560, 520], [540, 700], [280, 700]], { col: K.ink, p: 0.35, gap: 10, w: 11, seed: 4910 }, { w: 6, seed: 4911 });
    line(G.l, [[220, 520], [600, 520]], { w: 7, seed: 4912 });
    for (let k = 0; k < 3; k++) { const u = ((t * 0.5 + k / 3) % 1); line(G.l, [[340 + k * 70 + 8 * Math.sin(u * 7), 500 - u * 150], [346 + k * 70 + 8 * Math.sin(u * 7 + 1), 480 - u * 150]], { w: 5, col: K.ink, p: 0.45 * (1 - u), seed: 4913 + k }); }
    bowl(700, 760, { col: K.green });
    for (let k = 0; k < 3; k++) part(G, [[620, 820 - k * 34], [800, 820 - k * 34], [800, 850 - k * 34], [620, 850 - k * 34]], { col: [K.sky, K.pink, K.yellow][k], p: 0.8, gap: 6, w: 8, seed: 4920 + k }, { w: 4, seed: 4923 + k });
    // 右：对白泡泡
    if (t > at('c4g') + 2.0) { bubble('sp3', '我想你了', 1300, 420, [-40, 70], { draw: pr(t, at('c4g') + 2.0, at('c4g') + 2.4) }); bubble('sp4', '今天辛苦啦', 1560, 620, [40, 70], { draw: pr(t, at('c4g') + 2.6, at('c4g') + 3.0) }); }
    if (t > SPLIT.bub) bubble('sp5', '宝宝', 1400, 820, [0, 60], { draw: pr(t, SPLIT.bub, SPLIT.bub + 0.4), size: 76, col: K.red });
  },
  ladder(t) {   // 往上叫 / 往下叫
    const F = 940; ground(F, 400, 1520, 15);
    line(G.l, [[620, 160], [620, 900]], { w: 6, seed: 5000 });
    line(G.l, [[600, 190], [620, 150], [640, 190]], { w: 6, seed: 5001 });
    line(G.l, [[600, 870], [620, 910], [640, 870]], { w: 6, seed: 5002 });
    say('up', '往上叫', 560, 250, { size: 44, align: 'right', seed: 5003, reveal: pr(t, LAD.up - 0.2, LAD.up + 0.2) });
    say('dn', '往下叫', 560, 860, { size: 44, align: 'right', seed: 5004, reveal: pr(t, LAD.down - 0.4, LAD.down) });
    ['叔叔', '阿姨', '大哥'].forEach((s, k) => { if (t > LAD.up + k * 0.4) say('lu' + k, s, 760 + k * 170, 230 + (k % 2) * 30, { size: 56, seed: 5010 + k, reveal: pr(t, LAD.up + k * 0.4, LAD.up + k * 0.4 + 0.3) }); });
    ['宝宝', '妈妈'].forEach((s, k) => { if (t > LAD.down + k * 0.4) say('ld' + k, s, 780 + k * 200, 860, { size: 56, col: K.red, seed: 5020 + k, reveal: pr(t, LAD.down + k * 0.4, LAD.down + k * 0.4 + 0.3) }); });
    const sm = isSmall('ladder', t);
    person(G, { x: 1340, y: F, kid: sm, s: sm ? 0.8 : 1, shirt: K.green, hair: 'short', seed: 5100, arms: sm ? 'up' : { R: [40, -110] }, expr: sm ? 'open' : 'smile', tilt: sm ? 0 : -0.15 });
  },
  seesaw(t) {   // 跷跷板 + 水彩扫过，露出白蜡写的那句话
    const F = 900; ground(F, 40, 1880, 16);
    for (let k = 0; k < 9; k++) line(G.l, [[100 + k * 210, F + 6], [110 + k * 210, F - 22], [120 + k * 210, F + 6]], { w: 5, col: K.green, seed: 5200 + k });
    // 白蜡字：从这一页一出现就在纸上，只是看不见
    text(WAX, '大人者，不失其赤子之心者也。', sx(960), sy(280), { font: FONT, size: 104 * CAM.s, col: K.white, p: 1, seed: 5300, boil: 0.4, stroke: 3 });
    text(WAX, '——《孟子·离娄下》', sx(1420), sy(380), { font: FONT, size: 50 * CAM.s, col: K.white, p: 1, seed: 5301, boil: 0.4 });
    if (t > WASH_T.t0 + 2.4) TX.push({ id: 'mz', text: '大人者，不失其赤子之心者也。——《孟子·离娄下》', x0: sx(400), y0: sy(180), x1: sx(1600), y1: sy(400) });
    if (t > WASH_T.t1 - 0.5) say('mzen', 'A great person never loses the heart of a newborn child. — Mencius', 960, 470, { size: 40, seed: 5302, reveal: pr(t, WASH_T.t1 - 0.5, WASH_T.t1 + 0.4), p: 0.85 });
    // 支点
    part(G, [[900, F], [1020, F], [960, F - 110]], { col: K.red, p: 0.85, gap: 7, w: 9, seed: 5400 }, { w: 6, seed: 5401 });
    // 跷跷板角度：每个翻转点换一边（替换动作，画在拍点上）
    let side = 0; SEE_FLIPS.forEach((ft, k) => { if (t >= ft) side = k % 2 ? -1 : 1; });
    if (t >= snap(SEE.level)) side = 0;
    const ang = side * 0.2, half = 600;
    const ends = [-1, 1].map(s => [960 + s * half * Math.cos(ang), F - 110 + s * half * Math.sin(ang)]);
    part(G, tube([ends[0], ends[1]], 24), { col: K.brown, p: 0.85, gap: 7, w: 9, seed: 5402, ang: 1.4 }, { w: 6, seed: 5403 });
    // 左边的人（他）在 side=+1 时在上
    const lUp = side < 0, rUp = side > 0;
    const pl = { x: ends[0][0] + 60, y: ends[0][1] - 12, seat: 1, kid: side !== 0 && !lUp, s: side !== 0 && !lUp ? 0.85 : 1, shirt: K.sky, hair: 'short', seed: 5500, arms: side !== 0 && !lUp ? 'up' : 'open', expr: 'smile' };
    const prr = { x: ends[1][0] - 60, y: ends[1][1] - 12, seat: 1, kid: side !== 0 && !rUp, s: side !== 0 && !rUp ? 0.85 : 1, shirt: K.pink, hair: 'long', seed: 5600, arms: side !== 0 && !rUp ? 'up' : 'open', expr: side === 0 ? 'blush' : 'smile' };
    if (side === 0) { pl.arms = { R: [90, 20] }; prr.arms = { L: [-90, 20] }; }
    person(TOP, pl); person(TOP, prr);   // 人物画在水彩之后，脸不被染
  },
};
// 片尾冰箱：拉远时，这页画其实贴在冰箱门上
function fridge(t) {
  const L = (x, y) => [x, y];   // 已在本页坐标里
  const k = pr(t, at('c5e') - 1.6, at('c5e') + 0.8); if (k <= 0) return;
  // 纸边和阴影
  line(G.l, [L(-10, -10), L(1930, -6), L(1926, 1090), L(-6, 1086), L(-10, -10)], { w: 7, seed: 5900, p: 0.8 });
  // 冰箱门
  line(G.l, [L(-520, -760), L(2440, -770), L(2450, 2160), L(-530, 2150), L(-520, -760)], { w: 14, seed: 5901, p: 0.9, draw: k });
  line(G.l, [L(2300, 300), L(2300, 900)], { w: 22, col: K.ink, seed: 5902, p: 0.7, draw: k });
  // 磁铁
  [[60, 30, K.red], [1860, 40, K.yellow], [80, 1060, K.green], [1850, 1050, K.sky]].forEach(([x, y, c], i) => part(G, handCircle(...L(x, y), 46, 5910 + i, 0, 26), { col: c, p: 0.9, gap: 6, w: 9, seed: 5910 + i }, { w: 5, seed: 5920 + i }));
  // 别的小画：太阳、一颗心、一张小纸
  part(G, handCircle(...L(-260, -380), 110, 5930, 0, 30), { col: K.yellow, p: 0.85, gap: 8, w: 10, seed: 5931 }, { w: 6, seed: 5932 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; line(G.l, [L(-260 + Math.cos(a) * 140, -380 + Math.sin(a) * 140), L(-260 + Math.cos(a) * 190, -380 + Math.sin(a) * 190)], { w: 7, col: K.orange, seed: 5933 + i }); }
  heart(...L(2180, 1500), 140, 5950);
  line(G.l, [L(-380, 1300), L(-60, 1290), L(-50, 1760), L(-370, 1770), L(-380, 1300)], { w: 6, seed: 5960 });
  for (let i = 0; i < 4; i++) line(G.l, [L(-340, 1380 + i * 90), L(-100, 1376 + i * 90)], { w: 5, seed: 5961 + i, p: 0.5 });
}

// ———————————————— 一帧 ————————————————
export function frame(comp, t, { subs = true } = {}) {
  const cam = camT(t); [CAM.x, CAM.y, CAM.s] = cam;
  BOIL.amp = t > at('hush') && t < at('c4b') ? 0.5 : 1;
  clearGroup(G); clearGroup(TOP); [WAX, WASH, SUBK, SUBT].forEach(clear);
  TX = [];
  const camX = CAM.x, camY = CAM.y;
  const hw = W / 2 / CAM.s + 980, hh = H / 2 / CAM.s + 560;
  for (const name in PAGES) {
    const [rx, ry] = R[name]; if (Math.abs(rx - camX) > hw || Math.abs(ry - camY) > hh) continue;
    CAM.x = camX - (rx - 960); CAM.y = camY - (ry - 540);
    PAGES[name](t);
    if (name === 'seesaw') fridge(t);
    CAM.x = camX; CAM.y = camY;
  }
  if (t > at('end') + 0.4) { CAM.x = camX - (R.seesaw[0] - 960); CAM.y = camY - (R.seesaw[1] - 540); say('opus', 'Opus 5.5', 960, 2060, { size: 30, p: 0.75, seed: 6000, noCheck: true }); CAM.x = camX; CAM.y = camY; }
  // 水彩：从左往右三道，玫瑰色，只扫天空
  if (t > WASH_T.t0) drawWash(t);
  if (subs) subTo(t);
  comp.paperCam(CAM.x, CAM.y, CAM.s);
  comp.begin();
  comp.crayon(WAX.c);
  const go = [hash(BOIL.step) * 300, hash(BOIL.step + 7) * 300];
  comp.group(G, { goff: go });
  if (t > WASH_T.t0) comp.wash(WASH.c, { color: PAL.wash, resist: 0.95 });
  comp.group(TOP, { goff: go });
  comp.knock(SUBK.c); comp.crayon(SUBT.c);
  comp.finish({ vig: 0.28 });
}
function drawWash(t) {
  const [cx, cy] = R.seesaw; const ox = cx - 960, oy = cy - 540;
  const g = WASH.g; g.save();
  const bands = [[-20, 290], [260, 500], [470, 690]];
  bands.forEach(([y0, y1], k) => {
    const a = WASH_T.t0 + k * 0.9, b = a + 2.6; const u = eio(pr(t, a, b)); if (u <= 0) return;
    const xr = lerp(20, 1900, u);
    const pts = [];
    for (let i = 0; i <= 50; i++) { const x = lerp(20, xr, i / 50); pts.push([x, y0 + 14 * Math.sin(x / 70 + k) + 6 * Math.sin(x / 23)]); }
    for (let i = 0; i <= 12; i++) { const y = lerp(y0, y1, i / 12); pts.push([xr + 26 * Math.sin(y / 40 + k * 3) + 10 * Math.sin(y / 13), y]); }
    for (let i = 50; i >= 0; i--) { const x = lerp(20, xr, i / 50); pts.push([x, y1 + 14 * Math.sin(x / 80 + k * 2) + 6 * Math.sin(x / 19)]); }
    for (let i = 12; i >= 0; i--) { const y = lerp(y0, y1, i / 12); pts.push([20 + 12 * Math.sin(y / 30), y]); }
    g.beginPath(); pts.forEach(([x, y], i) => { const X = sx(x + ox), Y = sy(y + oy); i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
    g.closePath(); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fill();
  });
  g.restore();
}
function subTo(t) {
  const s = SUBS.find(s => t >= s.t0 && t < s.t1); if (!s) return;
  const rv = s.id === 'o1' ? 1 : pr(t, s.t0, s.t0 + 0.45);
  const g = SUBK.g; g.save(); g.font = `400 50px "${FONT}"`; const w1 = g.measureText(s.zh).width; g.font = `400 30px "${FONT}"`; const w2 = g.measureText(s.en).width; g.restore();
  const tw = Math.max(w1, w2), cx = 960, cy = 990, hw = tw / 2 + 50, hh = 62;
  g.save(); g.fillStyle = '#000'; g.beginPath();
  for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; const px = Math.cos(a), py = Math.sin(a); const sq = Math.pow(Math.abs(px), 0.3) * Math.sign(px); const n = 1 + 0.05 * Math.sin(a * 7 + 1.3) + 0.03 * Math.sin(a * 17); const X = cx + sq * hw * n, Y = cy + py * hh * n; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
  g.closePath(); g.fill(); g.restore();
  text(SUBT, s.zh, cx, cy + 4, { font: FONT, size: 50, col: K.ink, reveal: rv, seed: 11 + s.t0 * 3, p: 1, stroke: 1 });
  text(SUBT, s.en, cx, cy + 46, { font: FONT, size: 30, col: K.ink, reveal: s.id === 'o1' ? 1 : pr(t, s.t0 + 0.2, s.t0 + 0.6), seed: 12 + s.t0 * 3, p: 0.85 });
}
// 设定页：所有人物大人/小孩各一张
export function sheet(comp, t, which) {
  [CAM.x, CAM.y, CAM.s] = [960, 540, 1];
  clearGroup(G); clearGroup(TOP); [WAX, WASH, SUBK, SUBT].forEach(clear); TX = [];
  const F = 900; ground(F, 40, 1880, 1);
  const list = [['short', K.sky], ['long', K.pink], ['greyShort', K.violet], ['greyBun', K.green]];
  list.forEach(([hair, c], i) => {
    person(G, { x: 160 + i * 460, y: F, kid: false, shirt: c, hair, seed: 100 + i * 50, arms: i % 2 ? 'open' : 'rest', expr: ['smile', 'blush', 'flat', 'open'][i], glasses: hair === 'greyShort' });
    person(G, { x: 360 + i * 460, y: F, kid: true, s: 0.8, shirt: c, hair: hair.replace('grey', '').toLowerCase() || 'short', seed: 300 + i * 50, arms: ['up', 'hug', 'rest', 'open'][i], expr: ['smile', 'cry', 'sleep', 'wow'][i] });
  });
  comp.paperCam(CAM.x, CAM.y, CAM.s); comp.begin(); comp.group(G); comp.group(TOP); comp.finish({ vig: 0.28 });
}
