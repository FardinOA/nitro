// Poses are expressed in stage units. The wide stage is the Figma frame (1920×1098) verbatim.

export type Pose = { x: number; y: number; scale?: number; rotation?: number; opacity?: number };

export type ElementKey =
  // Portrait-only art direction (spotlight, spin hint, carousel dots); hidden on the Figma desktop stage.
  | "spot"
  | "hint"
  | "dots"
  | "header"
  | "subtext"
  | "cta"
  | "social"
  | "hero"
  | "tagline"
  | "can"
  | "glow"
  | "infoGreen"
  | "canEng"
  | "canRed"
  | "canSky"
  | "canBlue"
  | "infoEng"
  | "infoRed"
  | "infoSky"
  | "infoBlue";

export type ElementSpec = {
  origin: [number, number];
  poses: [Pose, Pose, Pose];
  width?: number;
  align?: "left" | "center";
};

// One carousel position: can centre + height, info anchor (top-centre) + scale.
export type Slot = { x: number; y: number; h: number; ix: number; iy: number; is: number };

// Positional DOM slots; which flavour each one shows is decided by the page (it rotates on rebase).
export type CarouselItem = { can: ElementKey; info: ElementKey; home: number; baseH: number };

export type StageLayout = {
  mode: "wide" | "tall";
  W: number;
  H: number;
  s: number;
  ox: number;
  oy: number;
  pad: number;
  ui: number;
  elements: Record<ElementKey, ElementSpec>;
  labelX: [number, number, number];
  // Slots for s = -3…3 (index s + 3); ±3 are the off-stage fade targets.
  slots: Slot[];
  infoFade: "edge" | "center";
};

export const FIGMA = { W: 1920, H: 1098 } as const;

// Main can base box = Figma frame 3 can; other frames are uniform scales of it.
export const CAN = { w: 256.621, h: 676.546 } as const;
export const PRODUCT_CAN = { w: 198, h: 522 } as const;

// Left → right; the centre slot holds the morphing hero can.
export const CAROUSEL_ITEMS: CarouselItem[] = [
  { can: "canEng", info: "infoEng", home: -2, baseH: PRODUCT_CAN.h },
  { can: "canRed", info: "infoRed", home: -1, baseH: PRODUCT_CAN.h },
  { can: "can", info: "infoGreen", home: 0, baseH: CAN.h },
  { can: "canSky", info: "infoSky", home: 1, baseH: PRODUCT_CAN.h },
  { can: "canBlue", info: "infoBlue", home: 2, baseH: PRODUCT_CAN.h },
];
export const HERO_ITEM = 2;

// Label strip offset per frame as % of the strip width — sliding it reads as the can spinning.
const LABEL_X: [number, number, number] = [-6.3788, -68.327, -37.839];
export const PRODUCT_LABEL_X = -38.445;

const PRODUCT_DROP = 1071;

const below = (p: Pose, d: number): [Pose, Pose, Pose] => [{ ...p, y: p.y + d }, { ...p, y: p.y + d }, p];

export const slotAt = (slots: Slot[], s: number) => slots[s + 3];

export function isWide(vw: number, vh: number) {
  return vw >= 900 && vw / vh >= 1.2;
}

export function computeLayout(vw: number, vh: number): StageLayout {
  return isWide(vw, vh) ? wideLayout(vw, vh) : tallLayout(vw, vh);
}

// Frame-3 poses for every carousel item, derived from its home slot.
type ProductKey = Exclude<
  ElementKey,
  "spot" | "hint" | "dots" | "header" | "subtext" | "cta" | "social" | "hero" | "tagline" | "can" | "glow"
>;

const hiddenEverywhere = (x: number, y: number): [Pose, Pose, Pose] => [
  { x, y, opacity: 0 },
  { x, y, opacity: 0 },
  { x, y, opacity: 0 },
];

function carouselElements(slots: Slot[], drop: number) {
  const out = {} as Record<ProductKey, ElementSpec>;
  const set = (k: ElementKey, spec: ElementSpec) => {
    if (k !== "can") out[k as ProductKey] = spec;
  };
  for (const item of CAROUSEL_ITEMS) {
    const slot = slotAt(slots, item.home);
    set(item.can, { origin: [0.5, 0.5], poses: below({ x: slot.x, y: slot.y, scale: slot.h / item.baseH }, drop) });
    set(item.info, { origin: [0.5, 0], poses: below({ x: slot.ix, y: slot.iy, scale: slot.is }, drop) });
  }
  return out;
}

