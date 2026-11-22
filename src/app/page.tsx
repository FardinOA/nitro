import NitroExperience from "@/components/nitro/NitroExperience";
import { firstFrame } from "@/components/nitro/layout";
import { centreWordmark } from "@/components/nitro/wordmark";
import { FLAVOURS } from "@/components/nitro/Can";
import { SITE, SITE_URL } from "@/site";

// Structured data: the brand, the site, and the five flavours as products with prices (from the same FLAVOURS
// the carousel renders, so they can't drift).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE.name,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      foundingDate: SITE.foundingYear,
      slogan: SITE.tagline,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#flavours`,
      name: `${SITE.name} flavours`,
      itemListElement: FLAVOURS.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: f.name,
          description: `${f.name} — ${SITE.tagline.toLowerCase()} energy drink.`,
          category: "Energy drink",
          image: `${SITE_URL}/opengraph-image.jpg`,
          brand: { "@type": "Brand", name: SITE.name },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/#shop`,
            price: parseFloat(f.price).toFixed(2),
            priceCurrency: SITE.currency,
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
  ],
};

// Runs as soon as the stage HTML is parsed, before React hydrates: poses the stage and the NITRO wordmark exactly
// where the layout engine will, and reveals just the wordmark. It is the LCP element, so it paints without waiting
// for the JS bundle; NitroExperience sees data-pre and plays the rest of the intro around it.
const boot = `(function(firstFrame,centreWordmark){
var sec=document.getElementById("home");
var stage=sec&&sec.querySelector("[data-stage]");
var wrap=sec&&sec.querySelector('[data-intro="header"]');
var el=wrap&&wrap.querySelector('[data-el="header"]');
if(!el)return;
var f=firstFrame(sec.clientWidth,sec.offsetHeight);
sec.dataset.layout=f.wide?"wide":"tall";
stage.style.width=f.W+"px";
stage.style.height=f.H+"px";
stage.style.transform="translate("+f.ox+"px,"+f.oy+"px) scale("+f.s+")";
el.style.transformOrigin="50% 50%";
el.style.transform="translate(-50%,-50%) translate("+f.x+"px,"+f.y+"px) scale("+f.scale+")";
var h1=el.querySelector("h1");
var shown=false;
function reveal(){
if(shown||"live" in sec.dataset)return;
shown=true;
centreWordmark(h1);
wrap.style.visibility="visible";
sec.dataset.pre="";
}
// Reveal on the real Sakana glyphs (preloaded, so usually a few hundred ms) — no fallback-font flash, and no
// later re-paint for Chrome to count as a bigger LCP. Never wait more than 1.5s on the font.
var cs=getComputedStyle(h1);
if(document.fonts&&document.fonts.load)document.fonts.load(cs.fontSize+" "+cs.fontFamily,"Nitro").then(reveal,reveal);
else reveal();
setTimeout(reveal,1500);
})(${firstFrame.toString()},${centreWordmark.toString()})`;

export default function Home() {
  return (
    <>
      <NitroExperience />
      <script dangerouslySetInnerHTML={{ __html: boot }} />
      {/* `<` escaped so no string in the payload can close the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
