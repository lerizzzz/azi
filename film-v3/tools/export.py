from pathlib import Path
import subprocess,json
R=Path(__file__).resolve().parents[1]
(R/'out').mkdir(exist_ok=True)
def run(a):subprocess.run(a,cwd=R,check=True)
run(['ffmpeg','-y','-i','review/picture.mp4','-i','public/mix.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000','-movflags','+faststart','out/azi-lashes-film-1080.mp4'])
run(['ffmpeg','-y','-i','out/azi-lashes-film-1080.mp4','-vf','scale=540:960','-c:v','libx264','-crf','25','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart','out/azi-lashes-film-phone.mp4'])
for name in ['1080','phone']:
 p=R/f'out/azi-lashes-film-{name}.mp4'
 x=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]))
 v=next(s for s in x['streams'] if s['codec_type']=='video');a=next(s for s in x['streams'] if s['codec_type']=='audio')
 assert (v['width'],v['height'])==((1080,1920) if name=='1080' else (540,960))
 assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and v['avg_frame_rate']=='30/1' and int(v['nb_read_frames'])==2892
 assert a['codec_name']=='aac' and abs(float(a['duration'])-float(v['duration']))<.06
 run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'])
 (R/f'review/metadata-{name}.json').write_text(json.dumps(x,indent=2))
print('PASS both complete decodes, 2892 frames at 30fps; H264/yuv420p/AAC, AV end times matched.')
