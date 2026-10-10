.pragma library

/*! Online room helpers for Logos delivery_module topics. */

var TOPIC_PREFIX = "/ridge-fire/1/"
var TOPIC_SUFFIX = "/proto"
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function makeRoomCode(seed) {
    var s = seed === undefined ? Math.floor(Math.random() * 1e9) : seed
    var out = ""
    for (var i = 0; i < 6; i++) {
        s = (s * 1103515245 + 12345) >>> 0
        out += CODE_ALPHABET.charAt(s % CODE_ALPHABET.length)
    }
    return out
}

function normalizeCode(code) {
    if (!code)
        return ""
    return String(code).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
}

function topicForRoom(code) {
    return TOPIC_PREFIX + normalizeCode(code).toLowerCase() + TOPIC_SUFFIX
}

function nodeConfigJson() {
    // logos.dev: no RLN membership gate. Ephemeral ports via layered config.
    return JSON.stringify({
        mode: "Edge",
        preset: "logos.dev",
        messagingOverrides: {
            anonymityLevel: "None"
        }
    })
}

function encodeMessage(obj) {
    return JSON.stringify(obj)
}

function decodeMessage(raw) {
    if (raw === undefined || raw === null)
        return null
    var text = ""
    if (typeof raw === "string") {
        // Hex with spaces (delivery-demo style) or plain JSON UTF-8.
        var trimmed = raw.trim()
        if (/^[0-9a-fA-F]{2}(\s+[0-9a-fA-F]{2})+$/.test(trimmed)) {
            var parts = trimmed.split(/\s+/)
            var chars = []
            for (var i = 0; i < parts.length; i++)
                chars.push(String.fromCharCode(parseInt(parts[i], 16)))
            text = chars.join("")
        } else {
            text = trimmed
        }
    } else if (typeof raw === "object" && raw.length !== undefined) {
        // Array-like byte list
        var arr = []
        for (var j = 0; j < raw.length; j++)
            arr.push(String.fromCharCode(raw[j]))
        text = arr.join("")
    } else {
        text = String(raw)
    }
    try {
        return JSON.parse(text)
    } catch (e) {
        return null
    }
}

function utf8ToLatin1Payload(text) {
    // callModule JSON path typically UTF-8 encodes QString → bytes for vector<uint8_t>.
    return text
}

function isOwnEcho(msg, senderId) {
    return msg && msg.sid === senderId
}
