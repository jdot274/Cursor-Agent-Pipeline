---
name: design-to-realtime-3d
description: Coordinate additive Figma, GLSL/WebGL, Spline, Unity, optional Blender, and Unreal variant work through exact source packages and verified destinations.
---

# Design to realtime 3D

Preserve every accepted source and create a named next iteration.

## Required artifacts

- `manifest.md`: objective, source IDs, destination, owners, and status.
- `figma-brief.md`: node links, variables, components, Make resources, and visual contract.
- `scene-contract.json`: metres, right-handed Y-up source space, transform hierarchy, meshes, materials, textures, lights, cameras, animation, shader uniforms, and provenance.
- `shader-package.md`: GLSL contract, version, uniforms, textures, loop timing, compiler evidence, and export paths.
- `spline-instrument.md`: source scene, matched variables, interaction evidence, and any export fallback.
- `promotion-receipt.json`: immutable input/output hashes and every promotion gate.
- `unity-runtime.md`: Unity project/build path, exact-runtime bridge, source URL/ID, semantic control mapping, build evidence, and interaction evidence.
- `unreal-import.md`: required only for an explicit native Unreal variant; record target path, translation, compiler evidence, and every fidelity loss.
- `asset-qc.md`: final checks and pass/blocker result.

## Routing

- Use remote `figma` MCP for link-based context, variables, components, Make resources, and supported canvas writes.
- Use `figma-dev-mode-mcp-server` for the active Figma Desktop selection and local design inspection.
- Use GL Shader Studio in Figma Desktop for live plugin shader work. Use a standalone versioned WebGL package when runtime portability, deterministic export, arbitrary textures, or source control is required.
- Use Spline as a live authoring/runtime instrument. Map the shared controls to scene variables and keep any interchange export as a fallback, not the product definition.
- Use Unity 6 WebGL as the default exact-runtime host. Compose the original Spline runtime or complete Shadertoy program and bridge game state through JavaScript.
- Use Blender only as a non-overwriting optional conversion/bake branch.
- Use Unreal Interchange or a one-shot Unreal Python/editor script only for an explicitly requested native variant.

## Portability contract

Preserve the original GLSL, pass graph, Spline package and uniform manifest. Portable PBR values and texture maps may travel through glTF/GLB. Proprietary Spline behavior, procedural GLSL, custom post effects, renderer-specific nodes, and unsupported animation require one of:

1. Keep the original runtime live inside the Unity WebGL composition.
2. Build a clearly labeled native engine variant.
3. Bake deterministic textures/flipbooks/meshes as a clearly labeled fallback.

Never call a visual reconstruction exact. Never silently rasterize an editable shader or claim dialect compatibility without a destination compile.

## Completion

The run passes only after the original source visibly runs, pointer/touch input responds, animation advances, shared variables respond when the source exposes them, Promotion Gate records provenance, and the Unity WebGL build hosts the exact runtime with clean browser and Unity logs.
