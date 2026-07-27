# VanguardGolfSDF_v1 — exact GLSL package

## Source of record

- Exact-runtime master: `runtime/vanguard-golf-sdf-v1/index.html`
  (sha256 `93A02BB5721E71684A392810002BC4D0A3CC051660D358EDBBEF11F70A1CC61F`, 15011 bytes)
- Deployed copy `deploy/vanguard-golf-sdf-v1/index.html` is byte-identical (same sha256),
  live at https://vanguard-golf-sdf-v1.vercel.app — live HTTP body re-fetched
  2026-07-27T14:35-04:00 and hashed to the identical sha256.
- No external dependencies: single self-contained HTML file, no CDN imports, no textures.
- Lineage (read-only inputs, hashed in `scene-contract.json`): `VanguardUber.shader` +
  `VanguardNoise.hlsl` from `VanguardShaderLab_2026-07-25`. The noise/fresnel/gradient/
  emissive/ripple contracts are ports of those files; the SDF golf-course geometry is a
  labeled level instrument (Uber itself is a surface shader, not SDF).

## GLSL contract

- `#version 300 es`, `precision highp float`, WebGL2 context (`antialias:false, alpha:false`).
- Vertex stage: single full-screen triangle from `gl_VertexID` (no vertex buffers).
- Fragment stage: 96-step sphere-traced raymarch (hit eps 0.0015, step scale 0.85, far 55)
  over terrain SDF + 3 Voronoi grass shells + glass fairway sheet.
- Uniforms (complete set, read from the source):

| Uniform | Type | Range / unit | Default | Driven by |
| --- | --- | --- | --- | --- |
| `uResolution` | vec2 | pixels | canvas size | resize handler, dpr capped at 2 |
| `uTime` | float | seconds | 0 at load | RAF loop: `(now - t0) * 0.001` |
| `uMorph` | float | 0–1, step .001 | 0.62 | HUD "Morph" slider / `setControl('morph', v)` |
| `uFlow` | float | 0–1, step .001 | 0.48 | HUD "Flow" slider / `setControl('flow', v)` |
| `uHeat` | float | 0–1, step .001 | 0.78 | HUD "Heat" slider / `setControl('heat', v)` |
| `uGlass` | float | 0–1, step .001 | 0.72 | HUD "Glass" slider / `setControl('glass', v)` |
| `uPointer` | vec2 | NDC [-1,1], y inverted | (0,0) | `pointermove` |
| `uOrbit` | vec2 | yaw rad (unbounded), pitch rad (shader-clamped −0.55…0.85) | (0.55, 0.18) | pointer drag (yaw +0.005/px, pitch +0.004/px) |

- Textures: none (fully procedural hash/value-noise/FBM/Voronoi).
- Loop timing: `requestAnimationFrame`; every uniform re-uploaded each frame; `frames`
  counter exposed through `RelayVanguardGolf.getState()`.
- Input contract: pointer move updates `uPointer` (grass ripple epicentre); pointer drag
  (with pointer capture) updates `uOrbit`; HUD sliders and the JS API update the four
  scalar controls.

## Compiler evidence

- **WebGL (exact runtime): PASS** — live URL verified in Chromium (Playwright)
  2026-07-27 ~14:2x-04:00: page renders the neon SDF course
  (`evidence/06-live-A-defaults.png`), animation advances (frames 213→532, uTime
  27.9607→69.9501 between samples), console completely clean (0 messages, 0 errors,
  0 warnings). Runtime throws on `COMPILE_STATUS`/`LINK_STATUS` failure, so a rendering
  page with a clean console is compile evidence.
- **Unity (native HLSL variant): PASS** — `Vanguard/GolfSDF_v1` compile-verified in the
  project copy `VanguardShaderLab_GolfSDF_v1_2026-07-27` (Unity 6000.5.3f1, URP 17,
  batchmode): `ShaderUtil.ShaderHasError` = False, 0 messages, renders non-trivially.
  Recorded in `manifest.md` ("Unity native shader compile + render verification") with
  log + `evidence/05-unity-golfsdf-v1.png`; not rerun for this artifact pass.
- **Unreal (native .ush variant): no destination compile evidence yet.** The `.ush`
  exists and hashes are recorded, but no UE 5.8 compile has been captured
  (editor session unavailable 2026-07-27T14:21-04:00 — MCP connection to
  127.0.0.1:18888 refused). Per the portability contract, dialect compatibility is NOT
  claimed. See `unreal-import.md` for the PENDING record and reproduction steps.

## Export paths (all variants)

| Variant | Path | sha256 |
| --- | --- | --- |
| Exact-runtime master (frozen) | `runtime/vanguard-golf-sdf-v1/index.html` | `93A02BB5721E71684A392810002BC4D0A3CC051660D358EDBBEF11F70A1CC61F` |
| Deployed copy | `deploy/vanguard-golf-sdf-v1/index.html` | `93A02BB5721E71684A392810002BC4D0A3CC051660D358EDBBEF11F70A1CC61F` |
| Unity native (labeled port) | `VanguardShaderLab_GolfSDF_v1_2026-07-27/Assets/Vanguard/Shaders/VanguardGolfSDF_v1.shader` | `6240790C345B5C4BA9CEDD9D3A490D34D681D3F1CEB3A5CA06C3C02193EF53AC` |
| Unity native include | `.../VanguardGolfSDF_v1.hlsl` | `A7EF2F06665D43CBE36B1A5179A8B4819ED3BCE223D4F6536009CED54A581A69` |
| Unreal native (labeled, compile pending) | `C:/UEProjects/OrbitShaderEngine_UE58/Shaders/VanguardGolfSDF_v1.ush` (virtual `/RefractShaders/VanguardGolfSDF_v1.ush`) | `658A7C29701B66DB8E487691736AF69471AC61D362677BD1DDCC8177EE85ECEC` |

The live WebGL package is the fidelity master; the Unity and Unreal files are clearly
labeled native variants (visual reconstructions), not exact ports.
