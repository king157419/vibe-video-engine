import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop, C, ChapterLabel, FONT_EN_IT, FONT_ZH, GlowCanvas, Subtitles, TitleCard, clamp, dot, ensureV4Fonts, haze, lerp, line, mulberry32, sample, smooth, win} from '../kit';
import {useTitlePoints} from './fontReady';
import {chapters, DUR, FPS, meta, row, subs} from './data';

type Pt = [number, number];
const GOLD = '#f5cb8c';
const ICE = '#83becd';
const PINK = '#d9a89a';
const morph = (a: Pt[], b: Pt[], p: number): Pt[] => a.map((q, i) => [lerp(q[0], b[i][0], p), lerp(q[1], b[i][1], p)]);
const wave = (phase: number, amp = 1): Pt[] => sample(u => [560 + 800 * u, 485 + 65 * amp * Math.sin(u * Math.PI * 5 + phase) * Math.sin(u * Math.PI)], 160);
const oval = (x: number, y: number, rx: number, ry: number, t: number): Pt[] => sample(u => [x + Math.cos(u * Math.PI * 2) * rx, y + Math.sin(u * Math.PI * 2) * ry + 3 * Math.sin(t + u * 8)], 160);
const knot = (t: number): Pt[] => sample(u => {
  const a = u * Math.PI * 2;
  return [960 + 280 * Math.sin(a), 470 + 110 * Math.sin(a * 2 + .1 * Math.sin(t * .5))];
}, 160);
const span = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a)));

function face(g: CanvasRenderingContext2D, x: number, y: number, s: number, baby: number, t: number, alpha = 1) {
  const breath = 1 + .012 * Math.sin(t * 1.3);
  const rx = s * lerp(.74, .9, baby) * breath;
  const ry = s * lerp(1.05, 1, baby) * breath;
  line(g, oval(x, y, rx, ry, t), GOLD, 1.15, .68 * alpha, true);
  const ey = y + lerp(-s * .13, s * .06, baby);
  const eyeR = lerp(s * .035, s * .073, baby);
  const blink = 1 - .85 * Math.pow(Math.max(0, Math.cos(t * .9 + x * .003)), 70);
  for (const side of [-1, 1]) {
    const ex = x + side * s * .32;
    line(g, sample(u => [ex + Math.cos(u * Math.PI * 2) * eyeR, ey + Math.sin(u * Math.PI * 2) * eyeR * blink], 30), GOLD, 1.8, alpha, true);
    dot(g, ex, ey, 12 + 7 * baby, GOLD, .7 * alpha);
  }
  const my = y + s * .45;
  line(g, sample(u => [x + (u - .5) * s * .3, my + Math.sin(u * Math.PI) * s * .055], 32), PINK, 1.15, .65 * alpha);
  const edge = oval(x, y, rx, ry, t);
  for (let i = 0; i < edge.length; i += 5) dot(g, edge[i][0], edge[i][1], 3.4, GOLD, .55 * alpha);
  haze(g, x, y, s * 1.6, GOLD, .045 * alpha);
}

function pair(g: CanvasRenderingContext2D, t: number, strength = 1, gap = 290) {
  for (const side of [-1, 1]) {
    dot(g, 960 + side * gap, 470, 34 + 3 * Math.sin(t * 1.7 + side), GOLD, .9 * strength);
    haze(g, 960 + side * gap, 470, 120, GOLD, .07 * strength);
  }
  const pts = sample(u => [960 - gap + u * gap * 2, 470 + 18 * Math.sin(u * Math.PI) * Math.sin(t * .55)], 100);
  line(g, pts, GOLD, 1.3, .58 * strength);
  for (let i = 0; i < 3; i++) {
    const u = ((t * .12 + i / 3) % 1);
    const p = pts[Math.round(u * (pts.length - 1))];
    dot(g, p[0], p[1], 12, GOLD, .65 * strength);
  }
}

