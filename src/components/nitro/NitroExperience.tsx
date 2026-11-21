"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { CanGlow, FLAVOURS, LABEL_PERIOD, MainCan, ProductCan } from "./Can";
import { createLabelRenderer } from "./labelRenderer";
import { createCarousel } from "./carousel";
import { createRoll } from "./roll";
import { CAROUSEL_ITEMS, HERO_ITEM, computeLayout, type ElementKey, type Pose, type StageLayout } from "./layout";
import { CarouselDots, CtaButtons, MobileMenu, Nav, ProductInfo, SocialLinks, SpinHint, Spotlight, type GoTo } from "./Ui";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin, CustomEase);

// Figma prototype: Smart Animate, EASE_IN_AND_OUT, 2.3s.
const FIGMA_DURATION = 2.3;
let figmaEase: gsap.EaseFunction | undefined;
const getFigmaEase = () => (figmaEase ??= CustomEase.create("figmaEaseInOut", "0.42,0,0.58,1"));

// Intro spins the hero label exactly one panel, so it lands on the Figma pose.
const LABEL_PANEL_SHIFT = LABEL_PERIOD;
// Pointer-driven turn, as a fraction of the label strip width.
const POINTER_TURN = 0.04;

function Layer({
  k,
  intro,
  carousel,
  className = "",
  children,
}: {
  k: ElementKey;
  intro?: boolean;
  carousel?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-intro={intro ? k : undefined} className="pointer-events-none absolute inset-0">
      <div data-el={k} className={`pointer-events-auto absolute top-0 left-0 ${className}`}>
        {carousel ? <div data-cr="">{children}</div> : children}
      </div>
    </div>
  );
}

// Carousel is live only once the scroll has fully settled on frame 3.
const CAROUSEL_THRESHOLD = 0.995;

const toVars = (p: Pose) => ({ x: p.x, y: p.y, scale: p.scale ?? 1, rotation: p.rotation ?? 0, autoAlpha: p.opacity ?? 1 });

