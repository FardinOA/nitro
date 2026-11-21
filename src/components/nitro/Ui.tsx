"use client";

import type { CSSProperties, MouseEvent } from "react";

export type StateIndex = 0 | 1 | 2;
export type GoTo = (state: StateIndex) => void;

export const NAV_LINKS: { label: string; href: string; state?: StateIndex }[] = [
  { label: "Home", href: "#home", state: 0 },
  { label: "Shop", href: "#shop", state: 2 },
  { label: "About", href: "#about", state: 1 },
  { label: "Gallery", href: "#gallery", state: 1 },
  { label: "Contact", href: "#contact" },
];

// Nav hugs the viewport top even when the stage is letterboxed.
const uiScale = (origin: string): CSSProperties => ({
  scale: "var(--ui, 1)",
  translate: "0 calc(var(--pad, 0) * -1px)",
  transformOrigin: origin,
});

// Figma 1:14 / 1:17 / 1:19: Outfit Medium 16/150%, text anchored 45px from the left and 10px from the top of a
// 44px-tall box. Box widths are fixed to Figma's (153 / 159) instead of padding + text width, so browser text
// metrics can't resize them. More info's stroke is Figma's 1px *inside* stroke, so its padding is 44 + 1px border.
const BTN =
  "box-border flex h-[44px] items-center text-[16px] leading-[1.5] font-medium whitespace-nowrap transition-colors duration-300";

function onNav(e: MouseEvent, goTo: GoTo, state?: StateIndex) {
  if (state === undefined) return;
  e.preventDefault();
  goTo(state);
}

export function Nav({ goTo, onMenu }: { goTo: GoTo; onMenu: () => void }) {
  return (
    <header>
      <a
        href="#home"
        data-nav
        onClick={(e) => onNav(e, goTo, 0)}
        className="absolute top-[35.5px] left-[88px] font-sakana text-[23.252px] leading-[1.6] tracking-[-0.6976px] whitespace-nowrap text-nitro group-data-[layout=tall]/stage:top-[30px] group-data-[layout=tall]/stage:left-[20px]"
        style={uiScale("0 50%")}
      >
        Nitro
      </a>

      <nav
        aria-label="Primary"
        data-nav
        className="absolute top-[42px] left-[496px] flex w-[848px] items-center justify-between text-[16px] leading-[1.5] whitespace-nowrap text-white group-data-[layout=tall]/stage:hidden"
        style={uiScale("50% 50%")}
      >
        {NAV_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={(e) => onNav(e, goTo, l.state)}
            className="relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-nitro after:transition-transform after:duration-300 hover:text-nitro hover:after:origin-left hover:after:scale-x-100"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <a
        href="#shop"
        data-nav
        onClick={(e) => onNav(e, goTo, 2)}
        className={`${BTN} absolute top-[32px] right-[87px] w-[153px] bg-nitro pl-[45px] text-black hover:bg-white group-data-[layout=tall]/stage:hidden`}
        style={uiScale("100% 50%")}
      >
        Buy Now
      </a>

      <button
        type="button"
        data-nav
        onClick={onMenu}
        aria-label="Open menu"
        className="absolute top-[22px] right-[20px] hidden size-11 flex-col items-center justify-center gap-[7px] group-data-[layout=tall]/stage:flex"
      >
        <span className="h-0.5 w-6 bg-nitro" />
        <span className="h-0.5 w-6 bg-nitro" />
      </button>
    </header>
  );
}

export function MobileMenu({ open, onClose, goTo }: { open: boolean; onClose: () => void; goTo: GoTo }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-50 flex flex-col bg-black px-5 pt-6 pb-10 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-sakana text-[23.252px] tracking-[-0.6976px] text-nitro">Nitro</span>
        <button type="button" onClick={onClose} aria-label="Close menu" className="relative size-11">
          <span className="absolute top-1/2 left-1/2 h-0.5 w-6 -translate-1/2 rotate-45 bg-nitro" />
          <span className="absolute top-1/2 left-1/2 h-0.5 w-6 -translate-1/2 -rotate-45 bg-nitro" />
        </button>
      </div>
      <nav aria-label="Mobile" className="mt-14 flex flex-col gap-2">
        {NAV_LINKS.map((l, i) => (
          <a
            key={l.label}
            href={l.href}
            onClick={(e) => {
              onClose();
              onNav(e, goTo, l.state);
            }}
            className={`font-sakana text-[44px] leading-[1.25] tracking-[-1.3px] text-white transition-all duration-500 hover:text-nitro ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className={`mt-auto mb-6 transition-opacity delay-300 duration-500 ${open ? "opacity-100" : "opacity-0"}`}>
        <SocialLinks />
      </div>
      <a
        href="#shop"
        onClick={(e) => {
          onClose();
          onNav(e, goTo, 2);
        }}
        className="flex items-center justify-center bg-nitro px-[45px] py-[14px] text-[16px] font-medium text-black"
      >
        Buy Now
      </a>
    </div>
  );
}

// Portrait-only stage pieces (positioned and shown by the layout engine).

// Stage light behind the hero can; takes the featured flavour's accent.
export function Spotlight() {
  return (
    <div
      aria-hidden
      className="size-[600px] rounded-full"
      style={{
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 30%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 45%, transparent 100%)",
      }}
    />
  );
}

const Chevron = ({ flip }: { flip?: boolean }) => (
  <svg aria-hidden viewBox="0 0 8 12" className={`h-3 w-2 text-nitro ${flip ? "rotate-180" : ""}`} fill="none">
    <path d="M6.5 1 1.5 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Affordance for grab-to-roll; fades out after the first spin.
export function SpinHint() {
  return (
    <p data-spin-hint="" className="flex items-center gap-3 text-[12px] font-medium tracking-[0.32em] whitespace-nowrap text-white/60 uppercase">
      <Chevron />
      <span>
        <span className="pointer-fine:hidden">Swipe</span>
        <span className="hidden pointer-fine:inline">Drag</span> to spin
      </span>
      <Chevron flip />
    </p>
  );
}

export function CarouselDots({ count, active }: { count: number; active: number }) {
  return (
    <div aria-hidden className="flex items-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-nitro" : "w-1.5 bg-white/30"}`}
        />
      ))}
    </div>
  );
}

