.pragma library

/*! Shared high-score topic helpers for logos.dev delivery. */

var TOPIC = "/logos-runner/1/scores/proto"

function nodeConfigJson() {
    return JSON.stringify({
        mode: "Edge",
        preset: "logos.dev",
        messagingOverrides: { anonymityLevel: "None" }
    })
}

function encodeScore(entry, senderId) {
    return JSON.stringify({
        t: "score",
        v: 1,
        sid: String(senderId || ""),
        name: entry.name,
        score: entry.score,
        at: entry.at
    })
}

function decodeMessage(raw) {
    if (raw === undefined || raw === null)
        return null
    var text = typeof raw === "string" ? raw.trim() : String(raw)
    if (!text)
        return null
    try {
        return JSON.parse(text)
    } catch (e) {
        return null
    }
}

function isOwnEcho(msg, senderId) {
    return !!(msg && senderId && msg.sid === senderId)
}
