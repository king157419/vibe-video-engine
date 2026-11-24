# -*- coding: utf-8 -*-
"""赫布 hebb（第二稿，按三位审稿意见修改）：字幕、配乐表、事件表的唯一来源 + 规则自检。

用法（用 D:\\conda\\envs\\d2l\\python.exe 运行）：
  python subs_timeline.py                 只打印自检结果和字幕表
  python subs_timeline.py <subs.json>      另外写出 subs.json（兼容第一稿用法）
  python subs_timeline.py --out <目录>     写出 <目录>/subs.json、cue.json、timeline_meta.json

规则（CONTRACT §0.5、类型语法 B11）：
  - 每句在屏 >= 字数/4 + 1.5 s，且 >= 4 s，<= 8 s（字数 = 汉字 + 数字字母）；
  - 句间空 0.6–1.2 s；问句之后留 2–8 s；
  - 其余更长的空白必须是写明理由的「拍」（beat），自检会逐条列出。
改字幕、改时间，只改这个文件，再重新生成；不要手改 json。
"""
import json, re, sys, os

def n_chars(s):
    return len(re.findall(r'[一-鿿]|[A-Za-z0-9]', s))

def min_dur(s):
    return max(4.0, n_chars(s) / 4 + 1.5)

GAP = 0.8
P = []
def at(t): P.append(('at', t))
def beat(d, note): P.append(('beat', d, note))          # 额外空白（不含 GAP），写明理由
def ch(num, zh, en): P.append(('ch', num, zh, en))
def sub(key, zh, en, pad=0.3): P.append(('sub', key, zh, en, pad))
def mark(name): P.append(('mark', name))

