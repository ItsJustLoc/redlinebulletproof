# Redline second-pass verification

This pass upgrades the existing repository and preserves the frontend stack, static export, page order, brand identity, claim boundaries, and four-field local contact form.

## Rendered changes

| Before | After | Why |
| --- | --- | --- |
| Box-like upholstered panels and straight seam rails | Contoured cushions with surface tension, rounded profiles, piping, instanced stitches, a backrest/cushion junction, and connected frame hardware | Gives the detached seat a more credible industrial-product silhouette |
| A shared coarse weave and unrelated ribbed protective seat insert | Independent textile appearances, separate color/normal/roughness maps, and one shared protective panel across the story and inspector | Keeps material identity consistent through integration |
| Dark overlay over the firearm, disconnected operator arm | Cropped over-shoulder composition with connected arm/hand geometry, restrained rim lighting, and a quick transition away from the operator | Establishes the controlled setup while retaining material focus |
| Linear camera segments and abrupt projectile contact | Shape-preserving cubic camera paths and continuous contact/deceleration/hold states | Maintains readable, reversible continuity at phase boundaries |
| Eight triangular glass pieces and a black puncture disc | Irregular localized polygon breakup and a real deforming fabric opening with attached fibers | Improves oblique views and makes the material response spatially coherent |
| Orange flash sphere, no bloom | Layered HDR shader flash with soft irregular falloff, coordinated light/recoil, and restrained bloom in the opening only | Makes the event read as light without obscuring the projectile or material |
| Floating exploded labels and hidden interior | Greater part separation and labels connected to moving model anchors | Explains the conceptual arrangement |
| Instant inspector jumps and no structural highlight | Interruptible 250 ms transitions, immediate keyboard changes, auto-opening protective selection, and an explicit highlighted structure | Every selection has visible model feedback |
| Empty loading interval and repeated small notices | Matching first-shot poster, earlier preparation, readable persistent disclosure, and larger story annotations | Keeps the experience useful while loading and easier to read |
| Secondary product-only ending | Direct Contact Redline action plus the existing product link | Connects the final seat moment to the conversation |

## Visual evidence

Open the local comparison gallery at [review-artifacts/quality-pass/index.html](../review-artifacts/quality-pass/index.html).
It pairs the before and after frames at the same viewport and normalized story position.

Before captures came from the original development site on port 3001.
After captures came from the production static export on port 3100.
Both comparison sets use Playwright Chromium with its default SwiftShader renderer at device scale factor 1.
The small Next development indicator appears only in the before set.
Additional interaction captures use accelerated Chromium/Metal, and phone captures use WebKit emulating iPhone 13.

The desktop comparison set covers 1280 × 720, 1440 × 900, and 1920 × 1080.
Additional review covers an 820 × 1180 touch tablet, phone layout, reduced motion, and WebGL disabled from initial load.
Contact, deformation, settled hold, and both sides of the material transfer were also captured.
No occupied bus, passenger, person beyond the target, audio, telemetry, or unsupported performance specification was introduced.

## Automated checks

- ESLint and strict TypeScript pass.
- All 15 unit tests pass, including continuous surface contact, decreasing projectile displacement after contact, reversible flash bounds, camera derivatives, and the Timer bridge.
- All 14 applicable browser checks pass; six desktop-only checks are intentionally skipped in mobile WebKit.
- Next.js production static export succeeds.
- Automated accessibility checks report no tested WCAG A/AA violations in the illustrated reading flow.
- Desktop keyboard navigation, visible skip-link focus, contact error focus, inspector controls, and canvas exclusion from the tab order pass.
- The form validates locally, retains exactly the four required labeled fields, and sends no POST while delivery is disconnected.
- Reduced motion removes the pinned canvas, including when the preference changes at runtime.
- WebGL context loss releases pinning and exposes the illustrated story.
- The story and product inspector both stop rendering after their transitions settle.
- Reverse scrolling, direct chapter navigation, rapid repeated rotation, explosion/assembly, and final contact navigation pass.

