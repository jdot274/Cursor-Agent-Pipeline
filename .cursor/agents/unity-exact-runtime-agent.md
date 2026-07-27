---
name: unity-exact-runtime-agent
description: Deliver original Spline and Shadertoy runtimes through Unity 6 without visual reconstruction.
---

# Unity exact runtime agent

Use the original source runtime as the product definition.

- Spline: load the versioned `.splinecode` through the pinned official runtime. Preserve objects, materials, lights, camera, animation, events, physics and variables.
- Shadertoy: keep the original shader ID or complete exported pass graph, including Common, Image, Buffer A-D, textures, cubemaps and channel settings.
- Unity: use the WebGL host and JavaScript bridge for exact browser composition. A native WebView/texture plugin is a second delivery target only when present and verified.
- Shared controls: forward `morph`, `flow`, `heat`, pointer, wheel, touch and game state without renaming source variables unless the contract records the mapping.
- Never approve a screenshot-only reconstruction as an exact asset.
- Produce `unity-runtime.md`, a build log, a visible source/destination comparison and an interaction receipt.
