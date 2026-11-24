"""星空的风：字幕、配乐、画面时间轴唯一来源。确定性 seed=1941。"""
import json,re,pathlib
BASE=pathlib.Path(__file__).resolve().parents[3]
OUT=BASE/'video-engine/public/v4/starry/native'
DOC=pathlib.Path(__file__).resolve().parent
# Explicit beats preserve the biographical and conceptual staircase.
ROWS=[
(0,4.5,'一缕奶，正在把咖啡卷起来。','A thread of milk curls through coffee.','咖啡里亮奶光已经存在；大旋涡卷入小旋涡'),
(5.3,9.3,'大圈里，又长出了小圈。','Inside the large swirl, smaller swirls appear.','镜头沿奶光拉远，细旋涡显现'),
(10.1,14.6,'这片天空，你大概见过。','You may have seen this sky before.','旋涡形变成代码星月夜；柏树和月亮进入构图'),
(23,28.2,'1880年，梵高决定学画。','In 1880, Van Gogh decided to become an artist.','I 起点：线条轮廓变成一支画笔，1880'),
(29,34,'那年，他已经二十七岁。','He was already twenty-seven.','画笔蘸亮一颗种子般的光，27'),
(34.8,40.3,'起初，画布上多是暗色的农人。','His early canvases often showed peasants in dark tones.','暗色农田曲线由画笔拉出'),
(41.1,46.1,'后来，他开始用短笔触并排放颜色。','Later, short strokes placed vivid colors side by side.','同一曲线拆成钴蓝与铬黄笔触'),
(48,53.5,'1888年，他搬到阿尔勒。','In 1888, he moved to Arles.','II 向南：笔触升成太阳，1888'),
(54.3,59.5,'南方的光，把他的画布照亮了。','The southern light brightened his canvas.','阳光长成黄色房屋轮廓'),
(60.3,65.5,'他想让画家们住到一起。','He wanted to build a community of painters.','黄屋窗口逐个亮起；作为创作愿望而非统计'),
(66.3,72,'最后，画室的愿望没有走下去。','The dream of a shared studio did not last.','屋中两束光慢慢分离，轮廓卷成天空'),
(75,80.5,'1889年，圣雷米。','1889. Saint-Rémy.','III 夜空：三条窗框光线变成天空边界'),
(81.3,87,'六月，他画下了《星月夜》。','That June, he painted The Starry Night.','代码笔触不断填满缩小的天空'),
(87.8,94,'眼前的风景，被他重新安排过。','He rearranged what he saw.','窗口与村庄位置形变；不称照片般忠实'),
(94.8,101,'村庄、柏树、星光，被放进同一片蓝。','Village, cypress and starlight share a single blue.','一幅暗底发光构图，月亮星光缓动'),
(104,109.5,'画里的旋涡，让人想到真实的流动。','The painted eddies bring real flows to mind.','IV 传递：画中同一个大涡连续移回咖啡杯，背景村庄隐去'),
(110.3,116,'大旋涡，把能量传给小旋涡。','Large eddies pass energy down to smaller ones.','同一条发光流线从大旋涡连续卷入两个小旋涡'),
(116.8,122,'再小一些，最后被黏性耗散。','At smaller scales, viscosity finally dissipates it.','细旋涡光线弥散成温暖微光'),
(122.8,129,'1941年，柯尔莫哥洛夫写下理论。','In 1941, Kolmogorov formulated his theory.','一条曲线由细笔触长成，1941'),
(129.8,136.5,'按大小看旋涡，能量的分布有规律。','Across eddy sizes, the energy distribution follows a pattern.','双对数示意曲线；横轴右端小涡，左端大涡，纵轴能量谱；箭头标涡更小'),
(140,146,'2024年，有人重新量了这幅画。','In 2024, researchers measured the painting anew.','V 相遇：示意曲线拉回代码星月夜'),
(146.8,152.6,'这一次，量的是画面的明暗。','This time, the measured quantity is the painting’s light and dark.','同一幅天空亮暗笔触逐个点亮；不虚报计数'),
(153.4,159.4,'马寅翔等人，分析了全部旋涡。','Yinxiang Ma and colleagues analyzed all the eddies.','笔触亮暗抽象成亮度谱示意；临时轴标签换成亮度'),
(160.2,166.2,'旋涡尺度间，亮度谱符合负五分之三。','Across the eddy scales, the luminance spectrum follows a minus-five-thirds law.','−5/3随曲线出现；屏幕标亮度谱·示意'),
(167,173.5,'画早了五十二年，相合的是亮度统计。','The painting came fifty-two years earlier; the match lies in luminance statistics.','1889与1941两点联成52年，随后曲线长回满屏旋涡'),
(180,185.5,'画布里没有风速计。','There is no anemometer inside a canvas.','VI 边界：静音后孤星重新长回笔触'),
(186.3,192.5,'同一条斜率，不等于同一种物理过程。','The same slope does not prove the same physical process.','画面半边笔触、半边流线，随后分开'),
(193.3,199,'这也不能证明，他预先懂得了公式。','Nor does it show that he knew the formula in advance.','公式淡出，只留具体旋涡笔触'),
(199.8,206,'《庄子》说：夫大块噫气，其名为风。','Zhuangzi: The great earth breathes; we call it wind.','引用两行随曲线呼吸；原文简化字转换'),
(208,213.5,'1890年，他来到奥维尔。','In 1890, he came to Auvers-sur-Oise.','VII 花开：天空曲线长成栗树的枝干'),
(214.3,220,'《盛放的栗树》，画在这一年。','Chestnut Trees in Flower was painted that year.','奶白花簇按枝条一簇簇亮起；不是星月夜'),
(220.8,226.8,'画家留下笔触，我们继续往里看。','The painter left his brushstrokes. We keep looking into them.','花簇变回杯中奶光，回到首帧旋涡'),
]
DUR=242
CH=[{'t':23,'num':'I','zh':'起点','en':'BEGINNING'},{'t':75,'num':'II','zh':'夜空','en':'NIGHT'},{'t':104,'num':'III','zh':'传递','en':'CASCADE'},{'t':140,'num':'IV','zh':'相遇','en':'ENCOUNTER'},{'t':180,'num':'V','zh':'边界','en':'LIMITS'},{'t':208,'num':'VI','zh':'花开','en':'BLOOM'}]
HITS=[(15,'boom','奶光聚成片名'),(15,'bell','片名轮廓发亮'),(48,'bell','太阳照亮黄屋'),(81.3,'bell','星月夜构图完整出现'),(110.3,'bell','大旋涡分裂'),(129.8,'bell','能量谱斜线完成'),(160.2,'bell','亮度谱负五分之三出现'),(173.5,'riser','旋涡满屏高潮终点'),(208,'bell','第一簇栗花'),(232,'bell','拍卖卡出现')]
subs=[dict(t0=a,t1=b,zh=z,en=e) for a,b,z,e,_ in ROWS]
for s in subs:
 n=len(re.findall(r'[\u4e00-\u9fff]|[0-9A-Za-z]',s['zh']))
 assert s['t1']-s['t0']>=max(4,n/4+1.5)-.01,(s,n)
 assert not any(x in s['zh'] for x in ['答案','记住','建议','先选','作业','知识点'])
 assert s['t1']-s['t0'] <= 8, s
 assert n <= 22, (s,n)
 assert not any(x in s['zh'] for x in ['正确','应该','记得','选项','留个题','错在']),s
