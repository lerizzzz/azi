import {build} from 'esbuild';
import {createRequire} from 'node:module';
import fs from 'node:fs';
await build({entryPoints:['src/SeamlessRig.tsx','src/ComicEdit.tsx'],bundle:true,platform:'node',format:'cjs',packages:'external',outdir:'review/v04/validate'});
const require=createRequire(import.meta.url);
const {actorPose}=require('../review/v04/validate/SeamlessRig.js');
const {shots}=require('../review/v04/validate/ComicEdit.js');
let error=0,drift=0,checks=0;
for(const who of ['azi','man','alien','master'])for(const mode of ['idle','run','lift','ear','treat']){
 const last={};for(let f=0;f<180;f++){
 const t=f/120;const props={who,time:t,phone:false,action:mode==='run'?'run':'idle',lift:mode==='lift'?Math.min(1,t):0,gesture:mode==='ear'?'ear':undefined,task:mode==='treat'?'treat':undefined};const p=actorPose(props);
 for(const side of ['right','left']){const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);error=Math.max(error,Math.abs(d(p.hips[side],p.knees[side])-352),Math.abs(d(p.knees[side],p.feet[side])-363),Math.abs(d(p.shoulders[side],p.elbows[side])-211),Math.abs(d(p.elbows[side],p.wrists[side])-216));
 if(mode==='run'){const u=(t/.82+(side==='left'?.5:0))%1;const world={x:t*198/(.82*.58)+p.feet[side].x,y:p.bodyBob+p.feet[side].y};if(u<.58&&last[side]?.u<.58&&u>last[side].u)drift=Math.max(drift,d(world,last[side].world));last[side]={u,world};}
 if(side==='right'&&p.shoulders[side].x>=0)throw Error('Right shoulder incorrectly assigned');if(side==='left'&&p.shoulders[side].x<=0)throw Error('Left shoulder incorrectly assigned');checks++;
 }
 }}
if(error>1e-6||drift>1e-6)throw Error(JSON.stringify({error,drift}));
const lengths=shots.map(s=>s.to-s.from);if(lengths.some(n=>n<1.9||n>3.01))throw Error('Shot length outside 2–3s: '+lengths);
const report={poseSamples:checks,maximumSegmentLengthError:error,maximumStanceDrift:drift,shots:shots.length,minShotSeconds:Math.min(...lengths),maxShotSeconds:Math.max(...lengths),scope:'Numerical skeleton and edit-plan tests. Visual anatomical review is separate.'};fs.writeFileSync('review/v04/geometry-checks.json',JSON.stringify(report,null,2));fs.writeFileSync('review/v04/shotlist.json',JSON.stringify(shots,null,2));console.log(report);
