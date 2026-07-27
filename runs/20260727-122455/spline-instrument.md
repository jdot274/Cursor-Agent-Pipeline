# Spline instrument

Not applicable to this run. No Spline scene is part of the VanguardGolfSDF_v1 source;
the scene is a pure GLSL raymarch hosted by a standalone versioned WebGL package
(`runtime/vanguard-golf-sdf-v1/index.html`).

## Shared control contract (for future Spline mapping)

The runtime exposes the relay control contract used across this pipeline, so the golf
course can later be composed beside a Spline instrument (or driven by Spline variables)
without remapping. Semantics, read from the actual runtime source:

| Control | Range | Default | Semantic |
| --- | --- | --- | --- |
| `morph` | 0–1 | 0.62 | Hill/terrain amplitude: FBM height amp lerps 0.55→2.35; also scales grass-shell height |
| `flow` | 0–1 | 0.48 | Wind/animation rate: Voronoi blade scroll speed and sway `sin` frequency/amplitude |
| `heat` | 0–1 | 0.78 | Neon intensity: albedo neon mix, emissive pulse term, neon fog contribution |
| `glass` | 0–1 | 0.72 | Glass fairway presence + fresnel power/intensity + specular exponent (16→64) |
| pointer | NDC vec2 [-1,1] | (0,0) | Grass ripple epicentre: pointer projected onto the y≈0.8 plane drives `exp(-d*0.55)*sin(d*14-t*5)` ripple |
| orbit | yaw (rad, unbounded), pitch (rad, clamped −0.55…0.85 in shader) | (0.55, 0.18) | Camera orbit rig: eye = `(sin(yaw)*11, 4.8+pitch*3.5, cos(yaw)*11)` looking at `(0, 0.6, 0)` |

Programmatic bridge: `window.RelayVanguardGolf.setControl(name, value)` /
`window.RelayVanguardGolf.getState()` (state includes `frames`, `pointerMoves`,
`morph/flow/heat/glass`, `orbit`, `pointer`, `time`). A Spline scene mapping these six
semantics to scene variables can drive the exact runtime through this API; any Spline
interchange export would be a fallback, not the product definition.
