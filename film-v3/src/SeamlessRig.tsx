import { useEffect, useId, useState } from "react";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { RigProps } from "./SkinnedRig";
export type V = { x: number; y: number };
export type ActorProps = Omit<RigProps, "who"> & {
  who: RigProps["who"] | "master";
  gaze?: "viewer" | "street";
  variant?: number;
  debug?: boolean;
  task?: "treat" | "push";
  tool?: "cotton" | "tweezers";
};
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: V, n: number): V => ({ x: a.x * n, y: a.y * n });
const len = (a: V) => Math.hypot(a.x, a.y);
const unit = (a: V) => mul(a, 1 / Math.max(0.0001, len(a)));
const perp = (a: V) => ({ x: -a.y, y: a.x });
const pt = (a: V) => `${a.x.toFixed(2)} ${a.y.toFixed(2)}`;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export function ik(a: V, c: V, l1: number, l2: number, bend: number) {
  const d0 = len(sub(c, a));
  const d = Math.max(Math.abs(l1 - l2) + 0.001, Math.min(l1 + l2 - 0.001, d0));
  const direction = unit(sub(c, a));
  const end = add(a, mul(direction, d));
  const q = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - q * q));
  return {
    b: add(add(a, mul(direction, q)), mul(perp(direction), bend * h)),
    c: end,
  };
}
export function actorPose(p: ActorProps) {
  const t = p.time;
  const walking = !!p.walking || p.action === "run";
  const lifted = p.lift ?? 0;
  const cycle = 0.82;
  const phase = t / cycle;
  const bodyBob = walking
    ? -7 * (1 - Math.cos(phase * 4 * Math.PI))
    : Math.sin(t * 1.7) * 1.4;
  // Anatomical right is screen LEFT for a character facing the viewer.
  const hips = { right: { x: -66, y: -65 }, left: { x: 66, y: -65 } };
  const shoulders = { right: { x: -114, y: -490 }, left: { x: 114, y: -490 } };
  const feet = {} as Record<"right" | "left", V>;
  const knees = {} as Record<"right" | "left", V>;
  for (const side of ["right", "left"] as const) {
    const sign = side === "right" ? -1 : 1;
    const u = (((phase + (side === "left" ? 0.5 : 0)) % 1) + 1) % 1;
    let end: V = { x: sign * 79, y: 625 };
    if (walking) {
      // 58% grounded stance, fixed foot in world. Limb lengths never scale.
      if (u < 0.58)
        end = { x: sign * 66 + 99 - (198 * u) / 0.58, y: 625 - bodyBob };
      else {
        const v = (u - 0.58) / 0.42;
        end = {
          x: sign * 66 - 99 + 198 * smooth(v),
          y: 625 - 100 * Math.sin(Math.PI * v) - bodyBob,
        };
      }
    }
    if (lifted > 0) {
      end = {
        x: sign * (80 + lifted * 40),
        y: 625 - lifted * (side === "left" ? 190 : 95),
      };
    }
    const leg = ik(hips[side], end, 352, 363, -1);
    feet[side] = leg.c;
    knees[side] = leg.b;
  }
  const angles: Record<"right" | "left", [number, number]> = {
    right: [100, 85],
    left: [80, 95],
  };
  if (p.phone !== false && p.who === "azi") angles.right = [110, -35];
  if (p.who === "man" && p.phone !== false) angles.left = [-5, -98];
  if (walking) {
    const v = Math.sin(phase * 2 * Math.PI);
    angles.right = [108 + v * 19, -35 + v * 12];
    angles.left = [72 + v * 19, -145 + v * 12];
  }
  if (p.shoes) angles.right = [100 + Math.sin(t * 2) * 2, 85];
  if (p.gesture === "ear") angles.left = [-25, -160];
  if (p.gesture === "hair") angles.left = [-38, -155];
  if (p.gesture === "kiss")
    angles.left = [-10, lerp(-155, -30, smooth(p.actionProgress ?? 0))];
  if (p.cup) angles.left = [68, -142];
  if (p.who === "master" && p.task) {
    angles.right = [128, 150 + Math.sin(t * 3) * 4];
    angles.left = [120, 170 + Math.sin(t * 3) * 4];
  }
  if (p.who === "alien") {
    angles.right = [102, 78];
    angles.left = [72, 133];
  }
  if (p.who === "man" && p.talk)
    angles.right = [115 + Math.sin(t * 2) * 12, 40 + Math.sin(t * 2) * 20];
  if (lifted > 0) {
    angles.right = [lerp(100, 216, lifted), lerp(85, 225, lifted)];
    angles.left = [lerp(-5, -35, lifted), lerp(-98, -20, lifted)];
  }
  const wrists = {} as Record<"right" | "left", V>;
  const elbows = {} as Record<"right" | "left", V>;
  const fromAngle = (a: V, d: number, l: number) =>
    add(a, {
      x: Math.cos((d * Math.PI) / 180) * l,
      y: Math.sin((d * Math.PI) / 180) * l,
    });
  for (const side of ["right", "left"] as const) {
    elbows[side] = fromAngle(shoulders[side], angles[side][0], 211);
    wrists[side] = fromAngle(elbows[side], angles[side][1], 216);
  }
  if (p.who === "master" && p.task === "treat") {
    for (const side of ["right", "left"] as const) {
      const target = {
        x: (side === "right" ? -210 : -160) + Math.sin(t * 3) * 8,
        y: side === "right" ? -145 : -155,
      };
      const pose = ik(
        shoulders[side],
        target,
        211,
        216,
        side === "right" ? 1 : -1,
      );
      elbows[side] = pose.b;
      wrists[side] = pose.c;
    }
  }
  return {
    hips,
    shoulders,
    feet,
    knees,
    wrists,
    elbows,
    bodyBob,
    walking,
    lifted,
  };
}
function ribbon(a: V, b: V, c: V, r1: number, r2: number, r3: number) {
  const n1 = perp(unit(sub(b, a))),
    n2 = perp(unit(sub(c, b))),
    nm = unit(add(n1, n2));
  const ao = add(a, mul(n1, r1)),
    bo = add(b, mul(nm, r2)),
    co = add(c, mul(n2, r3));
  const ai = add(a, mul(n1, -r1)),
    bi = add(b, mul(nm, -r2)),
    ci = add(c, mul(n2, -r3));
  return `M${pt(ao)} Q${pt(bo)} ${pt(co)} L${pt(ci)} Q${pt(bi)} ${pt(ai)} Z`;
}
function armPath(a: V, b: V, c: V) {
  const n1 = perp(unit(sub(b, a))),
    n2 = perp(unit(sub(c, b))),
    nm = unit(add(n1, n2));
  const q = (p: V, n: V, r: number) => pt(add(p, mul(n, r)));
  return `M${q(a, n1, 29)} L${q(b, n1, 23)} Q${q(b, nm, 26)} ${q(b, n2, 23)} L${q(c, n2, 15)} L${q(c, n2, -15)} L${q(b, n2, -23)} Q${q(b, nm, -26)} ${q(b, n1, -23)} L${q(a, n1, -29)} Z`;
}
function handPath(w: V, e: V, side: "right" | "left") {
  const y = unit(sub(w, e)),
    x = perp(y);
  const thumb = side === "right" ? -1 : 1;
  const q = (u: number, v: number) => pt(add(w, add(mul(x, u), mul(y, v))));
  return `M${q(-15, -3)} L${q(-20, 33)} Q${q(-18, 48)} ${q(-10, 60)} L${q(-3, 72)} L${q(3, 70)} L${q(0, 46)} L${q(10, 68)} L${q(17, 65)} L${q(10, 42)} L${q(23, 59)} L${q(29, 54)} L${q(17, 30)} L${q(thumb * 35, 25)} Q${q(thumb * 43, 15)} ${q(thumb * 34, 14)} L${q(thumb * 17, 22)} L${q(15, -3)} Z`;
}
function ArmArt({
  pose,
  skin,
  cloth,
  who,
  uid,
  tool,
}: {
  pose: ReturnType<typeof actorPose>;
  skin: string;
  cloth: string;
  who: ActorProps["who"];
  uid: string;
  tool?: ActorProps["tool"];
}) {
  return (
    <g>
      {(["right", "left"] as const).map((side) => {
        const a = pose.shoulders[side],
          b = pose.elbows[side],
          c = pose.wrists[side];
        const path = armPath(a, b, c);
        const cap = add(a, mul(sub(b, a), 0.42));
        const capB = add(a, mul(sub(b, a), 0.2));
        const n = perp(unit(sub(b, a)));
        return (
          <g key={side}>
            <defs>
              <clipPath id={`${uid}${side}`}>
                <path d={path} />
              </clipPath>
            </defs>
            <path d={path} fill={who === "man" ? cloth : skin} />
            <path
              d={path.replace(/ Z$/, "")}
              fill="none"
              stroke="#16101b"
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            <path
              d={ribbon(a, b, c, 9, 8, 5)}
              clipPath={`url(#${uid}${side})`}
              fill={who === "man" ? "#15141e" : "#9b5a45"}
              opacity=".35"
            />
            {who === "master" && (
              <path
                d={`M${pt(add(a, mul(n, 30)))} L${pt(add(capB, mul(n, 30)))} L${pt(add(cap, mul(n, 27)))} L${pt(add(cap, mul(n, -27)))} L${pt(add(a, mul(n, -30)))}Z`}
                fill="#17151f"
              />
            )}
            <path d={handPath(c, b, side)} fill={skin} />
            <path
              d={handPath(c, b, side).replace(/ Z$/, "")}
              fill="none"
              stroke="#17111b"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
      {tool &&
        (() => {
          const side = tool === "cotton" ? "right" : "left";
          const c = pose.wrists[side],
            b = pose.elbows[side],
            at = add(c, mul(unit(sub(c, b)), 52));
          return (
            <g transform={`translate(${at.x} ${at.y})`}>
              {tool === "cotton" ? (
                <ellipse
                  rx="25"
                  ry="19"
                  fill="#eee7dd"
                  stroke="#4d4349"
                  strokeWidth="2"
                />
              ) : (
                <g stroke="#b8bec5" strokeWidth="5" fill="none">
                  <path d="M0 0 L-57 -17 L-76 -9 M7 5 L-54 -7 L-70 -4" />
                </g>
              )}
            </g>
          );
        })()}
    </g>
  );
}
const imageCache = new Map<string, Promise<void>>();
function preload(f: string) {
  if (!imageCache.has(f))
    imageCache.set(
      f,
      new Promise((ok, no) => {
        const i = new Image();
        i.onload = () => ok();
        i.onerror = () => no(Error(`Asset missing: ${f}`));
        i.src = staticFile(f);
      }),
    );
  return imageCache.get(f)!;
}
export const HAS_FRONT = true;
export function Face({
  who = "azi",
  time = 0,
  state = "neutral",
  viewer = false,
  width = 290,
  x = -154,
  y = -837,
}: {
  who?: ActorProps["who"];
  time?: number;
  state?: string;
  viewer?: boolean;
  width?: number;
  x?: number;
  y?: number;
}) {
  const asset =
    who === "azi"
      ? `azi/head-${["neutral", "blink", "surprise", "irritated"].includes(state) ? state : "neutral"}.png`
      : who === "alien"
        ? "alien/head.png"
        : who === "master"
          ? "master/head-neutral.png"
          : `man/head-${state === "surprise" ? "surprise" : "neutral"}.png`;
  const final =
    who === "azi" && HAS_FRONT && viewer
      ? state === "surprise"
        ? "v04/azi-front-surprise.png"
        : state === "smile"
          ? "v04/azi-front-smile.png"
          : "v04/azi-front.png"
      : asset;
  const ratio =
    who === "master"
      ? 472 / 273
      : who === "alien"
        ? 438 / 300
        : who === "man"
          ? 412 / 335
          : 588 / 554;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${Math.sin(time * 1.2) * 0.7} ${width / 2} ${width * 0.7})`}
    >
      <image href={staticFile(final)} width={width} height={width * ratio} />
    </g>
  );
}
export function SeamlessRig(p: ActorProps) {
  const id = useId().replace(/:/g, "");
  const [handle] = useState(() => delayRender(`Continuous actor ${p.who}`));
  useEffect(() => {
    const files =
      p.who === "azi"
        ? [
            "azi/head-neutral.png",
            "azi/head-blink.png",
            "azi/head-surprise.png",
            "azi/head-irritated.png",
            ...(HAS_FRONT
              ? [
                  "v04/azi-front.png",
                  "v04/azi-front-surprise.png",
                  "v04/azi-front-smile.png",
                ]
              : []),
          ]
        : p.who === "alien"
          ? ["alien/head.png"]
          : p.who === "master"
            ? ["master/head-neutral.png"]
            : ["man/head-neutral.png", "man/head-surprise.png"];
    Promise.all(files.map(preload))
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [p.who, handle]);
  const pose = actorPose(p),
    { hips, knees, feet, shoulders, elbows, wrists, bodyBob, walking } = pose;
  const female = p.who === "azi",
    alien = p.who === "alien",
    master = p.who === "master";
  const skin = alien ? "#929c7d" : "#c6855e",
    shade = alien ? "#66705a" : "#9c5947";
  const cloth = alien
    ? "#7a8669"
    : female
      ? "#45454c"
      : master
        ? "#29262e"
        : ["#292b36", "#33313b", "#292831"][(p.variant ?? 0) % 3];
  const waistY = -170;
  const crotch = { x: 0, y: 12 };
  const sidePoints = (side: "right" | "left", outer: boolean) => {
    const a = hips[side],
      b = knees[side],
      c = feet[side];
    const direction = perp(unit(sub(c, b)));
    const sign = (side === "right" ? 1 : -1) * (outer ? 1 : -1);
    return {
      h: add(a, { x: (side === "right" ? -1 : 1) * (outer ? 63 : -40), y: 0 }),
      k: add(b, mul(direction, sign * (outer ? 63 : 46))),
      c: add(c, { x: sign * -67, y: -6 }),
    };
  };
  const lo = sidePoints("right", true),
    li = sidePoints("right", false),
    ri = sidePoints("left", false),
    ro = sidePoints("left", true);
  const pants = `M-105 ${waistY} Q-145 -125 ${pt(lo.h)} Q${pt(lo.k)} ${pt(lo.c)} L${pt(li.c)} Q${pt(li.k)} ${pt(crotch)} Q${pt(ri.k)} ${pt(ri.c)} L${pt(ro.c)} Q${pt(ro.k)} ${pt(ro.h)} Q145 -125 105 ${waistY} Z`;
  const body =
    "M-38 -557 L-43 -519 Q-78 -516 -114 -496 Q-139 -480 -124 -440 L-91 -350 L-68 -242 Q-71 -176 -105 -136 Q0 -99 105 -136 Q72 -180 68 -242 L91 -350 L124 -440 Q140 -480 114 -496 Q80 -516 43 -519 L38 -557 Z";
  const headState =
    p.face ??
    (p.mode === "notice" || (p.lift ?? 0) > 0.2
      ? "surprise"
      : p.mode === "quip"
        ? "irritated"
        : p.time % 4.1 > 3.75
          ? "blink"
          : "neutral");
  const lookViewer =
    p.gaze === "viewer" ||
    (p.gaze !== "street" && Math.floor(p.time / 2.4) % 3 === 1);
  const rootR = p.rotation ?? 0;
  const stretch = 1;
  const upperPaths = (["right", "left"] as const).map((side) => ({
    side,
    d: armPath(shoulders[side], elbows[side], wrists[side]),
  }));
  if (p.onlyArm)
    return (
      <svg
        viewBox="0 0 1080 1920"
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <g
          transform={`translate(${p.x ?? 540} ${(p.y ?? 1200) + bodyBob * (p.scale ?? 1)}) rotate(${rootR}) scale(${p.scale ?? 1})`}
        >
          <ArmArt
            pose={pose}
            skin={skin}
            cloth={cloth}
            who={p.who}
            uid={`foreground${id}`}
            tool={p.tool}
          />
        </g>
      </svg>
    );
  return (
    <svg
      viewBox="0 0 1080 1920"
      width="1080"
      height="1920"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <defs>
        <clipPath id={`arms${id}`}>
          {upperPaths.map((a) => (
            <path key={a.side} d={a.d} />
          ))}
        </clipPath>
        <clipPath id={`pants${id}`}>
          <path d={pants} />
        </clipPath>
        <filter id={`weld${id}`} x="-50%" y="-30%" width="200%" height="160%">
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="2.8"
            result="grow"
          />
          <feFlood floodColor="#100e16" />
          <feComposite in2="grow" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        transform={`translate(${p.x ?? 540} ${(p.y ?? 1200) + bodyBob * (p.scale ?? 1)}) rotate(${rootR}) scale(${p.scale ?? 1} ${(p.scale ?? 1) * stretch})`}
      >
        {female && (
          <path
            d={`M-85 -777 Q-250 -630 ${-191 + Math.sin(p.time * 3) * 13} -197 Q-205 -73 -122 31 L-35 -292 L92 -277 Q185 -104 218 -46 Q249 -166 ${171 + Math.sin(p.time * 3 - 1) * 14} -492 Q172 -720 75 -799Z`}
            fill="#171520"
            stroke="#0d0c13"
            strokeWidth="6"
          />
        )}
        {female && (
          <path
            d={`M-188 -472 Q-221 -160 -137 4 L-86 -236 M143 -442 Q205 -192 200 -82 L146 -228`}
            fill="#70243b"
            stroke="#1b121f"
            strokeWidth="7"
          />
        )}
        {(["right", "left"] as const).map((side) => {
          const c = feet[side],
            bare = p.barefoot || alien;
          const direction = walking ? 1 : side === "right" ? -1 : 1;
          const u =
            (((p.time / 0.82 + (side === "left" ? 0.5 : 0)) % 1) + 1) % 1;
          const flex =
            walking && u > 0.58
              ? -12 * Math.sin((Math.PI * (u - 0.58)) / 0.42)
              : 0;
          return (
            <g
              key={side}
              transform={`translate(${c.x} ${c.y}) rotate(${flex})`}
            >
              <path
                d={
                  bare
                    ? `M-27 -21 L28 -21 L36 10 L${direction * 70} 25 Q${direction * 83} 36 ${direction * 62} 42 L-45 42 L-44 24 Z`
                    : `M-35 -23 L37 -23 L47 20 L${direction * 91} 40 L${direction * 86} 49 L-50 47 L-53 23Z`
                }
                fill={bare ? skin : "#16141e"}
                stroke="#0e0c14"
                strokeWidth="5"
              />
              {!bare && (
                <path
                  d={`M-32 26 L27 26 M${direction * 57} 31 L${direction * 68} 38`}
                  stroke="#7a6575"
                  strokeWidth="3"
                />
              )}
            </g>
          );
        })}
        <g filter={`url(#weld${id})`} fill={skin}>
          {upperPaths.map((a) => (
            <path key={a.side} d={a.d} fill={p.who === "man" ? cloth : skin} />
          ))}
          <path d={body} />
          {alien && <path d={pants} fill={skin} />}
          {(["right", "left"] as const).map((side) => (
            <path key={side} d={handPath(wrists[side], elbows[side], side)} />
          ))}
        </g>
        <g clipPath={`url(#arms${id})`}>
          {upperPaths.map(({ side }) => (
            <path
              key={side}
              d={ribbon(shoulders[side], elbows[side], wrists[side], 10, 9, 5)}
              fill={p.who === "man" ? "#15141d" : shade}
              opacity=".55"
            />
          ))}
        </g>
        <path
          d="M-32 -553 L5 -524 L34 -548 L32 -492 L7 -477 L-33 -506Z"
          fill={shade}
        />
        <path
          d={pants}
          fill={alien ? skin : cloth}
          stroke="#100e16"
          strokeWidth={alien ? 0 : 6}
          strokeLinejoin="round"
        />
        <g clipPath={`url(#pants${id})`}>
          <path
            d={`M-69 -130 Q-125 -39 ${pt(knees.right)} L${feet.right.x - 35} ${feet.right.y - 26} L${feet.right.x + 38} ${feet.right.y - 22} Q${knees.right.x + 29} ${knees.right.y} -7 -35Z`}
            fill={alien ? "#82916f" : female ? "#66636a" : "#393842"}
            opacity=".65"
          />
          <path
            d={`M76 -126 L${knees.left.x + 30} ${knees.left.y - 10} L${feet.left.x + 45} ${feet.left.y - 20} L${feet.left.x - 6} ${feet.left.y - 24} Q${knees.left.x - 10} ${knees.left.y} 3 -27Z`}
            fill={alien ? "#637153" : "#24242e"}
            opacity=".8"
          />
          <path
            d={`M-101 -155 Q0 -116 101 -155 M0 -144 L9 -16 M-78 -115 L-54 -71 M78 -115 L51 -74 M${knees.right.x - 46} ${knees.right.y + 45} l61 -32 M${knees.left.x - 33} ${knees.left.y + 55} l65 -30`}
            opacity={alien ? 0 : 1}
            stroke="#1a1823"
            fill="none"
            strokeWidth="4"
          />
        </g>
        {female ? (
          <>
            <path
              d="M-45 -537 L-70 -509 L-114 -467 L-92 -359 Q-79 -317 -69 -241 L-86 -197 Q0 -167 87 -197 L69 -241 Q80 -313 94 -360 L116 -467 L69 -509 L45 -537 L28 -518 L64 -392 L0 -353 L-64 -392 L-28 -518Z"
              fill="#12111a"
              stroke="#0e0c14"
              strokeWidth="5"
            />
            <path
              d="M-73 -394 L0 -362 L70 -393 L54 -299 L-34 -312Z"
              fill="#27232c"
            />
            <path d="M-70 -241 L54 -291 L70 -228 L-60 -211Z" fill="#08090f" />
          </>
        ) : (
          <path
            d={
              alien
                ? "M-95 -468 L0 -415 L95 -468 L64 -354 L76 -205 L0 -170 L-76 -205 L-64 -354Z"
                : "M-118 -490 L-48 -518 Q0 -478 48 -518 L118 -490 L132 -392 L94 -366 L90 -182 Q0 -157 -90 -182 L-94 -366 L-132 -392Z"
            }
            fill={alien ? "#899776" : "#17151f"}
            stroke="#100e16"
            strokeWidth="5"
          />
        )}
        {p.who === "man" && (
          <>
            <path
              d="M-48 -518 L-120 -487 L-134 -403 L-96 -370 L-109 -187 L-39 -178 L-28 -410 L-60 -451 L-27 -476Z M48 -518 L120 -487 L134 -403 L96 -370 L109 -187 L39 -178 L28 -410 L60 -451 L27 -476Z"
              fill={cloth}
              stroke="#0e0c15"
              strokeWidth="5"
            />
            <path
              d="M-95 -272 L-43 -285 M45 -285 L96 -272"
              stroke="#111019"
              strokeWidth="5"
            />
          </>
        )}
        <ArmArt
          pose={pose}
          skin={skin}
          cloth={cloth}
          who={p.who}
          uid={`front${id}`}
          tool={p.tool}
        />
        {p.phone !== false && p.who !== "alien" && p.who !== "master" && (
          <g
            transform={`translate(${p.who === "man" ? wrists.left.x : wrists.right.x} ${p.who === "man" ? wrists.left.y : wrists.right.y}) rotate(-12)`}
          >
            <rect
              x="-24"
              y="-53"
              width="58"
              height="105"
              rx="8"
              fill="#13141f"
              stroke="#0c0c15"
              strokeWidth="5"
            />
            <rect
              x="-17"
              y="-43"
              width="44"
              height="82"
              rx="3"
              fill="#ece6d9"
            />
            <circle cx="5" cy="46" r="3" fill="#858398" />
          </g>
        )}
        {p.shoes && (
          <g
            transform={`translate(${wrists.right.x - 8} ${wrists.right.y + 40}) rotate(9)`}
          >
            <path
              d="M-12 -4 Q-48 47 -34 91 L29 142 L61 142 L47 117 L-4 66 L6 2 M15 12 Q12 77 45 96 L72 133 L105 133 L75 92 L39 55 L33 7"
              fill="#14121d"
              stroke="#100d16"
              strokeWidth="5"
            />
            <path
              d="M-33 88 L-40 150 L-32 150 L-15 106 M42 92 L42 150 L50 150 L60 111"
              fill="#221923"
              stroke="#100d16"
              strokeWidth="4"
            />
            <path
              d="M-32 90 L47 137 M43 94 L86 130"
              stroke="#9d4e63"
              strokeWidth="4"
            />
          </g>
        )}
        {p.cup && (
          <g transform={`translate(${wrists.left.x - 8} ${wrists.left.y})`}>
            <path
              d="M-45 -36 H33 L28 48 H-38Z"
              fill="#efe5d4"
              stroke="#14111c"
              strokeWidth="5"
            />
            <path
              d="M33 -20 Q80 -23 65 25 L32 25"
              fill="none"
              stroke="#eee4d3"
              strokeWidth="10"
            />
            <ellipse cx="-6" cy="-36" rx="39" ry="10" fill="#6b3826" />
          </g>
        )}
        <Face
          who={p.who}
          time={p.time}
          state={p.mode === "quip" ? "smile" : headState}
          viewer={lookViewer}
          width={alien ? 265 : master ? 215 : female ? 290 : 264}
          x={alien ? -132 : master ? -108 : female ? -154 : -135}
          y={alien ? -865 : master ? -876 : female ? -837 : -823}
        />
        {p.gesture === "ear" && (
          <ellipse
            cx="118"
            cy="-661"
            rx="8"
            ry="17"
            fill="#eee9df"
            stroke="#0e0d17"
            strokeWidth="3"
          />
        )}
        {p.debug && (
          <g stroke="#f45b82" strokeWidth="4" fill="#e8df99">
            {(["right", "left"] as const).map((side) => (
              <g key={side}>
                <path
                  d={`M${pt(shoulders[side])} L${pt(elbows[side])} L${pt(wrists[side])} M${pt(hips[side])} L${pt(knees[side])} L${pt(feet[side])}`}
                  fill="none"
                />
                {[
                  hips[side],
                  knees[side],
                  feet[side],
                  shoulders[side],
                  elbows[side],
                  wrists[side],
                ].map((q, i) => (
                  <circle key={i} cx={q.x} cy={q.y} r="8" />
                ))}
              </g>
            ))}
          </g>
        )}
        {walking && <path d="M-220 580 H220" opacity="0" />}
      </g>
    </svg>
  );
}
export function AnatomyCheck() {
  const f = useCurrentFrame(),
    t = f / 30;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#d8d0ca" }}>
      <SeamlessRig
        who={t < 4 ? "azi" : t < 8 ? "man" : t < 10 ? "alien" : "master"}
        time={t}
        x={540}
        y={1120}
        scale={0.98}
        phone={t < 2 || (t > 4 && t < 6)}
        walking={t > 1 && t < 4}
        action={t > 1 && t < 4 ? "run" : "idle"}
        lift={t > 6 && t < 8 ? smooth((t - 6) / 1.6) : 0}
        barefoot={t > 2 && t < 4}
        shoes={t > 2 && t < 4}
        debug={false}
      />
    </div>
  );
}
