import numpy as np, librosa, json
y, sr = librosa.load('rg.wav', sr=22050)
B=60/202; S16=B/4; T0=0.003+B/2+B   # time of bar 0 downbeat
hop=64; fr=sr/hop; nfft=1024
D=librosa.stft(y,n_fft=nfft,hop_length=hop)
H,P=librosa.decompose.hpss(D, margin=2.0)
f=librosa.fft_frequencies(sr=sr,n_fft=nfft)
def flux(M,lo,hi):
    b=np.log1p(30*np.abs(M)[(f>=lo)&(f<hi)].sum(0)); return np.maximum(np.diff(b,prepend=b[0]),0)
env={'k':flux(P,30,150),'s':flux(P,150,2500),'h':flux(P,5000,11000),'m':flux(H,180,5000),'a':librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop,n_fft=nfft)}
N=int((len(y)/sr-T0)/S16); T=T0+np.arange(N)*S16
def samp(e,win=0.024):
    w=int(win*fr); return np.array([e[max(0,int(round(t*fr))-w):int(round(t*fr))+w+1].max() for t in T])
G={k:samp(v) for k,v in env.items()}
for k in G: G[k]=np.minimum(1.5,G[k]/np.percentile(G[k],97))
# melodic pitch at each step: strongest harmonic bin 250-3000Hz averaged over next 50ms
Hm=np.abs(H); sel=(f>=250)&(f<3000); fs=f[sel]
pit=[]
for t in T:
    i=int(round(t*fr)); seg=Hm[sel,i+2:i+18].mean(1) if i+18<Hm.shape[1] else np.zeros(sel.sum())
    c=(seg**2*np.log2(fs)).sum()/((seg**2).sum()+1e-9); pit.append(c)
pit=np.array(pit)
rms=librosa.feature.rms(y=y,frame_length=1024,hop_length=hop)[0]; R=np.array([rms[int(round(t*fr)):int(round((t+S16)*fr))+1].mean() for t in T])
# harmonic sustain energy (for holds)
he=(Hm[(f>=250)&(f<5000)]**2).sum(0); HE=np.array([he[int(round(t*fr)):int(round((t+S16)*fr))+1].mean() for t in T])
np.savez('feat.npz',T=T,k=G['k'],s=G['s'],h=G['h'],m=G['m'],a=G['a'],pit=pit,rms=R,he=HE)
print('N',N,'bars',N/16,'T0',T0)
ch=' .:-=+*#%@'
def row(v): return ''.join(ch[min(9,int(x*7))] for x in v)
for b in range(N//16):
    sl=slice(b*16,b*16+16)
    print(f'{b:3d} {T[b*16]:6.1f} r{R[sl].mean()*100:4.1f} K {row(G["k"][sl])} S {row(G["s"][sl])} H {row(G["h"][sl])} M {row(G["m"][sl])}')
