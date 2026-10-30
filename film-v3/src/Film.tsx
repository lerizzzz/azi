import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SeamlessRig as RigImpl, Face, actorPose } from "./SeamlessRig";
import {
  ShotContext,
  shotAt,
  EyeStrip,
  ComicTransition,
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
  viewer = false,
}: P) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 600 * s,
      height: 640 * s,
      transform: `rotate(${Math.sin(t * 1.4) * 1.2}deg)`,
    }}
  >
    <svg viewBox="0 0 554 588" width={600 * s} height={(600 * s * 588) / 554}>
      <Face
        who="azi"
        time={t}
        state={face}
        viewer={viewer}
        x={0}
        y={0}
        width={554}
      />
      {smudge && (
        <g fill="#17111c" opacity=".86">
          <path d="M173 316 Q190 311 213 310 Q215 333 205 349 C191 365 199 382 189 398 C176 385 185 369 174 359 Q165 345 173 316Z" />
          <path d="M329 278 Q348 271 368 266 Q371 293 364 318 C353 340 361 360 352 378 C338 363 345 345 337 332 Q328 312 329 278Z" />
        </g>
      )}
    </svg>
  </div>
);
const Phone = ({ x = 700, y = 1000, s = 1, r = 0 }: P) =>
  image("props/phone.png", {
    left: x,
    top: y,
    width: 90 * s,
    transform: `rotate(${r}deg)`,
  });
