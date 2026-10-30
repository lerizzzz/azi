import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { ActorProps } from "./SeamlessRig";
import manifest from "./illustrations.json";

type ArtKey = keyof typeof manifest;
type Art = {
  file: string;
  crop: number[];
  clip?: number[];
  anchor: number;
  head: number[];
};
const art = manifest as Record<ArtKey, Art>;
const cache = new Map<string, Promise<HTMLImageElement>>();
const ready = new Map<string, HTMLImageElement>();
function load(file: string) {
  if (!cache.has(file))
    cache.set(
      file,
      new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => {
          ready.set(file, i);
          resolve(i);
        };
        i.onerror = () => reject(new Error(`Cannot load ${file}`));
        i.src = staticFile(file);
      }),
    );
  return cache.get(file)!;
}
export function AssetGate() {
  const [h] = useState(() => delayRender("Preload all V05 original drawings"));
  useEffect(() => {
    Promise.all(
      [...new Set(Object.values(art).map((a) => a.file))].map(load),
    ).then(() => continueRender(h));
  }, [h]);
  return null;
}
export function actorPoint(
  name: ArtKey,
  p: { x: number; y: number; scale: number },
  sx: number,
  sy: number,
) {
  const a = art[name],
    h = 1460 * p.scale,
    w = (h * a.crop[2]) / a.crop[3],
    ratio = h / a.crop[3];
  return {
    x: p.x - w * a.anchor + (sx - a.crop[0]) * ratio,
    y: p.y + 625 * p.scale - h + (sy - a.crop[1]) * ratio,
  };
}
const VS = `attribute vec2 point; varying vec2 uv; uniform vec4 crop; uniform vec2 texSize; uniform float clock; uniform float kind;
float bell(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return exp(-dot(q,q)*2.0);}
void main(){
  uv=(crop.xy+point*crop.zw)/texSize;
  vec2 p=point;
  float planted=1.0-smoothstep(.76,.98,p.y);
  // A SINGLE shared-vertex surface: linework, silhouette, hair and skin cannot separate.
  float breath=sin(clock*1.7);
  p.x+=.0015*sin(clock*1.15)*planted;
  p.y-=.0012*breath*planted;
  p.x+=(p.x-.5)*.004*breath*bell(p,vec2(.5,.32),vec2(.55,.2));
  if(kind<1.5||kind>5.5){
    float hair=bell(p,vec2(.18,.32),vec2(.22,.23))+bell(p,vec2(.85,.31),vec2(.14,.22));
    p.x+=.0045*sin(clock*2.1-p.y*5.0)*hair;
  }
  if(kind>2.5&&kind<3.5){
    // Working hands and their forearms move together; no independent tool overlay.
    p.x+=.002*sin(clock*3.2)*bell(p,vec2(.22,.32),vec2(.25,.17));
    p.y+=.0015*cos(clock*3.2)*bell(p,vec2(.22,.32),vec2(.25,.17));
  }
  if(kind>3.5&&kind<4.5){
    // Treatment artwork: patient, technician, pad and tweezers share this surface.
    p.x+=.0012*sin(clock*2.8)*bell(p,vec2(.20,.42),vec2(.11,.18));
    p.y-=.0012*breath*bell(p,vec2(.48,.55),vec2(.22,.18));
  }
  if(kind>5.5&&kind<6.5)p.y+=.045*bell(p,vec2(.15,.70),vec2(.32,.3));
  if(kind>6.5&&kind<7.5)p.y+=.075*bell(p,vec2(.86,.62),vec2(.42,.45));
  gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0,1);
}`;
const FS = `precision mediump float;varying vec2 uv;uniform sampler2D picture;uniform vec4 visible;void main(){if(uv.x<visible.x||uv.y<visible.y||uv.x>visible.z||uv.y>visible.w){gl_FragColor=vec4(0.0);return;}gl_FragColor=texture2D(picture,uv);}`;
function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? "Shader failed");
  return s;
}
type Surface = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  count: number;
  buffer: WebGLBuffer;
  uploaded?: HTMLImageElement;
};
export function WholeDrawing({
  name,
  time,
  width,
  height,
  kind = 0,
  style = {},
}: {
  name: ArtKey;
  time: number;
  width: number;
  height: number;
  kind?: number;
  style?: React.CSSProperties;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    surface = useRef<Surface | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() =>
    delayRender("Load complete illustrated character"),
  );
  const a = art[name],
    drawing = ready.get(a.file) ?? image;
  useEffect(() => {
    let alive = true;
    load(a.file)
      .then((i) => {
        if (alive) setImage(i);
        continueRender(handle);
      })
      .catch((e) => {
        throw e;
      });
    return () => {
      alive = false;
    };
  }, [a.file, handle]);
  useLayoutEffect(() => {
    const gl = canvas.current?.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl)
      throw new Error("WebGL is required for the continuous drawing surface");
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Drawing program did not link");
    gl.useProgram(program);
    const grid: number[] = [];
    const nx = 30,
      ny = 52;
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++)
        grid.push(
          x / nx,
          y / ny,
          (x + 1) / nx,
          y / ny,
          x / nx,
          (y + 1) / ny,
          (x + 1) / nx,
          y / ny,
          (x + 1) / nx,
          (y + 1) / ny,
          x / nx,
          (y + 1) / ny,
        );
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "point");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "picture"), 0);
    surface.current = { gl, program, texture, count: grid.length / 2, buffer };
    return () => {
      surface.current = null;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);
  useLayoutEffect(() => {
    if (!drawing || !surface.current) return;
    const { gl, program, texture, count } = surface.current;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (surface.current.uploaded !== drawing) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        drawing,
      );
      surface.current.uploaded = drawing;
    }
    gl.uniform4f(
      gl.getUniformLocation(program, "crop"),
      a.crop[0],
      a.crop[1],
      a.crop[2],
      a.crop[3],
    );
    gl.uniform2f(
      gl.getUniformLocation(program, "texSize"),
      drawing.naturalWidth,
      drawing.naturalHeight,
    );
    const v = a.clip ?? a.crop;
    gl.uniform4f(
      gl.getUniformLocation(program, "visible"),
      v[0] / drawing.naturalWidth,
      v[1] / drawing.naturalHeight,
      (v[0] + v[2]) / drawing.naturalWidth,
      (v[1] + v[3]) / drawing.naturalHeight,
    );
    gl.uniform1f(gl.getUniformLocation(program, "clock"), time);
    gl.uniform1f(gl.getUniformLocation(program, "kind"), kind);
    gl.drawArrays(gl.TRIANGLES, 0, count);
    gl.finish();
  }, [drawing, a, time, kind, width, height]);
  return (
    <canvas
      ref={canvas}
      width={Math.max(1, Math.ceil(width))}
      height={Math.max(1, Math.ceil(height))}
      style={{ position: "absolute", width, height, ...style }}
    />
  );
}

