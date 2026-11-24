# 01 光郡（guangjun5952）的 Skill 仓库：读了什么，能借什么

> 调研日期：2026-10-14。GitHub 数据都是当天从 GitHub 公开接口读的。
> 说明：本轮调研里网页搜索的次数已经用完，所以第 3 节「光郡有没有公开账号」没能用搜索引擎查。下面写清了查到哪一步。

## 一句话结论

光郡的仓库是一套**做片的工具**，不是**找热点、起号的方法**。他公开的 33 个仓库里，有 8 个是 Skill 或工具，25 个是 Remotion 动效源码。对萤火最值钱的有三样：
1. 一条写得很细的**文字可读规则**：字出来以后至少稳住 1.5 秒，读字时镜头几乎不动。
2. 一套**动效模板库的「调用协议」**：每个模板写清楚什么时候用、什么时候别用、装得下多少东西、哪些能直接改、哪些要动源码。
3. **「造屏翻拍」这种新形式**：先在画面里造一块 LED 点阵屏，再用虚拟摄像机去拍它。

他的广告片流程、MiniMax 付费生成视频、YouTube 剪辑插件，和我们关系不大。

---

## 1. 光郡是谁（GitHub 上能看到的）

| 项目 | 内容 | 来源 |
|---|---|---|
| 名字 | 光郡（登录名 guangjun5952） | [GitHub 接口：用户资料](https://api.github.com/users/guangjun5952) |
| 简介 | 「TVC Director」。TVC 就是电视广告片，他是广告片导演 | 同上 |
| 账号注册 | 2026-04-22 | 同上 |
| 公开仓库 / 粉丝 | 33 个仓库，14 个关注者 | 同上 |
| 个人网站、邮箱、推特 | 都没填 | 同上；[GitHub 主页](https://github.com/guangjun5952) |
| 置顶仓库 | tvc-ai-director、minimax-h3-broll-generator、motion-archive、led-screen-film、youtube-clipper | [GitHub 主页](https://github.com/guangjun5952) |

---

## 2. 全部 33 个仓库总表

数据日期 2026-10-14。「最后推代码」是 GitHub 的 pushed_at，比 updated_at 更能说明作者最近有没有在改。updated_at 会因为有人点星而变。

### 2.1 Skill 和工具（8 个）

| 仓库 | 一句话 | 星 / 复刻 | 语言 | 许可证 | 创建 | 最后推代码 |
|---|---|---|---|---|---|---|
| [tvc-ai-director](https://github.com/guangjun5952/tvc-ai-director) | 广告片全流程 Skill 套件，1 个总入口加 9 个 tvc 子 Skill，另带 1 个通用的 multi-model-router | 62 / 2 | Python | MIT | 2026-06-19 | 2026-06-23 |
| [minimax-h3-broll-generator](https://github.com/guangjun5952/minimax-h3-broll-generator) | 按口播稿规划 B-roll（口播之外插进去的画面），用 MiniMax-H3 付费生成，T01–T21 模板 | 43 / 3 | Python | MIT | 2026-08-10 | 2026-08-14 |
| [motion-archive](https://github.com/guangjun5952/motion-archive) | 他自己的动效库：本地管理、预览、调用协议，23 个 Remotion 模板 | 3 / 1 | JavaScript | MIT（只管工具代码） | 2026-09-30 | 2026-09-30 |
| [led-screen-film](https://github.com/guangjun5952/led-screen-film) | 「造屏翻拍」：LED 点阵屏 + 虚拟摄像机 + 运动模糊，Python 出片 | 2 / 0 | Python | MIT | 2026-10-12 | 2026-10-12 |
| [asset-discovery](https://github.com/guangjun5952/asset-discovery) | 本地优先的视频素材检索 Skill，带授权判断 | 2 / 0 | Python | GitHub 显示 NOASSERTION；文件本身是 MIT 加一句附加说明 | 2026-10-11 | 2026-10-11 |
| [youtube-clipper](https://github.com/guangjun5952/youtube-clipper) | macOS 上的 Chrome 插件，在 YouTube 页面选一段直接导出 MP4 | 3 / 0 | JavaScript | MIT | 2026-09-24 | 2026-09-24 |
| [script-cut-ui](https://github.com/guangjun5952/script-cut-ui) | 口播稿变成可编辑时间线，标情绪节奏、排 B-roll，导出 Word/Excel | 6 / 0 | TypeScript | 没有许可证 | 2026-06-05 | 2026-06-05 |
| [xuanji-decision](https://github.com/guangjun5952/xuanji-decision) | 「玄机决」：用四本命理书的框架帮 Agent 在两难时拍板 | 3 / 0 | 无 | MIT | 2026-04-22 | 2026-04-22 |

来源：[GitHub 接口：仓库列表](https://api.github.com/users/guangjun5952/repos?per_page=100)，各仓库 README。asset-discovery 的 LICENSE 是 MIT，末尾加了一句「只覆盖工具代码和文档」（[LICENSE](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/LICENSE)）。GitHub 显示 NOASSERTION，**我猜**就是这句附加话让 GitHub 认不出标准 MIT（未核实）。

### 2.2 Remotion 动效源码（25 个）

Remotion 是用 React 写视频的框架，我们也用它。这 25 个都是「复刻别人的动效」的源码，大多建于 2026-09-24，几乎都是 0 星。

| 仓库组 | 个数 | 内容（取自描述） | 星 | 许可证 |
|---|---|---|---|---|
| motionface-eagle-*-20260922 | 12 | bleap 金融品牌卡片、brand 品牌与信任、create 创意混剪、decisions 决策动态字、fear 情绪与交易、forex 积分权益、lens 放大镜追焦、lia 聊天自动化霓虹图标、march 日历与奖品、myna AI 提问括号排字、windows 彩色文件夹与手势、worldcup 抽奖路径 | 全 0 | 无 |
| motionface-editing-* | 4 | creative-core 机械劳动与创意、folder-analysis 文件夹展开、three-inputs 三部分聚焦、workflow 八步流程巡游连线 | 全 0 | 无 |
| motionface-finqube-* | 2 | combo 财务卡片巡游、full-template 完整产品演绎 | 各 1 | 无 |
| motionface 其他 | 6 | discipline-focus 自律与时间、giga-hallucination 幻觉检测、pinterest-focus 动态字、saas-spatial-chat 像素生成空间画廊、six-card-gallery 六卡片连续运镜、trading-mirror 生活与交易镜像 | 0–1 | 无 |
| sandydesign-remotion-0b66f6e0 | 1 | 复刻 Sandy Design Studio 的动效片段 | 0 | 无 |

- 这些片子的原作在一个叫 Motionface 的动效灵感网站上（[motionface.cc](https://motionface.cc/)，页面标题「Motion Face · 动效灵感与复刻」）。sandydesign 的 README（英文）写明，这是对 Motionface 上 sandydesignstudio 一段动画的复刻，是独立研究，不是该工作室官方发布的源码（[README](https://raw.githubusercontent.com/guangjun5952/sandydesign-remotion-0b66f6e0/main/README.md)；以上是意译）。**这个网站是不是光郡开的，查不到**：页面上没有作者、公司、备案号或社交链接。
- 用的版本：Remotion 4.0.354、React 19.1.0（[package.json](https://raw.githubusercontent.com/guangjun5952/motionface-discipline-focus/main/package.json)）。我们是 Remotion ^4.0.530、React ^19.3.0，同一个大版本，代码大体能对上。
- 风格：亮色产品 UI、金融卡片、SaaS 界面，是商业宣传片的路子。和我们「暗底、光是主角」差得远。

---

## 3. 逐个深读：像 Skill 的仓库

### 3.1 tvc-ai-director（62 星，他最火的一个）

| 方面 | 内容 |
|---|---|
| 做什么 | 把广告公司的做片流程搬给 AI。主链路：brief（客户需求）→ 创意 → 导演阐述 → 分镜 → AI 提示词 → AI 制作 → 剪辑 → 客户审片。PPM（开拍前和客户的确认会）插在导演阐述之后 |
| 怎么组织 | 1 个总入口 `tvc-ai-director` 判断现在在哪一步，再交给 9 个子 Skill（brief 诊断、创意、导演阐述、PPM、分镜、出图出视频提示词、制作协调、剪辑、读懂客户意见），外加一个通用的 `multi-model-router` |
| 确认关口 | 信息不够就停在 brief：**先问横屏还是竖屏**，「不能只凭投放平台推断」。brief 共 10 个必答问题（画幅、渠道、时长、参考风格、slogan、禁用词、人群等）。用户硬要跳过，就要把用了哪些默认值列出来 |
| 模板和参考 | 8 个模板（每个只有 177–423 字节，很薄）；5 份参考：工作流图、质量标准、品类打法、提示词写法、客户沟通 |
| 提示词 | 视频提示词按「参考素材 → 时长画幅 → 场景 → 分时段动作 → 运镜 → 主体/产品运动 → 光色 → 声音 → 结束画面 → 负面约束」排，共 10 项。明确说别让模型自己编文字或口号 |
| 质量标准里和我们沾边的 | 「开场要有让人继续看下去的理由」（写在「创意」一栏）；「前 3 秒清晰易读」（写在「剪辑」一栏）；音乐和剪切要服务于创意，不只是装饰。原文是英文，这里是意译 |
| 技术栈 | 几乎全是 Markdown；两个小 Python 脚本把表格转成 Excel，不需要装第三方包 |
| 适用 | 只写了 Codex（每个子 Skill 带 `agents/openai.yaml`），README 没提 Claude Code |
| 成熟度 | 文档型、早期。代码只在 2026-06-19 到 06-23 推过，之后没更新。星多，是因为题目切中「广告人转 AI」 |

来源：[README](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/README.md)、[SKILL.md](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/SKILL.md)、[质量标准](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/references/tvc-quality-bar.md)、[视频提示词方法](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-shot-prompter/references/video-prompt-method.md)、[剪辑 Skill](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-editing-director/SKILL.md)、[multi-model-router](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/multi-model-router/SKILL.md)、[文件树](https://api.github.com/repos/guangjun5952/tvc-ai-director/git/trees/main?recursive=1)。

注意：剪辑 Skill 只说「先想清楚前三秒要达成什么」，**没给具体做法**。

### 3.2 minimax-h3-broll-generator（43 星，工程最扎实的一个）

| 方面 | 内容 |
|---|---|
| 做什么 | 给知识类口播视频配画面。输入口播稿或口播视频（本地用 Whisper 转成带时间戳的字稿）→ 按意思切段 → 判断每段要不要配画面、配哪种 → 套 T01–T21 模板 → 写 MiniMax-H3 提示词 → **用户批准后**才付费生成 → 按时间戳自动剪回原片 |
| 每段先分路 | 6 种：A_ROLL（就看人说话）、REAL_EVIDENCE（真截图真论文，原文要求绝不用 AI 生成来伪造）、EXISTING_MEDIA（用户已有素材）、HYPERFRAMES（必须一字不差的字，交给确定性工具排）、H3 文字包装、H3 纯画面。原话意思：不要每句都硬塞画面 |
| 确认关口（最严的一处） | 真正调用付费接口，原文要求三条同时满足：①用户在当前对话里点名批准某些镜头（或说「全部镜头」） ②计划文件里总状态和每个选中镜头的状态都是 approved ③脚本带 `--approved` 运行。另有一条单独的规则：关联的必需素材还标着 missing，就不许批准或提交这个镜头；用户明确放弃某素材时，要把镜头改成一眼能看出的比喻，并标注是 AI 生成。批准命令里还带一个确认参数 `--confirmation CONFIRM_MINIMAX_H3_COST`。**「继续」「看起来不错」、沉默、或者只批准了流程，都不算批准**。改了字稿或换了提示词档位，下游的批准都要重来 |
| 其他关口 | 每次先问用哪档提示词（v1/v2/v3），不许默认；转写完先和用户核对人名、英文、数字；缺素材一次性问清 |
| 先试跑 | `--dry-run`（试跑：只打印要发的请求，不联网不花钱） |
| 模板库 T01–T21 | 每张卡都有用途、构图、动效顺序；「要用户给的素材」和「限制」只有部分卡有。例：T03 数字冲击，「数字、单位和来源必须由用户提供」；T21 技术机制，每条只讲一个机制步骤，不许生成伪参数、伪界面 |
| 字体清晰度规则 | 见下表 |
| 声音 | 生成的镜头禁止音乐、旋律、唱歌、旁白和对白，只允许和动作同步的拟音，加克制的环境音 |
| 技术栈 | Python 脚本 + JSON 计划文件（schema 1.6，schema 就是文件格式规定）+ ffmpeg；有测试和 GitHub 自动校验 |
| 适用 | Codex Skill（`install.sh` 装到 `~/.codex/skills/`） |
| 成熟度 | VERSION 文件写 1.1.0；有 3 个测试文件和 CI。最后推代码 2026-08-14 |
| 他自己承认的短板 | MiniMax-H3 排中文仍可能出错字；品牌名、引文、证据这类字要用别的工具排 |

**字体清晰度三档**（[prompt-versions.md](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/references/prompt-versions.md)）：

| 项 | v1 简洁 | v2 丰富 | v3 平衡（推荐） |
|---|---|---|---|
| 文字组数 | 1 组，最好 2–8 个汉字 | 最多 3 组 | 优先 1 组，最多 2 组 |
| 可见字数上限 | 12 | 28 | 18 |
| 读字时还在动的图层 | 1 层慢动 | 最多 3 层 | 最多 2 层 |
| 字稳住、能读的时间 | ≥1.8 秒 | ≥1.2 秒 | ≥1.5 秒 |
| 镜头运动次数 | 1 次 | 2–4 次 | 1–2 次 |
| 强调色 | 1 个 | 没规定 | 1 个 |

**v3 的细则**（[v3 平衡档](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/references/template-complexity-v3-balanced.md)、[模板说明](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/docs/templates.md)）：
- 读字期间：镜头平移 < 画面宽度 2%，缩放变化 < 3%，旋转 < 0.5°。
- 背景运动要慢、对比低，显眼程度（原文 visual salience）低于 15%。原文没说这个 15% 是和谁比、怎么量。颗粒、网格、纤维、暗角要很淡，不许以高对比穿过标题；也不许强光穿过文字。
- 字先转正、运动模糊消掉，再进入读字时间。
- 中文字不许扭曲、液化、碎裂、故障化、由粒子拼成、持续旋转。
- 字距 −2% 到 +2%，行高 0.98–1.08，优先单行。
- 原文**没给**字号占画面多少、对比度比值、安全区像素。

来源：[README](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/README.md)、[SKILL.md](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/SKILL.md)、[VERSION](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/VERSION)、[文件树](https://api.github.com/repos/guangjun5952/minimax-h3-broll-generator/git/trees/main?recursive=1)。

### 3.3 motion-archive（动效库 + 调用协议）

| 方面 | 内容 |
|---|---|
| 做什么 | 本地跑的动效资产库。内置 23 个模板、5 套风格、10 个背景、2 个字体。可搜索、打标签、预览，能看「带风格版」和「纯动效版」 |
| 调用协议 | 叫 asset-usage-1。每个资产版本配一份 JSON + Markdown 说明，必填：适用场合（useWhen）、不适用场合（avoidWhen）、容量（几个元素、几个字、几秒）、参数、变体、限制、验证到哪一级 |
| 参数分四类 | ①运行时参数：能直接传进去 ②要改源码：必须找到代码去改 ③选择：在原版、纯动效版、横竖屏之间挑 ④外部提供：字体、背景、风格 |
| 一个例子 | 「八步流程·巡游连线」：只适合**恰好八步**的流程；三步的不能用，要重排路径；八个节点名要改源码里的 `LABELS`；只有 16:9 和 9:16 两种画幅（[协议样例](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/prototype/usage/editing-workflow-1.0.0-usage-1.1.0.md)） |
| 禁止事项 | 原文没有集中的禁止清单，散在各处：同名包已存在就要升版本，不许覆盖、不许改旧版说明；「要改源码」的参数不能当 props 直接传；纯动效版不是换个风格 ID 就能成片的万能模板；没做排版测量，不能说容量安全；只出调用计划时「不会假装已经渲染」；协议校验不能代替看渲染质量 |
| 「纯几何版」 | 复刻完成后，用同一套运动计算再出一版：去掉文字、字体、照片、配色和材质，只剩几何和运动，方便以后套新内容 |
| 复刻质量规则 | 不能只靠渐显和匀速平移；运动模糊要真的按时间采样，不能用全屏高斯模糊冒充；视差要有至少两层不同深度在动；运动段要看连续帧，静态拼图证明不了流畅。他记录过一次失败：首镜两版只照着配色重写动画，被评「有 PPT 感」 |
| 技术栈 | Node.js 20+，管理工具没有第三方 npm 包；首次 `npm run setup` 要联网，下载包约 768 MB，需要约 2 GB 临时空间；默认只监听本机 127.0.0.1 |
| 许可证 | 工具代码 MIT；参考复刻里的照片、视频、音乐、商标、字体都不因开源变成 MIT。第三方说明里写，Vert、研宋等字体「未提供统一商用授权证明」 |
| 成熟度 | v1.0.0 首个公开版；RELEASE_NOTES 写 17/17 测试通过、40 项资产协议验证通过。23 个模板 + 5 套风格 + 10 个背景 + 2 个字体正好 40 项。调用协议文档的「当前交付」一节写「已为 9 个模板、5 套风格、2 个字体补齐协议」，和 40 项对不上，可能是没更新的早期数字（未核实） |

来源：[README](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/README.md)、[TEMPLATES.md](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/TEMPLATES.md)、[调用协议](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/docs/asset-usage-contract.md)、[复刻质量](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/docs/replication-quality.md)、[RELEASE_NOTES](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/RELEASE_NOTES.md)、[第三方说明](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/THIRD_PARTY_NOTICES.md)、[文件树](https://api.github.com/repos/guangjun5952/motion-archive/git/trees/main?recursive=1)。

### 3.4 led-screen-film（造屏翻拍）

| 方面 | 内容 |
|---|---|
| 核心想法 | 普通 AI 动画像网页，没有镜头和快门。这里反过来：先造一块屏，再造一台摄像机去拍它。专业名叫 display emulation（显示设备模拟） |
| 四层 | ①屏：内容画在 640×360 的小画布上，一个像素就是一颗灯珠 ②摄像机：推拉摇移、轻微透视，每个输出像素反查对应的灯珠，画出亮芯、微光和黑缝 ③镜头：辉光、色差、虚焦、扫描亮带、暗角、颗粒、闪白 ④快门：每帧在 0.75 帧的快门时间里渲染 3–18 个子帧再平均，镜头越快子帧越多，得到真的运动模糊 |
| 换介质 | 还带 CRT 显像管、报纸网点、示波器三种 |
| 硬规则 | 「前 5 秒必须留人」：开头要有强画面加一句钩子；只配音效不配音乐；白字用 `#e8ecf0` 不用纯白；大字后面一律垫黑底；花字只放画面上 2/3，下面 1/5 留给字幕；每个镜头换一个主色，镜头间硬切，切点闪白一帧 |
| 确认关口 | 先把参考片拆成六格（介质、出字、标注、色彩、转场、运动），**拆完先和用户确认再开工**；每个镜头渲染前先出 `still=` 检查帧，渲染完再抽帧拼图自检 |
| 用户意见变规则 | 原文：「用户给的具体意见要记成规则，下次默认生效。」风格规则里有一节叫「已经调好的参数（来自用户意见，别改回去）」，例如辉光 bloom 0.32 / 0.38、全局亮度 GAIN_SCALE 0.84 |
| 声音 | 引擎说明写「35 种合成音效」（都由 `scripts/sfx.py` 合成，仓库里没有音频文件），事件和画面动作对齐；有旁白时剪切点卡在词上（用逐词时间戳） |
| 技术栈 | Python 3.12；numpy、opencv-python、skia-python、pedalboard；ffmpeg |
| 平台 | 完整渲染依赖多进程 fork，只支持 macOS 和 Linux；**原生 Windows 不支持**，要 WSL |
| 成熟度 | 2026-10-12 刚建；只在 macOS 上验证过低分辨率示例出片（6 秒 MP4 和 3.5 秒透明 MOV）；没测全部音效，没在 Linux/Windows 实机测过 |
| 许可证 | MIT；推荐的中文字体「猴尊宋体」不在仓库里 |

来源：[README](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/README.md)、[SKILL.md](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/SKILL.md)、[风格规则](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/style.md)、[引擎说明](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/engine.md)、[验证报告](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/VALIDATION.md)、[requirements.txt](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/requirements.txt)。

### 3.5 asset-discovery（素材检索，带版权意识）

| 方面 | 内容 |
|---|---|
| 做什么 | 把脚本里每个要用的画面，对到本地素材或免费素材站的某几秒，导出剪好的片段、时间码、Remotion 组件和达芬奇时间线 |
| 来源顺序 | 本地优先。在线默认关；开了以后视频先查 Pexels、Pixabay，再查 Mixkit、Wikimedia Commons；音效查 Freesound 等 |
| 授权分三档 | 自动接受：Pexels/Pixabay 平台许可、Commons 上元数据写明的 CC0（放弃一切权利）和 CC BY（署名即可用）。要截图留证据：Mixkit。不自动接受：NC（禁止商用）、ND（禁止改编）、相同方式共享、未知许可 |
| 状态标签 | 4 种，不许混用：平台接口声明了许可 / 官方接口条目适用平台条款 / Agent 或用户看过网页并留证 / 用户自带、来源未知 |
| 出片附带 | `CREDITS.md`（署名表）、`provenance.json`（每个文件的校验值、来源、授权证据、选它的理由） |
| 审片关口 | Agent 必须真看过抽帧、真听过音效才能填评分；空白模板导入会被拒；没有合格候选的需求留在「未解决」里，不硬凑 |
| 边界 | 不做批量抓取、不镜像素材站、不绕过认证、不自动买接口额度（原文没提验证码） |
| 技术栈 | Python 3.9+，不需要第三方包；ffmpeg |
| 成熟度 | MVP 0.2.0；42 项测试；在线接口只做了模拟测试，没用真账号验收过 |

来源：[README](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/README.md)、[SKILL.md](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/SKILL.md)、[授权规则](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/references/licensing.md)（核验日期写的是 2026-10-09）。

### 3.6 其余三个，一句话带过

| 仓库 | 内容 | 和我们有没有关系 |
|---|---|---|
| youtube-clipper v1.1.1 | macOS 的 Chrome 插件，调 yt-dlp 和 ffmpeg 截 YouTube 片段；只支持 macOS；提醒只处理有权使用的内容 | 无关。我们在 Windows，也不拿别人视频（[README](https://raw.githubusercontent.com/guangjun5952/youtube-clipper/main/README.md)） |
| script-cut-ui | 口播稿变时间线，标情绪和节奏；Next.js 16 + Remotion，基于 DesignCombo 编辑器改的；大模型分析接口还没实现；没有许可证 | 无关。我们没有口播（[README](https://raw.githubusercontent.com/guangjun5952/script-cut-ui/main/README.md)） |
| xuanji-decision | 用《滴天髓》等四本命理书做决策框架的 Skill | 无关（[README](https://raw.githubusercontent.com/guangjun5952/xuanji-decision/main/README.md)） |

---

## 4. 光郡有没有公开的抖音 / B 站 / 小红书

**结论：没查到，也没能查完。**

| 查了哪里 | 结果 |
|---|---|
| GitHub 资料 | 网站、邮箱、推特都空着；没有个人主页 README（[接口](https://api.github.com/users/guangjun5952)、[主页](https://github.com/guangjun5952)） |
| 各仓库 README | tvc-ai-director、minimax、motion-archive、led-screen-film 的 README 都没有任何社交账号链接 |
| B 站公开搜索接口 | 返回 412（风控拦截），按规矩没有绕过。10-14 核查时再试一次，仍是 412 |
| 网页搜索 | 本轮搜索次数已用完，没能搜「光郡 抖音」等。10-14 核查时再试，仍被拒。**这不等于他没有账号** |
| motionface.cc | 只是一个动效灵感网站，页面上没写是谁开的，也没有社交链接 |

旁证：led-screen-film 的 SKILL.md 写着这是「光郡的『造屏翻拍』视频风格」，风格规则里有一节「已经调好的参数（来自用户意见，别改回去）」；README 写它「适合科普动效、B-roll、章节卡和透明花字」。这几句原文都核实过。由此**推测**他在实际做片（未核实）。他的片子发在哪、是不是 vibe 类，**查不到**。

如果想确认：用户可以在抖音 App 里手动搜「光郡」，或者下次给我搜索额度后再查。

---

## 5. 对我们有什么用

### 5.1 先说清楚：这些仓库不解决「蹭热点、快速起号」

- 光郡的东西全在「怎么做得好、做得快」，没有一篇讲选题、热点或流量。
- 唯一和「开头抓人」沾边的两句：
  - led-screen-film 的「前 5 秒必须留人」：强画面加一句有钩子的文案；风格规则里举的手段是数字计时器、穿梭、频闪蒙太奇（[风格规则](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/style.md)）。
  - tvc-ai-director 质量标准里的「开场要有让人继续看下去的理由」「前 3 秒清晰易读」。
- 这两句和我们已有的规矩不冲突，但要记住我们踩过的坑：开头的动作本身必须就是概念的演示，否则观众看不懂（见记忆 hook-must-be-the-demo）。

### 5.2 可落地的借鉴（5 条）

| # | 借什么 | 放进萤火哪一步 | 预计多大用处 |
|---|---|---|---|
| 1 | **读字时间规则**：画面上的字（不含字幕）出完后至少稳住 1.5 秒；这段时间里镜头平移 < 画宽 2%、缩放 < 3%、旋转 < 0.5°；还在动的图层最多 2 层；字先转正、去掉模糊，再算读字时间；粒子聚字、光带不许在读字时穿过字 | 写进 `规则清单.md` 的 V 组（挨着 V5 字数、V11 字号）；第 7 步自检加一项：每个画面字出现后第 1.5 秒抽一帧，看清不清楚 | **中等，成本最低**。我们已经限了字数（多数帧 ≤8 个汉字），字幕也有在屏时长规则（S8），但画面上的字还没管「能稳住多久」。这条直接对手机上看清字有用，写一条规则就能用 |
| 2 | **场景卡 + 调用协议**：把峰终、弱关系、赫布里做得好的场景整理成「场景卡」。每张卡写：适合讲什么、不适合讲什么、装得下几个元素几秒、哪些能直接传参数、哪些要改源码、只验证到哪一步。可以再学他的「纯几何版」：同一套运动去掉文字和配色，留着以后套新内容 | 第 2 步定结构时，先翻场景卡挑画面主角；第 6 步制作时复用代码，照现在「把组件复制到片子目录里改」的做法 | **中到大，但要等**。一部片省多少时间，要看能复用几个场景。系列感也会更强。整理一次大约要一个 agent 会话。建议第五版第一部片做完再整理 |
| 3 | **「造屏翻拍」这种形式**：先画一块 LED 点阵屏（或示波器、CRT），再用虚拟摄像机拍，带真运动模糊、硬切加一帧闪白。灯珠本身就是光，和我们「光是主角」合得来 | 第 1 步选题提案加一栏「形式」；挑一个合适的题（比如讲信号、心跳、信息的题，示波器正对路）先做 10–20 秒试验段 | **可能大，但没验证**。用户说这个类型已经泛滥，换一种形式是拉开差距的办法之一。**不直接用他的 Python**：原生 Windows 不支持，还要装 skia 等包。思路可以在我们的 Remotion `GlowCanvas` 里照着做：低分辨率画布 → 灯珠采样 → 子帧平均 |
| 4 | **确认关口的写法**：①写明什么不算批准：「继续」「看起来不错」、沉默都不算 ②批准要对着具体的东西（哪几句台词、哪个开场）③上游改了，下游的批准自动作废，要重新确认 | 萤火每个「停」的地方（第 1、1b 步，剧本过目，第 8 步交付），以及 `改片流程.md` | **小到中**。萤火已经有「改了用户看过的台词要发对照」，这条把它说得更死，少一点误会和返工 |
| 5 | **素材来源和授权表**：只要片里出现不是代码画的东西（名画、照片、游戏画面、录屏），就在核查文件里加一张表：来源、授权类型、状态（平台声明 / 看过网页留了证 / 来源不明）、要不要署名。署名放置顶评论 | 第 4 步事实核查，`事实核查.md` 加一节「素材来源」 | **现在小，蹭热点时必须有**。我们现在全是代码画的，用不上。但如果做梵高、瓦罗兰特这类题，要用到原画或游戏画面，就得有这张表。梵高的画是不是已进入公有领域、博物馆的高清图能不能用、Riot 对二创的政策，本次都**没有核实** |

### 5.3 和我们无关的（不用看）

| 内容 | 为什么无关 |
|---|---|
| tvc-ai-director 的主体（brief、PPM、客户审片、品类打法） | 那是给甲方做广告的流程。我们没有甲方，也没有实拍 |
| MiniMax-H3 付费生成视频 | 要花钱；他自己说中文会出错字；而且和我们的署名「全部由 Opus 5.5 用代码生成」冲突 |
| B-roll 分路、口播转写、自动剪回原片 | 我们没有口播 |
| 25 个 motionface 源码 | 亮色商业 UI 风格，和暗底光效不搭；没有许可证；里面的字体、图片权利不清 |
| youtube-clipper、script-cut-ui、xuanji-decision | 平台不对、场景不对、或和做片无关 |

### 5.4 要不要试

1. **第 1 条马上可以做**：在 `规则清单.md` 加一条读字时间规则，在自检表里加一项。不用问用户，属于制作手艺。
2. **第 3 条值得和用户讨论**：要不要拿一个题做 10–20 秒的「造屏」试验段。这是口味问题，要用户定。
3. **第 2 条等第五版第一部片做完再整理。**
4. **第 5 条只在用到非代码素材时启用。**
5. 他的仓库都**不用安装**，看文档、借思路就够了。

---

## 来源

GitHub（全部 2026-10-14 读取）：
- 用户资料：https://api.github.com/users/guangjun5952
- 仓库列表：https://api.github.com/users/guangjun5952/repos?per_page=100
- 主页：https://github.com/guangjun5952
- tvc-ai-director：
  - https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/SKILL.md
  - https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/references/tvc-quality-bar.md
  - https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-editing-director/SKILL.md
  - https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-shot-prompter/references/video-prompt-method.md
  - https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/multi-model-router/SKILL.md
  - https://api.github.com/repos/guangjun5952/tvc-ai-director/git/trees/main?recursive=1
- minimax-h3-broll-generator：
  - https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/SKILL.md
  - https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/references/prompt-versions.md
  - https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/references/template-complexity-v3-balanced.md
  - https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/docs/templates.md
  - https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/VERSION
  - https://api.github.com/repos/guangjun5952/minimax-h3-broll-generator/git/trees/main?recursive=1
- motion-archive：
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/TEMPLATES.md
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/docs/asset-usage-contract.md
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/docs/replication-quality.md
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/RELEASE_NOTES.md
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/THIRD_PARTY_NOTICES.md
  - https://raw.githubusercontent.com/guangjun5952/motion-archive/main/prototype/usage/editing-workflow-1.0.0-usage-1.1.0.md
  - https://api.github.com/repos/guangjun5952/motion-archive/git/trees/main?recursive=1
- motionface 源码样本：
  - https://raw.githubusercontent.com/guangjun5952/motionface-discipline-focus/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/motionface-discipline-focus/main/package.json
  - https://raw.githubusercontent.com/guangjun5952/sandydesign-remotion-0b66f6e0/main/README.md
- led-screen-film：
  - https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/SKILL.md
  - https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/style.md
  - https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/engine.md
  - https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/VALIDATION.md
  - https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/requirements.txt
  - https://api.github.com/repos/guangjun5952/led-screen-film/git/trees/main?recursive=1
- asset-discovery：
  - https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/SKILL.md
  - https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/references/licensing.md
  - https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/LICENSE
  - https://api.github.com/repos/guangjun5952/asset-discovery/git/trees/main?recursive=1
- 其他：
  - https://raw.githubusercontent.com/guangjun5952/youtube-clipper/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/script-cut-ui/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/xuanji-decision/main/README.md
  - https://raw.githubusercontent.com/guangjun5952/xuanji-decision/main/LICENSE

其他网站：
- https://motionface.cc/ （只读到页面标题）
- B 站公开搜索接口（返回 412，未绕过）：https://api.bilibili.com/x/web-interface/search/type?search_type=bili_user&keyword=光郡

本地对照文件：
- `D:\desk\claudex\24\.claude\skills\firefly\SKILL.md`
- `D:\desk\claudex\24\.claude\skills\firefly\references\规则清单.md`（V5 字数、V11 字号）
- `D:\desk\claudex\24\video-engine\src\v4\kit\KIT.md`
- `D:\desk\claudex\24\video-engine\package.json`（Remotion ^4.0.530）

---

## 核实记录（10-14）

核查员 2026-10-14 逐条重新打开链接核对。网页搜索额度在核查时也已用完（被系统拒绝），所以「有没有抖音/B 站账号」仍查不了。✅ = 原文属实；⚠ = 大体对，但有细节不准，已改；❌ = 错了，已改。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| 名字「光郡」，简介「TVC Director」，2026-04-22 注册，33 个公开仓库，14 个关注者，网站/邮箱/推特都空 | ✅ | [用户资料接口](https://api.github.com/users/guangjun5952)（created_at 2026-04-22T08:45:48Z，public_repos 33，followers 14） |
| 置顶 5 个仓库（tvc-ai-director、minimax、motion-archive、led-screen-film、youtube-clipper）；没有个人主页 README | ✅ | [GitHub 主页](https://github.com/guangjun5952)；33 个仓库里没有同名的 guangjun5952 仓库 |
| 33 个仓库 = 8 个 Skill/工具 + 25 个 Remotion 复刻（eagle 12、editing 4、finqube 2、其他 6、sandydesign 1） | ✅ | [仓库列表接口](https://api.github.com/users/guangjun5952/repos?per_page=100)，逐个数过 |
| 25 个复刻大多建于 2026-09-24、几乎 0 星、没有许可证 | ✅ | 同上（pinterest-focus 建于 09-28；有 1 星的 5 个；license 全是 null） |
| 8 个工具仓库的星/复刻/语言/许可证/创建和最后推代码日期（总表） | ✅ | 同上；asset-discovery 确为 NOASSERTION |
| tvc-ai-director 62 星 2 复刻 MIT；只在 06-19 到 06-23 推过代码 | ✅ | 同上；[提交记录](https://api.github.com/repos/guangjun5952/tvc-ai-director/commits?per_page=100)（共 5 次提交，最后 06-23） |
| tvc-ai-director「1 个总入口加 10 个子 Skill」（总表）和「9 个子 Skill 外加 multi-model-router」（3.1 节）说法不一致 | ⚠ 已统一 | [README](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/README.md)：9 个 tvc-* 子 Skill + 1 个 multi-model-router |
| 先问横屏还是竖屏，不能只凭平台推断；brief 10 个必答问题；要跳过须列出默认值 | ✅ | [SKILL.md](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/SKILL.md)（原文 "Do not assume horizontal or vertical from platform alone"） |
| 8 个模板 177–423 字节；5 份参考；2 个 Python 脚本不用第三方包 | ✅ | [文件树](https://api.github.com/repos/guangjun5952/tvc-ai-director/git/trees/main?recursive=1)；[make_tvc_excel.py](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/scripts/make_tvc_excel.py) 只用标准库 |
| 视频提示词排序 | ⚠ 已补 | [video-prompt-method.md](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-shot-prompter/references/video-prompt-method.md)：原稿漏了「主体/产品运动」一项，共 10 项 |
| 质量标准「开场要有让人继续看下去的理由」「前 3 秒清晰易读」 | ⚠ 已注明 | [tvc-quality-bar.md](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-ai-director/references/tvc-quality-bar.md)：意思对，但原文是英文，引号里是译文，已标「意译」 |
| 剪辑 Skill 只说要想清前三秒达成什么，没给具体做法 | ✅ | [tvc-editing-director/SKILL.md](https://raw.githubusercontent.com/guangjun5952/tvc-ai-director/main/tvc-editing-director/SKILL.md) |
| minimax 43 星 3 复刻 MIT；VERSION 1.1.0；3 个测试文件 + CI；最后推代码 08-14 | ✅ | [VERSION](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/VERSION)；[文件树](https://api.github.com/repos/guangjun5952/minimax-h3-broll-generator/git/trees/main?recursive=1)（tests/ 下 3 个，.github/workflows/validate.yml）；[提交记录](https://api.github.com/repos/guangjun5952/minimax-h3-broll-generator/commits?per_page=100) |
| 付费关口「必须同时满足四条」 | ⚠ 已改 | [skill/SKILL.md](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/SKILL.md)：原文是 "Require all three conditions"；「缺素材不许批准」是另一条单独规则，放弃素材要改成比喻镜头并标 AI 生成 |
| 「继续」「看起来不错」、沉默不算批准；改字稿/换档位批准作废 | ✅ | 同上（原文还加了一条：只批准流程也不算） |
| 生成的镜头禁止音乐、旋律、人声，只要同步音效 | ⚠ 已补 | 同上：原文还允许「克制的环境音」，禁止项是音乐、旋律、唱歌、旁白、对白 |
| 文字三档：v1 ≤12 字 ≥1.8 秒；v2 ≤28 字 ≥1.2 秒；v3 ≤18 字 ≥1.5 秒、最多 2 层在动 | ✅ | [prompt-versions.md](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/references/prompt-versions.md) |
| v3 读字时：平移 <2% 画宽、缩放 <3%、旋转 <0.5°；字距 ±2%、行高 0.98–1.08；中文不许粒子拼字、持续旋转；没给字号比例/对比度/安全区数值 | ✅ | [v3 平衡档](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/skill/references/template-complexity-v3-balanced.md) |
| 背景显眼程度「< 主体的 15%」 | ⚠ 已改 | 同上：原文只写 "under 15% visual salience"，没说和主体比 |
| T03「数字、单位和来源必须由用户提供」；T21 一条只讲一个机制步骤；每张卡都有素材和限制 | ⚠ 已改 | [templates.md](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/docs/templates.md)：前两点对；「素材」「限制」只有部分卡有 |
| 作者承认 MiniMax-H3 排中文仍可能出错字，品牌名/引文/证据建议用确定性工具 | ✅ | [README](https://raw.githubusercontent.com/guangjun5952/minimax-h3-broll-generator/main/README.md)（原文「仍然可能出现错字」） |
| motion-archive v1.0.0、3 星；23 模板、5 风格、10 背景、2 字体；17/17 测试；40 项协议校验；Node 20+ | ✅ | [README](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/README.md)；[RELEASE_NOTES](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/RELEASE_NOTES.md)。23+5+10+2 正好 40 |
| motion-archive「首次安装要下载约 2 GB」 | ❌ 已改 | [README](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/README.md)：原文是「约 2 GB 临时可用空间（下载包约 768 MB）」 |
| 字体「没有统一的商用授权证明」 | ⚠ 引文已改 | [THIRD_PARTY_NOTICES](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/THIRD_PARTY_NOTICES.md)：原文是「未提供统一商用授权证明」 |
| 「9 个模板、5 套风格、2 个字体已补齐协议」出自另一份文档 | ✅（出处已补） | [asset-usage-contract.md](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/docs/asset-usage-contract.md)「当前交付」一节；和 40 项为何不一致仍（未核实） |
| 调用协议 asset-usage-1 的必填项和四类参数 | ✅ | 同上（四类原名 runtime-prop / source-edit / selection / consumer） |
| 协议「禁止没渲染就说渲染过」 | ⚠ 已改 | 同上：原文是计划阶段「不会假装已经渲染」，不是一条总的禁止规则；禁止项是散落各处的，已改写 |
| 八步流程模板只适合恰好八步、改名要动源码 LABELS、只有 16:9 和 9:16 | ✅ | [协议样例](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/prototype/usage/editing-workflow-1.0.0-usage-1.1.0.md) |
| 复刻质量规则（不只渐显匀速、不拿全屏高斯模糊冒充、视差至少两层、看连续帧）和「PPT 感」失败记录 | ✅ | [replication-quality.md](https://raw.githubusercontent.com/guangjun5952/motion-archive/main/docs/replication-quality.md)（失败记录日期 2026-09-22） |
| motionface 复刻用 Remotion 4.0.354、React 19.1.0；我们 ^4.0.530、React ^19.3.0 | ✅ | [package.json](https://raw.githubusercontent.com/guangjun5952/motionface-discipline-focus/main/package.json)；本地 `video-engine/package.json` |
| sandydesign README「不是该工作室的官方源码」 | ⚠ 已注明 | [README](https://raw.githubusercontent.com/guangjun5952/sandydesign-remotion-0b66f6e0/main/README.md)：意思对，原文是英文，已改成意译 |
| motionface.cc 标题「Motion Face · 动效灵感与复刻」，看不出是谁开的 | ✅ | [motionface.cc](https://motionface.cc/)：页面没有作者、公司、备案或社交链接 |
| led-screen-film 10-12 新建、2 星、MIT；640×360 灯珠画布；0.75 帧快门内平均 3–18 个子帧；「display emulation」 | ✅ | [仓库列表接口](https://api.github.com/users/guangjun5952/repos?per_page=100)；[SKILL.md](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/SKILL.md) |
| 硬规则「前 5 秒必须留人」、只配音效不配音乐、白字 #e8ecf0、大字垫黑底、花字上 2/3、下 1/5 留字幕 | ✅ | 同上 |
| 钩子手段「数字计时器、穿梭、频闪蒙太奇」 | ✅（出处已补） | 不在 SKILL.md，在 [style.md](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/style.md) |
| 参数表一节叫「用户意见定稿，不要改回」 | ❌ 引文已改 | [style.md](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/style.md)：原标题是「已经调好的参数（来自用户意见，别改回去）」；数值 bloom 0.32/0.38、GAIN_SCALE 0.84 对 |
| 自带 35 种合成音效 | ✅ | [engine.md](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/references/engine.md)（README 和 SKILL.md 没写数字） |
| 依赖 numpy、opencv、skia-python、pedalboard、ffmpeg；完整渲染依赖 fork，原生 Windows 不支持 | ✅ | [requirements.txt](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/requirements.txt)；[README](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/README.md) |
| 只在 macOS 验证过低分辨率示例（6 秒 MP4、3.5 秒透明 MOV），没测全部音效和 Linux/Windows | ✅ | [VALIDATION.md](https://raw.githubusercontent.com/guangjun5952/led-screen-film/main/VALIDATION.md)（640×360 / 30 fps，Apple Silicon） |
| asset-discovery MVP 0.2.0、42 项测试、在线接口只做模拟测试；三档授权；4 种状态标签；CREDITS.md 和 provenance.json；空白审片模板不能导入 | ✅ | [README](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/README.md)；[licensing.md](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/references/licensing.md)（核实日期 2026-10-09）；[SKILL.md](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/SKILL.md) |
| asset-discovery「不绕过登录和验证码」 | ⚠ 已改 | 同上：原文是「不绕过认证」，没提验证码 |
| asset-discovery 的 LICENSE 是 MIT 加一句附加说明 | ✅ | [LICENSE](https://raw.githubusercontent.com/guangjun5952/asset-discovery/main/LICENSE)；GitHub 显示 NOASSERTION 的原因仍是推测（未核实） |
| youtube-clipper v1.1.1 只支持 macOS；script-cut-ui 基于 DesignCombo、模型接口没实现、没许可证；xuanji 用《滴天髓》等四本书、MIT | ✅ | [youtube-clipper](https://raw.githubusercontent.com/guangjun5952/youtube-clipper/main/README.md)；[script-cut-ui](https://raw.githubusercontent.com/guangjun5952/script-cut-ui/main/README.md)；[xuanji README](https://raw.githubusercontent.com/guangjun5952/xuanji-decision/main/README.md)；[xuanji LICENSE](https://raw.githubusercontent.com/guangjun5952/xuanji-decision/main/LICENSE) |
| 光郡的抖音/B 站/小红书账号 | 未核实 | B 站接口核查时仍返回 412（没绕过）；网页搜索额度用完；GitHub 和各 README 都没有社交链接 |
| 我们规则清单还没管画面字的稳住时间 | ✅（已补一句） | 本地 `规则清单.md`：V5 管字数，S8 管字幕时长，没有画面字停留时长的规则 |
