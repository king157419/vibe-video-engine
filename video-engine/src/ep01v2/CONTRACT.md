# EP01v2 section contract

A 16:9 hand-drawn whiteboard explainer, 1920×1080 @ 30 fps. The duration is the narration (634.3 s) plus 2.5 s.
Storyboard: `D:\desk\claudex\24\2_第二版资料\文案\EP01_终稿.md` §二 分镜表. Visual direction: the opus lab (`src/lab/opus`, notes in `2_第二版资料/视觉实验/lab01_opus_说明.md`).

## 0. Rules (read first)

1. **Edit only your own section files**: `src/ep01v2/sections/sNN.tsx`. If you need a new generic component, put it in your section file or in a new file `src/ep01v2/local/sNN_<name>.tsx`. Prefix the file with your section id, and don't import another agent's `local/` file.
2. **Do not edit** `src/whiteboard/**`, `src/ep01v2/{Episode,Root,build,ctx,world}.ts(x)`, `src/ep01v2/props/**`, `sections/index.ts`, `sections/_stub.ts`, or `public/wb/**`. Only `tools/wb_hanzi.py` regenerates `hanzi.generated.ts`. Don't hand-edit it. If a shared piece is missing or broken, report it and work around it locally.
3. **Do not `npm install`.** Everything you need is already installed: roughjs, perfect-freehand, hanzi-writer-data, @remotion/paths and @remotion/noise.
4. Everything must be frame-driven and deterministic. No `Math.random`, `Date.now`, CSS animations, or `useState` timers. Derive every animation from `ms` inside `b.node(t0, (ms, frame) => …)`.
5. Anchor every visual action to the narration. Use `q.at('词')`, `q.end('词')` and `q.ch('词', k)`, never hard-coded ms, except for small offsets such as `q.at('补') + 300`.
6. Stay inside your time window. Items and camera keys go in `[t0 − 1.5 s, tNext)`. `wb_lint` flags anything outside that window.
7. Stay on your island. You may draw on a shared island (OPEN, MEMO, CORE) only in the regions assigned below, or on top of it with an opaque `sheet()`. Use props methods for anything on a prop.
8. Don't erase or move things you didn't draw, except through the prop API (`prop.erase/fade/moveTo/back`).

## 1. Section API

```tsx
// src/ep01v2/sections/sNN.tsx
import type {SectionCtx} from '../ctx';
import {R, rr, arrow, ring, write, freehand, sheet /* … */} from '../../whiteboard';

export const build = (ctx: SectionCtx) => {
  const {b, q, t0, tEnd, tNext, island, P, B, grid, cells, cam, props, C, CLAUSES} = ctx;
  cam(null, t0 - 500, 1300, {whoosh: true});          // fly to your island (null = whole island)
  ctx.write('隐藏条款', ...grid(2.5, 1), 150, q.at('隐藏条款'), 1800, {anchor: 'middle'});
  b.stroke((s) => R.circle(...grid(1, 3), 80, {seed: s}), q.at('圆'), 400, {color: C.blue});
};
```

