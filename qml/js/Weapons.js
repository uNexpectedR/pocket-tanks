.pragma library

/*! Single solid MVP weapon: High Explosive Shell. */

var SHELL = {
    id: "shell",
    name: "HE Shell",
    blastRadius: 42,
    craterRadius: 38,
    maxDamage: 45,
    projectileRadius: 4
}

function catalog() {
    return [SHELL]
}

function byId(id) {
    if (id === SHELL.id)
        return SHELL
    return SHELL
}
