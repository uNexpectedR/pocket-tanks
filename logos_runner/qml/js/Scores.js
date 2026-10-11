.pragma library

/*! Callsign + score board rules. Validate everything that crosses the wire. */

var MAX_NAME = 16
var MAX_ENTRIES = 20
var MAX_SCORE = 9999999
var NAME_RE = /^[A-Za-z0-9_\-.]{2,16}$/

function sanitizeName(raw) {
    if (raw === undefined || raw === null)
        return ""
    var s = String(raw).trim()
    if (s.length > MAX_NAME)
        s = s.slice(0, MAX_NAME)
    if (!NAME_RE.test(s))
        return ""
    return s
}

function clampScore(n) {
    var v = Math.floor(Number(n))
    if (!(v >= 0) || v !== v)
        return 0
    return v > MAX_SCORE ? MAX_SCORE : v
}

function normalizeEntry(e) {
    if (!e || typeof e !== "object")
        return null
    var name = sanitizeName(e.name)
    var score = clampScore(e.score)
    var at = Math.floor(Number(e.at) || 0)
    if (!name || score <= 0)
        return null
    if (at < 0 || at > Date.now() + 60000)
        at = Date.now()
    return { name: name, score: score, at: at }
}

function mergeBoard(localList, remoteList) {
    var map = {}
    var lists = [localList || [], remoteList || []]
    for (var li = 0; li < lists.length; li++) {
        var list = lists[li]
        for (var i = 0; i < list.length; i++) {
            var e = normalizeEntry(list[i])
            if (!e)
                continue
            var prev = map[e.name]
            if (!prev || e.score > prev.score || (e.score === prev.score && e.at < prev.at))
                map[e.name] = e
        }
    }
    var out = []
    for (var k in map)
        out.push(map[k])
    out.sort(function (a, b) {
        if (b.score !== a.score)
            return b.score - a.score
        return a.at - b.at
    })
    return out.slice(0, MAX_ENTRIES)
}

function recordScore(board, name, score) {
    var entry = normalizeEntry({ name: name, score: score, at: Date.now() })
    if (!entry)
        return board || []
    return mergeBoard(board || [], [entry])
}

function parseBoardJson(text) {
    if (!text)
        return []
    try {
        var data = typeof text === "string" ? JSON.parse(text) : text
        if (!data || typeof data !== "object")
            return []
        var rows = data.entries || data
        if (!rows || typeof rows.length !== "number")
            return []
        return mergeBoard(rows, [])
    } catch (err) {
        return []
    }
}

function boardToJson(board) {
    return JSON.stringify({ v: 1, entries: mergeBoard(board || [], []) })
}
