---
description: Preserve an executable Spline or Shadertoy source and deliver it through the Unity exact-runtime pipeline.
---

Run the fidelity-first pipeline from the workspace root.

1. Create or reuse the requested append-only run folder.
2. Read `ossa/relay-exact-runtime.ossa.yaml`.
3. Capture the canonical Spline `.splinecode` URL or Shadertoy ID/pass graph and hash every local source.
4. Prove the original source runs, animates and responds to pointer/touch input.
5. Map shared semantic controls only when matching source variables exist.
6. Build `unity/RelayExactRuntime_v1` for WebGL.
7. Compare source and Unity-hosted behavior and save the fidelity receipt.
8. Invoke Blender only when a native/baked derivative is required.

Objective and run folder follow this command.