# ================= 序（无章节标签）
# 叮 1–5：1.8 起，每 2.0 s 一声；前四声 0.6 s 后金光，第五声什么都没有
at(2.6)
sub('s_rule', '叮一声，亮一下。', 'A chime. Then a light.', 0.0)
at(11.2)                                                  # 叮5 在 9.8，光该来却没来的时刻是 10.4
sub('s_wait', '刚才那一声，你是不是在等一个光点？', 'That last chime \u2014 weren\u2019t you waiting for the light?', 0.3)
beat(2.5 - GAP, '问句之后留白 2.5 s')
sub('s_brain', '光没有来。是你的脑子，替它亮了一下。', 'The light never came. Your brain lit it for you.', 0.3)
mark('prologue_last_sub_end')
beat(7.8, '叮6 → 光 → 光点连成片名 → 片名卡 → 分成两个神经元（无字幕）')
# ================= I 连
ch('I', '连', 'WIRE')
sub('s_four', '没人教过你。第五声之前，叮和光只一起来过四次。', 'Nobody taught you. Chime and light had met just four times before the fifth.', 0.2)
sub('s_fifth', '第五次，只有声音。可那根线，已经通了。', 'The fifth time, only the sound. But the wire was already connected.', 0.2)
sub('s_pavlov', '巴甫洛夫的狗，也是这样学会等的。', 'Pavlov\u2019s dogs learned to wait in much the same way.', 0.2)
sub('s_hebb', '1949年，赫布提出一个猜想：', 'In 1949, the psychologist Donald Hebb put forward a guess:', 0.3)
sub('s_hebb2', '一个细胞，若一次次帮着点亮另一个，', 'when one cell, again and again, helps another to fire,', 0.2)
sub('s_hebb3', '它们之间会长出点什么，下一次更容易。', 'something grows between them, and the next time is easier.', 0.2)
beat(0.7, '金线先同步脉动 1.5 s，口号单独上屏')
sub('s_slogan', '一起亮起的，会连在一起。', 'Cells that fire together, wire together.', 0.5)
# ================= II 痕
beat(1.0, '章间暗场')
ch('II', '痕', 'TRACE')
sub('s_oslo', '1966年，奥斯陆，兔子脑中，连接真的变强了。', '1966, Oslo: in a rabbit\u2019s brain, a connection really did grow stronger.', 0.2)
sub('s_burst', '电极先猛敲一阵，再轻轻一碰：另一头答得更响了。', 'A rapid burst from the electrode, then the same light touch \u2014 and the far side answered louder.', 0.3)
beat(2.2, '证物入画：论文卡 BLISS & L\u00d8MO \u00b7 J. PHYSIOL. \u00b7 1973（无字幕，约 3 s）')
sub('s_tenh', '麻醉的兔子脑中，它最长留了十个小时。', 'In anaesthetised rabbits, it lasted up to ten hours.', 0.3)
beat(0.8, '10 h 处的金点停住（无字幕，1.6 s）')
sub('s_year', '在大鼠脑中，它能留整整一年。', 'In rats, it has been seen to last a full year.', 0.3)
# ================= III 路
beat(1.0, '章间暗场')
ch('III', '路', 'PATHS')
sub('s_song', '一首歌，和那年夏天的人，一起亮过很多次。', 'A song and someone from that summer lit up together, again and again.', 0.2)
sub('s_intro', '如今前奏一响，那个人就回来了。', 'Now, a few notes in, and they\u2019re back.', 0.4)
sub('s_cab', '伦敦的出租车司机，要花三四年，背下两万五千条街。', 'London cabbies spend three or four years learning twenty-five thousand streets.', 0.2)
sub('s_2000', '2000年的扫描里，司机管认路的海马体，后部更大。', 'In 2000, scans found the back of the hippocampus \u2014 the brain\u2019s wayfinder \u2014 larger in cabbies.', 0.2)
sub('s_2011', '2011年，有人跟着79个学徒，从入行跟到考完。', 'In 2011, researchers followed 79 trainees from day one to the final test.', 0.1)
sub('s_passed', '考上的人，那一块长了；没考上的，没有。', 'In those who passed, it grew. In those who failed, it did not.', 0.3)
mark('zoom_start')
beat(2.2, '镜头拉远到 860 亿：奇观先走 3 s，不放字幕')
sub('s_86b', '你的脑子里，约有860亿个神经元。', 'Your brain holds some 86 billion neurons.', 0.3)
sub('s_count', '一秒数一个，要数两千七百多年。', 'Counting one a second would take over 2,700 years.', 0.3)
sub('s_paths', '你会的每件事，都是其中一条走熟的路。', 'Everything you can do is one of these paths, worn smooth by walking.', 0.3)
# ================= IV 剪
beat(1.0, '章间暗场')
ch('IV', '剪', 'PRUNING')
sub('s_more', '线越连越多，好像永远不会停。', 'More and more wires, as if it would never stop.', 0.2)
sub('s_densest', '可你脑子里连线最密的时候，早就过去了。', 'But the densest wiring you will ever have is already behind you.', 0.2)
sub('s_two', '两三岁时，你额叶的突触，比成年后还密一半。', 'At two or three, the synapses in your frontal cortex were about 50% denser than in adulthood.', 0.3)
mark('climax_end')
beat(3.0 - GAP, '硬静音 1.5 s，接着修剪的光先扫 1.5 s，不放字幕')
sub('s_prune', '接下来十几二十年，大脑一边长，一边剪。', 'For the next decade or two, the brain grows \u2014 and prunes.', 0.3)
beat(0.6, '灰烬落下，只看剪剩的路网（共 1.4 s 空）')
sub('s_road', '用不上的被拆掉，用得多的留下来，成了路。', 'What goes unused is taken down. What gets used stays, and becomes a road.', 0.3)
beat(1.0, '1 s 暗场：和修剪段隔开，r/l 是新起的一幕，不是修剪的结果')
sub('s_rl1', '半岁多时，美国和日本婴儿分辨 r 和 l，一样好。', 'At six to eight months, American and Japanese babies tell r from l equally well.', 0.2)
sub('s_rl2', '到一岁，美国婴儿越听越准，日本婴儿越来越难。', 'By their first birthday, the American babies hear it more sharply; the Japanese babies, less and less.', 0.3)
# ================= V 望
beat(1.0, '章间暗场')
ch('V', '望', 'HOPE')
sub('s_dog', '这条规则不分好坏：爱听的歌，怕过的狗，它都留着。', 'The rule doesn\u2019t judge: a song you love, a dog you feared \u2014 it keeps them both.', 0.3)
sub('s_limit', '赫布定律只说了连接怎么变，没说你该变成谁。', 'Hebb\u2019s rule tells how connections change \u2014 not who you should become.', 0.2)
sub('s_luxun', '1921年，鲁迅在《故乡》的结尾写道：', 'In 1921, at the close of \u201cMy Old Home\u201d, Lu Xun wrote:', 0.6)
sub('s_hope', '他写的不是大脑，是希望：路，还能再走出一条。', 'He wasn\u2019t writing about brains, but about hope: another road can still be walked.', 0.4)
# ================= VI 成
beat(1.0, '章间暗场（光标下的线变成小路，草地淡入）')
ch('VI', '成', 'BECOMING')
sub('s_switch', '你闭着眼，也摸得到家里的电灯开关。', 'Eyes closed, you can still find the light switch at home.', 0.3)
sub('s_hand', '那条路，你的手走过几千遍。', 'Your hand has walked that road thousands of times.', 0.3)
# 用户 2026-10-12：「草」→「荒草」。多一个字，最短在屏 4.75 → 5.0 s；pad 0.6 → 0.3，在屏仍是 5.3 s，VI 章的画面时间一帧不动
sub('s_grass', '走过的，成了路；没走的，长回了荒草。', 'What you walked became a road. What you didn\u2019t grew back into wild grass.', 0.3)
mark('ring_back')
# 用户 2026-10-12：片尾「等光」没成立（离上一次配对四分钟，联想已经淡了）。回到片头构图后先重新配对三次
# （同样 2.0 s 一声、同一个叮、同一种光，只是光更大更亮），第四声才不来光。比原来多 3 × 2.0 = 6.0 s
CODA_PAIRS = 3
beat(5.0 + 2.0 * CODA_PAIRS - GAP, '回环：暗场 → 片头构图 → 三次配对（叮 + 更大更亮的光，节奏同片头）→ 最后一声，光不来，等（场景 3 s，播放时间按 TIME_MAP ③ 压成 2 s）')
sub('s_still', '四分钟了，你还在等那道光。', 'Four minutes on, you\u2019re still waiting for the light.', 0.6)
mark('end_title')

