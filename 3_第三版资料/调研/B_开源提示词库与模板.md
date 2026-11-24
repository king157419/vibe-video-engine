# B｜开源提示词库与模板：Opus 5.5 视频（重点看知识讲解类）

调研日期：2026-10-06。面向：做「Vibe 知识大赏」类视频的创作者（不需要懂代码，但下面的工具名、参数、步骤都是准确的，可以直接交给 Claude Code 用）。

**和早期调研的关系**：`2_第二版资料/调研/开源视频方案.md` 第 2 节已经讲过 HF 博客的 `seek(t)` 契约、Playwright 截帧 + ffmpeg、explainx 的“两轮生成”说法；`参考片拆解_电子智人.md` 已经拆过《信息论》的结构。本文不再重复这些内容，只补充**新找到的库、知识类提示词的逐条拆解、共同要素和“vibe知识大赏”专用模板**。

**证据等级**
- 【实证】一手来源：仓库里的原文或数据文件、作者本人的帖子或回复（经仓库逐字转录，附原帖链接）、视频简介、GitHub 页面上的数字。
- 【转述】二手：策展人写的说明、第三方文章、别人的统计。
- 【推断】我自己根据材料推出来的。

**版权处理**：所有提示词和文章都用我自己的话概括结构和要点，**本文不直接摘抄提示词原文**（0 处引用，满足“每处不超过 15 字”的要求），每条都给了原文链接，需要原文请点链接。

**数据口径**：星数、最后提交时间都是 2026-10-06 约 15:20 UTC 从 GitHub 仓库页面和提交 RSS 读取的（GitHub API 当时被限流，改用页面）。“最后提交”是默认分支上最新一次提交的时间。

---

## 0. 先说结论

1. **库很多，但真正“知识讲解类”的提示词不多。** 各大合集里知识/教育类大约占 7%～17%：yihui 的 475 条里标为 explainer 的 62 条（而且多数是产品讲解）；zhuyansen 的 1,352 个作品里教育类 132 个，其中只有 45 个能追到提示词；athemeroy 用分类器统计，教育/科普在纳入样本里约占 7%。【实证】
2. **最值得看的知识类提示词有两种形态。** 一种是**一句话 brief**（“做一个讲 X 的视频，让高中生看得懂，给我惊喜”），靠 Opus 自己选工具；另一种是**规格书**（几千到一万多字符，写明秒级结构、事实规则、技术契约、自检流程）。播放量高的中文知识片（宝玉的《什么是 Transformer》、WY 的《大气环流》）都只有一到四句话；做工最细的（《AI 简史》《足球规则 AR 分析》《Google 史》《光子之旅》）都是规格书。【实证 + 推断】
3. **好提示词的共同骨架**：交付规格（精确时长、分辨率、帧率、响度）→ 受众和学习目标 → 事实规则（只用核实过的、不确定就删、数字要核对）→ 叙事骨架（钩子、一句话论点、3～6 个机制、具体数字和例子、结尾回扣开头）→ 一个贯穿全片的视觉母题 → 画面纪律（一镜一个意思、旁白说到哪画面才出现、屏上字数上限和停留时长、禁用清单）→ 确定性渲染契约 → 声音（TTS、字幕、配乐、音效、压低音乐）→ 先出分镜/静帧再渲染 → 自检清单 → 交付物清单。详见第 3 节。【推断，综合 12 条以上实证提示词】
4. **没有找到以「vibe知识大赏」命名的专用 skill 或模板。** 抖音话题里的作者、B 站同名视频的作者都没有公开提示词或 skill；电子智人的三部片也没有公开提示词。【实证：搜索为空 + 简介核对】
5. **最接近“拿来就能做知识讲解”的现成物**（按对我们的价值排序）：HyperFrames 官方的 `/faceless-explainer` skill（Apache-2.0，有 3 道人工关卡和一套“讲解结构 + 钩子策略”）；lemo-opuscar 的 Whiteboard Explainer 风格和导演手册（MIT）；mg-styles-15 的“贴纸人科普（回形针/林超风）”10 秒风格片和独立评审提示词（MIT）；hbg-douyin-code-explainer-video（抖音竖屏中文口播知识动画，但没有许可证文件，不能直接改来用）。【实证】
6. **Remotion 官方 skill 没有讲解片流程。** 它现在有 12 个 skill（含 captions、maps、saas 等），都是“怎么写对 Remotion 代码”，不管“怎么讲清一个知识点”。讲解流程要自己写，或者借 HyperFrames / lemo-opuscar 的结构。【实证】
7. **许可证要分两层看。** 合集仓库的 MIT / CC BY 4.0 只管策展人自己写的东西；里面收录的提示词版权仍归原作者（yihui 和 BeatAPI 的 README 都写明了这一点）。能放心拿来改的，是 lemo-opuscar、mg-styles-15、HyperFrames 这类**作者自己写的**模板。【实证】

---

## 1. 找到的库

### 1A. 提示词 / 案例合集（收录别人的作品和提示词）

