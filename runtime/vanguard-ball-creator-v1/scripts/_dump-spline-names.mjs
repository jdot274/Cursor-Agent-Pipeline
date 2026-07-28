import SplineLoader from '@splinetool/loader'
import { createRequire } from 'node:module'

// Node-side dump of Spline object names from .splinecode
const url = 'https://prod.spline.design/SjNY5eqeMhj-USkx/scene.splinecode'
const loader = new SplineLoader()

loader.load(url, (scene) => {
  const names = []
  scene.traverse((o) => {
    if (o.name) names.push(`${o.type || o.constructor?.name}:${o.name}`)
  })
  console.log(JSON.stringify({ count: names.length, names }, null, 2))
  process.exit(0)
}, undefined, (err) => {
  console.error(err)
  process.exit(1)
})

setTimeout(() => {
  console.error('timeout')
  process.exit(2)
}, 60000)