# ---------------------------------------------------------------- 生成字幕
def build():
    t = 0.0
    subs, marks, chapters, beats = [], {}, [], []
    pending = None          # None = 下一句前加 GAP；0 = 不加
    beat_before = None
    for it in P:
        k = it[0]
        if k == 'at':
            t = it[1]; pending = 0; beat_before = ('at', '绝对时间定位')
        elif k == 'beat':
            t += it[1]; beat_before = ('beat', it[2]); beats.append((round(t, 2), it[1], it[2]))
        elif k == 'mark':
            marks[it[1]] = round(t, 2)
        elif k == 'ch':
            chapters.append({'t': round(t, 2), 'num': it[1], 'zh': it[2], 'en': it[3]})
            t += 0.2; pending = 0
        elif k == 'sub':
            key, zh, en, pad = it[1:]
            if pending is None:
                t += GAP
            pending = None
            d = round(min_dur(zh) + pad, 1)
            t0 = round(t, 1); t1 = round(t0 + d, 1)
            subs.append({'key': key, 't0': t0, 't1': t1, 'zh': zh, 'en': en, 'why_gap': beat_before})
            beat_before = None
            t = t1
    return subs, marks, chapters

subs, marks, chapters = build()
S = {s['key']: s for s in subs}
CH = {c['num']: c['t'] for c in chapters}
r2 = lambda x: round(x + 1e-9, 2)

# ---------------------------------------------------------------- 场景时间 → 播放时间（审片修改，2026-10-08，第二轮）
# 下面所有锚点（meta）都是「场景时间」τ：和第二稿完全一样，画面代码不用改。
# 播放时间 t 由 TIME_MAP 分段线性映射得到：
#   ① 序整体提前 1.3 s（第 0 帧 A 就亮着、pad 就在响，叮1 在 0.5 s，第一道光 1.1 s）；
#   ② 问句之后的留白 2.5 → 2.0 s（这 2.5 s 场景时间在 2.0 s 播放时间里走完，只有 A 在呼吸）；
#   ③ 片尾最后一声叮之后的「等」3.0 → 2.0 s（它的环和闪光走完之后，到 #38 之前的 2.2 s 场景时间在 1.2 s 里走完；
#      这一段只有 A，A 的呼吸按播放时间算，所以看不出快放）；
#   之后全部提前 2.8 s。subs.json / cue.json 写播放时间；timeline_meta.json 写场景时间 + time_map。
# 平移量 1.3 / 1.8 / 2.8 s 都是整帧（39 / 54 / 84 帧），所以每个锚点仍落在原来那一帧的画面上。
PRO_SHIFT = 1.3
GAP_CUT = 0.5
CODA_CUT = 1.0
TIME_MAP = [  # [场景时间, 播放时间]；片尾的两个点在算出最后一声叮之后补上
    [PRO_SHIFT, 0.0],
    [S['s_wait']['t1'], r2(S['s_wait']['t1'] - PRO_SHIFT)],
    [S['s_brain']['t0'], r2(S['s_brain']['t0'] - PRO_SHIFT - GAP_CUT)],
               ]
def real(tau):
    """场景时间 → 播放时间（分段线性；首尾外推斜率 1）"""
    m = TIME_MAP
    if tau <= m[0][0]:
        return r2(max(0.0, tau - m[0][0] + m[0][1]))
    for (a, ra), (b, rb) in zip(m, m[1:]):
        if tau <= b:
            return r2(ra + (tau - a) * (rb - ra) / (b - a))
    return r2(tau - m[-1][0] + m[-1][1])

# ---------------------------------------------------------------- 事件表（画面锚点）
dings = [1.8, 3.8, 5.8, 7.8, 9.8]
lights = [d + 0.6 for d in dings[:4]]
ding6 = r2(S['s_brain']['t1'] + 0.6)
burst = r2(ding6 + 0.6)
I0 = CH['I']
# 片尾：回到片头构图后，叮在 ring_back + 1.4 起每 2.0 s 一声（和片头同一个节奏），前三声 0.6 s 后来光，最后一声不来
coda_dings = [r2(marks['ring_back'] + 1.4 + 2.0 * i) for i in range(CODA_PAIRS)]
coda_lights = [r2(d + 0.6) for d in coda_dings]
ding7 = r2(marks['ring_back'] + 1.4 + 2.0 * CODA_PAIRS)       # 最后一声（全片第 10 声）
end_t = r2(S['s_still']['t1'] + 5.4)
dur = end_t                       # 场景时间的片长
CODA_A = r2(ding7 + 1.4)          # 最后一声叮的声波环、闪光都走完了
CODA_B = S['s_still']['t0']
TIME_MAP.append([CODA_A, real(CODA_A)])
TIME_MAP.append([CODA_B, r2(real(CODA_B) - CODA_CUT)])
dur_real = r2(dur - PRO_SHIFT - GAP_CUT - CODA_CUT)   # 播放时间的片长（成片长度）
TIME_MAP.append([dur, dur_real])

YEAR_H = 365.25 * 24                     # 一年 = 8766 小时
AXIS_W = 1400                            # II 章时间轴宽度（px）
NEURONS = 86e9
SEC_PER_YEAR = 365.25 * 86400
count_years = NEURONS / SEC_PER_YEAR     # 一秒数一个要数多少年
kuhl = {'us_6to8m': 63.7, 'us_10to12m': 73.8, 'jp_6to8m': 64.7, 'jp_10to12m': 59.9}
def rl_gap(p, p0, base=192.0):          # r/l 字母间距 ∝ 高于随机（50%）的部分；起点两组都画 192 px（审片：字母 64 → 104 px，间距同比 ×1.6）
    return base * (p - 50.0) / (p0 - 50.0)
switch_uses = 4 * 365 * 3                # 「几千遍」的估算：每天开关约 4 次 × 3 年

