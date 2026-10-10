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
        heights: heights,
        wind: 0,
        turn: 0,
        phase: "aim", // aim | flight | resolve | over
        winner: -1,
        message: "Amber aims",
        weaponId: Weapons.SHELL.id,
        projectile: null,
        explosions: [],
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

function resettleTanks(state) {
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.hp <= 0)
            continue
        var s = Terrain.settleOnSurface(state.heights, t.x, 12)
        t.x = s.x
        t.y = s.y
        // Fall off map / buried too deep → destroyed
        if (t.y > state.height - 8) {
            t.hp = 0
            t.y = state.height + 40
        }
    }
}

function fire(state) {
    if (state.phase !== "aim")
        return false
    var tank = activeTank(state)
    if (tank.hp <= 0)
        return false
    var weapon = Weapons.byId(state.weaponId)
    var muzzle = Physics.muzzlePoint(tank.x, tank.y, tank.angle, tank.facing, 28)
    var vel = Physics.launchVelocity(tank.angle, tank.power, tank.facing)
    state.projectile = {
        x: muzzle.x,
        y: muzzle.y,
        vx: vel.vx,
        vy: vel.vy,
        age: 0,
        owner: tank.id,
        radius: weapon.projectileRadius,
        weaponId: weapon.id
    }
    state.phase = "flight"
    state.message = tank.name + " fires"
    return true
}

function applyBlast(state, cx, cy, weapon) {
    Terrain.carveCrater(state.heights, cx, weapon.craterRadius, 1)
    state.explosions.push({ x: cx, y: cy, r: weapon.blastRadius, age: 0, life: 0.45 })
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

function tickFlight(state, dt) {
    if (state.phase !== "flight" || !state.projectile)
        return
    var shot = state.projectile
    Physics.stepProjectile(shot, dt)
    var weapon = Weapons.byId(shot.weaponId)

    if (Physics.outOfBounds(shot, state.width, state.height)) {
        state.projectile = null
        endTurn(state)
        return
    }

    var hitTank = null
    for (var i = 0; i < state.tanks.length; i++) {
        var t = state.tanks[i]
        if (t.id === shot.owner)
            continue
        if (Physics.hitsTank(shot, t, 18)) {
            hitTank = t
            break
        }
    }

    if (hitTank || Physics.hitsTerrain(shot, Terrain.sampleHeight, state.heights)) {
        var cx = shot.x
        var cy = shot.y
        if (Physics.hitsTerrain(shot, Terrain.sampleHeight, state.heights))
            cy = Terrain.sampleHeight(state.heights, cx)
        applyBlast(state, cx, cy, weapon)
        state.projectile = null
        state.phase = "resolve"
        state._resolveWait = 0.55
        if (checkWinner(state))
            return
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

function tick(state, dt) {
    tickExplosions(state, dt)
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
