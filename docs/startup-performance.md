# Cinematic startup performance

This audit applies to the Redline Bulletproof project in this checkout.
The supplied brief used the name NGV; no branding or authored desktop story was changed.
Measured on September 6, 2026, using a production static export, Chrome 152.0.7977.77, an Apple M5 Pro, and 48 GiB RAM.

## Confirmed findings before editing

- The first diagnostic Chrome visit recorded main-thread tasks of 544, 219, and 2,062 ms.
  CPU samples attributed the largest block to Three.js `WebGLProgram` first-use shader status/log access, with additional renderer/context creation and extension initialization.
  Subsequent shader-cache-warm visits were substantially faster, so that initial observation is not used as a repeatable before/after benchmark.
- The first diagnostic traversal reached approximately 24 rendered FPS with 1,357 and 848 ms tasks; the repeated traversal reached approximately 60 FPS.
  Later controlled baseline traversals still had a 60–97 ms first-use task that disappeared on the second pass.
- The 512 × 512 procedural map loops ran synchronously in React `useMemo` for six surface instances, including duplicate protective and upholstery generation.
  The controlled 4× CPU baseline contained a 663 ms startup task.
- Mobile was explicitly static: the cinematic media query required a fine pointer, width ≥960 px, height ≥640 px, and no reduced-motion preference.
  The new phone-width E2E test failed against that implementation before changes.
- Every GLB asset registry entry is null, and no GLB/GLTF or external scene texture downloads exist.
  There are no model files to compress, texture images to decode, or model-network bottlenecks in this prototype.
- The normal shell already uses server rendering and the canvas already uses a dynamic import.
  The 240 px intersection margin requests the scene near the title on a normal first visit.
  The initial shell bundle is not forced to include Three.js.
- The existing DPR cap is already 1.5, the story uses demand rendering and one pinned ScrollTrigger, and Lenis uses GSAP's ticker.
  No duplicate animation loop was found.
  Timeline values mutate the existing scene state; React state only changes when the chapter/phase value changes.
- The original canvas statistics reported the last bloom fullscreen pass (1 call / 2 triangles), not the entire frame.
  Those values cannot be used as a model-complexity measurement.
- The local static preview revalidated hashed JS on repeat visits.
  It returned about 3,300 bytes of revalidation overhead rather than downloading the JS bodies again.

## Changes and experiment ledger

| Experiment | Evidence and decision |
| --- | --- |
| Generate maps in a worker | Kept: worker-only desktop main-thread script time fell from 362 to 243 ms. All 12 color/normal/roughness arrays match the original generator byte for byte, checked against original SHA-256 hashes. |
| Compile shaders asynchronously only | Insufficient alone: later first-use uploads still produced a roughly 70 ms task. The final implementation also warms the actual lighting and tone-mapping paths under the poster. |
| Warm every object without matching lighting | Rejected: enabling the previously hidden flash light after compilation created different shaders and introduced 1,268 / 1,049 ms stalls. |
| Compile and render matching lighting variants | Kept: actual normal, opening, and flash lighting are prepared before reveal; controlled first and repeated traversals have no long tasks. Visibility, culling, and tone mapping are restored before normal rendering. |
| Start the worker after downloading Three.js | Rejected: the extra network waterfall delayed the throttled first frame. Worker preparation now overlaps the scene module download. |
| Cut texture resolution, polygons, shadows, or bloom | Not applied: runtime evidence did not justify degrading them. Texture dimensions, geometry, authored lighting, shadow maps, antialiasing, bloom intensity, and desktop timing remain unchanged. |
| Split story models into later network stages | Not applied: no downloaded scene assets exist, and the detached seat is also visible in the opening shot. The separately requested product inspector remains lazy. |
| Add generic hardware quality tiers | Not applied: the existing bounded DPR and mobile test results did not justify a new policy. CPU emulation on a desktop GPU cannot establish low-end physical-phone GPU limits. |

The loading poster remains until shader preparation and the first complete GPU frame, including the opening composer, finish.
The readiness check uses a nonblocking WebGL fence and does not impose a fixed timer.
The page navigation and illustrated-story escape remain available during preparation.
The document is not globally scroll-locked.

The texture worker transfers the original pixel buffers and terminates after preparation.
CPU pixel data is reused by surface kind; texture instances keep their existing disposal ownership.
No new runtime dependency was added.

The reload/resize tests also reproduced two navigation issues relevant to the requested validation.
Native restoration could clamp scroll against the shorter server HTML before pinning existed.
The story now stores its settled scroll position on the current history entry and restores it after layout initialization on reload.
Chapter jumps and restoration use the active Lenis controller when present, so a previous smooth anchor animation cannot override them.

## Mobile and accessibility

