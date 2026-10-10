import QtQuick 2.15
import "js/Game.js" as Game
import "js/Weapons.js" as Weapons

Item {
    id: root

    property var match: null
    property bool showPreview: true
    property real animTime: 0
    readonly property string weaponName: Weapons.SHELL.name

    function restart(seed) {
        var s = seed === undefined ? Math.floor(Math.random() * 1000) : seed
        match = Game.createMatch(960, 540, s)
        canvas.requestPaint()
    }

    function fire() { return match ? Game.fire(match) : false }
    function nudgeAngle(d) { if (match) Game.nudgeAngle(match, d) }
    function nudgePower(d) { if (match) Game.nudgePower(match, d) }
    function setAngle(v) { if (match) Game.setAngle(match, v) }
    function setPower(v) { if (match) Game.setPower(match, v) }

    function paintSky(ctx, w, h) {
        var g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, "#12161c")
        g.addColorStop(0.55, "#1c2430")
        g.addColorStop(1, "#2a3340")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)

        var haze = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.62)
        haze.addColorStop(0, "#00000000")
        haze.addColorStop(0.5, "#d7c4a214")
        haze.addColorStop(1, "#00000000")
        ctx.fillStyle = haze
        ctx.fillRect(0, h * 0.42, w, h * 0.2)
    }

    function paintTerrain(ctx, heights, w, h) {
        if (!heights)
            return
        ctx.beginPath()
        ctx.moveTo(0, h)
        ctx.lineTo(0, heights[0])
        for (var x = 1; x < heights.length; x++)
            ctx.lineTo(x, heights[x])
        ctx.lineTo(w, h)
        ctx.closePath()

        var g = ctx.createLinearGradient(0, h * 0.4, 0, h)
        g.addColorStop(0, "#9a8768")
        g.addColorStop(0.35, "#7a684f")
        g.addColorStop(1, "#4a3f32")
        ctx.fillStyle = g
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(0, heights[0])
        for (var i = 1; i < heights.length; i++)
            ctx.lineTo(i, heights[i])
        ctx.strokeStyle = "#c4b08a88"
        ctx.lineWidth = 1.5
        ctx.stroke()
    }

    function paintTank(ctx, tank, active) {
        if (!tank || tank.hp <= 0)
            return
        var x = tank.x
        var y = tank.y
        ctx.save()
        ctx.translate(x, y)

        ctx.fillStyle = "#00000055"
        ctx.beginPath()
        ctx.ellipse(-16, 8, 32, 8)
        ctx.fill()

        ctx.fillStyle = "#2a2620"
        ctx.fillRect(-18, 2, 36, 8)
        ctx.strokeStyle = tank.accent
        ctx.lineWidth = 1
        ctx.strokeRect(-18, 2, 36, 8)

        var hg = ctx.createLinearGradient(0, -14, 0, 6)
        hg.addColorStop(0, tank.accent)
        hg.addColorStop(1, tank.color)
        ctx.fillStyle = hg
        ctx.beginPath()
        ctx.moveTo(-16, 2)
        ctx.lineTo(-14, -8)
        ctx.lineTo(14, -8)
        ctx.lineTo(16, 2)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.arc(0, -8, 8, 0, Math.PI * 2)
        ctx.fillStyle = tank.color
        ctx.fill()

        var rad = tank.angle * Math.PI / 180
        var dir = tank.facing >= 0 ? 1 : -1
        ctx.strokeStyle = tank.accent
        ctx.lineWidth = 3.5
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(0, -10)
        ctx.lineTo(Math.cos(rad) * 28 * dir, -10 - Math.sin(rad) * 28)
        ctx.stroke()

        if (active) {
            ctx.strokeStyle = "#e8e2d6aa"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(0, -4, 22 + Math.sin(root.animTime * 3) * 1.5, 0, Math.PI * 2)
            ctx.stroke()
        }

        ctx.restore()

        ctx.fillStyle = "#e8e2d6"
        ctx.font = "600 12px 'IBM Plex Sans'"
        ctx.textAlign = "center"
        ctx.fillText(tank.name, x, y - 36)
        var hpW = 36
        var hp = tank.hp / tank.maxHp
        ctx.fillStyle = "#00000066"
        ctx.fillRect(x - hpW / 2, y - 30, hpW, 4)
        ctx.fillStyle = tank.hp < 30 ? "#c45c48" : tank.accent
        ctx.fillRect(x - hpW / 2, y - 30, hpW * hp, 4)
    }

    function paintPreview(ctx, pts) {
        if (!pts || pts.length < 2)
            return
        ctx.save()
        ctx.strokeStyle = "#e8e2d655"
        ctx.setLineDash([4, 6])
        ctx.lineWidth = 1.25
        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        for (var i = 1; i < pts.length; i++)
            ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
    }

    function paintProjectile(ctx, shot) {
        if (!shot)
            return
        ctx.save()
        ctx.fillStyle = "#f0e6d2"
        ctx.shadowColor = "#e2b57a"
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(shot.x, shot.y, shot.radius || 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = "#e2b57a88"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(shot.x, shot.y)
        ctx.lineTo(shot.x - shot.vx * 0.04, shot.y - shot.vy * 0.04)
        ctx.stroke()
        ctx.restore()
    }

    function paintExplosions(ctx, list) {
        if (!list)
            return
        for (var i = 0; i < list.length; i++) {
            var e = list[i]
            var t = e.age / e.life
            var r = e.r * (0.35 + t * 0.9)
            var alpha = 1 - t
            ctx.beginPath()
            ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
            ctx.strokeStyle = "rgba(226, 181, 122," + (alpha * 0.85) + ")"
            ctx.lineWidth = 2
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(e.x, e.y, r * 0.45, 0, Math.PI * 2)
            ctx.fillStyle = "rgba(196, 92, 72," + (alpha * 0.35) + ")"
            ctx.fill()
        }
    }

    function paintBanner(ctx, w, text) {
        ctx.save()
        ctx.fillStyle = "#e8e2d6"
        ctx.font = "500 18px 'IBM Plex Serif'"
        ctx.textAlign = "center"
        ctx.globalAlpha = 0.92
        ctx.fillText(text, w / 2, 36)
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

            if (root.showPreview && m.phase === "aim")
                root.paintPreview(ctx, Game.aimPreview(m))

            for (var i = 0; i < m.tanks.length; i++)
                root.paintTank(ctx, m.tanks[i], m.phase !== "over" && m.turn === i)

            root.paintProjectile(ctx, m.projectile)
            root.paintExplosions(ctx, m.explosions)
            root.paintBanner(ctx, w, m.message || "Ridge Fire")
        }
    }

    Timer {
        interval: 16
        running: true
        repeat: true
        onTriggered: {
            if (!root.match)
                root.restart(11)
            var dt = interval / 1000
            root.animTime += dt
            if (root.match.phase !== "over")
                Game.tick(root.match, dt)
            else
                Game.tickExplosions(root.match, dt)
            canvas.requestPaint()
        }
    }

    Component.onCompleted: restart(11)
    onWidthChanged: canvas.requestPaint()
    onHeightChanged: canvas.requestPaint()
}
