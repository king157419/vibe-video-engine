# -*- coding: utf-8 -*-
"""峰终 (peak)：从一张时间表生成 subs.json / cue.json / numbers.json，并检查节奏规矩。
时间全部由「上一句结束 + 间隔」推出，不手写零散的秒数。
旋律（片头、03 章唱片、片尾）按 bpm 64 的拍子排，音符时刻由本脚本算出，画面照 numbers.json 画。

用法：D:\\conda\\envs\\d2l\\python.exe build_timeline.py [--write]
"""
import json, math, re, sys, os

OUT_PUB = r"D:\desk\claudex\24\video-engine\public\v4\peak"
OUT_DOC = r"D:\desk\claudex\24\4_第四版资料\peak"

BPM = 64
BEAT = 60 / BPM            # 0.9375 s
BAR = 4 * BEAT             # 3.75 s

# 片头旋律（E 小调）：E5 G5 B5 | E6 . . D6 | B5 . G5 . | 本该落回 E5，弹成 F5
# 每小节一个和弦：i | VI | III | i。音级按 E 小调写（0 = E5，7 = E6）；F5 不在调内，用 note 点位单独弹。
MEL_BARS = [('i', [[0, 1], [2, 1], [4, 2]]),
            ('VI', [[7, 3], [6, 1]]),
            ('III', [[4, 2], [2, 2]])]
WRONG_MIDI = 77            # F5（本该是 E5 = 76）
# 片尾旋律（G 大调 = E 小调的 III）：G5 B5 D6 | G6 . . F#6 | D6 . B5 . | G5（这次落稳）
END_BARS = [('III', [[2, 1], [4, 1], [6, 2]]),
            ('VI', [[9, 3], [8, 1]]),
            ('VII', [[6, 2], [4, 2]]),
            ('III', [[2, 4]])]
MEL_LEN = 3 * BAR          # 片头旋律从第一个音到错音 = 11.25 s

