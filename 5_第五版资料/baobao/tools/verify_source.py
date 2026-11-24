"""Verify byte reproducibility of the sole timeline and digital silence of the mix."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import wave
import numpy as np

root = Path(__file__).resolve().parents[3]
pub = root / 'video-engine/public/v4/baobao'
out = root / 'video-engine/out/v4/baobao'
names = ['subs.json', 'cue.json', 'timeline_meta.json']
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
before = {n: sha(pub / n) for n in names}
subprocess.run([sys.executable, '-X', 'utf8', str(Path(__file__).with_name('timeline.py'))], check=True, capture_output=True)
after = {n: sha(pub / n) for n in names}
assert before == after
cue = json.loads((pub / 'cue.json').read_text(encoding='utf8'))
with wave.open(str(pub / 'mix.wav')) as w:
    sr, channels, frames = w.getframerate(), w.getnchannels(), w.getnframes()
    audio = np.frombuffer(w.readframes(frames), np.int16).reshape(-1, channels)
silences = []
for a, b in cue['silences']:
    part = audio[round(a*sr):round(b*sr)]
    silences.append({'from': a, 'to': b, 'seconds': len(part)/sr, 'max_abs': int(np.abs(part.astype(np.int32)).max())})
    assert not np.any(part)
assert abs(frames/sr-cue['dur']) < 1/sr
result = {'timeline_reproducible': before == after, 'json_sha256': after, 'timeline_sha256': sha(Path(__file__).with_name('timeline.py')), 'sample_rate': sr, 'channels': channels, 'duration': frames/sr, 'digital_silence': silences, 'music_sha256': sha(pub/'music.wav'), 'mix_sha256': sha(pub/'mix.wav')}
(out/'source_audio_verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
print(json.dumps(result, ensure_ascii=False, indent=2))
