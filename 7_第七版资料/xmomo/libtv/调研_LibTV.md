# LibTV 调研（信息截至 2026-11-16）

标注：【官方】官网/官方 GitHub/官方转述；【三方】媒体与测评；【没查到】

## 1. 它是什么
- 确认是 LiblibAI（哩布哩布AI，主体「演语科技」）旗下视频创作平台，官网 https://www.liblib.tv 。2026-03 上线，首日访问破 10 万；5 月 18 日推团队版。【三方：百度百科 https://baike.baidu.com/item/LibTV/67506974 ；量子位 https://zhuanlan.zhihu.com/p/2018380826870567607】
- 定位：「无限画布 + 节点工作流」，另设面向 Agent 的 Skill/API 入口（人与 Agent 双入口）。画布有文本、图片、视频、音频、脚本 5 类节点。【三方：腾讯新闻 https://news.qq.com/rain/a/20260318A08J5S00】
- 同名产品：未发现其他 LibTV 视频产品，可判定即此。（Pexo 等英文博客也指向 liblib.tv：https://pexo.ai/blog/what-is-libtv-1029）
- 注意：官网面向中文用户，国际版/英文界面「没查到」。

## 2. 创作流程（界面步骤）
1. 文本节点写大纲，或直接建脚本节点（可上传剧本、角色图、参考视频），自动拆成分镜脚本（时长、画面描述、景别、运镜）。【三方：品玩 https://www.pingwest.com/a/312278 ；阳光教程 https://x.com/YangGuangAI/article/2034973086769139721】
2. 角色/产品设定：图片节点生成，可做角色三视图，存入主体库/资产库。
3. 脚本顶部点「生成分镜」：勾选分镜，选生图模型、画幅、分辨率，批量出图。
4. 图可用 /斜杠功能：多机位九宫格、25 宫格、多角度、打光，再「宫格切分」送入新节点。
5. 点「批量生成视频」，或手动连线到视频节点（首尾帧建议手动连）；选模型、时长、比例、画质。
6. 配乐：站内文生音乐（Mureka）、配音（Eleven V3）；站内有视频合成/剪辑，也有人导出到剪映收尾。【三方：知乎实测 https://zhuanlan.zhihu.com/p/2017944626061919460】
- 18 秒产品广告实测约 3 小时，流程为创意、脚本、分镜图、图生视频、配乐、剪辑。

## 3. 输入格式与提示词
- 可粘贴剧本/大纲，脚本节点自动拆镜并为每镜生成提示词，不必逐镜自写。【三方：品玩】
- 参考图：可在分镜上传；图片节点连文本节点做角色设定；视频节点支持多图/多元素参考（实测「6 个参考元素的全能参考」）、首尾帧。【三方：腾讯新闻 https://news.qq.com/rain/a/20260413A074I300】
- 产品一致性：用多角度编辑器（拖机位保持一致）+ 主体库；Seedance 2.5 官方 API 最多 50 个参考素材（30 图/10 视频/10 音频）。【三方：https://we0.ai/articles/seedance-2-5-api-is-live】
- 提示词语言：没查到官方中/英文对比。教程用中文写结构化设定（风格、外貌、服饰、动态、背景五段）；Seedance 2.5 提示词建议按时间节拍写，每节拍一个动作、一种运镜、注明声音。【三方：塔猴 https://www.tahou.com/article/201152834749168645 ；Imgveo https://imgveo.com/zh/seedance-2-5-ai-video-generator】
- 官方提示词模板：没查到。有官方 100+ 条 Skill（导演风格、广告、MV 等）。【三方：澎湃 https://www.thepaper.cn/newsDetail_forward_33604553】

## 4. 接入模型
- 生图：LibNano 2、Lib Nano Pro、Seedream 5.0 Lite/4.5/4.0、Midjourney V7/Niji 7。
- 生视频（教程清单，部分已更新）：Kling O3/3.0/O1/2.x、Wan 2.x、Seedance 1.0/1.5/2.0、Hailuo、Vidu Q3/Q2、PixVerse、Veo/Video 3.1 系；后续新增 HappyHorse 1.0/1.1、Seedance 2.5 及 Flash、Wan 3.0、MiniMax H3、Kling 4.0 API（10 月）。【三方：阳光教程；知乎 https://zhuanlan.zhihu.com/p/2075601036258156686 ；百科】官网称 50+ 模型。【官方：https://www.liblib.tv/wappro】
- 单条上限（模型官方规格，非 LibTV 页面实测）：Seedance 2.5 为 4–30 秒，原生音频；Seedance 2.0 为 15 秒，原生音频；Kling 3.0 为 5/10/15 秒，带音轨；HappyHorse 1.0 为 15 秒 1080P。【三方：https://omniakey.com/zh/blog/kling-3-0-vs-seedance-2-5 ；https://ai-bot.cn/ai-comic-drama-creation-tools】LibTV 内各模型实际可选分辨率/画幅：没查到逐项表。
- 产品片建议：Seedance 2.5 单镜 30 秒理论可一条出整片，但从业者反馈 5–10 秒短镜更易剪、废片更少。【三方：36氪 https://m.36kr.com/p/3957695740968325】

## 5. 订阅与积分（三方数据，价格常变）
- 新用户首登送 80 积分，每日登录送 20。连续包月五档：标准 59 元/1500 分，进阶 199/4600，高级 649/16300，豪华 1199/32800，至尊 2299/66000。【三方：知乎 https://zhuanlan.zhihu.com/p/2075601036258156686】
- 年卡 569–8499 元/年。【三方：36氪 https://m.36kr.com/p/3872803056302723】
- 11 月双11页面：Seedance 2.5 约 0.16 元/秒，2.5 Flash 约 0.10 元/秒，年会员最高减 1300。【官方：https://www.liblib.tv/plugin ，https://www.liblib.tv/activity】
- 5 秒/10 秒各耗多少积分：没查到 LibTV 官方表。可折算：Seedance 2.5 按 0.16 元/秒，5 秒约 0.8 元、10 秒约 1.6 元。（折算，非官方）

## 6. 限制与坑
- 排队：2026-04 三方称 Seedance 2.0 基本不排队，10 秒 720P 约 3 分钟。当前情况没查到。
- 真人脸：需「合规校验」，真人要手机扫码活体授权；纯产品片基本不涉及。【三方：腾讯新闻 2026-04】
- 水印/商用授权：会员页有「去水印」权益（三方提及），商用条款没查到，务必看官网协议。
- 英文字渲染、产品一致性的专门评测：没查到；产品图建议先在图片节点固定，再做图生视频，英文品牌字建议后期叠加。（此条为建议，非查证结论）
- 评价：新手门槛较高、教程少；Agent 偶尔「犯傻」。【三方：36氪；腾讯新闻 2026-03】

## 7. 外部 Agent 接入
- 有。官方开源 libtv-skills：https://github.com/libtv-labs/libtv-skills ；安装 `npx skills add libtv-labs/libtv-skills --skill libtv-skill`，设置 `LIBTV_ACCESS_KEY`；OpenAPI 基址 https://im.liblib.tv ，含建会话/发消息、查询、上传文件（可传参考图）、下载结果。【官方】
- 另有 Plugin 页，列出 Claude Code、OpenClaw 等，Codex 有安装命令。【官方：https://www.liblib.tv/plugin 】
- MCP：没查到。
