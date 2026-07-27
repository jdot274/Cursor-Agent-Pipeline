# Blue Sphere Shader v1 — exact GLSL package

## Source of record

- Live runtime: `runtime/blue-sphere-shader-v1/index.html` (sha256 `14696f89305655fac7acc74949612cf3d2b0f24dc136a2d83eeb14571ea5bfa7`)
- three.js pinned `0.183.2` (`three.module.js` sha256 `e8ac51bc2f6b7eb17bc88c6540eb0a1fee872f848949373de39d55f34b5c5a8f`)
- GLTFExporter pinned `three@0.183.2/examples/jsm/exporters/GLTFExporter.js` (sha256 `0dd325edc550303a2955012f7aa07988e6da8e7b86d4743454c87105cafe058b`) — exact URL supplied by user
- Vendored provenance copies: `runtime/blue-sphere-shader-v1/vendor/`
- Runtime imports use the same pinned jsdelivr URLs because the verification browser only loads ES modules over https.

## GLSL contract

- Material: `THREE.ShaderMaterial`, GLSL ES (WebGL2 via three r183).
- Shared functions `relayDisp` (vertex displacement) and `relaySurface` (albedo/flow/heat color) are one GLSL string used by both the live material and the UV-space bake pass.
- Uniforms:
  - `uTime` float — seconds, drives loop timing `T = uTime * (0.4 + uFlow * 1.2)`
  - `uMorph` float 0–1 (default .5) — displacement amplitude
  - `uFlow` float 0–1 (default .5) — band mix + time scale
  - `uHeat` float 0–1 (default .5) — emissive pulse intensity
  - `uPointer` vec3 — normalized pointer direction, drives specular-style spotlight
- Compiler evidence: shader compiled and rendered live in Chromium WebGL2 (screenshots in `evidence/`), zero console errors; frames advanced 380→526 over 1.2 s.

## Export paths

- GLB derivative: `runtime/blue-sphere-shader-v1/export/BlueSphereShader_v1_bake.glb` (also copied to this run folder and to Unity assets).
- Bake: 2048×1024 UV-space texture resolving `relaySurface` at frozen `T=343.061`, controls morph .85 / flow .65 / heat .90; geometry displaced in JS with the identical `relayDisp` formula.

## Disclosed fidelity losses in the GLB derivative (bake fallback)

- Time animation is frozen at export `T`; the GLB does not animate.
- View-dependent fresnel rim and pointer spotlight are runtime-only terms and are not baked.
- Emissive approximated as baked color texture reused as emissive map with intensity `0.25 + 0.75*heat`.
- The live WebGL package remains the fidelity master; the GLB is a labeled derivative, not an exact port.
