# Redline Bulletproof

A standalone, static-exportable website prototype for protective fabric systems intended for school-bus seating.
The homepage follows a conceptual projectile journey through glass, standard upholstery, and Redline textile before revealing a detached seat and its component layers.
The firearm is a brief visual device within an empty controlled environment.
There is no sound, occupied bus, passenger, human impact, or operational weapon information.

## Development

```sh
npm ci
npm run dev -- --port 3001
```

The command above serves the development site at http://localhost:3001.
The lockfile records the tested package versions.
Node.js 22 or later is recommended; this prototype was built with Node.js 26.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npm run test:e2e
```

`npm run build` produces the deployable `out/` directory.
`npm run preview` serves that directory at `http://localhost:3100`.
The Playwright suite serves the production export itself; build before running it.
Install browser binaries once with `npx playwright install chromium webkit`.

## Stack

- Next.js App Router, React, strict TypeScript, and Tailwind CSS.
- A shadcn-style Button primitive using Radix Slot and class-variance-authority.
- Lucide React icons and self-hosted Geist / Barlow Condensed fonts.
- GSAP and ScrollTrigger for the cinematic sequence and title introduction.
- Lenis as the sole smooth-scroll engine, synchronized with the GSAP ticker.
- Motion for the small product-description transition.
- Three.js, React Three Fiber, and Drei for replaceable conceptual scene assets.
- React Three Postprocessing for restrained HDR bloom in the opening firing sequence.
- Zod for contact validation, Vitest for logic, and Playwright / axe-core for browser checks.

No CMS, authentication, database, API route, or server-dependent contact action is included.
Opening bloom is retained; subsequent material and product shots use the base lighting directly.

## Repository structure

```text
public/
  fonts/                 Self-hosted fonts and license files
  images/brand/          Original generated textile artwork
  images/product/        Stills rendered from the actual scene
  images/textures/       Optional source texture images
  textures/              Runtime texture replacement location
  models/
    firearm/             Unbranded conceptual replacement
    projectile/          Understated visual model replacement
    materials/           Glass and textile replacements
    bus-seat/            Complete seat or separate component assets
src/
  app/                   Page composition, metadata, styles, icon
  components/ui/         Reusable UI primitives
  components/site/       Logo, header, title, footer, scrolling lifecycle
  data/company.ts        Company copy and claim / integration notices
  features/
    ballistic-story/
      components/        Lazy-loading shell, error boundary, HTML fallback
      scene/             Environment and individual Three.js objects
      timeline/          Phases, shots, state sampling, GSAP integration
      overlays/          Accessible copy, chapters, generic part labels
      hooks/             Responsive and reduced-motion experience selection
      data/              Story copy and asset registry
    product/             Product copy, hotspots, optional 3D inspection
    contact/             Typed form, validation schema, submission contract
  lib/                   Shared UI class utility
scripts/                 Local scene / poster capture tools
tests/                  Unit tests and production browser checks
 docs/                   Art direction, asset provenance, verification notes
```

## Story and camera architecture

`timeline/phases.ts` defines the named phases, chapter stops, event timing, scroll distance, and scrub amount.
`timeline/story-state.ts` defines the artistic camera positions, camera targets, focal changes, projectile movement, fracture, material response, assembly, and exploded-view channels.
All coordinates are artistic scene units, not physical measurements or test specifications.
Shape-preserving cubic interpolation smooths camera direction changes without overshooting authored holds.
The shared protective panel aligns with its seat-part transform at the integration handoff.

`use-ballistic-timeline.ts` owns a single GSAP timeline and one pinned ScrollTrigger.
Its normalized progress samples a shared scene state and requests a Three.js frame.
Scene components consume this state; they do not calculate their own scroll progress or create independent scroll listeners.
Scrolling backward reconstructs every state deterministically, including fracture, textile deformation, and assembly.
The chapter buttons provide an immediate keyboard-accessible jump between the five main story chapters.

