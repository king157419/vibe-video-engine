"""Check relay availability without logging credentials or response headers."""
import json
import urllib.error
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[3]
key = next((x.split('=', 1)[1].strip().strip('\"\'') for x in (root / '.env').read_text(encoding='utf-8').splitlines() if x.startswith('DEEPSEEK_UNLIMITED_KEY=')), '')
results = []
for base in ['https://1052.xin/v1', 'http://1052.xin/v1']:
    try:
        req = urllib.request.Request(base + '/models', headers={'Authorization': 'Bearer ' + key})
        with urllib.request.urlopen(req, timeout=25) as response:
            data = json.load(response)
        models = [x.get('id') for x in data.get('data', []) if 'deepseek' in x.get('id', '').lower()]
        results.append({'base': base, 'status': 200, 'deepseek_models': models})
    except urllib.error.HTTPError as error:
        results.append({'base': base, 'status': error.code})
    except Exception as error:
        results.append({'base': base, 'error_type': type(error).__name__})
out = root / '5_第五版资料/baobao/DeepSeek连通记录.json'
out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(results, ensure_ascii=False))
