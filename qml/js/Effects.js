.pragma library

/*! Short-lived sparks / blast rings — keep Game.js focused on turns. */

function spawnSparks(state, cx, cy, count, color) {
    var n = count || 8
    for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2
        var sp = 40 + Math.random() * 120
        state.sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 40,
            age: 0,
            life: 0.35 + Math.random() * 0.35,
            color: color || "#e2b57a"
        })
    }
}

function pushExplosion(state, cx, cy, radius, life, tint) {
    state.explosions.push({
        x: cx,
        y: cy,
        r: radius,
        age: 0,
        life: life === undefined ? 0.5 : life,
        tint: tint || "#e2b57a"
    })
}

function tickExplosions(state, dt) {
    var list = state.explosions
    if (!list.length)
        return false
    var kept = []
    for (var i = 0; i < list.length; i++) {
        var e = list[i]
        e.age += dt
        if (e.age < e.life)
            kept.push(e)
    }
    state.explosions = kept
    return true
}

function tickSparks(state, dt) {
    var list = state.sparks
    if (!list.length)
        return false
    var kept = []
    for (var i = 0; i < list.length; i++) {
        var s = list[i]
        s.age += dt
        s.vy += 280 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.age < s.life)
            kept.push(s)
    }
    state.sparks = kept
    return true
}

function busy(state) {
    return state.explosions.length > 0 || state.sparks.length > 0
}
