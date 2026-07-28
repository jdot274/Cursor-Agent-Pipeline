# Pitfalls — Spline isolate

## White / empty screen

| Cause | Fix |
|-------|-----|
| Using r3f-spline + Ball Lab camera (z≈3, near≈0.1) on Spline export scale | Prefer react-spline (owns camera) OR match export camera near=70, far=1e5, z≈1000 |
| `getAllObjects()` crash | Never call it; use `app._scene.traverse` |
| Isolation hides Sphere's parent Group | Keep ancestor chain of Sphere in the keep-set |
| Uncaught error in `onLoad` | wrap isolate in try/catch so React root stays mounted |
| Calling `findObjectByName('Particle Emitter')` | throws; hide via `_scene` instead |

## Wrong embed

- Do **not** use `my.spline.design/...` iframe for isolated sphere / Tauri chrome-less windows.
- Do use `prod.spline.design/.../scene.splinecode`.

## three + @splinetool/loader build errors

Only matters for R3F `SplineLoader` path. Shim missing exports:

- `LinearEncoding = 3000`, `sRGBEncoding = 3001`
- `mergeBufferGeometries` → alias `mergeGeometries`
- `WebGLMultipleRenderTargets` → alias `WebGLRenderTarget`

Do **not** alias the entire `three` package to a shim file (breaks `three/examples/...` subpaths).

## Clone crashes

Do not `clone()` Spline entities from `@splinetool/loader` — `Cannot read properties of undefined (reading 'data')`. Isolate in place.

## Soft name-hide is incomplete

Name lists miss `button`, `button Instance*`, `button label`, `button bg`, `label`, `Particle Emitter*`, nested Groups. Always finish with `_scene` keep-set traverse.