| ctx field | meaning |
|---|---|
| `id, title, info` | `'s03'`, the section title, and the raw `sections.json` entry |
| `t0, tEnd, tNext` | first spoken char, last char end, and next section's first char (ms). s15: `tNext` = narration end |
| `b` | the shared `Board` (display list), see §3 |
| `q` | cue finder **scoped to `[t0, tNext)`**. `q.at(p)` gives the first char start. `q.end(p)` gives the last char end. `q.ch(p, k)` gives the start of the k-th char. `q.at(p, afterMs)` or `q.at(p, {nth: 1})` pick a later occurrence. `q.has`, `q.count`, `q.lines` and `q.text` are also available. Whitespace and punctuation are ignored on both sides, so `q.at('A是不是')` matches "A 是不是出什么事了？". It throws if the phrase is not in your window, and the build error then shows up on your island in magenta and in `wb_lint`. |
| `island` | `{id, box, x0, y0, w, h}` in world coords |
| `P(x,y)`, `B(x0,y0,x1,y1)` | convert island-local coords (island top-left = 0,0) to world coords |
| `grid(col,row)` | center of cell (col,row) of a 6×6 grid over the island. Values run 0..5, and fractions are allowed |
| `cells(c0,r0,c1,r1)` | world box covering those grid cells (inclusive) |
| `cam(box, at, dur=900, {whoosh})` | at `at` ms, ease the camera over `dur` ms so that `box` fills the stage area above the caption band. Long moves between islands automatically arc out. `whoosh` plays the swoosh SFX |
| `write(word, x, y, size, t0, dur, o)` | writes with real stroke order. `(x,y)` is the top-left of the first char box by default. Options: `{anchor:'middle'|'end', valign:'baseline', color, out, g, track}`. It returns the end ms. **New characters: run `tools/wb_hanzi.py`** (§6). Missing data falls back to the font. |
| `text(s, x, y, size, t0, o)` | handwriting font (LXGW WenKai), wiped left to right with the pen following. `y` is the baseline. `o.dur: 0` makes it appear with no pen ("printed") |
| `sfx(t, name, vol)` | `tick`, `pop`, `stamp`, `erase`, `whoosh` or `page` |
| `props` | shared persistent props (§4) |
| `C, CLAUSES, CLAUSE` | colors (§5) |
| `islands` | every island rect, for cross-island camera moves |

Sections are built in order s01→s15 onto one board. Later sections render on top of earlier ones.

## 2. World map (world units; standard island 2400×1120 ≈ 1.25 screens; a whole-island view is z≈0.8)

```
        x: -2880          0             2880           5760
y -2080         ┌ MEMO ┐ ┌─── CORE 3600×1680 ───┐ ┌ S13 ┐   (MEMO y -1600, S13 y -1840)
y     0 ┌ S07 ┐          ┌ OPEN ┐      ┌ S02 ┐
y  1600 ┌ S08 ┐          ┌ BASE ┐      ┌ S05 ┐      ┌ S06 ┐
y  3200 ┌ S09 ┐
```

| island | rect `[x0,y0,x1,y1]` | used by |
|---|---|---|
| OPEN | `[0, 0, 2400, 1120]` | **s01**, **s03**, **s14**. s02, s07 and s10 open here with a callback to D1 |
| S02 | `[2880, 0, 5280, 1120]` | s02 (title card D2, agreement scroll D13, "事 / 那句话") |
| BASE | `[0, 1600, 2400, 2720]` | s04 (D4 five-cell base = `props.base`) |
| S05 | `[2880, 1600, 5280, 2720]` | s05 (mental-math split screen D5) |
| S06 | `[5760, 1600, 8160, 2720]` | s06 (three chat frames D6) |
| S07 | `[-2880, 0, -480, 1120]` | s07 (race track D8). It starts at OPEN for the "?" typing |
| S08 | `[-2880, 1600, -480, 2720]` | s08 (self-proof circle D9) |
| S09 | `[-2880, 3200, -480, 4320]` | s09 (quiz cards + tally bars D10) |
| MEMO | `[-2880, -1600, -480, -480]` | **s10**, **s11** (memo D11 grab/chase/red→blue) and the first half of s12 ("加", the rewrite column beside the old line) |
| CORE | `[0, -2080, 3600, -400]` | **s12** (D14 assembly) and **s15** (uses `core.box.spare` at the bottom) |
| S13 | `[4080, -1840, 6480, -720]` | s13 (true alarm, two columns D12) |

Camera route: OPEN → S02 → OPEN → BASE → S05 → S06 → OPEN → S07 → S08 → S09 → OPEN → MEMO → CORE → S13 → OPEN → CORE.

