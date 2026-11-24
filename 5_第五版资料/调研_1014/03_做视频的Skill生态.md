# 03 做视频的 Skill 生态（2026-10-14 调研）

## 一句话结论

做视频的 skill 已经很多，但几乎都在做「量产」：产品宣传片、口播剪辑、一键成片。和我们最像的是三个「代码画讲解片」的 skill（anything2explainer、video-talkcraft、guizang-product-video）。它们可借的不是画面，而是几道检查：自动核对每一声叮、先做开头样片、同一系列不重复用开场手法。找热点、写钩子、出封面、看数据这四类，没有一个 skill 能读抖音的视频数据（播放、完播、评论）；抖音热榜只有 TrendRadar 这类要自己部署的工具能看，所以只能借思路。

> 名词先说清：
> - **skill（技能包）**：一个文件夹，里面是一份说明书（SKILL.md）和几个脚本。AI 读了以后，就按里面的固定做法干活。我们的「萤火」就是一个 skill。
> - **star（星）**：GitHub 上的收藏数，大致代表关注度，不代表好用。
> - **Remotion**：用 React 代码画视频的框架，我们在用 v4。
> - **HyperFrames**：HeyGen 公司 2026 年开源的另一个框架，用网页（HTML/CSS）画视频，作用和 Remotion 一样。
> - **MCP**：让 AI 调用外部工具的一种接口。

## 调研范围和限制（先看）

- 日期：所有星数和更新时间都是 **2026-10-14 当天**打开页面看到的数。「最近更新」写的是 GitHub 页面上显示的日期；页面没显示的写「未显示」。
- **WebSearch 额度用完了**：只做了 3 次搜索，这一轮所有 agent 共用的搜索额度就用光了。后面全靠 WebFetch 直接打开 GitHub 仓库页、GitHub topic 页和 skillsmp 分类页。按规矩，我没有改用别的搜索引擎或 tavily 绕过额度。
- 因此**中文社区的帖子（知乎、少数派、掘金、公众号、小红书）基本没查到**。少数派标签页要靠浏览器脚本才能显示内容，WebFetch 读不到。中文这块只能从 GitHub 上的中文作者入手：歸藏 op7418、宝玉 JimLiu、Vincentwei1021、Agents365-ai、sansan0。想补中文帖子，需要你再发一条消息，让我在新的搜索额度里接着查。
- skills.sh 首页和 claudemarketplaces.com 打开超时，**这两个市场的排行榜没拿到**。skillsmp.com 能打开。
- 什么都没装，没有 clone，也没有下载。

---

## 一、20 多个具体的 skill / 工具

### A. 和我们最像的：AI 用代码画讲解片

