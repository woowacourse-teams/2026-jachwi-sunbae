# 소개 영상(intro.html)의 동네 찾기 장면에 쓸 판교역 주변 행정동 경계를 assets/dongs-pangyo.js로 만든다. 저장소 루트에서 `python3 tools/landing-motion/dongs.py`.

import json, math, sys
d=json.load(open('frontend/data/admin-dongs.geojson'))
PG=(127.1112,37.3948)
SIG=('성남시 분당구','성남시 수정구','성남시 중원구','용인시 수지구','서초구','강남구','송파구','용인시 기흥구','의왕시','과천시','하남시','광주시','강동구','안양시 동안구','군포시','수원시 영통구')
feats=[f for f in d['features'] if f['properties']['sigunguName'] in SIG]
def rings(g): return [g['coordinates'][0]] if g['type']=='Polygon' else [p[0] for p in g['coordinates']]
sp=[f for f in feats if f['properties']['name']=='삼평동' and f['properties']['sigunguName']=='성남시 분당구'][0]
r=rings(sp['geometry'])[0]
lon0=(min(p[0] for p in r)+max(p[0] for p in r))/2; lat0=(min(p[1] for p in r)+max(p[1] for p in r))/2
K=2.44; MX=111320*math.cos(math.radians(lat0)); MY=110540
proj=lambda p:(3000+(p[0]-lon0)*MX*K, -(p[1]-lat0)*MY*K)
def dp(pts,tol):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy)
    if L<1e-6:
        h=len(pts)//2; return dp(pts[:h+1],tol)[:-1]+dp(pts[h:],tol)
    i,dm=0,0
    for j in range(1,len(pts)-1):
        dd=abs(dy*pts[j][0]-dx*pts[j][1]+b[0]*a[1]-b[1]*a[0])/L
        if dd>dm: i,dm=j,dd
    if dm>tol: return dp(pts[:i+1],tol)[:-1]+dp(pts[i:],tol)
    return [a,b]
X0,X1,Y0,Y1=-27000,33000,-19000,21000
out=[]
for f in feats:
    polys=[]
    for rg in rings(f['geometry']):
        s=dp([proj(p) for p in rg],30)
        if len(s)>=4: polys.append([[round(x),round(y)] for x,y in s])
    if not polys: continue
    xs=[p[0] for q in polys for p in q]; ys=[p[1] for q in polys for p in q]
    cx,cy=(min(xs)+max(xs))/2,(min(ys)+max(ys))/2
    if not (X0<cx<X1 and Y0<cy<Y1): continue
    lon=lon0+(cx-3000)/(MX*K); lat=lat0-cy/(MY*K)
    km=math.hypot((lon-PG[0])*MX,(lat-PG[1])*MY)/1000
    band='fast' if km<=2.4 else 'medium' if km<=5.5 else ''
    out.append({'n':f['properties']['name'],'p':polys,'c':[round(cx),round(cy)],'b':band})
pg=[round(v) for v in proj(PG)]
print(len(out), sum(1 for o in out if o['b']=='fast'), sum(1 for o in out if o['b']=='medium'), 'PG', pg, file=sys.stderr)
js=json.dumps({'pangyo':pg,'bounds':[X0,Y0,X1-X0,Y1-Y0],'dongs':out},ensure_ascii=False,separators=(',',':'))
print(len(js), file=sys.stderr)
open('tools/landing-motion/assets/dongs-pangyo.js','w').write('// 판교역 주변 행정동 경계. frontend/data/admin-dongs.geojson을 영상 좌표로 옮기고 단순화했다(tools/landing-motion/dongs.py).\nwindow.DONGS = '+js+';\n')
