// The NITRO glyphs are italic and tightly tracked, so their ink isn't centred in the text box (it sits ~36 units
// right), and the exact offset depends on the browser's font rasterising. Measure the real ink extent — DOM gives
// where the first/last glyph start, canvas gives how far each glyph's ink reaches — and shift the text so the
// visible lettering is centred on the box, which the layout centres on the stage.
// Also serialised into the pre-hydration boot script, so it must stay self-contained.
export function centreWordmark(h1: HTMLElement | undefined) {
  const text = h1?.firstChild;
  if (!h1 || !(text instanceof Text)) return;
  const first = text.data.search(/\S/);
  const last = text.data.trimEnd().length - 1;
  const ctx = document.createElement("canvas").getContext("2d");
  if (first < 0 || !ctx) return;
  const cs = getComputedStyle(h1);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const glyph = (i: number) => (cs.textTransform === "uppercase" ? text.data[i].toUpperCase() : text.data[i]);
  const range = document.createRange();
  const startOf = (i: number) => {
    range.setStart(text, i);
    range.setEnd(text, i + 1);
    return range.getBoundingClientRect().left;
  };
  const box = h1.getBoundingClientRect();
  const k = box.width / h1.offsetWidth;
  if (!k) return;
  const inkL = (startOf(first) - box.left) / k - ctx.measureText(glyph(first)).actualBoundingBoxLeft;
  const inkR = (startOf(last) - box.left) / k + ctx.measureText(glyph(last)).actualBoundingBoxRight;
  const dx = (inkL + inkR) / 2 - h1.offsetWidth / 2;
  if (Number.isFinite(dx)) h1.style.translate = `${-dx}px 0`;
}
