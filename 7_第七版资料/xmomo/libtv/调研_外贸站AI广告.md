# 调研：真丝枕套 DTC 站 30 秒 AI 广告（2026-11）

标注约定：【事实】= 有来源；【归纳】= 我的推断；「没查到」= 未找到可靠来源。

## 1. 同类品牌广告怎么拍

【事实】
- sprites.ai 对 16 条真丝枕套视频广告（7 个广告主）的分析：CTA 按钮 "Learn more" 54% / "Shop now" 38% / "See details" 8%；开头 0% 用问句、31% 以数字开头、19% 带 emoji；中位投放 48 天，最长 466 天（Blissy 的折扣广告）。来源：https://www.sprites.ai/silk-pillowcase-video-ads
- 该页把钩子分为：折扣型、"换掉棉枕套"型、个人见证型、先说好处型、直呼观众型、品牌背书型。该页只有缩略图和文案，看不到具体镜头，**画面层面的拆解（棉 vs 丝对比、水滴测试、晨起头发在广告里的占比）没查到**。
- Slip 在 Meta 上约 719 条广告，样本中 23/24 用 "Shop Now"；约 68% 图片、32% 视频；热门标题 "Up to 60% Off"。来源：https://admanage.ai/ad-library/slip
- AdSwipeFile 对 Slip 57 条广告的分类：钩子以 Myth busting（6）、Offer only（5）、Explainer（4）居多；画面是女性睡眠/放松的生活方式镜头、"Allure Best of Beauty" 奖牌、屏幕文字 "Skin Hydration / Skin Texture & Smoothness"；视频末尾卡 "SHOP NOW + slip.com"。来源：https://adswipefile.com/brands/slip
- Slip 定位：卖"美容睡眠"而不是寝具，对标 $80 护肤品而不是 $30 棉枕套（广告库平台的分析，非 Slip 自述）。来源：https://adlibrary.com/brands/slip

【归纳】
- 行业内视频多为"第一行文案承担钩子 + 产品好处 + 折扣/奖项 + CTA"。你们的品牌没有大折扣锚点，更适合用「画面对比」做钩子（棉 vs 丝处理护肤品/头发），用 OEKO-TEX 与刺绣定制做送礼 Offer。
- 前 3 秒最好是：动态的强对比画面（例如同一滴乳液落在棉面上被吸走、落在丝面上停住）+ 一行大字，而不是品牌 logo。

## 2. AI 视频做电商广告的通行做法

【事实】
- 先出批准的静帧（产品图作为"视觉权威"），再图生视频；只描述动作和镜头，不让模型"补全没见过的面"。来源：https://promptessor.com/blog/ai-product-video-prompts-2026
- Seedance 提示词公式：主体 + 动作 + 镜头 + 场景 + 光线 + 风格 + 时长 + 约束；建议"一次只改一个变量""去掉对文字的硬要求"。来源：https://www.seeddance.io/blog/seedance-prompts
- Seedance 2.5：单次最长 30 秒、最多 50 个参考输入；Kling 3.0：3–15 秒，支持 Shot 1/2/3 多镜头写法。来源：https://creatify.ai/blog/seedance-2-5-vs-kling-3-0 、https://www.mindstudio.ai/blog/what-is-seedance-25-bytedance-video-model
- Designkit 的分工建议：Kling 做产品运动与批量变体，Seedance 做参考锁定的主视觉；包装文字/logo 两者都有风险，**片尾用静态结束卡后期加**。来源：https://www.designkit.com/blog/seedance-vs-kling
- 公认翻车点：手与产品的接触、屏幕文字乱码、光线漂移；建议关键文字放后期合成，人工检查接触帧。来源：https://www.digitalapplied.com/blog/ai-video-product-swap-ads-ecommerce-local-redraw-2026
- 厂商宣传 Kling 3.0 的布料与液体物理更好、文字保持更稳（厂商/聚合站说法，且 MindStudio 的对比测试中 Kling 字母仍有轻微变形）。来源：https://www.sellerpic.ai/models/kling-3 、https://www.mindstudio.ai/blog/seedance-kling-minimax-video-model-comparison
- 「AI 擅长微距/布料/液体/光」：只有厂商层面的零散说法，**没查到独立的从业者复盘专门验证**。

