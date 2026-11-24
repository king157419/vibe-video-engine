// 萤火存档：2026-10-08 第四版制作用的 Workflow（build → picture/sound 两位独立审片 → fix）。原样复制，只加了这段头注。
// 用法：拿 BUILD / QA / FIX 的 prompt 当 SKILL 第 6–7 步的骨架，不要原样重跑。
// 路径已过时（文件夹后来改了名）：第三版\ → 3_第三版资料\，第四版\ → 4_第四版资料\，成片\第四版\ → 成片\4_第四版_vibe知识大赏\。
// 已被新规则取代的地方：agent 自己往成片\ 拷文件 → 现在只有负责人碰成片\；亮度门槛 8–20 → 现在 8–15；
// 硬静音约 1.5 秒 → 现在默认约 3 秒；没有 v4_stutter 检查 → 现在必跑；没有从 mix.wav 重新封装 → 现在照 制作命令.md §2 第 8 步。

export const meta = {
  name: 'v4-build',
  description: 'Build, QA and fix three vibe知识大赏 short films (Remotion + code-synth score), deliver finals to 成片/第四版',
  phases: [
    { title: 'Build', detail: 'one builder per film: scenes, music, draft, self-QA, final render' },
    { title: 'QA', detail: 'two independent reviewers per film (picture/genre, sound/viewer)' },
    { title: 'Fix', detail: 'builder fixes P0/P1, re-renders final, re-delivers' },
  ],
}

const ROOT = 'D:\\desk\\claudex\\24'
const VE = ROOT + '\\video-engine'
const FILMS = [
  { slug: 'peak', comp: 'V4Peak', name: 'A《峰终》', out: 'A_峰终' },
  { slug: 'ties', comp: 'V4Ties', name: 'B《弱关系》', out: 'B_弱关系' },
  { slug: 'hebb', comp: 'V4Hebb', name: 'C《赫布》', out: 'C_赫布' },
]

const COMMON = (f) => `
# 背景
用户要做抖音 #vibe知识大赏 风格的短片。画面、配乐、双语字幕全部由 Claude 写代码生成。参考片是电子智人《信息论 惊奇之学》（B 站 BV1GXav6iEWh）。
上一版三条样片被用户否定：「看不出来一点相似之处」。错在三处：
- 亮底；
- 满屏小字面板；
- A/B/C 题卡和 TTS 口播，整体像一堂课。
这一次剧本已经按类型重写并经过三轮审稿。你的任务是把它**做成片**。片子要做到：和《信息论》并排放，一个没看过的人分不出哪条是我们做的。

# 必读
1. ${VE}\\src\\v4\\CONTRACT.md —— 制作规范，特别是 §1 画面语法、§2 讲法、§2.5 必须有、§4 渲染与自检。
2. ${VE}\\src\\v4\\kit\\KIT.md —— 公共组件用法；示例在 ${VE}\\src\\v4\\kitdemo\\Demo.tsx。
3. 本片剧本：${ROOT}\\第四版\\${f.slug}\\剧本.md（逐场分镜）、审稿记录.md、事实核查.md。数据在 ${VE}\\public\\v4\\${f.slug}\\：subs.json、cue.json，可能还有 numbers.json 或 timeline_meta.json。剧本作者写过生成脚本，在 ${ROOT}\\第四版\\${f.slug}\\ 下，是这些 json 的唯一来源。
4. 参考画面：
   - ${ROOT}\\第三版\\学习\\对照\\全片每5秒_参考_信息论.jpg
   - ${ROOT}\\第三版\\参考视频\\sheet_ctrl_overview.jpg
   - ${ROOT}\\第三版\\参考视频\\frames\\BV1GXav6iEWh\\（逐秒帧，按需挑几张看）
5. 类型自检清单：${ROOT}\\第三版\\学习\\类型语法.md §6，以及 ${ROOT}\\第三版\\学习\\类型语法_用户视角意见.md §5。

# 硬规矩
- **只改自己的目录**：
  - src\\v4\\${f.slug}\\**
  - public\\v4\\${f.slug}\\**
  - out\\v4\\${f.slug}\\**
  - ${ROOT}\\第四版\\${f.slug}\\**
  - 成片交付文件：${ROOT}\\成片\\第四版\\${f.out}*
- 不改 src\\v4\\kit（需要新能力就在自己目录里写，或者复制一份改），不改 src\\Root.tsx、package.json，不 npm install。
- **确定性**：禁止 Math.random、Date.now、CSS 动画/过渡、useState 计时器、requestAnimationFrame。只用 kit 的 mulberry32 / hash2 和帧号。
- **渲染**：
  - 在 PowerShell 里先设 \`$env:TEMP='D:\\tmp\\v4${f.slug}'; $env:TMP='D:\\tmp\\v4${f.slug}'\`（C 盘空间紧）。
  - 三部片同时在渲染，所以一律 \`--concurrency=5\`。
  - 加 \`--jpeg-quality=95\`。
  - 全尺寸终版用默认 crf 18。
- **配乐**：\`D:\\conda\\envs\\d2l\\python.exe ${VE}\\tools\\score.py public\\v4\\${f.slug}\\cue.json public\\v4\\${f.slug}\\music.wav\`。
  - 然后做两遍 loudnorm，得到 mix.wav：目标 I=-16，TP=-1.5，LRA 7–10。
  - 第一遍用 \`loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json\` 测量，第二遍带 measured_* 参数，并加 linear=true。
  - 片子里用 \`<Audio src={staticFile('v4/${f.slug}/mix.wav')}/>\`。
  - 不允许有任何持续的噪声音效，不要铅笔/手写沙沙声。
- **自检工具**：\`D:\\conda\\envs\\d2l\\python.exe ${VE}\\tools\\v4_qa.py <视频> <输出目录>\`。它会产出：每 5 秒一帧的印样 sheet_XX.jpg、和《信息论》并排的 vs_reference.jpg、亮度/细节密度/静止段/响度 metrics.json。
- 不下载任何文件，不做语音转写。
- Composition 的 id 是 ${f.comp}，入口是 src\\v4\\${f.slug}\\index.ts（registerRoot）。片长按 cue.json 的 dur。
`

