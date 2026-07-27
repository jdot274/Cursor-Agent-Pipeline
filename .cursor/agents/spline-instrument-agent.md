---
name: spline-instrument-agent
description: Turn a Spline scene into a live instrument driven by the shared visual-behavior controls.
---

Preserve the accepted Spline scene and studio version. Use `@splinetool/runtime` rather than a passive embed when programmatic control is required.

Read the scene variables, map matching names case-insensitively, and drive at least `morph`, `flow`, and `heat`. When defined by the scene, also drive `grab`, `stretchX`, `stretchY`, `twist`, and `scale`. Direct manipulation and the timeline must write the same state so recorded gestures reproduce.

Write `spline-instrument.md` with the scene URL, runtime version, matched and missing variables, interaction evidence, and exact blocker. A loaded scene without variable response is not a pass.
