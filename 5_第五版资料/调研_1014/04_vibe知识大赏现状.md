# 04｜#vibe知识大赏 现状（截至 2026-10-14）

> 调研日期：2026-10-14。
> 证据标记：【实证】= 一手来源（B 站公开接口、作品页、仓库原文）；【转述】= 二手文章、搜索摘要、旧调研；【推断】= 我根据材料推出来的；（未核实）= 没找到来源。
> **这次的局限，请先看：**
> - 抖音网页这次打不开（WebFetch 报 Socket is closed）。抖音的数据**全部沿用 10-06 的旧调研快照**（`3_第三版资料/调研/C_抖音话题与电子智人.md`，那份做过核查）。10-07 之后的新数据，主要来自 **B 站公开接口**（`api.bilibili.com/x/web-interface/view`、`archive/related`、`card`、`reply`、弹幕 `dm/list.so`、`tag/info`）。
> - B 站搜索接口、用户空间接口都返回 412（风控），按规矩没绕。新作品是靠「相关推荐」接口顺藤摸瓜找到的，所以**名单不是全量**。
> - WebSearch 的额度在调研中途用完了（所有子任务共用一个上限）。之后只用 WebFetch 读已知链接。梵高、瓦罗兰特、歌词放映这几条没能展开搜，相关结论标了（未核实），并指向同目录的 05、06、07、13 号调研。
> - 本文的「B 站播放」都是 2026-10-14 当天接口的实时值。发布时间是我用接口原始时间戳自己换算成北京时间的。

---

## 一句话结论

这个类型没死，但「AI 居然能做这个」的新鲜感已经被吃完了。10-02 到 10-12 在 B 站发的同类片里，我们找到的有 3 条破百万播放、至少 8 条在 20 万到 60 万之间（名单不是全量）。赢的那些片子有几个共同点：标题写生活里的痛处，只讲一个有名字的概念，片长 2 分 40 秒左右，而且很会蹭热点（诺奖周一个号连发三条，一条破百万）。输的是那套默认样子：黑底、金字、宋体双语、氛围钢琴，再加一个大学科名当片名。观众已经能一眼认出是 Claude 做的，弹幕里开始出现「AI 流水线」「天天都是这种」。我们现在的四部片正好就是那套样子。要拉开差距，得靠选题角度、垂直圈层和热点时机，画面再精致也帮不上。

---

## 0. 速览（最影响决策的 10 条）

