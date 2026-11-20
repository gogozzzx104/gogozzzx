import numpy as np, json, math, random
F=np.load('feat.npz'); O=np.load('ons.npz')
B=60/202; S=B/4; T0=round(0.003+B/2+B-0.008,4); NB=164
NS=NB*16
A=np.zeros(NS+64)
for t,st in zip(O['t'],O['st']):
    g=(t-T0)/S; i=int(round(g))
    if 0<=i<NS and abs(g-i)*S<0.03: A[i]=max(A[i],float(st))
def pad(v): return np.concatenate([v,np.zeros(NS+64-len(v))])[:NS+64]
K,SN,HH,M,AA,PIT=[pad(F[k]) for k in 'k s h m a pit'.split()]
rng=random.Random(20261120)

# ---------- step selection (per-beat intensity from 16th-note salience) ----------
F2=np.load('feat2.npz')
RAW=np.concatenate([np.maximum.reduce([F2['k_raw'],F2['s_raw'],F2['m_raw'],F2['a_raw']]),np.zeros(64)])
RMS=np.concatenate([F2['rms'],np.zeros(64)])
NBEAT=NB*4
LOUD=[]
KIND=[]  # per beat: 'S' full 16th stream, 'G' gallop (one 16th), 'E' eighths, 'Q' quarter only, 'R' rest
ODD={}
for q in range(NBEAT):
    i=q*4; o1,o3=RAW[i+1],RAW[i+3]; e0,e2=RAW[i],RAW[i+2]
    # loudness of the surrounding two bars decides how much salience a beat needs: quiet passages only keep
    # their clear bursts, loud passages follow the 16th-note texture closely
    Lq=min(1.0,max(0.0,(RMS[max(0,i-16):i+20].mean()*100-6.8)/(11.5-6.8))); LOUD.append(Lq)
    if min(o1,o3)>=0.92-0.37*Lq and (o1+o3)/2>=1.28-0.54*Lq: KIND.append('S')
    elif max(o1,o3)>=1.45-0.60*Lq: KIND.append('G'); ODD[q]=1 if o1>=o3 else 3
    elif e0<0.60-0.30*Lq and e2<0.85-0.40*Lq: KIND.append('R')
    elif e2<0.85-0.40*Lq: KIND.append('Q')
    else: KIND.append('E')
# breathing room: never more than 8 stream beats (32 notes) in a row
run=0
for q in range(NBEAT):
    run=run+1 if KIND[q]=='S' else 0
    if run>8: KIND[q]='E'; run=0
# a lone eighth-note beat between two stream beats reads as a gap in the roll: keep it only if the 16ths there are clearly weaker
for q in range(1,NBEAT-1):
    if KIND[q] in 'EG' and KIND[q-1]=='S' and KIND[q+1]=='S' and (RAW[q*4+1]+RAW[q*4+3])/2>=1.15-0.45*LOUD[q]:
        back=0
        while q-1-back>=0 and KIND[q-1-back]=='S': back+=1
        fwd=0
        while q+1+fwd<NBEAT and KIND[q+1+fwd]=='S': fwd+=1
        if back+fwd+1<=8: KIND[q]='S'; ODD.pop(q,None)
def sel(bar,level,glitch=False,evens_only=False):
    out=[]
    for qq in range(4):
        q=bar*4+qq; k=KIND[q]; b=qq*4
        if k=='R': continue
        out.append(b)
        if k in 'ESG': out.append(b+2)
        if evens_only: continue
        if k=='S': out+= [b+1,b+3]
        elif k=='G': out.append(b+ODD[q])
    return sorted(out)
def nstream(bar): return sum(1 for qq in range(4) if KIND[bar*4+qq]=='S')
def odmean(bar): return float(RAW[bar*16+1:bar*16+16:2].mean())
def accent(bar,s):
    i=bar*16+s; return (s%4==0 and K[i]>=0.55) or SN[i]>=0.85 or A[i]>=0.75
def pitx(bar,s):
    i=bar*16+s; a=max(0,i-64); seg=PIT[a:i+64]; seg=seg[seg>0]
    if len(seg)<4 or PIT[i]<=0: return 8
    lo,hi=np.percentile(seg,8),np.percentile(seg,92)
    return 2.4+11.2*min(1,max(0,(PIT[i]-lo)/(hi-lo+1e-6)))

