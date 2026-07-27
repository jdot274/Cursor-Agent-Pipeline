# Relay

Relay gives Cursor two supervised multi-agent routes:

- **Web builders:** Cursor → Claude in Chrome → Lovable + v0 → independent review.
- **Exact realtime:** Figma remote + Figma Desktop context → GL Shader Studio → original Spline/Shadertoy runtime → Unity 6 WebGL host → optional Blender/native-engine variants → fidelity smoke check.

## Use it

Open the local Relay interface at `http://localhost:3000/`, choose a route, describe the outcome, and run it.

The matching Cursor commands are:

- `/cross-ai-build build a premium landing page for ...`
- `/design-to-runtime preserve this Spline or Shadertoy source exactly, expose its controls, and package it as a Unity-hosted game/app asset`
- `/design-to-unreal create an explicitly native Unreal variant and report every translation loss`

The exact route uses both Figma MCP connections for context and canvas operations, but the executable Spline or Shadertoy source stays authoritative. Unity hosts the original web runtime. Blender and Unreal are optional derived variants, never substitutes presented as exact.

## Boundaries

The pipeline can submit prompts, create additive iterations, export packages, and inspect results. Publishing, deployment, purchases, account changes, sharing changes, personal-file uploads, and overwriting accepted projects require a separate explicit request.
