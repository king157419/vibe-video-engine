# A｜中文圈作者自述的 Opus 5.5 做视频工作流

- 调研日期：2026-10-06。范围：Opus 5.5（9 月 22 日发布）之后，中文作者**自己公开说的**做法，重点是知识讲解、科普类。
- 只补第二版没有的东西。第二版 `调研/开源视频方案.md` 第 2 节已经写过的 HF 博客配方（单 HTML + `seek(t)` + Playwright + ffmpeg）、explainx 拆解、电子智人参考片拆解，这里不重复，只在需要时引用。
- 方法：读视频简介、作者本人的文章、帖子和评论回复；读聚合仓库，但聚合内容一律降级为二手。**没有看视频正片，也没有做语音转写**（按规矩不下载、不在本机转写），所以几支长教程（来真的 39 分钟、LeaderAI 24 分钟、T8 13 分钟）只拿到了简介和章节，正片里讲了什么不知道，见第 8 节。
- 证据等级：
  - 【实证】作者本人说的：视频简介、本人文章、本人帖子、本人仓库原文。
  - 【转述】二手：聚合仓库、别人文章里转述的说法、播客纪要。
  - 【推断】我根据以上材料推出来的。
- 版权：提示词和文章都用我自己的话概括结构，原文引用每处不超过 15 个字，都附链接。

---

## 0. 先说结论

1. **主流就是“写代码画每一帧，再拼成 MP4”这一条路，下面分成六七种画法**：单 HTML + Canvas/WebGL 逐帧截图最多；Remotion 次之，做长片、分集的人用；Python 逐帧画线稿；Three.js/WebGL 做 3D；Blender 做写实 3D；还有一派让 Opus 当导演，去调图像或视频模型出镜头。中文作者里**没有找到用 Manim 做 Opus 5.5 视频的公开自述**。【实证+推断，见第 1 节】
2. **“一句话直出”确实有人做到，但做知识讲解的认真作者，几乎都走“先问问题或先出分镜，人确认，再动手，最后几轮改稿”的路子**。人要介入的点集中在四处：定选题和方向、确认分镜或样图、试听、最后通看一遍。【实证：风之谷AI、晚风和鱼、余弦、Benx、路北路陈】
3. **配音几乎都是 TTS 或声音克隆，没有人用 Opus 自己“说话”**。常见的有：MiniMax（speech-2.8-hd，或者克隆自己的声音）、Gemini 3.8 Flash TTS、SeedAudio（豆包系）、edge-tts（免费但平）。**配乐和音效大多让 Opus 用 Python 或 JS 现场合成**，少数人用 Suno。【实证】
4. **音画对齐的共识：先做配音，配音就是全片的时钟**。每句单独合成，拿到时长或逐字时间戳，场景长度按配音自动算，不手写时间。做 MV 时反过来，歌就是时钟，靠节拍检测卡点。【实证：宝玉、Benx、余弦、路北路陈、SeASnAkE】
5. **花费跨度极大，作者自报的数字从“几块钱”到“约 570 美元”都有**。知识讲解类大多落在：订阅 Pro 的 5 小时额度用掉 10%–30%，或者 Max 周额度用掉 7%–20%；单条耗时 20 分钟到 5 小时。【实证，见第 4 节】
6. **做得最好的中文知识类账号，有一套固定的“栏目格式”，不靠一条爆款**。路北路陈的“设计风格小课”每期都是：一个风格，四条规则，一张风格卡，一段可以直接复制给 AI 的描述，选题来自上期评论区。第一期在 B 站约 8.6 万播放、7500 收藏。【实证】
7. **最值得抄的分工**是路北路陈的“Opus 当设计负责人，Codex 当工程负责人，两个 AI 靠文档交接，人只管拍板和试听”，以及余弦的“HANDOFF 交接文档 + 每句配音缓存 + 只重渲改过的段落”。【实证】
8. **大家自己总结的坑**：“一句话”其实多轮；成片容易“高大上但看不懂”；中文字体变方块；浅色字看不清；手写时间轴一改全乱；用框架和 skill 会有 PPT 感，不用又不好控；中转站会中断、掺水；长会话上下文爆掉；审片很费 token。【实证+转述，见第 5 节】
9. **这波视频的流量有很大一部分来自“AI 居然能做这个”的新鲜感**。B 站带“Vibe 知识大赏”标签的视频，大多数只有几百播放，主战场在抖音；新鲜感过去以后，能留下来的应该还是内容本身。【推断，依据 `B站候选清单.md`】

---

## 1. 技术路线：有几条、适合什么画面、谁在用

