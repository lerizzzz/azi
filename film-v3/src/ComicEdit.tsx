import { createContext, useContext } from "react";
import { Face } from "./SeamlessRig";
import timing from "./timing.json";
export type Shot = {
  scene: number;
  from: number;
  to: number;
  kind: "wide" | "medium" | "eyes" | "detail" | "split" | "brand";
  focus: [number, number];
  zoom: number;
  eyeWho?: "azi" | "alien" | "man";
  note: string;
};
const plans: {
  cuts: number[];
  kinds: Shot["kind"][];
  focus: [number, number][];
  notes: string[];
  eyes?: Record<number, "azi" | "alien" | "man">;
}[] = [
  {
    cuts: [0, 2.3, 4.5, 6.7],
    kinds: ["wide", "detail", "medium", "eyes"],
    focus: [
      [540, 900],
      [900, 1050],
      [530, 1100],
      [540, 1000],
    ],
    notes: [
      "НЛО над Невским",
      "Прохожий снимает",
      "Ази замечает вторжение",
      "Ирония: свиданьице",
    ],
    eyes: { 3: "azi" },
  },
  {
    cuts: [0, 2, 4.4, 6.8, 9.1, 11.9],
    kinds: ["wide", "detail", "medium", "detail", "wide", "split"],
    focus: [
      [540, 960],
      [620, 900],
      [540, 1050],
      [860, 740],
      [540, 1000],
      [540, 1080],
    ],
    notes: [
      "Карта центра",
      "Корабль над Рубинштейна",
      "Сначала поднимается корпус",
      "Кисть отпускает телефон",
      "Последнее сообщение",
      "Чат: нет связи",
    ],
  },
  {
    cuts: [0, 2.2, 4.5, 6.7, 9, 11.3, 13.5],
    kinds: ["detail", "medium", "wide", "medium", "detail", "eyes", "wide"],
    focus: [
      [530, 1600],
      [500, 1300],
      [540, 1100],
      [570, 1100],
      [470, 1220],
      [540, 1000],
      [540, 1200],
    ],
    notes: [
      "Каблуки: снять",
      "Обувь в руке, стопы босые",
      "Три зазывалы блокируют пришельца",
      "Реакция пришельца",
      "Флаер со скидкой",
      "Пришелец не знает, что ответить",
      "Ази проходит мимо",
    ],
    eyes: { 5: "alien" },
  },
  {
    cuts: [0, 2.6, 5.2, 7.8, 10.3],
    kinds: ["medium", "detail", "wide", "eyes", "wide"],
    focus: [
      [590, 1200],
      [510, 1050],
      [540, 1000],
      [810, 980],
      [650, 1170],
    ],
    notes: [
      "Пришелец подошёл",
      "Наушник действительно у уха",
      "Секунду, у меня созвон",
      "Вежливое ожидание без моргания",
      "Ази исчезает за аркой",
    ],
    eyes: { 3: "alien" },
  },
  {
    cuts: [0, 2.3, 4.8, 7.2],
    kinds: ["wide", "eyes", "split", "medium"],
    focus: [
      [540, 960],
      [540, 950],
      [540, 1000],
      [550, 1160],
    ],
    notes: [
      "Первое раскрытие AZI LASHES",
      "Два настоящих моргания",
      "У пришельцев нет век",
      "Волосы, поцелуй, вход",
    ],
    eyes: { 1: "azi" },
  },
  {
    cuts: [0, 2.5, 5.1, 7.7],
    kinds: ["wide", "medium", "detail", "medium"],
    focus: [
      [540, 1050],
      [670, 1280],
      [460, 860],
      [230, 1240],
    ],
    notes: [
      "Студия, закрытые шторы, одна лампа",
      "Мастера ставят кушетки после входа",
      "Снаружи студия выглядит закрытой",
      "Ази наконец выдыхает",
    ],
  },
  {
    cuts: [0, 2.2, 4.5, 6.7, 8.9],
    kinds: ["wide", "medium", "detail", "eyes", "detail"],
    focus: [
      [500, 1270],
      [430, 1020],
      [380, 1130],
      [800, 1000],
      [300, 1210],
    ],
    notes: [
      "Ложимся на кушетку",
      "Явно обозначенный флешбэк",
      "Тушь именно под глазами",
      "Пришелец кивает своей",
      "Вернулись к мастеру: очистка и пинцет",
    ],
    eyes: { 3: "alien" },
  },
  {
    cuts: [0, 2.6, 4.6, 6.9, 9.6],
    kinds: ["medium", "detail", "medium", "brand", "eyes"],
    focus: [
      [430, 1140],
      [390, 1560],
      [490, 1220],
      [540, 960],
      [540, 950],
    ],
    notes: [
      "Ты в безопасности",
      "Телефон подключён к зарядке",
      "Чашка в руке",
      "Кушетка и брендовый финал",
      "Последний взгляд зрителю",
    ],
    eyes: { 4: "azi" },
  },
];
export const shots: Shot[] = plans.flatMap((p, i) =>
  p.cuts.map((from, j) => ({
    scene: i + 1,
    from: timing.scenes[i].start + from,
    to:
      timing.scenes[i].start +
      (p.cuts[j + 1] ??
        (i === 7 ? timing.duration : timing.scenes[i].end) -
          timing.scenes[i].start),
    kind: p.kinds[j],
    focus: p.focus[j],
    zoom: p.kinds[j] === "detail" ? 1.32 : p.kinds[j] === "medium" ? 1.12 : 1,
    eyeWho: p.eyes?.[j],
    note: p.notes[j],
  })),
);
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
          state={shot.scene === 1 ? "irritated" : "neutral"}
        />
      </svg>
    </div>
  );
}
export function ComicTransition({ time, shot }: { time: number; shot: Shot }) {
  const elapsed = time - shot.from;
  if (shot.from === 0 || elapsed > 0.16) return null;
  const p = Math.max(0, Math.min(1, elapsed / 0.16));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transform: `translateX(${(p * 2 - 1) * 1300}px) skewX(-14deg)`,
        background: shot.kind === "eyes" ? "#a32d46" : "#eee5d7",
        borderLeft: "18px solid #130e1b",
        borderRight: "18px solid #130e1b",
      }}
    />
  );
}

export function ComicInset({ shot, time }: { shot: Shot; time: number }) {
  if (shot.kind !== "split") return null;
  if (shot.scene === 2)
    return (
      <svg
        viewBox="0 0 1080 1920"
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1920,
          pointerEvents: "none",
        }}
      >
        <path d="M28 430 L1050 445" stroke="#eee5d7" strokeWidth="12" />
        <path d="M28 445 L1050 460" stroke="#120e19" strokeWidth="5" />
      </svg>
    );
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
