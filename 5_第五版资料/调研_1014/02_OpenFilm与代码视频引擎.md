# 02｜OpenFilm 复查，和 2026 年 10 月的「代码生成视频」引擎

- 调研日期：2026-10-14。只看网页，没有安装或下载任何东西。
- 数据口径：星数（star）来自 GitHub 页面或 GitHub API，10-14 读取，页面上的「63.4k」这类是 GitHub 自己四舍五入的数。版本和发布时间来自 npm、PyPI、crates.io（三个官方包仓库）。旧星数取自我们自己以前的调研（`1_第一版资料/调研/调研报告.md`，09-29；`3_第三版资料/调研/B_开源提示词库与模板.md`，10-06）。
- **限制**：这一轮的 WebSearch 额度中途用完了（全会话共享 200 次）。后半段只能直接打开官方页面核对，没法再大范围搜。只有靠搜索才能确认的地方，我都标了「（未核实）」。
- 标注：【推断】= 根据材料推出来的，没有一手出处。

---

## 一句话结论

**整套流程还是不换引擎。** OpenFilm 这两天有两件事值得拿 45 秒试一段：一是 0.1.6 版（10-12 晚发布；10-14 深夜又出了 0.1.7）能把时间线直接导成**剪映草稿**；二是它官方示例本身就是一支「每一帧都是代码」的**歌词 MV**。真正的新「形式」（WebGL 辉光、3D 空间、让字本身发光），在我们现在用的 Remotion 里就能做到，不用迁移。

---

## 1. OpenFilm：10-12 以后变了什么

### 1.1 基本数字

| 项目 | 10-12 评估时 | 现在（10-14） | 来源 |
|---|---|---|---|
| 建库时间 | 「约一周大」 | 2026-10-04 建库，npm 上第一版 0.0.1 是 10-03。到今天 10 天 | GitHub API、npm |
| 最新版本 | 0.1.5（10-11） | **0.1.6**：npm 10-12 16:58 UTC 发布（北京时间 10-13 凌晨），GitHub Release 17:25 UTC。从 0.0.1（10-03）到 0.1.6（10-12），10 天发了 8 版，其中 6 天有发版。**核查时补充**：10-14 17:59 UTC（北京时间 10-15 凌晨）npm 又发了 **0.1.7**（GitHub Release 18:14 UTC），内容是桌面版聊天、Studio 标题和字幕样式、时间线小改，外加一条安全修复（声音文件只能从片子文件夹里读）；没有剪映导入。算上它是 12 天 9 版 | npm、Releases |
| Star / Fork | 约 328 / 40（第三方目录 skillsllm 的读数，现在无法复查（未核实）；该页 10-15 已更新成 354 / 42） | **343 / 41**（10-14 的 API 读数）；核查时（10-15 约 02:00 UTC）API 是 **365 / 43**。两天涨了二三十个，还是很慢 | GitHub API、skillsllm |
| 主仓库提交 | — | 默认分支 38 个提交（研究员读数）；0.1.7 发布后页面显示 40 个。10-12 到 10-14 合并了 #26–#46 之间的十几个 PR，主要是：剪映式时间线和剪映草稿（#26、#32）、Windows 上找到 Codex（#38、#40）、Studio 字幕样式、素材替换 | GitHub commits |
| 给 agent 用的 skill | 有 | **没变**。`skills/openfilm/SKILL.md` 只有 462 字节，10-10 以后没改过。内容只是一张指路条：让 agent 运行 `npx -y openfilm@latest`，读它打印出来的说明书（MANUAL.md，约一千多词，估算）。真正的规矩在 MANUAL.md 里 | GitHub contents API、SKILL.md |
| 文档 | 有 README | README 有中文版；有 MANUAL.md（给 agent 看）和 SPEC.md（给想做播放器和编辑器的人看）。**没有任何关于画面风格、字体排版或中文排版的指导** | README、MANUAL.md |
| 示例 | — | `openfilm/examples` 里仍只有 2 部：one-prompt、openfilm-intro。最后一次提交是 10-10，6 star | examples 仓库 |
| 社区作品 | — | Discussions 只有 1 帖（10-13，「local model」，问能不能用本地模型）。「Show and tell」（晒作品）版块是空的。Issues 一共 5 个（含 10-14 新开的 #45），其中 2 个用中文写了标题（#25 智能体识别有问题、#42 想导入剪映草稿） | Discussions、Issues |

### 1.2 0.1.6 版里和我们有关的新东西

| 新功能 | 说明 | 对我们 |
|---|---|---|
| **导出剪映 / CapCut 草稿** | Studio 里选 导出 → 编辑工程 → 剪映，时间线直接写进剪映的草稿文件夹。也能导出给 Premiere Pro 和达芬奇。功能最早在 PR #26（10-12 合并）里加入 | 用户可以在自己熟悉的剪映里改字、改时间。**只能导出，不能导入**：#42 请求导入剪映草稿，维护者（PazChen，仓库里提交最多的人）回复不会去解密加密草稿（原话「won't decrypt drafts」），读明文草稿「合理但没排期」 |
| 发布预设先列中国平台 | 中文界面下「导出 → 社交平台」先列中国平台：第一次默认选哔哩哔哩（1080p、60fps），还有抖音、快手、视频号，以及小红书（3:4） | 作者在照顾中文用户 |
| 剪映式时间线 | 剪映的快捷键、主轨磁吸、联动（开着联动时，删主轨片段，挂在上面的文字、B-roll 和声音一起删） | 用户上手快 |
| Windows 改进 | 多找了 pnpm、nvm-windows、Scoop、winget 等安装位置；10-13、10-14 又修了两次「找不到 Codex」 | 我们是 Windows，这是好事；但也说明 Windows 版还在磨合 |
| 桌面版聊天 | 会话能续上、能中途插话；发布说明写着 agent 一律以完全权限运行，菜单里也没有权限模式 | **风险**：agent 能不经确认就动电脑上的文件。如果试，用命令行版，不用桌面版 |
| 0.1.5（10-11）导出更快 | 用上硬件编码，修了几处逐帧不准的问题 | — |

### 1.3 上次没注意到的两点

1. **官方示例 one-prompt 是一支 90 秒的「歌词 MV」，每一帧都是代码画的。**
   - 用 three.js（网页 3D 库）和 WebGL（浏览器里用显卡画图的接口）。
   - 后期有 bloom（辉光：亮的地方向外溢光）。
   - 歌词按词对时间，画面跟着鼓点跳动：`lyrics.js` 记每个词的起止时间，`audio.json` 记从歌里算出来的拍点、重拍和鼓点。
   - 代码、画面和歌都是 MIT 许可，歌是用 ElevenLabs Music（AI 作曲服务）生成的。
   - 它的渲染引擎 `src/px` 是从 pdoom-video 移植过来的（见第 2.2 节）。引擎说明写着：只有 signal（橙色信号色）和 ember 两种颜色允许线性亮度超过约 0.85，正文用的 bone 色字必须保持清楚。
