# 13 Folia 与歌词可视化软件：现在谁在做、能往哪走、我们能不能借

> 调研日期：2026-10-14。GitHub 数字都是当天从 GitHub 公开接口或仓库页读的。
> 说明：本轮调研做到一半，网页搜索的次数用完了（所有调研 agent 共用一个额度）。之后只用 WebFetch 直接读已知网址。所以「抖音小红书怎么火的」「国内歌词版权判例」「网易云用户协议原文」这几块没查透，文中都标了（未核实）。
> 全文不引用任何歌词。
> 10-14 做了第二轮独立核查（这一轮网页搜索能用），改动和依据见文末「核实记录」。最大的改动：涨星高峰其实是 10 月 10–13 日，不是 9 月底；安卓移植仓库 10-14 被作者重置过。

## 一句话结论

Folia 是真火，而且**就在这一周火**，火在「技术圈 + 装机教程」。它在 GitHub 上 6,210 星（10-14 晚些再读是 6,290）。10 月 8 日它大约 3,870 星，6 天涨了约 2,400 星，10 月 10–13 日涨得最猛（见 1.4）。原作者以外，也有人开源了安卓移植版（folia-android，10 月 10 日建，10-14 晚上 82 星）。
**做播放器我们不该碰**：赛道已经很挤，Folia 主作者带着 35 位贡献者，10 月里一两天就发一版；而且要靠非官方音乐接口，版权是灰色的。
**能借的是它的「形式」**。最稳的做法不是去放别人的歌词，而是做「歌的科学」：每期讲一个有名字的声音/音乐心理学大想法，比如谢泼德音阶（1964）、话语变歌错觉（1995）、耳虫。声音全用我们自己的代码合成，画面学 Folia 的逐字光效。这样没有歌词版权问题，也不离开账号「一部片一个大想法」的定位。
另一个能直接参考的先例：2026 年 9 月，有人让 Claude Opus 5.5 在 Claude Code 里用 p5.js（一个用代码画图的 JavaScript 库）把一首歌整个画成 MV，仓库 2.1k 星（歌本身是 2024 年网上已有的一首歌，不是 AI 写的）。说明「代码画一首歌」本身有人看。

---

## 1. Folia 详情

### 1.1 基本信息

