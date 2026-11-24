r"""《弱关系》第四版时间轴（第二轮审片后）。
第三版：1:49 的留白 3.5 → 2.2 秒；片尾片名卡三层多留 1 秒再一起淡出。
第四版：S1 缩到 13 字（提问提前到 0:12）；S6 缩到 17 字；S12「5.2个人」去空格；硬静音 1.4 → 1.5 秒；
       留白里加 3 个钢琴音（光点经过 3 颗银点）；配乐表按声音审片第二轮意见重排（见 build_cue）。
2026-10-12 用户反馈：S32 改说「是有十来个共同好友的人」，新增 S32b「不算熟，也不算生。」（其后整体晚 4.3 秒）；
       新锚点 k2022（peak / hold_end 和故事时间配对，见 ties_anchors_story.json）。
画面代码用的是第二版的「故事时间」（ties_anchors_story.json），time.ts 用两份锚点逐个配对做分段线性映射。
算出每句字幕和每个动画锚点的时刻，打印时间表。
运行：D:\conda\envs\d2l\python.exe ties_timeline.py          只打印
      D:\conda\envs\d2l\python.exe ties_timeline.py write    同时写 subs.json、cue.json（video-engine/public/v4/ties/）
动画锚点每次都写到同目录的 ties_anchors.json。字幕时长规则：在屏 ≥ max(4, 字数 ÷ 4 + 1.5) 秒，句间空约 0.8 秒。"""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
GAP = 0.8
BEAT = 60 / 72  # 0.8333 s


def nchars(zh):
    return len(re.findall(r"[一-鿿0-9A-Za-z]", zh))


def need(zh):
    return max(4.0, nchars(zh) / 4 + 1.5)


def r1(x):
    return round(x + 1e-9, 2)


subs = []
A = {}  # 锚点


def sub(key, zh, en, t0, extra=0.0, dur=None):
    d = dur if dur is not None else need(zh) + extra
    d = round(max(d, need(zh)) * 10 + 0.4999) / 10  # 向上取到 0.1 s
    t0 = round(t0 * 10) / 10  # 字幕起点取到 0.1 s（句间空因此在 0.75–0.85 之间）
    t1 = round(t0 + d, 2)
    subs.append({"key": key, "t0": t0, "t1": t1, "zh": zh, "en": en})
    A[key] = (t0, t1)
    return t1


# ======================= 0  2026 · 你这里（冷开场）
A["chap_2026a"] = 1.0
# 审片（声音 P2）：原句 20 字、在屏 6.3 秒，提问要到 0:13.8 才出来。缩到 13 字，提问提前到 0:12。
t = sub("S1", "两千个人里，有你，和一个陌生人。",
        "Among two thousand people, there is you — and a stranger.", 1.2)
t = sub("S2", "你认识的人，大多就在你身边。", "Most of the people you know are close by.", t + GAP)
t = sub("S3", "你们之间，隔着几个人？", "How many people stand between you two?", t + GAP)
A["ripple"] = (t, t + 3.0)               # 留白 3 秒：银色涟漪沿邻居一格一格爬（纯环 BFS，每层 BEAT/3）
Tm = t + 3.0 + 0.4                       # 钢琴动机第一音 = 第一次落地
A["depart1"] = t + 3.0
A["hops1"] = [r1(Tm), r1(Tm + BEAT), r1(Tm + 3 * BEAT), r1(Tm + 4 * BEAT), r1(Tm + 5 * BEAT)]
arr1 = Tm + 5 * BEAT
t = sub("S4", "中间只隔了四个人。", "Just four people in between.", arr1 + 0.3)
t = sub("S5", "其中一步，跨出了圈子。", "And one step left the circle altogether.", t + GAP)
T5 = t
A["title1"] = {"dim": T5 - 0.8, "fly": (T5 - 0.6, T5 + 1.6), "hair": (T5 + 1.2, T5 + 2.0), "bridge": (T5 + 1.0, T5 + 2.0),
               "land": T5 + 2.0, "bell": T5 + 2.2, "sub_in": T5 + 2.4, "en_in": T5 + 2.9, "out": (T5 + 5.8, T5 + 6.8),
               "black": (T5 + 6.8, T5 + 7.7)}
