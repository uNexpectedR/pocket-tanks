# Ridge Fire

Turn-based artillery duel for **Logos Basecamp** (`ui_qml` module). Two tanks, one ridge, destructible terrain, a single HE shell — aim with angle and power, then fire.

Original game inspired by the artillery genre. No Pocket Tanks assets or IP.

## Stack

Matches Logos Basecamp module conventions from [`logos-module-builder#ui-qml`](https://github.com/logos-co/logos-module-builder):

| File | Role |
| --- | --- |
| `metadata.json` | Module identity (`type: ui_qml`, `view: Main.qml`) |
| `flake.nix` | Nix build via `mkLogosQmlModule` |
| `Main.qml` | Plugin root view (loaded by Basecamp / standalone host) |
| `qml/` | Battlefield canvas + control dock |
| `js/` | Terrain, physics, weapons, match flow |
| `Preview.qml` | Local `qmlscene` window wrapper |

## Run locally

### Logos / Nix (preferred)

```bash
nix run
```

Requires Nix flakes. This builds the module and launches the standalone UI host bundled with `logos-module-builder`.

### Qt 6 preview (no Nix)

```bash
# Debian/Ubuntu example:
# sudo apt install qmlscene-qt6 qml6-module-qtquick qml6-module-qtquick-controls \
#   qml6-module-qtquick-layouts qml6-module-qtquick-window fonts-ibm-plex

./tools/run-preview.sh
```

### Tests

```bash
node tests/physics.test.mjs
node tests/game.test.mjs
```

## Controls

| Input | Action |
| --- | --- |
| ← → | Angle (− / +); hold Shift for ±5 |
| ↑ ↓ | Power (+ / −); hold Shift for ±5 |
| Space / Enter | Fire (or restart when match is over) |
| R | New ridge |
| Sliders / Fire | Same as keyboard |

## What’s in the MVP

- Two tanks (Amber / Slate), alternating turns
- Angle + power aiming with dashed arc preview
- Gravity projectile flight
- Destructible heightmap terrain (crater carving)
- One weapon: HE Shell (blast damage + crater)
- Win when the opponent’s HP reaches 0
- Quiet visual language: night ridge, IBM Plex, minimal chrome

## Deferred

- Extra weapons / inventory economy
- Wind and multiplayer networking
- AI opponent
- Sound / particle polish beyond blast rings
- LGX packaging CI beyond the flake template