function wideLayout(vw: number, vh: number): StageLayout {
  const s = Math.min(vw / FIGMA.W, vh / FIGMA.H);
  const ui = Math.min(1.3, Math.max(1, 0.75 / s));
  // Letterbox height (stage units) above/below the frame; off-frame poses must clear it too.
  const pad = Math.max(0, (vh / s - FIGMA.H) / 2);
  const up = (y: number) => y - pad;
  const down = (y: number) => y + pad;
  const drop = PRODUCT_DROP + pad;

  // Product info is centred on its can (Figma had it drifting up to 14 units off the can axis).
  const slot = (x: number, y: number, h: number, iy: number): Slot => ({ x, y, h, ix: x, iy, is: ui });
  const slots: Slot[] = [
    slot(-140, 653, 380, 880),
    slot(204.104, 613, 442, 880),
    slot(566.104, 573, 522, 880),
    slot(960, 541.273, CAN.h, 915),
    slot(1387, 573, 522, 880),
    slot(1717.831, 613, 442, 880),
    slot(2060, 653, 380, 880),
  ];
  const center = slotAt(slots, 0);

  return {
    mode: "wide",
    W: FIGMA.W,
    H: FIGMA.H,
    s,
    ox: (vw - FIGMA.W * s) / 2,
    oy: (vh - FIGMA.H * s) / 2,
    pad,
    ui,
    labelX: LABEL_X,
    slots,
    infoFade: "edge",
    elements: {
      spot: { origin: [0.5, 0.5], poses: hiddenEverywhere(960, 549) },
      hint: { origin: [0.5, 1], poses: hiddenEverywhere(960, 1200) },
      dots: { origin: [0.5, 0], poses: hiddenEverywhere(960, 1200) },
      header: {
        origin: [0.5, 0.5],
        poses: [
          { x: 960, y: 441.5 },
          { x: 960, y: up(-628.5) },
          { x: 960, y: up(-628.5) },
        ],
      },
      subtext: { origin: [0, 0], poses: [{ x: 88, y: 892, scale: ui }, { x: 88, y: up(-178), scale: ui }, { x: 88, y: up(-178), scale: ui }] },
      cta: { origin: [0.5, 0], poses: [{ x: 959.5, y: 898, scale: ui }, { x: 959.5, y: up(-417), scale: ui }, { x: 959.5, y: up(-417), scale: ui }] },
      social: { origin: [1, 0], poses: [{ x: 1833, y: 894, scale: ui }, { x: 1833, y: up(-176), scale: ui }, { x: 1833, y: up(-176), scale: ui }] },
      hero: { origin: [0, 0], poses: [{ x: 64, y: down(1301) }, { x: 64, y: 122 }, { x: 64, y: up(-1181) }] },
      tagline: { origin: [0, 0], poses: [{ x: 1268, y: down(1417) }, { x: 1258, y: 195 }, { x: 1268, y: up(-1065) }] },
      can: {
        origin: [0.5, 0.5],
        poses: [
          { x: 960, y: 487.931, scale: 1.32437, rotation: 90 },
          { x: 960, y: 571.0, scale: 2.19941, rotation: 90 },
          { x: center.x, y: center.y, scale: 1, rotation: 0 },
        ],
      },
      glow: { origin: [0.5, 0.5], poses: below({ x: 960.5, y: 872 }, drop) },
      ...carouselElements(slots, drop),
    },
  };
}

