.pragma library

/*! Endless-runner simulation. Pure state — paint stays in QML. */

var MAX_OBSTACLES = 12
var MAX_SCORE = 9999999
var LANE_Y = 0.72

function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v)
}

function createRun(seed) {
    var s = (seed >>> 0) || 1
    return {
        alive: true,
        t: 0,
        distance: 0,
        score: 0,
        speed: 220,
        playerX: 0.22,
        playerY: LANE_Y,
        vy: 0,
        onGround: true,
        sliding: 0,
        invuln: 0,
        obstacles: [],
        spawnAt: 1.2,
        seed: s,
        combo: 0
    }
}

function nextRand(run) {
    run.seed = (run.seed * 1664525 + 1013904223) >>> 0
    return run.seed / 4294967296
}

function jump(run) {
    if (!run.alive || !run.onGround || run.sliding > 0)
        return
    run.vy = -0.55
    run.onGround = false
}

function slide(run) {
    if (!run.alive || !run.onGround)
        return
    run.sliding = 0.55
}

function spawnObstacle(run) {
    if (run.obstacles.length >= MAX_OBSTACLES)
        return
    var roll = nextRand(run)
    var kind = roll < 0.45 ? "barrier" : (roll < 0.75 ? "drone" : "gate")
    var gap = 0.55 + nextRand(run) * 0.35
    run.obstacles.push({
        x: 1.15 + gap * 0.1,
        kind: kind,
        w: kind === "gate" ? 0.08 : 0.06,
        h: kind === "drone" ? 0.08 : 0.12,
        y: kind === "drone" ? LANE_Y - 0.16 : LANE_Y,
        passed: false
    })
}

function playerHitbox(run) {
    var h = run.sliding > 0 ? 0.06 : 0.12
    var y = run.sliding > 0 ? run.playerY + 0.04 : run.playerY
    return { x: run.playerX, y: y, w: 0.05, h: h }
}

function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function step(run, dt) {
    if (!run.alive)
        return run

    dt = clamp(dt, 0, 0.05)
    run.t += dt
    run.speed = clamp(220 + run.t * 6, 220, 520)
    run.distance += run.speed * dt
    run.score = clamp(Math.floor(run.distance * 0.1) + run.combo * 25, 0, MAX_SCORE)

    if (run.invuln > 0)
        run.invuln -= dt
    if (run.sliding > 0) {
        run.sliding -= dt
        if (run.sliding < 0)
            run.sliding = 0
    }

    if (!run.onGround) {
        run.vy += 1.6 * dt
        run.playerY += run.vy * dt
        if (run.playerY >= LANE_Y) {
            run.playerY = LANE_Y
            run.vy = 0
            run.onGround = true
        }
    }

    run.spawnAt -= dt
    if (run.spawnAt <= 0) {
        spawnObstacle(run)
        run.spawnAt = clamp(1.35 - run.t * 0.015, 0.55, 1.35) + nextRand(run) * 0.25
    }

    var hit = playerHitbox(run)
    var dx = (run.speed / 900) * dt
    var kept = []
    for (var i = 0; i < run.obstacles.length; i++) {
        var o = run.obstacles[i]
        o.x -= dx
        if (!o.passed && o.x + o.w < run.playerX) {
            o.passed = true
            run.combo += 1
        }
        if (run.invuln <= 0 && overlaps(hit, o)) {
            if (o.kind === "gate" && run.sliding > 0)
                continue
            if (o.kind === "drone" && !run.onGround && run.playerY < LANE_Y - 0.08)
                continue
            run.alive = false
            run.score = clamp(run.score, 0, MAX_SCORE)
            return run
        }
        if (o.x > -0.2)
            kept.push(o)
    }
    run.obstacles = kept
    return run
}

function finalScore(run) {
    return clamp(Math.floor(run.score || 0), 0, MAX_SCORE)
}
