from pathlib import Path
import json,subprocess,hashlib,struct
R=Path(__file__).resolve().parents[1];checks={}
for suffix in ['1080','phone']:
 p=R/f'out/azi-lashes-film-{suffix}.mp4'
 data=p.read_bytes();boxes=[];off=0
 while off+8<=len(data):
  size,kind=struct.unpack('>I4s',data[off:off+8])
  if size==1:size=struct.unpack('>Q',data[off+8:off+16])[0]
  if not size:break
  boxes.append(kind.decode('ascii'));off+=size
 assert boxes.index('moov')<boxes.index('mdat'),boxes
 raw=subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',str(p)])
 times=[float(f['best_effort_timestamp_time']) for f in json.loads(raw)['frames']]
 assert len(times)==2892 and all(abs((b-a)-1/30)<.00001 for a,b in zip(times,times[1:]))
 checks[suffix]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'faststart':True,'decoded_timestamp_count':len(times),'constant_30fps':True}
 if suffix=='phone':assert len(data)<20_000_000
(R/'review/file-checks.json').write_text(json.dumps(checks,indent=2));print(checks)