Phones now render the same ten-phase 3D story, including glass, fabric deformation, impact, seat assembly and exploded view, with all five chapter buttons.
Portrait CSS reserves space for the copy and frames the existing camera view beneath it; landscape has a compact layout.
The renderer remains capped at 1.5 DPR, including on the tested 3× display emulation.
Touch uses native scrolling; Lenis remains for desktop fine pointers.
The separate optional product inspector retains its existing desktop eligibility.

Reduced-motion users, visitors without JavaScript, scene failures and context loss receive the complete illustrated reading flow.
Mobile is no longer treated as a reduced-motion preference.

## Measurement methodology

`node scripts/startup-performance.mjs before` measures the original export.
Set `PREVIEW_URL` to select the server and use a different label for the optimized export.
Run one browser benchmark at a time.
Each configuration uses a new isolated Chrome context with a cleared HTTP cache for the first visit and the same context for the repeat visit.
The two scroll scans cover the same 7,800 px authored distance over four seconds each.
They measure observed requestAnimationFrame and canvas-render-counter changes, not a physical display's presented frames.

Configurations are desktop 1440 × 900 / DPR 1; the same desktop at 4× CPU slowdown; desktop at 150 ms latency and 200,000 download bytes/s; and touch 390 × 844 / device DPR 3.
Mobile GPU work still runs on the M5 Pro.
These are browser simulations, not physical-phone measurements or field data.

The main-window Resource Timing entries supply compressed response sizes and transfers.
Worker-owned imports are not included in that window's resource entries; the worker build files must also be counted when inspecting total wire traffic.
Main-thread script time is Chrome CDP `ScriptDuration` through readiness plus 1.8 seconds.
Hydration completion is not separately exposed by this production build; cinematic mode activation is only an external-store/hydration proxy.
No exact React hydration duration or field INP is claimed.

`node scripts/startup-trace.mjs before` saves a Chrome performance trace, CPU profile, and eight scene screenshots.
The original export is retained under ignored `review-artifacts/startup/baseline-out/`.
Raw traces and measurement JSON are under `review-artifacts/startup/`.
Shader-driver caches vary beyond an isolated HTTP cache, and an OS-wide GPU cache purge was not performed.

## Asset and renderer audit

There are four unique surface kinds and twelve 512 × 512 RGBA maps.
Six material consumers retain eighteen texture objects: approximately 24 MiB including full mip chains, excluding environment maps, shadows and composer targets.
CPU pixel data now shares four generated sets (12 MiB) instead of six sets (18 MiB).
No downloaded 4K/8K images or texture decode step is involved in these maps.
WebGL upload calls are measured separately; they were small relative to shader first use and the main-thread generator.

In the opening frame the corrected whole-frame counter reports 231 draw calls and 165,451 submitted triangles, including shadows and post-processing passes.
These are submitted primitives, not the unique polygon count of a GLB model.
The warmed renderer reports 197 geometries, 42 allocated textures including render targets, and 56 program variants.
Warming intentionally allocates later materials before reveal; this is not evidence of a leak.
The three-cycle E2E check verifies stable geometry allocations, one canvas and one pin per mounted experience, and teardown when reduced motion is enabled.
It does not prove that every driver allocation is reclaimed on every physical device.

`public/serve.json` adds one-year immutable caching only for hashed `/_next/static/**` resources in the local preview.
Unversioned public artwork retains normal revalidation.
S3/CloudFront deployment must set equivalent object metadata / cache behavior; the local `serve.json` is not interpreted by CloudFront.
No live deployment or CDN account was available to verify or change.

## Validation

The production build, TypeScript, ESLint and the 19 Vitest checks pass.
The browser suite has 22 passing tests and four existing platform-specific skips for desktop inspection / hardware-keyboard coverage.
It covers mobile chapters, reverse navigation, no-JavaScript content, reduced motion, context loss, readiness ordering, repeated remounts, resizing, halfway reload, back/forward history, the contact preview, and automated accessibility checks.
Final measurements and visual comparison are recorded below.

## Final measurements

These are single controlled visits per configuration, not medians or field percentiles.
The repeated experiments show substantial reductions in script work and blocking; tiny LCP changes on localhost are within noise.

| Configuration | LCP ms before → after | Ready marker ms before → after | Main-thread JS ms before → after | Long tasks before → after | Longest task ms before → after | Startup blocking ms before → after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| desktop first | 36 → 36 | 750 → 781 | 362 → 193 | 2 → 2 | 187 → 78 | 180 → 50 |
| desktop repeat | 48 → 44 | 699 → 741 | 315 → 144 | 2 → 2 | 181 → 70 | 168 → 34 |
| cpu4 first | 96 → 96 | 1,613 → 1,417 | 1,100 → 560 | 4 → 7 | 663 → 229 | 816 → 399 |
| cpu4 repeat | 64 → 96 | 1,312 → 1,148 | 851 → 374 | 2 → 5 | 600 → 177 | 635 → 248 |
| network first | 696 → 700 | 6,315 → 6,407 | 1,627 → 1,439 | 2 → 3 | 183 → 78 | 181 → 43 |
| network repeat | 356 → 228 | 1,290 → 909 | 393 → 143 | 2 → 2 | 168 → 68 | 148 → 30 |
| mobile first | 40 → 52 | static → 780 | 43 → 192 | 0 → 2 | 0 → 78 | 0 → 48 |
| mobile repeat | 28 → 44 | static → 740 | 20 → 140 | 0 → 2 | 0 → 68 | 0 → 28 |

