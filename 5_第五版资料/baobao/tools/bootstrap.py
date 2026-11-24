from pathlib import Path
import datetime, json, urllib.request, urllib.error

ROOT=Path('D:/desk/claudex/24')
DOC=ROOT/'5_第五版资料'
for p in [DOC/'baobao', DOC/'调研_1026', ROOT/'video-engine/src/v4/baobao', ROOT/'video-engine/public/v4/baobao', ROOT/'video-engine/out/v4/baobao', Path('D:/tmp/v4baobao')]:
    p.mkdir(parents=True,exist_ok=True)
log=DOC/'执行日志_1026.md'
stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime('%Y-%m-%d %H:%M')+' 北京时间'
with log.open('a',encoding='utf-8') as f:
    f.write(f'\n## {stamp}｜阶段零：计划与必读资料\n\n已完整读取执行计划第1–9节及第10节边界；读取firefly、三份制作参考、五份用户手艺记忆、CONTRACT/KIT、1014研究与提案。三片分目录制作，补课由两个独立子代理进行。C盘约1.76GB，D盘约81GB，临时全部D盘。初次专业角色调用因账户不支持模型失败，已换继承当前模型的原生子代理继续，无文件损失。计划授权不设中途确认，最后另设独立审稿与审片。\n文件：本日志；各片资料目录和调研_1026。\n')
key=None
for line in (ROOT/'.env').read_text(encoding='utf-8-sig').splitlines():
    if line.startswith('DEEPSEEK_UNLIMITED_KEY='):
        key=line.split('=',1)[1].strip().strip('\"\'')
result={'endpoint':'http://1052.xin/v1/models','key_value_logged':False,'checked_at':stamp}
if key:
    req=urllib.request.Request(result['endpoint'],headers={'Authorization':'Bearer '+key})
    try:
        with urllib.request.urlopen(req,timeout=25) as r:
            body=json.load(r)
            result.update(status=r.status,models=[m.get('id') for m in body.get('data',[])])
    except urllib.error.HTTPError as e:
        result.update(status=e.code,reason='HTTP authentication failed' if e.code==401 else 'HTTP error')
    except Exception as e:
        result.update(status='network_error',reason=type(e).__name__)
else:
    result.update(status='key_missing')
(DOC/'baobao/DeepSeek连通性.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
with log.open('a',encoding='utf-8') as f:
    f.write(f'\n### 中文写作通道复测\n仅请求指定models端点，未输出密钥。结果：{result.get("status")}；证据：baobao/DeepSeek连通性.json。若401或通道不可用，按计划由Codex撰写中文。\n')
print(json.dumps(result,ensure_ascii=False))