| 项目 | 内容 | 来源 |
|---|---|---|
| 仓库 | chthollyphile/folia-major | [GitHub](https://github.com/chthollyphile/folia-major) |
| 星 / 复刻 | **6,210 星 / 593 复刻**（2026-10-14；同一天第二轮核查再读是 6,290 / 607，当天还在涨） | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major) |
| 许可证 | AGPL-3.0。意思是：改了它的代码再拿去给别人用（包括做成网站），就必须把你改的代码也公开 | 同上 |
| 建仓 | 2025-11-28 | 同上 |
| 语言 / 技术 | TypeScript + React；桌面版用 Electron（把网页打包成电脑软件的工具） | 语言见 [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major)；React 和 Electron 见 [package.json](https://raw.githubusercontent.com/chthollyphile/folia-major/main/package.json)（README 没提 React） |
| 作者 | GitHub 账号 chthollyphile，真名和身份没写。README 徽章显示 35 位贡献者 | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| 开发方式 | README 自己写了：在 AI 的大量协助下开发，可能有不好发现的 bug | 同上 |
| 用途声明 | 只供个人学习、技术交流、非商业测试；歌曲、歌词、封面的版权归权利人 | 同上 |
| 官网 | folia-site.cielaniska.top（只有文档入口） | [官网](https://folia-site.cielaniska.top/) |
| 更新速度 | v0.7.17（10-10）、v0.7.18（10-11）、v0.7.19（10-13），另有每日测试版。版本代号 Realeco | [Releases 接口](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8) |
| 下载量 | v0.7.18（10-11 发布）全部 15 个文件的下载次数加起来约 13.7 万（第二轮核查时读到 139,027）。**但这里面有 4.2 万次是 latest.yml**——这是软件自动检查更新时读的小文件，不是安装包；还有约 8 千次是差分更新用的 blockmap 文件。**真正的安装包（exe / dmg / zip / deb / rpm / tar.gz）合计约 8.8 万次**（其中 Windows 安装包 59,783 次），而且自动更新下载安装包也算在里面，所以这也不是用户数 | 同上 |

### 1.2 它能做什么

| 功能 | 说明 | 来源 |
|---|---|---|
| 音乐来源 | 网易云、QQ 音乐、酷狗、Navidrome（一种自己搭的音乐服务器）、本地文件。歌词匹配顺序：网易云 → QQ → 酷狗 | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| 歌词格式 | .lrc / .vtt / .ttml / .qrc / .yrc / .krc，支持逐字歌词（每个字有自己的时间点）；也用 AMLL 的逐字歌词库 | 同上 |
| 全屏歌词动画 | 预览图上的名字：浮名（Fume）、流光（Lumi）、心象、云阶、群唱（Cappella）、倾诉（Tilt）、镜台（Diorama）、时计（Pendolo）。按 README 里图片和名字的排列，心象 = Cad，云阶 = Pat | 同上 |
| Diorama（镜台） | v0.5.27 加入，3D 舞台 + 跟着音频动 | [newreleases v0.5.27](https://newreleases.io/project/github/chthollyphile/folia-major/release/v0.5.27) |
| 动效数量 | 一条抖音教程说有 20 种（未核实） | [抖音视频（搜索摘要）](https://www.douyin.com/video/7695246286152473577) |
| AI 主题 | 按歌的情绪和歌词，生成背景和画面参数。README 没写用哪家大模型；一篇 7 月的博客说是 Gemini。v0.7.18 更新说明写的是「Gemini / OpenAI」两种密钥改为加密保存，说明要用户自己填 API 密钥 | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md)、[xlap 博客 2026-07-05](https://blog.xlap.top/post/tech/2026-07-05/folia-major/)、[Releases](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8) |
| 模组（Folium） | 实验功能，只在桌面版，默认关。可以加新的歌词动画、背景、浮层 | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| 模组市场 | 现有 15 个：官方 7 个、社区 8 个。其中有官方样例「透明 MOV 歌词动画导出」（把歌词动画导出成带透明底的视频，拿去剪片用）和社区作者 duoduo1232 做的「AI 歌词动画导演」 | [Folium 市场](https://folium-compound.cielaniska.top) |
| 外接播放器 | 接一个本地 Now Playing 服务，可以给别的播放器正在放的歌配 Folia 的歌词动画 | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| 多设备同步 | 可选，自己搭同步服务器，同步外观设置和 AI 主题库 | 同上 |
| 平台 | Windows / macOS / Linux 安装包；网页版可部署到 Vercel、Cloudflare、Docker | 同上 |

### 1.3 手机端

| 项目 | 是谁 | 星 | 状态 | 来源 |
|---|---|---|---|---|
| 官方建议 | 用手机浏览器打开网页版，「添加到主屏幕」当 App 用（PWA，就是能装到桌面的网页） | — | 官方没有原生手机 App | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| folia-sonnet | 原作者自己给的安卓打包示例（用 Capacitor，把网页包成 App 的工具） | 3 | 2026-07-29 建，之后没再更新 | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-sonnet) |
| **folia-android** | **Timingyyds，个人移植，非官方，AGPL-3.0。用户说的「有人开源了手机端」应该就是这个** | **76**（10-14 晚上 82） | 2026-10-10 建，更新极快。第一轮调研时读到 4 天发了 7 版（v1.0.0 到 v1.6.0），v1.4.0 基于 folia-major 0.7.18。**但作者在 10-14（UTC）晚上把仓库历史重置了**：现在只剩 2 次提交、1 个版本 v1.7.0（APK 约 37.3MB），旧版本和 v1.4.0 的 README 都已删掉（旧链接 404）。现在的 README 只说上游是 folia-major，没写基于哪一版、没写安装包大小，也没有「已知限制」一节。早先 README 里「QQ 扫码登录被风控拦、酷狗会员歌放不了」的说法现在查不到原文了（未核实） | [仓库](https://github.com/Timingyyds/folia-android)、[Releases 接口](https://api.github.com/repos/Timingyyds/folia-android/releases?per_page=20)、[提交记录接口](https://api.github.com/repos/Timingyyds/folia-android/commits?per_page=20)、[GitHub 接口](https://api.github.com/repos/Timingyyds/folia-android) |
| Mineradio | oirge，「基于 Mineradio 和 Folia 二次修改」的本地播放器，14 种歌词效果、桌面歌词。看描述是电脑端（有桌面歌词），不算手机端，放这里只因为它也是 Folia 衍生 | 304 | 2026-06-25 建，许可证认不出 | [GitHub 接口](https://api.github.com/repos/oirge/Mineradio) |
| iOS | 没找到原生移植 | — | — | 搜索未找到（未核实） |

### 1.4 它是怎么火起来的（能查到的时间线）

| 日期 | 事 | 来源 |
|---|---|---|
| 2025-11-28 | 建仓 | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major) |
| 2026-07-04 | 首次上 GitHub 热榜第 14 名，当天 +319 星，次日 +175（githot 只记录了这两天上榜） | [githot](https://githot.dev/repo/chthollyphile/folia-major) |
| 2026-07-04~07 | 技术博客跟进，xlap 和 tantan.ink 的标题把它比作「文字 PV」（PV 就是宣传短片）；txtmix 正文说「让听歌变看 PV」 | [txtmix](https://txtmix.com/posts/tech/chthollyphile-folia-major-immersive-lyrics-music-player-guide/)、[xlap](https://blog.xlap.top/post/tech/2026-07-05/folia-major/)、[tantan.ink](https://www.tantan.ink/folia-%e4%b8%8a%e6%89%8b%ef%bc%9a%e6%8a%8a%e6%ad%8c%e8%af%8d%e5%8f%98%e6%88%90%e6%96%87%e5%ad%97pv%ef%bc%8c%e6%94%af%e6%8c%81navidrome%e5%92%8c%e7%bd%91%e6%98%93%e4%ba%91%e7%9a%84%e5%bc%80%e6%ba%90.htm) |
| 2026-08-30 | B 站 UP 主 4mtx 发 v0.7.1 介绍，6,722 播放 | [B 站接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1VMtH6sEnn) |
| 2026-09-20 | B 站「山海之花」发 71 秒介绍，标题写「狂揽 2.8k stars」，7,996 播放、412 收藏 | [B 站接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1iYea6zEVC) |
| 2026-10-08 | 收录站 Zendot 发介绍文，正文写当时「3,870 stars」。它的页头是**实时数字**，不是 10-08 的快照：第一轮读到 5.9k、「近 7 天 +2,034」，第二轮读到 6.3k、「近 8 天 +2,395」。3,870 + 2,395 ≈ 6,265，和 GitHub 当时的 6,290 对得上。所以 10-08 约 3,870 星是可信的 | [Zendot 2026-10-08](https://zendot.org/en/posts/chthollyphile-folia-major) |
| 2026-10-08 ~ 10-14 | 每天新增星（OSSInsight，用 GitHub 公开事件统计的第三方站；它自己标明数据有缺口，总数只是下限，偏少约 1,800，但每天的增量能看趋势）：10-08 +170、10-09 +170、**10-10 +336、10-11 +582、10-12 +524、10-13 +423**、10-14 +370。对比：9 月下旬每天只有三四十个 | [OSSInsight 接口](https://api.ossinsight.io/v1/repos/chthollyphile/folia-major/stargazers/history/?per=day) |
| 2026-10-10 | 安卓移植 folia-android 建仓 | [GitHub 接口](https://api.github.com/repos/Timingyyds/folia-android) |
| 2026-10-11 | 抖音「成长小助手」发安装教程。搜索引擎收录了这条视频的标题（「Folia 播放器安装教程来了！……」）；约 1,341 赞（未核实：数字只来自第一轮的搜索摘要，第二轮搜索没看到赞数，网页打不开） | [抖音（网页打不开）](https://www.douyin.com/video/7695246286152473577) |
| 2026-10-14 | 6,210 星（当天晚些 6,290） | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major) |

**能下的判断**：最近这波涨星**就在 10 月 10–13 日**（9 月 20 日 B 站标题写 2.8k，10 月 8 日约 3,870，10 月 14 日约 6,290）。它和三件事同期：安卓移植上线（10-10）、Folia 连发 0.7.17–0.7.19（10-10 到 10-13）、抖音装机教程（10-11）。同期不等于因果。到 10-14 每天还在涨三四百星，热度没退。
**下不了的判断**：是哪条抖音或小红书带火的，查不到（未核实）。搜到的抖音、B 站视频点赞都在几百到一千多，没有找到百万级爆款。小红书上没搜到相关内容。「歌词放映」这个说法也没搜到对应的抖音话题（未核实），最接近的是「可投屏的歌词视频」。
**我的推测**（未核实）：Folia 的画面「录屏就是内容」。用户装好、放首歌、录一段屏，就能直接发短视频。教程号再顺手带一波下载。

---

## 2. 类似的软件

热度一栏：开源的写 GitHub 星数（2026-10-14 读）；不开源的写能查到的数字，查不到写（未核实）。

### 2.1 歌词显示类

| 名字 | 做什么 | 平台 | 开源？ | 热度 | 来源 |
|---|---|---|---|---|---|
| **AMLL**（Apple Music-like Lyrics） | 仿 Apple Music 的逐字歌词组件 + 流体背景，能嵌进别的软件。还有逐字歌词库 amll-ttml-db、编辑器、播放器。Folia 也在用它的歌词库 | 网页组件（React / Vue）、本地播放器 | 是，AGPL-3.0 | 2.2k 星。README 说只剩一个活跃维护者，在找人帮忙 | [GitHub](https://github.com/amll-dev/applemusic-like-lyrics) |
| **Lyricify** | 给 Spotify 等播放器配滚动歌词。有 Lyricify 4（只支持 Spotify）、Fusion（Windows 上任何播放器）、Mobile（安卓 / iOS） | Windows、安卓、iOS；macOS 计划 2026–2027 | 发布仓库没写许可证，README 说开源的只有歌词处理代码（Lyricify-Lyrics-Helper）和部分动态背景（Lyricify-Backgrounds），都是 Apache-2.0 | 发布仓库 7.3k 星 | [Lyricify-App](https://github.com/WXRIW/Lyricify-App)、[搜索接口](https://api.github.com/search/repositories?q=lyricify&sort=stars&per_page=10) |
| **BetterLyrics**（jayfunc） | Windows 上的歌词可视化 + 播放器，可深度自定义 | Windows（WinUI3） | 是，GPL-3.0 | 2,208 星；2025-05 建，10-14 还在更新 | [GitHub 接口](https://api.github.com/repos/jayfunc/BetterLyrics) |
| **Better Lyrics**（boidushya，名字很像，是另一个） | YouTube Music 浏览器插件：同步歌词、翻译、罗马音、全屏，**有社区主题市场** | Chrome / Firefox / Edge | 是，GPL-3.0 | 932 星 | [GitHub](https://github.com/boidushya/better-lyrics) |
| **Spicy Lyrics** | Spotify 桌面版插件（靠 Spicetify 这个改造工具），逐字动画歌词 | Spotify 桌面 | 是，AGPL-3.0 | 645 星；已有安卓、iOS 的社区移植 | [搜索接口](https://api.github.com/search/repositories?q=spicy+lyrics&sort=stars&per_page=10) |
| **LyricsX** | macOS 老牌歌词软件，2017 年起 | macOS | 是，MPL-2.0 | 5,234 星；最后推代码 2026-07-22 | [GitHub 接口](https://api.github.com/repos/ddddxxx/LyricsX) |
| **Lyric Fever** | 自称 LyricsX 的接班人，给 Spotify / Apple Music 配歌词 | macOS | 是，MIT | 638 星；最后推代码 2026-04-03 | [GitHub 接口](https://api.github.com/repos/aviwad/LyricFever) |
| **Apple Music 歌词 + Sing** | 2022 年 12 月（iOS 16.2）上线：人声音量可调（卡拉 OK）、对唱分左右（「逐音节动」本轮没单独核对）。iOS 26（2025 年 6 月 WWDC 公布）加了歌词翻译和歌词发音 | iPhone、iPad、Apple TV 4K（第三代） | 否 | 系统自带（用户数未核实） | [Stuff 2022-12-14](https://stuff.co.za/2022/12/14/ios-16-2-apple-music-sing-karaoke-feature/)、[MacTrast 2022-12](https://www.mactrast.com/2022/12/apple-music-sing-feature-now-available-in-ios-16-2-release-candidate/amp/)、[AppleInsider 2025-06-09](https://appleinsider.com/articles/25/06/09/ios-26-brings-big-changes-to-music-maps-and-wallet)、[Music In Africa](https://www.musicinafrica.net/node/365701) |
| **Spotify 歌词** | 歌词来自 Musixmatch 授权。2020 年扩到 26 个市场；2021 年 11 月对所有用户开放（未核实，本次没找到来源）。2026 年 2 月初更新（tech.az 2026-02-05 报道）：歌词翻译开放到所有国家、离线歌词（只给付费用户）、歌词挪到封面下面 | 全平台 | 否 | 系统自带 | [TechCrunch 2020](https://techcrunch.com/2020/06/29/in-a-significant-expansion-spotify-to-launch-real-time-lyrics-in-26-markets/amp)、[tech.az 2026](https://tech.az/en/posts/spotify-updates-lyrics-feature-offline-access-and-more-translations-6544) |
| **网易云音乐** | 播放页样式越来越「可视化」：「神光模式」是模拟演出现场灯光的歌词动效播放器，2025-08-13 上了车机版；2025-12-11 的 9.4.28 版更新日志写「副歌一响，神光来袭」；2025-12 又出了跟节拍闪的「琉璃光波」播放器；鸿蒙版 2026-09-23 全面上线，带「沉浸光感」播放器（会员功能） | 手机、电脑、车机、鸿蒙 | 否 | 神光模式车机版、琉璃光波、鸿蒙版都有媒体报道；9.4.28 更新日志只在第三方下载站的搜索摘要里看到，没打开原文；「液态流光」本轮没找到来源（未核实） | [数英 2025-08-15（神光模式车机版）](https://www.digitaling.com/articles/1391347.html)、[数英 2025-12-12（琉璃光波）](https://www.digitaling.com/articles/1439521.html)、[PingWest 2026-09-23（鸿蒙版）](https://www.pingwest.com/w/317790)、[当下软件园](https://www.downxia.com/downinfo/389592.html) |
| **QQ 音乐** | 歌词动效模板（部分要超级会员）；「歌词海报」能做静态图和视频；2026-09 的更新日志写了歌词页视觉焕新、车载版加「沉浸·专辑封面」 | 手机、电脑、车载 | 否 | 官方下载页摘要（抓取失败，未逐字核对）；海报模板更新来自第三方站 | [QQ 音乐下载页](https://y.qq.com/download/download.html)、[人人都是产品经理 2022](https://www.woshipm.com/evaluating/5523954.html)、[下么软件园](https://www.xiame.com/app/8508.html) |
| LyricView、Petals、动感歌词 | 一篇文章把它们和 Folia 归为同一类「歌词变成画面」的小众软件 | — | — | 未核实 | [txtmix](https://txtmix.com/posts/tech/chthollyphile-folia-major-immersive-lyrics-music-player-guide/) |

### 2.2 壁纸和桌面美化类

| 名字 | 做什么 | 平台 | 开源？ | 热度 | 来源 |
|---|---|---|---|---|---|
| Wallpaper Engine | 动态壁纸软件，创意工坊里有大量随音乐动的壁纸，也有歌词壁纸（这两点都未核实：Steam 商店页只写了动画、互动和视频壁纸） | Windows（Steam） | 否，4.99 美元 | Steam 英文评测 234,081 条，97% 好评 | [Steam](https://store.steampowered.com/app/431960/Wallpaper_Engine/) |
| Rainmeter 歌词皮肤 | 桌面小部件里的歌词显示皮肤 | Windows | Rainmeter 本体开源 | 本轮没查到具体来源（未核实） | — |

### 2.3 音乐可视化类（不管歌词，只管「声音变画面」）

| 名字 | 做什么 | 平台 | 开源？ | 热度 | 来源 |
|---|---|---|---|---|---|
| projectM | 重写了 Winamp 时代经典的 Milkdrop 可视化：读音频、测节奏、按公式画迷幻画面 | 库本身跨平台；有 Windows / macOS / Linux / 安卓 / 安卓电视 / Xbox 应用 | 是，LGPL-2.1 | 4.5k 星 | [GitHub](https://github.com/projectM-visualizer/projectm) |
| Kaleidosync | 网页版 Spotify 可视化，用 WebGL 画图案（README 的更新记录最多写到 8 种，「20 多种」未核实） | 网页 | 仓库公开，许可证没写 | 874 星。README 讲到 Spotify 的「音频分析」接口，也说作者做了浏览器里的实时音频分析。Spotify 2024-11-27 起不再给新应用开放「音频分析」「音频特征」等接口（老应用不受影响）；这对 Kaleidosync 本身影响多大，未核实 | [GitHub](https://github.com/zachwinter/kaleidosync)、[Spotify 开发者博客](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) |
| Plane9 | 3D 音乐可视化 / 屏保，250 多个场景，支持 VR | Windows（官网没写全） | 否 | 未核实 | [官网](https://www.plane9.com/) |

### 2.4 AI 做音乐画面

| 名字 | 做什么 | 开源？ | 价格 / 热度 | 来源 |
|---|---|---|---|---|
| Neural Frames | 上传歌曲，AI 自动出整支 MV；跟音乐动（Audioreactive）；有歌词和对口型功能；能把歌拆成人声、鼓等分轨（stem） | 否 | 年付最低 26 美元/月（Neural Knight，按月付是 39 美元）；价格页列了歌词、对口型、分轨这些功能，但没写最低档是否都包含。Trustpilot 3.5 分 / 80 条（这条来自一家竞品写的评测） | [官方价格页](https://www.neuralframes.com/pricing)、[Vidmuse 评测](https://vidmuse.ai/blog/neural-frames-review) |
| **PDoomVideo** | **一首歌的完整 MV，全部由 Claude Opus 5.5 在 Claude Code 里生成**：模型自己写分镜和动画指南，派多个子 agent 并行画各章节，用 p5.js 和 p5.brush（模拟笔刷）逐帧画，ffmpeg 合成。歌是 2024 年网上已有的一首歌 | 公开，但**没写许可证**（默认不许别人拿去用） | 2.1k 星；提交记录在 2026-09-22 到 09-25 | [GitHub](https://github.com/JohnHeibel/PDoomVideo)、[提交记录](https://github.com/JohnHeibel/PDoomVideo/commits/main) |
| paint-mv-skills | 把上面这套做法改成通用的 agent skill：输入歌和歌词 → 测节拍 → 歌词对时间轴 → 写分镜 → 分章并行画 → 出水彩风 MV | 是，MIT。但它安装时会去下载 PDoomVideo 的源码，那部分不在 MIT 里 | 36 星（第二轮读到 37）；2026-09-25 建 | [GitHub](https://github.com/lintsinghua/paint-mv-skills)、[搜索接口](https://api.github.com/search/repositories?q=lyrics+animation+created:%3E2026-06-01&sort=stars&per_page=30) |

### 2.5 2026 年新冒出来的小项目

都很小，说明「歌词动画」这件事正在被很多人各自做，但还没有第二个 Folia。

| 仓库 | 做什么 | 星 | 来源 |
|---|---|---|---|
| Timingyyds/folia-android | Folia 安卓移植（见 1.3） | 76 | [GitHub](https://github.com/Timingyyds/folia-android) |
| amarinne/spicy-ex | 让安卓版 Spotify 和车机显示动画逐字歌词 | 40 | [搜索接口](https://api.github.com/search/repositories?q=spicy+lyrics&sort=stars&per_page=10) |
| spicylyrics/mobile | 安卓手机上给任何正在放的歌显示逐字歌词 | 25 | 同上 |
| Sppqq/sweet-lyrics-ios | Spicy Lyrics 的 iPhone 版（2026-10-10 建） | 7 | 同上 |
| kineticron/KineSync | 安卓和 iOS 的 Spotify 同步歌词，有 Spicy 和 AMLL 两种风格 | 4 | 同上 |
| kmgcc/melismakit | macOS 原生的 AMLL 逐字歌词渲染器（2026-09-11 建） | 3 | [搜索接口](https://api.github.com/search/repositories?q=lyrics+animation+created:%3E2026-06-01&sort=stars&per_page=30) |
| SahilK044/WinLand | Windows 上的「灵动岛」小部件，带 Spotify 歌词 | 2 | 同上 |
| Arduino 歌词屏（两个） | 用单片机小屏幕跟着音乐显示歌词 | 2 | 同上 |
| 多个「Python 终端歌词动画」 | 在黑色命令行窗口里用打字机效果逐字打出歌词 | 1–3 | 同上 |

---

## 3. 软件上它能怎么发展

### 3.1 方向一览

| 方向 | 现在谁已经在做 | 难点 | 我的判断 |
|---|---|---|---|
| **读懂歌词和情绪，生成画面**（大模型 + 音频分析） | Folia 的 AI 主题（按情绪和歌词出配色和参数）；Folia 社区模组「AI 歌词动画导演」；Neural Frames 自动出 MV | 大模型懂字面意思，不一定懂反讽和留白；每首歌都要调用模型，有成本 | 已经有人在做，会成为标配，不再是卖点 |
| **节拍同步** | projectM 测节奏；paint-mv-skills 测 BPM 和第一拍；Neural Frames 拆分轨；网易云「琉璃光波」播放器跟节拍闪（2025-12，[数英](https://www.digitaling.com/articles/1439521.html)） | 测拍容易，「在对的那一拍做对的事」难 | 基础功能，没有壁垒 |
| **每首歌一部「小电影」** | PDoomVideo：Claude 给一首歌画了整支 MV，2.1k 星 | 一首歌要花很多算力和时间；不能实时 | **这是离我们最近的方向**：不做软件，做「片」 |
| **社区模板市场** | Folium 模组市场（15 个）；Better Lyrics 主题市场；Lyricify 背景库 | 模组能跑任意代码，有安全风险（Folia 要求逐个确认才启用） | 播放器竞争的下一个战场 |
| **多设备同步** | Folia 自建同步服务器；Lyricify Mobile 覆盖手机和电脑 | 要有账号体系和服务器 | 有用，但不吸引人 |
| **电视 / 投影 / 车机 / 硬件** | projectM 有安卓电视、Xbox 版；Apple Music Sing 上 Apple TV；QQ 音乐车载「沉浸·专辑封面」；Arduino 歌词屏 | 版权方对「公开放映」管得更严（KTV 就是例子）；硬件要出货 | 大厂会自己做，个人开发者很难进 |

### 3.2 限制：版权和接口条款

| 问题 | 事实 | 来源 |
|---|---|---|
| 歌词是单独授权的 | 海外歌词主要通过 Musixmatch 和 LyricFind 两家拿授权。Spotify 的歌词来自 Musixmatch | [维基百科：LyricFind](https://en.wikipedia.org/wiki/LyricFind)、[TechCrunch](https://techcrunch.com/2020/06/29/in-a-significant-expansion-spotify-to-launch-real-time-lyrics-in-26-markets/amp) |
| 歌词授权在打官司 | 华纳词曲（Warner Chappell）和 Musixmatch 签了歌词独家授权（签约时间未核实：来源都没写月份。据 LyricFind 的说法，它 2024 年初本来快要替代 Musixmatch 成为 Spotify 的歌词供应商，独家协议签了之后 Spotify 停了谈判、续约 Musixmatch；这些都是 LyricFind 的指控，Musixmatch 说毫无根据）。2025 年 3 月初 LyricFind 在旧金山联邦法院起诉 Musixmatch 和它的投资方 TPG 垄断；2025 年 9 月法官驳回一部分、核心诉求继续审；2026-09-03 的联合信里，LyricFind 愿意调解，Musixmatch 和 TPG 以双方和解立场差距大为由表示现在不愿调解 | [aimusicpreneur 2026-09-04](https://www.aimusicpreneur.com/ai-music-news/lyricfind-musixmatch-antitrust-mediation-collapse-2026/)、[Billboard](https://ca.billboard.com/business/legal/lyricfind-sues-rival-musixmatch-in-antitrust-suit-over-unprecedented-warner-licensing-deal) |
| 规模 | LyricFind 2024 年和 5 万多家出版方合作，向权利人付了 2,500 万美元以上 | [维基百科：LyricFind](https://en.wikipedia.org/wiki/LyricFind) |
| 网易云接口 | 最有名的非官方网易云接口仓库 NeteaseCloudMusicApi（3.02 万星）在 2024-04-16 归档，README 第一句是「保护版权，此仓库不再维护」。Folia 用的是社区分支 api-enhanced（约 2k 星），写在它的 package.json 依赖里 | [原仓库](https://github.com/Binaryify/NeteaseCloudMusicApi)、[api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)、[Folia package.json](https://raw.githubusercontent.com/chthollyphile/folia-major/main/package.json) |
| 网易云 / QQ 音乐用户协议 | 一般都禁止用第三方软件抓取内容（未核实：网易云条款页是动态加载的，本次没读到原文；搜索额度用完） | [网易云服务条款页](https://st.music.163.com/official-terms/service) |
| 国内歌词版权 | 《著作权法实施条例》把「带词或不带词」的歌曲都算音乐作品，歌词受保护（未核实：本次没抓到条文原文） | — |
| 安卓移植的实际问题 | 第一轮读到旧版 README 写：QQ 扫码登录会被风控拦，酷狗会员歌放不了。作者 10-14 重置了仓库，旧 README 已删，现在的 README 不提这些（未核实） | [folia-android](https://github.com/Timingyyds/folia-android) |
| 许可证 | Folia 是 AGPL-3.0：谁改了它再对外提供服务，就得开源修改。想闭源商业化「做一个更好的 Folia」，不能直接改它 | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major) |

**结论**：「做一个更好的 Folia」在技术上不难，难在两件事。一是音源和歌词要靠非官方接口，随时可能断。二是想商业化就得自己去谈歌词授权，个人做不到。

---

## 4. 顺带评估：我们能不能做「代码生成的歌曲 / 歌词片」垂直系列

前提：我们的文字里绝不复制歌词；在抖音上用平台曲库配乐。

### 4.1 几种做法对比

| 做法 | 例子 | 版权风险 | 和账号定位合不合 | 难度 | 要不要试 |
|---|---|---|---|---|---|
| A. 热门歌的「歌词放映」：画面里逐字放歌词，配抖音曲库原曲 | 学 Folia 录屏 | **高**。画面里打出歌词就是在复制歌词；曲库授权管的是「用这段音乐」，管不管画面里的歌词文字，未核实 | 不合。变成纯氛围号，跟「一部片一个大想法」无关 | 中。要拿到歌的精确时间点，还得和曲库片段对齐（曲库片段从哪一秒开始，未核实） | **不建议** |
| B. **「歌的科学」**：每期一个有名字的声音/音乐心理学大想法，声音全部自己合成 | 谢泼德音阶、话语变歌错觉、耳虫（见 4.2） | **几乎没有**。声音是我们 numpy 合成的，不用别人的歌 | **很合**。还是「学名 · 人名 · 年份」，开头 10 秒能让概念在观众耳朵里发生一次 | 低。现有流程（Remotion + numpy 配乐）就能做 | **建议先试一期** |
| C. 公版诗词「放映」：古诗或作者去世超过 50 年的老歌词，代码做逐字光效 | 唐诗、宋词 | 低。作者去世 50 年后著作权里的财产权就过期了（中国法律的规定，本次没抓原文，未核实）；但要用的「曲子」也得是公版或自己做 | 一般。好看，但不是「大想法」 | 低 | 可以作为番外试 |
| D. AI 生成一首歌 + 代码画整支 MV | PDoomVideo 的做法 | 取决于生成歌曲的工具条款（未核实） | 偏离。这是「AI 作品展示」，不是知识片 | 高。一支 MV 要很多算力 | 先不做 |
| E. 讲一首热门歌「背后的大想法」，画面不放歌词，只用曲库原曲配一小段 | 比如某首歌为什么让人起鸡皮疙瘩 | 中。不复制歌词就低很多；配乐用抖音曲库（在抖音内使用，其他平台未核实） | 合。能蹭到歌的热度 | 中 | 等 B 跑通再说 |

### 4.2 「歌的科学」可选题（都是有名字的大想法）

| 题 | 学名 · 人名 · 年份 | 开头 10 秒怎么让它在观众身上发生 | 文化引用 | 来源 |
|---|---|---|---|---|
| 永远在上升的声音 | 谢泼德音阶（Shepard tone）· Roger Shepard · 1964 | 一个音一直在往上走，10 秒后画面告诉你：它根本没升高 | 诺兰《敦刻尔克》（2017）用它制造越来越紧的感觉；《超级马里奥 64》（1996）里走不完的楼梯 | [维基百科](https://en.wikipedia.org/wiki/Shepard_tone) |
| 说话变成了唱歌 | 话语变歌错觉（Speech-to-song illusion）· Diana Deutsch · 1995（发现） | 一句普通的话原样循环十来遍，观众会突然听出旋律。Deutsch 1995 年在给 CD 做解说时偶然发现；「听 1 遍的人复述成说话，听 10 遍的人复述成唱歌」是她和同事 **2011 年**发表的实验（Deutsch、Henthorn、Lapidis，《美国声学学会杂志》），不是 1995 年的 | — | [维基百科](https://en.wikipedia.org/wiki/Speech-to-song_illusion) |
| 脑子里停不下来的歌 | 耳虫 / 不自主音乐表象（INMI，Involuntary musical imagery，就是没想听却在脑子里自己放的音乐）· James Kellaris · 2001 | 用我们自己写的一段短旋律，放到一半突然停，让观众脑子自己补完 | 「98% 的人有过」：维基把它归给 Kellaris 的研究，但脚注引的是 2009 年的一篇问答专栏（The Straight Dope），不是 Kellaris 的论文；原始研究和样本量未核实，片里别说成定论。2015 年报道的雷丁大学研究说，嚼口香糖可能有助于压住它（维基原文用的是「could help」，不是「能」） | [维基百科](https://en.wikipedia.org/wiki/Earworm) |

注意：维基百科写明，说声调语言（如泰语、普通话）的人也会有话语变歌错觉，但比说非声调语言的人弱。做之前先自己录一句中文试听。

### 4.3 能从 Folia 借的「画面手艺」

| 手艺 | Folia 怎么做 | 我们怎么用 |
|---|---|---|
| 逐字点亮 | 每个字有自己的时间点，按唱到哪亮到哪 | 我们的双语字幕可以按配乐的拍点逐字亮，而不是整句出现 |
| 一首歌一种排版气质 | 浮名、流光、云阶……每种模式字的排法和情绪不同 | 每部片固定一种「字的运动方式」，当作这一期的视觉签名 |
| 副歌给大招 | 网易云 9.4.28 版（2025-12）更新日志写神光模式「副歌一响，神光来袭」（只在第三方下载站的搜索摘要里看到，没打开原文） | 我们的片子在「顿悟那一句」给最大的光效，前面都收着 |
| 导出透明视频 | Folium 有「透明 MOV 导出」模组 | 说明创作者真的在拿歌词动画去剪短视频，这个形式在抖音上有需求 |

---

## 对我们有什么用

### 可借鉴

1. **Folia 证明了「文字本身就能当主角」**。它没有人物、没有实拍，只靠字的运动和光，就有 6,210 星，B 站、抖音上也有一批介绍和教程视频（单条播放几千、点赞几百到一千多）。这和我们「暗底、光是主角」的路子一致。
2. **PDoomVideo 证明了「代码把一首歌画成片」有人看**（2.1k 星，2026 年 9 月）。而且它的做法（模型写分镜 → 分章并行画 → ffmpeg 合成）和我们的萤火流程几乎一样。
3. **逐字点亮 + 副歌大招**，可以直接用在我们的双语字幕上。

### 建议

1. **不要做播放器，也不要做热门歌的歌词放映**。前者赛道挤、靠灰色接口；后者要在画面里打出歌词，版权风险最大，而且会把账号变成氛围号。
2. **先试一期「歌的科学」**。首选谢泼德音阶：声音 100% 自己合成，开头 10 秒就能让观众「听到一个永远升不上去的音」，有诺兰《敦刻尔克》当文化引用。这一期可以带 #Folia 之外的音乐类话题，但不要硬蹭 Folia 的标签。
3. **蹭 Folia 热度的正确姿势**（如果想蹭）：拍「为什么逐字亮起的歌词让人上头」这类片，要先找到背后有名字的大想法（本轮没找到合适的，需要下一步再查）。没有大想法就别蹭。注意时间：它的涨星高峰在 10 月 10–13 日，10-14 每天还在涨三四百星；热度能撑多久，查不到（未核实），要蹭就别拖太久。
4. 用户说「可以做得更好」：如果是想自己做一个歌词软件，建议先别做。理由见 3.2。真要做，最现实的切口是「给自己的片子用的歌词动画模板库」，而不是给大众用的播放器。

### 要不要试

| 事项 | 结论 |
|---|---|
| 做一个比 Folia 更好的播放器 | 不试 |
| 热门歌歌词放映系列 | 不试 |
| 「歌的科学」系列，第一期谢泼德音阶 | **试一期**，看完播数据再决定要不要成系列 |
| 公版诗词逐字光效番外 | 有空再试 |
| 本轮没查完、值得下次补查的 | ① 抖音曲库授权到底管不管画面上的歌词文字；② 抖音曲库片段的起止点能不能和我们的画面精确对齐；③ 国内歌词侵权判例；④ 「歌词放映」在抖音是不是一个真实的话题 |

---

## 来源

**Folia 及移植**
- [chthollyphile/folia-major（GitHub）](https://github.com/chthollyphile/folia-major)
- [GitHub 接口：folia-major 仓库数据](https://api.github.com/repos/chthollyphile/folia-major)
- [GitHub 接口：folia-major Releases](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8)
- [folia-major README（原文）](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md)
- [folia-major package.json（依赖列表）](https://raw.githubusercontent.com/chthollyphile/folia-major/main/package.json)
- [Folia 官网](https://folia-site.cielaniska.top/)
- [Folium 模组市场](https://folium-compound.cielaniska.top)
- [newreleases：v0.5.27（Diorama）](https://newreleases.io/project/github/chthollyphile/folia-major/release/v0.5.27)
- [GitHub 接口：folia-sonnet](https://api.github.com/repos/chthollyphile/folia-sonnet)
- [Timingyyds/folia-android](https://github.com/Timingyyds/folia-android)、[GitHub 接口](https://api.github.com/repos/Timingyyds/folia-android)、[Releases 接口](https://api.github.com/repos/Timingyyds/folia-android/releases?per_page=20)、[提交记录接口](https://api.github.com/repos/Timingyyds/folia-android/commits?per_page=20)（原来引用的 v1.4.0 README 链接已 404，作者 10-14 重置了仓库，已删）
- [GitHub 接口：oirge/Mineradio](https://api.github.com/repos/oirge/Mineradio)
- [GitHub 搜索：Folia 相关仓库](https://api.github.com/search/repositories?q=folia+in:name,description&sort=updated&per_page=30)
- [githot：Folia 热榜记录](https://githot.dev/repo/chthollyphile/folia-major)
- [Zendot 介绍（2026-10-08）](https://zendot.org/en/posts/chthollyphile-folia-major)
- [OSSInsight 接口：folia-major 每日星数（第三方，自称数据有缺口）](https://api.ossinsight.io/v1/repos/chthollyphile/folia-major/stargazers/history/?per=day)
- [xlap 博客（2026-07-05）](https://blog.xlap.top/post/tech/2026-07-05/folia-major/)
- [txtmix 深度解析（2026-07-04，10-10 更新）](https://txtmix.com/posts/tech/chthollyphile-folia-major-immersive-lyrics-music-player-guide/)
- [tantan.ink 上手文（2026-07-07）](https://www.tantan.ink/folia-%e4%b8%8a%e6%89%8b%ef%bc%9a%e6%8a%8a%e6%ad%8c%e8%af%8d%e5%8f%98%e6%88%90%e6%96%87%e5%ad%97pv%ef%bc%8c%e6%94%af%e6%8c%81navidrome%e5%92%8c%e7%bd%91%e6%98%93%e4%ba%91%e7%9a%84%e5%bc%80%e6%ba%90.htm)（原链接 404，已换成文章现在的地址）
- [B 站接口：BV1VMtH6sEnn（4mtx，2026-08-30）](https://api.bilibili.com/x/web-interface/view?bvid=BV1VMtH6sEnn)
- [B 站接口：BV1iYea6zEVC（山海之花，2026-09-20）](https://api.bilibili.com/x/web-interface/view?bvid=BV1iYea6zEVC)
- [抖音安装教程视频（网页打不开，数据来自搜索摘要）](https://www.douyin.com/video/7695246286152473577)

**同类软件**
- [AMLL（amll-dev/applemusic-like-lyrics）](https://github.com/amll-dev/applemusic-like-lyrics)
- [Lyricify-App](https://github.com/WXRIW/Lyricify-App)、[GitHub 搜索：lyricify](https://api.github.com/search/repositories?q=lyricify&sort=stars&per_page=10)
- [GitHub 接口：jayfunc/BetterLyrics](https://api.github.com/repos/jayfunc/BetterLyrics)
- [boidushya/better-lyrics](https://github.com/boidushya/better-lyrics)
- [GitHub 搜索：spicy lyrics](https://api.github.com/search/repositories?q=spicy+lyrics&sort=stars&per_page=10)
- [GitHub 接口：LyricsX](https://api.github.com/repos/ddddxxx/LyricsX)
- [GitHub 接口：LyricFever](https://api.github.com/repos/aviwad/LyricFever)
- [Tom's Guide：Apple Music Sing](https://www.tomsguide.com/news/apple-music-sing-adds-karaoke-features-to-your-iphone-and-ipad)（核查时只读到标题）、[Stuff 2022-12-14：iOS 16.2 Apple Music Sing](https://stuff.co.za/2022/12/14/ios-16-2-apple-music-sing-karaoke-feature/)、[MacTrast 2022-12](https://www.mactrast.com/2022/12/apple-music-sing-feature-now-available-in-ios-16-2-release-candidate/amp/)
- [Music In Africa：iOS 26 歌词翻译](https://www.musicinafrica.net/node/365701)、[AppleInsider 2025-06-09：iOS 26 的音乐新功能](https://appleinsider.com/articles/25/06/09/ios-26-brings-big-changes-to-music-maps-and-wallet)
- [TechCrunch 2020：Spotify 歌词扩到 26 个市场](https://techcrunch.com/2020/06/29/in-a-significant-expansion-spotify-to-launch-real-time-lyrics-in-26-markets/amp)
- [tech.az 2026：Spotify 歌词更新](https://tech.az/en/posts/spotify-updates-lyrics-feature-offline-access-and-more-translations-6544)
- [当下软件园：网易云更新日志](https://www.downxia.com/downinfo/389592.html)（核查时超时，没打开）
- [微博：网易云鸿蒙版](https://weibo.com/2/detail/comos:niswezm5659223)（核查时打不开）、[PingWest 2026-09-23：网易云鸿蒙版全面上线](https://www.pingwest.com/w/317790)
- [数英 2025-08-15：神光模式上车机](https://www.digitaling.com/articles/1391347.html)、[数英 2025-12-12：琉璃光波播放器](https://www.digitaling.com/articles/1439521.html)
- [QQ 音乐下载页](https://y.qq.com/download/download.html)、[人人都是产品经理：QQ 音乐拆解（2022）](https://www.woshipm.com/evaluating/5523954.html)、[下么软件园](https://www.xiame.com/app/8508.html)
- [Steam：Wallpaper Engine](https://store.steampowered.com/app/431960/Wallpaper_Engine/)
- [projectM](https://github.com/projectM-visualizer/projectm)
- [Kaleidosync](https://github.com/zachwinter/kaleidosync)
- [Spotify 开发者博客 2024-11-27](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)（直接打开超时；内容由搜索结果里该页的摘要确认）
- [Plane9 官网](https://www.plane9.com/)
- [Neural Frames 价格页](https://www.neuralframes.com/pricing)、[Vidmuse 评测](https://vidmuse.ai/blog/neural-frames-review)
- [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)、[提交记录](https://github.com/JohnHeibel/PDoomVideo/commits/main)
- [lintsinghua/paint-mv-skills](https://github.com/lintsinghua/paint-mv-skills)
- [GitHub 搜索：2026 年 6 月后新建的歌词动画仓库](https://api.github.com/search/repositories?q=lyrics+animation+created:%3E2026-06-01&sort=stars&per_page=30)

**版权和条款**
- [维基百科：LyricFind](https://en.wikipedia.org/wiki/LyricFind)
- [aimusicpreneur：LyricFind 诉 Musixmatch 调解破裂（2026-09-04）](https://www.aimusicpreneur.com/ai-music-news/lyricfind-musixmatch-antitrust-mediation-collapse-2026/)
- [Billboard：LyricFind 起诉 Musixmatch](https://ca.billboard.com/business/legal/lyricfind-sues-rival-musixmatch-in-antitrust-suit-over-unprecedented-warner-licensing-deal)
- [Binaryify/NeteaseCloudMusicApi（已归档）](https://github.com/Binaryify/NeteaseCloudMusicApi)
- [NeteaseCloudMusicApiEnhanced/api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)
- [网易云音乐服务条款页（动态加载，本次未读到正文）](https://st.music.163.com/official-terms/service)

**「歌的科学」选题**
- [维基百科：Shepard tone](https://en.wikipedia.org/wiki/Shepard_tone)
- [维基百科：Speech-to-song illusion](https://en.wikipedia.org/wiki/Speech-to-song_illusion)
- [维基百科：Earworm](https://en.wikipedia.org/wiki/Earworm)

---

## 核实记录（10-14）

一共两轮。第二轮是另一个核查员 10-14 晚上从头独立重查的，下面先列第二轮，再保留第一轮的记录（第一轮里被第二轮推翻的两行已改）。

### 第二轮（独立重查，30 条）

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| Folia 6,210 星 / 593 复刻、AGPL-3.0、2025-11-28 建仓、TypeScript | ✅ 第二轮读到 6,290 / 607（当天还在涨），其余一致 | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major) |
| v0.7.17 / 18 / 19 = 10-10 / 10-11 / 10-13，另有每日测试版 | ✅ 时间都对（UTC）；测试版「Limo Nightly」10-14 还在出 | [Releases 接口](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8) |
| v0.7.18 下载合计约 13.7 万，安装包约 8.7 万 | ✅ 第二轮读到合计 139,027；latest.yml 42,419、blockmap 8,196、安装包 87,952（Windows exe 59,783）。已更新数字 | 同上 |
| README：网易云 / QQ / 酷狗 / Navidrome / 本地；逐字歌词；8 个主题名；AI 协助开发；非商业；35 位贡献者；建议手机用 PWA | ✅ 开头一句只列网易云、酷狗、Navidrome、本地，QQ 出现在歌词匹配和部署说明里。README 还写了高级用户可以用 Capacitor 自己打包安卓 APK | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| Folia 用 React + Electron，网易云接口用 api-enhanced | ✅ package.json 里有 react、electron、electron-updater，网易云依赖是 @neteasecloudmusicapienhanced/api；api-enhanced 页面 2.0k 星，README 说以原 NeteaseCloudMusicApi 为基础 | [package.json](https://raw.githubusercontent.com/chthollyphile/folia-major/main/package.json)、[api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) |
| Folium 市场 15 个（官方 7、社区 8），有「透明 MOV 歌词动画导出」（官方）和「AI 歌词动画导演」（duoduo1232） | ✅ 名单逐个对过；AI 导演用的是兼容 OpenAI 的接口 | [Folium 市场](https://folium-compound.cielaniska.top) |
| folia-android：10-10 建、76 星、README 写 v1.4.0 基于 0.7.18、QQ 风控 / 酷狗会员问题 | ❌ 建仓日对，星数现在 82。**作者 10-14（UTC）晚上重置了仓库**：只剩 2 次提交、1 个版本 v1.7.0（APK 约 37.3MB）；v1.4.0 的 README 链接 404；现在 README 不写基于哪一版、不写大小、没有「已知限制」。已删坏链接，QQ / 酷狗问题改标未核实 | [GitHub 接口](https://api.github.com/repos/Timingyyds/folia-android)、[Releases 接口](https://api.github.com/repos/Timingyyds/folia-android/releases?per_page=20)、[提交记录接口](https://api.github.com/repos/Timingyyds/folia-android/commits?per_page=20)、[标签接口](https://api.github.com/repos/Timingyyds/folia-android/tags) |
| Mineradio 304 星，基于 Mineradio 和 Folia 修改，电脑端 | ✅ 页面只提 Windows 安装包和 Electron，有桌面歌词、14 种歌词效果 | [GitHub](https://github.com/oirge/Mineradio) |
| 2026-07-04 首次上 GitHub 热榜第 14 名，+319 星；次日 +175 | ✅ | [githot](https://githot.dev/repo/chthollyphile/folia-major) |
| 「10-08 前后近 7 天 +2,034 星」，以及第一轮推出的「10-08 已到 5.9k，之后 6 天只涨约 300，涨势放缓」 | ❌ 弄反了。Zendot 页头是**实时数字**：第二轮再读变成 6.3k、「近 8 天 +2,395」。正文的 3,870 才是 10-08 发文时的数。3,870 + 2,395 ≈ 6,290，对得上。OSSInsight 的每日数据也一样：10-08 到 10-14 涨约 2,400，10-10 到 10-13 每天 336–582 星，9 月下旬每天只有三四十。已改一句话结论、1.4 时间线和判断 | [Zendot](https://zendot.org/en/posts/chthollyphile-folia-major)、[OSSInsight 接口](https://api.ossinsight.io/v1/repos/chthollyphile/folia-major/stargazers/history/?per=day) |
| B 站 4mtx 2026-08-30 发 v0.7.1 介绍、6,722 播放 | ✅ 发布于北京时间 08-30 20:35；第二轮读到 6,739 播放、296 赞 | [B 站接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1VMtH6sEnn) |
| B 站山海之花 2026-09-20、71 秒、标题「狂揽 2.8k stars」、7,996 播放 | ✅ 第二轮读到 8,037 播放、415 收藏 | [B 站接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1iYea6zEVC) |
| 抖音「成长小助手」10-11 安装教程、约 1,341 赞、「20 种动效」 | ⚠ 视频确实存在：搜索引擎收录了标题，摘要说 10-11 发布、简介写 20 种歌词动效。**赞数没看到**，仍未核实 | [抖音](https://www.douyin.com/video/7695246286152473577) |
| tantan.ink、xlap 标题里有「文字 PV」 | ✅ tantan.ink 标题「Folia：把歌词变成文字 PV 的播放器」；xlap 标题含「文字PV」，并写 AI 主题用 Google Gemini 接口 | [tantan.ink](https://www.tantan.ink/folia-%e4%b8%8a%e6%89%8b%ef%bc%9a%e6%8a%8a%e6%ad%8c%e8%af%8d%e5%8f%98%e6%88%90%e6%96%87%e5%ad%97pv%ef%bc%8c%e6%94%af%e6%8c%81navidrome%e5%92%8c%e7%bd%91%e6%98%93%e4%ba%91%e7%9a%84%e5%bc%80%e6%ba%90.htm)、[xlap](https://blog.xlap.top/post/tech/2026-07-05/folia-major/) |
| Lyricify 发布仓库 7.3k 星、本体不开源 | ✅ 7,316 星、没写许可证；README 说开源的是歌词处理代码和部分背景（Apache-2.0）；Lyricify 4 只支持 Spotify；macOS 版排在 2026–2027 | [GitHub 接口](https://api.github.com/repos/WXRIW/Lyricify-App)、[README](https://github.com/WXRIW/Lyricify-App) |
| LyricsX 5,234 / projectM 4.5k / AMLL 2.2k（只剩一个活跃维护者）/ BetterLyrics 2,208 / Better Lyrics 932 / Spicy Lyrics 645 / Lyric Fever 638 | ✅ 读到 5,234 / 4,532 / 2,169 / 2,207 / 932 / 645 / 639；许可证都对；AMLL README 原话「only one active maintainer」 | [LyricsX](https://api.github.com/repos/ddddxxx/LyricsX)、[projectM](https://api.github.com/repos/projectM-visualizer/projectm)、[AMLL](https://github.com/amll-dev/applemusic-like-lyrics)、[BetterLyrics](https://api.github.com/repos/jayfunc/BetterLyrics)、[Better Lyrics](https://api.github.com/repos/boidushya/better-lyrics)、[搜索接口](https://api.github.com/search/repositories?q=spicy+lyrics&sort=stars&per_page=10)、[Lyric Fever](https://api.github.com/repos/aviwad/LyricFever) |
| Kaleidosync 874 星、更新记录最多 8 种；Spotify 2024-11 收紧接口 | ✅ 874、8 种对。Spotify 2024-11-27 起新应用不能用「音频分析」「音频特征」等接口，老应用不受影响（搜索结果里官方博客的摘要确认；直接打开仍超时）。已去掉「未核实」 | [GitHub](https://github.com/zachwinter/kaleidosync)、[Spotify 开发者博客](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) |
| PDoomVideo：Opus 5.5 在 Claude Code 里用 p5.js 生成整支 MV，2.1k 星，提交在 09-22 到 09-25 | ✅ 2,104 星、7 次提交（09-22 到 09-25）、没写许可证；README 说「两次生成，都在 Claude Code 里」，用 p5.js + p5.brush、子 agent 并行、ffmpeg；歌来自一个 2024 年的 YouTube 视频 | [GitHub 接口](https://api.github.com/repos/JohnHeibel/PDoomVideo)、[提交记录接口](https://api.github.com/repos/JohnHeibel/PDoomVideo/commits?per_page=20)、[README](https://github.com/JohnHeibel/PDoomVideo) |
| paint-mv-skills：09-25 建、36 星、MIT、改自 PDoomVideo | ✅ 现在 37 星。GitHub 自动识别许可证是「Other」，README 写 MIT；安装脚本会去拉 PDoomVideo 的源码，那部分不在 MIT 里 | [GitHub 接口](https://api.github.com/repos/lintsinghua/paint-mv-skills)、[README](https://github.com/lintsinghua/paint-mv-skills) |
| Neural Frames 年付最低 26 美元/月，有歌词、对口型、分轨 | ✅ Neural Knight 年付 26 / 月付 39；功能列在通用区，没写哪档包含 | [价格页](https://www.neuralframes.com/pricing) |
| Spotify 歌词来自 Musixmatch，2020 年扩到 26 个市场 | ✅ | [TechCrunch 2020-06-29](https://techcrunch.com/2020/06/29/in-a-significant-expansion-spotify-to-launch-real-time-lyrics-in-26-markets/amp) |
| Spotify 2026 年 2 月初：翻译全球开放、离线歌词只给付费用户 | ✅ tech.az 文章 2026-02-05，没写 Spotify 哪天宣布 | [tech.az](https://tech.az/en/posts/spotify-updates-lyrics-feature-offline-access-and-more-translations-6544) |
| LyricFind 2025-03 起诉 Musixmatch；2026-09-03 联合信 Musixmatch 方不愿调解 | ✅ 被告是 Musixmatch 和 TPG；不愿调解的是 Musixmatch 和 TPG。⚠ 「华纳给 Musixmatch 独家授权挤掉 LyricFind」是 LyricFind 的指控，Musixmatch 说毫无根据，已在正文注明 | [aimusicpreneur 2026-09-04](https://www.aimusicpreneur.com/ai-music-news/lyricfind-musixmatch-antitrust-mediation-collapse-2026/)、[Billboard 2025-03-07](https://ca.billboard.com/business/legal/lyricfind-sues-rival-musixmatch-in-antitrust-suit-over-unprecedented-warner-licensing-deal)、[维基：LyricFind](https://en.wikipedia.org/wiki/LyricFind) |
| NeteaseCloudMusicApi 3.02 万星、2024-04-16 归档、README 第一句「保护版权，此仓库不再维护」 | ✅ 30,240 星；页面写 2024-04-16 归档；第一句逐字一致 | [GitHub](https://github.com/Binaryify/NeteaseCloudMusicApi)、[GitHub 接口](https://api.github.com/repos/Binaryify/NeteaseCloudMusicApi) |
| 网易云鸿蒙版 09-23 上线带「沉浸光感」；「神光模式」副歌动效（原标未核实） | ⚠ 鸿蒙版 ✅（PingWest 09-23 报道，沉浸光感是会员功能）；神光模式 2025-08-13 上车机 ✅；「副歌一响，神光来袭」出自 9.4.28 版（2025-12-11）更新日志，只在第三方下载站的搜索摘要里看到；「液态流光」没找到来源。已改正文 | [PingWest](https://www.pingwest.com/w/317790)、[数英 2025-08-15](https://www.digitaling.com/articles/1391347.html)、[数英 2025-12-12](https://www.digitaling.com/articles/1439521.html) |
| 谢泼德音阶 · Roger Shepard · 1964；《敦刻尔克》（2017）和《超级马里奥 64》用过 | ✅ 1964 是 Shepard 论文年份 | [维基](https://en.wikipedia.org/wiki/Shepard_tone) |
| 话语变歌错觉 · Deutsch · 1995；「原研究里」听 1 遍复述成说话、听 10 遍复述成唱歌 | ⚠ 1995 是发现年份，对；但「1 遍 vs 10 遍」是 Deutsch、Henthorn、Lapidis **2011 年**的论文，不是 1995 年的原研究。已改 | [维基](https://en.wikipedia.org/wiki/Speech-to-song_illusion) |
| 耳虫：Kellaris 说 98% 的人有过；2015 年雷丁大学口香糖研究 | ⚠ 维基确实这么写，但 98% 那句的脚注是 2009 年 The Straight Dope 专栏，不是 Kellaris 论文；原始研究和样本量未核实。口香糖是「could help」。已在正文注明 | [维基](https://en.wikipedia.org/wiki/Earworm) |
| Apple Music Sing 2022-12 / iOS 16.2；iOS 26（2025 年发布会）加歌词翻译和发音 | ✅ 第一轮只读到 Tom's Guide 标题；第二轮用 Stuff、MacTrast 确认 2022-12 随 iOS 16.2 上线、Apple TV 4K 要第三代；AppleInsider 确认 2025-06 WWDC 公布。已补来源 | [Stuff](https://stuff.co.za/2022/12/14/ios-16-2-apple-music-sing-karaoke-feature/)、[MacTrast](https://www.mactrast.com/2022/12/apple-music-sing-feature-now-available-in-ios-16-2-release-candidate/amp/)、[AppleInsider](https://appleinsider.com/articles/25/06/09/ios-26-brings-big-changes-to-music-maps-and-wallet) |
| Wallpaper Engine 4.99 美元、约 23.4 万条英文评测、97% 好评 | ✅ 读到 234,094 条；商店页确实没写「随音乐动」 | [Steam](https://store.steampowered.com/app/431960/Wallpaper_Engine/) |

**第二轮没能重查的**：folia-sonnet、Diorama（v0.5.27）这两条（核查后段 GitHub 接口限流、github.com 和 newreleases.io 抓取失败），QQ 音乐更新日志、Plane9、Neural Frames 的 Trustpilot 分数、2.5 节里 melismakit / WinLand / Arduino / Python 终端几个小仓库。这些沿用第一轮结果。

### 第一轮

| 说法 | 结果 | 依据（链接） |
|---|---|---|
| Folia 6,210 星 / 593 复刻、AGPL-3.0、2025-11-28 建仓、TypeScript | ✅ 核查时再读是 6,215 / 594（当天还在涨），其余一致 | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-major) |
| 用 React + Electron | ✅ 但出处不是 GitHub 接口，是 package.json；README 没提 React。已改来源 | [package.json](https://raw.githubusercontent.com/chthollyphile/folia-major/main/package.json) |
| v0.7.17 / 18 / 19 分别在 10-10 / 10-11 / 10-13 发布，另有每日测试版，代号 Realeco | ✅ 测试版叫「Limo Nightly」；Realeco 出现在各版标题里 | [Releases 接口](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8) |
| v0.7.18「所有安装包」下载合计 137,438 | ❌ 13.7 万是全部 15 个文件的合计，其中 latest.yml（自动检查更新用的小文件）占 42,408、blockmap 约 8 千。真正的安装包合计约 86,775（核查时）。已改 | 同上 |
| README：支持网易云 / QQ / 酷狗 / Navidrome / 本地，逐字歌词，AI 协助开发，非商业用途，35 位贡献者，PWA | ✅ 原话是「在 AI 的广泛协助下开发」「仅供个人学习、技术交流与非营利测试使用」 | [README](https://raw.githubusercontent.com/chthollyphile/folia-major/main/README.md) |
| 心象 / 云阶 对应 Cad / Pat 哪个（原文标未核实） | ✅ README 图片排列：心象 = Cad，云阶 = Pat。已改 | 同上 |
| AI 主题用哪家模型 | ⚠ README 没写；xlap 博客说 Gemini；v0.7.18 更新说明写「Gemini / OpenAI」两种密钥。已补 | [xlap](https://blog.xlap.top/post/tech/2026-07-05/folia-major/)、[Releases 接口](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8) |
| Folium 市场 15 个模组（官方 7、社区 8），有透明 MOV 导出和 AI 歌词动画导演 | ✅ 透明 MOV 是官方样例，AI 导演是社区作者 duoduo1232 | [Folium 市场](https://folium-compound.cielaniska.top) |
| folia-android：76 星、10-10 建、README 写 v1.4.0、基于 0.7.18、约 45MB、QQ 风控 / 酷狗会员问题 | ⚠ 星数和建仓日对。但 10-14 已更到 v1.6.0，最新 README 写基于 0.7.19、APK 35MB，且不再提 QQ 风控和酷狗会员问题；这两个问题只在 v1.4.0 时的 README「已知限制」里。已改（**第二轮补充**：作者随后重置了仓库，只剩 v1.7.0，v1.4.0 README 链接已 404，已从正文删掉） | [GitHub 接口](https://api.github.com/repos/Timingyyds/folia-android)、[Releases](https://github.com/Timingyyds/folia-android/releases) |
| folia-sonnet 3 星、2026-07-29 建 | ✅（「之后没再更新」没单独核实） | [GitHub 接口](https://api.github.com/repos/chthollyphile/folia-sonnet) |
| Mineradio 304 星、6-25 建、修改自 Mineradio 和 Folia | ✅ 但它看起来是电脑端播放器，放在「手机端」表里不合适，已加注 | [GitHub 接口](https://api.github.com/repos/oirge/Mineradio) |
| 2026-07-04 首次上热榜第 14 名，+319 星，次日 +175 | ✅ | [githot](https://githot.dev/repo/chthollyphile/folia-major) |
| 10-08 前后近 7 天 +2,034 星；一句话结论写「近一周多涨了 2,000 多星」 | ⚠ Zendot 页头确实写 5.9k、+2,034，但正文写 3,870 星，前后矛盾，也没写统计日期。~~如果页头数字是 10-08 当天的，那 6 天只涨了约 300，涨势已经放缓~~（**第二轮推翻**：页头是实时数字，正文 3,870 才是 10-08 的数，这 6 天其实涨了约 2,400，见第二轮） | [Zendot](https://zendot.org/en/posts/chthollyphile-folia-major) |
| 「Folia 一个人带 35 个贡献者，三天发一版」 | ⚠ 10 月实际是一两天一版（10-10、10-11、10-13），已改 | [Releases 接口](https://api.github.com/repos/chthollyphile/folia-major/releases?per_page=8) |
| B 站 4mtx 2026-08-30 发布、6,722 播放 | ✅ 核查时 6,724 播放、296 赞 | [B 站接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1VMtH6sEnn) |
| B 站山海之花 2026-09-20 发布、71 秒、标题「狂揽 2.8k stars」、7,996 播放、412 收藏 | ✅ 发布时间是北京时间 09-20 凌晨 03:57；核查时 7,998 播放 | [B 站接口](https://api.bilibili.com/x/web-interface/view?bvid=BV1iYea6zEVC) |
| 抖音安装教程 10-11、约 1,341 赞、「20 种动效」 | ⚠ 未核实。抖音网页打不开，搜索额度已用完 | [抖音](https://www.douyin.com/video/7695246286152473577) |
| tantan.ink 上手文 | ❌ 原链接 404。文章还在，已换成现在的地址 | [tantan.ink](https://www.tantan.ink/folia-%e4%b8%8a%e6%89%8b%ef%bc%9a%e6%8a%8a%e6%ad%8c%e8%af%8d%e5%8f%98%e6%88%90%e6%96%87%e5%ad%97pv%ef%bc%8c%e6%94%af%e6%8c%81navidrome%e5%92%8c%e7%bd%91%e6%98%93%e4%ba%91%e7%9a%84%e5%bc%80%e6%ba%90.htm) |
| 标题把它比作「文字 PV」 | ⚠ xlap、tantan.ink 标题里有；txtmix 没有这个词，只说「让听歌变看 PV」。已改 | [txtmix](https://txtmix.com/posts/tech/chthollyphile-folia-major-immersive-lyrics-music-player-guide/)、[xlap](https://blog.xlap.top/post/tech/2026-07-05/folia-major/) |
| Lyricify 7.3k 星、软件本体闭源 | ⚠ 7,315 星对；仓库没写许可证，README 没直说「闭源」，只说歌词处理代码和部分背景开源（Apache-2.0）。已改措辞 | [GitHub 接口](https://api.github.com/repos/WXRIW/Lyricify-App)、[README](https://github.com/WXRIW/Lyricify-App) |
| LyricsX 5,234 星 / projectM 4.5k / AMLL 2.2k（只剩一个活跃维护者）/ BetterLyrics 2,208 / Better Lyrics 932 / Spicy Lyrics 645 / Lyric Fever 638 | ✅ projectM 4,531、AMLL 2,169；AMLL README 原话「only one active maintainer」 | [LyricsX](https://api.github.com/repos/ddddxxx/LyricsX)、[projectM](https://api.github.com/repos/projectM-visualizer/projectm)、[AMLL](https://github.com/amll-dev/applemusic-like-lyrics)、[BetterLyrics](https://api.github.com/repos/jayfunc/BetterLyrics)、[Better Lyrics](https://github.com/boidushya/better-lyrics)、[搜索接口](https://api.github.com/search/repositories?q=spicy+lyrics&sort=stars&per_page=10)、[Lyric Fever](https://api.github.com/repos/aviwad/LyricFever) |
| Kaleidosync 有「20 多种」WebGL 图案 | ❌ README 更新记录最多写到 8 种，已改为未核实 | [GitHub](https://github.com/zachwinter/kaleidosync) |
| PDoomVideo：Opus 5.5 在 Claude Code 里用 p5.js 生成整支 MV，2.1k 星，提交在 09-22 到 09-25 | ✅ 2,098 星、7 次提交。补充：歌是 2024 年网上已有的歌；仓库没写许可证 | [GitHub 接口](https://api.github.com/repos/JohnHeibel/PDoomVideo)、[README](https://github.com/JohnHeibel/PDoomVideo) |
| paint-mv-skills 9-25 建、36 星、MIT、基于 PDoomVideo | ✅ LICENSE 文件是 MIT（GitHub 自动识别不出），但安装时下载的 PDoomVideo 源码不在 MIT 里，已补 | [GitHub 接口](https://api.github.com/repos/lintsinghua/paint-mv-skills)、[LICENSE](https://raw.githubusercontent.com/lintsinghua/paint-mv-skills/main/LICENSE) |
| Neural Frames 年付最低 26 美元/月，有歌词、对口型、分轨 | ✅ Neural Knight 年付 26、月付 39。价格页没写最低档是否含全部功能，已补 | [价格页](https://www.neuralframes.com/pricing) |
| Spotify 歌词来自 Musixmatch，2020 年扩到 26 个市场 | ✅ | [TechCrunch 2020](https://techcrunch.com/2020/06/29/in-a-significant-expansion-spotify-to-launch-real-time-lyrics-in-26-markets/amp) |
| Spotify 2026-02-04 更新：全球翻译、离线歌词只给付费用户 | ⚠ 内容对；文章日期是 2026-02-05，没写 Spotify 哪天宣布，已改成「2 月初」。「2021 年 11 月对所有用户开放」没有来源，标未核实 | [tech.az](https://tech.az/en/posts/spotify-updates-lyrics-feature-offline-access-and-more-translations-6544) |
| 华纳词曲 2024 年 3 月给 Musixmatch 独家授权 | ❌ 两篇来源和维基都没写签约月份，已改为未核实 | [Billboard 2025-03-07](https://ca.billboard.com/business/legal/lyricfind-sues-rival-musixmatch-in-antitrust-suit-over-unprecedented-warner-licensing-deal)、[维基：LyricFind](https://en.wikipedia.org/wiki/LyricFind) |
| LyricFind 2025 年 3 月起诉；2025 年 9 月部分驳回、核心继续；2026-09-03 联合信 Musixmatch 方不愿调解 | ✅ 起诉日是 2025-03-06；不愿调解的是 Musixmatch 和 TPG，LyricFind 愿意。已补 | [aimusicpreneur 2026-09-04](https://www.aimusicpreneur.com/ai-music-news/lyricfind-musixmatch-antitrust-mediation-collapse-2026/) |
| LyricFind 2024 年合作 5 万多家出版方、付了 2,500 万美元以上 | ✅ | [维基：LyricFind](https://en.wikipedia.org/wiki/LyricFind) |
| NeteaseCloudMusicApi 3.02 万星、2024-04-16 归档、README 第一句「保护版权，此仓库不再维护」 | ✅ | [GitHub](https://github.com/Binaryify/NeteaseCloudMusicApi) |
| Folia 用 api-enhanced（约 2k 星） | ✅ README 只在致谢里提到，依赖写在 package.json；api-enhanced 页面显示 2.0k 星 | [package.json](https://raw.githubusercontent.com/chthollyphile/folia-major/main/package.json)、[api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) |
| 网易云鸿蒙版 09-23 上线、「神光模式」等 | ⚠ 未核实。微博抓取失败，下载站超时（**第二轮**：鸿蒙版和神光模式已用媒体报道核实，见第二轮） | [微博](https://weibo.com/2/detail/comos:niswezm5659223)、[当下软件园](https://www.downxia.com/downinfo/389592.html) |
| 谢泼德音阶 · Roger Shepard · 1964；《敦刻尔克》和《超级马里奥 64》用过 | ✅ 1964 是 Shepard 论文年份 | [维基](https://en.wikipedia.org/wiki/Shepard_tone) |
| 话语变歌错觉 · Diana Deutsch · 1995；听 1 遍复述成说话、听 10 遍复述成唱歌 | ✅（**第二轮修正**：1 遍 vs 10 遍的实验是 2011 年的论文，不是 1995 年） | [维基](https://en.wikipedia.org/wiki/Speech-to-song_illusion) |
| 声调语言里效果弱一些（原文标未核实） | ✅ 维基写明在声调语言使用者中更弱，但仍会出现。已改 | 同上 |
| 耳虫：Kellaris 说 98% 的人有过；2015 年雷丁大学研究说嚼口香糖能压住它 | ⚠ 98% 维基里有，Kellaris 论文是 2001 年（**第二轮补充**：98% 那句的脚注是 2009 年的问答专栏，不是 Kellaris 论文）；口香糖原文是「could help」（可能有帮助），原文写「能压住」偏满，已改 | [维基](https://en.wikipedia.org/wiki/Earworm) |
| Wallpaper Engine 4.99 美元、234,081 条英文评测、97% 好评 | ✅；「随音乐动的壁纸」商店页没写，已标未核实 | [Steam](https://store.steampowered.com/app/431960/Wallpaper_Engine/) |
| Apple Music Sing 2022-12 / iOS 16.2；iOS 26 加歌词翻译和发音 | ⚠ Tom's Guide 页面只读到标题，Sing 的日期和版本没能从该页核对；Music In Africa 确认 iOS 26 加了歌词发音和翻译，但没写发布会年份 | [Tom's Guide](https://www.tomsguide.com/news/apple-music-sing-adds-karaoke-features-to-your-iphone-and-ipad)、[Music In Africa](https://www.musicinafrica.net/node/365701) |

**没有复查的**：2.5 节里 spicy-ex（40）、spicylyrics/mobile（25）、sweet-lyrics-ios（7，10-10 建）、KineSync（4）已从搜索接口核对无误；melismakit、WinLand、Arduino 歌词屏、Python 终端歌词没复查（GitHub 接口限流）。QQ 音乐更新日志、Plane9、Spotify 开发者博客（再次超时）也没复查。