meta = {
    '_note': 'hebb 制作用事件表（第二稿），由 4_第四版资料/hebb/tools/subs_timeline.py 生成，和 剧本.md、subs.json、cue.json 一致。时间单位：秒。',
    'dur': dur_real, 'dur_scene': dur, 'fps': 30,
    'time_map': TIME_MAP,
    '_time_note': 'meta 里的时间都是场景时间 τ；播放时间 t = time_map 分段线性映射（[场景, 播放]）。subs.json、cue.json 已是播放时间。',
    'palette': {
        'leaf': '#9fe3a6', 'leafDeep': '#4f8f68', 'chimeRing': '#a6ecd2',
        'gold': '#f0d28c', 'goldCore': '#fff7d6', 'amber': '#c08a3e',
        'ice_fear_only_in_V': '#a9c8ff', 'ash': '#5b6168',
        '_rule': '萤绿 = 线索 / 声音 / 还没加强的连接 / 草；金 = 被点亮 / 被加强 / 路；冰蓝只在 V 章「怕」那一组；灰烬只在修剪。不用青色、不用粉红。'},
    'coords': {'A_prologue': [535, 430], 'B_prologue': [1385, 430], 'A_neuron': [700, 430], 'B_neuron': [1220, 430]},
    'dings': [{'t': d, 'frame': round(d * 30), 'light': r2(d + 0.6), 'light_frame': round((d + 0.6) * 30), 'use': f'配对 {i + 1}'} for i, d in enumerate(dings[:4])]
             + [{'t': dings[4], 'frame': round(dings[4] * 30), 'light': None, 'use': '测试：只有声音，光不来'},
                {'t': ding6, 'frame': round(ding6 * 30), 'light': burst, 'light_frame': round(burst * 30), 'use': '第 6 次配对：光真的来了，并且连成片名'},
               ]
             + [{'t': d, 'frame': round(d * 30), 'light': l, 'light_frame': round(l * 30), 'use': f'片尾重新配对 {i + 1}：同样的叮，光更大更亮'} for i, (d, l) in enumerate(zip(coda_dings, coda_lights))]
             + [{'t': ding7, 'frame': round(ding7 * 30), 'light': None, 'use': '回环：最后一声，光不来'}],
    'prologue': {
        'A_appear': [PRO_SHIFT, PRO_SHIFT],   # 审片：第 0 帧 A 就亮着（k 0.8），不从黑场淡入
        'B_must_be_dark': [r2(dings[4] + 0.6), r2(S['s_brain']['t0'] + 2.1)],
        'ghost_flash': [r2(S['s_brain']['t0'] + 2.1), r2(S['s_brain']['t0'] + 2.95)],   # 审片：0.6 → 0.85 s，金色、更亮
        'thread_grow': [r2(S['s_brain']['t1'] - 2.0), S['s_brain']['t1']],
        'ding6': ding6, 'burst': burst,
        'nodes_settle': [burst, r2(burst + 0.6)],
        'wiring': [r2(burst + 0.6), r2(burst + 2.2)],
        'wiring_rule': '节点 = useTextPoints("赫布", 92, 400, step=9, FONT_ZH, tracking=0.48)；边 = 距离 <= 13 px 的邻点对，按 x 排序；'
                       '第 i 条边（共 E 条）在 wiring[0] + 1.4*sqrt(i/E) 秒开始，两端同时一闪，0.2 s 内用 line()+partial() 长满（越连越快）',
        'title_card_hold': [r2(burst + 2.2), r2(I0 - 1.6)],
        'split_to_neurons': [r2(I0 - 1.6), r2(I0 - 0.4)]},
    'title_card': {'title': '赫 布', 'sub': '赫布定律 \u00b7 唐纳德\u00b7赫布 \u00b7 1949', 'en': "HEBB'S RULE"},
    'chapters': chapters,
    'I': {
        'replay_A': [r2(I0 + 0.8 + 0.8 * i) for i in range(4)], 'replay_B_delay': 0.2,
        'fifth_A_alone': r2(S['s_fifth']['t0'] + 0.4), 'fifth_B_ghost': r2(S['s_fifth']['t0'] + 1.2),
        'pavlov_rings': [r2(S['s_pavlov']['t0'] + 0.2 + 1.8 * i) for i in range(3)],
        'synapse_fires': [r2(S['s_hebb2']['t0'] + 0.2 + 2.0 * i) for i in range(3)],
        'synapse_label': [r2(S['s_hebb2']['t0'] + 0.6), S['s_hebb2']['t1']],
        'growth_fires': [r2(S['s_hebb3']['t0'] + 0.5 + 2.0 * i) for i in range(3)],
        'slogan_gold_pulse_no_sub': [r2(S['s_slogan']['t0'] - 1.5), S['s_slogan']['t0']],
        'slogan_sync_fires': [r2(S['s_slogan']['t0'] + 0.4 + 1.6 * i) for i in range(3)]},
    'II': {
        'taps_from': r2(S['s_oslo']['t0'] + 1.1), 'tap_every': 0.9,
        'burst': [r2(S['s_burst']['t0'] + 1.8), r2(S['s_burst']['t0'] + 2.6)],
        'peak_base_px': 90, 'peak_multiplier_illustrative': 1.8, 'peak_after_px': r2(90 * 1.8),   # 审片：峰放大到 90 / 162 px
        'paper_card': [r2(S['s_burst']['t1'] + 0.3), r2(S['s_tenh']['t0'] - 0.1)],
        'hour_ticks': [r2(S['s_tenh']['t0'] + 0.3), r2(S['s_tenh']['t0'] + 1.5), r2(S['s_tenh']['t0'] + 2.7)],
        'ten_h_dot_hold': [r2(S['s_tenh']['t0'] + 2.7), S['s_year']['t0']],
        'year_zoom_out': [r2(S['s_year']['t0'] + 0.1), r2(S['s_year']['t0'] + 3.1)],   # 审片：缩放拉长到 3 s
        'ten_h_flash': r2(S['s_year']['t0'] + 3.3),
        'hours_per_year': YEAR_H, 'axis_w_px': AXIS_W, 'ten_h_px_on_year_axis': round(10 / YEAR_H * AXIS_W, 2)},
    'III': {
        'prelude_pad_only': [r2(S['s_intro']['t0'] - 0.2), r2(S['s_intro']['t0'] + 1.6)],
        'prelude_note_E': r2(S['s_intro']['t0'] + 0.6), 'prelude_note_D': r2(S['s_intro']['t0'] + 1.1),
        'person_returns': r2(S['s_intro']['t0'] + 1.6),
        'street_net_grow': [r2(S['s_cab']['t0'] - 0.4), r2(S['s_cab']['t0'] + 1.4)],
        'net_to_hippocampus': [r2(S['s_2000']['t0'] - 0.4), r2(S['s_2000']['t0'] + 1.2)],
        'passed_glow': [r2(S['s_passed']['t0']), r2(S['s_passed']['t0'] + 3.7)],
        'zoom_out': [marks['zoom_start'], r2(marks['zoom_start'] + 3.0)],
        'readout_86b': [r2(S['s_86b']['t0'] + 0.2), S['s_86b']['t1']],
        'readout_years': [r2(S['s_count']['t0'] + 0.3), S['s_count']['t1']],
        'count_years_exact': round(count_years, 1),
        'roads_lit': [r2(S['s_paths']['t0'] + 0.3 + 0.8 * i) for i in range(6)]},
    'IV': {
        'tangle_grow': [S['s_more']['t0'], marks['climax_end']],
        'climax_peak': [S['s_two']['t0'], marks['climax_end']],
        'silence': [marks['climax_end'], r2(marks['climax_end'] + 1.5)],
        'prune_sweep': [r2(marks['climax_end'] + 1.5), r2(marks['climax_end'] + 4.5)],
        'ash_until': r2(marks['climax_end'] + 6.0),
        'tangle_lines_peak': 6000, 'tangle_lines_after': 4000, 'gold_line_every': 5,
        'rl_scene': [r2(S['s_rl1']['t0'] - 0.6), S['s_rl2']['t1']],
        'rl_gap_px': {'start_both': 192.0, 'us_end': round(rl_gap(73.8, 63.7), 1), 'jp_end': round(rl_gap(59.9, 64.7), 1)},
        'rl_jp_blur_max_px': 3.5},   # 审片：1.5 → 3.5 px（手机上看得出「越来越难」）
    'V': {
        'two_groups_appear': [r2(CH['V'] + 0.2), r2(S['s_dog']['t0'] + 0.6)],
        'pairings': [r2(S['s_dog']['t0'] + 0.8 + 1.3 * i) for i in range(6)],
        'typewriter': {'t0': r2(S['s_luxun']['t0'] + 0.2), 'cps': 6, 'text': '其实地上本没有路，走的人多了，也便成了路。'},
        'cursor_to_path': [r2(S['s_hope']['t0'] + 1.0), r2(S['s_hope']['t1'] + 1.2)]},
    'VI': {
        'familiar_road_run': [S['s_switch']['t0'], S['s_hand']['t1']],
        'camera_rise': [S['s_grass']['t0'], S['s_grass']['t1']],
        'fade_to_prologue': [S['s_grass']['t1'], r2(S['s_grass']['t1'] + 1.0)],
        'coda_pairs': [[d, l] for d, l in zip(coda_dings, coda_lights)],
        'coda_light': {'K': 1.5, 'scale': 1.45, '_note': '片尾三次配对的光：和片头同一个 drawLight（同样的形状和时长），亮度 ×1.5、尺寸 ×1.45，外加一层更大的暖光'},
        'ding7': ding7, 'light_should_be': r2(ding7 + 0.6),
        'still_sub': [S['s_still']['t0'], S['s_still']['t1']],
        'switch_uses_estimate': switch_uses},
    'end_title': {'in': [r2(S['s_still']['t1'] + 0.3), r2(S['s_still']['t1'] + 1.5)],
                  'out': [r2(end_t - 2.0), r2(end_t - 1.0)]},   # 审片：片名卡淡出后，身份标记单独留 1 s
    'endmark': {'t': [r2(end_t - 2.4), end_t], 'text': 'Opus 5.5'},   # 用户 2026-10-12：片尾只留「Opus 5.5」
    'numbers': {
        'pairings_in_prologue': 4, 'pairings_in_coda': CODA_PAIRS, 'dings_total': 7 + CODA_PAIRS, 'lights_total': 5 + CODA_PAIRS,
        'bliss_lomo_max_hours': 10, 'abraham_2002_up_to_years': 1,
        'london_streets': 25000, 'knowledge_years': '3-4', 'trainees': 79, 'qualified': 39, 'controls': 31,
        'neurons': NEURONS, 'neurons_count_years': round(count_years, 1),
        'particles_drawn_max': 4000,
        'synapse_density_peak_over_adult': 1.5,
        'tangle_lines_peak': 6000, 'tangle_lines_after_prune': 4000,
        'kuhl': kuhl},
}