const Bed = ({ x = 130, y = 1240, s = 1, r = 0 }: P) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `scale(${s}) rotate(${r}deg)`,
      transformOrigin: "0 0",
    }}
  >
    <svg width="960" height="560" viewBox="-30 -100 990 660">
      <ellipse
        cx="480"
        cy="438"
        rx="450"
        ry="54"
        fill="#100e19"
        opacity=".22"
      />
      <path
        d="M95 92 L67 376 L101 383 L133 118 M785 300 L792 481 L827 481 L827 287 M858 210 L890 389"
        fill="#201b28"
        stroke="#0c0b12"
        strokeWidth="9"
      />
      <path
        d="M45 -34 L921 205 L858 354 L-5 108Z"
        fill="#18141f"
        stroke="#100d16"
        strokeWidth="10"
      />
      <path
        d="M50 -62 L930 177 Q951 189 932 220 L866 321 Q858 337 833 328 L-8 88 Q-26 80 -13 52 L28 -47Q34 -65 50 -62Z"
        fill="#29222f"
        stroke="#100d17"
        strokeWidth="9"
      />
      <path d="M52 -37 L896 193 L842 300 L17 67Z" fill="#342c3a" />
      <path
        d="M75 -12 L224 28 L193 105 L35 64Z"
        fill="#443747"
        stroke="#110e18"
        strokeWidth="6"
      />
      <path
        d="M245 40 L852 205 M25 88 L851 321"
        stroke="#6b5767"
        strokeWidth="3"
        opacity=".6"
      />
    </svg>
  </div>
);
const Studio = ({ dark = false }: P) => (
  <>
    {image(dark ? "v04/studio-dark.png" : "v04/studio-light.png", {
      inset: 0,
      width: 1080,
      height: 1920,
      objectFit: "cover",
    })}
    <Svg>
      <path
        d="M865 1660 Q745 1460 790 1190 Q812 1090 962 1080"
        stroke="#100e17"
        strokeWidth="13"
        fill="none"
      />
      <path
        d="M852 1093 Q900 1050 973 1080"
        stroke={dark ? "#48404b" : "#f2eee3"}
        strokeWidth="17"
        fill="none"
      />
    </Svg>
  </>
);
const Master = ({
  t = 0,
  x = 720,
  y = 930,
  s = 0.9,
  work = false,
  task,
  onlyArm = false,
  tool,
}: P) => (
  <RigImpl
    who="master"
    time={work ? t : 0}
    x={x + 120 * s}
    y={y + 500 * s}
    scale={s}
    phone={false}
    task={work ? (task ?? "push") : undefined}
    onlyArm={onlyArm}
    tool={tool}
  />
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
  const armLift = ease((k - 1.4) / 2.2);
  const wrist = actorPose({ who: "man", time: k, lift: armLift, phone: true })
    .wrists.left;
  return {
    x: 540 + wrist.x * 0.82 - 25 + 35 * dt,
    y: 1330 - bodyLift * 950 + wrist.y * 0.82 - 42 + 450 * dt * dt,
  };
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
            <Bubble x={90} y={450} w={640}>
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
                lift={ease((a(2) - 1.4) / 2.2)}
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
              y={1450}
              scale={0.95}
              phone={false}
              shoes={t > 1.8}
              barefoot={t > 1.8}
              action="idle"
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
                  filter: i === 2 ? "hue-rotate(18deg)" : "none",
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
            <Svg>
              <g
                transform={`translate(${350 + Math.sin(t * 4) * 15} 1010) rotate(-12)`}
              >
                <path
                  d="M0 0 L230 20 L220 330 L0 290Z"
                  fill="#e6c855"
                  stroke={ink}
                  strokeWidth="7"
                />
                <text x="20" y="95" fontFamily="Neucha" fontSize="42">
                  РЕКИ
                </text>
                <text x="15" y="160" fontFamily="Neucha" fontSize="40">
                  КАНАЛЫ
                </text>
                <text x="25" y="240" fontFamily="Neucha" fontSize="55">
                  −50%
                </text>
              </g>
            </Svg>
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
        <Studio t={t} dark />
        <Rig
          who="azi"
          time={t}
          x={220}
          y={1340}
          scale={0.63}
          phone={false}
          barefoot
        />
        <Bed x={210 + ease(a(1) / 2) * 250} y={1320} s={0.85} r={-12} />
        <Master t={t} x={680} y={1010} s={0.72} work />
        <Master t={t + 1} x={60} y={1170} s={0.55} work />
        {image("props/shoes.png", { left: 60, top: 1680, width: 140 })}
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
            <Master t={t} x={220} y={1090} s={0.62} work task="treat" />
            <Bed y={1280} x={40} s={1} />
            <Rig
              who="azi"
              time={t}
              x={530}
              y={1435}
              scale={0.57}
              rotation={-72}
              phone={false}
              barefoot
              face={t > q(3) + 0.8 ? "blink" : "neutral"}
            />
            <Master
              t={t}
              x={220}
              y={1090}
              s={0.62}
              work
              task="treat"
              onlyArm
              tool={
                t >= q(3) ? (a(3) < 0.8 ? "cotton" : "tweezers") : undefined
              }
            />
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
          <Bed x={90} y={1250} />
          <Rig
            who="azi"
            time={t}
            x={380 + 150 * ease((a(2) - 3) / 1.2)}
            y={1320 + 115 * ease((a(2) - 3) / 1.2)}
            scale={0.87 - 0.3 * ease((a(2) - 3) / 1.2)}
            rotation={-72 * ease((a(2) - 3) / 1.2)}
            cup={a(2) > 1 && a(2) < 3}
            phone={false}
            barefoot
            mode="quip"
            progress={1}
          />
          <Master t={t} x={760} y={980} s={0.65} />
          <Svg>
            <path
              d="M80 1590 H1000 V1650 H80Z"
              fill="#5c353c"
              stroke={ink}
              strokeWidth="8"
            />
            <path
              d="M120 1650 V1820 M950 1650 V1820"
              stroke={ink}
              strokeWidth="20"
            />
            <g opacity={a(2) > 1 && a(2) < 3 ? 0 : 1}>
              {" "}
              <path
                d="M690 1530 L700 1410 H820 L815 1530Z"
                fill="#ebe5d7"
                stroke={ink}
                strokeWidth="8"
              />
              <path
                d="M820 1430 Q890 1430 870 1500 L820 1500"
                fill="none"
                stroke={ink}
                strokeWidth="12"
              />
              <path
                d="M730 1400 Q700 1360 735 1320 M775 1390 Q750 1350 785 1310"
                fill="none"
                stroke="#f4e7d2"
                strokeWidth="7"
                opacity={0.5 + 0.25 * Math.sin(t * 3)}
              />
            </g>{" "}
            <path
              d="M410 1620 Q480 1720 610 1620"
              fill="none"
              stroke="#ded9cb"
              strokeWidth="8"
            />
          </Svg>
          <Phone x={300} y={1505} s={0.85} r={80} />
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
      <ComicTransition time={t} shot={shot} />
    </AbsoluteFill>
  );
}