Startup blocking above means Σ max(0, long-task duration − 50 ms) during the startup observation window.
It is not Lighthouse TBT; Lighthouse results are reported separately below.
The larger number of smaller tasks at 4× CPU is intentional: total blocking and the longest task both decreased.

The old ready marker fired before all scene subsystems were prepared.
The new marker follows compilation, warm-up and GPU completion; it is a stronger readiness guarantee, not a directly equivalent paint event.
The existing CSS reveal lasts another 240 ms, with no artificial loading delay.
Under network throttling, the fully prepared reveal is roughly 90 ms later than the old early marker, while startup blocking falls from 181 to 43 ms.

| Payload / rendering metric | Before | After |
| --- | ---: | ---: |
| Initial main-window JS transfer, desktop | 661,601 B | 662,862 B |
| Repeat main-window JS transfer | 3,300 B | 0 B |
| Desktop first-visit resources / transferred bytes | 20 / 1,064,200 B | 21 / 1,066,951 B |
| Mobile first-visit main-window JS | 338,917 B (static story) | 662,862 B (cinematic story) |
| GLB / GLTF downloads | 0 B | 0 B |
| External 3D texture downloads / image decode | none | none |
| Procedural texture dimensions | 512 × 512 | identical |
| Desktop rendered FPS, first / repeated traversal | 58.75 / 59.75 | 59.75 / 59.75 |
| 4× CPU rendered FPS, first / repeated traversal | 58.25 / 59.75 | 59.75 / 59.75 |
| Mobile rendered FPS, first / repeated traversal | static | 59.25 / 59.75 |
| First-traversal long tasks, all cinematic test configurations | one per traversal | zero |
| CLS, normal desktop / mobile | 0 / 0 | 0 / 0 |
| CLS, throttled network first visit | 0.000162 | 0.000162 |

Field INP is unavailable.
The final scripted interaction sample reported maximum Event Timing durations of 24 ms on desktop, 32 ms at 4× CPU, and 40 ms in the mobile viewport; these are lab interactions, not field INP.
No exact baseline INP or isolated hydration-duration number is claimed.
The final benchmark recorded zero console warnings/errors across all eight visits.
Two preload warnings occurred in one original CPU-throttled repeat sample, with no corresponding load failure; no font change was made on that basis.

## Lighthouse and visual parity

Lighthouse 13.4.1 ran serially against both production exports with the same 1350 × 940 desktop viewport, 4× CPU slowdown, 150 ms request latency, 1,600 Kbps download and 750 Kbps upload, using DevTools throttling.
Both runs completed without Lighthouse warnings.
These settings combine CPU and network throttling and differ from the separate scenarios above.

| Lighthouse metric | Before | After |
| --- | ---: | ---: |
| LCP | 800 ms | 690 ms |
| Total Blocking Time | 2,164 ms | 1,114 ms |
| JS boot-up work | 3,933 ms | 3,089 ms |
| Main-thread work | 4,508 ms | 3,677 ms |
| Largest task | 1,333 ms | 667 ms |
| CLS | 0.000176 | 0.000176 |

The largest remaining combined-throttle task occurs during scene warm-up.
Renderer creation, procedural geometry construction and driver first-use work remain startup costs; they have not been eliminated.
Lighthouse TBT remains above a good responsiveness target under this stress test.
The local network-only first visit still needs approximately 6.4 seconds for scene preparation, principally because the cinematic JavaScript must cross the throttled connection.
The existing shell/scene split was retained instead of disguising that transfer as a bundle-size improvement.

Eight matching desktop captures at progress 0.03, 0.092, 0.277, 0.39, 0.61, 0.72, 0.87 and 0.99 were compared directly.
The maximum mean RGB channel difference was 0.000013 on a 0–255 scale, with zero pixels differing by more than 10 average channel levels.
This includes opening/bloom, glass, ordinary textile, protective impact, assembly, explosion and final product shots.
The screenshots and `visual-difference.json` are in `review-artifacts/startup/final/`.
Mobile portrait captures and a landscape capture were also inspected.
The measured traversals showed no unloaded-stage popping or scroll-time long tasks.

The production export and user-facing regression tests were rerun after the final worker/download overlap change.
No model decimation, lossy map conversion, bloom removal, fixed-duration loader or global scroll lock was introduced.
No production deployment was performed.
Physical-phone performance, field INP, exact hydration duration and remote CDN caching remain unverified.

Implementation references checked: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [React Three Fiber demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance), and the installed Next.js 16.3.4 lazy-loading documentation under `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`.
