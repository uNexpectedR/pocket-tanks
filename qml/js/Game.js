.pragma library

.import "Terrain.js" as Terrain
.import "Physics.js" as Physics
.import "Weapons.js" as Weapons

/*! Turn flow, tanks, firing, win checks. */

function createMatch(width, height, seed) {
    var heights = Terrain.createHeightmap(width, Math.round(height * 0.58), Math.round(height * 0.16), seed)
    var left = Terrain.settleOnSurface(heights, Math.round(width * 0.14), 12)
    var right = Terrain.settleOnSurface(heights, Math.round(width * 0.86), 12)
    return {
        width: width,
        height: height,
        seed: seed === undefined ? 0 : seed,
        heights: heights,
        wind: 0,
        turn: 0,
        phase: "aim", // aim | flight | resolve | over
        winner: -1,
        message: "Amber aims",
        weaponId: Weapons.HE_SHELL.id,
        weapons: Weapons.catalog().map(function (w) { return w.id }),
        projectile: null,
        explosions: [],
        sparks: [],
        fireSeq: 0,
        lastAppliedSeq: -1,
        tanks: [
            {
                id: 0,
                name: "Amber",
                x: left.x,
                y: left.y,
                hp: 100,
                maxHp: 100,
                angle: 45,
                power: 50,
                facing: 1,
                color: "#c48c48",
                accent: "#e2b57a"
            },
            {
                id: 1,
                name: "Slate",
                x: right.x,
                y: right.y,
                hp: 100,
                maxHp: 100,
                angle: 45,
                power: 50,
                facing: -1,
                color: "#6e8b92",
                accent: "#9cb8be"
            }
        ]
    }
}

function activeTank(state) {
    return state.tanks[state.turn]
}

function inactiveTank(state) {
    return state.tanks[1 - state.turn]
}

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
    if (state.phase !== "aim")
        return
    state.weaponId = Weapons.byId(weaponId).id
}

function cycleWeapon(state, delta) {
    if (state.phase !== "aim")
        return
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

function spawnSparks(state, cx, cy, count, color) {
    for (var i = 0; i < count; i++) {
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

function launchShot(state, tank, weapon, angle, power) {
    var muzzle = Physics.muzzlePoint(tank.x, tank.y, angle, tank.facing, 28)
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
        trail: []
    }
    state.phase = "flight"
    state.message = tank.name + " fires " + weapon.name
    spawnSparks(state, muzzle.x, muzzle.y, 6, tank.accent)
}

function fire(state) {
    if (state.phase !== "aim")
        return false
    var tank = activeTank(state)
    if (tank.hp <= 0)
        return false
    var weapon = Weapons.byId(state.weaponId)
    launchShot(state, tank, weapon, tank.angle, tank.power)
    state.fireSeq += 1
    return true
}

/*! Apply a networked fire intent (lockstep). Returns false if ignored. */
function applyRemoteFire(state, msg) {
    if (!msg || msg.t !== "fire")
        return false
    if (msg.seq !== undefined && msg.seq <= state.lastAppliedSeq)
        return false
    if (state.phase !== "aim" && state.phase !== "over")
        return false
    if (state.phase === "over")
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
    var weapon = Weapons.byId(state.weaponId)
    launchShot(state, tank, weapon, tank.angle, tank.power)
    if (msg.seq !== undefined)
        state.lastAppliedSeq = msg.seq
    state.fireSeq = Math.max(state.fireSeq, (msg.seq || 0) + 1)
    return true
}

function fireIntent(state) {
    if (state.phase !== "aim")
        return null
    var tank = activeTank(state)
    if (tank.hp <= 0)
        return null
    var seq = state.fireSeq
    return {
        t: "fire",
        turn: state.turn,
        angle: tank.angle,
        power: tank.power,
        weaponId: state.weaponId,
        seq: seq
    }
}

function applyBlast(state, cx, cy, weapon) {
    if (weapon.kind === "dirt") {
        Terrain.carveCrater(state.heights, cx, weapon.craterRadius, 1.15)
        Terrain.pileDirt(state.heights, cx + 18, weapon.pileRadius || 36, weapon.pileHeight || 28, 36)
        Terrain.pileDirt(state.heights, cx - 18, (weapon.pileRadius || 36) * 0.7, (weapon.pileHeight || 28) * 0.55, 36)
    } else {
        Terrain.carveCrater(state.heights, cx, weapon.craterRadius, weapon.kind === "airburst" ? 0.65 : 1)
    }
    state.explosions.push({
        x: cx,
        y: cy,
        r: weapon.blastRadius,
        age: 0,
        life: weapon.kind === "dirt" ? 0.55 : 0.5,
        tint: weapon.kind === "dirt" ? "#9a8768" : "#e2b57a"
    })
    spawnSparks(state, cx, cy, weapon.kind === "dirt" ? 10 : 16, weapon.trail || "#e2b57a")
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.hp <= 0)
            continue
        var dx = t.x - cx
        var dy = t.y - cy
        var dist = Math.sqrt(dx * dx + dy * dy)
        var dmg = Physics.damageFalloff(dist, weapon.blastRadius, weapon.maxDamage)
        if (dmg > 0)
            t.hp = Math.max(0, t.hp - dmg)
    }
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
    var next = activeTank(state)
    state.message = next.name + " aims"
}