【归纳】
- 流程：产品实拍图 → 生图锁定每个镜头首帧 → 每镜头 3–5 秒图生视频 → 剪辑 → 后期加字幕/logo/价格/CTA。
- 英文提示词示例（Seedance/Kling 通用写法，我自拟）：
  - `Macro shot, a drop of face serum lands on cotton fabric and soaks in; cut to the same drop beading on champagne silk. Soft window light, shallow depth of field, static camera. No text, no hands.`
  - `Slow push-in on a champagne silk pillowcase, fabric ripples gently as a hand-free breeze passes, natural morning light, keep embroidery pattern unchanged.`
  - 约束写法：`keep product shape, color and seams identical to the reference image; no text, no logo in frame.`
- 避免：人手摸/抓产品、让模型生成字幕或 logo、一个提示词塞多个动作、画整只枕套 360° 旋转。

## 3. 30 秒结构与画幅

【事实】
- 常见建议 15–30 秒为冷流量转化的甜区；Hook 0–3 秒，之后依次问题、方案、结果、CTA；CTA 只给一个。来源：https://apexbrands.io/blog/how-to-use-video-creative-to-drive-dtc-conversions 、https://www.askneedle.com/blog/how-to-create-video-ads
- 竖版 9:16 是 Reels/TikTok 默认，多篇指南建议先做 9:16 再改 16:9 / 1:1；Meta 信息流另有 4:5；16:9 主要用于 YouTube 贴片和 Meta 视频内插播。来源：https://adsturbo.ai/blog/dtc-video-ads 、https://www.get-ryze.ai/blog/facebook-ad-sizes-complete-specs-guide-for-2026
- 静音可看：多篇指南称约 80–85% 观看无声（均为二手博客数字，非平台官方数据）。来源：https://virvid.ai/blog/ai-video-ads-complete-guide-2026 、https://www.inreels.ai/blog/shopify-video-ads-complete-guide
- 「最后 3–5 秒放 CTA」「中段加入证明比全放结尾掉量少」同上 apexbrands 来源。

【归纳】推荐 30 秒（可直接对应 Kling 的 3–15 秒单镜头拼接）：
| 秒数 | 段落 | 内容 |
|---|---|---|
| 0–3 | Hook | 棉 vs 丝吸收/滑过对比，一行大字 |
| 3–9 | Problem | 晨起毛躁头发、枕痕、护肤品被吸走 |
| 9–18 | Solution | 22 momme 6A 丝面微距、眼罩 100% 遮光、发帽 |
| 18–24 | Proof | OEKO-TEX、材质数字（用数字做对比）、真实感好评字幕 |
| 24–30 | Offer+CTA | 刺绣定制送礼 + 品牌名 + 一个 CTA 按钮 |
- 画幅：站内首页用 16:9，投放以 9:16 为主。因为 AI 画幅需要分别生成，建议先做 9:16 母版，16:9 单独重生成首帧，不要裁切。所有信息都以字幕承载，声音只是加分。

## 4. 合规

