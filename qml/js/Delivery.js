.pragma library

/*! Thin wrappers around logos.callModuleAsync → delivery_module. */

var MODULE = "delivery_module"
var EVENTS = ["messageReceived", "connectionStateChanged", "messageError", "nodeStarted"]
var BRING_UP_TIMEOUT_MS = 25000
var POLL_MS = 500

function available(logosApi) {
    return logosApi !== undefined && logosApi !== null
}

function parseResult(payload) {
    var result = null
    try {
        result = typeof payload === "string" ? JSON.parse(payload) : payload
    } catch (e) {
        return { ok: true, value: { raw: payload } }
    }
    if (result && typeof result === "object") {
        if (result.success === false)
            return { ok: false, error: result.error || result.message || "call failed" }
        if (result.error && result.success !== true && result.success !== undefined)
            return { ok: false, error: String(result.error) }
    }
    return { ok: true, value: result }
}

function unwrapValue(info) {
    if (info === undefined || info === null)
        return info
    if (typeof info === "object") {
        if (info.value !== undefined)
            return info.value
        if (info.result !== undefined)
            return info.result
    }
    return info
}

function isTruthyRunning(info) {
    var v = unwrapValue(info)
    if (v === true || v === "true" || v === 1 || v === "1")
        return true
    if (v === false || v === "false" || v === 0 || v === "0")
        return false
    if (v && typeof v === "object" && v.running !== undefined)
        return v.running === true || String(v.running) === "true"
    return false
}

function call(logosApi, method, args, onOk, onFail) {
    if (!available(logosApi)) {
        if (onFail)
            onFail("Logos bridge unavailable (run inside Basecamp)")
        return
    }
    logosApi.callModuleAsync(MODULE, method, args || [], function (payload) {
        var parsed = parseResult(payload)
        if (parsed.ok) {
            if (onOk)
                onOk(parsed.value)
        } else if (onFail) {
            onFail(parsed.error)
        }
    }, function (err) {
        if (onFail)
            onFail(err ? String(err) : "delivery_module call failed")
    })
}

function armEvents(logosApi) {
    if (!available(logosApi))
        return false
    for (var i = 0; i < EVENTS.length; i++)
        logosApi.onModuleEvent(MODULE, EVENTS[i])
    return true
}

function checkRunning(logosApi, onResult) {
    call(logosApi, "getNodeInfo", ["IsRunning"], function (info) {
        onResult(isTruthyRunning(info), info)
    }, function () {
        onResult(false, null)
    })
}

/*! Issue createNode + start (dispatch-only). Does not wait for nodeStarted. */
function issueCreateAndStart(logosApi, configJson, onIssued) {
    call(logosApi, "createNode", [configJson], function () {
        call(logosApi, "start", [], function () {
            onIssued(true, "start dispatched")
        }, function (err) {
            onIssued(false, err ? String(err) : "start failed")
        })
    }, function (err) {
        var msg = String(err || "")
        if (msg.toLowerCase().indexOf("already") >= 0) {
            call(logosApi, "start", [], function () {
                onIssued(true, "start dispatched on existing node")
            }, function (startErr) {
                // Node may already be running — caller will verify IsRunning.
                onIssued(true, startErr ? String(startErr) : "using existing node")
            })
        } else {
            onIssued(false, msg || "createNode failed")
        }
    })
}

function nodeStartedOk(data) {
    if (!data || data.length === undefined || data.length < 1)
        return { ok: true, message: "" }
    var flag = data[0]
    var ok = flag === true || flag === "true" || flag === 1 || flag === "1"
    var message = data.length > 1 ? String(data[1] || "") : ""
    return { ok: ok, message: message }
}

function eventPayload(data) {
    // messageReceived: [hash, topic, payload, source, ts]
    // connectionStateChanged: [status, ts]
    // messageError: [requestId, hash, error, ts]
    // nodeStarted: [success, message, ts]
    return {
        topic: data && data.length > 1 ? data[1] : "",
        payload: data && data.length > 2 ? data[2] : "",
        errorText: data && data.length > 2 ? String(data[2]) : "",
        linkState: data && data.length ? String(data[0]) : "",
        nodeStart: nodeStartedOk(data)
    }
}
