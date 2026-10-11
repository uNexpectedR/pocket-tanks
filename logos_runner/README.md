# Logos Runner

Cyberpunk endless runner (`ui_qml`) for **Logos Basecamp**. Sign in with a callsign, run the neon strip, climb the board.

Inspired by the arcade / blade-runner vibe popular in Basecamp game sessions — built as a native Logos module (not a generic web toy).

## Stack (Logos)

| Piece | Logos choice |
| --- | --- |
| UI | `ui_qml` + QML Canvas |
| Package | `metadata.json` + `logos-module-builder` / Nix flake |
| Install | `logos-repo.json` → Basecamp Package Repositories |
| Local scores | `Qt.labs.settings` (plugin-local) |
| Shared board | `delivery_module` on `logos.dev` topic `/logos-runner/1/scores/proto` |
| Auth | Callsign inside Basecamp (no Hey/OAuth — Basecamp is the shell) |
| Release | `logos-modules-release-action` → `.lgx` + rolling `index` |

## Install in Logos Basecamp

Paste repository URL (same catalog as Ridge Fire until a dedicated repo exists):

```text
https://raw.githubusercontent.com/uNexpectedR/pocket-tanks/main/logos-repo.json
```

1. **Settings → Package Repositories → Add repository**
2. Package Manager → **Logos Runner** → Install (allow unsigned if prompted)
3. Open **Logos Runner** from the sidebar
4. Optional competitive sync: load **delivery_module**, then tap **Sync** on the board

`trustedSigners` remains empty (unsigned packages).

### After first release

If Package Manager does not list Logos Runner yet, run the **Release logos_runner** GitHub Action (or wait for the rolling index rebuild), then refresh repositories.

## Run locally

```bash
cd logos_runner
nix run
# or:
./tools/run-preview.sh
```

```bash
node tests/game.test.mjs
node tests/scores.test.mjs
```

## Controls

| Input | Action |
| --- | --- |
| Space / ↑ | Jump |
| ↓ | Slide (clears low gates) |
| Esc | Menu |

## Scores & security

- Callsign: `^[A-Za-z0-9_\-.]{2,16}$`
- Scores clamped to `0…9999999`; remote payloads validated before merge
- Board keeps best score per callsign (max 20 rows)
- Delivery messages require `t=score`, `v=1`; own echoes ignored
- No API secrets, no open HTTP endpoints (QML sandbox + Logos modules only)

## Env / credentials

None required for local play or local board.

For **live competitive board** inside Basecamp:

- `delivery_module` installed and loadable
- Network access for `logos.dev` (delivery preset)

No OAuth client IDs or deploy URLs — packaging is `.lgx` via the Logos release workflow.
