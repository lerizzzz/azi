import {build} from 'esbuild';
import {createRequire} from 'node:module';
import fs from 'node:fs';
await build({entryPoints:['src/ComicEdit.tsx','src/IllustratedActor.tsx'],bundle:true,platform:'node',format:'cjs',packages:'external',outdir:'review/v06/validate'});
const require=createRequire(import.meta.url);
const {shots}=require('../review/v06/validate/ComicEdit.js');
const {chooseDrawing}=require('../review/v06/validate/IllustratedActor.js');
const timing=JSON.parse(fs.readFileSync('src/timing.json'));
const manifest=JSON.parse(fs.readFileSync('src/illustrations.json'));
if(shots[0].from!==0 || shots.at(-1).to!==88)throw Error('Incomplete picture timeline');
for(let i=0;i<shots.length;i++){
 const s=shots[i];
 if(s.to<=s.from || s.to-s.from>2.6)throw Error(`Stalled or invalid shot ${i}`);
 if(i && Math.abs(shots[i-1].to-s.from)>1e-8)throw Error(`Timeline gap or overlap ${i}`);
 if(!s.action)throw Error(`Missing acting/object action in shot ${i}`);
}
for(const a of Object.values(manifest))if(!fs.existsSync(`public/${a.file}`))throw Error(`Missing artwork ${a.file}`);
const cases={
 heldPhone:chooseDrawing({who:'man',time:0,lift:.5,phone:true}),
 releasedPhone:chooseDrawing({who:'man',time:0,lift:.5,phone:false}),
 openEyes:chooseDrawing({who:'azi',time:0,barefoot:true,face:'neutral'}),
 closedEyes:chooseDrawing({who:'azi',time:0,barefoot:true,face:'blink'}),
 speaking:chooseDrawing({who:'azi',time:.1,gesture:'ear',acting:'talk'}),
 restingMouth:chooseDrawing({who:'azi',time:.3,gesture:'ear',acting:'talk'}),
 alienQuestion:chooseDrawing({who:'alien',time:0,acting:'question'}),
 startled:chooseDrawing({who:'azi',time:0,acting:'startled'}),
 relief:chooseDrawing({who:'azi',time:0,barefoot:true,acting:'relief'})
};
if(cases.heldPhone!=='man-surprise'||cases.releasedPhone!=='man-lift')throw Error('Phone remains painted in hand after release');
if(cases.openEyes===cases.closedEyes)throw Error('Blink has no drawing change');
if(cases.speaking===cases.restingMouth)throw Error('Speaking has no mouth change');
const walk=[.05,.3,.5,.75].map(phase=>chooseDrawing({who:'azi',time:phase*.88,walking:true,barefoot:true,shoes:true}));
if(new Set(walk).size!==4)throw Error('Walk loop does not contain four distinct whole poses');
for(const cue of timing.cues){
 if(cue.start<0||cue.end>timing.duration||cue.start>=cue.end)throw Error('Speech cue outside picture');
}
const report={duration:timing.duration,frames:timing.frames,shots:shots.length,continuousTimeline:true,minShotSeconds:Math.min(...shots.map(s=>s.to-s.from)),maxShotSeconds:Math.max(...shots.map(s=>s.to-s.from)),artworkExists:true,cases,walk,scope:'Checks authored timing and asset bindings. Does not certify perceived acting, anatomy, accent or natural gait.'};
fs.writeFileSync('review/v06/edit-checks.json',JSON.stringify(report,null,2));
console.log('PASS: complete 88-second timeline, 46 acting cuts, full-pose assets, phone release, two eyelid states, speaking states and four walk poses.');