# ======================= 1  1929 · 布达佩斯
c = T5 + 7.7
A["chap_1929"] = c
# 审片（声音 P2）：片名后紧接全片最长的一句（23 字 7.3 秒），缩到 17 字（「匈牙利」交给路标「布达佩斯」和英文）
t = sub("S6", "1929年，卡林西的小说里，有人打了个赌：",
        "In 1929, in a story by the Hungarian writer Frigyes Karinthy, someone made a bet:", c + 0.5)
t = sub("S7", "地球上十五亿人，随便挑一个——", "name anyone among the Earth's 1.5 billion people,", t + GAP)
t = sub("S8", "最多隔五个人，他就能连上。", "and he could reach them through five people at most.", t + GAP)
A["morph_globe_map"] = (t, t + 2.0)
# ======================= 2  1967 · 奥马哈
c = t + 2.0
A["chap_1967"] = c
t = sub("S9", "三十多年后，米尔格拉姆真的把这个赌寄了出去。",
        "More than thirty years later, Stanley Milgram actually put the bet in the mail.", c + 0.5)
t = sub("S10", "收信人只有一个：波士顿的一位股票经纪人。", "Every letter had one destination: a stockbroker in Boston.", t + GAP)
t = sub("S11", "规矩是：只能交给叫得出名字的熟人。", "The rule: pass it only to someone you know by first name.", t + GAP)
A["sparks"] = (t + 0.3, t + 2.5)
t = sub("S12", "到了的信，中间平均只经过5.2个人。", "The letters that arrived had passed through 5.2 people, on average.", t + 3.0)
A["ding_milgram"] = A["S12"][0] + 0.3
A["dive"] = (t, t + 2.5)
t = sub("S13a", "你的朋友，很多也互相认识。", "Many of your friends know one another.", t + GAP)
t = sub("S13b", "信本该在圈子里打转，却几步就到了。",
        "The letters should have gone in circles. Instead, they arrived in a few steps.", t + GAP)
A["collapse"] = (t, t + 1.2)
# ======================= 3  1973 · 波士顿
c = t + 1.2
A["chap_1973"] = c
t = sub("S14", "你的上一份工作或实习，最早是听谁说的？", "Your last job or internship — who first told you about it?", c + 0.5)
BLANK2 = 2.2  # 审片：原 3.5 秒，画面和声音同时最空，是最容易被划走的地方
A["blank2"] = (t, t + BLANK2)
# 留白里光点往右漂，依次经过 3 颗极淡的银点，每过一颗那颗亮一下，配一个钢琴音
A["pings"] = [r1(t + 0.25 * BLANK2), r1(t + 0.5 * BLANK2), r1(t + 0.75 * BLANK2)]
t = sub("S15", "哈佛博士生格兰诺维特，问了两百多个刚换工作的人。",
        "Mark Granovetter, a Harvard graduate student, asked over two hundred people who had just changed jobs.",
        t + BLANK2)
t = sub("S16", "帮上忙的人，超过四分之一，一年最多见一次。",
        "More than a quarter of those who helped were people they saw once a year or less.", t + GAP)
t = sub("S17", "你最好的朋友知道的，你差不多也知道。", "What your closest friends know, you mostly know already.", t + GAP)
t = sub("S18", "不太熟的人，站在另一个圈子里。", "Those you barely know move in other circles.", t + GAP)
t = sub("S19", "1973年，他把这叫作「弱关系的力量」。", "In 1973, he gave it a name: the strength of weak ties.", t + GAP)
A["ding_name"] = A["S19"][0] + 0.4
A["morph_circles_disc"] = (t, t + 1.2)
# ======================= 4  1998 · 康奈尔（含 2016）
c = t + 1.2
A["chap_1998"] = c
t = sub("S20", "1998年，瓦茨和斯托加茨，用一张网搭出了小世界。",
        "In 1998, Duncan Watts and Steven Strogatz built a small world out of a simple network.", c + 0.5)
