from pathlib import Path
import subprocess,json,hashlib,math,struct
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];D=R/'review/v04';V=R/'out/v04/azi-lashes-v04-1080.mp4';phone=R/'out/v04/azi-lashes-v04-phone.mp4';shots=json.loads((D/'shotlist.json').read_text());F=D/'decoded';F.mkdir(exist_ok=True)
frames={0,1,2890,2891,1320,1840,2040,2199,2346,2512,2630}
for s in shots:
 frames.add(round((s['from']+s['to'])/2*30))
 for o in [-2,-1,0,1,2]:frames.add(max(0,min(2891,round(s['from']*30)+o)))
for a,b in [(1088,1177),(398,505),(1638,1668),(2460,2515)]:frames.update(range(a,b,3))
def balanced(a):
 if len(a)==1:return a[0]
 i=len(a)//2;return '('+balanced(a[:i])+'+'+balanced(a[i:])+')'
sel=balanced([f'eq(n,{n})' for n in sorted(frames)]);S=F/'sequence';S.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(V),'-vf',f"select='{sel}',scale=270:480",'-fps_mode','vfr','-start_number','0',str(S/'%04d.jpg')],check=True)
files=sorted(S.glob('*.jpg'));assert len(files)==len(frames),(len(files),len(frames))
for n,p in zip(sorted(frames),files):p.replace(F/f'{n:04d}.jpg')
def sheet(name,ns,cols=6):
 ns=[n for n in ns if (F/f'{n:04d}.jpg').exists()];im=Image.new('RGB',(180*cols,math.ceil(len(ns)/cols)*345),'#28212f');d=ImageDraw.Draw(im)
 for i,n in enumerate(ns):
  a=Image.open(F/f'{n:04d}.jpg');a.thumbnail((180,320));x=i%cols*180;y=i//cols*345;im.paste(a,(x,y));d.text((x+5,y+324),f'{n/30:.2f}s',fill='white')
 im.save(D/f'{name}.jpg')
sheet('contact-final',[round((s['from']+s['to'])/2*30) for s in shots],8)
sheet('anatomy-final',range(1088,1177,3));sheet('lift-final',range(398,505,3));sheet('blink-final',range(1638,1668,3));sheet('studio-final',[2040,2199,2346,2512,2630,2891])
results={}
for p in [V,phone]:
 data=p.read_bytes();i=0;boxes=[]
 while i+8<len(data):
  size,kind=struct.unpack('>I4s',data[i:i+8]);size=struct.unpack('>Q',data[i+8:i+16])[0] if size==1 else size
  if size<8:break
  boxes.append(kind.decode('ascii'));i+=size
 assert boxes.index('moov')<boxes.index('mdat')
 raw=subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',str(p)])
 times=[float(x['best_effort_timestamp_time']) for x in json.loads(raw)['frames']];assert len(times)==2892 and all(abs(b-a-1/30)<.00001 for a,b in zip(times,times[1:]))
 results[p.name]={'faststart':True,'constant_30fps':True,'timestamps_checked':len(times),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
r=subprocess.run(['ffmpeg','-hide_banner','-i',str(phone),'-vf','blackdetect=d=0.12:pix_th=0.02:pic_th=0.98','-an','-f','null','-'],capture_output=True,text=True,check=True)
black=[s for s in r.stderr.splitlines() if 'black_start:' in s];assert not black,black
results['decoded_review_frames']=len(frames);results['black_intervals_over_120ms']=black
(D/'final-checks.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
