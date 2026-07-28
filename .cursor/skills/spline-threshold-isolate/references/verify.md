# Verify — Spline isolate

## Browser smoke (Playwright / DevTools)

After load of transparent host:

```js
await new Promise((r) => {
  const t = setInterval(() => {
    if (window.__thresholdIsolate) { clearInterval(t); r() }
  }, 200)
  setTimeout(r, 30000)
})

const scene = window.__splineApp._scene
const leftover = []
scene.traverse((o) => {
  if (o.visible && o.name && o !== scene) leftover.push(o.name)
})
console.log(window.__thresholdIsolate, [...new Set(leftover)])
```

**Pass when:**

- `foundSphere === true`
- `via === 'scene-traverse'`
- leftover ⊆ `Scene*`, `Sphere`, `Camera`, `Directional Light`, `Default Ambient Light`, other `*Light*`
- screenshot shows sphere only on black (no top-right nav, no star particles)

## Build

```bash
cd runtime/vanguard-ball-creator-v1 && npm run build
```

Must emit both `dist/index.html` and `dist/transparent.html`.

## Live URLs

- Isolated: `https://vanguard-golf-game-v2.vercel.app/creator/transparent.html`
- Ball Lab: `https://vanguard-golf-game-v2.vercel.app/creator/`