2. **它的字幕规矩和我们冲突。**
   - 手册写的是：字幕不要画在页面里，要放在配音文件旁边的 .vtt 字幕文件里，由 Studio 生成。
   - 但我们**没有旁白**，双语字幕本身就是画面主角。
   - 手册还说「Studio edits elements, not pixels」（Studio 改的是网页元素，不是像素）。【推断】如果我们用 WebGL 把字画成发光的，Studio 就改不了这些字。想让用户自己改字，字就得是普通网页文字，辉光会弱一些。这一点要靠试用确认。

### 1.4 安全

- 第三方目录 skillsllm 10-11 的扫描结果是「WARNING」：19 个 npm 依赖漏洞（15 个高危、4 个中危），在 @changesets、braces 这类开发用的包里，没有「critical」（最高级）。
- 首次运行会自动下载一个约 100 MB 的无头 Chromium（不带界面的浏览器）。所以试用要先经用户同意。

### 1.5 更新后的判断

| 问题 | 结论 | 理由 |
|---|---|---|
| 整套流程换成 OpenFilm？ | **不换** | 才 10 天，0.1.x 天天发版；社区作品为零；skill 只是一张指路条；字幕规矩和我们冲突 |
| 拿一段试？ | **值得试 45 秒** | 剪映草稿导出，加上现成的歌词 MV 引擎（MIT），正好对上用户想要的「歌词放映」感觉和「自己能改」 |

---

## 2. 其他代码视频引擎（2026-10 现状）

### 2.1 点名要查的

「适不适合」指适不适合我们的暗底、光是主角、双语字幕知识片。

| 引擎 | 擅长什么 | 适不适合 | agent skill | 许可证 | 成熟度 / 最新版 | Star（10-14） |
|---|---|---|---|---|---|---|
| **Remotion**（我们在用 4.0.530） | 用 React 写视频，生态最全 | **最适合**，已经在用 | 官方 `remotion-dev/skills`，12 个 skill，5,137★，10-12 有更新；仓库没有 LICENSE 文件。只管把 Remotion 代码写对，不管怎么讲清知识点 | 个人、非营利、3 人以下的公司免费 | 很成熟。最新 **4.0.535（10-12）**，一周几版 | 64,063（09-29 是 61.1k） |
| **HyperFrames**（HeyGen） | 用 HTML + GSAP（一个网页动画库）写视频；有现成的块目录和 WebGL 着色器转场（shader：在显卡上逐像素算颜色的小程序） | 能做，但官方展示多是产品宣传片；`frame.md` 设计模板多是亮色海报风，暗底要自己做 | 官方说 **21 个**（README 原话，但表里只列了 20 个名字），含 `/faceless-explainer`（不露脸讲解片）和 `/remotion-to-hyperframes`（把 Remotion 工程单向移植过来） | Apache-2.0，可商用 | 非常活跃：研究员读到 **0.8.157（10-14 09:47 UTC）**；核查时已到 **0.8.159**（0.8.158 是 10-14 19:46 UTC，0.8.159 是 10-15 00:56 UTC），一天发几版 | **63,455**（10-14 晚 API 读数；核查时 10-15 约 02:00 UTC 是 63,746，页面显示 63.8k；10-06 是 57,718，8 天涨了约 5.7k） |
| **Motion Canvas** | 用 TypeScript 写矢量讲解动画，带实时预览编辑器 | 能做 2D 图解，但基本停更 | 没找到官方 skill（10-14 核查时搜了一次也没找到；没找到不等于一定没有） | MIT | npm 最新正式版 **3.17.2 是 2024-12-14**，2025-02-16 出过一个 alpha 之后再没有新版。GitHub 上 2025-02 以后只有一次提交（2026-07-02，改文档域名） | 19.3k |
| **Revideo** | Motion Canvas 的分支，能在服务器上直接渲染 | 不推荐 | 没有，README 只说「Claude 或 Codex 能按提示写出场景」 | MIT | npm 0.11.0（2026-07-10），之后没有新版。仓库已从 redotvideo 搬到 midrender，README 说 Revideo 是「Midrender 背后的引擎」；Midrender 具体是什么产品、是不是 AI 动效编辑器（未核实） | 4.1k |
| **Manim CE**（社区版） | 3Blue1Brown 那种数学动画：公式变形、几何、坐标 | **适合做「公式 / 几何」插段**，不适合整片。默认就是黑底 | 官方仓库没有；社区 `adithya-s-k/manim_skill` 约 1.2k★，MIT，分 CE 版和 3b1b 原版两个 skill | MIT | 成熟。**0.22.0（2026-10-08）**：输出格式统一、能配视频编码、小字号排版更清楚 | 41.5k |
| **Theatre.js** | 可视化关键帧编辑器加代码，常配 three.js | 不推荐 | 没有 | 核心库 Apache-2.0，编辑器 AGPL-3.0（改了要开源） | 公开版停在 **0.7.2（2024-05-19）**。README 说开发「暂时」挪到私有仓库，1.0「快了」 | 12.8k |
| **p5.js + p5.capture** | 快速做生成艺术（用规则自动长出图案），一边播放一边录成视频 | 适合拿来打草稿。它挂在 p5 的 draw 循环上，每画一帧录一帧；README 提醒复杂动画会拖慢帧率、让录制不稳定，没写逐帧精确的保证 | 没有 | MIT | p5.capture 有 208 个提交 | 313 |
| **three.js（经 @remotion/three）** | 在 Remotion 里做真 3D：用 `useCurrentFrame()` 驱动 3D 场景 | **适合，零迁移** | 包含在 Remotion skill 里 | 同 Remotion | Remotion 官方包。渲染要把 GL 设成 `angle` | — |
| **video-use**（browser-use） | 剪实拍素材：去口误和空白、调色、烧字幕，剪完自己检查 | 不适合，我们没有实拍素材 | 它本身就是一个 skill | MIT | 默认分支 23 个提交；转写用 ElevenLabs Scribe，要填自己的 ElevenLabs API key（页面没写收费方式，「付费」是我们 09-29 调研的结论，这次没查到依据（未核实）） | 28.9k（09-29 是 27.7k） |
| **OpenFilm** | 见第 1 节 | 见第 1 节 | 有，只是指路条 | MIT（名字和标志是商标） | 0.1.7（10-14 17:59 UTC）；上一版 0.1.6（10-12） | 343（10-15 约 02:00 UTC 是 365） |

### 2.2 自己找到的新项目