**Shared islands, who owns which region** (all island-local coordinates):
- OPEN is OPEN-local = world, since OPEN sits at the origin:
  - D1 chat panel: `[100,100,1020,840]`, plus its clock inside the header. Free space below the chat, `[60,860,1100,1110]`, belongs to s03 (letter cards).
  - Sentence line (句子条): `[1160,300,2020,450]`. The tag slot (句尾牌) is `[2030,330,2370,450]`. Free space above the line, `[1160,30,2380,290]`, belongs to s02 (stopwatch, "如果/就" rings, spring).
  - Suggestion bar (联想栏): `[1160,470,2372,990]`. Tag staging row: `[1300,1010,1700,1100]`.
  - s14 draws over everything with opaque `sheet()` cards, or clears space with `props.bar.fade(t, 400, 0)`.
- MEMO: s10 owns the top two-thirds (rows 0–3 of the grid). s11 draws on s10's chain; it re-uses positions and doesn't need to redraw. Agree positions with s10, or ring and flash at coordinates s10 publishes in a `local/s10_layout.ts` that s11 may import read-only. s12's "加" part uses the right third (cols 4–5).
- CORE: D14 fills local `x 80..3570, y 230..1360`. The strip `core.box.spare` (local y 1420..1660) is s15's. s12 may put its early (pre-assembly) material there too, but must erase it before 8:47.

## 3. Board / engine (`src/whiteboard`)

- `b.stroke(seed => R.xxx(...), t0, dur, {color, w, dash, out, g, pen})`: a roughjs shape drawn along its path. `R.line / curve / linear / rect / circle / ellipse / path / hatchRect / hatchEllipse / hatchPath / hatchPoly`. `rr(x,y,w,h,r)` builds a rounded-rect path.
- `b.fill(seed => R.hatchRect(...), t0, dur, {color, opacity, flicker})`: hatch lines swept one by one.
- `b.text(s, x, baselineY, size, t0, {anchor, color, dur, font:'hand'|'sans', out})`.
- `b.node(t0, (ms, frame) => <svg…/>, {bb, dur, out, g})`: anything time-varying. **Pass `bb`** (world box) so it can be culled, and `dur` so lint knows the node is animating.
- `b.cam(t, box, dur, whoosh)`. `b.eraseAll(items, t, dur)`. `b.collect(() => {...})` returns the items added. `b.mark()` / `b.since(mark)`.
- Groups: `b.track(id, origin).to(t, dur, {x, y, s}) / .fit(t, dur, fromBox, toBox) / .back(t, dur) / .fade(t, dur, to)` moves or fades everything with `g: id`. `b.inGroup(id, () => {...})` puts everything drawn inside into that group, including pen events. You can also set `b.groups[id] = ms => ({m: rotMat(deg, cx, cy), o: 1})` directly, for rotating hands.
- `b.hover(pt, t0, t1)` makes the pencil hover silently over `pt` ("笔尖悬在横线上方"). `b.sound(t, name, vol)`.
- Verbs: `write(b, word, …)` (stroke order) and `freehand(b, pts, t0, dur, {size, color})` (pressure strokes: strike-outs, underlines, blackout).
- Kit (`src/whiteboard/kit.tsx`):
  - Annotation: `arrow`, `ring`, `under`, `wavy`, `strike`, `scribble` (blackout), `check`, `cross`, `qmark`, `badge`, `dots` (`.light(i,t)` for evidence ①②③), `counter` (1→2→3 with tick).
  - Containers: `sheet` (opaque card overlay), `bubble`, `thought`, `phone`, `miniPhone`, `hatchBox`, `tag` (colored label block), `letterCard`.
  - Objects: `clockFace` (analog, driven by `mins(ms)`), `hhmm`, `stopwatch` (hand driven by `deg(ms)`), `person` (stick figure, poses `stand|raise|hug|run|bend|sit`), `thumb`, `penIcon`, `shield`, `door`, `stamp`, `chair`, `mail`, `lock`, `flag`, `mic`, `heartPath`, `zheng`, `typingDots`, `stratum`, `titleLine`, `HandText` (for use inside nodes).
- The pen follows every stroke, text and write automatically. Pass `pen: false` for incidental lines.
- Line boil, stroke-width compensation for zoom, paper texture, vignette, pencil loop SFX, captions and the disclaimer are all handled by `Episode.tsx`.

## 4. Shared props (`ctx.props`), with time-parameterized methods

