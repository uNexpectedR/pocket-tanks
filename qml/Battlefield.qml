import QtQuick 2.15
import "js/Game.js" as Game
import "js/Weapons.js" as Weapons

Item {
    id: root

    property var match: null
    property bool showPreview: true
    property real animTime: 0
    property int localSeat: -1            // -1 = hotseat both; 0/1 = online seat
    property bool inputEnabled: true
    readonly property string weaponName: match ? Game.weaponName(match) : Weapons.HE_SHELL.name
    readonly property var weaponList: Weapons.catalog()

    signal fireIntent(var intent)

    function restart(seed) {
        var s = seed === undefined ? Math.floor(Math.random() * 1000) : seed
        match = Game.createMatch(960, 540, s)
        canvas.requestPaint()
    }

    function canControl() {
        if (!match || match.phase !== "aim")
            return false
        if (!inputEnabled)
            return false
        if (localSeat < 0)
            return true
        return match.turn === localSeat
    }

    function fire() {
        if (!match || !canControl())
            return false
        var intent = Game.fireIntent(match)
        if (!intent)
            return false
        if (localSeat >= 0) {
            // Online: apply locally via same path as remote for lockstep seq
            Game.applyRemoteFire(match, intent)
            root.fireIntent(intent)
            return true
        }
        return Game.fire(match)
    }

    function applyRemoteFire(msg) {
        if (!match)
            return false
        return Game.applyRemoteFire(match, msg)
    }

    function nudgeAngle(d) { if (match && canControl()) Game.nudgeAngle(match, d) }
    function nudgePower(d) { if (match && canControl()) Game.nudgePower(match, d) }
    function setAngle(v) { if (match && canControl()) Game.setAngle(match, v) }
    function setPower(v) { if (match && canControl()) Game.setPower(match, v) }
    function setWeapon(id) { if (match && canControl()) Game.setWeapon(match, id) }
    function cycleWeapon(d) { if (match && canControl()) Game.cycleWeapon(match, d) }

    function paintSky(ctx, w, h) {
        var g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, "#0b1018")
        g.addColorStop(0.42, "#1a2740")
        g.addColorStop(0.72, "#3a4a3a")
        g.addColorStop(1, "#6a5a3a")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)

        // Horizon glow — classic artillery contrast without clutter.
        var haze = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.7)
        haze.addColorStop(0, "#00000000")
        haze.addColorStop(0.45, "#f0c87822")
        haze.addColorStop(1, "#00000000")
        ctx.fillStyle = haze
        ctx.fillRect(0, h * 0.48, w, h * 0.22)

        // Sparse stars
        ctx.fillStyle = "#e8e2d628"
        for (var i = 0; i < 28; i++) {
            var sx = ((i * 97 + 13) % w)
            var sy = ((i * 53 + 29) % Math.floor(h * 0.45))
            ctx.fillRect(sx, sy, 1.5, 1.5)
        }
    }

    function paintTerrain(ctx, heights, w, h) {
        if (!heights)
            return
        // Deep earth fill
        ctx.beginPath()
        ctx.moveTo(0, h)
        ctx.lineTo(0, heights[0])
        for (var x = 1; x < heights.length; x++)
            ctx.lineTo(x, heights[x])
        ctx.lineTo(w, h)
        ctx.closePath()
        var g = ctx.createLinearGradient(0, h * 0.35, 0, h)
        g.addColorStop(0, "#b79a68")
        g.addColorStop(0.28, "#8a704c")
        g.addColorStop(0.7, "#5a4632")
        g.addColorStop(1, "#2e2418")
        ctx.fillStyle = g
        ctx.fill()

        // Lit ridge crest
        ctx.beginPath()
        ctx.moveTo(0, heights[0])
        for (var i = 1; i < heights.length; i++)
            ctx.lineTo(i, heights[i])
        ctx.strokeStyle = "#e8d2a0aa"
        ctx.lineWidth = 2
        ctx.stroke()

        // Secondary darker contour for depth
        ctx.beginPath()
        ctx.moveTo(0, heights[0] + 6)
        for (var j = 1; j < heights.length; j += 2)
            ctx.lineTo(j, heights[j] + 6)
        ctx.strokeStyle = "#3a2e2255"
        ctx.lineWidth = 1
        ctx.stroke()
    }

    function paintTank(ctx, tank, active) {
        if (!tank || tank.hp <= 0)
            return
        var x = tank.x
        var y = tank.y
        ctx.save()
        ctx.translate(x, y)

        ctx.fillStyle = "#00000066"
        ctx.beginPath()
        ctx.ellipse(-18, 9, 36, 9)
        ctx.fill()

        // Tracks
        ctx.fillStyle = "#1a1814"
        ctx.fillRect(-20, 3, 40, 9)
        ctx.strokeStyle = tank.accent
        ctx.lineWidth = 1.25
        ctx.strokeRect(-20, 3, 40, 9)
        for (var t = -16; t <= 16; t += 8) {
            ctx.beginPath()
            ctx.moveTo(t, 3)
            ctx.lineTo(t, 12)
            ctx.strokeStyle = "#00000055"
            ctx.stroke()
        }

        var hg = ctx.createLinearGradient(0, -16, 0, 6)
        hg.addColorStop(0, tank.accent)
        hg.addColorStop(1, tank.color)
        ctx.fillStyle = hg
        ctx.beginPath()
        ctx.moveTo(-17, 3)
        ctx.lineTo(-15, -9)
        ctx.lineTo(15, -9)
        ctx.lineTo(17, 3)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.arc(0, -9, 9, 0, Math.PI * 2)
        ctx.fillStyle = tank.color
        ctx.fill()
        ctx.strokeStyle = tank.accent
        ctx.lineWidth = 1
        ctx.stroke()

        var rad = tank.angle * Math.PI / 180
        var dir = tank.facing >= 0 ? 1 : -1
        ctx.strokeStyle = "#2a2620"
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(0, -11)
        ctx.lineTo(Math.cos(rad) * 28 * dir, -11 - Math.sin(rad) * 28)
        ctx.stroke()
        ctx.strokeStyle = tank.accent
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, -11)
        ctx.lineTo(Math.cos(rad) * 28 * dir, -11 - Math.sin(rad) * 28)
        ctx.stroke()

        if (active) {
            var pulse = 22 + Math.sin(root.animTime * 3.2) * 2
            ctx.strokeStyle = "#e8e2d6aa"
            ctx.lineWidth = 1.25
            ctx.beginPath()
            ctx.arc(0, -4, pulse, 0, Math.PI * 2)
            ctx.stroke()
        }

        ctx.restore()

        ctx.fillStyle = "#e8e2d6"
        ctx.font = "600 12px 'IBM Plex Sans'"
        ctx.textAlign = "center"
        ctx.fillText(tank.name, x, y - 40)
        var hpW = 40
        var hp = tank.hp / tank.maxHp
        ctx.fillStyle = "#00000077"
        ctx.fillRect(x - hpW / 2, y - 34, hpW, 5)
        ctx.fillStyle = tank.hp < 30 ? "#c45c48" : tank.accent
        ctx.fillRect(x - hpW / 2, y - 34, hpW * hp, 5)
    }

    function paintPreview(ctx, pts) {
        if (!pts || pts.length < 2)
            return
        ctx.save()
        ctx.strokeStyle = "#e8e2d666"
        ctx.setLineDash([5, 7])
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (var i = 1; i < pts.length; i++)
            ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke()
        ctx.setLineDash([])
        var last = pts[pts.length - 1]
        ctx.fillStyle = "#e8e2d688"
        ctx.beginPath()
        ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }

    function paintProjectile(ctx, shot) {
        if (!shot)
            return
        ctx.save()
        if (shot.trail && shot.trail.length > 1) {
            ctx.strokeStyle = (shot.rolling ? "#9cb8be66" : "#e2b57a55")
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(shot.trail[0].x, shot.trail[0].y)
            for (var i = 1; i < shot.trail.length; i++)
                ctx.lineTo(shot.trail[i].x, shot.trail[i].y)
            ctx.stroke()
        }
        ctx.fillStyle = "#f0e6d2"
        ctx.shadowColor = shot.rolling ? "#9cb8be" : "#e2b57a"
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(shot.x, shot.y, shot.radius || 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()
    }

    function paintExplosions(ctx, list) {
        if (!list)
            return
        for (var i = 0; i < list.length; i++) {
            var e = list[i]
            var t = e.age / e.life
            var r = e.r * (0.3 + t * 1.05)
            var alpha = 1 - t
            ctx.beginPath()
            ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
            ctx.strokeStyle = "rgba(232, 210, 160," + (alpha * 0.9) + ")"
            ctx.lineWidth = 2.5
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(e.x, e.y, r * 0.5, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(196, 92, 72," + (alpha * 0.4) + ")"
            ctx.fill()
            ctx.beginPath()
            ctx.arc(e.x, e.y, r * 0.2, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(240, 230, 210," + (alpha * 0.55) + ")"
            ctx.fill()
        }
    }

    function paintSparks(ctx, list) {
        if (!list)
            return
        for (var i = 0; i < list.length; i++) {
            var s = list[i]
            var a = 1 - s.age / s.life
            ctx.fillStyle = s.color
            ctx.globalAlpha = a
            ctx.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4)
        }
        ctx.globalAlpha = 1
    }

    function paintHud(ctx, w, m) {
        if (!m)
            return
        var tank = m.tanks[m.turn]
        ctx.save()
        // Compact top strip — readable angle/power/HP/weapon
        ctx.fillStyle = "#0e1218aa"
        ctx.fillRect(w / 2 - 210, 10, 420, 46)
        ctx.strokeStyle = "#3a423866"
        ctx.strokeRect(w / 2 - 210, 10, 420, 46)

        ctx.fillStyle = "#e8e2d6"
        ctx.font = "500 16px 'IBM Plex Serif'"
        ctx.textAlign = "center"
        ctx.fillText(m.message || "Ridge Fire", w / 2, 30)

        ctx.font = "12px 'IBM Plex Sans'"
        ctx.fillStyle = "#9a9488"
        if (tank && m.phase !== "over") {
            var you = root.localSeat >= 0 ? (m.turn === root.localSeat ? " · your shot" : " · wait") : ""
            ctx.fillText(
                "A " + Math.round(tank.angle) + "°   P " + Math.round(tank.power)
                    + "   HP " + Math.round(tank.hp) + "   " + Game.weaponName(m) + you,
                w / 2, 48
            )
        }
        ctx.restore()
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

            root.paintSky(ctx, w, h)
            root.paintTerrain(ctx, m.heights, w, h)

            if (root.showPreview && m.phase === "aim" && root.canControl())
                root.paintPreview(ctx, Game.aimPreview(m))

            for (var i = 0; i < m.tanks.length; i++)
                root.paintTank(ctx, m.tanks[i], m.phase !== "over" && m.turn === i)

            root.paintProjectile(ctx, m.projectile)
            root.paintExplosions(ctx, m.explosions)
            root.paintSparks(ctx, m.sparks)
            root.paintHud(ctx, w, m)
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
            if (root.match.phase !== "over")
                Game.tick(root.match, dt)
            else {
                Game.tickExplosions(root.match, dt)
                Game.tickSparks(root.match, dt)
            }
            canvas.requestPaint()
        }
    }

    onWidthChanged: canvas.requestPaint()
    onHeightChanged: canvas.requestPaint()
}
