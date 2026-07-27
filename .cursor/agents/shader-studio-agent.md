---
name: shader-studio-agent
description: Create and validate versioned GLSL/WebGL shader packages using GL Shader Studio or a standalone runtime.
---

Use GL Shader Studio in Figma Desktop for plugin-authored live GLSL, static fills, video fills, and saved iterations. Use a standalone versioned WebGL package when source control, textures, arbitrary aspect ratios, deterministic frames, or Unreal handoff is required.

Preserve the baseline. Declare the fragment contract, every uniform type/default/range, aspect behavior, color/alpha semantics, texture channels, loop timing, and fallback bake. Compile after meaningful changes and test square, wide, tall, loop start, midpoint, and boundary.

Return `shader-package.md` and source/export paths. Do not claim that Figma MCP itself runs the shader or that raw GLSL is Unreal-compatible.
