"""Single source for Baobao dialogue, scenes, music cues and production notes."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[3]
DOC = ROOT / '5_第五版资料/baobao'
PUB = ROOT / 'video-engine/public/v4/baobao'
FPS = 30
rows = []
chapters = []
beats = []
clock = 0.

def pause(seconds, why):
    global clock
    beats.append({'t0': round(clock, 3), 't1': round(clock + seconds, 3), 'why': why})
    clock += seconds

def chapter(zh, en):
    chapters.append({'t': round(clock, 3), 'num': str(len(chapters) + 1).zfill(2), 'zh': zh, 'en': en})

def sub(key, zh, en, scene, gap=.8):
    global clock
    count = len(re.findall(r'[\u4e00-\u9fffA-Za-z0-9]', zh))
    duration = round(max(4., count / 4 + 1.5) + .35, 2)
    rows.append({'key': key, 't0': round(clock, 3), 't1': round(clock + duration, 3), 'zh': zh, 'en': en, 'scene': scene})
    clock += duration
    pause(gap, '提问后给目光停留' if gap == 2 else '句间呼吸')

sub('faces', '两张脸，你的目光先停在哪张？', 'Two faces. Which catches your eye first?', '左右两张光点脸；右脸额头更大、双眼更低更圆。第0帧主角和本句均已亮；6秒内眨眼。', 2)
sub('soft', '圆脸和大眼，可能让你想照顾它。', 'A round face and big eyes may stir a wish to care.', '右脸在原位置柔和呼吸；左脸维持成人比例，不以亮暗诱导选择。')
pause(2.25, '开场两脸保持呼吸，给第二句消化时间；片名精确后置到15秒')
TITLE = round(clock, 3)
pause(7., '脸的光点收向中央，聚成片名；片名卡无字幕')
chapter('按钮', 'THE CUE')
sub('schema', '洛伦兹给这些特征起了个名字：', 'Lorenz gave this pattern a name:', '两脸轮廓重现，前额和眼部沿同一条光线轻轻变形。')
sub('name', '娃娃脸图式，把照顾的愿望唤起来。', 'Baby schema: features that can invite care.', '一个发光脸轮廓，圆脸与眼睛光点由原位置汇聚。')
sub('voice', '和婴儿说话，声音常会放慢、抬高。', 'With infants, voices often slow down and rise.', '脸的下沿变成舒展的双弧声线；仅示意音调，无婴儿录音。')
sub('not_same', '恋人叫宝宝，也借用了婴儿的称呼。', 'Calling a partner “baby” borrows an infant’s name.', '声线变成两颗相向的暖光，词“宝宝”在两光之间出现。')
pause(1., '章间压暗；一条声线保留并变成连接')
chapter('借用', 'BORROWING')
sub('attachment', '亲近的人，也是你慌张时想找的人。', 'The person you love may also be the one you seek when afraid.', '一颗光在外界细线中偏移，另一颗光靠近，连接绷紧后放松。')
sub('hazan', '依恋理论，也被用来理解成年爱情。', 'Attachment theory has also been used to understand adult love.', '两颗光之间的同一根线，收拢成安全的环。')
sub('regress', '恋爱里的退行，常被说成变回小孩。', 'In romance, “regression” is often described as becoming childlike.', '成年脸的细线在同一位置变回圆脸，保留一颗眼光。')
sub('no_diagnosis', '可一句撒娇，不等于心理出了毛病。', 'But a playful plea is no diagnosis.', '圆脸不打标签，外侧刚出现的方框化成流尘。')
sub('loan', '你借回的，可能是一种被照顾的方式。', 'What returns may be a way of being cared for.', '安全环的端点回到两颗暖光，相向靠近。')
pause(1., '章间暗场；环的两端变成对话两端')
chapter('暗号', 'A PRIVATE LANGUAGE')
sub('idiom', '情侣还会造出，只有两个人懂的叫法。', 'Couples also invent names only the two of them understand.', '两颗光交替送出短线，短线缠绕成为一个发光结。')
sub('small', '外人听着肉麻，两个人听着像回家。', 'Awkward to an outsider; familiar to the two who share it.', '外侧的暗点散开，两端沿原线靠拢；不画第三人角色。')
sub('survey', '一项初步问卷研究发现：', 'An initial questionnaire study found:', '光结变成微小点形成的环；仅画示意，不报只在二手摘要读到的样本数。')
sub('association', '说婴语的人，依恋倾向于更安全。', 'Baby-talk users tended to report more secure attachment.', '环展开两道光弧并行，仅示意关联；没有因果箭头。')
sub('causation', '这只是相关，不是说了就更相爱。', 'An association—not proof that baby talk makes love stronger.', '并行两弧分开，各自维持光亮，连接不强制生成。')
pause(1., '章间暗场；两弧向两侧外部支点展开')
chapter('说出口', 'SAYING IT ALOUD')
sub('older', '有些八零后，连亲爱的也叫不出口。', 'Some people born in the 1980s find even “darling” hard to say.', '两端光保持距离，中央留空；来自用户访谈线索，不作比例图。')
sub('roles', '一种社会学看法，把目光放在关系上。', 'One sociological view looks at how relationships are held together.', '两颗暖光的连接被外部三处冷光支撑；只有一张结构。')
sub('sociologist', '吉登斯谈到，关系本身也成了理由。', 'For Giddens, the relationship itself can become a reason to stay.', '外部支点向两颗光之间的连线汇聚；不把理论当全国实测。')
sub('giddens', '家族、孩子、日子，都能把两个人系住。', 'Family, children and shared routines can help hold a couple together.', '三条支撑线依次牵住中间关系线；不出现社会必然阶段箭头。')
sub('feelings', '当关系更看重，两个人自己的感受——', 'As a relationship rests more on how its partners feel—', '三处支撑变淡，两颗光的连接仍在；主角没有坠落。')
sub('confirm', '爱，也就更需要说出来、再确认。', 'Love may need to be spoken and affirmed more often.', '两光交替将脉冲送进同一条线，线从自己内部亮起。')
sub('yan', '阎云翔在下岬村，听到年轻人的变化。', 'In Xiajia village, Yan Yunxiang heard a change among the young.', '一条暖光缓缓展开，光结沿线移动；无全国地图或人群比例。')
sub('village', '她们开始希望，对方能把感情说出来。', 'Some young women wanted a partner who could express his feelings.', '两颗光之间那段沉默的空白，被来回的暖脉冲填满。')
sub('less', '叫不出口，不等于爱得更少。', 'Finding the words hard does not mean loving less.', '原本沉默的两光回归，用靠近和一条稳定暖线回应。')
pause(1., '章间压暗；关系线上的亮点化为一个宝字')
chapter('谁的宝', 'WHEN EVERYONE SAYS IT')
sub('shop', '可今天，客服也能喊你一声亲。', 'Today, a shop assistant can call you “dear”, too.', '一个“亲”字在光点旁出现，随后变成“宝”；非聊天气泡。')
sub('public', '一个宝字，从两个人走进了人群。', 'A private “baby” can travel into a crowd.', '中心“宝”字分裂为同样的字，沿光的弧线散开。')
sub('spread', '同一个称呼，落在了无数陌生人身上。', 'The same endearment reaches countless strangers.', '单字群逐渐铺满中上画幅，最多2400个细小发光宝字。')
sub('not_bad', '称呼越常见，越难认出它只属于谁。', 'The more common a name, the less it singles someone out.', '字群数量增加，单字亮度降低；这是视觉比喻，不造理论名。')
sub('cutline', '当所有人都喊你宝——', 'When everyone calls you “baby”—', '字群在本句结束后达到满屏最亮；随后同一帧清场只剩一个字。', .8)
SILENCE = [round(clock, 3), round(clock + 3., 3)]
pause(3., '全片硬静音，2400字同步熄灭，留一个宝；尘埃持续漂动')
chapter('回到你', 'JUST BETWEEN YOU')
sub('one', '你想听的，可能只是某一个人的声音。', 'Perhaps you want to hear it from one particular person.', '仅一枚“宝”字缓慢呼吸，左右两颗暖光从远处回来。')
sub('laozi', '老子写过：常德不离，复归于婴儿。', 'The Laozi speaks of returning to the state of an infant.', '宝字的光点回到两张脸，不把古文当心理实验结论。')
sub('scope', '这句话说的，是比恋爱更大的事。', 'That thought reaches well beyond romantic love.', '两张脸的外圈淡出，只余一条开放的光弧。')
sub('permission', '在一个人面前，你可以暂时卸下大人。', 'With someone you trust, you may set adulthood down for a moment.', '两颗光逐渐靠近，成人轮廓与圆脸轮廓互相形变。')
sub('return', '让你放松的，是称呼背后的那个人。', 'It is the person behind the name who lets you breathe.', '恢复开头两脸同位置同亮度；它们一起温和呼吸。')
END_TITLE = round(clock, 3)
pause(4., '回环片名，保留脸的眼光作为片名下横线')
MARK = round(clock, 3)
pause(2., '只有一行小号Opus 5.5；画面主体已退场')
DUR = round(clock * FPS) / FPS
BY_KEY = {r['key']: r for r in rows}
HITS = [
    (TITLE, 'boom', '两脸开始向片名聚拢'),
    (TITLE + .6, 'bell', '片名成为可读的宝宝'),
    (BY_KEY['name']['t0'] + .5, 'bell', '娃娃脸眼部亮起'),
    (BY_KEY['loan']['t0'] + .5, 'bell', '安全环端点落回两光'),
    (BY_KEY['survey']['t0'] + .5, 'bell', '光结展开成示意点环'),
    (BY_KEY['confirm']['t0'] + .5, 'bell', '关系从内部亮起'),
    (BY_KEY['public']['t0'] + .5, 'bell', '一字开始分身'),
    (SILENCE[0], 'riser', '满屏字群抵达顶点后熄灭'),
    (rows[-1]['t0'] + .5, 'bell', '开头两脸回到原位'),
]

def main():
    PUB.mkdir(parents=True, exist_ok=True)
    problems = []
    banned = ['答案', '记住', '注意', '建议', '先选', '错在', '作业', '正确', '知识点', '应该', '记得']
    for row in rows:
        n = len(re.findall(r'[\u4e00-\u9fffA-Za-z0-9]', row['zh']))
        d = row['t1'] - row['t0']
        if not (4 <= d <= 8 and d >= n / 4 + 1.5 - .01): problems.append(row['key'] + ' duration')
        if any(x in row['zh'] for x in banned): problems.append(row['key'] + ' banned')
    assert 220 <= DUR <= 260, DUR
    assert len(chapters) == 6
    assert len(HITS) <= 15
    assert not problems, problems
    def section(a, b, intensity, chords, piano='motif', low=.5):
        return {'t0': a, 't1': b, 'chords': chords, 'piano': piano, 'bars_per_chord': 2, 'layers': {'piano': .65, 'pad': .42, 'low': low, 'pulse': .12}, 'intensity': intensity, 'register': -1, 'velocity': .48}
    cue = {'dur': DUR, 'key': 'F', 'mode': 'lydian', 'seed': 1026, 'bpm': 68, 'rt60': 3.4, 'ramp': 1.2, 'fade_in': .05, 'fade_out': 2., 'motif': [[0, 1], [2, 1], [4, 2], [2, 2]], 'silences': [SILENCE], 'sections': [
        section(0, TITLE, .62, ['I', 'vi']), section(TITLE, chapters[0]['t'], .95, ['IV', 'I']),
        section(chapters[0]['t'], chapters[1]['t'], .56, ['I', 'V']), section(chapters[1]['t'], chapters[2]['t'], .40, ['vi', 'IV'], low=.38),
        section(chapters[2]['t'], chapters[3]['t'], .62, ['IV', 'I']), section(chapters[3]['t'], chapters[4]['t'], .76, ['vi', 'IV', 'I', 'V']),
        section(chapters[4]['t'], SILENCE[0], .96, ['IV', 'V', 'I'], 'arp'), section(SILENCE[0], SILENCE[1], .4, ['I']),
        section(SILENCE[1], rows[-2]['t0'], .65, ['vi', 'IV']), section(rows[-2]['t0'], DUR, 1., ['IV', 'I'], low=.65)
    ], 'hits': [{'t': t, 'type': typ, 'gain': .4 if typ == 'boom' else .24, 'deg': 0, 'len': 2., 'note': note} for t, typ, note in HITS]}
    meta = {'fps': FPS, 'dur': DUR, 'title': TITLE, 'end_title': END_TITLE, 'mark': MARK, 'chapters': chapters, 'silence': SILENCE, 'time_map': [[0, 0], [DUR, DUR]], 'beats': beats, 'hits': HITS, 'rows': rows}
    for name, data in [('subs.json', [{k: r[k] for k in ('t0', 't1', 'zh', 'en')} for r in rows]), ('cue.json', cue), ('timeline_meta.json', meta)]:
        (PUB / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# A《宝宝》剧本（V4Baobao）', '', '> 中文：Codex。DeepSeek两个models入口401，按执行计划兜底。生成脚本是本文件的唯一时间来源；修改台词须改tools/timeline.py后重跑。', '',
        f'片长 {DUR:.2f}秒，{round(DUR*FPS)}帧；6章，{len(rows)}句。片名卡{TITLE:.2f}–{chapters[0]["t"]:.2f}秒。学名：娃娃脸图式 · 洛伦兹 · 1943。', '',
        '开头选择：两脸同亮度即时凝视体验。备选：宝宝大字配“看到这两个字，你觉得甜，还是起鸡皮疙瘩？”。后者容易只剩问句，选前者；不假定人人都心软，不将脸实验等同昵称实验。', '',
        '概念阶梯：视觉线索 → 成人依恋的借用 → 私人惯用语 → 关系的社会支撑与表达 → 称呼泛用的反转 → 回到具体的人。', '',
        '社会学解释为理论视角；80后一句来自用户访谈，没有全国比例。删鸟和亲吻起源支线，避免跨物种结论替人类动机作证；不借催产素解释。', '',
        '颜色：暖金=照顾和两人关系；青白=外部角色支撑；暗蓝=背景。多数帧非字幕汉字不超过8个，片名卡学名行单独例外（不足20字）。同屏独立元素不超过6个；字群是唯一一次满屏奇观。', '',
        '形变：两脸→片名；脸下沿→声线；声线→安全环；光结→示意点环；外部支撑→内部脉冲；宝字→开头两脸。', '',
        f'硬静音 {SILENCE[0]:.2f}–{SILENCE[1]:.2f}秒，满3秒。字幕破折号后清场保留一个“宝”，尘埃持续漂动。最后2秒只有Opus 5.5。', '',
        '文化引用：《老子》第二十八章“常德不离，复归于婴儿”；古文谈生命状态，片中明确不当作爱情实验。引用原文逐字核对记录由独立研究写入事实核查。', '',
        '## 逐句分镜', '', '|秒数|中文|英文|画面|', '|---|---|---|---|']
    lines += [f'|{r["t0"]:.2f}–{r["t1"]:.2f}|{r["zh"]}|{r["en"]}|{r["scene"]}|' for r in rows]
    lines += ['', '## 章节', '', '|秒数|章|英文|', '|---|---|---|'] + [f'|{c["t"]:.2f}|{c["num"]} {c["zh"]}|{c["en"]}|' for c in chapters]
    lines += ['', '## 点位声与画面', '', '|秒数|声音|可见重点|', '|---|---|---|'] + [f'|{t:.2f}|{typ}|{note}|' for t, typ, note in HITS]
    lines += ['', '## 自查', '', '字幕全部满足4–8秒及中文字数/4+1.5；禁用教学词0次；所有长留白写入meta.beats。不开场黑屏，无旁白，无沙沙声；片名约15秒后置；所有数码为单一生成来源。独立审稿通过后才进入制作。']
    (DOC / '剧本.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'duration': DUR, 'frames': round(DUR*FPS), 'lines': len(rows), 'title': TITLE, 'silence': SILENCE, 'chapters': chapters, 'problems': problems}, ensure_ascii=False, indent=2))

if __name__ == '__main__': main()

