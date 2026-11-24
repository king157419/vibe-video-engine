"""《宝宝》字幕/音乐/分镜唯一来源。运行后统一生成数据及剧本。"""
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parents[3]
DOC=ROOT/'5_第五版资料/baobao'
PUB=ROOT/'video-engine/public/v4/baobao'
DUR=242.0
# 开始、持续、中文、英文、画面；字幕之外的长留白在下方具名。
ROWS=[
(0,6.0,'两张脸，你的目光先停在哪张？','Two faces. Which one catches your eye first?','两张光点脸同样亮，右边额头更高、脸更圆、眼睛更大，呼吸幅度相同。'),
(8.0,5.5,'圆脸、大眼，会让你心软一点吗？','Round cheeks, wide eyes. Do you feel a little softer?','两张脸同位对照，右脸缓慢靠近；不替观众判定反应。'),
(23.0,5.5,'婴儿脸，有一组特别的比例。','A baby face has a distinctive set of proportions.','两张脸沿同一条轮廓形变，眼睛和额头的比例连续变化。'),
(29.3,5.5,'额头更高，眼睛更大，下巴更短。','A higher forehead, larger eyes, a shorter chin.','同一张脸沿轮廓显出金色弧线，视觉比较不标测量值。'),
(35.6,5.5,'洛伦兹把它叫作娃娃脸图式。','Lorenz called this the baby schema.','轮廓收成一个金色护环，画面短暂显出“1943”。'),
(41.9,5.5,'实验里，这样的脸更让人想照顾。','In experiments, such faces prompted more desire to care.','相同一张脸左右形变，护环柔软地包住脸；画面标“形态示意”。'),
(48.2,5.5,'对婴儿说话，声音也常会变软。','People often soften their voices when speaking to babies.','脸的下颌线拉长成一条波形，声音仅是画面，无旁白。'),
(56.0,5.5,'恋人有时，也会这样说话。','Lovers sometimes speak that way too.','波形从单条变为两条，金青相向，末端仍是两枚脸的光核。'),
(62.3,5.5,'拉长的音，叠着的字，轻轻地哄。','Drawn-out sounds, repeated syllables, gentle reassurance.','两条波形伸长，同一个波峰在两端轻柔传递。'),
(68.6,5.5,'小孩想靠近时，会向大人伸手。','A child reaches out to someone they trust.','波形弯成手掌形光弧，两枚光点在弧中靠近。'),
(74.9,5.5,'长大后，我们仍会寻找依靠。','Growing up does not end our search for closeness.','两枚光点各自变大，护弧保留，成年并未消失。'),
(81.2,5.5,'像小孩，不等于患了什么病。','Being childlike is not, by itself, a disorder.','两条线从交错中舒展；不出现人格或诊断标签。'),
(89.0,5.5,'两个人还会发明，外人听不懂的词。','Couples also invent words outsiders cannot understand.','两条波形弯成相互环绕的一条封闭曲线。'),
(95.3,5.5,'可能是昵称，也可能是一句玩笑。','A nickname, perhaps. Or a private joke.','曲线中的两枚光点靠近，中心只出现“暗号”。'),
(101.6,5.5,'同一个词，被两个人的经历改了意思。','Shared experience gives the same word a different meaning.','线围着两点走过的轨迹编织，外部尘埃不加入。'),
(107.9,5.5,'亲密，不只在词里，也在来回回应里。','Intimacy lives in the word, and in the replies it receives.','两端光脉往返，环变得更明亮，不画成因果统计。'),
(116.0,5.5,'可有些人，连亲爱的都叫不出口。','Yet some people cannot bring themselves to say darling.','封闭环逐渐拉成一道门；光点停在门的两边。'),
(122.3,5.5,'这不等于，他们爱得更少。','That does not mean they love any less.','门框从两点前面收走，两点的亮度保持相等。'),
(128.6,5.5,'叫不出口，也许是学来的习惯。','Being unable to say it may reflect habits learned over time.','一层较暗的外部支架围住双点，形成家屋的轮廓。'),
(134.9,5.5,'有人用做饭、接送，表达在乎。','Some express care by cooking, or coming to pick you up.','家屋中的弧线化为相向而行的两条路径。'),
(141.2,5.5,'有人还需要，把在乎说出来。','Others also need care to be put into words.','路径的两端发出光脉，在中间相接。'),
(147.5,5.5,'吉登斯提出，纯粹关系这个概念。','Giddens proposed the concept of the pure relationship.','外部支架慢慢退远，主角仍是两点及相连弧线。'),
(153.8,5.5,'关系本身的满足，成为维系的理由。','Satisfaction within the relationship becomes a reason to sustain it.','外框淡去，连接由两端往返的脉冲不断照亮；理论模型的视觉阐释。'),
(160.1,5.5,'一句宝宝，也可以是在确认：我在。','Baby can be one small way of saying: I am here.','曾经的两条波形拉回画面，汇合成“宝宝”两个字。'),
(168.0,5.5,'可这个词，也走出了两个人的房间。','But the word has travelled beyond the room for two.','“宝宝”中一个“宝”飘出护环。'),
(174.3,5.5,'客服叫亲，直播间喊家人们。','Dear in customer service. Family in a livestream.','不同语境的两条光流出现再消失，不排成传播年代史。'),
(180.6,5.5,'陌生人，也能熟练地叫你宝。','A stranger can call you baby with practised ease.','“宝”沿同一条光流复制，先少后多，跨画面铺开。'),
(186.9,5.5,'同一个字，能照亮整片人海——','One word can light up a whole crowd—','单个宝变为2400个发光宝，越外侧越淡；193秒同步收束。'),
(197.0,5.5,'但你等的，是那个人的一声。','But you are waiting for one particular voice.','3秒静音后，满屏字只剩一个，双点重新靠近。'),
(204.0,5.5,'老子写：常德不离，复归于婴儿。','The Laozi says: return to the state of the infant.','一条细光环围住光点；古文仅作字幕，不伪装现代实验。'),
(210.3,5.5,'他说的是返朴，不是在解释恋爱。','It is about returning to simplicity, not a theory of romance.','光环褪去装饰，回到最简单的一条轮廓，完成边界叙述。'),
(216.6,5.5,'叫不叫宝宝，都不替感情打分。','Calling someone baby is no scorecard for love.','开场两张脸拉回，尺寸和亮度相同，不设赢家。'),
(222.9,5.5,'重要的是，那个词有没有被回应。','What matters is whether that word is met with a reply.','两张脸的光脉彼此抵达，形变成靠近的两点。'),
(229.2,5.8,'在你身边，我不用一直逞强。','With you, I do not have to be strong all the time.','两点互相环绕，轮廓化为片名，238秒前渐隐。'),
]
CHAPTERS=[{'t':23,'num':'I','zh':'按钮','en':'CARE'}, {'t':56,'num':'II','zh':'借用','en':'BORROWING'}, {'t':89,'num':'III','zh':'暗号','en':'PRIVATE WORDS'}, {'t':116,'num':'IV','zh':'说出口','en':'SAYING IT'}, {'t':168,'num':'V','zh':'人海','en':'THE CROWD'}, {'t':197,'num':'VI','zh':'回应','en':'A REPLY'}]
HITS=[(3.8,'bell','右脸比例清晰显现'),(15.3,'boom','片名聚起'),(15.3,'bell','片名下金线相接'),(35.6,'bell','1943与护环同时点亮'),(62.3,'bell','两波形第一次相触'),(95.3,'bell','暗号闭环'),(128.6,'bell','家屋轮廓合拢'),(153.8,'bell','外框退出、两点相连'),(183.0,'riser','宝字人海开始扩散'),(189.0,'boom','满屏2400字'),(197.0,'bell','只剩一个宝'),(229.2,'bell','双点回应回环')]