| 项目 | 擅长什么 | 适不适合 | agent skill | 许可证 | 成熟度 | Star（10-14） |
|---|---|---|---|---|---|---|
| **pdoom-video**（mexicat） | 一支「全代码歌词 MV」：three.js；逐词卡拉 OK 字；后期有 bloom、halation（胶片光晕：亮处边缘泛红晕）、film grain（胶片颗粒）；导出时做运动模糊；1080p 60fps，4K 是原生渲染 | **很适合当「歌词放映」这类形式的样板**，质感就是暗底加光 | 没有。README 写明是用 Claude（Opus 5.5）在 Claude Code 里做的；14 个提交里有 2 个带 Claude 共同作者署名 | 代码 MIT；**歌和歌词不在 MIT 里** | 2026-09-24 建库，14 个提交，最后一次 10-05。4K 全片在 M5 Pro 上渲了约 57 分钟（作者说法） | 2.8k（不到 3 周） |
| **fframes** | 用 Rust 加 SVG 写视频，用 Skia（一个显卡绘图库）渲染；一帧里能插 Shadertoy 格式的 GLSL 着色器层；作者说 128 秒的片子 36 秒渲完；自带响度检查 | 发光和着色器很合适。但 Windows 上要装 Rust、LLVM 和预编译的 FFmpeg 9.0，门槛高 | 官方：`npx skills add https://fframes.studio`；命令行专门为「看不了视频的 agent」设计（出帧、比对、找问题） | MIT | crates.io 最新 **1.2.1-rc.33（10-14 16:45 UTC）**，同一天早些时候是 rc.32；还是候选版（rc），几乎天天发；最新正式版是 1.2.0 | 2.7k（API 2,745） |
| **OpenMontage** | 多条 agent 制作流水线（仓库简介写 12 条，README 正文写「10+」），底层用 Remotion 或 HyperFrames 渲染 | 只借流程（10-06 已经借过） | 自带 700 多个 skill 和知识文件 | **AGPL-3.0** | 默认分支 478 个提交 | **68.2k**（10-06 是 64,530） |

### 2.3 Remotion 自己的新东西：不迁移就能拿到的「新形式」

| 功能 | 从哪版开始 | 能做什么 | 对我们 |
|---|---|---|---|
| **HTML-in-canvas** | 4.0.455（我们的 4.0.530 已经有） | 把网页元素（包括文字）画进画布，再用 Canvas 2D、WebGL 或 WebGPU 加效果。文档里的例子有：模糊、故障、老式屏幕、放大镜、zoomBlur 转场。渲染时不用开 Chrome 开关；在 Studio 里预览要 Chrome 149 以上并手动开开关；用 WebGL 要设 `--gl=angle`。官方说这个 API 不稳定 | **让双语字本身发光、溢光、带颗粒**，而不是只加一层 text-shadow（文字阴影） |
| **@remotion/three** | 已有 | 3D 场景，镜头可以在空间里穿行 | 前三部（峰终、弱关系、赫布）全是 2D 的线和点，**3D 空间是新形式** |
| Studio 可视化编辑 | 已有，部分功能从 4.0.516 起 | 在 Studio 里拖位置、改字号和颜色、改关键帧。代码必须写成特定样子：样式要直接写在元素上，不能用常量和算式 | 【推断】我们的画面多是程序算出来的，大部分改不了，收益小 |
| 「Copy context for agents」+ Codex 批注 | 4.0.533（10-05） | 在 Studio 里右键一段，复制这段的上下文发给 agent | 改片时定位更准。要升级到 4.0.533 以上 |
| Elements 目录 | 新 | 现成的字幕、图表、背景、文字标记等块 | 偏社交媒体和商业风，适合度低；价格页没看（未核实） |
| 渲染提速 | 4.0.534（10-07） | Chromium 升到 157，Chrome 和 FFmpeg 共享内存，更常用并行编码 | 可能更快（未实测）。我们渲染全片 9 分钟左右，本来就不是瓶颈 |

---

## 3. 和用户问的「蹭热点」有什么关系

这一节只讲「用什么做」。热点本身热不热由别的调研负责，这里不核实。

| 用户提到的方向 | 能借的东西 | 我们怎么做 | 注意 |
|---|---|---|---|
| 「歌词放映」 | pdoom-video、OpenFilm one-prompt 证明了「全代码歌词 MV」能做得很有质感 | 我们没有人声，可以改成「**诗句放映**」：双语句子踩着自己合成的配乐重拍出现，字本身就是光源，用辉光、光晕、颗粒做出胶片感 | **只用我们自己写的句子**，不放任何现成歌词（版权） |
| 「梵高」 | 流场（flow field）：成千上万根短线顺着一个看不见的「风向场」流动，看起来像旋转的笔触 | 用代码画出「像在流动的笔触」，不需要用原画图片 | 热度未核实；用原画图片前要另查图片授权 |
| 瓦罗兰特这类垂直游戏 | 3D 场景加 HUD 界面风（one-prompt 的 `src/px` 引擎里有 hud.js，这个引擎是从 pdoom 移植的） | 用 @remotion/three 做 3D 战术图、视线和遮挡 | 游戏截图和角色形象的版权未核实，先只用代码画的抽象图形 |

---

## 4. 结论

### 4.1 哪些能带来新「形式」

按「新鲜程度 × 迁移成本低」排序：

| 排名 | 新形式 | 参考 | 用什么做 | 成本 |
|---|---|---|---|---|
| 1 | **诗句放映**：句子踩拍出现，字本身发光、外溢光晕、带胶片颗粒 | pdoom-video、OpenFilm one-prompt | 试 OpenFilm 或 Remotion 的 HTML-in-canvas | 低到中 |
| 2 | **真 3D 空间**，镜头在里面穿行 | OpenFilm one-prompt 里的模型城市、地球 | @remotion/three | 低（加一个官方包） |
| 3 | **公式 / 几何变形插段** | 3Blue1Brown | Manim CE 渲一段，再放进 Remotion | 中，只在数学和物理题时用 |
| 4 | **着色器笔触 / 流场** | 梵高式笔触 | Remotion 里的 canvas 或 WebGL；fframes 也行，但 Windows 门槛高 | 中 |

### 4.2 哪些能让制作更快

- **慢在改片的来回，不在渲染。** 全片渲染 9 到 9.5 分钟（`制作命令.md` 的记录），不是瓶颈。所以 fframes 那种「渲得快」对我们用处不大。
- **让用户自己动手改**，是最能省时间的：
  - OpenFilm 的 Studio 改字、改时间，或者导出剪映草稿，在剪映里改。
  - Remotion 4.0.533 的「Copy context for agents」让用户直接指给 Claude 看哪一段。
- HyperFrames 的 21 个 skill 和块目录能让起草更快，但要整套迁移，暗底风格也得自己重做，**暂时不划算**。

### 4.3 不建议碰的

- Motion Canvas、Revideo、Theatre.js：停更或者团队转向了。
- video-use：它剪的是实拍素材。
- OpenMontage：AGPL 许可，流程已经借过。
- 把整套流程迁到 HyperFrames 或 OpenFilm。

---

## 对我们有什么用

### 可借鉴（不装任何东西也能用）

1. **OpenFilm 的 `look` 检查**：把帧打乱顺序画两遍，比较是否一样；顺便查字体有没有加载失败、字有没有被画面边缘裁掉（出处是 README；MANUAL 只写了「同一个 t 画出同一张图」的检查）。【推断】我们的 v4_qa 现在不查「同一时间点是不是同一画面」，可以加上。
2. **one-prompt 的踩拍数据**：一张句子时间表，加一张从音乐里算出来的拍点表（拍点、重拍、鼓点、各频段音量），画面按表脉动。我们的 `score.py` 已经有 `cue.json`，可以顺手导出拍点表。
3. **pdoom 的辉光规矩**：只有少数「信号色」允许很亮，正文字的亮度压住，免得辉光把字糊掉。

