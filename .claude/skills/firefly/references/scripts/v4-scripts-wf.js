// 萤火存档：2026-10-08 第四版写剧本用的 Workflow（write → genre/facts/user 三位审稿 → revise）。原样复制，只加了这段头注。
// 用法：拿 REVIEWERS 里三位的 prompt 当 SKILL 第 5 步的骨架，不要原样重跑。
// 路径已过时（文件夹后来改了名）：第三版\ → 3_第三版资料\，第四版\ → 4_第四版资料\，成片\第四版\ → 成片\4_第四版_vibe知识大赏\。
// 已被新规则取代的地方（见 references\规则清单.md §7）：简介署名写「由 Claude 用代码生成」→ 现在是「由 Opus 5.5 用代码生成」；
// 硬静音 1–1.5 秒 → 现在默认约 3 秒；目标时长 4:00–4:45 → 现在 4–5 分钟；中文台词由写手 agent 写 → 现在最终中文由 Kimi 写。

export const meta = {
  name: 'v4-scripts',
  description: 'Write, review (genre / facts / user-eyes) and revise scripts for three vibe知识大赏 short films',
  phases: [
    { title: 'Write', detail: 'one writer per film: script, subs.json, cue.json, fact sheet' },
    { title: 'Review', detail: 'three independent reviewers per film' },
    { title: 'Revise', detail: 'writer applies P0/P1 fixes' },
  ],
}

const ROOT = 'D:\\desk\\claudex\\24'
const VE = ROOT + '\\video-engine'

const FILMS = [
  { slug: 'peak', comp: 'V4Peak', name: 'A《峰终》', idea: '峰终定律（Peak–End rule）' },
  { slug: 'ties', comp: 'V4Ties', name: 'B《弱关系》', idea: '弱关系的力量 + 小世界网络' },
  { slug: 'hebb', comp: 'V4Hebb', name: 'C《赫布》', idea: '赫布定律（一起放电的神经元会连在一起）' },
]

const COMMON = `
# 项目背景（必读）
用户想做抖音 #vibe知识大赏 风格的知识短片：画面、配乐、字幕全部由 Claude 写代码生成。用户发来的参考是电子智人《Vibe 知识大赏｜信息论 惊奇之学》（B 站 BV1GXav6iEWh）。用户的要求有四条：知识点不重复、形式不重复、选题不偏且对生活真有解释和启发意义、讲法符合人类学习规律。
上一版（第三版）三条样片被用户否定，原话是：「你这个做的逻辑和我跟你讲的vibe知识大赏的逻辑完全不一样，看不出来一点相似之处」。错在三点：
- 选题选了安全常识（刹车、剩饭、熬夜）；
- 做成了带 A/B/C 押注卡、满屏小字面板、TTS 口播的「课」；
- 刻意避开了暗底发光的外观。
这一次要做对。

开始前先读完这些文件：
1. ${ROOT}\\第三版\\学习\\类型语法.md —— 这个类型的 12 条不变量、可变维度、选题逻辑、自检清单。这是最高标准。
2. ${ROOT}\\第三版\\学习\\诊断_参考片对比三条样片.md —— 上一版错在哪。
3. ${ROOT}\\第三版\\拆解\\BV1GXav6iEWh_拆解.md —— 参考片《信息论》38 句字幕逐秒拆解。这是你写字幕时的语气和节奏样板：一句一个意思，平均约 17 字，每句在屏 4–8 秒，句间空 1 秒。
4. ${ROOT}\\第四版\\片单.md —— 三部片的分工：每部换什么、不换什么。
5. ${VE}\\src\\v4\\CONTRACT.md —— 制作规范（画面语法、讲法、目录、声音）。
6. 如果存在，也读 ${ROOT}\\第三版\\学习\\类型语法_核查意见.md 和 类型语法_用户视角意见.md（两位审稿人对类型语法的意见）。
另外，亲眼看一下这几张图，理解「长什么样」：
- ${ROOT}\\第三版\\参考视频\\sheet_ctrl_overview.jpg
- ${ROOT}\\第三版\\学习\\对照\\全片每5秒_参考_信息论.jpg
- ${ROOT}\\第三版\\学习\\对照\\类型一览_每条片40%处一帧.jpg
- ${ROOT}\\第三版\\学习\\sprites\\BV12MH76jEMK\\overview.jpg（N=1）
- ${ROOT}\\第三版\\学习\\sprites\\BV12Zhm6oE6m\\overview.jpg（群论）

# 可用的公共组件（制作阶段会用，写分镜时心里要有数）
${VE}\\src\\v4\\kit\\ 提供这些组件：
- Backdrop：近黑底 + 星尘 + 暗角 + 颗粒
- GlowCanvas：每帧回调，在里面用 dot / haze / line / ring / comet / partial / sample 画发光点、线、环、彗星，以及线条生长
- Subtitles：双语字幕
- ChapterLabel：左上章节标签
- Label：贴在物体旁的小标签
- TitleCard：片名卡
- ParticleText：粒子聚字 / 吹散
- Typewriter：逐字打出 + 光标
- Camera：慢推拉
- Veil：压暗、闪白
- EndMark：片尾署名
配乐用 ${VE}\\tools\\score.py 按 cue.json 合成，格式见文件末尾的 EXAMPLE：
- 段落字段：t0、t1、chords、piano 型态 sparse/arp/arp16/motif/chordal、layers（pad/low/piano/pulse）、intensity；
- hits：boom / bell / ding / riser / note；
- silences：硬静音。

# 规矩
- 事实要查实。用 WebSearch / WebFetch 读网页（维基、期刊摘要页、出版社页面、可靠媒体）。**不要下载任何文件**：PDF、视频、数据集都不行。每个人名、年份、数字都要写出处链接。查不到的就改说法或删掉，示意性的数字在画面上标「示意」。
- 引用：古诗文、鲁迅（已进入公有领域）可以引；在世作者的原话只引一句短的（≤15 个英文词或 ≤25 个汉字）。
- 不要做语音转写，不要改别人的目录。
- 中文写作要求：短句，具体，不要官腔。
`