## Production performance

Measurement file: [performance.json](../review-artifacts/quality-pass/performance.json).

Browser: Playwright Chromium 153.0.8010.12.
Renderer: ANGLE Metal on Apple M5 Pro.
Viewport: 1440 × 900 CSS pixels at device scale factor 1.
Build: the production static export served locally on port 3100.

Method: warm all ten scene states, then drive an eight-second forward/reverse scroll traversal with requestAnimationFrame.
Record animation-frame intervals, changes in the renderer's frame counter, PerformanceObserver long tasks, and a one-second idle check.
These are observed browser/render-update intervals, not GPU timer-query measurements or a cross-device frame-rate guarantee.

| Measured condition | Bloom available in opening | Effects disabled |
| --- | ---: | ---: |
| Observed render-counter changes during traversal | 479 | 479 |
| Median render-update interval | 16.7 ms | 16.7 ms |
| 95th-percentile render-update interval | 16.7 ms | 16.7 ms |
| Long tasks during warmed traversal | 0 | 0 |
| Idle render counter changed | No | No |
| Page errors | 0 | 0 |

The effects-disabled comparison is available through the review URL query parameter effects=off.
Ordinary material and seat scenes do not run the bloom composer.
The default renderer remains understandable with effects disabled.
The scheduler requests two frames per story update to maintain continuity between the GSAP ticker and R3F's demand loop; rendering still settles when input stops.

An earlier software-only run is retained in performance-software.json.
SwiftShader was substantially slower and is not evidence of hardware performance.
That run preceded the final opening-only bloom scope and scheduler adjustment, so it is diagnostic context rather than a like-for-like final benchmark.
Physical-device thermal behavior, older GPUs, software-renderer usability under sustained scrolling, and hardware mobile performance remain unverified.
Phone and touch-tablet experiences deliberately use the illustrated reading flow.

## Renderer compatibility

The installed R3F 9.7 constructor creates THREE.Clock before application code can replace it.
Three r185 deprecates that class.
A version-guarded postinstall patch replaces only those renderer constructions with the small Timer-backed compatibility interface in scripts/fiber-timer.mjs.
The patch preserves R3F's elapsedTime, start, stop, and delta contract; it does not suppress console warnings.
Its pause/restart behavior has a focused unit test.
Reassess and remove the patch when adopting an upstream renderer that uses Timer.
No dependency was upgraded to hide the warning.

Both canvases explicitly request PCFShadowMap through R3F's percentage shadow option.
This resolves the deprecated implicit PCFSoftShadowMap selection.
Neither Three warning appeared in the final reviewed browser sessions.

## Sources checked

- [Installed-version Next static-export guide](https://nextjs.org/docs/app/guides/static-exports), also read locally from the installed package.
- [Three MeshPhysicalMaterial](https://threejs.org/docs/#MeshPhysicalMaterial): transmission uses opacity 1, with separate optical transmission and surface roughness.
- [React Postprocessing bloom](https://react-postprocessing.docs.pmnd.rs/effects/bloom): intentional HDR values, threshold selection, and tone-mapping behavior.
- [R3F store source](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/store.ts), checked against the installed 9.7 bundles for the Clock constructor.
- Installed Three r185 Timer, Clock, shadow-map, and material source; installed postprocessing and R3F types.

## Remaining limits

These are improved, locally authored conceptual assets, not approved production CAD or photogrammetry.
The operator and firearm remain simplified secondary geometry.
Textile appearance, fracture, dimensions, relative thicknesses, and the stopped projectile do not describe verified construction or test results.
Approved individually addressable models and verified technical data can replace the documented asset slots later.

Screen-reader speech, physical-device touch behavior, native browser zoom controls, and RTL presentation were not manually verified.
Responsive reflow was tested down to 320 CSS pixels.
AWS deployment, a production domain, and contact delivery remain outside this pass.

Approve for the inspected prototype scope.
Production asset accuracy and the explicitly unverified device/accessibility coverage remain open.