### 建议：试一段 45 秒的「诗句放映」

| 项目 | 内容 |
|---|---|
| 试什么 | 45 秒，3 个部分：开头 10 秒钩子 → 6 到 8 句双语诗句，每句落在配乐的重拍上 → 结尾一个满屏奇观，再接 2 到 3 秒硬静音 |
| 用什么做 | OpenFilm 命令行版（用 npx 运行，锁定一个精确版本。写这份时是 0.1.6；10-14 深夜出的 0.1.7 修了「声音文件路径能跳出片子文件夹」的安全问题，建议锁 0.1.7），**不用桌面版**（桌面版里 agent 有完全权限）。画面引擎直接改 one-prompt 的 `src/px`（MIT），配乐还是用我们自己的 `score.py` |
| 放哪 | 单独新建一个试用文件夹，不碰 `video-engine` |
| 多久 | Claude 半天以内（4 小时封顶）；用户 15 分钟（看片，再自己改一句） |
| 前提 | 用户先同意：会从 npm 拉 OpenFilm，第一次运行会下载约 100 MB 的 Chromium |

**怎么判断成不成**（前 3 条必须都过）：

1. **新形式**：把这 45 秒和《峰终》《弱关系》《赫布》的印样放在一起，用户认为「是新东西」。
2. **观感**：和《信息论》并排看不掉档；中文衬线字不发虚、字距不乱；辉光不把字糊掉。
3. **用户能自己改**：用户在 Studio 里把一句字幕的字和出现时间改掉，10 分钟内做完，不用找 Claude。改动要写回工程文件，Claude 再打开时能读到。
4. 剪映（加分项）：导出的剪映草稿在 Windows 版剪映专业版里能打开，轨道和字幕都在。失败了只记一笔，不算整体失败。
5. 技术：`openfilm look` 没有报错；45 秒 1080p 渲染不超过 5 分钟；我们自己的 v4_qa 静止检测通过。

**结果怎么用**：

- 1、2 过了，3 没过：形式留下，搬回 Remotion，用 HTML-in-canvas 做辉光，不用 OpenFilm。
- 1 没过：这个形式放弃，换第 4.1 节的第 2 名（3D 空间）再试。

### 备选试用：30 秒 3D

如果用户更想要「空间感」，可以在 Remotion 里加 @remotion/three，做 30 秒镜头穿过一个光的 3D 空间。成不成看第 1、2、5 条。成本比 OpenFilm 低，因为不换工具。

### 要不要试（汇总）

| 工具 | 要不要试 | 什么时候 |
|---|---|---|
| OpenFilm | **试 45 秒** | 用户点头以后 |
| Remotion HTML-in-canvas、@remotion/three | **要**，在现有工程里就能做 | 下一部片的提案里，作为一个形式候选 |
| 升级 Remotion 到 4.0.535 | 可以，锁精确版本 | 要用「Copy context for agents」或嵌套 HTML-in-canvas 时 |
| Manim CE | 先不试 | 等有数学或物理题时，试一段 20 秒插段 |
| HyperFrames | 暂不 | 如果以后要批量做、追求速度，再评估 |
| fframes | 不试 | Windows 上装 Rust 和 LLVM 门槛太高 |
| Motion Canvas、Revideo、Theatre.js、video-use、OpenMontage | 不试 | — |

---

## 来源

**OpenFilm**
- 仓库主页和 README：https://github.com/openfilm/openfilm
- 仓库数据（建库时间、star、许可证）：https://api.github.com/repos/openfilm/openfilm
- 发布说明（0.1.4–0.1.6）：https://github.com/openfilm/openfilm/releases ，全文（网页版会截断）：https://api.github.com/repos/openfilm/openfilm/releases?per_page=3
- 0.1.6 安装包列表（含 OpenFilm-Setup-x64.exe）：https://api.github.com/repos/openfilm/openfilm/releases/latest
- npm 版本时间：https://registry.npmjs.org/openfilm
- PR #26（剪映草稿导出）：https://github.com/openfilm/openfilm/pull/26
- Issue #42（剪映草稿导入，维护者回复）：https://github.com/openfilm/openfilm/issues/42
- Issues 列表：https://github.com/openfilm/openfilm/issues?q=is%3Aissue
- Discussions：https://github.com/openfilm/openfilm/discussions
- 提交记录：https://api.github.com/repos/openfilm/openfilm/commits?per_page=50
- Skill 文件：https://raw.githubusercontent.com/openfilm/openfilm/main/skills/openfilm/SKILL.md
- 手册：https://raw.githubusercontent.com/openfilm/openfilm/main/packages/openfilm/MANUAL.md
- 中文 README：https://raw.githubusercontent.com/openfilm/openfilm/main/README.zh-CN.md
- 官网：https://openfilm.dev
- 示例仓库：https://github.com/openfilm/examples ，提交：https://github.com/openfilm/examples/commits/main
- one-prompt 说明：https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/README.md
- one-prompt 署名：https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/CREDITS.md
- px 引擎说明：https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/src/px/README.md
- 第三方目录和安全扫描（10-11）：https://skillsllm.com/skill/openfilm

**Remotion**
- 发布记录：https://api.github.com/repos/remotion-dev/remotion/releases?per_page=5
- 4.0.533 说明：https://github.com/remotion-dev/remotion/releases/tag/v4.0.533
- 仓库数据：https://api.github.com/repos/remotion-dev/remotion
- 许可证：https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md
- 官方 skills：https://github.com/remotion-dev/skills ，数据：https://api.github.com/repos/remotion-dev/skills
- Studio 可视化编辑：https://www.remotion.dev/docs/studio/interactivity-best-practices
- HTML-in-canvas：https://www.remotion.dev/docs/html-in-canvas
- @remotion/three：https://www.remotion.dev/docs/three
- Elements：https://www.remotion.dev/elements

**HyperFrames**
- 仓库：https://github.com/heygen-com/hyperframes
- README：https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md
- 发布：https://github.com/heygen-com/hyperframes/releases
- npm：https://registry.npmjs.org/hyperframes/latest
- 提交：https://github.com/heygen-com/hyperframes/commits/main
- 展示页：https://hyperframes.heygen.com/showcase

