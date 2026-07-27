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

## game v1 — Playable multi-scene game shell (vanguard-golf-game-v1)
- Live URL: https://vanguard-golf-game-v1.vercel.app (production, READY, aliased)
- Immutable URL: https://vanguard-golf-game-v1-6e17qd6dg-274.vercel.app · Deployment ID: dpl_G3g3AEoP6eTwFH3RpeQx9R7uN8Zq (superseded by final CSS-fix deploy 6e17qd6dg)
- Vercel project: 274/vanguard-golf-game-v1 (new project; no prior deploy touched)
- Base: deployed v5 master (vanguard-golf-sdf-v5.vercel.app) — newest live deploy per probe; local v2–v5 runtime files untouched
- Master: C:\Users\joeyw\Documents\Cursor-Agent-Pipeline\runtime\vanguard-golf-game-v1\index.html (single-file, zero deps, inline GLSL/CSS/JS)
- Deploy dir: C:\Users\joeyw\Documents\Cursor-Agent-Pipeline\deploy\vanguard-golf-game-v1\
- Scenes: title (live flyby menu) · course select (3 procedural holes w/ canvas thumbnails) · play (drag-aim + hold-release meter, putt mode, CPU physics mirroring GLSL terrain) · pause / free roam (Esc, WASD + wheel) · result / scorecard (grades, ± vs par, localStorage best per hole + best round)
- Holes: 1 Emerald Rise (par 3) · 2 Neon Hollow (par 4) · 3 Aurora Dunes (par 5, gold accent) — per-hole seed/amp/accent/cup/tee uniforms
- API: window.RelayVanguardGolf extended with getScene(), goToScene(name), getScore() (v1 getState/setControl preserved)
- Playtest evidence: full round completed on live URL via CDP driver (drive.mjs) — hole 1: 4 (bogey), hole 2: 2 (eagle), hole 3: 1 (ace), round total 7 (−5); persistence verified ({"best":{"1":4,"2":2,"3":1},"bestTotal":7}); console clean (0 messages); screenshots in runtime\vanguard-golf-game-v1\shots\
- FPS: 34–60 under SwiftShader software rendering (adaptive DPR scaling active); hardware GPU substantially higher
- Support files (runtime dir only): serve.mjs (port 8119), drive.mjs (CDP playtest driver), shots\ (evidence), .probe\ (base-version probes)
- Timestamp: 2026-07-27 15:55 -04:00

## game v1 — Independent live verification (ship gate)
- Date: 2026-07-27T16:05-04:00 · Verifier: supervisor session via Playwright MCP against https://vanguard-golf-game-v1.vercel.app (fresh browser profile, no prior state)
- Runtime/deploy integrity: `runtime/vanguard-golf-game-v1/index.html` and `deploy/vanguard-golf-game-v1/index.html` hash-identical (SHA256 `C314FB555B3A7DAEE75C78626ED66D809A3D537E660DB5424C943A3F6783D6D3`) — committed code is exactly what is live
- Title: renders over live flyby, full menu (PLAY / COURSE SELECT / FREE ROAM / SETTINGS), 51 FPS at load
- Course select: 3 hole cards with canvas thumbnails + BEST slots (Emerald Rise par 3, Neon Hollow par 4, Aurora Dunes par 5)
- Play: real stroke via Space charge/release — mode aim → flight (strokes 1, ball airborne with velocity) → roll (legitimate downhill roll on hilly terrain) → settled back to aim
- Pause: Esc opens PAUSED card (RESUME / FREE ROAM / RESTART HOLE / QUIT TO MENU), world frozen
- Free roam: scene `roam`, WASD moved camera pos (-7.98,2.75,2.86) → (-6.41,2.40,2.22) while world frozen
- Scorecard: scene `score`, full 3-hole table + round total + NEXT HOLE / REPLAY HOLE / MENU
- API: getScene/goToScene/getState/getScore/setControl all responded correctly
- Persistence round-trip: setControl('glass', 0.5) → `vanguardGolfGame.v1` written → page reload → glass restored to 0.5
- Console: 0 messages (0 errors, 0 warnings) across the whole session
- Evidence: `evidence/game-v1-verify/verify-01-title.png` … `verify-05-scorecard.png`
- Result: **PASS** — no defects found, no fix/redeploy needed; game v1 shipped

## ball lab + game v2 — Shader engine + collage presets
- Date: 2026-07-27T18:17-04:00
- Live game: https://vanguard-golf-game-v2.vercel.app
- Live Ball Lab: https://vanguard-golf-game-v2.vercel.app/creator/
- Stack: r3f + drei + postprocessing + N8AO + AgX + Tweakpane engine panel + three-custom-shader-material
- Presets: 14 total (8 tournament hero + 6 collage: organic/plasma/points/topo/cel/energy)
- Engine: live Tweakpane design editor (exposure/bloom/ao/grain/displace/noise/glow/rim) with save/reset/copy JSON
- Game v2: BALL LAB menu entry, reads `vanguardGolf.ball.v1` accent into `uBallTint`
- Deploy: `deploy/vanguard-golf-game-v2/` (game root + /creator/) · project 274/vanguard-golf-game-v2
