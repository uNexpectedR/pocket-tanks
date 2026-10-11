import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadGame() {
  const code = fs
    .readFileSync(path.join(root, "qml/js/Game.js"), "utf8")
    .replace(/^\.pragma library\s*/m, "")
  const sandbox = { Math, console, Array, JSON, String, Date }
  vm.runInNewContext(code, sandbox, { filename: "Game.js" })
  return sandbox
}

const G = loadGame()

{
  const run = G.createRun(42)
  assert.equal(run.alive, true)
  assert.equal(run.score, 0)
  G.jump(run)
  assert.equal(run.onGround, false)
  for (let i = 0; i < 120; i++) G.step(run, 1 / 60)
  assert.ok(run.distance > 0)
  assert.ok(run.score >= 0)
  assert.ok(run.score <= G.MAX_SCORE)
}

{
  const run = G.createRun(7)
  run.alive = false
  const before = run.distance
  G.step(run, 1)
  assert.equal(run.distance, before)
}

{
  assert.equal(G.finalScore({ score: -3 }), 0)
  assert.equal(G.finalScore({ score: G.MAX_SCORE + 50 }), G.MAX_SCORE)
}

console.log("game.test.mjs ok")