export function CtaButtons({ goTo }: { goTo: GoTo }) {
  return (
    <div className="flex items-center gap-[33px]">
      <a
        href="#shop"
        onClick={(e) => onNav(e, goTo, 2)}
        className={`${BTN} w-[153px] bg-white pl-[45px] text-black hover:bg-nitro`}
      >
        Buy Now
      </a>
      <a
        href="#about"
        onClick={(e) => onNav(e, goTo, 1)}
        className={`${BTN} w-[159px] border border-white pl-[44px] text-white hover:border-nitro hover:text-nitro`}
      >
        More info
      </a>
    </div>
  );
}

const SOCIALS = [
  { label: "Facebook", src: "/figma/facebook.svg", box: "left-[8px] top-[8px] size-6", inset: "0" },
  { label: "Instagram", src: "/figma/instagram.svg", box: "left-1/2 top-1/2 size-6 -translate-1/2", inset: "12.5%", innerInset: "-5.56%" },
  { label: "X", src: "/figma/x.svg", box: "left-[8px] top-[8px] size-6", inset: "12.5% 15.11%", innerInset: "-4.17% -4.48%" },
  { label: "LinkedIn", src: "/figma/linkedin.svg", box: "left-1/2 top-1/2 size-6 -translate-1/2", inset: "0" },
];

export function SocialLinks() {
  return (
    <ul className="flex items-center gap-[32px]">
      {SOCIALS.map((s) => (
        <li key={s.label}>
          <a
            href="#"
            aria-label={s.label}
            className="group/icon relative block size-[42px] overflow-clip rounded-[35px] border border-nitro transition-colors duration-300 hover:bg-nitro"
          >
            <span className={`absolute overflow-clip ${s.box}`}>
              <span className="absolute" style={{ inset: s.inset }}>
                {/* Figma SVG used as an alpha mask so the icon takes the current accent. */}
                <span
                  className="absolute bg-nitro transition-colors duration-300 group-hover/icon:bg-black"
                  style={{
                    inset: s.innerInset ?? "0",
                    maskImage: `url(${s.src})`,
                    maskSize: "100% 100%",
                    WebkitMaskImage: `url(${s.src})`,
                    WebkitMaskSize: "100% 100%",
                  }}
                />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ProductInfo({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex w-[168px] flex-col items-center gap-[3px] text-center leading-[1.5] break-words">
      <div className="flex w-full flex-col items-center">
        <h3 className="w-full font-sakana text-[24px] text-white">{name}</h3>
        <p className="w-full text-[17px] text-muted">High intensity</p>
      </div>
      <p className="w-full text-[24px] font-extrabold text-white">{price}</p>
    </div>
  );
}
