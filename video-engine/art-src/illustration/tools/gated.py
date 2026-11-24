"""Unweighted gated loudness (same algorithm as src/styles/illustration/Bgm.tsx) vs ffmpeg LUFS, for calibration.
Power = mean of per-channel mean squares (no downmix), 400ms blocks, 75% overlap, silence gate, -10 dB relative gate."""
import subprocess, sys
import numpy as np
def load(p):
    ch = int(subprocess.run(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=channels','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip())
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ar','48000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch)
def gated(x, sr=48000):
    sq = np.mean(x.astype(np.float64)**2, axis=1)
    pre = np.concatenate([[0], np.cumsum(sq)])
    n = int(round(sr*0.4)); hop = int(round(n/4))
    b = np.array([(pre[i+n]-pre[i])/n for i in range(0, len(sq)-n+1, hop)])
    b = b[b > 1e-7]
    b = b[b > np.mean(b)*0.1]
    return 10*np.log10(np.mean(b))
def lufs(p):
    e = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',p,'-af','ebur128','-f','null','-'],capture_output=True,text=True,encoding='utf-8',errors='replace').stderr
    return float([l for l in e.splitlines() if l.strip().startswith('I:')][-1].split()[1])
for p in sys.argv[1:]:
    g = gated(load(p)); L = lufs(p); print(p, 'gated %.2f dB' % g, 'LUFS %.2f' % L, 'offset %+.2f' % (L-g))
