import QtQuick 2.15
import "js/Net.js" as Net

/*!
  Host/join over Logos delivery_module (Basecamp / standalone).
  Pure QML: logos.callModuleAsync + logos.onModuleEvent.
  Falls back cleanly when `logos` is missing (qmlscene preview).
*/
Item {
    id: root

    property string role: "none"          // none | local | host | guest
    property string roomCode: ""
    property string senderId: ""
    property string status: "idle"
    property string detail: ""
    property bool nodeReady: false
    property bool roomReady: false
    property bool peerPresent: false
    property int localSeat: 0             // host=0 Amber, guest=1 Slate
    property int matchSeed: 0
    property bool matchStarted: false
    property bool logosAvailable: false

    readonly property string topic: roomCode ? Net.topicForRoom(roomCode) : ""

    signal matchReady(int seed)
    signal remoteFire(var msg)
    signal peerHello(var msg)
    signal netError(string message)

    function _hasLogos() {
        return typeof logos !== "undefined" && logos !== null
    }

    function _setStatus(s, d) {
        status = s
        detail = d || ""
    }

    function _call(method, args, onOk, onFail) {
        if (!_hasLogos()) {
            if (onFail)
                onFail("Logos bridge unavailable (run inside Basecamp)")
            return
        }
        logos.callModuleAsync("delivery_module", method, args || [], function (payload) {
            var result = null
            try {
                result = typeof payload === "string" ? JSON.parse(payload) : payload
            } catch (e) {
                result = { raw: payload }
            }
            // LogosResult-shaped or plain string error conventions vary by host.
            var ok = true
            var err = ""
            if (result && typeof result === "object") {
                if (result.success === false) {
                    ok = false
                    err = result.error || result.message || "call failed"
                } else if (result.error && !result.success) {
                    ok = false
                    err = String(result.error)
                }
            }
            if (ok) {
                if (onOk)
                    onOk(result)
            } else {
                if (onFail)
                    onFail(err)
                else
                    root.netError(err)
            }
        }, function (err) {
            var msg = err ? String(err) : "delivery_module call failed"
            if (onFail)
                onFail(msg)
            else
                root.netError(msg)
        })
    }

    function armEvents() {
        if (!_hasLogos())
            return false
        logosAvailable = true
        logos.onModuleEvent("delivery_module", "messageReceived")
        logos.onModuleEvent("delivery_module", "connectionStateChanged")
        logos.onModuleEvent("delivery_module", "messageError")
        logos.onModuleEvent("delivery_module", "nodeStarted")
        return true
    }

    function ensureNode(done) {
        if (!_hasLogos()) {
            _setStatus("error", "Online play needs Logos Basecamp with delivery_module")
            if (done)
                done(false)
            return
        }
        armEvents()
        _setStatus("connecting", "Starting Logos delivery node (logos.dev)…")
        _call("getNodeInfo", ["IsRunning"], function (info) {
            var running = false
            if (info === true || info === "true")
                running = true
            else if (info && info.value !== undefined)
                running = String(info.value) === "true" || info.value === true
            else if (info && info.result !== undefined)
                running = String(info.result) === "true"
            if (running) {
                root.nodeReady = true
                _setStatus("online", "Delivery node already running")
                if (done)
                    done(true)
                return
            }
            var cfg = Net.nodeConfigJson()
            _call("createNode", [cfg], function () {
                _call("start", [], function () {
                    root.nodeReady = true
                    _setStatus("online", "Connected to logos.dev")
                    if (done)
                        done(true)
                }, function (e) {
                    // start may be async; treat soft failure if nodeStarted arrives
                    _setStatus("connecting", "Waiting for node… " + e)
                    root.nodeReady = true
                    if (done)
                        done(true)
                })
            }, function (e) {
                // Node may already exist from another module.
                if (String(e).toLowerCase().indexOf("already") >= 0) {
                    _call("start", [], function () {
                        root.nodeReady = true
                        _setStatus("online", "Joined existing delivery node")
                        if (done)
                            done(true)
                    }, function () {
                        root.nodeReady = true
                        _setStatus("online", "Using existing delivery node")
                        if (done)
                            done(true)
                    })
                } else {
                    _setStatus("error", e)
                    root.netError(e)
                    if (done)
                        done(false)
                }
            })
        }, function () {
            // getNodeInfo missing — try create anyway
            var cfg = Net.nodeConfigJson()
            _call("createNode", [cfg], function () {
                _call("start", [], function () {
                    root.nodeReady = true
                    _setStatus("online", "Connected to logos.dev")
                    if (done)
                        done(true)
                }, function (e) {
                    root.nodeReady = true
                    _setStatus("online", "Node starting…")
                    if (done)
                        done(true)
                })
            }, function (e) {
                _setStatus("error", e)
                if (done)
                    done(false)
            })
        })
    }

    function _subscribe(done) {
        _call("subscribe", [topic], function () {
            root.roomReady = true
            _setStatus("room", "Room " + roomCode + " — waiting for peer")
            if (done)
                done(true)
        }, function (e) {
            _setStatus("error", "Subscribe failed: " + e)
            if (done)
                done(false)
        })
    }

    function _send(obj) {
        if (!topic)
            return
        obj.sid = senderId
        obj.room = roomCode
        var payload = Net.encodeMessage(obj)
        _call("send", [topic, payload], function () {}, function (e) {
            _setStatus("warn", "Send failed: " + e)
        })
    }

    function startLocal() {
        role = "local"
        roomCode = ""
        roomReady = false
        peerPresent = false
        matchStarted = false
        localSeat = 0
        _setStatus("local", "Hotseat — pass the keyboard")
    }

    function hostGame() {
        role = "host"
        localSeat = 0
        senderId = "host-" + Math.floor(Math.random() * 1e6)
        roomCode = Net.makeRoomCode(Date.now() % 1e9)
        matchSeed = Math.floor(Math.random() * 1000)
        matchStarted = false
        peerPresent = false
        ensureNode(function (ok) {
            if (!ok)
                return
            _subscribe(function (ok2) {
                if (!ok2)
                    return
                _send({ t: "hello", role: "host", seed: matchSeed })
                _setStatus("room", "Share code " + roomCode + " — waiting for guest")
            })
        })
    }

    function joinGame(code) {
        role = "guest"
        localSeat = 1
        senderId = "guest-" + Math.floor(Math.random() * 1e6)
        roomCode = Net.normalizeCode(code)
        matchStarted = false
        peerPresent = false
        if (roomCode.length < 4) {
            _setStatus("error", "Enter a valid room code")
            return
        }
        ensureNode(function (ok) {
            if (!ok)
                return
            _subscribe(function (ok2) {
                if (!ok2)
                    return
                _send({ t: "hello", role: "guest" })
                _setStatus("room", "Joined " + roomCode + " — waiting for host")
            })
        })
    }

    function broadcastFire(intent) {
        if (role === "local" || !intent)
            return
        _send(intent)
    }

    function broadcastStart() {
        if (role !== "host")
            return
        _send({ t: "start", seed: matchSeed })
        matchStarted = true
        root.matchReady(matchSeed)
    }

    function handleIncoming(rawTopic, rawPayload) {
        if (topic && rawTopic && String(rawTopic) !== topic)
            return
        var msg = Net.decodeMessage(rawPayload)
        if (!msg || !msg.t)
            return
        if (Net.isOwnEcho(msg, senderId))
            return
        if (msg.t === "hello") {
            peerPresent = true
            peerHello(msg)
            if (role === "host" && msg.role === "guest") {
                _setStatus("room", "Guest joined — starting match")
                broadcastStart()
            } else if (role === "guest" && msg.role === "host") {
                if (msg.seed !== undefined)
                    matchSeed = msg.seed
                _setStatus("room", "Host found — waiting for start")
                _send({ t: "hello", role: "guest" })
            }
        } else if (msg.t === "start") {
            if (msg.seed !== undefined)
                matchSeed = msg.seed
            matchStarted = true
            _setStatus("play", "Online match live")
            root.matchReady(matchSeed)
        } else if (msg.t === "fire") {
            root.remoteFire(msg)
        }
    }

    Connections {
        target: _hasLogos() ? logos : null
        ignoreUnknownSignals: true
        function onModuleEventReceived(moduleName, eventName, data) {
            if (moduleName !== "delivery_module")
                return
            if (eventName === "connectionStateChanged") {
                var st = data && data.length ? String(data[0]) : ""
                if (st)
                    root._setStatus(root.roomReady ? "room" : "online", "Link: " + st)
            } else if (eventName === "messageReceived") {
                // data: [hash, topic, payload, source, ts] (order from delivery docs)
                var t = data && data.length > 1 ? data[1] : ""
                var payload = data && data.length > 2 ? data[2] : ""
                root.handleIncoming(t, payload)
            } else if (eventName === "messageError") {
                var err = data && data.length > 2 ? String(data[2]) : "message error"
                root._setStatus("warn", err)
            } else if (eventName === "nodeStarted") {
                root.nodeReady = true
            }
        }
    }

    Component.onCompleted: {
        logosAvailable = _hasLogos()
        if (logosAvailable)
            armEvents()
    }
}
