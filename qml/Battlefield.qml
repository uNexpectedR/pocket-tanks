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

    readonly property string weaponName: match ? Game.weaponName(match) : Weapons.HE_SHELL.name

    signal fireIntent(var intent)

    function restart(seed) {
        var s = seed === undefined ? Math.floor(Math.random() * 1000) : seed
        match = Game.createMatch(960, 540, s)
        dirty = true
        canvas.requestPaint()
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
        // Same apply path for local + online (lockstep-friendly).
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

    Canvas {
        id: canvas
        anchors.fill: parent
        renderTarget: Canvas.FramebufferObject
        renderStrategy: Canvas.Cooperative

        onPaint: {
            var ctx = getContext("2d")
            if (!ctx || !root.match)
                return
            var m = root.match
            var w = m.width
            var h = m.height
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, width, height)
            ctx.setTransform(width / w, 0, 0, height / h, 0, 0)

            Paint.sky(ctx, w, h)
            Paint.terrain(ctx, m.heights, w, h)

            if (root.showPreview && m.phase === "aim" && root.canControl())
                Paint.aimArc(ctx, Game.aimPreview(m))

            for (var i = 0; i < m.tanks.length; i++)
                Paint.tank(ctx, m.tanks[i], m.phase !== "over" && m.turn === i, root.animTime)

            Paint.projectile(ctx, m.projectile)
            Paint.explosions(ctx, m.explosions)
            Paint.sparks(ctx, m.sparks)
            Paint.hud(ctx, w, m, Game.weaponName(m), root.seatHint())
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
                moved = Effects.tickExplosions(m, dt) || Effects.tickSparks(m, dt)

            // Aim: half-rate for pulse; flight/effects: every frame; inputs set dirty.
            var busy = moved || m.phase === "flight" || m.phase === "resolve" || Effects.busy(m)
            if (root.dirty || busy || (root.frame & 1) === 0)
                canvas.requestPaint()
        }
    }

    onWidthChanged: { dirty = true; canvas.requestPaint() }
    onHeightChanged: { dirty = true; canvas.requestPaint() }
}
