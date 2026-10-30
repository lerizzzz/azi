import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  IllustratedActor as RigImpl,
  WholeDrawing,
  IntegratedTreatment,
  TeaDrawing,
  actorPoint,
  AssetGate,
} from "./IllustratedActor";
import {
  ShotContext,
  shotAt,
  EyeStrip,
  ComicInset,
  useComicShot,
} from "./ComicEdit";
import timing from "./timing.json";
const Rig = (p: React.ComponentProps<typeof RigImpl>) => {
  const shot = useComicShot();
  return (
    <RigImpl
      key={p.who}
      {...p}
      gaze={
        p.who === "azi" &&
        (p.mode === "notice" || shot.kind === "medium" || shot.kind === "eyes")
          ? "viewer"
          : "street"
      }
    />
  );
};
type P = {
  children?: React.ReactNode;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  w?: number;
  s?: number;
  r?: number;
  t?: number;
  beam?: boolean;
  court?: boolean;
  face?: string;
  smudge?: boolean;
  dark?: boolean;
  work?: boolean;
  open?: number;
  viewer?: boolean;
  onlyArm?: boolean;
  task?: "treat" | "push";
  tool?: "cotton" | "tweezers";
};
const C = "#f3e9dc",
  ink = "#100f18";
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
const image = (f: string, style: React.CSSProperties = {}) => (
  <Img src={staticFile(f)} style={{ position: "absolute", ...style }} />
);
function useHud(x: number, y: number) {
  const shot = useComicShot(),
    f = useCurrentFrame(),
    { fps } = useVideoConfig();
  const z =
    shot.zoom +
    (shot.kind === "medium" ? 0.015 * Math.min(f / fps - shot.from, 2) : 0);
  return {
    left: shot.focus[0] + (x - shot.focus[0]) / z,
    top: shot.focus[1] + (y - shot.focus[1]) / z,
    transform: `scale(${1 / z})`,
    transformOrigin: "0 0",
  };
}
const Text = ({
  children,
  x = 70,
  y = 140,
  size = 62,
  color = C,
  w = 900,
}: P) => {
  const hud = useHud(x, y);
  return (
    <div
      style={{
        position: "absolute",
        ...hud,
        width: w,
        fontSize: size,
        lineHeight: 1.06,
        color,
        fontFamily: "Neucha",
        textShadow: "2px 3px 0 #100f18",
      }}
    >
      {children}
    </div>
  );
};
const Tag = ({ children, x = 60, y = 140, w = 880, size = 54 }: P) => {
  const hud = useHud(x, y);
  return (
    <div
      style={{
        position: "absolute",
        ...hud,
        width: w,
        boxSizing: "border-box",
        padding: "22px 30px",
        background: C,
        border: "5px solid #11101a",
        boxShadow: "9px 10px 0 #11101a",
        color: ink,
        fontSize: size,
        lineHeight: 1.1,
        fontFamily: "Neucha",
        transform: `${hud.transform} rotate(-1.4deg)`,
      }}
    >
      {children}
    </div>
  );
};
const Bubble = ({ children, x = 80, y = 350, w = 650, size = 55 }: P) => {
  const hud = useHud(x, y);
  return (
    <div
      style={{
        position: "absolute",
        ...hud,
        width: w,
        boxSizing: "border-box",
        padding: "28px 36px",
        borderRadius: "46% 38% 40% 32% / 25% 36% 29% 30%",
        background: C,
        border: "6px solid #11101a",
        color: ink,
        fontSize: size,
        lineHeight: 1.04,
        fontFamily: "Neucha",
        boxShadow: "8px 10px 0 #11101a",
      }}
    >
      {children}
      <svg
        width="70"
        height="72"
        style={{ position: "absolute", bottom: -60, right: 60 }}
      >
        <path d="M4 0 L58 64 L48 0" fill={C} stroke={ink} strokeWidth="6" />
      </svg>
    </div>
  );
};
const Svg = ({ children }: P) => (
  <svg
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
  >
    {children}
  </svg>
);
const UFO = ({ x = 540, y = 350, s = 1, t = 0, beam = false }: P) => (
  <>
    <Svg>
      {beam && (
        <path
          d={`M${x - 80 * s} ${y + 45 * s} L${x - 360 * s} 1810 L${x + 360 * s} 1810 L${x + 80 * s} ${y + 45 * s}Z`}
          fill="#c3f4c2"
          opacity={0.18 + 0.035 * Math.sin(t * 4)}
        />
      )}
    </Svg>
    {image("props/ufo.png", {
      left: x - 300 * s,
      top: y - 140 * s + Math.sin(t * 1.6) * 12,
      width: 600 * s,
      transform: `rotate(${Math.sin(t) * 3}deg)`,
    })}
  </>
);
const Street = ({ t = 0, court = false }: P) => (
  <>
    {image(`world/${court ? "courtyard-clean" : "kazan-clean"}.png`, {
      width: 1080,
      height: 1920,
      objectFit: "cover",
      filter: "brightness(.63) saturate(.65)",
      transform: `scale(1.055) translateX(${Math.sin(t * 0.2) * 9}px)`,
    })}
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(0deg,rgba(16,16,28,.25),transparent 70%,rgba(20,27,48,.4))",
      }}
    />
    <Svg>
      <path
        d="M0 1790 L1080 1690"
        stroke="#9b8c9e"
        strokeWidth="4"
        opacity=".35"
      />
    </Svg>
  </>
);
const Head = ({
  t = 0,
  x = 180,
  y = 650,
  s = 1.2,
  face = "neutral",
  smudge = false,
}: P) =>
  smudge ? (
    <WholeDrawing
      name="azi-smudge"
      time={t}
      width={700 * s}
      height={(700 * s * 1671) / 941}
      kind={0}
      style={{ left: x, top: y }}
    />
  ) : (
    <svg
      viewBox="285 0 330 700"
      width={600 * s}
      height={(600 * s * 700) / 330}
      style={{ position: "absolute", left: x, top: y, overflow: "hidden" }}
    >
      <image
        href={staticFile(
          face === "blink" ? "v05/azi-blink.png" : "v05/azi-bare.png",
        )}
        width="941"
        height="1672"
      />
    </svg>
  );
