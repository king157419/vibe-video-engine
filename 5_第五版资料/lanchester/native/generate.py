"""Single source: subtitles, cues, numerical evidence, manuscript; deterministic, no downloads."""
from pathlib import Path
import json, random, math, re

BASE=Path(__file__).resolve().parents[3]
DOC=Path(__file__).resolve().parent
PUB=BASE/'video-engine/public/v4/lanchester/native'
PUB.mkdir(parents=True,exist_ok=True)
SEED=19161026
N=20000

def simulate(cap=None,blue_quality=1.0,seed=SEED):
    rng=random.Random(seed); outcomes=[]; hist={str(i):0 for i in range(-4,6) if i}
    for _ in range(N):
        a,b=5,4
        while a and b:
            ra=(min(a,cap) if cap else a)
            rb=(min(b,cap) if cap else b)*blue_quality
            if rng.random()<ra/(ra+rb): b-=1
            else:a-=1
        v=a if a else -b;outcomes.append(v);hist[str(v)]+=1
    aw=[x for x in outcomes if x>0]
    return {'n':N,'seed':seed,'gold_win_count':len(aw),'gold_win_pct':len(aw)/N*100,
            'gold_survivors_if_win':sum(aw)/len(aw),'histogram':hist,'outcomes':outcomes,
            'cap':cap,'blue_quality':blue_quality}

open_result=simulate()
choke_result=simulate(1,1.0,SEED+1)
numbers={'open':open_result,'choke':choke_result,'continuous':{'a0':5,'b0':4,'invariant':9,'a_final':3},
 'rules':'Continuous-time casualty Markov chain: gold kills at rate a, blue at rate b; independent exponential clocks; sample next-event side with a/(a+b). No health, skills or terrain. Choke caps BOTH effective shooter counts at 1, equal per-shooter effectiveness. Stop at first side zero. Signed survivors: gold positive, blue negative. The random model is NOT the deterministic square-law trajectory.'}

# Fixed scene clock: Chinese count includes Han characters and every digit/letter.
rows=[
(0,5,'5打4，最后剩几个？','Five against four. How many remain?','两队五橙四蓝，0帧亮主角和可读问句；2秒开始连续模型耗损。'),
(5.8,11.6,'这个理想模型里，剩3个。','In this ideal model, three remain.','按连续强度显示残量，不把离散随机游戏称作三人结局；三颗橙光。'),
(12.4,17.5,'人数只差一，为什么留下三？','One fighter apart. Why do three remain?','三颗光排成三角，聚为片名的光。'),
(22,27,'先让两边的人，一样强。','First, give every fighter equal strength.','五橙四蓝重新展开，模型示意字。'),
(27.8,33.3,'每个人，都能持续打到对面。','Everyone can keep firing across the field.','所有有效射手到对方目标，双向光流。'),
(34.1,39.6,'五个人开火，四个人接火。','Five keep firing. Four take the fire.','集中光流；橙五蓝四，箭头宽度比5:4。'),
(40.4,45.9,'先少一个，就少一份火力。','Lose a fighter, and you lose their fire.','蓝光一颗衰退，对面橙光少熄得更慢。'),
(46.7,52.7,'还击少了，对方减员也更慢。','Return less fire, and the enemy loses fighters more slowly.','蓝方的还击光流收窄，橙方的损耗随之放慢。'),
(53.5,59.5,'人数优势，就这样越滚越大。','The initial advantage keeps feeding itself.','队形变成两个面积方格，5×5与4×4。'),
(60.3,65.5,'剩余兵力的平方差，不变。','The difference of the squared forces remaining stays fixed.','25与16两片方格对消，剩9格。'),
(66.3,72,'5的平方，减4的平方，等于9。','Five squared minus four squared equals nine.','完整一条公式5²−4²=9，九格聚为3×3。'),
(72.8,78.1,'剩下的3，是9的平方根。','Three is the square root of nine.','3×3形变回三颗橙光，回拉开头。'),
(78.9,85,'改成随机模型，每次只倒一个。','Switch to a random model: one casualty per event.','连续光带断成五个独立光点，边界章。'),
(85.8,91.8,'开局，金方淘汰对手的概率是5/9。','Initially, gold causes the next casualty with probability 5/9.','20,000局计数从0到20000，模型示意；每一步随机事件，按对面有效射手数比例。'),
(92.6,98.6,f'五人队赢了{open_result["gold_win_pct"]:.1f}%。',f'The five-fighter side won {open_result["gold_win_pct"]:.1f} percent.','20000个真实结果点，每点对应1局，旁边仅一条胜率。'),
(99.4,105.4,f'赢的那些局，平均剩{open_result["gold_survivors_if_win"]:.2f}个。',f'Among its wins, {open_result["gold_survivors_if_win"]:.2f} survivors on average.','结果分布展开，不与连续模型3混用。'),
(106.2,111.7,'这是自建模拟，不是游戏战绩。','These are simulations, not real game statistics.','三颗橙光回到连续曲线旁，标「连续模型」，与随机结果分开后再淡暗。'),
(112.5,118,'现在，把战场收成一道窄口。','Now squeeze the field into a narrow passage.','满屏光点大阵收束，几千个光点进入窄口，形变第三次。'),
(118.8,124.3,'后排再多人，也只能等着。','However many wait behind, they cannot all fire.','窄口每方只能一人交战，后排暗，前排亮。'),
(125.1,130.3,'此刻，场上只剩一对一。','At this instant, it is one against one.','主角两颗光，背后两长队，窄口收紧。'),
(131.1,136.5,'人数的平方，退回了减法——','The square of the force gives way to subtraction—','正方阵全屏收成单线，136.5秒光场明显压暗，硬静音3秒，尘埃动。'),
(139.5,145.2,'同样强，五打四只剩一份。','With equal strength, five against four leaves one unit.','线性连续残量，只余1颗橙光；不声称4人必胜。'),
(146,152,'人少的一边，也就有了机会。','The smaller side now has a better chance.','同强度窄口随机模拟蓝方胜率出自第二组20000局，短暂显数字。'),
(152.8,158,'我專為一，敵分為十。','I concentrate as one; the enemy divides into ten.','古文第一句，兵力集中示意，原文繁体。'),
(158.8,165,'是以十攻其一也。','Thus ten attack one.','古文第二句，十股金流汇成一道，角注孙子·虚实。'),
(165.8,171.8,'多一个人，要站在能出力的地方。','An extra fighter needs a place where they can act.','回到开头五橙四蓝；一颗橙光走出遮挡，与队伍合流。'),
]
subs=[]
for t0,t1,zh,en,vis in rows:
    n=len(re.findall(r'[\u3400-\u9fffA-Za-z0-9]',zh))
    assert t1-t0>=n/4+1.5-1e-6,(zh,n,t1-t0)
    assert t1<=172
    subs.append(dict(t0=t0,t1=t1,zh=zh,en=en))
