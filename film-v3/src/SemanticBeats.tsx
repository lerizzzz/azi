import beats from "./beats-v06.json";
import type { Shot } from "./ComicEdit";

const cream = "#f2e8d9",
  red = "#b33856",
  green = "#b8decb",
  ink = "#17121e";
function Heart({ broken = false }: { broken?: boolean }) {
  return (
    <>
      <path
        d="M90 146 C35 111 9 72 30 44 Q55 17 90 53 Q124 17 151 44 C174 73 145 112 90 146Z"
        fill={red}
      />
      {broken && (
        <path
          d="M95 43 L79 76 L104 92 L82 122 L94 145"
          stroke={ink}
          strokeWidth="12"
        />
      )}
    </>
  );
}
function Rays({ time }: { time: number }) {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i * Math.PI * 2) / 9 + time * 0.2;
        return (
          <path
            key={i}
            d={`M${90 + Math.cos(a) * 49} ${90 + Math.sin(a) * 49} L${90 + Math.cos(a) * 76} ${90 + Math.sin(a) * 76}`}
          />
        );
      })}
    </>
  );
}
export function MeaningIcon({ kind, age }: { kind: string; age: number }) {
  switch (kind) {
    case "heart":
      return <Heart />;
    case "broken-heart":
      return <Heart broken />;
    case "cat":
      return (
        <>
          <path
            d="M34 68 L22 18 L66 43 Q91 31 116 43 L158 18 L148 73 Q171 133 112 148 Q41 165 29 117Z"
            fill="#302333"
          />
          <path d="M49 87 Q61 76 73 87 M107 87 Q122 76 134 87 M81 108 L98 108 L90 119Z M90 119 Q76 137 65 123 M90 119 Q104 137 119 122 M26 103 L4 96 M29 118 L4 121 M153 103 L176 96 M152 118 L176 122" />
        </>
      );
    case "sparkle":
      return (
        <>
          <path
            d="M90 20 Q95 79 153 90 Q96 94 90 155 Q84 96 25 90 Q83 84 90 20Z"
            fill={cream}
          />
          <path d="M146 18 V47 M131 32 H162" />
        </>
      );
    case "shock":
      return (
        <>
          <path
            d="M28 130 L50 54 M88 103 L93 14 M131 126 L162 62"
            stroke={red}
            strokeWidth="13"
          />
          <circle cx="22" cy="151" r="6" fill={red} stroke="none" />
          <circle cx="86" cy="126" r="6" fill={red} stroke="none" />
          <circle cx="122" cy="147" r="6" fill={red} stroke="none" />
        </>
      );
    case "anger":
      return (
        <>
          <path
            d="M38 26 Q84 34 79 74 M147 31 Q101 34 105 75 M43 151 Q81 145 79 105 M146 150 Q106 143 105 104"
            stroke={red}
            strokeWidth="15"
          />
        </>
      );
    case "pin":
      return (
        <>
          <path
            d="M90 159 Q12 81 46 39 Q86 -1 133 38 Q172 82 90 159Z"
            fill={red}
          />
          <circle cx="90" cy="65" r="20" fill={ink} />
          <ellipse cx="90" cy="161" rx="53" ry="9" fill="none" />
        </>
      );
    case "moon":
      return (
        <>
          <path
            d="M129 26 Q59 58 118 129 Q66 157 34 107 Q1 45 66 18 Q95 9 129 26Z"
            fill={cream}
          />
          <path d="M145 60 V90 M131 75 H160" />
        </>
      );
    case "calendar":
      return (
        <>
          <path d="M29 41 L156 34 L162 159 L35 165Z" fill="#cfc0b7" />
          <rect x="21" y="32" width="133" height="124" rx="8" fill={cream} />
          <path
            d="M21 65 H155 M48 19 V45 M125 17 V43"
            stroke={red}
            strokeWidth="13"
          />
          <path
            d="M44 85 H66 M80 85 H102 M117 85 H136 M44 111 H66 M80 111 H102 M117 111 H136 M44 136 H66 M80 136 H102"
            stroke={ink}
          />
          <path
            d="M75 96 L109 140 M111 97 L76 140"
            stroke={red}
            strokeWidth="10"
          />
        </>
      );
    case "no-signal":
      return (
        <>
          <path
            d="M30 143 V123 M63 143 V99 M96 143 V71 M130 143 V42"
            strokeWidth="18"
            opacity={Math.max(0.15, 1 - age * 1.8)}
          />
          <path d="M27 38 L150 155" stroke={red} strokeWidth="13" />
          <path d="M15 161 H164" />
        </>
      );
    case "boat":
      return (
        <>
          <path d="M22 99 H158 L129 135 H57Z" fill={red} />
          <path
            d="M89 28 V99 M85 32 L40 86 H84Z M99 44 L132 86 H99Z"
            fill={cream}
          />
          <path
            d="M8 151 Q27 134 48 151 T90 151 T132 151 T175 151"
            stroke={green}
          />
        </>
      );
    case "waves":
      return (
        <>
          {[55, 90, 125].map((y) => (
            <path
              key={y}
              d={`M8 ${y} Q29 ${y - 20} 50 ${y} T92 ${y} T134 ${y} T176 ${y}`}
              stroke={green}
            />
          ))}
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="90" cy="90" r="65" fill="#27212f" />
          <g transform={`rotate(${age * 360} 90 90)`}>
            <path d="M90 42 V90 L126 110" stroke={red} strokeWidth="10" />
          </g>
          <path d="M90 20 V32 M90 148 V160 M20 90 H32 M148 90 H160" />
        </>
      );
    case "call":
      return (
        <>
          <path
            d="M46 45 Q24 71 60 111 Q102 158 133 129 L111 101 L91 118 Q62 95 62 77 L76 61Z"
            fill={green}
          />
          <path
            d="M102 22 Q153 28 160 78 M106 45 Q131 50 136 77"
            stroke={green}
          />
        </>
      );
    case "stop":
      return (
        <>
          <path
            d="M59 18 H120 L162 59 V121 L120 162 H58 L17 121 V59Z"
            fill={red}
          />
          <path d="M48 90 H131" stroke={cream} strokeWidth="19" />
        </>
      );
    case "shield":
      return (
        <>
          <path
            d="M26 35 Q89 43 90 17 Q110 44 155 35 L148 105 Q132 146 90 167 Q42 147 31 105Z"
            fill="#213c35"
            stroke={green}
          />
          <path d="M54 90 L79 115 L129 64" stroke={green} strokeWidth="13" />
        </>
      );
    case "battery":
      return (
        <>
          <rect x="18" y="52" width="136" height="80" rx="9" fill="#211c29" />
          <path d="M157 75 H170 V110 H157" />
          <rect
            x="29"
            y="65"
            width={115 * Math.min(1, 0.25 + age)}
            height="54"
            fill={green}
            stroke="none"
          />
          <path
            d="M95 60 L70 96 H91 L76 128 L116 86 H95 L110 60Z"
            fill={red}
            stroke={ink}
            strokeWidth="3"
          />
        </>
      );
    case "steam":
      return (
        <>
          {[48, 90, 132].map((x, i) => (
            <path
              key={x}
              d={`M${x} 151 Q${x - 20 + Math.sin(age * 8 + i) * 7} 122 ${x} 93 T${x} 28`}
              opacity={0.6 + 0.3 * Math.sin(age * 6 + i)}
            />
          ))}
        </>
      );
    case "mascara":
      return (
        <>
          <g transform="rotate(-27 90 90)">
            <path d="M77 87 H105 V163 H77Z" fill={red} />
            <path
              d="M90 89 V25 M74 30 H106 M73 42 H107 M72 54 H108 M74 67 H106"
              strokeWidth="10"
            />
          </g>
          <path d="M140 103 Q115 141 141 152 Q170 141 140 103Z" fill={ink} />
        </>
      );
    case "lash":
      return (
        <>
          <path d="M18 126 Q89 57 163 126" stroke={red} strokeWidth="11" />
          <path
            d="M30 113 L12 76 M54 94 L39 51 M82 83 L78 38 M110 89 L121 43 M140 104 L162 66"
            stroke={red}
            strokeWidth="9"
          />
        </>
      );
    case "tear":
    case "sweat":
      return (
        <>
          <path
            d="M87 14 C73 48 24 94 43 132 Q85 187 131 134 C153 102 118 68 87 14Z"
            fill="#9ec7cd"
          />
          <path d="M62 99 Q49 126 78 139" stroke={cream} />
        </>
      );
    case "two-dots":
      return (
        <>
          <path
            d="M39 61 Q69 29 79 78 Q81 103 64 124 L68 151 L47 128 Q12 122 20 92Z M118 59 Q148 28 161 74 Q172 109 146 129 L141 155 L129 131 Q98 122 101 88Z"
            fill={ink}
          />
        </>
      );
    case "planet":
      return (
        <>
          <ellipse
            cx="90"
            cy="90"
            rx="77"
            ry="23"
            transform="rotate(-30 90 90)"
            stroke={red}
          />
          <circle cx="90" cy="90" r="45" fill="#78937d" />
          <path d="M42 117 Q93 114 140 65" stroke={red} />
          <path d="M70 66 L83 56 M100 114 L115 106" />
        </>
      );
    case "discount":
      return (
        <>
          <path d="M15 30 L121 23 L166 90 L120 154 L21 146Z" fill={red} />
          <circle cx="134" cy="88" r="9" fill={ink} />
          <text
            x="30"
            y="109"
            fontFamily="Neucha"
            fontSize="51"
            fill={cream}
            stroke="none"
          >
            −50%
          </text>
        </>
      );
    case "route":
      return (
        <>
          <path
            d="M14 154 Q35 65 92 104 Q151 135 160 23"
            fill="none"
            strokeDasharray="12 13"
            stroke={red}
          />
          <path d="M139 40 L160 19 L171 48" stroke={red} />
        </>
      );
    case "speed":
      return (
        <>
          {[40, 70, 102, 137].map((y, i) => (
            <path
              key={y}
              d={`M${10 + i * 12} ${y} H${166 - i * 15}`}
              stroke={i % 2 ? red : cream}
              strokeWidth={i % 2 ? 7 : 4}
            />
          ))}
        </>
      );
    case "ghost":
      return (
        <>
          <circle cx="90" cy="55" r="29" strokeDasharray="10 10" />
          <path
            d="M35 148 Q41 91 90 95 Q143 92 148 148Z"
            strokeDasharray="12 11"
            opacity={1 - Math.min(0.7, age)}
          />
          <path d="M32 32 L149 150" stroke={red} />
        </>
      );
    case "question":
      return (
        <>
          <path
            d="M53 51 Q58 13 99 23 Q145 35 125 71 Q111 90 92 98 V118"
            stroke={green}
            strokeWidth="13"
          />
          <circle cx="93" cy="148" r="8" fill={green} stroke="none" />
        </>
      );
    case "chat":
      return (
        <>
          <path d="M23 36 H156 V125 H94 L50 155 V125 H23Z" fill="#24352f" />
          {[57, 90, 123].map((x) => (
            <circle key={x} cx={x} cy="80" r="7" fill={cream} stroke="none" />
          ))}
        </>
      );
    case "return":
      return (
        <>
          <path
            d="M58 31 L24 66 L59 103 M29 67 H105 Q169 66 143 139"
            stroke={red}
            strokeWidth="12"
          />
        </>
      );
    case "target":
    case "brackets":
      return (
        <>
          <path
            d="M15 64 V21 H59 M121 21 H164 V65 M164 121 V164 H120 M59 164 H15 V121"
            stroke={green}
          />
          {kind === "target" && <circle cx="90" cy="90" r="22" stroke={red} />}
        </>
      );
    case "breathe":
      return (
        <>
          <path
            d="M20 65 H111 Q154 62 141 36 Q122 10 104 36 M22 93 H147 Q179 102 156 124 Q139 141 124 123 M22 124 H81 Q119 141 91 159"
            stroke={green}
          />
        </>
      );
    case "lamp":
      return (
        <>
          <path
            d="M20 90 H42 M138 90 H160 M43 43 L58 58 M123 58 L141 40 M90 16 V40 M42 141 L58 124 M123 124 L142 142"
            stroke="#ebc483"
            strokeWidth="9"
          />
        </>
      );
    case "lock":
      return (
        <>
          <rect x="37" y="78" width="108" height="81" rx="11" fill="#27232d" />
          <path d="M57 77 V55 Q59 17 91 18 Q126 19 126 55 V77" />
          <circle cx="91" cy="111" r="8" fill={red} />
          <path d="M91 118 V137" stroke={red} />
        </>
      );
    case "scan":
      return (
        <>
          <path d="M19 65 V27 H58 M120 27 H159 V65 M19 119 V157 H58 M120 157 H159 V118" />
          <path
            d={`M27 ${38 + ((age * 103) % 103)} H152`}
            stroke={green}
            strokeWidth="8"
          />
        </>
      );
    case "impact":
      return (
        <>
          <path
            d="M19 105 L44 84 L42 48 L75 65 L94 17 L114 64 L153 44 L142 86 L172 107 L133 120 L143 159 L104 143 L79 169 L64 134 L21 145 L33 118Z"
            stroke={red}
          />
        </>
      );
    case "twin":
      return (
        <>
          <path
            d="M18 52 Q50 20 81 52 Q51 83 18 52Z M99 52 Q131 20 164 52 Q131 83 99 52Z"
            fill={ink}
          />
          <path
            d="M22 125 Q52 88 83 125 Q52 154 22 125Z M102 125 Q131 88 163 125 Q132 154 102 125Z"
            fill={ink}
          />
          <path
            d="M36 113 L25 94 M60 108 L62 86 M122 109 L120 88 M146 114 L159 98"
            stroke={red}
          />
        </>
      );
    default:
      return <Rays time={age} />;
  }
}
export function SemanticLayer({ time }: { time: number }) {
  const active = beats.filter((b) => b.start <= time && time < b.end).slice(-2);
  return (
    <svg
      viewBox="0 0 1080 1920"
      width="1080"
      height="1920"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {active.map((b) => {
        const age = time - b.start,
          p = age / (b.end - b.start),
          a = Math.min(1, p / 0.16) * Math.min(1, (1 - p) / 0.22),
          scale =
            b.scale *
            (0.86 +
              0.14 * Math.min(1, p / 0.16) +
              Math.sin(age * 22) * Math.exp(-age * 10) * 0.045);
        return (
          <g
            key={`${b.start}-${b.kind}`}
            opacity={a}
            transform={`translate(${b.x} ${b.y - 10 * p}) rotate(${Math.sin(age * 8) * 2}) scale(${scale}) translate(-90 -90)`}
            fill="none"
            stroke={cream}
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(3px 4px 0 #17121e)" }}
          >
            <MeaningIcon kind={b.kind} age={age} />
          </g>
        );
      })}
    </svg>
  );
}
export function AnimeImpact({ time, shot }: { time: number; shot: Shot }) {
  const age = time - shot.from;
  if (shot.entry !== "impact" || age < 0 || age > 0.18) return null;
  return (
    <svg
      viewBox="0 0 1080 1920"
      width="1080"
      height="1920"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      opacity={(1 - age / 0.18) * 0.9}
    >
      {Array.from({ length: 20 }, (_, i) => {
        const y = 280 + i * 67,
          x = i % 2 === 0 ? 0 : 1080,
          dx = i % 2 === 0 ? 1 : -1;
        return (
          <path
            key={i}
            d={`M${x} ${y} L${x + dx * (65 + (i % 4) * 16)} ${y + (960 - y) * 0.14}`}
            stroke={i % 3 === 0 ? red : ink}
            strokeWidth={4 + (i % 3) * 2}
          />
        );
      })}
    </svg>
  );
}
