"""Prepare an inventory; deliver only the exact files approved by the leader.

Default invocation only writes inventory.json beside this script.
--deliver requires approval.json with PASS and hashes for all three films.
No production source edits, publishing, networking, mail, or deletion.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'video-engine/out/v4'
DOC = ROOT / '5_第五版资料'
DEST = ROOT / '成片/5_第五版_vibe知识大赏'
FILMS = [('A', 'baobao', '宝宝'), ('B', 'starry', '星空的风'), ('C', 'lanchester', '五打四')]


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format',
        '-of', 'json', str(path)], encoding='utf-8'))


def archive(path):
    if path.exists():
        dest = path.parent / '旧版_1026_协作会话' / (path.stem + '_' + sha(path)[:12] + path.suffix)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copy2(path, dest)


def copy_verified(source, target):
    before = sha(source)
    if target.exists() and sha(target) == before:
        return before
    archive(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    if sha(target) != before or sha(source) != before:
        raise RuntimeError('Copy changed or source mutated: ' + str(source))
    return before


def safe_source(slug, raw):
    path = Path(raw).resolve()
    allowed = (OUT / slug).resolve()
    if path.parent != allowed:
        raise ValueError('Only current root output is allowed, never native/old branches: ' + str(path))
    if not path.is_file():
        raise FileNotFoundError(path)
    return path


def inventory():
    result = []
    for letter, slug, title in FILMS:
        folder = OUT / slug
        items = []
        for path in sorted(folder.iterdir()):
            if path.is_file() and (path.name == 'final.mp4' or '封面' in path.name or '手机预览' in path.name or path.name in ('phone.mp4', 'cover.png', 'cover_delivery.png', 'verification.json')):
                item = {'path': str(path), 'bytes': path.stat().st_size}
                if path.suffix == '.mp4':
                    item['ffprobe'] = probe(path)
                items.append(item)
        result.append({'letter': letter, 'slug': slug, 'title': title, 'files': items})
    (HERE / 'inventory.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result


def deliver(receipt_path):
    receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
    if receipt.get('status') != 'PASS' or not receipt.get('leader_message'):
        raise RuntimeError('No leader PASS receipt; delivery stays closed.')
    prepared = []
    # Check all three before writing any delivery file.
    for letter, slug, title in FILMS:
        item = receipt['films'][slug]
        if item.get('independent_status') != 'PASS':
            raise RuntimeError(slug + ': independent review has not passed.')
        files = {kind: safe_source(slug, item[kind]['path']) for kind in ('final', 'cover', 'phone')}
        for kind, path in files.items():
            if sha(path) != item[kind]['sha256']:
                raise RuntimeError(slug + ': approved ' + kind + ' hash is stale.')
        if files['final'].name != 'final.mp4':
            raise ValueError('Final source must be canonical final.mp4')
        if item.get('phone_source_sha256') != item['final']['sha256']:
            raise RuntimeError(slug + ': preview provenance is not the approved final.')
        full, phone = probe(files['final']), probe(files['phone'])
        video = next(s for s in full['streams'] if s['codec_type'] == 'video')
        small = next(s for s in phone['streams'] if s['codec_type'] == 'video')
        if (video['width'], video['height'], video['r_frame_rate'], video['codec_name']) != (1920, 1080, '30/1', 'h264'):
            raise RuntimeError(slug + ': full-size format failed.')
        if (small['width'], small['height']) != (1280, 720):
            raise RuntimeError(slug + ': preview resolution failed.')
        duration = float(video['duration'])
        cue = json.loads((ROOT / 'video-engine/public/v4' / slug / 'cue.json').read_text(encoding='utf-8'))
        if abs(duration - cue['dur']) > 1 / 30 + .01 or abs(float(phone['format']['duration']) - duration) > .15:
            raise RuntimeError(slug + ': duration does not match current timeline.')
        if not any(s['codec_type'] == 'audio' for s in full['streams']):
            raise RuntimeError(slug + ': no audio stream.')
        caption = DOC / slug / '发布文案.md'
        if not caption.is_file():
            raise FileNotFoundError(caption)
        evidence = Path(item['independent_evidence']).resolve()
        if not evidence.is_file():
            raise FileNotFoundError(evidence)
        prepared.append((letter, slug, title, item, files, duration, caption))
    result = []
    for letter, slug, title, item, files, duration, caption in prepared:
        names = {
            'final': DEST / f'{letter}_{title}.mp4',
            'cover': DEST / f'{letter}_{title}_封面.png',
            'phone': DEST / '手机预览' / f'{letter}_{title}_手机预览.mp4'}
        hashes = {kind: copy_verified(files[kind], target) for kind, target in names.items()}
        copy_verified(caption, DEST / f'{letter}_{title}_发布文案.md')
        result.append({'letter': letter, 'slug': slug, 'title': title, 'duration': duration,
                       'files': {k: str(v) for k, v in names.items()}, 'sha256': hashes,
                       'independent_evidence': item['independent_evidence']})
    (HERE / 'delivery_manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Copied approved files and verified SHA-256. Index/report updates remain separate.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--deliver', action='store_true')
    ap.add_argument('--receipt', type=Path, default=HERE / 'approval.json')
    args = ap.parse_args()
    if args.deliver:
        deliver(args.receipt)
    else:
        inventory()
        print('Read-only production scan complete: ' + str(HERE / 'inventory.json'))


if __name__ == '__main__':
    main()