# events: ('tap',gstep,x,w,hand) ; ('long',gstep,[(gstep,x)...],w,hand,slide)
EV=[]
def tap(bar,s,x,w=3.0,hand=None): EV.append(['tap',bar*16+s,float(x),float(w),hand])
def lng(bar,s,path,w=3.0,hand='L',slide=True): EV.append(['long',bar*16+s,[(bar*16+s+d,float(x)) for d,x in path],float(w),hand,slide])
mir=lambda p:[(d,16-x) for d,x in p]
st={'stair':5.0,'dir':1,'jl':0,'od':0,'sg':0,'tr':0,'hk':0,'sl':0,'ds':0,'sw':0,'gl':0,'ce':0.0,'mi':0}

def s_melody(bar,steps,L):
    for s in steps:
        if s%2: tap(bar,s,pitx(bar,s-1)+(1.6 if rng.random()<.5 else -1.6),2.2)
        else: tap(bar,s,pitx(bar,s),3.8 if accent(bar,s) else 3.0)
def s_center(bar,steps,L):
    for s in steps:
        st['ce']+=0.95; x=8+3.1*math.sin(st['ce']); tap(bar,s,x,2.2 if s%2 else 2.7)
        if L>=4 and s%8==0: tap(bar,s,x+(5.2 if x<8 else -5.2),2.7)
def s_stairs(bar,steps,L):
    for s in steps:
        st['stair']+=st['dir']*(1.0 if s%2 else 1.75)
        if st['stair']>13.6: st['stair']=13.6; st['dir']=-1
        if st['stair']<2.4: st['stair']=2.4; st['dir']=1
        tap(bar,s,st['stair'],2.8)
        if L>=5 and s%8==4:
            x=st['stair']; tap(bar,s,x-5 if x>8 else x+5,2.8)
def s_mirror(bar,steps,L):
    st['mi']+=1; inward=st['mi']%2==0
    for k,s in enumerate(steps):
        j=k//2%4; d=j*1.5 if inward else (3-j)*1.5
        if k%2==0: tap(bar,s,2.0+d,2.8,'L')
        else: tap(bar,s,14.0-d,2.8,'R')
        if L>=4 and s%8==0 and k%2==0: tap(bar,s,14.0-d,2.8,'R')
JL=[[8,4.5,11.5,6.5],[3,12.5,9.5,5.5],[10,6,13,2.5],[7,9,4,12],[5,11,8,13.5],[12,3.5,6.5,10]]
def s_jack(bar,steps,L):
    lanes=JL[st['jl']%len(JL)]; st['jl']+=1
    for s in steps:
        q=s//4; x=lanes[q%4]; hand='L' if x<7.5 else 'R' if x>8.5 else ('L' if q%2==0 else 'R')
        if s%2:  # 16th inside a jack: other hand grace
            tap(bar,s,x+(3.4 if hand=='L' else -3.4),2.0,'R' if hand=='L' else 'L'); continue
        tap(bar,s,x,2.6,hand)
        if (s%4==0 and L>=4) or (L>=5 and accent(bar,s)):
            ox=x+5.0 if hand=='L' else x-5.0; ox=min(14.3,max(1.7,ox)); tap(bar,s,ox,2.6,'R' if hand=='L' else 'L')
