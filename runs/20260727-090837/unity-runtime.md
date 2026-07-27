# Unity destination — BlueSphereShader_v1 GLB derivative

- Editor: Unity `6000.5.3f1` (batchmode)
- Project: `unity/RelayExactRuntime_v1` (existing exact-runtime host project, additive change only)
- New package: `com.unity.cloud.gltfast` `6.19.0` added to `Packages/manifest.json`
- Asset: `Assets/RelayDerivatives/BlueSphereShader_v1/BlueSphereShader_v1_bake.glb`
- Importer: `glTFast.Editor GltfImporter` (ScriptedImporter)
- Import verification: `Assets/Editor/VerifyGlbImport.cs` → `[RELAY_GLB_IMPORT] PASS meshes=1 verts=12513 tris=24320 materials=1 textures=1` (`relay-glb-import-v1.log`)
- Visual verification: `Assets/Editor/RenderGlbPreview.cs` → `relay-glb-unity-preview-v1.png` (exit code 0), copied to `evidence/04-unity-imported-glb.png`
- Source URL/ID: user-pinned `https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/exporters/GLTFExporter.js`; live source `runtime/blue-sphere-shader-v1/index.html` served at `http://127.0.0.1:8113/`
- Semantic control mapping: morph/flow/heat are frozen into the bake (`.85/.65/.90`); the live web runtime keeps them interactive. To drive them inside Unity, compose the live page through the existing exact-runtime WebGL bridge (`RelayExactRuntime_v1` template) — the sphere page exposes `window.RelayBlueSphere.setControl/getState`.
- Interaction evidence: pointer click registered on the live source; the GLB itself is a static labeled derivative (no animation/interaction by design, see shader-package.md fidelity losses).
- Unreal: not built this run (pipeline default is Unity; Unreal is an explicit native-variant request). The GLB imports directly into `C:\UEProjects\Lyra_5.7` via Interchange if requested.
