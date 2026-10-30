from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,math
R=Path(__file__).resolve().parents[1];T=json.loads((R/'timing.json').read_text());V=R/'out/azi-lashes-film-1080.mp4';D=R/'review/decoded';D.mkdir(exist_ok=True)
frames=set([0,1,2890,2891])
for s in T['scenes']:
 for t in [s['start']+.1,s['start']+.7,(s['start']+s['end'])/2,s['end']-.05]:frames.add(min(2891,round(t*30)))
 for n in [-2,-1,0,1,2]:frames.add(max(0,min(2891,round(s['start']*30)+n)))
for a,b in [(856,900),(1480,1510),(398,505),(1638,1668),(2720,2760)]:
 frames.update(range(a,b,3))
temporary=D/'sequence';temporary.mkdir(exist_ok=True)
selection='+'.join(f'eq(n\\,{f})' for f in sorted(frames))
subprocess.run(['ffmpeg','-v','error','-y','-i',str(V),'-vf',f'select={selection},scale=270:480','-fps_mode','vfr','-start_number','0',str(temporary/'%04d.jpg')],check=True)
files=sorted(temporary.glob('*.jpg'));assert len(files)==len(frames),(len(files),len(frames))
for f,p in zip(sorted(frames),files):p.replace(D/f'{f:04}.jpg')
def sheet(name,fs,cols=6):
 files=[D/f'{f:04}.jpg' for f in fs if (D/f'{f:04}.jpg').exists()]
 im=Image.new('RGB',(cols*180,math.ceil(len(files)/cols)*345),'#25212e');d=ImageDraw.Draw(im)
 for i,p in enumerate(files):
  a=Image.open(p);a.thumbnail((180,320));x=i%cols*180;y=i//cols*345;im.paste(a,(x,y));d.text((x+6,y+324),f'{int(p.stem)/30:.2f}s',fill='white')
 im.save(R/f'review/{name}.jpg')
sheet('contact-final',[round(t*30) for s in T['scenes'] for t in [s['start']+.7,(s['start']+s['end'])/2,s['end']-.4]])
sheet('walk-final',range(856,900,3));sheet('lift-final',range(398,505,3));sheet('blink-final',range(1638,1668,3));sheet('boundaries-final',sorted(frames))
print('Decoded review frames:',len(frames))