Every prop has `g` (group id), `home` (box), `box` (part rects), `views` (ready-made camera boxes), and these methods: `moveTo(t, dur, box)`, `back(t, dur)`, `fade(t, dur, to)`, `erase(t)`, `boxAt(box, ms)` and `where(pt, ms)`, the last two giving positions after a move. To attach your own drawing to a prop so it moves with it, wrap it in `b.inGroup(prop.g, () => …)`. Every method returns its end time where that makes sense, so calls can be chained.

**`props.chat` — D1 chat box + sentence line (OPEN island)**
- `frame(t0, dur=1800)`: panel, header divider, avatar circle, input box, send button.
- `name(t0, {write, black})`: two scrawled strokes, then scribbled black. `bubble(t0, text='那件事，你考虑得怎么样了？')`.
- `status(t0, t1, {rounds=3, count=true, text})` shows "对方正在输入" plus dots jumping `rounds` times, with an optional 1-2-3 counter. `statusOff(t)` erases it with the eraser SFX.
- `clock(t0, '22:47')` draws the analog clock and digital time. `clockTo(t, dur, '23:05')` sweeps the hands and digits (any section can add keys). `timeAt(ms)` returns the current time.
- `line(t0)` draws the blank sentence line. `lineText(text, t0, {printed, dur, color, size, x})` writes on it (`printed` = fades in, no pen). `lineGeo` = `{x0, x1, y, textX, textY, size}`. `check(t0)` adds the ✓ right of the line.
- `input([[t,'？'],[t2,''],[t3,'？']], {until})`: the content of the input box changes over time, with a caret.
- `views`: `panel`, `chatAndLine`, `name` (close-up), `header`, `line`, `lineAndBar`, `all`.
- `chatIcon(b, box, t0, {time, g})` (exported from `props`) draws a mini D1 anywhere (s06 corner, D14 "事").
- s10 may `chat.moveTo(t, dur, box)` to shrink D1 into MEMO's top-left. **s14 must then call `chat.back(t)`**; the stub already does this.

**`props.bar` — D3 suggestion bar + clause tags (OPEN island, below the sentence line)**
- `frame(t0)`: four empty rows (pop SFX). `row(i, t0, {text})`: colored letter plus candidate text (default `CLAUSES[i].sample`).
- `strikeHead(i, t0, {frac})`: grey strike over the first half. `tail(i, t0, {word})`: writes the end word (出事/必须/不行/不在乎) and circles it in the clause color.
- `icon(i, t0)`: shield / door / stamp (with SFX) / chair-with-clock, in the clause color. `verb(i, t0)` writes "· 防/关/评/等". `flash(i, t, {times, hold})` highlights a row.
- `tags(t0, {slideAt, slideDur})`: four colored rings with 防关评等. If `slideAt` is set, they appear in the staging row and slide to the sentence line's right end at `slideAt`. `tagLight(i|'blue', t, {hold})`.
- `rows[i]` holds the anchor points: `box`, `letter`, `text`, `tail`, `icon`, `verb`. `views.bar`, `views.lineAndBar`.

**`props.base` — D4 five-cell base (BASE island)**
- `frame(t0, {fifth})`, `fill(i, t0)` (clause-color hatch), `labels(t0, 'end'|'need'|'verb', {step})`, `above/below/inside(i, text, t0)`, `fifth(t0)` (dashed cell + big ?), `note(t0, '以后揭')` (sticky note), `flash(i, t, {times})`, `cells[i]`. `views.row`, `views.all`.
- `BaseRow` (exported) draws the same five cells anywhere. `props.core.base` is one of these.

