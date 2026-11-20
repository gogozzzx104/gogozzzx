import numpy as np, librosa
y, sr = librosa.load('rg.wav', sr=22050)
B=60/202; S=B/4; T0=0.4405; NB=164; N=NB*16
hop=64; fr=sr/hop; nfft=1024
D=librosa.stft(y,n_fft=nfft,hop_length=hop); H,P=librosa.decompose.hpss(D,margin=2.0)
f=librosa.fft_frequencies(sr=sr,n_fft=nfft)
def flux(M,lo,hi):
    b=np.log1p(40*np.abs(M)[(f>=lo)&(f<hi)]); d=np.maximum(np.diff(b,axis=1,prepend=b[:,:1]),0).sum(0); return d
env={'k':flux(P,30,160),'s':flux(P,160,3000),'h':flux(P,5000,11000),'m':flux(H,200,5000),'a':flux(D,30,11000)}
T=T0+np.arange(N)*S
def at(e,t,w):
    i=int(round(t*fr)); a=max(0,i-w); return e[a:i+w+1]
sal={}
for k,e in env.items():
    e=np.convolve(e,np.ones(3)/3,'same')
    pk=np.array([at(e,t,5).max() for t in T])           # +-15ms
    tr=np.array([min(at(e,t-S/2,3).min(), at(e,t+S/2,3).min()) for t in T])  # troughs either side
    s=np.maximum(pk-tr,0)
    # local normalisation over ~4 bars so quiet sections keep their own contrast, blended with global
    loc=np.array([np.percentile(s[max(0,i-32):i+32],90) for i in range(N)]); glob=np.percentile(s,90)
    sal[k]=s/(0.5*loc+0.5*glob+1e-9); sal[k+'_raw']=s/glob
rms=librosa.feature.rms(y=y,frame_length=1024,hop_length=hop)[0]; R=np.array([rms[int(round(t*fr)):int(round((t+S)*fr))+1].mean() for t in T])
np.savez('feat2.npz',T=T,rms=R,**sal)
comb=np.maximum.reduce([sal['k'],sal['s'],sal['m'],0.8*sal['a'],0.6*sal['h']])
ch=' .:-=+*#%@'
row=lambda v:''.join(ch[min(9,int(x*6))] for x in v)
n16tot=0
for b in range(NB):
    sl=slice(b*16,b*16+16); c=comb[sl]; od=(c[1::2]>0.55).sum(); ev=(c[0::2]>0.45).sum(); n16tot+=od
    print(f'{b:3d} {T[b*16]:6.1f} r{R[sl].mean()*100:5.1f} ev{ev} od{od} C {row(c)}  K {row(sal["k"][sl])} S {row(sal["s"][sl])}')
print('odd active total',n16tot)