| 名称 | ★ | 最后提交 | 许可证 | 收录量 | 知识类数量 | 一句话评价 | 证据 |
|---|---:|---|---|---|---|---|---|
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | 2,216 | 09-29 | MIT（仓库本身） | **475 个提示词文件**，其中 196 个标为“作者只公开了一部分”；README 精选 100 条 | 标为 explainer 的 62 条（38 条不完整），README 精选 16 条；多数是产品讲解，真正的科普约十几条 | 量最大，每条一个 `prompts/*.md` 加一份 `data/videos.json`。注意：每条上面的技术标签描述的是 **Skillry 网站的复刻版**，不是原片 | 实证 |
| [Li-Evan/awesome-opus-5.5-video-prompts](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts) | 9 | 09-27 | CC BY 4.0 | **334 条提示词，302 位作者**，原文加中英对照 | Explainers 31 条，History 20 条 | **查知识类最方便**：逐字原文、中文译文、作者自述的耗时和费用，还附一份“导演工具包” | 实证 |
| [zhuyansen/awesome-opus-5.5-video](https://github.com/zhuyansen/awesome-opus-5.5-video) | 94 | 10-06 | 无 LICENSE 文件 | **1,352 个作品**（原帖播放量 5,000 以上；含 Sonnet 5.5、Fable 5.5 预览版），其中 347 个有提示词，141 个是完整提示词 | 教育类 132 个，其中 45 个有提示词 | 覆盖面最新最全；提示词正文放在 [jasonzhu.ai](https://jasonzhu.ai/en/prompts/claude-opus-5-5) 的单页上 | 实证 |
| [athemeroy/awesome-opus-5-5-videos](https://github.com/athemeroy/awesome-opus-5-5-videos) | 484 | 10-03 | CC BY 4.0 | 1,511 个候选帖子，1,401 个视频文件，人工细看 168 例 | 教育/科普在纳入样本里至少 80 个文件，约 7%；“教育讲解”路径的 27 例中位时长 102 秒 | **研究型**：有统计、证据核验，还有 7 类自己写的中文模板（见第 3 节） | 实证 |
| [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) | 176 | 09-27（只提交过 1 次） | 无 | 18 条完整提示词，54 个案例 | “科普讲解”12 个案例 | 中文，适合入门；有“写法经验”和“技术路线”两张表 | 实证 |
| [opusvideo/awesome-claude-video](https://github.com/opusvideo/awesome-claude-video) | 180 | 10-06 | 无 | 约 59 个案例（按 README 小标题计），24 个附“实现指南” | Education & explainers 11 个 | 实现指南是**策展人自己补写的步骤**，不是原作者原话 | 实证 / 转述 |
| [chuspeeism/awesome-opus-5-5-videos](https://github.com/chuspeeism/awesome-opus-5-5-videos) | 93 | 09-27 | 自定义（GitHub 未识别） | 300 个案例，README 里可以直接播放 | “知识与教学”52 个 | 中文分类，适合按类别浏览 | 实证 |
| [LeaddeOpenLab/awesome-opus-5-5-video-prompts](https://github.com/LeaddeOpenLab/awesome-opus-5-5-video-prompts) | 5 | 09-30 | 无 | 398 条 | Explainers 53 条 | 每条标了需要准备的输入和工具 | 实证 |
| [HiAPIAI/awesome-opus-5-5-video-styles](https://github.com/HiAPIAI/awesome-opus-5-5-video-styles) | 0 | 09-30 | CC BY 4.0 | 425 条，按 12 种画风分 | “讲解与数据可视化”38 条（混进了不少作品集） | 每种画风配一段可直接贴的“风格配方”；作者是 API 中转商，带推广 | 实证 |
| [X-RayLuan/awesome-opus-5-5-video-prompts](https://github.com/X-RayLuan/awesome-opus-5-5-video-prompts) | 5 | 10-01 | MIT | 83 例 | 讲解、广告、动效放在同一类 | 带视频产品引流 | 实证 |
| [xianyu110/awesome-claude-opus-5.5](https://github.com/xianyu110/awesome-claude-opus-5.5) | 2 | 10-06 | 无 | 精选 114 例，完整清单 1,019 例 | 有“讲解动画”专栏（AI 简史、随机微分方程、芯片简史、导数课等） | 中文 | 实证 |
| [jacobbubu/claude-opus-5-5-js-animation-research](https://github.com/jacobbubu/claude-opus-5-5-js-animation-research) | 13 | 09-28 | 无 | 30 例（只收 JS/HTML 浏览器动画，按 X 观看量排） | 少量（浏览器原理 40 秒、AI 简史、东方文明 3D、手绘科普） | 仓库里存了 MP4，中文逐例记录 | 实证 |
| [TripoGrowthLab/awesome-opus-5-5-prompts](https://github.com/TripoGrowthLab/awesome-opus-5-5-prompts) | 38 | 10-02 | 自定义 | 63 例 | 几乎没有 | 以 3D 和游戏为主，和我们关系不大 | 实证 |
| [BeatAPI/awesome-opus-5-5-videos](https://github.com/BeatAPI/awesome-opus-5-5-videos) | 4 | 09-28 | 自定义（文档 CC BY 4.0，代码 MIT） | 20 条，**全部转引自 yihui 仓库的某一个版本** | 讲解 5 条（含导数课） | 不存提示词原文，也没有复现；自己声明“给链接不等于允许转载”。价值低 | 实证 |
| [OpenVGLab/awesome-opus5.5-frontend-showcases](https://github.com/OpenVGLab/awesome-opus5.5-frontend-showcases) | 8 | 09-24 | MIT | 前端作品清单（中文） | 少量（论文宣传片、水循环、中华五千年等） | 只收发布后头几天的作品 | 实证 |
| [openzhenzhen.com](http://openzhenzhen.com/) 提示词画廊 | — | B 站视频称 10-06 新增 Opus 5.5 板块 | — | 未统计 | 首页没看到集中的知识类栏目 | 多是 X 帖子的中文转述，混有图像提示词 | 实证（页面）/ 转述 |

**补充两篇非仓库的资料**
- [HF 博客 karmen-beatapi](https://huggingface.co/blog/karmen-beatapi/how-to-make-videos-with-claude-opus-5-5)：第二版已经拆过。新补一点：它按 LaunchVideo 报告的“每片约 9 万输入、1.5 万输出 token”估算，按 Anthropic 标价每片约 0.66 美元；长片建议分场景渲染再用 ffmpeg 的 concat 拼接；配音推荐 Kokoro-82M 或 ElevenLabs。作者 BeatAPI 是 API 中转商。【实证（博客原文）】
- HF 上另有一组 [VulcanFeynman 的“opus 5.5 video guide”](https://huggingface.co/blog/VulcanFeynman/opus-55-living-screencast-case-package)，讲怎么把 lemo-opuscar 的样片做成可复现的“证据包”（锁版本、留提示词、留字幕和词级时间戳、不把演示数字说成基准测试）。对知识类帮助不大，但“交付时说清楚哪些没跑过”这条值得学。【实证】

**熠辉 IndieDev 就是 yihui-dev**：B 站 [BV1acah6RE5c](https://www.bilibili.com/video/BV1acah6RE5c/) 简介说作者花了约 3,000 美元 API 费用复刻全网高难特效，并把提示词和工作流开源，给的链接就是 `yihui-dev/awesome-opus5-5-videos`。【实证】这个仓库在 GitHub 新仓库周榜排到第 6（[gitnova](https://gitnova.dev/en/r/yihui-dev/awesome-opus5-5-videos)）。【转述】

### 1B. skill / 模板 / 流水线（能直接拿来做视频）

| 名称 | ★ | 最后提交 | 许可证 | 做什么 | 和知识讲解的关系 | 证据 |
|---|---:|---|---|---|---|---|
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 57,718 | 10-06（v0.8.137） | Apache-2.0 | HTML 写视频、确定性渲染；带 21 个 agent skill | **`/faceless-explainer`**：把任意文字讲成一支讲解片，画面全是排版、抽象图形、图解、数据可视化，有 3 道人工关卡（见 4.2） | 实证 |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 4,860 | 10-05 | 仓库无 LICENSE | 12 个 skill：best-practices、create、markup、studio、render、maps、captions、saas、interactivity、docs、upgrade、multimedia | **没有讲解流程**，只管把 Remotion 代码写对。安装：`npx skills add remotion-dev/skills` | 实证 |
| [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | 64,530 | 10-03 | **AGPL-3.0** | 12 条制作流水线，100 多个工具 | 有 Animated Explainer 流水线：调研 → 方案 → 脚本 → 分场景计划 → 素材 → 剪辑 → 合成，创意节点停下来等人批准；默认偏 AI 生图 | 实证 |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 1,269 | 10-05 | MIT（演示素材另有许可） | 43 种影片风格，每种一份 `STYLE.md` 加一支纯代码样片；附 `DIRECTOR.md`、`TECHNIQUE.md` | 含 **Whiteboard Explainer**（白板讲解）、Data Storytelling（数据叙事）、Isometric Infographic（等距信息图）三种讲解风格 | 实证 |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | 313 | 10-05 | MIT | 15 种 10 秒动效风格，各附提示词和源码；`template.md` 教你写新风格，`rubric.md` 是独立评审提示词 | **#07 贴纸人科普（回形针/林超风）**，中国知识区的标准包装 | 实证 |
| [Kianzzz/xilo-opus-video](https://github.com/Kianzzz/xilo-opus-video) | 26 | 09-28 | MIT | 中文 skill：先给 3 个拉开差别的方案，每个配一张关键帧或 2～4 秒小样，你选定后写成 `brief.md`，再逐镜制作、逐镜自检 | README 写明适合知识讲解、历史回顾、数据故事 | 实证 |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | 567 | 09-15 | MIT | 浏览器动效 skill | 有 6 种讲解风格（视觉新闻、复古素描、卡通拼贴、卡通舞台等），支持 16:9 和 9:16，30～120 秒 | 实证 |
| [feitangyuan/onetake](https://github.com/feitangyuan/onetake) | 1,717 | 09-29 | **PolyForm Noncommercial（禁止商用）** | 一镜到底的连贯动效，用脚本给每个镜头交界打“承接分” | 偏产品片；“画面要从上一个画面里长出来”的思路可以借鉴，代码不能商用 | 实证 |
| [Mr-funny/hbg-douyin-code-explainer-video](https://github.com/Mr-funny/hbg-douyin-code-explainer-video) | 30 | 07-30 | **无 LICENSE** | 中文长文案 → 1080×1920 抖音竖屏代码动画口播，男女双人对话，全局 Whisper 对齐 | 最接近“抖音知识口播”（见 4.3） | 实证 |
| [vibe-motion/remotion-code-motion-explainer](https://github.com/vibe-motion/remotion-code-motion-explainer) | 32 | 07-27 | MIT | 中文，Remotion 连续空间讲解，63 个可检索镜头条目 | 适合原理、流程类，偏科技和产品 | 实证 |
| [BusyBee3333/animated-explainer-skills](https://github.com/BusyBee3333/animated-explainer-skills) | 6 | 07-13 | MIT | Kurzgesagt 风格的单 HTML 讲解片；带“留存审查”、0.5 秒精度的文字重叠检测、按每秒 2.5 个英文词写旁白 | 方法论有用，星数很少 | 实证 |
| [tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills) | 117 | 09-27 | MIT（部分代码来自 ClaudeAnimationBase） | 2 个风格 skill：水彩手绘动画、动态排版 | 不是讲解类 | 实证 |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | 883 | 09-24 | MIT | p5.js + p5.brush 手绘角色动画起步包，31 种表情 | 想要手绘角色时可用 | 实证 |
| [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills) | 431 | 10-06 | 自定义 | 252 个视频 skill 仓库，附安全评级 | “讲解”类 41 个，是找新 skill 的入口 | 实证 |

其他讲解类 skill（都在上面的目录里，一行带过）：[vincentsch/explainroo](https://github.com/vincentsch/explainroo)（★463，MIT，本地 Kokoro 配音加 Whisper 词级对时）、[iart-ai/explainer-video-skills](https://github.com/iart-ai/explainer-video-skills)（★29，MIT）、[iart-ai/javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills)（★16，MIT，把“每帧都用 JS 画”打包成 skill）、[sunxiayi/make-blender-education-video-skill](https://github.com/sunxiayi/make-blender-education-video-skill)（★48，MIT，强调事实核查）、[Aaryan-Kapoor/video-production-skill](https://github.com/Aaryan-Kapoor/video-production-skill)（★16，MIT，从调研到归档的教育视频流程）、[znyupup/knowledge-explainer-skill](https://github.com/znyupup/knowledge-explainer-skill)（★45，MIT，markdown 文稿转 Remotion 讲解片，2026-04）、[shuyicc/MathLens](https://github.com/shuyicc/MathLens)（★363，无许可证，数学题讲解，Manim）、[Alisa0808/vox-director](https://github.com/Alisa0808/vox-director)（★2,147，MIT，Vox 纸拼贴风，但画面靠 AI 生图）。第二版已经评估过的 hi-nikola、runesleo、video-talkcraft 这里不再重复。【实证】

---

## 2. 知识讲解 / 科普类提示词逐条拆解

先看总表，再看逐条要点。“审批节点”指提示词里有没有要求停下来等人确认。

### 2.1 总表

| # | 作品（作者） | 主题 | 时长 | 画幅 | 视觉风格 | 结构要求 | 技术约束 | 配音 | 审批节点 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 光子之旅（@AstroTheWizard） | 光子从太阳核心走出来 | 精确 60 秒 | 1920×1080，60fps | 童话绘本风，光子有性格 | 每场景一个强形式点子；笑点、拟声、小角色、回扣；地球同期大事并排 | 纯 JS 逐帧；随机游走要真模拟；真实数字并说明不确定性 | 自写稿 + 最好的 TTS，烧录字幕，原创配乐，逐动作音效，混音压低音乐 | **无**（明确要求全自主），用自检回路代替 |
| 2 | AI 简史 Attention→AGI（@kimmonismus） | 从 2017 年论文到 AGI | 精确 180 秒（5,400 帧） | 1920×1080，30fps | “电影式随笔”，深色底 + 一个随时代变化的暖色 | 9 段秒级大纲；贯穿母题是一个发光的词元 | Remotion，每场景一个 composition；不用外部图片；先写分镜文件，每场景渲 3～4 张静帧 | **无旁白**，只留一个配乐插槽 | 无，全自主；交付决策摘要和不确定事实清单 |
| 3 | 中华文明史（@dotey，宝玉） | 中国历史编年 | 约 3.5 分钟（转述） | 未写（推断 16:9） | 宣纸白描与玄底泥金交替，纹样随时代演变 | 每镜一个书法关键词加一幅线稿；分卷，卷间盖印转场 | 逐帧渲染 + ffmpeg；**音乐当时钟**，切点全踩拍；先定拍点网格和分镜表 | 未要求旁白 | 未要求人工确认；交付前核对年代 |
| 4 | 什么是 Transformer（@dotey） | Transformer 与注意力机制 | 成片约 12 分钟（转述） | 未写 | 未写，“给我惊喜” | 深入浅出，高中生能懂，既讲全局也讲细节和数学 | 用 JS；允许装任何工具、联网检索 | 未写（模型自选 Edge TTS，转述） | 无 |
| 5 | 大气环流（@akokoi1，WY） | 高中地理知识点 | 成片约 4 分 48 秒（转述） | 未写 | 线稿，轻松有趣 | 只要求引人入胜 | 最终要能直接导出 | **TTS**：接口文档放 `TTS.md`，密钥和音色放 `.env`；中英双语字幕；关掉 TTS 水印 | 无（准备工作是事先搭好 TTS 接口） |
| 6 | LLM 小怪兽（@eyishazyer） | 大语言模型怎么工作 | 40 秒 | 1080×1080 方形 | 深色底、柔光、圆滚滚大眼小生物 | **逐秒分段**：钩子 → 词元 → 嵌入 → 注意力 → 预测 → 收尾 | Remotion，SVG/Canvas 绘制；Python 合成配乐 | 开源 TTS，每段旁白句子写好了 | 无 |
| 7 | 足球 9 条规则 AR 分析（@lukasersil） | 体育规则 | 约 68 秒 | 1920×1080，30fps | 电视转播 AR 分析 + PS2 时代低多边形人物 | 开场 3.5 秒 → 每条规则 6～8 秒 → 结尾；每条“实况 → 冻结 → AR 测量 → 判罚面板” | Three.js；`window.renderFrame(t)` 纯函数；渲染脚本有静帧、视频、时间轴三种模式；着色器防 NaN | 无旁白；Python 合成音乐和音效，按时间轴文件对点，−14 LUFS | 半自主：要求**边做边给检查帧** |
| 8 | Google 30 年史（@aakashbuildsAI） | 公司史 | 2～3 分钟 | 16:9，1080p（能 4K 就 4K），30fps | 扁平动效，品牌四色 | 前 3 秒钩子；按年代分章；每章一个意外事实；贯穿母题是搜索框 | 角落年份计数；各年份必须用当时真实 logo | 自信、好奇的旁白；音乐渐强，旁白时压低 | 无；**准确性规则**：日期数字要核对，不编数据，片尾加声明 |
| 9 | 贴纸人科普，回形针/林超风（mg-styles-15 #07） | 示例题：一部手机里藏着多少种元素 | 精确 10.000 秒 | 1920×1080，30fps（可改竖屏） | 实拍抠图加粗白边成“贴纸”，扁平图标，精确图表，超大画布加长缓动镜头 | 0.5 秒内钩子，60～75% 处高潮，结尾画面停 0.8～1.2 秒；每一拍都出新元素 | 确定性渲染；素材只用可商用许可，并记进 `CREDITS.md`；不用真实品牌；中文文案和标点要地道 | 无旁白；科技讲解底乐、UI 点击、计数滴答 | 无人工关卡；配套**独立 AI 评委**打分再改一轮 |
| 10 | 白板讲解 Whiteboard Explainer（lemo-opuscar 风格文件） | 科学/原理类，60～120 秒 | 60～120 秒 | 未限定 | 一块光面白板，笔画按书写顺序写出，没有手 | 镜头在白板上移动、不剪切；术语在旁白说到时恰好写完 | 最多 3 种笔色且含义固定；字幕每行不超过 44 字符；底部 12% 留给字幕 | 人声在最上层，−14 LUFS；每一笔都有声音 | 由 skill 流程管（先写方案、出风格帧） |
| 11 | 导数概念课（@LinearUncle） | 导数 | 约 7.5 分钟（转述） | 未写 | Manim | 通俗易懂，有例子，引人思考 | 指定用 Manim | **edge-tts** | 无 |
| 12 | 光合作用（@rainwishyt） | 给 11 岁孩子讲光合作用 | 约 102 秒（转述） | 横屏 | 手绘风 | 对孩子要有视觉吸引力 | 要求用 JS；要可下载的成片 | 未写（模型自选 Kokoro，转述） | 无 |
| 13 | 递归（@emollick） | 递归 | 约 75 秒（转述） | 未写 | **每一段换一种截然不同的风格** | 自我指涉，快节奏 | 未写 | 未写 | 无 |
| 14 | 黎曼猜想（@hyuki） | 黎曼猜想 | 约 30 秒 | 未写 | 未写 | 无 | 用 JS；**明确禁止数学错误** | 后来另用别的模型补了旁白（转述） | 无 |
| 15 | 令牌桶限流（@ParkerRex） | 限流算法 | 约 18 秒（转述） | 未写 | 动态图解 | 无 | **只用 canvas，不用库，每帧是时间的纯函数** | 无 | 无 |
| 16 | Black-Scholes 分屏（@goodside） | 金融公式 | 1 分钟 | 未写 | 右半讲公式，左半放仿跑酷游戏 | 分屏留注意力 | 未写 | 右半要旁白 | 无 |

### 2.2 逐条要点（按对我们的参考价值排序）

**① 光子之旅** —— 【实证】原文：[yihui 仓库提示词文件](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/astrothewizard-618782.md)、[Li-Evan 收录](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/explainer.md#journey-of-a-photon-storybook-explainer)，原帖 [x.com/AstroTheWizard](https://x.com/AstroTheWizard/status/2103629247751618782)。
- 结构：开头说清“我离开电脑了，你全程自己做，不许停下来问，最后告诉我你做了哪些决定”。然后依次写主题、风格（拿 The Pudding 和 3Blue1Brown 当标杆，强调“每个场景一个强形式点子、一套统一的设计系统”）、**教学和准确性要求**（随机游走要真的跑模拟、给真实数字、对估计值的不确定性要说实话、把那十万年里地球上发生的事和光子时间线并排）、交付规格（精确 60 秒，60fps），以及声音五件套（自写旁白加 TTS、烧录字幕、随场景变化的原创配乐、逐动作对齐的音效、旁白时压低音乐并按流媒体响度做母带）。
- 质量要求：建立验证回路，包括每个场景渲静帧挑毛病、逐帧检查转场、**用数字测量混音**、改完重渲；最后交源码。
- 作者自述：一条提示词，约 45 分钟，没有额外花钱。【转述，Li-Evan】
- 可学的：“准确性”写成了可执行的动作（真模拟、真数字、标不确定性），而不只是一句“要准确”。

**② AI 简史 Attention→AGI** —— 【实证】原文是 [jasonzhu.ai 转录的作者回复](https://jasonzhu.ai/en/prompts/claude-opus-5-5/2102844654169575547)（4,307 字符），原帖 [x.com/kimmonismus](https://x.com/kimmonismus/status/2102844654169575547)。
- 结构：角色（动效设计师兼创意总监）→ 片子定位（电影式随笔，明确说不要幻灯片、不要时间轴信息图）→ 技术搭建（Remotion，每场景一个 composition，由一个总 composition 串起来）→ **先写 `STORYBOARD.md`，再逐场景搭，每搭完一个场景渲 3～4 张静帧挑问题** → 贯穿母题（一个发光的词元，随着时代先“看见”其他词，再依次获得声音、感官、推理能力、“手”，最后变成一个问题）→ 9 段秒级大纲（冷开场、2017 年论文、规模化、ChatGPT、多模态、推理模型、工具和智能体、走向 AGI、回到一个词元）。
- 工艺规则：年份、人名、论文名要对，**不确定就删，并列进 `NOTES.md`**；屏上同时最多约 8 个词，每段文字停留至少 2.5 秒；只用一种标题字体加一种等宽字体；用弹簧缓动，不用线性；转场要从内容里长出来，不用通用淡入淡出；疏密交替，推理段和 AGI 段要留呼吸。
- 声音：不要旁白，只留一个 `<Audio>` 插槽，找不到配乐文件就静音渲染。
- 结果：约 7,400 行 React/TS，约 1 小时，用掉周额度的 7%。【转述，joeseesun 案例表】

**③ 中华文明史** —— 【实证】原文见 [Li-Evan history.md](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/history.md#epic-chronicle-of-chinese-civilization)，原帖 [x.com/dotey](https://x.com/dotey/status/2103964025683927166)。
- 这是**最值得中文创作者借鉴的审美写法**，只有 6 行中文，却把“视觉系统”写得很具体：
  - 音乐当时钟：五声调式，乐器从骨笛、编钟一路演进到管弦，BPM 随年代加快，所有切点踩拍。
  - 两种画风交替：宣纸白描和玄底泥金。
  - 每卷一个主色，配一套随时代演变的纹样（从彩陶纹到回纹的六段序列）。
  - 每个镜头一个按词组出现的书法大字关键词，配一幅线稿。
  - 全片有 HUD：左上朱印卷号，右侧竖排朝代名，底部卷轴时间尺和年份计数。
  - 卷与卷交界：朱印盖下，配鼓钟重击。
  - 工作顺序：先定拍点网格和分镜表，再渲染。
  - 红线：地图只画示意；不画近现代真实人物；年代核对后再交付。
- 可学的：用**纹样和乐器的演进**表示时间流逝，用固定 HUD 让观众随时知道“现在在哪”。这比写“要有中国风”有用得多。

**④ 什么是 Transformer（以及它的复制品“什么是 Git”）** —— 【实证】原文 [Li-Evan explainer.md](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/explainer.md#what-is-a-transformer-a-12-minute-explainer)，原帖 [x.com/dotey](https://x.com/dotey/status/2103683057689522564)。
- 只有四句：用 JS 做视频，主题是什么；深入浅出，让高中生也能看懂，宏观讲清楚，细节也要有（注意力机制、一点数学）；可以用任何工具、可以装工具、可以联网；给我惊喜。
- 结果：12 分钟，xhigh 一次成片，模型自己找了免费的 Edge TTS，用 Remotion 加 KaTeX 排公式。【转述，Li-Evan 描述】
- **同一模板被别人直接改题复用**：@Yunn260414 换成“什么是 Git”，加了“0 基础能看懂、介绍常用指令、要有声音、中文讲”，成片近 7 分钟（[原帖](https://x.com/Yunn260414/status/2104044910769016888)）。【实证】
- 可学的：中文短 brief 的最小有效组合是**受众 + 深度要求 + 工具授权 + 留创作空间**。缺点是事实、节奏、画风全靠运气。

**⑤ 大气环流（以及物理竞赛题）** —— 【实证】原文 [Li-Evan](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/explainer.md#atmospheric-circulation-lesson-in-line-art)、[joeseesun prompts/09](https://github.com/joeseesun/opus-video-prompts/blob/main/prompts/09-atmospheric-circulation-tts.md)，原帖 [x.com/akokoi1](https://x.com/akokoi1/status/2102606609574941028)。
- 一句话任务加一套**事先准备好的配音接口**：把 TTS 厂商（豆包、智谱、海螺、千问都可以）的文档存成 `TTS.md`，`.env` 里写 `APIKEY` 和 `VOICE`；提示词里告诉模型去哪读；如果接口有关水印的参数就关掉；字幕中英双语；成片要能直接导出。
- 安全做法：在 `.claude/settings.json` 里加一条禁止读取 `./.env` 的规则，Claude 就看不到密钥原文。【转述，joeseesun / opusvideo 实现指南】
- 作者自述：26 分钟，token 消耗很低，订阅制下每支约 0.2～0.5 美元；同一提示词把知识点换成具体题目，就能做物理竞赛题讲解。【转述，Li-Evan / joeseesun】
- 可学的：**先把工具接口搭好，再给一句话任务**，是低成本批量出片的关键。athemeroy 也提醒：字面上一句话，不等于没有预置条件。【转述】

**⑥ LLM 小怪兽** —— 【实证】原文 [Li-Evan](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/explainer.md#cute-creatures-explain-how-llms-work)，原帖 [x.com/eyishazyer](https://x.com/eyishazyer/status/2103454597641891922)。
- **逐秒分段写法的范本**：40 秒分成 6 段，每段都写了画面动作、一句旁白和一个“可爱细节”。比如词元飞进来时每个都有小脸、会挥手；注意力段出现好几只小生物，各自代表一个注意力头，互相点头；预测段用词泡大小表示概率。
- 技术段把栈写死：Remotion，SVG 加 Canvas，开源 TTS，Python 合成轻快配乐，1080×1080，导出 MP4，代码要能换内容重跑、方便加新角色。
- 可学的：结尾**把新词喂回循环**，回扣全片机制。“概念讲完要回到开头的画面”这一点和电子智人的首尾呼应是同一招。

**⑦ 足球 9 条规则 AR 分析** —— 【实证】原文 [jasonzhu.ai 转录](https://jasonzhu.ai/en/prompts/claude-opus-5-5/2105922894924501283)（11,085 字符，捷克语），原帖 [x.com/lukasersil](https://x.com/lukasersil/status/2105922894924501283)。
- **最工程化的知识类提示词**，几个可以直接借的设计：
  - **参数区**：开头单列一段“参数”（运动项目、规则清单、语言、时长、格式、画风、队服配色），并注明“换一项运动只改这一段和剧本段”。这就是可复用模板的写法。
  - **确定性契约**：场景和 HUD 都是时间的纯函数，帧与帧之间不保存状态；渲染脚本有三种模式：出检查静帧、出视频、导出时间轴。
  - **阅读时间**：动作按真实速度走，分析段用变速函数拉长 1.5～2.1 倍，保证每条规则在屏上 6～8 秒、字都读得完。
  - **可读性硬指标**：标题、说明、标签、技术行都规定了最小字号；文字一律压在深色底上；行高留够，不切掉变音符号；标签不许互相遮挡，也不许压在底部图形下面。
  - **颜色语义**：青色表示测量，红色表示违规，琥珀色表示球和区域，绿色表示有效判罚。
  - **声音按时间轴文件对点**，改了片长也不会错位。
  - **工作方式**：先跑通渲染管线；每次改动都渲关键时刻的静帧，并按 100% 裁切检查文字；用联系表（ffmpeg 的 tile 滤镜）看全片；最后用 ffmpeg 解码和 ffprobe 校验文件；进度写进 `PROGRESS.md`，中断了能接着做。
  - 已知坑：着色器出 NaN 会在辉光里扩散成大片黑块，必须做防护。
- 可学的：对“10 分钟讲透一个概念”的片子，**阅读时间变速**和**可读性硬指标**都可以直接搬。

**⑧ Google 30 年史** —— 【实证】原文 [Li-Evan history.md](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/history.md#history-of-google-19962026-explainer)，原帖 [x.com/aakashbuildsAI](https://x.com/aakashbuildsAI/status/2104141972135121079)。
- 结构完整的“纪录片式讲解”brief：角色 → 交付规格 → 视觉风格（明确说不要幻灯片和廉价转场）→ **贯穿母题**（每章开场在搜索框里敲年份、光标闪、回车进场景）→ 最重要的一条规则（每个年份必须显示当时真实使用的 logo，并给出各版 logo 的起止时间）→ 分章大纲 → 语气（短句，**每章一个意外事实**）→ 声音（音乐渐强，旁白时压低）→ **准确性规则**（日期和数字要对照现行来源核对，不编统计，片尾加“与该公司无关”的声明）。
- 可学的：把“最容易翻车的一类事实”（这里是 logo 年份）单独列成规则，并给出核对依据。我们这边对应的是书中原话和心理学术语。

**⑨ 贴纸人科普（回形针/林超风）** —— 【实证】[mg-styles-15 prompts/19-paperclip.md](https://github.com/Vincentwei1021/mg-styles-15/blob/main/prompts/19-paperclip.md)（仓库作者自己写的，MIT）。
- 这是“风格提示词”的标准模板：**通用部分**（角色、工作方法、规则、工艺清单、自评、交付）每种风格都一样，**专属部分**只填四段：风格名、固定输出规格、建议技术路线、创意种子（按秒写钩子、升级、高潮、结尾画面，加 3～6 个具体色值）、标志特征和关键技法（要写成可检验的，比如具体的缓动曲线参数和错峰帧数，而不是“动效要有弹性”）。
- 本条的标志特征：实拍抠图统一加 8～12px 白描边；超宽画布上用长缓动镜头平移缩放、一镜串起多个信息点；柱状图生长、数字滚动、路径描边生长；**每一句解说都驱动一个新元素入场**；2～3 色加等线字体，保持严肃感。
- 配套 `rubric.md`：另开一个 AI 当评委，抽联系表和关键帧，按 7 个维度打 1～10 分（风格还原、创意、动作工艺、版式字体、质感、声画同步、技术），给出 5～10 条按影响排序、带时间码的修改意见；再把意见贴回制作会话改一轮。原片终评 7.71/10，改了两轮。【实证】
- 可学的：**“通用部分 + 风格专属部分”的拆法**，和**独立评审再改一轮**。

**⑩ 白板讲解 Whiteboard Explainer** —— 【实证】[lemo-opuscar styles/whiteboard/STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/whiteboard/STYLE.md)、[DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md)（MIT）。
- 风格文件把“白板讲解”拆成 11 节：本质和不是什么、材质渲染、颜色逻辑（最多 3 种笔色且含义全片固定）、字体和字幕（单线手写体；字幕每行最多 44 字符，底部 12% 永远留给字幕，停留时长取“1.8 秒”和“语音时长加 0.6 秒”中较大的那个；**术语在旁白说到时恰好写完**）、运动质量、**镜头语法表**（拉远表示尺度，跟着笔走表示一个想法引出下一个，静止表示“现在读”，甩到新区域表示“但是”，回到旧区域表示呼应，全板视图表示总结）、声音、原生招式（按笔顺写公式、磁贴移动、板擦倒带、两支笔对比、旧课的残影、全板视图）、媒介的坑（一支笔任务太多会越拖越晚、TTS 语种和音素不匹配会念错，要用语音识别复核）、引擎 API、变化空间（证明式、辩论式、时间线式；几种开场和结尾）。
- `DIRECTOR.md` 的导演规则：前 3 秒必须有钩子；结尾要呼应开头；在情绪最高点放一个只有这种媒介能做到的招式；先写 3 个候选结构再选一个；要有分镜表、逐秒节拍表、音乐提示表、音效表；至少两处静默；至少两次用声音做转场；交付前和样片比较 6 个维度，至少 4 个要不同（防止千篇一律）；有版权红线一节。
- 可学的：**镜头语法表**可以直接翻成我们手绘风的“动词表”；“术语说到才写完”正是电子智人那种“每句话一个画面”的机制。

**⑪～⑯ 一句话类（各有一个可借的点）** —— 【实证】原文均见 [Li-Evan explainer.md](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/explainer.md) 和 [HiAPIAI explainer.md](https://github.com/HiAPIAI/awesome-opus-5-5-video-styles/blob/main/styles/explainer.md)。
- ⑪ 导数课：一句话指定渲染器（Manim）、配音（edge-tts）和教学目标（通俗、有例子、引人思考）。athemeroy 提醒：这类片的公式和朗读质量要人检查。【转述】
- ⑫ 光合作用：受众写成具体年龄（11 岁），再加“对孩子要有视觉吸引力”；模型自己选了 HyperFrames、Kokoro、ffmpeg。【转述，作者回复】
- ⑬ 递归：用**形式本身表达概念**（每段换一种风格，自我指涉）。适合“自指”这类题目，电子智人的《自指》就是这个方向。【推断】
- ⑭ 黎曼猜想：短提示词里也明确写了“不许有数学错误”。
- ⑮ 令牌桶：把确定性契约直接塞进一句话（只用 canvas、不用库、每帧是时间的纯函数）。作者称 193 秒、0.7 美元。【转述】
- ⑯ Black-Scholes 分屏：一半画面讲知识，一半放“保注意力”的游戏画面，是短视频平台的留存套路；athemeroy 指出公式讲解的准确性没有验证。【转述】

**其他值得知道的知识类提示词（只列线索）**：@hanifproduktif 厄尔尼诺纪录片风、@nishanthps 给孩子讲火山、@Tz_2022 密码与通行密钥（代理承认没有真正试听配音，【转述，athemeroy】）、@0xpai_eth 通胀科普（作者称代理复用了本地项目里的声音、字幕规范和已有系列风格，【转述】）、@sundyme GitHub 入门（中文）、@mellow_neet2000 从恐龙到绳纹时代（日文三行）、@moyingy66 以小三角龙视角讲恐龙进化（中文一句）。都在 zhuyansen 的 education 列表和 Li-Evan 的 history/explainer 文件里。

---

## 3. 「好提示词」的共同要素，以及模板之间的差异

### 3.1 共同要素清单（可以当写提示词时的检查表）

| # | 要素 | 写成什么样才有用 | 谁这么做了 | 证据 |
|---|---|---|---|---|
| 1 | **交付规格** | 精确时长（写到帧数更好）、分辨率、帧率、画幅、音频格式、响度（−14 LUFS，峰值 −1 dBTP） | 光子、AI 简史、足球、贴纸人科普 | 实证 |
| 2 | **受众和学习目标** | 写具体：高中生、11 岁、零基础；最好写“看完能解释哪三件事” | Transformer、光合作用、Git；athemeroy 教育模板 | 实证 |
| 3 | **事实规则** | 只用给定或核实过的事实；不确定就删，并列进 `NOTES.md`；数字和日期要核对；不编统计；不画真实人物；必要时加声明 | AI 简史、Google 史、中华文明史、光子；HF 模板要求只用 brief 里的事实 | 实证 |
| 4 | **叙事骨架** | 钩子（前 3 秒，动效片要 0.5 秒）→ 一句话论点尽早出现 → 3～6 个机制或步骤 → 真实数字和具体例子 → 高潮放在约 60～75% → 结尾回扣开头 | 贴纸人科普、DIRECTOR.md、HyperFrames story-design、LLM 小怪兽 | 实证 |
| 5 | **贯穿母题** | 一个随剧情演化的视觉符号（会成长的词元、每章开场的搜索框、拟人的光子） | AI 简史、Google 史、光子 | 实证 |
| 6 | **画面纪律** | 一个镜头只讲一件事；旁白说到才出现；屏上字数上限加最短停留时间；颜色有固定语义；**列禁用清单**（发光、粒子、交叉淡化、渐变等） | AI 简史、足球、白板、Li-Evan 导演工具包 | 实证 / 转述 |
| 7 | **确定性渲染契约** | 画面是时间 t 的纯函数；随机数用种子；不用实时钟、计时器、CSS 过渡；渲染脚本能单独出静帧 | 令牌桶、足球、贴纸人科普、HF 模板 | 实证 |
| 8 | **声音** | 配音来源和密钥放在哪；字幕烧录；配乐随段落变化；音效对齐动作；旁白时压低音乐；按节拍网格或时间轴文件对点 | 光子、大气环流、中华文明史、足球 | 实证 |
| 9 | **先出方案再写代码** | 分镜表或节拍表，加 4～10 张关键静帧，确认后再动画化 | HF 模板、中华文明史、xilo（3 个方案）、HyperFrames 关卡、Li-Evan 六步法第 5 步 | 实证 / 转述 |
| 10 | **自检回路** | 每场景静帧、联系表、转场逐帧、测响度、ffprobe 校验、写进度文件；最好另开一个 AI 当评委 | 光子、足球、AI 简史、mg-styles 评审 | 实证 |
| 11 | **交付物清单** | MP4、源码、讲稿、来源清单、字幕文件、决策说明、诚实的三条弱点 | AI 简史、贴纸人科普、athemeroy 教育模板 | 实证 |
| 12 | **参数区** | 把题目、时长、语言、画风这些会变的东西集中放一段，换题只改这一段 | 足球（参数段）、mg-styles `template.md`、athemeroy 方括号模板 | 实证 |

另外几条来自社区总结，不是单个提示词：
- **点名不要的样式**，不要只说“别有 AI 味”：Anthropic 的 Opus 5.5 官方提示词指南这么建议，原因是笼统的说法只会让模型从一种默认风格换到另一种默认风格。【转述：[数位时代](https://fc.bnext.com.tw/articles/view/4952)、[知乎](https://zhuanlan.zhihu.com/p/2087834896546934870)；官方原文链接见 [platform.claude.com](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)，未直接读取】
- **专业提示词的六段结构**（据称收藏最多的 @twoclipping 模板）：先列要向你索要的输入，再写方向加禁用清单，再写节拍网格和镜头链，再写工程规则（单 HTML、一切由 `seek(t)` 计算），再写已知坑，最后写“先要输入、先给方案”。【转述，[Li-Evan 导演工具包](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/guide/director-toolkit.md)】
- **“一次成片”的七个通病**（@DavidKPiano）：太快、特效太多、运动方向乱、没有焦点、缓动千篇一律、没有编舞、动而无意义。对应的修法是放慢到 0.7 倍、加禁用清单、每场景只用一个运动轴、点名每场景的主角、用带一点回弹的弹簧、给节拍网格、说清每个动作要解释什么。【转述，同上】
- **旁白字数预算**：OpenMontage 的经验是 45 秒约 110 个英文词、90 秒约 225 个；BusyBee 按每秒 2.5 个英文词写。【实证，[OpenMontage PROMPT_GALLERY](https://github.com/calesthio/OpenMontage/blob/main/PROMPT_GALLERY.md)、[BusyBee README](https://github.com/BusyBee3333/animated-explainer-skills)】中文大约每秒 3.5～4.5 个字（【推断】，要用我们自己的录音实测）。
- **HyperFrames `/faceless-explainer` 的讲解方法论**（[story-design.md](https://github.com/heygen-com/hyperframes/blob/main/skills/faceless-explainer/references/story-design.md)）【实证】：
  - 文章是信息堆，视频是“带人理解”的过程；**最常见的失败是按原文段落顺序复述**。
  - 动笔前先提炼六样：受众、知识缺口或利害、一句话论点、3～6 个支柱、证据、落点。
  - 从四种结构里选一种：概念讲解、步骤/机制、清单、故事讲解。
  - 从九种钩子里选一种：惊人数字、反问、反直觉、说中痛点、具象比喻、概念命名、直接点名观众、想象情境、利害后果。**不许用泛泛的定义开场**，论点要在第二拍之前出现。
  - 每帧旁白 1～2 句、约 6～20 个英文词，按短语切开，让画面在旁白说到某个东西时才出现；可以有无旁白的静默帧。

### 3.2 模板之间的差异（几条主要的分歧轴）

| 维度 | 一端 | 另一端 | 怎么选（我们的判断） |
|---|---|---|---|
| 长度 | 一句话 brief（50～200 字符） | 规格书（4,000～11,000 字符） | 一句话适合试题目和抢热点；要稳定系列化出片就得写规格书或做成 skill。【推断】 |
| 自主程度 | 全自主，不许提问（光子、AI 简史） | 分阶段审批（HF 模板先给节拍表和 4 张关键帧；HyperFrames 3 道关卡；xilo 先给 3 个方案） | 系列片要走审批；单支试验可以全自主加自检。【推断】 |
| 渲染栈 | 单 HTML + `seek(t)` / Canvas | Remotion / HyperFrames / Manim / Three.js / Python 逐像素画 | 中文知识区的头部作品各种栈都有；我们已经选了 Remotion，**没必要换**（与第二版结论一致）。【推断】 |
| 节奏由谁驱动 | 旁白驱动（讲解片的主流） | 音乐节拍驱动（中华文明史、AI 简史无旁白） | 讲解长片应该由旁白驱动；音乐驱动适合 2～4 分钟的“编年史 MV”。【推断】 |
| 事实从哪来 | 模型自己联网查（Transformer、Google 史） | 用户给核实过的资料（HF 模板、athemeroy 教育模板、讲课件） | 我们讲一本书，**必须给 brief**，不能让它自由发挥。【推断】 |
| 风格怎么锁 | 说风格名或给参考视频 | 风格文件（STYLE.md、风格配方、标志特征清单） | 风格文件最稳，可以全季复用。【推断】 |
| 配音 | 不要旁白 | edge-tts / Kokoro / 商用 TTS / ElevenLabs / 本人录音 | 我们用真声，节奏按真实录音排（与第二版一致）。 |
| 时长 | 10 秒风格片 | 1～5 分钟讲解，最长到 12 分钟 | 12 分钟的 Transformer 片说明长片可行，但都是一次性作品，没有公开的“长片分段工作流”提示词。【实证 + 推断】 |

还有两点值得注意：
- **中文头部作品的提示词普遍很短**（宝玉、WY、LinearUncle），英文社区更爱写长规格书。中文短提示词能火，很大程度上是因为题目好、模型默认审美够用，加上热点红利；但同时会出现“风格雷同”（观猹帖子里也有人这么评价，【转述】）。要做出电子智人那种“每句话一个专门画面”的片子，靠一句话做不到。【推断】
- athemeroy 的提醒：“一个提示词”“纯代码”“零外部素材”“无人修改”是四件不同的事，不能互相替代；有一条热门 MV 的提示词和更早一条的五词片段重合度达 87%。【转述，[athemeroy README](https://github.com/athemeroy/awesome-opus-5-5-videos)】

### 3.3 一份可以直接用的模板：athemeroy「教育讲解片」中文模板（CC BY 4.0）

【实证】[docs/prompt-playbook.zh-CN.md 第 2 节](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/prompt-playbook.zh-CN.md)。这份模板是策展人自己写的，许可证允许署名后改写。结构是：
1. 根据我提供的课程提纲或可信资料，做一支几分钟的某知识点入门视频，写明受众和三项学习目标。
2. **先列出事实主张、各自的来源，以及有争议或需要我确认的地方**；再写逐镜讲稿和图解计划。
3. 指定画面工具和已配置好的 TTS，字幕由同一份时间轴生成。
4. 交付 MP4、源码、讲稿、来源清单、字幕文件。
5. 检查公式有没有被遮挡、字幕和时间轴是否一致、音轨是否存在、有没有削波；**如果模型没法真正听成片，就标注“旁白发音未由模型试听”**，交给人听一遍再发布。
6. 禁止把没核对过的公式或史实当成确定的事实。

---

## 4. 有没有现成的「vibe知识大赏」专用 skill / 模板？

### 4.1 结论：没有专用的

- 用“vibe知识大赏”“知识大赏”“vibe knowledge”加 opus、skill、提示词等关键词，在 GitHub（限定域名）和中文全网搜索，**没有找到以这个话题命名的仓库、skill 或公开模板**。【实证：搜索结果为空】局限：GitHub 站内仓库搜索当时对未登录请求返回 429（限流），没能穷尽。【实证】
- 话题本身：B 站 UP 主“未来雨季Rainorb”的 [BV1YCHW62ECA](https://www.bilibili.com/video/BV1YCHW62ECA/) 简介说拆解了 661 条话题视频，标题称话题有 1.2 亿播放，数据截至 10 月 4 日，视频本身也是用 Opus 5.5 纯代码生成的。【实证：作者自述，数字未核】观猹社区帖子称话题下基本是新号，热度最高的一条不到 3 天点赞近 50 万，并认为短板是风格雷同。【转述，[观猹](https://watcha.cn/discuss/topics/19)】
- 打这个话题标签的 B 站作者（LeaderAI、MoNet_Team、覃秉丰AI、第零帧001、星龙XL 等）简介里**都没有公开提示词或 skill**；LeaderAI 在 [BV1SgHZ6TEfq](https://www.bilibili.com/video/BV1SgHZ6TEfq/) 里说“人多再单独出拆解”。星龙XL 那条注明用的是 Codex + DeepSeek + Remotion，说明这个话题并不绑定 Opus。【实证】
- 电子智人的《自指》（[BV1ZZHo6LEEa](https://www.bilibili.com/video/BV1ZZHo6LEEa/)）简介只有一句片头文案，标了“含 AI 生成内容”，**没有提示词**；《信息论》同样没有（见第二版）。【实证】《控制论》（BV1i9hd6aE5x）这次没有核对简介。
- 【推断】这一波“vibe知识大赏”大多是**一句话或短 brief + Claude Code + HyperFrames/Remotion skill**，再加作者自己的选题和后期。依据：中文头部知识片公开的提示词都很短（宝玉、WY），话题作者没有一个拿出成套模板，而 HyperFrames 和 Remotion 的 skill 是公开渠道里最常被点名的渲染器。

### 4.2 最接近的现成物，以及质量评价

| 候选 | 贴合度 | 优点 | 缺点 | 许可证 | 能不能直接用 |
|---|---|---|---|---|---|
| **HyperFrames `/faceless-explainer`**（[SKILL.md](https://github.com/heygen-com/hyperframes/blob/main/skills/faceless-explainer/SKILL.md)） | 高（“从文字讲清一个概念”正是它的定位） | 流程最完整：第 0 步确认需求并建项目，第 3 步分镜加讲稿**要用户批准**，第 4 步可先出草图表，第 6 步定稿前**再让用户看一次**；讲解方法论好（见 3.1）；自带配音、BGM、字幕和检查命令（`lint`、`check`、`snapshot`） | 英文为主；默认语音走 HeyGen 账号（未登录就回落到本地引擎）；视觉风格偏排版和抽象图形，不是手绘；至少 2026-08 就有，不是专为 Opus 5.5 做的 | Apache-2.0 | 能用。安装：`npx skills add heygen-com/hyperframes` 或 `npx hyperframes skills update`。我们已选 Remotion，**建议只借它的 story-design 方法和关卡设计**。【实证 + 推断】 |
| **lemo-opuscar Whiteboard / Data Storytelling / Isometric Infographic** | 中高 | 风格文件写到参数级（字幕行宽、停留时长、颜色语义、镜头语法）；导演手册防雷同；MIT | 每种风格只有一支 60～120 秒样片；英文；手绘白板风和我们的“手绘讲解”接近，但它是马克笔白板，不是纸面 | MIT（样片里的第三方素材另有许可） | 能直接装：`claude plugin marketplace add lemomo-ai/lemo-opuscar`，再 `claude plugin install lemo-opuscar@lemolab`。【实证】 |
| **mg-styles-15 #07 贴纸人科普** | 中（中国知识区最常见的包装） | 风格特征写得可检验；配独立评审提示词；有源码 | 只是 10 秒风格片，没有讲解流程，也没有旁白 | MIT | 适合当“风格样片”的写法参考和评审工具。【实证】 |
| **hbg-douyin-code-explainer-video** | 中高（抖音、竖屏、中文、知识口播） | 交付级验收清单很实在：抖音安全区、结论和数字在口播说到之后才揭示、转场中途不留空白、按完整语义轮次生成 TTS 不切碎、Whisper 只取时间不改文字、BGM 不忽大忽小、检查最终编码后的 MP4 | 定位是“双人对话观点口播”，画面是横向推页式代码动画，没有电子智人那种“每句一个演示”的电影感；7 月发布，早于 Opus 5.5；★30 | **无 LICENSE（默认保留所有权利）** | **不要直接拷代码**；它的验收清单可以当思路参考。【实证 + 推断】 |
| **Kianzzz/xilo-opus-video** | 中 | 中文；“三个方案加预览 → brief.md → 逐镜自检”正好适合系列化；MIT | 很新（★26）；没有知识类样片 | MIT | 可以装来试，用法：`npx skills add Kianzzz/xilo-opus-video`。【实证】 |
| **OpenMontage Animated Explainer** | 中 | 调研阶段是正式一环，会给出带引用的调研简报；创意节点有审批；有无需密钥的免费路线（Piper TTS + Remotion） | AGPL-3.0（改了要开源）；画面偏 AI 生图和图表卡片 | AGPL-3.0 | 不建议接进我们的工程，只借流程。【实证 + 推断】 |
| **athemeroy 教育讲解模板** | 中 | 中文；强调先列事实清单、标注“旁白未试听” | 只是一段模板，不是 skill | CC BY 4.0 | 可以署名后改写使用。【实证】 |

**总体质量判断**【推断】：公开渠道里没有一个“抄来就能稳定做出电子智人水平知识片”的东西。差距主要在三处：
1. 没有一个模板同时管好“讲清楚”（结构、钩子、论点）和“每句话一个专门画面”（逐句对应的演示设计）。HyperFrames 管前者，lemo 的白板风格和足球提示词管后者。
2. 中文知识片的审美（如宝玉的纹样演进和 HUD）没有被做成可复用的风格文件。
3. 长片（5～10 分钟）的分段制作和审片流程，在提示词库里基本没有，要靠第二版调研里的 video-talkcraft 和 Code2Video 一类流水线补上。

---

## 5. 对我们的落地建议（《养育你内心的小孩》10 分钟横屏手绘，Remotion 工程）

1. **不要去找“一句话神提示词”**，改成自己写一份“六段式”规格书，再封装成 skill。六段是：参数区、叙事骨架、事实清单、画面纪律、技术契约、关卡与自检。【推断】
2. **借用清单**（都只借结构，用自己的话写）：
   - 讲解结构和钩子：HyperFrames 的 story-design（提炼六样、四种结构、九种钩子、不许用定义开场）。
   - 每句话一个画面：白板风格的“术语说到才写完”和镜头语法表 → 翻成我们手绘风的“动词表”（第二版已建议建动词组件库）。
   - 可读性和阅读时间：足球提示词的最小字号、深色衬底、阅读时间变速。
   - 中文审美和全片导航：宝玉《中华文明史》的贯穿 HUD（卷号、章节名、进度条）和随章节演进的纹样或配色。
   - 事实：AI 简史的“不确定就删并列进 NOTES.md”，加上 athemeroy 的“先列事实主张和来源，再写讲稿”；我们这里的“事实”就是书中原话和术语，每条都要能对到页码。
   - 审片：mg-styles-15 的 rubric（另开一个 AI 当评委，带时间码给出修改意见），再改一轮。
3. **技术契约换成 Remotion 的说法**：HTML 方案里的 `seek(t)` 纯函数，在 Remotion 里对应“所有动画只由当前帧号计算，不用 CSS 过渡，随机数用带种子的 `random()`”。这些规则 `remotion-best-practices` skill 已经覆盖（第二版已建议安装）。【推断，据第二版调研；落地前按 Remotion 官方文档核实一次】
4. **配音沿用第二版结论**：真声录音，按真实语速排节奏；中文旁白预算先按每秒约 4 个字估算，用你的录音实测后再校准。【推断】

下面是一份**我们自己写的**中文骨架（原创，非摘抄），可以作为第一版 skill 的起点：

```text
【参数】主题=＿＿；受众=＿＿（他们现在误以为什么）；时长=约 10 分钟；画幅=1920×1080，30fps；
        风格=手绘线稿 + 一种批注色；配音=我的真声录音（音频文件和逐字时间戳路径＿＿）。
【事实】只能使用 brief.md 里的事实和原文（每条都标了页码）。不确定的不写，统一列进 NOTES.md。
【叙事】先写：受众的误区、一句话论点、3～6 个支柱、每个支柱配一个有数字或场景的具体例子、落点。
        从九种钩子里选一种，前 15 秒让观众“先做一件事”；结尾回到开头的画面。
【画面】一句旁白对应一个画面动作；旁白说到某个词，对应的东西才画出来；
        屏上同时不超过 12 个字，每行停留不少于 2 秒；批注色只用来标“最重要的那一个”。
        禁用：粒子、发光、渐变底、交叉淡化、居中大字配淡入。
【技术】Remotion：每一节一个 Composition；动画只由帧号计算；只调用组件库里的手绘“动词”。
【关卡】第 1 步只交节拍表（旁白 → 画面动作 → 时长）和 6 张关键静帧，等我批准；
        第 2 步只做第一节样板镜，等我批准；第 3 步再批量做其余各节。
【自检】每节渲染起、中、末三张静帧和一张联系表；检查遮挡、错字、字幕安全区、静止超过 4 秒的段落；
        交付 MP4、源码、NOTES.md、三条自己认为最弱的地方。
```

---

## 6. 来源

**提示词 / 案例合集**
- yihui-dev/awesome-opus5-5-videos：https://github.com/yihui-dev/awesome-opus5-5-videos（数据文件 `data/videos.json`；B 站简介 https://www.bilibili.com/video/BV1acah6RE5c/）
- Li-Evan/awesome-opus-5.5-video-prompts：https://github.com/Li-Evan/awesome-opus-5.5-video-prompts（`prompts/explainer.md`、`prompts/history.md`、`guide/director-toolkit.md`）
- zhuyansen/awesome-opus-5.5-video：https://github.com/zhuyansen/awesome-opus-5.5-video；提示词单页 https://jasonzhu.ai/en/prompts/claude-opus-5-5
- athemeroy/awesome-opus-5-5-videos：https://github.com/athemeroy/awesome-opus-5-5-videos（`docs/prompt-playbook.zh-CN.md`、`docs/prompt-matrix.zh-CN.md`、`docs/statistics.md`）
- joeseesun/opus-video-prompts：https://github.com/joeseesun/opus-video-prompts
- opusvideo/awesome-claude-video：https://github.com/opusvideo/awesome-claude-video（`IMPLEMENTATION_GUIDES.md`）
- chuspeeism：https://github.com/chuspeeism/awesome-opus-5-5-videos ；LeaddeOpenLab：https://github.com/LeaddeOpenLab/awesome-opus-5-5-video-prompts ；HiAPIAI：https://github.com/HiAPIAI/awesome-opus-5-5-video-styles ；X-RayLuan：https://github.com/X-RayLuan/awesome-opus-5-5-video-prompts ；xianyu110：https://github.com/xianyu110/awesome-claude-opus-5.5 ；jacobbubu：https://github.com/jacobbubu/claude-opus-5-5-js-animation-research ；TripoGrowthLab：https://github.com/TripoGrowthLab/awesome-opus-5-5-prompts ；BeatAPI：https://github.com/BeatAPI/awesome-opus-5-5-videos ；OpenVGLab：https://github.com/OpenVGLab/awesome-opus5.5-frontend-showcases
- openzhenzhen：http://openzhenzhen.com/ ；B 站介绍视频 https://www.bilibili.com/video/BV1EAHt6hEci
- HF 博客：https://huggingface.co/blog/karmen-beatapi/how-to-make-videos-with-claude-opus-5-5 ；https://huggingface.co/blog/VulcanFeynman/opus-55-living-screencast-case-package
- explainx：https://explainx.ai/blog/claude-opus-5-5-western-civilization-video-2026

**skill / 模板 / 流水线**
- HyperFrames：https://github.com/heygen-com/hyperframes（`skills/faceless-explainer/SKILL.md`、`skills/faceless-explainer/references/story-design.md`）
- Remotion skills：https://github.com/remotion-dev/skills
- OpenMontage：https://github.com/calesthio/OpenMontage（`PROMPT_GALLERY.md`）
- lemo-opuscar：https://github.com/lemomo-ai/lemo-opuscar（`styles/whiteboard/STYLE.md`、`DIRECTOR.md`）
- mg-styles-15：https://github.com/Vincentwei1021/mg-styles-15（`prompts/19-paperclip.md`、`template.md`、`rubric.md`）
- xilo-opus-video：https://github.com/Kianzzz/xilo-opus-video ；bang-motion：https://github.com/bangtutorial/bang-motion ；onetake：https://github.com/feitangyuan/onetake ；hbg-douyin-code-explainer-video：https://github.com/Mr-funny/hbg-douyin-code-explainer-video ；remotion-code-motion-explainer：https://github.com/vibe-motion/remotion-code-motion-explainer ；animated-explainer-skills：https://github.com/BusyBee3333/animated-explainer-skills ；opus-video-skills：https://github.com/tuzhechen2005/opus-video-skills ；ClaudeAnimationBase：https://github.com/JohnHeibel/ClaudeAnimationBase ；awesome-claude-video-skills：https://github.com/zhuyansen/awesome-claude-video-skills

**单条提示词原帖**（均经上面的仓库逐字转录，未登录 X 核对）
- 光子之旅 https://x.com/AstroTheWizard/status/2103629247751618782 ；AI 简史 https://x.com/kimmonismus/status/2102844654169575547 ；中华文明史 https://x.com/dotey/status/2103964025683927166 ；Transformer https://x.com/dotey/status/2103683057689522564 ；大气环流 https://x.com/akokoi1/status/2102606609574941028 ；LLM 小怪兽 https://x.com/eyishazyer/status/2103454597641891922 ；足球规则 https://x.com/lukasersil/status/2105922894924501283 ；Google 史 https://x.com/aakashbuildsAI/status/2104141972135121079 ；导数 https://x.com/LinearUncle/status/2103128559174971663 ；光合作用 https://x.com/rainwishyt/status/2102605736002150408 ；递归 https://x.com/emollick/status/2103688362960019567 ；黎曼猜想 https://x.com/hyuki/status/2102899830951731601 ；令牌桶 https://x.com/ParkerRex/status/2103206747846701462 ；Black-Scholes https://x.com/goodside/status/2103171088637419631 ；Git https://x.com/Yunn260414/status/2104044910769016888

**话题与讨论**
- B 站：https://www.bilibili.com/video/BV1YCHW62ECA/ 、https://www.bilibili.com/video/BV1SgHZ6TEfq/ 、https://www.bilibili.com/video/BV1ZZHo6LEEa/
- 观猹：https://watcha.cn/discuss/topics/19
- Hacker News：https://news.ycombinator.com/item?id=49836374
- Opus 5.5 提示词指南的二手解读：https://fc.bnext.com.tw/articles/view/4952 、https://zhuanlan.zhihu.com/p/2087834896546934870

## 7. 局限与未核实

- GitHub API 当时被限流（共享出口 IP），星数和最后提交时间改从仓库页面和提交 RSS 读取；GitHub 站内搜索也返回 429，“没有专用 skill”的结论来自 tavily 搜索加各合集目录，**不是穷尽搜索**。
- 没有登录 X，所有提示词原文都依赖合集仓库或 jasonzhu.ai 的逐字转录。几个仓库都声称做过逐字核对（Li-Evan 说用机器对过原帖），但我没有逐条打开原帖复核。
- 成片时长、耗时、费用多为作者自述或策展人测量，都标成了【转述】。
- openzhenzhen 的 Opus 5.5 板块条目数、Skillry 复刻站没有统计。
- 抖音话题的播放量（1.2 亿）、点赞（近 50 万）都是二手说法，没有到抖音核实（按要求不用浏览器）。
- 落地建议里关于 Remotion 的对应写法属于【推断】，动手前要按 Remotion 官方文档核实一次。

---

## 核查结果

核查人：事实核查（独立复核，默认怀疑）。核查时间：2026-10-06 约 15:40 UTC。

**怎么核的**：GitHub 内容一律直接读仓库页面和 raw 原文件（数据文件用脚本重新计数，不拿 README 的自述数字当准）；B 站简介用 WebFetch 读视频页（B 站接口对脚本返回 412）；Anthropic 的价格和提示词指南直接读官方文档。没有用浏览器、没有登录、没有下载视频。tavily 当时额度用尽，后段 WebSearch/WebFetch 也触发了次数上限，所以有两条（见第 12 行）没能核完。

**一句话结论**：报告整体可靠。抽查的 12 组结论里 9 组属实、1 组部分属实、1 组**错误**、1 组未证实。最需要改的是“教育/科普约占 7%”这个数字，实际约 13%。

| # | 结论（报告原说法，概括） | 核查结论 | 依据链接 | 备注（正确说法 / 补充） |
|---|---|---|---|---|
| 1 | 第 0 节第 1 条和 1A 表：athemeroy 用分类器统计，教育/科普在纳入样本里“至少 80 个文件，约 7%” | **错误** | [statistics.md](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/statistics.md)、[domain-style.csv](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/data/domain-style.csv) | 80 只是“领域 × 画风”前十格里两格相加（教育 + 动效/UI 55 个，教育 + 扁平卡通 25 个），不是教育类总数。按 CSV 重新计数：纳入样本（yes + likely）1,119 个文件里 `education_science` 有 **147 个，约 13.1%**；只算 yes 是 139/980，约 14.2%；全部 1,401 个文件里是 167 个，约 11.9%。所以第 0 节第 1 条的区间应改为“约 10%～17%”（yihui 13%、zhuyansen 9.8%、athemeroy 13%、chuspeeism 17%）。同一仓库的其他数字都对：1,511 / 1,401 / 168、教育讲解路径 27 例中位 102.28 秒、87.0% 五词片段重合。 |
| 2 | 合集统计：yihui 475 个提示词、196 个不完整、explainer 62 条（38 条不完整）；zhuyansen 1,352 个作品、347 个有提示词、141 个完整、教育类 132 个其中 45 个有提示词、无 LICENSE；熠辉 IndieDev 就是 yihui-dev，花了约 3,000 美元 API 费 | 属实 | [yihui videos.json](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/data/videos.json)、[yihui README](https://github.com/yihui-dev/awesome-opus5-5-videos)、[zhuyansen README](https://github.com/zhuyansen/awesome-opus-5.5-video)、[education.md](https://github.com/zhuyansen/awesome-opus-5.5-video/blob/main/cases/education.md)、[BV1acah6RE5c](https://www.bilibili.com/video/BV1acah6RE5c/) | 数据文件逐条计数完全吻合（类别分布：motion 288、interactive 70、explainer 62、3d 55）。B 站视频标题写“花了2万”，简介写约 3,000 美元，并给出 yihui-dev 仓库链接，两者一致。星数有正常小幅变化（2,216→2,217）。 |
| 3 | HyperFrames `/faceless-explainer`：Apache-2.0；仓库带 21 个 skill；3 道人工关卡（第 0、3、6 步）；配音默认走 HeyGen，未登录回落本地；安装命令 `npx skills add heygen-com/hyperframes` 或 `npx hyperframes skills update`；story-design 的“六样、四种结构、九种钩子、不许定义开场、每帧 6～20 词” | 属实 | [SKILL.md](https://github.com/heygen-com/hyperframes/blob/main/skills/faceless-explainer/SKILL.md)、[story-design.md](https://github.com/heygen-com/hyperframes/blob/main/skills/faceless-explainer/references/story-design.md)、[README](https://github.com/heygen-com/hyperframes) | SKILL.md 原文写明 “User-gated steps are Step 0, Step 3, and Step 6”。补充一个报告没说的限制：这 3 道关卡只在“协作模式”下真的停下来等人；如果 brief 设成自主模式，第 3 步只发一段摘要就继续往下做，第 4 步的草图表也会跳过。离线回落的引擎是 Kokoro（默认男声 `am_michael`）。`skills/` 目录下正好 21 个子目录，README 也写了“all 21 published skills”。 |
| 4 | Remotion 官方 skill：12 个（best-practices、create、markup、studio、render、maps、captions、saas、interactivity、docs、upgrade、multimedia），仓库无 LICENSE，安装 `npx skills add remotion-dev/skills`，没有讲解片流程 | 属实 | [remotion-dev/skills](https://github.com/remotion-dev/skills) | 浅克隆仓库核对：`skills/` 下 12 个目录，名称与报告一致；根目录只有 README、package.json、scripts、skills、tsconfig.json，没有 LICENSE，package.json 里也没写 license 字段。 |
| 5 | 第 5 节第 3 条：“动画只由帧号计算、不用 CSS 过渡、随机数用带种子的 `random()`”这些规则，remotion-best-practices skill 已经覆盖 | 部分属实 | [remotion-markup/SKILL.md](https://github.com/remotion-dev/skills/blob/main/skills/remotion-markup/SKILL.md) | 前两条有：markup skill 要求用 `useCurrentFrame()` 和 `interpolate()` 驱动动画，并写明 CSS 的 transition/animation 和 Tailwind 动画类渲染不正确、要改写。**“带种子的 `random()`”在 12 个 skill 的全部文件里都搜不到**（只在光斑特效组件里有个 `seed` 参数）。这一条要自己写进我们的 skill，或者按 Remotion 官方 API 文档补，不能指望装了 skill 就有。 |
| 6 | lemo-opuscar：MIT（演示素材另有许可）；43 种风格；安装 `claude plugin marketplace add lemomo-ai/lemo-opuscar` 再 `claude plugin install lemo-opuscar@lemolab`；白板风格文件 11 节、最多 3 种笔色、字幕每行不超过 44 字符、底部约 12% 留给字幕、停留取“1.8 秒”和“语音时长 + 0.6 秒”中较大者、术语说到时恰好写完 | 属实 | [LICENSE](https://github.com/lemomo-ai/lemo-opuscar/blob/main/LICENSE)、[README](https://github.com/lemomo-ai/lemo-opuscar)、[whiteboard/STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/styles/whiteboard/STYLE.md) | `styles/` 下 44 个目录，去掉 `_template` 正好 43 种。注意：GitHub 页面侧栏把许可证显示成 “Other”，原因是 LICENSE 文件在 MIT 正文后面追加了“演示里的第三方素材各有许可”的说明；正文就是 MIT，报告说法没错。 |
| 7 | 许可证：onetake 是 PolyForm Noncommercial（禁止商用）；hbg-douyin-code-explainer-video 无 LICENSE；OpenMontage 是 AGPL-3.0；合集仓库的许可证不覆盖收录的提示词（yihui、BeatAPI 都写明版权归原作者） | 属实 | [onetake LICENSE](https://github.com/feitangyuan/onetake/blob/main/LICENSE)、[hbg 仓库](https://github.com/Mr-funny/hbg-douyin-code-explainer-video)、[OpenMontage](https://github.com/calesthio/OpenMontage)、[BeatAPI README](https://github.com/BeatAPI/awesome-opus-5-5-videos)、[yihui README](https://github.com/yihui-dev/awesome-opus5-5-videos) | hbg 根目录只有 .gitignore、README、SKILL.md、agents、install.sh、references、scripts，README 里也没有任何许可声明；最后提交 2026-07-30，1080×1920、全局 Whisper 对齐都与 README 一致。BeatAPI 的要点是“给链接不等于允许转载”。OpenMontage 的 README 流水线表列了 11 条，`pipeline_defs/` 里有 12 条正式流水线外加 1 个冒烟测试，“12 条”说得通；“100 多个工具”、Piper 免费配音、“45 秒约 110 词、90 秒约 225 词”都有原文。 |
| 8 | mg-styles-15：#07 贴纸人科普对应 `prompts/19-paperclip.md`；原片 AI 终评 7.71/10、改了两轮；`rubric.md` 按 7 个维度打 1～10 分、给 5～10 条带时间码的修改意见；8～12px 白描边 | 属实 | [19-paperclip.md](https://github.com/Vincentwei1021/mg-styles-15/blob/main/prompts/19-paperclip.md)、[rubric.md](https://github.com/Vincentwei1021/mg-styles-15/blob/main/rubric.md)、[README](https://github.com/Vincentwei1021/mg-styles-15) | 7 个维度是：风格还原、创意、动作工艺、版式字体、质感、声画同步、技术，与报告一致。小差异：文件里中文风格说明写 8～12px 白描边，英文提示词正文写的是 10px，两者不冲突。 |
| 9 | 知识类提示词原文细节：AI 简史（Remotion、180 秒 5,400 帧、先写 `STORYBOARD.md`、每场景渲 3～4 张静帧、不确定就删并列进 `NOTES.md`、屏上最多约 8 词、停留不少于 2.5 秒、4,307 字符、来自作者回复）；足球规则（11,085 字符捷克语、`window.renderFrame(t)`、分析段拉长 1.5～2.1 倍、−14 LUFS、tile 联系表、ffprobe、`PROGRESS.md`、着色器防 NaN）；宝玉 Transformer 只有四句、12 分钟、xhigh、Edge TTS、Remotion + KaTeX；中华文明史 6 行；大气环流 `TTS.md` + `.env` 里的 `APIKEY`/`VOICE`、26 分钟、每支约 0.2～0.5 美元 | 属实 | [jasonzhu.ai AI 简史](https://jasonzhu.ai/en/prompts/claude-opus-5-5/2102844654169575547)、[jasonzhu.ai 足球](https://jasonzhu.ai/en/prompts/claude-opus-5-5/2105922894924501283)、[Li-Evan explainer.md](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/explainer.md)、[Li-Evan history.md](https://github.com/Li-Evan/awesome-opus-5.5-video-prompts/blob/main/prompts/history.md)、[joeseesun README](https://github.com/joeseesun/opus-video-prompts) | 都是合集仓库的转录，没有登录 X 看原帖（与报告第 7 节的局限相同）。中华文明史正文 6 个非空行、约 275 字。两处提醒：① 足球提示词里“开场 3.5 秒”是剧本段的内部时长，参数段写的成片开场约 4.5 秒，报告取前者不算错；② joeseesun 案例表把 AI 简史成片描述成“开源 TTS、Python 配乐”，和提示词里“不要旁白、只留配乐插槽”对不上，成片可能和提示词不一致，报告表里那一格只代表提示词的要求。大气环流“禁止读取 `.env`”的原文写法是在 `.claude/settings.json` 里加 `"deny": ["Read(./.env)"]`。 |
| 10 | 成本与写法：HF 博客按 LaunchVideo 报告的每片约 9 万输入、1.5 万输出 token，按 Anthropic 标价估算每片约 0.66 美元；Anthropic Opus 5.5 官方提示词指南建议“点名不要的样式”，因为笼统说法只会从一种默认风格换到另一种（报告标为【转述】，官方原文未读） | 属实 | [HF 博客](https://huggingface.co/blog/karmen-beatapi/how-to-make-videos-with-claude-opus-5-5)、[Anthropic 价格页](https://platform.claude.com/docs/en/about-claude/pricing)、[Opus 5.5 提示词指南](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5#frontend-design-defaults) | 官方价格页确认 Opus 5.5 是每百万 token 输入 4 美元、输出 20 美元，0.36 + 0.30 = 0.66 美元，算对了；博客同表还列了 BeatAPI 自家价 0.33 美元。官方指南这条现在可以升为【实证】：它在 “Frontend design defaults” 一节，意思是笼统地说“避免 AI 味”只会换一个默认风格，要 “name specific patterns to avoid”，并且看第一版用了什么再补禁用清单。注意它讲的是前端页面，用到视频上是我们的推断。小修正：博客对 Kokoro-82M / ElevenLabs 的说法是“可选”，不是“推荐”。 |
| 11 | 话题和作者：B 站 BV1YCHW62ECA 简介称拆了 661 条话题视频、话题 1.2 亿播放、数据截至 10 月 4 日、视频本身用 Opus 5.5 纯代码生成；LeaderAI 在 BV1SgHZ6TEfq 里说人多再单独出拆解，没有公开提示词；电子智人《自指》BV1ZZHo6LEEa 简介只有一句片头文案、标了“含 AI 生成内容”、没有提示词 | 属实 | [BV1YCHW62ECA](https://www.bilibili.com/video/BV1YCHW62ECA/)、[BV1SgHZ6TEfq](https://www.bilibili.com/video/BV1SgHZ6TEfq/)、[BV1ZZHo6LEEa](https://www.bilibili.com/video/BV1ZZHo6LEEa/) | BV1YCHW62ECA 由“未来雨季Rainorb”发布于 2026-10-05，标题是“1.2 亿播放的vibe知识大赏，谁做谁火？”；1.2 亿是作者自述，没有到抖音核对。LeaderAI 原话是“人多我再单独出一期详细拆解流程”，简介还自称除了打字没有其他操作。要提醒的是，LeaderAI 的简介第一句是 API 中转站的推广（称 Opus 5.5 等“官方半价”），它的说法要按带货内容看待。《自指》发布于 2026-10-06 05:00，简介里没有工具清单或仓库链接。 |
| 12 | ① 星龙XL 那条注明用的是 Codex + DeepSeek + Remotion；② 观猹帖子称话题下基本是新号、热度最高的一条不到 3 天点赞近 50 万、短板是风格雷同 | 未证实 | [观猹](https://watcha.cn/discuss/topics/19)（页面靠前端脚本加载，脚本读取为空） | ① 报告没给这条视频的 BV 号，我用关键词搜索也没找到，B 站搜索接口对脚本返回 412，无法核对，**补上链接前不要引用**。② 观猹页面不用浏览器打不开正文，tavily 额度用尽、WebFetch 也触发了上限，没能核对；报告本来就标的是【转述】，保持原样。 |

**核查后需要改的地方（汇总）**
1. 第 0 节第 1 条、1A 表 athemeroy 一行：“约 7%”改成“约 13%（纳入样本 1,119 个文件里 147 个）”，“至少 80 个”改成“147 个”；第 0 节的区间改为“约 10%～17%”。
2. 第 5 节第 3 条：“随机数用带种子的 `random()`”在 Remotion 官方 skill 里没有，要自己写进规格书或 skill。
3. 第 3.1 节“点名不要的样式”那条可以从【转述】升为【实证】，链接直接用官方指南的 Frontend design defaults 一节，并注明它原本讲的是前端页面。
4. 第 4.2 节 HyperFrames 一行建议加一句：3 道人工关卡只在协作模式下生效。
5. 第 1 节 HF 博客那条：“配音推荐 Kokoro-82M 或 ElevenLabs”改为“配音可选 Kokoro-82M 或 ElevenLabs”。
6. 第 4.1 节星龙XL 那句：补上视频链接再用，否则删掉或标“未核”。
