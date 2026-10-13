import { shade } from "../utils/colors";

/**
 * Flat garment illustrations drawn in SVG, tinted from the product colour.
 * No image files needed, so the store looks finished out of the box.
 */
export default function ProductArt({ art, color = "#6C4DFF", tile = true, className = "" }) {
  const base = color;
  const dark = shade(color, -0.28);
  const light = shade(color, 0.4);
  const bg = shade(color, 0.86);
  const stroke = { stroke: dark, strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" };

  const shapes = {
    tee: (
      <>
        <path d="M60 44 L86 34 Q100 52 114 34 L140 44 L168 80 L146 96 L136 84 L136 166 L64 166 L64 84 L54 96 L32 80 Z" fill={base} {...stroke} />
        <path d="M86 34 Q100 52 114 34" fill="none" {...stroke} />
        <path d="M64 150 L136 150" stroke={dark} strokeWidth="2" opacity=".35" />
      </>
    ),
    hoodie: (
      <>
        <path d="M62 52 L84 40 Q100 64 116 40 L138 52 L174 122 L151 133 L136 102 L136 168 L64 168 L64 102 L49 133 L26 122 Z" fill={base} {...stroke} />
        <path d="M84 40 Q100 14 116 40 Q100 64 84 40 Z" fill={dark} {...stroke} />
        <path d="M94 62 L93 86 M106 62 L107 86" stroke={light} strokeWidth="3" strokeLinecap="round" />
        <path d="M80 132 L120 132 L124 154 L76 154 Z" fill={dark} opacity=".55" {...stroke} />
      </>
    ),
    jeans: (
      <>
        <path d="M64 30 L136 30 L142 176 L108 176 L100 82 L92 176 L58 176 Z" fill={base} {...stroke} />
        <path d="M64 30 L136 30 L136 42 L64 42 Z" fill={dark} opacity=".5" {...stroke} />
        <path d="M100 42 L100 82" fill="none" {...stroke} />
        <path d="M70 52 Q80 62 90 52 M130 52 Q120 62 110 52" fill="none" stroke={light} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M60 150 L94 150 M106 150 L140 150" stroke={light} strokeWidth="2" opacity=".6" />
      </>
    ),
    dress: (
      <>
        <path d="M78 26 L90 26 L100 50 L110 26 L122 26 L128 72 L154 172 L46 172 L72 72 Z" fill={base} {...stroke} />
        <path d="M72 76 Q100 88 128 76" fill="none" {...stroke} />
        <path d="M60 140 Q100 152 140 140" fill="none" stroke={light} strokeWidth="2.5" opacity=".7" strokeLinecap="round" />
      </>
    ),
    jacket: (
      <>
        <path d="M60 46 L84 34 L100 44 L116 34 L140 46 L174 126 L151 134 L137 100 L137 162 L63 162 L63 100 L49 134 L26 126 Z" fill={base} {...stroke} />
        <path d="M84 34 L100 56 L116 34" fill={dark} opacity=".6" {...stroke} />
        <path d="M100 56 L100 162" fill="none" {...stroke} />
        <path d="M63 150 L137 150" stroke={dark} strokeWidth="9" opacity=".5" />
        <rect x="76" y="108" width="16" height="3" rx="1.5" fill={light} />
        <rect x="108" y="108" width="16" height="3" rx="1.5" fill={light} />
      </>
    ),
    sneaker: (
      <>
        <path d="M24 132 Q26 98 58 94 L84 102 Q102 112 128 106 L164 120 Q182 128 180 146 L24 146 Z" fill={base} {...stroke} />
        <rect x="20" y="146" width="162" height="15" rx="7.5" fill="#fff" {...stroke} />
        <path d="M88 106 L96 94 M100 110 L108 98 M112 108 L120 98" stroke={dark} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 132 Q40 126 58 132 L58 146" fill="none" stroke={dark} strokeWidth="2.5" opacity=".6" />
        <path d="M130 124 Q150 122 166 134" fill="none" stroke={light} strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    bag: (
      <>
        <path d="M74 74 Q74 28 100 28 Q126 28 126 74" fill="none" {...stroke} strokeWidth="5" />
        <path d="M48 74 L152 74 L158 172 L42 172 Z" fill={base} {...stroke} />
        <path d="M48 74 L152 74 L154 94 L46 94 Z" fill={dark} opacity=".4" />
        <circle cx="100" cy="124" r="14" fill={light} stroke={dark} strokeWidth="2.5" />
      </>
    ),
    cap: (
      <>
        <path d="M42 124 Q40 52 100 52 Q160 52 158 124 Z" fill={base} {...stroke} />
        <path d="M100 124 Q150 112 180 132 Q150 146 100 136 Z" fill={dark} {...stroke} />
        <path d="M100 52 L100 124" stroke={dark} strokeWidth="2" opacity=".45" />
        <circle cx="100" cy="52" r="5" fill={dark} />
      </>
    ),
  };

  return (
    <div className={`art ${tile ? "art-tile" : ""} ${className}`} style={tile ? { background: bg } : undefined}>
      <svg viewBox="0 0 200 200" role="img" aria-label={art}>
        {shapes[art] || shapes.tee}
      </svg>
    </div>
  );
}
