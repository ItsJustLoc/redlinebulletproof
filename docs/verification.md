# Prototype verification

Verified locally on September 6, 2026, against the production static export.

## Automated results

| Check | Result |
| --- | --- |
| Strict TypeScript | Passed |
| ESLint | Passed, no warnings |
| Vitest | 11 tests passed |
| Playwright | 12 tests passed; 4 intentionally inapplicable mobile cases skipped |
| Production export | Passed; `out/index.html`, `out/404.html`, scripts, styles, images, and fonts generated |
| axe-core | No WCAG A / AA violations in the audited desktop and mobile reading flows |
| Production dependency audit | No known vulnerabilities reported by `npm audit --omit=dev` |
| Whitespace validation | `git diff --check` passed |

The browser projects cover Chromium at 1440 × 960 and WebKit with iPhone 13 emulation.
Additional width checks cover 320, 390, 720, 768, 1440, and 1920 pixels where applicable.

Browser assertions exercise title and metadata, local form validation, first-error focus, absence of contact requests, story chapter navigation, reverse scrolling, 3D product inspection, rotation controls, assembly toggling, context-loss recovery, runtime reduced-motion switching, JavaScript-disabled content, lazy image loading, horizontal overflow, and desktop keyboard focus.
The four skipped mobile cases are desktop 3D interaction, WebGL context loss, switching away from desktop pinning, and desktop hardware-keyboard tab order.
iOS keyboard tab behavior depends on system settings and is not inferred from the emulation.

## Visual inspection

The title, every cinematic shot, finished seat, exploded view, product section, and form were captured and inspected.
Mobile title, Redline impact illustration, product, and form layouts were also inspected.
The mobile stage images are checked after decode rather than assuming a newly scrolled lazy image has already painted.
No human impact, occupied bus, child, weapon branding, or performance telemetry appears in the scene.

The initial page does not mount the WebGL canvas.
Scrolling toward the story starts its lazy load, while product inspection requires its own explicit activation.
The rendering loop remains on demand.
Switching to reduced motion at runtime removes the active canvas and the pin spacer without a page error.

## Issues corrected during verification

| Before | After | Why |
| --- | --- | --- |
| React removed a node that ScrollTrigger had wrapped | The pinned node remains mounted while the timeline releases its wrapper | Context loss and responsive changes retain the complete HTML fallback |
| A very early anchor activation measured pre-pin document geometry | Anchor measurement follows layout refresh and keyboard jumps are immediate | Keyboard navigation reaches the intended section |
| Mobile grid tracks could briefly preserve an earlier viewport width | Tracks have zero minimums; resize assertions wait for layout settlement | Narrow layouts reflow without horizontal scrolling |
| Unconnected form could use native submission without JavaScript | Submit is disabled until hydration, with the integration notice always visible | Personal details cannot fall through to a native GET submission |
| Assembly foreground parts extended under the content column | The camera pulls back earlier for assembly | The material-to-seat transition keeps the product composition legible |
| Fiber fragments appeared before upholstery impact | Fiber visibility now follows the central impact state | The visual response occurs in the correct narrative order |

## Measured token contrast

| Pair | Contrast |
| --- | --- |
| Warm white on signal-red primary button | 4.54:1 |
| Warm white on page background | 17.40:1 |
| Muted text on graphite surface | 7.36:1 |
| Stage-label red on page background | 7.59:1 |
| Focus ring against page background | 14.12:1 |
| Focus ring against primary button | 3.68:1 |
| Input border against page background | 3.60:1 |

These are computed from the actual design token values.
Image-backed overlays were also visually inspected; automated contrast checking does not substitute for that inspection.

## Remaining boundaries

Physical-device GPU performance, real iOS hardware-keyboard navigation, assistive-technology speech output, RTL localization, and AWS deployment have not been verified.
The source has visible focus and semantic HTML, but automated accessibility results are not a claim of complete accessibility certification.
Actual ballistic performance, material composition, production seat construction, and product certification remain unverified by design.
The contact backend, real deployment origin, approved production assets, and approved technical data must be supplied before a public product launch.
