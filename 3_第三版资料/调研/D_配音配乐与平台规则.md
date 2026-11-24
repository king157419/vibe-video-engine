# D. 配音、配乐与平台规则（第三版调研）

- 调研日期：2026-10-06。对象是 #vibe知识大赏 这一波“让 Opus 5.5 写代码出画面”的知识短片（2026-09-22 Opus 5.5 发布后集中出现）。
- 不重复的内容：参考片的画面拆解见 `2_第二版资料/资料/参考片拆解_电子智人.md`；开源/本地 TTS 的许可、显存、克隆细节见 `2_第二版资料/调研/开源视频方案.md` §5。本文只补**声音**和**平台规则**。
- 证据等级：**【实证】** 一手来源（作者本人的简介/帖子、官方文档、官方公告、仓库原文）；**【转述】** 二手文章或第三方整理；**【推断】** 我根据前两者推出来的；**【传闻】** 只在社区流传、找不到出处。每条都附链接。
- 本次只用网页检索，没有登录任何网站、没有下载视频、没有在本机做语音转写。

---

## 0. 先看结论

1. **这一波视频的旁白，主流是国产云端 TTS + 新出的 Gemini TTS，配乐主流是“让 Claude 用代码合成”。** 作者自述里点名的有：MiniMax speech-2.8-hd（路北路陈，8.6 万播放）、豆包 SeedAudio（风之谷AI）、gemini-3.8-flash-tts（黎曼猜想那条）、“本人语音克隆”（王树义）。电子智人只写了画面、配乐、双语字幕都由 Claude 用代码生成，**没说旁白用什么**。【实证，见 §1】
2. **对齐画面最关键的是“逐字时间戳”。** 豆包 2.0、MiniMax、阿里 CosyVoice、ElevenLabs 都能在接口里直接返回字/词级时间戳；Gemini TTS、本地克隆模型和真人录音拿不到，要再跑一遍“强制对齐”（推荐 Qwen3-ForcedAligner-0.6B，开源）。【实证，见 §3】
3. **价格都很便宜，一期 10 分钟（约 3000 字）的旁白在 0.2–2.5 元之间**：CosyVoice 0.24–0.45 元，MiniMax（经阿里百炼）0.6–1.05 元，豆包 1.5 元、复刻音色 2.4 元。贵的不是钱，是“听感像不像真人在讲”。【实证价格 + 推断换算，见 §2】
4. **中文口碑：MiniMax 和本地 IndexTTS2 最好，ElevenLabs 中文有“洋腔”，剪映的网红音色在知识类视频里正在被观众嫌弃。** 这些是口碑汇总，不是跑分。【转述，见 §2.3】
5. **配乐最安全的是代码合成**（Claude 现写现生成，版权是你自己的，没有平台误判风险）；Suno 从 2026-09-03 起“商用权跟着下载走”，Pro 每月只能下载 20 首；Udio 已经不能下载；剪映/抖音曲库里的“商用音乐”**只许发在剪映和抖音**，搬到 B 站要另外授权。【实证/转述，见 §4】
6. **AI 标识现在是“发布必经环节”。** 中央网信办 2026-05-12 要求平台在发布页提供 6 类“必选标签”（其中一类是“含有AI生成内容”），不选就发不出去；B 站 2026-05-15 起把 AI 标识提到投稿一级页面，漏标会被补标、打回、下架。这类视频画面是 AI 写的代码生成的，如果再用 TTS 配音，**应当勾选“含有AI生成内容”**。【实证，见 §5】
7. **“标了 AI 就限流”没有任何官方条文支持。** 抖音的明文规则是：你不标、平台检测到，会挂上一个更难看的“疑似使用了AI生成技术”提示、并提醒观众谨慎甄别。真正掉量的路径是观众听出机器声后划走（完播）和“AI 配音=搬运号”的先入为主。【实证 + 转述，见 §5.4】
8. **规格建议：横屏 16:9 为主版本**（这波代表作全是横屏，抖音负责人也说过知识/教学类“往往以横屏为主”），B 站上把字幕放在画面底部 15% 以内（B 站播放器把这一带留给字幕、不让弹幕挡）。时长：B 站上标题带“vibe知识大赏”的 50 条，中位数 2 分 41 秒；播放过万的 13 条，中位数 4 分 23 秒。【实证 + 本地统计，见 §6】
9. **开头几秒的完播数字，抖音没有公开过官方数据。** 网上流传的“72% 的人 3 秒内决定划走”之类数字查不到出处，不采信。【传闻，见 §6.5】

---

## 1. 这批 Opus 视频的声音是怎么做的（按作者自述）

