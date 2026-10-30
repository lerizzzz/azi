import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import json from "./layers.json";
type V = { x: number; y: number };
type Asset = { file: string; width: number; height: number };
const assets: Record<string, Asset> = {
  ...json,
  "props/cup": {file:"props/cup.png",width:160,height:160},
  "props/foot": {file:"props/foot.png",width:140,height:75},
  "props/shoes": {file:"props/shoes.png",width:240,height:230},
  "azi/hair-frame": { file: "azi/hair-frame.png", width: 941, height: 1672 },
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * smooth(t);
const rad = (d: number) => (d * Math.PI) / 180;
const add = (p: V, a: number, l: number) => ({
  x: p.x + Math.cos(rad(a)) * l,
  y: p.y + Math.sin(rad(a)) * l,
});
const cache = new Map<string, Promise<HTMLImageElement>>();
const load = (id: string) => {
  if (!cache.has(id))
    cache.set(
      id,
      new Promise((ok, no) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = no;
        i.src = staticFile(assets[id].file);
      }),
    );
  return cache.get(id)!;
};
export type RigProps = {
  who: "azi" | "man" | "alien";
  time: number;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  mode?: "read" | "notice" | "quip";
  progress?: number;
  lift?: number;
  phone?: boolean;
  walking?: boolean;
  face?: string;
  filming?: number;
  selfie?: number;
  talk?: number;
  action?:
    | "idle"
    | "run"
    | "brake"
    | "gate"
    | "reach"
    | "flinch"
    | "look-up"
    | "hide";
  actionProgress?: number;
  phase?: number;
  onlyArm?: boolean;
  barefoot?: boolean;
  shoes?: boolean;
  cup?: boolean;
  gesture?: "ear" | "kiss" | "hair";
};
export const SkinnedRig: React.FC<RigProps> = (props) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const painter = useRef<((p: RigProps) => void) | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [handle] = useState(() =>
    delayRender("Loading complete skinned character artwork"),
  );
  useEffect(() => {
    let active = true;
    let dispose = () => {};
    const ids = Object.keys(assets).filter(
      (id) =>
        id === "props/phone" || id === "props/shoes" || id === "props/foot" || id === "props/cup" ||
        id === props.who + "/hair-frame" ||
        (id.startsWith(props.who + "/") &&
          (id.includes("-full") ||
            id.includes("head-") ||
            id.endsWith("/head") ||
            id.endsWith("/torso"))),
    );
    Promise.all(ids.map(async (id) => [id, await load(id)] as const))
      .then((items) => {
        if (!active) return;
        const c = canvas.current!;
        const gl = c.getContext("webgl", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
        });
        if (!gl) throw new Error("WebGL skin rig unavailable");
        const shader = (type: number, src: string) => {
          const s = gl.createShader(type)!;
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(s) || "Shader failed");
          return s;
        };
        const prog = gl.createProgram()!;
        gl.attachShader(
          prog,
          shader(
            gl.VERTEX_SHADER,
            "attribute vec2 p;attribute vec2 uv;varying vec2 v;void main(){gl_Position=vec4(p.x/540.0-1.0,1.0-p.y/960.0,0.,1.);v=uv;}",
          ),
        );
        gl.attachShader(
          prog,
          shader(
            gl.FRAGMENT_SHADER,
            "precision mediump float;varying vec2 v;uniform sampler2D tex;void main(){gl_FragColor=texture2D(tex,v);}",
          ),
        );
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const ap = gl.getAttribLocation(prog, "p"),
          au = gl.getAttribLocation(prog, "uv");
        gl.enableVertexAttribArray(ap);
        gl.enableVertexAttribArray(au);
        gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(au, 2, gl.FLOAT, false, 16, 8);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        const textures: Record<string, WebGLTexture> = {};
        for (const [id, img] of items) {
          const tx = gl.createTexture()!;
          textures[id] = tx;
          gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img,
          );
        }
        painter.current = (p) => {
          gl.viewport(0, 0, 1080, 1920);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(prog);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          const running = p.action === "run";
          const phase = p.time * 2 * Math.PI / 0.8 + (p.phase ?? 0);
          const bounce = running ? -Math.abs(Math.sin(phase)) * 10 : 0;
          const angle = rad(
              (p.rotation ?? 0) + (running ? Math.sin(phase) * 1.1 : 0),
            ),
            s = p.scale ?? 1,
            origin = { x: p.x ?? 540, y: (p.y ?? 1200) + bounce * s };
          const world = (v: V): V => ({
            x: origin.x + (v.x * Math.cos(angle) - v.y * Math.sin(angle)) * s,
            y: origin.y + (v.x * Math.sin(angle) + v.y * Math.cos(angle)) * s,
          });
          const draw = (id: string, vertices: number[]) => {
            gl.bindTexture(gl.TEXTURE_2D, textures[id]);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array(vertices),
              gl.DYNAMIC_DRAW,
            );
            gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);
          };
          const quad = (
            id: string,
            x: number,
            y: number,
            w: number,
            h: number,
            r = 0,
            poly?: number[][],
          ) => {
            const a = assets[id];
            const pts = poly ?? [
              [0, 0],
              [a.width, 0],
              [a.width, a.height],
              [0, a.height],
            ];
            const vs: number[] = [];
            const point = (q: number[]) => {
              const X = (q[0] / a.width) * w,
                Y = (q[1] / a.height) * h;
              const v = world({
                x: x + X * Math.cos(r) - Y * Math.sin(r),
                y: y + X * Math.sin(r) + Y * Math.cos(r),
              });
              vs.push(v.x, v.y, q[0] / a.width, q[1] / a.height);
            };
            for (let i = 1; i < pts.length - 1; i++) {
              point(pts[0]);
              point(pts[i]);
              point(pts[i + 1]);
            }
            draw(id, vs);
          };
          const anchored = (
            id: string,
            at: V,
            anchor: V,
            scale: number,
            r = 0,
            poly?: number[][],
          ) => {
            const a = assets[id];
            const x =
                at.x -
                (anchor.x * Math.cos(r) - anchor.y * Math.sin(r)) * scale,
              y =
                at.y -
                (anchor.x * Math.sin(r) + anchor.y * Math.cos(r)) * scale;
            quad(id, x, y, a.width * scale, a.height * scale, r, poly);
          };
          const mesh = (
            id: string,
            A: V,
            B: V,
            C: V,
            root: V,
            joint: V,
            end: V,
            blend = 36,
            foot = false,
          ) => {
            const a = assets[id],
              ra = Math.atan2(joint.y - root.y, joint.x - root.x),
              rb = Math.atan2(end.y - joint.y, end.x - joint.x),
              ta = Math.atan2(B.y - A.y, B.x - A.x) - ra,
              tb = Math.atan2(C.y - B.y, C.x - B.x) - rb;
            const sa =
                Math.hypot(B.x - A.x, B.y - A.y) /
                Math.hypot(joint.x - root.x, joint.y - root.y),
              sb =
                Math.hypot(C.x - B.x, C.y - B.y) /
                Math.hypot(end.x - joint.x, end.y - joint.y);
            let da = tb - ta;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            const deform = (x: number, y: number) => {
              const w = smooth((y - joint.y + blend) / (2 * blend));
              let theta = ta + da * w,
                scale = sa + (sb - sa) * w;
              let centre = joint,
                target = B;
              if (foot && y > end.y - 30) {
                const q = smooth((y - end.y + 30) / 60);
                theta = tb * (1 - q);
                scale = sb;
                centre = end;
                target = C;
              }
              const dx = (x - centre.x) * scale,
                dy = (y - centre.y) * scale;
              return {
                x: target.x + dx * Math.cos(theta) - dy * Math.sin(theta),
                y: target.y + dx * Math.sin(theta) + dy * Math.cos(theta),
              };
            };
            const cols = 8,
              rows = 52,
              vs: number[] = [];
            const vert = (ix: number, iy: number) => {
              const X = (ix / cols) * a.width,
                Y = (iy / rows) * a.height,
                v = world(deform(X, Y));
              vs.push(v.x, v.y, ix / cols, iy / rows);
            };
            for (let j = 0; j < rows; j++)
              for (let i = 0; i < cols; i++) {
                if(foot && p.barefoot && (j+1)/rows*a.height > end.y+4) continue;
                vert(i, j);
                vert(i + 1, j);
                vert(i + 1, j + 1);
                vert(i, j);
                vert(i + 1, j + 1);
                vert(i, j + 1);
              }
            draw(id, vs);
          };
          const hairRibbon = (amplitude: number) => {
            const vs: number[] = [],
              cols = 8,
              rows = 22;
            const vert = (i: number, j: number) => {
              const u = i / cols,
                v = j / rows;
              const lag = smooth((v - 0.42) / 0.58);
              const q = world({
                x:
                  -362 +
                  u * 565 +
                  Math.sin(p.time * (running ? 9.8 : 1.5) - v * 1.9) *
                    amplitude *
                    lag,
                y: -812 + v * 869,
              });
              vs.push(q.x, q.y, u, v);
            };
            for (let j = 0; j < rows; j++)
              for (let i = 0; i < cols; i++) {
                vert(i, j);
                vert(i + 1, j);
                vert(i + 1, j + 1);
                vert(i, j);
                vert(i + 1, j + 1);
                vert(i, j + 1);
              }
            draw("azi/hair-frame", vs);
          };
          const heldPhone = (
            B: V,
            C: V,
            j: V,
            wrist: V,
            palm: V,
            width: number,
            rotation: number,
            anchorX = 44,
          ) => {
            const a =
                Math.atan2(C.y - B.y, C.x - B.x) -
                Math.atan2(wrist.y - j.y, wrist.x - j.x),
              k =
                Math.hypot(C.x - B.x, C.y - B.y) /
                Math.hypot(wrist.x - j.x, wrist.y - j.y),
              dx = (palm.x - wrist.x) * k,
              dy = (palm.y - wrist.y) * k;
            const at = {
              x: C.x + dx * Math.cos(a) - dy * Math.sin(a),
              y: C.y + dx * Math.sin(a) + dy * Math.cos(a),
            };
            anchored(
              "props/phone",
              at,
              { x: anchorX, y: 359 },
              width / 274,
              rad(rotation),
            );
          };
          const ik = (A: V, C: V, l1: number, l2: number, sign: number) => {
            const dx = C.x - A.x,
              dy = C.y - A.y,
              L = Math.hypot(dx, dy),
              d = Math.min(l1 + l2 - 1, L),
              q = (l1 * l1 - l2 * l2 + d * d) / (2 * d),
              h = Math.sqrt(Math.max(0, l1 * l1 - q * q));
            return {
              x: A.x + (dx / L) * q - (dy / L) * h * sign,
              y: A.y + (dy / L) * q + (dx / L) * h * sign,
            };
          };
          const t = p.time,
            lift = p.lift ?? 0;
          const walking = (p.walking ?? false) || running;
          const legs = (who: string) => {
            const leftA = {x:-67,y:who==="man"?-75:-100}, rightA={x:67,y:who==="man"?-75:-100};
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
            if (who === "azi") {
              if(p.barefoot){anchored("props/foot",rightC,{x:80,y:0},0.74);anchored("props/foot",leftC,{x:80,y:0},0.74);}

              mesh(
                "azi/leg-right-full",
                rightA,
                rightB,
                rightC,
                { x: 85, y: 45 },
                { x: 117, y: 460 },
                { x: 147, y: 840 },
                42,
                true,
              );
              mesh(
                "azi/leg-left-full",
                leftA,
                leftB,
                leftC,
                { x: 213, y: 45 },
                { x: 166, y: 460 },
                { x: 124, y: 849 },
                42,
                true,
              );
            } else {
              mesh(
                "man/leg-right-full",
                rightA,
                rightB,
                rightC,
                { x: 93, y: 30 },
                { x: 117, y: 388 },
                { x: 120, y: 701 },
                40,
                true,
              );
              mesh(
                "man/leg-left-full",
                leftA,
                leftB,
                leftC,
                { x: 132, y: 30 },
                { x: 103, y: 387 },
                { x: 110, y: 700 },
                40,
                true,
              );
            }
          };
          if (p.who === "azi") {
            const down =
                p.mode === "notice" || p.mode === "quip"
                  ? smooth(p.progress ?? 1)
                  : 0,
              gesture = p.mode === "quip" ? smooth(p.progress ?? 1) : 0;
            const LA = { x: -111, y: -432 },
              RA = { x: 112, y: -417 };
            let LB = add(LA, 112 + Math.sin(t * 2) * 1.2, 215),
              LC = add(LB, mix(-15, 70, down), 205),
              RB = add(RA, mix(78, 34, gesture), 215),
              RC = add(RB, mix(88, -62, gesture), 200);
            if (running) {
              LB = add(LA, 112 + Math.sin(phase) * 16, 215);
              LC = add(LB, -48 + Math.sin(phase) * 30, 205);
              RB = add(RA, 68 + Math.sin(phase) * 16, 215);
              RC = add(RB, -132 + Math.sin(phase) * 30, 200);
            } else if (p.action === "gate" || p.action === "reach") {
              const pull = p.action === "gate" ? Math.sin(t * 18) * 4 : 0;
              LB = add(LA, 114, 215);
              LC = add(LB, 79, 205);
              RB = add(RA, 2 + pull, 215);
              RC = add(RB, 13 - pull, 200);
            if (p.onlyArm) {
                const release = smooth(((p.actionProgress ?? 0) - 0.3) / 0.36);
                RB = add(RA, mix(2, 60, release), 215);
                RC = add(RB, mix(13, -115, release), 200);
              }
            } else if (p.action === "flinch" || p.action === "hide") {
              LB = add(LA, 150, 215);
              LC = add(LB, -78, 205);
              RB = add(RA, 27, 215);
              RC = add(RB, -110, 200);
            } else if (p.action === "brake") {
              LB = add(LA, 143, 215);
              LC = add(LB, -22, 205);
              RB = add(RA, 38, 215);
              RC = add(RB, -130, 200);
            }
              if(p.gesture==="ear") { RB=add(RA,-40,215); RC=add(RB,-128,200); }
            if(p.gesture==="hair") { RB=add(RA,-48,215); RC=add(RB,-150,200); }
            if(p.gesture==="kiss") { RB=add(RA,-35,215); RC=add(RB,-165+145*smooth((p.actionProgress??0)),200); }
            if(p.shoes){ LB=add(LA,110,215); LC=add(LB,70+Math.sin(t*2)*3,205); }
            if (p.onlyArm) {
              mesh(
                "azi/arm-right-full",
                RA,
                RB,
                RC,
                { x: 47, y: 40 },
                { x: 80, y: 286 },
                { x: 91, y: 522 },
                38,
              );
              gl.flush();
              return;
            }
            legs("azi");
            mesh(
              "azi/arm-right-full",
              RA,
              RB,
              RC,
              { x: 47, y: 40 },
              { x: 80, y: 286 },
              { x: 91, y: 522 },
              38,
            );
            // Torso ends inside the natural waistband, covering the limb root overlap.
            quad("azi/torso", -175, -533, 350, 533, 0, [
              [0, 0],
              [350, 0],
              [350, 415],
              [0, 415],
            ]);
            const blinking = t % 3.7 > 2.72 && t % 3.7 < 2.85;
            const state =
              (p.face === "neutral" && blinking ? "blink" : p.face) ??
              (t % 4.6 > 3.12 && t % 4.6 < 3.25
                ? "blink"
                : p.mode === "notice"
                  ? "surprise"
                  : p.mode === "quip"
                    ? "irritated"
                    : "neutral");
            const head = "azi/head-" + state,
              ha = rad(mix(4, -5, down) + Math.sin(t * 1.3) * 0.6),
              at = { x: -8, y: -447 },
              anchor = { x: 326, y: 540 };
            anchored(head, at, anchor, 0.66, ha, [
              [100, 50],
              [465, 50],
              [465, 560],
              [100, 560],
            ]);
            hairRibbon(running ? 21 : 5);
            if (p.phone !== false)
              heldPhone(
                LB,
                LC,
                { x: 72, y: 286 },
                { x: 43, y: 526 },
                { x: 68, y: 600 },
                64,
                mix(-12, -20, down),
              );
            if(p.cup) anchored("props/cup",RC,{x:80,y:100},0.8);
            if(p.shoes) anchored("props/shoes",LC,{x:110,y:0},0.55,0.12);
            mesh(
              "azi/arm-left-full",
              LA,
              LB,
              LC,
              { x: 88, y: 43 },
              { x: 72, y: 286 },
              { x: 43, y: 526 },
              38,
            );
          } else if (p.who === "alien") {
            const v = running ? Math.sin(phase) : Math.sin(t * 1.6) * 0.08;
            const LA = { x: -91, y: -464 },
              RA = { x: 91, y: -464 };
            const LB = add(LA, 112 + v * 22, 176),
              LC = add(LB, -42 - v * 27, 173);
            const RB = add(RA, 68 - v * 22, 176),
              RC = add(RB, -138 - v * 27, 173);
            const LF = {
              x: -65 + v * 22,
              y: 477 - Math.max(0, v) * (running ? 170 : 0) - bounce,
            };
            const RF = {
              x: 65 - v * 22,
              y: 477 - Math.max(0, -v) * (running ? 170 : 0) - bounce,
            };
            const LH = { x: -55, y: -165 },
              RH = { x: 55, y: -165 };
            mesh(
              "alien/leg-right-full",
              RH,
              { x: RH.x - v * 10, y: 133 - Math.max(0, -v) * 90 },
              RF,
              { x: 59, y: 21 },
              { x: 62, y: 290 },
              { x: 63, y: 491 },
              33,
              true,
            );
            mesh(
              "alien/leg-left-full",
              LH,
              { x: LH.x + v * 10, y: 133 - Math.max(0, v) * 90 },
              LF,
              { x: 61, y: 22 },
              { x: 59, y: 289 },
              { x: 49, y: 492 },
              33,
              true,
            );
            mesh(
              "alien/arm-left-full",
              LA,
              LB,
              LC,
              { x: 49, y: 28 },
              { x: 48, y: 225 },
              { x: 46, y: 399 },
              28,
            );
            quad("alien/torso", -133, -511, 266, 407);
            mesh(
              "alien/arm-right-full",
              RA,
              RB,
              RC,
              { x: 61, y: 28 },
              { x: 61, y: 226 },
              { x: 65, y: 397 },
              28,
            );
            anchored(
              "alien/head",
              { x: 0, y: -492 },
              { x: 151, y: 392 },
              0.88,
              rad(Math.sin(t * 2.7) * 3),
            );
          } else {
            const film = p.filming ?? 1,
              selfie = p.selfie ?? 1,
              gesture =
                (p.talk ?? 0) > 0.03 ? 0.5 - 0.5 * Math.cos(t * 2.1) : 0;
            const LA = { x: -142, y: -420 },
              RA = { x: 145, y: -409 },
              LB = add(LA, mix(mix(94, 130, gesture), 205, lift), 220),
              LC = add(LB, mix(mix(68, -30, gesture), 228, lift), 210),
              RB = add(
                RA,
                mix(mix(92, mix(-25, 50, selfie), film), -50, lift),
                225,
              ),
              RC = add(RB, mix(mix(88, -75, film), -70, lift), 205);
            legs("man");
            mesh(
              "man/arm-open-full",
              LA,
              LB,
              LC,
              { x: 55, y: 40 },
              { x: 65, y: 285 },
              { x: 120, y: 486 },
              37,
            );
            quad("man/torso", -200, -500, 400, 502, 0, [
              [0, 0],
              [140, 0],
              [140, 515],
              [0, 515],
            ]);
            quad("man/torso", -200, -500, 400, 502, 0, [
              [140, 95],
              [310, 95],
              [310, 515],
              [140, 515],
            ]);
            quad("man/torso", -200, -500, 400, 502, 0, [
              [310, 0],
              [447, 0],
              [447, 515],
              [310, 515],
            ]);
            quad("man/torso", -200, -500, 400, 502, 0, [
              [0, 515],
              [100, 515],
              [100, 561],
              [0, 561],
            ]);
            quad("man/torso", -200, -500, 400, 502, 0, [
              [380, 515],
              [447, 515],
              [447, 561],
              [380, 561],
            ]);
            mesh(
              p.phone===false?"man/arm-open-full":"man/arm-grip-full",
              RA,
              RB,
              RC,
              { x: 90, y: 42 },
              { x: 89, y: 290 },
              { x: 41, y: 495 },
              37,
            );
            if (p.phone !== false)
              heldPhone(
                RB,
                RC,
                { x: 89, y: 290 },
                { x: 41, y: 495 },
                { x: 64, y: 580 },
                110,
                -13,
                144,
              );
            const state = p.face ?? (lift > 0.08 ? "surprise" : "neutral"),
              headAngle = rad(lift ? -6 : Math.sin(t) * 1.0);
            anchored(
              "man/head-" + state,
              { x: -27, y: -447 },
              { x: 164, y: 374 },
              0.78,
              headAngle,
            );
            if (state === "neutral" && (p.talk ?? 0) > 0.15)
              anchored(
                "man/head-surprise",
                { x: -27, y: -447 },
                { x: 177, y: 373 },
                0.78,
                headAngle,
                [
                  [174, 247],
                  [230, 247],
                  [230, 296],
                  [174, 296],
                ],
              );
          }
          gl.flush();
        };
        painter.current(latest.current);
        continueRender(handle);
        dispose = () => {
          Object.values(textures).forEach((x) => gl.deleteTexture(x));
          gl.deleteProgram(prog);
          gl.deleteBuffer(buffer);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
        throw err;
      });
    return () => {
      active = false;
      painter.current = null;
      dispose();
    };
  }, [props.who, handle]);
  useLayoutEffect(() => {
    painter.current?.(props);
  }, [props]);
  return (
    <canvas
      ref={canvas}
      width={1080}
      height={1920}
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        top: 0,
        left: 0,
      }}
    />
  );
};
export const SkinCheck: React.FC<{ who: "azi" | "man" | "alien" }> = ({
  who,
}) => {
  const f = useCurrentFrame(),
    t = f / 30;
  return (
    <div
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        background: f < 90 ? "#ece6da" : "#24232b",
      }}
    >
      <SkinnedRig
        who={who}
        time={t}
        x={540}
        y={1200}
        scale={0.94}
        mode={t > 2 ? "quip" : "read"}
        progress={smooth((t - 2) / 0.6)}
        lift={who === "man" ? smooth((t - 2) / 1) : 0}
        phone={who === "azi" || t < 2.4}
        action={who === "alien" ? "run" : "idle"}
      />
    </div>
  );
};
