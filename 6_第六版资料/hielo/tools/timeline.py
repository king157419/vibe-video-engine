# 《多年以后》唯一的时间轴：字幕 + 画面锚点 → src/v4/hielo/data.gen.ts 和 public/v4/hielo/timeline.json
# 中文台词来自 DeepSeek（raw_deepseek.md，Kimi 返回 401），第 29 条按事实改过（1200 万是册数不是人数）。
# 规则（CONTRACT §0.5）：在屏 ≥ 字数/4 + 1.5 秒；句间 0.7 秒；pause 是没有字幕的画面段。
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
VE = os.path.normpath(os.path.join(HERE, '..', '..', '..', 'video-engine'))
BANNED = ['答案', '记住', '注意', '建议', '先选', '错在', '留个题', '作业', '正确', '知识点', '应该', '记得']

S = []
def sub(key, zh, en): S.append(('sub', key, zh, en))
def pause(key, d): S.append(('pause', key, d, None))

pause('type', 12.2)
sub('first', '这是《百年孤独》的第一句。', 'This is the first sentence of One Hundred Years of Solitude.')
pause('title', 5.6)
# 一 · 三个时间
sub('jump3', '刚才这一句，你脑子跳了三次。', 'Reading it just now, your mind jumped three times.')
sub('toSquad', '先到“多年以后”，再落进行刑队。', 'First to "many years later", then in front of a firing squad.')
sub('toNoon', '没站稳，又给拽回那个遥远的下午。', 'Before you found your feet, it dragged you back to a distant afternoon.')
sub('camus', '加缪的开头是：“今天，妈妈死了。”只有现在。', 'Camus opens with "Today, Mother died." Only the present.')
sub('three', '这一句里，挤了三个时间。', 'This one crams in three times.')
sub('verb', '“将会回想起”——“将会”是将来，“回想”是过去。', '"Would remember": "would" is the future, "remember" is the past.')
sub('prolep', '叙事学管这叫“预叙”：先把将来掀开一角。', 'Narratology calls it prolepsis: lifting a corner of the future.')
pause('ch2', 1.4)
# 二 · 桌子底下的炸弹
sub('bomb1', '希区柯克说：桌下有颗炸弹，观众不知道——', 'Hitchcock: a bomb under the table, and the audience doesn\'t know —')
sub('bomb2', '炸了，只有十五秒的惊吓。', 'it goes off: fifteen seconds of surprise.')
sub('bomb3', '观众先知道——每句闲聊都变成悬念。', 'Let them know first — and every bit of small talk becomes suspense.')
sub('bomb4', '十五秒的惊吓，换十五分钟的悬念。', 'Fifteen seconds of surprise, traded for fifteen minutes of suspense.')
sub('placed', '马尔克斯第一句，就把炸弹放好了：行刑队。', 'Márquez planted the bomb in sentence one: the firing squad.')
sub('ch7', '你揣着这排枪口往下读，一直到第七章。', 'You carry that row of rifles with you, all the way to chapter seven.')
sub('noshot', '反转来了：枪没响。', 'Then the twist: the guns don\'t fire.')
pause('hush', 3.0)
sub('lived', '他活了下来，一直活到老。', 'He survives, and lives to be an old man.')
pause('ch3', 1.4)
# 三 · 为什么是冰
sub('whyice', '站在枪口前，为什么想起一块冰？', 'Facing the rifles, why remember a block of ice?')
sub('tropic', '热带小镇，没有冰箱。冰，就是奇迹。', 'A tropical town, no refrigerators. Ice was a miracle.')
sub('grandpa', '马尔克斯小时候，外祖父真带他看过冰。', 'As a boy, Márquez really was taken to see ice by his grandfather.')
sub('true1', '他说：小说里只要有一件事是真的——', 'He said: if one single thing in a novel is true —')
sub('true2', '整本书就站得住。', 'the whole book stands.')
sub('grandma', '他学外祖母讲故事：多离奇，脸上没反应。', 'He told stories like his grandmother: however strange, her face never moved.')
pause('click', 3.6)
sub('deadpan', '这么一喊，就假了。他平平地说，你反而信。', 'Shout it, and it sounds fake. Say it flat, and you believe it.')
pause('ch4', 1.4)
# 四 · 第一句会传染
sub('bogota', '马尔克斯在波哥大读大学时，读到一句话。', 'As a student in Bogotá, Márquez read one sentence.')
sub('kafka', '卡夫卡的：一个人早上醒来，变成一只大甲虫。', 'Kafka\'s: a man wakes up one morning as a giant insect.')
sub('bed', '他说差点从床上被掀下来——原来小说还能这么写。', 'He said it nearly knocked him off the bed — so novels could do this.')
sub('twenty', '二十年后，他写出了自己的第一句。', 'Twenty years later, he wrote a first sentence of his own.')
sub('sold', '卡夫卡掀翻一个人。这个开头，中文版卖了一千两百万册。', 'Kafka knocked over one reader. This opening sold 12 million copies in Chinese.')
sub('pattern', '“多年以后”成了句式，谁都能往里填。', '"Many years later" became a template anyone can fill in.')
pause('memes', 9.0)
pause('ch5', 1.2)
# 五 · 收尾
sub('wall', '回到那面墙前：枪口底下，他想起的不是战事。', 'Back at that wall: under the rifles, he didn\'t think of the war.')
sub('iceagain', '他想起的，是一块冰。', 'He thought of a block of ice.')
sub('memoir', '马尔克斯在自传里说过一句话：', 'In his memoir, Márquez wrote:')
pause('quote', 12.5)
sub('yours', '现在，这个空是你的了。', 'Now the blank is yours.')
pause('blank', 8.0)
sub('closing', '你脑子里，已经有一句在冒头了吧？', 'Isn\'t a sentence already rising in your head?')
pause('tail', 4.0)

