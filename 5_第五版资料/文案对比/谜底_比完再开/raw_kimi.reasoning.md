Let me understand the task:

1. Write for Douyin's "vibe知识大赏" (vibe knowledge awards) - AI-generated knowledge short films, 3-5 minutes each
2. Style: near-black background, light is the protagonist, one thing per screen, no voiceover, all text via subtitles, music carries emotion
3. Content: a named big idea, with person names and years, starting from a small life moment, ending back at life
4. Audience: ordinary people scrolling short videos

Feedback requirements:
1. Use plain language and vivid imagery, explain one thing thoroughly. Principle first, then examples.
2. Key numbers must be expressed through comparison. E.g., not "14 degrees" and "15 degrees" but "only 1 degree warmer than before".
3. Things mentioned before must be visually brought back when referenced later.
4. First 10 seconds: something must actually happen to the viewer - guess a number, wait for something, get startled. Just asking a question doesn't count.
5. No classroom language: no "知识点、记住、注意、正确答案、选项", no A/B/C options.
6. No self-coined terms. If a new term is needed, first show a concrete picture.
7. No "AI/Claude generated" at the end.

Time: mid-October 2026, Shanghai entering autumn, cooling down, winter coming.

Deliverables:
1. Three topic proposals, each with:
   - Title (2-4 characters)
   - Douyin title (one hook sentence)
   - The big idea behind it: name, who proposed it, what year
   - Why viewers these days would want to watch
   - First 10 seconds: what happens to the viewer

2. One complete script: **风寒效应：为什么同样的温度，一刮风就冷得多** (Wind chill effect: why same temperature feels much colder when wind blows)
   - Duration: 3.5-4.5 minutes
   - Format: by chapters, each line one subtitle, format: `seconds | Chinese subtitle | visual`
   - Chinese subtitles max 20 characters each, no English
   - Visual: one sentence describing what's on screen
   - Title: where it appears - must appear AFTER the opening experience
   - Chapter progression: each chapter escalates, later chapters use earlier content
   - Golden quotes: max 3-4, at chapter ends
   - Spectacle: one most stunning full-screen visual in the middle
   - Ending: return to the opening moment, land on a view
   - Facts: names, years, experiments, numbers must be real. List a fact table at the end with sources; mark uncertain ones "待核" (to be verified)

Let me think about the wind chill effect facts:

**Wind Chill Effect (风寒效应)**:
- The wind chill index was developed by Paul Siple and Charles Passel in 1945. They did experiments in Antarctica measuring how long water took to freeze at various temperatures and wind speeds.
- Their original formula was based on heat loss from a plastic cylinder of water.
- In 2001, the US National Weather Service (NWS) and Environment Canada updated the wind chill index formula based on human face heat loss models. The new formula was developed by a Joint Action Group for Temperature Indices (JAG/TI), with key work by Randall Osczevski (Canada) and Maurice Bluestein (US). Actually let me recall: Osczevski and Bluestein published "The New Wind Chill Equivalent Temperature Chart" in 2005 in the Bulletin of the American Meteorological Society. The new formula was adopted in November 2001 by NWS.
- The formula: WCT = 35.74 + 0.6215T - 35.75(V^0.16) + 0.4275T(V^0.16) where T is in °F and V in mph.
- Wind chill only applies to warm-blooded objects; it doesn't make things colder than air temperature - a car won't freeze below air temp, it just reaches air temp faster.
- Mechanism: your body heats a thin layer of air next to skin (boundary layer). Wind strips this warm layer away, forcing your body to reheat new cold air constantly. This accelerates heat loss.
- At 0°C with wind, it can feel like -7°C or so at certain wind speeds. Let me get some real numbers:
  - Using the new formula (metric): WCT = 13.12 + 0.6215T - 11.37(V^0.16) + 0.3965T(V^0.16), where T in °C, V in km/h.
  - At T = 5°C, wind 20 km/h: WCT = 13.12 + 3.1075 - 11.37*(20^0.16) + 0.3965*5*(20^0.16)
    - 20^0.16 = e^(0.16*ln20) = e^(0.16*2.9957) = e^0.4793 = 1.615
    - WCT = 13.12 + 3.11 - 11.37*1.615 + 1.9825*1.615 = 13.12 + 3.11 - 18.36 + 3.20 = 1.07°C
    - So 5°C with 20 km/h wind feels like ~1°C.
  - At T = 10°C, wind 30 km/h: 30^0.16 = e^(0.16*3.401) = e^0.544 = 1.723
    - WCT = 13.12 + 6.215 - 11.37*1.723 + 3.965*1.723 = 13.12 + 6.215 - 19.59 + 6.83 = 6.57°C
    - So 10°C with 30 km/h wind feels like ~6.6°C.
  - Stronger: T = 0°C, wind 40 km/h: 40^0.16 = e^(0.16*3.689) = e^0.590 = 1.804
    - WCT = 13.12 + 0 - 11.37*1.804 + 0 = 13.12 - 20.51 = -7.4°C
    - So 0°C with 40 km/h wind feels like -7.4°C.

- Frostbite risk: the wind chill chart shows frostbite times. At certain wind chills, exposed skin can get frostbite in under 30 minutes, extreme cases under 5 minutes.

- The body loses heat via convection. Water conducts heat ~25x better than air - that's why being wet + wind is deadly. Actually water conducts heat away ~25 times faster than air at same temperature. Some say 23-25x. Let me mark as approximately 25x (待核 maybe, but it's commonly cited as ~25x).

- Hypothermia can happen above 0°C if wet and windy.

- Siple & Passel's experiment: 1945, Antarctica (Little America? Actually they were at... Siple was with Byrd's Antarctic expeditions; the experiments were done in 1941-1945). Their measurements: time for water in a plastic cylinder to freeze. Published 1945: "Measurements of dry atmospheric cooling in subfreezing temperatures" in Proceedings of the American Philosophical Society. So 1945 is right.

- The term "wind chill" — Siple coined "wind chill index"? The term windchill was popularized by them. Some say the term was coined by Siple in 1939? The 1945 paper introduced the wind chill index. Good enough: 1945.

- 2001 update: new formula based on human trials - people walking on treadmills in a wind tunnel, measuring facial heat loss. The experiments: volunteers' faces exposed in a wind tunnel with various conditions, at Defence R&D Canada (Osczevski). The new index uses the face (most exposed part). Adopted November 1, 2001 by US NWS and Environment Canada.

- Interesting fact: wind chill doesn't affect cars/objects - they just cool to air temperature faster. A common misconception.

- The formula assumes walking speed ~5 km/h (a person walking into the wind at 1.34 m/s). The wind speed is measured at 10 m (anemometer height) adjusted to face level (~1.5m).

- Numbers for Shanghai winter: typical January temperature ~3-5°C. Wind chill makes it feel several degrees colder.

Now, the opening 10 seconds: viewer must experience something. Options:
- Show a number (e.g., 8°C) and make them wait/guess what the "feels like" temperature is... but "asking a question doesn't count". Hmm, need something to actually happen: guess a number, wait for something, be startled.
- Idea: Screen shows a calm dark screen with "今日上海 8℃" and then wind sound + the number suddenly drops to "体感 2℃" — the drop is a scare/surprise. Or make the viewer hold... Actually a good one: put your hand out / blow on your hand - interactive! "把手举到嘴边，哈一口气" then "再用力吹一口气" - the viewer feels warm breath vs fast breath feels cooler. That's a real physical experience in 10 seconds! Blow slowly (haaa) on your palm = warm; blow fast with pursed lips = cool. Same air from your body, same temperature, different speed → different feeling. That's a perfect micro-experiment that demonstrates the core principle and happens ON the viewer's body.

Wait, but blowing fast feels cooler partly due to... actually the fast-moving air entrains room air and also increases evaporation. But it works as a felt experience of moving air stripping heat. The physics: breath is ~34-36°C, feels warm when slow; fast breath mixes with cool room air and speeds evaporation, feels cool. It's a classic demo. Good for the opening - viewer's body actually does something.

Then the title appears after this experience: 「风一吹，就冷了」 or 「风寒」...

Actually the title: 风寒效应 is the topic name. Film title (2-4 characters for the three topics; for the full script, the title should be stated where it appears). Let me think of a good film title: 「偷热的风」? 「风的体温」? 「体感」? 「风寒」? Maybe 「偷走体温的风」... 2-4 chars: 「风偷」? weird. 「体感温度」 is 4 chars but it's a term. 「风寒」 2 chars, clean. Or 「刮风天」. Let me use 「风寒」 or 「偷热的风」 (4 chars). Hmm, "偷热的风" is 4 characters and evocative. But rule 6: no self-coined terms unless shown visually first. "偷热的风" is a poetic title, and the film will show wind stealing the warm layer — fine.

Actually for the film itself, since the topic is fixed (风寒效应), the title can be creative. Let me pick 「偷热的风」 with the formal term 风寒效应 appearing in the film.

Structure plan (3.5-4.5 min = 210-270 seconds). Let's target ~240 seconds (4 min).