【事实】
- NAD（BBB National Programs，据报道 2026-10-05 公布）建议 Blissy 停用 "Anti-aging""Wrinkle-preventing"、防止新皱纹、"acne-fighting"、"90% fewer blocked pores"，并修改"完全防止断发/打结"的宣称，以及皮肤科医生背书的表述；理由是证据（自报、无对照组等）不足。Blissy 表示将遵守。来源：https://www.cbinsights.com/company/blissy 、https://truthinadvertising.org/articles/blissy-silk-pillowcases 、https://www.ahdootwolfson.com/blog/blissy-silk-pillowcase-class-action-investigation
- FTC 要求健康相关宣称有 "competent and reliable scientific evidence"，通常指随机对照人体试验。来源：https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance
- 欧盟化妆品宣称：不可含医疗/治疗暗示；"hypoallergenic" 不应暗示零过敏风险，部分国家（如德国）不接受。来源：https://www.ctpa.org.uk/resources-claims 、https://www.ecomundo.eu/en/blog/eu-regulations-cosmetic-product-claims（注：枕套不是化妆品，这是类比参照）
- Slip 自己在 Instagram 简介仍写 "ANTI AGING. ANTI SLEEP"（品牌可能有自己的证据，不能照搬）。来源：https://www.instagram.com/slipsilkpillowcase
- AI 标注：TikTok 要求对逼真的 AI 视频/图像打 AI 标签（上传时开关），也会通过 C2PA 自动标注，自动标签无法移除。来源：https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- Meta：强制自我声明只针对社会/选举/政治类广告；其余广告在使用其生成工具或被检测到第三方 AI 时自动加 "AI info"，据第三方文章，2026-06 起检测范围扩大。来源：https://www.digitalapplied.com/blog/ai-content-labeling-rules-advertisers-2026-reference 、https://www.usefastlane.ai/blog/do-you-have-to-label-ai-generated-content
- FTC：不要求所有 AI 广告打泛标签，但不得伪造证言/评价，合成"客户"不能当真实顾客。来源：https://battlebridge.com/blog/ftc-rules-for-ai-generated-ads-endorsements-claims-and-disclosure
- anti-bacterial 在美国/欧盟的具体监管（如抗菌处理纺织品）：**没查到**可靠来源。

【归纳】
- 风险高：anti-aging、prevents wrinkles、acne、anti-bacterial、hypoallergenic、"clinically proven"、"dermatologist recommended"（没有自己的证据就别写）。
- 相对安全（描述材料特性/机制，不承诺结果）：`Smooth 22 momme mulberry silk` / `Less friction than cotton` / `Silk absorbs less than cotton` / `Helps your skincare stay on your skin` / `Gentle on hair` / `OEKO-TEX Standard 100 certified`（需有证书编号可查）/ `100% blackout`（需自测）。
- AI 人物/视频：TikTok 投放时打 AI 标签；不要用 AI 人物伪装成真实买家说"我用了一个月"；建议片中尽量少出现脸，以产品微距为主。

## 5. 真实在用的英文短句（只学句式）
1. "Did you know your cotton pillowcase might be stealing your expensive skincare?" — Exclusive Blissy Offers（问题揭示）
2. "3 Reasons to Ditch Your Cotton Pillowcase" — Skincare Routine 101（数字+换掉）
3. "Why I switched to a silk pillowcase" — Exclusive Blissy Offers（见证）
4. "Smoother hair and softer skin. While you sleep." — Emily's Pillow（好处+时机）
5. "Girls and boys, if you're not sleeping on a silk pillowcase, you're seriously missing out" — 第三方账号（直呼）
6. "Award-winning self-care must-haves" — Kitsch（背书）
7. "Upgrade your beauty sleep with Slip's award-winning 100% silk pillowcases, eye masks & scrunchies." — Slip UK
8. "A Hair Tie That Doubles as Hair Care." — Slip
9. "Your Hair Tie Upgrade Starts Here — Anti Damage, Anti Snag" — Slip（含 anti- 宣称，仅学结构）
10. "NEW IN FOR NEW CURLS!" — Emily's Pillow（新品+人群）
11. "BUY NOW For 55% Off!" — Blissy（折扣型）
12. "Anti Aging. Anti Sleep Crease. Anti Bed Head." — Slip 官网 slogan（"anti-"三连句式，宣称要换成安全版）
以上来源：sprites.ai、admanage.ai、slip.com。
【归纳】可借用的句式：`Your pillowcase vs your skincare.` / `Cotton drinks it. Silk keeps it.`（自拟，需配证据）/ `Sleep on it. Wake up smoother.` / `The gift that's stitched just for them.`（刺绣）。CTA 用 "Shop now"（站内）或 "Learn more"（冷流量）。