t = sub("S21", "还是这两千个人，每人只认识身边二十个。",
        "The same two thousand people, each knowing only their twenty nearest neighbours.", t + GAP)
A["push_in"] = (A["S21"][0] + 1.0, A["S21"][0] + 5.0)
s22 = t + GAP
A["crawl"] = {"slow": (s22, s22 + 6 * BEAT / 3), "fast_end": s22 + 4.7, "hold_end": s22 + 5.2}
t = sub("S22", "这样，最近的路也要一百步。", "Wired this way, even the shortest route takes a hundred steps.", s22, dur=5.2)
t = sub("S23", "现在，只把百分之一的线，随手接到远处。", "Now take one line in a hundred, and tie it anywhere at all.", t + GAP)
A["chords"] = (A["S23"][0] + 0.5, A["S23"][0] + 5.7)
s24 = t + GAP
Tm2 = s24 + 0.4
A["hops2"] = [r1(Tm2), r1(Tm2 + BEAT), r1(Tm2 + 3 * BEAT), r1(Tm2 + 4 * BEAT), r1(Tm2 + 5 * BEAT)]
arr2 = Tm2 + 5 * BEAT
A["riser_end"] = A["chords"][1]
A["flood"] = [r1(arr2 + k * BEAT / 3) for k in range(1, 10)]
cut = arr2 + 3 * BEAT + 0.4
A["cut"] = cut
SIL = 1.5  # 审片（声音 P2）：1.4 秒实测只有 1.31 秒数字零；拉到 1.5 秒，混音时再把这一段强制归零
A["silence"] = (r1(cut), r1(cut + SIL))
t = sub("S24", "一百步，塌成了五步。", "A hundred steps collapse into five.", s24, dur=arr2 + 0.6 - s24)
t = sub("S25", "圈子几乎没变，世界却变小了。", "The circles barely changed. The world grew small.", cut + SIL + 0.15)
t = sub("S26", "开头跨出圈子的那一步，就是这样一根线。",
        "The step that left the circle at the start was one of these lines.", t + GAP)
t = sub("S27", "而这样的线，就是你不太熟的那些人。", "And lines like these are the people you barely know.", t + GAP)
t = sub("S28a", "一条线虫的神经，美国西部的电网，", "A worm's nerves, the power grid of the American West,", t + GAP)
t = sub("S28b", "合演过电影的演员，都长这样。", "actors who have shared a film — all look like this.", t + GAP)
t = sub("S29", "2016年，脸书上的十六亿人，平均只隔三个半人。",
        "In 2016, Facebook's 1.6 billion users were, on average, three and a half people apart.", t + GAP)
A["fade_2022"] = (t, t + 1.2)
# ======================= 5  2022 · 你可能认识的人
c = t + 1.2
A["chap_2022"] = c
t = sub("S31", "领英在两千万人身上试了五年，按共同好友算——",
        "LinkedIn ran the test on twenty million people for five years. Counted by mutual friends —", c + 0.5)
# 用户 2026-10-12：「不是最弱的线，是稍强一点的」会被听成强关系，和下一句「接住你的，常常是强关系」撞在一起。
# 改成直接说是哪一种人（事实核查 #19：按共同好友算，倒 U 的峰约在 10 个共同好友），再补一句「不算熟，也不算生」
t = sub("S32", "最能帮人换工作的，是有十来个共同好友的人。",
        "the people most likely to lead to a new job were those with about ten friends in common.", t + GAP)