| 路线 | 怎么做（一句话） | 适合的画面 | 中文作者里谁在用（证据） |
|---|---|---|---|
| **① 单 HTML + Canvas / WebGL 逐帧截图** | 一个网页，画面是时间 t 的函数；无头浏览器一帧一帧截，ffmpeg 拼起来 | 动态图形、信息图、手绘卡通、抽象数学可视化、MV | sadssxa《群论之美》：约 1200 行的 1080p 动画页面，配乐用 Python 合成【转述，[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)】；南辰燏炚《world.execute(me);》：Canvas/WebGL，每帧是 t 的纯函数，1080p60【实证，[BV1vthX6XEwm](https://www.bilibili.com/video/BV1vthX6XEwm)】；宝玉的教学视频：指定 JS + Canvas、手绘卡通风【实证，[宝玉文章](https://x.com/dotey/article/2105181393638531536)】；路北路陈“设计风格小课”：画面全部代码逐帧生成，4K60，加运动模糊和胶片颗粒【实证，[BV1hWar6SEVP](https://www.bilibili.com/video/BV1hWar6SEVP)】 |
| **② p5.js + 笔刷库** | 同①，但用 p5.js 和水彩、铅笔笔刷，画面有手绘感 | 手绘、水彩、卡通 MV | NotinReality 的 P(doom) MV：7 个子 agent 并行写各场景，大部分时间花在渲染 p5 水彩效果上【转述，[linux.do 2943096](https://linux.do/t/topic/2943096/1)】；kate人不错专门做过一期“Canvas 2D 和 p5.js 对比”【实证，章节名，[BV15hhR6bEs7](https://www.bilibili.com/video/BV15hhR6bEs7)】 |
| **③ Python 逐帧画** | 不开浏览器，用 Python（PIL 等）直接画每一张图 | 线稿、漫画分镜、水墨 | WY《中华五千年》《大气环流》：线稿动画【实证，[WY 推文](https://x.com/akokoi1/status/2102606609574941028)】；Benx 的“不用框架”版：Opus 自己写了 723 行 Python，画成漫画分镜，有分格、对白气泡、拟声字【实证，[少数派](https://sspai.com/post/115283)】；Axton 把真人口播改成线稿 B-roll【转述，[opus-video-prompts](https://github.com/joeseesun/opus-video-prompts)】 |
| **④ Remotion（React 写视频）** | 每一帧是帧号的函数，组件化，有 Studio 预览 | 长片、分集、需要复用组件和统一时间轴的讲解 | 余弦：40 多分钟的长教程，分 EP、进度条、章节、合集都从同一份时间轴生成【实证，[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)】；风之谷AI 星舰片的动画部分【实证，[BV1VxhD6jE5V](https://www.bilibili.com/video/BV1VxhD6jE5V)】；星龙XL《DeepSeek家族史》用的是 Codex + DeepSeek V4.1 Flash + Remotion，不是 Opus【实证，标题，[BV1xNpc6MENm](https://www.bilibili.com/video/BV1xNpc6MENm)】；爱学习的乔同学专门做了一期讲 Remotion 原理（自称做了 14 小时）【实证，[BV1dcaW6rEbs](https://www.bilibili.com/video/BV1dcaW6rEbs)】；未来雨季的视频打了 remotion 标签【实证，[BV1vRHa63EYg](https://www.bilibili.com/video/BV1vRHa63EYg)】 |
| **⑤ HyperFrames（HTML + GSAP）** | HeyGen 开源，网页写视频，自带布局、对比度检查 | 产品片、字幕条清楚的口播包装 | Benx 做过三方对比，结论是框架版“有 PPT 和模板感”，HyperFrames 版字幕可读性最好【实证，[少数派](https://sspai.com/post/115283)】。中文知识类作者里**没找到主力用它的** |
| **⑥ Three.js / WebGL / GLSL 做 3D** | 程序化建模、着色器，网页里实时渲染再逐帧截 | 3D 场景、宇宙、历史战役沙盘、数学曲面 | 穆阿蒂布《world.execute(me);》：Three.js / WebGL2 + GLSL，共 13015 帧 4K【实证，[BV1SgaY64EG5](https://www.bilibili.com/video/BV1SgaY64EG5)】；王树义《中途岛海战》《黑水河之战》3D 讲解影片，7–8 分钟（简介只说是 3D 动画，没说用的是哪个库）【实证，[BV1yWhQ6iESL](https://www.bilibili.com/video/BV1yWhQ6iESL)】；kate 第三期有古风 3D 弹筝、3D 修车，标签是 Blender、Threejs【实证，[YouTube 简介](https://www.youtube.com/watch?v=l3v1edwbhT4)】 |
| **⑦ Blender（写 Python 脚本操控）** | Opus 写 bpy 脚本建模、做材质、打光、做流体 | 写实一点的 3D、物理效果（流体、火焰） | 风之谷AI 星舰片：Blender 3D + Mantaflow 流体 + Remotion 动画 + 代码合成声音【实证，[BV1VxhD6jE5V](https://www.bilibili.com/video/BV1VxhD6jE5V)】 |
| **⑧ Opus 当导演，外部模型出镜头** | Opus 写剧本，调用图像或视频生成模型拿片段，再自己写渲染器拼接、调色 | 需要写实画面、人物的片子 | 一起Vibe（B 站约 12 万播放）：Opus 规划剧本，调度图像和视频模型生成镜头，调 TTS 配音，再自己写渲染器拼接调色【实证，[BV1TBaa6JEFS](https://www.bilibili.com/video/BV1TBaa6JEFS)】 |
| **⑨ 改已有视频** | 给它一条现成视频（口播或别人的讲解），让它重做画面或重新配音 | 口播配 B-roll、复刻讲解、出外语版 | i陆三金：把一条讲文字的视频喂给 Opus，让它改造并重新配音，做成英文版【实证，[BV1e9hd6aEX2](https://www.bilibili.com/video/BV1e9hd6aEX2)】；Axton：口播转线稿，约 30 个镜头，28 分 53 秒，没有人工介入【转述，[opus-video-prompts](https://github.com/joeseesun/opus-video-prompts)】 |
| （旁支）网页演示 + 录屏 | 做成可以点击翻页的 16:9 网页，一边讲一边录屏 | 课程、口播讲解 | code秘密花园的开源 skill `web-video-presentation`，带脚本、主题、大纲、配音几道确认关卡，内置 MiniMax 和 OpenAI TTS。注意它是 2026-05 发的，早于 Opus 5.5【实证，[BV1ypdgBCE9B](https://www.bilibili.com/video/BV1ypdgBCE9B)、[garden-skills](https://github.com/ConardLi/garden-skills)】 |

**补充几点：**

- **电子智人本人没有公开工具链**。《自指》的简介只有一句话【实证，[BV1ZZHo6LEEa](https://www.bilibili.com/video/BV1ZZHo6LEEa)】。抖音上有一条《opus家族史》挂了 `#remotion` 话题【转述，[抖音页面摘要](https://www.douyin.com/video/7611060126964005952)，是搜索摘要，没核实是否为电子智人本人的作品】。第二版推断他用的是①，现在看也可能是④，**两种都有可能**【推断】。
- **框架用还是不用，作者之间有分歧**：
  - Benx 的对照实验：同一个需求，不用框架的版本更自由、更多样；用 Remotion 或 HyperFrames 的版本“全屏插画 + 底部字幕”从头到尾一个版式。他的建议是平时不用框架，只给几条底线；要批量稳定出片时再上框架【实证，[少数派](https://sspai.com/post/115283)】。
  - 余弦认为短片一句话就够，长教程和要对上真实素材的片子，用 Remotion 加“参考片、分镜、静帧”能少返工很多次【实证，[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)】。
  - 宝玉转述 HeyGen 的说法：框架的限制加得越多，agent 的产出越保守、越雷同【转述，[宝玉文章](https://x.com/dotey/article/2105181393638531536)】。
- **3D 和 Blender 很贵**。风之谷AI 一条 1 分钟的星舰片花了 5 小时（第 4 节）。手绘讲解用不到【推断】。

---

## 2. 典型流程：几步、几轮、人管哪里

### 2.1 两种模式

| | “一句话直出” | “分阶段流水线” |
|---|---|---|
| 典型做法 | 新建空文件夹，开 Claude Code，effort 调到 high/xhigh/max，丢一句话进去，等它写代码、渲染、自检，拿到 MP4 | 先喂资料，先出脚本和分镜（或者先让它问问题），人确认后再做；做完再提几轮修改 |
| 中文例子 | 月踏流云：一句“给游戏的发展史拍一个片子”，max effort，30–40 分钟出片【实证，[linux.do 2961904](https://linux.do/t/topic/2961904)】；sadssxa《群论之美》，一句话，无 skill，Pro 订阅加 xhigh【转述，[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)】；SeASnAkE《world.execute(me);》：给音频、歌词，再加一句“生成配套 mv”，effort high，20 多分钟【实证，[linux.do 2954172](https://linux.do/t/topic/2954172)】 | 风之谷AI、晚风和鱼、余弦、Benx、路北路陈、小肥肠（详见下面） |
| 适合 | 概念片、宣传片、MV、试手感 | 知识讲解、长教程、系列栏目 |
| 隐藏的事实 | “一句话”通常只是说**用户只发了一句话**，模型自己在内部做了规划、分工、返工，有的跑了两轮【转述，宝玉引 PDoomVideo 说明文件】。月踏流云的双语字幕是事后另用 GPT-6-Astra 加的；SeASnAkE 的 MV 后期也用别的模型加了推理过程画面、歌词和封面【实证】 | — |

### 2.2 作者自述的分步流程（按出处列，便于对照）

- **晚风和鱼《用 Opus 5.5 做动画：6 步全流程》**【实证，章节，[BV1sThX6TEj2](https://www.bilibili.com/video/BV1sThX6TEj2)】：
  1. 开局一句话，说清用什么做、演什么、先定风格；
  2. 看样图，定风格；
  3. 让它出几个剧情，挑一个；
  4. 先写分镜，再动手；
  5. 开做，画面和音乐用同一张节拍表；
  6. 改稿。

  他自报：全程只在 Claude Code 里对话，一笔没画，一行代码没写，前后改了 3 版，一个晚上做完。
- **未来雨季Rainorb《Opus5.5 告诉你，它是怎么做视频的》**【实证，简介，[BV1vRHa63EYg](https://www.bilibili.com/video/BV1vRHa63EYg)】：写分镜 → 写代码 → 分工卡点 → 合成视频 → 检查。成片 2 分 27 秒，共 4410 帧。
- **宝玉（Opus 自己在做的事，拆成五步）**【实证，[宝玉文章](https://x.com/dotey/article/2105181393638531536)】：规划（脚本和分镜）→ 画面（代码画）→ 动作（时间表，GSAP 或 Remotion）→ 声音（先配音，配音当时钟）→ 拍摄与合成（无头浏览器逐帧截图，再用 ffmpeg 合成）。最后它看渲染出来的静态截图来自检。
- **Benx（少数派）**【实证，[少数派](https://sspai.com/post/115283)】：
  1. 装 Node.js 22+、FFmpeg、Claude Code；
  2. 接入模型；
  3. 准备配音和 BGM 的 API；
  4. 发需求，**先只要旁白、分镜表和 4 个关键画面的描述**，改到满意；
  5. 回一句“开始做”，它自己生成配音、BGM，写动画，截图自检，渲染；
  6. 看片后用大白话提修改。
- **余弦（40 多分钟长教程，最完整的中文自述）**【实证，[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)】：
  1. 先喂素材，整理成资料；口播里说的每件事都要能在资料里找到出处；
  2. 一句一句写脚本，每句对应一个画面；先出几张静帧或一小段预览，看顺眼再全渲；
  3. 每句单独合成配音并缓存，字幕按逐词时间戳切；
  4. 音效让它用代码生成，有人声时 BGM 自动压低，每集统一响度；
  5. 进度条、章节、分 EP、封面、投稿简介都从同一份时间轴生成；
  6. 让它自己想办法加速渲染；
  7. 渲染完让它自己验收帧数、音画对齐、响度、字幕排版；最后人自己通看一遍、通听一遍；
  8. 让它维护一份 HANDOFF 交接文档，写清楚哪些是人点过头的，方便换新会话或者多开会话。

  做预告短片时还加了一步：开 3 个审片 agent，每个只挑一类问题（节奏卡点；质感，专找“像 demo”的地方；文字、安全区和合规）。
- **路北路陈“设计风格小课”（人和两个 AI 分工）**【实证，[BV1hWar6SEVP](https://www.bilibili.com/video/BV1hWar6SEVP)、[BV1xMHh69EZr](https://www.bilibili.com/video/BV1xMHh69EZr)、[BV1ZuHn6VEFi](https://www.bilibili.com/video/BV1ZuHn6VEFi)】：
  - 人：定方向、拍板、试听把关。
  - Opus 5.5 当“设计负责人”：选题和调研、台本、事实核对、分镜、画面风格、所有动画镜头和转场的代码、声音设计、封面、标题和简介；看完样片后自己挑问题。
  - Codex 当“工程负责人”：渲染管线（逐帧截图、运动模糊、胶片颗粒、4K60、并行渲染、显卡编码）、旁白逐行对齐、配乐和音效的程序合成与混音、字幕烧录、开源字体采集；还在 MiniMax 网页上逐段合成配音。
  - 两个 AI 靠文档协作：Opus 写任务说明，Codex 照做并提交汇报，Opus 验收。
- **小肥肠（掘金，做知识科普和获客视频）**【实证，[掘金](https://juejin.cn/post/7693225151680774154)】：用一个“导演 skill”把口播稿和素材拆成动画分镜，再配一个“主题模板 skill”（固定配色和风格），交给 Claude 出片。效果满意后把风格封装成模板，以后换文案就能批量出同主题视频。他说这套流程前后打磨了 3 个月。

### 2.3 几轮对话（作者自报）

| 作者 / 作品 | 人发了几次话 | 出处 |
|---|---|---|
| 月踏流云《电子游戏发展史》 | 1 句 | 【实证】[linux.do 2961904](https://linux.do/t/topic/2961904) |
| WY《大气环流》（近 5 分钟） | 1 段提示词，26 分钟出片 | 【实证】[WY 推文](https://x.com/akokoi1/status/2102606609574941028) |
| 风之谷AI 星舰（1 分 03 秒） | 300 多字需求，回答它的 4 个问题，加“几轮修改意见”（标题写的是“一次补充优化”） | 【实证】[BV1VxhD6jE5V](https://www.bilibili.com/video/BV1VxhD6jE5V) |
| 晚风和鱼 Clawd 动画 | 6 步，改了 3 版 | 【实证】[BV1sThX6TEj2](https://www.bilibili.com/video/BV1sThX6TEj2) |
| 铼夏LAYccc《AI 简史》（6 分 30 秒） | 修改了 8 次，人工把控了一些节奏 | 【实证】[BV1H8av6HEYs](https://www.bilibili.com/video/BV1H8av6HEYs) |
| 机灵的兰尼《俄法战争》（19 分钟） | 根据上一期评论区意见，优化、丰富了画面 | 【实证】[BV1kjaS64EFA](https://www.bilibili.com/video/BV1kjaS64EFA) |
| LeaderAI《深度科普》《建筑造型十式》 | 自称除了打字没做别的事 | 【实证】[BV11fHW6iEqQ](https://www.bilibili.com/video/BV11fHW6iEqQ)、[BV1SgHZ6TEfq](https://www.bilibili.com/video/BV1SgHZ6TEfq) |
| 余弦 40 多分钟长教程 | 多会话、多轮，靠 HANDOFF 文档衔接 | 【实证】[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources) |

**【推断】**一条 3–5 分钟的知识讲解，比较现实的预期是：1 段需求，1 次分镜或样图确认，2–8 轮修改。真正“一次过”的多是概念片、MV，不是要讲清楚一个知识点的片子。

### 2.4 人要介入的地方（各家共同点）

1. **选题和资料**：给它核实过的资料，规定说的每件事都要有出处（余弦），让它做事实核对（路北路陈），在简介里注明数据截至哪天、动画只是模拟演示（风之谷AI）。【实证】
2. **定风格**：看样图、静帧或参考片（晚风和鱼、余弦、Benx）；或者直接给一段风格描述（路北路陈每期都附“可以直接复制给 AI 的描述”）。【实证】
3. **批准分镜**：几乎所有走流水线的作者都在这里设了关卡。【实证】
4. **试听**：配音的语气、BGM 的音量（路北路陈“试听把关”；Benx 举的修改例子里有“BGM 有点吵”）。【实证】
5. **终审**：余弦明确说，它说没问题不代表真的能发，最后还得自己通看、通听一遍。【实证】

### 2.5 提示词通常包含哪些要素

综合下面这些真实提示词归纳【推断，依据都是【实证】的原文】：

| 要素 | 写什么 | 谁这么写 |
|---|---|---|
| 1. 任务和主题 | 做什么类型（教学视频、科普、宣传片）+ 具体知识点 | 全部 |
| 2. 受众和效果 | 给谁看；要通俗、开头要抓人、看完有收获、引人入胜 | 宝玉、WY、余弦起手式 |
| 3. 时长和画幅 | 秒数或分钟数；横屏还是竖屏 | 风之谷AI（50–70 秒）、Benx（30 秒竖版） |
| 4. 视觉风格 | 线稿、手绘卡通、某种设计风格；或者给参考片、参考图 | WY（线稿）、宝玉（手绘卡通）、路北路陈（风格卡）、余弦（参考片链接） |
| 5. 技术约束 | 用 JS + Canvas；纯代码，不用视频生成模型；可以联网查资料、下载开源库 | 宝玉、风之谷AI |
| 6. 内容清单或镜头清单 | 必须讲到哪些点、必须有哪些镜头 | 风之谷AI（原理、拆解、真实场景、人物态度、预测……） |
| 7. 声音 | 配音用哪家 TTS、哪个音色、什么语气；要不要 BGM、音效；字幕用什么语言 | WY、宝玉、Benx、风之谷AI |
| 8. 素材和密钥 | 资料放在哪个文件；API 文档放 TTS.md，密钥放 .env | WY、宝玉 |
| 9. 质量底线 | 画面只由时间决定；中文字号下限；对比度；安全区；渲染前截图自检；渲染后用 ffprobe 查参数 | Benx |
| 10. 流程闸门 | “先问我 N 个问题”或“先给旁白和分镜，我确认后再做” | 风之谷AI（先问 4 个问题）、Benx、余弦 |
| 11. 气质 | 一两个形容词定调，比如“少量浪漫主义”“像专业团队的正式作品，不要像 demo” | 风之谷AI、余弦起手式 |
| 12. 交付 | 最终能直接导出 MP4 | WY |

**作者们说的反向经验**：Benx 和余弦都说**不要写太满**，把目标、受众、时长、素材说清楚，其余让它发挥，出来以后再像导演一样提意见【实证】。杨攀在播客里也说，现在的写法基本只剩一件事，就是对齐“我想干什么”【转述，[Orange AI 播客纪要](https://x.com/oran_ge/article/2104725840969998530)】。

### 2.6 三个真实提示词的结构拆解（用我的话概括，不是原文）

**例 1｜风之谷AI《星舰科普》（约 380 字，B 站简介全文公开）**【实证，[BV1VxhD6jE5V](https://www.bilibili.com/video/BV1VxhD6jE5V)】

1. 工作环境：新建一个文件夹来做。
2. 定位：用“高级YouTube科普视频”的方式讲最新的星舰。
3. 内容清单：原理、3D 拆解分离演示、真实场景还原、马斯克本人态度、预测、最新技术成果。
4. 规格：50–70 秒，中文解说，指定用 SeedAudio 的 API 生成。
5. 镜头清单：完整的 3D 分镜设计、模型拆解、升空、分离、回收全过程、筷子夹火箭的细节、傍晚天空和大气渲染。
6. 闸门：动手前先问我 4 个决定性的问题。
7. 授权：可以联网调研，可以下载开源代码库参考。
8. 禁止：不用视频生成模型，音效音乐也要纯代码实现。
9. 审美：极高的流畅度和前沿审美，符合 SpaceX 的气质，加一点浪漫主义。

结果：耗时 5 小时，用了 200 美元档周额度的 18%。工具链是 Blender + Mantaflow + Remotion，声音用代码合成，解说用 SeedAudio。

**例 2｜宝玉“教学视频”（约 70 字）**【实证，[宝玉文章](https://x.com/dotey/article/2105181393638531536)】

1. 任务：做一个教学视频。
2. 附件：素材是一个 Markdown 文件；Gemini 的 API Key 放在 .env 里。
3. 画法：JS + Canvas 绘制。
4. 风格：手绘卡通，有动效。
5. 配音：Gemini 3.8 Flash TTS。
6. 效果三条：通俗易懂、开头吸引人、看完有收获。

他自己的点评：这段话交代了素材、画法、风格、配音和内容要求五件事。

**例 3｜Benx（少数派）“30 秒竖版讲解”模板**【实证，[少数派](https://sspai.com/post/115283)】

1. 任务：30 秒竖版视频，主题写明。
2. 风格：只定底色和一个强调色，设计和节奏让它发挥。
3. 配音：指定平台、模型、音色和语气（比如“活泼的科技博主”）。
4. BGM：生成 30 秒纯音乐，音量压低。
5. 时间：字幕跟着配音走，场景时长按配音长度自动算。
6. 五条底线：画面只由时间决定；中文字号不小于 40px，对比度要够；渲染前先截几帧关键画面自检；重要文字留在安全区；渲染后用 ffprobe 核对分辨率、时长和帧率。
7. 闸门：先别写代码，先给旁白、分镜表和 4 个关键画面的描述，确认后再做。

他特别强调：没指定框架，也没让它用 skill。

**补充两个短例子：**

- **WY《大气环流》**【实证，[WY 推文](https://x.com/akokoi1/status/2102606609574941028)】：
  - 提示词结构：知识点（高中地理“大气环流”）+ 风格（轻松有趣、线稿）+ 加音乐 + 引人入胜 + 中英双语字幕 + TTS 解说（文档放在 TTS.md，API Key 和音色放在 .env，有关水印的参数就关掉）+ 最终要能直接导出。
  - 准备工作：去豆包、智谱、海螺或千问任选一家，把它的 TTS 文档存成 TTS.md。
  - 安全设置：在 `.claude/settings.json` 里加一条 `"deny": ["Read(./.env)"]`，让 Claude 读不到密钥。
- **余弦“起手式”（7 行模板）**【实证，[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)】：主题、时长、给谁看 → 像专业团队的正式作品，不要像 demo 或网页录屏 → 要有配乐，动作卡点 → 素材用真实截图或文档，不要编界面、编事实 → 参考片链接 → 先给 3 个分镜方向，每个场景一张静帧，选完再做动画。

---

## 3. 声音：配音、配乐、音效，怎么和画面对齐

### 3.1 配音

| 方案 | 谁在用 | 作者评价 |
|---|---|---|
| **MiniMax speech-2.8-hd**（网页上逐段合成） | 路北路陈（由 Codex 去操作 MiniMax 网页） | 【实证】[BV1hWar6SEVP](https://www.bilibili.com/video/BV1hWar6SEVP) |
| **MiniMax 声音克隆（克隆自己的声音）** | 王树义《中途岛海战》《黑水河之战》 | 【实证】[BV1yWhQ6iESL](https://www.bilibili.com/video/BV1yWhQ6iESL)、[BV1TGag6oEn9](https://www.bilibili.com/video/BV1TGag6oEn9) |
| **Gemini 3.8 Flash TTS** | 宝玉；CaldariNav《黎曼猜想》（25 分钟）；Benx（通过 kie.ai 调用，音色 Kore） | Benx 说中文没问题，有 70 个音色，能用一句话描述语气【实证】[少数派](https://sspai.com/post/115283)、[BV11SaB6NELd](https://www.bilibili.com/video/BV11SaB6NELd) |
| **SeedAudio（豆包系）** | 风之谷AI | 【实证】[BV1VxhD6jE5V](https://www.bilibili.com/video/BV1VxhD6jE5V) |
| **豆包、智谱、海螺、千问的 TTS 任选** | WY | 【实证】[WY 推文](https://x.com/akokoi1/status/2102606609574941028) |
| **edge-tts（免费）** | 余弦；lemo-opuscar 默认用它做中文 | 余弦：免费、稳定，但没什么感情，下次想换；lemo：需要联网【实证】[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources)、[lemo TECHNIQUE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md) |
| **本人真声** | AI鼓励师_悠一（出镜和配音都是本人，剪辑交给 Claude Code）；Axton（保留原声） | 【实证】[BV1s2aV6cELo](https://www.bilibili.com/video/BV1s2aV6cELo) |
| “声音克隆 + 音色设计” | LeaderAI 进阶教程的标题里有这一项，具体用哪家、怎么做**没拿到** | 【实证（仅标题）】[YouTube 镜像](https://www.youtube.com/watch?v=uvVIg0UU0j0) |

### 3.2 配乐

- **让 Opus 用代码现场合成（最常见）**：
  - sadssxa《群论之美》：它先用 Python 合成一段原创配乐（D 小调、90 BPM），按小节卡到每个场景上，再写画面【转述，余弦博客】。
  - 路北路陈：配乐由 Codex 程序合成，第三期用了钢琴、木琴、布吉伍吉【实证】。
  - 余弦：直接让它用 numpy/scipy 合成，按小节卡场景就行；想更像样可以接 ElevenLabs 的音乐 API【实证】。
  - 风之谷AI：音效和音乐都用纯代码【实证】。
- **Suno**：Benx 用 Suno V6 的纯音乐模式，30 秒轻快电子乐，24 秒生成好，一次给两首【实证】。
- **采样库**：lemo-opuscar 用免费采样库（VSCO 2 CE、Salamander 钢琴等），按时间、乐器、音高写谱，并且明确反对用通用的钢琴加弦乐当默认配乐【实证，[TECHNIQUE.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md)、[DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md)】。
- **MV 用现成的歌**：歌本身就是时钟（见 3.4）。

### 3.3 音效

- 几乎都是**代码合成**：余弦“音效直接让它用代码生成”，路北路陈“音效程序合成与混音”【实证】。
- lemo-opuscar 的规矩比较细【实证，[DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md)】：
  - 每个看得见的动作都要有声音，按材质区分（纸、木、金属、玻璃）；
  - 声音分三层：环境声、拟音、音乐；
  - 在转折或情绪最高点之前，至少留两处真正的安静；
  - 至少两次用声音做转场（下一场的声音提前进来，或上一场的声音拖过剪辑点）。
- 宝玉的说法【实证】：元素弹出配一声“啵”，转场配一声“嗖”，背景音乐垫在底下，有人说话时调低。

### 3.4 画面怎么和声音对齐（这是知识讲解最关键的一步）

1. **配音先行，配音就是时钟**：先把旁白合成好，拿到每句的时长，最好拿到每个字的时间戳；画面按这份时间表排。ElevenLabs 有带时间戳的接口；如果是现成录音，就用 Whisper 反推每个词的时间【实证，宝玉】。
2. **不要手写时间**：Benx 列为第三个坑，别手写时间，不然改一句文案，后面全乱【实证】。
3. **逐句合成、逐句缓存**：改了哪句只重做哪句；字幕按逐词时间戳切，画面跟着词走，说到哪个词，画面就亮哪里【实证，余弦】。
4. **对齐这件事可以交给另一个 agent**：路北路陈让 Codex 负责“旁白逐行对齐”【实证】。
5. **一个时间轴文件管所有东西**：lemo-opuscar 用一个 `timeline` 文件存段落、速度、节拍和命中点，导出 JSON 给配乐、混音、字幕和检查脚本共用；还有脚本检查每个画面命中点和音乐节拍的误差，目标是 0 毫秒【实证，TECHNIQUE.md】。
6. **配音的校验**：每条 TTS 都用语音识别（faster-whisper）转回文字，和稿子逐字比对，不一致就重生成。中文短句偶尔识别错一个字是正常的，人听一遍确认对了，就把识别结果记成例外【实证，TECHNIQUE.md】。
7. **混音**：有人声时 BGM 自动压低（余弦）；TTS 的峰值偏高，要先压缩再按响度平衡，人声比音乐高约 10 dB；全片两遍 loudnorm 到 −14 LUFS（lemo）；每一集统一响度（余弦）【实证】。
8. **字幕停留时间**：lemo 的经验值是每条字幕至少 1.8 秒，并且不短于这句话的时长加 0.6 秒；中文文字动画结束后，至少停留“字数 ÷ 4.5 + 1.5 秒”【实证，DIRECTOR.md】。
9. **MV 的做法反过来**：
   - SeASnAkE 说，Opus 会自己分析音频波形和频率来卡点、匹配歌词【实证，[linux.do 2954172](https://linux.do/t/topic/2954172)】。
   - 南辰燏炚说，理解音乐和审片时借了 Gemini 的“眼睛”，另外用了节拍检测、人声分离、歌词对齐工具【实证，[BV1vthX6XEwm](https://www.bilibili.com/video/BV1vthX6XEwm)】。
   - 播客里歸藏的观察是，Opus 不是先做画面再随便配音乐，它构思时脑子里就有成片，片头打字音卡在节拍器的 BPM 上【转述，[Orange AI 播客纪要](https://x.com/oran_ge/article/2104725840969998530)】。

---

## 4. 花多少时间、多少钱（作者自报）

订阅档位按作者原话写。对应关系是我的理解【推断】：Pro 是 20 美元一档，“100 刀计划”是 Max 5x，“200 刀周额度”是 Max 20x。订阅额度有“5 小时窗口”和“周额度”两种算法，**额度百分比不能直接换算成美元**。

| 作者 / 作品 | 成片 | 耗时 | 花费（原话口径） | 证据 |
|---|---|---|---|---|
| WY《大气环流》 | 近 5 分钟，线稿 + TTS + 双语字幕 | 26 分钟 | “消耗的 token 极低”（没给数字） | 【实证】[推文](https://x.com/akokoi1/status/2102606609574941028) |
| 月踏流云《电子游戏发展史》 | 十几分钟（回帖里网友说看了十几分钟） | 三四十分钟 | Max 5x 周额度约 10% | 【实证】[linux.do 2961904](https://linux.do/t/topic/2961904) |
| SeASnAkE《world.execute(me);》MV | 一首歌长 | 20 多分钟 | Pro 5 小时额度约 30% | 【实证】[linux.do 2954172](https://linux.do/t/topic/2954172) |
| 风之谷AI《星舰科普》 | 1 分 03 秒，含 3D 和流体 | 5 小时 | 200 美元档周额度的 18% | 【实证】[BV1VxhD6jE5V](https://www.bilibili.com/video/BV1VxhD6jE5V) |
| 余弦 长教程 | 40 多分钟，分 EP | 没说 | Max 5x（100 美元档）额度约 20%，“比预想的少” | 【实证】[余弦博客](https://blog.cosine.ren/post/opus-5-5-motion-video-resources) |
| 穆阿蒂布《world.execute(me);》 | 13015 帧 4K | 没说 | 按 API 挂牌价约 570 美元；总计约 13 亿 token，其中 97.6% 是缓存读取；输出 729 万 token | 【实证】[BV1SgaY64EG5](https://www.bilibili.com/video/BV1SgaY64EG5) |
| killset（linux.do） | 5 分钟论文科普 | — | 5 小时额度的 27%，“质量还行” | 【实证】[linux.do 2979611](https://linux.do/t/topic/2979611/7) |
| ValiantWillow17（linux.do） | 几个视频 | — | 每个约占 Pro 5 小时额度的 10% | 【实证】[linux.do 2979611](https://linux.do/t/topic/2979611/20) |
| link1412（linux.do） | 1 分钟以内 | — | 不审片一遍出，几块钱；加两次审片（一次看画面对比度和亮度，一次分析声谱）和修复，约 1 亿 token | 【实证】[linux.do 2979611](https://linux.do/t/topic/2979611/7) |
| starryskymeow（linux.do） | 一条 oneshot | — | 走第三方站点约 31 美元 | 【实证】同上 |
| 鹿饮林空《朝鲜半岛五千年》线稿动画 | — | — | 标题写“不到 3 块钱” | 【转述（只看到标题）】[推荐列表](https://www.bilibili.com/video/BV1s2aV6cELo) |
| 小肥肠（掘金） | 知识科普模板 | 流程打磨了 3 个月 | “剪辑一个视频 token 成本太高”，所以暂时不卖模板 | 【实证】[掘金](https://juejin.cn/post/7693225151680774154) |
| 爱学习的乔同学 | 6 分钟讲 Remotion 原理 | 自称做了 14 小时 | — | 【实证】[BV1dcaW6rEbs](https://www.bilibili.com/video/BV1dcaW6rEbs) |
| （对照）kimmonismus《AI 简史》 | 3 分钟，Remotion | 约 1 小时 | 周额度 7% | 【转述】[opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) |
| （对照）NotinReality P(doom) MV | 156.6 秒 | 45 分钟 | Max 5x 周额度 10% | 【转述】[linux.do 2943096](https://linux.do/t/topic/2943096/1) |

**API 单价**：Opus 5.5 每百万 token 输入 4 美元、输出 20 美元；缓存命中 0.20 美元，是输入价的 5%；5 分钟缓存写入是输入价的 1.25 倍，1 小时缓存写入是 2 倍【转述，余弦引用官方定价页；宝玉文章也写了 4/20】。

**【推断】穆阿蒂布那条片子的账能对上**：缓存读取 12.69 亿 × 0.20 美元/百万 ≈ 254 美元；缓存写入 2533 万 × 5 + 431 万 × 8 ≈ 161 美元；输出 729 万 × 20 ≈ 146 美元；合计约 561 美元，和他自报的“约 570 美元”一致。这也说明：**做视频是典型的长任务，钱主要花在反复读同一大段上下文上，缓存越便宜越划算**。余弦自己也把额度用得少归功于缓存命中便宜【实证，余弦博客】。

**【推断】对一条 3–5 分钟、带配音的知识讲解**：按上面几个中文自报，订阅 Pro 大概要占 5 小时额度的 10%–30%，加上审片和返工往往要翻倍；做成系列、每周两三条，Pro 会比较紧，Max 5x 比较从容。3D 和 Blender 路线要再贵一个量级（风之谷：1 分钟花 5 小时、周额度 18%）。

---

## 5. 大家踩过的坑（作者自己说的）

**内容层面**

1. **“一句话直出”多半是多轮**：NotinReality 那支说明文件里写了跑过两轮【转述，宝玉】；铼夏改了 8 次【实证】；晚风和鱼改了 3 版【实证】。预算要按多轮来估【转述，opus-video-prompts】。
2. **高大上但看不懂**：linux.do 的 adalia 说，有时候做出来的视频有点深奥，看着高大上，但看不太懂【实证，[linux.do 2979611](https://linux.do/t/topic/2979611)】。对知识讲解，这是最致命的一条【推断】。
3. **事实会编**：余弦的对策是要求口播里每件事都能在资料里找到出处，找不到就不说【实证】。路北路陈把“事实核对”明确写进了 Opus 的分工【实证】。风之谷AI 在片尾注明“动画为模拟演示，非真实影像；数据截至某日”【实证】。
4. **活物和人脸画不好，太空场景容易过曝发白**，要在提示词里专门要求真实的颜色【实证，宝玉】。
5. **审美还得人来定**：Axton 的结论是，它能自己查出技术错误，但画面美不美、往哪个方向走，仍要人介入【实证，[Axton YouTube 简介](https://www.youtube.com/watch?v=lKDeWpOMpsM)】。

**技术层面**

6. **中文字体会渲染成方块**：要写明用系统里的苹方或微软雅黑【实证，Benx】。路北路陈只用 SIL OFL 开源字体（Inter、思源黑体等）【实证】；lemo 建议把中文字体按用到的字做子集，放进项目里【实证】。
7. **浅色字看不清**：不管用不用 skill，都让它截图检查文字对比度【实证，Benx】。
8. **网上下载的视频素材渲染时会卡帧**：先用 ffmpeg 重新编码，加 `-g 30 -keyint_min 30`【实证，Benx】。
9. **手写时间轴**：改一句文案，后面全乱（见 3.4）【实证，Benx】。
10. **框架和 skill 的两难**：用了有 PPT 感、模板感；不用则可控性差、部分文字可读性差【实证，Benx】。
11. **渲染慢**：余弦直接让它想办法，它做了这些事：多开并发、开 GPU、复用同一个浏览器实例、分集分段缓存、只重渲改过的帧、慢变化图层（比如进度条）只渲三分之一的帧再叠上去、审片时先降分辨率。结果合集从约 21 分钟降到约 9 分钟，进度条层从 15 分钟降到 2 分多钟，单集从 6 分钟降到 4 分钟【实证】。lemo 补充：颗粒（grain）不要画在网页里，否则每一帧都压不动，要在 ffmpeg 里加【实证】。
12. **长会话上下文爆掉**：余弦用 HANDOFF 文档交接【实证】；linux.do 有人认为中途断掉多半和上下文长度（200k）有关【实证，[linux.do 2979611](https://linux.do/t/topic/2979611/20)】。
13. **中转站**：用中转站经常做一半就中断【实证，killset】；中转会掺水，掺一次水整片就毁了【实证，abao，同帖】。少数派那篇推荐了中转站，但文末注明链接带他的邀请码【实证，[少数派](https://sspai.com/post/115283)】；LeaderAI 和来真的的简介都在推一个“官方半价”的转售站【实证】。**这些都有商业利益，而且第三方转售可能违反服务条款**【推断】。
14. **审片烧 token**：两轮审片加修复约 1 亿 token【实证，link1412】。
15. **密钥安全**：在 settings.json 里 deny 读取 .env【实证，WY】。

**声音层面**

16. **免费 TTS 没有感情**：edge-tts 稳定但没感情【实证，余弦】；Kokoro 能离线读中文，但很平【实证，lemo】。
17. **TTS 会念错**：每句都要用语音识别回读校对【实证，lemo】。

**合规层面**

18. **AI 生成标识**：LeaderAI 的科普片、电子智人的片子在 B 站都挂了“含 AI 生成内容”【实证】。
19. **版权**：
    - 路北路陈在简介里写明：画面里的海报、标志、指示牌都是按风格重新演绎的虚构示意；引用的剧照注明来源，仅作评论引用【实证】。
    - 穆阿蒂布按 Mili 官方的版权规约制作，并标注了 AI 生成【实证】。
    - 悠一注明同人作品的角色和剧情版权归原作方【实证】。
    - lemo 的红线：参考作品只学语法，不抄角色、旋律、镜头和字体【实证】。
20. **更早一代的坑（Codex + HyperFrames，Opus 5.5 之前）**：中文字幕声画不同步，要强制用逐字时间戳；动画元素突然消失，要给每个元素显式加 ID【转述，[掘金](https://juejin.cn/post/7648530852034838580)，那篇用的是更早的模型】。

---

## 6. “爆款”经验（作者自己总结的，加我的判断）

**作者自述或二手统计**

- **做栏目，不做单条**：路北路陈“设计风格小课”第一期 B 站约 8.6 万播放、7517 收藏【实证，见 `B站候选清单.md`】。每期结构固定：一个风格名、来历、四条规则、今天的案例、争议、一张“风格卡”，外加一段“可以直接复制给 AI 的描述”和延伸阅读；选题来自上期弹幕和评论区；画面本身就用这期讲的风格来做【实证，[BV1hWar6SEVP](https://www.bilibili.com/video/BV1hWar6SEVP)、[BV1ZuHn6VEFi](https://www.bilibili.com/video/BV1ZuHn6VEFi)】。
- **收藏率高的是“有用、要留着”的内容**：电子智人《信息论》约 9.1 万播放、8104 收藏；路北路陈《瑞士风格》约 8.6 万播放、7517 收藏，收藏率都在 9% 左右【实证，`B站候选清单.md`】。
- **AI 讲 AI、自指人设最容易爆；科普类“公式比画质更重要”**：这是对 893 条 X 上 Opus 5.5 视频的分类统计（游戏 207 条、AI 讲 AI 167 条、广告 138 条、科普 116 条）【转述，[SuSu 推文](https://x.com/NFT_Chen/status/2103770552095883364)，数据来自 athemeroy/awesome-opus-5-5-videos】。电子智人的《opus家族史》《自指》都踩中了“AI 讲自己”这一点【推断】。
- **价值在“拆解知识点”**：WY 认为 Opus 5.5 拆解和讲述知识点的能力远超其他模型，所以做视频有意义，并说自己“要去抖音起号”【实证，[WY 推文](https://x.com/akokoi1/status/2103650399773475318)】。
- **用评论区驱动迭代和选题**：机灵的兰尼根据上期评论把画面做得更丰富，并在简介里问下一期想看什么【实证】；路北路陈同样如此【实证】。
- **向好作品学**：余弦的做法是找一个你觉得好的教程丢给它，让它抽帧研究人家的动效和讲解方式，带着时间码和截图给结论，再直接改进自己的项目【实证】。
- **固定风格，批量出片**：小肥肠说很多人以为他用的是剪映模板，其实是“导演 skill + 主题模板 skill”【实证】。
- **门槛挪了位置**：Benx 认为，做视频的门槛从“会不会用工具”挪到了“能不能说清楚你想要什么”【实证】。
- **未来雨季拆解过 661 条“Vibe 知识大赏”话题视频（标题称“1.2 亿播放”）**，但只拿到简介，**结论不知道**【实证（仅简介），[BV1YCHW62ECA](https://www.bilibili.com/video/BV1YCHW62ECA)】。

**我的判断（都是【推断】）**

- **标题套路**：B 站和抖音这批知识类标题，常见写法是「Vibe知识大赏｜《短名》」，再加一个反直觉问题或具体数字。例子：覃秉丰AI 的“一道门槛划走 628 个”，MoNet_Team 的“为什么先开口的人先赢”。这类标题都是“一个具体数字或反常识问题 + 一个能画出来的模型”（依据 `B站候选清单.md` 和抖音搜索摘要）。
- **流量的一半来自新鲜感**：B 站上播放量高的，标题多是“震惊瘫坐”“吓哭了”这类 AI 圈的梗，观众是来看“AI 能做这个”的；带“Vibe 知识大赏”标签的视频，大多数只有一两百到几百播放。等“AI 做的”不再稀奇，能留下来的是**选题、讲法和固定栏目**，也就是电子智人和路北路陈那种“让人看完真懂了、想收藏”的东西。
- **最大风险是“看不懂”**：Opus 自由发挥时偏爱宏大、抽象的画面（群论、场论、信息论这一类）。对面向普通人的讲解号，要在提示词和审片里卡住“具体例子、看完能复述”。

---

## 7. 对我们最有用的几条（【推断】，供下一版决策）

1. **照抄路北路陈的分工**：Opus 管选题、台本、事实、分镜、画面；另一个 agent（或脚本）管渲染管线、对齐、混音；两边通过任务文档交接；我们只拍板和试听。我们已经有 Remotion 工程，正好对应“工程负责人”那一半。
2. **照抄余弦的长片纪律**：资料先行、出处可查；逐句配音并缓存；HANDOFF 文档；分段缓存渲染；最后人工通看一遍。我们 10 分钟的片子比 5 分钟的更需要这些。
3. **真声发布也一样适用“配音即时钟”**：先录真声，用 ASR 拿到逐字时间戳，画面按字排。这和第二版 `beats.json` 的“锚字”设计是一回事。lemo 的字幕停留公式可以直接放进机器检查。
4. **提示词用 Benx 的骨架**：主题、风格、声音、五条底线，最后加“先给旁白 + 分镜 + 4 个关键画面，确认后再做”。再加我们自己的禁用清单，比如“不要宏大抽象、不要居中大字加渐变”。
5. **做栏目卡片**：学路北路陈，每期结尾一张“概念卡”，加一段可复制的“给自己的一句话练习”，提高收藏率。
6. **额度预算**：一条 10 分钟手绘讲解按 Pro 估会很紧，建议按 Max 5x、每条占周额度 10%–20% 来预估，审片和返工另算。
7. **不走 3D、Blender、视频模型路线**：贵、慢，对手绘心理讲解没有帮助。

---

## 8. 没查到、待核实的

- **几支核心教程的正片内容都没拿到**：来真的《保姆级手把手教程》（39 分钟，章节里有“佛光寺斗栱 3D 拆解”和“cache-explainer”两个示例）、LeaderAI《进阶教程》（24 分钟，含“声音克隆、音色设计”）、T8star-Aix《视频生产流程公开》（13 分钟）、kate人不错两期的“提示要点”、晚风和鱼 6 步的细节、悠一的成本对比数字、爱学习的乔同学的 Remotion 原理讲解。原因：只能读简介；B 站字幕要登录，正片要语音转写，这两样按规矩都不做。
  - 来真的的知识库要三连后在后台私信回复关键词才发链接，这期内容在知识库第 3 章第 2 个文档【实证，[BV1j8aS6UEty](https://www.bilibili.com/video/BV1j8aS6UEty)】。
  - T8 的 openzhenzhen.com 新增了 Opus 5.5 提示词板块，但首页看到的大多是搬运 X 上的案例，没有他本人的流程【实证，[openzhenzhen.com](http://openzhenzhen.com/)】。
- **电子智人**：本人仍然没有公开工具链和提示词。《opus家族史》带 `#remotion` 话题只是一条抖音搜索摘要，没核实。
- **抖音**：网页版需要登录，“风摇叶见蝶”等抖音作者的自述拿不到。
- **知乎**：两篇教程（[2089616300544993151](https://zhuanlan.zhihu.com/p/2089616300544993151)、[2088666051559145786](https://zhuanlan.zhihu.com/p/2088666051559145786)）被拦，只看到摘要，没有使用。
- **小红书、即刻、微信公众号**：这次没检索到有用的一手帖子。
- **鹿饮林空“不到 3 块钱”**：只看到推荐列表里的标题，计价口径不明。
- **未来雨季对 661 条视频的拆解结论**：只有简介，没有内容。
- **少数派引用的“一条片约 0.66 美元”**：源头是 HF 博客，不是作者实测。

---

## 9. 来源

**一手（作者本人）**
- 风之谷AI《星舰科普》：https://www.bilibili.com/video/BV1VxhD6jE5V
- 路北路陈“设计风格小课”01/02/03：https://www.bilibili.com/video/BV1hWar6SEVP 、https://www.bilibili.com/video/BV1xMHh69EZr 、https://www.bilibili.com/video/BV1ZuHn6VEFi
- 穆阿蒂布《world.execute(me);》13015 帧：https://www.bilibili.com/video/BV1SgaY64EG5
- 南辰燏炚《world.execute(me);》：https://www.bilibili.com/video/BV1vthX6XEwm
- SeASnAkE linux.do 自述：https://linux.do/t/topic/2954172
- 月踏流云《电子游戏发展史》linux.do：https://linux.do/t/topic/2961904
- linux.do 费用讨论：https://linux.do/t/topic/2979611
- 晚风和鱼《6 步全流程》：https://www.bilibili.com/video/BV1sThX6TEj2
- 未来雨季Rainorb：https://www.bilibili.com/video/BV1vRHa63EYg 、https://www.bilibili.com/video/BV1YCHW62ECA
- LeaderAI：https://www.bilibili.com/video/BV11fHW6iEqQ 、https://www.bilibili.com/video/BV1SgHZ6TEfq 、进阶教程 YouTube 镜像 https://www.youtube.com/watch?v=uvVIg0UU0j0
- 来真的《保姆级手把手教程》：https://www.bilibili.com/video/BV1j8aS6UEty
- 爱学习的乔同学《技术解读：如何用 Remotion 做视频》：https://www.bilibili.com/video/BV1dcaW6rEbs
- T8star-Aix（YouTube 镜像）：https://www.youtube.com/watch?v=6JT5sBXAmgI ；提示词库 http://openzhenzhen.com/
- kate人不错：https://www.bilibili.com/video/BV15hhR6bEs7 、https://www.youtube.com/watch?v=l3v1edwbhT4
- AI鼓励师_悠一：https://www.bilibili.com/video/BV1s2aV6cELo
- 一起Vibe：https://www.bilibili.com/video/BV1TBaa6JEFS
- 王树义：https://www.bilibili.com/video/BV1yWhQ6iESL 、https://www.bilibili.com/video/BV1TGag6oEn9
- i陆三金：https://www.bilibili.com/video/BV1e9hd6aEX2
- CaldariNav《黎曼猜想》：https://www.bilibili.com/video/BV11SaB6NELd
- 铼夏LAYccc《AI 简史》：https://www.bilibili.com/video/BV1H8av6HEYs
- 机灵的兰尼《俄法战争》：https://www.bilibili.com/video/BV1kjaS64EFA
- 星龙XL《DeepSeek家族史》：https://www.bilibili.com/video/BV1xNpc6MENm
- 电子智人《自指》：https://www.bilibili.com/video/BV1ZZHo6LEEa
- 宝玉《Claude Opus 5.5 是怎么做出视频的》：https://x.com/dotey/article/2105181393638531536
- 余弦《用 Opus 5.5 做视频：制作流程与提示词资源记录》：https://blog.cosine.ren/post/opus-5-5-motion-video-resources
- Benx_AI（少数派）《Claude Opus 5.5 做视频为什么这么强？》：https://sspai.com/post/115283
- 小肥肠（掘金）《从口播稿到成片》：https://juejin.cn/post/7693225151680774154
- WY：https://x.com/akokoi1/status/2102606609574941028 、https://x.com/akokoi1/status/2103650399773475318
- Axton《墨韵》：https://www.youtube.com/watch?v=lKDeWpOMpsM
- code秘密花园 garden-skills：https://www.bilibili.com/video/BV1ypdgBCE9B 、https://github.com/ConardLi/garden-skills
- lemo-opuscar 导演与技术指南：https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md 、https://github.com/lemomo-ai/lemo-opuscar/blob/main/TECHNIQUE.md

**二手**
- 向阳乔木 opus-video-prompts（54 个案例、18 份提示词）：https://github.com/joeseesun/opus-video-prompts
- SuSu 对 X 上 893 条视频的分类统计：https://x.com/NFT_Chen/status/2103770552095883364
- linux.do 转述 NotinReality 的 MV：https://linux.do/t/topic/2943096/1
- Orange AI 播客纪要（歸藏、杨攀、向阳乔木）：https://x.com/oran_ge/article/2104725840969998530
- 掘金《Codex + HyperFrames 全自动视频》（Opus 5.5 之前）：https://juejin.cn/post/7648530852034838580

**本地**
- `D:\desk\claudex\24\3_第三版资料\调研\B站候选清单.md`（B 站搜索接口数据，2026-10-06）
- `D:\desk\claudex\24\2_第二版资料\调研\开源视频方案.md` 第 2 节、`D:\desk\claudex\24\2_第二版资料\资料\参考片拆解_电子智人.md`

---

## 核查结果

- 核查日期 2026-10-06。做法：只找一手来源，包括 B 站视频简介和 B 站公开接口、作者原帖原文、Anthropic 和 Claude Code 官方文档。没看正片，没登录，没用浏览器。
- 从前文挑了 12 条最关键、最容易错的结论逐条重查（主表），另外顺手核了 9 个小项（附表）。
- 总体判断：**没有发现被一手来源直接推翻的核心结论**。需要修正或补充的有：WY 的 .env 防护写法和效果（技术上不准）、SeASnAkE 用的不是 Claude Code（归类错了）、linux.do 一条回帖被读得太确定、穆阿蒂布的账单漏了 Fable 5.1，另有几处数字可以写得更准。

### 主表（12 条）

| # | 结论（前文位置） | 核查结论 | 依据链接 | 备注 |
|---|---|---|---|---|
| 1 | 风之谷AI 星舰片：Blender + Mantaflow + Remotion + 代码合成声音，SeedAudio 解说；耗时 5 小时，用了 200 美元档周额度的 18%；提示词要求先问 4 个问题，不用视频生成模型（§1、§2.6 例 1、§4） | 属实 | https://www.bilibili.com/video/BV1VxhD6jE5V | 简介逐项对得上。补充：SeedAudio 是火山引擎"豆包语音"里的音频生成模型（接口模型名 `seed-audio-1.0`），所以"豆包系"成立【实证，https://www.volcengine.com/docs/DoubaoVoice/audio-generation-http】。简介说给了"300 多字需求和几轮修改意见"，标题写"380 字提示词 + 一次补充优化"，这是作者自己前后说法不一，前文两种都照录了，没问题。 |
| 2 | 穆阿蒂布：Three.js / WebGL2 + GLSL，13015 帧 4K；按 API 挂牌价约 570 美元；约 13 亿 token，97.6% 是缓存读取，输出 729 万（§1、§4），以及 §4"账能对上"的推算 | 属实（需补上下文） | https://www.bilibili.com/video/BV1SgaY64EG5 | 简介原文的数字：总计 1300.55M，缓存读取 1269.13M，缓存写入 29.64M（5 分钟 25.33M + 1 小时 4.31M），输出 7.29M。"4K"只出现在标题里，简介没写分辨率。**前文漏掉的上下文**：简介写明"终版修订与封面"用的是 Claude Fable 5.1，所以不全是 Opus 5.5 做的。Fable 5.1 的官方价是输入 10 / 输出 50 美元每百万（见第 3 条的定价页），§4 全部按 Opus 5.5 单价算出约 561 美元只是近似，"账能对上"有一部分是巧合【推断】。 |
| 3 | Opus 5.5 API 单价：输入 4、输出 20 美元每百万 token；缓存命中 0.20（是输入价的 5%）；5 分钟缓存写入 1.25 倍，1 小时 2 倍。订阅对应：Pro 20、Max 5x 100、Max 20x 200 美元（§4） | 属实 | https://platform.claude.com/docs/en/about-claude/pricing 、https://support.claude.com/en/articles/11049741-what-is-the-max-plan | 官方定价表：Opus 5.5 输入 $4、输出 $20、5 分钟写 $5、1 小时写 $8、命中 $0.20，并单独注明 Opus 5.5 命中价是输入价的 5%（多数模型是 10%）。前文标的是【转述】，可以升级为【实证】。Max 两档价格是网页订阅价，帮助中心注明手机端价格可能不同。 |
| 4 | 路北路陈分工：人定方向、拍板、试听；Opus 5.5 当设计负责人；Codex 当工程负责人（渲染管线、4K60、运动模糊、胶片颗粒、旁白对齐、配乐音效合成、字幕），还在 MiniMax 网页上逐段合成配音（speech-2.8-hd）；两个 AI 靠文档交接（§1、§2.2、§3） | 属实 | https://www.bilibili.com/video/BV1hWar6SEVP 、https://www.bilibili.com/video/BV1xMHh69EZr 、https://www.bilibili.com/video/BV1ZuHn6VEFi | 三期简介都有一节讲怎么做的，分工一致。注意前文是把三期合在一起写的：4K60、运动模糊、胶片颗粒只在第 1 期出现；"看完样片后自己挑问题"出自第 2 期；"七种转场""根据上期评论区选题"和"钢琴、木琴、布吉伍吉"出自第 3 期。第 1 期把"声音设计"记在 Opus 名下、"程序合成与混音"记在 Codex 名下，两边都有份。 |
| 5 | 数据：路北路陈第 1 期约 8.6 万播放、7517 收藏；电子智人《信息论》约 9.1 万播放、8104 收藏；收藏率都在 9% 左右（§0、§6） | 属实（是较早的快照） | https://api.bilibili.com/x/web-interface/view?bvid=BV1hWar6SEVP 、https://api.bilibili.com/x/web-interface/view?bvid=BV1GXav6iEWh | 10-06 重新从 B 站接口取：瑞士风格 87,702 播放 / 7,606 收藏（8.7%）；《信息论》92,746 / 8,241（8.9%）。前文数字和本地 `B站候选清单.md` 一致，只是取得早一些，"9% 左右"的结论不变。 |
| 6 | 余弦：40 多分钟长教程，用了"100 刀计划"约 20% 的额度；edge-tts；HANDOFF 交接文档；渲染提速（合集 21→9 分钟，进度条层 15→2 分多钟，单集 6→4 分钟）；做预告片时开 3 个审片 agent（§2.2、§4、§5） | 属实 | https://blog.cosine.ren/post/opus-5-5-motion-video-resources | 逐条对上。两点提醒：① 原文只说"100 刀计划"，没说是 5 小时窗口还是周额度；"等于 Max 5x"是对照官方价目做的推断，成立。② 文章开头注明"本文由 AI 辅助编写"。sadssxa《群论之美》的"Pro 订阅 + xhigh + 无 skill"是余弦看截图和评论区得出的，前文标【转述】是对的。 |
| 7 | Benx（少数派）：配音用 kie.ai 调 Gemini 3.8 Flash TTS，音色 Kore，70 个音色；BGM 用 Suno V6，30 秒的曲子 24 秒生成、一次给两首；不用框架的版本写了 723 行 Python 画漫画分镜；底线里有中文字号不小于 40px、渲染后用 ffprobe 核对；下载素材要先用 `-g 30 -keyint_min 30` 重编码；要先装 Node.js 22+；文末声明链接带邀请码（§1、§2、§3、§5） | 属实 | https://sspai.com/post/115283 | 每一项原文都有。补充：带他邀请码的不只是中转站（Hongmacc），kie.ai 的链接也带。"70 个音色、中文没问题"是作者自己测的说法，不是 Google 官方数据。文中"一条片约 0.66 美元"他自己注明引自 HF 博客，前文 §8 处理得对。 |
| 8 | 宝玉：教学视频提示词（素材 md、Gemini key 放 .env、JS + Canvas、手绘卡通、Gemini 3.8 Flash TTS、通俗 / 开头吸引人 / 看完有收获）；五步流程；配音当时钟；转述 HeyGen"框架限制越多产出越雷同"；太空场景易过曝；PDoomVideo 跑了两轮（§1、§2、§3、§5） | 属实 | https://x.com/dotey/article/2105181393638531536 | 逐项对上。补充一点：宝玉文中提到有人让 Opus 5.5 用 Manim 做编程知识讲解，SuSu 的分类也把 Manim 列为一条路径。前文 §0 说"中文作者里没找到用 Manim 的公开自述"，这句话本身没错，但别理解成"Manim 这条路没人走"。 |
| 9 | WY：Opus 5.5 用 26 分钟做出近 5 分钟的《大气环流》，token 消耗极低；TTS 文档存成 TTS.md，key 和音色放 .env；在 `.claude/settings.json` 加一条 `"deny": ["Read(./.env)"]`，Claude 就读不到 key（§1、§2.6、§5 第 15 条） | 部分属实 | 原帖 https://x.com/akokoi1/status/2102606609574941028 ；官方文档 https://code.claude.com/docs/en/settings 、https://code.claude.com/docs/en/permissions | 作者原话确实这么说，前文转述没错，**但照着做有两个技术问题**：① 官方文档要求把 `deny` 写在 `permissions` 对象里，即 `{"permissions": {"deny": ["Read(./.env)", "Read(./.env.*)"]}}`，只在最外层写一个 `"deny"` 不符合官方格式。② 官方文档说明，这类规则只拦 Claude 自带的读文件工具，以及 `cat`、`head` 这类它认得出的命令，**拦不住 Python 或 Node 脚本自己打开文件**。做视频时调 TTS 的脚本本来就要从 .env 读 key，所以"Claude 读不到你的 key"说过头了：它看不到 key 的内容，但它写的脚本照样能用。另外前文漏了一个有用的数据：WY 同一串推文里说，他用 Max 5x 做一条 2 分 38 秒的《中华五千年》（没配音），用了 5 小时额度的 3%、周额度的 1%。这条推文没说是线稿，所以 §1 写的"《中华五千年》线稿动画"无法证实。 |
| 10 | 月踏流云《电子游戏发展史》：一句"给游戏的发展史拍一个片子"，max effort，在 Claude Code 里做，三四十分钟，用了 Max 5x 约 10% 额度，双语字幕是事后用 GPT-6-Astra 加的；片长"十几分钟（网友说）"（§2.1、§2.3、§4） | 属实（片长可以写得更准） | https://linux.do/t/topic/2961904 、https://linux.do/t/topic/2961904/13 、https://linux.do/t/topic/2961904/38 | 耗时出自作者回帖"三十还是四十分钟吧"，他自己也记不太清。**片长不用依赖网友说法**：有人问整部 14 分钟是不是都由 Opus 5.5 做的，作者回答"对"，所以片长约 14 分钟。补充：有人问用了哪些工具，作者说自己不清楚，只负责发那一句话；他还提到账号是借朋友的。 |
| 11 | SeASnAkE《world.execute(me);》MV：给音频、歌词，加一句"生成配套 mv"，effort high，20 多分钟，用了 Pro 5 小时额度约 30%；后期用别的模型加推理画面、歌词和封面；Opus 会自己分析波形来卡点（§2.1、§3.4、§4） | 部分属实 | https://linux.do/t/topic/2954172 | 数字和做法都对。**但前文 §2.1 把他放在"开 Claude Code、新建空文件夹"这一栏当例子，和原帖不符**：他说好久没用 Claude Code 了，这次是在 Claude 桌面端用 claude.ai 的云端模式跑的。后期补的东西是：用 GPT-6 Sol 模仿 Claude 界面加推理过程画面和歌词，用 GPT Image 2.5 做封面。 |
| 12 | linux.do 费用帖：killset 一条 5 分钟论文科普用掉 5 小时额度的 27%；ValiantWillow17 每条约占 Pro 5 小时额度 10%；link1412 不审片"几块钱"、两次审片加修复约 1 亿 token；starryskymeow 一条 oneshot 约 31 美元；adalia"高大上但看不懂"；abao"中转会掺水"；killset"中转经常做一半中断"；有人认为中断和 200k 上下文有关（§4、§5） | 部分属实 | https://linux.do/t/topic/2979611 、https://linux.do/t/topic/2979611/12 、https://linux.do/t/topic/2979611/22 | 前 7 项和原帖一致。有两处走样：① "中途断掉多半和上下文长度（200k）有关"：原回帖只有一句"八成是上下文超不过 200k"，再加一句"我有解决办法"，意思含糊，前文读得太确定了，应降为【推断】。② starryskymeow 的 31 美元是在一个叫 any 的公益站（签到领免费额度）上按额度折算的，不是付费中转花掉的真钱；他也说那个站很卡。 |

### 附表：顺手核对的小项

| 结论 | 核查结论 | 依据链接 | 备注 |
|---|---|---|---|
| SuSu 统计 X 上 893 条视频：游戏 207、AI 讲 AI 167、广告 138、科普 116；"自指人设最容易爆""公式比画质更重要"（§6） | 属实 | https://x.com/NFT_Chen/status/2103770552095883364 | 原帖写的是 1138 条去重 MP4，其中 893 条标为相关，160 条带源链接；路径分类里也列了 Manim。 |
| 电子智人《自指》简介只有一句话，挂了"含 AI 生成内容"；本人没公开工具链（§1、§5） | 属实 | https://www.bilibili.com/video/BV1ZZHo6LEEa | 简介全文就是"当一个系统，开始谈论它自己。" |
| 抖音《opus家族史》挂了 `#remotion` 话题（§1、§8） | 未证实 | （本次检索没有找到对应抖音页面） | 仍然只能算未核实，不能拿来证明电子智人用了 Remotion。前文自己也是这么标的。 |
| 星龙XL《DeepSeek家族史》用的是 Codex + DeepSeek V4.1 Flash + Remotion，不是 Opus（§1） | 属实 | https://www.bilibili.com/video/BV1xNpc6MENm | 标题和简介都这样写。 |
| 王树义两部 3D 讲解片用 MiniMax 克隆本人声音，片长"7–8 分钟"（§1、§3.1） | 部分属实 | https://www.bilibili.com/video/BV1yWhQ6iESL 、https://www.bilibili.com/video/BV1TGag6oEn9 | 克隆配音属实。片长：《中途岛海战》8 分 30 秒，《黑水河之战》7 分 39 秒，应写"约 7.5–8.5 分钟"。 |
| 一起Vibe：Opus 规划剧本，调图像和视频模型出镜头，调 TTS 配音，再自己写渲染器拼接调色；约 12 万播放（§1） | 属实 | https://www.bilibili.com/video/BV1TBaa6JEFS | 10-06 接口数据为 126,709 播放。 |
| code秘密花园的 `web-video-presentation` 是 2026-05 发的，早于 Opus 5.5（§1） | 属实 | https://www.bilibili.com/video/BV1ypdgBCE9B | 视频发布于 2026-05-08；简介里还列了 MiniMax CLI。 |
| 铼夏《AI 简史》6 分 30 秒，改了 8 次，人工把控了一些节奏（§2.3） | 属实 | https://www.bilibili.com/video/BV1H8av6HEYs | — |
| 晚风和鱼 6 步、改 3 版、一个晚上做完；未来雨季 2 分 27 秒共 4410 帧；小肥肠"导演 skill + 主题模板 skill"、打磨了 3 个月、因 token 成本高暂不卖模板（§2.2、§4、§6） | 属实 | https://www.bilibili.com/video/BV1sThX6TEj2 、https://www.bilibili.com/video/BV1vRHa63EYg 、https://juejin.cn/post/7693225151680774154 | 小肥肠说的 3 个月是整套剪辑流程的打磨时间。Opus 5.5 9 月 22 日才发布，所以不是 3 个月都在用 Opus 5.5。他说导演 skill 可以交给 Codex 或 Claude Code 等任意 agent 用；他同时在推自己的产品和训练营，有商业利益。 |

### 对前文的影响（【推断】）

1. **§0 第 5 条的花费区间可以往下延**：加上 WY《中华五千年》的周额度 1%（Max 5x，没配音），"Max 周额度用掉 7%–20%"应改成"1%–20%"。从各家自报来看，加配音、加审片、加 3D 是主要的加价项。
2. **§2.6 和 §5 第 15 条引用 WY 的 .env 做法时，要换成官方写法**（`permissions` 里的 `deny`），并说明它只能让 key 的内容不进对话，挡不住 Claude 写的脚本去读 key。真要从系统层面挡住，官方文档建议开启 Claude Code 的 sandbox；但调 TTS 的脚本本来就要用 key，所以这两件事本身就有冲突，要自己取舍。
3. **引用穆阿蒂布"约 570 美元"时要加一句"收尾用了 Fable 5.1"**，不能当成纯 Opus 5.5 的成本。
4. **§2.1 "一句话直出"的例子要把 SeASnAkE 单列出来**：他走的是 claude.ai 云端模式，不是 Claude Code，说明不装本地环境也能出 MV。
5. 前文最主要的风险不在于编造，而在于两点：把多期视频、多条回帖拼成一条来写；把含糊的回帖读得太确定。上面已经逐条标出。
