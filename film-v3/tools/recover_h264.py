from pathlib import Path
import struct,json,subprocess
D=Path(__file__).resolve().parents[1]/'review/recovery'
r=(D/'reference.mp4').read_bytes();pos=r.index(b'avcC')+4;avcc=r[pos:];width=(avcc[4]&3)+1;k=6;headers=[]
for _ in range(avcc[5]&31):
 n=int.from_bytes(avcc[k:k+2],'big');k+=2;headers.append(avcc[k:k+n]);k+=n
for _ in range(avcc[k]):
 k+=1;n=int.from_bytes(avcc[k:k+2],'big');k+=2;headers.append(avcc[k:k+n]);k+=n
raw=(D/'interrupted.mp4').read_bytes();k=48;out=bytearray();types={}
for h in headers:out+=b'\0\0\0\1'+h
while k+width<=len(raw):
 n=int.from_bytes(raw[k:k+width],'big');k+=width
 if n==0 or k+n>len(raw):break
 nal=raw[k:k+n];typ=nal[0]&31
 assert typ in range(1,24),(k,n,typ)
 out+=b'\0\0\0\1'+nal;types[typ]=types.get(typ,0)+1;k+=n
(D/'recovered.h264').write_bytes(out)
print('NAL types',types,'unused tail bytes',len(raw)-k)