for previous,current in zip(subs,subs[1:]):
 assert current['t0'] >= previous['t1'],(previous,current)
assert len(HITS)<=15
assert len(CH)==6
sections=[]
for a,b,intensity,piano in [(0,15,.52,'motif'),(15,23,.95,'chordal'),(23,48,.38,'sparse'),(48,75,.62,'motif'),(75,104,.43,'sparse'),(104,140,.62,'arp'),(140,160,.70,'arp'),(160,177,1.1,'arp8'),(177,180,.25,'sparse'),(180,208,.39,'sparse'),(208,230,.93,'motif'),(230,242,1.05,'chordal')]:
 sections.append(dict(t0=a,t1=b,chords=['i','VIadd9','III','VII'],bars_per_chord=2,layers=dict(piano=.65,pad=.55,low=.46,pulse=.12 if a<177 else .05),piano=piano,intensity=intensity,velocity=.48,pad_bright=.25))
cue=dict(dur=DUR,key='D',mode='dorian',bpm=64,seed=1941,rt60=3.8,ramp=1.2,fade_in=.05,fade_out=2,motif=[[0,1],[2,1],[4,2],[2,1],[1,1],[0,2]],sections=sections,hits=[dict(t=t,type=typ,gain=.45 if typ=='bell' else .55,note=n,deg=0) for t,typ,n in HITS],silences=[[177,180]])
meta=dict(fps=30,duration=DUR,seed=1941,chapters=CH,hits=[dict(t=t,type=typ,note=n) for t,typ,n in HITS],silence=[177,180],auction=dict(from_sec=232,to_sec=240,label='媒体估价',value='约1.8亿美元',status='待落槌',date='纽约 · 2026.11.18',work='盛放的栗树'),time_map=[[0,0],[DUR,DUR]])
OUT.mkdir(parents=True,exist_ok=True)
for name,v in [('subs',subs),('cue',cue),('timeline_meta',meta)]:
 (OUT/(name+'.json')).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
