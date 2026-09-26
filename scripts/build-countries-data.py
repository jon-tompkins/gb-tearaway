import json, math
from collections import Counter
ne=json.load(open('/tmp/ne.geojson'))
places=json.load(open('/tmp/ne_places.geojson'))
ml=json.load(open('/tmp/mledoze.json'))
name_by_cca3={c['cca3']:c['name']['common'] for c in ml}
# capitals: index Admin-0 capitals by ISO (adm0_a3) and by country name
cap_by_iso={}; cap_by_name={}
for f in places['features']:
    p=f['properties']
    if p.get('featurecla')!='Admin-0 capital': continue
    lon,lat=f['geometry']['coordinates']
    rec=(p.get('name'), lon, lat)
    if p.get('adm0_a3'): cap_by_iso.setdefault(p['adm0_a3'], rec)
    if p.get('adm0name'): cap_by_name.setdefault(p['adm0name'].lower(), rec)
BUCKET={'Europe':'europe','Africa':'africa','Asia':'asia_oceania','Oceania':'asia_oceania',
        'North America':'americas','South America':'americas'}
def rings(geom):
    polys=[geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates']
    return [poly[0] for poly in polys]
def area(ring):
    a=0
    for i in range(len(ring)-1):
        x1,y1=ring[i]; x2,y2=ring[i+1]; a+=x1*y2-x2*y1
    return abs(a)/2
def rdp(pts, eps):
    if len(pts)<3: return pts
    def d(p,a,b):
        (x,y),(x1,y1),(x2,y2)=p,a,b; dx,dy=x2-x1,y2-y1
        if dx==dy==0: return math.hypot(x-x1,y-y1)
        t=max(0,min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)))
        return math.hypot(x-(x1+t*dx),y-(y1+t*dy))
    dmax,idx=0,0
    for i in range(1,len(pts)-1):
        dd=d(pts[i],pts[0],pts[-1])
        if dd>dmax: dmax,idx=dd,i
    return rdp(pts[:idx+1],eps)[:-1]+rdp(pts[idx:],eps) if dmax>eps else [pts[0],pts[-1]]
TARGET=300.0; out=[]; skipped=[]
for f in ne['features']:
    p=f['properties']; cont=p.get('CONTINENT')
    if cont not in BUCKET: continue
    iso=p.get('ISO_A3')
    if not iso or iso=='-99': iso=p.get('ISO_A3_EH')
    disp=name_by_cca3.get(iso) or p.get('NAME')
    cc=cap_by_iso.get(iso) or cap_by_name.get((p.get('NAME') or '').lower()) or cap_by_name.get((p.get('ADMIN') or '').lower())
    if not cc:
        skipped.append(disp); continue
    capname,clon,clat=cc
    # Manual capital overrides (name, lon, lat) where NE's admin-0 pick differs
    # from the one we want to teach.
    OVERRIDE={'South Africa':('Pretoria',28.2293,-25.7479)}
    ov=OVERRIDE.get(disp) or OVERRIDE.get(p.get('NAME'))
    if ov: capname,clon,clat=ov
    rs=rings(f['geometry']); areas=[area(r) for r in rs]; maxA=max(areas)
    # Keep the main landmass + nearby islands; drop distant overseas territories
    # (e.g. French Guiana with metropolitan France, Alaska/Hawaii with the US).
    def centroid(r):
        xs=[p[0] for p in r]; ys=[p[1] for p in r]; return (sum(xs)/len(xs), sum(ys)/len(ys))
    bi=max(range(len(rs)), key=lambda i: areas[i]); bcx,bcy=centroid(rs[bi])
    bxs=[p[0] for p in rs[bi]]; bys=[p[1] for p in rs[bi]]
    kk0=math.cos(math.radians(sum(bys)/len(bys)))
    bspan=max((max(bxs)-min(bxs))*kk0, max(bys)-min(bys)); THRESH=3.0*bspan
    keep=[]
    for r,a in zip(rs,areas):
        if a < 0.04*maxA: continue
        cx,cy=centroid(r)
        if math.hypot((cx-bcx)*kk0,(cy-bcy))<=THRESH: keep.append(r)
    if not keep: keep=[rs[bi]]
    allpts=[pt for r in keep for pt in r]; lons=[pt[0] for pt in allpts]
    unwrap=(max(lons)-min(lons))>180
    def ux(lon): return lon+360 if (unwrap and lon<0) else lon
    midlat=sum(pt[1] for pt in allpts)/len(allpts); k=math.cos(math.radians(midlat))
    xs=[ux(pt[0])*k for pt in allpts]; ys=[pt[1] for pt in allpts]
    minx,maxx,miny,maxy=min(xs),max(xs),min(ys),max(ys)
    dx,dy=maxx-minx,maxy-miny; s=TARGET/max(dx,dy); W=round(dx*s,1); H=round(dy*s,1)
    def tf(lon,lat): return (round((ux(lon)*k-minx)*s,1), round((maxy-lat)*s,1))
    subs=[]
    for r in keep:
        simp=rdp([tf(pt[0],pt[1]) for pt in r],1.0)
        if len(simp)>=3: subs.append("M "+" ".join(f"{x} {y}" for x,y in simp)+" Z")
    sx,sy=tf(clon,clat); star=[min(max(sx,0),W),min(max(sy,0),H)]
    out.append(dict(name=disp,capital=capname,continent=BUCKET[cont],path=" ".join(subs),star=star,w=W,h=H))
print("countries:",len(out),"by continent:",dict(Counter(o['continent'] for o in out)))
print("skipped:",len(skipped),skipped)
lines=["// AUTO-GENERATED (Natural Earth 110m outlines + capitals). Offline; no runtime fetch.",
 "export interface CountryShape { name: string; capital: string; continent: 'europe'|'africa'|'asia_oceania'|'americas'; path: string; star: [number, number]; w: number; h: number; }",
 "export const COUNTRIES: CountryShape[] = ["]
for o in sorted(out,key=lambda o:(o['continent'],o['name'])):
    lines.append(f"  {{ name: {json.dumps(o['name'])}, capital: {json.dumps(o['capital'])}, continent: {json.dumps(o['continent'])}, w: {o['w']}, h: {o['h']}, star: [{o['star'][0]}, {o['star'][1]}], path: {json.dumps(o['path'])} }},")
lines.append("];")
open('src/lib/puzzles/countries-data.ts','w').write("\n".join(lines)+"\n")
import os; print("file KB:",round(os.path.getsize('src/lib/puzzles/countries-data.ts')/1024))
