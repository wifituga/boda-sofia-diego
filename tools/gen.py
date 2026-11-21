"""Genera texturas realistas para la invitación (relieve, cera, lino, papel, foil, cinta, hojas)."""
import numpy as np, math, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter, distance_transform_edt

OUT = sys.argv[1]
FONT = '/home/claude/fonts/pinyon.ttf'
rng = np.random.default_rng(7)

def noise(h, w, sigma, wrap=False, seed=None):
    r = np.random.default_rng(seed) if seed is not None else rng
    n = gaussian_filter(r.standard_normal((h, w)), sigma, mode='wrap' if wrap else 'reflect')
    return n / (n.std() + 1e-9)

def fbm(h, w, sigmas, weights, wrap=False):
    return sum(wt * noise(h, w, s, wrap) for s, wt in zip(sigmas, weights))

def shade(height, light=(-0.55, -0.65, 0.52), strength=1.0, spec=0.0, power=20):
    gy, gx = np.gradient(height * strength)
    n = np.dstack([-gx, -gy, np.ones_like(height)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array(light, float); L /= np.linalg.norm(L)
    diff = np.clip((n * L).sum(2), 0, 1)
    flat = L[2]
    out = diff / flat  # 1.0 en zonas planas
    sp = 0
    if spec:
        H = L + np.array([0, 0, 1.0]); H /= np.linalg.norm(H)
        sp = spec * np.clip((n * H).sum(2), 0, 1) ** power
    return out, sp

def to_img(rgb, alpha=None):
    rgb = np.clip(rgb, 0, 1)
    if alpha is None:
        return Image.fromarray((rgb * 255).astype(np.uint8), 'RGB')
    a = np.clip(alpha, 0, 1)[..., None]
    return Image.fromarray((np.concatenate([rgb, a], 2) * 255).astype(np.uint8), 'RGBA')

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)])

# ---------------------------------------------------------------- 1. Puertas con relieve floral
def leaf_poly(cx, cy, length, width, ang):
    pts = []
    for i in range(25):
        t = i / 24
        x = t * length
        y = width * math.sin(math.pi * t) ** 0.9 * (1 - 0.25 * t)
        pts.append((x, y))
    pts += [(x, -y) for x, y in reversed(pts[1:-1])]
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]

def draw_botanical(W, H, seed, n_sprigs):
    S = 2
    mask = Image.new('L', (W * S, H * S), 0)
    groove = Image.new('L', (W * S, H * S), 0)
    d, g = ImageDraw.Draw(mask), ImageDraw.Draw(groove)
    r = np.random.default_rng(seed)
    for _ in range(n_sprigs):
        x0, y0 = r.uniform(-40, W + 40) * S, r.uniform(-40, H + 40) * S
        ang = r.uniform(0, 2 * math.pi)
        L = r.uniform(260, 420) * S
        bend = r.uniform(-0.9, 0.9)
        pts = []
        for i in range(60):
            t = i / 59
            a = ang + bend * t
            if i == 0: x, y = x0, y0
            else: x, y = pts[-1][0] + math.cos(a) * L / 59, pts[-1][1] + math.sin(a) * L / 59
            pts.append((x, y))
        d.line(pts, fill=255, width=int(6 * S), joint='curve')
        nl = r.integers(6, 10)
        for k in range(nl):
            t = (k + 1) / (nl + 1)
            i = int(t * 59); x, y = pts[i]
            a = ang + bend * t
            side = 1 if k % 2 else -1
            la = a + side * r.uniform(0.6, 1.0)
            ln, wd = r.uniform(48, 70) * S * (1.1 - 0.4 * t), r.uniform(14, 19) * S * (1.1 - 0.4 * t)
            d.polygon(leaf_poly(x, y, ln, wd, la), fill=255)
            g.line([(x, y), (x + math.cos(la) * ln * 0.85, y + math.sin(la) * ln * 0.85)], fill=255, width=int(1.6 * S))
        # flor al final
        fx, fy = pts[-1]
        pr = r.uniform(20, 28) * S
        for p in range(5):
            a = p * 2 * math.pi / 5 + r.uniform(0, 0.4)
            d.polygon(leaf_poly(fx, fy, pr * 1.6, pr * 0.75, a), fill=255)
            g.line([(fx, fy), (fx + math.cos(a) * pr * 1.1, fy + math.sin(a) * pr * 1.1)], fill=255, width=int(1.2 * S))
        g.ellipse([fx - pr * .38, fy - pr * .38, fx + pr * .38, fy + pr * .38], fill=255)
        # bayas
        for _ in range(r.integers(1, 4)):
            i = r.integers(10, 50); bx, by = pts[i]
            off = r.uniform(26, 40) * S; a = r.uniform(0, 6.28)
            bx += math.cos(a) * off; by += math.sin(a) * off
            br = r.uniform(6, 8) * S
            d.ellipse([bx - br, by - br, bx + br, by + br], fill=255)
    mask = np.asarray(mask.resize((W, H), Image.LANCZOS), float) / 255
    groove = np.asarray(groove.resize((W, H), Image.LANCZOS), float) / 255
    return mask, groove

