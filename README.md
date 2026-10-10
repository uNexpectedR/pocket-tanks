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

## Install in Logos Basecamp (Package Repositories)

Basecamp **Settings → Package Repositories → Add repository** expects the URL of a `logos-repo.json` catalog, not the bare GitHub repo URL.

Paste this:

```text
https://raw.githubusercontent.com/uNexpectedR/pocket-tanks/main/logos-repo.json
```

Then:

1. Open **Settings → Package Repositories → Add repository**.
2. Paste the URL above and confirm.
3. Refresh the package list if needed — you should see **Ridge Fire** (`ridge_fire` `0.1.0`).
4. Install it from the catalog UI (or **Install Local Package** with a downloaded `.lgx`).

Catalog index (auto-updated):

```text
https://github.com/uNexpectedR/pocket-tanks/releases/download/index/index.json
```

Package asset:

```text
https://github.com/uNexpectedR/pocket-tanks/releases/download/ridge_fire-v0.1.0/ridge_fire-0.1.0.lgx
```

### Caveats

- Current publish is **unsigned** (`trustedSigners: []`). Basecamp must allow unsigned packages (signature-policy setting) for install to succeed.
- The hand-built `0.1.0` release includes **linux-amd64** only. macOS / ARM users need a multi-variant rebuild (Actions → **Release ridge_fire**, or bump `metadata.json` version and re-run).
- Local paths (`nix run`, Qt preview) still work from source without the catalog.

### Re-publishing

```bash
nix build '.#lgx-portable' --out-link result-lgx-portable
# or: Actions → Release ridge_fire (uses logos-modules-release-action)
```

Workflows under `.github/workflows/` call [logos-modules-release-action](https://github.com/logos-co/logos-modules-release-action) with `signing_mode: none` and rebuild the rolling `index` release.

## Deferred

- Extra weapons / inventory economy
- Wind and multiplayer networking
- AI opponent
- Sound / particle polish beyond blast rings
- Multi-variant / signed catalog releases
