from pathlib import Path
import sys,json
sys.path.insert(0,'/workspace/azi-tools/python-audio')
import parselmouth,numpy as np,soundfile as sf
from parselmouth.praat import call
R=Path(__file__).resolve().parents[1];S=R/'private/v06/performance-original.wav';sound=parselmouth.Sound(str(S));sr=int(sound.sampling_frequency);N=sound.get_number_of_samples();p=sound.to_pitch_ac(time_step=.01,pitch_floor=80,pitch_ceiling=500);f=p.selected_array['frequency'];f=f[f>0];median=float(np.median(f));data=[]
for name,formant,pitch,rasp in [('velvet',.94,.88,.018),('smoky',.91,.84,.033)]:
 result=call(sound,'Change gender',80,500,formant,median*pitch,pitch,1.0)
 y=result.values[0];y=np.pad(y,(0,max(0,N-len(y))))[:N]
 # Gentle asymmetric saturation, speech-dependent only. No synthetic rereading or time changes.
 drive=1.9;warm=np.tanh(y*drive)/drive;y=(1-rasp)*y+rasp*warm
 peak=float(np.max(abs(y)));y*=min(1,.89/max(peak,1e-6))
 out=R/f'private/v06/voice-{name}.wav';sf.write(out,y,sr,subtype='PCM_16')
 data.append({'name':name,'formant_ratio':formant,'pitch_ratio':pitch,'original_pitch_median_hz':median,'target_pitch_median_hz':median*pitch,'duration_seconds':len(y)/sr,'samples':len(y),'timing_preserved':len(y)==N,'method':'Praat PSOLA/formant transformation of the actual recorded performance, not new TTS','path':str(out)})
 print(name,median*pitch,len(y)/sr,flush=True)
(R/'review/v06/voice-processing.json').write_text(json.dumps(data,indent=2))
