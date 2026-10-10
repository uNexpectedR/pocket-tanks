import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadFile(rel, sandbox) {
  const code = fs
    .readFileSync(path.join(root, rel), "utf8")
    .replace(/^\.pragma library\s*/m, "")
    .replace(/^\.import .*$/gm, "")
  vm.runInNewContext(code, sandbox, { filename: rel })
}

function loadBundle() {
  const sandbox = { Math, console, Array }
  for (const rel of ["js/Terrain.js", "js/Physics.js", "js/Weapons.js"])
    loadFile(rel, sandbox)

  sandbox.Terrain = {
    createHeightmap: sandbox.createHeightmap,
    sampleHeight: sandbox.sampleHeight,
    carveCrater: sandbox.carveCrater,
    settleOnSurface: sandbox.settleOnSurface,
    clampTankX: sandbox.clampTankX,
    surfaceNormal: sandbox.surfaceNormal,
  }
  sandbox.Physics = {
    launchVelocity: sandbox.launchVelocity,
    muzzlePoint: sandbox.muzzlePoint,
    stepProjectile: sandbox.stepProjectile,
    outOfBounds: sandbox.outOfBounds,
    hitsTerrain: sandbox.hitsTerrain,
    hitsTank: sandbox.hitsTank,
    damageFalloff: sandbox.damageFalloff,
    predictArc: sandbox.predictArc,
  }
  sandbox.Weapons = {
    SHELL: sandbox.SHELL,
    catalog: sandbox.catalog,
    byId: sandbox.byId,
  }

  loadFile("js/Game.js", sandbox)
  return sandbox
}

const G = loadBundle()
const state = G.createMatch(960, 540, 11)
assert.equal(state.tanks.length, 2)
assert.equal(state.phase, "aim")
assert.ok(state.tanks[0].x < state.tanks[1].x)

G.setAngle(state, 40)
G.setPower(state, 70)
assert.equal(state.tanks[0].angle, 40)
assert.equal(state.tanks[0].power, 70)

assert.equal(G.fire(state), true)
assert.equal(state.phase, "flight")
assert.ok(state.projectile)

let guard = 0
while (state.phase !== "aim" && state.phase !== "over" && guard < 2000) {
  G.tick(state, 1 / 60)
  guard++
}
assert.ok(state.phase === "aim" || state.phase === "over")
assert.ok(guard < 2000)

console.log("game.test.mjs: ok")
