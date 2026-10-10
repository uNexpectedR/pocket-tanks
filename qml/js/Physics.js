.pragma library

/*! Projectile integration and hit tests — direct vs splash, hull hitbox. */

var GRAVITY = 420
var MAX_FLIGHT_TIME = 14
var TANK_HULL_RX = 20
var TANK_HULL_RY = 13
var TANK_HULL_OY = -3
var FLIGHT_SUBSTEPS = 3

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

/*! Integrate with substeps so fast shells do not tunnel through the crest. */
function stepProjectileSafe(shot, dt) {
    var n = FLIGHT_SUBSTEPS
    var h = dt / n
    for (var i = 0; i < n; i++)
        stepProjectile(shot, h)
    return shot
}

function outOfBounds(shot, width, height) {
    return shot.x < -40 || shot.x > width + 40 || shot.y > height + 80 || shot.age > MAX_FLIGHT_TIME
}

/*! Terrain hit uses projectile radius so fat shells kiss the crest earlier. */
function hitsTerrain(shot, sampleHeightFn, heights) {
    var ground = sampleHeightFn(heights, shot.x)
    var r = shot.radius || 4
    return shot.y + r * 0.4 >= ground
}

/*! Ellipse hull around the tank body (not a loose circle). Returns true on contact. */
function hitsTank(shot, tank, _ignoredRadius) {
    if (!tank || tank.hp <= 0)
        return false
    return tankHitFactor(shot.x, shot.y, tank) <= 1
}

function tankHitFactor(x, y, tank) {
    var dx = (x - tank.x) / TANK_HULL_RX
    var dy = (y - (tank.y + TANK_HULL_OY)) / TANK_HULL_RY
    return Math.sqrt(dx * dx + dy * dy)
}

function distanceToTank(x, y, tank) {
    var dx = x - tank.x
    var dy = y - (tank.y + TANK_HULL_OY)
    return Math.sqrt(dx * dx + dy * dy)
}

/*! Smooth splash falloff — full at center, zero at edge, softer mid-range than t². */
function damageFalloff(distance, blastRadius, maxDamage) {
    if (distance >= blastRadius || blastRadius <= 0)
        return 0
    var t = 1 - (distance / blastRadius)
    // smoothstep-ish: more damage near center, fairer fringe
    var s = t * t * (3 - 2 * t)
    return Math.round(maxDamage * s)
}

/*! Direct hit: near-full weapon damage with optional multiplier; else splash. */
function resolveDamage(distance, weapon, isDirect) {
    var maxD = weapon.maxDamage || 0
    var radius = weapon.blastRadius || 1
    if (isDirect) {
        var mul = weapon.directMul === undefined ? 1.2 : weapon.directMul
        return Math.round(maxD * mul)
    }
    return damageFalloff(distance, radius, maxD)
}

function predictArc(origin, vx, vy, heights, sampleHeightFn, width, steps) {
    var pts = []
    var x = origin.x
    var y = origin.y
    var n = steps === undefined ? 40 : steps
    var dt = 0.04
    var r = 3.5
    for (var i = 0; i < n; i++) {
        vy += GRAVITY * dt
        x += vx * dt
        y += vy * dt
        pts.push({ x: x, y: y })
        if (x < 0 || x > width)
            break
        if (y + r * 0.4 >= sampleHeightFn(heights, x))
            break
    }
    return pts
}