const Phone = ({ x = 700, y = 1000, s = 1, r = 0 }: P) =>
  image("props/phone.png", {
    left: x,
    top: y,
    width: 90 * s,
    transform: `rotate(${r}deg)`,
  });
const Studio = ({ dark = false }: P) => (
  <>
    {image(dark ? "v04/studio-dark.png" : "v04/studio-light.png", {
      inset: 0,
      width: 1080,
      height: 1920,
      objectFit: "cover",
    })}
  </>
);
const Door = ({ open = 0 }: P) => (
  <Svg>
    <rect width="1080" height="1920" fill="#c1c7cf" />
    <path d="M0 0 H1080 V420 H0Z" fill="#e4e8eb" />
    <path d="M0 1500 L1080 1430 V1920 H0Z" fill="#9e9fa9" />
    {[70, 1010].map((x) => (
      <rect key={x} x={x} y="480" width="20" height="1050" fill="#f3f0e5" />
    ))}
    <rect
      x="210"
      y="530"
      width="650"
      height="1010"
      fill="#e6c49c"
      stroke="#17131f"
      strokeWidth="15"
    />
    <path
      d={`M${210 + open * 420} 535 L860 535 L860 1535 L${210 + open * 420} ${1535 - open * 120}Z`}
      fill="#35414c"
      stroke="#10131c"
      strokeWidth="10"
    />
    <circle cx={770 + open * 20} cy="1050" r="15" fill="#a4adb7" />
    <path
      d={`M${760 + open * 20} 1110 V1250`}
      stroke="#cad2d7"
      strokeWidth="15"
    />
  </Svg>
);
function releasedPhone(dt: number) {
  const k = 2.2;
  const bodyLift = ease((k - 1) / 2.4);
  const p = actorPoint(
    "man-film",
    { x: 540, y: 1330 - bodyLift * 950, scale: 0.82 },
    664,
    120,
  );
  return { x: p.x - 20 + 35 * dt, y: p.y - 40 + 450 * dt * dt };
}
function Scene({
  n,
  t,
  cues,
}: {
  n: number;
  t: number;
  d?: number;
  cues: typeof timing.cues;
}) {
  const q = (i: number) => (cues[i] ? cues[i].start : 0);
  const a = (i: number) => t - q(i);
  if (n === 1)
    return (
      <>
        <Street t={t} />
        <UFO
          t={t}
          x={580 + Math.sin(t * 0.4) * 100}
          y={400 - ease(t / 2) * 70}
          s={0.9}
        />
        {t < q(2) ? (
          <>
            <Rig
              who="man"
              time={t}
              x={810}
              y={1370}
              scale={0.65}
              phone
              filming={1}
              selfie={0}
            />
            <Rig
              who="man"
              time={t + 0.8}
              x={160}
              y={1530}
              scale={0.4}
              phone
              filming={1}
              selfie={0}
            />
            <Rig
              who="azi"
              time={t}
              x={460}
              y={1340}
              scale={0.83}
              phone
              mode={t > q(1) ? "notice" : "read"}
              progress={ease(a(1))}
            />
          </>
        ) : (
          <>
            <Rig
              who="azi"
              time={t}
              x={540}
              y={1920}
              scale={1.65}
              phone
              mode="quip"
              progress={ease(a(2))}
            />
            <Bubble x={90} y={315} w={640}>
              Свиданьице.
            </Bubble>
          </>
        )}
        <Tag size={52} y={90}>
          ЧТО ДЕЛАТЬ, ЕСЛИ В ПИТЕРЕ
          <br />
          ВТОРЖЕНИЕ ПРИШЕЛЬЦЕВ
        </Tag>
        {t < q(1) && (
          <Text y={1710} size={45}>
            НЕВСКИЙ • ВЕЧЕР
          </Text>
        )}
      </>
    );
  if (n === 2) {
    const map = t < q(2);
    const chat = t >= q(4);
    const lift = ease((a(2) - 1.0) / 2.4);
    return (
      <>
        {map ? (
          <>
            <Svg>
              <rect width="1080" height="1920" fill="#252a38" />
              <path
                d="M-100 430 Q400 200 1180 620"
                stroke="#506b82"
                strokeWidth="145"
                fill="none"
              />
              <path
                d="M-80 900 L1150 600 M-80 1150 L1150 850 M100 1920 L800 420 M640 1920 L1020 750"
                stroke="#161a25"
                strokeWidth="90"
                fill="none"
              />
              <path
                d="M100 1700 L720 730"
                stroke="#a72d46"
                strokeWidth="16"
                strokeDasharray="28 18"
              />
              <circle
                cx="620"
                cy="890"
                r={40 + Math.sin(t * 4) * 6}
                fill="#d2ebc1"
              />
            </Svg>
            <Tag y={130}>ЦЕНТР ПЕТЕРБУРГА</Tag>
            <Text x={120} y={710} size={70}>
              НЕВСКИЙ
            </Text>
            <Text x={340} y={1130} size={64}>
              РУБИНШТЕЙНА
            </Text>
            <UFO t={t} x={620} y={820} s={0.56} />
          </>
        ) : (
          <>
            <Street court t={t} />
            <UFO x={550} y={340} t={t} s={0.92} beam />
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: "inset(420px 0 0 0)",
              }}
            >
              <Rig
                who="man"
                time={t}
                x={540}
                y={1330 - lift * 950 - ease((a(2) - 3.4) / 1) * 1100}
                scale={0.82}
                lift={a(2) > 0.7 ? Math.max(0.03, ease((a(2) - 1) / 2.4)) : 0}
                filming={1}
                selfie={0}
                phone={a(2) < 2.2}
              />
            </div>
            <UFO x={550} y={340} t={t} s={0.92} />
            {a(2) >= 2.2 && a(2) < 4 && (
              <Phone
                x={releasedPhone(a(2) - 2.2).x}
                y={releasedPhone(a(2) - 2.2).y}
                s={0.7}
                r={(a(2) - 2.2) * 65}
              />
            )}
            <Tag y={110} size={56}>
              {t < q(3) ? "«Давай на неделе»" : "Никто не заметил."}
            </Tag>
            {chat && (
              <div
                style={{
                  position: "absolute",
                  inset: "470px 85px 280px",
                  background: "#171923",
                  border: "8px solid #0a0b12",
                  borderRadius: 55,
                  padding: 45,
                }}
              >
                <Text x={35} y={45} size={47}>
                  БЫЛ В СЕТИ ДАВНО
                </Text>
                <div
                  style={{
                    marginTop: 160,
                    background: "#e6e1d7",
                    padding: 35,
                    borderRadius: 30,
                    color: ink,
                    fontSize: 59,
                    lineHeight: 1.22,
                  }}
                >
                  Малыш, я бы вернулся, но я на корабле, тут нет связи
                </div>
                <Text x={70} y={850} size={36}>
                  ✓ отправлено из космоса
                </Text>
              </div>
            )}
          </>
        )}
      </>
    );
  }
  if (n === 3) {
    const walkT = Math.max(0, t - (q(5) - 0.5));
    return (
      <>
        <Street court t={t} />
        {t < q(1) ? (
          <>
            <Rig
              who="azi"
              time={t}
              x={550}
              y={1270}
              scale={0.9}
              phone={false}
              shoes={t > 1.8}
              barefoot={t > 1.8}
              action={t < 1.8 ? "reach" : "idle"}
            />
            <Tag>Снимаем каблучки, берём в ручки</Tag>
            {t > 2 && <Text y={1680}>И БЕЖИМ К ДЕВОЧКАМ</Text>}
          </>
        ) : (
          <>
            <Rig who="alien" time={t} x={550} y={1310} scale={0.73} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: "none",
                }}
              >
                <Rig
                  who="man"
                  time={t + i}
                  x={i === 0 ? 130 : i === 1 ? 920 : 320}
                  y={i === 2 ? 1430 : 1340}
                  scale={i === 2 ? 0.66 : 0.62}
                  phone={false}
                  filming={0}
                  selfie={0}
                  talk={0.6}
                />
              </div>
            ))}

            {t > q(5) - 0.5 && (
              <Rig
                who="azi"
                time={walkT}
                x={-160 + walkT * 416.666 * 0.7}
                y={1440}
                scale={0.7}
                phone={false}
                shoes
                barefoot
                walking
                action="run"
              />
            )}
            <Bubble x={70} y={350} w={600} size={51}>
              {t < q(4)
                ? "Экскурсию? По рекам и каналам!"
                : "Для вас — скидка!"}
            </Bubble>
          </>
        )}
      </>
    );
  }
  if (n === 4) {
    const move = t > q(2),
      dt = Math.max(0, a(2));
    return (
      <>
        <Street court t={t} />
        <Rig who="alien" time={t} x={810} y={1340} scale={0.72} />
        {(!move || dt < 3.2) && (
          <Rig
            who="azi"
            time={dt}
            x={move ? 320 + dt * 416.666 * 0.8 : 380}
            y={1360}
            scale={0.8}
            phone={false}
            shoes
            barefoot
            gesture={move || t < 2.6 ? undefined : "ear"}
            walking={move}
            action={move ? "run" : "idle"}
          />
        )}
        <Svg>
          <path
            d="M1000 530 L1080 530 V1920 H1000 V1100 Q870 970 890 760Z"
            fill="#1e1a27"
            stroke="#090b13"
            strokeWidth="13"
          />
        </Svg>
        {t > q(0) + 2 && t < q(2) && (
          <Bubble x={60} y={330} w={700}>
            Секунду, у меня созвон.
          </Bubble>
        )}
        {move && (
          <>
            <Tag y={120} w={650}>
              ОН ТАК И СТОИТ.
            </Tag>
            <Text x={700} y={730} size={95}>
              …
            </Text>
          </>
        )}
      </>
    );
  }
  if (n === 5) {
    const blinkStart = q(1) + 1;
    const blink =
      (t > blinkStart && t < blinkStart + 0.15) ||
      (t > blinkStart + 0.48 && t < blinkStart + 0.64);
    const near = t >= q(1) && t < q(3);
    const enter = t > q(3) + 3;
    return (
      <>
        <Door open={enter ? ease((t - q(3) - 3) / 0.8) : 0} />
        <div
          style={{
            position: "absolute",
            left: 200,
            top: 340,
            width: 650,
            padding: "28px 0",
            background: ink,
            border: "4px solid #772d40",
            textAlign: "center",
            fontSize: 80,
            letterSpacing: 6,
          }}
        >
          AZI LASHES
        </div>
        {near ? (
          <>
            <Head
              t={t}
              x={40}
              y={650}
              s={1.65}
              face={blink ? "blink" : "neutral"}
            />
            <Tag y={1550} size={49}>
              {t < q(2) ? "КОДОВЫЙ ЖЕСТ: МОРГНИ ДВА РАЗА" : "У НИХ НЕТ ВЕК."}
            </Tag>
          </>
        ) : (
          <Rig
            who="azi"
            time={t}
            x={enter ? 540 + ease((t - q(3) - 3) / 1.1) * 500 : 500}
            y={1320}
            scale={0.85}
            phone={false}
            shoes
            barefoot
            gesture={t < q(3) + 1.3 ? "hair" : "kiss"}
            actionProgress={ease((a(3) - 1.3) / 1)}
          />
        )}
        {t > q(3) + 1.5 && t < q(3) + 3 && (
          <Text x={790} y={850} size={90} color="#aa304c">
            ♡
          </Text>
        )}
      </>
    );
  }
  if (n === 6)
    return (
      <>
        <Studio dark />
        {t < 7.7 ? (
          <WholeDrawing
            name="barricade"
            time={t}
            width={1000}
            height={(1000 * 1024) / 1536}
            kind={2}
            style={{ left: 160 - 120 * ease(a(1) / 1.7), top: 1040 }}
          />
        ) : (
          <Rig
            who="azi"
            time={t}
            x={450}
            y={1400}
            scale={0.69}
            phone={false}
            shoes
            barefoot
          />
        )}
        <Tag y={130}>
          {t < q(1)
            ? "ТИХО. ГОРИТ ОДНА ЛАМПА."
            : t < q(2)
              ? "ДЕВОЧКИ УЖЕ ВСЁ РЕШИЛИ."
              : "НАШИХ КРАСОТОЧЕК НЕ ЗАБЕРУТ."}
        </Tag>
      </>
    );
  if (n === 7) {
    const flash = t >= q(1) && t < q(3);
    return (
      <>
        {flash ? (
          <>
            <Street court t={t} />
            <Rig
              who="alien"
              time={t}
              x={870}
              y={1360 + Math.sin(t * 2) * 5}
              scale={0.63}
            />
            <Head t={t} x={30} y={670} s={1.35} smudge />
            <Tag y={100}>МИНУТОЙ РАНЬШЕ • НА УЛИЦЕ</Tag>
            {t > q(2) && (
              <Bubble x={640} y={500} w={330} size={47}>
                Своя.
              </Bubble>
            )}
          </>
        ) : (
          <>
            <Studio t={t} />
            <IntegratedTreatment time={t} x={-45} y={1000} width={1320} />
            {image("props/shoes.png", { left: 650, top: 1640, width: 140 })}
            <Tag y={130}>
              {t < q(1)
                ? "СРАЗУ — НА КУШЕТОЧКУ."
                : "НАРАЩИВАНИЕ НЕ РАЗМАЗЫВАЕТСЯ."}
            </Tag>
          </>
        )}
      </>
    );
  }
  return (
    <>
      <Studio t={t} />
      {t < q(3) ? (
        <>
          {t < q(2) + 3.5 ? (
            <TeaDrawing time={t} x={155} y={535} width={770} />
          ) : (
            <IntegratedTreatment time={t} x={-45} y={970} width={1320} />
          )}
          <Svg>
            <path
              d="M75 1700 H440 V1755 H75Z"
              fill="#5c353c"
              stroke={ink}
              strokeWidth="7"
            />
            <path
              d="M100 1755 V1900 M415 1755 V1900"
              stroke={ink}
              strokeWidth="14"
            />
            <g transform="translate(95 1660) rotate(-10 100 50)">
              <rect
                width="200"
                height="100"
                rx="12"
                fill="#11121c"
                stroke="#77717b"
                strokeWidth="4"
              />
              <rect
                x="10"
                y="9"
                width="180"
                height="78"
                rx="7"
                fill="#e0d8ca"
              />
              <path
                d="M92 27 L77 52 H95 L85 73 L113 44 H96 L106 27Z"
                fill="#8b3049"
              />
              <path
                d="M100 100 V130 Q150 210 225 165 L290 130"
                fill="none"
                stroke="#e2dace"
                strokeWidth="7"
              />
            </g>
          </Svg>
          <Tag y={130}>ТЫ В БЕЗОПАСНОСТИ.</Tag>
        </>
      ) : (
        <>
          <AbsoluteFill style={{ background: "#15131e" }} />
          <Svg>
            <path
              d="M0 450 L1080 230 V350 L0 570Z M0 1490 L1080 1290 V1410 L0 1610Z"
              fill="#8b243c"
            />
            <circle cx="870" cy="1070" r="370" fill="#312031" />
            <path
              d="M100 1260 Q540 1010 960 1260"
              fill="none"
              stroke="#b94a60"
              strokeWidth="9"
            />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path
                key={i}
                d={`M${190 + i * 105} ${1200 - Math.sin((i / 6) * Math.PI) * 110} l${-55 + i * 18} -90`}
                stroke="#b94a60"
                strokeWidth="9"
              />
            ))}
          </Svg>
          <Head
            t={t}
            x={330}
            viewer
            y={620}
            s={1.1}
            face={t % 4 > 3.8 ? "blink" : "neutral"}
          />
          <Text x={75} y={220} size={126}>
            AZI LASHES
          </Text>
          <Text x={85} y={380} size={47}>
            STUDIO • САНКТ-ПЕТЕРБУРГ
          </Text>
          <Tag y={1510} w={890} size={65}>
            Вторжение вторжением,
            <br />а ресничка сама себя
            <br />
            не нарастит.
          </Tag>
        </>
      )}
    </>
  );
}
export function Film() {
  const f = useCurrentFrame(),
    { fps } = useVideoConfig(),
    t = f / fps;
  const found = timing.scenes.findIndex((s) => t < s.end);
  const idx = found < 0 ? timing.scenes.length - 1 : found;
  const s = timing.scenes[idx];
  const q = timing.cues
    .filter((c) => c.scene === s.scene)
    .map((c) => ({ ...c, start: c.start - s.start, end: c.end - s.start }));
  const lt = t - s.start;
  const shot = shotAt(t);
  const age = t - shot.from;
  const cameraScale =
    shot.zoom + (shot.kind === "medium" ? 0.015 * Math.min(age, 2) : 0);
  return (
    <AbsoluteFill
      style={{
        background: ink,
        color: C,
        overflow: "hidden",
        fontFamily: "Neucha",
      }}
    >
      <AssetGate />
      <style>{`@font-face{font-family:Neucha;src:url('${staticFile("fonts/Neucha.ttf")}')}`}</style>
      <ShotContext.Provider value={shot}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${shot.focus[0]}px ${shot.focus[1]}px`,
            transform: `scale(${cameraScale})`,
          }}
        >
          <Scene n={s.scene} t={lt} d={s.end - s.start} cues={q} />
        </div>
        <EyeStrip shot={shot} time={t} />
        <ComicInset shot={shot} time={t} />
      </ShotContext.Provider>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center,transparent 56%,rgba(6,5,12,.24))",
          boxShadow: "inset 0 0 0 15px #100f18",
        }}
      />
    </AbsoluteFill>
  );
}
