.pragma library

/*! Projectile integration and hit tests. */

var GRAVITY = 420
var MAX_FLIGHT_TIME = 14

function launchVelocity(angleDeg, power, facing) {
    var rad = angleDeg * Math.PI / 180
    var speed = 80 + power * 5.2
    var dir = facing >= 0 ? 1 : -1
    return {
        vx: Math.cos(rad) * speed * dir,
        vy: -Math.sin(rad) * speed
    }
}

function muzzlePoint(tankX, tankY, angleDeg, facing, barrelLen) {
    var rad = angleDeg * Math.PI / 180
    var dir = facing >= 0 ? 1 : -1
    var len = barrelLen === undefined ? 28 : barrelLen
    return {
        x: tankX + Math.cos(rad) * len * dir,
        y: tankY - Math.sin(rad) * len
    }
}

function stepProjectile(shot, dt) {
    if (shot.rolling) {
        shot.vy += GRAVITY * dt * 0.35
        shot.vx *= shot.friction === undefined ? 0.985 : shot.friction
    } else {
        shot.vy += GRAVITY * dt
    }
    shot.x += shot.vx * dt
    shot.y += shot.vy * dt
    shot.age += dt
    return shot
}

function outOfBounds(shot, width, height) {
    return shot.x < -40 || shot.x > width + 40 || shot.y > height + 80 || shot.age > MAX_FLIGHT_TIME
}

function hitsTerrain(shot, sampleHeightFn, heights) {
    var ground = sampleHeightFn(heights, shot.x)
    return shot.y >= ground
}

function hitsTank(shot, tank, radius) {
    if (!tank || tank.hp <= 0)
        return false
    var r = radius === undefined ? 16 : radius
    var dx = shot.x - tank.x
    var dy = shot.y - tank.y
    return (dx * dx + dy * dy) <= (r * r)
}

function damageFalloff(distance, blastRadius, maxDamage) {
    if (distance >= blastRadius)
        return 0
    var t = 1 - (distance / blastRadius)
    return Math.round(maxDamage * t * t)
}

function predictArc(origin, vx, vy, heights, sampleHeightFn, width, steps) {
    var pts = []
    var x = origin.x
    var y = origin.y
    var n = steps === undefined ? 40 : steps
    var dt = 0.04
    for (var i = 0; i < n; i++) {
        vy += GRAVITY * dt
        x += vx * dt
        y += vy * dt
        pts.push({ x: x, y: y })
        if (x < 0 || x > width)
            break
        if (y >= sampleHeightFn(heights, x))
            break
    }
    return pts
}
