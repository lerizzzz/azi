from pathlib import Path
import subprocess,json,hashlib,zipfile
R=Path(__file__).resolve().parents[1];D=R/'review/v04';O=R/'out/v04';O.mkdir(parents=True,exist_ok=True)
def run(args):subprocess.run(args,check=True,cwd=R)
main=O/'azi-lashes-v04-1080.mp4';phone=O/'azi-lashes-v04-phone.mp4'
run(['ffmpeg','-v','warning','-y','-i',str(D/'picture.mp4'),'-i',str(R/'public/mix.wav'),'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','fast','-crf','18','-threads','4','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709','-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000','-movflags','+faststart',str(main)])
run(['ffmpeg','-v','warning','-y','-i',str(main),'-vf','scale=540:960,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709','-c:v','libx264','-crf','25','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(phone)])
checks={}
for p in [main,phone]:
 m=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]));v=next(x for x in m['streams'] if x['codec_type']=='video');a=next(x for x in m['streams'] if x['codec_type']=='audio')
 assert (v['width'],v['height'])==((1080,1920) if p==main else (540,960));assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and v['avg_frame_rate']=='30/1' and int(v['nb_read_frames'])==2892;assert a['codec_name']=='aac' and abs(float(v['duration'])-float(a['duration']))<.06
 run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'])
 checks[p.name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'full_decode':'passed','metadata':m}
 assert p!=phone or p.stat().st_size<20_000_000
(D/'exports.json').write_text(json.dumps(checks,indent=2));print('PASS both exports: full decode, 2892 frames, 30fps, H264/yuv420p/AAC, duration matched.')
