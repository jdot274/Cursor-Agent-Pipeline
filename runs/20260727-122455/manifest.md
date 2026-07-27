# Neon Golf SDF · VanguardGolfSDF_v1

- Started: 2026-07-27T12:24:55-04:00
- Mode: design-to-realtime-3d
- Objective: glassy layered SDF grass, green neon, hilly golf course level
- Source lineage: `Vanguard/Uber` + `VanguardNoise.hlsl` from `UnityProjects/VanguardShaderLab_2026-07-25`
- Exact-runtime master: `runtime/vanguard-golf-sdf-v1/` (GLSL WebGL, Unity WebGL host)
- Unity native: `VanguardShaderLab_2026-07-25` additive `VanguardGolfSDF_v1` (HLSL screen/unlit)
- Unreal native variant (explicit): `OrbitShaderEngine_UE58` → `/RefractShaders/VanguardGolfSDF_v1.ush`
- Supervisor: Cursor
- Status: RUNNING
- Owners: Cursor (supervisor), VanguardShaderLab (Unity fidelity), OrbitShaderEngine_UE58 (UE labeled native)

## Live deployment

- Live URL: https://vanguard-golf-sdf-v1.vercel.app
- Immutable URL: https://vanguard-golf-sdf-v1-3vzel28v7-274.vercel.app
- Vercel project: `274/vanguard-golf-sdf-v1` (new project, no prior deploy touched)
- Deployment ID: `dpl_nVkv5ddm8ZhXzA5qjso33ydsJh2m`
- Inspector: https://vercel.com/274/vanguard-golf-sdf-v1/nVkv5ddm8ZhXzA5qjso33ydsJh2m
- Deployed: 2026-07-27T13:03:13-04:00 (target: production, readyState: READY)
- Deploy source: `deploy/vanguard-golf-sdf-v1/` (additive copy; `runtime/vanguard-golf-sdf-v1/index.html` unchanged)
- Artifact SHA256: `93A02BB5721E71684A392810002BC4D0A3CC051660D358EDBBEF11F70A1CC61F` (identical local and deployed)
- Verification: HTTP 200 `text/html`, 14868 bytes; markers `VanguardGolfSDF`, `RelayVanguardGolf`, `getState`, `setControl`, `#version 300 es`, `webgl2` all present; live browser render confirmed (neon SDF course, 4 controls, "Live SDF golf course running")

## Unity native shader compile + render verification

- Verified: 2026-07-27T13:10-04:00
- Shader: `Vanguard/GolfSDF_v1` (`Assets/Vanguard/Shaders/VanguardGolfSDF_v1.shader` + `VanguardGolfSDF_v1.hlsl`)
- Result: **PASS** — compiles clean and renders
- Compile messages: 0 total, 0 errors, 0 warnings (`ShaderUtil.ShaderHasError` = False at both post-import and post-render phases; `ShaderUtil.GetShaderMessages` returned an empty array both times)
- Shader state: `isSupported` = True, `passCount` = 1
- Unity: 6000.5.3f1, URP 17, `-batchmode -quit -executeMethod VerifyGolfSdfV1.Run`, process exit code 0
- Project copy (versioned, additive): `C:\Users\joeyw\UnityProjects\VanguardShaderLab_GolfSDF_v1_2026-07-27`
- Log: `C:\Users\joeyw\UnityProjects\VanguardShaderLab_GolfSDF_v1_2026-07-27\relay-golf-sdf-v1.log`
- Render: 1280x720 orthographic camera to RenderTexture, 1380446 bytes PNG
- Pixel stats: avg RGB (102,214,132), >=20000 unique colours, 0.00% magenta (no error shader, not a flat fill)
- Evidence image: `evidence/05-unity-golfsdf-v1.png` (SHA256 `285D8FE0AA84E6F986FFF3CB53D19EB64988AD0F787CAA2FD091958816DD624C`)
- Verifier hardening: `Assets/Editor/VerifyGolfSdfV1.cs` in the copy now calls `ShaderUtil.ShaderHasError`, enumerates `ShaderUtil.GetShaderMessages` (severity/text/file/line), re-checks after the draw call, and logs pixel statistics — so a silent compile failure can no longer report PASS
- Code fixes required: none — no changes were made to the shader or HLSL in either the copy or the original project
- Original project `VanguardShaderLab_2026-07-25` untouched: Editor PID 92004 left running, `Temp\UnityLockfile` left in place, no batch mode run against it

## design-to-realtime-3d artifact completion (v1)

- Date: 2026-07-27T14:42-04:00
- Artifacts added (append-only, no existing file rewritten): `figma-brief.md` (N/A, code-first),
  `spline-instrument.md` (N/A + shared control contract), `scene-contract.json`,
  `shader-package.md`, `unity-runtime.md`, `unreal-import.md`, `promotion-receipt.json`,
  `asset-qc.md`; new evidence `evidence/06-live-A-defaults.png` … `evidence/09-live-D-orbit-drag.png`
  (live-render, animation, setControl, and orbit-drag verification performed today; all hashed
  in `promotion-receipt.json`).
- Live re-verification: HTTP 200, live body sha256 identical to frozen master
  (`93A02BB5721E71684A392810002BC4D0A3CC051660D358EDBBEF11F70A1CC61F`); animation advanced
  (frames 213→532); `RelayVanguardGolf.setControl` + real pointer drag both responded;
  browser console fully clean (0 messages). Note: live body measured 15011 bytes, not the
  14868 recorded above — hash identity unaffected.
- Unity evidence re-verified by hash (`evidence/05-unity-golfsdf-v1.png` matches the record);
  Unity was not rerun. Unity variant remains a labeled native HLSL port, not the exact runtime.
- Unreal destination compile: **PENDING** — UnrealClaudeMCP bridge unreachable
  (127.0.0.1:18888 refused); reproduction steps in `unreal-import.md`.
- QC result: **PASS** (`asset-qc.md`) — all gates pass except the honestly-PENDING UE compile.
- Status update (2026-07-27T14:42-04:00): **PASS** (UE native-variant compile evidence PENDING; see `unreal-import.md`)

## v5 — Glass HUD iteration (vanguard-golf-sdf-v5)
- Live URL: https://vanguard-golf-sdf-v5.vercel.app (HTTP 200, v5 markers verified, renders in browser)
- Vercel project: 274/vanguard-golf-sdf-v5 · Deployment ID: dpl_5bgVNh9AXiYfv7WmQp1XBsTVjBK9
- Base: frozen local v1 master (v2/v3/v4 deployments all returned 404 at build time)
- Master: C:\Users\joeyw\Documents\Cursor-Agent-Pipeline\runtime\vanguard-golf-sdf-v5\index.html
- Deploy dir: C:\Users\joeyw\Documents\Cursor-Agent-Pipeline\deploy\vanguard-golf-sdf-v5\
- Timestamp: 2026-07-27 14:17 -04:00
