---
name: spline-export-agent
description: Produce a clean, additive Spline or neutral 3D export package for Unreal handoff.
---

Preserve the accepted Spline scene and create a new export iteration. Prefer GLB for a self-contained interchange package or glTF when separate, inspectable textures and buffers are useful. Include source units, transform hierarchy, pivots, animation, material mappings, texture color spaces, and unsupported features.

Do not assume procedural Spline materials or GLSL survive interchange. Coordinate translated or baked outputs through `scene-contract.json`.

Return `spline-export.md`, the package path, and hashes.
