"""Export the frozen 88-second V06 picture with the approved recorded performance."""
from pathlib import Path
import subprocess, json, hashlib, struct
R = Path(__file__).resolve().parents[1]
D = R / 'review/v06'
O = R / 'out/v06'
O.mkdir(parents=True, exist_ok=True)
T = json.loads((R / 'src/timing.json').read_text())
def run(args):
    subprocess.run(args, check=True, cwd=R)
main = O / 'azi-lashes-v06-1080.mp4'
phone = O / 'azi-lashes-v06-phone.mp4'
color = ['-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709']
run(['ffmpeg','-v','warning','-y','-i',str(D/'picture-1080.mp4'),'-i',str(R/'public/v06/mix.wav'),'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','fast','-crf','18','-threads','4',*color,'-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000','-t',str(T['duration']),'-movflags','+faststart',str(main)])
run(['ffmpeg','-v','warning','-y','-i',str(main),'-vf','scale=540:960,format=yuv420p','-c:v','libx264','-crf','25','-preset','medium','-threads','4',*color,'-c:a','aac','-b:a','96k','-ar','48000','-movflags','+faststart',str(phone)])
def atoms(path):
    result = {}
    with path.open('rb') as f:
        while f.tell() < path.stat().st_size:
            offset = f.tell()
            size, kind = struct.unpack('>I4s', f.read(8))
            if size == 1:
                size = struct.unpack('>Q',f.read(8))[0]
            if size == 0:
                size = path.stat().st_size-offset
            result[kind.decode('ascii')] = offset
            f.seek(offset+size)
    return result
checks = {}
for p in [main,phone]:
    m = json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]))
    v = next(x for x in m['streams'] if x['codec_type']=='video')
    a = next(x for x in m['streams'] if x['codec_type']=='audio')
    assert (v['width'],v['height']) == ((1080,1920) if p==main else (540,960))
    assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
    assert v['avg_frame_rate']=='30/1' and int(v['nb_read_frames'])==T['frames']
    assert a['codec_name']=='aac' and a['sample_rate']=='48000'
    assert abs(float(v['duration'])-float(a['duration'])) < .06
    assert abs(float(v['duration'])-T['duration']) < .04
    run(['ffmpeg','-v','error','-xerror','-threads','2','-i',str(p),'-f','null','-'])
    positions=atoms(p)
    assert positions['moov'] < positions['mdat']
    assert p!=phone or p.stat().st_size < 20_000_000
    checks[p.name] = {'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'full_decode':'passed','faststart':True,'metadata':m}
(D/'exports.json').write_text(json.dumps(checks,indent=2))
print('PASS: both complete exports, 2640 frames, 88 seconds, 30fps, H264/yuv420p/AAC, faststart, matched durations.')