**其他引擎**
- Motion Canvas：https://github.com/motion-canvas/motion-canvas ，npm：https://registry.npmjs.org/@motion-canvas/core
- Revideo：https://github.com/redotvideo/revideo ，README：https://raw.githubusercontent.com/midrender/revideo/main/README.md ，npm：https://registry.npmjs.org/@revideo/core/latest
- Manim CE：https://github.com/ManimCommunity/manim ，PyPI：https://pypi.org/pypi/manim/json ，0.22.0 更新说明：https://docs.manim.community/en/stable/changelog/0.22.0-changelog.html
- Manim skill：https://github.com/adithya-s-k/manim_skill
- Theatre.js：https://github.com/theatre-js/theatre ，npm：https://registry.npmjs.org/@theatre/core
- p5.capture：https://github.com/tapioca24/p5.capture
- video-use：https://github.com/browser-use/video-use
- pdoom-video：https://github.com/mexicat/pdoom-video ，提交：https://github.com/mexicat/pdoom-video/commits/main
- fframes：https://github.com/dmtrKovalenko/fframes ，crates.io：https://crates.io/api/v1/crates/fframes ，官网：https://fframes.studio
- OpenMontage：https://github.com/calesthio/OpenMontage
- GitHub 话题页（用来发现新项目）：https://github.com/topics/programmatic-video ，https://github.com/topics/motion-graphics?o=desc&s=updated ，https://github.com/topics/video-agent

**我们自己的旧数据**（用来算星数增长）
- `D:/desk/claudex/24/1_第一版资料/调研/调研报告.md`（09-29：Remotion 61.1k、HyperFrames 54.3k、video-use 27.7k）
- `D:/desk/claudex/24/3_第三版资料/调研/B_开源提示词库与模板.md`（10-06：HyperFrames 57,718、OpenMontage 64,530、remotion skills 4,860）
- 渲染耗时：`D:/desk/claudex/24/.claude/skills/firefly/references/制作命令.md`

**核查时补的来源**
- Motion Canvas 提交记录：https://github.com/motion-canvas/motion-canvas/commits/main
- Revideo npm 版本时间：https://registry.npmjs.org/@revideo/core
- pdoom-video 仓库数据和提交：https://api.github.com/repos/mexicat/pdoom-video ，https://api.github.com/repos/mexicat/pdoom-video/commits?per_page=30
- one-prompt `src/px` 文件列表（含 hud.js）：https://api.github.com/repos/openfilm/examples/contents/one-prompt/src/px
- OpenFilm SKILL.md 大小（462 字节）：https://api.github.com/repos/openfilm/openfilm/contents/skills/openfilm
- HyperFrames 发布时间：https://api.github.com/repos/heygen-com/hyperframes/releases?per_page=5
- OpenFilm 0.1.7 发布说明：https://api.github.com/repos/openfilm/openfilm/releases/latest
- OpenFilm 0.1.6 发布页（社交平台预设原文）：https://github.com/openfilm/openfilm/releases/tag/v0.1.6 ；0.1.5（硬件编码）：https://github.com/openfilm/openfilm/releases/tag/v0.1.5
- OpenFilm Issues 总数（搜索 API）：https://api.github.com/search/issues?q=repo:openfilm/openfilm+type:issue
- OpenFilm 贡献者（PazChen 30 次提交）：https://api.github.com/repos/openfilm/openfilm/contributors
- PR #32、#38、#40：https://github.com/openfilm/openfilm/pull/32 ，https://github.com/openfilm/openfilm/pull/38 ，https://github.com/openfilm/openfilm/pull/40
- Show and tell 版块（空）：https://github.com/openfilm/openfilm/discussions/categories/show-and-tell
- fframes 仓库数据：https://api.github.com/repos/dmtrKovalenko/fframes

---

## 核实记录（10-14）

