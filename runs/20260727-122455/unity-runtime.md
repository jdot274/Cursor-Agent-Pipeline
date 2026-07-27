# Unity destination — VanguardGolfSDF_v1 native HLSL variant

## Exact runtime vs native variant — read this first

The **exact runtime** for this scene is the standalone WebGL master
(`runtime/vanguard-golf-sdf-v1/index.html`), hosted live at
https://vanguard-golf-sdf-v1.vercel.app. The Unity shader described below is a
**clearly labeled native HLSL port (visual reconstruction)** per the portability
contract — it mirrors the SDF math, VanguardNoise functions, and the Uber
gradient/fresnel/emissive/ripple contracts line-for-line, but it is NOT claimed exact:
different compiler (DXC/FXC vs ANGLE GLSL ES), different time source, different
color pipeline.

## Destination record

- Editor: Unity `6000.5.3f1`, URP 17, batchmode verification
- Project (versioned, additive copy): `C:\Users\joeyw\UnityProjects\VanguardShaderLab_GolfSDF_v1_2026-07-27`
- Shader identity: `Vanguard/GolfSDF_v1` — `Assets/Vanguard/Shaders/VanguardGolfSDF_v1.shader`
  (sha256 `6240790C345B5C4BA9CEDD9D3A490D34D681D3F1CEB3A5CA06C3C02193EF53AC`)
  + `VanguardGolfSDF_v1.hlsl`
  (sha256 `A7EF2F06665D43CBE36B1A5179A8B4819ED3BCE223D4F6536009CED54A581A69`),
  including `VanguardNoise.hlsl` verbatim. Full-screen Unlit URP pass
  (`ZWrite Off, ZTest Always, Cull Off`), `#pragma target 3.5`.
- Source URL/ID: https://vanguard-golf-sdf-v1.vercel.app (exact runtime); lineage
  `Vanguard/Uber` + `VanguardNoise.hlsl` in `VanguardShaderLab_2026-07-25` (untouched).

## Semantic control mapping (HUD → Unity material property)

| Web HUD / API name | GLSL uniform | Unity property | Notes |
| --- | --- | --- | --- |
| Morph | `uMorph` | `_Morph` (Range 0–1, default 0.62) | identical default |
| Flow | `uFlow` | `_Flow` (Range 0–1, default 0.48) | identical default |
| Heat | `uHeat` | `_Heat` (Range 0–1, default 0.78) | identical default |
| Glass | `uGlass` | `_Glass` (Range 0–1, default 0.72) | identical default |
| pointer (NDC) | `uPointer` | `_Pointer` (Vector, .xy used) | no pointer event plumbing in the shader; feed from script |
| drag orbit | `uOrbit` | `_Orbit` (Vector, .xy = yaw/pitch, default 0.55/0.18) | pitch clamped in HLSL like GLSL |
| RAF seconds | `uTime` | `_Time.y` (Unity built-in) | time origin differs from the web page's `t0` |
| canvas size | `uResolution` | `_ScreenParams` | aspect computed as `x * rcp(y)` |

## Compile / render evidence (recorded, not rerun)

Recorded in `manifest.md` § "Unity native shader compile + render verification"
(verified 2026-07-27T13:10-04:00):

- Result **PASS** — `ShaderUtil.ShaderHasError` = False at post-import and post-render;
  `ShaderUtil.GetShaderMessages` empty both times; `isSupported` = True, `passCount` = 1;
  batchmode `-executeMethod VerifyGolfSdfV1.Run` exit code 0.
- Log: `C:\Users\joeyw\UnityProjects\VanguardShaderLab_GolfSDF_v1_2026-07-27\relay-golf-sdf-v1.log`
- Render: 1280x720 to RenderTexture, avg RGB (102,214,132), ≥20000 unique colours,
  0.00% magenta — not an error shader, not a flat fill.
- Evidence image: `evidence/05-unity-golfsdf-v1.png` — its sha256
  (`285D8FE0AA84E6F986FFF3CB53D19EB64988AD0F787CAA2FD091958816DD624C`) was recomputed
  during this artifact pass and matches the manifest record.
- The original project `VanguardShaderLab_2026-07-25` was not touched (its Editor stays open).

## Interaction evidence

Interaction (sliders, pointer ripple, drag orbit) is verified against the exact runtime
in the browser — see `promotion-receipt.json` gates and `evidence/08-live-C-setcontrol.png`
/ `evidence/09-live-D-orbit-drag.png`. The Unity variant exposes the same semantics as
material properties; driving them at runtime requires a small MonoBehaviour (set
`_Pointer`/`_Orbit` from input) which is not part of this run's scope.