The ten phases are test ready, firing, projectile tracking, glass, standard fabric, Redline material, Redline impact, seat assembly, exploded view, and product reveal.
The title is a separate first frame, rendered before the cinematic bundle.
The supporting value section, product inspection, and contact form return to ordinary document flow.

## Rendering and fallback strategy

The initial page contains complete HTML and a compressed textile poster.
The ballistic scene bundle is requested when the story approaches the viewport, on desktop and mobile.
The original 512-pixel procedural maps are prepared in a worker concurrently with the scene download.
The separate product viewer loads only after “Inspect in 3D” is selected.
Both canvases render on demand and cap device pixel ratio at 1.5.
Bloom runs only in the opening sequence; material and product shots use the base lighting directly.
There is no idle rotation, audio, or continuously running WebGL loop.
A matching first-shot poster covers shader preparation, first-use uploads, and the first completed GPU frame.
The normal, opening, and flash lighting variants are prepared without changing authored materials or timing.
Timeline updates do not request renders while the document is hidden.
GSAP contexts, Lenis, event listeners, geometry, and textures are cleaned up on teardown.

The cinematic mode supports desktop and touch viewports unless reduced motion is requested or the scene fails.
Portrait and landscape layouts retain the same cinematic story with a DPR cap of 1.5.
Touch scrolling is native; desktop fine-pointer scrolling uses Lenis.
Reduced-motion visitors receive an intentionally shorter five-chapter illustrated reading flow.
Those stills were captured from the same Three.js scene rather than substituted with unrelated imagery.
The text explicitly describes deformation, the conceptual projectile stop, and seat integration.
JavaScript-disabled visitors receive the same full HTML reading flow.
A scene exception or context loss also restores the illustrated flow and releases pinning.

Meaningful content is always available outside the canvas.
The canvas is decorative and never captures keyboard focus.
There are real form labels, inline errors, a persistent status region, visible focus rings, 44-pixel controls where practical, reduced-motion behavior, and forced-colors focus support.

## Replacing conceptual assets

The asset registry is `src/features/ballistic-story/data/assets.ts`.
A `null` URL selects the procedural placeholder.
Point a slot at an approved same-origin GLB to replace its visible model without changing camera timing or overlays.
All model files belong under `public/models/`; textures belong under `public/textures/`.

- Firearm and projectile models use their owning rig’s local origin and transforms.
- Material assets sit on a local XY plane, centered on the impact origin; match the placeholder bounds in the component.
- `seatPartAssets` supplies separate upholstery, comfort, protective, and structure models while retaining assembly and exploded-view motion.
- The full `modelAssets.seat` slot is appropriate for a single assembled product model; use the part slots when exploded assembly must remain available.
- The shared loader enables Meshopt and accepts a local Draco decoder directory at `/models/draco/` when compressed assets are introduced.
- Place the decoder files there before shipping Draco-compressed models; no decoders are needed or fetched for this procedural prototype.
- KTX2 textures are a future asset-pipeline step: add the Basis transcoder and configure KTX2Loader for the renderer when actual compressed textures exist.
- Approved morph targets or deformation animation clips need a model-specific adapter inside the relevant material component; generic GLB replacement cannot infer tested material behavior.

Use glTF/GLB, appropriate compression, shared materials, bounded texture resolutions, and instancing for any repeated replacement geometry.
Do not preload large replacement assets from the title screen.
Update the stills after replacing or materially changing geometry.
`scripts/capture-posters.mjs` documents the capture workflow; its default preview URL is `http://localhost:3100`, overridable through `PREVIEW_URL`.
All exported dimensions describe website assets, never product specifications.

## Contact integration

The required fields are `name`, `phone`, `email`, and `description`.
`features/contact/schema.ts` owns typed validation.
`features/contact/types.ts` exports the parsed payload and asynchronous submission handler contract.
`ContactForm` accepts an optional `onSubmit` adapter.