# (kind, payload)
#   ('gap', s)                      空白
#   ('sub', id, zh, en, dur)        一句字幕，dur 秒
#   ('mark', name)                  记一个锚点（当前时间）
SEQ = [
    ('mark', 'ch0'),
    ('gap', 1.0), ('mark', 'mel0'),            # 片头旋律第一个音
    ('gap', 5.4),
    ('sub', 'L1', '你已经听出来，它要落在哪儿。', 'You can already hear where it wants to land.', 5.0),
    ('gap', 2.2),                               # 12.25 s 错音落在这段空里
    ('sub', 'L2', '最后一个音，把整段都弄坏了？', 'Did one last note just spoil the whole thing?', 5.0),
    ('gap', 0.8),
    ('sub', 'L3', '可前面那十几秒，你明明听得很舒服。', 'Yet for ten-odd seconds before that, you were enjoying it.', 5.4),
    ('gap', 0.8),
    ('sub', 'L4', '记忆不存录像，它只留下几帧。', 'Memory keeps no footage. Only a few frames.', 5.0),
    ('gap', 0.5), ('mark', 'title'), ('gap', 7.0), ('mark', 'ch1'), ('gap', 0.4),
    # ---------------- 01 冷
    ('sub', 'L5', '一只手，浸在14度的冷水里，整整六十秒。', 'One hand in water at 14°C, for sixty long seconds.', 5.8),
    ('gap', 0.6),            # 审片修改：带数字的长句 +0.2 s，从后面的句间空里匀（后面的时刻不变）
    ('sub', 'L6', '另一次，换只手：同样六十秒，再多泡三十秒。', 'The other time, the other hand: the same sixty seconds, then thirty more.', 5.8),
    ('gap', 0.8),
    # 2026-10-12 用户反馈：没人记得前面的 14 度，要说「比 14 度多 1 度」。L7 拆成两句，画面上 14° 和 15° 同屏、「+1°」金色点亮（+4.2 s）
    ('sub', 'L7', '多出的三十秒，水从14度升到15度。', 'In those thirty extra seconds, the water rose from 14° to 15°.', 5.0),
    ('gap', 0.6),
    ('sub', 'L7b', '只暖了1度——还是冷。', 'Just one degree warmer — still cold.', 4.0),
    ('gap', 0.8),
    ('sub', 'L8', '如果必须再来一次，你选哪一次？', 'If you had to do one of them again — which would it be?', 5.0),
    ('mark', 'blank2'), ('gap', 6.0), ('mark', 'reveal'),
    ('sub', 'L9', '大多数人，选了更长的那一次。', 'Most people chose the longer one.', 5.0),
    ('gap', 0.8),
    ('sub', 'L10', '他们等于自己报名，多挨三十秒的冻。', 'They signed up for thirty more seconds of cold.', 5.4),
    ('gap', 0.8),
    ('sub', 'L11', '1993年，卡尼曼和同事发表了它：用冷水，量记忆。', 'Published in 1993 by Daniel Kahneman and colleagues: cold water, to measure memory.', 6.2),
    ('gap', 0.6), ('mark', 'ch2'), ('gap', 0.4),
    # ---------------- 02 峰
    ('sub', 'L12', '记忆给一段经历打分，几乎不看它有多长。', 'When memory scores an experience, it hardly asks how long it lasted.', 5.8),
    ('gap', 0.8),
    ('sub', 'L13', '它看得最重的是两帧：最强烈的一刻，和最后一刻。', 'It weighs two frames above all: the most intense moment, and the last.', 6.6),
    ('gap', 0.8),
    ('sub', 'L14', '多泡的三十秒，换来一个没那么冷的结尾。', 'Those thirty extra seconds bought a gentler ending.', 5.8),
    ('gap', 0.8),
    ('sub', 'L15', '1996年，154位病人做肠镜时，每分钟报一次疼。', 'In 1996, a study had 154 colonoscopy patients rate their pain every minute.', 6.4),
    ('gap', 0.6),
    ('sub', 'L16', '事后的回忆，跟着最疼的一下，和最后三分钟。', 'What they remembered followed the worst moment, and the last three minutes.', 6.2),
    ('gap', 0.8), ('mark', 'ch3'), ('gap', 0.4),
    # ---------------- 03 终
    ('sub', 'L17', '2003年，682位病人里，一半人的肠镜多留了一会儿。', 'In 2003, among 682 patients, half had the scope left in a little longer.', 6.5),
    ('gap', 0.6),
    ('sub', 'L18', '多受了一段罪，事后反而觉得没那么难受。', 'More to endure — yet afterward, it felt less unpleasant.', 5.8),
    ('gap', 0.8),
    ('sub', 'L19', '几年后，这一半人回来复查的，也多一些。', 'Years later, more of this half came back for their next colonoscopy.', 5.6),
    ('gap', -2.6), ('mark', 'rec0'),             # 唱片：片头那段旋律原样再响一次（L19 末尾先只闻其声）
    ('gap', 3.4),
    ('sub', 'L20', '有人听交响乐，二十分钟，美极了；结尾，一声尖响。', 'A man listens to a symphony: twenty glorious minutes, then a screech at the very end.', 6.4),
    ('gap', MEL_LEN - 3.4 - 6.4), ('mark', 'screech'),   # = rec0 + 11.25：和片头同一个 F5
    ('gap', 0.6),
    ('sub', 'L21', '他说，整段音乐都毁了。', 'It ruined all of it, he said.', 4.6),
    ('gap', 0.8),
    ('sub', 'L22', '卡尼曼说：我们挑的不是经历，是对经历的记忆。', "Kahneman said: we don't choose between experiences, but between memories of them.", 6.3),
    ('gap', 0.8), ('mark', 'ch4'), ('gap', 0.4),
    # ---------------- 04 生
    ('sub', 'L23', '一个人的一生，不到三万个今天。', 'A human life: fewer than thirty thousand todays.', 5.4),
    ('gap', 0.8),
    ('sub', 'L24', '能被想起来的，只是其中零星几点。', 'Only a scattered few will ever be recalled.', 5.2),
    ('gap', 0.8), ('mark', 'climax'),
    ('sub', 'L25', '2001年，心理学家请人读几段虚构的人生，再打分。', 'In 2001, psychologists asked people to read about imagined lives — and rate them.', 6.6),
    ('gap', 0.6), ('mark', 'lifeA'),
    # 审片修改：「戛然而止」不再提前 5 秒说出来。前半句陪着满屏奇观，硬切的那一帧一起切掉；
    # 后半句放在硬静音的黑场里（先经历，后命名）。cut_end = cut + 1.3 在 layout() 之后单独算。
    # 2026-10-12 用户反馈：「一个美好的人生，」像话没说完 → 改成「第一种人生：…——」「第二种人生：…」两项并列；
    # 戛然而止之后多停一会（硬静音 1.3 → 3.0 s，+1.7 s）；L27 字数变多（+1.0 s）
    ('sub', 'L26', '第一种人生：一直很美好——', 'Life one: wonderful, all the way —', 5.2),
    ('mark', 'cut'), ('gap', 0.15),
    ('sub', 'L26b', '戛然而止。', 'cut short.', 2.65),    # 193.30–195.95：整句落在 3.0 s 的硬静音里，音乐回来前 0.2 s 收掉
    ('gap', 1.1),
    ('sub', 'L27', '第二种人生：一模一样，只是后面多了五年还不错的日子。', 'Life two: exactly the same, except for five more pleasant years at the end.', 7.3),
    ('gap', 0.6),
    ('sub', 'L28', '多出来的好日子，反而让这一生减了分。', "The extra good years actually lowered that life's score.", 5.6),
    ('gap', 0.8), ('mark', 'ch5'), ('gap', 0.4),
    # ---------------- 05 我
    ('sub', 'L29', '所以一段感情吵着散了，那几年好像都白过了。', 'So when love ends in a fight, the years before it seem wasted.', 6.3),
    ('gap', 0.8),
    ('sub', 'L30', '可那几年，是一天一天真的活过的。', 'Yet those years were lived — one real day at a time.', 5.4),
    ('gap', 0.8),
    ('sub', 'L31', '片头那段旋律，你也是真的听过的。', 'And that melody at the start — you truly heard it.', 5.4),
    ('gap', 0.8),
    ('sub', 'L32', '卡尼曼说，人有两个自己：一个过日子，一个讲故事。', 'Kahneman said we each carry two selves: one who lives, and one who tells the story.', 6.5),
    ('gap', 0.8),
    ('sub', 'L33', '峰终定律，只管讲故事的那一个自己。', 'The peak–end rule governs only the self that tells the story.', 5.4),
    ('gap', 0.8), ('mark', 'poem'),
    ('sub', 'L34', '讲故事的那个你，总是后来才到。', 'The storyteller in you always arrives late.', 6.0),
    ('gap', 0.8), ('mark', 'ch6'), ('gap', 0.4),
    # ---------------- 06 今天
    ('sub', 'L35', '这部片子，也有一条自己的线。', 'This film has a line of its own.', 4.6),
    ('gap', 0.8),
    ('sub', 'L36', '过几天，你会想起它的哪两帧？', 'A few days from now, which two frames will come back to you?', 5.0),
    ('mark', 'blank3'), ('gap', 6.0), ('mark', 'final'),   # 留白后：终段进来，本片的峰、终亮起
    ('gap', 0.8),
    ('sub', 'L37', '它最响的，是那一次戛然而止，和它的结尾。', 'Its loudest moments: that sudden stop, and its ending.', 6.0),
    ('gap', MEL_LEN - 6.8), ('mark', 'land'),    # = final + 11.25：片尾旋律（从 final 起）落在 G 上
    ('gap', 0.4),
    ('sub', 'L38', '今天，还没有结束。', "Today isn't over yet.", 5.0),
    ('gap', 0.4), ('mark', 'endtitle'), ('gap', 6.0), ('mark', 'end'),
]

