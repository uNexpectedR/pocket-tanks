# Ridge Fire

Turn-based artillery duel for **Logos Basecamp** (`ui_qml` module). Aim, fire, reshape the ridge — local hotseat or **online host/join** across two Macs via Logos `delivery_module`.

Original game inspired by the artillery genre. No Pocket Tanks assets or IP.

## Stack

| File | Role |
| --- | --- |
| `metadata.json` | Module identity (`type: ui_qml`, `view: qml/Main.qml`) |
| `flake.nix` | Nix build via `mkLogosQmlModule` |
| `qml/Main.qml` | Lobby + play root |
| `qml/NetBridge.qml` | Online host/join over `logos.callModule` / `onModuleEvent` |
| `qml/js/` | Terrain, physics, weapons, match flow, paint, effects, net |

## Run locally

```bash
nix run
# or without Nix:
./tools/run-preview.sh
```

```bash
node tests/physics.test.mjs
node tests/game.test.mjs
```

## Controls

| Input | Action |
| --- | --- |
| ← → | Angle (− / +); Shift for ±5 |
| ↑ ↓ | Power (+ / −); Shift for ±5 |
| Tab / Q | Cycle weapon |
| Space / Enter | Fire |
| Esc | Back to lobby |
| R | New ridge (local only) |

## Multiplayer (two Macs, online)

Requires **Logos Basecamp** with **`delivery_module`** installed and loaded (soft runtime dependency). Uses the `logos.dev` network (no RLN membership gate).

### Host

1. Open **Ridge Fire** → **Host online match**.
2. Wait until the status shows a **room code** (6 characters).
3. Share that code with the other player.
4. When the guest joins, the match starts automatically (host is **Amber**).

### Guest

1. Open **Ridge Fire** on the second Mac.
2. Enter the host’s room code → **Join**.
3. Match starts when the host receives your hello (guest is **Slate**).
4. Take turns — only your seat can aim/fire; the other Mac mirrors shots over delivery.

### Fallback

**Local hotseat (same Mac)** still works without networking (including `qmlscene` preview).

## Weapons

| Weapon | Feel |
| --- | --- |
| HE Shell | Classic blast + crater |
| Dirt Mover | Deep trench + spoil piles |
| Ridge Roller | Lands, then rolls downhill before detonating |
| Sky Burster | Airburst above the ridge |

## Install in Logos Basecamp

Paste repository URL:

```text
https://raw.githubusercontent.com/uNexpectedR/pocket-tanks/main/logos-repo.json
```

1. **Settings → Package Repositories → Add repository** (or refresh if already added).
2. Package Manager → **Ridge Fire** `0.3.1` → Install (allow unsigned if prompted).
3. Open Ridge Fire from the sidebar.
4. For online play: load **delivery_module** (Module Inspector) if Host/Join errors.

`trustedSigners` remains empty (unsigned packages).

## What’s in 0.3.x

- Prestige atmosphere: dusk sky, sun glow, far ridges, strata terrain, crest edge
- Tank silhouettes with treads / muzzle flash / active-seat pulse
- Munition trails, multi-ring blasts, sparks — readable in combat
- Layered canvas paint (sky / terrain / play) — terrain only redraws on crater
- In-place FX tick compaction, aim-arc cache, no shadowBlur on hot path
- Input fix: keys/Fire on the play surface (no full-screen FocusScope overlay)
- Online host/join + local hotseat lobby (unchanged delivery path)
- Multi-arch `.lgx` (darwin-arm64 / amd64 / x86_64, linux-amd64 / arm64)
