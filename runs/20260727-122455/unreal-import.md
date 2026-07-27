# Unreal destination — VanguardGolfSDF_v1 labeled native variant (compile PENDING)

## Target

- Project: `C:\UEProjects\OrbitShaderEngine_UE58` (Unreal Engine 5.8)
- File: `Shaders\VanguardGolfSDF_v1.ush`
  (sha256 `658A7C29701B66DB8E487691736AF69471AC61D362677BD1DDCC8177EE85ECEC`, 7690 bytes)
- Virtual include path: `/RefractShaders/VanguardGolfSDF_v1.ush` — the project's
  `FOrbitShaderBridgeModule::StartupModule` maps `<Project>/Shaders` to `/RefractShaders`
  (documented in `GlslCompat.ush` header). The manifest's `/RefractShaders/...` reference
  and the on-disk `Shaders\...` path are the same file.
- Intended use: screen / post-process material Custom node calling
  `VanguardGolfSDF_v1(ViewportUV, uTime, uMorph, uFlow, uHeat, uGlass, uPointer, uOrbit)`.

## Translation approach

GLSL → HLSL via the `GlslCompat.ush` macro layer
(sha256 `EC9520C031736E67DEF3D3241E9813A9A7DBA33A648C00CC2E0C414D7F43D4FB`), bracketed by
`GlslCompatEnd.ush` so the aggressive macros (`vec2/3/4`, `fract`, `mix`, `mod`, `atan`,
`texture`) never leak into Unreal's generated material code. The body keeps the WebGL
master's GLSL spellings; noise functions are re-declared locally as `VG_*` (no include of
the Unity `VanguardNoise.hlsl`). Marching loop marked `[loop]`, FBM/Voronoi marked
`[unroll]`. Aspect comes from `View.ViewSizeAndInvSize`.

## Fidelity losses (disclosed)

- **Not exact by definition** — different compiler (DXC → D3D/Vulkan vs ANGLE GLSL ES),
  different scheduling of the 96-step march; per the skill's portability contract this is
  a labeled native variant, never claimed dialect-compatible without a destination compile.
- Time: the master uses RAF seconds from page load (`uTime`); UE must supply
  `View.GameTime` or a material parameter — a different origin and pause behaviour.
- Inputs: `uMorph/uFlow/uHeat/uGlass/uPointer/uOrbit` have no UE globals; they must be
  plumbed as material parameters (Custom node inputs). Defaults are not embedded in the .ush.
- Color pipeline: the master outputs gamma-corrected `pow(col, 0.92)` straight to the
  canvas; UE post-process materials feed the engine tonemapper, so the neon palette will
  read differently unless placed after tonemapping (`Replacing the Tonemapper` or
  PostProcess material with suitable blend location).
- The HUD, pointer-capture drag, and `RelayVanguardGolf` JS API are runtime-only; UE gets
  raw shader semantics only.

## Compile evidence: **PENDING**

- Attempted 2026-07-27T14:21-04:00 via the `user-createlex-local-mcp` bridge
  (`get_project_summary`): connection to `127.0.0.1:18888` refused — no Unreal editor
  session with the UnrealClaudeMCP plugin was running. Per instruction, no editor was
  launched (heavyweight action).
- Honest status per the portability contract: the `.ush` is authored and hashed, but
  **no UE 5.8 destination compile has been observed**; dialect compatibility is not claimed.

### Exact reproduction steps to capture the evidence

1. Open `C:\UEProjects\OrbitShaderEngine_UE58` in Unreal Editor 5.8 with the
   UnrealClaudeMCP plugin enabled (serves MCP on 127.0.0.1:18888).
2. Create a post-process material (e.g. `M_VanguardGolfSDF_v1_Check`), add a Custom node
   with output `CMOT Float3`, inputs `uTime, uMorph, uFlow, uHeat, uGlass` (scalars),
   `uPointer, uOrbit` (float2), and code:
   `#include "/RefractShaders/VanguardGolfSDF_v1.ush"`
   `return VanguardGolfSDF_v1(GetDefaultSceneTextureUV(Parameters, 0), uTime, uMorph, uFlow, uHeat, uGlass, uPointer, uOrbit);`
3. Apply/compile the material (via MCP: `execute_unreal_python` +
   `unreal.MaterialEditingLibrary`, then `compile_blueprint`-style save, or manually
   press Apply) and check for shader compile errors in the Output Log / stats panel.
4. Screenshot the material preview into `runs/20260727-122455/evidence/` (new name,
   e.g. `10-ue-golfsdf-v1-compile.png`), record the log lines, and append the result to
   `manifest.md` and update the gate in `promotion-receipt.json` from PENDING to its
   observed result.
