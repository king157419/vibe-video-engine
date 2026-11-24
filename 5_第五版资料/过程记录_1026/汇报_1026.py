"""Create the final short report only after all exact delivered files are reviewed."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT.parent / '_reports'
DELIVERY = ROOT / '成片/5_第五版_vibe知识大赏'

def main():
    manifest = json.loads((DELIVERY / '交付校验.json').read_text(encoding='utf-8'))
    assert set(manifest) == {'A', 'B', 'C'}
    for item in manifest.values():
        assert hashlib.sha256(Path(item['delivery']).read_bytes()).hexdigest() == item['sha256']
        review = Path(item['source']) / '独立审片记录.md'
        text = review.read_text(encoding='utf-8')
        assert 'PASS' in text and item['sha256'] in text.lower(), review
    now = subprocess.check_output(['D:/conda/miniconda3/python.exe', '-X', 'utf8', str(REPORTS / 'tools/bjtime.py')], text=True, encoding='utf-8').strip()
    path = REPORTS / f'{now} 萤火第五版：三片完成待听音验收.md'
    body = '''萤火第五版：三部成片、封面、手机预览已交付，独立审稿审片通过，剩真人听音验收。

状态：做完｜把握：大｜覆盖：1027 01:40–END 北京时间｜接《艾西拉样片换了画风》

## 要你做的：5件（4件上次问过）

1. 开声音看本次“手机预览”三片，回开头留不留得住、哪部最想转发；11月19日拿到成交页后再换梵高结尾。听音时间点见交付说明。
2. （上次问过）手机同一Wi-Fi打开 http://10.99.222.41:3005/sample 试玩艾西拉，回能否打开。
3. （上次问过）定艾西拉是否只做样片，或回上一份报告的3D来源选择，以便继续。
4. （上次问过）回安卓或苹果、有没有飞书，并看未读清单，方便定汇报送达方式。
5. （上次问过）回课表12和自媒体24、完成记忆26登录盲判十题，并回旧中转残留是否清理；未确认前保留。

## 需求：更新知识，再完整做三期

你点名的恋爱退行先做；另两片按计划选梵高与五打四。新调研三份已写齐，没核到的热点、播放数或代际比例没有硬编。

我替你定了：宝宝用两张脸，备用“甜还是肉麻”留在剧本；片名卡用娃娃脸图式·洛伦兹·1943。三片分别3:54.47、4:02、2:54，引用《老子》《庄子》《孙子》。DeepSeek两入口401，中文由Codex写；片内保留你指定的Opus 5.5署名。

## 方案：复用现有引擎，三种入口保留系列外壳

暗底、光做主角、双语衬线、无旁白、代码配乐、回环；B/C隔离制作，旧稿全留。代价是字幕承担完整叙述，需要足够阅读时间。

## 结果：三片独立核查后交付

每片至少两轮实改；审稿与审片均交给未参与制作的新代理。五打四灰矩形点阵、宝宝两处钟声光晕曾被驳回，已改点海和实际位置再审。

三片FREEZE为0、无8秒静止；响度约−16，峰值合格；手机预览两遍压制，交付哈希一致。证据：成片目录里的交付说明.md、交付校验.json和各片独立审片记录。README、成片目录和账本三行已更新。通。

## 风险：声音尚无人亲耳听过

没亲眼验过：听感、真手机播放体验、发布后留存。梵高1.8亿美元是媒体估价，非成交价；片尾10秒可替换。部分D盘缓存清理被自动审批拒绝，保留且未绕过，不影响片子。未登录、未发布、不发邮件，报告只在本机。

## 下一步：你听音验收，成交结果出来后换尾

改进清单、每声重点、听音点和梵高替换命令均在交付说明，制作与独立记录可复查。
'''.replace('END', now.split('-')[-1][:2] + ':' + now.split('-')[-1][2:])
    assert len(body) <= 1200, len(body)
    attachments = '''
## 附件

- D:/desk/claudex/24/成片/5_第五版_vibe知识大赏/交付说明.md：原版、手机预览、十一项改进与听音点。
- D:/desk/claudex/24/5_第五版资料/执行日志_1026.md：逐阶段交接与全部完成记录。
- D:/desk/claudex/24/5_第五版资料/最终采用版本.md：源码、剧本、审稿和审片的采用路径。
- D:/desk/claudex/_reports/未读清单.md：此前十份未确认查看，本报告另计。
'''
    path.write_text(body + attachments, encoding='utf-8')
    (ROOT / '5_第五版资料/最终汇报路径.txt').write_text(str(path), encoding='utf-8')
    print(json.dumps({'report': str(path), 'body_chars': len(body)}, ensure_ascii=False))

if __name__ == '__main__': main()
