.pragma library

/*! Compact artillery arsenal — original names, genre feel, no IP lift. */

var HE_SHELL = {
    id: "he",
    name: "HE Shell",
    blurb: "Solid blast and crater",
    blastRadius: 44,
    craterRadius: 40,
    maxDamage: 48,
    projectileRadius: 4,
    trail: "#e2b57a",
    kind: "blast"
}

var DIRT_MOVER = {
    id: "dirt",
    name: "Dirt Mover",
    blurb: "Carve a trench, pile the spoil",
    blastRadius: 28,
    craterRadius: 52,
    maxDamage: 12,
    projectileRadius: 5,
    trail: "#9a8768",
    kind: "dirt",
    pileRadius: 36,
    pileHeight: 28
}

var ROLLER = {
    id: "roller",
    name: "Ridge Roller",
    blurb: "Hits dirt, then rolls downhill",
    blastRadius: 30,
    craterRadius: 22,
    maxDamage: 36,
    projectileRadius: 5,
    trail: "#9cb8be",
    kind: "roller",
    rollBounces: 10,
    rollFriction: 0.985
}

var BURSTER = {
    id: "burster",
    name: "Sky Burster",
    blurb: "Airburst above the ridge",
    blastRadius: 50,
    craterRadius: 26,
    maxDamage: 38,
    projectileRadius: 3.5,
    trail: "#d7a06a",
    kind: "airburst",
    fuseHeight: 48
}

function catalog() {
    return [HE_SHELL, DIRT_MOVER, ROLLER, BURSTER]
}

function byId(id) {
    var list = catalog()
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id)
            return list[i]
    }
    return HE_SHELL
}

function nextId(id, delta) {
    var list = catalog()
    var idx = 0
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            idx = i
            break
        }
    }
    var n = (idx + (delta || 1)) % list.length
    if (n < 0)
        n += list.length
    return list[n].id
}