| 名称 | 链接 | 星 | 最近更新 | 做什么 | 对我们有用吗 | 能借什么 |
|---|---|---|---|---|---|---|
| anything2explainer | [GitHub](https://github.com/Vincentwei1021/anything2explainer) | 2.5k | 2026-09-18 | 给一个题目，自动出带旁白的动效讲解片。画面全用 Remotion 代码画，黑底白线加紫色点缀。支持中文和英文。README 致谢里说画风学的是抖音博主 @图灵宇宙 | **很像**。路线几乎和萤火一样（研究 → 旁白 → 分镜 → 并行搭镜头 → 量帧 → 分章质检） | ① 全片开工前先做 **30 秒样片**给用户定观感；② 每章配一个质检 agent，有写好的标准、参考片、好帧坏帧对照；③ 中英文的停顿和字幕长度分开定预算 |
| video-talkcraft | [GitHub](https://github.com/Vincentwei1021/video-talkcraft) | 1.6k | 2026-10-12 | 有了稿子和配音，用 Remotion 做讲解片。作者以中文为主，在抖音、小红书都有号 | **像**。我们没有旁白，但它的质检对我们有用 | ① **每个声音提示点都量一次音频能量**，确认真有声音；② 自动查冻帧和抖动；③ 用印样（contact sheet，一张图排满很多帧）做独立审片，最多审三轮；④ 108 张「动效配方卡」（README 写 108，仓库简介写 109）。注：它量能量的是**单独的音效轨**，不是混好的总音轨 |
| video-shotcraft | [GitHub](https://github.com/Vincentwei1021/video-shotcraft) | 11.9k | 2026-10-13 | 拿产品截图，用 Remotion 做宣传片。README 正文写 124 张配方卡、共 150 个镜头（仓库简介写 152 张卡，两处对不上）（比如「聚光灯扫到标题」「文字当遮罩」）。能导出剪映草稿 | 题材不同（产品片），手法能借 | 把做过的镜头**整理成配方卡**：一张卡写一个镜头的做法和适用场景，以后挑着用 |
| guizang-product-video-skill（歸藏） | [GitHub](https://github.com/op7418/guizang-product-video-skill) | 793 | 2026-10-09 | 用代码给软件更新做 45–60 秒宣传片。配乐也可以用代码合成，音效按画面动作对齐。中文 README | 题材不同，但**配乐也是代码合成**，这点和我们一样 | ① 先提**三个明显不同的方向**再挑一个；② 同一个工作区连做几部时，**不重复上一部的开场、转场和背景手法**；③ 封面只用片中渲染过的帧；④ 音效单独走一条，关键提示音响时音乐短暂让路 |
| HyperFrames 官方 skill（21 个） | [GitHub](https://github.com/heygen-com/hyperframes) | 约 63.5k（研究时 API 63,455；核查时 63,746） | 2026-10-14 发 v0.8.157；更新极快，核查时已到 v0.8.159（UTC 10-15） | HeyGen 的 HTML 视频框架，自带 21 个 skill，比如 faceless-explainer（无人出镜讲解片）、music-to-video（跟着音乐出片）、embedded-captions（设计进画面的字幕） | 不换引擎。但它的 skill 写法值得读 | ① music-to-video：**先有音乐，所有节奏从音乐来**；用一个脚本把曲子分析一次（能量段、硬停、乐句），之后只认这份分析，不再凭耳朵；在音乐真正变化处（硬停、能量突变）硬切，**平缓的曲子不卡拍硬切**，按乐句和能量走；② faceless-explainer：讲解顺序按叙事和教学需要排，不按原文段落排；③ embedded-captions：大部分字走普通字幕，**只把极少数关键词做成特效**（短片 1–2 处，长讲解片大约每段一处）；④ 10-14 的一次提交（#5599）把分镜统一成「一页排多张静帧的分镜板」 |
| Remotion 官方 skill 包 | [GitHub](https://github.com/remotion-dev/skills)，[文档](https://www.remotion.dev/docs/ai/skills) | 5,137 | 2026-10-12 | 12 个 skill：best-practices、markup、captions、render、docs、upgrade 等。官方文档举例说适用于 Claude Code、Codex、Kimi Code、Cursor 等 agent | **有用**，我们就在用 Remotion 4 | 让 AI 按官方写法写动画、字体、音频、字幕，少猜 API。字幕可参考 `createTikTokStyleCaptions()`：按毫秒把字分页，也能逐词出现（[文档](https://www.remotion.dev/docs/captions/create-tiktok-style-captions)） |
| motion-skills | [GitHub](https://github.com/iart-ai/motion-skills) | 810 | 2026-10-14 | 50 多个动效 skill（README 写 55 个、18 包；仓库简介写 50 个、14 包，两处对不上），包括：竖屏短视频、讲解片、数据动画、动态文字、Manim 数学动画等。用 Remotion、Manim、GSAP | 一般。可以翻翻「动态文字」和「数据动画」两包 | 数字对比的动画做法（我们「数字靠对比」的规矩） |
| anthropics/skills（官方示例） | [GitHub](https://github.com/anthropics/skills) | 181k | 2026-10-09 | Anthropic 官方 skill 库，共 19 个。和画面有关的有 algorithmic-art（生成艺术）、canvas-design、slack-gif-creator、theme-factory | 间接有用 | algorithmic-art 的做法：**先写 4–6 段「这幅画的算法哲学」，再写代码**，而且固定随机种子，每次能复现。可以借来写每部片的「画面母题」 |

### B. 端到端「一键成片」流水线（量产路线，和我们精做相反）

| 名称 | 链接 | 星 | 最近更新 | 做什么 | 对我们有用吗 | 能借什么 |
|---|---|---|---|---|---|---|
| OpenMontage | [GitHub](https://github.com/calesthio/OpenMontage) | 68.2k | 2026-10-12 | 开源的 AI 视频制作系统，流程是 研究 → 提案 → 剧本 → 场景 → 素材 → 剪辑 → 合成。数据类讲解片默认用 Remotion，动效为主的片子默认用 HyperFrames，提案时再定。README 说有 700 多个 skill 和知识文件 | 整套不用。里面两份文档值得读 | `storytelling.md` 和 `short-form.md` 里有很具体的节奏数字和首帧规则，见第二部分 (b)。每个阶段有「导演 skill」，还有审稿和检查点的规程 |
| claude-code-video-toolkit | [GitHub](https://github.com/digitalsamba/claude-code-video-toolkit) | 2.2k | 2026-10-12 | Claude Code 用的视频工作区：Remotion、配音、配乐、音效、渲染，配 `/video`、`/scene-review` 等命令 | 一般 | 每个项目一个 `project.json` 记进度，换会话也能接着做。我们用文件夹和 md 做的是同一件事 |
| video-podcast-maker | [GitHub](https://github.com/Agents365-ai/video-podcast-maker) | 1.7k | 2026-10-01 | 题目 → 研究 → 稿子 → 本地配音 → Remotion → 4K。面向 B 站、抖音、小红书、视频号，中文多音字有词典 | 一般 | 每部片自动生成一份 `publish_info.md`（标题、标签、简介），和我们的发布文案一样 |
| MoneyPrinterTurbo | [GitHub](https://github.com/harry0703/MoneyPrinterTurbo) | 约 130.8k | 2026-10-14 | 给关键词，自动写稿、找素材、配音、加字幕和音乐，出竖屏或横屏视频 | 没用（素材拼接型） | 只说明一件事：这类「一键成片」已经泛滥，再走这条路没有优势 |
| brag | [GitHub](https://github.com/latent-spaces/brag) | 15.9k | 2026-10-13 | 一条命令把做好的项目变成 20 秒左右的发布短片，用 HyperFrames 渲染 | 没用 | 无 |
| video-use | [GitHub](https://github.com/browser-use/video-use) | 28.9k | 2026-10-08 | 用 Claude Code 剪实拍素材：去口误、调色、烧字幕、自检 | 不剪实拍，但**自检规则值得抄** | ① 每个音效对一个看得见的事件，**要提前一点起音，让声音落在接触那一帧**；② 渲染后逐个切点查跳帧、爆音、字幕被挡；③ 能发布的片子另派一个「挑刺 agent」排问题清单；④ 用户批准白话方案之前不动刀 |

### C. 配乐、音效、字幕、中文文字

| 名称 | 链接 | 星 | 最近更新 | 做什么 | 对我们有用吗 | 能借什么 |
|---|---|---|---|---|---|---|
| elevenlabs/skills | [GitHub](https://github.com/elevenlabs/skills) | 486 | 2026-10-14 | ElevenLabs 官方：配音、转写、**音效生成**、**配乐生成**、配音翻译 | 我们坚持代码合成配乐，用不上（还要付费 key） | 无 |
| open-design 的 audio-jingle 等 | [skillsmp 媒体分类](https://skillsmp.com/categories/media) | 仓库 101k | 2026-08-18 | 片头音、背景垫乐、配音、音效，转给 Suno、MiniMax、ElevenLabs 等去生成。同仓库还有 create-video-storyboard（分镜和镜头表）（**未核实**：仓库的 design-templates 目录里没找到它，只有 video-shortform） | 一般 | 无 |
| Humanizer-zh（歸藏） | [GitHub](https://github.com/op7418/Humanizer-zh) | 19,668 | 2026-09-23 | 把中文里的「AI 腔」改掉。列了 31 种模式，分 6 组，其中一组是中文特有的：「的」字叠用、「进行＋动词」、被字句扎堆、四字排比、「随着……的发展」开头、结尾空话 | **有用**，当审稿清单用 | 第 3 步 Kimi 交稿后、第 5 步审稿时，对着这 31 条查台词。它自己也说：清单只是线索，不是禁词表，不打「AI 味分数」 |

---

## 二、四类专题

### (a) 找热点、找趋势

| 名称 | 链接 | 星 / 更新 | 做什么 | 抖音能用吗 | 能借什么 |
|---|---|---|---|---|---|
| TrendRadar | [GitHub](https://github.com/sansan0/TrendRadar) | 62.9k / 2026-10-13（v6.11.0） | 中文热点雷达。默认聚合 11 个热榜，**含抖音、B 站热搜、知乎、微博、百度、头条**。可按关键词或让 AI 过滤，推送到企业微信、飞书、Telegram 等；带 MCP。GPL-3.0 | 能看到抖音**热榜**，看不到抖音视频数据。要自己部署（Docker 或 GitHub Actions），我们按规矩不装 | 「**关键词盯梢**」：设好关键词（比如「梵高」「睡眠」「入秋」），热榜一出现就推到手机 |
| newsnow | [GitHub](https://github.com/ourongxing/newsnow) | 22.0k / 2026-10-13 | TrendRadar 的数据来源，一个干净的热榜阅读网站，也有 MCP | 我用 WebFetch 访问它的抖音接口，返回 403（被挡），**Claude 读不到**。你可以在手机浏览器打开它的网站看 | 选题前花 1 分钟扫一眼多平台热榜 |
| last30days | [GitHub](https://github.com/mvanhorn/last30days-skill) | 64.2k / 2026-10-13 | 查一个话题最近 30 天在 Reddit、HN、YouTube、X 等平台上的讨论，**按点赞和互动打分**，写成带引用的简报。也能不给题目，直接找正在火的事 | 不覆盖抖音。小红书要用本地登录的浏览器，我们不用 | 「热度要有证据」：每个热点都附链接和互动数，按真实互动排序，不凭感觉 |
| social-media-research-skills | [GitHub](https://github.com/ScrapeCreators/social-media-research-skills) | 约 3.7k / 2026-08-26 | 13 个 skill，其中「异常爆款查找」(outlier) 找比作者平时表现好得多的帖子；「趋势发现」看一个垂类里正在火的话题、标签、声音和格式；「评论挖掘」把观众原话整理出来。要 ScrapeCreators 的 API key：注册送 100 点（credits），做几件事（给它 GitHub 点星、写 G2 评价等）最多再领 7,000 点；之后按量付费，入门档 47 美元 2.5 万点 | 不覆盖抖音 | **outlier（异常爆款）**：拿一条视频和**这个作者自己的平时水平**比，不看绝对播放量。拆同类账号时用这个眼光，找它们「突然爆了」的那几条 |
| OpenMontage 的研究导演 | [GitHub](https://github.com/calesthio/OpenMontage) | 见上 | 写稿前分 5 批搜：全景、正在火的、数据、受众、专家 | 思路通用 | 选题提案「为什么是这几天」可以照这 5 批去查 |

**结论**：没有 skill 能不登录就读抖音的视频数据。抖音热榜能通过 TrendRadar 或 newsnow 看到，但 Claude 这边被挡（403）。眼下最稳的做法是：选题时 Claude 用 WebSearch 查公开热榜和第三方文章，你在手机上看抖音热榜，把截图发过来。

### (b) 写钩子、写标题

| 名称 | 链接 | 星 / 更新 | 关键做法（转述） |
|---|---|---|---|
| marketingskills / social | [GitHub](https://github.com/coreyhaines31/marketingskills/tree/main/skills/social) | 54.7k / 2026-10-14 | 钩子分 4 类：好奇、故事、价值、反常识。短视频用「3 秒规则」：**第 1 秒内同时有画面钩子、口头钩子和屏幕文字** |
| ECC / content-engine | [skillsmp 分类页](https://skillsmp.com/categories/content-creation)（仓库 affaan-m/ECC） | skillsmp 上写 276.5k，GitHub 页面 10-14 显示 279.1k / 2026-09-18（skillsmp 上这个 skill 的更新日） | 短视频头几秒要亮出**结果、问题或一记重拳**；不许说「这为什么重要」这类空话，除非下一句马上给出实在内容；从素材出发，不套公式 |
| OpenMontage / short-form.md | [原文](https://github.com/calesthio/OpenMontage/blob/main/skills/creative/short-form.md) | 见上 | **第 1 帧就要有看头**：不要黑场、logo、问候；0.5 秒内出屏幕文字；开头那帧要有动作。它给的门槛是 3 秒留存 70% 以上（文件开头笼统列了 TikTok 创作者中心、Instagram 商业博客、YouTube Shorts 文档三个来源，但没说哪个数出自哪里，原始出处**未核实**） |
| OpenMontage / storytelling.md | [原文](https://github.com/calesthio/OpenMontage/blob/main/skills/creative/storytelling.md) | 见上 | 3 分钟片：8 秒内抛出反常识或悬念，30 秒内把钩子和张力都铺完；**每 30–45 秒只讲一个新概念**；关键处留 1–3 秒静默（它说这是 3Blue1Brown 的手法）；先讲观众以为的，再推翻（它引的是 Derek Muller 2008 年在悉尼大学的博士论文《Designing Effective Multimedia for Physics Education》，这篇论文真实存在，见[论文目录页](https://www.compadre.org/portal/items/detail.cfm?ID=11344)）；段落之间用「但是 / 所以」连，不用「然后」。这些数字是 skill 自己写的：「30–45 秒一个概念」它挂在 Mayer《多媒体学习》的分段原则名下，没给具体研究，原始出处**未核实** |
| advertising-skills / headline-matrix | [GitHub](https://github.com/realkimbarrett/advertising-skills/tree/main/skills/copy-chief/headline-matrix) | 未查 / 未显示 | 一次出 25 个标题，分 7 个角度：好奇、具体、证据、紧迫、反常识、机制、身份。要求每个都不一样，具体胜过笼统 |
| advertising-skills / scroll-stopping-creative | [GitHub](https://github.com/realkimbarrett/advertising-skills/tree/main/skills/operator-os/scroll-stopping-creative) | 同上 | 一次出 5 个开头方案，每个写「钩子 / 画面 / 台词」三栏；核心是打断观众的刷屏惯性 |
| Humanizer-zh | 见上 | 见上 | 标题和钩子写完，再按中文 AI 腔清单查一遍 |

**和我们的冲突，要你知道**：萤火现在的开头是「近黑底，光慢慢出来，概念在观众身上发生一次」。照这几份 skill 的标准，**第 1 帧太暗、太慢，屏幕上没字**，刷的人可能 1–2 秒就划走了。不用改风格：第 0 帧就让一个亮的主角加一行字出现，3 秒内抛出问题或反常，黑底照旧。

### (c) 封面

| 名称 | 链接 | 星 / 更新 | 做什么 | 能借什么 |
|---|---|---|---|---|
| baoyu-cover-image（宝玉） | [GitHub](https://github.com/JimLiu/baoyu-skills) | 26.7k / 2026-09-10 | 文章封面。从 6 个维度挑：类型、配色、画法、文字量、情绪、字体；比例 16:9、2.35:1、4:3、1:1、3:4 等。标题用原文，**不许自己编** | 封面先列「6 个维度」让你勾选，比一张张改快。它要求用 AI 生图，我们是代码画的片，这点不照搬 |
| guizang-social-card-skill（歸藏） | [GitHub](https://github.com/op7418/guizang-social-card-skill) | 7.5k / 2026-07-01 | 用一个 HTML 文件出小红书 3:4 图组和公众号封面对（21:9 加 1:1），28 种版式。1:1 小图有一套「短标题」策略 | 一张封面做**大小两版**：小图上只留最短的几个字 |
| guizang-product-video-skill | 见上 | 见上 | 3:4、4:3、16:9 三种比例的封面，**只用片中渲染过的帧** | 和我们「片名卡那一帧当封面」一致。可以加一张 3:4 竖版（抖音横屏视频需不需要竖封面，**未核实**） |
| OpenMontage 的发布导演 | 见上 | 见上 | 讲解片的发布阶段出一份「缩略图构想」（画风跟片子走，上面 3–5 个字）。原稿写的「海报帧构想」在讲解片这份规程里没找到（**未核实**） | 交付时给 2–3 个封面候选帧让你挑 |

### (d) 数据复盘

| 名称 | 链接 | 能借什么 |
|---|---|---|
| marketingskills / social | 见上 | **每周看前 3 条和后 3 条**：互动低就换钩子、时间和形式 |
| social-media-research-skills / outlier-post-finder、comment-mining | 见上 | 拿**自己的平均水平**当基准，不看绝对数；把评论里的原话整理出来，当下一期的选题和标题素材 |
| OpenMontage / short-form.md | 见上 | 三个留存检查点：3 秒、15 秒、30 秒（它给的门槛是 70% / 60% / 50%，**未核实**） |
| video-use | 见上 | 先读文字（转写稿），到决定性的时刻才看画面。复盘时把「掉人的时间点」和字幕时间轴放在一张表里，萤火第 0 步已经这么做了 |
| douyin-mcp-server | [GitHub](https://github.com/yzfly/douyin-mcp-server) | 约 1.3k 星。能从抖音分享链接取无水印视频，再把口播转成文字。**2026-07-02 已归档**，不再更新，转文字还要 API key。不用 |

**结论**：没找到能读抖音创作者后台数据的 skill。复盘还是照萤火第 0 步：你发截图，Claude 对着时间轴分析。

---

## 三、和「蹭热点」（梵高、歌词放映）有什么关系

- 生态里**没有一个 skill 专门教怎么蹭热点**。有的只是两样：盯热榜的雷达（TrendRadar、newsnow），和按互动打分的研究（last30days、outlier）。
- **歌词放映**这类形式，在 skill 圈里对应 HyperFrames 的 music-to-video：它明确把歌词视频（lyric video）列为能做的类型。音乐当脊梁，文字是主画面，在音乐真正变化的地方硬切；曲子平缓时不卡拍硬切，按乐句走。我们可以借这个结构，但**不能放别人的歌词**（版权）。可以换成公版诗句，或者我们自己的双语句子，配 score.py 合成的曲子。
- 「梵高」到底有多火、火在哪，不在本篇范围，交给热点那几篇调研。这里只给工具层面的办法：在 TrendRadar 或 newsnow 里把「梵高」设成关键词。这要部署，我们不装；你也可以手动看热榜。

---

## 四、生态里几件值得知道的事

| 事实 | 来源 |
|---|---|
| Remotion 官方现在主推 skill 包，安装命令 `npx skills add remotion-dev/skills`，共 12 个 skill | [remotion.dev 文档](https://www.remotion.dev/docs/ai/skills) |
| Remotion 官方文档写明：Remotion 的 MCP 已弃用，托管的 MCP 服务「最早」2026-08-31 关停（到 10-14 是否已关，**未核实**）。skill 文档页确实没提 MCP，MCP 有单独一页 | [remotion.dev MCP 文档](https://www.remotion.dev/docs/ai/mcp)；葡语博客 2026-08-25 也这么写：[horadecodar](https://horadecodar.com.br/?p=44180) |
| skills.sh 上 remotion-best-practices 的安装数在 30 万到 38 万之间（**未核实**：skills.sh 两轮都打不开；10-14 的搜索摘要里，仓库页写约 30.5 万，作者页写约 37.8 万，口径不同）。能说的只是「装的人很多」 | [skills.sh](https://skills.sh/remotion-dev/skills/remotion)（打不开） |
| skillsmp 收录 300 万以上 skill；「内容与媒体」大类 210,582 个，「媒体」子类 21,689 个 | [skillsmp](https://skillsmp.com/categories) |
| GitHub 上带 agent-skills 标签的仓库约 3.3 万个，带 claude-skills 标签的约 1.1 万个，带 remotion 标签的约 1,250 个（这些数每小时都在变：研究员看到 32,662 / 11,194 / 1,251，第一轮核查 32,684 / 11,203 / 1,251，第二轮核查 agent-skills 32,825、remotion 1,256） | [agent-skills](https://github.com/topics/agent-skills)、[claude-skills](https://github.com/topics/claude-skills)、[remotion](https://github.com/topics/remotion) |
| 许可证要注意：anything2explainer 和 video-talkcraft 是 PolyForm Noncommercial 1.0.0（个人、学习免费，商用要先找作者授权）；guizang 两个 skill 是 AGPL-3.0（product-video 里 assets/fallback 部分另走 BSL 1.1）；TrendRadar 是 GPL-3.0；OpenMontage 是 AGPL-3.0。我们**只借想法，不抄代码** | 各仓库页 |
| marketingskills 的 video skill 推荐给 agent 用 HyperFrames，Remotion 留给更复杂的动画 | [video SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/main/skills/video/SKILL.md) |

---

## 对我们有什么用

### 可借鉴（按萤火步骤）

| 萤火步骤 | 借什么 | 从哪来 |
|---|---|---|
| 0 复盘 | 和自己的平均比；评论原话进候选池；前 3 条和后 3 条对照 | outlier-post-finder、comment-mining、marketingskills/social |
| 1 选题 | 「为什么是这几天」附热榜链接和互动数；按全景、正在火的、数据、受众、专家五批查 | last30days、OpenMontage 研究导演 |
| 1 选题 | 账本加三列：开场手法、奇观类型、背景技法。下一部避开 | guizang-product-video |
| 2 定结构 | 第 0 帧有亮主角加一行字；3 秒内出问题或反常；每 30–45 秒只讲一个新概念；先讲误解再推翻 | OpenMontage、marketingskills、content-engine |
| 2 定结构 | 先写几段「画面母题」，再写代码 | anthropics/algorithmic-art |
| 3 台词 / 5 审稿 | 用中文 AI 腔 31 条清单查台词 | Humanizer-zh |
| 停：剧本过目 | 先做开头 15 秒样片（两种开头）给你在手机上挑 | anything2explainer 的 30 秒样片、guizang 的三个方向 |
| 6 制作 | 配乐先分析出一份 `audiomap.json`（段落、能量、硬停），叮和切点都从它对齐 | HyperFrames music-to-video |
| 6 制作 | 把做过的镜头整理成「配方卡」 | video-shotcraft、video-talkcraft |
| 7 自检 | 每一声叮自动量能量，也量那一帧画面有没有变化；挑刺 agent 排问题清单 | video-talkcraft、video-use |
| 8 交付 | 封面出 2–3 个候选帧，加一张小图短标题版 | guizang-social-card、OpenMontage |
| 10 发布 | 标题一次出 7 个角度，让你挑 | headline-matrix |

### 建议

1. **不换引擎，不装一键成片的流水线。** OpenMontage、MoneyPrinterTurbo、brag 走的是量产，和我们的精做路线相反。何况「AI 一键成片」正是现在泛滥的东西。
2. **开头规则要改一点**：保留暗底，但第 0 帧就要有亮点和一行字。这是几份 skill 都强调的一条，也是这次调研里最容易照做的一条；但它们给的留存数字都没有可查的出处，能不能真拉高完播，要发出去看数据。
3. 热点工具先不装。TrendRadar 要部署，又是 GPL；Claude 访问 newsnow 被 403 挡住。以后如果你想每天在手机上收到热点推送，再单独讨论。

### 要不要试

| 东西 | 要不要试 | 理由 |
|---|---|---|
| Remotion 官方 skill 包 | **可以考虑，你点头再装** | 我们就在用 Remotion 4，装了能少写错 API。只是加 skill 文件，不改片子代码 |
| Humanizer-zh | 不装，**读它的清单**就够 | 清单可以直接抄进审稿规则 |
| HyperFrames 的 music-to-video、faceless-explainer | 不装，**读文档** | 只借做法 |
| anything2explainer、video-talkcraft | 不装，**读文档** | 和我们最像，但许可证不许商用 |
| TrendRadar、last30days、ScrapeCreators | 不试 | 要部署、要 API key（ScrapeCreators 注册送 100 点，做任务最多再领 7,000 点，之后付费），或者不覆盖抖音 |
| douyin-mcp-server | 不试 | 已归档 |

### 最值得借的 5 个想法

1. **每一声叮自动核对（放进第 7 步自检）**
   - 来源：video-talkcraft 在单独的音效轨上，对每个声音提示点量音频能量；video-use 要求音效提前起音，落在接触那一帧。
   - 怎么用：加一个检查脚本。对 cue.json 里每个叮，查 mix.wav 在那个时间点前后有没有能量峰，同一帧画面亮度有没有明显变化。
   - 为什么：Claude 听不到声音。有了它，「叮要对画面重点」第一次能由机器检查，不用全靠你戴耳机听。
2. **开头 15 秒样片闸门（放在「停：剧本过目」之后、第 6 步全片制作之前）**
   - 来源：anything2explainer 先做 30 秒样片；guizang 先提三个不同方向。
   - 怎么用：先渲两版不同的开头 15 秒，出手机预览，你挑一版，再做全片。
   - 为什么：你最在意开头抓人。改开头的成本，在这一步最低。
3. **首帧规则（写进第 2 步骨架和第 7 步检查表）**
   - 来源：OpenMontage 的 short-form 和 storytelling、marketingskills 的「3 秒规则」、content-engine 的「结果、问题或重拳」。
   - 怎么用：第 0 帧就有亮主角加一行字；3 秒内抛出问题或反常；8 秒内出悬念；30 秒内铺完张力。暗底风格照旧。
4. **系列不重复账本，加一套镜头配方卡（放进第 1 步查重和第 8 步登记）**
   - 来源：guizang 不重复上一部的开场、转场和背景手法；shotcraft 和 talkcraft 的配方卡。
   - 怎么用：片单.md 的「账本」加三列：开场手法、满屏奇观类型、背景技法。做过的镜头整理成配方卡。
   - 为什么：正好对上你说的「知识点和形式都不重复」。
5. **热点要有证据，复盘要和自己比（放进第 1 步提案和第 0 步复盘）**
   - 来源：last30days 按互动打分、附引用；TrendRadar 盯关键词；outlier 和自己的基准比；评论挖掘。
   - 怎么用：提案里「为什么是这几天」必须附热榜链接或互动数；拆同类账号时只看它们「异常爆款」的那几条；复盘时拿这一条和我们前几条的平均比，评论原话收进候选池。

（备选第 6 条：HyperFrames music-to-video 的「音乐当脊梁」。如果要试「诗句放映」这类新形式，在第 6 步让 score.py 先出曲子和 audiomap.json，画面全按它切。）

---

## 来源

所有页面都在 2026-10-14 打开。

- Remotion 官方 skill：https://github.com/remotion-dev/skills ；https://www.remotion.dev/docs/ai/skills ；https://www.remotion.dev/docs/captions/create-tiktok-style-captions ；星数和推送时间来自 https://api.github.com/repos/remotion-dev/skills
- skills.sh 上 Remotion 安装数（来自搜索摘要，页面打不开）：https://skills.sh/remotion-dev/skills/remotion ；https://www.skills.sh/remotion-dev/skills ；https://skills.sh/remotion-dev
- Derek Muller 2008 博士论文目录页：https://www.compadre.org/portal/items/detail.cfm?ID=11344
- HyperFrames 发布记录：https://api.github.com/repos/heygen-com/hyperframes/releases
- Remotion MCP 弃用：官方 https://www.remotion.dev/docs/ai/mcp ；葡语博客 https://horadecodar.com.br/?p=44180
- Anthropic 官方 skill：https://github.com/anthropics/skills ；https://github.com/anthropics/skills/tree/main/skills ；https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md
- HyperFrames：https://github.com/heygen-com/hyperframes ；https://github.com/heygen-com/hyperframes/commits/main ；https://github.com/heygen-com/hyperframes/tree/main/skills ；music-to-video：https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/music-to-video/SKILL.md ；faceless-explainer：https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/faceless-explainer/SKILL.md ；embedded-captions：https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/embedded-captions/SKILL.md
- OpenMontage：https://github.com/calesthio/OpenMontage ；https://github.com/calesthio/OpenMontage/commits/main ；https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/INDEX.md ；https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/creative/storytelling.md ；https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/creative/short-form.md ；研究导演 https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/pipelines/explainer/research-director.md ；发布导演 https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/pipelines/explainer/publish-director.md
- Vincentwei1021：https://github.com/Vincentwei1021/anything2explainer ；https://github.com/Vincentwei1021/video-talkcraft ；https://github.com/Vincentwei1021/video-shotcraft
- 歸藏 op7418：https://github.com/op7418?tab=repositories ；https://github.com/op7418/guizang-product-video-skill ；https://github.com/op7418/guizang-social-card-skill ；https://raw.githubusercontent.com/op7418/Humanizer-zh/main/SKILL.md
- 宝玉 JimLiu：https://github.com/JimLiu/baoyu-skills ；https://raw.githubusercontent.com/JimLiu/baoyu-skills/main/skills/baoyu-cover-image/SKILL.md
- video-use：https://github.com/browser-use/video-use ；https://github.com/browser-use/video-use/commits/main ；https://raw.githubusercontent.com/browser-use/video-use/main/SKILL.md
- claude-code-video-toolkit：https://github.com/digitalsamba/claude-code-video-toolkit
- video-podcast-maker：https://github.com/Agents365-ai/video-podcast-maker
- motion-skills：https://github.com/iart-ai/motion-skills
- brag：https://github.com/latent-spaces/brag
- MoneyPrinterTurbo：https://github.com/harry0703/MoneyPrinterTurbo ；https://github.com/harry0703/MoneyPrinterTurbo/commits/main
- marketingskills：https://github.com/coreyhaines31/marketingskills ；https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/video/SKILL.md ；https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/social/SKILL.md
- ECC content-engine：https://raw.githubusercontent.com/affaan-m/ECC/main/skills/content-engine/SKILL.md ；星数和更新时间来自 https://skillsmp.com/categories/content-creation
- advertising-skills：https://raw.githubusercontent.com/realkimbarrett/advertising-skills/main/skills/copy-chief/headline-matrix/SKILL.md ；https://raw.githubusercontent.com/realkimbarrett/advertising-skills/main/skills/operator-os/scroll-stopping-creative/SKILL.md
- ElevenLabs：https://github.com/elevenlabs/skills
- last30days：https://github.com/mvanhorn/last30days-skill ；https://github.com/mvanhorn/last30days-skill/commits/main
- TrendRadar：https://github.com/sansan0/TrendRadar ；https://github.com/sansan0/TrendRadar/commits/master
- newsnow：https://github.com/ourongxing/newsnow ；接口 https://newsnow.busiyi.world/api/s?id=douyin （WebFetch 返回 403）
- social-media-research-skills：https://github.com/ScrapeCreators/social-media-research-skills ；价格 https://scrapecreators.com/
- douyin-mcp-server：https://github.com/yzfly/douyin-mcp-server
- 列表和市场：https://github.com/VoltAgent/awesome-agent-skills ；https://github.com/ComposioHQ/awesome-claude-skills ；https://github.com/topics/claude-skills ；https://github.com/topics/agent-skills ；https://github.com/topics/remotion ；https://skillsmp.com/ ；https://skillsmp.com/categories ；https://skillsmp.com/categories/media ；https://skillsmp.com/categories/content-creation
- 打不开或超时：https://skills.sh/ 、https://claudemarketplaces.com/ （超时）；https://sspai.com/tag/Claude%20Code （JS 渲染，读不到）

---

## 核实记录（10-14）

一共核了两轮。✅ = 原文属实；⚠ = 大体对，已改措辞或补限定；❌ = 不对，已改正或删掉。星数是实时变的，下面写的是核查那一刻看到的数（部分 GitHub 时间已到 UTC 10-15）。

### 第二轮（独立复核，10-14 晚）

第二轮核查员没看第一轮结论，自己重新打开了下面每个链接（GitHub API、仓库页、raw 原文、官方文档），并用 WebSearch 补查了 skills.sh 和 Muller 论文。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| Remotion skill 包 5,137 星、最近推送 2026-10-12 | ✅ 核查时 5,148 星（涨了 11），pushed 2026-10-12 09:05 UTC；仓库没写许可证 | https://api.github.com/repos/remotion-dev/skills |
| Remotion 共 12 个 skill，含 captions、render、markup、docs；安装命令 `npx skills add remotion-dev/skills` | ✅ 12 个逐一列出 | https://www.remotion.dev/docs/ai/skills |
| 「官方说支持 Claude Code、Codex、Kimi Code、Cursor」 | ⚠ 原话是这些 skill 对「像 Claude Code、Codex、Kimi Code、Cursor 这样的 agent」有用，是举例，不是支持名单；正文已是这个措辞 | 同上 |
| skills.sh 上 remotion-best-practices 约 30.5 万次安装 | ⚠ 仍**未核实**。skills.sh 三个页面都超时；搜索摘要里仓库页约 30.5 万、作者页约 37.8 万，口径不一。正文已改成「30 万到 38 万之间，未核实」 | https://skills.sh/remotion-dev/skills/remotion （打不开）；搜索结果指向 https://www.skills.sh/remotion-dev/skills |
| Remotion MCP 已弃用，托管服务「最早」2026-08-31 关停 | ✅ 原文是 no earlier than August 31, 2026 | https://www.remotion.dev/docs/ai/mcp |
| HyperFrames 63.4k 星、HeyGen 开源、Apache-2.0 | ✅ 核查时 63,746 星；建于 2026-03-10 | https://api.github.com/repos/heygen-com/hyperframes |
| HyperFrames 2026-10-14 发了 v0.8.157 | ✅ 09:47 UTC 发布。但它一天发好几版：同日 19:46 UTC 发 v0.8.158，10-15 00:56 UTC 发 v0.8.159。正文已补「更新极快」 | https://api.github.com/repos/heygen-com/hyperframes/releases |
| HyperFrames 自带 21 个 skill，含 music-to-video、faceless-explainer、embedded-captions | ✅ skills 目录 21 个文件夹（另有 1 个测试文件） | https://api.github.com/repos/heygen-com/hyperframes/contents/skills |
| 10-14 的提交 #5599 把分镜改成「一页排多张静帧的分镜板」 | ✅ 提交标题 storyboards are a board of stills，10-14 | https://github.com/heygen-com/hyperframes/commits/main |
| music-to-video 支持歌词视频；先用脚本把曲子分析成 audiomap.json（能量段、硬停、乐句），之后节奏只从它来 | ✅ 脚本叫 analyze-beatgrid.py，自称「唯一的节拍分析器」，要求不许再用别的工具或凭耳朵量拍；每段边界要对齐 audiomap 的锚点 | https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/music-to-video/SKILL.md |
| music-to-video「按音乐段落硬切」 | ⚠ 只在音乐真正变化处切；平缓的曲子按乐句和能量走，不许卡拍硬切。正文已是这个措辞 | 同上 |
| embedded-captions：短片 1–2 处、长讲解片约每段一处 | ✅ | https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/embedded-captions/SKILL.md |
| faceless-explainer：顺序按叙事和教学排，不按原文段落 | ✅ | https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/faceless-explainer/SKILL.md |
| anything2explainer 2.5k 星、2026-09-18、Remotion 黑底、中英文、30 秒样片、每章一个质检 agent、量帧、PolyForm Noncommercial、致谢 @图灵宇宙 | ✅ API 2,500 星，pushed 09-18；README 逐项都有。API 里许可证显示「Other」，README 写明 PolyForm Noncommercial 1.0.0 | https://api.github.com/repos/Vincentwei1021/anything2explainer ；https://github.com/Vincentwei1021/anything2explainer |
| video-talkcraft 1.6k 星、2026-10-12、中文为主、Remotion、查冻帧和抖动、逐个声音提示点量能量、印样审片最多三轮 | ✅ API 1,581 星。小限定：它量能量的是「纯音效轨」，不是混好的总音轨；已在正文补上 | https://api.github.com/repos/Vincentwei1021/video-talkcraft ；https://github.com/Vincentwei1021/video-talkcraft |
| video-shotcraft 124 张配方卡、约 150 种镜头 | ⚠ README 正文是 124 张卡、150 个镜头，但仓库简介写 152 张卡；已注明两处不一致 | https://github.com/Vincentwei1021/video-shotcraft |
| 歸藏 guizang-product-video 793 星、2026-10-09；配乐可代码合成；不重复上一部开场转场背景；先提三个方向；封面只用片中帧 | ✅ API 796 星，pushed 10-09；四条 README 原文都有；AGPL-3.0 | https://api.github.com/repos/op7418/guizang-product-video-skill ；https://github.com/op7418/guizang-product-video-skill |
| OpenMontage 68.2k 星、2026-10-12；数据类讲解片默认 Remotion、动效为主默认 HyperFrames | ✅ API 68,294 星，pushed 10-12；README 原文如此，提案时定死 | https://api.github.com/repos/calesthio/OpenMontage ；https://github.com/calesthio/OpenMontage |
| short-form：第 1 帧要有看头、0.5 秒内出字；留存门槛 3 秒 70%、15 秒 60%、30 秒 50% | ⚠ 规则和数字都是原文。补充：文件开头笼统列了 TikTok 创作者中心等三个来源，但没对应到这几个数，所以原始出处仍**未核实**；已改措辞 | https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/creative/short-form.md |
| storytelling：3 分钟片 8 秒内钩子、30 秒内铺完张力；每 30–45 秒一个新概念；1–3 秒静默；先讲误解再推翻（Muller 2008） | ✅ 原文属实。Muller 2008 悉尼大学博士论文真实存在；同年他还有一篇 364 名学生的随机实验论文讲这件事。30–45 秒一条只挂在 Mayer 分段原则名下，具体研究**未核实**；1–3 秒静默它说是 3Blue1Brown 手法 | https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/creative/storytelling.md ；https://www.compadre.org/portal/items/detail.cfm?ID=11344 |
| marketingskills 54.7k 星、2026-10-14；钩子 4 类（好奇、故事、价值、反常识）；「3 秒规则」画面、口头、屏幕文字第 1 秒内同时出现 | ✅ API 54,771 星，pushed 10-14 21:21 UTC；原文 All three should hit in the first second | https://api.github.com/repos/coreyhaines31/marketingskills ；https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/social/SKILL.md |
| marketingskills 的 video skill 推荐 agent 用 HyperFrames，Remotion 留给复杂动画 | ✅ | https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/video/SKILL.md |
| video-use 28.9k 星、2026-10-08；音效对看得见的事件、提前起音落在接触帧；能发布的片子另派挑刺 agent | ✅ API 28,961 星，pushed 10-08；原文要求挑刺 agent「只挑刺不夸」 | https://api.github.com/repos/browser-use/video-use ；https://raw.githubusercontent.com/browser-use/video-use/main/SKILL.md |
| TrendRadar 62.9k 星、2026-10-13 发 v6.11.0；默认 11 个热榜含抖音、B 站、知乎、微博；关键词过滤、推送、MCP、GPL-3.0、要自己部署、数据来自 newsnow | ✅ API 62,910 星；v6.11.0 是 10-13 13:05 UTC 的提交加 tag；README 逐项都有 | https://api.github.com/repos/sansan0/TrendRadar ；https://api.github.com/repos/sansan0/TrendRadar/commits ；https://github.com/sansan0/TrendRadar |
| WebFetch 访问 newsnow 抖音热榜接口返回 403 | ✅ 第二轮再试，仍是 403 | https://newsnow.busiyi.world/api/s?id=douyin |
| last30days 64.2k 星、2026-10-13；按互动打分、带引用简报；不覆盖抖音 | ✅ API 64,306 星。补充：它覆盖 TikTok，但没有抖音；小红书要本地登录的浏览器 | https://api.github.com/repos/mvanhorn/last30days-skill ；https://github.com/mvanhorn/last30days-skill |
| ScrapeCreators：outlier 拿作者自己的平时水平当基准；有评论挖掘；不覆盖抖音 | ✅ 13 个 skill；平台列表有 TikTok 无抖音 | https://github.com/ScrapeCreators/social-media-research-skills |
| ScrapeCreators「免费 100 次」「免费额度只有 100 次」 | ⚠ 官网是注册送 100 点，做任务最多再领 7,000 点；入门档 47 美元 2.5 万点、按量付费。「只有 100 次」说少了，已改 | https://scrapecreators.com/ |
| Humanizer-zh 19,668 星、2026-09-23；31 种模式；中文特有的有「的」字叠用、「进行＋动词」、四字排比、「随着……的发展」开头；清单只是线索、不打分 | ✅ API 19,682 星；31 条分 A–F 六组，F 组「中文表达的补充检查」6 条都对得上；原文说清单是检查线索、不是黑名单，也不附自评分 | https://api.github.com/repos/op7418/Humanizer-zh ；https://raw.githubusercontent.com/op7418/Humanizer-zh/main/SKILL.md |
| baoyu-cover-image：仓库 26.7k 星；6 个维度；标题必须用原文；要求 AI 生图、不许用代码画 | ✅ API 26,662 星。原文开头说「5 维」，表格列了 6 个；原文明确不许用 SVG、HTML、canvas 代替生图 | https://api.github.com/repos/JimLiu/baoyu-skills ；https://raw.githubusercontent.com/JimLiu/baoyu-skills/main/skills/baoyu-cover-image/SKILL.md |
| douyin-mcp-server 能取抖音无水印视频、口播转文字；2026-07-02 归档；转文字要 API key | ✅ 页面写 archived on Jul 2, 2026；key 是硅基流动的（也兼容阿里云百炼） | https://github.com/yzfly/douyin-mcp-server ；https://api.github.com/repos/yzfly/douyin-mcp-server |
| skillsmp 收录 300 万以上 skill；「内容与媒体」210,582、「媒体」21,689 | ✅ 首页写 3,000,000+；分类页数字一致 | https://skillsmp.com/ ；https://skillsmp.com/categories |
| GitHub topic：agent-skills 32,662、remotion 1,251 | ⚠ 实时在变，第二轮看到 32,825 和 1,256；正文用约数，没问题 | https://github.com/topics/agent-skills ；https://github.com/topics/remotion |
| motion-skills「50 多个 skill 分 18 包」 | ⚠ README 写 55 个、18 包，仓库简介写 50 个、14 包；已注明 | https://github.com/iart-ai/motion-skills |
| 其他星数：anthropics/skills 19 个 skill、MoneyPrinterTurbo 约 130.8k、brag 15.9k、guizang-social-card 7.5k、claude-code-video-toolkit 2.2k、video-podcast-maker 1.7k、elevenlabs/skills 486、newsnow 22.0k、ECC 279.1k | ✅ 核查时：19 个 / 131.0k / 15,966 / 7,526 / 2,233 / 1,678 / 486 / 22,036 / 279.5k，都在正常涨幅内 | 各仓库页和 https://api.github.com/repos/… |
| 一句话结论「没有一个 skill 能直接读抖音」 | ⚠ 说满了：TrendRadar 能看抖音热榜，douyin-mcp-server（已归档）能取单条视频。准确说法是「没有 skill 能读抖音的视频数据」；已改 | https://github.com/sansan0/TrendRadar ；https://github.com/yzfly/douyin-mcp-server |
| 建议 2「第 0 帧有亮点加一行字，最直接能拉完播」 | ⚠ 说满了：依据是几份 skill 的规则，它们的留存数字都没有可查出处；已改成「最容易照做，效果要看数据」 | 见上面 short-form 一行 |

第二轮结论：没有发现编造的链接或编造的数字。所有仓库、文件、提交都真实存在，引用的规则原文都对得上。要改的是几处说得太满或少说了限定（抖音能不能读、ScrapeCreators 免费额度、留存数字的出处、开头规则的效果），以及两三个仓库自己前后数字不一致（shotcraft、motion-skills、talkcraft 卡数）。skills.sh 安装数仍然打不开，保持「未核实」。

### 第一轮（10-14）

核查员 2026-10-14 逐条重新打开链接（GitHub API、仓库页、raw 原文、官方文档）。这一轮 WebSearch 额度已用完，所以只用了 WebFetch；skills.sh 两次打开都超时。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| Remotion skill 包 5,137 星，最近推送 2026-10-12 | ✅ | API：stargazers 5137，pushed_at 2026-10-12 https://api.github.com/repos/remotion-dev/skills |
| Remotion 共 12 个 skill（含 markup、captions、render、docs），安装命令 `npx skills add remotion-dev/skills` | ✅ | https://www.remotion.dev/docs/ai/skills |
| 「官方说支持 Claude Code、Codex、Kimi Code、Cursor」 | ⚠ 文档是举例「适用于」这些 agent，没说只支持这几个；已改措辞 | 同上 |
| skills.sh 上 remotion-best-practices 约 30.5 万次安装 | ⚠ 仍未核实：页面两次超时，WebSearch 额度用完 | https://skills.sh/remotion-dev/skills/remotion |
| Remotion MCP 已弃用，托管服务最早 2026-08-31 关停 | ✅ 原稿标「未核实」，官方文档其实写了；已改成有据 | https://www.remotion.dev/docs/ai/mcp |
| HyperFrames 63.4k 星 | ⚠ API 是 63,455，页面显示 63.5k；已改 | https://api.github.com/repos/heygen-com/hyperframes |
| HyperFrames 2026-10-14 发 v0.8.157 | ✅ 发布时间 2026-10-14 09:47 UTC | https://api.github.com/repos/heygen-com/hyperframes/releases |
| HyperFrames 自带 21 个 skill，含 music-to-video、faceless-explainer、embedded-captions | ✅ skills 目录下 21 个文件夹 | https://api.github.com/repos/heygen-com/hyperframes/contents/skills |
| HyperFrames 是 HeyGen 2026 年开源 | ✅ 仓库建于 2026-03-10，Apache-2.0，README 说 HeyGen 在生产中用 | https://api.github.com/repos/heygen-com/hyperframes ；https://github.com/heygen-com/hyperframes |
| 10-14 的提交把分镜定成「一板静帧」 | ⚠ 原提交是一页排**多张**静帧的分镜板（#5599）；已改 | https://github.com/heygen-com/hyperframes/commits/main |
| music-to-video 支持歌词视频；脚本把曲子分析一次写进 audiomap.json（能量段、硬停、乐句），之后只认它 | ✅ | https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/music-to-video/SKILL.md |
| music-to-video「按音乐段落硬切」 | ⚠ 只在音乐真正变化处硬切；原文特别说平缓的曲子不要卡拍硬切，按乐句和能量走。这点对我们（安静的配乐）很关键；已补 | 同上 |
| faceless-explainer 顺序按教学需要排；embedded-captions 只把极少数词做特效 | ✅ | https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/faceless-explainer/SKILL.md ；https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/embedded-captions/SKILL.md |
| anything2explainer 2.5k 星、2026-09-18 更新、Remotion 黑底、中英文、30 秒样片、分章质检 agent、量帧、PolyForm Noncommercial | ✅ API 2,494 星，pushed 2026-09-18；README 逐项都有。另发现：画风致谢抖音博主 @图灵宇宙，已补进表 | https://api.github.com/repos/Vincentwei1021/anything2explainer ；https://github.com/Vincentwei1021/anything2explainer |
| video-talkcraft 1.6k 星、2026-10-12、中文为主、冻帧和抖动检查、逐个声音提示点量能量、印样审片最多三轮 | ✅ API 1,574 星，pushed 2026-10-12；「累计封顶 3 轮」 | https://api.github.com/repos/Vincentwei1021/video-talkcraft ；https://github.com/Vincentwei1021/video-talkcraft |
| video-talkcraft 108 张配方卡 | ⚠ README 写 108，仓库简介写 109；已注明 | 同上 |
| video-shotcraft 11.9k 星、2026-10-13、124 张卡约 150 种镜头、能导出剪映草稿 | ✅ | https://api.github.com/repos/Vincentwei1021/video-shotcraft ；https://github.com/Vincentwei1021/video-shotcraft |
| guizang-product-video 793 星、2026-10-09、代码合成配乐、不重复上一部开场转场背景、先提三个方向、封面只用片中帧 | ✅ 默认时长 45–60 秒；AGPL-3.0（assets/fallback 另走 BSL 1.1，已补） | https://api.github.com/repos/op7418/guizang-product-video-skill ；https://github.com/op7418/guizang-product-video-skill |
| guizang-social-card 7.5k 星、2026-07-01、28 种版式 | ✅ 最近一次提交 2026-07-01；AGPL-3.0 | https://github.com/op7418/guizang-social-card-skill ；https://github.com/op7418/guizang-social-card-skill/commits/main |
| anthropics/skills 181k 星、2026-10-09、19 个 skill；algorithmic-art 先写 4–6 段算法哲学、固定随机种子 | ✅ API 181,092 星 | https://api.github.com/repos/anthropics/skills ；https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md |
| OpenMontage 68.2k 星、2026-10-12、700 多个 skill 和知识文件 | ✅ API 68,195 星；AGPL-3.0 | https://api.github.com/repos/calesthio/OpenMontage ；https://github.com/calesthio/OpenMontage |
| OpenMontage「讲解片默认用 Remotion」 | ⚠ README 原意是「数据类讲解片」默认 Remotion，动效为主的默认 HyperFrames；已改 | https://github.com/calesthio/OpenMontage |
| short-form：第 1 帧要有看头、0.5 秒内出字；留存门槛 3 秒 70%、15 秒 60%、30 秒 50% | ✅ 原文属实；这三个数没对应到具体出处（第二轮补充：文件开头有一份笼统的来源列表），原始出处仍**未核实** | https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/creative/short-form.md |
| storytelling：8 秒内钩子、30 秒内铺完张力、30–45 秒一个新概念、1–3 秒静默、先讲误解再推翻（Muller 2008）、不用「然后」 | ✅ 原文属实；Muller 指 Derek Muller 2008 年悉尼大学博士研究；30–45 秒一条只挂在 Mayer 分段原则名下，出处未核实 | https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/creative/storytelling.md |
| OpenMontage 研究导演分 5 批搜：全景、正在火的、数据、受众、专家 | ✅ | https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/pipelines/explainer/research-director.md |
| OpenMontage 发布导演出「缩略图构想」和「海报帧构想」 | ⚠ 讲解片那份只有缩略图构想（3–5 个字），没找到海报帧；已改 | https://raw.githubusercontent.com/calesthio/OpenMontage/main/skills/pipelines/explainer/publish-director.md |
| marketingskills 54.7k 星、2026-10-14；钩子 4 类；「3 秒规则」三种钩子第 1 秒内同时出现；每周看前 3 条和后 3 条 | ✅ API 54,699 星，pushed 2026-10-14 | https://api.github.com/repos/coreyhaines31/marketingskills ；https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/social/SKILL.md |
| marketingskills 的 video skill 给 agent 推荐 HyperFrames，Remotion 留给复杂动画 | ✅ | https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills/video/SKILL.md |
| ECC content-engine：开头亮结果、问题或重拳；禁「这为什么重要」空话；从素材出发 | ✅ 后两条是全篇通用规则，不只针对短视频 | https://raw.githubusercontent.com/affaan-m/ECC/main/skills/content-engine/SKILL.md |
| ECC 仓库 276.5k 星 | ⚠ 这是 skillsmp 上的数；GitHub 页面 10-14 显示 279.1k；已改 | https://github.com/affaan-m/ECC ；https://skillsmp.com/categories/content-creation |
| headline-matrix 25 个标题、7 个角度；scroll-stopping-creative 5 个方案、钩子 / 画面 / 台词三栏 | ✅ | https://raw.githubusercontent.com/realkimbarrett/advertising-skills/main/skills/copy-chief/headline-matrix/SKILL.md ；https://raw.githubusercontent.com/realkimbarrett/advertising-skills/main/skills/operator-os/scroll-stopping-creative/SKILL.md |
| video-use 28.9k 星、2026-10-08；音效对看得见的事件、提前起音落在接触帧；挑刺 agent；白话方案批准前不动刀 | ✅ API 28,938 星 | https://api.github.com/repos/browser-use/video-use ；https://raw.githubusercontent.com/browser-use/video-use/main/SKILL.md |
| TrendRadar 62.9k 星、2026-10-13 发 v6.11.0、默认 11 个热榜含抖音 B 站知乎微博、关键词过滤、推送、MCP、GPL-3.0、数据来自 newsnow | ✅ API 62,906 星；v6.11.0 是 10-13 的提交和 tag，没有 GitHub Release 页 | https://api.github.com/repos/sansan0/TrendRadar ；https://github.com/sansan0/TrendRadar ；https://github.com/sansan0/TrendRadar/commits/master |
| WebFetch 访问 newsnow 抖音热榜接口返回 403 | ✅ 核查时再试，仍是 403 | https://newsnow.busiyi.world/api/s?id=douyin |
| newsnow 22.0k 星、更新「未显示」 | ⚠ API 显示 pushed 2026-10-13；已补 | https://api.github.com/repos/ourongxing/newsnow |
| last30days 64.2k 星、2026-10-13、按互动打分、带引用简报、不覆盖抖音 | ✅ README 列了 20 来个平台，没有抖音 | https://api.github.com/repos/mvanhorn/last30days-skill ；https://github.com/mvanhorn/last30days-skill |
| ScrapeCreators outlier 拿作者自己的平时水平当基准；有评论挖掘；不覆盖抖音 | ✅ | https://github.com/ScrapeCreators/social-media-research-skills |
| ScrapeCreators「要付费 API」、更新「未显示」 | ⚠ 要 API key，注册送 100 点（第二轮补充：做任务最多再领 7,000 点），之后按量付费（入门档 47 美元）；pushed 2026-08-26；已改 | https://scrapecreators.com/ ；https://api.github.com/repos/ScrapeCreators/social-media-research-skills |
| Humanizer-zh 19,668 星、2026-09-23；31 种模式分 6 组；中文特有组含的字叠用、进行＋动词、四字排比、「随着……的发展」；只是线索、不打分 | ✅ | https://api.github.com/repos/op7418/Humanizer-zh ；https://raw.githubusercontent.com/op7418/Humanizer-zh/main/SKILL.md |
| baoyu-cover-image：仓库 26.7k 星、2026-09-10；6 个维度；标题用原文不许编；要生图、不许用代码画 | ✅ API 26,654 星。小出入：原文开头写「5 维」，表格和确认步骤是 6 个 | https://api.github.com/repos/JimLiu/baoyu-skills ；https://raw.githubusercontent.com/JimLiu/baoyu-skills/main/skills/baoyu-cover-image/SKILL.md |
| douyin-mcp-server 约 1.3k 星，取无水印视频、口播转文字，2026-07-02 归档，转文字要 API key | ✅ API 1,276 星，archived；key 是硅基流动的 | https://api.github.com/repos/yzfly/douyin-mcp-server ；https://github.com/yzfly/douyin-mcp-server |
| elevenlabs/skills 486 星、更新「未显示」 | ⚠ API 显示 pushed 2026-10-14；已补 | https://api.github.com/repos/elevenlabs/skills |
| open-design 的 audio-jingle 转给 Suno、MiniMax、ElevenLabs；仓库 101k；2026-08-18 | ✅ GitHub 101.1k；skillsmp 上该 skill 更新日 2026-08-18 | https://raw.githubusercontent.com/nexu-io/open-design/main/design-templates/audio-jingle/SKILL.md ；https://skillsmp.com/categories/media |
| 同仓库还有 create-video-storyboard | ⚠ 未核实：design-templates 目录和 skillsmp 媒体页都没找到；已标 | https://api.github.com/repos/nexu-io/open-design/contents/design-templates |
| 其他星数和更新日：claude-code-video-toolkit 2.2k / 10-12、video-podcast-maker 1.7k / 10-01、MoneyPrinterTurbo 130.8k / 10-14、brag 15.9k / 10-13、motion-skills 810 / 10-14（55 个 skill 分 18 包） | ✅ | 各仓库 https://api.github.com/repos/… 与仓库页 |
| skillsmp 收录 300 万以上；「内容与媒体」210,582、「媒体」21,689 | ✅ | https://skillsmp.com/ ；https://skillsmp.com/categories |
| GitHub topic：agent-skills 32,662、claude-skills 11,194、remotion 1,251 | ⚠ 数在实时变，核查时是 32,684 / 11,203 / 1,251；已改成约数 | https://github.com/topics/agent-skills ；https://github.com/topics/claude-skills ；https://github.com/topics/remotion |
| Remotion 字幕 `createTikTokStyleCaptions()` 按毫秒分页、能逐词出现 | ✅ | https://www.remotion.dev/docs/captions/create-tiktok-style-captions |

没有发现编造的链接或编造的数字。主要问题是几处说得比原文满（「按段落硬切」「讲解片默认 Remotion」「一板静帧」），以及原稿把官方已写明的 Remotion MCP 弃用标成了「未核实」。