Chapters:
1. 开场体验 (0-15s): blow on palm experiment. Warm haaa vs cool fast blow. Same mouth, same breath.
2. Title appears (~15-20s).
3. 原理 Chapter: the warm air layer next to skin. Body heats a thin layer of air (~few mm). Wind strips it. Body must reheat. Numbers: skin surface ~33°C vs air. The boundary layer concept shown as a glowing halo around a hand/body outline, wind lines tearing it.
   - Principle first, then examples (rule 1).
4. 故事/历史 Chapter: 1945, Antarctica, Siple & Passel, plastic cylinder of water, timing freezing. The first wind chill index. Then 2001: wind tunnel with human faces, new formula, NWS adoption. 
5. 数字 Chapter: feel-like temperature comparisons. Shanghai: 8°C calm vs 8°C + 30km/h wind feels like ~4-5°C. Show the table as wind speeds up, feel temp drops. The spectacle: full screen of the wind chill table as a glowing grid/map? Or the full-screen spectacle could be: a human figure's warm halo being shredded by wind, the number dropping live. The brief says "中间要有一处全片最震撼的满屏画面" - middle of film. Could be the Antarctica scene: full screen of black with a single cylinder of water freezing while wind rages, timer running. Or the "wind chill map of China" glowing.

Let me design the spectacle: At the chapter about how much heat wind steals — a full-screen visualization: a human silhouette filled with warm glow; wind lines multiply, and the glow drains like a battery — heat loss rate numbers climbing: 2x, 3x... Actually real data: wind chill isn't linear. Hmm.

Better spectacle: "把整座城市的风按下来" - no. Let me think about what's visually stunning and factually grounded: The 2001 wind tunnel face experiment: volunteers' faces in wind tunnel, thermographic imaging (infrared) showing face heat glowing then being stripped. A full-screen infrared-style glowing face, heat visibly bleeding away in colored wisps as wind rises — that's stunning and true-ish (they measured face heat flux with sensors; infrared thermography is plausible; mark details 待核).

Or the Antarctica cylinder: 1945, a cylinder of water suspended in Antarctic night, wind screaming, a timer counting down to freeze. Full-screen: the water turning to ice crystal patterns blooming across the whole black screen. Frost patterns blooming full-screen = gorgeous and feasible with AI generation. And it ties to a real experiment.

I like: spectacle = frost crystals blooming full-screen as the water freezes, with wind sound. It happens mid-film (Siple & Passel chapter is around the middle).

Chapter progression logic (each builds on previous):
1. 体验：同一口气，快吹凉、慢吹暖 — moving air feels colder (phenomenon on your body).
2. 原理：皮肤外有一层被焓热的空气（贴身的"暖气层"），风把它一层层撕走，身体只能不断重新加热 — heat loss accelerates.
   - Uses ch1: the fast blow stripped your hand's warm layer.
