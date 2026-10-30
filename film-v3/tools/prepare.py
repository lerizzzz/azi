from pathlib import Path
import re,json,subprocess,wave,math
import numpy as np
from scipy.signal import resample_poly
R=Path(__file__).resolve().parents[1]
b=(R.parent/'docs/PRODUCTION_REQUIREMENTS_v03.md').read_text()
blocks=re.findall(r'СЦЕНА \d\..*?(?=СЦЕНА \d\.|8\. СЦЕНАРНАЯ)', b, re.S)
scenes=[]
for i,x in enumerate(blocks):
 text=x.split('Рассказчица:\n«',1)[1].split('».\n',1)[0]
 scenes.append({'scene':i+1,'text':text})
assert len(scenes)==8
print([(s['scene'],len(s['text'].split()),s['text'][-65:]) for s in scenes])
(R/'script.json').write_text(json.dumps(scenes,ensure_ascii=False,indent=2))
V=R/'public/voice';V.mkdir(exist_ok=True)
engine='/workspace/azi-tools/RHVoice/local/bin/RHVoice-test'
SR=48000;cursor=0;rows=[];parts=[]
for scene in scenes:
 start=cursor;cursor+=.15
 text=scene['text']+'.'
 chunks=re.split(r'(?<=[.!?])\s+',text.replace('\n',' '))
 for j,txt in enumerate(chunks):
  f=V/f"s{scene['scene']}-{j}.wav";inp=f.with_suffix('.txt');inp.write_text(txt)
  subprocess.run([engine,'-p','Elena','-r','100','-t','86','-i',str(inp),'-o',str(f)],check=True)
  with wave.open(str(f)) as w:
   rate=w.getframerate();a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float32)/32768
  a=resample_poly(a,SR,rate); a*= min(3,.14/max(.001,np.sqrt(np.mean(a*a))))
  parts.append((cursor,a)); rows.append({'scene':scene['scene'],'start':round(cursor,4),'end':round(cursor+len(a)/SR,4),'text':txt,'file':str(f.relative_to(R/'public'))})
  cursor+=len(a)/SR+.10
 scene['start']=start;cursor+=.30;scene['end']=cursor
frames=math.ceil((cursor+1)*30);total=frames/30
mix=np.zeros(round(total*SR),np.float32);rng=np.random.default_rng(87)
def add(t,a,g=1):
 k=round(t*SR);e=min(len(mix),k+len(a));mix[k:e]+=a[:e-k]*g
for t,a in parts:add(t,a)
# Original low-level trip-hop bed, with speech occupying the centre.
for n,t in enumerate(np.arange(0,total-.8,60/96)):
 z=np.arange(round(.45*SR))/SR
 bass=np.sin(2*np.pi*[55,55,65.406,49][(n//8)%4]*z)*np.exp(-z*8)*np.minimum(1,z/.015)
 add(t,bass,.018)
 if n%2==0:add(t,np.sin(2*np.pi*(50*z+18*(1-np.exp(-z*24))))*np.exp(-z*24),.028)
 if n%2:
  noise=rng.normal(0,1,len(z))*np.exp(-z*40)*np.minimum(1,z/.004);add(t,noise,.012)
for s in scenes:
 z=np.arange(int(.20*SR))/SR
 add(s['start'],rng.normal(0,1,len(z))*np.sin(np.pi*z/.20)**2*.022)
# UFO swoops, door knocks, phone impact, walk contacts.
for sc in [1,2]:
 s=scenes[sc-1];z=np.arange(int((s['end']-s['start'])*SR))/SR
 add(s['start'],np.sin(2*np.pi*(94*z+0.8*np.sin(z*3)))*.010)
for s in scenes[2:5]:
 for t in np.arange(s['start']+.2,s['end'],.4):
  z=np.arange(int(.08*SR))/SR;add(t,rng.normal(0,1,len(z))*np.exp(-z*65),.02)
def cue(scene,i):return [r for r in rows if r['scene']==scene][i]['start']
def hit(t,f=90,g=.05):
 z=np.arange(int(.18*SR))/SR
 add(t,(np.sin(2*np.pi*f*z)*.7+rng.normal(0,.2,len(z)))*np.exp(-z*35)*np.minimum(1,z/.002),g)
hit(cue(2,2)+4,180,.13) # fallen phone contacts the pavement
hit(cue(5,3)+3,65,.07) # entrance door latch
hit(cue(6,1)+1.4,50,.09) # bed barricade settles
for when,freq in [(cue(4,0)+3.8,880),(cue(8,2)+.65,660)]:
 z=np.arange(int(.15*SR))/SR
 add(when,np.sin(2*np.pi*freq*z)*np.sin(np.pi*z/.15)**2,.045)
endfade=int(.7*SR);mix[-endfade:]*=np.linspace(1,0,endfade);mix*=min(1,.92/max(.001,np.max(np.abs(mix))))
with wave.open(str(R/'public/mix.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
data={'fps':30,'frames':frames,'duration':total,'scenes':scenes,'cues':rows}
(R/'src/timing.json').write_text(json.dumps(data,ensure_ascii=False,indent=2));(R/'timing.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print('DURATION',total,[(s['scene'],round(s['start'],2),round(s['end'],2)) for s in scenes])
