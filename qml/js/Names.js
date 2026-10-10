.pragma library

/*! Seeded callsign picks — original short names, no IP. */

var POOL = [
    "Ash", "Bramble", "Cedar", "Cinder", "Drift", "Dune",
    "Ember", "Flint", "Grit", "Haze", "Jolt", "Keel",
    "Lark", "Mesa", "Moss", "Nock", "Oath", "Pike",
    "Quill", "Ridge", "Rust", "Sable", "Summit", "Thorn",
    "Veld", "Wren", "Yarrow"
]

function pickPair(seed) {
    var s = seed === undefined ? 1 : (seed >>> 0)
    function next() {
        s = (s * 1664525 + 1013904223) >>> 0
        return s
    }
    var a = next() % POOL.length
    var b = next() % POOL.length
    if (b === a)
        b = (b + 1 + (next() % (POOL.length - 1))) % POOL.length
    return { left: POOL[a], right: POOL[b] }
}