核查员独立打开链接复查。核查时 WebSearch 额度已用完，只用了 WebFetch 打开官方页面和 API。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| OpenFilm 2026-10-04 建库，343 star、41 fork，MIT | ✅ API：created_at 10-04 09:29 UTC，343 / 41，MIT（10-14 晚页面显示 345） | https://api.github.com/repos/openfilm/openfilm |
| OpenFilm 有 Windows 安装包 | ✅ 0.1.6 附件里有 OpenFilm-Setup-x64.exe（约 264 MB）；官网也有下载链接 | https://api.github.com/repos/openfilm/openfilm/releases/latest ，https://openfilm.dev |
| npm 从 0.0.1（10-03）到 0.1.6（10-12 16:58 UTC），10 天 8 版 | ✅ 时间逐条对上。原文「0.1.0 到 0.1.6 一共 10 天」❌ 已改：0.1.0 是 10-05，到 0.1.6 只有 7 天；「几乎天天发」改成「10 天里 6 天有发版」 | https://registry.npmjs.org/openfilm |
| 0.1.6 能导出剪映 / CapCut 草稿，也能导出给 Premiere 和达芬奇（XML） | ✅ 0.1.6 发布说明和 PR #26（10-12 合并）都写了 | https://api.github.com/repos/openfilm/openfilm/releases?per_page=3 ，https://github.com/openfilm/openfilm/pull/26 |
| 发布预设先列中国平台，第一次默认选哔哩哔哩，有抖音 | ✅ 发布说明原话含「the first time, 哔哩哔哩 is picked」；补了「中文界面下」 | 同上（releases API） |
| 联动：删主轨片段，字幕和声音一起删 | ⚠ 原文写的是 titles、B-roll 和 sound，没说「字幕」。已改成「文字、B-roll 和声音」 | 同上（releases API） |
| 桌面版 agent 一律完全权限 | ✅ 原话「every agent works with full access」 | 同上（releases API） |
| #42：维护者说不会解密剪映加密草稿（「won't decrypt drafts」），读明文草稿合理但没排期 | ✅ 维护者 PazChen 10-14 回复，逐字含这几个词；明文草稿「a reasonable idea」，「isn't on our plan right now」 | https://github.com/openfilm/openfilm/issues/42 |
| SKILL.md 只有 462 字节，10-10 以后没改过，只让 agent 读 npx 打印的手册 | ✅ contents API 显示 462 字节；改过它的提交只有 10-10 的「OpenFilm 0.1.3」 | https://api.github.com/repos/openfilm/openfilm/contents/skills/openfilm ，https://api.github.com/repos/openfilm/openfilm/commits?path=skills/openfilm/SKILL.md |
| 手册：画面只由 t 决定；字幕不画进页面、放 .vtt；原话「Studio edits elements, not pixels」 | ✅ 三条都在 MANUAL.md 里，引用逐字一致 | https://raw.githubusercontent.com/openfilm/openfilm/main/packages/openfilm/MANUAL.md |
| `look` 打乱顺序画两遍、查字体和裁字 | ⚠ 内容对，但出处是 README，不是 MANUAL。已在正文注明 | https://raw.githubusercontent.com/openfilm/openfilm/main/README.md |
| Discussions 只有 1 帖，Show and tell 为空；示例仓库 2 部，最后提交 10-10，6 star | ✅ | https://github.com/openfilm/openfilm/discussions ，https://api.github.com/repos/openfilm/examples |
| Issues 共 5 个，2 个是中文用户提的 | ⚠ 共 5 个对（含 10-14 新开的 #45）；「中文用户」改成「用中文写了标题」，因为看不出提问人是哪国人 | https://github.com/openfilm/openfilm/issues?q=is%3Aissue |
| one-prompt：90 秒歌词 MV，每帧都是代码，three.js + WebGL，有 bloom，逐词对时间，跟鼓点；歌由 ElevenLabs Music 生成，代码和歌都是 MIT | ✅ README 和 CREDITS 都写了 | https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/README.md ，https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/CREDITS.md |
| px 引擎从 pdoom-video 改来，只有「信号色」能超过约 0.85 亮度 | ⚠ 来源对；原文是 signal 和 ember 两种颜色、线性亮度。已改 | https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/src/px/README.md |
| pdoom-video：bloom、halation、颗粒、逐词卡拉 OK；09-24 建库；约 2.8k star；代码 MIT，歌和歌词不在内；M5 Pro 渲 4K 约 57 分钟；14 个提交，最后 10-05 | ✅ API：2,755 star，created 09-24，pushed 10-05 | https://github.com/mexicat/pdoom-video ，https://api.github.com/repos/mexicat/pdoom-video |
| 「作者在 README 里感谢了 Claude」 | ⚠ README 是写明「用 Claude 做的」并在致谢里提到 Claude 帮了忙，14 个提交里 2 个带 Claude 共同作者署名。已改写 | https://github.com/mexicat/pdoom-video |
| 「pdoom 的引擎里有 hud.js」 | ⚠ 在 pdoom 仓库里没能直接看到这个文件名（README 只提到 HUD）；one-prompt 移植过来的 `src/px` 里确实有 hud.js。已改 | https://api.github.com/repos/openfilm/examples/contents/one-prompt/src/px |
| Remotion 最新 4.0.535（10-12），64,063 star；4.0.533（10-05）加了「Copy context for agents」和 Codex 批注；4.0.534 升 Chromium 157、Chrome 和 FFmpeg 共享内存 | ✅ 10-14 晚 API 是 64,065 | https://api.github.com/repos/remotion-dev/remotion/releases?per_page=5 ，https://api.github.com/repos/remotion-dev/remotion |
| HTML-in-canvas 从 4.0.455 起；渲染不用开关；Studio 预览要 Chrome 149+；WebGL 要 `--gl=angle`；API 不稳定 | ✅ 效果的说法稍改：文档说可用 Canvas 2D、WebGL 或 WebGPU，不全是 WebGL | https://www.remotion.dev/docs/html-in-canvas |
| remotion-dev/skills：12 个 skill，5,137 star，10-12 有推送，没有 LICENSE | ✅ API license 为 null | https://api.github.com/repos/remotion-dev/skills ，https://github.com/remotion-dev/skills |
| Remotion 对个人、非营利、3 人以下公司免费 | ✅ | https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md |
| 我们用的是 Remotion 4.0.530 | ✅ | `D:/desk/claudex/24/video-engine/package.json` |
| HyperFrames：Apache-2.0，约 63.4k star（10-06 是 57,718），0.8.157（10-14），21 个 skill，含 /faceless-explainer、/remotion-to-hyperframes | ✅ API 63,455；0.8.157 发于 10-14 09:47 UTC。README 写「21 个」，但表里只列出 20 个名字 | https://api.github.com/repos/heygen-com/hyperframes ，https://api.github.com/repos/heygen-com/hyperframes/releases?per_page=5 ，https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md |
| Motion Canvas 正式版 3.17.2（2024-12-14），之后只有 2025-02 一个 alpha | ✅ 补了一句：GitHub 2025-02 后只有一次改文档域名的提交（2026-07-02），「已停更」改成「基本停更」 | https://registry.npmjs.org/@motion-canvas/core ，https://github.com/motion-canvas/motion-canvas/commits/main |
| Theatre.js 公开版停在 0.7.2（2024-05-19）；开发「暂时」挪到私有仓库；核心 Apache、编辑器 AGPL | ✅ | https://registry.npmjs.org/@theatre/core ，https://github.com/theatre-js/theatre |
| Revideo npm 0.11.0「大约 2026-07，确切日期未核实」 | ✅ 查到了：2026-07-10。Midrender 是「AI 动效编辑器」查不到依据，标未核实 | https://registry.npmjs.org/@revideo/core ，https://raw.githubusercontent.com/midrender/revideo/main/README.md |
| Manim CE 0.22.0（2026-10-08），41.5k star，MIT；manim_skill 约 1.2k star，分 CE 和 3b1b 两个 skill | ✅ 41,528 star；manim_skill 1,168 star | https://pypi.org/pypi/manim/json ，https://api.github.com/repos/ManimCommunity/manim ，https://api.github.com/repos/adithya-s-k/manim_skill |
| fframes：Rust + SVG，能插 Shadertoy 着色器；128 秒片 36 秒渲完（作者说法）；1.2.1-rc.32（10-14），MIT；Windows 要 LLVM 和预编译 FFmpeg 9.0 | ✅ 补了一句：最新正式版是 1.2.0 | https://github.com/dmtrKovalenko/fframes ，https://crates.io/api/v1/crates/fframes |
| video-use 剪实拍，28.9k star，MIT；转写要「付费的」ElevenLabs Scribe | ⚠ 前面都对（28,938）；页面只写要自己的 ElevenLabs key，没写收费，「付费」标为未核实 | https://api.github.com/repos/browser-use/video-use ，https://github.com/browser-use/video-use |
| OpenMontage 68.2k star，AGPL-3.0，12 条流水线，478 个提交 | ⚠ star、许可证、提交数对（68,195）；流水线数仓库自己前后不一（简介 12、正文「10+」），已注明 | https://api.github.com/repos/calesthio/OpenMontage ，https://github.com/calesthio/OpenMontage |
| p5.capture「跟着实时播放录、没保证逐帧精确」 | ⚠ README 说的是挂在 draw 循环上逐帧录，复杂动画会让录制不稳定。已改写；313 star、208 提交对 | https://github.com/tapioca24/p5.capture |
| skillsllm 安全扫描：WARNING，约 19 个漏洞，没有 critical | ✅ 19 个：15 高危、4 中危；页面写的是扫描日期 10-11，不是收录日期，已改 | https://skillsllm.com/skill/openfilm |
| 全片渲染 9 到 9.5 分钟（约 16 fps） | ✅ 制作命令.md 第 143 行 | `D:/desk/claudex/24/.claude/skills/firefly/references/制作命令.md` |
| 旧星数（09-29：Remotion 61.1k、HyperFrames 54.3k、video-use 27.7k；10-06：HyperFrames 57,718、OpenMontage 64,530、skills 4,860） | ✅ 和我们自己的两份旧调研对上 | `1_第一版资料/调研/调研报告.md`，`3_第三版资料/调研/B_开源提示词库与模板.md` |
| HyperFrames 展示页「多是产品宣传片」 | ⚠ 大体对：展示页主要是产品和发布片、工具演示；也有少量图解和数据类模板，没看到暗底知识片 | https://hyperframes.heygen.com/showcase |

## 核实记录（10-14，第二轮复核）

