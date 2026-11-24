"""《沙漏与潮水》纸纹与水彩纹理（固定种子，预先生成，平移时不重新生成）。

输出（灰度 PNG，画面里用 multiply 叠加）：
  public/v3/nightowl/tex/paper.png   2048×1080，左右、上下都可无缝平铺：细纸纤维 + 很淡的大块晕染
  public/v3/nightowl/tex/wash.png    2048×256，左右可无缝平铺：水彩的颜料沉积、水痕（只叠在天色带上）

用法（不要在上一级目录运行：那里的 numbers.py 会顶掉标准库 numbers）：
  D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe 3_第三版资料\\样片\\nightowl\\tools\\make_textures.py
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[4] / "video-engine"
OUT = ROOT / "public" / "v3" / "nightowl" / "tex"


def write_png_gray(path: Path, a: np.ndarray) -> None:
    a = np.clip(a, 0, 255).astype(np.uint8)
    h, w = a.shape
    raw = b"".join(b"\x00" + a[y].tobytes() for y in range(h))

    def chunk(tag: bytes, data: bytes) -> bytes:
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 0, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def blur_periodic(x: np.ndarray, sy: float, sx: float) -> np.ndarray:
    """FFT 高斯模糊：天然周期边界，所以结果可以无缝平铺。"""
    h, w = x.shape
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    g = np.exp(-2 * (np.pi ** 2) * ((fy * sy) ** 2 + (fx * sx) ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(x) * g))


def norm(x: np.ndarray) -> np.ndarray:
    x = x - x.mean()
    return x / (np.abs(x).max() + 1e-9)


def paper(rng: np.random.Generator) -> np.ndarray:
    h, w = 1080, 2048
    fine = norm(blur_periodic(rng.standard_normal((h, w)), 0.6, 0.6))
    fiber = norm(blur_periodic(rng.standard_normal((h, w)), 1.2, 9.0))  # 横向纤维
    mid = norm(blur_periodic(rng.standard_normal((h, w)), 14, 14))
    big = norm(blur_periodic(rng.standard_normal((h, w)), 120, 160))
    v = 1.0 - 0.018 * np.abs(fine) - 0.014 * (fiber > 0.35) * fiber - 0.012 * (mid + 1) / 2 - 0.02 * (big + 1) / 2
    return v * 255


def wash(rng: np.random.Generator) -> np.ndarray:
    h, w = 256, 2048
    gran = norm(blur_periodic(rng.standard_normal((h, w)), 1.0, 1.0))  # 颜料颗粒
    pool = norm(blur_periodic(rng.standard_normal((h, w)), 18, 30))  # 颜料积水
    big = norm(blur_periodic(rng.standard_normal((h, w)), 60, 140))
    # 水痕：pool 的等值线附近颜色更深（水彩干后边缘发暗）
    ring = np.exp(-((pool - 0.15) / 0.05) ** 2) * 0.5 + np.exp(-((pool + 0.35) / 0.06) ** 2) * 0.35
    y = np.linspace(0, 1, h)[:, None]
    v = 1.0 - 0.05 * (gran + 1) / 2 - 0.10 * (big + 1) / 2 - 0.08 * ring - 0.05 * (pool + 1) / 2 - 0.04 * y
    return v * 255


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(20261006)
    p = paper(rng)
    write_png_gray(OUT / "paper.png", p)
    wv = wash(rng)
    write_png_gray(OUT / "wash.png", wv)
    for n in ("paper.png", "wash.png"):
        f = OUT / n
        print(f"{f}  {f.stat().st_size // 1024} KB")
    print(f"paper 取值 {p.min():.0f}–{p.max():.0f}，wash 取值 {wv.min():.0f}–{wv.max():.0f}")


if __name__ == "__main__":
    main()
