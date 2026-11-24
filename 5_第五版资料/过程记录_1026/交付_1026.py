"""Assemble reviewed films and produce deterministic local delivery evidence.

Does not publish, send mail, install dependencies or change production sources.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
VE = ROOT / 'video-engine'
DEST = ROOT / '成片/5_第五版_vibe知识大赏'
FILMS = {
    'A': {'slug': 'baobao', 'title': '宝宝', 'branch': '', 'cover_s': 18, 'input': 'final_reviewfix.mp4'},
    'B': {'slug': 'starry', 'title': '星空的风', 'branch': 'native', 'cover_s': 18},
    'C': {'slug': 'lanchester', 'title': '五打四', 'branch': 'native', 'cover_s': 19, 'input': 'final_cloud.mp4'},
}

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while block := f.read(1024 * 1024): h.update(block)
    return h.hexdigest()

def ffprobe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)]))

def run(args, log):
    with log.open('w', encoding='utf-8') as f:
        subprocess.run(args, stdout=f, stderr=subprocess.STDOUT, check=True)

def protect_copy(src, dst):
    if dst.exists() and digest(src) == digest(dst): return
    if dst.exists():
        archive = dst.parent / '旧版_1026'
        archive.mkdir(parents=True, exist_ok=True)
        target = archive / dst.name
        if target.exists() and digest(target) != digest(dst):
            target = archive / (dst.stem + '_' + digest(dst)[:8] + dst.suffix)
        if not target.exists(): shutil.copy2(dst, target)
    shutil.copy2(src, dst)

def process(letter, preview=False, deliver=False):
    film = FILMS[letter]
    slug, branch, title = film['slug'], film['branch'], film['title']
    out = VE / 'out/v4' / slug / branch
    doc = ROOT / '5_第五版资料' / slug / branch
    src = out / film.get('input', 'final.mp4')
    assert src.exists(), src
    meta = ffprobe(src)
    video = next(s for s in meta['streams'] if s['codec_type'] == 'video')
    assert (video['width'], video['height'], video['codec_name'], video['r_frame_rate']) == (1920, 1080, 'h264', '30/1')
    duration = float(video['duration'])
    phone = out / 'phone.mp4'
    if preview:
        # 25 MiB target, audio included, two real x264 passes.
        kbps = int(25 * 1024 * 1024 * 8 / duration / 1000 - 96)
        logbase = Path('D:/tmp') / ('v5preview_' + slug)
        common = ['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y', '-i', str(src), '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'slow', '-threads', '2', '-b:v', f'{kbps}k', '-passlogfile', str(logbase)]
        run(common + ['-pass', '1', '-an', '-f', 'null', 'NUL'], out / 'preview_pass1.log')
        run(common + ['-pass', '2', '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-movflags', '+faststart', str(phone)], out / 'preview_pass2.log')
        assert abs(float(ffprobe(phone)['format']['duration']) - duration) < .15
        (out / 'preview_binding.json').write_text(json.dumps({'source_sha256': digest(src), 'preview_sha256': digest(phone), 'duration': duration}, indent=2), encoding='utf-8')
        for path in logbase.parent.glob(logbase.name + '-0.log*'):
            assert path.resolve().parent == Path('D:/tmp').resolve()
            path.unlink()
    if deliver:
        audit = doc / '独立审片记录.md'
        assert audit.exists(), audit
        audit_text = audit.read_text(encoding='utf-8')
        assert 'PASS' in audit_text and digest(src) in audit_text.lower(), 'Independent verdict must name this exact final SHA256'
        DEST.mkdir(parents=True, exist_ok=True)
        (DEST / '手机预览').mkdir(exist_ok=True)
        dst = DEST / f'{letter}_{title}.mp4'
        protect_copy(src, dst)
        assert digest(src) == digest(dst)
        assert phone.exists(), phone
        phone_probe = ffprobe(phone)
        phone_video = next(s for s in phone_probe['streams'] if s['codec_type'] == 'video')
        assert (phone_video['width'], phone_video['height']) == (1280, 720)
        assert abs(float(phone_probe['format']['duration']) - duration) < .15
        protect_copy(phone, DEST / '手机预览' / f'{letter}_{title}_手机预览.mp4')
        cover = out / 'cover_delivery.png'
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(film['cover_s']), '-i', str(src), '-frames:v', '1', str(cover)], out / 'cover_delivery.log')
        protect_copy(cover, DEST / f'{letter}_{title}_封面.png')
        protect_copy(doc / '发布文案.md', DEST / f'{letter}_{title}_发布文案.md')
        return {'letter': letter, 'title': title, 'duration': duration, 'frames': video.get('nb_frames'), 'bytes': src.stat().st_size, 'preview_bytes': phone.stat().st_size, 'sha256': digest(dst), 'production': str(src), 'delivery': str(dst), 'source': str(doc), 'probe': meta}
    return {'film': letter, 'duration': duration, 'preview': str(phone), 'preview_ready': phone.exists()}

def write_docs():
    data = json.loads((DEST / '交付校验.json').read_text(encoding='utf-8'))
    assert set(data) == {'A', 'B', 'C'}, 'Three reviewed films required'
    table = []
    qa_rows = []
    for letter, item in sorted(data.items()):
        seconds = item['duration']
        length = f'{int(seconds)//60}:{seconds%60:05.2f}'
        table.append(f'|{letter}_{item["title"]}.mp4|{length}|{item["frames"]}|{item["bytes"]/1048576:.1f} MB|{item["preview_bytes"]/1048576:.1f} MB|')
        output = Path(item['production']).parent
        candidates = []
        for path in output.rglob('metrics.json'):
            measurement = json.loads(path.read_text(encoding='utf-8'))
            measured_name = str(measurement.get('video', '')).replace('\\', '/').split('/')[-1]
            if measured_name == Path(item['production']).name:
                candidates.append((path, measurement))
        assert candidates, output
        candidates.sort(key=lambda pair: pair[0].stat().st_mtime, reverse=True)
        metrics = candidates[0][1]
        assert not metrics.get('freezes_over_8s'), metrics
        assert 8 <= metrics['lum_mean'] <= 15 and metrics['edge_mean_pct'] <= 4
        item['quality'] = metrics
        item['quality_evidence'] = str(candidates[0][0])
        qa_rows.append(f'|{item["title"]}|{metrics["lum_mean"]}|{metrics["edge_mean_pct"]}%|{metrics["loudness_I"]}|{metrics["loudness_LRA"]}|{metrics["true_peak"]}|')
    backup = ROOT / '5_第五版资料/旧版_1026'
    backup.mkdir(exist_ok=True)
    for old_path in [ROOT / 'README.md', ROOT / '成片/成片目录.md', ROOT / '4_第四版资料/片单.md']:
        old_copy = backup / old_path.name
        if not old_copy.exists(): shutil.copy2(old_path, old_copy)
    for letter in ('B', 'C'):
        chosen = Path(data[letter]['source'])
        parent = chosen.parent
        original = parent / '旧版_1026'
        original.mkdir(exist_ok=True)
        for name in ['剧本.md', '事实核查.md', '审稿记录.md', '自检记录.md', '发布文案.md', '独立审片记录.md']:
            src = chosen / name
            if not src.exists(): continue
            dst = parent / name
            if dst.exists():
                old_copy = original / name
                if not old_copy.exists(): shutil.copy2(dst, old_copy)
            note = f'> 本批最终采用native隔离版；唯一生成器与原始记录在native子目录，详情见../最终采用版本.md。以下内容同步自native/{name}。\n\n'
            dst.write_text(note + src.read_text(encoding='utf-8'), encoding='utf-8')
    description = '''# 第五版交付：宝宝、星空的风、五打四

三部1080p横屏成片、封面、发布文案、720p手机预览均在本目录。**请开着声音看**；没有旁白，配乐是叙事的一部分。

|文件|片长|帧数|原版|手机预览|
|---|---|---|---|---|
''' + '\n'.join(table) + '''

规格：1920×1080、30fps、H.264、yuv420p、BT.709电视范围；AAC 48kHz约320k。手机预览1280×720，用两遍x264压到约25MB，AAC96k。原版拷贝SHA256逐字节比对通过，见交付校验.json。

## 这次11条改进怎么落在画面里

|要求|落实位置与行为|
|---|---|
|第0帧与前5秒|宝宝两脸与问句已亮；星空已有奶光旋涡；五打四五金四蓝与问句已亮，随即连续损耗演示。没有黑屏等开场。|
|讲机制再举例|宝宝从脸部线索、依恋、私人语言走到表达与社会支撑；星空先演大涡传小涡再讲亮度谱；五打四先火力损失反馈，再分开连续/随机模型。|
|数字对比|星空1889与1941相差52年；五打四25对16差9、开根号3，再对比窄口线性5−4=1；随机胜率不冒充游戏统计。|
|回提时重现|宝宝结尾回到原位两脸；星空反复拉回咖啡和星夜；五打四每次讲人数都把两队重新带回。|
|故意中断标点|宝宝“当所有人都喊你宝——”使用破折号后清场。|
|震撼后3秒静音|宝宝3:14.70–3:17.70、星空2:57–3:00、五打四2:16.50–2:19.50；画面同步清场或压暗，尘埃继续漂。|
|每声叮有重点|三片点位分别9、10、10个，均少于15；逐bell全尺寸抽帧在各片采用版输出hit_frames或审片输出目录，无铅笔声、无持续绘画音效。|
|文化引用|宝宝《老子》第二十八章；星空《庄子·齐物论》；五打四《孙子·虚实》。逐字核原文，只有繁简转换，不当作现代实验的证据。|
|署名|每片最后2秒只有极小Opus 5.5；简介按用户指定署名。实际中文作者及工具兜底见下文。|
|标题两版|每份发布文案都给系列前缀版与热词一句话版，话题另列，不在标题揭晓结论。|
|参考印样|各片最终qa里的vs_reference.jpg已由制作外的新代理亲眼对照：暗底、发光主角、衬线双语、章节、无旁白、回环。|

## 开声音重点听这里

- 《宝宝》0:15–0:16：两脸收成片名与重击/钟声；3:14.70音乐切断整3秒，满屏“宝”收成一个；3:42.80回到两张脸。
- 《星空的风》0:15片名重击；2:57–3:00孤星与静音；3:52报价出现的柔钟。
- 《五打四》0:18片名重击；0:40.40蓝方火力下降的钟声；2:16.50–2:19.50窄口与静音；2:45.80第五颗金光回归。

数值检查不等于试听，**声音好不好听、是否刺耳，尚无人亲耳验过**。请用手机外放及耳机各听一次。

## 最终数值检查

|片|平均亮度/255|细节密度|响度LUFS|LRA/LU|真峰值dBTP|
|---|---|---|---|---|---|
''' + '\n'.join(qa_rows) + '''

三片两遍loudnorm第二遍均linear，最终stutter FREEZE均0，无8秒以上静止；计划内静音及切入/恢复POP在各片自检记录和独立审片记录逐项解释。最终结果以交付校验JSON和独立审片记录的文件哈希为准。

保留的非阻断观感建议：星空2:09.8钟声响时谱线仍在生长，3:28钟声先落在花心、完整树稍后长成；两处都有可见落点，独立审片未列为P1。

## 事实边界与自行决定

宝宝用两脸开头，未采用大字“宝宝”甜或肉麻的备选；片名卡用“娃娃脸图式 · 洛伦兹 · 1943”。“有些八零后”来自用户交流线索，没编全国比例；社会学是解释视角，没说现代关系只靠嘴；删除接吻唯一亲子起源、最早发音因果和催产素支线，初步婴语问卷不报仅二手读到的126人数。

三片中文由Codex写作；指定DeepSeek中转HTTPS和HTTP模型列表均401，证据baobao/DeepSeek连通记录.json。按用户授权自行定稿，片内Opus 5.5保留为用户要求的作品署名。三个题按计划选宝宝、梵高与游戏平方律，未改成新题。宝宝未核到两周新梗，按常青题；S16最新战况不嵌进片内，避免交付后马上过期。

## 梵高片如何换成交价

目前片尾是“媒体估价约1.8亿美元”，不是成交价。苏富比官网估价栏为Upon Request；数字归因10月23日The Art Newspaper报道。纽约场次11月18日23:00GMT开场，对应北京11月19日07:00，不是本件准确落槌时刻。研究湍流的是《星月夜》，拍卖的是《盛放的栗树》。

结果出来后请把苏富比成交页交给制作代理，核清含佣金口径后改唯一生成器里的报价字段；只渲232–242秒300帧片尾，前232秒复用，整条mix.wav保持原样重新封装。逐条命令与拼接边界见D:/desk/claudex/24/5_第五版资料/starry/native/片尾替换.md。新片还须核7260帧/242秒、最后2秒署名、音轨与全片卡顿，不能直接在非关键帧处copy裁切。

## 制作、独立核查与剩余限制

剧本和事实记录、至少两轮实际画面修改、visual-verdict迭代及工具自检均已保留。审稿人未参与写稿制作；终片审片另由未参与制作的新代理执行，发现的问题修后复审，不以作者自检替代。

源码、剧本、事实核查、独立记录的唯一采用路径见D:/desk/claudex/24/5_第五版资料/最终采用版本.md。B/C采用native隔离目录；并发产生的其他稿和片均已保留，不能混用其生成器与本片JSON。

已知限制：声音尚未亲听；开头能否提高留存、选题能否增粉，需要发布后数据，不能由本地质检证明。未发布、未登录、未发邮件；邮箱未配置，汇报只在本机。部分已确认属于本片的D盘临时缓存删除被自动审批拒绝，工具仅返回blocked by policy，已保留，未绕过，不影响成片。
'''
    (DEST / '交付说明.md').write_text(description, encoding='utf-8')
    (DEST / '交付校验.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    a_doc = ROOT / '5_第五版资料/baobao/自检记录.md'
    a_quality = data['A']['quality']
    a_note = f'''

## 最终采用版：精确钟声修正后的终片

当前唯一交付源：video-engine/out/v4/baobao/final_reviewfix.mp4；SHA256 {data['A']['sha256']}。
源码与台词唯一生成器tools/timeline.py，234.4667秒7034帧35句6章；片名15秒，194.7–197.7整3秒静音。制作详细迭代及三次亲眼复看见执行日志_接续.md与out/visual_st1/2/3.json；精确钟声修正见visual_st4_exact.json。首版终片被独立审片抓到92.1667、171.6秒两处光晕落空，已改为同帧实际轮廓/字形坐标，两处先用精确帧复审通过，再重渲全片。

最终渲染由交付会话运行：原入口V4Baobao、--concurrency=5 --muted，输出final_reviewfix_render.mp4；ffmpeg整条mix.wav重新封装AAC320k/48k，不加-shortest。没有改台词/cue/music/mix。全局tsc0错，源码确定性，kit/Root公共注册/package未改，未安装依赖。

最终实测：平均亮度{a_quality['lum_mean']}、细节{a_quality['edge_mean_pct']}%、8秒静止空、FREEZE0；I{a_quality['loudness_I']} LUFS/LRA{a_quality['loudness_LRA']}/TP{a_quality['true_peak']}。独立审片人independent_film_a未参与本批研究写稿或制作，亲跑工具、全部精确bell帧、文化引用和首尾回环，按新SHA放行，详独立审片记录.md与qa_independent_a/primary_session/round2/。声音无人亲听，仍请按交付说明时间点验收。
'''
    if not a_doc.exists(): a_doc.write_text('# 《宝宝》制作自检\n', encoding='utf-8')
    if data['A']['sha256'] not in a_doc.read_text(encoding='utf-8'):
        with a_doc.open('a', encoding='utf-8') as f: f.write(a_note)
    readme_path = ROOT / 'README.md'
    readme = readme_path.read_text(encoding='utf-8')
    readme = readme.replace('目前最新、待验收的是 `成片\\4_第四版_vibe知识大赏\\`。', '目前最新、待验收的是 `成片\\5_第五版_vibe知识大赏\\`。')
    readme = readme.replace('共四个版本', '共五个版本')
    lines = readme.splitlines()
    for i, line in enumerate(lines):
        if line.startswith('| 第五版 |'):
            lines[i] = '| 第五版 | vibe知识大赏：《宝宝》3:54、《星空的风》4:02、《五打四》2:54；独立核查后本机交付，待用户听音验收 | `成片\\5_第五版_vibe知识大赏\\` | `5_第五版资料\\` |'
    marker = '| `video-engine\\` |'
    if not any(x.startswith('| `5_第五版资料\\` |') for x in lines):
        at = next(i for i, x in enumerate(lines) if x.startswith(marker))
        lines.insert(at, '| `5_第五版资料\\` | 第五版三片：<br>`调研_1026\\`：三份补课；<br>`baobao\\`、`starry\\native\\`、`lanchester\\native\\`：采用版剧本、核查、审稿、自检与生成器；<br>`最终采用版本.md`：唯一源；`执行日志_1026.md`：逐阶段交接 |')
    readme_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    catalog_path = ROOT / '成片/成片目录.md'
    catalog = catalog_path.read_text(encoding='utf-8')
    catalog = catalog.replace('**最新、待验收：`4_第四版_vibe知识大赏\\`**（《峰终》《弱关系》《赫布》）', '**最新、待验收：`5_第五版_vibe知识大赏\\`**（《宝宝》《星空的风》《五打四》）')
    catalog = catalog.replace('## 四个版本', '## 五个版本').replace('## 第四版：vibe知识大赏（最新，10-12 修改版）', '## 第四版：vibe知识大赏（10-12 修改版）')
    version_row = '| 第五版 | `5_第五版_vibe知识大赏\\` | 宝宝/梵高与湍流/游戏平方律 | 2026-10-27 | 三部，3:54/4:02/2:54，横屏，无旁白 | 独立核查完成，待用户听音验收 |'
    if version_row not in catalog:
        anchor = '\n\n每个版本文件夹里：'
        catalog = catalog.replace(anchor, '\n' + version_row + anchor, 1)
    if '## 第五版：' not in catalog:
        summary = '\n\n## 第五版：vibe知识大赏（最新）\n\n|文件|时长|帧数|原版|手机预览|\n|---|---|---|---|---|\n' + '\n'.join(table) + '\n\n每片均附1920×1080封面和发布文案；手机预览1280×720约25MB。改进、听音时间点、已知限制与未来拍卖价替换见同目录交付说明.md。\n'
        catalog = catalog.replace('\n## 第四版：', summary + '\n## 第四版：', 1)
    catalog_path.write_text(catalog, encoding='utf-8')
    ledger_path = ROOT / '4_第四版资料/片单.md'
    ledger = ledger_path.read_text(encoding='utf-8')
    ledger_rows = [
        '| 第五版A | 娃娃脸图式/成人依恋/亲密表达 | 心理/社会 | 两张脸当场凝视 | 两脸/两人私语 | 六级概念阶梯 | 光点脸/声线 | 暗金青白 | 让你放松的是称呼背后的人 | 2400个宝字熄为一个 | 称呼从私密扩散再回到两人 |',
        '| 第五版B | 湍流级串与亮度谱 | 物理/艺术 | 奶涡认出星月夜 | 旋涡短笔触 | 生平与尺度六章 | 代码蓝黄笔触 | 钴蓝铬黄 | 一缕奶一片天值得多看 | 满屏大小涡收为孤星 | 画面自身由旋涡构成 |',
        '| 第五版C | 兰彻斯特平方律 | 数学/游戏模型 | 五打四先猜余量 | 两队光点 | 六章连续/随机/地形 | 发光点/真实逐局点海 | 暗金冰蓝 | 多一个人不止多一份力 | 20000局金蓝点海 | 证据逐局映射成画面 |',
    ]
    for line in ledger_rows:
        if line.split('|')[1].strip() not in ledger: ledger += line + '\n'
    ledger_path.write_text(ledger, encoding='utf-8')
    print('Delivery explanation, README, catalog and three ledger rows written.')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('film', choices=list(FILMS) + ['all'])
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--deliver', action='store_true')
    ap.add_argument('--docs', action='store_true')
    args = ap.parse_args()
    if args.docs:
        write_docs()
        raise SystemExit(0)
    letters = FILMS if args.film == 'all' else [args.film]
    results = [process(x, args.preview, args.deliver) for x in letters]
    if args.deliver:
        index = DEST / '交付校验.json'
        existing = json.loads(index.read_text(encoding='utf-8')) if index.exists() else {}
        existing.update({x['letter']: x for x in results})
        index.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps([{k: v for k, v in r.items() if k != 'probe'} for r in results], ensure_ascii=False, indent=2))
