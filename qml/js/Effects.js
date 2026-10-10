.pragma library

/*! Short-lived sparks / blast rings / muzzle flash. In-place tick compaction. */

var MAX_SPARKS = 64
var MAX_FLASHES = 8

function spawnSparks(state, cx, cy, count, color) {
    if (!state.sparks)
        state.sparks = []
    var n = count || 8
    var room = MAX_SPARKS - state.sparks.length
    if (room <= 0)
        return
    if (n > room)
        n = room
    for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2
        var sp = 50 + Math.random() * 140
        state.sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 50,
            age: 0,
            life: 0.32 + Math.random() * 0.4,
            color: color || "#e2b57a",
            size: 1.8 + Math.random() * 1.6
        })
    }
}

function pushExplosion(state, cx, cy, radius, life, tint) {
    if (!state.explosions)
        state.explosions = []
    state.explosions.push({
        x: cx,
        y: cy,
        r: radius,
        age: 0,
        life: life === undefined ? 0.55 : life,
        tint: tint || "#e2b57a"
    })
}

function pushMuzzle(state, x, y, angleRad, facing) {
    if (!state.muzzles)
        state.muzzles = []
    if (state.muzzles.length >= MAX_FLASHES)
        state.muzzles.shift()
    state.muzzles.push({
        x: x,
        y: y,
        angle: facing >= 0 ? -angleRad : Math.PI + angleRad,
        age: 0,
        life: 0.12
    })
}

function tickExplosions(state, dt) {
    var list = state.explosions
    if (!list || !list.length)
        return false
    var w = 0
    for (var i = 0; i < list.length; i++) {
        var e = list[i]
        e.age += dt
        if (e.age < e.life)
            list[w++] = e
    }
    list.length = w
    return w > 0
}

function tickSparks(state, dt) {
    var list = state.sparks
    if (!list || !list.length)
        return false
    var w = 0
    var g = 300 * dt
    for (var i = 0; i < list.length; i++) {
        var s = list[i]
        s.age += dt
        s.vy += g
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.age < s.life)
            list[w++] = s
    }
    list.length = w
    return w > 0
}

function tickMuzzles(state, dt) {
    var list = state.muzzles
    if (!list || !list.length)
        return false
    var w = 0
    for (var i = 0; i < list.length; i++) {
        var m = list[i]
        m.age += dt
        if (m.age < m.life)
            list[w++] = m
    }
    list.length = w
    return w > 0
}

function tickAll(state, dt) {
    var a = tickExplosions(state, dt)
    var b = tickSparks(state, dt)
    var c = tickMuzzles(state, dt)
    return a || b || c
}

function busy(state) {
    return (state.explosions && state.explosions.length > 0)
        || (state.sparks && state.sparks.length > 0)
        || (state.muzzles && state.muzzles.length > 0)
}
