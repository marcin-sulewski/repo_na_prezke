// Cinematic morph deck: "Cyberbezpieczeństwo w erze AI"
// Every persistent object carries a "!!name" so PowerPoint's Morph pairs it across slides.
// Slide-specific content gets off-canvas "ghost" copies on the neighbouring slides, so Morph
// flies it in and out instead of fading it.
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const SKILL = process.env.PPTX_SKILL;
const { applyTheme } = require(path.join(SKILL, "scripts/apply_theme.js"));
const OUT = process.argv[2] || "deck.pptx";
const A = (f) => path.join(__dirname, "assets", f);

const THEME = {
  name: "Cyber AI Cinematic",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "05070C", lt1: "F2F5FA", dk2: "0E1220", lt2: "8A93A6",
    accent1: "FF2D55", accent2: "00E0FF", accent3: "A970FF",
    accent4: "FFB020", accent5: "3A4258", accent6: "1C2233",
    hlink: "00E0FF", folHlink: "A970FF",
  },
};
const HEX = { red: "FF2D55", cyan: "00E0FF", violet: "A970FF", white: "F2F5FA" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "Cyberbezpieczeństwo w erze AI";
pres.author = "Zespół prezentacyjny";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const FH = "+mj-lt"; // theme heading font
const FB = "+mn-lt"; // theme body font
const MONO = "Courier New";
const W = 13.333, H = 7.5, N = 12;

pres.defineSlideMaster({ title: "CINEMA", background: { color: THEME.colors.dk1 } });

// ------------------------------------------------------------------ scene model
const scene = Array.from({ length: N }, () => []);
const soft = Array.from({ length: N }, () => ({})); // per slide: name -> softEdge radius (in)
const has = (k, name) => scene[k].some((it) => it.name === name);

function put(k, layer, kind, name, opts, text, softIn) {
  if (k < 0 || k >= N) return;
  if (has(k, name)) throw new Error(`duplicate ${name} on slide ${k + 1}`);
  scene[k].push({ layer, kind, name, opts, text });
  if (softIn) soft[k][name] = softIn;
}
// slide content + off-canvas ghosts on neighbours
function content(k, kind, name, opts, text, g = {}) {
  const enter = g.enter || [16, 0];
  const exit = g.exit || [-16, 0];
  const layer = g.layer || 5;
  put(k, layer, kind, name, opts, text, g.soft);
  const ghost = (d) => {
    const w = opts.w || 0, h = opts.h || 0;
    let [dx, dy] = d;
    if (dx > 0) dx = Math.max(dx, W - opts.x + 0.4);
    if (dx < 0) dx = Math.min(dx, -(opts.x + w) - 0.4);
    if (dx === 0 && dy > 0) dy = Math.max(dy, H - opts.y + 0.4);
    if (dx === 0 && dy < 0) dy = Math.min(dy, -(opts.y + h) - 0.4);
    return { ...opts, x: opts.x + dx, y: opts.y + dy };
  };
  if (k > 0 && !has(k - 1, name)) put(k - 1, layer, kind, name, ghost(enter), text, g.soft);
  if (k < N - 1) put(k + 1, layer, kind, name, ghost(exit), text, g.soft);
}
const T = (k, id, text, o, g) => content(k, "text", `!!s${k + 1}_${id}`, { margin: 0, valign: "top", fontFace: FB, color: C.background1, ...o }, text, g);
const S = (k, id, shape, o, g) => content(k, "shape", `!!s${k + 1}_${id}`, { shape, ...o }, null, g);
const I = (k, id, o, g) => content(k, "image", `!!s${k + 1}_${id}`, o, null, g);

// ------------------------------------------------------------------ story data
const SEC = [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3]; // 0 intro, 1 attack, 2 defence, 3 verdict
const SEC_COLOR = [C.accent3, C.accent1, C.accent2, C.accent3];
const SEC_HEX = [HEX.violet, HEX.red, HEX.cyan, HEX.violet];
const SEC_LABEL = ["00 · WSTĘP", "01 · ATAKUJĄCY", "02 · OBROŃCY", "03 · WERDYKT"];
const SPEAKER = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
const SECTION_TITLES = { 0: "Osoba 1 — Wstęp i atakujący", 5: "Osoba 2 — Obrońcy", 9: "Osoba 3 — Werdykt" };
const col = (k) => SEC_COLOR[SEC[k]];

// camera: [panX, panY, zoom] — drives background parallax and particles
const CAM = [[0, 0, 1.0], [-3, -1, 1.22], [-5, 0.6, 1.08], [-7, 1.0, 1.1], [-9, 0.2, 1.15],
  [4, -1.2, 1.25], [6, 0.4, 1.08], [8, 1.0, 1.1], [10, 0.2, 1.15],
  [1, -1.5, 0.96], [2, -0.6, 1.0], [2.5, 0.2, 0.92]];

// ------------------------------------------------------------------ persistent layers
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r = rng(11);
const PARTICLES = Array.from({ length: 52 }, (_, i) => {
  const d = 0.3 + r() * 1.3;
  const big = r() < 0.16;
  return { x: -12 + r() * 37, y: -3 + r() * 13.5, d, size: big ? 0.5 + r() * 0.7 : 0.07 + d * 0.12, tr: big ? 86 : 35 + r() * 40, tint: r() < 0.55 };
});

function background(k) {
  const [cx, cy, z] = CAM[k];
  const w = 26.667 * z, h = 15 * z;
  const x = Math.min(0, Math.max(W - w, W / 2 - w / 2 - cx * 0.35 * z));
  const y = Math.min(0, Math.max(H - h, H / 2 - h / 2 - cy * 0.35 * z));
  put(k, 0, "image", "!!world", { path: A("world.jpg"), x, y, w, h, altText: "Tło: sieć połączeń" });
  PARTICLES.forEach((p, i) => {
    const px = p.x - cx * p.d * 0.6, py = p.y - cy * p.d * 0.6;
    put(k, 1, "shape", `!!p${i}`, { shape: pres.shapes.OVAL, x: px, y: py, w: p.size, h: p.size, fill: { color: p.tint ? col(k) : C.background1, transparency: p.tr }, line: { type: "none" } }, null, p.size * 0.42);
  });
  put(k, 1.5, "image", "!!vignette", { path: A("vignette.png"), x: 0, y: 0, w: W, h: H, altText: "Winieta" });
  put(k, 1.5, "image", "!!scan", { path: A("scanlines.png"), x: 0, y: 0, w: W, h: H, altText: "Linie skanowania" });
}

// glowing AI core (radial-glow image; Morph scales and moves it like a camera push)
function orb(k, id, color, o) {
  const d = o.r * 3.2;
  put(k, 2, "image", `!!${id}Orb`, { path: A(color === C.accent1 ? "orb_red.png" : "orb_cyan.png"), x: o.x - d / 2, y: o.y - d / 2, w: d, h: d, transparency: Math.min(95, o.fade || 0), altText: id === "a" ? "Rdzeń AI atakujących" : "Rdzeń AI obrońców" });
}
// HUD rings that rotate on every morph
const ROT1 = [0, 60, 80, 100, 120, 180, 200, 220, 240, 300, 320, 350];
const ROT2 = [0, 30, 40, 50, 60, 90, 100, 110, 120, 150, 160, 175];
const ROT3 = [350, 290, 270, 250, 230, 170, 150, 130, 110, 50, 30, 5];
function rings(k, o) {
  const t = o.t || 0, c = col(k);
  const ring = (name, R, opts) => put(k, 3, "shape", `!!${name}`, { x: o.x - R, y: o.y - R, w: 2 * R, h: 2 * R, ...opts });
  ring("ring1", o.R, { shape: pres.shapes.ARC, angleRange: [0, 270], rotate: ROT1[k], line: { color: c, width: 1.5, transparency: 25 + t } });
  ring("ring2", o.R * 1.14, { shape: pres.shapes.OVAL, rotate: ROT2[k], line: { color: C.background1, width: 0.75, dashType: "dash", transparency: 70 + Math.min(t, 25) } });
  ring("ring3", o.R * 0.88, { shape: pres.shapes.ARC, angleRange: [200, 262], rotate: ROT3[k], line: { color: c, width: 4.5, transparency: 10 + t } });
}
// anamorphic lens flare streak
function flare(k, x, y, w, tr) {
  put(k, 3, "shape", "!!flare", { shape: pres.shapes.OVAL, x: x - w / 2, y: y - 0.05, w, h: 0.1, fill: { color: col(k), transparency: tr }, line: { type: "none" } }, null, 0.04);
}
// big word: title on slide 1, chapter word on dividers, faint watermark on content slides
function bigword(k, text, o) {
  put(k, 3, "text", "!!bigword", { x: o.x, y: o.y, w: o.w, h: o.h, fontFace: FH, fontSize: o.size, bold: true, color: o.color || col(k), transparency: o.tr || 0, charSpacing: o.cs || 0, margin: 0, valign: "top", wrap: false, ...(o.glow ? { glow: { size: 18, color: o.glow, opacity: 0.35 } } : {}) }, text);
}
function hud(k) {
  const c = col(k);
  put(k, 6, "text", "!!hudSec", { x: 0.6, y: 0.35, w: 5, h: 0.3, fontFace: MONO, fontSize: 11, bold: true, color: c, charSpacing: 3, margin: 0 }, SEC_LABEL[SEC[k]]);
  put(k, 6, "text", "!!hudSpk", { x: W - 5.85, y: 0.35, w: 5, h: 0.3, fontFace: MONO, fontSize: 11, bold: true, color: C.background1, charSpacing: 3, margin: 0, align: "right" }, `MÓWI: OSOBA ${SPEAKER[k]}`);
  put(k, 6, "shape", "!!hudDot", { shape: pres.shapes.OVAL, x: W - 0.74, y: 0.42, w: 0.14, h: 0.14, fill: { color: c }, line: { type: "none" } });
  let x = 0.6;
  for (let i = 0; i < N; i++) {
    const cur = i === k, w = cur ? 0.5 : 0.16;
    put(k, 6, "shape", `!!tick${i}`, { shape: pres.shapes.RECTANGLE, x, y: 7.0, w, h: 0.05, fill: { color: cur ? c : i < k ? C.background2 : C.accent5, transparency: cur ? 0 : 30 }, line: { type: "none" } });
    x += w + 0.08;
  }
  put(k, 6, "text", "!!hudNum", { x: W - 2.6, y: 6.88, w: 2.0, h: 0.3, fontFace: MONO, fontSize: 11, color: C.background2, charSpacing: 2, margin: 0, align: "right" }, `${String(k + 1).padStart(2, "0")} / ${N}`);
}

// ------------------------------------------------------------------ icons
async function icon(Comp, hex, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ------------------------------------------------------------------ slide builders
const title = (k, text) => T(k, "title", text, { x: 0.6, y: 0.85, w: 12.1, h: 0.8, fontFace: FH, fontSize: 36, bold: true }, { enter: [14, 0], exit: [-14, 0] });
function point(k, id, x, y, w, num, head, desc, g) {
  T(k, id + "n", num, { x, y: y + 0.04, w: 0.6, h: 0.3, fontFace: MONO, fontSize: 14, bold: true, color: col(k) }, g);
  T(k, id + "h", head, { x: x + 0.6, y, w: w - 0.6, h: 0.4, fontFace: FH, fontSize: 18, bold: true }, g);
  T(k, id + "d", desc, { x: x + 0.6, y: y + 0.42, w: w - 0.6, h: 0.62, fontSize: 14, color: C.background2 }, g);
}
function divider(k, num, word, sub, speaker, orbs) {
  T(k, "num", `${num} /`, { x: 0.65, y: 1.95, w: 3, h: 0.45, fontFace: MONO, fontSize: 24, bold: true, color: col(k), charSpacing: 6 }, { enter: [10, 0], exit: [-18, 0] });
  bigword(k, word, { x: 0.6, y: 2.45, w: 8, h: 1.4, size: 80, cs: 2, glow: SEC_HEX[SEC[k]] });
  T(k, "sub", sub, { x: 0.65, y: 3.95, w: 7.2, h: 0.55, fontSize: 24, color: C.background1 }, { enter: [20, 0], exit: [-20, 0] });
  S(k, "chip", pres.shapes.ROUNDED_RECTANGLE, { x: 0.65, y: 4.85, w: 2.75, h: 0.5, rectRadius: 0.25, fill: { color: col(k), transparency: 85 }, line: { color: col(k), width: 1 } }, { enter: [24, 0], exit: [-24, 0] });
  T(k, "chipT", `MÓWI: OSOBA ${speaker}`, { x: 0.65, y: 4.85, w: 2.75, h: 0.5, fontFace: MONO, fontSize: 14, bold: true, color: col(k), align: "center", valign: "middle", charSpacing: 2 }, { enter: [24, 0], exit: [-24, 0] });
  orbs();
}

async function build() {
  const ic = {
    tieW: await icon(fa.FaUserTie, "C8CEDC"), userC: await icon(fa.FaUser, HEX.cyan),
    search: await icon(fa.FaSearch, HEX.cyan), wrench: await icon(fa.FaWrench, HEX.cyan), shield: await icon(fa.FaShieldAlt, HEX.cyan),
    userW: await icon(fa.FaUserAstronaut, HEX.white), robot: await icon(fa.FaRobot, HEX.cyan),
    check: await icon(fa.FaCheckCircle, HEX.violet), eye: await icon(fa.FaEye, HEX.violet), users: await icon(fa.FaUsers, HEX.violet),
  };

  for (let k = 0; k < N; k++) { background(k); hud(k); }

  // ===== 1. TITLE =====================================================
  {
    const k = 0;
    orb(k, "a", C.accent1, { x: 11.55, y: 3.45, r: 1.35 });
    orb(k, "b", C.accent2, { x: 12.15, y: 4.05, r: 1.25 });
    rings(k, { x: 11.85, y: 3.75, R: 2.25 });
    flare(k, 11.85, 3.75, 7, 45);
    T(k, "kicker", "RAPORT Z CYFROWEGO FRONTU · 2026", { x: 0.6, y: 1.55, w: 7, h: 0.35, fontFace: MONO, fontSize: 14, bold: true, color: C.accent3, charSpacing: 4 }, { exit: [-12, 0] });
    bigword(k, "CYBERBEZPIECZEŃSTWO", { x: 0.6, y: 2.0, w: 9.2, h: 1.0, size: 48, color: C.background1, cs: 1 });
    T(k, "line2", [{ text: "W ERZE ", options: { color: C.background1 } }, { text: "AI", options: { color: C.accent3 } }], { x: 0.6, y: 2.95, w: 8, h: 1.0, fontFace: FH, fontSize: 48, bold: true, charSpacing: 1 }, { exit: [-16, 0] });
    T(k, "q", "Czy sztuczna inteligencja pomaga bardziej atakującym, czy obrońcom?", { x: 0.6, y: 4.2, w: 7.2, h: 0.9, fontSize: 22, color: C.background2 }, { exit: [-20, 0] });
    [["01 — ATAKUJĄCY", "Osoba 1", C.accent1], ["02 — OBROŃCY", "Osoba 2", C.accent2], ["03 — WERDYKT", "Osoba 3", C.accent3]].forEach(([a, b, c], i) => {
      T(k, `ag${i}`, [{ text: a, options: { fontFace: MONO, bold: true, color: c, breakLine: true } }, { text: b, options: { color: C.background2 } }], { x: 0.6 + i * 2.9, y: 5.7, w: 2.7, h: 0.7, fontSize: 13, charSpacing: 1 }, { exit: [0, 4] });
    });
  }

  // ===== 2. DIVIDER — ATAKUJĄCY =========================================
  divider(1, "01", "ATAKUJĄCY", "Jak AI uzbraja cyberprzestępców", 1, () => {
    orb(1, "a", C.accent1, { x: 10.7, y: 3.75, r: 1.75 });
    orb(1, "b", C.accent2, { x: 15.2, y: 1.0, r: 0.5, fade: 30 });
    rings(1, { x: 10.7, y: 3.75, R: 2.45 });
    flare(1, 10.7, 3.75, 10, 35);
  });

  // ===== 3. Socjotechnika ===============================================
  {
    const k = 2;
    orb(k, "a", C.accent1, { x: 14.3, y: -0.9, r: 2.6, fade: 18 });
    orb(k, "b", C.accent2, { x: 17, y: 3.0, r: 0.5, fade: 30 });
    rings(k, { x: 14.3, y: -0.9, R: 4.0, t: 45 });
    flare(k, 13.0, 0.4, 4, 80);
    bigword(k, "ATAKUJĄCY", { x: -0.4, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "Socjotechnika na sterydach");
    point(k, "p1", 0.6, 2.0, 6.0, "01", "Phishing bez literówek", "Spersonalizowane wiadomości w każdym języku. Dawne sygnały ostrzegawcze znikają.");
    point(k, "p2", 0.6, 3.25, 6.0, "02", "Klonowanie głosu", "Kilka sekund nagrania wystarczy, by podrobić głos szefa lub kogoś z rodziny.", { enter: [18, 0], exit: [-18, 0] });
    point(k, "p3", 0.6, 4.5, 6.0, "03", "Deepfake na żywo", "Fałszywy obraz i dźwięk w czasie rzeczywistym — także podczas wideorozmowy.", { enter: [20, 0], exit: [-20, 0] });
    // fake video-call grid
    const tiles = [["CFO", true], ["DYREKTOR", true], ["KSIĘGOWA", true], ["TY", false]];
    tiles.forEach(([lbl, fake], i) => {
      const x = 7.15 + (i % 2) * 2.85, y = 1.85 + Math.floor(i / 2) * 1.75, g = { enter: [22 + i, 0], exit: [-22 - i, 0] };
      S(k, `tile${i}`, pres.shapes.RECTANGLE, { x, y, w: 2.7, h: 1.6, fill: { color: C.text2, transparency: 15 }, line: { color: fake ? C.accent1 : C.accent2, width: 1.25, transparency: fake ? 0 : 20 } }, g);
      I(k, `tileI${i}`, { data: fake ? ic.tieW : ic.userC, x: x + 1.05, y: y + 0.32, w: 0.6, h: 0.6, altText: lbl }, g);
      T(k, `tileL${i}`, lbl, { x: x + 0.12, y: y + 1.22, w: 1.3, h: 0.28, fontFace: MONO, fontSize: 11, bold: true, color: C.background1 }, g);
      if (fake) T(k, `tileF${i}`, "DEEPFAKE", { x: x + 1.5, y: y + 1.22, w: 1.08, h: 0.26, fontFace: MONO, fontSize: 10, bold: true, color: C.accent1, align: "right" }, g);
    });
    T(k, "stat", "25 mln $", { x: 7.15, y: 5.45, w: 2.5, h: 0.75, fontFace: FH, fontSize: 36, bold: true, color: C.accent1 }, { enter: [26, 0], exit: [-26, 0] });
    T(k, "statD", "przelał pracownik firmy Arup w Hongkongu po wideorozmowie z deepfake'ami „członków zarządu” (2024)", { x: 9.75, y: 5.45, w: 2.95, h: 0.9, fontSize: 12, color: C.background2 }, { enter: [26, 0], exit: [-26, 0] });
  }

  // ===== 4. Niższy próg wejścia =========================================
  {
    const k = 3;
    orb(k, "a", C.accent1, { x: -1.0, y: 8.2, r: 2.8, fade: 18 });
    orb(k, "b", C.accent2, { x: 17, y: 3.0, r: 0.5, fade: 30 });
    rings(k, { x: -1.0, y: 8.2, R: 4.2, t: 45 });
    flare(k, 1.0, 6.4, 4, 80);
    bigword(k, "ATAKUJĄCY", { x: -2.6, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "Niższy próg wejścia");
    const g = { enter: [20, 0], exit: [-20, 0] };
    S(k, "panel", pres.shapes.RECTANGLE, { x: 0.6, y: 1.9, w: 6.3, h: 4.3, fill: { color: C.text2, transparency: 10 }, line: { color: C.accent1, width: 1, transparency: 40 } }, g);
    [0, 1, 2].forEach((i) => S(k, `pd${i}`, pres.shapes.OVAL, { x: 0.85 + i * 0.25, y: 2.08, w: 0.13, h: 0.13, fill: { color: i === 0 ? C.accent1 : C.accent5 }, line: { type: "none" } }, g));
    T(k, "ptitle", "THREAT-INTEL // CO WIDZĄ ANALITYCY", { x: 1.75, y: 2.02, w: 4.9, h: 0.28, fontFace: MONO, fontSize: 11, bold: true, color: C.background2, charSpacing: 1 }, g);
    const lines = [
      ["tłumaczenie oszustw na wiele języków", "AI"],
      ["fałszywe profile, zdjęcia i głosy", "AI"],
      ["pomoc w pisaniu złośliwego kodu", "AI"],
      ["rozpoznanie celu z otwartych źródeł", "AI"],
      ["masowa personalizacja wiadomości", "AI"],
    ];
    lines.forEach(([a, b], i) => {
      T(k, `l${i}`, [{ text: "▸ ", options: { color: C.accent1 } }, { text: a, options: { color: C.background1 } }], { x: 0.9, y: 2.6 + i * 0.62, w: 5.0, h: 0.4, fontFace: MONO, fontSize: 14 }, { enter: [20 + i * 1.5, 0], exit: [-20 - i * 1.5, 0] });
      T(k, `lt${i}`, b, { x: 5.95, y: 2.6 + i * 0.62, w: 0.7, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.accent1, align: "right" }, { enter: [20 + i * 1.5, 0], exit: [-20 - i * 1.5, 0] });
    });
    T(k, "lead", "AI nie tworzy przestępców-geniuszy. Sprawia, że przeciętny oszust działa jak profesjonalista.", { x: 7.5, y: 1.9, w: 5.2, h: 1.3, fontFace: FH, fontSize: 20, bold: true }, { enter: [16, 0], exit: [-16, 0] });
    point(k, "q1", 7.5, 3.5, 5.2, "→", "Usługi w modelu abonamentowym", "Przestępcze narzędzia AI sprzedawane są jak zwykła subskrypcja.", { enter: [18, 0], exit: [-18, 0] });
    point(k, "q2", 7.5, 4.8, 5.2, "→", "Państwa też testują", "Microsoft i OpenAI (2024) opisały grupy rządowe używające modeli językowych.", { enter: [20, 0], exit: [-20, 0] });
  }

  // ===== 5. Atak w tempie maszyny ======================================
  {
    const k = 4;
    orb(k, "a", C.accent1, { x: 14.4, y: 8.4, r: 2.8, fade: 18 });
    orb(k, "b", C.accent2, { x: 17, y: 3.0, r: 0.5, fade: 30 });
    rings(k, { x: 14.4, y: 8.4, R: 4.2, t: 45 });
    flare(k, 12.0, 6.3, 4, 80);
    bigword(k, "ATAKUJĄCY", { x: -4.8, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "Atak w tempie maszyny");
    const phases = ["Rozpoznanie", "Wejście", "Ruch w sieci", "Kradzież danych"];
    T(k, "rowH", "CZŁOWIEK", { x: 0.6, y: 2.12, w: 1.8, h: 0.35, fontFace: MONO, fontSize: 14, bold: true, color: C.background2 }, { enter: [14, 0], exit: [-14, 0] });
    T(k, "rowA", "AGENT AI", { x: 0.6, y: 3.42, w: 1.8, h: 0.35, fontFace: MONO, fontSize: 14, bold: true, color: C.accent1 }, { enter: [14, 0], exit: [-14, 0] });
    phases.forEach((p, i) => {
      const gH = { enter: [16 + i * 2, 0], exit: [-16 - i * 2, 0] };
      S(k, `h${i}`, pres.shapes.RECTANGLE, { x: 2.5 + i * 2.55, y: 2.0, w: 2.5, h: 0.6, fill: { color: C.background2, transparency: 55 + i * 8 }, line: { type: "none" } }, gH);
      T(k, `hl${i}`, p, { x: 2.6 + i * 2.55, y: 2.0, w: 2.3, h: 0.6, fontSize: 14, bold: true, valign: "middle" }, gH);
      S(k, `a${i}`, pres.shapes.RECTANGLE, { x: 2.5 + i * 0.7, y: 3.3, w: 0.66, h: 0.6, fill: { color: C.accent1, transparency: i * 15 }, line: { type: "none" } }, { enter: [12 + i * 3, 0], exit: [-12 - i * 3, 0] });
    });
    T(k, "hT", "dni – tygodnie", { x: 8.7, y: 2.68, w: 4.0, h: 0.35, fontSize: 14, color: C.background2, align: "right" }, { enter: [22, 0], exit: [-22, 0] });
    T(k, "aT", "minuty – godziny", { x: 5.4, y: 3.37, w: 4.0, h: 0.5, fontFace: FH, fontSize: 20, bold: true, color: C.accent1 }, { enter: [22, 0], exit: [-22, 0] });
    T(k, "stat", "80–90%", { x: 0.6, y: 4.9, w: 3.6, h: 1.1, fontFace: FH, fontSize: 60, bold: true, color: C.accent1 }, { enter: [24, 0], exit: [-24, 0] });
    T(k, "statD", "działań w kampanii szpiegowskiej wykonał samodzielnie agent AI — człowiek podejmował tylko kluczowe decyzje. Kampanię wykryła i przerwała firma Anthropic (2025).", { x: 4.4, y: 5.05, w: 8.3, h: 1.0, fontSize: 16, color: C.background1 }, { enter: [26, 0], exit: [-26, 0] });
  }

  // ===== 6. DIVIDER — OBROŃCY ==========================================
  divider(5, "02", "OBROŃCY", "Jak AI wzmacnia tarczę", 2, () => {
    orb(5, "b", C.accent2, { x: 10.7, y: 3.75, r: 1.75 });
    orb(5, "a", C.accent1, { x: -3.0, y: 6.0, r: 0.6, fade: 30 });
    rings(5, { x: 10.7, y: 3.75, R: 2.45 });
    flare(5, 10.7, 3.75, 10, 35);
  });

  // ===== 7. SOC, który nie śpi =========================================
  {
    const k = 6;
    orb(k, "b", C.accent2, { x: 14.3, y: -0.9, r: 2.6, fade: 18 });
    orb(k, "a", C.accent1, { x: -3.5, y: 3.0, r: 0.5, fade: 30 });
    rings(k, { x: 14.3, y: -0.9, R: 4.0, t: 45 });
    flare(k, 13.0, 0.4, 4, 80);
    bigword(k, "OBROŃCY", { x: -0.4, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "SOC, który nie śpi");
    point(k, "p1", 0.6, 1.8, 6.2, "01", "Widzi wszystko naraz", "Analizuje miliardy zdarzeń z sieci, chmury i urządzeń.");
    point(k, "p2", 0.6, 2.85, 6.2, "02", "Wyłapuje anomalie", "Uczy się, jak wygląda „normalność”, i alarmuje przy odchyleniach.", { enter: [18, 0], exit: [-18, 0] });
    point(k, "p3", 0.6, 3.9, 6.2, "03", "Reaguje w sekundy", "Sam odcina zainfekowany komputer, zanim atak się rozleje.", { enter: [20, 0], exit: [-20, 0] });
    T(k, "s1", "2,2 mln $", { x: 0.6, y: 5.05, w: 2.9, h: 0.6, fontFace: FH, fontSize: 30, bold: true, color: C.accent2 }, { enter: [22, 0], exit: [-22, 0] });
    T(k, "s1d", "niższy średni koszt wycieku przy szerokim użyciu AI i automatyzacji (IBM, 2024)", { x: 0.6, y: 5.68, w: 2.9, h: 0.8, fontSize: 12, color: C.background2 }, { enter: [22, 0], exit: [-22, 0] });
    T(k, "s2", "~100 dni", { x: 3.8, y: 5.05, w: 2.9, h: 0.6, fontFace: FH, fontSize: 30, bold: true, color: C.accent2 }, { enter: [24, 0], exit: [-24, 0] });
    T(k, "s2d", "szybciej wykryty i opanowany incydent (IBM, 2024)", { x: 3.8, y: 5.68, w: 2.9, h: 0.8, fontSize: 12, color: C.background2 }, { enter: [24, 0], exit: [-24, 0] });
    // radar
    const cx = 9.95, cy = 4.0, R = 2.2, gR = { enter: [20, 0], exit: [-20, 0] };
    [1, 0.66, 0.33].forEach((f, i) => S(k, `rc${i}`, pres.shapes.OVAL, { x: cx - R * f, y: cy - R * f, w: 2 * R * f, h: 2 * R * f, line: { color: C.accent2, width: 1, transparency: 40 + i * 15 } }, gR));
    S(k, "rx", pres.shapes.LINE, { x: cx - R, y: cy, w: 2 * R, h: 0, line: { color: C.accent2, width: 0.75, transparency: 60 } }, gR);
    S(k, "ry", pres.shapes.LINE, { x: cx, y: cy - R, w: 0, h: 2 * R, line: { color: C.accent2, width: 0.75, transparency: 60 } }, gR);
    S(k, "sweep", pres.shapes.PIE, { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, angleRange: [300, 0], rotate: 200, fill: { color: C.accent2, transparency: 72 }, line: { type: "none" } }, { enter: [20, 0], exit: [-20, 0], soft: 0.25 });
    const blips = [[-1.2, -0.8], [0.9, -1.4], [1.5, 0.5], [-0.5, 1.3], [-1.7, 0.4], [0.4, 0.2]];
    blips.forEach(([dx, dy], i) => S(k, `b${i}`, pres.shapes.OVAL, { x: cx + dx - 0.08, y: cy + dy - 0.08, w: 0.16, h: 0.16, fill: { color: C.accent2 }, line: { type: "none" } }, gR));
    S(k, "anom", pres.shapes.OVAL, { x: cx + 1.05 - 0.14, y: cy + 1.25 - 0.14, w: 0.28, h: 0.28, fill: { color: C.accent1 }, line: { color: C.accent1, width: 6, transparency: 70 } }, gR);
    T(k, "anomT", "ANOMALIA · 03:14", { x: cx + 1.35, y: cy + 1.15, w: 2.0, h: 0.3, fontFace: MONO, fontSize: 11, bold: true, color: C.accent1 }, gR);
  }

  // ===== 8. AI łata luki ===============================================
  {
    const k = 7;
    orb(k, "b", C.accent2, { x: 6.67, y: 9.6, r: 2.8, fade: 18 });
    orb(k, "a", C.accent1, { x: -3.5, y: 3.0, r: 0.5, fade: 30 });
    rings(k, { x: 6.67, y: 9.6, R: 4.4, t: 45 });
    flare(k, 6.67, 7.2, 5, 80);
    bigword(k, "OBROŃCY", { x: -2.6, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "AI łata luki, zanim ktoś je znajdzie");
    const steps = [["ZNAJDŹ", "AI przeszukuje kod szybciej niż cały zespół testerów.", ic.search],
      ["NAPRAW", "Proponuje poprawkę i sprawdza, czy niczego nie psuje.", ic.wrench],
      ["ZABEZPIECZ", "Luka znika, zanim przestępcy w ogóle się o niej dowiedzą.", ic.shield]];
    steps.forEach(([h, d, img], i) => {
      const cx = 2.4 + i * 4.27, g = { enter: [16 + i * 3, 0], exit: [-16 - i * 3, 0] };
      S(k, `c${i}`, pres.shapes.OVAL, { x: cx - 0.7, y: 1.95, w: 1.4, h: 1.4, fill: { color: C.accent2, transparency: 88 }, line: { color: C.accent2, width: 1.5 } }, g);
      I(k, `ci${i}`, { data: img, x: cx - 0.33, y: 2.32, w: 0.66, h: 0.66, altText: h }, g);
      T(k, `ch${i}`, h, { x: cx - 1.8, y: 3.5, w: 3.6, h: 0.4, fontFace: MONO, fontSize: 18, bold: true, color: C.accent2, align: "center", charSpacing: 3 }, g);
      T(k, `cd${i}`, d, { x: cx - 1.8, y: 3.95, w: 3.6, h: 0.8, fontSize: 14, color: C.background1, align: "center" }, g);
      if (i < 2) S(k, `ar${i}`, pres.shapes.LINE, { x: cx + 0.95, y: 2.65, w: 2.37, h: 0, line: { color: C.accent2, width: 1.25, dashType: "dash", endArrowType: "triangle", transparency: 30 } }, g);
    });
    const cards = [["GOOGLE BIG SLEEP · 2024", "Agent AI znalazł groźną, nieznaną lukę w popularnej bazie danych SQLite — zanim trafiła do użytkowników."],
      ["DARPA AIxCC · 2025", "W finale konkursu systemy AI samodzielnie wykrywały i łatały luki w otwartym oprogramowaniu."]];
    cards.forEach(([h, d], i) => {
      const x = 0.6 + i * 6.17, g = { enter: [22 + i * 3, 0], exit: [-22 - i * 3, 0] };
      S(k, `k${i}`, pres.shapes.RECTANGLE, { x, y: 5.05, w: 5.95, h: 1.45, fill: { color: C.text2, transparency: 10 }, line: { color: C.accent2, width: 0.75, transparency: 50 } }, g);
      T(k, `kh${i}`, h, { x: x + 0.25, y: 5.2, w: 5.45, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: C.accent2, charSpacing: 1 }, g);
      T(k, `kd${i}`, d, { x: x + 0.25, y: 5.55, w: 5.45, h: 0.85, fontSize: 14, color: C.background1 }, g);
    });
  }

  // ===== 9. Człowiek + AI ==============================================
  {
    const k = 8;
    orb(k, "b", C.accent2, { x: -1.3, y: -1.0, r: 2.6, fade: 22 });
    orb(k, "a", C.accent1, { x: -3.5, y: 3.0, r: 0.5, fade: 30 });
    rings(k, { x: -1.3, y: -1.0, R: 4.0, t: 50 });
    flare(k, 1.0, 0.6, 4, 82);
    bigword(k, "OBROŃCY", { x: -4.8, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "Człowiek + AI: przewaga gospodarza");
    T(k, "stat", "4,8 mln", { x: 0.6, y: 2.0, w: 5.6, h: 1.3, fontFace: FH, fontSize: 72, bold: true, color: C.accent2 }, { enter: [14, 0], exit: [-14, 0] });
    T(k, "statD", "tylu specjalistów od cyberbezpieczeństwa brakuje na świecie (ISC2, 2024). AI pomaga zapełnić tę lukę.", { x: 0.6, y: 3.4, w: 5.4, h: 1.0, fontSize: 16, color: C.background1 }, { enter: [16, 0], exit: [-16, 0] });
    T(k, "quote", "Obrońca gra u siebie: zna własną sieć, ma dane i pełną telemetrię. Atakujący widzi tylko fragment.", { x: 0.6, y: 4.65, w: 5.4, h: 1.3, fontFace: FH, fontSize: 18, bold: true, italic: true, color: C.background2 }, { enter: [18, 0], exit: [-18, 0] });
    const g = { enter: [20, 0], exit: [-20, 0] };
    S(k, "h1", pres.shapes.OVAL, { x: 7.55, y: 1.85, w: 1.5, h: 1.5, fill: { color: C.background1, transparency: 90 }, line: { color: C.background1, width: 1.25 } }, g);
    I(k, "h1i", { data: ic.userW, x: 7.95, y: 2.25, w: 0.7, h: 0.7, altText: "Analityk" }, g);
    T(k, "plus", "+", { x: 9.2, y: 2.05, w: 0.9, h: 1.0, fontFace: FH, fontSize: 48, bold: true, color: C.accent2, align: "center", valign: "middle" }, g);
    S(k, "h2", pres.shapes.OVAL, { x: 10.25, y: 1.85, w: 1.5, h: 1.5, fill: { color: C.accent2, transparency: 85 }, line: { color: C.accent2, width: 1.25 } }, g);
    I(k, "h2i", { data: ic.robot, x: 10.65, y: 2.25, w: 0.7, h: 0.7, altText: "Asystent AI" }, g);
    point(k, "p1", 7.0, 3.75, 5.7, "01", "Asystent analityka", "Streszcza incydent i podpowiada kolejny krok.", { enter: [22, 0], exit: [-22, 0] });
    point(k, "p2", 7.0, 4.85, 5.7, "02", "Junior jak senior", "AI skraca naukę i wyrównuje braki doświadczenia.", { enter: [24, 0], exit: [-24, 0] });
  }

  // ===== 10–12. Balance scale: orbs become the pans =====================
  function scale(k, o) {
    const th = (o.tilt * Math.PI) / 180, half = o.L / 2;
    const ends = [[o.x - half * Math.cos(th), o.y - half * Math.sin(th)], [o.x + half * Math.cos(th), o.y + half * Math.sin(th)]];
    put(k, 3, "shape", "!!beam", { shape: pres.shapes.RECTANGLE, x: o.x - half, y: o.y - 0.035, w: o.L, h: 0.07, rotate: o.tilt, fill: { color: C.background1, transparency: 15 }, line: { type: "none" } });
    put(k, 3, "shape", "!!fulcrum", { shape: pres.shapes.ISOSCELES_TRIANGLE, x: o.x - 0.32, y: o.y + 0.05, w: 0.64, h: 0.7, fill: { color: C.background2, transparency: 55 }, line: { type: "none" } });
    put(k, 3, "shape", "!!pivot", { shape: pres.shapes.OVAL, x: o.x - 0.09, y: o.y - 0.09, w: 0.18, h: 0.18, fill: { color: C.background1 }, line: { type: "none" } });
    if (!o.ghost) {
      orb(k, "a", C.accent1, { x: ends[0][0], y: ends[0][1] - o.r * 0.95, r: o.r });
      orb(k, "b", C.accent2, { x: ends[1][0], y: ends[1][1] - o.r * 0.95, r: o.r });
    }
    put(k, 6, "text", "!!lblA", { x: ends[0][0] - 1.2, y: ends[0][1] + 0.15, w: 2.4, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: C.accent1, align: "center", charSpacing: 2, margin: 0 }, "ATAKUJĄCY");
    put(k, 6, "text", "!!lblB", { x: ends[1][0] - 1.2, y: ends[1][1] + 0.15, w: 2.4, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: C.accent2, align: "center", charSpacing: 2, margin: 0 }, "OBROŃCY");
  }
  // ghost scale on slide 9 so it rises in from below
  scale(8, { x: 10.4, y: 10.5, L: 4.4, tilt: 0, r: 0.55, ghost: true });

  divider(9, "03", "WERDYKT", "Kto wygrywa ten wyścig?", 3, () => {
    scale(9, { x: 10.4, y: 4.75, L: 4.4, tilt: 0, r: 0.55 });
    rings(9, { x: 10.4, y: 4.0, R: 2.7, t: 15 });
    flare(9, 10.4, 4.75, 9, 45);
  });

  {
    const k = 10;
    scale(k, { x: 6.67, y: 5.5, L: 7.6, tilt: -7, r: 0.55 });
    rings(k, { x: 6.67, y: 5.5, R: 6.5, t: 60 });
    flare(k, 6.67, 5.5, 12, 80);
    bigword(k, "WERDYKT", { x: -1.0, y: 4.9, w: 18, h: 3.2, size: 200, tr: 94 });
    title(k, "Dziś szala przechyla się ku atakującym");
    const colA = [["Tanio", "Narzędzia AI są powszechne i często darmowe."], ["Szybko", "Żadnych procedur, audytów ani zgód."], ["Jedno trafienie", "Wystarczy, że raz się uda."]];
    const colB = [["Dane", "Pełna widoczność własnej sieci."], ["Skala", "AI chroni miliony urządzeń naraz."], ["Prewencja", "Luki można łatać, zanim ktoś je wykorzysta."]];
    T(k, "hA", "PO STRONIE ATAKUJĄCYCH", { x: 0.6, y: 1.8, w: 5.6, h: 0.35, fontFace: MONO, fontSize: 14, bold: true, color: C.accent1, charSpacing: 2 }, { enter: [14, 0], exit: [-14, 0] });
    T(k, "hB", "ATUTY OBROŃCÓW", { x: 7.1, y: 1.8, w: 5.6, h: 0.35, fontFace: MONO, fontSize: 14, bold: true, color: C.accent2, charSpacing: 2 }, { enter: [18, 0], exit: [-18, 0] });
    colA.forEach(([h, d], i) => T(k, `a${i}`, [{ text: h + " — ", options: { bold: true, color: C.background1 } }, { text: d, options: { color: C.background2 } }], { x: 0.6, y: 2.3 + i * 0.62, w: 5.8, h: 0.55, fontSize: 15 }, { enter: [15 + i, 0], exit: [-15 - i, 0] }));
    colB.forEach(([h, d], i) => T(k, `b${i}`, [{ text: h + " — ", options: { bold: true, color: C.background1 } }, { text: d, options: { color: C.background2 } }], { x: 7.1, y: 2.3 + i * 0.62, w: 5.8, h: 0.55, fontSize: 15 }, { enter: [19 + i, 0], exit: [-19 - i, 0] }));
  }

  {
    const k = 11;
    scale(k, { x: 6.67, y: 5.55, L: 7.6, tilt: 9, r: 0.55 });
    rings(k, { x: 6.67, y: 5.55, R: 13, t: 70 });
    flare(k, 6.67, 5.55, 16, 70);
    bigword(k, "WERDYKT", { x: -3.0, y: 4.9, w: 18, h: 3.2, size: 200, tr: 95 });
    T(k, "h1", "AI NIE WYBIERA STRON.", { x: 0.6, y: 1.0, w: 12.13, h: 0.9, fontFace: FH, fontSize: 44, bold: true, align: "center", charSpacing: 2 }, { enter: [0, -6], exit: [0, -6] });
    T(k, "h2", "Wybierają ludzie.", { x: 0.6, y: 1.85, w: 12.13, h: 0.7, fontFace: FH, fontSize: 30, bold: true, color: C.accent2, align: "center" }, { enter: [0, -7] });
    const tk = [[ic.eye, "Weryfikuj", "Głos i obraz można podrobić — potwierdzaj innym kanałem."],
      [ic.check, "Automatyzuj obronę", "Na tempo maszyn odpowiadaj maszynami."],
      [ic.users, "Inwestuj w ludzi", "AI wzmacnia specjalistów, nie zastępuje ich."]];
    tk.forEach(([img, h, d], i) => {
      const x = 0.9 + i * 4.0, g = { enter: [16 + i * 2, 0] };
      I(k, `ti${i}`, { data: img, x, y: 3.0, w: 0.45, h: 0.45, altText: h }, g);
      T(k, `th${i}`, h, { x: x + 0.6, y: 3.0, w: 3.0, h: 0.4, fontFace: FH, fontSize: 17, bold: true }, g);
      T(k, `td${i}`, d, { x: x + 0.6, y: 3.42, w: 3.0, h: 0.75, fontSize: 14, color: C.background2 }, g);
    });
    T(k, "thanks", "DZIĘKUJEMY  ·  PYTANIA?", { x: 3.67, y: 6.55, w: 6.0, h: 0.35, fontFace: MONO, fontSize: 14, bold: true, color: C.accent3, align: "center", charSpacing: 4 }, { enter: [0, 3] });
  }

  // orbs that a slide does not place explicitly keep their previous position (so Morph never drops them)
  for (let k = 1; k < N; k++) for (const nm of ["aOrb", "bOrb", "ring1", "ring2", "ring3", "flare", "bigword"]) {
    if (!has(k, "!!" + nm)) { const prev = scene[k - 1].find((it) => it.name === "!!" + nm); if (prev) { scene[k].push({ ...prev, opts: { ...prev.opts } }); if (soft[k - 1]["!!" + nm]) soft[k]["!!" + nm] = soft[k - 1]["!!" + nm]; } }
  }

  // ------------------------------------------------------------------ render
  const NOTES = require("./notes.js");
  for (let k = 0; k < N; k++) {
    if (SECTION_TITLES[k]) pres.addSection({ title: SECTION_TITLES[k] });
    const sec = Object.keys(SECTION_TITLES).map(Number).filter((s) => s <= k).pop();
    const s = pres.addSlide({ masterName: "CINEMA", sectionTitle: SECTION_TITLES[sec] });
    const items = scene[k].map((it, i) => ({ it, i })).sort((a, b) => a.it.layer - b.it.layer || a.i - b.i).map((x) => x.it);
    for (const it of items) {
      const o = structuredClone(it.opts);
      o.objectName = it.name;
      if (it.kind === "shape") { const shp = o.shape; delete o.shape; s.addShape(shp, o); }
      else if (it.kind === "text") s.addText(structuredClone(it.text), { ...o, isTextBox: true });
      else s.addImage(o);
    }
    s.addNotes(NOTES[k]);
  }
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  await postProcess(OUT);
  console.log("wrote", OUT);
}

// ------------------------------------------------------------------ morph + soft edges
const EMU = 914400;
const TRANS = (k) => {
  if (k === 0) return '<p:transition spd="slow"><p:fade thruBlk="1"/></p:transition>';
  const byChar = [1, 5, 9].includes(k);
  const dur = byChar ? 2200 : 1600;
  return '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">' +
    `<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p159">` +
    `<p:transition spd="slow" p14:dur="${dur}"><p159:morph option="${byChar ? "byChar" : "byObject"}"/></p:transition></mc:Choice>` +
    '<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>';
};
async function postProcess(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (let k = 0; k < N; k++) {
    const p = `ppt/slides/slide${k + 1}.xml`;
    let xml = await zip.file(p).async("string");
    xml = xml.replace(/<p:sp>([\s\S]*?)<\/p:sp>/g, (m) => {
      const nm = (m.match(/<p:cNvPr id="\d+" name="([^"]+)"/) || [])[1];
      const rad = nm && soft[k][nm];
      if (!rad) return m;
      if (m.includes("<a:effectLst>")) throw new Error("effectLst clash on " + nm);
      return m.replace("</p:spPr>", `<a:effectLst><a:softEdge rad="${Math.round(rad * EMU)}"/></a:effectLst></p:spPr>`);
    });
    xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + TRANS(k));
    zip.file(p, xml);
  }
  // dedupe identical media so every slide references one picture part
  const crypto = require("crypto");
  const canon = {}, remap = {};
  for (const f of Object.keys(zip.files).filter((f) => f.startsWith("ppt/media/") && !zip.files[f].dir).sort()) {
    const h = crypto.createHash("md5").update(await zip.file(f).async("nodebuffer")).digest("hex");
    if (canon[h]) { remap[path.basename(f)] = path.basename(canon[h]); zip.remove(f); } else canon[h] = f;
  }
  for (const f of Object.keys(zip.files).filter((f) => /^ppt\/slides\/_rels\/.*\.rels$/.test(f))) {
    let x = await zip.file(f).async("string");
    x = x.replace(/Target="\.\.\/media\/([^"]+)"/g, (m, n) => `Target="../media/${remap[n] || n}"`);
    zip.file(f, x);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

build().catch((e) => { console.error(e); process.exit(1); });
