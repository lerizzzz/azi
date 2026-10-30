import { createContext, useContext } from "react";
import { IllustratedFace as Face } from "./IllustratedActor";
import edit from "./shots-v06.json";
export type Shot = {
  scene: number;
  from: number;
  to: number;
  kind: "wide" | "medium" | "eyes" | "detail" | "split" | "brand";
  focus: [number, number];
  zoom: number;
  eyeWho?: "azi" | "alien" | "man";
  note: string;
  acting?: string;
  action?: string;
  entry?: string;
};
export const shots: Shot[] = edit as Shot[];
export function shotAt(t: number) {
  return shots.find((s) => s.from <= t && t < s.to) ?? shots[shots.length - 1];
}
export const ShotContext = createContext<Shot>(shots[0]);
export const useComicShot = () => useContext(ShotContext);
export function EyeStrip({ shot, time }: { shot: Shot; time: number }) {
  if (shot.kind !== "eyes") return null;
  // Keep the story visible; one dramatic inset replaces redundant graphics.
  const who = shot.eyeWho ?? "azi";
  const since = time - shot.from;
  if (shot.scene === 5) return null; // The door already has a close-up with both blinks.
  const inP = Math.min(1, since / 0.16);
  const fromRight = Math.round((1 - inP) ** 2 * 1140);
  return (
    <div
      style={{
        position: "absolute",
        left: 35,
        top: shot.scene === 8 ? 680 : 470,
        width: 1010,
        height: 320,
        overflow: "hidden",
        background: "#191520",
        border: "8px solid #110e17",
        boxShadow: "12px 14px 0 #110e17",
        transform: `translateX(${fromRight}px) rotate(-2deg)`,
      }}
    >
      <svg width="1010" height="320" viewBox="0 0 1010 320">
        <path
          d="M0 0 H1010 V320 H0Z"
          fill={who === "alien" ? "#374339" : "#4d2335"}
        />
        <Face
          who={who}
          viewer={who === "azi"}
          time={time}
          width={who === "alien" ? 1050 : 1200}
          x={who === "alien" ? -20 : -90}
          y={who === "alien" ? -445 : -335}
          state={shot.scene === 7 ? "smudge" : shot.acting || "neutral"}
        />
      </svg>
    </div>
  );
}
// V06: the rejected full-frame white/red swipe is removed.

export function ComicInset({ shot, time }: { shot: Shot; time: number }) {
  if (shot.kind !== "split") return null;
  if (shot.scene !== 5) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 44,
        bottom: 165,
        width: 405,
        height: 240,
        background: "#2c352e",
        border: "8px solid #eee5d7",
        boxShadow: "8px 8px 0 #120f19",
        overflow: "hidden",
        transform: "rotate(3deg)",
      }}
    >
      <svg width="405" height="240">
        <Face who="alien" time={time} width={520} x={-55} y={-220} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 8,
          fontFamily: "Neucha",
          fontSize: 35,
          color: "#f1e8dd",
        }}
      >
        ВЕК НЕТ.
      </div>
    </div>
  );
}
