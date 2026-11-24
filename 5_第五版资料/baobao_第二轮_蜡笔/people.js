// 人物：同一个人有「大人」和「小孩」两套比例。一声「宝宝」= 下一拍换成小孩那张画（替换，不补间）。
// 正面画法（孩子画人就是正面）。局部坐标：脚底 y=0，向上为负。坐着时 seat = 椅面离地高度。
import { line, fill, dab, ellipse, handCircle, xf, smooth } from './crayon.js';
import { part, tube, curve } from './rig.js';
import { PAL } from './pal.js';
const K = PAL.crayon;

const BODY = {
  adult: { hr: 30, neck: 8, sh: 36, hipW: 26, torso: 104, leg: 150, arm: 118, armW: 13, legW: 17, lw: 4.2 },
  kid:   { hr: 54, neck: 0, sh: 36, hipW: 38, torso: 62,  leg: 50,  arm: 58,  armW: 19, legW: 22, lw: 7 },
};

// o: x, y(地面), kid(bool), seat(椅面高, 0=站), s(缩放), shirt, pants, hair('short'|'long'|'bun'|'greyShort'|'greyBun'), glasses,
//    expr('smile'|'open'|'cry'|'blush'|'sleep'|'flat'|'wow'|'pout'), arms: {L:[dx,dy], R:[dx,dy]} 手相对肩, 或预设名, seed, tilt(头歪), hide(只画上身)
export function person(C, o) {
  const B = o.kid ? BODY.kid : BODY.adult, s = o.s ?? 1, sd = o.seed ?? 100;
  const X = (pts) => xf(pts, { x: o.x, y: o.y, s });
  const lo = (k, extra = {}) => ({ w: B.lw, seed: sd + k, p: 0.9, ...extra });
  const seat = o.seat ?? 0;
  // 髋部高度：站着 = 腿长；坐着 = 椅面
  const hipY = seat > 0 ? -seat : -B.leg;
  const shY = hipY - B.torso, headY = shY - B.neck - B.hr * 0.92;
  const shirt = o.shirt ?? K.sky, pants = o.pants ?? K.violet, skin = K.peach;

  // —— 腿 ——
  const legs = [];
  for (const side of [-1, 1]) {
    const hx = side * (B.hipW * 0.55);
    let pts;
    if (seat > 0) {
      const reach = Math.min(B.leg, seat);                    // 小孩坐大人椅子：够不着地
      const dangle = o.kid ? Math.sin((o.swing ?? 0) + side) * 6 : 0;
      pts = [[hx, hipY + 4], [hx + side * 6, hipY + 14], [hx + side * 4 + dangle, hipY + reach - 4]];
    } else pts = [[hx, hipY + 2], [hx + side * 3, hipY + B.leg * 0.5], [hx + side * 5, -6]];
    legs.push(pts);
    part(C, X(tube(pts, B.legW, B.legW * 0.92)), { col: pants, p: 0.85, gap: 8, w: 10, ang: 1.3, seed: sd + 10 + side }, lo(11 + side));
    const f = pts[pts.length - 1];
    const shoe = o.kid ? ellipse(f[0] + side * 6, f[1] + 2, 17, 10, 20) : ellipse(f[0] + side * 7, f[1] + 1, 14, 7, 20);
    part(C, X(shoe), { col: K.brown, p: 0.9, gap: 5, w: 7, seed: sd + 14 + side }, lo(15 + side));
  }

  // —— 身体（上衣） ——
  const tw = B.sh, bw = B.hipW + (o.kid ? 8 : 4);
  const torso = o.kid
    ? smooth([[-tw * 0.8, shY + 6], [-tw, shY + B.torso * 0.5], [-bw, hipY + 6], [0, hipY + 12], [bw, hipY + 6], [tw, shY + B.torso * 0.5], [tw * 0.8, shY + 6], [0, shY - 2]], 5)
    : [[-tw, shY + 4], [-tw * 0.92, hipY + 4], [-bw, hipY + 10], [bw, hipY + 10], [tw * 0.92, hipY + 4], [tw, shY + 4], [tw * 0.4, shY - 2], [-tw * 0.4, shY - 2]];
  part(C, X(torso), { col: shirt, p: 0.85, gap: 9, w: 11, ang: 0.55, seed: sd + 20, cross: !o.kid }, lo(21));

  // —— 手臂 ——
  const preset = {
    rest:  { L: [-10, B.arm * 0.95], R: [10, B.arm * 0.95] },
    open:  { L: [-B.arm * 0.85, -B.arm * 0.25], R: [B.arm * 0.85, -B.arm * 0.25] },
    up:    { L: [-B.arm * 0.35, -B.arm * 0.9], R: [B.arm * 0.35, -B.arm * 0.9] },
    hug:   { L: [B.arm * 0.4, B.arm * 0.45], R: [-B.arm * 0.4, B.arm * 0.45] },
    table: { L: [B.arm * 0.15, B.arm * 0.75], R: [-B.arm * 0.15, B.arm * 0.75] },
  };
  const A = typeof o.arms === 'string' ? preset[o.arms] : { ...preset.rest, ...(o.arms || {}) };
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const s0 = [side * (tw - 6), shY + 10];
    // armTo：手伸到世界坐标里的某一点（喂饭、夹菜）
    const tgt = o.armTo && o.armTo[key] ? [(o.armTo[key][0] - o.x) / s, (o.armTo[key][1] - o.y) / s] : null;
    const h = tgt || [s0[0] + A[key][0], s0[1] + A[key][1]];
    // 简单肘：中点向外推一点
    const mx = (s0[0] + h[0]) / 2, my = (s0[1] + h[1]) / 2, dx = h[0] - s0[0], dy = h[1] - s0[1], dl = Math.hypot(dx, dy) || 1;
    const bend = side * 0.16 * Math.max(0, B.arm - dl * 0.6);
    const el = [mx + (-dy / dl) * -bend, my + (dx / dl) * -bend];
    part(C, X(tube(curve([s0, el, h], 5), B.armW, B.armW * 0.9)), { col: shirt, p: 0.85, gap: 8, w: 10, ang: 0.9, seed: sd + 30 + side }, lo(31 + side));
    // 手：小孩是连指手套，大人是小圆手
    part(C, X(o.kid ? smooth([[h[0] - 11, h[1] - 6], [h[0] + 11, h[1] - 7], [h[0] + 13, h[1] + 8], [h[0], h[1] + 15], [h[0] - 13, h[1] + 8]], 5) : ellipse(h[0], h[1] + 3, 8, 9, 16)),
      { col: skin, p: 0.7, gap: 5, w: 7, seed: sd + 34 + side }, lo(35 + side));
    if (key === 'R') o._hand = X([h])[0];
    else o._handL = X([h])[0];
  }

  // —— 头 ——
  head(C, o, B, [0, headY], X, lo, sd, s);
  o._head = X([[0, headY]])[0];
  return o;
}