| 作品 | 作者 | 旁白 | 配乐 / 音效 | 证据 |
|---|---|---|---|---|
| 【opus5.5短片】控制论 舵手之学（5:01） | 电子智人 | **未说明** | 简介写明画面、配乐、双语字幕都由 Claude 用代码生成 | 【实证】[B站简介](https://www.bilibili.com/video/BV1i9hd6aE5x) |
| 【opus5.5短片】信息论 惊奇之学（5:01） | 电子智人 | **未说明**（拆解记录显示片中有人声旁白，来源不明） | 未说明 | 【实证】页面标“含AI生成内容”：[B站](https://www.bilibili.com/video/BV1GXav6iEWh)；抖音版话题为 #抖音前沿科技首发计划 #ai新星计划 #claude #vibe知识大赏：[抖音](https://www.douyin.com/video/7690337875291950345) |
| 设计科普：瑞士风格（4:13，B站 8.6 万播放） | 路北路陈 | **MiniMax Audio speech-2.8-hd**，在 MiniMax 网页上逐段合成；旁白逐行对齐由 Codex 完成 | 配乐与音效“程序合成” | 【实证】[B站简介](https://www.bilibili.com/video/BV1hWar6SEVP) |
| 星舰科普（1:03） | 风之谷AI | **豆包 SeedAudio API**（提示词里点名让模型调它） | 音乐、音效都要求“纯代码实现” | 【实证】[B站简介](https://www.bilibili.com/video/BV1VxhD6jE5V) |
| 黎曼猜想科普（12:41） | CaldariNavyFleet | **gemini-3.8-flash-tts** | 未说明 | 【实证】[B站简介](https://www.bilibili.com/video/BV11SaB6NELd) |
| 黑水河之战 3D 讲解 | 王树义老师 | **本人语音克隆**（标题自述，工具未写） | 未说明 | 【实证】[B站标题](https://www.bilibili.com/video/BV1TGag6oEn9) |
| 大气环流讲解（近 5 分钟） | WY | TTS，“豆包、智谱、海螺、千问都可以”；把厂商文档存成 TTS.md、Key 存在 .env | 让模型“添加合适的音乐” | 【实证】[X 帖](https://x.com/akokoi1/status/2102606609574941028) |
| 宝玉的教学视频 | 宝玉 | Gemini 3.8 Flash TTS | 文中归纳声音三种来源：音效库、AI 音乐/音效模型（例：Suno）、代码合成 | 【实证】[宝玉长文](https://x.com/dotey/article/2105181393638531536) |
| 少数派教程示例 | Dots to Line | Gemini 3.8 Flash TTS（经 kie.ai 中转，音色 Kore） | Suno V6 纯音乐，压低音量 | 【实证】[少数派](https://sspai.com/post/115283) |

补充观察：
- 一个收录 54 个 Opus 5.5 案例的中文汇总仓库总结说：配乐一般用 Web Audio 或 Python 合成，旁白接 TTS；案例里还有用开源 Kokoro 配旁白、用 JS 生成 BGM 和音效的。【转述】[joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts)
- Linux.do 有网友说做这类视频“0 难度，把稿子给它就行”，但自己做了四五条“一点播放量都没有”。说明门槛低、同题拥挤，声音和选题的辨识度才是差异。【实证（论坛原帖，个例）】[linux.do](https://linux.do/t/topic/2982883)
- **推断**：这一波里“真人录音”几乎没人在简介里提，“克隆自己的声音”是少数派。原因很直接：工作流是“一句话让 Claude 调 API 出片”，真人录音会打断这个流程。这也意味着，用真声是一个现成的差异点。

---

## 2. 配音方案对比

### 2.1 先解释三个词

- **API Key**：云服务给你的一串密码，程序（也就是 Claude）拿它去调用配音服务、按字数扣钱。要在厂商控制台注册、实名、充值后生成。**不要把 Key 直接贴给 Claude 看**：WY 的做法是把 Key 放在项目里的 `.env` 文件，再在 `.claude/settings.json` 里加一条禁止读取 `.env` 的规则，这样程序能用、Claude 看不到。【实证】[WY 的 X 帖](https://x.com/akokoi1/status/2102606609574941028)
- **逐字时间戳**：配音服务除了给你音频，还告诉你“每个字在第几毫秒开始、第几毫秒结束”。画面要“说到‘七’的那一刻计数器跳到 7”，就靠它。
- **强制对齐**：手里只有音频和文稿、没有时间戳时，用一个小模型把文稿“贴”到音频上，反推出每个字的时间。

### 2.2 总表

价格换算按“一期 10 分钟 ≈ 3000 字”。

| 方案 | 中文听感口碑 | 价格（官方） | 要什么 | 逐字时间戳 | 备注 |
|---|---|---|---|---|---|
| **豆包语音合成 2.0**（火山引擎 Seed-TTS 2.0） | 自然，情感可用指令控制；hi-nikola 手绘讲解 skill 默认用火山音色（第二版已记） | 后付费 **5 元/万字符**，资源包最低 1.6 元/万字符；**声音复刻 8 元/万字符**；新用户有试用额度（文档写 2 万字符/半年）→ 一期约 **1.5 元**（复刻 2.4 元） | 火山引擎账号 + API Key | **有**：V3 接口设 `enable_subtitle: true` 返回字/词级时间戳（2.0 和复刻 2.0 生效，中英文；开 LaTeX 播报或 SSML 时不返回） | 【实证】[计费说明](https://www.volcengine.com/docs/DoubaoVoice/Billinginstructions-21)、[方舟价目](https://www.volcengine.com/product/doubao)、[计费概述](https://www.volcengine.com/docs/DoubaoVoice/BillingOverview-15)、[V3 接口文档](https://www.volcengine.com/docs/6561/1598757) |
| **豆包音频生成 1.0**（SeedAudio，2026-06-23 发布） | 一条提示词同时出对白、BGM、环境音、拟音；单次最长 2 分钟 | API 在火山方舟邀测；第三方网关报价约 $0.003/秒（非官方） | 方舟账号（邀测） | 官方材料里**没看到** | 【实证】[新浪/快科技](https://finance.sina.com.cn/tech/roll/2026-06-23/doc-iniekvat8758577.shtml)；【转述】[EvoLink 报价](https://evolink.ai/zh/seed-audio-1-0)。**推断**：它会把音乐和人声混在一起出，后期不好单独压低音乐，做讲解片不如“TTS + 单独配乐”好控 |
| **MiniMax speech-2.8-hd / turbo** | 小红书评论区里，嫌剪映僵硬的提问下高赞回复多是推荐 MiniMax；做漫剧的用户说“听不出是 AI” | 国际站 $100 / $60 每百万字符（转述）；**阿里百炼代售 3.5 / 2 元每万字符，复刻一个音色 9.9 元** → 一期约 **0.6–1.05 元** | MiniMax 开放平台账号 + Key（或用百炼的 Key） | **有**：`subtitle_enable` + `subtitle_type` 可选句级 `sentence`、词级 `word`、流式词级 `word_streaming` | 【实证】[百炼价格页](https://help.aliyun.com/zh/model-studio/model-pricing)、[MiniMax T2A 文档](https://platform.minimax.io/docs/api-reference/speech-t2a-http)；【转述】[口碑横评](https://github.com/duevan07/chinese-ai-tts-real-review)、[国际价](https://invideo.io/blog/minimax-ai-voice-models) |
| **阿里百炼 CosyVoice v3.5 / v3** | 自然度高，但长内容情感被实战派挑刺（口碑分歧） | v3.5-plus **1.5 元**、v3.5-flash **0.8 元**、v3-plus 2 元、v3-flash 1 元（每万字符），每个模型新开通送 1 万字符 → 一期约 **0.24–0.45 元** | 阿里云账号 + 百炼 Key | **有**：`word_timestamp_enabled`，**只在流式模式**、只对标注支持的音色 | 【实证】[价格](https://help.aliyun.com/zh/model-studio/model-pricing)、[HTTP 接口](https://help.aliyun.com/zh/model-studio/cosyvoice-tts-http-api)。另有 `enable_aigc_tag` 参数可在音频里写入 AIGC 隐式标识【实证】[客户端事件文档](https://www.alibabacloud.com/help/zh/model-studio/cosyvoice-client-events) |
| **Gemini 3.8 Flash TTS**（2026-09-23 发布） | 官方称在 Hume AI 质量指数上排第一；2000+ 音色、30 秒复刻、130 种语言；第三方测评提到高频有细微杂音、超长文本后段音色漂移 | 至 2026 年底：文本输入 $0.50 / 百万 token，音频输出 $9 / 百万 token → 一期约 $0.14（**推断**，按每秒约 25 个音频 token 估） | Google AI Studio / Gemini API Key；国内要海外网络或中转（如少数派用的 kie.ai） | **官方材料里没看到**，需要强制对齐 | 【实证】[Google 官方博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech)、[开发者指南](https://aistudio.google.com/learn/gemini-3-8-flash-tts-developer-guide)；【转述】[36氪 价格与测评](https://eu.36kr.com/zh/p/3996713949351811)。克隆声音要录同意声明、生成内容带 SynthID 水印【转述】[ThursdAI 播客文字稿](https://www.youtube.com/watch?v=zV7aKLvCNoI) |
| **ElevenLabs** | 英文顶级；中文“带英文口音、长文本漂移”的吐槽集中 | 免费版不可商用；Starter $6/月起含商用授权；Creator $22/月 12.1 万 credits；API 多语种模型 $0.10/千字符 → 一期约 $0.3 | 海外信用卡 + Key | **有**：官方接口“Create speech with timing”返回**字符级**时间 | 【实证】[时间戳接口文档](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)；【转述】[价格汇总（2026-10-02 核对）](https://www.cartesia.ai/learn/elevenlabs-pricing)、[中文口碑](https://github.com/duevan07/chinese-ai-tts-real-review)、[MiniMax 与 ElevenLabs 中文对比](https://www.youtube.com/watch?v=M1LpD1Jvt28) |
| **Fish Audio**（云端 API） | 情感爆发力强；官方盲测里中文得分领先（厂商自测） | **$15 / 百万 UTF-8 字节**；一个汉字占 3 字节，相当于每百万汉字约 $45 → 一期约 $0.14；免费额度不可商用 | 海外支付 + Key | 本次没查到官方逐字时间戳 | 【转述】[价格整理](https://saascrmreview.com/fish-audio-review)。开源权重的许可问题见第二版 §5.1 |
| **本地开源**：IndexTTS2/2.5、Qwen3-TTS、CosyVoice3、GPT-SoVITS | IndexTTS2 是口碑横评的第一名（情绪还原最好，短板是语速偏快、停顿难控）；GPT-SoVITS 会调参是神器，不会调参容易吞字 | 0 元（电费 + 显卡） | 不要 Key；要本机部署 | **没有**，需要强制对齐 | 【转述】[口碑横评](https://github.com/duevan07/chinese-ai-tts-real-review)；许可与显存见第二版 §5.1 |
| **剪映“文本朗读”** | 免费、零门槛；但“解说小帅”一类音色用烂了，有观众一听就划走 | 免费 / 会员 | 只是剪辑软件里的功能，**没有给 Claude 调的官方接口** | 剪映能自动出字幕，但拿不到给代码用的时间戳文件（**推断**） | **注意授权**：剪映“商用声音”（含商用音色）除另有说明外**只许发在剪映、抖音**，发到其他平台要自己取得授权【实证】[剪映商用音乐说明](https://lf9-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/faceu/abb0af21-9c1c-47ec-b5c8-1f522cdc31f5.html) |
| **真人录音** | 最不出戏；口误、气口要剪 | 0 元 | 一支话筒 | **没有**，需要强制对齐 | 见 §3 |

### 2.3 哪些音色在中文科普里“受欢迎”

- **剪映系音色用量最大**（“解说小帅”“知性女声”“解说男声”等），营销号自称做过抽样统计，但方法不可查，只能当参考。【转述，可信度低】[FlowPix 排行](https://www.flowpixai.com/ai-news/most-popular-ai-voiceover.html)
- **反向信号**：中文口碑横评里专门列了一条避坑——剪映的网红音色别用在知识类长视频上，小红书上已经出现“一听到就点踩、拉黑”的反应，有人反映 AI 配音的知识视频第一条就没流量。【转述】[口碑横评](https://github.com/duevan07/chinese-ai-tts-real-review)
- **一位 YouTube 创作者的分析**（讲的是 YouTube，不是国内平台）：平台政策打击的是内容模式，声音来源不在任何一条政策里；AI 配音掉量的路径有两条，一是韵律问题让观众中途离开、拉低完播，二是观众把“平台预置音色”和搬运号联系起来，**前几秒就归类、不再评估内容**。所以关键不在“像不像真人”，而在“音色辨识度”。【转述】[YouTube 视频文字稿](https://www.youtube.com/watch?v=q82Nv3eaer0)
- **这一波 Opus 片子的选择**：路北路陈用 MiniMax 的 hd 档；少数派教程用 Gemini 的 Kore 音色并用一句话描述语气（“活泼的科技博主口播”）。【实证】见 §1
- **推断（给你的建议）**：不要用任何一个“大家都听过”的预置音色；要么用真声（第二版的既定规则），要么克隆你自己的声音，要么在 MiniMax/豆包里挑一个冷门、偏低沉平稳的音色并整季固定。

---

## 3. 逐字时间戳：怎么拿到，坑在哪

| 来源 | 怎么拿 | 坑 |
|---|---|---|
| 豆包 2.0 | V3 接口 `req_params.audio_params.enable_subtitle = true`，返回事件 `TTSSubtitle` 里带字/词级时间 | 开了 LaTeX 播报或用 SSML 就不返回；只支持中英文。旧版大模型接口的时间戳对应的是**规范化之后的文本**（比如“2025”会变成“二零二五”），按原文找字会对不上。【实证】[V3 文档](https://www.volcengine.com/docs/6561/1598757)、[V1 文档](https://www.volcengine.com/docs/DoubaoVoice/HTTPone-timecompositenon-streaminginterface-V1notrecommended) |
| MiniMax | `subtitle_enable: true`，`subtitle_type: "word"`；非流式时以字幕文件返回 | 默认是句级，要显式改成 word。【实证】[文档](https://platform.minimax.io/docs/api-reference/speech-t2a-http) |
| CosyVoice（百炼） | `word_timestamp_enabled: true`（Python SDK 里通过 `additional_params` 传） | 只在流式模式可用；不是所有音色都支持，复刻音色只有 v2/v3/v3.5 系列支持。【实证】[Python SDK 文档](https://help.aliyun.com/zh/model-studio/cosyvoice-python-sdk) |
| ElevenLabs | 调用 with-timestamps 接口，返回每个字符的起止秒数 | 中文听感是短板。【实证】[文档](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps) |
| Gemini TTS、本地模型、真人录音 | 用 **Qwen3-ForcedAligner-0.6B** 把文稿对到音频上，给出字级起止时间；支持中文、粤语等 11 种语言，官方评测表里中文一项的时间偏差指标为 33.1（越小越好），对照方法 NFA 为 109.8 | 要本机跑 Python（显卡）；或者用火山的“自动字幕打轴”服务（有 20 小时试用额度）。【实证】[Qwen3-ASR 仓库](https://github.com/QwenLM/Qwen3-ASR)、[火山计费概述](https://www.volcengine.com/docs/DoubaoVoice/BillingOverview-15) |

**推断**：如果发布坚持用真声，时间戳这一步无论如何要走“强制对齐”；那 TTS 是否自带时间戳就不是选型的决定因素，**听感**才是。

---

## 4. 配乐与音效

### 4.1 三条路的对比

| 路线 | 怎么做 | 版权 / 平台风险 | 质感 | 适合 |
|---|---|---|---|---|
| **代码合成**（这一波的主流） | 让 Claude 写 Web Audio 或 Python 程序生成音乐，离线渲染成 WAV。浏览器端用 `OfflineAudioContext` 可以“不播放、直接算出音频”，结果每次一样【实证】[MDN](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext)；Tone.js 写起来更像编曲软件，但离线渲染比原生 Web Audio 慢很多，几分钟以上的曲子要注意【实证】[Tone.js issue #436](https://github.com/Tonejs/Tone.js/issues/436) | **最低**：旋律是现写的，没有素材来源问题（**推断**）；不会被曲库的版权系统误认领 | 好的能做到“克制的钢琴 + 铺底”，差的会有“电子琴味”（**推断**） | 讲解片的低存在感铺底，和画面节拍同步 |
| **AI 音乐**（Suno / ElevenLabs Music / MiniMax Music / SeedAudio） | 写风格提示词生成纯音乐 | **Suno**：2026-09-03 起新条款，免费版不可商用；Pro（$10/月）每月 20 次“许可下载”、Premier（$30/月）60 次，**商用权跟着许可下载走**，录屏、扒流等方式拿到的不算；付费用户也“一般不被视为版权所有人”【转述】[Undetectr 条款解读](https://undetectr.com/blog/suno-commercial-use)、[Aitoolsbee](https://aitoolsbee.com/news/suno-copyright-policy-revised-under-warner-music-deal)。**Udio**：2025-10-29 与环球和解后关闭下载，新平台是“围墙花园”，不能导出【实证】[UMG 公告](https://www.universalmusic.com/universal-music-group-and-udio-announce-udios-first-strategic-agreements-for-new-licensed-ai-music-creation-platform)、[MBW](https://www.musicbusinessworldwide.com/universal-and-suno-are-in-a-pr-battle-over-walled-gardens-in-ai-music)。MiniMax 音乐接口有 `aigc_watermark` 参数（是否在音频末尾加水印，默认关）【实证】[腾讯云 TokenHub 文档](https://cloud.tencent.com/document/product/1823/135323) | 质感最像“真音乐”，但同质化：大家都用 Suno，听起来容易撞 | 片头片尾、情绪段落 |
| **免版权曲库** | YouTube 音频库、Pixabay、Mixkit、Uppbeat、Free Music Archive、Incompetech 等 | YouTube 音频库的授权主要针对 YouTube，搬到别的平台要逐首看；Pixabay 有作者把免费曲目登记进版权识别系统，导致合法使用也被认领、要自己申诉；CC-BY 的曲子必须署名【转述】[hellothematic](https://hellothematic.com/best-free-music-websites)、[Foxi](https://www.foximusic.com/blog/need-background-music-that-wont-trigger-content-id) | 稳定、耳熟 | 赶工时的兜底 |
| **剪映 / 抖音曲库** | 剪辑时直接选 | 剪映的“商用音乐/商用音色”默认**只授权剪映和抖音**；同一条视频发 B 站要自己另取授权【实证】[剪映商用音乐说明](https://lf9-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/faceu/abb0af21-9c1c-47ec-b5c8-1f522cdc31f5.html)；TikTok 商用音乐库条款同样限制跨平台【实证】[TikTok 商用音乐库](https://ads.tiktok.com/resources/help/article/commercial-music-library?lang=zh) | 热门、耳熟 | 只发抖音时 |

**给本项目的选择（推断）**：主配乐走代码合成——它和画面同在一套代码里，能按段落起伏、能卡节拍，又没有任何授权链条；要“像真音乐”的片头可以用 Suno Pro 生成一次、立即通过官方下载并把下载记录留档。不用剪映曲库（你要同时发 B 站）。

### 4.2 音效：针对你讨厌的“手写沙沙声”

- 宝玉总结的常见做法：元素出现时配一个短音、转场配一个短音，背景音乐垫在下面，有人说话时把音乐压低。【实证】[宝玉长文](https://x.com/dotey/article/2105181393638531536)
- **持续型音效（书写沙沙声、环境底噪）和人声抢同一频段**，听久了就是噪音；这是你反感它的原因（**推断**）。建议写进给 Claude 的规矩里（**推断 / 经验值**）：
  1. 默认**不加任何持续性音效**，包括书写声、纸张声、环境底噪。
  2. 音效只允许是“事件型”：一个元素出现、一个数字跳变时的单次短音，单个不超过约 0.3 秒，平均十几秒最多一个。
  3. 有人声的段落，音乐比人声低约 20 dB（AI 配音教程里的常见建议）【转述】[AnySpeech](https://anyspeech.io/zh/blog/how-to-make-ai-voice-sound-less-robotic)；音效比人声低 15 dB 以上。
  4. 成片整体响度用 ffmpeg 的 `loudnorm` 归一到约 -14 至 -16 LUFS、峰值不超过 -1 dBTP（经验值，平台没公开目标值）。B 站播放器自带“音量均衡”开关，会再处理一遍。【实证（播放器设置项）】[B站页面](https://www.bilibili.com/video/BV1i9hd6aE5x)

---

## 5. 平台规则：AI 标识、限流、扶持

### 5.1 法规底座（2025-09-01 起施行）

- 《人工智能生成合成内容标识办法》：
  - 第十条：**用户**在平台发布 AI 生成合成内容，应当主动声明，并用平台提供的标识功能标识；任何人不得恶意删除、篡改、隐匿标识。【实证】[网信办原文](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
  - 第六条：**平台**按三档处理——元数据里有 AI 标识的，标“属于”；没元数据但用户声明了的，标“可能”；都没有但检测出痕迹的，标“疑似”。【实证】同上
  - 第四条：合成人声要在音频里或界面上加提示；视频要在**起始画面**和播放周边加显著提示。这一条约束的是**提供 AI 服务的公司**（TTS 厂商、视频生成工具），不是上传者。【实证】同上
  - 第九条：用户可以向服务方申请“不带显式标识”的成品，但服务方要在协议里写清用户的标识义务。也就是说：**TTS 接口里“关水印”只是把加标识的责任挪到你身上，发布时仍然要声明**。【实证】同上；解读【转述】[SinCoSphere](https://sincosphere.cn/learn/aigc-labeling-china)
- 配套强制性国标 GB 45438-2025：视频显式标识放在起始画面的边或角，文字高度不低于画面最短边的 5%，正常播放持续不少于 2 秒；音频标识可以是语音提示或“短长 短短”（AI 的摩斯码）节奏。【转述，国标原文需在线预览】[国标信息页](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=F32EA2A561F1886CD8D606513512D547)、[知乎 SOP 整理](https://zhuanlan.zhihu.com/p/2070105582497948121)

**这类视频要不要标？（推断）** 办法把用 AI 技术生成、合成的文字、图片、音频、视频等都算作“生成合成内容”（第三条）。画面是 AI 写的程序算出来的，严格说属于；旁白如果是 TTS 或克隆声，**肯定属于**。电子智人在 B 站已经挂着“含AI生成内容”。从严处理，勾选声明的成本几乎为零。

### 5.2 2026 年的新变化

- **2026-03-21**：中央网信办指导抖音、快手、腾讯、小红书、B 站、微博规范短视频标注，把标注入口提到发布页一级页面，近一个月补标 60 余万条。【实证】[中国网信网](https://www.cac.gov.cn/2026-03/21/c_1775746586601999.htm)
- **2026-05-12**：在 12 家平台试行后全面推开：平台必须提供 6 类“必选标签”——含有虚构演绎内容、**含有AI生成内容**、含有营销信息、内容为转载、内容为个人观点、无需标注；**发布者必须选一项才能发布**；存量视频分批回溯补标。【实证】[新华网](https://www.news.cn/20260512/e47fa9f300684eddbff2c8568eee922c/c.html)、[人民日报（中国网转载）](http://zw.china.com.cn/2026-05/13/content_118491066.shtml)
- **2026-04-28**：剪映、猫箱 App 和即梦 AI 网站因“未有效落实标识规定”被约谈、责令改正、警告——说明工具方也在被查。【转述】[海螺社整理（引中国网信网）](https://www.hailuoshe.com/blog/ai-generated-video-labeling)
- **存疑的说法**：中国网 2026-06-23 一篇**评论员文章**称新规要求视频开头 3 秒内醒目标注、标识尺寸不小于画面宽度的 5%、不合规的不予分发。这和国标“最短边 5%、不少于 2 秒”的表述不一致，也没找到对应的官方文件，**不采信**。【转述】[中国网评论](http://www.china.com.cn/opinion2020/2026-06/23/content_118559677.shtml)
- 不要混淆：抖音 2026 年 5 月发布的 **AI 短剧**审片标准里有一条：AI 内容占比过半的，要在片头前 3 秒、封面、简介三处都标注，但那只针对 AI 短剧，不是知识视频。【转述】[TVOAO](https://www.tvoao.com/a/224167.aspx)

### 5.3 抖音

- **怎么声明**：2025-09-01 公告的路径是 发布页 → 高级设置 → 发文助手自主声明 → “内容由AI生成”。【实证】[证券时报](https://stcn.com/article/detail/3315850.html)、[新华网](http://www.news.cn/tech/20250909/fb164c6d092146aa8e13ddc283fe416a/c.html)。2026-05 之后改成发布页上的必选标签，具体按钮文案以 App 当前版本为准（**推断**）。
- **不声明会怎样**：平台检测到疑似 AI 内容，会加“疑似使用了AI生成技术”并提示谨慎甄别；读到元数据里的 AI 标识，会加“作品含AI生成内容”。【实证】同上
- **处罚针对的是违规内容**：2026 年以来抖音清理违规 AI 生成内容 4.2 万条、分级处罚 1.4 万个账号（媒体报道的官方披露数）；网信办 2026-02 通报的典型案例是不标识的虚构感人故事、AI 换脸/克隆声音冒充名人、伪造灾情等。【转述】[澎湃](https://www.thepaper.cn/newsDetail_forward_32950844)、[百度百科“AI内容标识”](https://baike.baidu.com/item/AI%E5%86%85%E5%AE%B9%E6%A0%87%E8%AF%86/66720850)
- **识别会误伤**：有人反映自己实拍的视频被后台判成“疑似 AI 生成”。【转述】[什么值得买整理](https://post.smzdm.com/p/aqrmpkw2)

### 5.4 “标了 AI 会不会限流”——把能证实的和传闻分开

| 说法 | 结论 | 依据 |
|---|---|---|
| 标识办法规定“不标即限流” | **不对**，办法里没有限流这种处罚 | 【实证】[原文](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm) |
| 抖音：标了就降推荐 | **无官方依据**；官方只说不标会被加“疑似”标签 | 【实证】[抖音公告报道](https://stcn.com/article/detail/3315850.html) |
| 小红书：未主动标识的 AI 内容限制分发 | **对**，这是小红书 2026-02-12 公告原意（注意是“不标才限”） | 【实证】[南都转载公告全文](https://m.mp.oeeee.com/a/BAAFRD0000202602121524724.html) |
| 知乎：外显标识不影响展示与流量 | 知乎公告原话（经转述） | 【转述】[什么值得买整理](https://post.smzdm.com/p/aqrmpkw2) |
| B 站：漏标会被处置 | **对**：补标、打回补标、下架的阶梯处置；AI 虚假配音从严 | 【实证】[B站 2026-05-15 公告](https://www.bilibili.com/opus/1202507670848798745) |
| “人声比 AI 配音留存高 35%” | 出处不明 | 【传闻】见于[花叔调研](https://www.huasheng.ai/insights/bilibili-video-best-practices)，未注明原始数据 |
| “标了掉量”“不标被限”两种社区说法 | 都没有证据 | 【传闻】[什么值得买整理](https://post.smzdm.com/p/d67cd5-07) |

### 5.5 B 站

- 2025-08-29 上线 AI 生成合成内容标识功能。【转述】[百度百科“哔哩哔哩”](https://baike.baidu.com/item/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9/8018053)
- 2026-05-15《关于开展“清朗·整治AI应用乱象”专项公告》：AI 标识选项提到投稿一级页面；漏标内容和账号按补标、打回、下架阶梯处置；AI 虚假配音、AI 换脸误导从严。【实证】[B站公告](https://www.bilibili.com/opus/1202507670848798745)
- 稿件页会显示“含AI生成内容”（电子智人的三条都有）。【实证】[控制论](https://www.bilibili.com/video/BV1i9hd6aE5x)、[自指](https://www.bilibili.com/video/BV1ZZHo6LEEa)

### 5.6 扶持、话题与分区

**抖音**
- 2025-04“抖音知识创作砥砺计划”：自然科普、前沿科技、人文社科、名校名课四个方向，专项流量；同时推“AI新星计划”（征稿、挑战赛）。【实证（官方发布的媒体报道）】[科技日报](https://www.stdaily.com/web/gdxw/2025-04/26/content_331719.html)
- 2025-09“AI创作浪潮计划”（与即梦合作，工具、课程、现金和流量扶持）；同场还宣布用“懂行”用户的互动筛出单独的优质内容池、另设推荐机制。【实证】[新华网](http://www.xinhuanet.com/tech/20250924/187cfb6418bd4e8c94111c273cc2bbaf/c.html)
- 2026“前沿科技首发计划”（抖音科技发起，对接前沿科技现场和创作者）——电子智人的信息论在抖音就挂了这个话题和 #ai新星计划。【实证】[雷峰网](https://m.leiphone.com/category/industrynews/g0fqEAreR3YMwiIb.html)、[电子智人抖音页](https://www.douyin.com/video/7690337875291950345)
- 抖音科技发起的 #VibeCoding大赏，上线一个月 2.3 万人参与、6.3 亿播放。【转述（抖音精选公众号文章）】[AITNT 转载](https://m.aitntnews.com/newDetail.html?newId=26866)
- **#vibe知识大赏是不是官方话题：未证实。** B 站 UP 主未来雨季自称拆解了 661 条话题视频、话题“1.2 亿播放”（数据截至 10-04），数字无法核实。【实证（自述）】[B站](https://www.bilibili.com/video/BV1YCHW62ECA)
- 抖音知识 2026 年的发力方向：前沿科技、深度内容、全球一线实拍、长图文；2025 年人文知识的两大创作趋势之一是“**边画边讲**”（白板手绘 + 画外音）——和你的手绘路线正好对得上。【实证（抖音负责人在年度活动上的表述，媒体报道）】[中国日报网](https://cn.chinadaily.com.cn/a/202512/30/WS69538831a310942cc4999637.html)
- “中视频计划”：2024 年 9 月起西瓜的中视频伙伴计划下架，换成抖音“创作者伙伴计划”，**不再要求横屏 1 分钟以上**，竖屏和图文也能有收益。【转述】[36氪](https://m.36kr.com/p/2955091364225156)
- 抖音精选（中长视频）2026 年被重新推到台前；字节回应称精选的推荐算法与主端大同小异，但加重“懂行”用户反馈的权重，并举例说米三汉的 450 分钟长视频在完播上吃亏、靠分享和关注拿到了大量受众。【转述（北京商报引字节回应）】[新浪财经](https://finance.sina.com.cn/stock/roll/2026-04-14/doc-inhupqxh1010168.shtml)

**B 站**
- 2020 年上线知识区（科学科普、社科人文等二级分区）。【转述】[TopMarketing](https://itopmarketing.com/info20104)
- 已有 AI 一级分区。【转述（B站广告代理站）】[bilibili-ad](https://www.bilibili-ad.com/zixun/767.html)
- 2026 年办过“B站AI创作大赛”和“AI创造公开赛”（后者要求横屏、≥1 分钟，但**只收能运行的 AI 产品，不收纯 AIGC 作品**）。【实证】[公开赛规则](https://www.bilibili.com/opus/1210076034617049096)
- 电子智人的稿件挂了“B站AI无限竞技场”“万物研究所”话题，页面上还有“分享科学科普内容赢奖金”的活动入口；竞技场的规则页本次没能读出内容。【实证（页面元素）】[控制论](https://www.bilibili.com/video/BV1i9hd6aE5x)、[规则页](https://www.bilibili.com/blackboard/era/M7GNhgn5UugzH8WA.html)
- B 站自 2023 年起前台显示“播放分钟数”而非播放次数，对长内容友好。【转述】[百度百科“哔哩哔哩”](https://baike.baidu.com/item/%E5%93%94%E5%93%A9%E5%93%94%E5%93%A9/8018053)

**认证**：本次没查到针对“AI 知识视频”的专门认证；账号的知识类认证走两个平台的通用认证体系（未查证细节）。

---

## 6. 抖音 / B 站知识短视频的规格建议

### 6.1 横屏还是竖屏：横屏 16:9 做主版本

- 抖音负责人 2021 年上线网页版时说：教授、学校发的知识类、教学类内容“往往以横屏为主”，时长一般在 5 分钟以上。【实证（媒体引述）】[DoNews](https://www.donews.com/news/detail/1/3157571.html)
- 这一波代表作全是横屏：电子智人 3840×2160（第二版拆解已记），B 站候选清单里的作品也都是横屏讲解。【实证】
- 抖音精选频道的视频时长大多在 1–10 分钟。【转述】[36氪](https://m.36kr.com/p/2955091364225156)
- **推断**：横屏在抖音的竖屏信息流里会上下留黑、画面变小，首屏冲击力不如竖屏；但你的片长 5–10 分钟、内容靠图示讲清楚，横屏更合适，也能一稿双发 B 站。竖屏可以作为以后“切片引流”的第二版本，不是现在的重点。
- 输出：1920×1080、30fps、H.264 + AAC 是最稳的组合；渲染 4K 再上传，平台转码后会更清楚（**推断**，抖音网页版可选 1080p）。

### 6.2 时长分布（本地统计）

数据：`3_第三版资料/调研/B站候选清单.md`（2026-10-06 抓取的 B 站搜索结果，有时长的 95 条）。**注意这是 B 站数据，不代表抖音。**

| 样本 | 条数 | 中位数 | 四分位范围 | 分布 |
|---|---|---|---|---|
| 标题含“vibe” | 50 | **2:41** | 2:11 – 2:58 | 1–2 分钟 7 条，**2–3 分钟 32 条**，3–5 分钟 9 条，5–10 分钟 2 条 |
| B 站播放 ≥ 1 万 | 13 | **4:23** | 4:00 – 5:31 | 1–2 分钟 2 条，3–5 分钟 6 条，5–10 分钟 3 条，10 分钟以上 2 条 |

【实证（本地统计）】解读（**推断**）：跟风的 vibe 知识大赏扎堆在 2–3 分钟，而真正跑出来的多在 4–6 分钟。你的 10 分钟定位比这一波长一倍，节奏必须靠“每 10–20 秒换一个视觉状态”撑住（第二版拆解的结论）。

### 6.3 字幕安全区

- **B 站**：播放器的弹幕设置里有“防挡字幕”，说明文字写的是“视频底部 15% 部分为空白保留区”——开了这个选项，弹幕不进底部 15%。所以**横屏字幕放在画面底部 15% 以内**，就不会被弹幕盖住。【实证（播放器设置文案）】[B站页面](https://www.bilibili.com/video/BV1i9hd6aE5x)
- **抖音竖屏**：官方没有公开自然流量视频的安全区数值。第三方实测估算：顶部约 8–10%、底部约 18–22%、右侧约 15–18% 被界面占用。【转述，非官方】[DBN 整理](https://www.databrush.com/article.php?id=595)
- **抖音横屏（推断）**：在竖屏信息流里，16:9 画面位于屏幕中段，底部文案区和右侧按钮大多压在画面外的黑边上；点“全屏”横过来看时界面元素会隐藏。所以横屏片子的字幕只要离画面底边留出约 5–8% 就够了。上传后一定用手机在草稿里实际看一遍。
- 字号：少数派教程给 Claude 定的底线之一是中文字号不小于 40px（1080 宽画面）。这是作者经验，不是平台规定。【实证（教程原文）】[少数派](https://sspai.com/post/115283)

### 6.4 封面

- 抖音个人主页的作品格子按 **3:4** 裁切显示，不管原视频横竖；创作者教程普遍建议把标题字放在 3:4 区域内。【转述】[抖音创作者教程](https://www.douyin.com/shipin/7262162128541403188)、[知乎回答](https://www.zhihu.com/tardis/landing/m/360/qus/379822322)
- 横屏视频可以在电脑端创作者服务平台单独上传封面图。【转述】[抖音教程](https://www.douyin.com/shipin/7259769406673143845)
- **推断**：做一张 16:9 的封面（给 B 站和抖音横屏播放页），把关键词放在中间的 3:4 区域里，一图两用。电子智人的封面就是一个大标题 + 中英双语的极简做法（第二版拆解）。

### 6.5 开头几秒的完播规律：没有可靠公开数据

- 抖音没有公开过“几秒流失多少”的官方数字。能查到的只有：
  - 字节对“抖音精选”的说明：长视频在完播目标上天然吃亏，算法会用分享、关注、评论、收藏等目标给它找受众。【转述】[北京商报](https://finance.sina.com.cn/stock/roll/2026-04-14/doc-inhupqxh1010168.shtml)
  - 2020 年的一篇运营文章描述过巨量创意“观看分析”的打点方式（第一个点打在视频时长 10% 处），并给了一个 36 秒视频 3 秒留存 53%、同类热门 80% 的单个例子。年代久、样本只有一个。【转述】[知乎](https://zhuanlan.zhihu.com/p/323485344)
- 营销文章里的“平均停留 2.8 秒、72% 的人 3 秒内决定”“5 秒完播 ≥60% 才算优”等，**查不到原始报告**，不采信。【传闻】例：[腾讯云社区文章](https://cloud.tencent.com/developer/article/2579413)
- **推断（可操作的部分）**：
  1. 第 1 秒就要有画面在动、声音已经开口，不放黑场、不放片头 logo。电子智人的做法是 0–15 秒先让观众“补一个字”，片名卡放到 30 秒（第二版拆解）。
  2. 如果从严在片头加“AI 生成”角标，做成角落小字、持续约 2 秒，不要挡住钩子画面。
  3. 声音：开头第一句最好是真声；若用 TTS，开头避开“大家都听过”的音色（见 §2.3）。

---

## 7. 落到本项目的清单（建议，未执行）

1. **旁白**：发布用真声（第二版定的规则不变）；排节奏时用本地克隆的占位声。要试 TTS 的话，先试 MiniMax speech-2.8-hd（经百炼约 1 元/期）和豆包 2.0（约 1.5 元/期），两家都能直接返回词级时间戳。
2. **时间戳**：真声 → Qwen3-ForcedAligner-0.6B 对齐（或火山“自动字幕打轴”）；生成 `captions.json` 后驱动画面。
3. **配乐**：Claude 用 Web Audio / Python 离线合成一条极简铺底（钢琴或柔和长音），段落交界处做起伏；需要“像真音乐”的片头再用 Suno Pro，下载记录留档。不用剪映曲库。
4. **音效**：默认全关；只允许事件型短音，人声段落里压低 15 dB 以上；禁用书写沙沙声和任何持续底噪。
5. **标识**：抖音选“含有AI生成内容”，B 站勾“含AI生成内容”；简介写清“画面由 AI 编写的代码生成，旁白为本人录音”。若某期用了 TTS 或克隆声，从严在片头角落加“AI 生成”小字约 2 秒。
6. **规格**：16:9、1920×1080（可 4K 渲染）、30fps；字幕在画面底部 15% 以内、离底边 5–8%；封面 16:9、关键字在中间 3:4 区。
7. **话题**：可参考电子智人的组合（#vibe知识大赏 #抖音前沿科技首发计划 #ai新星计划）；是否带来额外推荐，**未证实**。

---

## 8. 未证实 / 需要你确认或实测

- 电子智人两条片子的旁白到底是真人还是 TTS、用的哪家——作者没写，评论区本次读不到。
- #vibe知识大赏 是否为抖音官方发起的话题、有无流量扶持；“1.2 亿播放”的口径。
- 豆包 2.0 的最新单价（方舟页和计费文档写 5 元/万字符，是否已调价以控制台为准）；MiniMax 国内站的人民币直购价本次没查到，只有百炼代售价。
- Gemini 3.8 Flash TTS 是否提供时间戳、国内能否稳定调用；它的中文长文本稳定性（第三方提到后段音色漂移）。
- 抖音 2026-05 之后发布页“必选标签”的确切文案和位置，需要在 App 里实际看一次。
- “画面由代码生成、旁白是真声”的片子，平台检测会不会自动挂“疑似 AI”——没有公开案例，只能发布后观察。
- 代码合成配乐在 10 分钟片长上的听感（是否单调），需要做一段样片听。

---

## 9. 来源

**作者自述 / 一手作品页**
- 电子智人：[控制论](https://www.bilibili.com/video/BV1i9hd6aE5x)、[信息论（B站）](https://www.bilibili.com/video/BV1GXav6iEWh)、[信息论（抖音）](https://www.douyin.com/video/7690337875291950345)、[自指](https://www.bilibili.com/video/BV1ZZHo6LEEa)
- [路北路陈 设计科普](https://www.bilibili.com/video/BV1hWar6SEVP)、[风之谷AI 星舰](https://www.bilibili.com/video/BV1VxhD6jE5V)、[黎曼猜想](https://www.bilibili.com/video/BV11SaB6NELd)、[王树义 黑水河之战](https://www.bilibili.com/video/BV1TGag6oEn9)、[未来雨季 1.2 亿播放拆解](https://www.bilibili.com/video/BV1YCHW62ECA)
- [WY 的 X 帖](https://x.com/akokoi1/status/2102606609574941028)、[宝玉：Claude Opus 5.5 是怎么做出视频的](https://x.com/dotey/article/2105181393638531536)、[少数派教程](https://sspai.com/post/115283)、[linux.do 讨论](https://linux.do/t/topic/2982883)
- [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts)

**配音（官方文档 / 价格）**
- 火山引擎：[计费说明](https://www.volcengine.com/docs/DoubaoVoice/Billinginstructions-21)、[计费概述](https://www.volcengine.com/docs/DoubaoVoice/BillingOverview-15)、[V3 单向流式接口](https://www.volcengine.com/docs/6561/1598757)、[V1 接口（时间戳说明）](https://www.volcengine.com/docs/DoubaoVoice/HTTPone-timecompositenon-streaminginterface-V1notrecommended)、[方舟价目](https://www.volcengine.com/product/doubao)；[SeedAudio 发布（快科技）](https://finance.sina.com.cn/tech/roll/2026-06-23/doc-iniekvat8758577.shtml)
- MiniMax：[T2A 接口文档](https://platform.minimax.io/docs/api-reference/speech-t2a-http)；[阿里百炼价格页（含 MiniMax 代售与 CosyVoice）](https://help.aliyun.com/zh/model-studio/model-pricing)
- 阿里 CosyVoice：[HTTP 接口](https://help.aliyun.com/zh/model-studio/cosyvoice-tts-http-api)、[Python SDK](https://help.aliyun.com/zh/model-studio/cosyvoice-python-sdk)、[客户端事件](https://www.alibabacloud.com/help/zh/model-studio/cosyvoice-client-events)
- Google：[Gemini 3.8 TTS 官方博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech)、[开发者指南](https://aistudio.google.com/learn/gemini-3-8-flash-tts-developer-guide)；[36氪 价格与测评](https://eu.36kr.com/zh/p/3996713949351811)
- ElevenLabs：[时间戳接口](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)；[价格汇总](https://www.cartesia.ai/learn/elevenlabs-pricing)
- Fish Audio：[价格整理](https://saascrmreview.com/fish-audio-review)
- 对齐：[Qwen3-ASR / Qwen3-ForcedAligner](https://github.com/QwenLM/Qwen3-ASR)
- 口碑：[中文 AI 配音口碑横评](https://github.com/duevan07/chinese-ai-tts-real-review)、[FlowPix 音色排行（低可信）](https://www.flowpixai.com/ai-news/most-popular-ai-voiceover.html)、[“我为何不使用 AI 配音”](https://www.youtube.com/watch?v=q82Nv3eaer0)
- 剪映：[商用音乐说明](https://lf9-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/faceu/abb0af21-9c1c-47ec-b5c8-1f522cdc31f5.html)

**配乐**
- [MDN OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext)、[Tone.js 离线渲染性能 issue](https://github.com/Tonejs/Tone.js/issues/436)
- Suno：[Undetectr 条款解读](https://undetectr.com/blog/suno-commercial-use)、[Aitoolsbee](https://aitoolsbee.com/news/suno-copyright-policy-revised-under-warner-music-deal)；Udio：[UMG 公告](https://www.universalmusic.com/universal-music-group-and-udio-announce-udios-first-strategic-agreements-for-new-licensed-ai-music-creation-platform)、[MBW](https://www.musicbusinessworldwide.com/universal-and-suno-are-in-a-pr-battle-over-walled-gardens-in-ai-music)
- [腾讯云 TokenHub MiniMax 音乐接口](https://cloud.tencent.com/document/product/1823/135323)、[TikTok 商用音乐库](https://ads.tiktok.com/resources/help/article/commercial-music-library?lang=zh)
- 曲库：[hellothematic](https://hellothematic.com/best-free-music-websites)、[Foxi](https://www.foximusic.com/blog/need-background-music-that-wont-trigger-content-id)、[AnySpeech 混音建议](https://anyspeech.io/zh/blog/how-to-make-ai-voice-sound-less-robotic)

**平台规则**
- [《人工智能生成合成内容标识办法》](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)、[GB 45438-2025 信息页](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=F32EA2A561F1886CD8D606513512D547)、[国标要点整理（知乎）](https://zhuanlan.zhihu.com/p/2070105582497948121)、[SinCoSphere 解读](https://sincosphere.cn/learn/aigc-labeling-china)
- 网信办：[2026-03-21](https://www.cac.gov.cn/2026-03/21/c_1775746586601999.htm)、[2026-05-12（新华网）](https://www.news.cn/20260512/e47fa9f300684eddbff2c8568eee922c/c.html)、[人民日报](http://zw.china.com.cn/2026-05/13/content_118491066.shtml)；[中国网评论员文章（存疑）](http://www.china.com.cn/opinion2020/2026-06/23/content_118559677.shtml)
- 抖音：[AI 标识公告报道（证券时报）](https://stcn.com/article/detail/3315850.html)、[新华网](http://www.news.cn/tech/20250909/fb164c6d092146aa8e13ddc283fe416a/c.html)、[知识创作砥砺计划](https://www.stdaily.com/web/gdxw/2025-04/26/content_331719.html)、[2025 创作者大会](http://www.xinhuanet.com/tech/20250924/187cfb6418bd4e8c94111c273cc2bbaf/c.html)、[前沿科技首发计划](https://m.leiphone.com/category/industrynews/g0fqEAreR3YMwiIb.html)、[VibeCoding 大赏](https://m.aitntnews.com/newDetail.html?newId=26866)、[年度知识作品与 2026 方向](https://cn.chinadaily.com.cn/a/202512/30/WS69538831a310942cc4999637.html)、[中视频计划调整（36氪）](https://m.36kr.com/p/2955091364225156)、[抖音精选（北京商报）](https://finance.sina.com.cn/stock/roll/2026-04-14/doc-inhupqxh1010168.shtml)、[网页版与横屏知识内容（DoNews）](https://www.donews.com/news/detail/1/3157571.html)、[AI 治理数据（澎湃）](https://www.thepaper.cn/newsDetail_forward_32950844)、[AI 短剧审片标准（TVOAO）](https://www.tvoao.com/a/224167.aspx)
- B 站：[清朗专项公告](https://www.bilibili.com/opus/1202507670848798745)、[AI创造公开赛规则](https://www.bilibili.com/opus/1210076034617049096)、[AI无限竞技场规则页](https://www.bilibili.com/blackboard/era/M7GNhgn5UugzH8WA.html)、[AI 一级分区（广告站）](https://www.bilibili-ad.com/zixun/767.html)
- 其他平台对照：[小红书公告（南都）](https://m.mp.oeeee.com/a/BAAFRD0000202602121524724.html)、[各平台标注说法对比（什么值得买）](https://post.smzdm.com/p/aqrmpkw2)、[海螺社整理](https://www.hailuoshe.com/blog/ai-generated-video-labeling)
- 规格：[DBN 安全区估算](https://www.databrush.com/article.php?id=595)、[抖音封面 3:4 教程](https://www.douyin.com/shipin/7262162128541403188)、[观看分析打点（知乎 2020）](https://zhuanlan.zhihu.com/p/323485344)

---

## 核查结果

- 核查日期：2026-10-06。只用了网页检索和网页抽取，没有用浏览器工具，没有登录任何网站，没有下载视频。
- 方法：从上文挑出 12 条最关键、也最容易出错的结论（作者做法、价格、接口参数、平台规则），逐条回到一手来源重读：作者简介或帖子原文、厂商的计费和接口文档、官方公告、仓库 README。前文没有改动。
- 判定口径：**属实**＝一手来源原文支持；**部分属实**＝主体对，但有细节不准、漏了关键限制或已经过时；**未证实**＝找不到一手来源；**错误**＝和一手来源矛盾。原文引用每处不超过 15 个字。

| # | 结论（原报告位置） | 核查结论 | 依据链接 | 备注 |
|---|---|---|---|---|
| 1 | 路北路陈《瑞士风格》：旁白用 MiniMax speech-2.8-hd，在 MiniMax 网页上逐段合成；旁白逐行对齐由 Codex 完成；配乐音效程序合成；8.6 万播放（§0-1、§1） | 部分属实 | 【实证】[B站简介](https://www.bilibili.com/video/BV1hWar6SEVP) | 配音型号和程序合成配乐都对。但简介写的分工是：**在 MiniMax 网页上逐段合成配音的是 Codex**（工程负责人），配乐音效的程序合成与混音也是 Codex 做的，Opus 只负责台本、画面代码和声音设计。所以 §0 第 1 条“配乐主流是让 Claude 用代码合成”放在这条上不准，应为“Opus 设计、Codex 合成”。播放量一直在变：本次抓取到作品页 7.7 万、推荐位 8.8 万，8.6 万只是某一时刻的数字。 |
| 2 | 风之谷AI 星舰片：解说用豆包 SeedAudio，提示词点名调它的 API，音乐音效要求纯代码（§1） | 属实 | 【实证】[B站简介](https://www.bilibili.com/video/BV1VxhD6jE5V) | 简介原文写“解说用 SeedAudio”，提示词也要求音效、音乐用纯代码做。补充：简介还写了画面用 Blender 3D、Mantaflow 流体和 Remotion，总共约 5 小时，用掉 200 美元档周额度的约 18%。 |
| 3 | 黎曼猜想科普（CaldariNavyFleet）配音用 gemini-3.8-flash-tts；王树义《黑水河之战》用本人语音克隆（§1） | 属实 | 【实证】[黎曼猜想](https://www.bilibili.com/video/BV11SaB6NELd)、[黑水河之战](https://www.bilibili.com/video/BV1TGag6oEn9) | 黎曼猜想简介第一行就写了配音模型名，片长 12:41 也对。王树义的标题和简介都写“本人语音克隆”，片长约 7 分 38 秒，确实没写用的什么工具。 |
| 4 | 电子智人：只写画面、配乐、双语字幕由 Claude 代码生成，没说旁白；B 站三条都挂“含AI生成内容”；抖音版话题组合（§1、§5.5、§7-7） | 部分属实 | 【实证】[控制论](https://www.bilibili.com/video/BV1i9hd6aE5x)、[自指](https://www.bilibili.com/video/BV1ZZHo6LEEa)、[信息论 B站](https://www.bilibili.com/video/BV1GXav6iEWh)、[信息论 抖音](https://www.douyin.com/video/7690337875291950345) | 控制论简介最后一句确实是这个说法，旁白来源确实没写。“含AI生成内容”：控制论、自指的页面上都能看到；**信息论 B 站页两次抓取都没看到这个标记**，没能复核（可能只是没抓全）。抖音版话题 #抖音前沿科技首发计划 #ai新星计划 #claude #vibe知识大赏 #人工智能 属实，标题以“Vibe 知识大赏｜”开头。**新发现**：抖音版页面显示的标签是“个人观点，仅供参考”，没看到 AI 标签（【推断】他在抖音选的必选标签是“内容为个人观点”）。§7-5 建议的“抖音选含有AI生成内容”仍然是更稳妥的做法，只是参考作者在抖音上并没有这么选。 |
| 5 | 教程作者的做法——WY：把 TTS 文档存成 TTS.md，Key 放 .env，在 .claude/settings.json 里禁止读取 .env；少数派：Gemini 3.8 Flash TTS 经 kie.ai 调用、音色 Kore、Suno V6 配乐压低音量、中文字号不小于 40px；宝玉：用 Gemini 3.8 Flash TTS，归纳出三种声音来源（§1、§2.1、§6.3） | 属实 | 【实证】[WY 的 X 帖](https://x.com/akokoi1/status/2102606609574941028)、[少数派](https://sspai.com/post/115283)、[宝玉长文](https://x.com/dotey/article/2105181393638531536) | 三处原文都对得上。WY 的规则写法是 `"deny": ["Read(./.env)"]`。两点补充：① WY 的提示词还要求“有关闭水印的参数就关掉”。照抄的话，加标识的义务就转到你身上了（见 §5.1 第九条），发布时一定要自己声明；② 少数派说 Gemini TTS 有“70 个音色”（经 kie.ai），和谷歌官方“2000+ 音色库”的口径不一样；文中 kie.ai 和中转站的链接带作者邀请码。 |
| 6 | 豆包语音合成 2.0：后付费 5 元/万字符，资源包最低 1.6 元/万字符，声音复刻 8 元/万字符；一期约 1.5 元，复刻 2.4 元（§0-3、§2.2、§7-1） | **错误** | 【实证】[火山引擎·计费说明](https://www.volcengine.com/docs/DoubaoVoice/Billinginstructions-21)、[方舟产品页](https://www.volcengine.com/product/doubao) | 5 元、8 元、1.6 元是计费说明里**“大模型语音合成 / 大模型声音复刻”**这一组的价格（从文档结构看，归在“历史模型价格”下，【推断】是上一代模型）；方舟产品页上的“Doubao-语音合成 5 元 / Doubao-声音复刻 8 元”也是这组数。计费说明里单列的**“豆包语音合成模型2.0”，后付费是 3 元/万字符，资源包 2.8→2.1 元/万字符；“豆包声音复刻模型2.0”也是 3 元/万字符，但另外收音色槽位费：后付费音色 138 元/个，第一次用它合成时扣；预付费买 1–50 个也是 138 元/个**。正确换算：一期 3000 字，用 2.0 约 0.9 元；用复刻约 0.9 元，外加一次性 138 元音色费。“新用户 2 万字符/半年试用”属实。 |
| 7 | 豆包音频生成 1.0（SeedAudio）：“API 在火山方舟邀测”，单次最长 2 分钟（§2.2） | 部分属实（已过时） | 【转述】[发布报道（IT之家经新浪）](https://finance.sina.com.cn/tech/digi/2026-06-24/doc-inienieh3154674.shtml)；【实证】[计费说明](https://www.volcengine.com/docs/DoubaoVoice/Billinginstructions-21)、[计费概述](https://www.volcengine.com/docs/DoubaoVoice/BillingOverview-15) | 6 月 23 日发布时确实是邀测，单次 2 分钟也对。但火山引擎现在的计费文档已经给出公开价：后付费 1 元/分钟，资源包 0.8–1 元/分钟，新用户试用 60 分钟/半年，正式版默认 5 路并发。也就是说已经能按量开通（以控制台为准），“邀测”的说法可以去掉；第三方 $0.003/秒的报价也可以换成官方价。 |
| 8 | 阿里百炼代售 MiniMax：speech-2.8-hd 3.5 元、turbo 2 元（每万字符），复刻一个音色 9.9 元；CosyVoice v3.5-plus 1.5 元、v3.5-flash 0.8 元、v3-plus 2 元、v3-flash 1 元，送 1 万字符（§2.2） | 属实 | 【实证】[百炼价格页](https://help.aliyun.com/zh/model-studio/model-pricing) | 数字逐个对上，按 3000 字的换算也对。补充：百炼上的 MiniMax **没有免费额度**；CosyVoice 每个模型的 1 万字符免费额度有效期是 90 天；复刻费在第一次用这个音色合成时扣。 |
| 9 | Gemini 3.8 Flash TTS：2026-09-23 发布，Hume AI 质量指数第一，2000+ 音色，30 秒复刻，130 种语言；2026 年底前文本 $0.50、音频 $9 每百万 token（§2.2） | 属实（要补两点） | 【实证】[Google 博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech)、[开发者指南](https://aistudio.google.com/learn/gemini-3-8-flash-tts-developer-guide)、[Google Cloud 价格页](https://cloud.google.com/text-to-speech/pricing)；【转述】[第三方实测](https://mxchat.ai/gemini-tts-pricing-tokens-per-second) | 每一项都能在官方页面找到：博客写了 Hume 总体质量第一、2000+ 音色库、30 秒样本复刻；130 种语言出自开发者指南（博客里写的是“100 多种”）。要补两点：① **2027-01-01 起价格翻倍**，变成 $1 / $18；② 官方按每秒 25 个音频 token 计算，第三方实测约 32 个，按 25 估会少算约 28%（一期约 $0.18，不是 $0.14，量级不变）。另外，“复刻要录本人同意声明、输出带 SynthID 水印”官方博客就写了，可以从【转述】升为【实证】。API 里的预置音色是 30 个，2000+ 指的是音色库。 |
| 10 | Qwen3-ForcedAligner-0.6B：支持 11 种语言，中文时间偏差 33.1，对照方法 NFA 为 109.8（§3、§7-2） | 属实（漏了一个关键限制） | 【实证】[Qwen3-ASR 仓库 README](https://github.com/QwenLM/Qwen3-ASR) | 表里的数字（单位是毫秒，越小越好）和 11 种语言都对。漏掉的限制：README 写明**单次最多只能对齐 5 分钟语音**。10 分钟的真声旁白要先按段落切成 5 分钟以内的小段，分别对齐，再把时间拼回去。这一步要写进给 Claude 的规矩里。 |
| 11 | Suno 2026-09-03 新条款：免费版不能商用；Pro 每月 20 次、Premier 60 次许可下载；商用权跟着下载走，录屏、扒流拿到的不算；付费用户也“一般不被视为版权所有人”（§0-5、§4.1） | 部分属实 | 【实证】[Suno 服务条款](https://suno.com/terms-of-service)；【转述】[Undetectr](https://undetectr.com/blog/suno-commercial-use) | 下载即授权、不走官方渠道下载就不能商用、20/60 次的额度都对得上。最后一句不准：现行条款写的是 Suno 把它对输出的权利**转让给用户**，下载后的商用权**永久有效**，退订、降级、额度用完都不受影响；它只是不担保这首歌在法律上一定有版权（纯 AI 生成的作品在美国不能登记版权）。建议改成“Suno 把权利转给你，但不担保版权成立”。 |
| 12 | 网信办 2026-05-12：6 类必选标签，不选就发不了；2026-03-21：六家平台把标注入口提到一级页面，补标 60 余万条；B 站 2026-05-15 公告：AI 标识提到一级页面，漏标的按补标、打回、下架处理，AI 虚假配音从严（§0-6、§5.2、§5.5） | 属实 | 【实证】[新华网](https://www.news.cn/20260512/e47fa9f300684eddbff2c8568eee922c/c.html)、[中国网信网](https://www.cac.gov.cn/2026-03/21/c_1775746586601999.htm)、[B站公告](https://www.bilibili.com/opus/1202507670848798745) | 三处原文全都对得上；另外，“无需标注”这个标签不会显示在页面上。唯一的出入：§5.2 说“在 12 家平台试行后全面推开”，新华网稿里没有“12 家”，3-21 那篇说的是“6 家重点平台”先行先试。“12 家”本次**未证实**。 |

**顺带核对的其他几条（都属实，附要点）**

- MiniMax 的 `subtitle_type` 有 sentence、word、word_streaming 三档，默认是句级；`word_streaming` 只在流式模式下能用；非流式时字幕以文件形式返回。【实证】[MiniMax 文档](https://platform.minimax.io/docs/api-reference/speech-t2a-http)
- 豆包 V3 接口的 `enable_subtitle`：只在 TTS2.0 和复刻 2.0 上生效，只支持中文和英文，开了 LaTeX 播报或传了 SSML 就不返回字幕。【实证】[V3 文档](https://www.volcengine.com/docs/6561/1598757)
- 剪映的商用声音：除非另有说明，只许发在剪映和抖音。补充：剪映也有一部分商用声音标明可以全渠道使用，用之前要看那一首的说明。【实证】[剪映说明页](https://lf9-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/faceu/abb0af21-9c1c-47ec-b5c8-1f522cdc31f5.html)
- Udio 2025-10-29 和环球唱片和解，改成“围墙花园”模式，生成的歌不能下载导出。【实证】[UMG 公告](https://www.universalmusic.com/universal-music-group-and-udio-announce-udios-first-strategic-agreements-for-new-licensed-ai-music-creation-platform)
- 抖音的声明路径是 高级设置 → 发文助手自主声明 → 内容由AI生成；不声明的话，平台检测到会挂“疑似使用了AI生成技术”的提示。【转述，引抖音公告】[证券时报](https://stcn.com/article/detail/3315850.html)
- 小红书 2026-02-12 公告：没有主动标识的 AI 内容会被限制分发。【实证，公告全文转载】[南都](https://m.mp.oeeee.com/a/BAAFRD0000202602121524724.html)
- GB 45438-2025：视频里的 AI 标识，文字高度不低于画面最短边的 5%，显示时间不少于 2 秒。【转述】[北京日报（国家科技传播中心转载）](https://www.ncsti.gov.cn/kjdt/kjrd/rgzn_kjrd/202509/t20250902_217877.html)，和腾讯云文档的说法一致。
- #VibeCoding大赏“2.3 万人参与、6.3 亿播放”：数字对得上。但要注意，这是抖音精选公众号 **2026-07-04** 的文章，说的是这个话题上线头一个月的数据，比 Opus 5.5 发布还早；它和 #vibe知识大赏 也不是同一个话题，不能拿来说明这一波视频有多火。【转述】[AITNT 转载](https://m.aitntnews.com/newDetail.html?newId=26866)
- 未来雨季“拆解 661 条、1.2 亿播放、数据截至 10 月 4 日”确实是他在简介里的自述；原报告标成“无法核实”是对的。【实证（自述）】[B站](https://www.bilibili.com/video/BV1YCHW62ECA)
- “抖音 2026 年清理违规 AI 内容 4.2 万条、处罚 1.4 万个账号”：数字对得上，但出处是澎湃“湃客”栏目里的自媒体文章，它引的是“官方披露”，不是澎湃新闻自己的报道。【转述】[澎湃·湃客](https://www.thepaper.cn/newsDetail_forward_32950844)
- B 站播放器“防挡字幕”选项的说明，确实是“视频底部 15% 部分为空白保留区”。补充：这个选项观众可以自己关掉，不能保证每个人都开着。【实证】[控制论页面](https://www.bilibili.com/video/BV1i9hd6aE5x)

**需要改正的地方（汇总）**

1. §0-3、§2.2、§7-1 的豆包价格要改：2.0 后付费是 3 元/万字符，一期约 0.9 元；用复刻 2.0 还要加一次性约 138 元的音色槽位费。5 元 / 8 元 / 1.6 元是“大模型语音合成”那一组的价格。
2. SeedAudio 已经有公开价（后付费 1 元/分钟），“邀测”的说法过时了。
3. §0-1 说“配乐由 Claude 用代码合成”：路北路陈那条实际上是 Codex 合成的。
4. 电子智人在抖音上显示的是“个人观点”标签，不是 AI 标签（推断）；信息论 B 站页上的 AI 标签没能复核。
5. 强制对齐每段不能超过 5 分钟；Gemini TTS 的价格 2027 年起翻倍；Suno 那句关于版权的说法要改。