export function chooseDrawing(p: ActorProps): ArtKey {
  if (p.who === "alien") return "alien";
  if (p.who === "master") return "master";
  if (p.who === "man")
    return (p.lift ?? 0) > 0.08 && p.phone === false
      ? "man-lift"
      : p.phone === false
        ? "man-guide"
        : (p.lift ?? 0) > 0.01
          ? "man-surprise"
          : "man-film";
  if (p.walking || p.action === "run") {
    const phase = (((p.time / 0.88) % 1) + 1) % 1;
    return (["walk-0", "walk-1", "walk-2", "walk-3"] as ArtKey[])[
      Math.floor(phase * 4)
    ];
  }
  if (p.action === "reach") return "azi-remove-shoes";
  if (p.gesture === "ear") return "azi-ear";
  if (p.gesture === "hair") return "door-hair";
  if (p.gesture === "kiss") return "door-kiss";
  if (p.barefoot || p.shoes)
    return p.face === "blink" ? "azi-blink" : "azi-bare";
  return "azi-phone";
}
export function IllustratedActor(p: ActorProps) {
  if (p.onlyArm) return null;
  const name = chooseDrawing(p),
    a = art[name];
  const s = p.scale ?? 1,
    h = 1460 * s,
    w = (h * a.crop[2]) / a.crop[3];
  const x = p.x ?? 540,
    y = p.y ?? 1300;
  return (
    <WholeDrawing
      name={name}
      time={p.time}
      width={w}
      height={h}
      kind={
        name === "walk-1"
          ? 6
          : name === "walk-3"
            ? 7
            : p.who === "master"
              ? 3
              : p.who === "azi"
                ? 0
                : 2
      }
      style={{
        left: x - w * a.anchor,
        top: y + 625 * s - h,
        transform:
          p.who === "man" && p.phone === false && (p.x ?? 0) > 650
            ? "scaleX(-1)"
            : p.rotation
              ? `rotate(${p.rotation}deg)`
              : undefined,
        transformOrigin: `${w * a.anchor}px ${h - 625 * s}px`,
      }}
    />
  );
}