# ---------------------------------------------------------------- 配乐表（score.py 格式）
def sec(t0, t1, chords, piano, layers, intensity, bpc=1, **kw):
    d = {'t0': r2(t0), 't1': r2(t1), 'chords': chords, 'bars_per_chord': bpc, 'piano': piano,
         'layers': layers, 'intensity': intensity}
    d.update(kw)
    return d

ce = marks['climax_end']
pre0, pre1 = meta['III']['prelude_pad_only']
rl0 = meta['IV']['rl_scene'][0]
# 下面的时间都是场景时间，写 cue.json 之前统一映射成播放时间（见 TIME_MAP）。
# 审片修改（声音）：M0 加极轻低音；M1 心跳提前进来、低音和铺底加厚；M2 加心跳；1966 的 riser 峰值落在猛敲最后一下；
# M10 拆成「剪后」和「r/l」两段（r/l 改琶音 + 心跳）；M11 加心跳、低音加厚；M16 钢琴 0.9 → 1.0；淡入 1.0 → 0.3 s。
cue_scene = {
    'dur': dur, 'key': 'A', 'mode': 'dorian', 'bpm': 64, 'seed': 49, 'rt60': 4.0, 'ramp': 1.2,
    'fade_in': 0.05, 'fade_out': 2.5,
    'motif': [[4, 1.5], [3, 0.5], [2, 1], [0, 1], [2, 1], [4, 1], [3, 2]],
    'sections': [
        sec(0.0, S['s_wait']['t0'], ['i'], 'sparse', {'pad': 0.2, 'low': 0.12}, 0.42, 4, density=0.0, pad_attack=0.3, pad_bright=0.3, name='M0 实验（第 0 帧就有 pad）'),
        sec(S['s_wait']['t0'], S['s_brain']['t0'], ['i'], 'sparse', {'piano': 0.35, 'pad': 0.55, 'low': 0.35, 'pulse': 0.2}, 0.85, 4, density=0.12, pad_bright=0.45, name='M1 等待（心跳 + 隔拍一个极轻的钢琴 A4）'),
        sec(S['s_brain']['t0'], ding6, ['i', 'IV'], 'sparse', {'piano': 0.55, 'pad': 0.5, 'low': 0.3, 'pulse': 0.22}, 0.78, 1, density=0.4, pad_bright=0.4, name='M2 揭示'),
        sec(ding6, I0, ['IV', 'i'], 'arp', {'piano': 0.7, 'pad': 0.75, 'low': 0.75}, 0.92, 1, pad_bright=0.45, name='M3 片名'),
        sec(I0, CH['II'], ['i', 'IV', 'i', 'VII'], 'arp', {'piano': 0.65, 'pad': 0.4, 'low': 0.45, 'pulse': 0.3}, 0.72, 2, name='M4 连'),
        sec(CH['II'], CH['III'], ['i', 'v', 'IV', 'i'], 'arp', {'piano': 0.6, 'pad': 0.45, 'low': 0.5, 'pulse': 0.32}, 0.70, 1, name='M5 痕'),
        sec(CH['III'], pre0, ['i', 'III', 'VII', 'IV'], 'motif', {'piano': 0.8, 'pad': 0.5, 'low': 0.5, 'pulse': 0.28}, 0.75, 2, name='M6a 歌'),
        sec(pre0, pre1, ['i'], 'sparse', {'pad': 0.2}, 0.70, 2, density=0.0, name='M6b 前奏（只留长音，两个音单独弹）'),
        sec(pre1, marks['zoom_start'], ['i', 'III', 'VII', 'IV'], 'motif', {'piano': 0.8, 'pad': 0.5, 'low': 0.5, 'pulse': 0.28}, 0.75, 2, name='M6c 路'),
        sec(marks['zoom_start'], CH['IV'], ['IV', 'VII', 'III', 'i'], 'arp', {'piano': 0.7, 'pad': 0.75, 'low': 0.65, 'pulse': 0.3}, 0.84, 1, pad_bright=0.5, name='M7 860亿'),
        sec(CH['IV'], S['s_two']['t0'], ['i', 'VII', 'IV', 'IV'], 'arp16', {'piano': 0.7, 'pad': 0.75, 'low': 0.75, 'pulse': 0.45}, 0.88, 1, pad_bright=0.5, name='M8 长'),
        sec(S['s_two']['t0'], ce, ['IV', 'VII'], 'arp16', {'piano': 0.9, 'pad': 1.0, 'low': 1.0, 'pulse': 0.6}, 1.0, 1, pad_bright=0.65, name='M9 顶点'),
        sec(r2(ce + 1.5), S['s_road']['t1'], ['i', 'IV'], 'sparse', {'piano': 0.7, 'pad': 0.5, 'low': 0.45}, 0.8, 2, density=0.45, pad_bright=0.4, name='M10a 剪后（只到「成了路」）'),
        sec(S['s_road']['t1'], CH['V'], ['i', 'IV'], 'arp', {'piano': 0.6, 'pad': 0.45, 'low': 0.45, 'pulse': 0.3}, 0.78, 2, name='M10b r/l（琶音 + 心跳）'),
        sec(CH['V'], S['s_luxun']['t0'], ['III', 'VII', 'i'], 'chordal', {'piano': 0.6, 'pad': 0.5, 'low': 0.5, 'pulse': 0.25}, 0.76, 2, name='M11 望'),
        sec(S['s_luxun']['t0'], CH['VI'], ['IV', 'i', 'III', 'VII'], 'motif', {'piano': 0.7, 'pad': 0.5, 'low': 0.45}, 0.78, 1, name='M12 鲁迅'),
        sec(CH['VI'], S['s_grass']['t0'], ['i', 'III'], 'arp', {'piano': 0.6, 'pad': 0.55, 'low': 0.5, 'pulse': 0.25}, 0.74, 2, name='M13 熟路'),
        sec(S['s_grass']['t0'], marks['ring_back'], ['III', 'IV'], 'motif', {'piano': 0.85, 'pad': 0.8, 'low': 0.75, 'pulse': 0.3}, 0.95, 1, pad_bright=0.5, name='M14 落点'),
        sec(marks['ring_back'], meta['end_title']['in'][0], ['i'], 'sparse', {'pad': 0.45, 'low': 0.2}, 0.64, 4, density=0.0, pad_bright=0.45, name='M15 最后一声'),
        sec(meta['end_title']['in'][0], dur, ['IV', 'i'], 'motif', {'piano': 1.0, 'pad': 1.0, 'low': 0.6, 'pulse': 0.4}, 1.42, 1, pad_bright=0.75, name='M16 片尾（心跳回来；低音让给中频）'),
    ],
    'hits': (
        [{'type': 'bell', 't': d, 'deg': 0, 'gain': 1.6, 'pan': 0.4, 'note': f'叮{i + 1} 配对：0.6 s 后金光' if i < 4 else '叮5 测试：光不来'} for i, d in enumerate(dings)]
        + [{'type': 'bell', 't': ding6, 'deg': 0, 'gain': 1.1, 'pan': 0.4, 'note': '叮6：这一次光真的来了（第 6 次配对）'},
           {'type': 'boom', 't': burst, 'len': 5.0, 'note': '光到 = 片名开始连线'},
           {'type': 'riser', 't': meta['II']['burst'][1], 'len': 2.3, 'gain': 0.7, 'note': '1966 实验的「猛敲一阵」：峰值落在猛敲最后一下（t 是结束时刻）'},
           {'type': 'note', 't': meta['III']['prelude_note_E'], 'midi': 88, 'len': 1.6, 'gain': 0.7, 'pan': 0.55, 'note': '前奏第 1 个音 E6（动机 deg 4）'},
           {'type': 'note', 't': meta['III']['prelude_note_D'], 'midi': 86, 'len': 1.2, 'gain': 0.85, 'pan': 0.55, 'note': '前奏第 2 个音 D6（动机 deg 3）'},
           {'type': 'riser', 't': ce, 'len': 5.5, 'note': '冲上两三岁乱网的顶点，随后硬静音（t 是结束时刻）'},
           {'type': 'boom', 't': r2(ce + 1.55), 'len': 5.0, 'gain': 0.8, 'note': '静音之后修剪的光扫过'},
               ]
        + [{'type': 'bell', 't': d, 'deg': 0, 'gain': 1.6, 'pan': 0.4, 'note': f'叮{7 + i} 片尾重新配对：0.6 s 后金光（和叮1–4 同一个音色、同一个增益）'} for i, d in enumerate(coda_dings)]
        + [{'type': 'bell', 't': ding7, 'deg': 0, 'gain': 1.6, 'pan': 0.4, 'note': '最后一声（叮10）回环：光不来'}]),
    'silences': [[ce, r2(ce + 1.5)]],
}


