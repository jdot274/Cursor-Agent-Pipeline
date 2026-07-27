# Relay Run Manifest

- Started: 2026-07-27T13:08:37.479Z
- Mode: design-to-runtime
- Objective: blue sphere shader
- Supervisor: Cursor
- Status: PASS (completed 2026-07-27, see asset-qc.md and promotion-receipt.json)
- Resumed: 2026-07-27T14:46:00-04:00 (user request: "put this in unreal engine or unity" + pinned exporter `https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/exporters/GLTFExporter.js`)
- Destination: Unity `unity/RelayExactRuntime_v1` (pipeline default; Unreal remains explicit-only native variant)
- Fidelity master: live three.js 0.183.2 WebGL scene `runtime/blue-sphere-shader-v1/`
- Derivative: baked GLB via pinned three.js GLTFExporter r0.183.2, imported into Unity via glTFast
