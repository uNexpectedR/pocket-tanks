import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadScores() {
  const code = fs
    .readFileSync(path.join(root, "qml/js/Scores.js"), "utf8")
    .replace(/^\.pragma library\s*/m, "")
  const sandbox = { Math, console, Array, JSON, String, Date }
  vm.runInNewContext(code, sandbox, { filename: "Scores.js" })
  return sandbox
}

const S = loadScores()

assert.equal(S.sanitizeName("Neo"), "Neo")
assert.equal(S.sanitizeName("bad name"), "")
assert.equal(S.sanitizeName("x"), "")
assert.equal(S.sanitizeName("A".repeat(20)), "A".repeat(16))
assert.equal(S.sanitizeName("runner_01"), "runner_01")

assert.equal(S.clampScore(-1), 0)
assert.equal(S.clampScore("nope"), 0)
assert.equal(S.clampScore(S.MAX_SCORE + 1), S.MAX_SCORE)

{
  const board = S.recordScore([], "Ada", 120)
  assert.equal(board.length, 1)
  assert.equal(board[0].score, 120)
  const up = S.recordScore(board, "Ada", 80)
  assert.equal(up[0].score, 120)
  const better = S.recordScore(up, "Ada", 200)
  assert.equal(better[0].score, 200)
}

{
  const merged = S.mergeBoard(
    [{ name: "Ada", score: 10, at: 1 }],
    [{ name: "Bea", score: 50, at: 2 }, { name: "Ada", score: 5, at: 3 }, { name: "<script>", score: 99, at: 4 }]
  )
  assert.equal(merged.length, 2)
  assert.equal(merged[0].name, "Bea")
  assert.equal(merged[1].score, 10)
}

{
  const json = S.boardToJson([{ name: "Zed", score: 9, at: 1 }])
  const parsed = S.parseBoardJson(json)
  assert.equal(parsed[0].name, "Zed")
  assert.equal(S.parseBoardJson("not-json").length, 0)
  assert.equal(S.parseBoardJson("{\"entries\":[{\"name\":\"!\",\"score\":1}]}").length, 0)
}

console.log("scores.test.mjs ok")