function detonate(state, shot, weapon, cx, cy) {
    applyBlast(state, cx, cy, weapon)
    state.projectile = null
    state.phase = "resolve"
    state._resolveWait = 0.55
    if (checkWinner(state))
        return
}

function beginRoll(state, shot, weapon) {
    shot.rolling = true
    shot.rollsLeft = weapon.rollBounces || 8
    shot.y = Terrain.sampleHeight(state.heights, shot.x) - shot.radius
    var slope = Terrain.slopeAt(state.heights, shot.x)
    // Accelerate downhill (screen +x right, +y down).
    shot.vx += slope * 8
    if (Math.abs(shot.vx) < 40)
        shot.vx = (shot.vx >= 0 ? 1 : -1) * 55
    shot.vy = 0
    state.message = "Roller grinding the ridge"
}

function tickFlight(state, dt) {
    if (state.phase !== "flight" || !state.projectile)
        return
    var shot = state.projectile
    Physics.stepProjectile(shot, dt)
    var weapon = Weapons.byId(shot.weaponId)

    if (shot.trail.length > 18)
        shot.trail.shift()
    shot.trail.push({ x: shot.x, y: shot.y })

    if (Physics.outOfBounds(shot, state.width, state.height)) {
        state.projectile = null
        endTurn(state)
        return
    }

    // Sky Burster: fuse above terrain.
    if (weapon.kind === "airburst" && !shot.rolling) {
        var ground = Terrain.sampleHeight(state.heights, shot.x)
        var fuse = weapon.fuseHeight || 48
        if (shot.vy > 0 && shot.y >= ground - fuse) {
            detonate(state, shot, weapon, shot.x, shot.y)
            return
        }
    }

    var hitTank = null
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.id === shot.owner && !shot.rolling)
            continue
        if (Physics.hitsTank(shot, t, 18)) {
            hitTank = t
            break
        }
    }

    if (hitTank) {
        detonate(state, shot, weapon, shot.x, shot.y)
        return
    }

    if (Physics.hitsTerrain(shot, Terrain.sampleHeight, state.heights)) {
        var cx = shot.x
        var cy = Terrain.sampleHeight(state.heights, cx)
        if (weapon.kind === "roller" && !shot.rolling) {
            beginRoll(state, shot, weapon)
            return
        }
        if (shot.rolling) {
            shot.rollsLeft -= 1
            shot.y = cy - shot.radius
            var slope2 = Terrain.slopeAt(state.heights, shot.x)
            shot.vx += slope2 * 6
            shot.vy = Math.min(shot.vy, 0)
            if (shot.rollsLeft <= 0 || Math.abs(shot.vx) < 18) {
                detonate(state, shot, weapon, cx, cy)
                return
            }
            return
        }
        detonate(state, shot, weapon, cx, cy)
    }
}

function tickResolve(state, dt) {
    if (state.phase !== "resolve")
        return
    state._resolveWait -= dt
    if (state._resolveWait <= 0)
        endTurn(state)
}

function tickExplosions(state, dt) {
    var kept = []
    for (var i = 0; i < state.explosions.length; i++) {
        var e = state.explosions[i]
        e.age += dt
        if (e.age < e.life)
            kept.push(e)
    }
    state.explosions = kept
}

function tickSparks(state, dt) {
    var kept = []
    for (var i = 0; i < state.sparks.length; i++) {
        var s = state.sparks[i]
        s.age += dt
        s.vy += 280 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.age < s.life)
            kept.push(s)
    }
    state.sparks = kept
}

function tick(state, dt) {
    tickExplosions(state, dt)
    tickSparks(state, dt)
    if (state.phase === "flight")
        tickFlight(state, dt)
    else if (state.phase === "resolve")
        tickResolve(state, dt)
}

function aimPreview(state) {
    if (state.phase !== "aim")
        return []
    var tank = activeTank(state)
    var muzzle = Physics.muzzlePoint(tank.x, tank.y, tank.angle, tank.facing, 28)
    var vel = Physics.launchVelocity(tank.angle, tank.power, tank.facing)
    return Physics.predictArc(muzzle, vel.vx, vel.vy, state.heights, Terrain.sampleHeight, state.width, 36)
}

function restart(width, height, seed) {
    return createMatch(width, height, seed)
}

function weaponName(state) {
    return Weapons.byId(state.weaponId).name
}
