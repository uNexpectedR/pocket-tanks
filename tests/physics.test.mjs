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

const Terrain = loadPragmaJs("js/Terrain.js")
const Physics = loadPragmaJs("js/Physics.js")

// Heightmap length and flanks.
{
  const h = Terrain.createHeightmap(200, 300, 40, 3)
  assert.equal(h.length, 200)
  assert.ok(h.every((v) => Number.isFinite(v)))
}

// Crater digs downward in screen space (y increases).
{
  const h = Terrain.createHeightmap(120, 200, 10, 1)
  const before = h[60]
  Terrain.carveCrater(h, 60, 20, 1)
  assert.ok(h[60] > before, "crater should lower the surface (increase y)")
}

// Launch faces left/right.
{
  const right = Physics.launchVelocity(45, 50, 1)
  const left = Physics.launchVelocity(45, 50, -1)
  assert.ok(right.vx > 0)
  assert.ok(left.vx < 0)
  assert.ok(right.vy < 0)
}

// Gravity pulls projectile down over time.
{
  const shot = { x: 0, y: 0, vx: 10, vy: -10, age: 0 }
  Physics.stepProjectile(shot, 0.1)
  assert.ok(shot.vy > -10)
  assert.ok(shot.age > 0)
}

// Damage falloff.
{
  assert.equal(Physics.damageFalloff(0, 40, 50), 50)
  assert.equal(Physics.damageFalloff(40, 40, 50), 0)
  assert.ok(Physics.damageFalloff(20, 40, 50) < 50)
}

console.log("physics.test.mjs: ok")
