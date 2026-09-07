import fs from "node:fs/promises";
const folder = "review-artifacts/quality-pass";
const stages = [
  "title",
  "ready",
  "fire",
  "track",
  "glass",
  "fabric",
  "material",
  "impact",
  "assembly",
  "exploded",
  "finished",
];
for (const pass of ["before", "after"])
  for (const width of [1280, 1440, 1920])
    for (const stage of stages) {
      await fs.access(folder + "/" + pass + "/" + width + "-" + stage + ".png");
    }
const html =
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redline — Second-pass visual review</title><style>body{margin:0;padding:32px;background:#080a0c;color:#f2f0ea;font:16px/1.6 system-ui}h1{font-size:28px;margin:0}p{max-width:90ch;color:#adb5bb}nav{display:flex;gap:24px;flex-wrap:wrap;margin:28px 0}label{display:grid;gap:8px}select{font:inherit;color:inherit;background:#181d22;border:1px solid #626a70;padding:8px 12px;min-width:180px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;min-width:0}figcaption{padding:12px 0;border-top:2px solid #d22630}img{width:100%;height:auto;display:block}a{color:#d6dadf}a:focus-visible,select:focus-visible{outline:2px solid #d6dadf;outline-offset:4px}.links{display:flex;gap:24px;flex-wrap:wrap}@media(max-width:800px){main{grid-template-columns:1fr}body{padding:20px}}</style><h1>REDLINE / Visual-quality pass</h1><p>Matching viewport and normalized story positions. Before: original development build. After: upgraded static production export. Both comparison sets use Chromium with its default software renderer; accelerated interaction and performance evidence is available separately.</p><nav><label>Viewport<select id="width"><option>1440</option><option>1280</option><option>1920</option></select></label><label>Story position<select id="stage">' +
  stages
    .map((s) => "<option" + (s === "exploded" ? " selected" : "") + ">" + s + "</option>")
    .join("") +
  '</select></label></nav><main><figure><figcaption>Before</figcaption><a id="before-link"><img id="before" alt="Original prototype at the selected story position"></a></figure><figure><figcaption>After</figcaption><a id="after-link"><img id="after" alt="Upgraded prototype at the same story position"></a></figure></main><p>Open either image for its full resolution. Viewports: 1280 × 720, 1440 × 900, 1920 × 1080.</p><p class="links"><a href="performance.json">Accelerated production measurements</a><a href="interaction/inspector-seat-structure.png">Structure selection</a><a href="interaction/phone-product.png">Phone product view</a><a href="interaction/webgl-unavailable.png">WebGL unavailable</a></p><p>All geometry, material behavior, and construction shown remain conceptual. No verified ballistic performance is established by this review.</p><script>const w=document.getElementById("width"),s=document.getElementById("stage");function update(){for(const pass of ["before","after"]){const path=pass+"/"+w.value+"-"+s.value+".png";document.getElementById(pass).src=path;document.getElementById(pass+"-link").href=path}}w.addEventListener("change",update);s.addEventListener("change",update);update();</script></html>';
await fs.writeFile(folder + "/index.html", html);
console.log("Verified all 66 comparison frames; gallery saved.");
