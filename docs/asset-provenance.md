# Asset provenance

## Original generated title image

- Working file: `public/images/brand/material-study.png`.
- Optimized runtime version: `public/images/brand/material-study.webp`.
- Source: the built-in image-generation tool, generated specifically for this new Redline repository.
- Purpose: conceptual protective textile art, with no assertion of actual construction, weave, composition, or layer count.
- Conversion: lossless source retained; WebP runtime version encoded with Sharp at quality 85.

Exact prompt:

> Use case: product-mockup. Create an original ultra-wide cinematic engineering-materials studio image for REDLINE BULLETPROOF website, no text or logos. Subject: several dark graphite technical woven fabric sheets floating in a gently separated layered stack, sheets subtly flexing, sharp silver fiber weave detail and visible fine textile edges. This is conceptual protective textile art, not real verified product construction. Composition: landscape 16:9, almost empty near-black left third for a headline; large sculptural textile stack fills the right two thirds, diagonal perspective looking very close along the upper surface from front left, edges flow toward lower right. A single subtle thin red rim light catches one sheet edge, otherwise steel silver highlights, warm white light, deep near-black shadows. Premium macro industrial photography / very high quality photorealistic 3D render. Fine weave clearly visible at the focal plane, restrained depth of field, strong material physicality. Black studio with no visible props. No gun, no ammunition, no people, no bus, no labels, no lettering, no diagrams, no glow blobs, no tactical aesthetic, no watermark. Output should feel aerospace engineering and advanced textiles.

## Scene and product stills

The firearm, operator silhouette, projectile, glass, fabric, seat, and laboratory geometry were authored as conceptual Three.js assets in this repository.
They were not copied or imported from another project.
They are neither engineering CAD nor representations of approved Redline construction.
The cropped anonymous operator is used only in the controlled opening shot, never as a customer, employee, or endorsement.

`public/images/product/story-*.webp` are direct renders of this scene, captured by `scripts/capture-posters.mjs`.
Their visible dimensions and separation distances have no physical-test meaning.
The procedural textile texture is a small repeatable visual study, not a product micrograph.

## Fonts and icons

Geist and Barlow Condensed were obtained through their Fontsource npm packages and are served locally as WOFF2 files.
The corresponding license texts are included in `public/fonts/`.
Interface icons come from Lucide React.
The Redline three-stripe logo and favicon are original simple geometric brand marks.
There are no stock customer images, testimonials, company-logo walls, awards, or undisclosed commercial reference assets.

## Second-pass live assets

The second-pass assets were authored in this repository.
No external model or material library was downloaded, and no new external asset license is required.
The original title artwork and fonts are unchanged.

| Asset | Authored changes | Replacement boundary |
| --- | --- | --- |
| Seat upholstery | Contoured surface, seam tension, geometric piping, instanced stitches, finish maps | seatPartAssets.upholstery |
| Seat support | Bent rails, connecting brackets, mounting feet, washers, fasteners, separated molded shell | seatPartAssets.structure |
| Protective textile | Shared twill appearance, separate color/normal/roughness channels, front and rear surfaces, continuous impact-to-seat transfer | ProtectivePanel, modelAssets.protectiveFabric, seatPartAssets.protective |
| Ordinary textile | Independent plain weave, deforming annular mesh opening and attached boundary fibers | modelAssets.standardFabric |
| Glass | Deterministic irregular polygon cells, denser fracture near contact, extruded edges and controlled separation | modelAssets.glass |
| Projectile | Lathed generic silhouette and subdued metallic finish | modelAssets.projectile |
| Opening rig | Cropped anonymous operator, connected arm segments and hand, generic test firearm | modelAssets.firearm |

The material-map generator owns separate 512-pixel repeatable color, normal, and roughness channels.
These are authored appearance studies; their weave, optical values, relative thicknesses, and visual arrangement are not specifications.
The same ProtectivePanel component is used in the macro scene and seat, including the inspector.
Its transfer transform aligns exactly with the seat part at the handoff.

A complete static seat GLB still cannot substitute for the addressable-part workflow.
Supply four part files using the documented origins and units if assembly, explosion, and selection need to remain available.
When replacing parts, also move their annotations to the approved model's actual anchor points.
Custom external materials should preserve a visible selected state; the default highlighting belongs to the authored fallback parts.

The story-loading.webp image is an uncropped first-shot render for the loading transition.
The other refreshed story images are direct crops of the current rendered scene.