// Portrait (phones, portrait tablets): its own art direction rather than the desktop frame shrunk.
//   Frame 1 — a poster: NITRO across the full width, the can standing tall in front of its middle letters,
//             a spotlight behind, copy + CTAs in the thumb zone. The can auto-spins and swipes to roll.
//   Frame 2 — editorial: photo card, the can leaning out over its corner, SINCE / 2002 / PRODUCING beneath.
//   Frame 3 — swipe coverflow with page dots.
function tallLayout(vw: number, vh: number): StageLayout {
  const W = Math.max(430, vw / 1.25);
  const s = vw / W;
  const H = vh / s;
  const m = 20;
  const navBottom = 84;

  // Frame 1
  const ctaY = H - 28;
  const subtextY = ctaY - 44 - 16;
  const subtextW = W - m * 2;
  const hintY = subtextY - 72 - 18;
  const posterTop = navBottom + 4;
  const posterBottom = hintY - 26;
  const posterH = posterBottom - posterTop;
  const posterCy = posterTop + posterH / 2;
  // Wordmark spans the width so it reads; the upright can crosses its middle like the desktop composition.
  const hs = (W - 24) / 1760;
  const can1Scale = Math.min(0.7 * posterH, 1.25 * W) / CAN.h;

  // Frame 2
  const photoScale = Math.min((W - 32) / 884, (0.5 * H) / 920);
  const photoTop = navBottom + 8;
  const photoLeft = (W - 884 * photoScale) / 2;
  const photoBottom = photoTop + 920 * photoScale;
  const can2Scale = Math.min(0.5 * H, 1.15 * W) / CAN.h;
  const can2 = { x: W * 0.7, y: photoBottom + 0.02 * H };
  const taglineTop = photoBottom + 22;
  const taglineScale = Math.min((0.6 * W) / 594, (H - taglineTop - 28) / 688);

  // Frame 3
  const infoScale = 0.9;
  const dotsGap = 40;
  const cH = Math.min(H - navBottom - 36 - 101 * infoScale - 48 - dotsGap, 1.15 * W);
  const gs = cH / CAN.h;
  const canTop = navBottom + Math.max(0, (H - navBottom - 36 - 101 * infoScale - 48 - dotsGap - cH) / 2);
  const canBottom = canTop + cH;
  const sideBottom = canBottom - 45 * gs;
  const infoTop = canBottom + 35.5 * gs;
  const dotsY = infoTop + 101 * infoScale + 22;
  const side = (dir: number, h: number, dx: number): Slot => ({
    x: W / 2 + dir * dx * W,
    y: sideBottom - h / 2,
    h,
    ix: W / 2 + dir * dx * W,
    iy: infoTop,
    is: 0.7,
  });
  const slots: Slot[] = [
    side(-1, 0.42 * cH, 1.15),
    side(-1, 0.5 * cH, 0.8),
    side(-1, 0.62 * cH, 0.41),
    { x: W / 2, y: canTop + cH / 2, h: cH, ix: W / 2, iy: infoTop, is: infoScale },
    side(1, 0.62 * cH, 0.41),
    side(1, 0.5 * cH, 0.8),
    side(1, 0.42 * cH, 1.15),
  ];

  // The glyphs' optical centre sits 55.5 units below the text box centre.
  const wordY = posterCy - 55.5 * hs;
  const SPOT = 600;

  return {
    mode: "tall",
    W,
    H,
    s,
    ox: 0,
    oy: 0,
    pad: 0,
    ui: 1,
    labelX: LABEL_X,
    slots,
    infoFade: "center",
    elements: {
      spot: {
        origin: [0.5, 0.5],
        poses: [
          { x: W / 2, y: posterCy, scale: (1.3 * W) / SPOT },
          { x: can2.x, y: can2.y, scale: (1.05 * W) / SPOT, opacity: 0.75 },
          { x: W / 2, y: canTop + cH / 2, scale: (1.3 * W) / SPOT },
        ],
      },
      hint: {
        origin: [0.5, 1],
        poses: [
          { x: W / 2, y: hintY },
          { x: W / 2, y: hintY - H, opacity: 0 },
          { x: W / 2, y: hintY - H, opacity: 0 },
        ],
      },
      dots: { origin: [0.5, 0], poses: below({ x: W / 2, y: dotsY }, H) },
      header: {
        origin: [0.5, 0.5],
        poses: [
          { x: W / 2, y: wordY, scale: hs },
          { x: W / 2, y: wordY - H, scale: hs },
          { x: W / 2, y: wordY - H, scale: hs },
        ],
      },
      // Copy and CTAs leave together (same distance) and fade, so the stacked block can never overlap itself.
      subtext: {
        origin: [0.5, 1],
        width: subtextW,
        align: "center",
        poses: [
          { x: W / 2, y: subtextY },
          { x: W / 2, y: subtextY - H, opacity: 0 },
          { x: W / 2, y: subtextY - H, opacity: 0 },
        ],
      },
      cta: {
        origin: [0.5, 1],
        poses: [
          { x: W / 2, y: ctaY },
          { x: W / 2, y: ctaY - H, opacity: 0 },
          { x: W / 2, y: ctaY - H, opacity: 0 },
        ],
      },
      // Social links live in the menu on portrait.
      social: { origin: [0.5, 1], poses: hiddenEverywhere(W / 2, H + 120) },
      hero: {
        origin: [0.5, 0],
        poses: [
          { x: W / 2, y: photoTop + H * 1.05, scale: photoScale },
          { x: W / 2, y: photoTop, scale: photoScale },
          { x: W / 2, y: photoTop - H * 1.15, scale: photoScale },
        ],
      },
      tagline: {
        origin: [0, 0],
        poses: [
          { x: photoLeft, y: taglineTop + H * 1.1, scale: taglineScale },
          { x: photoLeft, y: taglineTop, scale: taglineScale },
          { x: photoLeft, y: taglineTop - H * 1.1, scale: taglineScale },
        ],
      },
      can: {
        origin: [0.5, 0.5],
        poses: [
          { x: W / 2, y: posterCy, scale: can1Scale, rotation: 0 },
          { x: can2.x, y: can2.y, scale: can2Scale, rotation: -12 },
          { x: W / 2, y: canTop + cH / 2, scale: gs, rotation: 0 },
        ],
      },
      glow: { origin: [0.5, 0.5], poses: below({ x: W / 2 + 0.5 * gs, y: canBottom - 7.55 * gs, scale: gs }, H) },
      ...carouselElements(slots, H),
    },
  };
}
