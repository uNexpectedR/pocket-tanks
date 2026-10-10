.pragma library

.import "Terrain.js" as Terrain
.import "Physics.js" as Physics
.import "Weapons.js" as Weapons
.import "Effects.js" as Effects

/*! Turn flow, tanks, firing, win checks. */

var TRAIL_MAX = 18

function createMatch(width, height, seed) {
    var heights = Terrain.createHeightmap(width, Math.round(height * 0.58), Math.round(height * 0.16), seed)
    var left = Terrain.settleOnSurface(heights, Math.round(width * 0.14), 12)
    var right = Terrain.settleOnSurface(heights, Math.round(width * 0.86), 12)
    return {
        width: width,
        height: height,
        seed: seed === undefined ? 0 : seed,
        heights: heights,
        terrainRev: 0,
        turn: 0,
        phase: "aim",
        winner: -1,
        message: "Amber aims",
        weaponId: Weapons.HE_SHELL.id,
        projectile: null,
        explosions: [],
        sparks: [],
        muzzles: [],
        fireSeq: 0,
        lastAppliedSeq: -1,
        _aimCacheKey: "",
        _aimCachePts: null,
        tanks: [
            tankSpec(0, "Amber", left, 1, "#c48c48", "#e2b57a"),
            tankSpec(1, "Slate", right, -1, "#6e8b92", "#9cb8be")
        ]
    }
}

function tankSpec(id, name, pos, facing, color, accent) {
    return {
        id: id,
        name: name,
        x: pos.x,
        y: pos.y,
        hp: 100,
        maxHp: 100,
        angle: 45,
        power: 50,
        facing: facing,
        color: color,
        accent: accent
    }
}

function activeTank(state) { return state.tanks[state.turn] }
function inactiveTank(state) { return state.tanks[1 - state.turn] }

function clampAim(tank) {
    tank.angle = Math.max(5, Math.min(80, tank.angle))
    tank.power = Math.max(10, Math.min(100, tank.power))
}

function nudgeAngle(state, delta) {
    if (state.phase !== "aim")
        return
    var tank = activeTank(state)
    tank.angle += delta
    clampAim(tank)
}

function nudgePower(state, delta) {
    if (state.phase !== "aim")
        return
    var tank = activeTank(state)
    tank.power += delta
    clampAim(tank)
}

function setAngle(state, value) {
    if (state.phase !== "aim")
        return
    var tank = activeTank(state)
    tank.angle = value
    clampAim(tank)
}

function setPower(state, value) {
    if (state.phase !== "aim")
        return
    var tank = activeTank(state)
    tank.power = value
    clampAim(tank)
}

function setWeapon(state, weaponId) {
    if (state.phase === "aim")
        state.weaponId = Weapons.byId(weaponId).id
}

function cycleWeapon(state, delta) {
    if (state.phase === "aim")
        state.weaponId = Weapons.nextId(state.weaponId, delta || 1)
}

function resettleTanks(state) {
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.hp <= 0)
            continue
        var s = Terrain.settleOnSurface(state.heights, t.x, 12)
        t.x = s.x
        t.y = s.y
        if (t.y > state.height - 8) {
            t.hp = 0
            t.y = state.height + 40
        }
    }
}

function launchShot(state, tank, weapon, angle, power) {
    var muzzle = Physics.muzzlePoint(tank.x, tank.y, angle, tank.facing, 30)
    var vel = Physics.launchVelocity(angle, power, tank.facing)
    state.projectile = {
        x: muzzle.x,
        y: muzzle.y,
        vx: vel.vx,
        vy: vel.vy,
        age: 0,
        owner: tank.id,
        radius: weapon.projectileRadius,
        weaponId: weapon.id,
        rolling: false,
        rollsLeft: 0,
        friction: weapon.rollFriction || 0.985,
        trail: [],
        trailLen: 0
    }
    state.phase = "flight"
    state.message = tank.name + " fires " + weapon.name
    state._aimCacheKey = ""
    state._aimCachePts = null
    Effects.pushMuzzle(state, muzzle.x, muzzle.y, angle * Math.PI / 180, tank.facing)
    Effects.spawnSparks(state, muzzle.x, muzzle.y, 8, tank.accent)
}

