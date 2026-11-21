import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { CAROUSEL_ITEMS, slotAt, type Slot, type StageLayout } from "./layout";

gsap.registerPlugin(Draggable, InertiaPlugin);

const N = CAROUSEL_ITEMS.length;
// Turntable: each slot away from centre turns the can ~20° toward it (label slide, % of strip) and dims it.
const SPIN_PER_SLOT = 5;
const DIM_PER_SLOT = 0.22;
const wrapSlot = gsap.utils.wrap(-N / 2, N / 2);
const clamp01 = gsap.utils.clamp(0, 1);

function sample(slots: Slot[], s: number): Slot {
  const i0 = Math.min(2, Math.max(-3, Math.floor(s)));
  const t = s - i0;
  const a = slotAt(slots, i0);
  const b = slotAt(slots, i0 + 1);
  const lerp = (k: keyof Slot) => a[k] + (b[k] - a[k]) * t;
  return { x: lerp("x"), y: lerp("y"), h: lerp("h"), ix: lerp("ix"), iy: lerp("iy"), is: lerp("is") };
}

type Options = {
  section: HTMLElement;
  stage: HTMLElement;
  layout: StageLayout;
  reduce: boolean;
  onFocusChange: (itemIndex: number) => void;
  // Must synchronously rotate the flavour shown by every slot by `steps`.
  onRebase: (steps: number) => void;
};

// Items keep their frame-3 pose element; the carousel only drives an inner [data-cr] wrapper,
// so at k = 0 every wrapper is identity and the scroll morph is untouched.
export function createCarousel({ section, stage, layout, reduce, onFocusChange, onRebase }: Options) {
  const q = gsap.utils.selector(section);
  const { slots } = layout;
  const state = { k: 0 };
  let active = false;

  const parts = CAROUSEL_ITEMS.map((item) => {
    const home = slotAt(slots, item.home);
    const info = q(`[data-el="${item.info}"] [data-cr]`)[0];
    gsap.set(info, { transformOrigin: "50% 0%" });
    return {
      item,
      home,
      homeScale: home.h / item.baseH,
      can: q(`[data-el="${item.can}"] [data-cr]`)[0],
      floor: q(`[data-el="${item.can}"] [data-floor]`)[0],
      spin: q(`[data-el="${item.can}"] [data-spin]`)[0],
      dim: q(`[data-el="${item.can}"] [data-dim]`)[0],
      info,
    };
  });

  const render = () => {
    for (const p of parts) {
      const s = wrapSlot(p.item.home - state.k);
      const g = sample(slots, s);
      const edge = clamp01((N / 2 - Math.abs(s)) / 0.5);
      gsap.set(p.can, {
        x: (g.x - p.home.x) / p.homeScale,
        y: (g.y - p.home.y) / p.homeScale,
        scale: g.h / p.home.h,
        autoAlpha: edge,
      });
      gsap.set(p.info, {
        x: (g.ix - p.home.ix) / p.home.is,
        y: (g.iy - p.home.iy) / p.home.is,
        scale: g.is / p.home.is,
        autoAlpha: layout.infoFade === "edge" ? edge : clamp01(1 - Math.abs(s)),
      });
      if (p.floor) gsap.set(p.floor, { opacity: clamp01(Math.abs(s)) });
      gsap.set(p.spin, { xPercent: -s * SPIN_PER_SLOT });
      gsap.set(p.dim, { opacity: Math.min(0.5, Math.abs(s) * DIM_PER_SLOT) });
    }
  };

  const announce = () => {
    const k = Math.round(state.k);
    const focused = parts.findIndex((p) => Math.round(wrapSlot(p.item.home - k)) === 0);
    if (focused >= 0) onFocusChange(focused);
  };

  // Swap content instead of positions: every slot takes the flavour currently on screen there,
  // so the featured flavour ends up in the hero can that morphs back up the page. No visual jump.
  const rebase = () => {
    gsap.killTweensOf(state);
    draggable.tween?.kill();
    const steps = Math.round(state.k);
    state.k = 0;
    if (steps % N !== 0) onRebase(steps);
    render();
    announce();
  };

  const animateTo = (k: number, duration: number) => {
    gsap.to(state, {
      k,
      duration: reduce ? 0 : duration,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: render,
      onComplete: announce,
    });
  };

  const step = (delta: number) => animateTo(Math.round(state.k) + delta, 0.9);

  const spacing = () => (slotAt(slots, 1).x - slotAt(slots, 0).x) * layout.s;
  const proxy = document.createElement("div");
  const MAX_THROW = 2;
  let pressK = 0;

  const [draggable] = Draggable.create(proxy, {
    type: "x",
    trigger: section,
    inertia: !reduce,
    minimumMovement: 6,
    minDuration: 0.4,
    maxDuration: 1.2,
    overshootTolerance: 0,
    // A hard fling advances at most MAX_THROW slots instead of spinning the whole loop.
    snap: {
      x: (v: number) => {
        const start = Math.round(pressK);
        const k = gsap.utils.clamp(start - MAX_THROW, start + MAX_THROW, Math.round(-v / spacing()));
        return -k * spacing();
      },
    },
    onPressInit() {
      gsap.killTweensOf(state);
      pressK = state.k;
      gsap.set(proxy, { x: -state.k * spacing() });
    },
    onDrag() {
      state.k = -this.x / spacing();
      render();
    },
    onThrowUpdate() {
      state.k = -this.x / spacing();
      render();
    },
    onThrowComplete: announce,
    onDragEnd() {
      if (reduce) animateTo(Math.round(state.k), 0);
    },
    onClick(e: PointerEvent) {
      if ((e.target as Element).closest("a, button")) return;
      const x = (this.pointerX - stage.getBoundingClientRect().left) / layout.s;
      let best = 0;
      for (let s = -2; s <= 2; s++) {
        if (Math.abs(slotAt(slots, s).x - x) < Math.abs(slotAt(slots, best).x - x)) best = s;
      }
      if (best) step(best);
    },
  });
  draggable.disable();

  const onKey = (e: KeyboardEvent) => {
    if (!active || (e.target as Element).closest?.('[role="dialog"]')) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };
  window.addEventListener("keydown", onKey);

  render();

  return {
    rebase,
    setActive(next: boolean) {
      if (next === active) return;
      active = next;
      if (next) {
        draggable.enable();
        return;
      }
      draggable.disable();
      rebase();
    },
    kill() {
      window.removeEventListener("keydown", onKey);
      gsap.killTweensOf(state);
      draggable.kill();
    },
  };
}