3. 衡量：1945 南极，Siple & Passel 用水结冰的时间称出风偷热的速度 → 风寒指数诞生；2001 年用真人脸重测，新公式 — now we can put a number on the stealing.
   - Uses ch2: same principle (water cylinder also has warm layer? Actually water freezing time measures heat loss rate — connected to ch2's heat loss).
4. 数字：用 2001 公式算体感：上海这几天的真实天气，8℃ 无风 vs 刮风 → 体感 X℃。对比说话（规则2）。还有：水导热是空气的约25倍 → 湿冷+风 = 失温更快。失温数字：皮肤暴露多久会冻伤。
   - Uses ch3's formula/index.
5. 误区+落地：风不会让物体比气温更冷——车里的水不会冻成冰，只是冷得更快；风只"偷活物的热"（让散热变快）。回到开头：再吹一口气。金句收尾：风没有改变温度，它改变的是你和冬天之间的距离？Something poetic: "温度计量的是空气，你感觉的是你失去的热" or "风不冷，冷的是被带走的热" ... land on a way of seeing the world: "看天气预报，别只看温度，要看风" — practical + philosophical: "冷，不是温度，是流失" (cold isn't a temperature, it's a rate of loss).

Golden quotes (3-4 max, at chapter ends):
- End ch2: 「你不是被空气冻冷的，是被风掏空的。」Hmm, let me craft: 「冷的不是风，是被风带走的热。」 (that's a good one)
- End ch3: 「他们量不出风有多冷，就量热跑得有多快。」 
- End ch4: 「风每快一点，冬天就近一步。」? or about numbers: 「天气预报里的温度，是没刮风时的温度。」
- End: 「温度是空气的事，冷暖是身体的事。」/「风不改温度，它改的是你散热速度」 final: 「风没有让天更冷，它只是让热离开得更快。」Or philosophical: 「所谓风寒，不是天气变了，是你和世界换热的方式变了。」Too lecture-y. Keep simple: 「风不生产冷，风只是热量的搬运工。」Hmm that's a meme format (搬运工), maybe too jokey. Let me finalize:
  - Ch1 end: none (title comes)
  - Ch2 end: 「冷不是风吹来的，是热被吹走的。」
  - Ch3 end: 「测不出风有多冷，就测热逃得多快。」
  - Ch4 end: 「风再大，也吹不低一度气温；吹得低的，只有你的体温。」
  - Final: 「下次出门前，看一眼风。」 — landing on a way of seeing. Or: 「温度计管天气，风管你。」Let me make the final line: return to palm: 「再对手心吹一口气——慢的是体温，快的是冬天。」Hmm.

Let me be careful with facts and numbers:

1. Breath: slow haa on palm warm, fast blow cool — true everyday experience. (Fast air entrains ambient + evaporation; also faster convective cooling... actually breath at ~34°C: slow warm breath deposits warm moist air; fast pursed-lips stream is narrow, entrains cool room air, and speeds evaporation of skin moisture → feels cool. Fine as experience; I won't over-explain physics falsely — I'll frame it as "same breath, moving faster feels cooler" which is the experiential hook, then the film explains wind chill on skin at 33°C vs cold air. Actually careful: the palm-blow demo involves room-temp air mixing; the wind chill principle involves skin warmer than air. The film's explanation: skin keeps a thin warm layer; fast air strips it. For breath demo: fast breath strips hand's warm layer + adds evaporation. Close enough for a hook; I can explicitly bridge: "凉的秘密不在嘴里，在手上" then explain skin's warm layer.)

2. Skin surface temperature: ~33-34°C when comfortable (core 37°C). Commonly cited: skin ~33°C. Fine: 「皮肤表面大约 33℃」 (待核-ish but standard; I'll cite as common physiology, mark source generally). Actually many sources say average skin temp ~33-34°C. I'll say 33℃.

3. The "warm layer" (boundary layer): a few millimeters of air heated by the body. True (convective boundary layer around human body, ~several mm to ~1 cm, rising plume). I'll describe as "几毫米厚" and mark 待核 if needed. The human thermal plume is real.

4. Siple & Passel 1945: Paul A. Siple & Charles F. Passel, "Measurements of dry atmospheric cooling in subfreezing temperatures," Proceedings of the American Philosophical Society, 1945. Experiments in Antarctica: measured freezing time of water in a plastic cylinder (some accounts: a 50-gram? cylinder of water, actually a small plastic cylinder, at Little America? The experiments were conducted during the U.S. Antarctic Service Expedition 1939-41). Hmm — the 1945 paper used data from Antarctic expeditions (1939-1941). Common citation: "In 1945, Antarctic explorers Paul Siple and Charles Passel conducted experiments measuring how long it took water to freeze in various wind/temperature conditions." The number often cited: a cylinder containing 250 g? of water. Some sources say "a plastic container of water" measured cooling rates. I'll keep detail light: "在南极，他们把一筒水挂进风里，记录结冰的时间" and mark year 1945 firm; specific expedition date as 待核 if I mention 1939-41. I'll just say 1945 年发表.

5. 2001 new formula: adopted by US NWS & Environment Canada in 2001 (Nov 1, 2001 in US; Canada adopted in 2001 too). Based on wind tunnel trials with human volunteers — face heat loss measured. Key researchers: Randall Osczevski (Canada, Defence R&D) & Maurice Bluestein (US). Published chart 2005 (Osczevski & Bluestein, BAMS 2005). I'll mention 2001 adoption; the human-face wind tunnel tests at Defence Research and Development Canada in Toronto — mark 待核 for the lab name. Bluestein is known for wind chill research (also "wind chill" misconception articles). I can name: 奥切夫斯基与布鲁斯汀? Chinese transliteration uncertain. Maybe better to keep names minimal: Siple & Passel (西普尔、帕塞尔) 1945; 2001: 美国国家气象局和加拿大环境部启用新公式, based on 真人风洞实验. I could name Osczevski — risky transliteration; I'll include with 待核 note.

6. Wind chill formula numbers (metric, new 2001 formula):
   WCT = 13.12 + 0.6215T − 11.37V^0.16 + 0.3965T·V^0.16 (V in km/h at 10m, T in °C)
   Compute a few:
   - T=8°C, V=0 (or <5 km/h, formula baseline): V^0.16 for V=5: 5^0.16=e^(0.16*1.609)=e^0.2575=1.294 → WCT=13.12+4.97−11.37*1.294+3.172*1.294=13.12+4.97−14.71+4.10=7.48 ≈ 7.5°C. Basically calm ≈ air temp. Good: "8℃，没风，体感约8℃".
   - T=8°C, V=30 km/h: V^0.16: ln30=3.401, *0.16=0.544, e^0.544=1.723 → 13.12+4.97−19.59+5.47=3.97 ≈ 4°C. So 8°C + 30 km/h wind feels like ~4°C. 30 km/h is about 5级风? Beaufort: 5级 (fresh breeze) = 29-38 km/h. Shanghai autumn gusts commonly 4-5级. Good relatable: "5级风".
   - T=8°C, V=50 km/h (7级风, 50-61 km/h is 7-8级): ln50=3.912*0.16=0.626, e^0.626=1.870 → 13.12+4.97−21.26+5.93=2.76 ≈ 3°C.
   - T=0°C, V=40 km/h: computed earlier ≈ −7.4°C. Nice: "0℃ 挂 6 级风（40km/h 上下），体感 −7℃" — strong comparison.
   - T=−5°C, V=40 km/h: 13.12−3.11−20.51+0.3965*(−5)*1.804=13.12−3.11−20.51−3.58=−14.1 ≈ −14°C.
   - Frostbite times from the NWS wind chill chart: at WCT ≈ −28°C, frostbite in ~30 min; at −40°C, ~10 min; at −48°C, ~5 min. Common chart: −26 to −39: 10-30 min risk... Let me recall the standard chart rows (Fahrenheit): At WCT −19°F (−28°C): frostbite in 30 min. At −35°F (−37°C): 10 min. At −48°F (−44°C): 5 min. I'll use: "体感 −28℃，裸露皮肤 30 分钟可能冻伤" (per NWS chart) — mark 待核.

7. Water conducts heat ~25x faster than air (commonly cited 23-25x; some say "heat loss in water is ~25x faster than air of same temperature"). Use "约 25 倍", cite as commonly cited physics/NOAA? Mark 待核 lightly. Actually for wind+rain relevance: wet clothes strip warm layer faster. This connects to Shanghai's wet cold (湿冷). Good seasonal tie: Shanghai's magic wet-cold attack.

8. Wind chill can't cool objects below air temperature: TRUE and important. Siple/Passel measured cooling rate. A car engine won't go below ambient. "风只能让你更快冷到气温，不能比气温更冷" — key misconception to land. For humans we "feel" colder because we constantly generate heat.

9. Formula assumptions: walking speed 4.8 km/h (1.34 m/s), face height 1.5m, wind measured at 10m adjusted. Maybe skip or one line.

10. Heat loss values: at some wind speed, body loses heat X times faster? The old wind chill used W/m². E.g., at 0°C calm ~? Not needed; use feels-like temps.

Now Shanghai mid-October 2026 specifics: I shouldn't invent actual weather forecasts. Use typical: "上海，10 月中旬，白天 20℃ 出头，夜里掉到 15℃". Typical Shanghai mid-October: highs ~22-24°C, lows ~15-17°C. Cold snap days: 15-18°C high. Use generic "这几天" without claiming actual forecast: "冷空气一到，气温 20℃ 掉到 15℃，再挂 5 级风，体感 11℃" — compute: T=15, V=30: 13.12+9.32−19.59+5.95*1.723? wait 0.3965*15=5.9475; *1.723=10.25 → 13.12+9.32−19.59+10.25=13.1 ≈ 13°C. Hmm 15°C with 30km/h feels ~13°C — not dramatic. October numbers are mild; drama comes at winter temps. Strategy: open with "今天 8℃"? Mid-Oct Shanghai isn't 8°C. Keep opening non-numeric (palm blow). Numbers chapter: use tonight-like temps (15℃ + 阵风 6 级 → 体感 12℃?) compute V=40, T=15: 13.12+9.32−20.51+5.9475*1.804=13.12+9.32−20.51+10.73=12.66 ≈ 12.7 → "15℃ 挂 6 级阵风，体感像 13℃，风偷走了快 3 度" hmm "偷走 2 度多". Then escalate to deep winter: "等冬天 0℃ 挂同样的风，体感 −7℃" — 同样的风偷走 7 度. That's a great comparison ladder: same wind steals more when colder. Nice: the colder it is, the more wind steals. True per formula (the T·V^0.16 term).

Actually check T=15,V=40 vs T=0,V=40: steals 2.3 vs 7.4. And T=−5,V=40: −14.1, steals 9. Good ladder: "同样一场风：15℃ 时偷走 2 度；0℃ 时偷走 7 度；−5℃ 时偷走 9 度。" That's a killer comparative number block (rule 2 compliant). 

For Shanghai winter realism: Shanghai January lows ~0-3°C, cold waves with 6-7级 gusts — 0℃ + 7级阵风 → feels −8℃. Fine.

Also wet cold: water 25x → "上海的冷是湿的，雨一淋，风再一吹，散热快 25 倍" — careful: 25x is water vs air conducting; for a wet body in wind, evaporation also. Phrase: "水带走热的速度，约是空气的 25 倍" cite common. Keep.

Three topic proposals (topic ideas) — must be weather/season adjacent (autumn cooling, early winter), each with named big idea + person + year:

1. 风寒效应 (the assigned one also used for script) — Siple & Passel 1945. Title: 「风寒」or「偷热的风」. Hook: "同样 8℃，为什么一刮风就像进了冰窖？"  Opening 10s: palm-blow experiment.

2. 体感温度 related? Too overlapping. Other autumn/winter ideas:
   - 逆温层 (temperature inversion): why smog/fog settles in autumn mornings, why sound travels farther at night in winter? Big idea: atmospheric inversion, named... discovery? Temperature inversion studies: tied to early meteorology; famous 1952 Great Smog of London (event, not person). Could frame: 逆温层 + 伦敦烟雾事件 1952 (事件有大名字和年份). Person? Not a single scientist... Rule says "讲一个有名字的大想法，带人名和年份" — the Great Smog 1952 has a name+year; person maybe... weak on person. Alternative: 锋面/冷空气: 寒潮. Hmm.
   
   - 湿度与冷：蒸发制冷/湿球温度 (wet-bulb temperature): why Shanghai's 5℃ feels colder than Beijing's −5℃. Big idea: 湿球温度? Persons: 蒸发冷却... Adiabatic? Wet bulb concept attributed to... Hmm, not cleanly named. 
   
   - 开尔文/热力学? Not seasonal hook.
   
   - 候鸟迁徙与导航? Not weather.
   
   - 松果/洋葱预报天气? Folklore, no.
   
   - 「春捂秋冻」科学? No named theory.
   
   - 失温症 (hypothermia) — could anchor to... not a named theory with person/year cleanly.
   
   - 热岛效应 (urban heat island): Luke Howard, 1810s (Howard discovered urban heat island, published 1818-1820 The Climate of London). Person + year ✓. Seasonal tie: city nights in autumn cool slower; why市区比郊区暖和; first autumn night. Good: 「城市热岛」 Luke Howard 1818. Hook: "为什么市区的秋天，总比郊区晚来三天？" Opening 10s: show two thermometers animation? Need viewer-body event... maybe "搓手"? Or screen makes them wait for a dot to cool... The requirement: viewer guesses a number / waits / startled. For topic proposals I just need to describe what happens. E.g., "屏幕上两支温度计同时开始降温，让观众押哪支先到底（一支市区一支郊区），结果押错" — guessing game ✓.
   
   - 霜冻/露点 (dew point): why car windows fog in autumn mornings. Person: dew point... John Dalton? Dalton studied dew point ~1802? William Charles Wells, "Essay on Dew" 1814 — first correct theory of dew formation! Wells 1814 ✓. Title 「露水」/「窗上的雾」. Hook: "秋天的第一口哈气，为什么突然看得见了？" Opening: 哈气实验 on screen? Viewer huffs on phone screen and it fogs — actual physical event ✓ nice. Big idea: 露的形成理论 — William Charles Wells, 1814. Good third topic.
   
   - 静稳天气/冷空气过境: skip.
   
   - 雷达/寒潮路径: skip.
   
   - 「为什么天冷时声音传得更远」: sound refraction in temperature gradient — no single name/year.
   
   - 候鸟: no.
   
   - 取暖/体感: covered.
   
   - 光电? no.

   So three topics:
   1. 「偷热的风」/风寒效应 — Siple & Passel 1945 (required topic; good to include as one of the three).
   2. 「热岛」/城市热岛效应 — Luke Howard, 1818 (《伦敦的气候》; Howard documented London urban-rural temperature difference in the 1810s, published "The Climate of London" 1818-1820, 3 vols). Commonly cited: Howard 1818/1820, "father of urban heat island studies". 
   3. 「雾窗」/露 — William Charles Wells, 1814 (An Essay on Dew). Autumn morning window fog / visible breath. Or dew point... Wells's theory explains dew via radiative cooling. First visible breath in autumn = condensation, temp threshold ~when exhaled air saturated; nice seasonal hook. Opening: viewer 哈气 on phone screen, watch fog bloom then vanish — the fog disappears fastest at edges? The reveal: Wells's question "why does dew form on grass but not on paths".

   Alternatively 3rd could be 「静电」 autumn static shocks — triboelectric effect, named by... William Gilbert 1600 (De Magnete, coined "electric")? Static shock season (dry autumn) — super relatable: 开门被电. Person/year: 吉尔伯特 1600 or 富兰克林 1750s? Triboelectric series... Could be fun: opening 10s viewer actually gets... can't shock them through screen; but can ask them to rub sleeve and touch? Hmm weak. Stick with dew/breath.

   Actually also consider 「昼夜温差」/辐射冷却 — same as Wells's radiative cooling (clear autumn nights cool fast). Covered by dew essay anyway.

   For the three proposals, since the full script is topic 1, topics 2 and 3 give variety. 

Now write the full script with timestamps. 3.5-4.5 min → target ~250s. Each subtitle ≤20 chars. Format: `秒数 | 中文字幕 | 画面`.

Let me structure chapters:

**第一章 · 同一口气 (0–18s)**
- 0–3: black screen, text: 把手掌摊在嘴前 (viewer does something)
- Then: 慢慢哈一口气——哈 (guide: slow warm breath). Visual: dark screen, a palm outline glows faintly warm.
- Then: 现在撅起嘴，用力吹. Visual: cool blue stream lines.
- Then: 同一口气。慢的热，快的凉。 
- Then: 凉的秘密不在嘴里，在手上。 (hook into principle)
Title appears after experience (~18-20s): 「偷热的风」 with sub 「风寒效应」. Rule: 片名在开场体验之后出现 ✓.

**第二章 · 一层看不见的空气 (20–75s) principle**
- Skin ~33°C (core 37, skin surface ~33). Visual: hand cross-section? glowing skin line, number 33°C.
- It heats the air touching it: a thin warm layer, few mm, like invisible... don't say "隐形秋衣"? That's a coined metaphor but it's an image, allowed (rule 6: new saying needs concrete picture first — we show the layer glowing around the hand first, then the metaphor word). Visual: hand outline with thin warm halo.
- Windless: layer stays, you keep reheating slowly, heat loss slow.
- Wind: strips the layer; body must heat new cold air; faster wind = strip faster.
- Example (rule: principle then examples): hand on palm demo callback — bring back the palm visual (rule 3: reuse visuals). 你刚才吹的那口快气，就是一阵小风。
- Also winter analogy: 站在风里像不停换冷水的池子? Keep simple.
- Numbers: 散热速度: calm vs 5级风 — maybe avoid W/m² complexity; use "风每快一档，换走的热就多一截" and save precise numbers for ch4. Golden line ch2 end: 「冷不是风吹进来的，是热被风拿走的。」(≤20 chars: 冷不是风吹进来的，是热被拿走的 — 16 chars ✓)

**第三章 · 给水计时的人 (75–140s) history + spectacle**
- 1945, Antarctica (南极). Siple & Passel. 西普尔和帕塞尔. Their problem: how to measure wind's cold? They hung a small cylinder of water in the wind, timed how long to freeze.
- Visual: black screen, a hanging vial of glowing water, wind lines, a timer ticking down.
- Colder or windier → freezes sooner. From freeze times they built the first wind chill index (风寒指数).
- SPECTACLE (full-screen): the water surface blooms ice crystals expanding across entire screen, timer hits zero, total black-and-frost screen. ~mid-film ✓ (film ~250s, this at ~120s = middle ✓).
- Then: 2001, 美国和加拿大 weather agencies replaced it: new formula from real human faces in wind tunnels (真人风洞实验测脸上的散热). Visual: face thermal glow with sensors.
- Golden line ch3 end: 「他们测不出风有多冷，就去测热跑得有多快。」(count: 他们测不出风有多冷(9)，就去测热跑得有多快(9) — as one subtitle must be ≤20 chars total: 18 ✓ but maybe split into two lines.)

**第四章 · 风偷走了几度 (140–205s) numbers, comparisons (rule 2: comparisons, rule 3: recall visuals)**
- Using new formula. Anchor to tonight-like weather: 现在外面 15℃。没风，体感还是 15℃。 Visual: big number 15.
- 5 级阵风（约 30 km/h）一来：体感像 13℃。风偷走 2 度。 Visual: number counts down 15→13, palm halo from ch2 returns being stripped.
- 同样这场风，气温 8℃ 时：体感像 4℃。偷走 4 度。 Wait compute T=8,V=30 → ~4.0 ✓ steals 4. Nice doubling.
- 同样的风，0℃ 时：体感 −7℃。偷走 7 度。✓ (V=30: compute: 13.12+0−19.59+0=−6.5 ≈ −7; steals 6.5 → "快 7 度". Let me recompute V=30,T=0: −6.47°C. So feels −6.5°C, steals 6.5 degrees. Round: "体感约 −6℃，偷走 6 度半"? For clean comparison ladder use same V=30: 15→13 (偷2度), 8→4 (偷4度), 0→−6.5 (偷6度半). Or use V=40 for the 0°C case: −7.4 steals 7+. But ladder cleaner with same wind. Rule 2: comparisons. Ladder: 「同一场风：15℃ 偷走 2 度，8℃ 偷走 4 度，0℃ 偷走 6 度半。」Hmm "越冷，风偷得越多" ✓.
- Wet cold: 上海冬天的雨。水带走热的速度约是空气的 25 倍。湿衣服 + 风 = 暖层更留不住。 Visual: rain + palm halo. (callback rule3)
- Frostbite number: 体感 −28℃，裸露皮肤约 30 分钟可能冻伤 (NWS chart) 待核. Maybe include as scale awe: "在漠河的风里……" Keep short.
- Golden line: 「风再大，吹不低一度气温，吹得低的只有你的体温。」— wait that's also ch5's misconception point. Adjust: ch4 golden: 「温度越低，风偷得越狠。」or make the misconception its own short chapter.

**第五章 · 风骗了你 (205–250s) misconception + return**
- 误区: 风不能让东西冷过气温。一罐水放在 5℃ 的风里，最多冷到 5℃，只是冷得更快。 Visual: thermometer in wind, stops at 5.
- 你不一样：你一直在发热。风只是把你散热调到快进。 Visual: human outline with inner glow draining.
- 回到开头: 再对手心慢慢哈一口气。暖的回来了。 Visual: palm glow again (full callback rule 3).
- Final line (落在一种看世界的方式): 「温度计管的是空气，风管的是你。」or 「看天气，别只看几度，还要看几级风。」practical + poetic: 「从今天起，看温度，也看风。」Hmm brief says "落在一句看法上". Final golden: 「风不冷，风只是让热离开得更快。」Better final view: 「所谓天冷，多半不是天冷，是热在离开。」Let me craft: 「冷的从来不是温度，是热的去留。」20 chars ✓ poetic. Or simpler landing: 「风没有改变温度，它改变热离开你的速度。」(19 chars) — concrete. Final final frame: 片名淡回「偷热的风」+ date/上海 night? End card just title on black.

Timing: subtitles every ~4-6s. 250s / ~45-50 lines. Let me draft with timestamps, ensuring ≤20 chars per subtitle.

Let me now write lines:

**第一章 同一口气 (0:00–0:20)**
0 | 把手掌摊开，放到嘴前 | 黑屏中央，一只发光的手掌轮廓亮起
4 | 慢慢地哈一口气，哈—— | 掌心泛起一小片暖橙色的光
9 | 现在噘起嘴，用力吹一口气 | 一道细亮的蓝色气流斜切过屏幕
14 | 同一口气。慢的暖，快的凉。 | 暖光与蓝流并排在黑底上
17 | 凉的那口，凉在哪？ | 画面只剩那只发暗的手掌
(片名)
20 | 偷热的风 | 片名浮现，字幕小字：风寒效应

Wait rule: title after opening experience ✓ (20s). "凉的那口，凉在哪？" is a question but the requirement was opening must involve action — we already did the action (哈气/吹气), so a rhetorical Q later is fine.

**第二章 你穿着一层空气 (0:22–1:20)**
24 | 你的皮肤，表面大约 33℃ | 手掌特写，皮肤边缘亮起，浮出数字 33℃
28 | 它一刻不停地加热贴着它的空气 | 皮肤边缘的光晕向外晕开一层
32 | 几毫米厚，贴身穿 | 光晕贴着手的轮廓，像一件发光的薄衣
36 | 没风的时候，这层暖空气走得慢 | 光晕安静，缓慢升腾成细线
40 | 你只用慢慢加热它 | 暖色微光持续补给光晕
44 | 风一来，这层暖空气被整片揭走 | 蓝色风线扫过，光晕被撕成碎丝
49 | 新贴上来的，全是冷空气 | 冷色雾贴上手的轮廓
52 | 你只能再热一层。风再揭走一层 | 光晕重生又被撕走，反复三次
57 | 风越大，换得越勤 | 风线加密，光晕明灭更快
61 | 刚才那口快气，就是一阵小风 | 回到第一章那只手掌与蓝色气流画面
66 | 它揭走的，就是你手上的这层热 | 光晕被那道蓝流掀开一个缺口
70 | 所以凉不在嘴里，在手上 | 手掌特写，缺口处变暗
74 | 冷不是风吹进来的 | 黑底，一行字
77 | 是热被风拿走的 | 字下，一缕暖光被抽离画面

**第三章 给水计时的人 (1:20–2:25)**
82 | 1945 年，南极 | 黑底上出现细雪与坐标线，年份亮起
86 | 西普尔和帕塞尔，想给风称重 | 两个剪影站在风雪里
90 | 风有多冷，温度计算不出来 | 一支温度计，水银柱停住不动
94 | 他们换了个办法：看热跑多快 | 剪影举起一只小圆筒
98 | 把一筒水挂进风里 | 圆筒悬在屏幕中央，水面微光
102 | 记下它结冰要用多久 | 圆筒旁亮起一个计时数字，开始倒数
106 | 风越大，水结冰越快 | 风线变密，计时数字跳得更快
110 | 结冰的时间，就是风偷热的速度 | 数字骤降
——奇观（约115s）——
115 | (满屏奇观：水从圆筒表面开始结晶) | 冰晶自一点炸开，迅速爬满全屏
119 | (整个屏幕变成冰花) | 满屏发光冰纹，风声压到最低
123 | 就凭这些结冰时间 | 冰纹渐暗，浮出一张细密表格
127 | 他们画出第一张风寒指数表 | 表格发光，标注 1945
132 | 2001 年，这张表被重写 | 表格线条被拆解重排
136 | 真人坐进风洞，测脸上的热 | 一张发光的人脸，热像光斑
140 | 新公式用到现在 | 公式轮廓一闪即隐
144 | 测不出风有多冷 | 黑底一行字
147 | 就测热逃得有多快 | 一缕光从字的缝隙里被抽走

Fact check framing: "西普尔和帕塞尔" Siple & Passel ✓ 1945 ✓ water cylinder freezing time ✓. 2001 new formula by US NWS & Environment Canada, based on wind tunnel human trials ✓ (volunteers walking, face sensors; "坐进风洞" maybe "走进风洞" — they walked on treadmills. Say 走进风洞.)

**第四章 风偷走了几度 (2:25–3:25)**
151 | 用今天的公式，算一遍风账 | 黑底上亮起一个算盘？No— 一张干净的算式轮廓
155 | 夜里 15℃，没风 | 大数字 15 亮起，静止
159 | 体感，就是 15℃ | 数字旁浮出"体感 15℃"
163 | 起风了，五级的阵风 | 数字边缘被风线吹得发毛
167 | 体感掉到 13℃ | 数字 15 被吹散，重组成 13
171 | 这口气，风偷走了 2 度 | 一小缕暖光飘出屏幕
175 | 同样这场风，气温 8℃ 的夜 | 大数字 8 亮起
179 | 体感像 4℃，偷走 4 度 | 8 被吹散重组成 4
183 | 同样这场风，0℃ 的早晨 | 大数字 0 亮起
187 | 体感像零下 6℃ 半 | 0 被吹散，重组成 −6.5
191 | 越冷的天，风下手越狠 | 三个数字 13、4、−6.5 排成一列
195 | 要是再赶上一场雨 | 雨丝斜落进画面
199 | 水带走热，约是空气的 25 倍 | 手掌光晕(回归)被雨点打得急速变暗
204 | 湿衣服加风，热层根本留不住 | 光晕熄灭又亮起又熄灭
208 | 在极北的风里 | 雪原剪影
212 | 体感零下 28℃，皮肤半小时就可能冻伤 | 计时数字 30:00 开始走 (待核数字)
219 | 数字越低，风越像一把刀 | too dramatic? golden line instead:
219 | 风下手，比你看到的温度狠 | golden-ish; or put golden at 215:
Let me restructure chapter 4 golden: 「温度是写在预报里的，风是吹在你身上的。」(18 chars) at ~218s.

Hmm wait — need to double check "体感像零下 6℃ 半" — using V=30 km/h. 5级风 = 29-38 km/h ✓ consistent with "五级的阵风" at 163s. So ladder all at 5级风: 15→13.1 (steal ~2), 8→4.0 (steal 4), 0→−6.5 (steal 6.5). ✓ consistent, and honest. "同一场风" = same 5级 wind. 

Numbers presented comparatively ✓ ("只偷走 2 度" vs "偷走 6 度半", "越冷偷得越多").

**第五章 风没有骗温度计 (3:25–4:10)**
221 | 但有一件事，风做不到 | 黑底，风声渐弱
225 | 一罐水放在 5℃ 的风里 | 一罐水悬在风中，旁立温度计
229 | 它最多冷到 5℃ | 温度计停在 5
233 | 风再狂，也吹不出第 6 度的冷 | 风线乱舞，水银柱纹丝不动
237 | 风只能让它更快冷到 5℃ | 计时数字飞快走完
241 | 你不一样，你一直在发热 | 回到那只手掌，核心亮起 37℃？Actually skin 33; use human silhouette with inner furnace glow
245 | 风改不了天气，只改了你的散热速度 | 人形光晕被风线持续抽丝
250 | 所以，再把手掌放到嘴前 | 黑屏，回到第一章的手掌轮廓
254 | 慢慢哈一口气 | 暖光重新在掌心聚拢
258 | 暖的还在。只是风一来，它就走得快些 | 暖光微微颤动，但亮着
263 | 冷不是温度，是热离开的速度 | 全屏只剩这一行字 (final golden)
267 | (片名回现) | 「偷热的风」四字浮现，落版

Total ~270s = 4.5 min. Slightly trim to land ~4:20 (260s). Fine within 3.5–4.5.

Count golden quotes: 
1. 冷不是风吹进来的 / 是热被风拿走的 (ch2 end) — counts as one金句 pair.
2. 测不出风有多冷 / 就测热逃得有多快 (ch3 end)
3. 温度是写在预报里的，风是吹在身上的 (ch4 end) — hmm did I include? At 218ish. Let me place: after frostbite line: 「预报写温度，风写在你身上。」? I'll finalize: 「温度写在预报里，风落在你身上。」(15 chars ✓)
4. 冷不是温度，是热离开的速度 (final)
That's 4 ✓ (max 3-4).

Chapter progression check: ch1 experience (fast air feels cooler) → ch2 explains principle (warm layer stripped) using ch1's palm → ch3 measures the stealing (freeze time → index) using ch2's heat-loss idea → ch4 computes real numbers using ch3's formula, recalls palm halo → ch5 uses ch4's numbers logic to state the limit (can't go below air temp), returns to ch1 gesture. ✓ Each chapter uses previous.

Spectacle: ice crystal full-screen bloom at ~115-123s, mid-film ✓.

Rule 2 (numbers as comparisons): 33℃ skin introduced once; the ladder: "15℃ 没风体感 15℃ → 起风掉到 13℃（偷走 2 度）→ 同样风 8℃ 偷 4 度 → 0℃ 偷 6 度半". All comparisons to just-seen numbers ✓. "25 倍" comparative ✓. Frostbite "30 分钟" fine.

Rule 3 (recall visuals): palm returns at 61s, 250s; halo returns at 199s; wind lines consistent ✓.

Rule 4 (first 10s viewer acts): 哈气+吹气 by second 14 — the 哈 happens at ~4-9s ✓ within first 10s viewer does something ✓.

Rule 5 (no classroom words): check — no 知识点/记住/注意/正确答案/选项 ✓.

Rule 6 (no coined terms): "风账"? "算一遍风账" — colloquial, fine. "风寒指数" is the real term ✓ (introduced with visual of table). "体感" — common weather-app term, fine. The warm layer called "这层暖空气", plain ✓.

Rule 7: no AI credits ✓ (end with title).

Facts table with sources:
1. 呼气实验（慢哈暖、快吹凉）— 日常可复现；物理解释涉及对流散热与蒸发，来源：科普常识（如美国物理联合会科普）— mark 待核? It's experiential; note mechanism.
2. 皮肤表面约 33℃ — 生理学常数（平均皮肤温度 33–34℃），来源：生理学教材 — mark 待核 acceptable.
3. 贴身空气层几毫米 — 人体热羽流/边界层研究，待核.
4. 1945 Siple & Passel paper — Proceedings of the American Philosophical Society, Vol. 89, No. 1 (1945), "Measurements of Dry Atmospheric Cooling in Subfreezing Temperatures" ✓ real.
5. 南极挂水筒测结冰时间 ✓ widely documented (实验于 1939–1941 美国南极考察队期间进行，1945 发表) — mark expedition dates 待核.
6. 第一张风寒指数表 1945 ✓.
7. 2001 新公式，美国国家气象局 (NWS) 与加拿大环境部 2001 年 11 月启用 ✓；真人风洞面部散热实验（加拿大国防研究部门，Osczevski 等）— 机构名待核；Osczevski & Bluestein, BAMS 2005 ✓.
8. 体感数字 (15→13.1, 8→4.0, 0→−6.5 @30km/h) — computed from 2001 metric formula ✓ (give formula in table).
9. 水导热约为空气 25 倍 — commonly cited (NOAA/救生教材常说 25x; 实际热导率比约 25 倍：水 0.6 W/mK vs 空气 0.025 → ~24x) ✓ roughly.
10. 体感 −28℃ 30 分钟冻伤 — NWS wind chill chart (约 −28℃ 对应 30 分钟风险档) — 待核 exact thresholds.
11. 风不能使物体冷过气温 — physics consensus ✓.
12. 5级风 29–38 km/h — 蒲福风级 ✓.

Frostbite chart (NWS): at wind chill −19°F (−28°C) frostbite possible in 30 min ✓ that's the widely shown chart. OK, mark 待核 anyway.

Names: 西普尔 (Paul Siple)、帕塞尔 (Charles Passel) — transliterations vary (赛普尔/西佩尔). Mark 待核 for Chinese transliteration.

Osczevski Chinese: 奥切夫斯基? I'll include in fact table as 待核 transliteration, maybe don't put in subtitles (avoid clutter). Keep subtitles with Siple & Passel only.

Length check: ~60 subtitle lines over 270s — avg 4.5s/line ✓ readable.

Now the three topic proposals:

**选题一 「偷热的风」(风寒效应)** — this is also the script topic.
- 抖音标题：同样 15℃，为什么一刮风就像换了个季节？
- 大想法：风寒效应 / 风寒指数，西普尔与帕塞尔，1945 年（2001 年美加更新公式）
- 为什么这几天想看：上海刚入秋降温，冷空气南下、阵风加大，"体感温度"天天上天气 App；观众每天出门都在经历。
- 开头 10 秒：观众照字幕把手掌放到嘴前，先慢哈（暖）再快吹（凉）——身上立刻发生一次反差。

**选题二 「热岛」(城市热岛效应)**
- 抖音标题：同一场冷空气，为什么市区的秋天总比郊区晚到？
- 大想法：城市热岛效应。卢克·霍华德（Luke Howard），1810 年代记录伦敦城郊温差，1818–1820 年出版《伦敦的气候》。（待核年份细节：首卷 1818）
- 为什么这几天想看：入秋夜晚，郊区跌破 15℃、市区还停在 18℃；同城市不同秋天，观众通勤就能体验。
- 开头 10 秒：屏幕上两支温度计同时从 20℃ 开始掉，字幕让观众押哪支先到底，押市区的大概率押错（市区降温慢）——猜数+被结果打脸。

**选题三 「第一口白气」(露与凝结)**
- 抖音标题：秋天的早晨，你为什么突然看得见自己的呼吸？
- 大想法：露的形成理论（辐射冷却）。威廉·查尔斯·威尔斯（William Charles Wells），1814 年《论露》。
- 为什么这几天想看：这几天的清晨，车窗起雾、眼镜起雾、哈气变白——全在发生。
- 开头 10 秒：字幕请观众对着手机屏幕哈一口气，屏幕真的蒙上一层雾，看雾从边缘退掉——观众亲手制造了一个现象。

Check person/year facts:
- Luke Howard: "The Climate of London" published 1818–1820 (three volumes; first ed. 1818-1820). He's credited with first documenting urban heat island. ✓ commonly cited as 1818/1820s. Mark 待核 light.
- William Charles Wells: "An Essay on Dew, and Several Appearances Connected with It" — 1814 (first edition). ✓
- Siple & Passel 1945 ✓.

All good. Now formatting: The task says "只交这两样东西，不要写别的说明" — so output: 一、三个选题；二、完整文案 (with chapter structure, timestamps, fact table). No extra commentary.

One more check on subtitle char counts (≤20):
- "你的皮肤，表面大约 33℃" — count: 你的皮肤表面大约33℃ = 11 chars + punctuation ✓
- "它一刻不停地加热贴着它的空气" 14 ✓
- "你只能再热一层。风再揭走一层" 14 ✓
- "结冰的时间，就是风偷热的速度" 14 ✓
- "真人走进风洞，测脸上的热" 12 ✓
- "体感零下 28℃，皮肤半小时就可能冻伤" — count: 体感零下28℃皮肤半小时就可能冻伤 = ~18 ✓ maybe split into two lines for pacing. Split: "在极北的风里，体感零下 28℃" / "裸露的皮肤，半小时就可能冻伤". Each ✓.
- "风改不了天气，只改了你的散热速度" 16 ✓
- "暖的还在。只是风一来，它就走得快些" 17 ✓
- "冷不是温度，是热离开的速度" 13 ✓

Title 「偷热的风」 appears at 20s after experience ✓ and reappears at end ✓.

Let me also double-check ch4 formula numbers precisely:
WCT(°C) = 13.12 + 0.6215T − 11.37 V^0.16 + 0.3965 T V^0.16
- T=15, V=30: 0.6215*15=9.3225; 0.3965*15=5.9475; V^0.16=1.723
  = 13.12+9.3225−19.591+5.9475*1.723=13.12+9.3225−19.591+10.248=13.10 → 体感约 13℃ ✓ 偷 2 度
- T=8, V=30: 0.6215*8=4.972; 0.3965*8=3.172; =13.12+4.972−19.591+5.465=3.97 → 4℃ ✓ 偷 4 度
- T=0, V=30: 13.12−19.591=−6.47 → 零下 6℃ 半 ✓
Great, ladder is real: 2, 4, 6.5.

Wet + wind: "水带走热，约是空气的 25 倍" — heat conduction of water ~0.6 vs air ~0.026 ≈ 23x; common claim "25 times faster". Keep "约 25 倍", cite 待核-ish (widely cited by outdoor survival/US Coast Guard sources).

Also add one Shanghai-specific line for season tie: e.g., in ch4 intro: "上海的秋天，风比温度先到" — nice but watch length. Maybe at 151: "这几天的上海，风比降温先到" (12) ✓ then numbers.

Timeline final (target end ~4:20 = 260s):

Ch1 (0–20): as above.
Ch2 (22–80)
Ch3 (80–148) spectacle at 115–123
Ch4 (148–218)
Ch5 (218–268) → that's 4:28. OK within 4.5 min. Let me finalize timestamps carefully with pacing.

Final script lines (I'll number chapters 一到五 with titles):

第一章「同一口气」
0 | 把手掌摊开，举到嘴前 | 黑屏，中央亮起一只手掌的发光轮廓
4 | 慢慢哈一口气：哈—— | 掌心晕开一小片暖橙色的光
9 | 现在噘起嘴，用力吹 | 一道细亮的蓝色气流斜切过手掌
13 | 同一口气，慢的暖，快的凉 | 暖光与蓝流并排悬在黑底上
17 | 凉的那一口，凉在哪里 | 画面暗下，只剩手掌轮廓

片名（20s）：20 | 偷热的风 | 四字浮现，下方一行小字：风寒效应

第二章「你身上那件看不见的衣服」
24 | 你的皮肤，表面大约 33℃ | 手掌特写，皮肤边缘浮出数字 33℃
29 | 它一直在焓热贴着它的空气 | 光从皮肤向外晕开薄薄一层
34 | 几毫米厚，像件看不见的衣服 | 光晕贴着手的轮廓成形
39 | 没风时，这层热走得慢 | 光晕安静地贴着，微微升腾
44 | 你只用不紧不慢地加热它 | 微光持续渗入光晕
49 | 风一来，整层被揭走 | 蓝色风线扫过，光晕被撕成碎丝
54 | 贴上来的全是冷空气 | 冷色雾气裹住手的轮廓
58 | 你再热一层，风再揭一层 | 光晕重生又被撕走，反复三次
63 | 风越大，换得越勤 | 风线加密，光晕明灭加快
68 | 你刚吹的那口快气，就是小风 | 回到第一章的手掌与蓝色气流
73 | 它揭走的，就是手上这层热 | 蓝流掀开光晕一角，缺口变暗
77 | 冷不是风吹进来的 | 黑底，一行字亮起
80 | 是热被风拿走的 | 一缕暖光从字里被抽离

第三章「给水计时的人」
85 | 1945 年，南极 | 细雪与坐标线浮现，年份亮起
89 | 西普尔和帕塞尔，想给风称重 | 两个剪影立于风雪
93 | 风有多冷，温度计算不出来 | 一支温度计，液柱停住
97 | 他们换了个问法：热跑多快 | 剪影举起一只小圆筒
101 | 把一筒水，挂进风里 | 圆筒悬在屏中央，水面微光
105 | 记下它结冰要多久 | 圆筒旁亮起计时数，开始倒数
109 | 风越大，冰来得越早 | 风线变密，倒数加速
113 | 结冰时间，就是风偷热的速度 | 倒数数字飞跳
奇观：
117 | 屏幕上只剩风和一只圆筒 | 圆筒表面绽出第一粒冰晶
121 | （无字幕） | 冰晶炸开，发光冰纹爬满全屏
126 | 凭这些结冰的时间 | 冰纹渐暗，浮出一张细密表格
130 | 他们画出第一张风寒指数表 | 表格发光，角落标着 1945
135 | 2001 年，这张表被重写 | 表格线条拆解、重排
139 | 真人走进风洞，测脸上的散热 | 一张发光人脸，热斑在面颊流动
143 | 美国和加拿大，用到今天 | 表格收拢成一条简洁曲线
147 | 测不出风有多冷 | 黑底一行字
150 | 就测热逃得有多快 | 一缕光从字缝里被抽走

第四章「风偷走了几度」
155 | 这几天的上海，风比降温先到 | 夜色里城市轮廓，风线掠过
159 | 夜里 15℃，没风 | 大数字 15 静止亮起
163 | 体感，也就是 15℃ | 数字旁浮出"体感 15℃"
167 | 起风了，五级阵风 | 风线撞进画面，数字发颤
171 | 体感掉到 13℃ | 15 被吹散，重组成 13
175 | 这场风，只偷走 2 度 | 一小缕暖光飘出屏幕
179 | 同样的风，8℃ 的深夜 | 大数字 8 亮起
183 | 体感像 4℃，偷走 4 度 | 8 被吹散重组成 4
187 | 同样的风，0℃ 的清晨 | 大数字 0 亮起
191 | 体感零下 6 度半，偷走 6 度半 | 0 散成 −6.5
195 | 天越冷，风下手越狠 | 13、4、−6.5 三个数字排成一列
199 | 再赶上一场雨，更狠 | 雨丝斜落
203 | 水带走热，约是空气的 25 倍 | 手掌光晕回归，被雨点打得急暗
208 | 湿衣服加风，热层守不住 | 光晕反复熄灭
212 | 在极北，体感零下 28℃ | 雪原剪影，风声压低
216 | 裸露皮肤半小时就可能冻伤 | 计时数 30:00 开始走
221 | 温度写在预报里 | 黑底一行字
224 | 风，落在你身上 | 字面上掠过一层风线

第五章「风做不到的，和你能做的」
228 | 但有一件事，风做不到 | 风声渐弱
232 | 一罐水放在 5℃ 的风里 | 一罐水悬在风中，旁立温度计
236 | 它最多冷到 5℃ | 温度计液柱停在 5
240 | 风再狂，也吹不出更低的数 | 风线乱舞，液柱纹丝不动
244 | 风只能让它更快冷到 5℃ | 计时数飞快走完
248 | 你不一样，你一直在发热 | 人形轮廓，核心一团暖光
252 | 风改不了温度，只改你的散热 | 暖光被风线持续抽丝
256 | 所以，再把手掌举到嘴前 | 黑屏，回到第一章的手掌轮廓
260 | 慢慢哈一口气 | 暖光重新在掌心聚拢
264 | 暖的还在，只是风一来走得快些 | 暖光微颤，但亮着
268 | 冷不是温度，是热离开的速度 | 全屏只剩这一行字
272 | （片名回现：偷热的风） | 四字浮现，落版

272s = 4:32 ✓ within 3.5–4.5 min.

金句 count: (77-80) 1, (147-150) 2, (221-224) 3, (268) 4. ✓ max 3–4.

奇观: 117–126 full-screen ice bloom ✓ mid-film (~45% through) ✓ described clearly.

Check rule 5 words: "算" appears in "温度计算不出来" — fine, it's not "计算题". No forbidden words (知识点/记住/注意/正确答案/选项) ✓.

Rule 2 check: numbers always comparative ✓ (只偷走 2 度 / 偷走 4 度 / 偷走 6 度半; 25 倍; 更快冷到 5℃).

Rule 3 check: palm/halo/wind lines/blue stream recur ✓; the 1945 table recurs 130→135 ✓.

Fact table (at end of script):

| 事实 | 出处 |
| 慢哈暖、快吹凉的体感差异 | 日常可复现；散热学常识（对流+蒸发）| — maybe phrase: 体验性事实，无需出处，机制解释见第2章
| 皮肤表面约 33℃ | 生理学常用均值（33–34℃），教材级常识（待核）
| 贴身暖空气层厚几毫米 | 人体热边界层/热羽流研究（待核）
| 1945 西普尔与帕塞尔发表风寒研究 | Siple & Passel, "Measurements of Dry Atmospheric Cooling in Subfreezing Temperatures", Proceedings of the American Philosophical Society, 1945
| 南极挂水筒测结冰时间 | 同上论文及后续综述（实验约1939–1941年间进行，具体地点待核）
| 第一张风寒指数表 1945 | 同上
| 2001 年美加启用新风寒公式 | 美国国家气象局（2001年11月）、加拿大环境部
| 真人风洞面部散热实验 | Osczevski 等，加拿大国防研究机构风洞试验（机构名待核）；Osczevski & Bluestein, BAMS, 2005
| 体感数值 15→13、8→4、0→−6.5（30km/h） | 按 2001 年风寒公式计算（公式见备注）
| 水散热约为空气 25 倍 | 户外安全领域通行说法（美国海岸警卫队等），按热导率约 23–25 倍（待核）
| 体感 −28℃ 半小时冻伤 | 美国国家气象局风寒图表（冻伤时间档）（待核）
| 风不能使物体冷过气温 | 物理学界共识；NWS 风寒说明页
| 五级风风速 29–38 km/h | 蒲福风级表
| 风寒公式（摄氏） | WCT = 13.12 + 0.6215T − 11.37V^0.16 + 0.3965T·V^0.16（V 单位 km/h）

Chinese transliteration note: 西普尔/帕塞尔 transliteration 待核 (also written 赛普尔等).

Now the three topics section. Keep each compact.

选题一
- 片名：《偷热的风》
- 抖音标题：同样 15℃ 的夜，为什么一刮风就像换了季节？
- 大想法：风寒效应（风寒指数）。1945 年，美国探险家保罗·西普尔与查尔斯·帕塞尔在南极提出；2001 年美国、加拿大启用新公式。
- 为什么这几天想看：上海入秋降温，冷空气带来阵风，"体感温度"天天出现在天气软件上，观众出门就在经历。
- 开头 10 秒：观众按字幕把手掌举到嘴前，先慢哈（暖）、再用力吹（凉），同一口气在自己手上吹出两种温度。

选题二
- 片名：《热岛》
- 抖音标题：同一场冷空气，为什么市区的秋天总比郊区晚到？
- 大想法：城市热岛效应。1810 年代，英国化学家卢克·霍华德记录伦敦城内外的温差，1818–1820 年出版《伦敦的气候》，第一次把"城里更暖"写成数据。
- 为什么这几天想看：入秋夜里，郊区跌破 15℃、市区还停在 18℃，同一座城两个秋天，通勤路上就能验证。
- 开头 10 秒：两支温度计在屏幕上同时从 20℃ 开始降，字幕让观众押哪支先到 15℃——押市区的观众会亲眼看着自己押错。

选题三
- 片名：《第一口白气》
- 抖音标题：秋天的清晨，你为什么突然看得见自己的呼吸？
- 大想法：露与凝结的解释（辐射冷却）。1814 年，英国医生威廉·查尔斯·威尔斯发表《论露》，第一个说清露水从何而来。
- 为什么这几天想看：这几天的上海，车窗起雾、眼镜起雾、清晨哈出第一口白气，全在同步发生。
- 开头 10 秒：字幕请观众直接对着手机屏幕哈一口气——屏幕真的蒙上一层雾，观众亲眼看着雾从边缘退去。

Check topic titles 2-4 chars: 偷热的风 (4) ✓ 热岛 (2) ✓ 第一口白气 (5) ✗ — need 2-4 chars: 《白气》(2) ✓ or 《见呼吸》. Use 《白气》.

Luke Howard: chemist/meteorologist, presented data in 1810s; The Climate of London first published 1818–1820 (3 vols) ✓ mark 待核 in topic? Topics don't need fact table, but I should be honest. I'll phrase "1818 年出版《伦敦的气候》第一卷" — commonly cited 1818. Fine.

Wells 1814 ✓ "An Essay on Dew" first edition 1814.

One concern: rule says "讲一个有名字的大想法，带人名和年份" for the genre — topics satisfy.

Now, also the brief for the script says "章节递进：每章往上走一级，后一章要用到前一章讲的东西" — I'll make chapter titles show the ladder: 体验→原理→衡量→数字→边界/回归.

Also "片名在哪里出现" — state explicitly: 片名在第 20 秒、开场吹气体验结束后出现，片尾 272 秒回现.

Format: use markdown headers, tables where apt. The format for lines: `秒数 | 中文字幕 | 画面`. I'll present as code-ish lines or a table? The spec literally gives format `秒数 | 中文字幕 | 画面` — I'll write lines like:
`0 | 把手掌摊开，举到嘴前 | 黑屏，中央亮起一只手掌的发光轮廓`
Use a plain list (maybe in code block for alignment)? Chinese widths make alignment off; simpler: just lines with pipes. I'll use a table per chapter? A markdown table with columns 秒数|中文字幕|画面 matches exactly and reads well. But the literal format request suggests pipe-separated lines. Markdown tables render as pipes anyway. I'll use markdown tables — clean.

Actually with ~60 rows, tables per chapter are fine.

Also need to state: 奇观 at what time, 金句 positions, though "只交这两样东西，不要写别的说明" — the script deliverable itself requires 片名位置/奇观/金句 to be written clearly, so annotations within the script document are part of deliverable (the brief asks to "写清楚"). I'll include brief markers (片名位置 note, 奇观 row, 金句 marked with ★) — that's required content, not extra说明.

Keep it tight. Let me also double check subtitle ≤20 chars for every line (counting punctuation loosely; keep under):

Ch1:
- 把手掌摊开，举到嘴前 (9) ✓
- 慢慢哈一口气：哈—— (9) ✓
- 现在噘起嘴，用力吹 (9) ✓
- 同一口气，慢的暖，快的凉 (12) ✓
- 凉的那一口，凉在哪里 (10) ✓
- 偷热的风 / 副标题"风寒效应" ✓

Ch2:
- 你的皮肤，表面大约 33℃ (~12) ✓
- 它一直在焓热贴着它的空气 (12) ✓
- 几毫米厚，像件看不见的衣服 (13) ✓
- 没风时，这层热走得慢 (10) ✓
- 你只用不紧不慢地加热它 (11) ✓
- 风一来，整层被揭走 (9) ✓
- 贴上来的全是冷空气 (9) ✓
- 你再热一层，风再揭一层 (11) ✓
- 风越大，换得越勤 (8) ✓
- 你刚吹的那口快气，就是小风 (13) ✓
- 它揭走的，就是手上这层热 (12) ✓
- 冷不是风吹进来的 (8) ✓
- 是热被风拿走的 (7) ✓

Ch3:
- 1945 年，南极 ✓
- 西普尔和帕塞尔，想给风称重 (13) ✓
- 风有多冷，温度计算不出来 (12) ✓
- 他们换了个问法：热跑多快 (12) ✓
- 把一筒水，挂进风里 (9) ✓
- 记下它结冰要多久 (8) ✓
- 风越大，冰来得越早 (9) ✓
- 结冰时间，就是风偷热的速度 (13) ✓
- 屏幕上只剩风和一只圆筒 (11) ✓
- 凭这些结冰的时间 (8) ✓
- 他们画出第一张风寒指数表 (12) ✓
- 2001 年，这张表被重写 ✓
- 真人走进风洞，测脸上的散热 (13) ✓
- 美国和加拿大，用到今天 (11) ✓
- 测不出风有多冷 (7) ✓
- 就测热逃得有多快 (8) ✓

Ch4:
- 这几天的上海，风比降温先到 (13) ✓
- 夜里 15℃，没风 ✓
- 体感，也就是 15℃ ✓
- 起风了，五级阵风 (8) ✓
- 体感掉到 13℃ ✓
- 这场风，只偷走 2 度 ✓
- 同样的风，8℃ 的深夜 ✓
- 体感像 4℃，偷走 4 度 ✓
- 同样的风，0℃ 的清晨 ✓
- 体感零下 6 度半，偷走 6 度半 (15) ✓
- 天越冷，风下手越狠 (9) ✓
- 再赶上一场雨，更狠 (9) ✓
- 水带走热，约是空气的 25 倍 (~13) ✓
- 湿衣服加风，热层守不住 (11) ✓
- 在极北，体感零下 28℃ ✓
- 裸露皮肤半小时就可能冻伤 (12) ✓
- 温度写在预报里 (7) ✓
- 风，落在你身上 (7) ✓

Ch5:
- 但有一件事，风做不到 (10) ✓
- 一罐水放在 5℃ 的风里 ✓
- 它最多冷到 5℃ ✓
- 风再狂，也吹不出更低的数 (12) ✓
- 风只能让它更快冷到 5℃ ✓
- 你不一样，你一直在发热 (11) ✓
- 风改不了温度，只改你的散热 (13) ✓
- 所以，再把手掌举到嘴前 (11) ✓
- 慢慢哈一口气 (6) ✓
- 暖的还在，只是风一来走得快些 (14) ✓
- 冷不是温度，是热离开的速度 (13) ✓

All good.

One thing: "噘起嘴" fine colloquial. "焓热" — I wrote "焓热"? No, I wrote "焓热贴着它的空气"? Let me use "焓热"? The word is 焐热/捂热 (wǔ rè). Use "焐热" ✓ colloquial and vivid.

Also ch2 line "你的皮肤，表面大约 33℃" then ch5 "你一直在发热" core temp — no conflict shown numerically (avoid 37 to prevent number overload; rule: don't make audience remember numbers).

Ending lands on a view: "冷不是温度，是热离开的速度" ✓ and returns to opening gesture ✓.

Music/sound notes: visuals column can hint sound minimally? Brief says 配乐撑起情绪 but format only asks 画面. I'll add subtle sound cues in visual column sparingly (e.g., 风声压到最低) — acceptable as "画面一栏用一句话说清屏幕上是什么" — keep mostly visual; a couple of mood cues ok but I'll minimize. Actually keep strictly visuals to obey format. The ice spectacle row: "（无字幕）冰晶炸开，发光冰纹爬满全屏" ✓.

For the spectacle row, brief: "写清楚它是什么" — I'll add a labeled row: 奇观（117–126 秒）：满屏冰晶… with description.

Now fact table. Include formula and computed values. Mark 待核 where unsure:
- 中文译名（西普尔/帕塞尔）待核
- 实验具体年份区间（1939–41）待核 — I'll not state in subtitles, only "1945 年，南极" hmm: the experiments were done in Antarctica during the 1939-41 expedition; paper 1945. Subtitle "1945 年，南极" slightly conflates publication with location but it's the standard telling ("In 1945, Siple and Passel published experiments conducted in Antarctica"). To stay safe: subtitle "1945 年" then "南极的风雪里" — location of experiments. The fact table can clarify: 实验数据来自南极（美国南极考察队时期，具体年份 1939–1941 待核），论文发表于 1945。✓
- 真人风洞：volunteers walked in wind tunnel at DRDC Toronto (待核机构名); faces instrumented ✓ widely reported.
- Frostbite: NWS chart: 30 min at −19°F/−28°C ✓ mark 待核.
- 25x water: mark 待核 (common survival-literature figure; thermal conductivity ratio ≈ 24).
- Skin 33℃: standard, mark 来源生理学常识, 待核 light. I'll mark honestly.

Format of fact table: 事实 | 出处/依据 | 备注(待核). Keep concise.

Also topics section: keep fields exactly as asked: 片名 / 抖音标题 / 背后的大想法（叫什么、谁、哪年）/ 为什么这几天的观众会想看 / 开头10秒观众身上发生什么.

Length: This will be a long document; that's fine (format requires it). Headers in Chinese, use markdown.

Final polish on 金句 marking: put ★ after金句 lines and list them at top of script? The brief: "金句：整片最多 3–4 句，放在章尾" — I'll just mark with ★ in the table and note positions in a one-line legend (part of required spec, not extra fluff).

Let me write the final answer now.

Structure:
# 一、三个选题
## 选题 1 《偷热的风》
- fields
## 选题 2 《热岛》
## 选题 3 《白气》

# 二、完整文案 《偷热的风》——风寒效应
- 片名出现位置：第 20 秒（开场吹气体验之后），片尾第 272 秒回现落版。
- 总时长：约 4 分 32 秒。
- 奇观：117–126 秒，满屏冰晶（详述在第三章）。
- 金句共 4 句，用 ★ 标出，均在章尾。

## 第一章 同一口气（0–20 秒）
table...

etc.

## 事实与出处表
table

Double-check: "不要写别的说明" — the header info (片名位置/奇观/金句 markers) is required by the brief ("写清楚片名在哪里出现", "写清楚它是什么"), so it's allowed. Keep it to a minimal legend.

One more numerical check: "五级阵风 29–38 km/h" — I use 30 km/h for calc ✓ consistent. In subtitles I only say "五级阵风" without km/h to avoid number clutter; formula table documents 30 km/h assumption. Good — but then is "体感掉到 13℃" honest? At 38km/h: V^0.16=e^(0.16*3.637)=e^0.582=1.790 → T=15: 13.12+9.3225−20.35+10.64=12.7 ≈ 13 ✓ robust across 5级 range. T=8 at 38: 13.12+4.972−20.35+5.68=3.4→ ~3-4 ✓ "像 4℃" ok. T=0 at 38: −7.2 → "零下6度半" hmm −6.5 to −7.2 range; fine "零下 6 度半" as approx. OK.

Also double-check first chapter: 慢哈气 is ~36°C breath landing gently → warm ✓; 用力吹 through pursed lips → cool jet ✓. Viewer experience real ✓.

Chapter 5 line "风改不了温度，只改你的散热" — is it a金句? It's more informational; fine, only ★ the 4 chosen.

I think ready. Write it.