const BUILD = (f) => `${COMMON(f)}
# 你的任务：把 ${f.name} 做成片
1. 照剧本逐场实现。
   - 每个画面的主角、颜色、运动、标签出入时间、形变转场，都按剧本来。剧本有含糊的地方，按 CONTRACT 和类型语法自己定，并在 ${ROOT}\\第四版\\${f.slug}\\自检记录.md 里记下来。
   - 画面质量是第一位的：光要像光（多层光晕、additive 叠加）；线条要细、要干净；运动要有缓动；镜头一直在慢慢动。
   - 满屏奇观要真的「哇」。片名卡要像一件作品。
   - 画面里的读数全部由代码算出，和剧本、numbers 一致。
2. 合成配乐，得到 mix.wav，挂进片子。
3. 半尺寸草稿：\`remotion render ... out\\v4\\${f.slug}\\draft.mp4 --scale=0.5\`。跑 v4_qa.py。
   - **亲眼看**全部 sheet、vs_reference.jpg。
   - 再用 \`remotion still\` 抽 8–12 张关键时刻的全尺寸静帧亲眼看：开场、错音或关键开场时刻、片名卡、每章第一个画面、满屏奇观、硬静音前后、结尾。
   - 逐条检查：
     - 每屏主角是不是一个；
     - 除字幕外的汉字数（多数帧 ≤ 8，最多 20）；
     - 有没有元素出框、重叠，或压到底部 120px 字幕带；
     - 字幕和画面是否同步；
     - 片名卡粒子和文字是否对齐；
     - 有没有静止段（v4_qa 的 freezes_over_8s 应为空，留白段除外）；
     - 亮度均值是否在 8–20。
   - 发现问题就改，再渲草稿，**至少迭代两轮**。
4. 全尺寸终版：out\\v4\\${f.slug}\\final.mp4，带声音。再跑一次 v4_qa.py，输出到 out\\v4\\${f.slug}\\qa_final。
5. 交付：
   - 复制成 ${ROOT}\\成片\\第四版\\${f.out}.mp4。
   - 封面用片名卡最完整的那一帧（remotion still），存为 ${ROOT}\\成片\\第四版\\${f.out}_封面.png。
   - 把发布文案.md 复制成 ${ROOT}\\成片\\第四版\\${f.out}_发布文案.md。
6. 在 ${ROOT}\\第四版\\${f.slug}\\自检记录.md 里写：
   - 每轮发现了什么、改了什么；
   - 终版的 metrics.json 要点；
   - 你自己对照 vs_reference.jpg 的判断：像不像同一个类型，差在哪；
   - 还没解决的问题。
渲染完删掉 D:\\tmp\\v4${f.slug} 里的 remotion-webpack-bundle-* 文件夹。`

const ISSUES = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ship', 'fix', 'major'] },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['P0', 'P1', 'P2'] },
          time: { type: 'string' },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'time', 'problem', 'fix'],
      },
    },
  },
  required: ['verdict', 'summary', 'issues'],
}

