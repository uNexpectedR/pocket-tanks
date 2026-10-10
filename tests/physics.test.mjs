import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadPragmaJs(rel) {
  const code = fs
    .readFileSync(path.join(root, rel), "utf8")
    .replace(/^\.pragma library\s*/m, "")
    .replace(/^\.import .*$/gm, "")
  const sandbox = { Math, console, Array }
  vm.runInNewContext(code, sandbox, { filename: rel })
  return sandbox
}

const Terrain = loadPragmaJs("qml/js/Terrain.js")
const Physics = loadPragmaJs("qml/js/Physics.js")

{
  const h = Terrain.createHeightmap(200, 300, 40, 3)
  assert.equal(h.length, 200)
  assert.ok(h.every((v) => Number.isFinite(v)))
}

{
  const h = Terrain.createHeightmap(120, 200, 10, 1)
  const before = h[60]
  Terrain.carveCrater(h, 60, 20, 1)
  assert.ok(h[60] > before, "crater should lower the surface (increase y)")
}

{
  const h = Terrain.createHeightmap(120, 200, 10, 1)
  const before = h[60]
  Terrain.pileDirt(h, 60, 20, 24, 40)
  assert.ok(h[60] < before, "pile should raise the surface (decrease y)")
}

{
  const right = Physics.launchVelocity(45, 50, 1)
  const left = Physics.launchVelocity(45, 50, -1)
  assert.ok(right.vx > 0)
  assert.ok(left.vx < 0)
  assert.ok(right.vy < 0)
}

{
  const shot = { x: 0, y: 0, vx: 10, vy: -10, age: 0 }
  Physics.stepProjectile(shot, 0.1)
  assert.ok(shot.vy > -10)
  assert.ok(shot.age > 0)
}

{
  assert.equal(Physics.damageFalloff(0, 40, 50), 50)
  assert.equal(Physics.damageFalloff(40, 40, 50), 0)
  assert.ok(Physics.damageFalloff(20, 40, 50) < 50)
  // Mid-range should be softer than old t² but still meaningful
  const mid = Physics.damageFalloff(20, 40, 50)
  assert.ok(mid > 10 && mid < 45)
}

{
  const tank = { x: 100, y: 200, hp: 100 }
  assert.equal(Physics.hitsTank({ x: 100, y: 197 }, tank), true)
  assert.equal(Physics.hitsTank({ x: 140, y: 200 }, tank), false)
  const weapon = { maxDamage: 40, blastRadius: 40, directMul: 1.4 }
  assert.equal(Physics.resolveDamage(0, weapon, true), 56)
  assert.ok(Physics.resolveDamage(20, weapon, false) < 40)
}

{
  const shot = { x: 50, y: 98, radius: 5, vx: 0, vy: 0, age: 0 }
  const heights = new Array(100).fill(100)
  // y + radius*0.4 = 100 → kisses the crest
  assert.equal(Physics.hitsTerrain(shot, (h, x) => h[Math.floor(x)], heights), true)
  shot.y = 90
  assert.equal(Physics.hitsTerrain(shot, (h, x) => h[Math.floor(x)], heights), false)
}

console.log("physics.test.mjs: ok")