S32_0 = A["S32"][0]
t = sub("S32b", "不算熟，也不算生。", "Not close friends. Not strangers either.", t + GAP)
# 画面（故事时间）的 2022 前半段：峰顶 230.6 之前和字幕一比一；峰顶之后到 S32b 结束，故事时间放慢（多出来的 4.3 秒都给这一段）
# shu / sheng / mid：S32b 里「熟」「生」两端和中间那根琥珀线依次亮一下（真实时间，s2022.ts / Overlays.tsx 直接用）
A["k2022"] = {"peak": r1(S32_0 + 3.6), "hold_end": t,
              "shu": r1(A["S32b"][0] + 0.25), "sheng": r1(A["S32b"][0] + 1.05), "mid": r1(A["S32b"][0] + 1.9)}
t = sub("S33", "可你跌倒的时候，接住你的，常常是强关系。", "But when you fall, it is often the strong ties that catch you.", t + GAP)
t = sub("S34", "远方的线带来消息，身边的网接住你。", "Distant ties bring you news. The ones nearby catch you.", t + GAP)
A["fade_2026"] = (t, t + 1.2)
# ======================= 6  2026 · 你这里
c = t + 1.2
A["chap_2026b"] = c
t = sub("S35", "你认识的人里，有几个是一年最多见一次的？", "Of everyone you know, how many do you see once a year or less?", c + 0.5)
A["blank3"] = (t, t + 5.8)
A["lines24"] = (t + 0.4, t + 5.4)
t = sub("S36", "改变你的，常常是你不太熟的人。", "The people who change you are often the ones you barely know.", t + 5.8)
A["claude"] = {"star": t + 0.2, "depart": t + 0.9, "land": t + 3.2, "label": (t + 0.2, t + 4.2)}
t = sub("S37", "对某个人来说，你就是那个不太熟的人。", "And to someone out there, you are the one they barely know.", t + 4.6)
s37 = A["S37"][0]
A["final_letter"] = {"depart": s37 + 1.3, "arrive": s37 + 3.6, "label": (s37 + 3.6, s37 + 5.4)}
E = t + 0.3
A["title2"] = {"start": E, "fly": (E, E + 2.2), "bridge": (E + 1.4, E + 2.6), "land": E + 2.6, "bell": E + 2.8,
               "sub_in": E + 3.0, "en_in": E + 3.5, "endmark": None, "fade": None, "card_out": None}
DUR = round(E + 10.0, 1)  # 审片：片名卡（星座、清晰大字、金色小字、英文）一起留到 DUR-2.9，再一起淡出
A["title2"]["card_out"] = (DUR - 2.9, DUR - 2.1)
A["title2"]["endmark"] = DUR - 2.3  # 署名在片名卡淡出后单独出现（同屏汉字 ≤ 20）
A["title2"]["fade"] = (DUR - 1.2, DUR)
A["DUR"] = DUR