DUR=174
chapters=[{'t':0,'num':'00','zh':'差','en':'difference'},{'t':22,'num':'I','zh':'火','en':'fire'},
 {'t':60.3,'num':'II','zh':'方','en':'square'},{'t':78.9,'num':'III','zh':'局','en':'chance'},
 {'t':112.5,'num':'IV','zh':'口','en':'passage'},{'t':152.8,'num':'V','zh':'合','en':'together'}]
hits=[{'t':5.8,'type':'bell','deg':0,'gain':.18,'note':'连续模型三颗光定形'},
 {'t':18,'type':'boom','gain':.32,'note':'片名出现'},{'t':18,'type':'bell','deg':0,'gain':.18,'note':'片名出现'},
 {'t':40.4,'type':'bell','deg':0,'gain':.16,'note':'第一颗蓝光熄灭'},
 {'t':66.3,'type':'bell','deg':0,'gain':.18,'note':'9格亮起'},
 {'t':92.6,'type':'bell','deg':0,'gain':.16,'note':'两万局胜率显现'},
 {'t':112.5,'type':'riser','len':3,'gain':.18,'note':'大阵收束成窄口'},
 {'t':136.5,'type':'boom','gain':.2,'note':'窄口收紧并同步压暗；静音覆盖该击起点'},
 {'t':152.8,'type':'bell','deg':0,'gain':.14,'note':'古文集中兵力首行'},
 {'t':165.8,'type':'bell','deg':0,'gain':.16,'note':'第五颗橙光回到可出力位置'}]
sections=[]
spec=[(0,18,.48,'motif'),(18,22,.92,'chordal'),(22,40.4,.32,'sparse'),(40.4,60.3,.48,'motif'),
 (60.3,78.9,.66,'arp8'),(78.9,92.6,.28,'sparse'),(92.6,112.5,.48,'motif'),
 (112.5,125.1,.72,'arp8'),(125.1,136.5,.94,'arp8'),(136.5,139.5,.35,'sparse'),
 (139.5,152.8,.40,'motif'),(152.8,165.8,.68,'chordal'),(165.8,174,1.0,'chordal')]
for a,b,intensity,piano in spec:
    sections.append(dict(t0=a,t1=b,chords=['iadd9','VImaj7','III','VII'],bars_per_chord=2,
        layers=dict(piano=.48,pad=.55,low=.46,pulse=.06 if a<136 else 0),
        intensity=intensity,piano=piano,velocity=.42,register=-1,pad_bright=.18))
cue=dict(dur=DUR,key='D',mode='minor',bpm=66,seed=SEED,rt60=3.6,ramp=1.1,fade_in=.1,fade_out=1.6,
 motif=[[0,1],[2,1],[4,2],[2,1],[0,3]],sections=sections,hits=hits,silences=[[136.5,139.5]])
