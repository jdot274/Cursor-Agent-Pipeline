# Asset QC — blue sphere shader → Unity

| Check | Result |
| --- | --- |
| Live source renders in browser | PASS — `evidence/02-live-full-sphere.png` |
| Animation advances | PASS — frames 380→526 in 1.2 s, uTime advancing |
| Pointer/touch input responds | PASS — real canvas click registered (`pointerMoves=1`) |
| Shared variables respond | PASS — morph/flow/heat driven to .85/.65/.90, visible change (`evidence/03`) |
| Provenance pinned + hashed | PASS — three@0.183.2 + user's exact GLTFExporter URL, SHA-256 recorded |
| GLB export deterministic | PASS — in-page hash equals on-disk hash (`91c5bb98…`) |
| Unity import (glTFast 6.19.0) | PASS — 1 mesh / 12,513 verts / 24,320 tris / 1 material / 1 texture |
| Unity visual comparison | PASS — `evidence/04-unity-imported-glb.png` matches source |
| Fidelity losses disclosed | PASS — frozen time, no fresnel/pointer terms, emissive approximation (see shader-package.md) |
| Clean logs | PASS with note — import log shows only licensing 404 noise and a mono shutdown exit-code anomaly on the first batch run; second run exited 0 |

**Result: PASS.** The live WebGL package remains the fidelity master; the GLB in Unity is a
clearly labeled bake derivative per the portability contract. No existing file was
overwritten; all changes are additive (new runtime folder, new Assets subfolder, one
package added to the Unity manifest).