function fire(state) {
    var intent = fireIntent(state)
    if (!intent)
        return false
    return applyRemoteFire(state, intent)
}

function fireIntent(state) {
    if (state.phase !== "aim")
        return null
    var tank = activeTank(state)
    if (tank.hp <= 0)
        return null
    return {
        t: "fire",
        turn: state.turn,
        angle: tank.angle,
        power: tank.power,
        weaponId: state.weaponId,
        seq: state.fireSeq
    }
}

function applyRemoteFire(state, msg) {
    if (!msg || msg.t !== "fire")
        return false
    if (msg.seq !== undefined && msg.seq <= state.lastAppliedSeq)
        return false
    if (state.phase !== "aim")
        return false
    if (msg.turn !== undefined && msg.turn !== state.turn)
        return false
    var tank = activeTank(state)
    if (msg.angle !== undefined)
        tank.angle = msg.angle
    if (msg.power !== undefined)
        tank.power = msg.power
    clampAim(tank)
    if (msg.weaponId)
        state.weaponId = Weapons.byId(msg.weaponId).id
    launchShot(state, tank, Weapons.byId(state.weaponId), tank.angle, tank.power)
    if (msg.seq !== undefined)
        state.lastAppliedSeq = msg.seq
    state.fireSeq = Math.max(state.fireSeq, (msg.seq || 0) + 1)
    return true
}

function damageTanks(state, cx, cy, weapon) {
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.hp <= 0)
            continue
        var dx = t.x - cx
        var dy = t.y - cy
        var dmg = Physics.damageFalloff(Math.sqrt(dx * dx + dy * dy), weapon.blastRadius, weapon.maxDamage)
        if (dmg > 0)
            t.hp = Math.max(0, t.hp - dmg)
    }
}

function reshapeTerrain(state, cx, cy, weapon) {
    if (weapon.kind === "dirt") {
        Terrain.carveCrater(state.heights, cx, weapon.craterRadius, 1.15)
        Terrain.pileDirt(state.heights, cx + 18, weapon.pileRadius || 36, weapon.pileHeight || 28, 36)
        Terrain.pileDirt(state.heights, cx - 18, (weapon.pileRadius || 36) * 0.7, (weapon.pileHeight || 28) * 0.55, 36)
    } else {
        Terrain.carveCrater(state.heights, cx, weapon.craterRadius, weapon.kind === "airburst" ? 0.65 : 1)
    }
    state.terrainRev = (state.terrainRev || 0) + 1
}

function applyBlast(state, cx, cy, weapon) {
    reshapeTerrain(state, cx, cy, weapon)
    Effects.pushExplosion(
        state, cx, cy, weapon.blastRadius,
        weapon.kind === "dirt" ? 0.55 : 0.5,
        weapon.kind === "dirt" ? "#9a8768" : "#e2b57a"
    )
    Effects.spawnSparks(state, cx, cy, weapon.kind === "dirt" ? 10 : 16, weapon.trail || "#e2b57a")
    damageTanks(state, cx, cy, weapon)
    resettleTanks(state)
}

function checkWinner(state) {
    var a = state.tanks[0]
    var b = state.tanks[1]
    if (a.hp <= 0 && b.hp <= 0) {
        state.phase = "over"
        state.winner = -2
        state.message = "Mutual ruin"
        return true
    }
    if (a.hp <= 0) {
        state.phase = "over"
        state.winner = 1
        state.message = b.name + " holds the ridge"
        return true
    }
    if (b.hp <= 0) {
        state.phase = "over"
        state.winner = 0
        state.message = a.name + " holds the ridge"
        return true
    }
    return false
}

function endTurn(state) {
    if (checkWinner(state))
        return
    state.turn = 1 - state.turn
    state.phase = "aim"
    state.projectile = null
    state.message = activeTank(state).name + " aims"
}

function detonate(state, shot, weapon, cx, cy) {
    applyBlast(state, cx, cy, weapon)
    state.projectile = null
    state.phase = "resolve"
    state._resolveWait = 0.55
    checkWinner(state)
}