def nchars(s): return len(re.findall(r'[\u4e00-\u9fff]|[0-9A-Za-z]+', s))

t = 0.0; subs = []; T = {}; last_sub = False; problems = []
for kind, key, a, b in S:
    if kind == 'sub':
        if last_sub: t += 0.7
        d = max(3.2, nchars(a) / 4 + 1.5)
        if d > 8.5: problems.append(f'{key} 太长 {d:.1f}s')
        for w in BANNED:
            if w in a: problems.append(f'{key} 含禁用词 {w}')
        T[key] = round(t, 3); T[key + '_end'] = round(t + d, 3)
        subs.append(dict(t0=round(t, 3), t1=round(t + d, 3), zh=a, en=b, key=key))
        t += d; last_sub = True
    else:
        if last_sub: t += 0.5
        T[key] = round(t, 3); T[key + '_end'] = round(t + a, 3)
        t += a; last_sub = False
DUR = round(t, 3)
T['dur'] = DUR

# 打字段：画面逐字打出、配乐每个中文字一个音，都从这里读
def tw(t0, cps, lines): return dict(t0=round(t0, 3), cps=cps, lines=lines, t1=round(t0 + sum(len(l) for l in lines) / cps, 3))
TYPE = dict(
    proZh=tw(-0.5, 4.15, ['多年以后，面对行刑队，', '奥雷里亚诺·布恩迪亚上校将会回想起', '父亲带他去见识冰块的那个遥远的下午。']),
    proEs=tw(-0.25, 15.6, ['Muchos años después, frente al pelotón de fusilamiento,', 'el coronel Aureliano Buendía había de recordar aquella tarde remota', 'en que su padre lo llevó a conocer el hielo.']),
    camusFr=tw(T['camus'] + 0.4, 16, ["Aujourd'hui, maman est morte."]),
    camusZh=tw(T['camus'] + 0.9, 7, ['今天，妈妈死了。']),
    verbEs=tw(T['verb'] + 0.8, 12, ['había de recordar']),
    kafkaDe=tw(T['bogota'] + 1.0, 15, ['Als Gregor Samsa eines Morgens', 'aus unruhigen Träumen erwachte …']),
    deadpan=tw(T['deadpan'] + 0.2, 9, ['多年以后，面对行刑队，……']),
    pattern=tw(T['pattern'] + 0.6, 5, ['多年以后，']),
    meme1=tw(T['memes'] + 0.1, 15, ['多年以后，面对体检报告，', '我将会回想起把“再玩五分钟”当真的那个遥远的下午。']),
    meme2=tw(T['memes'] + 3.0, 15, ['多年以后，面对老板画的饼，', '我将会回想起软件闪退前一秒没点保存的那个下午。']),
    meme3=tw(T['memes'] + 5.9, 15, ['多年以后，面对健身房的镜子，', '我将会回想起办卡时说“这次肯定能瘦”的那个下午。']),
    quoteEs=tw(T['quote'] + 0.3, 17, ['La vida no es la que uno vivió, sino la que uno recuerda', 'y cómo la recuerda para contarla.']),
    quoteZh=tw(T['quote'] + 1.2, 4.2, ['生活不是我们活过的日子，而是我们记住的日子，', '我们为了讲述而在记忆中重现的日子。']),
    blank=tw(T['blank'] + 0.3, 7, ['多年以后，面对　　　　　　，', '你将会回想起　　　　　　那个遥远的下午。']),
)
# 叮和点位：每一个都对着画面上一个看得见的重点
EV = dict(
    titleHit=T['title'] + 2.0,
    landF=T['toSquad'] + 1.0, landP=T['toNoon'] + 1.4, three=T['three'] + 0.4,
    flash15s=T['bomb2'] + 0.25, ding15m=T['bomb4'] + 0.7,
    page7=T['ch7'] + 3.4, hush=T['hush'], hushEnd=T['hush'] + 2.9,
    iceReveal=T['grandpa'] + 0.3, trueIgnite=T['true2'] + 0.15, grandmaReveal=T['grandma'] + 0.2,
    clickIn=T['click'] + 0.1, bedFlip=T['bed'] + 1.0, spectacle=T['sold'] + 0.5,
    quoteDone=TYPE['quoteZh']['t1'], finalGlint=T['tail'] + 0.6,
)
EV = {k: round(v, 3) for k, v in EV.items()}
if problems: print('\n'.join(problems)); sys.exit(1)