def s_trill1h(bar,steps,L):
    st['tr']+=1
    for s in steps:
        half=s//8; hand='L' if (half+st['tr'])%2==0 else 'R'; base=[3.2,5.0,2.2][st['tr']%3]
        a,b=(base,base+2.9) if hand=='L' else (16-base,16-base-2.9)
        if s%2: tap(bar,s,(11.5 if hand=='L' else 4.5),2.0,'R' if hand=='L' else 'L'); continue
        tap(bar,s,a if (s//2)%2==0 else b,2.4,hand)
        if s%8==0: tap(bar,s,12.5 if hand=='L' else 3.5,4.2,'R' if hand=='L' else 'L')
        elif L>=5 and s%8==4: tap(bar,s,10.5 if hand=='L' else 5.5,2.6,'R' if hand=='L' else 'L')
PAIRS=[(2.5,7.2),(9,13.5),(4,11),(6,10.6),(1.9,6.2),(9.8,14.1),(5,8.8),(7.4,12),(3,13),(6.6,9.4)]
SING=[8,4.5,11.5,6.4,9.6,2.6,13.4,7.2,10.2,5.4]
def s_offdouble(bar,steps,L):
    for s in steps:
        if s%2: tap(bar,s,SING[st['sg']%10]+(1.3 if st['sg']%2 else -1.3),2.0); continue
        if (s%4==0 and (L>=4 or accent(bar,s))) or (L>=5 and accent(bar,s)):
            a,b=PAIRS[st['od']%len(PAIRS)]; st['od']+=1; w=2.4 if b-a<4.5 else 3.0
            tap(bar,s,a,w,'L'); tap(bar,s,b,w,'R')
        else:
            tap(bar,s,SING[st['sg']%10],2.8); st['sg']+=1
HX=[(3,[11,13,12,10]),(5.5,[12,14,11,13]),(7.2,[12.5,13.8,11.5,13]),(2.2,[8,10,7,9.5])]
def s_hold_tap(bar,steps,L,jack=False):
    st['hk']+=1
    for half in (0,1):
        hx,tx=HX[(st['hk']+half)%len(HX)]; hand='L' if (st['hk']+half)%2==0 else 'R'
        if hand=='R': hx=16-hx; tx=[16-v for v in tx]
        if half*8 not in steps and half*8+2 not in steps: continue
        lng(bar,half*8,[(0,hx),(6,hx)],3.2 if abs(hx-8)>2 else 2.6,hand,False)
        k=0
        for s in steps:
            if half*8<s<half*8+8:
                if s%2: continue
                tap(bar,s,tx[0] if jack else tx[k%4],2.6 if jack else 2.8,'R' if hand=='L' else 'L'); k+=1
def s_hold_jack(bar,steps,L): s_hold_tap(bar,steps,L,True)
SLP=[[(0,2.5),(4,7),(8,3),(12,8),(14,6)],[(0,6.5),(6,2.2),(14,9)],[(0,3),(14,10)],[(0,8),(4,4),(8,8.5),(14,2.5)],[(0,2.2),(3,5.5),(6,2.2),(9,5.5),(12,2.2),(14,4)],[(0,9.5),(7,3),(14,7)]]
def pathx(path,d):
    for i in range(1,len(path)):
        if d<=path[i][0]:
            f=(d-path[i-1][0])/(path[i][0]-path[i-1][0]); return path[i-1][1]+(path[i][1]-path[i-1][1])*(0.5-0.5*math.cos(math.pi*f))
    return path[-1][1]
def s_slide_tap(bar,steps,L,jack=False):
    p=SLP[st['sl']%len(SLP)]; hand='L' if st['sl']%2==0 else 'R'; st['sl']+=1
    lng(bar,0,p if hand=='L' else mir(p),3.0,hand,True)
    k=0; jl=13.2
    for s in steps:
        if s<2 or s%2: continue
        sx=pathx(p,min(s,14)); x=jl if jack else max(sx+4.6,[11.5,13.5,12.4,14][k%4]); x=min(14.4,max(x,sx+4.4)); k+=1
        tap(bar,s,x if hand=='L' else 16-x,2.6,'R' if hand=='L' else 'L')
def s_slide_jack(bar,steps,L): s_slide_tap(bar,steps,L,True)
DS=[([(0,2.5),(7,6.3),(14,2.5)],[(0,13.5),(7,9.7),(14,13.5)]),([(0,2.5),(7,8),(14,3)],[(0,8),(7,13.5),(14,8.5)]),([(0,6),(5,2.2),(10,6.2),(14,3)],[(0,10),(5,13.8),(10,9.8),(14,13)]),([(0,2.2),(14,8.5)],[(0,7.5),(14,13.8)]),([(0,6.8),(7,2.5),(14,6.8)],[(0,13.5),(7,9.2),(14,13.5)])]
def s_dual_slide(bar,steps,L):
    a,b=DS[st['ds']%len(DS)]; st['ds']+=1; lng(bar,0,a,3.0,'L'); lng(bar,0,b,3.0,'R')
SW=[[(3,7),(13,9),(6,2.2),(10,13.8)],[(6.5,2.5),(9.5,13.5),(2.5,6.5),(13.5,9.5)],[(2.5,8),(13.5,8),(7,3),(9,13)]]
def s_sweep(bar,steps,L):
    sw=SW[st['sw']%len(SW)]; st['sw']+=1
    for q in range(4):
        a,b=sw[q]; hand='L' if q%2==0 else 'R'; lng(bar,q*4,[(0,a),(3,b)],2.8,hand)
        s=q*4+2
        if s in steps: tap(bar,s,(13 if hand=='L' else 3)+(-1.5 if q>1 else 0),2.6,'R' if hand=='L' else 'L')
def s_glitch(bar,steps,L):
    prev=-9; run=0
    for s in steps:
        run=run+1 if s-prev==1 else 0; prev=s; st['gl']+=1
        if run>0 or (s+1 in steps):
            c=[8,6.5,9.5,7.2,8.8][(st['gl']//6)%5]; hand='L' if st['gl']%2==0 else 'R'
            tap(bar,s,c-1.9 if hand=='L' else c+1.9,2.1,hand)
        else:
            tap(bar,s,[4,12,8,6,10][st['gl']%5],3.2 if s%4 else 4.6)
def s_wide(bar,steps,L):
    for k,s in enumerate(steps):
        if s%8==0: tap(bar,s,8,7.0)
        else: tap(bar,s,[4.5,11.5,6.5,9.5][k%4],3.0)
SF=dict(melody=s_melody,center=s_center,stairs=s_stairs,mirror=s_mirror,jack=s_jack,trill1h=s_trill1h,offdouble=s_offdouble,hold_tap=s_hold_tap,hold_jack=s_hold_jack,slide_tap=s_slide_tap,slide_jack=s_slide_jack,dual_slide=s_dual_slide,sweep=s_sweep,glitch=s_glitch,wide=s_wide)
PLAN=[(0,1,'melody center melody wide'),(4,3,'glitch glitch'),(6,2,'stairs hold_tap'),
 (8,2,'melody center hold_tap offdouble slide_tap glitch stairs jack'),
 (16,3,'offdouble melody trill1h slide_tap'),(20,2,'dual_slide hold_tap center glitch'),
 (24,3,'jack stairs hold_jack mirror'),(28,4,'offdouble melody glitch jack'),
 (32,4,'jack offdouble stairs trill1h slide_tap'),(37,2,'dual_slide hold_tap sweep'),
 (40,4,'mirror jack offdouble slide_jack stairs hold_jack melody trill1h'),
 (48,4,'offdouble slide_tap jack center hold_tap stairs sweep glitch'),
 (56,5,'jack offdouble slide_jack mirror trill1h hold_jack stairs offdouble'),
 (64,4,'melody slide_tap center jack hold_tap offdouble sweep glitch'),
 (72,5,'jack offdouble slide_jack stairs hold_jack trill1h mirror'),
 (79,4,'melody slide_tap center offdouble jack sweep hold_tap stairs mirror'),
 (88,5,'offdouble jack slide_tap trill1h stairs hold_jack mirror melody slide_jack center jack offdouble sweep hold_tap stairs trill1h'),
 (104,3,'dual_slide slide_tap hold_tap dual_slide'),(108,4,'jack jack offdouble glitch'),
 (112,4,'melody mirror slide_tap jack center hold_jack sweep stairs'),
 (120,5,'offdouble jack slide_jack trill1h'),(124,3,'dual_slide hold_tap melody sweep'),
 (128,5,'jack offdouble stairs slide_jack mirror hold_jack trill1h offdouble slide_tap jack center stairs mirror'),
 (141,3,'dual_slide hold_tap sweep'),(144,4,'melody stairs mirror melody slide_tap stairs center glitch'),
 (152,5,'jack offdouble slide_jack trill1h glitch'),(157,2,'wide'),(158,5,'jack glitch offdouble glitch'),(162,1,'dual_slide wide')]
CRASH={32,48,56,72,88,120,128,152,158}
_br=[float(F2['rms'][b*16:b*16+16].mean())*100 for b in range(NB)]
CRASH|={b for b in range(1,NB) if _br[b]-_br[b-1]>=2.0}
print('impact bars',sorted(CRASH))
plan={}
for (b0,lv,names) in PLAN:
    for i,nm in enumerate(names.split()): plan[b0+i]=(lv,nm)
assert sorted(plan)==list(range(NB)), [b for b in range(NB) if b not in plan]
styles_used={}
LONGS={'hold_tap','hold_jack','slide_tap','slide_jack','dual_slide','sweep'}
POOL_A=['stairs','offdouble','center','mirror','melody','jack','trill1h','glitch']
pa=0; sf=0; lead=0
FIG=['trill','up','out','broken','tight','down','in','wide']
def stream_fig(g0,n,fig,lead):
    # n consecutive 16ths starting at global step g0; hands strictly alternate, `lead` plays the first note
    res=[]
    for i in range(n):
        h=lead if i%2==0 else ('R' if lead=='L' else 'L'); j=i//2; f=i/max(1,n-1)
        if fig=='trill': x=5.6 if h=='L' else 10.4
        elif fig=='up': x=(3.0 if h=='L' else 7.4)+f*5.4
        elif fig=='down': x=(8.6 if h=='L' else 13.0)-f*5.4
        elif fig=='out': x=(6.6-f*4.2) if h=='L' else (9.4+f*4.2)
        elif fig=='in': x=(2.4+f*4.2) if h=='L' else (13.6-f*4.2)
        elif fig=='broken': x=[4.0,6.6,3.0,5.6][j%4] if h=='L' else [10.4,13.0,9.4,12.0][j%4]
        elif fig=='tight': x=6.7 if h=='L' else 9.3
        else: x=[2.6,5.2][j%2] if h=='L' else [13.4,10.8][j%2]
        res.append(['tap',g0+i,float(x),2.2 if fig!='tight' else 2.0,h])
    return res
kinds={}
for bar in range(NB):
    lv,nm=plan[bar]; ns=nstream(bar)
    if nm in LONGS and ns>=2: nm=POOL_A[pa%len(POOL_A)]; pa+=1
    if nm=='dual_slide' and not (odmean(bar)<0.64 or bar>=162): nm='slide_tap'
    if nm=='glitch' and ns==0: nm='offdouble'
    steps=sel(bar,lv,evens_only=nm in LONGS)
    if not steps: continue
    styles_used[nm]=styles_used.get(nm,0)+1
    n0=len(EV); SF[nm](bar,steps,lv)
    if bar in CRASH:
        EV[n0:]=[e for e in EV[n0:] if not (e[0]=='tap' and e[1]==bar*16)]
        if not any(e[0]=='long' and e[1]==bar*16 for e in EV[n0:]):
            EV.append(['tap',bar*16,4.2,5.0,'L']); EV.append(['tap',bar*16,11.8,5.0,'R'])
# stream runs replace whatever the style put on those beats
q=0
while q<NBEAT:
    if KIND[q]!='S': q+=1; continue
    q1=q
    while q1<NBEAT and KIND[q1]=='S': q1+=1
    g0,g1=q*4,q1*4
    if any(e[0]=='long' and e[1]<g1 and e[2][-1][0]>=g0 for e in EV): q=q1; continue
    keep_first=[e for e in EV if e[0]=='tap' and e[1]==g0 and e[3]>=4.5]   # section impact stays
    EV=[e for e in EV if not (e[0]=='tap' and g0<=e[1]<g1)]
    n=g1-g0; lead_h='L' if lead%2==0 else 'R'; lead+=1
    # long runs change figure every 2 beats so the roll keeps moving
    pos=0
    while pos<n:
        ln=min(8,n-pos) if n-pos!=12 else 4
        hand=lead_h if pos%2==0 else ('R' if lead_h=='L' else 'L')
        EV+=stream_fig(g0+pos,ln,FIG[sf%len(FIG)],hand); sf+=1; pos+=ln
    if keep_first: EV=[e for e in EV if not (e[0]=='tap' and e[1]==g0 and e[3]<4.5)]+keep_first
    q=q1

# ---------- hand solver ----------
EV.sort(key=lambda e:(e[1],0 if e[0]=='long' else 1,e[2] if e[0]=='tap' else 0))
H={'L':dict(busy=-9,last=-9,x=4,path=None),'R':dict(busy=-9,last=-9,x=12,path=None)}
out=[]; dropped=0
def hx(h,g):
    d=H[h]
    if d['path'] and g<=d['path'][-1][0]: return pathx([(a-d['path'][0][0],x) for a,x in d['path']],g-d['path'][0][0])
    return None
for e in EV:
    g=e[1]
    if e[0]=='long':
        h=e[4]; o='R' if h=='L' else 'L'; d=H[h]
        if g<d['busy'] or g-d['last']<2: dropped+=1; continue
        ox=hx(o,g)
        if ox is not None and ((h=='L' and e[2][0][1]>ox-2.6) or (h=='R' and e[2][0][1]<ox+2.6)): dropped+=1; continue
        d['busy']=e[2][-1][0]+2; d['last']=e[2][-1][0]; d['path']=e[2]; d['x']=e[2][-1][1]
        out.append(dict(g=g,long=1,slide=int(e[5]),w=e[3],path=[[a,round(x,2)] for a,x in e[2]],hand=h)); continue
    x,w,pref=e[2],e[3],e[4]
    def ok(h): return g>=H[h]['busy'] and g-H[h]['last']>=2
    cand=[h for h in 'LR' if ok(h)]
    if not cand: dropped+=1; continue
    if pref in cand: h=pref
    elif len(cand)==1: h=cand[0]
    else:
        if x<5.5: h='L'
        elif x>10.5: h='R'
        else: h='L' if H['L']['last']<H['R']['last'] else 'R' if H['R']['last']<H['L']['last'] else ('L' if x<8 else 'R')
    o='R' if h=='L' else 'L'
    x=min(x,11.0) if h=='L' else max(x,5.0)
    ox=hx(o,g)
    if ox is None and H[o]['last']==g: ox=H[o]['x']
    if ox is not None:
        x=min(x,ox-2.7) if h=='L' else max(x,ox+2.7)
    gap=g-H[h]['last']; mj=5.5 if gap<=2 else 8.5 if gap<=4 else 99
    if abs(x-H[h]['x'])>mj: x=H[h]['x']+math.copysign(mj,x-H[h]['x'])
    if ox is not None and ((h=='L' and x>ox-2.5) or (h=='R' and x<ox+2.5)): dropped+=1; continue
    x=min(16-w/2-0.1,max(w/2+0.1,x))
    H[h]['last']=g; H[h]['x']=x
    out.append(dict(g=g,long=0,x=round(x,2),w=w,hand=h))
# ---------- validate + stats ----------
bad=0
for n in out:
    same=[m for m in out if m['g']==n['g'] and not m['long']]+[m for m in out if m['long'] and m['g']==n['g']]
    act=[m for m in out if m['long'] and m['g']<n['g']<=m['path'][-1][0]]
    if len(same)+len(act)>2: bad+=1
taps=[n for n in out if not n['long']]; longs=[n for n in out if n['long']]
print('T0',T0,'events',len(out),'taps',len(taps),'longs',len(longs),'slides',sum(n['slide'] for n in longs),'dropped',dropped,'over2',bad)
ws=np.array([n['w'] for n in taps]); xs=np.array([n['x'] for n in taps])
print('width hist',dict(zip(*np.unique(np.round(ws,1),return_counts=True))))
print('x hist (0-16 by 2):',np.histogram(xs,bins=range(0,17,2))[0])
dbl=[(a['x'],b['x']) for a,b in zip(taps,taps[1:]) if a['g']==b['g']]
print('doubles',len(dbl),'lopsided (both same side)',sum(1 for a,b in dbl if (a<8)==(b<8)))
per=[sum(1 for n in out if n['g']//16==b) for b in range(NB)]; print('notes/bar',per)
print('styles',styles_used); print('beat kinds',{k:KIND.count(k) for k in 'SGEQR'}); print('kinds/bar',' '.join(''.join(KIND[b*4:b*4+4]) for b in range(NB)))
sec=lambda a,b: sum(per[a:b])/((b-a)*4*B)
print('nps intro %.1f verse %.1f drop72 %.1f final %.1f overall %.1f'%(sec(0,8),sec(8,32),sec(72,79),sec(158,162),len(out)/190))
for n in out: n.pop('hand')
json.dump(dict(bpm=202,t0=T0,step=S,notes=out),open('chart.json','w'),separators=(',',':'))
