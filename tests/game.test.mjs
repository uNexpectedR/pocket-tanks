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
  for (const rel of [
    "qml/js/Terrain.js",
    "qml/js/Physics.js",
    "qml/js/Weapons.js",
    "qml/js/Effects.js",
    "qml/js/Names.js",
    "qml/js/Net.js",
    "qml/js/Delivery.js",
  ])
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
    stepProjectileSafe: sandbox.stepProjectileSafe,
    outOfBounds: sandbox.outOfBounds,
    hitsTerrain: sandbox.hitsTerrain,
    hitsTank: sandbox.hitsTank,
    tankHitFactor: sandbox.tankHitFactor,
    distanceToTank: sandbox.distanceToTank,
    damageFalloff: sandbox.damageFalloff,
    resolveDamage: sandbox.resolveDamage,
    predictArc: sandbox.predictArc,
  }
  sandbox.Weapons = {
    HE_SHELL: sandbox.HE_SHELL,
    catalog: sandbox.catalog,
    byId: sandbox.byId,
    nextId: sandbox.nextId,
    names: sandbox.names,
    ids: sandbox.ids,
  }
  sandbox.Effects = {
    spawnSparks: sandbox.spawnSparks,
    pushExplosion: sandbox.pushExplosion,
    pushMuzzle: sandbox.pushMuzzle,
    tickExplosions: sandbox.tickExplosions,
    tickSparks: sandbox.tickSparks,
    tickMuzzles: sandbox.tickMuzzles,
    tickAll: sandbox.tickAll,
    busy: sandbox.busy,
  }
  sandbox.Names = {
    pickPair: sandbox.pickPair,
    POOL: sandbox.POOL,
  }

  loadFile("qml/js/Game.js", sandbox)
  return sandbox
}

const G = loadBundle()
const state = G.createMatch(960, 540, 11)
assert.equal(state.tanks.length, 2)
assert.equal(state.phase, "aim")
assert.ok(state.tanks[0].x < state.tanks[1].x)
assert.equal(G.catalog().length, 9)
assert.ok(state.tanks[0].name.length > 0)
assert.ok(state.tanks[1].name.length > 0)
assert.notEqual(state.tanks[0].name, state.tanks[1].name)

const namesA = G.pickPair(11)
const namesB = G.pickPair(11)
assert.deepEqual(namesA, namesB)
assert.notEqual(G.pickPair(11).left, G.pickPair(99).left)

G.setAngle(state, 40)
G.setPower(state, 70)
G.setWeapon(state, "dirt")
assert.equal(state.weaponId, "dirt")

assert.equal(G.fire(state), true)
assert.equal(state.phase, "flight")

let guard = 0
while (state.phase !== "aim" && state.phase !== "over" && guard < 4000) {
  G.tick(state, 1 / 60)
  guard++
}
assert.ok(state.phase === "aim" || state.phase === "over")

const s2 = G.createMatch(960, 540, 22)
const intent = G.fireIntent(s2)
assert.ok(intent)
assert.equal(G.applyRemoteFire(s2, intent), true)
assert.equal(s2.phase, "flight")

assert.equal(G.normalizeCode("ab-cd!1"), "ABCD1")
assert.ok(G.topicForRoom("ABC123").includes("ridge-fire"))
assert.deepEqual(G.decodeMessage(G.encodeMessage({ t: "hello", seed: 3 })), { t: "hello", seed: 3 })
assert.equal(G.parseResult(JSON.stringify({ success: false, error: "x" })).ok, false)
assert.equal(G.parseResult(JSON.stringify({ success: true })).ok, true)

assert.ok(G.ids().includes("spike"))
assert.ok(G.ids().includes("skipper"))
assert.equal(G.names().length, 9)

console.log("game.test.mjs: ok")
