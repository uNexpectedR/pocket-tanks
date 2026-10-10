.pragma library

/*! Canvas painters for the battlefield — one job each, no match logic. */

function sky(ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#0b1018")
    g.addColorStop(0.42, "#1a2740")
    g.addColorStop(0.72, "#3a4a3a")
    g.addColorStop(1, "#6a5a3a")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    var haze = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.7)
    haze.addColorStop(0, "#00000000")
    haze.addColorStop(0.45, "#f0c87822")
    haze.addColorStop(1, "#00000000")
    ctx.fillStyle = haze
    ctx.fillRect(0, h * 0.48, w, h * 0.22)

    ctx.fillStyle = "#e8e2d628"
    for (var i = 0; i < 28; i++) {
        var sx = (i * 97 + 13) % w
        var sy = (i * 53 + 29) % ((h * 0.45) | 0)
        ctx.fillRect(sx, sy, 1.5, 1.5)
    }
}

function terrain(ctx, heights, w, h) {
    if (!heights)
        return
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

    ctx.beginPath()
    ctx.moveTo(0, heights[0])
    for (var i = 1; i < heights.length; i++)
        ctx.lineTo(i, heights[i])
    ctx.strokeStyle = "#e8d2a0aa"
    ctx.lineWidth = 2
    ctx.stroke()
}

function tank(ctx, unit, active, animTime) {
    if (!unit || unit.hp <= 0)
        return
    var x = unit.x
    var y = unit.y
    ctx.save()
    ctx.translate(x, y)

    ctx.fillStyle = "#00000066"
    ctx.beginPath()
    ctx.ellipse(-18, 9, 36, 9)
    ctx.fill()

    ctx.fillStyle = "#1a1814"
    ctx.fillRect(-20, 3, 40, 9)
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 1.25
    ctx.strokeRect(-20, 3, 40, 9)

    var hg = ctx.createLinearGradient(0, -16, 0, 6)
    hg.addColorStop(0, unit.accent)
    hg.addColorStop(1, unit.color)
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
    ctx.fillStyle = unit.color
    ctx.fill()
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 1
    ctx.stroke()

    var rad = unit.angle * Math.PI / 180
    var dir = unit.facing >= 0 ? 1 : -1
    var bx = Math.cos(rad) * 28 * dir
    var by = -11 - Math.sin(rad) * 28
    ctx.strokeStyle = "#2a2620"
    ctx.lineWidth = 5
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(0, -11)
    ctx.lineTo(bx, by)
    ctx.stroke()
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, -11)
    ctx.lineTo(bx, by)
    ctx.stroke()

    if (active) {
        ctx.strokeStyle = "#e8e2d6aa"
        ctx.lineWidth = 1.25
        ctx.beginPath()
        ctx.arc(0, -4, 22 + Math.sin(animTime * 3.2) * 2, 0, Math.PI * 2)
        ctx.stroke()
    }
    ctx.restore()

    ctx.fillStyle = "#e8e2d6"
    ctx.font = "600 12px 'IBM Plex Sans'"
    ctx.textAlign = "center"
    ctx.fillText(unit.name, x, y - 40)
    var hpW = 40
    var hp = unit.hp / unit.maxHp
    ctx.fillStyle = "#00000077"
    ctx.fillRect(x - hpW / 2, y - 34, hpW, 5)
    ctx.fillStyle = unit.hp < 30 ? "#c45c48" : unit.accent
    ctx.fillRect(x - hpW / 2, y - 34, hpW * hp, 5)
}

function aimArc(ctx, pts) {
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

function projectile(ctx, shot) {
    if (!shot)
        return
    ctx.save()
    var trail = shot.trail
    if (trail && trail.length > 1) {
        ctx.strokeStyle = shot.rolling ? "#9cb8be66" : "#e2b57a55"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(trail[0].x, trail[0].y)
        for (var i = 1; i < trail.length; i++)
            ctx.lineTo(trail[i].x, trail[i].y)
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

function explosions(ctx, list) {
    if (!list || !list.length)
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
    }
}

function sparks(ctx, list) {
    if (!list || !list.length)
        return
    for (var i = 0; i < list.length; i++) {
        var s = list[i]
        ctx.globalAlpha = 1 - s.age / s.life
        ctx.fillStyle = s.color
        ctx.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4)
    }
    ctx.globalAlpha = 1
}

function hud(ctx, w, match, weaponLabel, seatHint) {
    if (!match)
        return
    var tank = match.tanks[match.turn]
    ctx.save()
    ctx.fillStyle = "#0e1218aa"
    ctx.fillRect(w / 2 - 210, 10, 420, 46)
    ctx.strokeStyle = "#3a423866"
    ctx.strokeRect(w / 2 - 210, 10, 420, 46)

    ctx.fillStyle = "#e8e2d6"
    ctx.font = "500 16px 'IBM Plex Serif'"
    ctx.textAlign = "center"
    ctx.fillText(match.message || "Ridge Fire", w / 2, 30)

    ctx.font = "12px 'IBM Plex Sans'"
    ctx.fillStyle = "#9a9488"
    if (tank && match.phase !== "over") {
        ctx.fillText(
            "A " + Math.round(tank.angle) + "°   P " + Math.round(tank.power)
                + "   HP " + Math.round(tank.hp) + "   " + weaponLabel + (seatHint || ""),
            w / 2, 48
        )
    }
    ctx.restore()
}
