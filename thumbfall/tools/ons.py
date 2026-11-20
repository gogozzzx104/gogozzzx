import numpy as np, librosa
y, sr = librosa.load('rg.wav', sr=22050)
hop=64; fr=sr/hop
B=60/202; S=B/4; T0=0.003+B/2+B
o=librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop,n_fft=1024)
o=o/np.percentile(o,99)
pk=librosa.util.peak_pick(o,pre_max=4,post_max=4,pre_avg=40,post_avg=40,delta=0.06,wait=int(0.05*fr))
t=pk/fr; st=o[pk]
print('onsets',len(t), 'per sec', len(t)/196)
g=(t-T0)/S; r=(g-np.round(g))*S*1000
print('resid to 16th: mean %.1f std %.1f (uniform would be %.1f)'%(r.mean(),r.std(),S*1000/np.sqrt(12)))
strong=st>np.percentile(st,60); print('strong resid mean %.1f std %.1f'%(r[strong].mean(),r[strong].std()))
h,_=np.histogram(r[strong],bins=np.arange(-37.5,38,5)); print('hist',h)
step=np.round(g).astype(int)%16; print('step usage strong', np.bincount(step[strong],minlength=16))
# 8th residual
g8=(t-T0)/(2*S); r8=(g8-np.round(g8))*2*S*1000; h8,_=np.histogram(r8[strong],bins=np.arange(-75,76,10)); print('hist vs 8th',h8)
# triplet check: residual to 12 per bar
g3=(t-T0)/(B/3); r3=(g3-np.round(g3))*(B/3)*1000; print('triplet std', r3[strong].std(), 'vs uniform', B/3*1000/np.sqrt(12))
np.savez('ons.npz',t=t,st=st)
