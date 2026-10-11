import QtQuick 2.15
import Qt.labs.settings 1.0
import "js/Scores.js" as Scores
import "js/Delivery.js" as Delivery
import "js/BoardNet.js" as BoardNet

/*! Local board (Settings) + optional delivery_module sync on logos.dev. */
Item {
    id: root

    property string callsign: ""
    property var board: []
    property string syncStatus: "local"
    property string syncDetail: ""
    property string senderId: ""
    property bool nodeReady: false

    readonly property var logosApi: typeof logos !== "undefined" ? logos : null

    signal boardChanged()

    Settings {
        id: store
        category: "logos_runner"
        property string callsign: ""
        property string boardJson: "{\"v\":1,\"entries\":[]}"
    }

    Component.onCompleted: {
        callsign = Scores.sanitizeName(store.callsign)
        board = Scores.parseBoardJson(store.boardJson)
        senderId = "lr-" + Math.floor(Math.random() * 1e9)
        boardChanged()
    }

    function persist() {
        store.callsign = callsign
        store.boardJson = Scores.boardToJson(board)
    }

    function setCallsign(name) {
        var clean = Scores.sanitizeName(name)
        if (!clean)
            return false
        callsign = clean
        persist()
        return true
    }

    function submitScore(score) {
        var next = Scores.recordScore(board, callsign, score)
        if (!next || next.length === 0)
            return null
        board = next
        persist()
        boardChanged()
        publishTop()
        return Scores.normalizeEntry({ name: callsign, score: score, at: Date.now() })
    }

    function mergeRemote(entries) {
        var next = Scores.mergeBoard(board, entries)
        var before = Scores.boardToJson(board)
        var after = Scores.boardToJson(next)
        if (before === after)
            return
        board = next
        persist()
        boardChanged()
    }

    function ensureSync(done) {
        if (!Delivery.available(logosApi)) {
            syncStatus = "local"
            syncDetail = "Local board only — delivery_module not available"
            if (done)
                done(false)
            return
        }
        Delivery.armEvents(logosApi)
        syncStatus = "connecting"
        syncDetail = "Starting logos.dev delivery…"
        Delivery.bringUp(logosApi, BoardNet.nodeConfigJson(), function (ok, note) {
            if (!ok) {
                syncStatus = "local"
                syncDetail = note || "Delivery unavailable"
                if (done)
                    done(false)
                return
            }
            nodeReady = true
            Delivery.call(logosApi, "subscribe", [BoardNet.TOPIC], function () {
                syncStatus = "live"
                syncDetail = "Competitive board on logos.dev"
                publishTop()
                if (done)
                    done(true)
            }, function (err) {
                syncStatus = "local"
                syncDetail = "Subscribe failed: " + err
                if (done)
                    done(false)
            })
        })
    }

    function publishTop() {
        if (!nodeReady || !Delivery.available(logosApi) || !callsign)
            return
        var mine = null
        for (var i = 0; i < board.length; i++) {
            if (board[i].name === callsign) {
                mine = board[i]
                break
            }
        }
        if (!mine)
            return
        Delivery.call(logosApi, "send", [BoardNet.TOPIC, BoardNet.encodeScore(mine, senderId)], function () {}, function () {})
    }

    Connections {
        target: logosApi
        ignoreUnknownSignals: true
        function onModuleEvent(moduleName, eventName, data) {
            if (moduleName !== "delivery_module" || eventName !== "messageReceived")
                return
            var ev = Delivery.eventPayload(data)
            if (ev.topic !== BoardNet.TOPIC)
                return
            var msg = BoardNet.decodeMessage(ev.payload)
            if (!msg || msg.t !== "score" || msg.v !== 1)
                return
            if (BoardNet.isOwnEcho(msg, root.senderId))
                return
            var entry = Scores.normalizeEntry(msg)
            if (entry)
                root.mergeRemote([entry])
        }
    }
}