const FadeText: React.FC<{text: string; t: number; a: number; b: number; y?: number; size?: number; color?: string}> = ({text, t, a, b, y = 465, size = 48, color = C.text}) => <div style={{position: 'absolute', width: '100%', top: y, textAlign: 'center', opacity: win(t, a, b, .7, .7), fontFamily: FONT_ZH, fontSize: size, fontWeight: 380, color, letterSpacing: '.18em'}}>{text}</div>;

export const Video: React.FC = () => {
  ensureV4Fonts();
  // This hook waits for FontFace registration before any canvas text sampling.
  const glyph = useTitlePoints('宝', 100, 400, 3, FONT_ZH, 0);
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const stamp = useMemo(() => {
    if (!glyph || typeof document === 'undefined') return null;
    const cv = document.createElement('canvas'); cv.width = 108; cv.height = 128;
    const g = cv.getContext('2d')!;
    g.font = `400 100px "${FONT_ZH}"`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = GOLD; g.fillText('宝', 54, 64);
    return cv;
  }, [glyph]);
  const motes = useMemo(() => {
    const rng = mulberry32(1943);
    return Array.from({length: 2400}, (_, i) => ({x: 90 + (i % 60) * 29.5 + rng() * 8, y: 150 + Math.floor(i / 60) * 17 + rng() * 6, phase: rng() * Math.PI * 2, s: .11 + rng() * .04}));
  }, []);
  const isEnd = t >= meta.mark;
  const mainOpacity = 1 - span(t, meta.mark - 1, meta.mark);
  const faceIn = t < meta.title;
  const c1 = chapters[0].t, c2 = chapters[1].t, c3 = chapters[2].t, c4 = chapters[3].t, c5 = chapters[4].t;
  const [cut, resume] = meta.silence;
  const titleP = span(t, meta.title, meta.title + 1.3);
  return <AbsoluteFill style={{background: '#070a10'}}>
    {!isEnd && <Backdrop tint="#080b10" dust={150} glow={.04} drift={[-8, -3]} />}
    {!isEnd && <GlowCanvas opacity={mainOpacity} draw={(g) => {
      // Bell emphases reuse the object's actual geometry from this same frame.
      const hitAnchors = new Map<string, Pt[]>();
      const cam = 1 + .012 * Math.sin(t * .09);
      g.translate(960, 470); g.scale(cam, cam); g.translate(-960, -470);
      if (faceIn) {
        const gathering = span(t, meta.title - 1.7, meta.title);
        face(g, lerp(650, 890, gathering), 440, lerp(155, 36, gathering), 0, t, 1 - gathering);
        face(g, lerp(1270, 1030, gathering), 440, lerp(155, 36, gathering), 1, t, 1 - gathering);
      } else if (t < c1) {
        const p = span(t, meta.title, meta.title + 1.6);
        const rays = sample(u => [420 + u * 1080, 610 + 7 * Math.sin(u * 6.28 + t)], 160);
        line(g, rays, GOLD, .8, .4 * p);
        dot(g, 420 + p * 1080, 610, 20, GOLD, .8 * (1 - p));
      } else if (t < c2) {
        const w = span(t, row('voice').t0 - 1, row('voice').t0 + 2.2);
        const outline = oval(960, 440, 145, 160, t);
        const points = morph(outline, wave(t * .8), w);
        line(g, points, GOLD, 1.35, .75);
        if (w < .99) face(g, 960, 440, 155, 1, t, .65 * (1 - w));
        const p = points[Math.round(((t * .1) % 1) * 160)]; dot(g, p[0], p[1], 17, GOLD, .75);
        if (t >= row('not_same').t0) pair(g, t, span(t, row('not_same').t0, row('not_same').t0 + 1.2), 290);
      } else if (t < c3) {
        const entry = span(t, c2, c2 + 2);
        line(g, morph(wave(t * .8), oval(960, 470, 300, 155, t), entry), GOLD, 1.4, .65);
        pair(g, t, .9, 290 - 40 * Math.sin((t - c2) * .08));
        if (t > row('regress').t0 && t < row('loan').t0) face(g, 960, 465, 100, .6 + .4 * Math.sin(t * .6), t, .4);
      } else if (t < c4) {
        const p = span(t, c3, c3 + 2.2);
        const ring = oval(960, 470, 245, 180, t);
        const expanding = span(t, row('survey').t0 - 1, row('survey').t0 + 2);
        const pts = morph(morph(oval(960, 470, 300, 155, t), knot(t), p), ring, expanding);
        hitAnchors.set('survey', [pts.reduce((top, point) => point[1] < top[1] ? point : top)]);
        line(g, pts, GOLD, 1.2, .6);
        const end = row('causation').t0;
        if (t >= end) line(g, pts.map(q => [q[0], q[1] + 35 * span(t, end, end + 2)] as Pt), ICE, .8, .45);
        for (let i = 0; i < 120; i++) {
          const q = pts[Math.floor(i / 120 * 160)];
          dot(g, q[0], q[1], 4.5 + 1.8 * Math.sin(t * 1.7 + i), i % 3 ? GOLD : ICE, .65);
        }
        dot(g, 680 + 30 * Math.sin(t * .7), 470, 25, GOLD, .9);
        dot(g, 1240 + 30 * Math.sin(t * .7 + Math.PI), 470, 25, GOLD, .9);
      } else if (t < c5) {
        pair(g, t, .8, 250);
        const entering = span(t, row('roles').t0, row('roles').t0 + 1.5);
        const release = span(t, row('feelings').t0, row('feelings').t0 + 5);
        for (let i = 0; i < 3; i++) {
          const x = 650 + i * 310, y = 270;
          const a = entering * (1 - .82 * release);
          const anchor: Pt = [710 + i * 250, 470 + 18 * Math.sin(i * Math.PI / 2) * Math.sin(t * .55)];
          line(g, [[x, y], anchor], ICE, 1., .55 * a);
          dot(g, x, y, 15, ICE, .6 * a);
          const flow = ((t - c4) * .18 + i / 3) % 1;
          dot(g, lerp(x, anchor[0], flow), lerp(y, anchor[1], flow), 7, ICE, .45 * a);
        }
        const q = span(t, row('confirm').t0, row('confirm').t0 + 3);
        const relation = sample(u => [710 + u * 500, 470 + 18 * Math.sin(u * Math.PI) * Math.sin(t * .55)], 100);
        line(g, relation, GOLD, 1.6, .7 * q);
        const pulse = ((t - row('confirm').t0) * .3) % 1;
        if (q > 0) for (const u of [pulse * .5, 1 - pulse * .5]) {
          const p = relation[Math.round(u * 99)];
          dot(g, p[0], p[1], 17, GOLD, q * .8);
        }
      } else if (t < cut) {
        const spread = span(t, row('public').t0, cut - 3);
        const count = Math.max(1, Math.floor(1 + 2399 * spread * spread));
        haze(g, 960, 450, 620, GOLD, .085 * spread);
        if (stamp) {
          for (let i = 0; i < count; i++) {
            const m = motes[i];
            const p = span(t, row('public').t0 + (i / 2400) * 10, row('public').t0 + (i / 2400) * 10 + 2);
            const x = lerp(960, m.x + 6 * Math.sin(t * .4 + m.phase), p);
            const y = lerp(460, m.y + 4 * Math.cos(t * .5 + m.phase), p);
            if (i === 0) hitAnchors.set('public', [[x, y]]);
            const scale = lerp(.9, m.s, p);
            g.globalAlpha = lerp(.85, .48 + .18 * (1 - spread), p);
            g.drawImage(stamp, x - 54 * scale, y - 64 * scale, 108 * scale, 128 * scale);
          }
          g.globalAlpha = 1;
        }
      } else if (t < resume) {
        if (stamp) {g.globalAlpha = .72 + .05 * Math.sin(t); g.drawImage(stamp, 906, 406, 108, 128); g.globalAlpha = 1;}
        dot(g, 960, 580, 15, GOLD, .55);
      } else if (t < meta.end_title) {
        const back = span(t, row('laozi').t0, row('permission').t0 + 3);
        if (stamp) {g.globalAlpha = .75 * (1 - back); g.drawImage(stamp, 906, 406, 108, 128); g.globalAlpha = 1;}
        face(g, lerp(900, 650, back), 440, lerp(45, 155, back), 0, t, back);
        face(g, lerp(1020, 1270, back), 440, lerp(45, 155, back), 1, t, back);
        if (back < .8) pair(g, t, .5 * (1 - back), 180);
      } else {
        const p = span(t, meta.end_title, meta.end_title + 1.5);
        face(g, lerp(650, 850, p), 440, lerp(155, 40, p), 0, t, 1 - p);
        face(g, lerp(1270, 1070, p), 440, lerp(155, 40, p), 1, t, 1 - p);
        line(g, [[580, 610], [1340, 610]], GOLD, .7, .35 * p);
      }
      // Every cue has a visible emphasis at its documented story object.
      const bellTimes = meta.hits.filter(h => h[1] === 'bell');
      for (const h of bellTimes) {
        const d = t - Number(h[0]);
        if (d >= 0 && d < 1.5) {
          const k = .3 * (1 - d / 1.5);
          const note = String(h[2]);
          const points: Pt[] = note.includes('端点') ? [[960 - (290 - 40 * Math.sin((t - c2) * .08)), 470], [960 + (290 - 40 * Math.sin((t - c2) * .08)), 470]]
            : note.includes('示意点环') ? hitAnchors.get('survey') ?? []
            : note.includes('一字开始分身') ? hitAnchors.get('public') ?? []
            : [[note.includes('眼部') ? 1010 : note.includes('原位') ? 1270 : 960, note.includes('眼部') ? 450 : 470]];
          for (const [x, y] of points) haze(g, x, y, 55 + d * 60, GOLD, k);
        }
      }
    }} />}
    {!isEnd && <>
      <TitleCard title="宝宝" sub="娃娃脸图式 · 洛伦兹 · 1943" en="BABY SCHEMA" p={titleP} out={span(t, c1 - .9, c1)} y={398} size={90} />
      {t >= meta.end_title && <TitleCard title="宝宝" p={span(t, meta.end_title, meta.end_title + 1.2)} out={span(t, meta.mark - .8, meta.mark)} y={412} size={90} />}
      <ChapterLabel chapters={chapters} />
      <Subtitles subs={subs.filter(s => s.t0 !== 0)} />
      {t <= subs[0].t1 && <div style={{position: 'absolute', bottom: 54, width: '100%', textAlign: 'center', opacity: 1 - span(t, subs[0].t1 - .35, subs[0].t1)}}>
        <div style={{fontFamily: FONT_ZH, color: C.text, fontWeight: 380, fontSize: 40, letterSpacing: '.06em'}}>{subs[0].zh}</div>
        <div style={{fontFamily: FONT_EN_IT, color: C.en, fontSize: 23, marginTop: 6}}>{subs[0].en}</div>
      </div>}
      <FadeText text="宝宝" t={t} a={row('not_same').t0 + 1} b={c2 - 1} y={600} size={42} color={GOLD} />
      <FadeText text="亲爱的" t={t} a={row('older').t0} b={row('roles').t0} y={590} size={38} color={GOLD} />
      {['家族', '孩子', '日子'].map((text, i) => <div key={text} style={{position: 'absolute', left: 650 + i * 310, top: 220, transform: 'translateX(-50%)', fontFamily: FONT_ZH, fontSize: 24, color: ICE, letterSpacing: '.12em', opacity: win(t, row('giddens').t0, row('feelings').t1, .7, 1)}}>{text}</div>)}
      <FadeText text="亲" t={t} a={row('shop').t0} b={row('public').t0} y={403} size={88} color={GOLD} />
    </>}
    {isEnd && <div style={{position: 'absolute', left: 0, right: 0, top: 520, fontFamily: FONT_ZH, textAlign: 'center', color: '#8a8f93', fontSize: 17, letterSpacing: '.3em'}}>Opus 5.5</div>}
    <Audio src={staticFile('v4/baobao/mix.wav')} />
  </AbsoluteFill>;
};