BANNED = ['答案', '记住', '注意', '建议', '先选', '错在', '留个题', '作业', '正确', '知识点', '应该', '记得', '别']
# 有意违反「在屏 ≥ 字数/4 + 1.5、4–8 秒」的句子（写明理由，check() 跳过）
EXEMPT = {'L26b': '硬静音的暗场上只有这四个字，2.65 s 读得完（够「字数/4 + 1.5」，只是短于 4 s）'}
SILENCE_LEN = 3.0          # 硬静音长度（cut → cut_end）。2026-10-12：1.3 → 3.0，用户「都没反应过来就继续了」


def zh_len(s: str) -> int:
    """中文字数：汉字各算 1，一串阿拉伯数字算 1（读起来就是一个词）。"""
    n = len(re.findall(r'[\u4e00-\u9fff]', s))
    n += len(re.findall(r'\d+', s))
    return n


def layout():
    t = 0.0
    subs, marks = [], {}
    for item in SEQ:
        k = item[0]
        if k == 'gap':
            t += item[1]
        elif k == 'mark':
            marks[item[1]] = round(t, 3)
        elif k == 'sub':
            _, sid, zh, en, dur = item
            subs.append({'id': sid, 't0': round(t, 2), 't1': round(t + dur, 2), 'zh': zh, 'en': en})
            t += dur
    marks['cut_end'] = round(marks['cut'] + SILENCE_LEN, 3)
    return subs, marks, round(t, 2)


