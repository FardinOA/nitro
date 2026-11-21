import gsap from "gsap";
import { LABEL_ORIGIN, LABEL_PANEL, LABEL_PERIOD, LABEL_TOP } from "./Can";

// Paints each can's printed label onto a canvas, wrapped around a cylinder: the screen column at u ∈ [-1, 1]
// (across the can) shows the flat label at arc length R·(1 + asin(u)), so print squeezes toward the edges and
// sliding it reads as rotation. Canvas instead of an SVG displacement filter: identical in every browser and GPU path.

const MAX_SLICES = 240;
const MAX_BACKING = 2400;
const RESIZE_STEP = 0.2;

type Target = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  box: HTMLElement;
  drivers: HTMLElement[];
  lastKey: string;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

// Total horizontal translation (local px) of the nested driver elements.
function printOffset(drivers: HTMLElement[]) {
  let px = 0;
  for (const el of drivers) {
    px += (gsap.getProperty(el, "x") as number) + ((gsap.getProperty(el, "xPercent") as number) / 100) * el.offsetWidth;
  }
  return px;
}

function draw(t: Target, img: HTMLImageElement, offset: number) {
  const { canvas, ctx, box } = t;
  const bw = canvas.width;
  const bh = canvas.height;
  const canW = box.offsetWidth;
  const stripW = t.drivers[0].offsetWidth;
  const period = (LABEL_PERIOD / 100) * stripW;
  const origin = (LABEL_ORIGIN / 100) * stripW;
  const radius = canW / 2;
  const top = LABEL_TOP * bh;
  const labelH = bh - top;
  const slices = Math.min(bw, MAX_SLICES);
  const sliceW = bw / slices;
  const toPanel = LABEL_PANEL.width / period;

  ctx.clearRect(0, 0, bw, bh);
  for (let i = 0; i < slices; i++) {
    const u0 = -1 + (2 * i) / slices;
    const u1 = -1 + (2 * (i + 1)) / slices;
    const s0 = radius * (1 + Math.asin(u0)) - offset;
    const s1 = radius * (1 + Math.asin(u1)) - offset;
    const src = mod(s0 - origin, period) * toPanel;
    const span = (s1 - s0) * toPanel;
    const dx = i * sliceW;
    // +0.6px overlap hides anti-aliasing hairlines between slices.
    if (src + span <= LABEL_PANEL.width) {
      ctx.drawImage(img, src, 0, span, LABEL_PANEL.height, dx, top, sliceW + 0.6, labelH);
    } else {
      const first = LABEL_PANEL.width - src;
      const split = sliceW * (first / span);
      ctx.drawImage(img, src, 0, first, LABEL_PANEL.height, dx, top, split + 0.6, labelH);
      ctx.drawImage(img, 0, 0, span - first, LABEL_PANEL.height, dx + split, top, sliceW - split + 0.6, labelH);
    }
  }
}

// Backing resolution follows the can's on-screen size (it scales ~1.3–2.2× across the scroll),
// resized only in 20% steps so scrolling doesn't reallocate every frame.
function fitBacking(t: Target) {
  const rect = t.box.getBoundingClientRect();
  const w = t.box.offsetWidth;
  const h = t.box.offsetHeight;
  if (!w || !h) return false;
  const screenScale = Math.sqrt((rect.width * rect.height) / (w * h)) || 1;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const k = Math.min(screenScale * dpr, MAX_BACKING / h);
  const bw = Math.max(1, Math.round(w * k));
  const bh = Math.max(1, Math.round(h * k));
  if (t.canvas.width > 1 && Math.abs(bh - t.canvas.height) / t.canvas.height < RESIZE_STEP) return false;
  t.canvas.width = bw;
  t.canvas.height = bh;
  return true;
}

export function createLabelRenderer(scope: HTMLElement) {
  const img = new Image();
  img.src = LABEL_PANEL.src;
  let ready = false;
  img
    .decode()
    .then(() => (ready = true))
    .catch(() => (ready = img.complete));

  const targets: Target[] = [...scope.querySelectorAll<HTMLCanvasElement>("[data-label-canvas]")].map((canvas) => {
    const box = canvas.parentElement!;
    const strip = box.parentElement!.querySelector<HTMLElement>(":scope > [data-strip]")!;
    const spin = strip.firstElementChild as HTMLElement;
    const intro = spin.firstElementChild as HTMLElement;
    const roll = intro.firstElementChild as HTMLElement;
    return { canvas, ctx: canvas.getContext("2d")!, box, drivers: [strip, spin, intro, roll], lastKey: "" };
  });

  let frame = 0;
  const tick = () => {
    if (!ready) return;
    // Re-check backing size a few times a second; offsets every frame.
    const checkSize = frame++ % 10 === 0;
    for (const t of targets) {
      const resized = (checkSize || t.canvas.width <= 1) && fitBacking(t);
      const offset = printOffset(t.drivers);
      const key = `${offset.toFixed(2)}|${t.canvas.width}`;
      if (!resized && key === t.lastKey) continue;
      t.lastKey = key;
      draw(t, img, offset);
    }
  };
  gsap.ticker.add(tick);

  return {
    kill() {
      gsap.ticker.remove(tick);
    },
  };
}