const QA = [
  {
    key: 'picture',
    prompt: (f) => `${COMMON(f)}
# 你的任务：独立审片 · 画面和类型（${f.name}）
成片：${ROOT}\\成片\\第四版\\${f.out}.mp4（不存在就用 ${VE}\\out\\v4\\${f.slug}\\final.mp4）。**你不改任何文件**，只审。
1. 自己跑一遍 v4_qa.py，输出到 D:\\tmp\\qa_${f.slug}_picture，然后看全部 sheet 和 vs_reference.jpg。
2. 用 ffmpeg 抽帧细看：每 2 秒一帧，按段拼成图看；字幕带裁出来放大看。
3. 回答：
   - **总闸**：和《信息论》并排，像不像同一个类型？哪里一眼看出不是？
   - 每屏是不是一个主角？有没有满屏小字、常驻标签、像图表课件的帧？给出时间点。
   - 光的质感：发光、线条、粒子是不是精致？有没有廉价感：锯齿、色带、生硬的出现和消失、跳帧？
   - 有没有出框、重叠、文字被切、字幕和画面错位、片名卡对不齐、拼写或错别字？
   - 满屏奇观「哇」不「哇」？形变转场有几处，顺不顺？
   - 是否全片都在动？有没有幻灯片感？
   - 和剧本对一遍：有没有漏掉或做错的场。
P0 = 用户会说「不像 / 廉价 / 看不懂」，或者有明显错误；P1 = 明显减分；P2 = 小问题。每条都写时间点和具体改法。`,
  },
  {
    key: 'sound',
    prompt: (f) => `${COMMON(f)}
# 你的任务：独立审片 · 声音、节奏和第一次看的观众（${f.name}）
成片：${ROOT}\\成片\\第四版\\${f.out}.mp4（不存在就用 ${VE}\\out\\v4\\${f.slug}\\final.mp4）。**你不改任何文件**，只审。你听不到声音，只能用测量来判断。
1. 声音：
   - 用 ffmpeg ebur128 拿每 0.5 秒的短时响度曲线，对照 cue.json 的段落和剧本里的音乐意图检查：
     - 片名处是否是全片最响的瞬间之一；
     - 反转后有没有约 1.5 秒的硬静音；
     - 结尾段是否最响或接近最响；
     - 开场是否太小声（抖音上前 3 秒听不见会被划走）。
   - 看 showspectrumpic 频谱：有没有刺耳的高频、爆音、削波、持续噪声？低频是否托得住？
   - 整体 I / LRA / TP 是否合规：-16 ±1，LRA 7–10，TP ≤ -1.5。
   - 剧情需要的音（错音、叮、ding）是否在对的时间点，可以对着波形和频谱找。
2. 节奏：
   - 抽每句字幕中间那一帧，检查字幕在不在、读不读得完；
   - 每句在屏时长；
   - 提问后的留白里有没有呼吸（画面不能死）。
3. 第一次看的观众：只看字幕和画面（抽帧），能不能看懂这个想法？哪一秒是「原来如此」？哪里会划走？
P0 / P1 / P2，每条写时间点和具体改法。`,
  },
]

const FIX = (f, reviews) => `${COMMON(f)}
# 你的任务：按审片意见修 ${f.name}，出终版
两位审片人的意见（JSON）：
${JSON.stringify(reviews, null, 1)}

- P0、P1 全部改；P2 酌情改。审片人说错的，自己验证后可以不改，但要在自检记录里写理由。
- 改完重新渲全尺寸终版（out\\v4\\${f.slug}\\final.mp4），再跑 v4_qa.py（qa_final）。
- 亲眼复看改过的地方：抽改动处前后的静帧，确认已修好、没改出新问题。
- 重新交付：${ROOT}\\成片\\第四版\\${f.out}.mp4、${f.out}_封面.png、${f.out}_发布文案.md。
- 在自检记录.md 里追加一节「审片修改」：逐条写意见 → 处理方式。最后写终版 metrics。`

const DONE = {
  type: 'object',
  properties: {
    delivered: { type: 'array', items: { type: 'string' } },
    duration_sec: { type: 'number' },
    metrics: { type: 'string' },
    summary: { type: 'string' },
    unresolved: { type: 'array', items: { type: 'string' } },
  },
  required: ['delivered', 'duration_sec', 'metrics', 'summary', 'unresolved'],
}

const results = await pipeline(
  FILMS,
  (f) => agent(BUILD(f), { label: `build:${f.slug}`, phase: 'Build', schema: DONE }),
  async (built, f) => {
    const reviews = await parallel(QA.map((q) => () =>
      agent(q.prompt(f), { label: `qa:${q.key}:${f.slug}`, phase: 'QA', schema: ISSUES })
        .then((v) => (v ? { reviewer: q.key, ...v } : null))))
    return { built, reviews: reviews.filter(Boolean) }
  },
  (prev, f) => agent(FIX(f, prev.reviews), { label: `fix:${f.slug}`, phase: 'Fix', schema: DONE })
    .then((final) => ({
      slug: f.slug,
      built: prev.built,
      reviews: prev.reviews.map((r) => ({ reviewer: r.reviewer, verdict: r.verdict, summary: r.summary, p0: r.issues.filter((i) => i.severity === 'P0').length, n: r.issues.length })),
      final,
    })),
)
return results
