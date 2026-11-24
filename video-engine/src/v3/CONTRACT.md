# 第三版样片制作规范（v3）

每条样片是一个独立的 Remotion 工程入口，互不改动对方的文件。方案见 `D:\desk\claudex\24\3_第三版资料\方案\样片方案与路线图.md`。

## 0. 硬规矩

1. **只动自己的目录**：`src/v3/<slug>/**`、`public/v3/<slug>/**`、`3_第三版资料/样片/<slug>/**`、`out/v3/<slug>/**`。不要改 `src/whiteboard/**`、`src/ep01v2/**`、`src/Root.tsx`、`package.json`，不要 `npm install`。可以 import 已有代码（如 `src/whiteboard` 的 roughjs 封装、汉字笔顺），但不要修改它们。
2. **确定性**：所有画面都只由帧号推出。禁止 `Math.random`、`Date.now`、CSS 动画/过渡、`useState` 计时器、`requestAnimationFrame`。需要随机就用带种子的伪随机（如 mulberry32）或 `@remotion/noise`。模拟（粒子、车流、人群）要么逐帧可复现地从第 0 帧积分（在 `useMemo` 里预计算整条轨迹），要么用解析解。
3. **规格**：1920×1080，30 fps，H.264 + AAC。画面内文字最小 36px（手机能读），关键数字和标签 ≥ 48px。底部 140px 留给字幕，动画焦点不要放进去。
4. **时钟**：
   - 有旁白：配音就是时钟。先写好旁白稿 `public/v3/<slug>/script.txt`，用 `..\.venv\Scripts\python.exe tools\tts.py public\v3\<slug> --voice zh-CN-YunxiNeural --rate -4%`（稿子里可写 `[停2秒]`）生成 `audio.mp3` 和 `captions.json`（逐字时间）。画面动作锚在字上（找某个词第一次出现的时间），不要手写毫秒。
   - 无旁白：字幕就是时钟。自己写 `public/v3/<slug>/subs.json`（每句 `{t0, t1, zh, en?}`），每句停留时间 ≥ 字数 ÷ 4 + 1.2 秒，句间留 0.4–1 秒。
5. **声音**：不加任何持续音效，尤其不要铅笔/手写沙沙声。配乐用 `tools/music_synth.py` 现场合成（`--marks` 传段落切换秒数），有旁白时音乐在混音里压到旁白下面约 18–22 dB。最终响度 −15 LUFS、真峰值 ≤ −1.5 dBTP。
6. **字体**：只用 `public/fonts/NotoSansSC-VF.ttf`、`NotoSerifSC-VF.ttf`（`src/lib/fonts.ts` 的 `ensureFonts()`），以及 `public/wb/fonts/` 里的霞鹜文楷（手写风）。不要引用系统字体。
7. **事实**：片中每个数字、年份、人名、实验都要在 `3_第三版资料/样片/<slug>/事实核查.md` 里列出处。查不到就改说法或删掉。示意性的数字要在画面上标「示意」。
8. **AI 标识**：片尾署名一行「画面由 Claude 用代码生成 · 配音为 AI 合成（占位）」或「画面、字幕、配乐由 Claude 用代码生成」。

## 1. 目录

```
src/v3/<slug>/index.ts        registerRoot（只注册自己的 Composition，id 用 PascalCase，如 V3Traffic）
src/v3/<slug>/Root.tsx
src/v3/<slug>/Video.tsx       主组件（按段落拆成多个 scene 文件）
public/v3/<slug>/             script.txt / audio.mp3 / captions.json / subs.json / music.wav / mix.wav
3_第三版资料/样片/<slug>/            分镜表.md、事实核查.md、自检记录.md、印样
out/v3/<slug>/                渲染输出
```

Composition 的时长从 `captions.json` 的 `durationMs`（或 `subs.json` 最后一句）加 2–3 秒片尾算出，用 `calculateMetadata` 或直接在 Root 里读 JSON（`staticFile` + `delayRender`，参考 `src/lib/load.ts`）。

## 2. 渲染与自检（在 PowerShell 里先把临时目录指到 D 盘）

```powershell
$env:TEMP='D:\tmp\<slug>'; $env:TMP='D:\tmp\<slug>'; New-Item -ItemType Directory -Force $env:TEMP | Out-Null
cd D:\desk\claudex\24\video-engine
node node_modules/typescript/bin/tsc --noEmit -p .      # 类型检查（若整体报错，至少保证自己的文件无错）
node_modules\.bin\remotion.cmd still src\v3\<slug>\index.ts <Comp> out\v3\<slug>\f_%d.png --frame=<n>   # 抽静帧看
node_modules\.bin\remotion.cmd render src\v3\<slug>\index.ts <Comp> out\v3\<slug>\draft.mp4 --scale=0.5   # 半尺寸草稿
```

- 草稿印样：`ffmpeg -i draft.mp4 -vf "fps=1/2,scale=480:-1,tile=6x5" sheet_%02d.jpg`，逐张看：画面是否在演示机制、有没有空镜超过 6 秒、字是否压字幕带、有没有元素出框或互相遮挡。
- 静止检测：`ffmpeg -i draft.mp4 -vf "freezedetect=n=0.003:d=6" -f null -`，超过 6 秒不动要有理由（例如押注停顿）。
- 混音：`ffmpeg -i audio.mp3 -i music.wav -filter_complex "[1:a]volume=-20dB[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11" mix.wav`（无旁白片：只对 music.wav 做 loudnorm 到 −18 LUFS）。
- 终版：全尺寸渲染，音轨用 mix.wav（在 Composition 里用 `<Audio src={staticFile('v3/<slug>/mix.wav')}/>`）。
- 渲染完删除 `D:\tmp\<slug>` 里的 `remotion-webpack-bundle-*`。