def doors():
    W, H = 840, 1150
    mask, groove = draw_botanical(W, H, 4, 22)
    dist = distance_transform_edt(mask > 0.5)
    dome = np.sqrt(np.clip(dist / 6.5, 0, 1))
    h = gaussian_filter(dome, 1.1) - 0.45 * gaussian_filter(groove, 0.9)
    fibers = fbm(H, W, [0.6, 2, 8, 40], [0.25, 0.25, 0.3, 0.5])
    h_total = h * 3.2 + fibers * 0.10
    lit, sp = shade(h_total, strength=1.0, spec=0.22, power=9)
    base = hexc('#420010')
    col_var = (1 + 0.018 * fbm(H, W, [30, 120], [1, 1]))[..., None]
    raised = gaussian_filter(dome, 2)[..., None]
    rgb = base * col_var * (1 + 0.10 * raised)  # zonas en relieve ligeramente más claras
    rgb = rgb * (0.34 + 0.76 * lit[..., None]) + sp[..., None] * np.array([1, .7, .72]) * 0.8
    # sombreado suave: luz desde arriba-izquierda
    yy, xx = np.mgrid[0:H, 0:W]
    vign = 1 - 0.07 * (yy / H)
    rgb *= vign[..., None]
    for name, sl, seam_x in (('door-l', slice(0, W // 2), W // 2 - 1), ('door-r', slice(W // 2, W), 0)):
        part = rgb[:, sl].copy()
        w2 = part.shape[1]
        x = np.arange(w2)
        # borde interior (costura) más oscuro + bisel en el borde exterior
        dseam = np.abs(x - seam_x)
        part *= (1 - 0.22 * np.exp(-dseam / 3.0) - 0.07 * np.exp(-dseam / 18.0))[None, :, None]
        dout = np.abs(x - (w2 - 1 - seam_x))
        part *= (1 + 0.06 * np.exp(-dout / 2.0))[None, :, None]
        to_img(part).save(f'{OUT}/{name}.jpg', quality=84)

# ---------------------------------------------------------------- 2. Sello de cera
def seal(name='seal', txt='S&D', color='#EFE7DA', fsize=120, font=FONT):
    N = 420; c = N / 2
    yy, xx = np.mgrid[0:N, 0:N]
    ang = np.arctan2(yy - c, xx - c); rad = np.hypot(xx - c, yy - c)
    wob = 0
    r2 = np.random.default_rng(11)
    for k in range(2, 14):
        wob += r2.uniform(0, 1) / k ** 1.1 * np.cos(k * ang + r2.uniform(0, 6.28))
    R = 168 + 8 * wob
    blob = rad < R
    dist = distance_transform_edt(blob)
    h = 1 - np.exp(-dist / 16)            # charco de cera
    h += 0.06 * gaussian_filter(r2.standard_normal((N, N)), 7) * np.clip(dist / 20, 0, 1)  # irregularidad
    # sello presionado
    RS = 122
    press = np.clip((RS - rad) / 3.0, 0, 1)
    rim = np.exp(-((rad - RS - 6) / 7.0) ** 2)
    h += 0.25 * rim - 0.42 * press
    # anillo y puntos decorativos
    ring = np.exp(-((rad - 106) / 1.8) ** 2)
    h += 0.16 * ring
    for i in range(36):
        a = i * 2 * math.pi / 36
        px, py = c + 95 * math.cos(a), c + 95 * math.sin(a)
        h += 0.14 * np.exp(-((xx - px) ** 2 + (yy - py) ** 2) / 5.0)
    # monograma
    img = Image.new('L', (N, N), 0); d = ImageDraw.Draw(img)
    f = ImageFont.truetype(font, fsize)
    bb = d.textbbox((0, 0), txt, font=f)
    d.text((c - (bb[0] + bb[2]) / 2, c - (bb[1] + bb[3]) / 2 + 4), txt, font=f, fill=255)
    mono = gaussian_filter(np.asarray(img, float) / 255, 1.3)
    h += 0.30 * mono * press
    h = gaussian_filter(h, 0.8)
    lit, sp = shade(h * 22, light=(-0.5, -0.7, 0.6), spec=0.55, power=28)
    base = hexc(color)
    inside = gaussian_filter(press, 3)[..., None]
    rgb = base * (1 - 0.05 * inside) * (0.42 + 0.58 * lit[..., None]) + sp[..., None]
    rgb += 0.02 * noise(N, N, 1)[..., None]
    alpha = np.clip(dist / 1.5, 0, 1)
    to_img(rgb, alpha).resize((300, 300), Image.LANCZOS).save(f'{OUT}/{name}.png', optimize=True)

# ---------------------------------------------------------------- 3. Lino (mantel)
def linen():
    W, H = 900, 1400
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    weave = 0.5 * np.sin(xx * 2.1 + 3 * noise(H, W, 3, seed=1)) * (1 + 0.6 * noise(H, W, (0.5, 30), seed=2)) \
          + 0.5 * np.sin(yy * 2.1 + 3 * noise(H, W, 3, seed=3)) * (1 + 0.6 * noise(H, W, (30, 0.5), seed=4))
    slub = noise(H, W, (0.6, 14), seed=5) + noise(H, W, (14, 0.6), seed=6)
    folds = 0
    r3 = np.random.default_rng(21)
    for _ in range(6):
        a = r3.uniform(-0.6, 0.6) + math.pi / 2 * r3.integers(0, 2)
        off = r3.uniform(-400, 400); wdt = r3.uniform(40, 160); amp = r3.uniform(0.6, 1.6)
        s = (xx - W / 2) * math.cos(a) + (yy - H / 2) * math.sin(a) - off
        s += 30 * noise(H, W, 80, seed=int(r3.integers(1e6)))
        folds += amp * np.exp(-(s / wdt) ** 2)
    folds += 0.6 * noise(H, W, 120, seed=9)
    lit, _ = shade(folds * 60, light=(-0.4, -0.8, 0.55))
    fine, _ = shade(weave * 0.35 + slub * 0.25, light=(-0.4, -0.8, 0.55))
    base = hexc('#F4F1EC')
    rgb = base * (0.89 + 0.11 * lit[..., None]) * (0.95 + 0.05 * fine[..., None])
    rgb *= (1 - 0.06 * ((yy / H) ** 1.5))[..., None]
    to_img(rgb).save(f'{OUT}/linen.jpg', quality=80)

# ---------------------------------------------------------------- 4. Papel de algodón (tile + borde deckle 9-slice)
def paper():
    T = 512
    fib = fbm(T, T, [0.5, 1.5, 5, 25], [0.35, 0.35, 0.25, 0.4], wrap=True)
    lit, _ = shade(fib * 0.6, light=(-0.4, -0.7, 0.6))
    base = hexc('#FBF6EA')
    rgb = base * (0.96 + 0.04 * lit[..., None]) * (1 + 0.012 * noise(T, T, 60, wrap=True))[..., None]
    to_img(rgb).save(f'{OUT}/paper.jpg', quality=82)
    # 9-slice con bordes irregulares
    N, B = 300, 40
    yy, xx = np.mgrid[0:N, 0:N].astype(float)
    d_edge = np.minimum.reduce([xx, yy, N - 1 - xx, N - 1 - yy])
    jag = 6 + 1.6 * noise(N, N, 2.2, seed=31) + 1.8 * noise(N, N, 7, seed=32)
    alpha = np.clip((d_edge - jag) / 1.4, 0, 1)
    fib2 = fbm(N, N, [0.5, 1.5, 5], [0.35, 0.35, 0.25])
    lit2, _ = shade(fib2 * 0.6, light=(-0.4, -0.7, 0.6))
    rgb2 = base * (0.96 + 0.04 * lit2[..., None])
    # borde ligeramente más translúcido/oscuro (fibras)
    edge = np.exp(-np.clip(d_edge - jag, 0, None) / 3)
    rgb2 *= (1 - 0.05 * edge)[..., None]
    alpha *= (1 - 0.12 * edge)
    to_img(rgb2, alpha).save(f'{OUT}/deckle.png', optimize=True)

# ---------------------------------------------------------------- 5. Foil dorado
def foil():
    W, H = 600, 300
    crinkle = fbm(H, W, [1.5, 4, 14], [0.3, 0.5, 0.8])
    lit, sp = shade(crinkle * 5, light=(-0.5, -0.6, 0.6), spec=0.9, power=10)
    yy, xx = np.mgrid[0:H, 0:W]
    band = 0.5 + 0.5 * np.sin((xx * 0.8 + yy) / 70)
    dark, mid, light = hexc('#8A6328'), hexc('#C9A35E'), hexc('#F3E1AE')
    t = np.clip(0.35 + 0.45 * (lit - 0.6) + 0.25 * band, 0, 1)[..., None]
    rgb = np.where(t < 0.5, dark + (mid - dark) * (t / 0.5), mid + (light - mid) * ((t - 0.5) / 0.5))
    rgb += sp[..., None] * np.array([1, .95, .8]) * 0.5
    to_img(rgb).save(f'{OUT}/foil.jpg', quality=85)

# ---------------------------------------------------------------- 6. Cinta de satén
def ribbon():
    S = 3; W, H = 520, 520
    img = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    P = [np.array(p, float) * S for p in [(560, 210), (380, 140), (300, 360), (120, 300), (-40, 470)]]
    def bez(t):  # catmull-rom por tramos
        n = len(P) - 1; seg = min(int(t * n), n - 1); u = t * n - seg
        p0 = P[max(seg - 1, 0)]; p1 = P[seg]; p2 = P[seg + 1]; p3 = P[min(seg + 2, n)]
        return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)
    M = 700; ts = np.linspace(0, 1, M)
    C = np.array([bez(t) for t in ts])
    T = np.gradient(C, axis=0); T /= np.linalg.norm(T, axis=1, keepdims=True)
    Nn = np.stack([-T[:, 1], T[:, 0]], 1)
    theta = 1.4 * np.sin(ts * 7.5 + 0.6) + 0.3
    w = 44 * S
    base = hexc('#AD4E18')
    for i in range(M - 1):
        c0 = math.cos(theta[i]); c1 = math.cos(theta[i + 1])
        a, b = C[i] + Nn[i] * w * c0, C[i] - Nn[i] * w * c0
        a2, b2 = C[i + 1] + Nn[i + 1] * w * c1, C[i + 1] - Nn[i + 1] * w * c1
        face = abs(c0)
        sheen = math.exp(-((theta[i] % math.pi - 1.05) / 0.25) ** 2)
        back = c0 < 0
        col = base * (0.45 + 0.55 * face) * (0.85 if back else 1) + 0.45 * sheen * np.array([1, .85, .75])
        col = tuple(int(v * 255) for v in np.clip(col, 0, 1)) + (255,)
        d.polygon([tuple(a), tuple(a2), tuple(b2), tuple(b)], fill=col)
    img = img.filter(ImageFilter.GaussianBlur(0.8 * S)).resize((W, H), Image.LANCZOS)
    img.save(f'{OUT}/ribbon.png', optimize=True)

# ---------------------------------------------------------------- 7. Rama de jazmín
def sprig():
    S = 2; W, H = 460, 380
    Wp, Hp = W * S, H * S
    leaves = []
    r4 = np.random.default_rng(5)
    stem = [(0, 40), (120, 90), (240, 150), (330, 230)]
    for k in range(9):
        t = (k + 0.5) / 9
        i = min(int(t * 3), 2); u = t * 3 - i
        x = stem[i][0] + (stem[i + 1][0] - stem[i][0]) * u; y = stem[i][1] + (stem[i + 1][1] - stem[i][1]) * u
        side = 1 if k % 2 else -1
        a = math.atan2(stem[i + 1][1] - stem[i][1], stem[i + 1][0] - stem[i][0]) + side * r4.uniform(0.5, 0.9)
        leaves.append((x * S, y * S, r4.uniform(70, 100) * S, r4.uniform(22, 30) * S, a))
    rgb = np.zeros((Hp, Wp, 3)); alpha = np.zeros((Hp, Wp))
    stem_img = Image.new('L', (Wp, Hp), 0)
    ImageDraw.Draw(stem_img).line([(x * S, y * S) for x, y in stem], fill=255, width=5 * S, joint='curve')
    sm = np.asarray(stem_img, float) / 255
    rgb[sm > 0] = hexc('#5E6F55'); alpha = np.maximum(alpha, sm)
    for (x, y, ln, wd, a) in leaves:
        m = Image.new('L', (Wp, Hp), 0); dd = ImageDraw.Draw(m)
        dd.polygon(leaf_poly(x, y, ln, wd, a), fill=255)
        m = np.asarray(m, float) / 255
        vein = Image.new('L', (Wp, Hp), 0)
        ImageDraw.Draw(vein).line([(x, y), (x + math.cos(a) * ln * .9, y + math.sin(a) * ln * .9)], fill=255, width=2 * S)
        vein = gaussian_filter(np.asarray(vein, float) / 255, 1.5)
        dist = distance_transform_edt(m > 0.5)
        hh = np.sqrt(np.clip(dist / (wd * 0.6), 0, 1)) - 0.5 * vein
        lit, sp = shade(hh * 8, spec=0.35, power=18)
        g1, g2 = hexc('#4E6660'), hexc('#93A89F')
        tone = np.clip(lit * 0.8, 0, 1.3)[..., None]
        col = g1 + (g2 - g1) * np.clip(tone - 0.2, 0, 1) + sp[..., None] * 0.6
        rgb = rgb * (1 - m[..., None]) + col * m[..., None]
        alpha = np.maximum(alpha, m)
    # flores blancas
    for (fx, fy, pr) in [(300, 250, 34), (215, 140, 26), (390, 300, 22)]:
        fx, fy, pr = fx * S, fy * S, pr * S
        for p in range(5):
            a = p * 2 * math.pi / 5 + 0.3
            m = Image.new('L', (Wp, Hp), 0)
            ImageDraw.Draw(m).polygon(leaf_poly(fx, fy, pr * 1.25, pr * 0.62, a), fill=255)
            m = np.asarray(m, float) / 255
            dist = distance_transform_edt(m > 0.5)
            hh = np.sqrt(np.clip(dist / (pr * 0.35), 0, 1))
            lit, sp = shade(hh * 6, spec=0.2, power=14)
            col = hexc('#FBF8F2') * (0.72 + 0.28 * np.clip(lit, 0, 1.2))[..., None] + sp[..., None] * .3
            rgb = rgb * (1 - m[..., None]) + col * m[..., None]
            alpha = np.maximum(alpha, m)
        yy, xx = np.mgrid[0:Hp, 0:Wp]
        cm = np.clip(1 - np.hypot(xx - fx, yy - fy) / (pr * 0.22), 0, 1)
        rgb = rgb * (1 - cm[..., None]) + hexc('#D9C27A') * cm[..., None]
    to_img(rgb, alpha).resize((W, H), Image.LANCZOS).save(f'{OUT}/sprig.png', optimize=True)

if __name__ == '__main__':
    for fn in (doors, seal, linen, paper, foil, ribbon, sprig):
        fn(); print('ok', fn.__name__, flush=True)