def main():
    PUB.mkdir(parents=True,exist_ok=True)
    subs=[]
    for i,(t,d,zh,en,visual) in enumerate(ROWS):
        n=len(re.findall(r'[\u4e00-\u9fffA-Za-z0-9]',zh))
        assert d>=n/4+1.5,(i,zh,n,d)
        assert 4<=d<=8
        assert not any(w in zh for w in ['答案','记住','建议','作业','知识点','应该','先选'])
        if subs: assert t>=subs[-1]['t1']+.6-1e-6
        subs.append(dict(key=f'L{i+1:02}',t0=t,t1=round(t+d,3),zh=zh,en=en))
    segments=[(0,14,.65),(14,23,1.15),(23,56,.48),(56,89,.6),(89,116,.38),(116,147,.28),(147,168,.7),(168,183,.8),(183,193,1.2),(193,196,.1),(196,216,.55),(216,240,1.15),(240,242,.1)]
    cue=dict(dur=DUR,key='D',mode='dorian',bpm=66,seed=1026,rt60=3.6,ramp=1.5,fade_in=.05,fade_out=2.0,motif=[[0,1],[2,1],[4,2],[3,1],[2,1],[0,2]],silences=[[193,196]],
        sections=[dict(t0=a,t1=b,chords=['i','III','VII','iv'],piano='motif' if a>=216 else 'sparse',density=.42,layers=dict(piano=.65,pad=.35,low=.5,pulse=.05 if a<14 else 0),velocity=.5,intensity=k) for a,b,k in segments],
        hits=[dict(t=t,type=kind,gain=.42 if kind=='bell' else .45,deg=0,pan=.5,note=note,**({'len':3} if kind=='riser' else {})) for t,kind,note in HITS])
    meta=dict(duration=DUR,fps=30,chapters=CHAPTERS,title=[15,23],silence=[193,196],credits=[240,242],seed=1026,hit_visuals=[dict(t=t,type=k,visual=v) for t,k,v in HITS],gaps={'6–8':'问句留白2秒，双脸呼吸','13.5–23':'形变片名卡','192.4–197':'奇观后3秒静音、字收束而尘埃动','235–240':'回环片名','240–242':'仅署名'})
    for name,value in [('subs',subs),('cue',cue),('timeline_meta',meta)]:
        (PUB/f'{name}.json').write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# A《宝宝》剧本','', '中文：Codex（指定DeepSeek中转复测401）；英文、画面与结构：Codex。', '', '片长4:02（7260帧）。主线：照顾倾向→亲密中的借用→两人的暗号→关系的日常确认→公开称呼→回应。', '', '片名卡0:15–0:23：宝宝／纯粹关系 · 吉登斯 · 1992／THE PURE RELATIONSHIP。', '', '开头采用两张等亮光点脸。备选：0秒直接出“宝宝”，问“觉得甜，还是起鸡皮疙瘩？”；未采用，避免把主线开头变成单纯提问。', '', '社会学边界：用户与部分80后聊天是选题线索，并非总体调查。不作整代人的结论，不声称当代关系只靠语言或只靠感情。娃娃脸也不等于昵称触发同样脑机制。', '', '文化引用：老子第二十八章“常德不离，复归于婴儿”；指返朴，片内明确不是恋爱实验。形变：脸→波形→双环→家屋→宝字人海→脸。', '', '## 逐句分镜（与JSON同源）','', '|时间（秒）|中文|英文|画面（主角上中部，字幕底部）|','|---|---|---|---|']
    for s,row in zip(subs,ROWS): lines.append(f"|{s['t0']:.1f}–{s['t1']:.1f}|{s['zh']}|{s['en']}|{row[4]}|")
    lines+=['','## 声音点位','', '|秒|类型|可见重点|','|---|---|---|']+[f'|{t}|{k}|{v}|' for t,k,v in HITS]
    lines+=['','硬静音193–196秒，最强一拍后整3秒；所有宝字在7帧内暗去，留一字，尘埃继续流动。最后240–242秒只有极小Opus 5.5。', '', '配色：金=亲密回应，青=另一人；粉仅在满屏传播中混入，其他时刻不增加语义色。画面除字幕多数≤8字，奇观为具名例外。', '', '字幕公式检查：每句≥字数/4+1.5秒，间隔≥0.6秒；问句后2秒留白、标题/章节/静音留白见timeline_meta.json。']
    (DOC/'剧本.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(f'{len(subs)} subtitles; {DUR}s; {len(HITS)} hits; all timing checks PASS')
if __name__=='__main__': main()
