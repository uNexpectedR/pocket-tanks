.pragma library

/*! Canvas painters — sky / terrain / units / FX / HUD. One job each. */

function sky(ctx, w, h, animTime) {
    var g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#070b12")
    g.addColorStop(0.35, "#152238")
    g.addColorStop(0.62, "#2a3a48")
    g.addColorStop(0.82, "#5a4a38")
    g.addColorStop(1, "#8a6a42")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    // Warm sun disk just above the ridge line — genre energy, original look.
    var sunX = w * 0.78
    var sunY = h * 0.52
    var sunR = Math.min(w, h) * 0.055
    var glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 4.5)
    glow.addColorStop(0, "#f0c87855")
    glow.addColorStop(0.35, "#e2a06028")
    glow.addColorStop(1, "#00000000")
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunR * 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#f2d49a"
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2)
    ctx.fill()

    // Distant ridge silhouettes (static atmosphere, not gameplay terrain).
    farRidge(ctx, w, h, h * 0.48, 0.014, 22, "#1a2430aa")
    farRidge(ctx, w, h, h * 0.54, 0.02, 14, "#24304088")

    var haze = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.72)
    haze.addColorStop(0, "#00000000")
    haze.addColorStop(0.4, "#f0c87830")
    haze.addColorStop(1, "#00000000")
    ctx.fillStyle = haze
    ctx.fillRect(0, h * 0.45, w, h * 0.27)

    // Sparse stars — optional twinkle when animTime provided.
    var tw = animTime === undefined ? 0 : animTime
    for (var i = 0; i < 36; i++) {
        var sx = (i * 97 + 13) % w
        var sy = (i * 53 + 29) % ((h * 0.42) | 0)
        var a = 0.18 + (((i * 17) % 10) / 40)
        if (tw)
            a += Math.sin(tw * 2.1 + i) * 0.06
        ctx.fillStyle = "rgba(232,226,214," + a + ")"
        ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1.4, i % 5 === 0 ? 2 : 1.4)
    }
}

function farRidge(ctx, w, h, baseY, freq, amp, color) {
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, baseY + Math.sin(0) * amp)
    for (var x = 8; x <= w; x += 8) {
        var y = baseY + Math.sin(x * freq) * amp + Math.sin(x * freq * 2.3) * (amp * 0.35)
        ctx.lineTo(x, y)
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
}

function terrain(ctx, heights, w, h) {
    if (!heights)
        return
    var n = heights.length

    // Deep bedrock fill.
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, heights[0])
    for (var x = 1; x < n; x++)
        ctx.lineTo(x, heights[x])
    ctx.lineTo(w, h)
    ctx.closePath()
    var deep = ctx.createLinearGradient(0, h * 0.3, 0, h)
    deep.addColorStop(0, "#c4a878")
    deep.addColorStop(0.22, "#9a7c52")
    deep.addColorStop(0.55, "#5c4630")
    deep.addColorStop(0.82, "#2a2016")
    deep.addColorStop(1, "#14100c")
    ctx.fillStyle = deep
    ctx.fill()

    // Mid strata band — darker strip under the crest for readable depth.
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, heights[0])
    for (var i = 1; i < n; i++)
        ctx.lineTo(i, heights[i])
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.clip()
    var strata = ctx.createLinearGradient(0, 0, 0, h)
    strata.addColorStop(0, "#00000000")
    strata.addColorStop(0.5, "#00000000")
    strata.addColorStop(0.62, "#3a2e2244")
    strata.addColorStop(0.78, "#1e181244")
    strata.addColorStop(1, "#0a080666")
    ctx.fillStyle = strata
    ctx.fillRect(0, 0, w, h)

    // Sparse soil ticks for texture (cheap, clipped to terrain).
    ctx.strokeStyle = "#2a201655"
    ctx.lineWidth = 1
    for (var t = 24; t < n; t += 28) {
        var gy = heights[t]
        ctx.beginPath()
        ctx.moveTo(t, gy + 8)
        ctx.lineTo(t + 6, gy + 18)
        ctx.stroke()
    }
    ctx.restore()

    // Sage grass crest — combat-readable silhouette (rgba: Qt Canvas rejects #RRGGBBAA).
    ctx.beginPath()
    ctx.moveTo(0, heights[0])
    for (var j = 1; j < n; j++)
        ctx.lineTo(j, heights[j])
    ctx.strokeStyle = "rgba(143, 168, 122, 0.92)"
    ctx.lineWidth = 2.6
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, heights[0] + 1.5)
    for (var k = 1; k < n; k++)
        ctx.lineTo(k, heights[k] + 1.5)
    ctx.strokeStyle = "rgba(74, 90, 56, 0.55)"
    ctx.lineWidth = 3
    ctx.stroke()
}