const WRITE = (f) => `${COMMON}
# 你的任务：写 ${f.name}（slug=${f.slug}）的完整剧本
主题：${f.idea}。这部片在片单里的具体分工（入口、母题、骨架、材质、主色、片名位置、梗、反转、边界、落点、配乐）都在 片单.md 的对应一列。按那一列来，可以在不违反类型语法的前提下改得更好，改动要在剧本开头写明理由。

产出（全部写到 ${ROOT}\\第四版\\${f.slug}\\ 下，subs/cue 写到 ${VE}\\public\\v4\\${f.slug}\\ 下）：

1. **剧本.md**
   - 开头：一句话说清这部片；片名卡文字；平台标题；目标时长（4:00–4:45）。
   - 主体是一张逐场分镜表，列：时间段 | 章节 | 中文字幕 | 英文字幕 | 画面（**一个主角**是什么，在画面哪里，什么颜色，怎么动，小标签写什么、何时出现何时收走）| 转场（是否形变：上一幕的什么变成下一幕的什么）| 配乐 / 点位音效。
   - 要细到制作的人照着就能做，不需要再猜。每 6–10 秒换一个画面状态。
2. **subs.json**：\`[{"t0":秒,"t1":秒,"zh":"…","en":"…"}]\`。
   - 和剧本一致，大约 38–48 句。
   - 每句在屏 ≥ 中文字数 ÷ 4 + 1.5 秒，一般 4–8 秒；句间空 0.6–1.2 秒。
   - 提问之后留 5–8 秒近乎空白的画面（这段不放字幕）。
   - 英文要自然、优雅，像电影字幕，不要逐字直译。
3. **cue.json**：给 score.py 的配乐表。
   - 段落时间要和场景对齐。片名出现处放 boom + bell。大反转之后放 1–1.5 秒的 silences。最后一段的 intensity 最高或接近最高。
   - 点位音效全片 ≤ 15 个。hebb 那部的「叮」是剧情的一部分，可以多几个，但要在剧本里写清楚每一声的用途。
   - dur 等于片长。
4. **事实核查.md**：每一条事实一行：说法 | 出处链接 | 核对结果（原文怎么说）| 片中怎么写。示意性的数字单独列出来。
5. **发布文案.md**：
   - 抖音标题，格式「Vibe知识大赏｜…」；
   - B 站标题，格式「【opus5.5短片】…」；
   - 简介，3–6 行，诗意，最后一行写「画面、配乐与双语字幕全部由 Claude 用代码生成」；
   - 话题标签：#vibe知识大赏 #ai新星计划 #抖音前沿科技首发计划 + 学科词。

写完后自己按 类型语法.md §6 的 A1–A5、B1–B4、B10、B11、B14 逐条自查，在剧本末尾附自查表（每条：过 / 不过 + 证据）。

**特别注意**：
- 第一约束是「用户把这部片和《信息论》并排看，会觉得是同一个类型」。
- 学习规律藏在画面动作和句子里：先体验后命名、最小对照、亲手验证、跨领域迁移、讲边界。屏幕上永远不出现手法的名字，也不出现「答案 / 记住 / 注意 / 建议 / 先选 / 错在 / 留个题」。
- 每屏除字幕外的画面文字，多数 ≤ 8 个汉字，最多 20 个。
- 不要写成课。要写成一部让人「被一个想法击中」的短片：有一下「原来如此」，有一次大反转，结尾一句能被抄进弹幕的话。`

const ISSUES = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['pass', 'revise', 'rewrite'] },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['P0', 'P1', 'P2'] },
          where: { type: 'string' },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'where', 'problem', 'fix'],
      },
    },
  },
  required: ['verdict', 'summary', 'issues'],
}

