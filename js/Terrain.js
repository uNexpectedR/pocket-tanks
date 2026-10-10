.pragma library

/*! Heightmap terrain: generate, sample, carve circular craters. */

function createHeightmap(width, baseY, amplitude, seed) {
    var heights = new Array(width)
    var s = seed === undefined ? 1 : seed
    for (var x = 0; x < width; x++) {
        var n1 = Math.sin((x + s * 17) * 0.012) * amplitude
        var n2 = Math.sin((x + s * 41) * 0.031) * (amplitude * 0.45)
        var n3 = Math.sin((x + s * 7) * 0.067) * (amplitude * 0.18)
        // Soft plateaus near spawn flanks so tanks start on firm ground.
        var edgeBoost = 0
        if (x < width * 0.18 || x > width * 0.82)
            edgeBoost = amplitude * 0.12
        heights[x] = Math.round(baseY + n1 + n2 + n3 + edgeBoost)
    }
    return heights
}

function sampleHeight(heights, x) {
    if (!heights || heights.length === 0)
        return 0
    var max = heights.length - 1
    if (x <= 0)
        return heights[0]
    if (x >= max)
        return heights[max]
    var i = Math.floor(x)
    var t = x - i
    return heights[i] * (1 - t) + heights[i + 1] * t
}

function surfaceNormal(heights, x) {
    var left = sampleHeight(heights, x - 2)
    var right = sampleHeight(heights, x + 2)
    var dy = right - left
    var len = Math.sqrt(4 * 4 + dy * dy)
    return { x: -dy / len, y: 4 / len }
}

function carveCrater(heights, cx, radius, depthScale) {
    var r = Math.max(4, Math.round(radius))
    var depth = (depthScale === undefined ? 1 : depthScale) * r * 0.85
    var start = Math.max(0, Math.floor(cx - r))
    var end = Math.min(heights.length - 1, Math.ceil(cx + r))
    for (var x = start; x <= end; x++) {
        var dx = (x - cx) / r
        var falloff = 1 - dx * dx
        if (falloff <= 0)
            continue
        // Smooth bowl: deeper at center, soft rim.
        var dig = depth * falloff * falloff
        heights[x] = Math.min(heights[x] + dig, heights[x] + depth)
        // In screen space +y is down, so digging increases height value.
    }
    return heights
}

function clampTankX(widths, x, margin) {
    var m = margin === undefined ? 18 : margin
    return Math.max(m, Math.min(widths - 1 - m, x))
}

function settleOnSurface(heights, x, hullOffset) {
    var ox = clampTankX(heights.length, x)
    var y = sampleHeight(heights, ox) - (hullOffset === undefined ? 10 : hullOffset)
    return { x: ox, y: y }
}