def to_real_cue(c):
    out = dict(c)
    out['dur'] = dur_real
    out['_time_note'] = '播放时间（已按 timeline_meta.time_map 从场景时间映射）'
    out['sections'] = [dict(x, t0=real(x['t0']), t1=real(x['t1'])) for x in c['sections']]
    out['sections'][0]['t0'] = 0.0
    out['hits'] = [dict(h, t=real(h['t'])) for h in c['hits']]
    out['silences'] = [[real(a), real(b)] for a, b in c['silences']]
    return out


cue = to_real_cue(cue_scene)
# 审片（声音 P1）：留白里加一个极轻的钢琴 A4，落在 M1 心跳的强拍上（隔拍一下）。按播放时间直接写（心跳本身就是按播放时间排的）。
_m1 = next(x for x in cue['sections'] if x['name'].startswith('M1'))
_beat = 60 / cue['bpm']
_k = 0
while _m1['t0'] + _k * _beat < _m1['t1'] - 0.3:
    cue['hits'].append({'type': 'note', 't': r2(_m1['t0'] + _k * _beat), 'midi': 69, 'len': 1.0, 'gain': 0.85, 'pan': 0.45,
                        'note': '留白里的心跳：钢琴 A4（配乐，不算点位音效）'})
    _k += 2