export default function NitroExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Rotation maps carousel slot i → FLAVOURS[i + rotation]; it changes when the carousel rebases.
  const [rotation, setRotation] = useState(0);
  const [focusedItem, setFocusedItem] = useState(HERO_ITEM);
  const flavourAt = (i: number) => FLAVOURS[gsap.utils.wrap(0, FLAVOURS.length, i + rotation)];
  const accent = flavourAt(focusedItem).accent;

  // The whole page (incl. the mobile menu outside the stage) reads --accent from :root.
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to(document.documentElement, { "--accent": accent, duration: reduce ? 0 : 0.6, ease: "power2.out", overwrite: true });
    },
    { dependencies: [accent] },
  );

  const goTo = useCallback<GoTo>((state) => {
    const st = triggerRef.current;
    if (!st) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(window, {
      scrollTo: st.labelToScroll(`s${state + 1}`),
      duration: reduce ? 0 : FIGMA_DURATION,
      ease: getFigmaEase(),
      overwrite: true,
    });
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current!;
      const stage = stageRef.current!;
      const q = gsap.utils.selector(section);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      ScrollTrigger.config({ ignoreMobileResize: true });
      let carouselApi: ReturnType<typeof createCarousel> | undefined;

      const build = (playIntro: boolean) => {
        const L: StageLayout = computeLayout(section.clientWidth, section.offsetHeight);
        section.dataset.layout = L.mode;
        gsap.set(stage, { width: L.W, height: L.H, x: L.ox, y: L.oy, scale: L.s, transformOrigin: "0 0", "--ui": L.ui, "--pad": L.pad });

        const keys = Object.keys(L.elements) as ElementKey[];
        const tl = gsap.timeline({ paused: true, defaults: { ease: getFigmaEase(), duration: 1 } });
        tl.addLabel("s1", 0);

        for (const key of keys) {
          const el = q(`[data-el="${key}"]`)[0];
          const spec = L.elements[key];
          const [ox, oy] = spec.origin;
          gsap.set(el, {
            xPercent: -ox * 100,
            yPercent: -oy * 100,
            transformOrigin: `${ox * 100}% ${oy * 100}%`,
            ...(spec.width ? { width: spec.width } : {}),
            ...(spec.align ? { textAlign: spec.align } : {}),
            ...toVars(spec.poses[0]),
          });
          tl.to(el, toVars(spec.poses[1]), 0).to(el, toVars(spec.poses[2]), 1);
        }

        const label = q("[data-label]")[0];
        gsap.set(label, { xPercent: L.labelX[0] });
        tl.to(label, { xPercent: L.labelX[1] }, 0).to(label, { xPercent: L.labelX[2] }, 1);
        tl.addLabel("s2", 1).addLabel("s3", 2);

        const carousel = createCarousel({
          section,
          stage,
          layout: L,
          reduce,
          onFocusChange: setFocusedItem,
          // Sync so the new flavours are in the DOM before the carousel resets positions this frame.
          onRebase: (steps) =>
            flushSync(() => {
              setRotation((r) => r + steps);
              setFocusedItem(HERO_ITEM);
            }),
        });
        carouselApi = carousel;
        const labels = createLabelRenderer(section);
        const roll = createRoll({
          can: q('[data-el="can"]')[0],
          reduce,
          // Portrait has no pointer to turn the can, so it idles in a slow spin instead.
          autoSpin: L.mode === "tall" && !reduce,
          onFirstRoll: () => gsap.to(q("[data-spin-hint]"), { autoAlpha: 0, y: 8, duration: 0.5, ease: "power2.out" }),
        });
        // Exactly one drag owner: the carousel on frame 3, grab-to-roll everywhere else.
        const setDragMode = (progress: number) => {
          const inCarousel = progress >= CAROUSEL_THRESHOLD;
          carousel.setActive(inCarousel);
          roll.setEnabled(!inCarousel);
        };

        triggerRef.current = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${section.offsetHeight * 2.4}`,
          pin: true,
          anticipatePin: 1,
          scrub: reduce ? true : 0.8,
          animation: tl,
          snap: reduce ? undefined : { snapTo: "labels", duration: { min: 0.35, max: 1.1 }, delay: 0.05, ease: "power2.inOut" },
          onUpdate: (self) => setDragMode(self.progress),
          onRefresh: (self) => setDragMode(self.progress),
        });

        if (playIntro && !reduce) {
          const canPose = L.elements.can.poses[0];
          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .fromTo(stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "none" })
            .from(q("[data-nav]"), { y: -24, autoAlpha: 0, duration: 1, stagger: 0.07 }, 0.15)
            .from(q('[data-intro="header"]'), { y: 180, autoAlpha: 0, duration: 1.6 }, 0.1)
            .from(
              q('[data-intro="can"]'),
              { y: 320, scale: 0.75, autoAlpha: 0, duration: 1.8, transformOrigin: `${canPose.x}px ${canPose.y}px` },
              0.25,
            )
            .from(q("[data-label-intro]"), { xPercent: -LABEL_PANEL_SHIFT, duration: 2.2, ease: "power3.out" }, 0.25)
            .from(
              q('[data-intro="hint"], [data-intro="subtext"], [data-intro="cta"], [data-intro="social"]'),
              { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1 },
              0.7,
            );
        } else {
          gsap.set(stage, { autoAlpha: 1 });
        }

        // Pointer turns every can a little on its axis (label slide, ±~12°) — reads as a real cylinder.
        let removePointer = () => {};
        if (!reduce && window.matchMedia("(pointer: fine)").matches) {
          const spins = q("[data-spin]");
          const turn = spins.map((el) => gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }));
          const onPointer = (e: PointerEvent) => {
            const n = (e.clientX / window.innerWidth - 0.5) * 2;
            spins.forEach((el, i) => turn[i](n * POINTER_TURN * el.offsetWidth));
          };
          window.addEventListener("pointermove", onPointer);
          removePointer = () => window.removeEventListener("pointermove", onPointer);
        }

        return () => {
          removePointer();
          roll.kill();
          labels.kill();
          carousel.kill();
        };
      };

      let ctx = gsap.context(() => build(true), section);
      let lastW = section.clientWidth;
      let lastH = section.offsetHeight;
      let timer: ReturnType<typeof setTimeout>;

      const onResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const w = section.clientWidth;
          const h = section.offsetHeight;
          if (w === lastW && h === lastH) return;
          lastW = w;
          lastH = h;
          const progress = triggerRef.current?.progress ?? 0;
          carouselApi?.rebase();
          ctx.revert();
          ctx = gsap.context(() => build(false), section);
          const st = triggerRef.current!;
          window.scrollTo(0, st.start + progress * (st.end - st.start));
        }, 180);
      };

      window.addEventListener("resize", onResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        ctx.revert();
      };
    },
    { scope: sectionRef },
  );

  return (
    <main>
      <section
        ref={sectionRef}
        id="home"
        aria-label="Nitro energy drink"
        className="group/stage relative h-svh w-full overflow-hidden bg-black"
        style={{ backgroundImage: "var(--nitro-bg)", backgroundSize: "100% 100%" }}
      >
        <div ref={stageRef} className="invisible absolute top-0 left-0 origin-top-left">
          <Layer k="spot">
            <Spotlight />
          </Layer>
          <Layer k="header" intro>
            {/* Glyphs overhang Figma's 1760px text box, so the box is padded by 120px each side.
                Solid accent text + a black copy masked by Figma's gradient = Figma's gradient in any flavour. */}
            <h1 className="relative h-[909px] w-[2000px] px-[120px] text-center font-sakana text-[568.386px] leading-[909px] tracking-[-17.0516px] whitespace-nowrap text-nitro">
              Nitro
              <span
                aria-hidden
                className="absolute inset-0 px-[120px] text-black"
                style={{
                  maskImage: "var(--nitro-text-shade)",
                  maskSize: "1760px 909px",
                  maskPosition: "120px 0",
                  maskRepeat: "no-repeat",
                  WebkitMaskImage: "var(--nitro-text-shade)",
                  WebkitMaskSize: "1760px 909px",
                  WebkitMaskPosition: "120px 0",
                  WebkitMaskRepeat: "no-repeat",
                }}
              >
                Nitro
              </span>
            </h1>
          </Layer>

          <Layer k="social" intro>
            <SocialLinks />
          </Layer>
          <Layer k="cta" intro>
            <CtaButtons goTo={goTo} />
          </Layer>
          <Layer k="subtext" intro className="w-[464px]">
            <p className="text-[16px] leading-[1.5] text-white uppercase">
              Worem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac.
            </p>
          </Layer>

          <Layer k="hint" intro>
            <SpinHint />
          </Layer>

          <Layer k="hero">
            <div id="about" className="relative h-[920px] w-[884px] overflow-hidden rounded-[40px] bg-white">
              <Image src="/figma/hero.png" alt="Footballer dribbling a ball, black and white" fill sizes="(min-width: 900px) 46vw, 92vw" className="object-cover" />
            </div>
          </Layer>

          <Layer k="glow">
            <CanGlow />
          </Layer>
          <Layer k="can" intro carousel>
            <MainCan tint={flavourAt(HERO_ITEM).tint} />
          </Layer>

          <Layer k="tagline">
            <h2 className="w-[594px] font-sakana text-[185px] leading-[172.3px] tracking-[-5.55px] break-words text-nitro">
              <span className="block">Since</span>
              <span className="block">2002</span>
              <span className="block">producing</span>
            </h2>
          </Layer>

          <div id="shop" role="region" aria-roledescription="carousel" aria-label="Flavours — drag, or use the arrow keys">
            {CAROUSEL_ITEMS.map((item, i) =>
              item.can === "can" ? null : (
                <Layer key={item.can} k={item.can} carousel>
                  <ProductCan flavour={flavourAt(i)} />
                </Layer>
              ),
            )}
            {CAROUSEL_ITEMS.map((item, i) => (
              <Layer key={item.info} k={item.info} carousel>
                <ProductInfo name={flavourAt(i).name} price={flavourAt(i).price} />
              </Layer>
            ))}
            <Layer k="dots">
              <CarouselDots count={FLAVOURS.length} active={gsap.utils.wrap(0, FLAVOURS.length, focusedItem + rotation)} />
            </Layer>
            <p aria-live="polite" className="sr-only">
              {flavourAt(focusedItem).name} featured
            </p>
          </div>

          <Nav goTo={goTo} onMenu={() => setMenuOpen(true)} />
        </div>
      </section>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} goTo={goTo} />
    </main>
  );
}
