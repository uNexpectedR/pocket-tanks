import QtQuick 2.15
import "js/Net.js" as Net
import "js/Delivery.js" as Delivery

/*! Room host/join over Logos delivery_module. UI state only — IPC in Delivery.js. */
Item {
    id: root

    property string role: "none"   // none | local | host | guest
    property string roomCode: ""
    property string senderId: ""
    property string status: "idle"
    property string detail: ""
    property bool nodeReady: false
    property bool roomReady: false
    property bool peerPresent: false
    property int localSeat: 0
    property int matchSeed: 0
    property bool matchStarted: false
    property bool logosAvailable: false
    property bool bringUpBusy: false

    readonly property string topic: roomCode ? Net.topicForRoom(roomCode) : ""
    readonly property var logosApi: typeof logos !== "undefined" ? logos : null

    signal matchReady(int seed)
    signal remoteFire(var msg)
    signal netError(string message)
    signal roomPrepared()

    property var _ensureDone: null

    function setStatus(s, d) {
        status = s
        detail = d || ""
    }

    function callDelivery(method, args, onOk, onFail) {
        Delivery.call(logosApi, method, args, onOk, function (err) {
            if (onFail)
                onFail(err)
            else
                root.netError(err)
        })
    }

    function clearBringUpTimers() {
        bringUpWatchdog.stop()
        runningPoll.stop()
    }

    function finishEnsure(ok, note) {
        if (!bringUpBusy)
            return
        bringUpBusy = false
        clearBringUpTimers()
        var cb = _ensureDone
        _ensureDone = null
        if (!ok) {
            nodeReady = false
            setStatus("error", note || "Delivery node failed to start")
            root.netError(detail)
            if (cb)
                cb(false)
            return
        }
        nodeReady = true
        setStatus("online", note || "Connected to logos.dev")
        if (cb)
            cb(true)
    }

    function markRunning(note) {
        finishEnsure(true, note || "Connected to logos.dev")
    }

    function beginWaitForRunning(hint) {
        setStatus("connecting", hint || "Waiting for delivery node…")
        runningPoll.restart()
        Delivery.checkRunning(logosApi, function (running) {
            if (running)
                markRunning("Delivery node ready")
        })
    }

    function ensureNode(done) {
        if (bringUpBusy) {
            if (done)
                done(false)
            return
        }
        if (!Delivery.available(logosApi)) {
            setStatus("error", "Online play needs Logos Basecamp with delivery_module")
            if (done)
                done(false)
            return
        }
        if (nodeReady) {
            if (done)
                done(true)
            return
        }

        _ensureDone = done
        bringUpBusy = true
        Delivery.armEvents(logosApi)
        logosAvailable = true
        setStatus("connecting", "Starting Logos delivery node (logos.dev)…")
        bringUpWatchdog.restart()

        Delivery.checkRunning(logosApi, function (running) {
            if (!bringUpBusy)
                return
            if (running) {
                markRunning("Delivery node already running")
                return
            }
            Delivery.issueCreateAndStart(logosApi, Net.nodeConfigJson(), function (ok, note) {
                if (!bringUpBusy)
                    return
                if (!ok) {
                    finishEnsure(false, note + " — load delivery_module in Module Inspector, then retry")
                    return
                }
                beginWaitForRunning("Delivery start dispatched — waiting for node…")
            })
        })
    }

    function subscribeRoom(done) {
        callDelivery("subscribe", [topic], function () {
            roomReady = true
            setStatus("room", "Room " + roomCode + " — waiting for peer")
            root.roomPrepared()
            if (done)
                done(true)
        }, function (e) {
            setStatus("error", "Subscribe failed: " + e)
            if (done)
                done(false)
        })
    }

    function send(obj) {
        if (!topic)
            return
        obj.sid = senderId
        obj.room = roomCode
        callDelivery("send", [topic, Net.encodeMessage(obj)], function () {}, function (e) {
            setStatus("warn", "Send failed: " + e)
        })
    }

    function startLocal() {
        role = "local"
        roomCode = ""
        roomReady = false
        peerPresent = false
        matchStarted = false
        localSeat = 0
        setStatus("local", "Hotseat — pass the keyboard")
    }

    function hostGame() {
        role = "host"
        localSeat = 0
        senderId = "host-" + Math.floor(Math.random() * 1e6)
        roomCode = Net.makeRoomCode(Date.now() % 1e9)
        matchSeed = Math.floor(Math.random() * 1000)
        matchStarted = false
        peerPresent = false
        roomReady = false
        ensureNode(function (ok) {
            if (!ok)
                return
            subscribeRoom(function (ok2) {
                if (!ok2)
                    return
                send({ t: "hello", role: "host", seed: matchSeed })
                setStatus("room", "Share code " + roomCode + " — waiting for guest")
                root.roomPrepared()
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
        roomReady = false
        if (roomCode.length < 4) {
            setStatus("error", "Enter a valid room code")
            return
        }
        ensureNode(function (ok) {
            if (!ok)
                return
            subscribeRoom(function (ok2) {
                if (!ok2)
                    return
                send({ t: "hello", role: "guest" })
                setStatus("room", "Joined " + roomCode + " — waiting for host")
                root.roomPrepared()
            })
        })
    }

    function broadcastFire(intent) {
        if (role !== "local" && intent)
            send(intent)
    }

    function startMatchAsHost() {
        send({ t: "start", seed: matchSeed })
        matchStarted = true
        matchReady(matchSeed)
    }

    function onHello(msg) {
        peerPresent = true
        if (role === "host" && msg.role === "guest") {
            setStatus("room", "Guest joined — starting match")
            startMatchAsHost()
        } else if (role === "guest" && msg.role === "host") {
            if (msg.seed !== undefined)
                matchSeed = msg.seed
            setStatus("room", "Host found — waiting for start")
            send({ t: "hello", role: "guest" })
        }
    }

    function handleIncoming(rawTopic, rawPayload) {
        if (topic && rawTopic && String(rawTopic) !== topic)
            return
        var msg = Net.decodeMessage(rawPayload)
        if (!msg || !msg.t || Net.isOwnEcho(msg, senderId))
            return
        if (msg.t === "hello")
            onHello(msg)
        else if (msg.t === "start") {
            if (msg.seed !== undefined)
                matchSeed = msg.seed
            matchStarted = true
            setStatus("play", "Online match live")
            matchReady(matchSeed)
        } else if (msg.t === "fire") {
            remoteFire(msg)
        }
    }

    Timer {
        id: bringUpWatchdog
        interval: Delivery.BRING_UP_TIMEOUT_MS
        repeat: false
        onTriggered: {
            if (!root.bringUpBusy)
                return
            root.finishEnsure(false,
                "Timed out starting delivery node. Load delivery_module in Module Inspector, then retry.")
        }
    }

    Timer {
        id: runningPoll
        interval: Delivery.POLL_MS
        repeat: true
        onTriggered: {
            if (!root.bringUpBusy)
                return
            Delivery.checkRunning(root.logosApi, function (running) {
                if (running)
                    root.markRunning("Delivery node ready")
            })
        }
    }

    Connections {
        target: root.logosApi
        ignoreUnknownSignals: true
        function onModuleEventReceived(moduleName, eventName, data) {
            if (moduleName !== "delivery_module")
                return
            var ev = Delivery.eventPayload(data)
            if (eventName === "connectionStateChanged" && ev.linkState)
                root.setStatus(root.roomReady ? "room" : "online", "Link: " + ev.linkState)
            else if (eventName === "messageReceived")
                root.handleIncoming(ev.topic, ev.payload)
            else if (eventName === "messageError")
                root.setStatus("warn", ev.errorText || "message error")
            else if (eventName === "nodeStarted") {
                if (ev.nodeStart.ok)
                    root.markRunning(ev.nodeStart.message || "Connected to logos.dev")
                else if (root.bringUpBusy)
                    root.finishEnsure(false, ev.nodeStart.message || "Delivery node failed to start")
            }
        }
    }

    Component.onCompleted: {
        logosAvailable = Delivery.available(logosApi)
        if (logosAvailable)
            Delivery.armEvents(logosApi)
    }
}
