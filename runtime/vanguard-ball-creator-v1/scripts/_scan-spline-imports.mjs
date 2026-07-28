import fs from 'node:fs'

const s = fs.readFileSync('node_modules/@splinetool/loader/build/SplineLoader.js', 'utf8')
const re = /import\{([^}]+)\}from"three"/g
const names = new Set()
let m
while ((m = re.exec(s))) {
  m[1].split(',').forEach((n) => names.add(n.trim()))
}
console.log([...names].sort().join('\n'))