function head(C, o, B, [cx, cy], X, lo, sd, s) {
  const r = B.hr, tilt = o.tilt ?? 0;
  const H = pts => X(xf(pts, { r: tilt, ox: cx, oy: cy + r }));
  const grey = o.hair === 'greyShort' || o.hair === 'greyBun';
  const hairF = { col: grey ? K.ink : K.brown, p: grey ? 0.38 : 0.85, gap: 7, w: 9, ang: 1.15, seed: sd + 40, over: 2 };
  if (o.hair === 'long') part(C, H(smooth([[cx - r * 1.12, cy + r * 1.3], [cx - r * 1.2, cy - r * 0.2], [cx - r * 0.7, cy - r * 1.05], [cx, cy - r * 1.18], [cx + r * 0.7, cy - r * 1.05], [cx + r * 1.2, cy - r * 0.2], [cx + r * 1.12, cy + r * 1.3], [cx, cy + r * 0.6]], 6)), hairF, lo(41));
  if (o.hair === 'bun' || o.hair === 'greyBun') part(C, H(handCircle(cx, cy - r * 1.15, r * 0.42, sd + 3, 0, 24)), hairF, lo(42));
  // 脸
  const face = ellipse(cx, cy, r * (o.kid ? 1.05 : 0.86), r, 40);
  part(C, H(face), { col: K.peach, p: 0.5, gap: 9, w: 11, ang: 0.5, seed: sd + 43, over: 3 }, lo(44));
  // 头发帽
  const cap = o.hair === 'long' || o.hair === 'bun' || o.hair === 'greyBun'
    ? [[cx - r * 1.0, cy - r * 0.05], [cx - r * 0.85, cy - r * 0.75], [cx, cy - r * 1.08], [cx + r * 0.85, cy - r * 0.75], [cx + r * 1.0, cy - r * 0.05], [cx + r * 0.6, cy - r * 0.55], [cx, cy - r * 0.62], [cx - r * 0.6, cy - r * 0.55]]
    : [[cx - r * 0.95, cy - r * 0.2], [cx - r * 0.85, cy - r * 0.8], [cx, cy - r * 1.1], [cx + r * 0.85, cy - r * 0.8], [cx + r * 0.95, cy - r * 0.2], [cx + r * 0.7, cy - r * 0.62], [cx + r * 0.3, cy - r * 0.5], [cx - r * 0.2, cy - r * 0.68], [cx - r * 0.7, cy - r * 0.55]];
  part(C, H(smooth(cap, 4)), { ...hairF, seed: sd + 45 }, lo(46));
  // 五官
  const ey = cy + r * (o.kid ? 0.05 : -0.02), ex = r * (o.kid ? 0.38 : 0.34), er = r * (o.kid ? 0.11 : 0.09);
  const ex_ = o.expr || 'smile';
  if (ex_ === 'sleep') {
    for (const sx of [-1, 1]) line(C.l, H(ellipse(cx + sx * ex, ey, er * 1.6, er * 1.1, 10, 0.2, Math.PI - 0.2)), lo(47 + sx, { w: B.lw * 0.8 }));
  } else {
    const ek = ex_ === 'wow' ? 1.35 : 1;
    for (const sx of [-1, 1]) {
      fill(C.l, H(handCircle(cx + sx * ex, ey, er * ek, sd + 50 + sx, 0, 14)), { col: K.ink, p: 1, gap: 2.6, w: 4.5, seed: sd + 50 + sx, over: 0.5 });
      if (o.kid) dab(C.l, H([[cx + sx * ex + er * 0.35, ey - er * 0.35]])[0][0], H([[cx + sx * ex + er * 0.35, ey - er * 0.35]])[0][1], er * 0.32 * s, { col: K.white, p: 1, gap: 2, w: 3, seed: sd + 52 + sx });
    }
  }
  if (o.glasses) for (const sx of [-1, 1]) line(C.l, H(handCircle(cx + sx * ex, ey, er * 2.6, sd + 54 + sx, 0.05, 24)), lo(55 + sx, { w: 2.6 }));
  // 腮红：小孩一直有；大人害羞时才有
  if (o.kid || ex_ === 'blush') for (const sx of [-1, 1]) dab(C.f, ...H([[cx + sx * r * 0.62, cy + r * 0.32]])[0], r * 0.2 * s, { col: K.pink, p: 0.75, seed: sd + 57 + sx, sq: 0.7 });
  // 嘴
  const my = cy + r * 0.48;
  if (ex_ === 'open' || ex_ === 'wow') fill(C.l, H(handCircle(cx, my, r * 0.13, sd + 60, 0, 14)), { col: K.red, p: 0.9, gap: 2.5, w: 4, seed: sd + 60 });
  else if (ex_ === 'cry' || ex_ === 'pout') line(C.l, H(ellipse(cx, my + r * 0.12, r * 0.22, r * 0.12, 10, Math.PI + 0.3, Math.PI * 2 - 0.3)), lo(61, { w: B.lw * 0.8 }));
  else if (ex_ === 'flat') line(C.l, H([[cx - r * 0.16, my], [cx + r * 0.16, my]]), lo(61, { w: B.lw * 0.75 }));
  else line(C.l, H(ellipse(cx, my - r * 0.08, r * 0.24, r * 0.14, 12, 0.35, Math.PI - 0.35)), lo(61, { w: B.lw * 0.8 }));
  if (ex_ === 'cry') for (const sx of [-1, 1]) line(C.l, H([[cx + sx * ex, ey + er * 1.8], [cx + sx * (ex + 2), ey + r * 0.55], [cx + sx * (ex - 1), ey + r * 0.75]]), { w: B.lw * 0.9, col: K.sky, p: 0.95, seed: sd + 63 + sx });
}
