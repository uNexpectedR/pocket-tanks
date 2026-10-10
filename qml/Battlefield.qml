import QtQuick 2.15
import "js/Game.js" as Game
import "js/Weapons.js" as Weapons
import "js/Paint.js" as Paint
import "js/Effects.js" as Effects

Item {
    id: root

    property var match: null
    property bool showPreview: true
    property real animTime: 0
    property int localSeat: -1
    property bool inputEnabled: true
    property int frame: 0
    property bool dirty: true
    property int lastTerrainRev: -1
    property int lastSkyW: 0
    property int lastSkyH: 0

    readonly property string weaponName: match ? Game.weaponName(match) : Weapons.HE_SHELL.name

    signal fireIntent(var intent)

    function restart(seed) {
        var s = seed === undefined ? Math.floor(Math.random() * 1000) : seed
        match = Game.createMatch(960, 540, s)
        lastTerrainRev = -1
        dirty = true
        skyLayer.requestPaint()
        terrainLayer.requestPaint()
        playLayer.requestPaint()
    }

    function canControl() {
        if (!match || match.phase !== "aim" || !inputEnabled)
            return false
        return localSeat < 0 || match.turn === localSeat
    }

    function fire() {
        if (!match || !canControl())
            return false
        var intent = Game.fireIntent(match)
        if (!intent)
            return false
        Game.applyRemoteFire(match, intent)
        if (localSeat >= 0)
            root.fireIntent(intent)
        dirty = true
        return true
    }

    function applyRemoteFire(msg) {
        if (!match)
            return false
        var ok = Game.applyRemoteFire(match, msg)
        if (ok)
            dirty = true
        return ok
    }

    function markDirty() { dirty = true }

    function nudgeAngle(d) { if (match && canControl()) { Game.nudgeAngle(match, d); dirty = true } }
    function nudgePower(d) { if (match && canControl()) { Game.nudgePower(match, d); dirty = true } }
    function setAngle(v) { if (match && canControl()) { Game.setAngle(match, v); dirty = true } }
    function setPower(v) { if (match && canControl()) { Game.setPower(match, v); dirty = true } }
    function setWeapon(id) { if (match && canControl()) { Game.setWeapon(match, id); dirty = true } }
    function cycleWeapon(d) { if (match && canControl()) { Game.cycleWeapon(match, d); dirty = true } }

    function seatHint() {
        if (!match || localSeat < 0 || match.phase === "over")
            return ""
        return match.turn === localSeat ? " · your shot" : " · wait"
    }

    function syncWorldTransform(ctx, layer) {
        var m = root.match
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, layer.width, layer.height)
        ctx.setTransform(layer.width / m.width, 0, 0, layer.height / m.height, 0, 0)
    }

    // Layer 1: sky — paint on resize (stars twinkle via rare half-rate refresh).
    Canvas {
        id: skyLayer
        anchors.fill: parent
        renderTarget: Canvas.FramebufferObject
        renderStrategy: Canvas.Cooperative
        onPaint: {
            var ctx = getContext("2d")
            if (!ctx || !root.match)
                return
            root.syncWorldTransform(ctx, skyLayer)
            Paint.sky(ctx, root.match.width, root.match.height, root.animTime)
            root.lastSkyW = width
            root.lastSkyH = height
        }
    }

    // Layer 2: terrain — only when heightmap revision changes.
    Canvas {
        id: terrainLayer
        anchors.fill: parent
        renderTarget: Canvas.FramebufferObject
        renderStrategy: Canvas.Cooperative
        onPaint: {
            var ctx = getContext("2d")
            if (!ctx || !root.match)
                return
            root.syncWorldTransform(ctx, terrainLayer)
            Paint.terrain(ctx, root.match.heights, root.match.width, root.match.height)
            root.lastTerrainRev = root.match.terrainRev || 0
        }
    }

    // Layer 3: tanks / aim / munitions / FX / HUD — hot path.
    Canvas {
        id: playLayer
        anchors.fill: parent
        renderTarget: Canvas.FramebufferObject
        renderStrategy: Canvas.Cooperative
        onPaint: {
            var ctx = getContext("2d")
            if (!ctx || !root.match)
                return
            var m = root.match
            root.syncWorldTransform(ctx, playLayer)

            if (root.showPreview && m.phase === "aim" && root.canControl())
                Paint.aimArc(ctx, Game.aimPreview(m))

            for (var i = 0; i < m.tanks.length; i++)
                Paint.tank(ctx, m.tanks[i], m.phase !== "over" && m.turn === i, root.animTime)

            Paint.projectile(ctx, m.projectile)
            Paint.muzzleFlash(ctx, m.muzzles)
            Paint.explosions(ctx, m.explosions)
            Paint.sparks(ctx, m.sparks)
            Paint.hud(ctx, m.width, m, Game.weaponName(m), root.seatHint())
            root.dirty = false
        }
    }

    Timer {
        interval: 16
        running: true
        repeat: true
        onTriggered: {
            if (!root.match)
                return
            var dt = interval / 1000
            root.animTime += dt
            root.frame++
            var m = root.match
            var moved = false
            if (m.phase !== "over")
                moved = Game.tick(m, dt)
            else
                moved = Effects.tickAll(m, dt)

            if ((m.terrainRev || 0) !== root.lastTerrainRev)
                terrainLayer.requestPaint()

            var busy = moved || m.phase === "flight" || m.phase === "resolve" || Effects.busy(m)
            // Aim: half-rate for active-seat pulse; flight/FX: every frame.
            if (root.dirty || busy || (root.frame & 1) === 0)
                playLayer.requestPaint()

            // Rare sky refresh keeps star twinkle alive without per-frame sky cost.
            if ((root.frame % 30) === 0)
                skyLayer.requestPaint()
        }
    }

    onWidthChanged: {
        dirty = true
        skyLayer.requestPaint()
        terrainLayer.requestPaint()
        playLayer.requestPaint()
    }
    onHeightChanged: {
        dirty = true
        skyLayer.requestPaint()
        terrainLayer.requestPaint()
        playLayer.requestPaint()
    }
}
