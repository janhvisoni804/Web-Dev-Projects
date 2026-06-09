# Memory Booster

A Simon-says style memory training game built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **Procedural Grid Sequence Engine** — Randomized tile sequences generated per round, flashed one by one for 500ms each. Grid scales from 4×4 (levels 1–3) to 5×5 (level 4+). Sequence length increases with level (`2 + floor(level * 0.8)`, max 12).
- **Exploit-Safe Input Locking** — All tiles disabled during the flash animation. Inputs only unlock after the full sequence finishes. On click, the first mismatch instantly locks and triggers failure.
- **Scoring System** — Points = `sequenceLength × 10 × multiplier`. Multiplier = `1 + (level-1) × 0.2`. Streak tracks consecutive level completions; best streak saved as personal best.
- **Visual Feedback** — Correct tile hit → emerald pulse (`tile.hit`). Wrong tile → crimson flash + screen shake animation. Full sequence match → "✅ Level N complete!" message.
- **History Ledger** — Every failed round records level reached, score, accuracy percentage, and date. Displayed in a scrollable panel. Capped at 30 entries.
- **localStorage Persistence** — Best score and history array saved to `localStorage('memory_booster_data')`. Restored on boot.
- **Cybernetic Training Aesthetic** — `#05070c` background, 3-panel layout (telemetry / grid / history), glassmorphic panels, neon cyan tiles on flash, emerald hit / crimson wrong states.

## Run it

Open `index.html` in any modern browser.