function tank(ctx, unit, active, animTime) {
    if (!unit || unit.hp <= 0)
        return
    var x = unit.x
    var y = unit.y
    ctx.save()
    ctx.translate(x, y)

    // Ground contact shadow.
    ctx.fillStyle = "#00000070"
    ctx.beginPath()
    ctx.ellipse(-20, 10, 40, 10)
    ctx.fill()

    // Treads.
    ctx.fillStyle = "#141210"
    ctx.fillRect(-22, 4, 44, 10)
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 1.1
    ctx.strokeRect(-22, 4, 44, 10)
    ctx.fillStyle = "#2a2620"
    for (var lug = -18; lug <= 18; lug += 6)
        ctx.fillRect(lug, 6, 3, 6)

    // Hull body with accent rim.
    var hg = ctx.createLinearGradient(0, -16, 0, 6)
    hg.addColorStop(0, unit.accent)
    hg.addColorStop(0.55, unit.color)
    hg.addColorStop(1, "#1a1814")
    ctx.fillStyle = hg
    ctx.beginPath()
    ctx.moveTo(-18, 4)
    ctx.lineTo(-16, -8)
    ctx.lineTo(16, -8)
    ctx.lineTo(18, 4)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 1.2
    ctx.stroke()

    // Turret.
    ctx.beginPath()
    ctx.arc(0, -8, 10, 0, Math.PI * 2)
    ctx.fillStyle = unit.color
    ctx.fill()
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 1.15
    ctx.stroke()
    ctx.fillStyle = "#0e0c0a88"
    ctx.fillRect(-4, -12, 8, 3)

    // Barrel — dark core + accent sheath.
    var rad = unit.angle * Math.PI / 180
    var dir = unit.facing >= 0 ? 1 : -1
    var bx = Math.cos(rad) * 30 * dir
    var by = -10 - Math.sin(rad) * 30
    ctx.lineCap = "round"
    ctx.strokeStyle = "#1a1612"
    ctx.lineWidth = 5.5
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(bx, by)
    ctx.stroke()
    ctx.strokeStyle = unit.accent
    ctx.lineWidth = 3.2
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(bx, by)
    ctx.stroke()
    // Muzzle ring.
    ctx.fillStyle = "#f0e6d2"
    ctx.beginPath()
    ctx.arc(bx, by, 2.4, 0, Math.PI * 2)
    ctx.fill()

    if (active) {
        var pulse = 20 + Math.sin(animTime * 3.4) * 2.5
        ctx.strokeStyle = "rgba(232,226,214," + (0.45 + Math.sin(animTime * 3.4) * 0.2) + ")"
        ctx.lineWidth = 1.35
        ctx.beginPath()
        ctx.arc(0, -2, pulse, 0, Math.PI * 2)
        ctx.stroke()
        // Soft ground wash under active seat.
        var wash = ctx.createRadialGradient(0, 8, 2, 0, 8, 34)
        wash.addColorStop(0, "rgba(226,181,122,0.28)")
        wash.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = wash
        ctx.beginPath()
        ctx.arc(0, 8, 34, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.restore()

    ctx.fillStyle = "#e8e2d6"
    ctx.font = "600 12px 'IBM Plex Sans'"
    ctx.textAlign = "center"
    ctx.fillText(unit.name, x, y - 42)
    var hpW = 42
    var hp = unit.hp / unit.maxHp
    ctx.fillStyle = "#00000088"
    ctx.fillRect(x - hpW / 2, y - 36, hpW, 5)
    ctx.fillStyle = unit.hp < 30 ? "#c45c48" : unit.accent
    ctx.fillRect(x - hpW / 2, y - 36, hpW * hp, 5)
    ctx.strokeStyle = "#e8e2d633"
    ctx.lineWidth = 1
    ctx.strokeRect(x - hpW / 2, y - 36, hpW, 5)
}

function aimArc(ctx, pts) {
    if (!pts || pts.length < 2)
        return
    ctx.save()
    ctx.strokeStyle = "#e8e2d655"
    ctx.setLineDash([4, 8])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (var i = 1; i < pts.length; i++)
        ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
    ctx.setLineDash([])
    var last = pts[pts.length - 1]
    ctx.fillStyle = "#e8e2d6aa"
    ctx.beginPath()
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#e8e2d644"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
}

function projectile(ctx, shot) {
    if (!shot)
        return
    ctx.save()
    var trail = shot.trail
    var tint = shot.rolling ? "#9cb8be" : "#e2b57a"
    if (trail && trail.length > 1) {
        // Fade trail by drawing segments with falling alpha (no shadowBlur).
        var n = trail.length
        for (var i = 1; i < n; i++) {
            var a = (i / n) * 0.55
            ctx.strokeStyle = shot.rolling
                ? "rgba(156,184,190," + a + ")"
                : "rgba(226,181,122," + a + ")"
            ctx.lineWidth = 1.5 + (i / n) * 1.5
            ctx.beginPath()
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
            ctx.lineTo(trail[i].x, trail[i].y)
            ctx.stroke()
        }
    }
    var r = shot.radius || 4
    // Soft corona without canvas shadowBlur (cheaper, still readable).
    ctx.fillStyle = shot.rolling ? "rgba(156,184,190,0.35)" : "rgba(226,181,122,0.35)"
    ctx.beginPath()
    ctx.arc(shot.x, shot.y, r * 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#f8f0e4"
    ctx.beginPath()
    ctx.arc(shot.x, shot.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = tint
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.restore()
}

function explosions(ctx, list) {
    if (!list || !list.length)
        return
    for (var i = 0; i < list.length; i++) {
        var e = list[i]
        var t = e.age / e.life
        var r = e.r * (0.25 + t * 1.15)
        var alpha = 1 - t
        var flash = t < 0.18 ? (1 - t / 0.18) : 0

        if (flash > 0) {
            ctx.beginPath()
            ctx.arc(e.x, e.y, e.r * 0.35 * (1 + flash), 0, Math.PI * 2)
            ctx.fillStyle = "rgba(255,236,200," + (flash * 0.75) + ")"
            ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(232,210,160," + (alpha * 0.85) + ")"
        ctx.lineWidth = 2.8 * (1 - t * 0.5)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(e.x, e.y, r * 0.62, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(196,92,72," + (alpha * 0.55) + ")"
        ctx.lineWidth = 1.6
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(e.x, e.y, r * 0.38, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(196,92,72," + (alpha * 0.35) + ")"
        ctx.fill()
    }
}

function sparks(ctx, list) {
    if (!list || !list.length)
        return
    for (var i = 0; i < list.length; i++) {
        var s = list[i]
        var life = 1 - s.age / s.life
        ctx.globalAlpha = life
        ctx.fillStyle = s.color
        var sz = s.size || 2.4
        ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz)
    }
    ctx.globalAlpha = 1
}

function muzzleFlash(ctx, list) {
    if (!list || !list.length)
        return
    for (var i = 0; i < list.length; i++) {
        var m = list[i]
        var t = 1 - m.age / m.life
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(m.angle)
        ctx.fillStyle = "rgba(255,220,160," + (t * 0.9) + ")"
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(14 * t, -5 * t)
        ctx.lineTo(22 * t, 0)
        ctx.lineTo(14 * t, 5 * t)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
    }
}

function hud(ctx, w, match, weaponLabel, seatHint) {
    if (!match)
        return
    var tank = match.tanks[match.turn]
    var left = w / 2 - 220
    ctx.save()
    ctx.fillStyle = "#0a0e14bb"
    ctx.fillRect(left, 8, 440, 48)
    ctx.strokeStyle = tank ? "rgba(226,181,122,0.4)" : "#3a423866"
    ctx.lineWidth = 1.25
    ctx.strokeRect(left, 8, 440, 48)
    // Accent tick for active seat.
    if (tank && match.phase !== "over") {
        ctx.fillStyle = tank.accent
        ctx.fillRect(left, 8, 4, 48)
    }

    ctx.fillStyle = "#e8e2d6"
    ctx.font = "500 16px 'IBM Plex Serif'"
    ctx.textAlign = "center"
    ctx.fillText(match.message || "Ridge Fire", w / 2, 28)

    ctx.font = "12px 'IBM Plex Sans'"
    ctx.fillStyle = "#9a9488"
    if (tank && match.phase !== "over") {
        ctx.fillText(
            "A " + Math.round(tank.angle) + "°   P " + Math.round(tank.power)
                + "   HP " + Math.round(tank.hp) + "   " + weaponLabel + (seatHint || ""),
            w / 2, 46
        )
    }
    ctx.restore()
}