The default prototype checks input locally and reports that nothing was sent.
Without JavaScript, the submit button stays disabled so the browser cannot fall back to a native GET submission.
It never issues a request, stores the payload, prints personal details to the console, or displays a fabricated delivery confirmation.
The form notice is visible before submission.
A successful validation does not erase the visitor’s entries.

To connect a backend later, supply an adapter that sends JSON to `POST /contact` and rejects unsuccessful responses.
Only resolve after the backend has actually accepted the request.
The component already distinguishes pending, accepted, and failure states for a supplied adapter.
Keep the backend outside this static Next.js build and configure the corresponding CloudFront behavior or verified API origin when it exists.
Do not remove the prototype notice until delivery is implemented and verified.

## Static deployment: S3 + CloudFront

The Next.js configuration sets `output: "export"`, `trailingSlash: true`, and unoptimized local images.
No Node.js runtime is required to host `out/`.
Use a private S3 bucket behind CloudFront with Origin Access Control and an HTTPS viewer policy.
Set the default root object to `index.html`.
If more routes are added, map directory-style paths to their `index.html` documents in a CloudFront Function rather than assuming S3’s REST origin performs directory resolution.
Configure the generated `404.html` for missing routes.

Cache hashed `/_next/static/` files immutably and give HTML a short cache lifetime.
Upload the export, verify the object content types, and invalidate changed HTML after deployment.
This repository has not been deployed or connected to an AWS account.

Set `NEXT_PUBLIC_SITE_URL` to the verified production origin before the production build.
The metadata has the requested title and cautious description, plus Open Graph / Twitter structure.
Social-image absolute URLs are emitted only when the origin is configured; no fictional public domain is embedded in the prototype.
Review and replace the draft meta description before launch.

## Technical-claims policy

**No ballistic performance specification shown on the prototype should be treated as verified unless supplied by Redline Bulletproof and supported by appropriate test documentation.**

All model geometry, textile construction, material layers, projectile movement, glass fracture, and impact deformation are illustrative.
The visible numbered layers identify story chapters, not the actual product’s layer count.
No NIJ rating, certification, caliber, velocity, distance, composition, penetration depth, performance percentage, guarantee, approval, customer, contract, laboratory, or award is asserted.
“Technical specifications coming soon” is an explicit content placeholder.
Verified content should replace the centralized company, story, and product data only after supporting documentation is supplied.

## Sources and provenance

See `docs/asset-provenance.md` for artwork, models, font licenses, and the exact image-generation prompt.
Implementation references: [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading), [Lenis GSAP integration](https://github.com/darkroomengineering/lenis), and [React Three Fiber rendering on demand](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
The matching local Next.js package documentation was also checked during implementation.


## Second-pass review and compatibility

See [the second-pass report](docs/quality-pass-verification.md) for matching before-and-after captures, production measurements, tests, sources, and limitations.
Generated review files live under the ignored review-artifacts/quality-pass directory.
The reproducible capture scripts are quality-capture.mjs, quality-interactions.mjs, and quality-performance.mjs under scripts.

The installed R3F 9.7 package still constructs Three's deprecated Clock.
The version-guarded postinstall script replaces that constructor with the supported Timer behind R3F's existing clock interface.
It changes no other renderer behavior and does not silence warnings.
Reassess this small compatibility patch when changing the pinned renderer version.
Both canvases explicitly use the supported percentage shadow option.

## Startup performance pass

See [the startup performance report](docs/startup-performance.md) for measured bottlenecks, before/after results, rejected experiments, mobile behavior, and verification limits.
Run `PREVIEW_URL=http://localhost:3100 node scripts/startup-performance.mjs final` against a production export to repeat the browser measurements.
Run `node scripts/startup-trace.mjs final` to capture the Chrome trace, CPU profile, and scene screenshots.
The exported `serve.json` configures immutable caching of hashed Next.js assets in the local preview.
For S3/CloudFront, apply the equivalent cache metadata during deployment; the local preview config does not configure AWS.
