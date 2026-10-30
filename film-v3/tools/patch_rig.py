from pathlib import Path
p=Path(__file__).resolve().parents[1]/'src/SkinnedRig.tsx'
s=p.read_text();s=s.replace('  onlyArm?: boolean;','  onlyArm?: boolean;\n  barefoot?: boolean;\n  shoes?: boolean;\n  gesture?: "ear" | "kiss" | "hair";')
s=s.replace('  "azi/hair-frame":', '  "props/shoes": {file:"props/shoes.png",width:240,height:230},\n  "azi/hair-frame":')
s=s.replace('id === "props/phone" ||','id === "props/phone" || id === "props/shoes" ||')
s=s.replace('const phase = p.time * 9.8 + (p.phase ?? 0);','const phase = p.time * 2 * Math.PI / 0.8 + (p.phase ?? 0);')
s=s.replace('const bounce = running ? -Math.abs(Math.sin(phase)) * 13 : 0;','const bounce = running ? -Math.abs(Math.sin(phase)) * 10 : 0;')
start=s.index('            const stride = running')
end=s.index('            if (who === "azi")',start)
s=s[:start]+'''            const leftA = {x:-67,y:who==="man"?-75:-137}, rightA={x:67,y:who==="man"?-75:-137};
            const foot = (offset:number,side:number) => {
              if(!walking) return {x:side*82+lift*side*50,y:500-lift*(side>0?120:55)-bounce};
              // 0.8s cycle, 60% stance. Foot is stationary in world during contact:
              // body speed = 200/0.48=416.666 local units/sec.
              const u=((p.time/0.8+offset)%1+1)%1;
              if(u<0.6) return {x:side*45+100-u/0.6*200,y:500-bounce};
              const v=(u-0.6)/0.4;
              return {x:side*45-100+200*smooth(v),y:500-105*Math.sin(Math.PI*v)-bounce};
            };
            const leftC=foot(0,-1),rightC=foot(0.5,1);
            const leftB=ik(leftA,leftC,who==="man"?285:305,who==="man"?295:340,-1);
            const rightB=ik(rightA,rightC,who==="man"?285:305,who==="man"?295:340,-1);
''' + s[end:]
s=s.replace('            if (p.onlyArm) {','''            if(p.gesture==="ear") { RB=add(RA,-40,215); RC=add(RB,-128,200); }
            if(p.gesture==="hair") { RB=add(RA,-48,215); RC=add(RB,-150,200); }
            if(p.gesture==="kiss") { RB=add(RA,40,215); RC=add(RB,-136+80*smooth((p.actionProgress??0)),200); }
            if (p.onlyArm) {''',1)
s=s.replace('            mesh(\n              "azi/arm-left-full",','''            if(p.shoes) anchored("props/shoes",LC,{x:110,y:0},0.55,0.12);
            mesh(
              "azi/arm-left-full",''')
# no detached neck: head crop retains neck, hair should frame rather than cover face.
p.write_text(s)