const REVIEWERS = [
  {
    key: 'genre',
    prompt: (f) => `${COMMON}
# 你的任务：类型审稿（${f.name}）
读 ${ROOT}\\第四版\\${f.slug}\\剧本.md 和 ${VE}\\public\\v4\\${f.slug}\\subs.json。你是这个类型最挑剔的老观众，手边放着《信息论》的逐秒拆解。逐条判断：
- 类型语法 §6 的 A1–A5、B1–B5、B8–B11、B14，以及 12 条不变量。
- 有没有任何「课」的痕迹：教学话术、常驻标签、满屏信息、一个底图用到底、结尾给规则。
- 字幕是不是「片子的句子」：短、对仗、比喻、第二人称、留白。逐句看，挑出写成说明文的句子，给出改写。
- 画面设计是不是一屏一个主角、光是主角、有形变转场（至少 3 次）。
- 片单里分给这部片的「换什么」有没有做到（入口、母题、骨架、梗、落点）。它和《信息论》的相似度够不够，会不会像抄。
P0 = 用户会觉得「不像」或「像课」；P1 = 明显减分；P2 = 小问题。每条都给出具体改法（改成什么句子 / 什么画面）。`,
  },
  {
    key: 'facts',
    prompt: (f) => `${COMMON}
# 你的任务：对抗性事实核查（${f.name}）
读 ${ROOT}\\第四版\\${f.slug}\\剧本.md、事实核查.md、subs.json。
对片中每一条事实（人名、年份、地点、实验设计、样本量、百分比、引语、因果说法）都去独立核对：用 WebSearch / WebFetch 找原始出处，或可靠的二手出处。默认怀疑，尝试推翻。
特别注意这几类问题：
- 张冠李戴；
- 把相关说成因果；
- 夸大（例如把「一项研究」说成「科学证明」）；
- 已被重复实验质疑的结论；
- 引语不准确或出处不对；
- 示意数字没标示意；
- 画面上由代码算出的读数，前后算得对不对。
P0 = 错误事实或会被懂行观众抓住的硬伤；P1 = 不准确、夸大或缺限定；P2 = 措辞。每条给出处链接和改法。**不要下载任何文件。**`,
  },
  {
    key: 'user',
    prompt: (f) => `${COMMON}
# 你的任务：站在用户和普通观众的角度审稿（${f.name}）
读 ${ROOT}\\第四版\\${f.slug}\\剧本.md 和 subs.json，再看《信息论》的拆解和总览图。你要扮演两个人。
1. **用户本人**：发了《信息论》当参考，否定了上一版三条。
   - 他把这部片和《信息论》并排看，会不会说「对，就是这种」？哪里还会让他皱眉？
2. **一个普通观众**：没学过这门知识，只看字幕和画面描述。
   - 看完能不能用自己的话说出这个想法？
   - 哪一秒会有「原来如此」？
   - 哪里会看不懂、会划走？前 3 秒能不能留住人？
   - 结尾那句话是自然长出来的，还是硬加的鸡汤？
   - 它对生活的启发，是真的换了一个看法，还是一句口号？
3. **英文字幕**：逐句看，是不是地道、优雅。
给出 P0/P1/P2 和具体改法。`,
  },
]

const REVISE = (f, reviews) => `${COMMON}
# 你的任务：根据审稿意见修改 ${f.name}（slug=${f.slug}）
你写的初稿在 ${ROOT}\\第四版\\${f.slug}\\ 和 ${VE}\\public\\v4\\${f.slug}\\。三位审稿人的意见如下（JSON）：
${JSON.stringify(reviews, null, 1)}

要求：
- 所有 P0、P1 都要改。P2 酌情处理。
- 事实类意见先自己再查一遍，确认后再改；审稿人说错的，在记录里写明理由。
- 修改后，剧本.md、subs.json、cue.json、事实核查.md、发布文案.md 必须互相一致。时间轴改了，cue.json 也要跟着改。
- 在 ${ROOT}\\第四版\\${f.slug}\\审稿记录.md 里逐条写：意见 → 怎么处理的（改了什么 / 为什么不改）。
- 最后重新做一遍剧本末尾的自查表。`

const DONE = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    duration_sec: { type: 'number' },
    subtitle_count: { type: 'number' },
    summary: { type: 'string' },
    open_questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['files', 'duration_sec', 'subtitle_count', 'summary', 'open_questions'],
}

const results = await pipeline(
  FILMS,
  (f) => agent(WRITE(f), { label: `write:${f.slug}`, phase: 'Write', schema: DONE }),
  async (draft, f) => {
    const reviews = await parallel(REVIEWERS.map((r) => () =>
      agent(r.prompt(f), { label: `review:${r.key}:${f.slug}`, phase: 'Review', schema: ISSUES })
        .then((v) => (v ? { reviewer: r.key, ...v } : null))))
    return { draft, reviews: reviews.filter(Boolean) }
  },
  (prev, f) => agent(REVISE(f, prev.reviews), { label: `revise:${f.slug}`, phase: 'Revise', schema: DONE })
    .then((final) => ({ slug: f.slug, draft: prev.draft, reviews: prev.reviews.map((r) => ({ reviewer: r.reviewer, verdict: r.verdict, summary: r.summary, n: r.issues.length, p0: r.issues.filter((i) => i.severity === 'P0').length })), final })),
)
return results
