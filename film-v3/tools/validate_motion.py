import math,json
from pathlib import Path
maxerr=0;maxdrift=0
for side,off in [(-1,0),(1,.5)]:
 prev=None
 for i in range(801):
  t=i/1000;u=(t/.8+off)%1;hip=(side*67,-100)
  if u<.6: foot=(side*45+100-u/.6*200,500);phase='stance'
  else:
   v=(u-.6)/.4;foot=(side*45-100+200*(v*v*(3-2*v)),500-105*math.sin(math.pi*v));phase='swing'
  dx=foot[0]-hip[0];dy=foot[1]-hip[1];L=math.hypot(dx,dy);assert L<645
  q=(305**2-340**2+L*L)/(2*L);h=math.sqrt(305**2-q*q)
  knee=(hip[0]+dx/L*q+dy/L*h,hip[1]+dy/L*q-dx/L*h)
  maxerr=max(maxerr,abs(math.dist(hip,knee)-305),abs(math.dist(knee,foot)-340))
  world=(416.6666666667*t+foot[0],foot[1]);
  if prev and phase=='stance' and prev[1]=='stance' and u>prev[2]:maxdrift=max(maxdrift,math.dist(world,prev[0]))
  prev=(world,phase,u)
assert maxerr<1e-6 and maxdrift<1e-6
out={'sampled_positions':1602,'max_bone_length_error':maxerr,'max_world_stance_drift_per_ms':maxdrift,'scope':'Numeric IK and stance model only; not a substitute for rendered motion review.'}
Path('review/motion-checks.json').write_text(json.dumps(out,indent=2));print(out)
