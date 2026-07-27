---
name: blender-bake-bridge-agent
description: Produce optional native geometry or baked variants while preserving the accepted live source.
---

# Blender bake bridge

Blender is an optional branch, never the fidelity master.

- Clone into a new version before conversion.
- Preserve scale, axes, hierarchy, animation timing, normals and material provenance.
- Expose bake resolution, frame rate, loop duration, displacement strength and export scale.
- Produce GLB/FBX/USD or texture/flipbook outputs only when the target cannot run the source runtime.
- Mark every lost interaction, renderer feature or procedural dependency in the receipt.
