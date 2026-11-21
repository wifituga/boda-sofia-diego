"""Ornamentos en foil dorado estampado y sellos de cera con rosa en relieve."""
import numpy as np, math, sys
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt

OUT = sys.argv[1]
S = 3  # supermuestreo
L = np.array([-0.45, -0.7, 0.55]); L /= np.linalg.norm(L)
H_ = L + np.array([0, 0, 1.]); H_ /= np.linalg.norm(H_)

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)])

def shade(h):
    gy, gx = np.gradient(h)
    n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return np.clip((n * L).sum(2), 0, 1), np.clip((n * H_).sum(2), 0, 1)

def leaf(cx, cy, length, width, ang, n=30):
    pts = []
    for i in range(n + 1):
        t = i / n; pts.append((t * length, width * math.sin(math.pi * t) ** .8 * (1 - .2 * t)))
    pts += [(x, -y) for x, y in reversed(pts[1:-1])]
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]

def curve(p0, ang, length, bend, n=60):
    pts = [p0]; x, y = p0
    for i in range(1, n):
        a = ang + bend * i / n
        x += math.cos(a) * length / n; y += math.sin(a) * length / n; pts.append((x, y))
    return pts

def foil_render(mask, path, size):
    """mask: 0..1 a escala S. Produce PNG con foil dorado, brillo y ligera impresión en el papel."""
    m = gaussian_filter(mask, .6 * S)
    rng = np.random.default_rng(1)
    crinkle = gaussian_filter(rng.standard_normal(m.shape), 1.2 * S) * 0.6 + gaussian_filter(rng.standard_normal(m.shape), 4 * S) * 1.2
    h = gaussian_filter(m, 1.2 * S) * 3 + crinkle * 0.25 * (m > .05)
    d, sp = shade(h * 4)
    yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]]
    band = .5 + .5 * np.sin((xx * .6 + yy) / (60 * S))
    t = np.clip(.25 + .55 * (d - .5) + .35 * band, 0, 1)[..., None]
    dark, mid, light = hexc('#7C5A24'), hexc('#BF9A55'), hexc('#F1DFA8')
    rgb = np.where(t < .5, dark + (mid - dark) * t / .5, mid + (light - mid) * (t - .5) / .5)
    rgb = rgb + (sp ** 18)[..., None] * .55
    # impresión: sombra mínima abajo-derecha del estampado
    shadow = np.roll(np.roll(gaussian_filter(m, 1.0 * S), int(1.2 * S), 0), int(.8 * S), 1) * .22
    a = np.clip(m + shadow * (1 - m), 0, 1)
    rgb = np.where((m > .02)[..., None], rgb, hexc('#4A3420'))
    img = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), a]) * 255).astype(np.uint8), 'RGBA')
    img.resize(size, Image.LANCZOS).save(path, optimize=True)

def draw_sprigs(W, H, items):
    im = Image.new('L', (W * S, H * S), 0); d = ImageDraw.Draw(im)
    for kind, *args in items:
        if kind == 'euca':  # tallo con hojas redondas macizas y nervio calado
            (x, y), ang, length, bend, lw, sz = args
            pts = curve((x * S, y * S), math.radians(ang), length * S, bend)
            d.line(pts, fill=255, width=int(lw * S), joint='curve')
            cuts = []
            k = 0
            for i in range(5, len(pts) - 1, 6):
                px, py = pts[i]; t = i / len(pts)
                a = math.radians(ang) + bend * t + (1 if k % 2 else -1) * 1.05
                r = sz * S * (1.05 - .45 * t)
                cx, cy = px + math.cos(a) * r * .95, py + math.sin(a) * r * .95
                d.ellipse([cx - r, cy - r * .9, cx + r, cy + r * .9], fill=255)
                cuts.append([(px + math.cos(a) * r * .25, py + math.sin(a) * r * .25), (cx + math.cos(a) * r * .65, cy + math.sin(a) * r * .65)])
                k += 1
            for cl in cuts: d.line(cl, fill=0, width=max(1, int(.7 * S)))
        elif kind == 'fern':  # rama de hojas largas y finas
            (x, y), ang, length, bend, lw, sz = args
            pts = curve((x * S, y * S), math.radians(ang), length * S, bend)
            d.line(pts, fill=255, width=int(lw * S), joint='curve')
            for i in range(6, len(pts) - 1, 6):
                px, py = pts[i]; t = i / len(pts)
                for side in (-1, 1):
                    a = math.radians(ang) + bend * t + side * .5
                    d.polygon(leaf(px, py, sz * S * (1.1 - .55 * t), sz * S * .16 * (1.1 - .55 * t), a), fill=255)
        elif kind == 'amar':  # amaranto colgante: cuentas separadas que se afinan
            (x, y), length, sway, rr = args
            yy_ = 0.0; i = 0
            while yy_ < length:
                t = yy_ / length
                r = rr * (1 - .6 * t)
                px = x + math.sin(t * 3.2) * sway * t + (r * .75 if i % 2 else -r * .75)
                py = y + yy_
                d.ellipse([(px - r) * S, (py - r) * S, (px + r) * S, (py + r) * S], fill=255)
                yy_ += r * 1.25; i += 1
        elif kind == 'dot':
            (x, y), r = args
            d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=255)
    return np.asarray(im, float) / 255

