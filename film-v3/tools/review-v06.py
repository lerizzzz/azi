"""Review frames decoded from the actual final MP4, including every edit boundary."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math,subprocess
R=Path(__file__).resolve().parents[1];D=R/'review/v06';O=D/'decoded';O.mkdir(exist_ok=True)
V=R/'out/v06/azi-lashes-v06-1080.mp4'
T=json.loads((R/'src/timing.json').read_text());shots=json.loads((R/'src/shots-v06.json').read_text())
frames={0,1,T['frames']-2,T['frames']-1}
for s in shots:
 start=math.ceil(s['from']*30-1e-7)
 frames.update([max(0,start-1),start,min(T['frames']-1,start+1),min(T['frames']-1,round((s['from']+s['to'])/2*30))])
regions={'lift':(10.25,13.10),'run':(32.6,34.5),'call':(37.9,39.1),'blink':(49.3,50.3),'tea':(79.75,81.35)}
for a,b in regions.values():frames.update(range(round(a*30),round(b*30),3))
frames=sorted(frames)
def combine(parts):
 if len(parts)==1:return parts[0]
 i=len(parts)//2;return '('+combine(parts[:i])+'+'+combine(parts[i:])+')'
expr=combine([f'eq(n,{f})' for f in frames]);seq=O/'sequence';seq.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-threads','2','-i',str(V),'-vf',f"select='{expr}',scale=270:480",'-fps_mode','vfr','-start_number','0',str(seq/'%04d.jpg')],check=True)
files=sorted(seq.glob('*.jpg'));assert len(files)==len(frames),(len(files),len(frames))
for f,p in zip(frames,files):p.replace(O/f'{f:04d}.jpg')
def sheet(name,items,cols=6,width=180):
 items=[f for f in items if (O/f'{f:04d}.jpg').exists()]
 h=round(width*16/9);im=Image.new('RGB',(cols*width,math.ceil(len(items)/cols)*(h+24)),'#25212e');dr=ImageDraw.Draw(im)
 for i,f in enumerate(items):
  a=Image.open(O/f'{f:04d}.jpg');a.thumbnail((width,h));x=i%cols*width;y=i//cols*(h+24);im.paste(a,(x,y));dr.text((x+5,y+h+4),f'{f/30:.2f}s',fill='white')
 im.save(D/f'{name}.jpg',quality=90)
mid=[round((s['from']+s['to'])/2*30) for s in shots]
sheet('contact-final',mid)
for a,b in [(0,16),(16,32),(32,46)]:
 cuts=[]
 for s in shots[a:b]:
  f=math.ceil(s['from']*30-1e-7);cuts.extend([max(0,f-1),f,min(T['frames']-1,f+1)])
 sheet(f'boundaries-{a:02d}-{b:02d}',cuts)
for name,(a,b) in regions.items():sheet(name,range(round(a*30),round(b*30),3))
sheet('end',[T['frames']-2,T['frames']-1],2,270)
(D/'decoded-review.json').write_text(json.dumps({'source':str(V.relative_to(R)),'decodedFrames':len(frames),'all46EditBoundaries':True,'motionRegions':regions,'scope':'Selected decoded stills and sequential frame strips. Not a real-time viewing or listening certification.'},indent=2))
print(f'Decoded {len(frames)} review frames from final MP4.')
