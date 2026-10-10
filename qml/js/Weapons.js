.pragma library

/*! Curated artillery set — original names, classic feel, no IP lift. */

var HE_SHELL = {
    id: "he",
    name: "HE Shell",
    blurb: "Solid blast and crater",
    blastRadius: 44,
    craterRadius: 40,
    maxDamage: 48,
    directMul: 1.2,
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
    maxDamage: 14,
    directMul: 1.05,
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
    directMul: 1.15,
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
    blastRadius: 52,
    craterRadius: 26,
    maxDamage: 40,
    directMul: 1.1,
    projectileRadius: 3.5,
    trail: "#d7a06a",
    kind: "airburst",
    fuseHeight: 48
}

var SPIKE = {
    id: "spike",
    name: "Spike Shell",
    blurb: "Hard direct hit, tight splash",
    blastRadius: 22,
    craterRadius: 16,
    maxDamage: 58,
    directMul: 1.45,
    projectileRadius: 3,
    trail: "#c8b090",
    kind: "blast"
}

var SPLINTER = {
    id: "splinter",
    name: "Splinter Cap",
    blurb: "Breaks into three small blasts",
    blastRadius: 26,
    craterRadius: 18,
    maxDamage: 28,
    directMul: 1.1,
    projectileRadius: 4,
    trail: "#e0a878",
    kind: "cluster",
    clusterCount: 3,
    clusterSpread: 34
}

var MOLE = {
    id: "mole",
    name: "Mole Charge",
    blurb: "Deep narrow dig under the crest",
    blastRadius: 20,
    craterRadius: 18,
    maxDamage: 30,
    directMul: 1.2,
    projectileRadius: 4,
    trail: "#8a7860",
    kind: "digger",
    digDepth: 1.55
}

var SKIPPER = {
    id: "skipper",
    name: "Skipper",
    blurb: "Skips once on dirt, then arms",
    blastRadius: 36,
    craterRadius: 28,
    maxDamage: 42,
    directMul: 1.25,
    projectileRadius: 4,
    trail: "#b8c4a8",
    kind: "bounce",
    bounceCount: 1
}

var EMBER = {
    id: "ember",
    name: "Ember Pot",
    blurb: "Wide soft splash across the ridge",
    blastRadius: 62,
    craterRadius: 34,
    maxDamage: 34,
    directMul: 1.05,
    projectileRadius: 5.5,
    trail: "#d4885a",
    kind: "blast"
}

var _catalog = null

function catalog() {
    if (!_catalog) {
        _catalog = [
            HE_SHELL, DIRT_MOVER, ROLLER, BURSTER,
            SPIKE, SPLINTER, MOLE, SKIPPER, EMBER
        ]
    }
    return _catalog
}

function names() {
    var list = catalog()
    var out = []
    for (var i = 0; i < list.length; i++)
        out.push(list[i].name)
    return out
}

function ids() {
    var list = catalog()
    var out = []
    for (var i = 0; i < list.length; i++)
        out.push(list[i].id)
    return out
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
