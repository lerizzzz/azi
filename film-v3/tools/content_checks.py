from pathlib import Path
import subprocess,json
R=Path(__file__).resolve().parents[1];p=R/'out/azi-lashes-film-phone.mp4'
r=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-vf','blackdetect=d=0.12:pix_th=0.02:pic_th=0.98','-an','-f','null','-'],capture_output=True,text=True,check=True)
black=[l for l in r.stderr.splitlines() if 'black_start:' in l]
assert not black,black
md5=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-an','-f','framemd5','-']).decode().splitlines()
hashes=[l.rsplit(',',1)[-1].strip() for l in md5 if l and not l.startswith('#')]
longest=1;current=1
for a,b in zip(hashes,hashes[1:]):
 current=current+1 if a==b else 1;longest=max(longest,current)
report={'fully_black_intervals_over_120ms':black,'decoded_frames_checked':len(hashes),'longest_identical_frame_run':longest,'scope':'Objective pixel checks only; do not establish artistic motion quality or audio perception.'}
(R/'review/content-checks.json').write_text(json.dumps(report,indent=2));print(report)
