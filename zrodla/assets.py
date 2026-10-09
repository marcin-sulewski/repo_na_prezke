"""Generates the cinematic background assets for the deck."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import os, random

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(OUT, exist_ok=True)
rng = random.Random(7)

# ---------- 1. World background: dark network "map", 2.4x slide size ----------
W, H = 4800, 2700
img = Image.new("RGB", (W, H), (5, 7, 12))
d = ImageDraw.Draw(img)

# faint perspective-free grid
for x in range(0, W, 60):
    d.line([(x, 0), (x, H)], fill=(12, 16, 26), width=1)
for y in range(0, H, 60):
    d.line([(0, y), (W, y)], fill=(12, 16, 26), width=1)

# network nodes + links
nodes = [(rng.randint(0, W), rng.randint(0, H)) for _ in range(420)]
for i, (x, y) in enumerate(nodes):
    near = sorted(nodes, key=lambda p: (p[0] - x) ** 2 + (p[1] - y) ** 2)[1:3]
    for (nx, ny) in near:
        d.line([(x, y), (nx, ny)], fill=(22, 30, 48), width=2)
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
for (x, y) in nodes:
    r = rng.choice([2, 2, 3, 4, 6])
    c = rng.choice([(70, 90, 130), (90, 110, 150), (60, 75, 110), (120, 140, 180)])
    d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    gd.ellipse([x - r * 4, y - r * 4, x + r * 4, y + r * 4], fill=(c[0] // 3, c[1] // 3, c[2] // 3))
glow = glow.filter(ImageFilter.GaussianBlur(10))
img = Image.fromarray(np.clip(np.asarray(img, np.int32) + np.asarray(glow, np.int32), 0, 255).astype(np.uint8))

# soft vignette baked into the world
yy, xx = np.mgrid[0:H, 0:W]
dist = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
v = np.clip(1.15 - 0.55 * dist, 0.35, 1.0)[..., None]
arr = (np.asarray(img, np.float32) * v).astype(np.uint8)
Image.fromarray(arr).save(os.path.join(OUT, "world.jpg"), quality=86)

# ---------- 2. Screen vignette + film grain overlay (transparent PNG) ----------
SW, SH = 1280, 720
yy, xx = np.mgrid[0:SH, 0:SW]
dist = np.sqrt(((xx - SW / 2) / (SW / 2)) ** 2 + ((yy - SH / 2) / (SH / 2)) ** 2)
alpha = np.clip((dist - 0.55) / 0.75, 0, 1) ** 1.6 * 235
noise = np.random.default_rng(3).normal(0, 1, (SH, SW))
alpha = np.clip(alpha, 0, 255)
rgba = np.zeros((SH, SW, 4), np.uint8)
rgba[..., 3] = alpha.astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "vignette.png"))

# ---------- 3. Horizontal scanline texture (very subtle) ----------
scan = np.zeros((SH, SW, 4), np.uint8)
scan[::4, :, :3] = 255
scan[::4, :, 3] = 9
Image.fromarray(scan, "RGBA").save(os.path.join(OUT, "scanlines.png"))
print("assets ok")

# ---------- 4. Glowing AI cores (radial glow, white-hot centre) ----------
S = 640
yy, xx = np.mgrid[0:S, 0:S]
d = np.sqrt((xx - S / 2) ** 2 + (yy - S / 2) ** 2) / (S / 2)
def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
alpha = 0.95 * np.exp(-(d / 0.13) ** 2) + 0.55 * np.exp(-(d / 0.3) ** 2) + 0.28 * np.exp(-(d / 0.62) ** 2)
alpha = np.clip(alpha, 0, 1) * (1 - smooth(0.82, 1.0, d))
for name, rgb in {"orb_red": (255, 45, 85), "orb_cyan": (0, 224, 255)}.items():
    m = smooth(0.02, 0.2, d)[..., None]
    col = (1 - m) * np.array([255, 255, 255]) + m * np.array(rgb)
    out = np.dstack([col, alpha[..., None] * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, name + ".png"))
print("orbs ok")