meta['prologue']['heart_beat0_play'] = _m1['t0']
meta['prologue']['heart_beat_s'] = round(_beat, 6)

# 字幕：播放时间
subs_real = [dict(s_, t0=round(real(s_['t0']), 1), t1=round(real(s_['t1']), 1)) for s_ in subs]
for x in meta['dings']:
    x['t_play'] = real(x['t'])

# ---------------------------------------------------------------- 自检
errs, notes = [], []
subs_scene = subs
subs = subs_real
for i, s in enumerate(subs):
    d = s['t1'] - s['t0']; m = min_dur(s['zh'])
    if d + 1e-6 < m: errs.append(f"#{i+1} 时长 {d:.1f} < 最短 {m:.2f}")
    if d > 8.0 + 1e-6: errs.append(f"#{i+1} 时长 {d:.1f} > 8")
    if n_chars(s['zh']) > 22: errs.append(f"#{i+1} 字数 {n_chars(s['zh'])} > 22")
    if i > 0:
        g = s['t0'] - subs[i-1]['t1']
        q = subs[i-1]['zh'].endswith('？')
        why = s['why_gap']
        if g < 0.6 - 1e-6: errs.append(f"#{i+1} 句间 {g:.1f} < 0.6")
        if q and not (2.0 - 1e-6 <= g <= 8.0 + 1e-6): errs.append(f"#{i+1} 问句后留白 {g:.1f} 不在 2–8")
        if (not q) and g > 1.2 + 1e-6:
            if why: notes.append(f"#{i+1} 前空 {g:.1f} s：{why[1]}")
            else: errs.append(f"#{i+1} 句间 {g:.1f} > 1.2 且没写理由")
