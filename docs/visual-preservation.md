# Visual preservation pass — September 7, 2026

The approved desktop reference is commit `07ed27c44c31020413a98885ff55d674187168e7`.
The rejected combined patch remains recoverable in stash `4e870124eea8d098e3ad3f9724a9f254b83420cb`; none of it was applied wholesale.
This pass preserves desktop composition and makes scoped mobile, static-image, and inspector-state changes.

## Changes

- Portrait story media fits its viewport instead of extending to 160% width with a negative offset.
  Mobile framing centers the subject and keeps the four seat labels inside the viewport without overlap.
  Label positions reserve room for wrapped copy on short portrait screens, using layout-change observations rather than reading copy bounds during every frame.
  Desktop camera coordinates, lighting, materials, geometry, bloom, timing, and DPR are unchanged.
- Below 960 px the product study stacks and shows the complete 5:4 image.
  The desktop product grid and crop retain their original dimensions.
- The seat study uses 750, 1200, and 2400 px responsive WebP exports from a native 3000 × 2400 crop.
  The original angle, crop, model, and lighting are retained; the existing story posters are untouched.
  The largest image is about 275 KiB instead of the old 39 KiB still, an intentional detail-versus-transfer tradeoff.
  Images remain lazy-loaded; smaller screens can select a smaller source.
- The inspector keeps the still visible until its first rendered frame and honors an existing protective-layer selection on entry, resize, and reopening.
  Its existing camera positions, rotation controls, DPR, and desktop-only availability remain intact.
- The development indicator is disabled because its overlay intercepted the phone's Test chapter button.

The existing worker-generated, byte-tested surface maps, dynamic scene imports, shader preparation, and demand rendering already belong to the restored commit.
They were retained rather than replaced or credited as new improvements.

## Reference provenance and verification

Before any application edits, a fresh production build of the clean restored commit was copied to `/tmp/redline-layout-review/preserve-20260907/baseline-out` and served on port 3102.
The new test specification was run against that unchanged export to create sixteen reference PNGs:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3102 npm run test:e2e -- tests/e2e/desktop-appearance.spec.ts --project=chromium --update-snapshots
```

The references cover eight authored chapter/intermediate positions at 1440 × 900 DPR 1 and 1728 × 960 DPR 2.
Their SHA-256 values are recorded in `desktop-reference-hashes.json` beside this document.
To reproduce them, build the pinned baseline commit in a separate clean checkout, serve its export on 3102, and run the current test specification against it using the command above.
Use the lockfile's Playwright Chromium on macOS with the configured Metal backend.
Do not update references from a changed application to make a preservation failure pass.
Comparisons allow a 0.002 differing-pixel ratio and 0.15 color threshold for GPU rasterization variance; they are not a claim of byte-identical screenshots.
The Seat reference is also checked after resizing to portrait and back to desktop.

The initial image-resolution test failed because the 1200 px source served a desktop panel needing 2010 physical pixels at DPR 2.
The replacement serves the native 2400 px source and passes without changing that panel's dimensions.
Mobile tests reproduced clipped/overlapping labels, the development overlay intercepting Test, and 466 CSS pixels of horizontal image cropping in landscape before the fixes.
The inspector test reproduced protective selection opening an assembled seat before the fix.

Validation against both the production export and the development server: 35 browser tests passed with seven intentional desktop-only platform skips in each run.
All sixteen desktop references passed without being regenerated after application changes.
The browser suite includes Chromium and mobile WebKit, portrait/landscape rotation, chapter navigation, reverse motion, inspector controls, history restoration, keyboard access, contact preview, accessibility, reduced motion, no JavaScript, and WebGL loss.
All 19 unit tests, type checking, lint, and the production build passed.
Final screenshots are retained under `/tmp/redline-layout-review/preserve-20260907/production-verified` and `development-verified`.
Reproduction traces remain in the earlier failing-test directories.
Physical iPhone/Android GPU performance and browser chrome/safe-area behavior have not been tested on hardware.

## Recreating the sharper still

```sh
PREVIEW_URL=http://localhost:3100 node scripts/capture-product.mjs
```

Run against the approved desktop scene in a production preview.
The capture uses the original 1440 × 960 viewport, progress 0.998, and crop `(440, 90, 1000, 800)`, rendered offline at DPR 3 and then downsampled.
It changes no live rendering budget and never enlarges a smaller bitmap.

## Performance experiment ledger

An initial diagnostic used one instant `scrollTo` per animation frame and attributed considerable CPU time to history writes.
That input generated artificial `scrollend` events.
A reproduction using eighteen normal wheel events made only one history write, saving the final scroll position correctly.
No history optimization was applied because the suspected user-facing problem did not reproduce.
The retained profiler uses wheel events for both forward and reverse passes.

```sh
PREVIEW_URL=http://localhost:3100 PROFILE_OUT=review-artifacts/performance node scripts/profile-story.mjs
```

It measures three fresh visits per desktop, 4× CPU desktop, and 4× CPU phone-viewport configuration, with network caching and GPU shader disk caching disabled.
Browser animation-frame cadence is a lab responsiveness observation, not a GPU-rendered FPS or field INP measurement.
Wheel input in a touch-emulated viewport does not establish physical touch-device performance.

The final comparison used Chromium 153.0.8010.12 on the same Mac, with three visits per configuration.
Traversal runs were serial; because startup samples drifted between runs, readiness was also checked in eighteen alternating baseline/current startup visits.
The readiness medians below use those alternating visits; frame cadence uses the complete wheel traversals.

| Configuration | Ready median ms, baseline → current | Forward animation FPS, baseline → current | Reverse animation FPS, baseline → current |
| --- | ---: | ---: | ---: |
| Desktop 1440 × 900 | 847 → 834 | 60.0 → 60.0 | 60.0 → 60.0 |
| Desktop, 4× CPU | 1723 → 1721 | 60.0 → 59.8 | 60.0 → 60.0 |
| Phone 390 × 844, 4× CPU | 1717 → 1731 | 60.0 → 59.8 | 59.0 → 58.9 |

Alternating phone startup samples were 1790/1720, 1710/1731, and 1717/2202 ms for baseline/current, including one slower current outlier.
The earlier serial phone medians were 1499 ms baseline and 1687 ms final, illustrating why separated runs cannot establish a small timing improvement.
No startup or FPS improvement is claimed.
The mobile drawing buffer decreases from 936 × 683 to 585 × 683 pixels, a 37.5% reduction, with DPR still capped at 1.5.
This removes off-screen rendering area while making the subject fit; it is not a measured 37.5% reduction in total GPU time.
Desktop buffers are unchanged.
The throttled phone reverse traversal retains one long task: 85–90 ms in the baseline and 99–125 ms in the final samples.
This pass has not eliminated every scroll-time stall, and no claim of improved CPU execution time is made.
No page errors occurred in the eighteen complete profiling visits.

Raw final profiles and measurements are in `/tmp/redline-layout-review/preserve-20260907/wheel-baseline`, `wheel-final`, and `final-startup-interleaved.json`.
`wheel-current` and `phone-startup-interleaved.json` retain the intermediate measurements before the final short-screen label correction.
The earlier `performance-baseline` directory contains the discarded per-frame-scroll diagnostic and must not be compared to the wheel measurements.