**`props.core` — D14 core diagram (CORE island)**. Each method returns its end ms: `let t = core.event(t0); t = core.action(t); …`
- `event(t0)` ① 事 box with mini D1. `action(t0)` ② arrow + 动作 box (thumb + ?).
- `sentence(t0, {chain, label})` ③ sentence box with "如果TA不回，就". `chain(k, t0, {label})`: k=0 "没戏" (red), k=1 "→然后呢→ 从头找" (orange), k=2 "→然后呢→ 办不成事" (blue).
- `bar(t0)`: four colored candidate lines under the sentence. `tags(t0, {lit:'blue'})` ④ plus `lightTag(k, t)`. `baseRow(t0, {arrowTo})`: five cells, filled, with ? and an arrow from the tags.
- `rewrite(t0, lines)` ⑤ right-hand rewrite column (lines ending in "：" are grey headers; each line ≤5 chars). `toolbox(t0, {filled:1})`: 4×4 grid with the pen icon. `flashTools(t)`.
- `light(t)`: whole-diagram "light up" (thick outlines pulse). `baseFlash('red', t, 2)`. `all(t0)` draws everything (debug).
- `views`: `full` (z≈0.52, needs text ≥70), `left`, `sentence`, `tagsBase`, `right`, `base`. `box.spare` is s15's strip.
- s12's narration "一件事…再加一行" takes only about 6 s. Consider drawing parts earlier in s12 (e.g. during "它管的是你下一步的手…"), then *connect/emphasize* them on the cue words.

**Cross-section handoffs that are not props.** Draw your own flashback minis; don't depend on another section's items:
- Evidence dots ①②③ (s05→s06→s07): each section draws its own `dots(...)` in its own island and lights its number.
- D8 race track (s07) appears as flashbacks in s12 and s14, and D9 circle (s08) returns in s12. Later sections redraw small versions with the same look (roughjs + ink). s12 may use `chatIcon` for D1 minis.
- The letter cards (s03) are called back in s06 and s11: use `letterCard(b, cx, cy, s, CLAUSES[i].letter, CLAUSES[i].color, t0)`.

## 5. Colors and typography

| token | hex | meaning |
|---|---|---|
| `C.paper` | #F6F1E6 | paper (the page is textured) |
| `C.ink` | #2A2622 | all main lines and text |
| `C.pencil` / `C.pencilDark` | #A0988C / #7C746A | sketch, helper lines, secondary labels |
| `C.red` / `redDeep` | #C8472F / #98331F | **A · 出事 · 防 · 安全感** |
| `C.orange` / `orangeDeep` | #E0892A / #A35D12 | **B · 必须 · 关 · 自由** |
| `C.blue` / `blueDeep` | #3D6EA6 / #2A4F7C | **C · 不行 · 评 · 价值感** |
| `C.purple` / `purpleDeep` | #7E57A0 / #5A3B78 | **D · 不在乎 · 等 · 亲密** |
| fifth cell | `C.pencil` dashed + ? | 余量 · 意义感 (EP01: question mark, never colored) |
| `C.card` | #FBF8F1 | opaque cards / sheets |
| `C.accent` | #C99A2E | decoration only (pencil ferrule). Don't use it in content, because it is too close to orange |

- **Only the four clause colors carry color, and only for clause semantics**: endings, rings on endings, tags, tally bars, base cells, the red→blue swap. Everything else is ink or pencil. Use `.deep` for text, and the main hue for rings, hatching and fills. `CLAUSES[i]` has `{key, letter, color, deep, end, verb, need, sample, sampleFull, name}`. The order is fixed: A red, B orange, C blue, D purple.
- **On-screen text ≥ 36 px at 1080p after camera zoom**: world size × zoom ≥ 36. At a whole-island view (z≈0.8) that means world size ≥ 45; at the CORE full view (z≈0.52), ≥ 70. `wb_lint` checks every text/write at the moment it finishes.
- **Screen text ≤ 12 characters per label.** The full sentences are already in the caption band.
- The caption band (bottom 150 px) is opaque paper. Nothing you draw shows there, so frame your camera so the content sits in the stage area. The `cam()` box is always fitted above the band.
- Prefer `write()` (stroke order) for 1–3 key words per section, and `text()` for everything else.
- The disclaimer 「读书分享与个人理解，非心理咨询」 is added automatically from s15 onward. Don't draw it.

## 6. Characters, fonts, assets

