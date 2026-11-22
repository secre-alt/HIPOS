"""Rebuilds pwa/land-mask.js from Natural Earth 1:50m land (public domain).

Usage: python3 scripts/make-land-mask.py path/to/ne_50m_land.geojson
Needs Pillow. The output is a 1440 x 720 land/sea bitmap stored as run lengths.
"""
import base64, json, sys
from PIL import Image, ImageDraw

W, H = 1440, 720
data = json.load(open(sys.argv[1]))
im = Image.new('1', (W, H), 0)
dr = ImageDraw.Draw(im)
pt = lambda ring: [((lon + 180) * W / 360, (90 - lat) * H / 180) for lon, lat in ring]
for f in data['features']:
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        dr.polygon(pt(poly[0]), fill=1)
        for hole in poly[1:]:
            dr.polygon(pt(hole), fill=0)
px = im.load()
runs, cur, count = [], False, 0
for y in range(H):
    for x in range(W):
        b = px[x, y] > 0
        if b == cur:
            count += 1
        else:
            runs.append(count); cur = b; count = 1
runs.append(count)
out = bytearray()
for r in runs:
    while True:
        b = r & 127; r >>= 7
        if r: out.append(b | 128)
        else: out.append(b); break
b64 = base64.b64encode(bytes(out)).decode()
src = open('pwa/land-mask.js').read()
start = src.index("export const LAND_RUNS = '") + len("export const LAND_RUNS = '")
open('pwa/land-mask.js', 'w').write(src[:start] + b64 + src[src.index("';", start):])
print(len(runs), 'runs', len(b64), 'base64 characters')