def build_cue():
    S = {k: v for k, v in A.items() if k.startswith("S")}
    T1, ar1, ar2 = A["title1"], A["hops1"][-1], A["hops2"][-1]
    sec = lambda t0, t1, chords, piano, layers, inten, **kw: dict(t0=r1(t0), t1=r1(t1), chords=chords, piano=piano,
                                                                    layers=layers, intensity=inten, **kw)
    # 审片（声音，第二轮）：
    # · 混音改成「先限幅、再两遍 loudnorm（真正走 linear）」，linear 不会再替我们抬安静段，所以安静段在这里抬：
    #   A 0.66→0.9、B 0.55→0.75、C/D→0.85、F 0.68→0.8、H 0.58→0.75、O 0.66→0.75（都相对第二版）。
    # · 反转要落得下来：K 段（蓄力）0.82→0.62、脉冲 0.35→0.2、钢琴 0.75→0.55；L 段低音 1.0→0.6，能量放到中频。
    # · 片名段 0.85→0.95，保证片名落定仍是全片最响的时刻之一；片尾 P 段 1.05、pad_bright 0.6→0.45（让片尾的铃露出来）。
    # · 低频偏重：各段 low 再降一点，混音链里另加 120 Hz −4 dB / 2.5 kHz +2 dB 的 EQ（见 自检记录）。
    secs = [
        sec(0.0, S["S3"][1], ["Imaj7", "II"], "sparse", {"piano": 0.75, "pad": 0.55, "low": 0.25}, 1.05, density=0.55, pad_attack=1.2),
        sec(S["S3"][1], A["hops1"][0], ["vi"], "sparse", {"piano": 0.45, "pad": 0.6, "low": 0.15}, 0.9, density=0.25),
        sec(A["hops1"][0], ar1 + 1.0, ["Imaj7"], "motif", {"piano": 0.9, "pad": 0.45, "low": 0.25}, 0.95),
        sec(ar1 + 1.0, T1["dim"], ["vi", "II"], "arp", {"piano": 0.6, "pad": 0.55, "low": 0.3}, 0.95),
        sec(T1["dim"], A["chap_1929"], ["Iadd9", "II"], "chordal", {"piano": 0.75, "pad": 0.9, "low": 0.55}, 0.95, pad_bright=0.5),
        sec(A["chap_1929"], A["chap_1967"], ["iii", "vi", "II", "V"], "sparse", {"piano": 0.75, "pad": 0.6, "low": 0.3}, 0.8,
            bars_per_chord=1, density=0.6),
        sec(A["chap_1967"], A["chap_1973"], ["Imaj7", "vi", "II", "V"], "arp", {"piano": 0.65, "pad": 0.55, "low": 0.35, "pulse": 0.12}, 0.78),
        # 1:43 提问 + 留白：原来是全片最安静的一段（比 I 低 6.6 LU），抬起来、钢琴别断
        sec(A["chap_1973"], S["S15"][0], ["vi", "iii"], "sparse", {"piano": 0.6, "pad": 0.65, "low": 0.2}, 0.85, density=0.45),
        sec(S["S15"][0], A["chap_1998"], ["vi", "iii", "II", "Imaj7"], "arp", {"piano": 0.7, "pad": 0.6, "low": 0.4}, 0.78),
        sec(A["chap_1998"], S["S22"][0], ["Imaj7", "II", "vi", "V"], "arp", {"piano": 0.7, "pad": 0.6, "low": 0.45, "pulse": 0.15}, 0.8,
            bars_per_chord=1),
        # K：蓄力段压下去，让高潮有台阶可上（目标：铺垫比落地低 6 LU 以上）
        sec(S["S22"][0], A["hops2"][0], ["vi", "V", "II", "II7"], "arp16", {"piano": 0.55, "pad": 0.7, "low": 0.5, "pulse": 0.2}, 0.62,
            bars_per_chord=1, pad_bright=0.45),
        # L：动机满编，低音 0.6（能量放在中频，手机外放听得见）
        sec(A["hops2"][0], A["flood"][0] - 0.04, ["Imaj7"], "motif", {"piano": 1.0, "pad": 1.0, "low": 0.6, "pulse": 0.45}, 1.15,
            bars_per_chord=4, pad_bright=0.65),
        # 洪水那 2.6 秒：弦收到 0.6、脉冲停，让一层一个的钢琴音爬得出来
        sec(A["flood"][0] - 0.04, A["cut"], ["Imaj7"], "sparse", {"piano": 1.0, "pad": 0.6, "low": 0.6}, 1.15, density=0.0, pad_bright=0.65,
            pad_attack=0.6),
        sec(A["silence"][1], S["S28a"][0], ["Imaj7", "II", "vi", "V"], "sparse", {"piano": 0.75, "pad": 0.65, "low": 0.35}, 0.8, density=0.6),
        sec(S["S28a"][0], A["chap_2022"], ["Imaj7", "II", "vi", "V"], "arp", {"piano": 0.7, "pad": 0.6, "low": 0.35}, 0.8),
        sec(A["chap_2022"], A["chap_2026b"], ["vi", "iii", "II", "Imaj7"], "chordal", {"piano": 0.7, "pad": 0.7, "low": 0.4}, 0.8),
        sec(A["chap_2026b"], S["S36"][0], ["vi", "II"], "sparse", {"piano": 0.5, "pad": 0.7, "low": 0.3}, 0.75, density=0.35),
        sec(S["S36"][0], DUR, ["Imaj7", "II", "vi", "Iadd9"], "arp", {"piano": 0.95, "pad": 0.85, "low": 0.55}, 1.05, pad_bright=0.45),
    ]
    # 洪水九个音整体高一个八度（F5 → F7），不再埋在弦乐的 A4 里
    flood_midi = [77, 81, 84, 88, 91, 95, 96, 100, 101]
    # 「叮」原来是 C8（4186 Hz），FM 边带到 10–15 kHz，又薄又刺；换成同一个 FM 铃低一个八度（C7），幅度相当
    BELL_AS_DING = 0.55
    you_on = 1.8 * S["S3"][0] / 13.8  # 画面「你」亮起：故事时间 1.8，开头 0–13.8 按比例压缩
    hits = [
        {"type": "note", "t": r1(you_on), "midi": 77, "len": 1.6, "gain": 0.6, "_why": "「你」亮起（钢琴音，不算点位音效）"},
        {"type": "bell", "t": r1(ar1), "deg": 4, "gain": BELL_AS_DING, "_why": "开头：信到陌生人（第一次，最轻）"},
        # boom 是全片的峰值来源（< 60 Hz，手机放不出来），它决定了整体的峰值/响度比；压到 0.6，混音才能走 linear
        {"type": "boom", "t": r1(T1["land"]), "len": 5, "gain": 0.6, "_why": "片名星座「弱关系」落定"},
        {"type": "bell", "t": r1(T1["bell"]), "deg": 0, "gain": 1.2, "_why": "片名落定"},
        {"type": "bell", "t": r1(A["ding_milgram"]), "deg": 2, "gain": BELL_AS_DING, "_why": "米尔格拉姆：64 封到达"},
    ] + [
        # G5 / B5 / D6：不在这时的 iii 和弦（A C E）里，不被弦乐盖住
        {"type": "note", "t": tt, "midi": m, "len": 1.4, "gain": 0.85, "_why": f"留白里光点经过第 {k + 1} 颗银点（钢琴音，不算点位音效）"}
        for k, (tt, m) in enumerate(zip(A["pings"], [79, 83, 86]))
    ] + [
        {"type": "bell", "t": r1(A["ding_name"]), "deg": 4, "gain": 0.85, "_why": "格兰诺维特：命名「弱关系的力量」"},
        # 审片：riser 顶点后一秒什么都没发生 → 收在动机第一个音上，短一点、轻一点
        {"type": "riser", "t": r1(A["hops2"][0]), "len": 4, "gain": 0.6, "_why": "195 根远线长满、信出发，蓄力收在第一个动机音上"},
        {"type": "boom", "t": r1(ar2), "len": 4, "gain": 0.7, "_why": "大反转：一百步塌成五步，路到陌生人"},
        {"type": "bell", "t": r1(ar2), "deg": 4, "gain": 1.1, "_why": "和开头那一声同音高（第二次，要比第一次响）"},
        {"type": "note", "t": r1(ar2), "midi": 65, "len": 2.4, "gain": 1.0, "_why": "落地：中频的钢琴八度（F4 + F6，不和洪水第一个音 F5 撞），手机外放听得见"},
        {"type": "note", "t": r1(ar2), "midi": 89, "len": 2.4, "gain": 1.0, "_why": "落地：中频的钢琴八度，手机外放听得见"},
    ] + [
        {"type": "note", "t": tt, "midi": m, "len": 1.6, "gain": round(1.2 if k < 4 else 0.95 + 0.04 * k, 2), "_why": f"洪水第 {k + 1} 层（钢琴音，不算点位音效）"}
        for k, (tt, m) in enumerate(zip(A["flood"], flood_midi))
    ] + [
        {"type": "bell", "t": r1(A["claude"]["land"]), "deg": 4, "_why": "CLAUDE 寄来的信落进「你」"},
        {"type": "bell", "t": r1(A["final_letter"]["arrive"]), "deg": 4, "gain": 1.15,
         "_why": "你寄出的信到了开头那个陌生人（第三次同一声；结尾段最响，这一声要再大一点才听得见）"},
        {"type": "boom", "t": r1(A["title2"]["land"]), "len": 6, "gain": 0.6, "_why": "片尾片名星座落定"},
        {"type": "bell", "t": r1(A["title2"]["bell"]), "deg": 2, "gain": 2.0, "_why": "片尾片名落定（F6 被 P 段弦乐的 F 泛音盖住 → 换成 A6、加大）"},
    ]
    return {"dur": DUR, "key": "F", "mode": "lydian", "bpm": 72, "seed": 1973, "rt60": 4.2, "ramp": 1.5,
            "fade_in": 0.3, "fade_out": 4.0, "motif": [[0, 1], [2, 1], [None, 1], [7, 1], [6, 1], [7, 2]],
            "sections": secs, "hits": hits, "silences": [list(A["silence"])]}