src = os.path.join(VE, 'src', 'v4', 'hielo', 'data.gen.ts')
with open(src, 'w', encoding='utf-8') as f:
    f.write('// 由 6_第六版资料/hielo/tools/timeline.py 生成，不要手改\n')
    f.write(f'export const DUR = {DUR};\n')
    f.write('export const SUBS: {t0: number; t1: number; zh: string; en: string; key: string}[] = ' + json.dumps(subs, ensure_ascii=False) + ';\n')
    f.write('export const T: Record<string, number> = ' + json.dumps(T, ensure_ascii=False) + ';\n')
    f.write('export type TW = {t0: number; t1: number; cps: number; lines: string[]};\n')
    f.write('export const TYPE: Record<string, TW> = ' + json.dumps(TYPE, ensure_ascii=False) + ';\n')
    f.write('export const EV: Record<string, number> = ' + json.dumps(EV, ensure_ascii=False) + ';\n')
pub = os.path.join(VE, 'public', 'v4', 'hielo'); os.makedirs(pub, exist_ok=True)
json.dump(dict(dur=DUR, T=T, subs=subs, TYPE=TYPE, EV=EV), open(os.path.join(pub, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in TYPE.items(): print('type', k, v['t0'], '->', v['t1'])
print('DUR', DUR, f'{int(DUR // 60)}:{DUR % 60:04.1f}', 'subs', len(subs))
for k in ['first', 'title', 'jump3', 'ch2', 'hush', 'ch3', 'click', 'ch4', 'memes', 'ch5', 'quote', 'blank', 'tail']: print(k, T[k])
