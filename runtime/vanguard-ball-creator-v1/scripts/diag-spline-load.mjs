/**
 * Diagnose Spline .splinecode node/material keys under current three.
 * Additive diagnostic — does not modify scene assets.
 */
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, '..')

// Load three CJS build so we can monkey-patch removed symbols
const THREE = require('three')
THREE.LinearEncoding = 3000
THREE.sRGBEncoding = 3001
if (!THREE.WebGLMultipleRenderTargets) {
  THREE.WebGLMultipleRenderTargets = THREE.WebGLRenderTarget
}

// Prefer mergeBufferGeometries alias if missing
try {
  const utils = require('three/examples/jsm/utils/BufferGeometryUtils.js')
  if (!utils.mergeBufferGeometries && utils.mergeGeometries) {
    utils.mergeBufferGeometries = utils.mergeGeometries
  }
} catch {
  /* ignore */
}

const loaderMod = await import('@splinetool/loader')
const SplineLoader = loaderMod.default || loaderMod.SplineLoader || loaderMod
console.log('loader export keys', Object.keys(loaderMod))
console.log('SplineLoader', typeof SplineLoader)

const url = 'https://prod.spline.design/SjNY5eqeMhj-USkx/scene.splinecode'
const head = await fetch(url)
console.log('fetch status', head.status, 'bytes', (await head.arrayBuffer()).byteLength)

try {
  const loader = new SplineLoader()
  const scene = await loader.loadAsync(url)
  console.log('loaded scene', scene?.type, scene?.uuid)

  const nodes = {}
  const materials = {}
  const meshSummary = []

  scene.traverse((child) => {
    if (child.name) {
      nodes[child.name] = {
        type: child.type,
        geo: Boolean(child.geometry),
        geoType: child.geometry?.type,
        vertCount: child.geometry?.attributes?.position?.count ?? null,
        mat: child.material?.name || null,
        matType: child.material?.type || null,
        visible: child.visible,
        pos: child.position?.toArray?.() ?? null,
        scale: child.scale?.toArray?.() ?? null,
      }
    }
    if (child.isMesh) {
      meshSummary.push({
        name: child.name,
        verts: child.geometry?.attributes?.position?.count,
        mat: child.material?.name,
        matType: child.material?.type,
      })
    }
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      for (const m of mats) {
        if (m?.name) materials[m.name] = m.type
      }
    }
  })

  const out = {
    nodeKeys: Object.keys(nodes),
    materialKeys: Object.keys(materials),
    sphere: nodes.Sphere || null,
    sphereMaterial: materials['Sphere Material'] || null,
    nodes,
    materials,
    meshSummary,
  }
  const outPath = path.join(root, 'dist', 'spline-nodes-diag.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log('NODE KEYS', out.nodeKeys)
  console.log('MATERIAL KEYS', out.materialKeys)
  console.log('Sphere', JSON.stringify(out.sphere))
  console.log('Sphere Material', out.sphereMaterial)
  console.log('meshes', meshSummary.length, meshSummary.slice(0, 20))
  console.log('wrote', outPath)
} catch (e) {
  console.error('LOAD FAIL:', e.message)
  console.error(e.stack)
  process.exitCode = 1
}