function beginRoll(state, shot, weapon) {
    shot.rolling = true
    shot.rollsLeft = weapon.rollBounces || 8
    shot.y = Terrain.sampleHeight(state.heights, shot.x) - shot.radius
    var slope = Terrain.slopeAt(state.heights, shot.x)
    shot.vx += slope * 8
    if (Math.abs(shot.vx) < 40)
        shot.vx = (shot.vx >= 0 ? 1 : -1) * 55
    shot.vy = 0
    state.message = "Roller grinding the ridge"
}

function pushTrail(shot) {
    // Reuse point objects when at capacity — avoids per-frame alloc + shift.
    if (shot.trailLen >= TRAIL_MAX) {
        var oldest = shot.trail.shift()
        oldest.x = shot.x
        oldest.y = shot.y
        shot.trail.push(oldest)
        return
    }
    shot.trail.push({ x: shot.x, y: shot.y })
    shot.trailLen++
}

function findHitTank(state, shot) {
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.id === shot.owner && !shot.rolling)
            continue
        if (Physics.hitsTank(shot, t, 18))
            return t
    }
    return null
}

function tickFlight(state, dt) {
    var shot = state.projectile
    if (!shot)
        return false
    Physics.stepProjectile(shot, dt)
    var weapon = Weapons.byId(shot.weaponId)
    pushTrail(shot)

    if (Physics.outOfBounds(shot, state.width, state.height)) {
        state.projectile = null
        endTurn(state)
        return true
    }

    if (weapon.kind === "airburst" && !shot.rolling) {
        var ground = Terrain.sampleHeight(state.heights, shot.x)
        if (shot.vy > 0 && shot.y >= ground - (weapon.fuseHeight || 48)) {
            detonate(state, shot, weapon, shot.x, shot.y)
            return true
        }
    }

    if (findHitTank(state, shot)) {
        detonate(state, shot, weapon, shot.x, shot.y)
        return true
    }

    if (!Physics.hitsTerrain(shot, Terrain.sampleHeight, state.heights))
        return true

    var cx = shot.x
    var cy = Terrain.sampleHeight(state.heights, cx)
    if (weapon.kind === "roller" && !shot.rolling) {
        beginRoll(state, shot, weapon)
        return true
    }
    if (shot.rolling) {
        shot.rollsLeft -= 1
        shot.y = cy - shot.radius
        shot.vx += Terrain.slopeAt(state.heights, shot.x) * 6
        shot.vy = Math.min(shot.vy, 0)
        if (shot.rollsLeft <= 0 || Math.abs(shot.vx) < 18)
            detonate(state, shot, weapon, cx, cy)
        return true
    }
    detonate(state, shot, weapon, cx, cy)
    return true
}

function tickResolve(state, dt) {
    state._resolveWait -= dt
    if (state._resolveWait <= 0)
        endTurn(state)
    return true
}

function tickExplosions(state, dt) { return Effects.tickExplosions(state, dt) }
function tickSparks(state, dt) { return Effects.tickSparks(state, dt) }

function tick(state, dt) {
    var fx = Effects.tickAll(state, dt)
    if (state.phase === "flight")
        return tickFlight(state, dt) || fx
    if (state.phase === "resolve")
        return tickResolve(state, dt) || fx
    return fx
}

function aimPreview(state) {
    if (state.phase !== "aim")
        return []
    var tank = activeTank(state)
    var key = tank.id + ":" + tank.angle + ":" + tank.power + ":" + (state.terrainRev || 0)
    if (state._aimCacheKey === key && state._aimCachePts)
        return state._aimCachePts
    var muzzle = Physics.muzzlePoint(tank.x, tank.y, tank.angle, tank.facing, 30)
    var vel = Physics.launchVelocity(tank.angle, tank.power, tank.facing)
    var pts = Physics.predictArc(muzzle, vel.vx, vel.vy, state.heights, Terrain.sampleHeight, state.width, 32)
    state._aimCacheKey = key
    state._aimCachePts = pts
    return pts
}

function restart(width, height, seed) {
    return createMatch(width, height, seed)
}

function weaponName(state) {
    return Weapons.byId(state.weaponId).name
}
