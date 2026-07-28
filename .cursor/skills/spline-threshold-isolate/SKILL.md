---
name: spline-threshold-isolate
description: >-
  Isolate a single Spline object (e.g. Threshold Sphere) from a full .splinecode
  scene for transparent/Tauri hosts and Ball Lab props — no iframe, no UI chrome.
  Use when embedding Spline in React/r3f, fixing white/blank Spline screens,
  stripping Text/buttons/particles, or shipping /creator/transparent.html style hosts.
---

# Spline Threshold Sphere Isolate

Execute this exact stack whenever isolating a Spline hero object from a busy UI scene.

## Canonical solution (do not reinvent)

1. **Host with `@splinetool/react-spline`** — not `@splinetool/r3f-spline` as the primary transparent host.
2. **Scene URL** must be `.splinecode` from `prod.spline.design/.../scene.splinecode`.
3. **On load**, isolate via **`app._scene` Three.js traverse** — keep Sphere + lights + cameras + their ancestors; hide everything else.
4. **Never call `app.getAllObjects()`** on Threshold Dark Ambient — it throws `Cannot read properties of undefined (reading 'map')` and blanks the page.
5. **Avoid `findObjectByName('Particle Emitter')`** — same crash class.
6. Match Spline export camera scale if you ever use vanilla `SplineLoader` + Three (near=70, far=100000, position z≈1000). Wrong camera = white/empty.

## Reference implementation (this repo)

| Piece | Path |
|-------|------|
| Transparent host | `runtime/vanguard-ball-creator-v1/src/transparent-main.jsx` |
| Isolation helper | `runtime/vanguard-ball-creator-v1/src/spline/isolateSphere.js` |
| Scene URL constant | `runtime/vanguard-ball-creator-v1/src/spline/thresholdUrl.js` |
| Ball Lab R3F path | `runtime/vanguard-ball-creator-v1/src/spline/ThresholdSphere.jsx` |
| Vite multi-page + three shims | `runtime/vanguard-ball-creator-v1/vite.config.js` |
| Live | https://vanguard-golf-game-v2.vercel.app/creator/transparent.html |

Threshold scene (verified):

```
https://prod.spline.design/SjNY5eqeMhj-USkx/scene.splinecode
```

## Required packages

```bash
npm i @splinetool/react-spline @splinetool/runtime
# Ball Lab / R3F prop path also uses:
npm i @splinetool/loader
```

Keep modern `three` for drei/r3f. If `@splinetool/loader` build fails, use Vite shims in `src/shims/` + `splineThreeCompat` plugin (LinearEncoding, sRGBEncoding, mergeBufferGeometries, WebGLMultipleRenderTargets). **react-spline host does not need those for runtime play.**

## Flawless host recipe

```jsx
import Spline from '@splinetool/react-spline'
import { isolateSphereViaRuntime } from './spline/isolateSphere.js'

function onLoad(app) {
  try {
    window.__thresholdIsolate = isolateSphereViaRuntime(app)
  } catch (e) {
    window.__thresholdIsolate = { ok: false, error: String(e) }
  }
  app.setBackgroundColor?.('#000000')
  app.requestRender?.()
  window.__splineApp = app
}

<Spline scene={THRESHOLD_SPLINE} style={{ width: '100%', height: '100%' }} onLoad={onLoad} />
```

Isolation core (must keep ancestors of Sphere):

```js
// KEEP: Sphere, Camera, *Light*, Scene* — plus parent chain
// HIDE: everything else on app._scene
const keep = collectKeepSet(app._scene)
app._scene.traverse((obj) => {
  if (obj === app._scene) return
  obj.visible = keep.has(obj)
})
```

See [references/pitfalls.md](references/pitfalls.md) and [references/verify.md](references/verify.md).

## Deploy gate

```bash
cd runtime/vanguard-ball-creator-v1
npm run build
# copy dist/* → deploy/vanguard-golf-game-v2/creator/
npx vercel deploy --prod --yes
```

Verify leftover visible names are only: `Scene*`, `Sphere`, `Camera`, `*Light*`. No Text/button/particle.

## Success criteria

- Not white / not empty black forever
- Canvas present; Sphere visible (liquid metal)
- No UI text, CTAs, buttons, ellipses, particles
- `window.__thresholdIsolate.foundSphere === true`
- `window.__thresholdIsolate.via === 'scene-traverse'`