def frame9():
    """Marco doble en foil para border-image (9-slice)."""
    W = H = 240
    im = Image.new('L', (W * S, H * S), 0); d = ImageDraw.Draw(im)
    def rect(o, w):
        d.rectangle([o * S, o * S, (W - o) * S, (H - o) * S], outline=255, width=int(w * S))
    rect(14, 1.6); rect(20, .8)
    for (cx, cy) in [(14, 14), (W - 14, 14), (14, H - 14), (W - 14, H - 14)]:
        r = 6
        d.polygon([((cx) * S, (cy - r) * S), ((cx + r) * S, cy * S), (cx * S, (cy + r) * S), ((cx - r) * S, cy * S)], fill=255)
    m = np.asarray(im, float) / 255
    foil_render(m, f'{OUT}/foil-frame.png', (W * 2, H * 2))

def divider():
    W, H = 300, 30
    im = Image.new('L', (W * S, H * S), 0); d = ImageDraw.Draw(im)
    c = H / 2
    d.line([(20 * S, c * S), (132 * S, c * S)], fill=255, width=int(1.1 * S))
    d.line([(168 * S, c * S), (280 * S, c * S)], fill=255, width=int(1.1 * S))
    for x, r in ((150, 7), (138, 2.4), (162, 2.4)):
        d.polygon([(x * S, (c - r) * S), ((x + r) * S, c * S), (x * S, (c + r) * S), ((x - r) * S, c * S)], fill=255)
    foil_render(np.asarray(im, float) / 255, f'{OUT}/foil-divider.png', (W * 2, H * 2))

def arch():
    W, H = 280, 360
    im = Image.new('L', (W * S, H * S), 0); d = ImageDraw.Draw(im)
    for o, w in ((6, 1.6), (13, .8)):
        r = W / 2 - o
        d.arc([o * S, o * S, (W - o) * S, (o + 2 * r) * S], 180, 360, fill=255, width=int(w * S))
        d.line([(o * S, (o + r) * S), (o * S, (H - 6) * S)], fill=255, width=int(w * S))
        d.line([((W - o) * S, (o + r) * S), ((W - o) * S, (H - 6) * S)], fill=255, width=int(w * S))
    d.line([(6 * S, (H - 6) * S), ((W - 6) * S, (H - 6) * S)], fill=255, width=int(1.6 * S))
    x, y, r = W / 2, 6, 6
    d.polygon([(x * S, (y - r + 6) * S), ((x + r) * S, (y + 6) * S), (x * S, (y + r + 6) * S), ((x - r) * S, (y + 6) * S)], fill=255)
    foil_render(np.asarray(im, float) / 255, f'{OUT}/foil-arch.png', (W * 2, H * 2))

def rose_height(flowers, R):
    """Altura del modelo de rosa (sin color) para usarla como relieve del sello."""
    import math as m_
    r = np.random.default_rng(9); N = int(R * 2.3); c = N / 2
    h = np.full((N, N), -9.0)
    rings = [(1.0, 7, .7), (.86, 7, .66), (.72, 6, .62), (.58, 6, .6), (.45, 5, .56), (.33, 5, .55), (.22, 4, .55), (.12, 3, .6)]
    for li, (rr, n, wd) in enumerate(rings):
        off = r.uniform(0, 6.28)
        for k in range(n):
            a = off + k * 2 * m_.pi / n + r.uniform(-.1, .1)
            ln = R * rr * r.uniform(.9, 1.05); start = R * rr * r.uniform(.05, .3); a2 = a + r.uniform(-.25, .25)
            pts = flowers.leaf_pts(c + m_.cos(a) * start, c + m_.sin(a) * start, ln * r.uniform(.75, .95), ln * wd * r.uniform(.8, 1.1), a2, round_=.45, tip=-.5)
            msk = flowers.poly_mask(N, N, [pts]); dd = flowers.dome(msk, R * .1)
            ph = li * .8 + .25 * dd + .45 * np.clip(1 - dd, 0, 1) ** 2 * (dd > 0)
            h = np.where((msk > .5) & (ph > h), ph, h)
    h[h < -5] = 0
    return gaussian_filter(h / h.max(), 1.2)

def rose_seal(path, base='#5E0A1C', px=120):
    """Sello de cera burgundy con una rosa en relieve."""
    N = 360; c = N / 2
    yy, xx = np.mgrid[0:N, 0:N]; ang = np.arctan2(yy - c, xx - c); rad = np.hypot(xx - c, yy - c)
    r2 = np.random.default_rng(4); wob = 0
    for k in range(2, 12): wob += r2.uniform(0, 1) / k * np.cos(k * ang + r2.uniform(0, 6.28))
    blob = rad < 150 + 9 * wob
    dist = distance_transform_edt(blob)
    h = 1 - np.exp(-dist / 14)
    press = np.clip((108 - rad) / 3, 0, 1)
    h += .22 * np.exp(-((rad - 114) / 6) ** 2) - .4 * press
    sys.path.insert(0, '/home/claude/gen')
    import flowers
    rh = rose_height(flowers, 92)
    pad = (N - rh.shape[0]) // 2
    rh = np.pad(rh, ((pad, N - rh.shape[0] - pad), (pad, N - rh.shape[1] - pad)))
    h += .55 * rh * press
    h = gaussian_filter(h, .9)
    gy, gx = np.gradient(h * 20)
    n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    diff = np.clip((n * L).sum(2), 0, 1); sp = np.clip((n * H_).sum(2), 0, 1) ** 30 * .55
    rgb = hexc(base) * (.45 + .75 * diff[..., None]) * (1 - .1 * gaussian_filter(press, 3)[..., None]) + sp[..., None] * np.array([1, .85, .85])
    a = np.clip(dist / 1.5, 0, 1)
    Image.fromarray((np.dstack([np.clip(rgb, 0, 1), a]) * 255).astype(np.uint8), 'RGBA').resize((px * 2, px * 2), Image.LANCZOS).save(path, optimize=True)

if __name__ == '__main__':
    frame9(); divider(); arch()
    rose_seal(f'{OUT}/seal-rose.png')
    print('ok')