def check(subs, marks, dur):
    probs = []
    gaps = []
    for i, s in enumerate(subs):
        n = zh_len(s['zh'])
        need = n / 4 + 1.5
        d = s['t1'] - s['t0']
        s['_n'] = n
        if s['id'] in EXEMPT:
            pass
        elif d + 1e-6 < need:
            probs.append(f"{s['id']} 在屏 {d:.2f}s < 需要 {need:.2f}s（{n} 字）")
        if s['id'] not in EXEMPT and not (4.0 - 1e-6 <= d <= 8.0 + 1e-6):
            probs.append(f"{s['id']} 在屏 {d:.2f}s 不在 4–8s")
        for bad in BANNED:
            if bad in s['zh']:
                probs.append(f"{s['id']} 含禁词 {bad}")
        if i:
            g = s['t0'] - subs[i - 1]['t1']
            gaps.append((subs[i - 1]['id'], s['id'], round(g, 2)))
    return probs, gaps


def fmt(t):
    m = int(t // 60)
    return f"{m}:{t - 60 * m:04.1f}"


SUBS, MARKS, DUR = layout()
L = {s['id']: s for s in SUBS}
M = MARKS


def melody_sections(t0, bars, inten, layers, extra=None):
    """一小节一个 section，每个 section 带自己的 motif（score.py 支持 section 级 motif）。"""
    out = []
    for i, (ch, mot) in enumerate(bars):
        a = round(t0 + i * BAR, 4)
        sec = dict(t0=a, t1=round(a + BAR, 4), chords=[ch], bars_per_chord=1, piano='motif', motif=mot,
                   layers=dict(layers), intensity=inten)
        if extra:
            sec.update(extra)
        out.append(sec)
    return out


def note_table(t0, bars, key_base=76):
    """把小节表展开成 (t, midi, beats)。E 小调音级 → midi（0 = E5 = 76）。"""
    sc = [0, 2, 3, 5, 7, 8, 10]
    out = []
    for i, (ch, mot) in enumerate(bars):
        tm = t0 + i * BAR
        for deg, b in mot:
            if deg is not None:
                d = int(deg)
                out.append((round(tm, 4), key_base + sc[d % 7] + 12 * (d // 7), b))
            tm += b * BEAT
    return out


def cue():
    mel0, rec0, fin = M['mel0'], M['rec0'], M['final']
    assert abs(M['land'] - (fin + MEL_LEN)) < 1e-6
    wrong = round(mel0 + MEL_LEN, 4)
    screech = round(rec0 + MEL_LEN, 4)
    assert abs(screech - M['screech']) < 1e-6
    mel_layers = dict(piano=1.0, pad=0.75, low=0.5)
    sec = []
    # intensity 取值让原始 LRA ≈ 9 LU：这样两遍 loudnorm 走线性增益，不会把高潮和结尾压平（见剧本 §4 实测）
    # 审片修改（声音 P1）：开头 1 s 黑场里 E 小调铺底先起来（pad_attack 0.8），不再是数字静音；片头旋律 0.8→0.9、pad 起音 0.6
    sec.append(dict(t0=0, t1=mel0, chords=['i'], layers=dict(pad=0.5, low=0.4), pad_attack=0.8, intensity=0.90))
    sec += melody_sections(mel0, MEL_BARS, 0.90, mel_layers, dict(pad_attack=0.6))     # 片头旋律
    # 错音下面仍是 Em：铺底 0.08 s 就压上来，左手 E3 更实（velocity 0.85），再加一个 E4 和 F5 撞成小九度
    wrong_sec = dict(chords=['i'], bars_per_chord=1, piano='motif', motif=[[None, 4]],
                     layers=dict(piano=1.0, pad=0.6, low=0.5), pad_attack=0.08, velocity=0.85)
    sec.append(dict(t0=wrong, t1=L['L2']['t0'], intensity=0.80, **wrong_sec))
    sec.append(dict(t0=L['L2']['t0'], t1=M['title'], chords=['iv', 'VI'], piano='sparse', density=0.25,
                    layers=dict(piano=0.6, pad=0.85, low=0.4), intensity=0.70))        # 余味：轻，不解决
    sec.append(dict(t0=M['title'], t1=M['ch1'], chords=['VI', 'III'], piano='chordal',
                    layers=dict(piano=0.6, pad=0.8, low=0.7), intensity=0.90, pad_bright=0.5, velocity=0.7))   # 片名：柱式和弦重一点（手机上 boom 听不见，靠中频撑住）
    sec.append(dict(t0=M['ch1'], t1=M['blank2'], chords=['i', 'iv'], piano='sparse', density=0.5, register=1,
                    layers=dict(piano=0.7, pad=0.85, low=0.6), intensity=0.72, pad_bright=0.25))
    sec.append(dict(t0=M['blank2'], t1=M['reveal'], chords=['V'], piano='sparse', density=0.15,
                    layers=dict(piano=0.45, pad=0.9, low=0.6), intensity=0.70))
    sec.append(dict(t0=M['reveal'], t1=M['ch2'], chords=['VI', 'VII', 'i'], bars_per_chord=1, piano='arp',
                    layers=dict(piano=0.7, pad=0.6, low=0.6), intensity=0.78))
    sec.append(dict(t0=M['ch2'], t1=M['ch3'], chords=['i', 'VI', 'III', 'VII'], piano='motif',
                    layers=dict(piano=0.85, pad=0.6, low=0.55), intensity=0.78))
    sec.append(dict(t0=M['ch3'], t1=rec0, chords=['VI', 'III', 'VII', 'i'], bars_per_chord=1, piano='arp',
                    layers=dict(piano=0.7, pad=0.6, low=0.55), intensity=0.80))
    sec += melody_sections(rec0, MEL_BARS, 0.80, mel_layers)                           # 唱片：同一段旋律
    # 唱片尖响：和片头错音那一段一模一样（同一个 F5、同一个 Em 底），1.35 s 后再接稀疏段
    screech_end = round(screech + (L['L2']['t0'] - wrong), 4)
    sec.append(dict(t0=screech, t1=screech_end, intensity=0.80, **wrong_sec))
    sec.append(dict(t0=screech_end, t1=M['ch4'], chords=['i', 'iv'], piano='sparse', density=0.4,
                    layers=dict(piano=0.65, pad=0.9, low=0.5), intensity=0.74))
    sec.append(dict(t0=M['ch4'], t1=M['climax'], chords=['i', 'VI', 'III', 'VII'], bars_per_chord=1, piano='arp16',
                    layers=dict(piano=0.7, pad=0.7, low=0.7, pulse=0.25), intensity=0.82, pad_bright=0.45))
    sec.append(dict(t0=M['climax'], t1=M['cut'], chords=['iv', 'VI', 'VII', 'i'], bars_per_chord=1, piano='arp16',
                    layers=dict(piano=0.85, pad=0.9, low=0.85, pulse=0.45), intensity=1.0, pad_bright=0.6))
    sec.append(dict(t0=M['cut_end'], t1=M['ch5'], chords=['VI', 'iv'], piano='sparse', density=0.5,
                    layers=dict(piano=0.75, pad=0.9, low=0.5), intensity=0.72))
    sec.append(dict(t0=M['ch5'], t1=M['poem'], chords=['VI', 'III', 'iv', 'i'], piano='motif',
                    layers=dict(piano=0.8, pad=0.7, low=0.5), intensity=0.74))
    sec.append(dict(t0=M['poem'], t1=M['ch6'], chords=['VI', 'III'], piano='sparse', density=0.35,
                    layers=dict(piano=0.65, pad=0.9, low=0.5), intensity=0.72))
    sec.append(dict(t0=M['ch6'], t1=M['blank3'], chords=['VI', 'III'], bars_per_chord=1, piano='arp',
                    layers=dict(piano=0.7, pad=0.6, low=0.55), intensity=0.80))
    sec.append(dict(t0=M['blank3'], t1=fin, chords=['VII'], piano='sparse', density=0.15,
                    layers=dict(piano=0.45, pad=0.9, low=0.6), intensity=0.76))       # 留白：D 大三悬着（G 大调的属和弦）
    sec += melody_sections(fin, END_BARS, 1.0, dict(piano=1.0, pad=1.0, low=1.0), dict(pad_bright=0.55, velocity=0.62))  # 片尾旋律：G 大调，落稳；琴重一点，结尾最响
    sec.append(dict(t0=round(fin + 4 * BAR, 4), t1=DUR, chords=['VI', 'VII', 'III'], bars_per_chord=1, piano='arp',
                    layers=dict(piano=0.9, pad=1.0, low=1.0), intensity=1.0, pad_bright=0.55, velocity=0.62))
    # 片尾旋律第 3、4 小节：上一和弦 D 大的铺底收一点，落到 G 的那一段铺底 0.1 s 起音（「稳稳落在主音」不被拖糊）
    for s in sec:
        if abs(s['t0'] - (fin + 2 * BAR)) < 1e-3:
            s['layers'] = dict(s['layers'], pad=0.7)
        if abs(s['t0'] - (fin + 3 * BAR)) < 1e-3:
            s['pad_attack'] = 0.1
    # 审片修改（声音 P1）：低频太厚、中频太少，手机外放会小一截。各段 low ×0.6、pad ×0.8、piano ×1.15
    mul = dict(low=0.6, pad=0.8, piano=1.15)
    for s in sec:   # 每段建新 dict（两段错音共用 wrong_sec 的 layers，原地乘会乘两次）
        s['layers'] = {k_: round(v_ * mul.get(k_, 1.0), 3) for k_, v_ in s.get('layers', {}).items()}
    E4 = 64
    hits = [
        dict(type='boom', t=M['title'], gain=0.75),                         # 1 片名
        dict(type='bell', t=M['title'], deg=0),                             # 2 片名
        dict(type='note', t=wrong, midi=WRONG_MIDI, len=1.6, gain=0.85),    # 3 片头错音 F5（不比旋律响，错在和声）
        dict(type='note', t=wrong, midi=E4, len=1.6, gain=0.55),            #   E4 和 F5 撞成小九度（手机外放也听得出）
        dict(type='bell', t=M['reveal'], deg=4, gain=0.5),                  # 4 冷水揭晓（B6）。2026-10-12：画面改成问号化成的金点正好在这一拍落到 90 秒末端、放两圈金环
        dict(type='bell', t=round(L['L13']['t0'] + 1.6, 2), deg=2, gain=0.5),  # 5 只剩两帧：峰、终（G6）
        dict(type='note', t=screech, midi=WRONG_MIDI, len=1.6, gain=1.1),   # 6 唱片尖响：同一个 F5（这里更容易被埋，响一点）
        dict(type='note', t=screech, midi=E4, len=1.6, gain=0.55),          #   同样的 E4
        dict(type='boom', t=L['L23']['t0'], gain=0.4),                      # 7 升尺度
        dict(type='riser', t=M['cut'], len=5.0, gain=0.15),                 # 8 冲到戛然而止（收到 0.15：最后 0.5 s 的 3–10 kHz 不高于全频带 −14 dB，免得太嘶）
        dict(type='bell', t=L['L28']['t0'], deg=4, gain=0.9),               # 9 反转落地。2026-10-12：画面同一刻 A 的金点闪亮、放两圈金环（s4）
        dict(type='bell', t=fin, deg=4, gain=0.5),                          # 10 本片的峰、终亮起（B6，原 ding B7）
        # 11 今天这支笔：2026-10-12 审铃声 —— 原来 L38 + 0.3 s 时画面上什么都没发生；改到「今天」这条线接上中心那颗点的一拍
        #    （片尾旋律第 15 拍），画面在同一刻闪一下、放一圈环（s6）
        dict(type='bell', t=round(fin + 15 * BEAT, 2), deg=2, gain=0.4),
        dict(type='bell', t=M['endtitle'], deg=0, gain=0.8),                # 12 片尾片名
    ]
    return dict(dur=DUR, key='E', mode='minor', bpm=BPM, seed=11, rt60=3.8, ramp=1.5,
                fade_in=0.3, fade_out=1.5,
                motif=[[0, 1], [2, 1], [4, 2], [7, 3], [6, 1]],   # 全片动机 = 片头旋律前两小节
                sections=sec, hits=hits, silences=[[M['cut'], M['cut_end']]])


# ------------------------------------------------------------------ 画面要用的数（全部由这里算）
def mulberry32(seed):
    a = seed & 0xffffffff

    def imul(x, y):
        return ((x & 0xffffffff) * (y & 0xffffffff)) & 0xffffffff

    def r():
        nonlocal a
        a = (a + 0x6d2b79f5) & 0xffffffff
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & 0xffffffff
        t &= 0xffffffff
        return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296
    return r


def intensity_curve(c, fs=1000):
    """和 score.py 的总增益完全同一套算法：分段常数 → ±ramp 的 Hanning 卷积（两端补零，和 fftconvolve same 一致）
    → 乘 fade_in / fade_out → silences 置 0。返回 (t 数组, F 数组)。"""
    import numpy as np
    n = int(c['dur'] * fs)
    g = np.zeros(n)
    pts = [(float(s['t0']), float(s.get('intensity', 0.7))) for s in c['sections']]
    for i, (t0, v) in enumerate(pts):
        a = int(t0 * fs)
        b = int(pts[i + 1][0] * fs) if i + 1 < len(pts) else n
        g[a:b] = v
    k = int(c['ramp'] * fs)
    w = np.hanning(2 * k + 1)
    w /= w.sum()
    g = np.convolve(g, w, mode='same')
    t = np.arange(n) / fs
    g *= np.clip(t / c['fade_in'], 0, 1) * np.clip((c['dur'] - t) / c['fade_out'], 0, 1)
    for a, b in c['silences']:
        g[int(a * fs):int(b * fs)] = 0
    return t, g


def numbers(c):
    import numpy as np
    out = {}
    # 片头旋律线：x = 260 + 112·(t − mel0)，y = 580 − 24·(midi − 76)
    mel0 = M['mel0']
    notes = note_table(mel0, MEL_BARS) + [(round(mel0 + MEL_LEN, 4), WRONG_MIDI, 0.8)]
    X = lambda t: round(260 + 112 * (t - mel0), 1)
    Y = lambda m: 580 - 24 * (m - 76)
    out['melody'] = [dict(t=t, midi=m, x=X(t), y=Y(m)) for t, m, b in notes]
    out['melody_peak'] = dict(x=X((mel0 + BAR + mel0 + BAR + 3 * BEAT) / 2), y=Y(88))
    out['melody_end'] = dict(x=X(mel0 + MEL_LEN + 0.75), y=Y(WRONG_MIDI), expected_y=Y(76))
    # 片尾旋律（今天这条线的形状）：音符时刻从 final 起；画线时 x = 260 + 700·(t − final)/11.25，y = 470 − 16·(midi − 79)
    e0 = M['final']
    en = note_table(e0, END_BARS)
    out['today'] = [dict(t=t, midi=m, x=round(260 + 700 * (t - e0) / MEL_LEN, 1), y=470 - 16 * (m - 79)) for t, m, b in en]
    # 冷水：p(t)
    def p(t):
        return 8 * (1 - math.exp(-t / 22)) if t <= 60 else 8 * (1 - math.exp(-60 / 22)) - 2.2 * ((t - 60) / 30) ** 0.8
    out['cold_p60'] = round(p(60), 2)
    out['cold_p90'] = round(p(90), 2)
    frames = [dict(j=j, t=5 * j, p=round(p(5 * j), 2), x=420 + 60 * j, b=round(0.2 + 0.8 * p(5 * j) / p(60), 3))
              for j in range(19)]
    out['film_frames'] = frames
    m60 = p(60)
    m90 = (p(60) + p(90)) / 2
    def light(m, mmax):
        k = (m / mmax) ** 2
        return dict(m=round(m, 2), k=round(k, 3), r=round(12 + 18 * k, 1))
    out['mem_cold'] = dict(short=light(m60, m60), long=light(m90, m60))
    # 1996 两根光丝（示意）
    P = [2, 2, 3, 2, 3, 3, 2, 3, 7, 9, 7, 3, 2, 3, 2, 2, 3, 2, 1, 1]
    Q = [3, 4, 5, 5, 5, 6, 5, 5, 5, 6, 5, 5, 5, 5, 5, 4, 3, 2, 1, 1]
    def pe(a):
        return (max(a) + sum(a[-3:]) / 3) / 2
    out['y1996'] = dict(spike=dict(arr=P, total=sum(P), peak=max(P), last3=round(sum(P[-3:]) / 3, 2), m=round(pe(P), 2)),
                        flat=dict(arr=Q, total=sum(Q), peak=max(Q), last3=round(sum(Q[-3:]) / 3, 2), m=round(pe(Q), 2)))
    out['mem_1996'] = dict(spike=light(pe(P), pe(P)), flat=light(pe(Q), pe(P)))
    # 2003：682 颗点分组 + 回来复查的（按平均 50.4%、OR 1.41 反推，示意）
    # 每颗点先取 x = r()，再取 g = r()；按 g 从小到大排，前 341 颗进上排（照常结束），其余 341 颗进下排（多留一会儿）
    r = mulberry32(682)
    gs = []
    for i in range(682):
        r()  # x
        gs.append((r(), i))
    gs.sort()
    top = len(gs[:341])
    bot = len(gs[341:])
    lo, hi = 0.3, 0.6
    for _ in range(60):
        x = (lo + hi) / 2
        o2 = 1.41 * x / (1 - x)
        p2 = o2 / (1 + o2)
        if (x + p2) / 2 < 0.504:
            lo = x
        else:
            hi = x
    p1, p2 = x, (1.41 * x / (1 - x)) / (1 + 1.41 * x / (1 - x))
    out['y2003'] = dict(top=top, bottom=bot, rate_std=round(p1, 3), rate_ext=round(p2, 3),
                        back_top=round(top * p1), back_bottom=round(bot * p2))
    out['mem_2003'] = dict(std=light(4.9, 4.9), ext=light(4.4, 4.9))
    # 一生
    out['life'] = dict(years=79, days=79 * 365, rings=79, r_max=round(30 + 5.3 * 78, 1), plateau_days=5 * 365)
    # 本片曲线 F(t)
    t, F = intensity_curve(c)
    cut = M['cut']
    pre = t < cut
    i_peak = int(np.where(pre)[0][-1])
    end_full = c['dur'] - c['fade_out']
    first_top = float(t[np.argmax(F >= 0.999)])
    xf = lambda tt: round(160 + 1600 * tt / c['dur'], 1)
    # 审片修改（画面 P0）：本片曲线画成 y 470 的一条横向光带，亮度和粗细随 F 变（用亮度不用高度，和 01 章同一个语法）
    yf = lambda v: 470.0
    out['film_curve'] = dict(first_top=round(first_top, 2),
                             peak=dict(t=round(float(t[i_peak]), 2), F=round(float(F[i_peak]), 4), x=xf(t[i_peak]), y=yf(F[i_peak])),
                             end=dict(t=round(end_full, 2), F=round(float(F[int(end_full * 1000) - 1]), 4), x=xf(end_full), y=yf(1.0)),
                             max=round(float(F.max()), 4))
    return out


if __name__ == '__main__':
    probs, gaps = check(SUBS, MARKS, DUR)
    print('dur', DUR, fmt(DUR), 'subs', len(SUBS))
    tot = sum(s['_n'] for s in SUBS)
    print('avg chars', round(tot / len(SUBS), 1), 'chars/min', round(tot / (DUR / 60), 1),
          'avg on-screen', round(sum(s['t1'] - s['t0'] for s in SUBS) / len(SUBS), 2),
          'min/max on-screen', min(s['t1'] - s['t0'] for s in SUBS), max(s['t1'] - s['t0'] for s in SUBS))
    for s in SUBS:
        print(f"{s['id']:>4} {fmt(s['t0'])}–{fmt(s['t1'])}  [{s['t0']:.2f}–{s['t1']:.2f}] ({s['t1']-s['t0']:.1f}s,{s['_n']}字) {s['zh']}")
    print('marks', {k: f'{fmt(v)} ({v})' for k, v in MARKS.items()})
    odd = [g for g in gaps if not (0.6 <= g[2] <= 1.2)]
    print('gaps outside 0.6–1.2:', odd)
    print('PROBLEMS:', probs or 'none')
    c = cue()
    print('sections', len(c['sections']), 'hits', len(c['hits']))
    for h in c['hits']:
        print('  hit', h)
    nums = numbers(c)
    print(json.dumps(nums, ensure_ascii=False, indent=None)[:6000])
    if '--write' in sys.argv:
        os.makedirs(OUT_PUB, exist_ok=True)
        with open(os.path.join(OUT_PUB, 'subs.json'), 'w', encoding='utf-8') as f:
            json.dump([{k: s[k] for k in ('t0', 't1', 'zh', 'en')} for s in SUBS], f, ensure_ascii=False, indent=1)
        with open(os.path.join(OUT_PUB, 'cue.json'), 'w', encoding='utf-8') as f:
            json.dump(c, f, ensure_ascii=False, indent=1)
        nums['marks'] = MARKS
        nums['dur'] = DUR
        with open(os.path.join(OUT_PUB, 'numbers.json'), 'w', encoding='utf-8') as f:
            json.dump(nums, f, ensure_ascii=False, indent=1)
        print('wrote', OUT_PUB)
