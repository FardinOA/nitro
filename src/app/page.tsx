import NitroExperience from "@/components/nitro/NitroExperience";
import { firstFrame } from "@/components/nitro/layout";
import { centreWordmark } from "@/components/nitro/wordmark";

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
    </>
  );
}
