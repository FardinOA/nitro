import Image from "next/image";
import type { CSSProperties } from "react";
import { CAN, PRODUCT_CAN, PRODUCT_LABEL_X } from "./layout";

type Box = { left: number; top: number; width: number; height: number };

const pct = (b: Box): CSSProperties => ({
  left: `${b.left}%`,
  top: `${b.top}%`,
  width: `${b.width}%`,
  height: `${b.height}%`,
});

// Figma "Ellipse 1": a blurred black ellipse rotated 90°, sitting along the can's right flank.
function CanShadow({ box, src, inset }: { box: Box; src: string; inset: string }) {
  return (
    <div aria-hidden className="absolute" style={{ ...pct(box), containerType: "size" }}>
      <div className="absolute top-1/2 left-1/2 h-[100cqw] w-[100cqh] -translate-x-1/2 -translate-y-1/2 -rotate-90">
        <div className="absolute" style={{ inset }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={src} className="block size-full max-w-none" />
        </div>
      </div>
    </div>
  );
}

// The Figma label strip (cover.jpg, 1705×1017) holds three unevenly spaced panels (logos at 310/842/1355px).
// label-panel.jpg is one 514px period cut around the middle logo, so repeating it gives an evenly spaced,
// seamless label. Geometry is in % of the label strip (object-cover fit by height crops 4.2px per side).
const SRC = { visible: 1017 * (1109.144 / 664.836), panelStart: 842 - 257 };
export const LABEL_PANEL = { src: "/figma/label-panel.jpg", width: 514, height: 1017 };
export const LABEL_PERIOD = (LABEL_PANEL.width / SRC.visible) * 100;
// Where a panel begins, in % of the strip; panels repeat every LABEL_PERIOD from here.
export const LABEL_ORIGIN = ((SRC.panelStart - (1705 - SRC.visible) / 2) / SRC.visible) * 100;
// Vertical extent of the printed label on the can (Figma "Cover" layer).
export const LABEL_TOP = 0.017307;

// Fixed studio lighting over the moving print: dark flanks, a specular band, a faint back-light.
const SHADE =
  "linear-gradient(90deg, rgb(0 0 0 / 0.62) 0%, rgb(0 0 0 / 0.22) 10%, transparent 26%, transparent 60%, rgb(0 0 0 / 0.28) 82%, rgb(0 0 0 / 0.66) 100%)";
const SPECULAR =
  "linear-gradient(90deg, transparent 17%, rgb(255 255 255 / 0.2) 25%, rgb(255 255 255 / 0.32) 28%, rgb(255 255 255 / 0.08) 33%, transparent 40%, transparent 76%, rgb(255 255 255 / 0.1) 84%, transparent 90%)";

function CanBody({
  sizes,
  tint,
  labelX,
  labelRef,
  priority,
}: {
  sizes: string;
  tint?: string;
  labelX?: number;
  labelRef?: boolean;
  priority?: boolean;
}) {
  return (
    <>
      <Image src="/figma/can.png" alt="" fill sizes={sizes} priority={priority} className="pointer-events-none object-cover" />
      {/* Print, drawn by labelRenderer onto a canvas with the cylinder warp; burned onto the silver can. */}
      <div aria-hidden className="can-mask absolute inset-0 mix-blend-color-burn">
        <canvas data-label-canvas="" className="absolute inset-0 size-full" />
        {tint && <div className="absolute inset-x-0 top-[1.7307%] bottom-0 mix-blend-hue" style={{ backgroundColor: tint }} />}
      </div>
      {/* Invisible transform drivers for the print offset: scroll pose (data-label), carousel + pointer turn (data-spin),
          intro (data-label-intro), grab-to-roll (data-roll). labelRenderer sums their translations every frame. */}
      <div
        aria-hidden
        data-strip=""
        data-label={labelRef ? "" : undefined}
        className="pointer-events-none invisible absolute top-[1.7307%] left-0 h-[98.2692%] w-[432.211%]"
        style={labelX === undefined ? undefined : { transform: `translateX(${labelX}%)` }}
      >
        <div data-spin="" className="absolute inset-0">
          <div data-label-intro={labelRef ? "" : undefined} className="absolute inset-0">
            <div data-roll="" className="absolute inset-0" />
          </div>
        </div>
      </div>
      <div aria-hidden className="can-mask pointer-events-none absolute inset-0" style={{ background: SHADE }} />
      <div aria-hidden className="can-mask pointer-events-none absolute inset-0 mix-blend-screen" style={{ background: SPECULAR }} />
      <div aria-hidden data-dim="" className="can-mask pointer-events-none absolute inset-0 bg-black opacity-0" />
    </>
  );
}

export function MainCan({ tint }: { tint?: string }) {
  return (
    <div className="relative isolate" style={{ width: CAN.w, height: CAN.h }}>
      {/* Floor shadow only shows when the carousel moves the hero can off the centre pedestal. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden
        data-floor=""
        src="/figma/shadow-lg.svg"
        className="absolute block max-w-none opacity-0"
        style={pct({ left: -2.578, top: 96.36, width: 109.596, height: 6.275 })}
      />
      <CanShadow
        src="/figma/can-shadow.svg"
        inset="-98.57% -9.54%"
        box={{ left: 75.4116, top: -6.2496, width: 26.0543, height: 102.1205 }}
      />
      <CanBody sizes="(min-width: 900px) 35vw, 80vw" tint={tint} labelRef priority />
    </div>
  );
}

export type Flavour = {
  key: "Eng" | "Red" | "Green" | "Sky" | "Blue";
  name: string;
  price: string;
  // Hue overlay on the green label art; Green is the untinted original.
  tint?: string;
  // Page accent while this flavour is featured; Blue is lifted from its tint so text stays legible on black.
  accent: string;
  floor: Box & { src: string };
};

// Figma row order, left → right.
export const FLAVOURS: Flavour[] = [
  { key: "Eng", name: "Nitro ENG", price: "10.58 $", tint: "#ff8000", accent: "#ff8000", floor: { src: "/figma/shadow-sm.svg", left: 2.8177, top: 96.52, width: 100.802, height: 5.771 } },
  { key: "Red", name: "Nitro Red", price: "11.00 $", tint: "#ff0000", accent: "#ff1f1f", floor: { src: "/figma/shadow-lg.svg", left: -2.578, top: 96.36, width: 109.596, height: 6.275 } },
  { key: "Green", name: "Nitro Green", price: "12.00 $", accent: "#e0e600", floor: { src: "/figma/shadow-lg.svg", left: -2.578, top: 96.36, width: 109.596, height: 6.275 } },
  { key: "Sky", name: "Nitro Sky", price: "11.00 $", tint: "#00b2ff", accent: "#00b2ff", floor: { src: "/figma/shadow-lg.svg", left: -3.03, top: 96.36, width: 109.596, height: 6.275 } },
  { key: "Blue", name: "Nitro Blue", price: "10.58 $", tint: "#0004ff", accent: "#5c6bff", floor: { src: "/figma/shadow-sm.svg", left: -0.596, top: 96.52, width: 100.802, height: 5.771 } },
];

export function ProductCan({ flavour }: { flavour: Flavour }) {
  const { floor } = flavour;
  return (
    <div className="group/can relative" style={{ width: PRODUCT_CAN.w, height: PRODUCT_CAN.h }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden
        data-floor=""
        src={floor.src}
        className="absolute block max-w-none transition-transform duration-500 ease-out group-hover/can:scale-x-90"
        style={pct(floor)}
      />
      <div className="absolute inset-0 isolate transition-transform duration-500 ease-out group-hover/can:-translate-y-4">
        <CanShadow
          src="/figma/can-shadow-product.svg"
          inset="-98.48% -8.76%"
          box={{ left: 88.362, top: -6.243, width: 26.078, height: 111.259 }}
        />
        <CanBody sizes="(min-width: 900px) 12vw, 25vw" tint={flavour.tint} labelX={PRODUCT_LABEL_X} />
      </div>
    </div>
  );
}

export function CanGlow() {
  return (
    <div className="relative h-[40px] w-[265px]">
      {/* glow-green.svg inlined: same ellipse + drop shadow (dy 4, σ 14.95, 36%), shadow colour = accent. */}
      <div className="absolute" style={{ inset: "-64.75% -11.28% -84.75% -11.28%" }}>
      <svg aria-hidden viewBox="0 0 324.8 99.8" preserveAspectRatio="none" fill="none" className="block size-full overflow-visible text-nitro">
        <defs>
          <filter id="nitro-glow" x="0" y="0" width="324.8" height="99.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="14.95" />
            <feComposite in2="hardAlpha" operator="out" result="shadowAlpha" />
            <feFlood floodColor="currentColor" floodOpacity="0.36" />
            <feComposite in2="shadowAlpha" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <mask id="nitro-glow-stroke" fill="white">
            <path d="M294.9 45.9C294.9 56.9457 235.578 65.9 162.4 65.9C89.2223 65.9 29.9 56.9457 29.9 45.9C29.9 34.8543 89.2223 25.9 162.4 25.9C235.578 25.9 294.9 34.8543 294.9 45.9Z" />
          </mask>
        </defs>
        <g filter="url(#nitro-glow)">
          <ellipse cx="162.4" cy="45.9" rx="132.5" ry="20" fill="#828282" />
          <ellipse cx="162.4" cy="45.9" rx="132.5" ry="20" strokeWidth="6" stroke="#3C3C3C" mask="url(#nitro-glow-stroke)" />
        </g>
      </svg>
      </div>
    </div>
  );
}
