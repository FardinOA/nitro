import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { LABEL_PERIOD } from "./Can";

gsap.registerPlugin(Draggable, InertiaPlugin);

// The label repeats every panel, so wrapping by one period is invisible.
const wrapRoll = gsap.utils.wrap(-LABEL_PERIOD / 2, LABEL_PERIOD / 2);
// Idle spin: one label panel every 8 s.
const AUTO_SPIN_SPEED = LABEL_PERIOD / 8;

type Options = {
  can: HTMLElement;
  reduce: boolean;
  autoSpin?: boolean;
  onFirstRoll?: () => void;
};

// Grab-and-roll for the hero can. The pointer's travel is projected onto the can's
// circumferential axis (whatever its current rotation), so the print stays under the cursor.
export function createRoll({ can, reduce, autoSpin = false, onFirstRoll }: Options) {
  const roll = can.querySelector<HTMLElement>("[data-roll]")!;
  const strip = can.querySelector<HTMLElement>("[data-label]")!;
  // Touch: horizontal swipes roll, vertical ones keep scrolling the page.
  const touch = !window.matchMedia("(pointer: fine)").matches;
  const proxy = document.createElement("div");
  let offset = 0;
  let pressOffset = 0;
  let rolledOnce = false;
  let spinVelocity = 0;

  const apply = () => gsap.set(roll, { xPercent: wrapRoll(offset) });

  const update = (dx: number, dy: number) => {
    const angle = ((gsap.getProperty(can, "rotation") as number) * Math.PI) / 180;
    const along = touch ? dx : dx * Math.cos(angle) + dy * Math.sin(angle);
    const box = strip.getBoundingClientRect();
    const stripLength = Math.max(box.width, box.height);
    offset = pressOffset + (along / stripLength) * 100;
    apply();
  };

  const [draggable] = Draggable.create(proxy, {
    type: touch ? "x" : "x,y",
    trigger: can,
    inertia: !reduce,
    cursor: "grab",
    activeCursor: "grabbing",
    minimumMovement: 4,
    maxDuration: 2.5,
    onPressInit() {
      pressOffset = offset;
      gsap.set(proxy, { x: 0, y: 0 });
    },
    onDragStart() {
      if (!rolledOnce) {
        rolledOnce = true;
        onFirstRoll?.();
      }
    },
    onDrag() {
      update(this.x, this.y);
    },
    onThrowUpdate() {
      update(this.x, this.y);
    },
  });

  // Eases in/out so the idle spin never jerks when a drag or throw hands control back.
  const tick = (_time: number, deltaMs: number) => {
    const dt = deltaMs / 1000;
    const held = draggable.isPressed || draggable.isThrowing || !draggable.enabled();
    spinVelocity += ((held ? 0 : AUTO_SPIN_SPEED) - spinVelocity) * Math.min(1, dt * 2.5);
    if (held || Math.abs(spinVelocity) < 1e-4) return;
    offset += spinVelocity * dt;
    apply();
  };
  if (autoSpin) gsap.ticker.add(tick);

  const state = { offset: 0 };
  // Handing over to the carousel: turn the can to face front so the featured can never arrives mid-turn.
  const faceFront = () => {
    draggable.tween?.kill();
    state.offset = offset;
    gsap.to(state, {
      offset: Math.round(offset / LABEL_PERIOD) * LABEL_PERIOD,
      duration: reduce ? 0 : 0.9,
      ease: "power2.inOut",
      overwrite: true,
      onUpdate: () => {
        offset = state.offset;
        apply();
      },
    });
  };

  return {
    setEnabled(on: boolean) {
      if (on === draggable.enabled()) return;
      if (on) {
        gsap.killTweensOf(state);
        draggable.enable();
      } else {
        draggable.disable();
        faceFront();
      }
    },
    kill() {
      gsap.ticker.remove(tick);
      gsap.killTweensOf(state);
      draggable.kill();
    },
  };
}