bad = ['答案', '记住', '注意', '建议', '先选', '错在', '留个题', '作业', '正确', '知识点', '应该', '记得', '别']
for i, s in enumerate(subs):
    for w in bad:
        if w in s['zh']: errs.append(f"#{i+1} 含教学话术「{w}」")
sfx = [h for h in cue['hits'] if h['type'] in ('bell', 'ding', 'boom', 'riser')]
if len(sfx) > 15: errs.append(f'点位音效 {len(sfx)} > 15')
chimes = [h for h in cue['hits'] if h['type'] == 'bell' and h.get('deg') == 0]
if len(chimes) != meta['numbers']['dings_total']: errs.append('叮的个数和 numbers.dings_total 不一致')
ce_r, ce_r2 = cue['silences'][0]
for a, b in zip(cue['sections'], cue['sections'][1:]):
    if abs(a['t1'] - b['t0']) > 1e-6 and not (abs(a['t1'] - ce_r) < 1e-6 and abs(b['t0'] - ce_r2) < 1e-6):
        errs.append(f"配乐段落不连续：{a['name']} {a['t1']} → {b['name']} {b['t0']}")

n = len(subs)
chars = sum(n_chars(s['zh']) for s in subs)
on = sum(s['t1'] - s['t0'] for s in subs)
print(f'句数 {n}  字数(汉字+数字字母) {chars}  平均每句 {chars / n:.1f}  平均在屏 {on / n:.2f} s  '
      f'最短 {min(s["t1"] - s["t0"] for s in subs):.1f} s  每分钟 {chars / (dur_real / 60):.0f} 字  片长 {dur_real:.1f} s ({int(dur_real // 60)}:{dur_real % 60:04.1f})（场景时间 {dur:.1f} s）')
print('章节', [(c['num'], c['zh'], c['t']) for c in chapters])
print('marks', marks)
print('叮（播放时间）', [d['t_play'] for d in meta['dings']], ' 最后一声 − 叮6 =', round(real(ding7) - real(ding6), 1), 's；最后一声 − 叮1 =', round(real(ding7) - real(dings[0]), 1), 's')
print('time_map [场景, 播放]', TIME_MAP)
print('一秒数一个：', round(count_years, 1), '年；r/l 间距', meta['IV']['rl_gap_px'], '；10 h 在一年轴上', meta['II']['ten_h_px_on_year_axis'], 'px')
print('点位音效', len(sfx), '个；其中叮', len(chimes), '声')
for x in notes: print('  拍：', x)
for e in errs: print('!!', e)
print()
print('| # | 时间 | 中文字幕 | 英文字幕 |')
print('|---|---|---|---|')
for i, s in enumerate(subs):
    print(f"| {i+1} | {s['t0']:.1f}–{s['t1']:.1f} | {s['zh']} | {s['en']} |")

out_subs = [{'t0': s['t0'], 't1': s['t1'], 'zh': s['zh'], 'en': s['en']} for s in subs]

def dump_compact(obj, path):
    """顶层每个键一行；列表里的每个对象一行，方便人读、方便 diff。"""
    J = lambda x: json.dumps(x, ensure_ascii=False)
    lines = ['{']
    items = list(obj.items())
    for i, (k, v) in enumerate(items):
        tail = ',' if i < len(items) - 1 else ''
        if isinstance(v, list) and v and isinstance(v[0], dict):
            lines.append(f' {J(k)}: [')
            for j, e in enumerate(v):
                lines.append('  ' + J(e) + (',' if j < len(v) - 1 else ''))
            lines.append(' ]' + tail)
        elif isinstance(v, dict) and len(J(v)) > 160:
            lines.append(f' {J(k)}: {{')
            sub_items = list(v.items())
            for j, (kk, vv) in enumerate(sub_items):
                lines.append(f'  {J(kk)}: {J(vv)}' + (',' if j < len(sub_items) - 1 else ''))
            lines.append(' }' + tail)
        else:
            lines.append(f' {J(k)}: {J(v)}{tail}')
    lines.append('}')
    open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    json.load(open(path, encoding='utf-8'))      # 回读一遍，保证是合法 JSON

args = sys.argv[1:]
if args[:1] == ['--out'] and len(args) == 2:
    d = args[1]
    json.dump(out_subs, open(os.path.join(d, 'subs.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    dump_compact(cue, os.path.join(d, 'cue.json'))
    dump_compact(meta, os.path.join(d, 'timeline_meta.json'))
    print('wrote', d)
elif len(args) == 1:
    json.dump(out_subs, open(args[0], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wrote', args[0])
if errs:
    sys.exit(1)
