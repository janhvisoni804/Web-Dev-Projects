# Step Counter Dashboard

A fitness analytics terminal with Canvas-based radial progression rings, daily step logging, and real-time biometric telemetry — built with vanilla HTML5/CSS3/JS.

## Features

- **Biometric Calculators** — Distance via stride benchmark (km = steps × 0.75m / 1000), caloric burn (kcal = steps × 0.04), aggregated daily completion rate.
- **Canvas Radial Rings** — Up to 7 concentric `ctx.arc()` progression rings color-coded by completion tier (emerald ≥100%, cyan ≥75%, amber <75%) with center average-percentage readout and legend.
- **Daily Activity Ledger** — Scrollable chronological table with ACHIEVED/MISSED status badges, goal comparison, and percentage.
- **Defensive Validation** — Positive-integer guard, duplicate-date rejection, XSS sanitization, 200k step cap, container shake on violation.
- **Persistence** — `localStorage` serialization with 15-day auto-seeded sample dataset on first boot.

## UI/UX

Dark terminal aesthetic (`#05060b`), glassmorphic panels, neon cyan/emerald/amber progress indicators, responsive `auto-fit` grid, spring-easing button micro-interactions.

## Usage

Open `index.html`. Log daily steps via the form (date, step count, goal). Telemetry tiles, ring chart, and log table update in real time. Use **Load Sample Data** to populate 15 days of simulated activity.
