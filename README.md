# Ridge Fire

Turn-based artillery duel for **Logos Basecamp** (`ui_qml` module). Aim, fire, reshape the ridge — local hotseat or **online host/join** across two Macs via Logos `delivery_module`.

Original game inspired by the artillery genre. No Pocket Tanks assets or IP.

Licensed under the [MIT License](LICENSE).

## Stack

| File | Role |
| --- | --- |
| `metadata.json` | Module identity (`type: ui_qml`, `view: qml/Main.qml`) |
| `flake.nix` | Nix build via `mkLogosQmlModule` |
| `qml/Main.qml` | Lobby + play root |
| `qml/NetBridge.qml` | Online host/join over `logos.callModule` / `onModuleEvent` |
| `qml/js/` | Terrain, physics, weapons, names, match flow, paint, effects, net |

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

1. Open **Ridge Fire** → **Host online**.
2. A popup shows your **room code** — tap **Copy code** and send it to the other player.
3. Wait until status says the room is ready (or a clear error if delivery fails).
4. When the guest joins, the match starts automatically (left seat).

### Guest

1. Open **Ridge Fire** on the second Mac → **Join online**.
2. **Paste** the host’s room code → **Join**.
3. Match starts when the host receives your hello (right seat).
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
| Spike Shell | Hard direct hit, tight splash |
| Splinter Cap | Breaks into three small blasts |
| Mole Charge | Deep narrow dig |
| Skipper | Skips once on dirt, then arms |
| Ember Pot | Wide soft splash |

## Install in Logos Basecamp

Paste repository URL:

```text
https://raw.githubusercontent.com/uNexpectedR/ridge-fire/main/logos-repo.json
```

1. **Settings → Package Repositories → Add repository** (or refresh if already added).
2. Package Manager → **Ridge Fire** `0.4.2` → Install (allow unsigned if prompted).
3. Open Ridge Fire from the sidebar.
4. For online play: load **delivery_module** (Module Inspector) if Host/Join errors.

`trustedSigners` remains empty (unsigned packages).

## What’s in 0.4.2

- Online room popup: Host shows code + **Copy**; Join has paste-friendly field + **Join**
- Delivery bring-up waits for `nodeStarted` / `IsRunning`, with a **25s timeout** and clear error (no infinite “starting…”)
- Lobby **Play offline · local hotseat** button — larger, high-contrast bone fill next to Host/Join
- Nine curated weapons, fairer hits, sage crest, callsigns, taller dock (from 0.4.x)
- Multi-arch `.lgx` (darwin-arm64 / amd64 / x86_64, linux-amd64 / arm64)