def dump_cue(c):
    lines = ["{"]
    head = {k: v for k, v in c.items() if k not in ("sections", "hits", "silences", "motif")}
    lines.append(" " + json.dumps(head, ensure_ascii=False)[1:-1] + ",")
    lines.append(' "motif": ' + json.dumps(c["motif"]) + ",")
    lines.append(' "sections": [')
    lines.append(",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in c["sections"]))
    lines.append(" ],")
    lines.append(' "hits": [')
    lines.append(",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in c["hits"]))
    lines.append(" ],")
    lines.append(' "silences": ' + json.dumps(c["silences"]))
    lines.append("}")
    return "\n".join(lines) + "\n"

# ======================= 输出
out_subs = [{"t0": s["t0"], "t1": s["t1"], "zh": s["zh"], "en": s["en"]} for s in subs]


def mmss(x):
    m = int(x // 60)
    return f"{m}:{x - 60 * m:04.1f}"


if __name__ == "__main__":
    for i, s in enumerate(subs):
        nxt = subs[i + 1]["t0"] if i + 1 < len(subs) else None
        gap = (nxt - s["t1"]) if nxt else 0
        print(f"#{i + 1:02d} {s['key']:5s} {mmss(s['t0'])}-{mmss(s['t1'])} ({s['t0']:.2f}-{s['t1']:.2f}) "
              f"d={s['t1'] - s['t0']:.1f} need={need(s['zh']):.2f} n={nchars(s['zh'])} gap={gap:.2f} {s['zh']}")
    tot = sum(nchars(s["zh"]) for s in subs)
    durs = [s["t1"] - s["t0"] for s in subs]
    print("subs", len(subs), "avg chars", round(tot / len(subs), 1), "avg dur", round(sum(durs) / len(durs), 2),
          "min dur", min(durs), "max dur", round(max(durs), 2), "chars/min", round(tot / (DUR / 60), 1), "DUR", DUR, mmss(DUR))
    print(json.dumps({k: v for k, v in A.items() if not k.startswith("S")}, ensure_ascii=False, default=lambda o: o))
    if len(sys.argv) > 1 and sys.argv[1] == "write":
        with open(r"D:/desk/claudex/24/video-engine/public/v4/ties/subs.json", "w", encoding="utf-8") as f:
            f.write("[\n" + ",\n".join(json.dumps(s, ensure_ascii=False) for s in out_subs) + "\n]\n")
        print("wrote subs.json")
        with open(r"D:/desk/claudex/24/video-engine/public/v4/ties/cue.json", "w", encoding="utf-8") as f:
            f.write(dump_cue(build_cue()))
        print("wrote cue.json")
    with open(Path(__file__).with_name("ties_anchors.json"), "w", encoding="utf-8") as f:
        def rnd(o):
            if isinstance(o, float):
                return round(o, 2)
            if isinstance(o, dict):
                return {k: rnd(v) for k, v in o.items()}
            if isinstance(o, (list, tuple)):
                return [rnd(v) for v in o]
            return o
        json.dump(rnd(A), f, ensure_ascii=False, indent=1)