- The font `public/wb/fonts/wenkai-sub.ttf` already covers all GB2312 level-1 hanzi, the full script and storyboard, ASCII and common symbols. **Never re-subset.** (Regenerate only if the architect asks: `D:\conda\miniconda3\python.exe tools/wb_font.py`.)
- Stroke order: after adding or changing `write('…')` / `ctx.write('…')` calls with string literals, run
  `D:\conda\miniconda3\python.exe tools/wb_hanzi.py`. It scans every `src/ep01v2/**/*.ts(x)` file and rewrites `hanzi.generated.ts` with the union of all characters. It is idempotent and safe to run concurrently. If you pass words through variables, add a comment line `// hanzi: 字字字`. `--check` reports without writing.
- SFX live in `public/wb/`: `pencil` (automatic), `tick`, `pop`, `stamp`, `erase`, `whoosh`, `page` (`tools/wb_assets.py`).

## 7. Commands (run in `D:\desk\claudex\24\video-engine`)

```bash
npx tsc --noEmit -p .                                   # typecheck (must stay clean)
node tools/wb_lint.mjs [--sec s05] [--all]              # build + lint, no rendering (~10 s)
node tools/wb_sheet.mjs --at s05,s05+6,2:20,s05@end     # stills -> out/wb/sheet-*/ (+ sheet.png)
node tools/wb_sheet.mjs --range s05 --step 1.5 --out out/wb/s05   # contact sheet of your whole section
node tools/wb_sheet.mjs --sections                      # start + middle of every section
npx remotion still src/ep01v2/index.ts EP01v2 out/wb/x.png --frame=3700
npx remotion render src/ep01v2/index.ts EP01v2 out/wb/s05.mp4 --frames=3509-4634 --concurrency=4
# freeze check (QA render has no drift or line boil; 1/4 scale is fast):
npx remotion render src/ep01v2/index.ts EP01v2 out/wb/qa_s05.mp4 --frames=3509-4634 --props='{"qa":true}' --scale=0.25 --concurrency=4
node tools/wb_freeze.mjs out/wb/qa_s05.mp4 --offset 116.97       # reports static stretches > 8 s
npx remotion studio src/ep01v2/index.ts                 # interactive preview
```
Frame = ms × 30 / 1000. Section windows are in `public/episodes/EP01v2/sections.json`. Write outputs under `out/wb/<your section>/` so parallel agents don't collide. **Don't render the full film.**

## 8. QA checklist (per section, before handing back)

- [ ] `npx tsc --noEmit -p .` is clean; `node tools/wb_lint.mjs --sec sNN` shows no build error and no `warn` you can fix.
- [ ] Every storyboard row of your section has a visual state change within ±0.5 s of its anchor word (锚字). Every 【钩】 hook is a clearly visible state change.
- [ ] Nothing is static for more than 8 s (lint "nothing moves", or `wb_freeze` on a QA render). Deliberate freezes like 停2秒 / 停3秒 keep the pencil hover (`b.hover`) or a tiny counter going.
- [ ] Text ≥ 36 px on screen and labels ≤ 12 chars. Nothing important is cut off at the frame edge, and nothing is framed into the caption band.
- [ ] Clause colors are used only with their meaning. Everything else is ink or pencil. The fifth cell is never colored.
- [ ] Camera: one clear framing per beat, holds of ≥ 1.5 s so people can read, and no zoom ping-pong. Use `whoosh` only on island changes.
- [ ] A contact sheet (`wb_sheet --range sNN --step 1.5`) reviewed by eye. Send it with your summary.
- [ ] New `write()` words: `tools/wb_hanzi.py` has been run (lint warns about "chars without stroke data").
- [ ] You touched only `sections/sNN.tsx` and `local/sNN_*.tsx`.

Suggested split for three agents: **A = s01–s05** (OPEN, S02, BASE, S05), **B = s06–s09** (S06, OPEN callback, S07, S08, S09), **C = s10–s15** (MEMO, CORE, S13, OPEN recall). The OPEN island is shared by A (s01, s03) and C (s14), and B's s07 visits it for `chat.input`. The regions are listed in §2.