meta=dict(fps=30,dur=DUR,chapters=chapters,dings=[h for h in hits if h['type']=='bell'],
    title=[17.5,21.5],silence=[136.5,139.5],endmark=[172,174],seed=SEED,
    open_win_pct=round(open_result['gold_win_pct'],1),open_survivors=round(open_result['gold_survivors_if_win'],2),
    choke_blue_win_pct=round(100-choke_result['gold_win_pct'],1))
for name,data in [('subs',subs),('cue',cue),('numbers',numbers),('timeline_meta',meta)]:
    (PUB/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
table='\n'.join(f'| {a:.1f}–{b:.1f} | {zh} | {en} | {v} |' for a,b,zh,en,v in rows)
text=f'''# 《五打四》剧本

最终作者：Codex；DeepSeek 是否可用由总日志记录。片长 2:54，174秒，5220帧，30fps。唯一生成源为 generate.py，字幕共{len(subs)}句。

## 开头、学名、概念阶梯
0帧已有五颗暖橙光与四颗冰蓝光和问句；2秒起持续耗损，5.8秒三颗光落定。开头写明「理想模型」，不是游戏结局。17.5–21.5秒片名《五打四》，金色学名「兰彻斯特平方律 · 兰彻斯特 · 1916」；1916是成书年份，1914期刊已有平方律，奥西波夫1915独立工作只写事实核查和置顶。

序章加五章：火力随人数消失 → 连续方程平方差守恒 → 小队随机结果有分布 → 窄口限制有效射手 → 集中在能出力的地方。母题始终是同两队光点。三次形变：队列→面积→光流→窄口；结尾回到初始队形。

## 全片分镜
| 秒 | 中文 | 英文 | 画面 |
|---|---|---|---|
{table}

## 数学与模拟（不可混说）
连续模型 a′=−b，b′=−a；a²−b²=25−16=9；b=0时a=3。这是连续兵力强度，不是5个离散人的每局人数。画面首次有「连续模型」小标，所有面积/残量都由解析解计算。

20,000局随机模型：seed={SEED}，每一有效射手独立产生单位速率伤亡事件；下次蓝方减一概率a/(a+b)。没有复活、技能、血量、走位；两队同强。五人队赢{open_result['gold_win_count']}局（{open_result['gold_win_pct']:.1f}%），仅在这些胜局中平均剩{open_result['gold_survivors_if_win']:.2f}个。另跑20,000局窄口对照，seed={SEED+1}，两方射手上限都为1，蓝方胜率{100-choke_result['gold_win_pct']:.1f}%。窄口只移除多人齐射优势，不保证少的一方反胜。

## 引用
「我專為一，敵分為十，是以十攻其一也。」《孙子兵法·虚实》，维基文库逐字核对。拆为两句，原文繁体保留；讲集中兵力而非声称孙子证明平方律。

## 配乐和留白
D minor，66bpm，自合成，无旁白。七处bell（见cue/meta），片名boom。136.5–139.5秒满3秒硬静音，光场同步压暗、尘埃继续漂；172–174秒只剩极小Opus 5.5。终段强度最高。示意战场不使用游戏素材。

## 取舍
舍去旧提案「以少打多唯一办法」和历史战例、蚂蚁例子；有地形、技能、射程、效率差异时不能硬套平方律。随机模拟用自身实际数据，未沿用旧稿3.6。约174秒的短版为本期长度实验。
'''
(DOC/'剧本.md').write_text(text,encoding='utf-8')
(DOC/'模拟统计.md').write_text('# 可复现模拟\n\n'+json.dumps({k:{x:v for x,v in r.items() if x!='outcomes'} if isinstance(r,dict) else r for k,r in numbers.items()},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'duration':DUR,'subtitles':len(subs),'open_win_pct':open_result['gold_win_pct'],'survivors_if_win':open_result['gold_survivors_if_win'],'choke_blue_win_pct':100-choke_result['gold_win_pct']},ensure_ascii=False))

from PIL import Image, ImageDraw
im=Image.new('RGBA',(1600,700),(0,0,0,0))
dr=ImageDraw.Draw(im)
for i,v in enumerate(open_result['outcomes']):
    x,y=(i%200)*8+4,(i//200)*7+3
    col=(242,181,107,230) if v>0 else (117,189,232,230)
    dr.ellipse((x-1,y-1,x+1,y+1),fill=col)
im.save(PUB/'results.png')
assert len(open_result['outcomes'])==20000
assert sum(v>0 for v in open_result['outcomes'])==14295
assert abs(open_result['gold_survivors_if_win']-3.623504721930745)<1e-9
import subprocess,sys
subprocess.run([sys.executable,str(DOC/'build_cloud.py')],check=True)
(DOC/'生成验证.json').write_text(json.dumps(dict(seed=SEED,n=N,gold_wins=14295,gold_pct=open_result['gold_win_pct'],gold_survivors_if_win=open_result['gold_survivors_if_win'],points=20000,layout='four_depth_cloud',point_meta='cloud_meta.json',one_point_one_trial=True,frames=174*30),ensure_ascii=False,indent=2),encoding='utf-8')