head='''# B《星空的风》剧本\n\n> 2026-10-26 初稿。中文由 Codex 写作（DeepSeek 重试结果由总负责人记录）。242 秒，7260 帧，30 fps。唯一来源 timeline.py；修改字幕后重跑。\n\n开场第 0 帧有亮奶光和字幕；15–23 秒片名卡「湍流级串 · 柯尔莫哥洛夫 · 1941」。六章依次从起步、南方的光、夜空的安排走到级串、亮度统计、边界和最后的花。\n\n颜色：钴蓝=笔触与结构，铬黄=能量与星光，奶白=咖啡与栗花。暗底、衬线双语字幕；无旁白、无外部素材。旋涡形变三次：咖啡→星空，星空→级串，花簇→奶光。所有流线为解析示意；不声称流体模拟或论文数据复现。\n\n173.5–177 秒满屏旋涡；177–180 秒硬静音，同时主角七帧迅速压暗，只剩孤星，星尘继续移动。232–240 秒拍卖可替换卡；240–242 秒只有极小 Opus 5.5。\n\n文化引用「夫大块噫气，其名为风」，出自《庄子·齐物论》，比湍流范围更广，只用于观看自然的感受，不作为物理证据。\n\n|时间/秒|中文|英文|画面|\n|---|---|---|---|\n'''
table='\n'.join(f'|{a:g}–{b:g}|{z}|{e}|{v}|' for a,b,z,e,v in ROWS)
tail='\n\n空白例外：15–23 片名卡；46.1–48、72–75、101–104、136.5–140 为章间形变；173.5–180 奇观+静音；226.8–232 回环及标题；232–240 拍卖卡。其余句间 0.8 秒。片名/曲线和年份是必要的偶发文字，多数帧无额外汉字。\n\n## 点位声音\n\n'+ '\n'.join(f'- {t:g} 秒 {typ}：{n}' for t,typ,n in HITS)+'\n\n自查：无教学话术；第 0 帧字幕可见；事实限制有独立章节；末 2 秒只署名；图表为示意。'
(DOC/'剧本.md').write_text(head+table+tail,encoding='utf8')
print('PROBLEMS: none;',len(subs),'subtitles;',DUR,'seconds;',len(HITS),'hits')