export function IntegratedTreatment({
  time,
  x = 15,
  y = 950,
  width = 1050,
}: {
  time: number;
  x?: number;
  y?: number;
  width?: number;
}) {
  const a = art.treatment;
  return (
    <WholeDrawing
      name="treatment"
      time={time}
      width={width}
      height={(width * a.crop[3]) / a.crop[2]}
      kind={4}
      style={{ left: x, top: y }}
    />
  );
}
export function TeaDrawing({
  time,
  x = 115,
  y = 700,
  width = 850,
}: {
  time: number;
  x?: number;
  y?: number;
  width?: number;
}) {
  const a = art.tea;
  return (
    <WholeDrawing
      name="tea"
      time={time}
      width={width}
      height={(width * a.crop[3]) / a.crop[2]}
      kind={0}
      style={{ left: x, top: y }}
    />
  );
}
export function IllustratedFace({
  who = "azi",
  state = "neutral",
  width = 554,
  x = 0,
  y = 0,
  time = 0,
}: {
  who?: ActorProps["who"];
  state?: string;
  width?: number;
  x?: number;
  y?: number;
  time?: number;
  viewer?: boolean;
}) {
  const name: ArtKey =
    who === "alien"
      ? "alien"
      : who === "man"
        ? "man-film"
        : who === "master"
          ? "master"
          : state === "blink"
            ? "azi-blink"
            : "azi-bare";
  const a = art[name];
  // A photographic crop of the WHOLE drawing, only for an inset. Never attached to a different body.
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={(width * 588) / 554}
      viewBox={`${a.head[0]} ${a.head[1]} ${a.head[2]} ${a.head[3]}`}
      style={{ overflow: "hidden" }}
    >
      <image
        href={staticFile(a.file)}
        width={a.head[4]}
        height={a.head[5]}
        transform={`rotate(${Math.sin(time * 0.9) * 0.25} ${a.head[0] + a.head[2] / 2} ${a.head[1] + a.head[3] / 2})`}
      />
    </svg>
  );
}
export function DrawingCheck() {
  const f = useCurrentFrame(),
    t = f / 30;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#b6adb5" }}>
      <AssetGate />
      {t < 4 ? (
        <IllustratedActor
          who="azi"
          time={t}
          x={540}
          y={1120}
          scale={0.95}
          phone={t < 2}
          barefoot={t >= 2}
          shoes={t >= 2}
        />
      ) : t < 8 ? (
        <IllustratedActor
          who="azi"
          time={t - 4}
          x={200 + (t - 4) * 160}
          y={1120}
          scale={0.95}
          barefoot
          shoes
          walking
        />
      ) : t < 10 ? (
        <IllustratedActor
          who="man"
          time={t}
          x={540}
          y={1120 - (t - 8) * 230}
          scale={0.95}
          lift={(t - 8) / 2}
        />
      ) : (
        <IntegratedTreatment time={t} y={800} />
      )}
    </div>
  );
}
