from pathlib import Path
import sys,json,time,os
sys.path.insert(0,'/workspace/azi-tools/python-audio')
import sherpa_onnx,soundfile as sf
R=Path(__file__).resolve().parents[1];M=Path('/workspace/azi-tools/asr-ru/sherpa-onnx-zipformer-ru-int8-2025-04-20')
recognizer=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=str(M/'encoder.int8.onnx'),decoder=str(M/'decoder.onnx'),joiner=str(M/'joiner.int8.onnx'),tokens=str(M/'tokens.txt'),num_threads=4,sample_rate=16000,feature_dim=80,decoding_method='greedy_search',provider='cpu')
y,sr=sf.read(sys.argv[1] if len(sys.argv)>1 else str(R/'private/v06/asr-16k.wav'),dtype='float32');segments=[]
# Overlapping blocks keep decoding inexpensive while preserving phrase boundaries.
for start in range(0,int(len(y)/sr),20):
 stream=recognizer.create_stream();chunk=y[start*sr:min(len(y),(start+21)*sr)];stream.accept_waveform(sr,chunk);recognizer.decode_stream(stream);r=stream.result
 row={'offset':start,'text':r.text,'tokens':list(r.tokens),'timestamps':[round(start+t,3) for t in r.timestamps]};segments.append(row);print(start,r.text,flush=True)
(Path(sys.argv[2]) if len(sys.argv)>2 else R/'review/v06/asr-original.json').write_text(json.dumps(segments,ensure_ascii=False,indent=2))
