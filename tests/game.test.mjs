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
  const sandbox = { Math, console, Array, JSON, String, Date }
  for (const rel of ["qml/js/Terrain.js", "qml/js/Physics.js", "qml/js/Weapons.js", "qml/js/Net.js"])
    loadFile(rel, sandbox)

  sandbox.Terrain = {
    createHeightmap: sandbox.createHeightmap,
    sampleHeight: sandbox.sampleHeight,
    carveCrater: sandbox.carveCrater,
    pileDirt: sandbox.pileDirt,
    settleOnSurface: sandbox.settleOnSurface,
    clampTankX: sandbox.clampTankX,
    surfaceNormal: sandbox.surfaceNormal,
    slopeAt: sandbox.slopeAt,
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
    HE_SHELL: sandbox.HE_SHELL,
    DIRT_MOVER: sandbox.DIRT_MOVER,
    ROLLER: sandbox.ROLLER,
    BURSTER: sandbox.BURSTER,
    SHELL: sandbox.HE_SHELL,
    catalog: sandbox.catalog,
    byId: sandbox.byId,
    nextId: sandbox.nextId,
  }

  loadFile("qml/js/Game.js", sandbox)
  return sandbox
}

const G = loadBundle()
const state = G.createMatch(960, 540, 11)
assert.equal(state.tanks.length, 2)
assert.equal(state.phase, "aim")
assert.ok(state.tanks[0].x < state.tanks[1].x)
assert.equal(G.catalog().length, 4)

G.setAngle(state, 40)
G.setPower(state, 70)
G.setWeapon(state, "dirt")
assert.equal(state.weaponId, "dirt")
assert.equal(state.tanks[0].angle, 40)
assert.equal(state.tanks[0].power, 70)

assert.equal(G.fire(state), true)
assert.equal(state.phase, "flight")
assert.ok(state.projectile)

let guard = 0
while (state.phase !== "aim" && state.phase !== "over" && guard < 4000) {
  G.tick(state, 1 / 60)
  guard++
}
assert.ok(state.phase === "aim" || state.phase === "over")
assert.ok(guard < 4000)

// Remote fire lockstep
const s2 = G.createMatch(960, 540, 22)
const intent = G.fireIntent(s2)
assert.ok(intent)
assert.equal(G.applyRemoteFire(s2, intent), true)
assert.equal(s2.phase, "flight")

// Net helpers
assert.equal(G.normalizeCode("ab-cd!1"), "ABCD1")
assert.ok(G.topicForRoom("ABC123").includes("ridge-fire"))
assert.deepEqual(G.decodeMessage(G.encodeMessage({ t: "hello", seed: 3 })), { t: "hello", seed: 3 })

console.log("game.test.mjs: ok")
