"""Arreglos florales procedurales: orquídeas, anturios, calas, peonía, pompones, eucalipto y amaranto."""
import numpy as np, math, sys
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt, rotate as ndrot

SS = 2  # supermuestreo
LIGHT = np.array([-0.5, -0.65, 0.58]); LIGHT /= np.linalg.norm(LIGHT)
HALF = LIGHT + np.array([0, 0, 1.0]); HALF /= np.linalg.norm(HALF)

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) / 255 for i in (0, 2, 4)])

def mixc(a, b, t):
    return a + (b - a) * t

class Canvas:
    def __init__(s, W, H):
        s.W, s.H = W * SS, H * SS
        s.rgb = np.zeros((s.H, s.W, 3)); s.a = np.zeros((s.H, s.W))
    def over(s, rgb, a, x0, y0):
        h, w = a.shape
        X0, Y0 = max(x0, 0), max(y0, 0); X1, Y1 = min(x0 + w, s.W), min(y0 + h, s.H)
        if X1 <= X0 or Y1 <= Y0: return
        sa = a[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0, None]; sr = rgb[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        da = s.a[Y0:Y1, X0:X1, None]; dr = s.rgb[Y0:Y1, X0:X1]
        oa = sa + da * (1 - sa)
        s.rgb[Y0:Y1, X0:X1] = np.where(oa > 1e-6, (sr * sa + dr * da * (1 - sa)) / np.maximum(oa, 1e-6), 0)
        s.a[Y0:Y1, X0:X1] = oa[..., 0]
    def place(s, el, cx, cy, shadow=0.38):
        rgb, a = el
        h, w = a.shape
        x0, y0 = int(cx * SS - w / 2), int(cy * SS - h / 2)
        if shadow:
            pad = 30 * SS
            sh = np.pad(a, pad)
            sh = gaussian_filter(sh, 5 * SS) * shadow
            s.over(np.zeros(sh.shape + (3,)) + hexc('#2A1210'), sh, x0 - pad + 5 * SS, y0 - pad + 9 * SS)
        s.over(rgb, a, x0, y0)
    def save(s, path, size=None):
        img = Image.fromarray((np.dstack([np.clip(s.rgb, 0, 1), np.clip(s.a, 0, 1)]) * 255).astype(np.uint8), 'RGBA')
        img = img.resize((s.W // SS, s.H // SS), Image.LANCZOS)
        if size: img = img.resize(size, Image.LANCZOS)
        img.save(path, optimize=True)

def finish(height, albedo, alpha, gloss=0.2, power=24, ao=0.5, rot=0, bump=1.0):
    """Rota (si aplica) y sombrea con la luz global."""
    if rot:
        def R(x, order=1): return ndrot(x, rot, reshape=True, order=order, mode='constant', cval=0)
        height, alpha = R(height), R(alpha)
        albedo = np.dstack([R(albedo[..., i]) for i in range(3)])
    gy, gx = np.gradient(height * bump)
    n = np.dstack([-gx, -gy, np.ones_like(height)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    diff = np.clip((n * LIGHT).sum(2), 0, 1) / LIGHT[2]
    spec = np.clip((n * HALF).sum(2), 0, 1) ** power * gloss
    occ = np.clip(height - gaussian_filter(height, 6 * SS), -3, 3)
    shade = (0.35 + 0.65 * diff) * (1 + ao * 0.12 * occ)
    rgb = albedo * shade[..., None] + spec[..., None] * np.array([1, .96, .94])
    return np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)

def poly_mask(w, h, polys):
    im = Image.new('L', (w, h), 0); d = ImageDraw.Draw(im)
    for p in polys: d.polygon([tuple(q) for q in p], fill=255)
    return np.asarray(im, float) / 255

def leaf_pts(cx, cy, length, width, ang, n=40, round_=0.9, tip=0.25):
    pts = []
    for i in range(n + 1):
        t = i / n
        y = width * math.sin(math.pi * t) ** round_ * (1 - tip * t)
        pts.append((t * length, y))
    pts += [(x, -y) for x, y in reversed(pts[1:-1])]
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]

def dome(mask, r):
    d = distance_transform_edt(mask > 0.5)
    return np.sqrt(np.clip(d / r, 0, 1))

rng = np.random.default_rng(3)

# ------------------------------------------------------------------ elementos
def orchid(R, rot=0, seed=0):
    r = np.random.default_rng(seed)
    R *= SS; N = int(R * 2.6); c = N / 2
    layers = []
    # sépalos (atrás) y pétalos (adelante)
    sep = [(-90, 1.0, .40), (132, .98, .38), (48, .98, .38)]
    pet = [(192, 1.0, .72), (-12, 1.0, .72)]
    h = np.full((N, N), -9.0); A = np.zeros((N, N)); lift = 0
    for group, z in ((sep, 0.0), (pet, 0.35)):
        for ang, L, Wd in group:
            a = math.radians(ang + r.uniform(-6, 6))
            m = poly_mask(N, N, [leaf_pts(c, c, R * L, R * Wd * 1.0, a, round_=0.7, tip=0.1)])
            ph = dome(m, R * 0.10) * 0.35 + z
            h = np.where(m > 0.5, np.maximum(h, ph), h); A = np.maximum(A, m)
    # labelo
    lab = poly_mask(N, N, [leaf_pts(c, c + R * .05, R * .5, R * .2, math.radians(90), round_=.6, tip=-.4)])
    h = np.where(lab > .5, np.maximum(h, dome(lab, R * .1) * .5 + .7), h); A = np.maximum(A, lab)
    h[h < -5] = 0
    yy, xx = np.mgrid[0:N, 0:N]; rad = np.hypot(xx - c, yy - c) / R; ang = np.arctan2(yy - c, xx - c)
    # patrón reticulado: venas radiales + red de manchas
    nz = gaussian_filter(r.standard_normal((N, N)), 1.6 * SS); nz /= nz.std()
    fine = gaussian_filter(r.standard_normal((N, N)), .9 * SS); fine /= fine.std()
    veins = (np.abs(np.sin(ang * 26 + 1.5 * nz)) < .12) * (rad > .3)
    speck = (fine > 1.15) * 0.55 + veins * 0.25
    base = hexc('#5E0D2C'); pale = hexc('#E7CBD4')
    edge = np.clip((rad - 0.78) * 2.5, 0, 1)
    t = np.clip(speck + edge * 0.55 + np.clip(.22 - rad, 0, 1) * 2.5, 0, 1)
    alb = mixc(base, pale, t[..., None])
    alb = np.where((lab > .5)[..., None], hexc('#5A0E28'), alb)
    col = np.clip(1 - np.hypot(xx - c, yy - c + R * .08) / (R * .12), 0, 1)[..., None]
    alb = mixc(alb, hexc('#F3E8D6'), col)
    h = h + 0.03 * nz
    return finish(h * 10 * SS / 2, alb, A, gloss=.08, power=16, rot=rot)

def anthurium(S, rot=0, seed=0):
    r = np.random.default_rng(seed)
    S *= SS; N = int(S * 2.4); c = N / 2
    pts = []
    for i in range(200):
        t = i / 199 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        y = y * (1.45 if y > 0 else 1.0); x = x * (0.88 + 0.12 * (y < 0))
        pts.append((c + x * S / 17, c + y * S / 17 - S * .25))
    m = poly_mask(N, N, [pts])
    yy, xx = np.mgrid[0:N, 0:N]
    base_y = c - S * .25 - 5 * S / 17  # muesca superior (base de la espata)
    # venas en arco desde la base hacia la punta
    vein = np.zeros((N, N))
    for k in range(-4, 5):
        if k == 0: continue
        off = k * S * .1
        xv = c + off * np.sin(np.clip((yy - base_y) / (S * 1.35), 0, 1) * math.pi * .95)
        vein += np.exp(-((xx - xv) / (1.1 * SS)) ** 2) * (yy > base_y)
    mid = np.exp(-((xx - c) / (1.4 * SS)) ** 2) * (yy > base_y)
    d = distance_transform_edt(m > .5)
    h = np.sqrt(np.clip(d / (S * .18), 0, 1)) - .25 * np.clip(vein, 0, 1) + .2 * mid
    h += 0.25 * np.clip(1 - np.hypot(xx - c, yy - base_y - S * .2) / (S * .5), 0, 1)
    alb = mixc(hexc('#5C0A1C'), hexc('#8C1A2E'), np.clip(gaussian_filter(r.standard_normal((N, N)), 8 * SS) * .5 + .4, 0, 1)[..., None])
    rgb, a = finish(h * 10 * SS / 2, alb, m, gloss=.85, power=60, ao=.8)
    # espádice
    sp = np.zeros((N, N)); spa = np.zeros((N, N))
    L = S * .75; bx, by = c + S * .02, base_y + S * .25
    for i in range(160):
        t = i / 159
        x = bx - t * L * .55 + 0.12 * L * t * t; y = by - t * L * .75
        rr = S * .07 * (1 - .35 * t)
        dd = np.hypot(xx - x, yy - y)
        spa = np.maximum(spa, np.clip((rr - dd) / 1.5, 0, 1))
        sp = np.maximum(sp, np.sqrt(np.clip(1 - (dd / rr) ** 2, 0, 1)) * rr / SS * .15)
    bumps = gaussian_filter(r.standard_normal((N, N)), .8 * SS)
    tcol = np.clip((by - yy) / L, 0, 1)[..., None]
    salb = mixc(hexc('#E6C3B5'), hexc('#C9D19A'), tcol ** 2)
    srgb, sa = finish(sp * 6 + bumps * .05 * spa, salb, spa, gloss=.15, power=12)
    rgb = srgb * sa[..., None] + rgb * (1 - sa[..., None]); a = np.maximum(a, sa)
    if rot:
        rgb = np.dstack([ndrot(rgb[..., i], rot, reshape=True, order=1) for i in range(3)])
        a = ndrot(a, rot, reshape=True, order=1)
    return rgb, np.clip(a, 0, 1)

def calla(L, color='#4D0011', rot=0, seed=0, inner='#2B0008'):
    r = np.random.default_rng(seed)
    L *= SS; W = L * .62; N = int(L * 1.5); c = N / 2
    yy, xx = np.mgrid[0:N, 0:N].astype(float)
    top = c - L * .45; bot = c + L * .5
    t = np.clip((bot - yy) / (bot - top), 0, 1)
    half = (W / 2) * (0.09 + 0.91 * t ** 1.7)
    body = (np.abs(xx - c) < half) & (yy >= top) & (yy <= bot)
    # borde superior inclinado con punta curvada
    rim_y = top + (xx - c) / W * L * .22
    lip = poly_mask(N, N, [[(c - W * .55, top + L * .02), (c - W * .1, top - L * .12), (c + W * .35, top - L * .32),
                            (c + W * .62, top - L * .38), (c + W * .5, top - L * .18), (c + W * .55, top + L * .08)]]) > .5
    body = (body & (yy > rim_y)) | lip
    m = gaussian_filter(body.astype(float), .8 * SS)
    xn = np.clip((xx - c) / np.maximum(half, 1), -1, 1)
    h = np.sqrt(np.clip(1 - xn ** 2, 0, 1)) * (half / SS) * .5
    h = np.where(lip, 2 + (top - yy) / SS * .05, h)
    opening = np.clip(1 - (((xx - c - W * .08) / (W * .42)) ** 2 + ((yy - rim_y - L * .06) / (L * .09)) ** 2), 0, 1)
    opening *= (yy > rim_y)
    h -= opening * 6
    alb = np.zeros((N, N, 3)) + hexc(color)
    alb = mixc(alb, hexc(inner), np.clip(opening * 2, 0, 1)[..., None])
    alb = mixc(alb, alb * 0.7 + hexc('#3E5A32') * .3, np.clip((yy - (bot - L * .25)) / (L * .25), 0, 1)[..., None])
    # espádice amarilla
    spd = np.clip(1 - (((xx - c - W * .06) / (W * .06)) ** 2 + ((yy - rim_y - L * .02) / (L * .1)) ** 2), 0, 1) * (opening > 0)
    alb = mixc(alb, hexc('#E8C35A'), np.clip(spd * 3, 0, 1)[..., None]); h += spd * 3
    # tallo
    st = (np.abs(xx - c) < W * .055) & (yy > bot - 4) & (yy < N - 2)
    m = np.maximum(m, st.astype(float))
    hs = np.sqrt(np.clip(1 - ((xx - c) / (W * .055)) ** 2, 0, 1)) * 3
    h = np.where(st & (yy > bot), hs, h)
    alb = np.where((st & (yy > bot))[..., None], hexc('#55704A'), alb)
    return finish(h * SS / 2 * 2.2, alb, m, gloss=.35, power=30, rot=rot)

def ruffle_flower(R, kind='peony', seed=0):
    r = np.random.default_rng(seed)
    R *= SS; N = int(R * 2.3); c = N / 2
    yy, xx = np.mgrid[0:N, 0:N]
    h = np.full((N, N), -9.0); A = np.zeros((N, N)); tone = np.zeros((N, N)); dv = np.zeros((N, N))
    if kind == 'peony':
        rings = [(1.0, 7, .7), (.88, 7, .66), (.76, 7, .62), (.64, 6, .6), (.52, 6, .56), (.40, 5, .55), (.29, 5, .55), (.19, 4, .55), (.11, 3, .6)]
    else:  # pompón
        rings = [(1.0, 34, .16), (.86, 30, .16), (.72, 26, .17), (.58, 22, .18), (.44, 18, .19), (.3, 13, .2), (.16, 8, .22)]
    for li, (rr, n, wd) in enumerate(rings):
        off = r.uniform(0, 6.28)
        for k in range(n):
            a = off + k * 2 * math.pi / n + r.uniform(-.1, .1)
            ln = R * rr * r.uniform(.9, 1.05)
            if kind == 'peony':
                start = R * rr * r.uniform(.05, .3)
                a2 = a + r.uniform(-.25, .25)
                pts = leaf_pts(c + math.cos(a) * start, c + math.sin(a) * start, ln * r.uniform(.75, .95), ln * wd * r.uniform(.8, 1.1), a2, round_=.45, tip=-.5)
            else:
                pts = leaf_pts(c, c, ln, ln * wd * .55, a, round_=.6, tip=-.2)
            m = poly_mask(N, N, [pts])
            if kind == 'peony':  # borde ondulado
                m = m * (1 - .5 * (gaussian_filter(r.standard_normal((N, N)), 2 * SS) > .9))
            dd = dome(m, R * (.10 if kind == 'peony' else .05))
            if kind == 'peony':
                ph = li * .8 + .25 * dd + .45 * np.clip(1 - dd, 0, 1) ** 2 * (dd > 0) + r.uniform(0, .2)
            else:
                ph = dd * .8 + li * .55
            upd = (m > .5) & (ph > h)
            h = np.where(upd, ph, h); A = np.maximum(A, m); tone = np.where(upd, li / len(rings), tone); dv = np.where(upd, dd, dv)
    h[h < -5] = 0
    if kind == 'peony':
        alb = mixc(hexc('#7A1428'), hexc('#3A0410'), tone[..., None] ** 1.1)
        alb = mixc(alb, hexc('#A8485A'), (np.clip(1 - dv, 0, 1) ** 3 * .45)[..., None])  # bordes de pétalo
        gl = .2
    else:
        alb = mixc(hexc('#FBF6EC'), hexc('#E9DCC6'), tone[..., None] ** 2)
        cen = np.clip(1 - np.hypot(xx - c, yy - c) / (R * .12), 0, 1)[..., None]
        alb = mixc(alb, hexc('#D8C48A'), cen)
        gl = .08
    return finish(h * 4 * SS / 2, alb, A, gloss=gl, power=20, ao=(3.0 if kind == 'peony' else 1.6))

def eucalyptus(length, ang, bend=.4, seed=0, leaf=46):
    r = np.random.default_rng(seed)
    length *= SS; leaf *= SS; N = int(length * 2.2 + leaf * 4); c = N / 2
    pts = []; x, y = c, c
    a0 = math.radians(ang)
    for i in range(80):
        t = i / 79; a = a0 + bend * t
        pts.append((x, y)); x += math.cos(a) * length / 79; y += math.sin(a) * length / 79
    yy, xx = np.mgrid[0:N, 0:N]
    stem = Image.new('L', (N, N), 0); ImageDraw.Draw(stem).line(pts, fill=255, width=int(2.6 * SS), joint='curve')
    sm = np.asarray(stem, float) / 255
    h = sm * 1.0; A = sm.copy(); alb = np.zeros((N, N, 3)) + hexc('#6A5A4A')
    nl = 11
    for k in range(nl):
        t = .08 + .9 * k / nl
        i = int(t * 79); px, py = pts[i]
        a = a0 + bend * t + (1 if k % 2 else -1) * r.uniform(.9, 1.4)
        sz = leaf * (1.1 - .45 * t) * r.uniform(.85, 1.1)
        lx, ly = px + math.cos(a) * sz * .55, py + math.sin(a) * sz * .55
        m = poly_mask(N, N, [leaf_pts(lx - math.cos(a) * sz * .5, ly - math.sin(a) * sz * .5, sz, sz * .5, a, round_=.5, tip=.0)])
        ph = dome(m, sz * .5) * .45 + 1 + k * .25
        upd = (m > .5) & (ph > h)
        h = np.where(upd, ph, h); A = np.maximum(A, m)
        lc = mixc(hexc('#465A4C'), hexc('#6E8270'), r.uniform(0, 1)) * r.uniform(.88, 1.0)
        alb = np.where(upd[..., None], lc, alb)
    bloom = np.clip(gaussian_filter(r.standard_normal((N, N)), 6 * SS) * .5 + .3, 0, 1)[..., None]
    alb = mixc(alb, hexc('#B9C4BE'), bloom * .18 * (A[..., None] > .5))
    return finish(h * 3 * SS / 2, alb, A, gloss=.08, power=10, ao=2.0)

def amaranthus(length, sway=0.25, seed=0, cols=('#56702F', '#8EA552')):
    r = np.random.default_rng(seed)
    length *= SS; N = int(length * 1.25); W = int(length * .5)
    h = np.zeros((N, W)); A = np.zeros((N, W)); x, y = W * .5, 6 * SS
    yy, xx = np.mgrid[0:N, 0:W]
    pts = []
    for i in range(140):
        t = i / 139
        pts.append((W * .5 + math.sin(t * 3.2 + seed) * W * sway * t, 6 * SS + t * length))
    for (px, py), t in zip(pts, np.linspace(0, 1, len(pts))):
        rr = (8.5 - 4.5 * t) * SS
        for _ in range(6):
            bx, by = px + r.normal(0, rr * .8), py + r.normal(0, rr * .5)
            br = rr * r.uniform(.5, .9)
            x0, x1 = int(max(bx - br - 2, 0)), int(min(bx + br + 2, W)); y0, y1 = int(max(by - br - 2, 0)), int(min(by + br + 2, N))
            if x1 <= x0 or y1 <= y0: continue
            d = np.hypot(xx[y0:y1, x0:x1] - bx, yy[y0:y1, x0:x1] - by)
            sph = np.sqrt(np.clip(1 - (d / br) ** 2, 0, 1)) * br
            h[y0:y1, x0:x1] = np.maximum(h[y0:y1, x0:x1], sph)
            A[y0:y1, x0:x1] = np.maximum(A[y0:y1, x0:x1], np.clip((br - d) / 1.2, 0, 1))
    tone = np.clip(gaussian_filter(r.standard_normal((N, W)), 1.5) * .5 + .5, 0, 1)[..., None]
    alb = mixc(hexc(cols[0]), hexc(cols[1]), tone)
    return finish(h * .9, alb, A, gloss=.15, power=14, ao=1.5)

BURG = ('#3E0613', '#86203A')

def berry_cluster(n, seed=0):
    """Florecillas rojas tipo hypericum para dar acento."""
    r = np.random.default_rng(seed)
    N = 90 * SS; c = N / 2; h = np.zeros((N, N)); A = np.zeros((N, N))
    yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(n):
        bx, by = c + r.normal(0, 14 * SS), c + r.normal(0, 14 * SS); br = r.uniform(6, 9) * SS
        d = np.hypot(xx - bx, yy - by)
        sph = np.sqrt(np.clip(1 - (d / br) ** 2, 0, 1)) * br
        upd = sph > h; h = np.maximum(h, sph); A = np.maximum(A, np.clip((br - d) / 1.2, 0, 1))
    alb = np.zeros((N, N, 3)) + hexc('#8E1424')
    return finish(h * .8, alb, A, gloss=.6, power=40)

# ------------------------------------------------------------------ composiciones
def corner_tl(path):
    cv = Canvas(640, 720)
    E = eucalyptus
    cv.place(E(250, 2, .3, 1), 300, 95, .22)
    cv.place(E(230, 75, -.25, 2), 105, 300, .22)
    cv.place(E(200, 35, .2, 3, 40), 360, 260, .22)
    cv.place(E(160, -40, .3, 4, 38), 150, 80, .22)
    cv.place(amaranthus(380, .25, 11, BURG), 150, 470, .22)
    cv.place(amaranthus(330, .35, 12, BURG), 300, 450, .22)
    cv.place(amaranthus(250, .3, 1), 225, 420, .2)
    cv.place(amaranthus(280, .4, 13, BURG), 370, 420, .22)
    cv.place(calla(150, '#4D0011', rot=35, seed=1), 95, 150)
    cv.place(calla(140, '#F5EFE4', rot=-30, seed=2, inner='#D8CDB8'), 300, 110)
    cv.place(anthurium(80, rot=-35, seed=1), 120, 330)
    cv.place(ruffle_flower(70, 'pompon', 1), 270, 330)
    cv.place(ruffle_flower(82, 'peony', 2), 175, 200)
    cv.place(anthurium(66, rot=-125, seed=2), 365, 190)
    cv.place(berry_cluster(9, 1), 85, 245, .3)
    cv.place(orchid(60, rot=10, seed=1), 280, 225)
    cv.place(orchid(52, rot=-12, seed=2), 375, 315)
    cv.place(orchid(46, rot=20, seed=3), 195, 400)
    cv.save(path)

def corner_br(path):
    cv = Canvas(520, 500)
    E = eucalyptus
    cv.place(E(210, 190, .3, 5, 40), 300, 390, .22)
    cv.place(E(190, 255, -.3, 6, 40), 420, 300, .22)
    cv.place(E(150, 215, .2, 7, 36), 260, 300, .22)
    cv.place(amaranthus(200, .3, 14, BURG), 240, 400, .22)
    cv.place(calla(130, '#4D0011', rot=-150, seed=3), 410, 410)
    cv.place(ruffle_flower(62, 'pompon', 3), 300, 380)
    cv.place(anthurium(64, rot=145, seed=3), 410, 250)
    cv.place(ruffle_flower(72, 'peony', 4), 400, 335)
    cv.place(berry_cluster(8, 2), 460, 210, .3)
    cv.place(orchid(52, rot=-20, seed=4), 315, 300)
    cv.place(orchid(44, rot=15, seed=5), 245, 380)
    cv.save(path)

def rose_marker(path):
    cv = Canvas(160, 160)
    for ang, dx in ((-35, -28), (205, 28)):
        S_ = 34 * SS; N = int(S_ * 2.6); c = N / 2
        m = poly_mask(N, N, [leaf_pts(c - S_, c, S_ * 2, S_ * .55, 0, round_=.7, tip=.3)])
        vein = np.zeros((N, N)); yy, xx = np.mgrid[0:N, 0:N]
        vein += np.exp(-((yy - c) / (1.2 * SS)) ** 2) * (np.abs(xx - c) < S_)
        hh = dome(m, S_ * .3) - .4 * vein
        alb = np.zeros((N, N, 3)) + hexc('#3F5A3A')
        rgb, a = finish(hh * 6, alb, m, gloss=.3, power=20, rot=ang)
        cv.place((rgb, a), 80 + dx, 86, .25)
    cv.place(ruffle_flower(46, 'peony', 9), 80, 76, .35)
    cv.save(path)

if __name__ == '__main__':
    out = sys.argv[1]
    corner_tl(f'{out}/floral-tl.png'); print('tl')
    corner_br(f'{out}/floral-br.png'); print('br')
    rose_marker(f'{out}/rose.png'); print('rose')