第二位核查员从头重查（10-14 晚到 10-15 约 02:00 UTC）。用 WebFetch 打开官方页面和 API，WebSearch 只搜了 2 次（查 Motion Canvas、Manim 有没有官方 skill）。GitHub API 查到一半被限流（未登录每小时 60 次），后面改看 GitHub 网页。数字会一直变，下表写的是核查时的读数。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| OpenFilm 10-04 建库；343 star、41 fork；MIT；有 Windows 安装包 | ✅ 建库 2026-10-04 09:29 UTC、MIT 都对；343 / 41 是 10-14 的读数，核查时已是 365 / 43（已在正文补上）；0.1.6 和 0.1.7 的附件里都有 OpenFilm-Setup-x64.exe，官网也有「Download for Windows」 | https://api.github.com/repos/openfilm/openfilm ，https://api.github.com/repos/openfilm/openfilm/releases?per_page=3 ，https://openfilm.dev |
| npm 0.0.1（10-03）到 0.1.6（10-12 16:58 UTC），10 天 8 版，6 天有发版 | ✅ 逐条对上。⚠ 已过时：10-14 17:59 UTC 又发了 0.1.7（正文已补）。原先研究员自报的「几乎天天发」偏夸张，正文用的是「6 天有发版」，没问题 | https://registry.npmjs.org/openfilm |
| 0.1.6 能导出剪映 / CapCut 草稿，也能导给 Premiere 和达芬奇；中文界面先列中国平台，第一次默认哔哩哔哩，也有抖音 | ✅ 0.1.6 发布页原文列了哔哩哔哩（1080p、60 fps）、抖音、快手、视频号、小红书（3:4），并写明第一次选哔哩哔哩；PR #26 10-12 合并，Premiere、达芬奇走 XML | https://github.com/openfilm/openfilm/releases/tag/v0.1.6 ，https://github.com/openfilm/openfilm/pull/26 |
| #42：只能导出不能导入；不会解密剪映加密草稿（「won't decrypt drafts」）；读明文草稿合理但没排期 | ✅ PazChen 10-14 回复，原文含「won't decrypt drafts」；明文草稿是「a reasonable idea」，但「isn't on our plan right now」。⚠ 页面给 PazChen 的标签是「Contributor」，不是「Maintainer」；他在 40 个提交里占 30 个，还合并别人的 PR，叫维护者说得过去，正文已注明是谁 | https://github.com/openfilm/openfilm/issues/42 ，https://api.github.com/repos/openfilm/openfilm/contributors |
| SKILL.md 只有 462 字节，10-10 以后没改过，只让 agent 读 npx 打印的手册 | ✅ contents API 462 字节；改过它的提交只看到 10-10 的「OpenFilm 0.1.3」；内容就是让 agent 跑 `npx -y openfilm@latest` 再照手册做 | https://api.github.com/repos/openfilm/openfilm/contents/skills/openfilm ，https://github.com/openfilm/openfilm/commits/main/skills/openfilm/SKILL.md |
| 手册约一千词 | ⚠ 两次估算分别是约 1,100 词和约 1,500 词，已改成「约一千多词，估算」 | https://raw.githubusercontent.com/openfilm/openfilm/main/packages/openfilm/MANUAL.md |
| 手册：画面只由 t 决定；字幕不画进页面、放 .vtt；原话「Studio edits elements, not pixels」 | ✅ 三条都在：「the picture depends only on t」「never draw subtitles in a page」，字幕放同名 WebVTT 文件；第三句逐字一致 | https://raw.githubusercontent.com/openfilm/openfilm/main/packages/openfilm/MANUAL.md |
| 手册没有画面风格、字体或中文排版的指导 | ✅ 手册只说样式用 CSS、字体放进共用文件，没提 typography、Chinese、CJK | 同上 |
| Discussions 只有 1 帖；Show and tell 为空；示例仓库 2 部，最后提交 10-10 | ✅ 唯一一帖「local model」（General，10-13）；Show and tell 页显示「There are no matching discussions.」；examples 里只有 one-prompt、openfilm-intro，pushed_at 10-10，6 star | https://github.com/openfilm/openfilm/discussions ，https://github.com/openfilm/openfilm/discussions/categories/show-and-tell ，https://api.github.com/repos/openfilm/examples |
| Issues 共 5 个，#25、#42 是中文标题 | ✅ 搜索 API total_count = 5（#25、#35、#36、#42、#45） | https://api.github.com/search/issues?q=repo:openfilm/openfilm+type:issue |
| 主仓库 38 个提交 | ⚠ 核查时页面显示 40 个（0.1.7 发布后），38 这个数没法回头复查，正文已改 | https://github.com/openfilm/openfilm |
| 10-13、10-14 两次修「找不到 Codex」 | ✅ PR #38 10-13 合并，PR #40 10-14 合并 | https://github.com/openfilm/openfilm/pull/38 ，https://github.com/openfilm/openfilm/pull/40 |
| 0.1.5（10-11）用上硬件编码 | ✅ 原文说 H.264、HEVC 在显卡编码器可用时走显卡，Windows 上支持 NVIDIA、Intel、AMD 和 Windows 自带的 | https://github.com/openfilm/openfilm/releases/tag/v0.1.5 |
| one-prompt：90 秒歌词 MV，每帧是代码；three.js + WebGL；bloom；逐词对时间；跟鼓点；歌由 ElevenLabs Music 生成；代码和歌都是 MIT | ✅ README 原文「A 90-second lyric music video where every frame is code」，片子、代码和歌都是 MIT。⚠ 小细节：README 本身没提 ElevenLabs 和 pdoom，这两点写在 CREDITS.md 里，正文的出处列表两个都列了，不用改 | https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/README.md ，https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/CREDITS.md |
| px 引擎从 pdoom-video 移植；只有 signal 和 ember 能超过约 0.85 线性亮度；bone 色字要清楚 | ✅ 原文「Only signal and ember may exceed ~0.85 linear」「Bone type must stay crisp」 | https://raw.githubusercontent.com/openfilm/examples/main/one-prompt/src/px/README.md |
| pdoom-video：全代码歌词 MV，bloom、halation、颗粒、逐词卡拉 OK；09-24 建库；约 2.8k star；代码 MIT，歌和歌词不在内；M5 Pro 上 4K 约 57 分钟；14 个提交，2 个带 Claude 署名 | ✅ API 2,766 star、建库 09-24、最后推送 10-05；14 个提交，其中 2 个带 Claude 共同作者署名（一个 Fable 5.1，一个 Opus 5.5）；README 写「made with Claude (Opus 5.5) in Claude Code」 | https://api.github.com/repos/mexicat/pdoom-video ，https://github.com/mexicat/pdoom-video ，https://api.github.com/repos/mexicat/pdoom-video/commits?per_page=30 |
| Remotion 最新 4.0.535（10-12），64,063 star；4.0.533 加「Copy context for agents」和 Codex 批注；4.0.534 升 Chromium 157 | ✅ 4.0.533（10-05）原文「Add "Copy context for agents"…」「Integrate with ChatGPT Codex annotation system」；4.0.534（10-07）「Upgrade to Chromium 157」「Share memory between Chrome and FFmpeg」。star 核查时是 64,134 | https://api.github.com/repos/remotion-dev/remotion/releases?per_page=6 ，https://api.github.com/repos/remotion-dev/remotion |
| 我们在用 Remotion 4.0.530 | ✅ package.json 写的是 ^4.0.530，node_modules 里实际装的也是 4.0.530；@remotion/three 还没装 | `D:/desk/claudex/24/video-engine/package.json`，`video-engine/node_modules/remotion/package.json` |
| HTML-in-canvas 从 4.0.455 起；渲染不用开关；Studio 预览要 Chrome 149+；WebGL 要 `--gl=angle`；API 不稳定 | ✅ 原文「For rendering, you don't need to do anything」「The API is unstable」；效果可用 Canvas 2D、WebGL 或 WebGPU 做 | https://www.remotion.dev/docs/html-in-canvas |
| @remotion/three 用 useCurrentFrame 驱动，GL 设成 angle | ✅ 文档写的是 `Config.setChromiumOpenGlRenderer('angle')`，服务器端渲染要传 `chromiumOptions: { gl: "angle" }` | https://www.remotion.dev/docs/three |
| Studio 可视化编辑：样式直接写在元素上，不能用常量和算式；部分功能从 4.0.516 起 | ✅ 原文要求 style 用内联对象，不用常量、展开和算式；4.0.516 指的是从 defaultProps 自动推出属性控件 | https://www.remotion.dev/docs/studio/interactivity-best-practices |
| remotion-dev/skills：12 个 skill，5,137 star，10-12 有更新，没有 LICENSE | ✅ README 列了 12 个；API license 为 null；pushed_at 10-12；核查时 5,148 star | https://github.com/remotion-dev/skills ，https://api.github.com/repos/remotion-dev/skills |
| Remotion 对个人、非营利、3 人以下的公司免费 | ✅ 原文「a for-profit organization with up to 3 employees」 | https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md |
| Elements 目录：字幕、图表、背景、文字标记等块；价格没看 | ✅ 有这些分类；页面只链到「License + Pricing」，没写收费方式，仍是（未核实） | https://www.remotion.dev/elements |
| HyperFrames：Apache-2.0；63.4k star（10-06 是 57,718）；最新 0.8.157（10-14）；21 个 skill，含 /faceless-explainer、/remotion-to-hyperframes | ⚠ 许可证和两个 skill 都对；README 说 21 个，表里只列出 20 个名字（正文已注明）。版本和 star 已过时：核查时最新 0.8.159（10-15 00:56 UTC），API 63,746 star，页面 63.8k，正文已补 | https://api.github.com/repos/heygen-com/hyperframes ，https://api.github.com/repos/heygen-com/hyperframes/releases?per_page=5 ，https://raw.githubusercontent.com/heygen-com/hyperframes/main/README.md |
| Motion Canvas 正式版 3.17.2（2024-12-14），之后只有 2025-02 一个 alpha；GitHub 2025-02 后只有 2026-07-02 一次改文档域名的提交 | ✅ dist-tags：latest 3.17.2，alpha 3.18.0-alpha.0（2025-02-16）；提交页最新一条是 2026-07-02「update domain」 | https://registry.npmjs.org/@motion-canvas/core ，https://github.com/motion-canvas/motion-canvas/commits/main |
| Motion Canvas、Manim 官方没有 agent skill | ⚠ 搜了一次都没找到官方的；Manim 只找到社区的 adithya-s-k/manim_skill。没找到不等于一定没有 | WebSearch（10-14），https://github.com/adithya-s-k/manim_skill |
| Theatre.js 公开版停在 0.7.2（2024-05-19）；开发「暂时」挪到私有仓库；核心 Apache、编辑器 AGPL | ✅ 0.7.2 发布于 2024-05-19 14:29 UTC；README 原文「We have _temporarily_ moved development to a private repo」；12.8k star | https://registry.npmjs.org/@theatre/core ，https://github.com/theatre-js/theatre |
| Revideo：npm 0.11.0（2026-07-10）；搬到 midrender；README 说 Claude 或 Codex 能按提示写场景 | ✅ 0.11.0 发布于 2026-07-10 01:36 UTC；README 原文「It's the engine behind Midrender」；4.1k star | https://registry.npmjs.org/@revideo/core ，https://github.com/redotvideo/revideo |
| Manim CE 0.22.0（2026-10-08），41.5k star，MIT；输出格式统一、能配编码、小字号更清楚；manim_skill 约 1.2k star | ✅ PyPI 上传 10-08，license_expression MIT；更新说明三点都有；41,542 star；manim_skill 1,170 star，最后推送 2026-01-23 | https://pypi.org/pypi/manim/json ，https://docs.manim.community/en/stable/changelog/0.22.0-changelog.html ，https://api.github.com/repos/adithya-s-k/manim_skill |
| fframes：Rust + SVG，能插 Shadertoy 着色器；128 秒片 36 秒渲完；最新 1.2.1-rc.32（10-14）；MIT；Windows 要 LLVM 和预编译 FFmpeg 9.0 | ⚠ 功能、许可、Windows 要求都对（原文「prebuilt FFmpeg 9.0 shared build」、`winget install LLVM.LLVM`）；「36 秒」是作者自己的说法。版本已过时：最新是 1.2.1-rc.33（10-14 16:45 UTC），正文已改 | https://github.com/dmtrKovalenko/fframes ，https://crates.io/api/v1/crates/fframes |
| video-use 剪实拍，28.9k star，MIT；转写用 ElevenLabs Scribe，页面没写收费 | ✅ 28,961 star；23 个提交；页面只给了拿 key 的链接，没说收费 | https://api.github.com/repos/browser-use/video-use ，https://github.com/browser-use/video-use |
| OpenMontage 68.2k star，AGPL-3.0；简介写 12 条流水线，正文写「10+」；478 个提交 | ✅ 68,294 star；简介 12 条、正文「10+」、表里列了 11 条，前后确实不一 | https://api.github.com/repos/calesthio/OpenMontage ，https://github.com/calesthio/OpenMontage |
| p5.capture：挂在 draw 循环上逐帧录；复杂动画会让录制不稳定；313 star、208 提交 | ✅ 原文「Complex animations can slow down the framerate and make recording unstable」 | https://github.com/tapioca24/p5.capture |
| skillsllm：10-11 扫描 WARNING，19 个漏洞（15 高、4 中、0 critical）；首次运行下载约 100 MB Chromium | ✅ 都对。⚠ 该页的 star / fork 现在显示 354 / 42，研究员写的「328 / 40」已无法复查，正文标了（未核实） | https://skillsllm.com/skill/openfilm |
| 全片渲染 9 到 9.5 分钟（约 16 fps），渲染不是瓶颈 | ✅ 制作命令.md 第 143 行：「9–9.5 分钟，约 16 fps」（峰终、赫布，concurrency=5）；第 81、113 行也写了峰终约 9 分钟 | `D:/desk/claudex/24/.claude/skills/firefly/references/制作命令.md` |