1. **电子智人不是第一个。** 已知最早用「Vibe知识大赏｜」做标题的是《opus家族史》，作者「骑老爷爷过马路被罚300」，北京时间 9-23 16:32 发布。电子智人的《控制论》是 9-26，《信息论》是 9-28 05:58。电子智人只是把这个话题推成现象级的人。【实证，旧调研已核查】
2. **不是官方活动。** 话题名是照着抖音官方 #vibecoding大赏 起的（那个活动 8-31 已截止），没有找到规则页、奖励或截止日期。B 站的「vibe知识大赏」标签是 9-30 00:19 建的，到今天有 523 条视频用过。【实证】
3. **10 月 B 站最大的号不是电子智人，是「比特新语」。** 14.4 万粉，16 个投稿，获赞 60.6 万。《银牌的眼泪》116 万播放，诺奖光遗传学那条 100 万播放（最高到全站排行第 16 名），片长几乎都是 2:42。【实证】
4. **我们找到的里，单条最高的是「嘿这里是江离」的《涌现 · 无人指挥》。**（B 站搜索接口 412，名单不是全量，不能说是全站最高） 174 万播放、21 万赞、8.5 万收藏，最高到全站排行第 61 名。这个号只有 3.3 万粉、9 个投稿。【实证】
5. **小号照样能爆。** 「低调的神经全网同名」只有 3428 粉，《临界点》48 万播放；「逸识YInsight」只有 8353 粉、2 个投稿，《一次心跳的0.8秒》59.7 万播放。【实证】
6. **很多片子是晚几天才起来的。** 37 法则、以牙还牙、余波这 3 个 BV 号，10-06 时署名「幼笙吖」、标题带「Vibe知识大赏」前缀，播放只有 78 到 440；到 10-14 前缀去掉了，署名变成「比特新语」，播放 13.6 万到 19.8 万。临界点那个 BV 号 10-06 时署名「Tech即刻」、标题本来就没有前缀，播放 209，现在 48 万。「署名变了」最可能是**同一个账号改了名**（幼笙吖 → 比特新语，Tech即刻 → 低调的神经全网同名）：B 站的稿件不能换作者，而且 10-06 时幼笙吖名下 5 条带前缀的片子，现在全部在比特新语（mid 3494362707135250）名下、前缀全部去掉了。【实证（同一 BV 前后对比）+ 推断（改名、原因）】
7. **饱和信号很明确。** GitHub 上按「vibe知识大赏」搜到 8 个仓库，都是 10 月新建的；其中 6 个是 skill 或工具（skill 指可以装进 AI 编程助手、让它按固定流程干活的说明包），另外 2 个是单个作品。按「vibe knowledge video」再搜，还有 10-09 到 10-11 新建的 3 个同类仓库。最火的一个 8 天拿了 252 星。闲鱼上有人倒卖 skill，B 站有人「点赞关注才给提示词」。【实证 + 转述】
8. **观众的不满集中在四件事：**一眼 AI、风格雷同、太快看不懂（没有旁白只能暂停）、AI 编错事实。【实证，弹幕和评论原文见 §5】
9. **热点有用，而且不用抢第一天。** 比特新语的诺奖三连：医学奖（光遗传学，10-09 发）100 万，化学奖（[手性分子](https://www.bilibili.com/video/BV14mpv6qEEf)，10-10 发）13.1 万，物理奖（冰立方中微子，10-11 发）56.7 万。2026 年诺奖公布日期：医学奖 10-05、物理奖 10-06、化学奖 10-07（化学奖给了 Kagan 和 Soai，讲的是手性分子的不对称合成）。所以三条分别晚了 4 天、3 天、5 天。【实证】
10. **我们候选池里的《十亿次心跳》已经有人做了相近的。** 逸识YInsight 的《一次心跳的0.8秒》（10-04，59.7 万）开头就是让观众把手指搭在手腕上，也讲到一生大约 30 亿次心跳。【实证】

---

## 1. 起源：谁先做的，话题怎么来的，有没有官方扶持

### 1.1 时间线（北京时间）

| 日期时间 | 事件 | 来源 |
|---|---|---|
| 截至 2026-08-31 | 抖音官方活动 #vibecoding大赏：标题要加前缀，必须带 #vibecoding大赏 #ai新星计划，单条有机会拿到 5–10 万官方流量 | 【实证】[话题页](https://www.douyin.com/hashtag/7601419125595834406)（旧调研 10-06 核过） |
| 9-16 | B 站「AI无限竞技场」上线。量子位的报道把它写成一个 UP 主测评大模型的榜单广场，没提奖励。「千万流量和现金激励」（未核实） | 【转述】[量子位（文末相关报道）](https://www.qbitai.com/2026/09/484890.html) 写了「9月16日…正式上线」；那篇正文里的奖金和流量说的是另一个比赛（AI 创造公开赛）。[话题页](https://m.bilibili.com/topic-detail?topic_id=1346854)只返回空壳，[新浪财经](https://finance.sina.com.cn/jjxw/2026-09-16/doc-iniryvcf5018843.shtml)打不开 |
| 9-23 00:33 | Claude Opus 5.5 发布（美国时间 9-22；北京时间几点沿用旧调研的推算） | 【实证】[Anthropic](https://www.anthropic.com/claude-opus-5-5)（页面写 9-22 发布） |
| 9-23 16:32 | **已知最早的「Vibe知识大赏｜」标题**：《opus家族史》，作者「骑老爷爷过马路被罚300」，2:57，挂了 #remotion | 【实证】[抖音作品页](https://www.douyin.com/video/7688645727061272805)，时间按作品 ID 解码，已核查 |
| 9-25 23:37 | sadssxa《群论之美宣传片》（B 站），现在 40.6 万播放 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV12Zhm6oE6m) |
| 9-26 23:28 | 电子智人《控制论 舵手之学》 | 【实证】旧调研核查 |
| 9-28 05:58 / 06:25 | 电子智人《信息论 惊奇之学》、Iwanau《运气的形状》，前后差半小时，成为抖音话题里最大的两条 | 【实证】旧调研核查 |
| 9-30 00:19 | B 站「vibe知识大赏」标签创建 | 【实证】[tag 接口](https://api.bilibili.com/x/tag/info?tag_name=vibe知识大赏) |
| 10-02 13:11 | 江离《涌现 · 无人指挥》，后来涨到 174 万 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1CKa16mE83) |
| 10-02 18:33 | X 帖「发现一个新赛道：Vibe知识大赏」 | 【实证】[X @hyh1564069](https://x.com/hyh1564069/status/2105969300293243379)，时间按帖子 ID 解码 |
| 10-03 | 抖音话题单日新增 156 条，之后回落（Rainorb 的统计） | 【转述】[BV1YCHW62ECA](https://www.bilibili.com/video/BV1YCHW62ECA) 画面读数（简介里没有这个数，（未核实）） |
| 10-05 18:27 | Rainorb 发片：抖音话题共 661 条视频、1.2 亿播放（数据截至 10-04） | 【转述（作者自述）】同上，661 条、1.2 亿、截至 10-04 这三项写在视频简介里 |
| 10-06 | 第一个「复刻 vibe 风格」的爆款 skill 仓库 HeyChengC/vibe-knowledge-film 建立，8 天拿到 252 星 | 【实证】[GitHub 搜索接口](https://api.github.com/search/repositories?q=vibe知识大赏&sort=stars) |
| 10-08 15:31 | 比特新语《银牌的眼泪》，现在 116 万 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV12DHQ61EhT) |
| 10-08 18:21 | V2EX 求助帖「抖音的 vibe 大赏系列视频，是如何制作的？」发出；19:43 有人回复提到闲鱼倒卖 skill | 【实证】[V2EX t/1247139](https://www.v2ex.com/t/1247139)；时间来自 [V2EX 帖子接口](https://www.v2ex.com/api/topics/show.json?id=1247139) 和 [回复接口](https://www.v2ex.com/api/replies/show.json?topic_id=1247139) |
| 10-09 14:37 | 比特新语蹭诺奖：《今年诺奖颁给了"大脑的开关"：光遗传学到底是什么》，现在 100 万 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1Fbpt6qEPq) |
| 10-09 19:00 | X 长文《用Opus5.5起号真的太爽了》 | 【转述】[X 文章](https://x.com/Tom_CC_9986/article/2108512799517450287)（原文抓取返回 402，内容来自搜索摘要；时间按 ID 解码） |
| 10-10 15:30 | 比特新语蹭化学奖：《同一个分子，照一下镜子，药就成了毒｜2026诺贝尔化学奖》，现在 13.1 万 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV14mpv6qEEf) |
| 10-13 20:10 | 「代码放映室」照搬电子智人的「X之学」命名，发《博弈论｜代价之学》，只有 2602 播放 | 【实证（10-14 读数）】[相关推荐接口](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV12DHQ61EhT)。相关推荐每次都会变，10-15 再查三个相关推荐列表都没再出现，没拿到它的 BV 号，没能复核 |
| 10-14 | 当天 GitHub 上又新建了 2 个同类 skill 仓库 | 【实证】GitHub 搜索接口（同上） |

### 1.2 是不是官方活动、有没有扶持

| 线索 | 查到的情况 | 等级 |
|---|---|---|
| #vibe知识大赏 的官方规则页 | 10-06 没找到，这次也没有新的。它是创作者照着 #vibecoding大赏 的格式自己起的名字 | 【实证（未找到）+ 推断】 |
| 头部作品挂的官方计划 | 电子智人《信息论》挂的是 #抖音前沿科技首发计划 #ai新星计划。这两个都是真官方计划，但没有证据说明扶持落到了这个话题上 | 【实证】[信息论抖音页](https://www.douyin.com/video/7690337875291950345)（10-06 快照） |
| 「抖音这段时间也在推」 | 10-09 的 X 长文说抖音在推 #Vibe知识大赏，建议发布时 @抖音科技（未核实：原文打不开，10-15 的搜索摘要里没有这两句）。也没核到抖音方面的表态 | 【转述】[X 文章](https://x.com/Tom_CC_9986/article/2108512799517450287)（搜索摘要） |
| B 站 | 「AI无限竞技场」是 B 站官方 9-16 上线的大模型测评榜单，有没有流量或现金奖励（未核实）。B 站的「vibe知识大赏」只是普通标签，没有活动页 | 【转述】见上表 |
| 10 月有没有新的 AI 知识片专项扶持 | 没找到。搜到的 10 月 AI 激励都是短剧方向（抖音「真人+AI 短剧」激励，10-01 到 12-31） | 【转述】[掘金](https://juejin.cn/post/7695437620617986102)（只有搜索摘要；10-14 核查时页面只显示「Please wait」，内容（未核实）） |

### 1.3 「是电子智人最先做的吗？」

不是。准确的说法是：

- **命名和首发**：《opus家族史》，9-23。
- **把话题推成现象**：电子智人《信息论》（抖音 81.4 万赞）和 Iwanau《运气的形状》（35.3 万赞），9-28 清晨。
- **电子智人自己**：本来是做策略游戏和 AI 工具尝鲜的 B 站 UP 主。这一波只做了 3 部，都在 5 分钟左右：控制论、信息论、自指。B 站粉丝从 10-06 的 3808 涨到现在的 5830，投稿 66 个。《自指》的播放从 10-06 的 571 涨到 5.49 万。【实证】[空间卡片接口](https://api.bilibili.com/x/web-interface/card?mid=343143294)、[自指接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1ZZHo6LEEa)

---

## 2. 头部创作者和爆款

### 2.1 B 站（2026-10-14 接口实时值，按播放排序）

| 账号（粉丝） | 代表作 | 播放 / 点赞 / 收藏 | 题材 | 时长 | 形式特点 | 发布 |
|---|---|---|---|---|---|---|
| 嘿这里是江离（3.26 万粉，9 个投稿） | [《涌现 · 无人指挥》](https://www.bilibili.com/video/BV1CKa16mE83) | **174.4 万** / 21.0 万 / 8.47 万；最高到全站排行第 61 | 涌现（鸟群、蚁群、萤火虫、大脑） | 4:52 | 1080p。简介开头就问：没有指挥，鸟群为什么能同时转向。作者置顶说要「保持日更」 | 10-02 13:11 |
| 比特新语（14.4 万粉，16 个投稿） | [《银牌的眼泪》｜最痛的，不是失败，是"差一点"](https://www.bilibili.com/video/BV12DHQ61EhT) | **116.2 万** / 7.6 万 / 2.83 万 | 反事实思维（简介引卡尼曼 1982 的「误机」故事） | 2:42 | 4K。开场是领奖台，0 秒就有人刷运动员名字 | 10-08 15:31 |
| 比特新语 | [光遗传学（2026 诺贝尔医学奖）](https://www.bilibili.com/video/BV1Fbpt6qEPq) | **100.5 万** / 17.0 万 / 6.13 万；最高到全站排行第 16 | 诺奖热点 | 2:42 | 4K。简介专门写了澄清：这项技术不能读心，也不能遥控人 | 10-09 14:37 |
| 逸识YInsight（8353 粉，2 个投稿） | [《一次心跳的0.8秒》](https://www.bilibili.com/video/BV1V3Hz6REAG) | 59.7 万 / 9.16 万 / 4.36 万 | 心脏一拍的生理过程 | 2:05 | 开头让观众把手指搭在手腕上，概念先在观众身上发生一次 | 10-04 09:54 |
| 比特新语 | [2026诺贝尔物理学奖，冰立方中微子](https://www.bilibili.com/video/BV1XWp76FEZR) | 56.7 万 / 5.44 万 / 1.41 万 | 诺奖热点 | 3:20 | — | 10-11 11:48 |
| 低调的神经全网同名（3428 粉） | [《临界点：为什么58%的努力跟没努力效果是一样的》](https://www.bilibili.com/video/BV1d6HW6UE76) | 48.0 万 / 2.72 万 / 2.25 万 | 渗流 / 临界点 + 努力 | 2:41 | 这个 BV 在 10-06 时署名「Tech即刻」，播放 209 | 10-05 18:19 |
| 在公司楼下捡钱 | [《我让两个AI互相问了1000个问题…》](https://www.bilibili.com/video/BV1x9pt6JEkh) | 45.7 万 / 4.26 万 / 1.88 万 | AI 讲 AI（两个 Claude Code 互相对话） | 4:06 | 「我做了一个实验」的讲法 | 10-10 10:10 |
| sadssxa | [《群论之美宣传片》](https://www.bilibili.com/video/BV12Zhm6oE6m) | 40.6 万 / 2.08 万 / 1.64 万 | 数学 | 4:23 | 标题「已吓哭」，卖的是 AI 震撼感 | 9-25 23:37 |
| 比特新语 | [「我爱你」说到第 1000 遍，信息量几乎为零](https://www.bilibili.com/video/BV1VVpo6gEMw) | 40.2 万 / 4.79 万 / 2.60 万 | **信息论 + 爱情**（信息论这个题又被做了一次） | 2:44 | — | 10-12 20:15 |
| 比特新语 | [两个一模一样的地方之间，是不会起风的](https://www.bilibili.com/video/BV1zVpJ6yEk6) | 33.1 万 / 5.56 万 / 1.84 万 | 风从气压差来（简介小标题《风的方向》） | 2:42 | 核查时补上的一条，原名单漏了 | 10-11 17:00 |
| 比特新语 | [《刷分的捷径》](https://www.bilibili.com/video/BV1cvpF6fEoc) | 31.3 万 / 2.32 万 / 0.86 万 | 古德哈特定律（指标一旦变成目标就不再是好指标） | 2:42 | — | 10-06 14:39 |
| 比特新语 | [看懂了熵增，就原谅了生活所有的力不从心…](https://www.bilibili.com/video/BV1u1p56EEDW) | 22.9 万 / 3.93 万 / 1.72 万 | 熵增 + 生活 | 2:51 | 标题就是一句情绪文案 | 10-11 10:51 |
| 比特新语 | [《余波》｜吵架后的沉默，会传多远？](https://www.bilibili.com/video/BV1Kpa26dE9e) | 19.8 万 / 3.42 万 / 0.97 万 | 社会传染 | 2:44 | 10-06 时署名「幼笙吖」，播放 78 | 10-02 17:16 |
| 嘿这里是江离 | [《混沌：毫厘之学》](https://www.bilibili.com/video/BV1YYaf6qEzD) | 19.6 万 / 3.20 万 / 1.09 万 | 混沌 / 蝴蝶效应 | 4:47 | 简介第一句：200 个摆，只差 0.001° | 9-30 23:30 |
| 比特新语 | [《什么是37法则？》](https://www.bilibili.com/video/BV13Aa66LEAW) | 17.0 万 / 2.52 万 / 1.64 万 | 最优停止 | 2:44 | 10-06 时署名「幼笙吖」、标题带「Vibe知识大赏」，播放 440 | 10-01 23:35 |
| 电子智人（5830 粉） | [《信息论 惊奇之学》](https://www.bilibili.com/video/BV1GXav6iEWh) | 13.9 万 / 1.28 万 / 1.19 万 | 信息论 | 5:01 | 4K，无旁白，中英双语，填空开场 | 9-28 05:56 |
| 路北路陈 | [震惊瘫坐！Opus 5.5 做的设计科普：为什么瑞士风格 70 年都不过时？](https://www.bilibili.com/video/BV1hWar6SEVP) | 12.5 万 / 0.64 万 / 1.01 万 | 设计史 | 4:13 | 画面直接用这期讲的风格来做。标题 10-06 时还没有「震惊瘫坐！」，后来加的 | 10-01 19:48 |
| 比特新语 | [《以牙还牙》](https://www.bilibili.com/video/BV1X8a16wEGh) | 13.3 万 / 1.86 万 / 0.95 万 | 博弈论（阿克塞尔罗德 1980 年的锦标赛） | 2:42 | 简介写明用代码重跑了 15 种策略、2.4 万回合 | 10-02 11:43 |
| 电子智人 | [《自指："我"是个怪圈》](https://www.bilibili.com/video/BV1ZZHo6LEEa) | 5.49 万 / 0.29 万 / 0.35 万 | 自指 | 5:35 | 4K | 10-06 05:00 |

【实证】以上数字全部来自各条视频的 `view` 接口。比特新语账号数据来自 [card 接口](https://api.bilibili.com/x/web-interface/card?mid=3494362707135250)，江离来自 [card 接口](https://api.bilibili.com/x/web-interface/card?mid=1592635496)，逸识来自 [card 接口](https://api.bilibili.com/x/web-interface/card?mid=256623626)，低调的神经来自 [card 接口](https://api.bilibili.com/x/web-interface/card?mid=431137074)。

**注意：**这些片子是不是都用 Claude 代码做的，大多没有作者自述。我是按以下几点判断的：画面同类、出现在同一推荐链里、弹幕里有人点名「一眼 Claude」，以及 10-06 时标题还带「Vibe知识大赏」。【推断】

### 2.2 抖音（10-06 快照，这次没能更新）

| 账号 | 代表作 | 点赞（快照，只会偏低） | 题材 | 时长 | 发布 |
|---|---|---|---|---|---|
| 电子智人（约 6.7 万粉） | 信息论 惊奇之学 | **81.4 万**（收藏 19.8 万、分享 18.2 万） | 信息论 | 5:01 | 9-28 05:58 |
| Iwanau（3.30 万粉） | 月老的算法 | 约 36.2 万 | 稳定匹配 | — | ≤9-29 |
| Iwanau | 运气的形状 | 35.3 万（收藏 7.13 万） | 概率 | 2:10 | 9-28 06:25 |
| 骑老爷爷过马路被罚300 | opus家族史 | 15.6 万 | AI 模型史 | 2:57 | 9-23 16:32 |
| 长空 | 晚出门一分钟，还会遇见你吗？ | 13.3 万 | 蝴蝶效应 + 缘分 | — | 未确认 |
| 比特新语 | 所有文明都酿酒 | 8.93 万 | 酒与人类史 | — | 未确认 |
| 「37% 法则」4 个作者 | 4 条同题 | 16.0 万 / 17.8 万 / 6.2 万 / 5.7 万 | 最优停止 | — | 9 月底 |

来源：【实证/转述】`3_第三版资料/调研/C_抖音话题与电子智人.md` §2（含 10-06 核查），以及 Rainorb [BV1YCHW62ECA](https://www.bilibili.com/video/BV1YCHW62ECA) 的画面读数。**10-07 以后抖音上谁在爆，这次查不到（未核实）。**

### 2.3 从两张表看出的规律

| 规律 | 证据 | 等级 |
|---|---|---|
| **标题写痛处或生活场景，学名放后面或者干脆不写** | 「最痛的，不是失败，是差一点」「为什么58%的努力跟没努力效果是一样的」「「我爱你」说到第 1000 遍」「看懂了熵增，就原谅了…」 | 【实证（标题）】 |
| **B 站的爆款去掉了「Vibe知识大赏」前缀** | 37 法则、以牙还牙、余波：10-06 时都带前缀，现在都去掉了。同一账号 10-06 时另外两条带前缀的（《涌现》BV1vXHr6eEoN、期望效用 BV1mgHh6pEuf）也去掉了前缀，换成了「参数的史诗」「你不是不理性，你只是只有一次人生」这种句子，播放从 144、62 涨到 5.6 万、1.5 万 | 【实证（前后对比）+ 推断（作者主动改的）】 |
| **片长集中在 2:40 左右** | 比特新语的 16 个投稿全部查到了，15 条是 160–171 秒，只有冰立方是 200 秒；临界点 161 秒；心跳 125 秒。例外是江离（约 4:50）和电子智人（5:01–5:35） | 【实证】 |
| **同一个题可以再做，换角度就行** | 信息论被比特新语换成「我爱你说 1000 遍」，40 万；熵被换成「原谅力不从心」，23 万 | 【实证】 |
| **热点不用抢第一天** | 诺奖三条都是奖项公布 3 到 5 天后才发的，医学奖那条 100 万。医学奖 10-05、物理奖 10-06、化学奖 10-07 公布，片子是 10-09、10-11、10-10 发的 | 【实证】发布时间来自 B 站接口；公布日期见 [Business Today 赛程](https://www.businesstoday.in/science/story/nobel-prize-2026-winners-stage-set-for-announcements-from-october-5-check-details-559195-2026-10-02)、[半岛电视台（物理奖）](https://aljazeera.com/news/2026/10/6/francis-halzen-wins-nobel-prize-in-physics-for-work-on-ghost-particles)、[zamin.uz（化学奖）](https://zamin.uz/en/world/223906-nobel-prize-in-chemistry-2026-laureates-announced.html) |
| **高频更新的账号会带起老视频** | 比特新语从 10-01 到 10-12 约 12 天里，账号上有 16 个投稿。10-08 银牌爆了以后，10-01 到 10-02 发的几条从几百播放涨到十几万 | 【实证（数字）+ 推断（因果）】 |
| **小号能爆，B 站的推荐不太看粉丝数** | 3428 粉的号 48 万，8353 粉的号 59.7 万 | 【实证】 |
| **「AI 讲 AI」和大学科名单独拿出来已经不吃香** | Rainorb 统计「AI 与计算机」类火的比例约 6.7%，全类最低（画面读数，简介里没有，（未核实））；10-13 的「博弈论｜代价之学」只有 2602 播放。反例：10-10 的「两个 AI 互相问了 1000 个问题」有约 46 万 | 【转述 + 实证】 |

---

## 3. 饱和程度的信号

| 信号 | 数据 | 来源 | 说明 |
|---|---|---|---|
| 抖音话题的规模 | 661 条视频、1.2 亿播放（截至 10-04，写在简介里）；425 个作者、中位数 274 赞、前 5 个作者拿走 51% 的赞（只在画面里，（未核实）） | 【转述】[Rainorb BV1YCHW62ECA](https://www.bilibili.com/video/BV1YCHW62ECA) | 一半视频不到 300 赞（未核实） |
| 抖音日新增 | 从 9-23 的 1 条涨到 10-03 的 156 条（画面读数，（未核实）） | 同上 | 10-04 回落到约 78 条（未核实） |
| B 站标签用量 | 「vibe知识大赏」标签 523 次（标签 9-30 创建） | 【实证】[tag 接口](https://api.bilibili.com/x/tag/info?tag_name=vibe知识大赏) | 只算挂了这个标签的，去掉前缀的爆款不在里面 |
| 复刻 skill 扎堆 | GitHub 上按「vibe知识大赏」搜到 8 个仓库，全部建于 10-03 到 10-14（UTC）；其中 6 个是 skill 或工具，wwwyh007/Vibe-GPT-Evolution 和 shij8396/vibe-knowledge-awards 是单个作品。按 vibe knowledge video 搜，还有 AlbertPine、chenmingyu12345、aaay313 三个 10 月新建的同类仓库 | 【实证】[GitHub 搜索 1](https://api.github.com/search/repositories?q=vibe知识大赏&sort=stars)、[搜索 2](https://api.github.com/search/repositories?q=vibe+knowledge+video&sort=stars) | 最火的 HeyChengC/vibe-knowledge-film 有 252 星、40 个复刻 |
| 逆向爆款原片 | 有仓库说逐秒分析了 8 条抖音爆款原片、1091 帧；还有仓库直接放了别人的片子当学习样例 | 【实证】[xiazhuo123456789/vibe-knowledge-video](https://github.com/xiazhuo123456789/vibe-knowledge-video)、[HeyChengC](https://github.com/HeyChengC/vibe-knowledge-film) | 说明这套样子已经被写成了说明书 |
| 卖 skill、拿提示词换关注 | V2EX 回复说同质化的 skill 被人搬运去卖（原话「同质化的被各个人搬运卖」），还提到闲鱼；B 站 UP 置顶「点赞关注即可获取提示词」 | 【实证】[V2EX t/1247139](https://www.v2ex.com/t/1247139)（帖子 10-08 18:21 发，这条回复 10-08 19:43，按 [V2EX 接口](https://www.v2ex.com/api/replies/show.json?topic_id=1247139) 时间）；【实证】[汤姆CC 评论区](https://api.bilibili.com/x/v2/reply?type=1&oid=117416319326055&sort=1)（视频 10-10 发，这条置顶评论的接口时间是 10-14 22:10） | 10-02 的 39 分钟教程也是靠「知识库」加中转站引流（旧调研） |
| 教程需求 | 「来真的」39 分钟教程 5.4 万播放、4879 收藏、1016 条评论；「15 种风格」盘点 5.7 万播放、7577 收藏 | 【实证】[BV1j8aS6UEty](https://api.bilibili.com/x/web-interface/view?bvid=BV1j8aS6UEty)、[BV1JvaW6JEMb](https://api.bilibili.com/x/web-interface/view?bvid=BV1JvaW6JEMb) | 收藏率高，说明想学着做的人多 |
| 弹幕里的疲劳 | 「天天都是这种Claude视频」「依旧一眼ai流水线产品」「已经刷到好几个视频了」 | 【实证】光遗传学、银牌、涌现的弹幕接口（见 §5） | 10 月新出现的骂法 |
| 命名被套用 | 「X 的形状」至少 6 个仿作（10-06 统计）；「X之学」被照搬，2602 播放 | 【转述】旧调研 §4；【实证】相关推荐接口 | — |
| 反面：需求还在 | 10-02 到 10-12 发的同类片，B 站我们找到的就有 11 条过 20 万（10-14）；10-15 上午余波也到了 22.0 万，变成 12 条 | 【实证】§2.1 | 饱和的是做法，不是观众的兴趣 |

**我的判断**【推断】：现在是「做法饱和、需求没饱和」。用默认提示词出的黑底金字片，供给已经过剩，观众也认得出来。但只要标题戳中人、题选得准、时机对，单条还是能到几十万甚至上百万。

---

## 4. 别人公开分享的做法

### 4.1 开源的「复刻 vibe 风格」skill（全是 10 月新建的）

| 仓库 | 星 / 复刻（10-14） | 建立 | 归纳出的规格 | 来源 |
|---|---|---|---|---|
| HeyChengC/vibe-knowledge-film | 252 / 40 | 10-06 | 两种画风：「夜曲」（暗底，讲难懂的底层知识）和「寓言」（小人和场景，讲心理与行为）。先出约 30 秒样片，确认后再做全片。Canvas 逐帧画（Canvas 是浏览器里的画布），自动配音效，BGM 自己加 | 【实证】[仓库](https://github.com/HeyChengC/vibe-knowledge-film) |
| xiazhuo123456789/vibe-knowledge-video | 27 / 4 | 10-09 | 1920×1080、30fps；2:00–2:45；无旁白，纯器乐 BGM 76–78 BPM；深蓝黑底 #0A0A1E；六段式：冷开场钩子 → 历史锚点 → 机制动画 → 反直觉转折 → 现实落点 → 引用和免责声明；静止的秒数不超过 25%。致谢 @Iwanau、@Juno、叁号暗房 Logos | 【实证】[仓库](https://github.com/xiazhuo123456789/vibe-knowledge-video)、[API](https://api.github.com/repos/xiazhuo123456789/vibe-knowledge-video) |
| LuZhong-Li/vibe-knowledge-video-skill | 10 / 2 | 10-08 | 120–150 秒；暗底 #0A0A0A，暖白字，香槟金强调；没有旁白，所以每句都要留在屏上，正文不小于 52px；结构是钩子 → 实证 → 命名 → 迁移 → 机制 → 金句，共 7–8 屏；钩子屏 4–6 秒，先给现象，术语放后面；禁止弹跳、打字机、故障闪烁和霓虹。对标 7 部：运气的形状、37% 法则、复利、电击按钮实验等 | 【实证】[仓库](https://github.com/LuZhong-Li/vibe-knowledge-video-skill)、[API](https://api.github.com/repos/LuZhong-Li/vibe-knowledge-video-skill) |
| zhaosenlin12-creator/vibe-know--skill | 4 / 1 | 未显示 | 90–180 秒；同样分「夜曲」和「寓言」两种画风；样例有学习成瘾、习得性无助、熵、旁观者效应；数字和年份都要有出处 | 【实证】[仓库](https://github.com/zhaosenlin12-creator/vibe-know--skill) |
| 其他 | Jogzh/concept-reel（10-13）、Trmachel/vibe-knowledge-director（10-14）、Buffaiai/vibe-knowledge-award（10-14，带文献核查）、AlbertPine、chenmingyu12345、aaay313 等 | 10-09 到 10-14 | — | 【实证】GitHub 搜索接口 |

**共同点**【推断】：这些仓库都在把「暗底 + 无旁白 + 双语字幕 + 合成配乐 + 2 分钟左右 + 钩子 → 机制 → 落点」写成死规矩。照着做，出来的就是观众已经看腻的那个样子。

### 4.2 教程和提示词（10 月新增的部分；更早的见旧调研）

| 谁 | 内容 | 日期 | 来源 |
|---|---|---|---|
| X 长文《用Opus5.5起号真的太爽了》 | 三条测试片（片名《奥德赛时期》《局部最优解》《最后相遇定理》（未核实））用小号发，一共涨粉 600 多，其中一条小爆，播放 10 万+；作者还说一条片约两小时做完、收到几笔付费咨询（10-15 的搜索摘要里有这些，都是作者自述）。方法：开头先写观众的处境，再讲知识，不讲历史、不出术语；钩子用一句引语、一个数字或一个提问，为 17 秒左右的高潮蓄力，高潮踏准配乐（这几条 10-15 的搜索摘要里有）。「先定锚词」「带 #Vibe知识大赏 并 @抖音科技」只在 10-14 的摘要里出现过，10-15 没再搜到（未核实） | 10-09 | 【转述】[X 文章](https://x.com/Tom_CC_9986/article/2108512799517450287)（原文 402，来自搜索摘要） |
| 汤姆CC的AI工具箱《爆火的Vibe知识到底怎么做的？》 | 5:44，6096 播放、487 收藏（10-15 上午 6847 播放、570 收藏）。弹幕在 10-15 上午一共 21 条，其中 15 条是「有，喜欢看」、5 条「没见过」（逐条数过；20 条是 10-14 到 10-15 才发的，数字还在变）。提示词要点赞关注才给 | 10-10 19:16 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1uBpg6qEYM)；和上一条大概是同一个人（名字对应，未核实） |
| V2EX 求助帖 | 楼主用 Remotion（一种用 React 网页代码写视频的工具）做了几次都很差。回复建议「人在环中」，也就是人一步步把关 | 10-08 | 【实证】[V2EX](https://www.v2ex.com/t/1247139) |
| 旧调研已记的 | 来真的 39 分钟教程的 10 条提示词技巧、路北路陈的「两个 AI 分工」、余弦的 HANDOFF 交接文档、风之谷AI 的 380 字提示词等 | 9 月底到 10 月初 | `3_第三版资料/调研/A_中文教程与作者自述.md`、`3_第三版资料/学习/圈内总结.md` |

---

## 5. 观众的夸奖和抱怨

引用都来自 B 站评论和弹幕接口原文，每条不超过 15 个字。

### 5.1 抱怨

| 类别 | 原话（点赞或出现位置） | 出处 |
|---|---|---|
| 同质化、审美疲劳 | 「最近这种同质化高质视频好多」（176 赞）；「刷多了有点审美疲劳了」 | 涌现 [评论](https://api.bilibili.com/x/v2/reply?type=1&oid=117369561159694&sort=1) |
| 一眼 AI | 「一眼Claude做的」；「依旧一眼ai流水线产品」；「天天都是这种Claude视频」 | 涌现 [弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42388423338)；银牌 [弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42561440259)；光遗传学 [弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42586016012) |
| 配乐和风格被认出来 | 「太明显了这个配乐和风格」；「bgm一响，opus登场」 | 光遗传学弹幕 |
| AI 文案味 | 「一眼gpt，味大」（19 赞）；「ai断句ai文案」；「能不能别直接用ai的文案」 | 涌现评论、光遗传学弹幕、涌现弹幕 |
| 太快、看不懂 | 「不暂停压根看不明白」；「这视频没有旁白只能暂停着看」；「视频太快了 来不及细看」；「但又感觉啥也没看懂」 | 光遗传学弹幕 |
| 语气太玄 | 「神神叨叨的，像宗教口吻」；「整的一惊一乍的」；「BGM来点平缓的行吗？」 | 涌现弹幕 |
| 事实错误 | 「能看出来是ai瞎编的了」（萤火虫那段）；「这里AI演绎有错误」（脑神经那段） | 涌现弹幕 |
| 不标 AI | 「ai生成也不标吗」；另一条（20 赞）要求标注，「不要欺骗」不懂 AI 的观众 | 涌现评论 |
| 新鲜感消退（9 月就有） | 「AI作品越来越多，惊奇度就下降」（415 赞） | 信息论评论（旧调研 `圈内总结.md` §3.1） |

### 5.2 夸奖

| 类别 | 原话 | 出处 |
|---|---|---|
| 被打动 | 「看哭了呜呜呜呜」；「这是，艺术品啊」；「震撼，无与伦比」 | 涌现弹幕 |
| 画面就是概念 | 「这一段闪烁变成心跳神了」 | 涌现弹幕 |
| 讲得清楚 | 「敘述節奏舒服，邏輯清晰」 | 光遗传学弹幕 |
| 醍醐灌顶 | 「醍醐灌顶」；「卧槽醍醐灌顶 原来对数是这样用的」（9 月） | 银牌弹幕；信息论弹幕（旧调研） |
| 关注 | 「高质博主，关注了」；「这就是我来看B站的意义」 | 银牌弹幕 |
| 音效 | 「这个音效听的我鸡皮疙瘩起来了」 | 银牌弹幕（17 秒处） |
| 自己接金句、参与 | 「比上不足，比下有余」「一人之下，万人之上」，还有大量「第二名是头号输家」 | 银牌弹幕 |
| 只为音乐也愿意看 | 「看似研究学问，实则欣赏音乐」（1.22 万赞） | 运气的形状抖音评论（旧调研） |

### 5.3 归纳【推断】

- 观众**不反对 AI 做**，反对的是**一眼就是 AI 默认做法**，以及 **AI 编错事实**。
- 「看不懂、太快、只能暂停」是这类无旁白片的通病。2 分 40 秒塞进一整个学科的片子，最容易挨这句骂。
- 最能带动互动的是**人人都经历过的场景**。银牌那条 0 秒就有人刷「李宗伟」「王楚钦」，观众自己把概念套到熟悉的人身上。

---

## 6. 国外类似的东西，有什么能迁移

| 对象 | 是什么 | 数据 | 能迁移的 | 来源 |
|---|---|---|---|---|
| X 上的 Opus 5.5 视频（「海外为主」是推断，统计页没写发帖人来自哪里） | athemeroy 统计了 1401 个视频文件（从 X 搜索抓的） | 游戏/互动约两成（230 个，20.6%）、广告/发布约两成（215 个，19.2%），分母 1119。「科普/教育」在「题材 × 画风」表的前十格里只出现两格：动态图形 55 个、平面卡通 25 个（合计约 7%）；页面没给科普/教育的总数，所以「只占小头」是推断。快照时间 9-26 | 海外没有形成「AI 知识短片」这样一个独立话题，**vibe知识大赏 基本是中文圈的现象**【推断】。所以带双语字幕的片子出海，竞争可能更小（未核实） | 【实证】[statistics.md](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/statistics.md) |
| 3Blue1Brown | 数学讲解频道，2015 年起。画面用作者自己写的 Python 动画库 Manim（专门用来做数学讲解动画的开源工具） | 849 万订阅（维基，2026-07-19）；3b1b/manim 95,066 星（10-14） | 先具体后抽象，先给例子再给框架；SoME 评选要求 30 秒内让人明白为什么值得关心 | 【实证】[维基](https://en.wikipedia.org/wiki/3Blue1Brown)、[GitHub API](https://api.github.com/repos/3b1b/manim)；[SoME 说明](https://www.3blue1brown.com/blog/some1/)（第二版调研引用） |
| Kurzgesagt | 德国的动画科普工作室 | 2560 万订阅（维基，2026-10-05），约 70 人团队 | 先研究再写，公开过研究和核查流程。我们最缺的就是「片子讲的每件事都有出处」，而观众已经在弹幕里抓 AI 的错 | 【实证】[维基](https://en.wikipedia.org/wiki/Kurzgesagt)；[Medium：研究与核查流程](https://medium.com/@Kurzgesagt/how-research-and-factchecking-work-at-kurzgesagt-f5b239188255)（第二版调研引用） |
| Bartosz Ciechanowski（ciechanow.ski） | 交互式长文，比如《Moon》（2024-12-17）。读者可以拖动 3D 场景、用滑块调参数，看结果实时变化 | — | **「代码真算」**：画面里的数字和模型是程序真跑出来的。视频版就是「滑块拖一下，世界跟着变」的镜头。以牙还牙那条简介写明代码重跑了 15 种策略、2.4 万回合，就是这个路数 | 【实证】[ciechanow.ski](https://ciechanow.ski/)；[以牙还牙接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1X8a16wEGh) |
| Kurzgesagt 中文搬运（B 站） | 10-06 19:57 上传的 21 分钟 AI 主题片 | 12.0 万播放 | 高制作的长科普在 B 站照样有人看，片长不是死规矩 | 【实证】[接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1AXpc6KEMc) |
| YouTube 对「批量、重复内容」的变现规则 | 2025 年 7 月起收紧对批量生产、重复内容的变现（据我记忆） | — | 如果出海，同一模板批量产出会有风险 | （未核实，政策页这次没抓到） |

**可迁移的三件事**【推断】：

1. **3Blue1Brown 式的「先给你看，再告诉你名字」。** 和我们「开头 10 秒让概念在观众身上发生一次」是一回事。
2. **Kurzgesagt 式的来源清单。** 片尾或简介列 3–5 条来源，置顶评论写一条「容易被误解的地方」。比特新语光遗传学那条在简介里主动澄清「不能读心」，就是这个做法。
3. **Ciechanowski 式的「真算」。** 不画示意图，让代码跑真的模拟，并把参数和次数写在屏上。

---

## 7. 结论

### 7.1 现在有效的套路（有数据支撑）

| 套路 | 例子 | 数据 |
|---|---|---|
| 标题是一句戳人的话，概念放副标题或者不写 | 银牌、临界点、我爱你 1000 遍、熵增原谅力不从心 | 116 万 / 48 万 / 40 万 / 23 万 |
| 开头用一个人人经历过、马上能做的动作或场景 | 手指搭手腕（心跳）；领奖台（银牌）；鸟群同时转向（涌现） | 59.7 万 / 116 万 / 174 万 |
| 蹭能提前知道日期的大热点，晚几天也行 | 诺奖三连 | 100 万 / 56.7 万 / 13 万 |
| 2 分 40 秒左右、高频更新 | 比特新语约两周 16 条，多数 2:42 | 账号 14.4 万粉 |
| 用代码真跑实验，把次数写出来 | 以牙还牙（2.4 万回合）；混沌（200 个摆）。原稿还写了一条「后悔（3000 万次模拟），0.5 万」，正文和来源里都找不到是哪条视频（未核实），已删 | 13 万 / 19.6 万（不保证爆，但是加分项） |
| 简介主动纠错或澄清 | 光遗传学「不能读心」 | 100 万 |
| 结尾落到「你」 | 涌现：你以为自己只是一个小点 | 174 万 |

### 7.2 已经被用烂的（我们要避开）

| 用烂的东西 | 证据 |
|---|---|
| **黑底 + 金色光点 + 细宋体 + 中英双语 + 氛围钢琴，原样照搬** | 观众点名「一眼Claude」「bgm一响，opus登场」；GitHub 上 6 个以上的 skill 仓库把它写成了规矩 |
| 标题前缀「Vibe知识大赏｜」（至少在 B 站） | 爆款都去掉了；挂前缀的大多几百播放 |
| 「X 的形状」「X之学 · The art of …」式命名 | 仿作成批，10-13 的「代价之学」只有 2602 播放 |
| 「震惊瘫坐 / 吓哭了」这种卖 AI 震撼的标题 | 新鲜感已经吃完（「天天都是这种Claude视频」）。反例要知道：「已吓哭」的群论片 40.6 万、标题后来加了「震惊瘫坐！」的瑞士风格片 12.5 万，但都是 10-01 及以前发的早期片【推断】 |
| 信息论、熵、混沌、涌现、37%、复利、回归均值、以牙还牙这些题**用原角度**再做一遍 | 每个都有 3 到 6 个以上的版本；只有换成生活角度的才又爆了 |
| AI 讲 AI、模型家族史 | Rainorb：这一类火的比例最低（约 6.7%） |
| 节奏太快、整片无旁白、一屏塞多句 | 「不暂停压根看不明白」「太快了」 |
| 语气玄乎、一惊一乍 | 「神神叨叨的，像宗教口吻」 |

### 7.3 还没人做的空白（我们能差异化的地方）

以下「没人做」的意思是：在我看到的 B 站约 600 条同类标题（10-06 抓取）、10-06 的抖音题目清单，以及这次相关推荐里看到的约 120 条中，都没出现。抖音站内有没有人做过，没法查（未核实）。

| # | 空白 | 为什么是机会 | 例子（都要先做事实核查） |
|---|---|---|---|
| 1 | **垂直圈层题**：游戏、电竞、体育、二次元、乐器 | 题目扎堆在通识类，没人做「给某个圈子的人讲他们每天都在碰的那条定律」。受众集中，评论区好带 | 瓦罗兰特 / FPS：**希克定律**（Hick 1952，选项越多反应越慢）、**菲茨定律**（Fitts 1954，目标越小越远越难点中），开头 10 秒让观众亲自体验一次反应时间。电竞「意识」= 组块（见 11 号调研）。游戏画面必须用代码重画，不能截图 |
| 2 | **非诺奖的「有日期的热点」** | 现在只有诺奖被蹭过。拍卖、发射、节气、纪念日都能提前知道日期，我们一部片要做好几天，正好来得及 | 梵高《盛放的栗树》11-18 纽约拍卖（日期和估价见 05 号调研）；霜降、冬至；航天发射窗口（未核实） |
| 3 | **「形式即内容」的画风：画面就用讲的那个东西本身的样子** | 大家都在黑底金字里。路北路陈用「这期讲的风格」做画面，12.5 万播放、1 万收藏 | 讲梵高就用梵高的笔触和补色来画；讲色彩同时对比（谢弗勒尔 1839）就让观众看同一块灰在蓝底和橙底上变色。梵高和这条定律的关系（未核实） |
| 4 | **慢一点、能看懂的无旁白片** | 「太快」「只能暂停」是现在最常见的骂法，但没人把「慢」当卖点 | 一屏一句、字留够时间、全片只讲一个反转。我们 4:48 的长度正适合做「慢」，问题出在题和标题上 |
| 5 | **事实核查当招牌** | 观众已经在弹幕抓 AI 的错；绝大多数片子不列来源 | 片尾「本片核对过的 N 件事」加来源；置顶评论写「常见误解」 |
| 6 | **系列 + 评论区共创** | 信息论结尾那个空被几十条弹幕接住；但很少有人刻意设计「让观众接下一句」 | 每期留一个空或一个问题，下期开头回收观众的答案 |
| 7 | **中国本土的有名字的想法** | 头部作品几乎都是西方人名加年份 | 沈括《梦溪笔谈》里的磁偏角、都江堰的鱼嘴分水、钱学森的工程控制论（控制论已被电子智人用过，换角度）（均未核实是否有人做） |
| 8 | **出海**：双语字幕的英文版发 YouTube | 海外 AI 视频以游戏和广告为主，科普只占小头 | 我们本来就有英文字幕。YouTube 对批量内容的规则需要先查（未核实） |

---

## 对我们有什么用

### 可借鉴

1. **标题公式**（比特新语）：一句戳人的生活话 +「｜」+ 概念。例如「《银牌的眼泪》｜最痛的，不是失败，是"差一点"」。抖音和 B 站都**不要**把「Vibe知识大赏｜」放在最前面，话题标签里挂上就行。
2. **开头公式**（逸识、银牌）：0–3 秒给一个观众马上能做的动作，或者人人见过的场景。学名到 20 秒以后再出。这和我们 CONTRACT 里「开场让概念在观众身上发生一次」一致，但要**更日常、更快**。
3. **热点公式**（诺奖三连）：「今年 X 颁给了 Y：Y 到底是什么」，并在简介里写一句澄清（「它不能……」）。
4. **代码真算**：把模拟的次数写在屏上（「重跑了 2.4 万回合」）。这是 AI 默认片做不出来的可信度。
5. **双平台发**：我们的片子是 16:9、4–5 分钟，正是 B 站现在在推的形态。小号在 B 站已经被证明能起来，抖音发完同步发 B 站，成本几乎为零。

### 建议

1. **下一期不要再做「黑底金字 + 大学科名」。** 我们四部片的样子正是观众开始骂的那种【推断】。不是要全改掉，至少换一个变量：画风跟着题走（空白 3），或者题落在一个垂直圈层（空白 1）。
2. **蹭热点只蹭「有日期的」。** 我们做一部片要好几天，追突发来不及。最近能用的是梵高拍卖（11-18，见 05 号调研）。诺奖的例子说明晚几天也能爆，但片子必须讲清楚「到底是什么」，不能只是凑个热闹。
3. **梵高怎么蹭才符合我们的格式**：找一个有名字的想法（学名 · 人名 · 年份），用梵高当入口。候选（都未核实，做之前要事实核查）：
   - 《星月夜》的漩涡和湍流理论（柯尔莫哥洛夫 1941）的关系。有研究说漩涡的亮度分布接近湍流规律，原文要找到再说。
   - 色彩同时对比（谢弗勒尔 1839）。开头 10 秒让观众亲眼看「同一块颜色变了」，画面全片用补色。
   - 马太效应（默顿 1968）：生前卖不出画，死后拍出天价（05 号调研的建议）。
4. **瓦罗兰特这类垂直题**：希克定律、菲茨定律最贴，标题写给玩家看（比如「为什么你总是慢半拍开枪」），话题挂游戏名。受众集中，评论区会自己吵起来。事实核查和游戏画面重绘要算进工期。
5. **改掉最常挨骂的三处**：
   - 字幕停留时间加长（「太快」）。
   - 少用玄乎的句子（「像宗教口吻」）。
   - 片尾列来源（「ai瞎编」）。
6. **账本要更新撞题**：候选池《十亿次心跳》已经被「一次心跳的0.8秒」做了（59.7 万）。要做就换角度，比如只讲克莱伯定律（为什么小动物心跳快、寿命短），不讲一次心跳的过程。

### 要不要试

| 试法 | 成本 | 预期 | 建议 |
|---|---|---|---|
| 已发的两部原片同步发 B 站，标题改成痛点句，去掉前缀 | 很低（改标题、改简介） | B 站小号也能起来；最差也就是没人看 | **试**，这周就做 |
| 下一部做 2:40 版（同一个题，再剪一个短版） | 中（要重排节奏） | 比特新语的爆款几乎全是 2:42；我们的长版可以留在 B 站 | **试一部**做对照，看抖音完播率 |
| 梵高热点片（画风用梵高本人的） | 中高（事实核查 + 新画风） | 11-18 前后有天然的搜索量 | **试**，具体日期和角度和 05 号调研合着定 |
| 瓦罗兰特 / FPS 的希克定律片 | 中（游戏画面要代码重画） | 受众集中、评论好带；但抖音上游戏内容竞争大（未核实） | **试一部**，先和用户确认选题 |
| 加真人或克隆配音的版本 | 中（我们现在的流程是无旁白） | 可能解决「看不懂」，但会离开参考片的路子 | **先不试**，先用字幕放慢解决 |
| 复刻 skill 仓库（HeyChengC 等） | 低 | 只会让我们更像别人 | **不试**，最多读一下它们的「禁用清单」 |
| 英文版发 YouTube | 中 | 竞争可能小，但规则没查 | **暂缓**，先把国内号做起来 |

---

## 没查清的问题

1. 10-07 以后抖音 #vibe知识大赏 的头部作品和总量。抖音打不开，WebSearch 额度也用完了。
2. 比特新语、江离、逸识这几个号在抖音上的数据。
3. 抖音官方 10 月有没有对这个话题单独扶持。只有一篇 X 长文的转述。
4. 比特新语那几条老视频是作者主动改标题、去前缀，还是别的原因，以及爆发和改名的先后顺序。
5. ~~2026 年诺奖各奖项的准确公布日期~~ 10-15 已查清：医学奖 10-05（Deisseroth、Hegemann、Nagel，光遗传学）、物理奖 10-06（Halzen，IceCube）、化学奖 10-07（Kagan、Soai，不对称合成里的非线性效应和自催化）。诺奖官网仍然 403，日期来自新闻报道（见核实记录第二轮）。
6. 梵高在抖音到底热在哪（05、07 号调研也没核到），以及「歌词放映」是不是抖音上的真实话题（13 号调研也没核到）。
7. 垂直游戏题（瓦罗兰特等）在抖音上有没有人用这个类型做过。
8. YouTube 2025 年对批量内容的变现规则原文。

---

## 来源

**B 站公开接口（全部 2026-10-14 读取）**
- 视频信息（核查时补充）：[化学奖 BV14mpv6qEEf](https://api.bilibili.com/x/web-interface/view?bvid=BV14mpv6qEEf)、[风的方向 BV1zVpJ6yEk6](https://api.bilibili.com/x/web-interface/view?bvid=BV1zVpJ6yEk6)、[冰立方的相关推荐](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1XWp76FEZR)
- 视频信息：[信息论 BV1GXav6iEWh](https://api.bilibili.com/x/web-interface/view?bvid=BV1GXav6iEWh)、[控制论 BV1i9hd6aE5x](https://api.bilibili.com/x/web-interface/view?bvid=BV1i9hd6aE5x)、[自指 BV1ZZHo6LEEa](https://api.bilibili.com/x/web-interface/view?bvid=BV1ZZHo6LEEa)、[群论之美 BV12Zhm6oE6m](https://api.bilibili.com/x/web-interface/view?bvid=BV12Zhm6oE6m)、[瑞士风格 BV1hWar6SEVP](https://api.bilibili.com/x/web-interface/view?bvid=BV1hWar6SEVP)、[15 种风格 BV1JvaW6JEMb](https://api.bilibili.com/x/web-interface/view?bvid=BV1JvaW6JEMb)、[涌现 BV1CKa16mE83](https://api.bilibili.com/x/web-interface/view?bvid=BV1CKa16mE83)、[混沌 BV1YYaf6qEzD](https://api.bilibili.com/x/web-interface/view?bvid=BV1YYaf6qEzD)、[银牌的眼泪 BV12DHQ61EhT](https://api.bilibili.com/x/web-interface/view?bvid=BV12DHQ61EhT)、[光遗传学 BV1Fbpt6qEPq](https://api.bilibili.com/x/web-interface/view?bvid=BV1Fbpt6qEPq)、[冰立方 BV1XWp76FEZR](https://api.bilibili.com/x/web-interface/view?bvid=BV1XWp76FEZR)、[我爱你 BV1VVpo6gEMw](https://api.bilibili.com/x/web-interface/view?bvid=BV1VVpo6gEMw)、[熵增 BV1u1p56EEDW](https://api.bilibili.com/x/web-interface/view?bvid=BV1u1p56EEDW)、[刷分的捷径 BV1cvpF6fEoc](https://api.bilibili.com/x/web-interface/view?bvid=BV1cvpF6fEoc)、[余波 BV1Kpa26dE9e](https://api.bilibili.com/x/web-interface/view?bvid=BV1Kpa26dE9e)、[37 法则 BV13Aa66LEAW](https://api.bilibili.com/x/web-interface/view?bvid=BV13Aa66LEAW)、[以牙还牙 BV1X8a16wEGh](https://api.bilibili.com/x/web-interface/view?bvid=BV1X8a16wEGh)、[临界点 BV1d6HW6UE76](https://api.bilibili.com/x/web-interface/view?bvid=BV1d6HW6UE76)、[心跳 BV1V3Hz6REAG](https://api.bilibili.com/x/web-interface/view?bvid=BV1V3Hz6REAG)、[两个 AI BV1x9pt6JEkh](https://api.bilibili.com/x/web-interface/view?bvid=BV1x9pt6JEkh)、[汤姆CC BV1uBpg6qEYM](https://api.bilibili.com/x/web-interface/view?bvid=BV1uBpg6qEYM)、[来真的教程 BV1j8aS6UEty](https://api.bilibili.com/x/web-interface/view?bvid=BV1j8aS6UEty)、[Rainorb BV1YCHW62ECA](https://api.bilibili.com/x/web-interface/view?bvid=BV1YCHW62ECA)、[Kurzgesagt 搬运 BV1AXpc6KEMc](https://api.bilibili.com/x/web-interface/view?bvid=BV1AXpc6KEMc)、[错过の小曲 BV14hHC64EmD](https://api.bilibili.com/x/web-interface/view?bvid=BV14hHC64EmD)
- 相关推荐：[信息论的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1GXav6iEWh)、[银牌的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV12DHQ61EhT)、[涌现的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1CKa16mE83)、[熵增的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1u1p56EEDW)
- 账号卡片：[比特新语](https://api.bilibili.com/x/web-interface/card?mid=3494362707135250)、[嘿这里是江离](https://api.bilibili.com/x/web-interface/card?mid=1592635496)、[逸识YInsight](https://api.bilibili.com/x/web-interface/card?mid=256623626)、[低调的神经全网同名](https://api.bilibili.com/x/web-interface/card?mid=431137074)、[电子智人](https://api.bilibili.com/x/web-interface/card?mid=343143294)
- 评论：[银牌](https://api.bilibili.com/x/v2/reply?type=1&oid=117404105511372&sort=1)、[涌现](https://api.bilibili.com/x/v2/reply?type=1&oid=117369561159694&sort=1)、[自指](https://api.bilibili.com/x/v2/reply?type=1&oid=117390281019600&sort=1)、[汤姆CC](https://api.bilibili.com/x/v2/reply?type=1&oid=117416319326055&sort=1)
- 弹幕：[银牌](https://api.bilibili.com/x/v1/dm/list.so?oid=42561440259)、[涌现](https://api.bilibili.com/x/v1/dm/list.so?oid=42388423338)、[光遗传学](https://api.bilibili.com/x/v1/dm/list.so?oid=42586016012)、[汤姆CC](https://api.bilibili.com/x/v1/dm/list.so?oid=42625337423)
- 标签：[vibe知识大赏](https://api.bilibili.com/x/tag/info?tag_name=vibe知识大赏)、[Vibe知识](https://api.bilibili.com/x/tag/info?tag_name=Vibe知识)

**GitHub**
- 搜索：[q=vibe知识大赏](https://api.github.com/search/repositories?q=vibe知识大赏&sort=stars)、[q=vibe knowledge video](https://api.github.com/search/repositories?q=vibe+knowledge+video&sort=stars)
- [HeyChengC/vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film)、[xiazhuo123456789/vibe-knowledge-video](https://github.com/xiazhuo123456789/vibe-knowledge-video)、[LuZhong-Li/vibe-knowledge-video-skill](https://github.com/LuZhong-Li/vibe-knowledge-video-skill)、[zhaosenlin12-creator/vibe-know--skill](https://github.com/zhaosenlin12-creator/vibe-know--skill)、[shij8396/vibe-knowledge-awards](https://github.com/shij8396/vibe-knowledge-awards)
- [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts)（328 星）、[athemeroy statistics.md](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/statistics.md)
- [3b1b/manim API](https://api.github.com/repos/3b1b/manim)、[remotion-dev/remotion API](https://api.github.com/repos/remotion-dev/remotion)（64,065 星）

**其他**
- X：[@hyh1564069 新赛道帖](https://x.com/hyh1564069/status/2105969300293243379)、[Tom_CC 长文](https://x.com/Tom_CC_9986/article/2108512799517450287)（原文 402，只用了搜索摘要）
- [V2EX：抖音的 vibe 大赏系列视频，是如何制作的？](https://www.v2ex.com/t/1247139)
- 维基百科：[3Blue1Brown](https://en.wikipedia.org/wiki/3Blue1Brown)、[Kurzgesagt](https://en.wikipedia.org/wiki/Kurzgesagt)、[诺贝尔生理学或医学奖得主列表](https://en.wikipedia.org/wiki/List_of_Nobel_laureates_in_Physiology_or_Medicine)、[诺贝尔物理学奖得主列表](https://en.wikipedia.org/wiki/List_of_Nobel_laureates_in_Physics)、[Karl Deisseroth](https://en.wikipedia.org/wiki/Karl_Deisseroth)、[Francis Halzen](https://en.wikipedia.org/wiki/Francis_Halzen)
- Anthropic：[Claude Opus 5.5 发布页](https://www.anthropic.com/claude-opus-5-5)
- [ciechanow.ski](https://ciechanow.ski/)
- [掘金：真人+AI 短剧激励](https://juejin.cn/post/7695437620617986102)（只见搜索摘要）

**本项目旧调研（数据口径和核查见原文件）**
- `3_第三版资料/调研/C_抖音话题与电子智人.md`（抖音 10-06 快照 + 核查）
- `3_第三版资料/调研/B站候选清单.md`（B 站 10-06 快照，用来做前后对比）
- `3_第三版资料/调研/A_中文教程与作者自述.md`、`3_第三版资料/学习/圈内总结.md`
- 同目录：`05_抖音流量打法与快速起号.md`（梵高拍卖日期）、`06_垂直冷门选题脑暴.md`、`07_找热点的工具.md`、`11_用户题_认知形成与知行差距.md`、`13_Folia与歌词可视化软件.md`

---

## 核实记录（10-14）

核查员 10-14 晚上逐条重新打开了链接。B 站数字是实时值，和正文差几千播放属于正常增长，不算错。WebSearch 额度在核查时已用完，只用了 WebFetch；抖音网页、诺奖官网、路透社、新浪这次都打不开。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| 《opus家族史》9-23 16:32 是已知最早的「Vibe知识大赏｜」标题；控制论 9-26 23:28；信息论 9-28 05:58 | ✅ 作品 ID 解码出的北京时间和正文一致；作者和标签沿用旧调研 10-06 的作品页核查。「最早」只是没找到更早的 | [opus家族史](https://www.douyin.com/video/7688645727061272805)、[信息论](https://www.douyin.com/video/7690337875291950345)、[控制论](https://www.douyin.com/video/7689866306497170697)（本次打不开）；`3_第三版资料/调研/C_抖音话题与电子智人.md` 核查节 |
| B 站「vibe知识大赏」标签 9-30 00:19 创建，523 次使用 | ✅ 创建时间一致；现在 525 次 | [tag 接口](https://api.bilibili.com/x/tag/info?tag_name=vibe知识大赏) |
| 不是官方活动，名字照 #vibecoding大赏 起的（8-31 截止） | ⚠ 抖音话题页本次打不开，沿用旧调研 10-06 的核查；「没有规则页」是没找到，不是证明没有 | [话题页](https://www.douyin.com/hashtag/7601419125595834406) |
| 涌现：174.4 万播放、21.0 万赞、8.47 万收藏、最高排行第 61、10-02 13:11、4:52；江离 3.26 万粉、9 个投稿；置顶说「保持日更」 | ✅ 接口值 174.5 万 / 21.0 万 / 8.48 万，his_rank 61，292 秒；粉丝 32723、投稿 9；置顶评论有这句 | [涌现](https://api.bilibili.com/x/web-interface/view?bvid=BV1CKa16mE83)、[江离](https://api.bilibili.com/x/web-interface/card?mid=1592635496)、[评论](https://api.bilibili.com/x/v2/reply?type=1&oid=117369561159694&sort=1) |
| 比特新语 14.4 万粉、16 个投稿、获赞 60.6 万 | ✅ 现在 14.6 万粉、16 个投稿、获赞 61.3 万 | [card](https://api.bilibili.com/x/web-interface/card?mid=3494362707135250) |
| 银牌的眼泪 116.2 万、2:42、10-08 15:31，简介引卡尼曼 1982 误机故事 | ✅ 现在 117.2 万，162 秒，时间一致，简介确有 1982 卡尼曼的故事 | [银牌](https://api.bilibili.com/x/web-interface/view?bvid=BV12DHQ61EhT) |
| 光遗传学片 100.5 万、17 万赞、最高排行第 16、10-09 14:37；简介澄清不能读心、不能遥控人 | ✅ 101.0 万、17.1 万赞、his_rank 16；简介有「它读不了心」 | [光遗传学](https://api.bilibili.com/x/web-interface/view?bvid=BV1Fbpt6qEPq) |
| 冰立方 56.7 万（10-11）；化学奖那条 13 万 | ✅ 冰立方 56.7 万、10-11 11:48、200 秒；化学奖那条原文没给链接，核查时找到是 BV14mpv6qEEf，13.1 万、10-10 15:30，已补进正文 | [冰立方](https://api.bilibili.com/x/web-interface/view?bvid=BV1XWp76FEZR)、[化学奖](https://api.bilibili.com/x/web-interface/view?bvid=BV14mpv6qEEf) |
| 2026 医学奖：光遗传学（Deisseroth、Hegemann、Nagel）；物理奖：IceCube（Halzen） | ✅ 维基列表一致 | [医学奖列表](https://en.wikipedia.org/wiki/List_of_Nobel_laureates_in_Physiology_or_Medicine)、[物理奖列表](https://en.wikipedia.org/wiki/List_of_Nobel_laureates_in_Physics) |
| 诺奖片「公布几天后才发」 | ⚠ 只能从维基人物词条的参考文献日期推：医学奖约 10-05、物理奖约 10-06。化学奖日期（未核实）。已在正文写明（第二轮已查清：10-05 / 10-06 / 10-07，见下表） | [Karl Deisseroth](https://en.wikipedia.org/wiki/Karl_Deisseroth)、[Francis Halzen](https://en.wikipedia.org/wiki/Francis_Halzen) |
| 小号能爆：低调的神经（3428 粉）临界点 48.0 万；逸识（8353 粉、2 个投稿）心跳 59.7 万 | ✅ 3439 粉 / 48.0 万 / 10-05 18:19；8361 粉、2 个投稿 / 59.7 万 / 10-04 09:54 | [临界点](https://api.bilibili.com/x/web-interface/view?bvid=BV1d6HW6UE76)、[低调的神经](https://api.bilibili.com/x/web-interface/card?mid=431137074)、[心跳](https://api.bilibili.com/x/web-interface/view?bvid=BV1V3Hz6REAG)、[逸识](https://api.bilibili.com/x/web-interface/card?mid=256623626) |
| 心跳片开头让人把手指搭在手腕上，讲一生约 30 亿次心跳 | ✅ 简介原文有「搭在你的手腕上」和「一生约 30 亿次」 | [心跳](https://api.bilibili.com/x/web-interface/view?bvid=BV1V3Hz6REAG) |
| 同一 BV 号 10-06 带前缀、署名幼笙吖或 Tech即刻、78–440 播放；10-14 去前缀、13–20 万（37 法则、以牙还牙、余波、临界点） | ⚠ 37 法则、以牙还牙、余波属实（10-06：440 / 122 / 78，署名幼笙吖，带前缀；现在 17.1 万 / 13.6 万 / 19.8 万，署名比特新语）。**临界点 10-06 的标题本来就没有前缀**（署名 Tech即刻，209 播放），现在 48 万，不在 13–20 万里。已改正文 | `3_第三版资料/调研/B站候选清单.md` 第 54、67、85、98 行；[37 法则](https://api.bilibili.com/x/web-interface/view?bvid=BV13Aa66LEAW)、[以牙还牙](https://api.bilibili.com/x/web-interface/view?bvid=BV1X8a16wEGh)、[余波](https://api.bilibili.com/x/web-interface/view?bvid=BV1Kpa26dE9e) |
| 比特新语 10 条里 9 条片长 160–171 秒 | ✅ 偏保守：核查时看到 15 条，14 条在 160–171 秒，只有冰立方 200 秒（第二轮：16 个投稿全部查到，15 条在 160–171 秒） | [银牌的相关推荐](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV12DHQ61EhT)、[冰立方的相关推荐](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1XWp76FEZR) |
| 一句话结论「7 条在 20–60 万」、§3「10 条过 20 万」 | ⚠ 漏了比特新语《两个一模一样的地方之间，是不会起风的》（10-11，33.1 万）。改成「至少 8 条」「11 条」，并补进 §2.1 | [风的方向](https://api.bilibili.com/x/web-interface/view?bvid=BV1zVpJ6yEk6) |
| GitHub 带「vibe知识大赏」的仓库 8 个，10-03 到 10-14 建；HeyChengC 10-06 建、252 星、40 复刻；10-14 新建 2 个 | ✅ 数字都对。⚠ 但正文 §0 说「8 个 skill」不准：其中 Vibe-GPT-Evolution 和 vibe-knowledge-awards 是单个作品，不是 skill。已改正文 | [GitHub 搜索](https://api.github.com/search/repositories?q=vibe知识大赏&sort=stars)、[搜索 2](https://api.github.com/search/repositories?q=vibe+knowledge+video&sort=stars) |
| xiazhuo 仓库：逆向 8 条抖音爆款原片、1091 帧、2:00–2:45、无旁白、76–78 BPM、#0A0A1E、六段式、静止秒 <25%、致谢 Iwanau 等 | ✅ README 逐项都有；第六段原文是「声明+引用收尾」 | [xiazhuo123456789/vibe-knowledge-video](https://github.com/xiazhuo123456789/vibe-knowledge-video) |
| HeyChengC 两种画风夜曲/寓言、先出约 30 秒样片、Canvas 逐帧、放了别人的片子当样例；LuZhong-Li 规格；zhaosenlin12 规格 | ✅ README 都对得上 | [HeyChengC](https://github.com/HeyChengC/vibe-knowledge-film)、[LuZhong-Li](https://github.com/LuZhong-Li/vibe-knowledge-video-skill)、[zhaosenlin12](https://github.com/zhaosenlin12-creator/vibe-know--skill) |
| V2EX 回复说闲鱼上的 skill「同质化严重」、被搬运倒卖（约 10-08） | ⚠ 内容属实，但原话不是「同质化严重」，是「同质化的被各个人搬运卖」。~~帖子是 10-09 10:35 发的，不是 10-08~~（第二轮更正：10-09 10:35 是楼主自己回复的时间；帖子 10-08 18:21 发，这条回复 10-08 19:43，「约 10-08」本来是对的） | [V2EX t/1247139](https://www.v2ex.com/t/1247139) |
| B 站 UP 主置顶「点赞关注即可获取提示词」（10-10） | ⚠ 原话一字不差；但 10-10 是视频发布时间，这条置顶评论的接口时间是 10-14 22:10。已改正文 | [汤姆CC 评论](https://api.bilibili.com/x/v2/reply?type=1&oid=117416319326055&sort=1)、[视频](https://api.bilibili.com/x/web-interface/view?bvid=BV1uBpg6qEYM) |
| 汤姆CC 视频弹幕里 20 条「有，喜欢看」 | ❌ 接口里弹幕一共 21 条，「有，喜欢看」是 16 条。已改正文（第二轮更正：10-15 逐条列出，21 条里是 15 条「有，喜欢看」、5 条「没见过」、1 条「求页面提示词」） | [弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42625337423) |
| 抱怨原话：「最近这种同质化高质视频好多」（176 赞）「依旧一眼ai流水线产品」「天天都是这种Claude视频」「不暂停压根看不明白」「能看出来是ai瞎编的了」等 | ✅ 全部在原文里找到，出处和正文写的一致；点赞数 176、19、16、20 也对。有几条是长弹幕的一部分，正文只截了一段 | [涌现评论](https://api.bilibili.com/x/v2/reply?type=1&oid=117369561159694&sort=1)、[涌现弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42388423338)、[银牌弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42561440259)、[光遗传学弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42586016012) |
| 夸奖原话：「看哭了呜呜呜呜」「这是，艺术品啊」「这一段闪烁变成心跳神了」「高质博主，关注了」；音效弹幕在 17 秒；有人刷李宗伟、王楚钦 | ✅ 都找到了；音效那条在 17.5 秒；「第二名是头号输家」至少 5 条 | 同上 |
| Rainorb：抖音话题 661 条、1.2 亿播放、425 作者、中位数 274 赞、前 5 名拿 51%、单日最高 156 条（截至 10-04） | ⚠ 661 条、1.2 亿、截至 10-04 写在视频简介里，属实；其余数字只在画面里，本次没法看画面（未核实）。已在正文标注 | [Rainorb](https://api.bilibili.com/x/web-interface/view?bvid=BV1YCHW62ECA) |
| 电子智人 B 站 5830 粉；信息论 13.9 万；自指从 571 涨到 5.49 万 | ✅ 5830 粉、66 个投稿；信息论 13.9 万；自指 5.49 万（10-06 是 571，见旧调研） | [电子智人](https://api.bilibili.com/x/web-interface/card?mid=343143294)、[信息论](https://api.bilibili.com/x/web-interface/view?bvid=BV1GXav6iEWh)、[自指](https://api.bilibili.com/x/web-interface/view?bvid=BV1ZZHo6LEEa) |
| 抖音信息论 81.4 万赞、19.8 万收藏（10-06 快照） | ⚠ 只是旧调研 10-06 的快照，本次抖音打不开，现在的数（未核实） | [信息论抖音页](https://www.douyin.com/video/7690337875291950345) |
| X 上 Opus 5.5 视频：游戏/互动、广告/发布各约两成；科普只占小头（55+25/1119，9-26 快照） | ⚠ 两成属实（230 个、215 个，分母 1119），快照 9-26 属实。但 55 和 25 只是「科普/教育 × 某种画风」表里的两格，页面没给科普/教育的总数，不能写成科普总共 80 个。已改正文 | [statistics.md](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/statistics.md) |
| X 长文《用Opus5.5起号真的太爽了》（10-09）：3 条测试片涨粉 600 多 | ⚠ 发帖时间按 ID 解码是 10-09 19:00，对；正文打不开（402），内容（未核实），维持【转述】 | [X 文章](https://x.com/Tom_CC_9986/article/2108512799517450287) |
| 路北路陈的片名是《设计风格小课 01｜瑞士风格》、「固定栏目」 | ❌ 接口里的标题是「震惊瘫坐！Opus 5.5 做的设计科普：为什么瑞士风格 70 年都不过时？」，10-06 时没有「震惊瘫坐！」。「固定栏目」查不到依据，已删 | [瑞士风格](https://api.bilibili.com/x/web-interface/view?bvid=BV1hWar6SEVP)；`B站候选清单.md` 第 10 行 |
| Kurzgesagt 中文搬运 10-07 上传 | ❌ 接口时间是 10-06 19:57。已改 | [接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1AXpc6KEMc) |
| Opus 5.5 发布：Anthropic 页 + 路透社链接 | ⚠ Anthropic 页写 9-22 发布，属实。路透社链接打不开，已从正文删掉 | [Anthropic](https://www.anthropic.com/claude-opus-5-5) |
| B 站 AI 无限竞技场 9-16 上线、千万流量 | ⚠ 话题页只返回空壳，新浪打不开，（未核实），已降为【转述】 | [话题页](https://www.bilibili.com/v/topic/detail?topic_id=1346854) |
| 掘金：抖音「真人+AI 短剧」激励 10-01 到 12-31 | ⚠ 页面只显示「Please wait」，（未核实） | [掘金](https://juejin.cn/post/7695437620617986102) |
| 以牙还牙简介：15 种策略、2.4 万回合；混沌简介：200 个摆差 0.001° | ✅ 简介原文分别写「24,000 个回合」「只差 0.001°」 | [以牙还牙](https://api.bilibili.com/x/web-interface/view?bvid=BV1X8a16wEGh)、[混沌](https://api.bilibili.com/x/web-interface/view?bvid=BV1YYaf6qEzD) |
| 「代码放映室」10-13 发《博弈论｜代价之学》，2602 播放 | ✅ 10-13 20:10，现在 2606 | [银牌的相关推荐](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV12DHQ61EhT) |
| 3Blue1Brown 849 万订阅（2026-07-19）、manim 约 9.5 万星；Kurzgesagt 2560 万（2026-10-05）、约 70 人；remotion 约 6.4 万星；opus-video-prompts 328 星 | ✅ 维基和 GitHub 页面一致 | [3Blue1Brown](https://en.wikipedia.org/wiki/3Blue1Brown)、[Kurzgesagt](https://en.wikipedia.org/wiki/Kurzgesagt)、[manim](https://github.com/3b1b/manim)、[remotion](https://github.com/remotion-dev/remotion)、[opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) |
| 「来真的」39 分钟教程 5.4 万播放、1016 评论；「15 种风格」5.7 万播放 | ✅ 2353 秒、5.41 万、1016 评论；5.76 万 | [来真的](https://api.bilibili.com/x/web-interface/view?bvid=BV1j8aS6UEty)、[15 种风格](https://api.bilibili.com/x/web-interface/view?bvid=BV1JvaW6JEMb) |

### 第二轮核查（北京时间 10-15 上午，另一位核查员重新逐条打开）

做法：B 站数字全部重新读接口；时间戳用 Python 自己换算成北京时间；弹幕和评论原话用「严格逐字查找」，并故意混进几条不存在的句子做对照（都正确返回「没找到」），确认读数不是瞎猜的。B 站数字比 10-14 多一些属于正常增长，不算错。抖音网页、诺奖官网、X 原文这次仍然打不开。

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| 《opus家族史》9-23 16:32；控制论 9-26 23:28；信息论 9-28 05:58（抖音） | ✅ 自己用作品 ID 解码，三个时间逐分钟一致。作者、点赞仍沿用旧调研 10-06 的作品页核查 | [opus家族史](https://www.douyin.com/video/7688645727061272805)、[控制论](https://www.douyin.com/video/7689866306497170697)、[信息论](https://www.douyin.com/video/7690337875291950345)；`3_第三版资料/调研/C_抖音话题与电子智人.md` 第 315、321、322 行 |
| B 站「vibe知识大赏」标签 9-30 00:19 创建，523 次使用 | ✅ 创建时间 9-30 00:19:34。使用次数 10-15 上午已到 569 | [tag 接口](https://api.bilibili.com/x/tag/info?tag_name=vibe知识大赏) |
| 涌现：174.4 万播放、21.0 万赞、8.47 万收藏、最高排行 61、10-02 13:11、292 秒；江离 3.26 万粉、9 个投稿 | ✅ 现在 175.7 万 / 21.2 万 / 8.55 万，his_rank 61，时间一致；江离 3.32 万粉、9 个投稿。「单条最高」只限我们找到的范围，已在 §0 加了这句限定 | [涌现](https://api.bilibili.com/x/web-interface/view?bvid=BV1CKa16mE83)、[江离](https://api.bilibili.com/x/web-interface/card?mid=1592635496) |
| 比特新语 14.4 万粉、16 个投稿；银牌 116.2 万、162 秒、10-08 15:31，简介引卡尼曼 1982 | ✅ 现在 16.0 万粉、16 个投稿、获赞 66.1 万；银牌 124.7 万、162 秒、时间一致，简介有卡尼曼和 1982 | [比特新语](https://api.bilibili.com/x/web-interface/card?mid=3494362707135250)、[银牌](https://api.bilibili.com/x/web-interface/view?bvid=BV12DHQ61EhT) |
| 光遗传学片 100.5 万、17 万赞、最高排行 16、10-09 14:37；冰立方 56.7 万、10-11；化学奖 13.1 万、10-10 | ✅ 104.9 万 / 17.8 万赞 / his_rank 16，简介有「它读不了心，也遥控不了任何人」；冰立方 60.6 万、200 秒；化学奖 13.9 万、160 秒；三个时间都一致 | [光遗传学](https://api.bilibili.com/x/web-interface/view?bvid=BV1Fbpt6qEPq)、[冰立方](https://api.bilibili.com/x/web-interface/view?bvid=BV1XWp76FEZR)、[化学奖](https://api.bilibili.com/x/web-interface/view?bvid=BV14mpv6qEEf) |
| 2026 诺奖：医学奖光遗传学（Deisseroth、Hegemann、Nagel），物理奖 IceCube（Halzen）；化学奖公布日期（未核实） | ✅ 得主都对。⚠ 日期第一轮没核到，这次查清：医学奖 10-05、物理奖 10-06、化学奖 10-07（Kagan、Soai，不对称合成）。所以三条片晚了 3 到 5 天，不是「4 到 5 天」。已改 §0、§2.3 和「没查清的问题」 | [维基医学奖列表](https://en.wikipedia.org/wiki/List_of_Nobel_laureates_in_Physiology_or_Medicine)、[Business Today 赛程](https://www.businesstoday.in/science/story/nobel-prize-2026-winners-stage-set-for-announcements-from-october-5-check-details-559195-2026-10-02)、[半岛电视台（物理奖）](https://aljazeera.com/news/2026/10/6/francis-halzen-wins-nobel-prize-in-physics-for-work-on-ghost-particles)、[zamin.uz（化学奖）](https://zamin.uz/en/world/223906-nobel-prize-in-chemistry-2026-laureates-announced.html) |
| 小号能爆：临界点 48.0 万（3428 粉）；心跳 59.7 万（8353 粉、2 个投稿），简介让人把手指搭在手腕上、一生约 30 亿次 | ✅ 临界点 48.5 万，作者 3513 粉；心跳 59.9 万，作者 8401 粉、2 个投稿。简介第一句就是「把手指，搭在你的手腕上」，也有「一生约 30 亿次」。视频画面本身没看 | [临界点](https://api.bilibili.com/x/web-interface/view?bvid=BV1d6HW6UE76)、[低调的神经](https://api.bilibili.com/x/web-interface/card?mid=431137074)、[心跳](https://api.bilibili.com/x/web-interface/view?bvid=BV1V3Hz6REAG)、[逸识](https://api.bilibili.com/x/web-interface/card?mid=256623626) |
| 同一 BV 前后对比：37 法则、以牙还牙、余波 10-06 带前缀、署名幼笙吖、78–440 播放，现在署名比特新语、去掉前缀 | ✅ 现在 18.2 万 / 16.0 万 / 22.0 万。补充：37 法则的作者 mid 就是比特新语的 3494362707135250；幼笙吖 10-06 名下另外两条（BV1vXHr6eEoN、BV1mgHh6pEuf）现在也在比特新语名下。B 站稿件不能换作者，所以「署名变了」应该是**同一账号改名**【推断】。已补进 §0 第 6 条 | [37 法则](https://api.bilibili.com/x/web-interface/view?bvid=BV13Aa66LEAW)、[以牙还牙](https://api.bilibili.com/x/web-interface/view?bvid=BV1X8a16wEGh)、[余波](https://api.bilibili.com/x/web-interface/view?bvid=BV1Kpa26dE9e)、[期望效用](https://api.bilibili.com/x/web-interface/view?bvid=BV1mgHh6pEuf)；`3_第三版资料/调研/B站候选清单.md` 第 54、75、85、98、101 行 |
| 比特新语片长几乎都是 2:42 | ✅ 16 个投稿全部找到：15 条 160–171 秒，只有冰立方 200 秒。已改 §2.3 | 上面几条 view 接口，加 [上头](https://api.bilibili.com/x/web-interface/view?bvid=BV1iJpJ66EbF)、[拼尽全力](https://api.bilibili.com/x/web-interface/view?bvid=BV1oya26rEH4)、[酿酒](https://api.bilibili.com/x/web-interface/view?bvid=BV1ukHb6XE2H)、[风](https://api.bilibili.com/x/web-interface/view?bvid=BV1zVpJ6yEk6) |
| GitHub 带「vibe知识大赏」的仓库 8 个，10-03 到 10-14 建；HeyChengC 10-06 建、252 星、40 复刻；10-14 新建 2 个 | ✅ total_count 8，最早 10-03、最晚 10-14（UTC）；HeyChengC 现在 256 星、40 复刻；10-14 新建的是 Trmachel 和 Buffaiai。「vibe knowledge video」搜索里 AlbertPine（10-11）、chenmingyu12345（10-09）、aaay313（10-10）也对 | [搜索 1](https://api.github.com/search/repositories?q=vibe知识大赏&sort=stars)、[搜索 2](https://api.github.com/search/repositories?q=vibe+knowledge+video&sort=stars) |
| HeyChengC：夜曲 / 寓言两种画风、先出约 30 秒样片、Canvas 逐帧、自动配音效、BGM 自己加、放了别人的片子当样例 | ✅ README 原文都有；样例的版权说明写着来自他人短片，没点名原作者 | [HeyChengC](https://github.com/HeyChengC/vibe-knowledge-film) |
| xiazhuo 仓库：8 条抖音爆款原片、1091 帧、2:00–2:45、无旁白、76–78 BPM、#0A0A1E、六段式 | ✅ README 原文逐项都有（8 条原片共 17.5 分钟；第六段原文是「声明+引用收尾」） | [xiazhuo123456789/vibe-knowledge-video](https://github.com/xiazhuo123456789/vibe-knowledge-video) |
| V2EX 回复说 skill 被搬运倒卖、提到闲鱼（「约 10-08」）；正文写帖子「10-09 10:35 发」 | ❌ 第一轮改错了。V2EX 接口：帖子 10-08 18:21 发，提闲鱼的回复 10-08 19:43；10-09 10:35 是楼主自己道谢的回复。「约 10-08」本来是对的。已改 §1.1、§3、§4.2 | [帖子接口](https://www.v2ex.com/api/topics/show.json?id=1247139)、[回复接口](https://www.v2ex.com/api/replies/show.json?topic_id=1247139)、[帖子页](https://www.v2ex.com/t/1247139) |
| B 站 UP 置顶「点赞关注即可获取提示词」 | ✅ 原话一字不差，置顶时间 10-14 22:10，视频 10-10 19:16 发 | [汤姆CC 评论](https://api.bilibili.com/x/v2/reply?type=1&oid=117416319326055&sort=1)、[视频](https://api.bilibili.com/x/web-interface/view?bvid=BV1uBpg6qEYM) |
| 汤姆CC 视频弹幕 21 条里 16 条「有，喜欢看」 | ❌ 逐条列出：21 条里 15 条「有，喜欢看」、5 条「没见过」、1 条「求页面提示词」。而且 20 条是 10-14 到 10-15 才发的，数字还在变。已改 §4.2 | [弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42625337423) |
| 抱怨原话：「最近这种同质化高质视频好多」（176 赞）「依旧一眼ai流水线产品」「天天都是这种Claude视频」「不暂停压根看不明白」「能看出来是ai瞎编的了」 | ✅ 都逐字找到，出处一致（同质化那条现在 177 赞）。「已经刷到好几个视频了」在涌现弹幕里，银牌和光遗传学里没有，§3 写「三条弹幕合起来」没错 | [涌现评论](https://api.bilibili.com/x/v2/reply?type=1&oid=117369561159694&sort=1)、[涌现弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42388423338)、[银牌弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42561440259)、[光遗传学弹幕](https://api.bilibili.com/x/v1/dm/list.so?oid=42586016012) |
| 夸奖原话：「看哭了呜呜呜呜」「这是，艺术品啊」「这一段闪烁变成心跳神了」「高质博主，关注了」 | ✅ 都逐字找到。音效那条完整原文是「每次这个音效听的我鸡皮疙瘩起来了」，正文截了后半句 | 同上 |
| Rainorb：661 条、1.2 亿播放、截至 10-04；425 作者、中位数 274 赞、前 5 名拿 51%、单日最高 156 条 | ⚠ 前三项在简介里，属实；后四项简介里没有，只能看画面，仍然（未核实） | [Rainorb](https://api.bilibili.com/x/web-interface/view?bvid=BV1YCHW62ECA) |
| 抖音信息论 81.4 万赞、19.8 万收藏（10-06 快照）；电子智人 B 站 5830 粉；B 站信息论 13.9 万；自指 571 → 5.49 万 | ⚠ 抖音数据只能沿用旧调研快照，现在的数（未核实）。B 站部分 ✅：5848 粉、66 个投稿；信息论 13.98 万、301 秒、4K；自指 5.51 万 | [电子智人](https://api.bilibili.com/x/web-interface/card?mid=343143294)、[信息论](https://api.bilibili.com/x/web-interface/view?bvid=BV1GXav6iEWh)、[自指](https://api.bilibili.com/x/web-interface/view?bvid=BV1ZZHo6LEEa)；旧调研第 322 行 |
| X 上 Opus 5.5 视频：游戏/互动、广告/发布各约两成，快照 9-26；「海外为主」 | ✅ 230 个（20.6%）、215 个（19.2%），分母 1119，快照 2026-09-26。⚠ 统计页只说视频是从 X 抓的，没说发帖人在海外，「海外为主」改标为推断 | [statistics.md](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/statistics.md) |
| X 长文《用Opus5.5起号真的太爽了》：3 条测试片涨粉 600 多、一条 10 万+、建议 @抖音科技 | ⚠ 原文仍然 402。10-15 的 extended 搜索摘要能对上：标题、小号三条共涨粉 600 多、一条 10 万+、开头先写观众处境。三条片名、「锚词」、「@抖音科技」摘要里没有（未核实），已在 §1.2、§4.2 标注 | [X 文章](https://x.com/Tom_CC_9986/article/2108512799517450287)（发帖时间按 ID 解码为 10-09 19:00） |
| B 站「AI无限竞技场」9-16 上线、千万流量和现金激励 | ⚠ 9-16 上线属实。量子位把它写成 UP 主测评大模型的榜单，没提奖励；那篇正文里的「143 万奖金池」「十亿级流量」说的是另一个比赛。「千万流量和现金激励」仍然（未核实）。已改 §1.1、§1.2 | [量子位](https://www.qbitai.com/2026/09/484890.html) |
| §7.1「后悔（3000 万次模拟），0.5 万播放」 | ❌ 全文和来源列表都没有对应的视频，整个项目里也搜不到这条。已从表里删掉 | 无 |
| 「代码放映室」10-13《博弈论｜代价之学》2602 播放 | ⚠ 相关推荐每次都会变，10-15 查了三个相关推荐列表都没再出现，没拿到 BV 号，没能复核 | [信息论的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1GXav6iEWh)、[冰立方的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1XWp76FEZR)、[银牌的相关](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV12DHQ61EhT) |
| Opus 5.5 发布：Anthropic 页写 9-22 | ✅ 页面写 September 22, 2026 | [Anthropic](https://www.anthropic.com/claude-opus-5-5) |
| 群论 40.6 万、两个 AI 45.7 万、瑞士风格 12.5 万、Kurzgesagt 搬运 10-06 19:57 上传 21 分钟 | ✅ 40.8 万 / 48.1 万 / 12.5 万（收藏 1.01 万）；Kurzgesagt 搬运 1304 秒、12.1 万、10-06 19:57；发布时间全部一致 | [群论](https://api.bilibili.com/x/web-interface/view?bvid=BV12Zhm6oE6m)、[两个 AI](https://api.bilibili.com/x/web-interface/view?bvid=BV1x9pt6JEkh)、[瑞士风格](https://api.bilibili.com/x/web-interface/view?bvid=BV1hWar6SEVP)、[Kurzgesagt 搬运](https://api.bilibili.com/x/web-interface/view?bvid=BV1AXpc6KEMc) |
| #vibe知识大赏 不是官方活动，名字照 #vibecoding大赏 起的（8-31 截止） | ⚠ 抖音话题页仍然打不开（Socket is closed），WebSearch 也没搜到规则页。沿用旧调研 10-06 的话题页核查；「没有规则页」只是没找到 | [话题页](https://www.douyin.com/hashtag/7601419125595834406)；旧调研第 50–51 行 |

**这一轮没核的**：3Blue1Brown、Kurzgesagt 的订阅数和 LuZhong-Li、zhaosenlin12 两个仓库的规格（第一轮核过，对决策影响小）；掘金的短剧激励（页面仍然打不开）。
