# Exam Countdown

A multi-exam countdown tracker with live chronometers, nested milestone checklists, and localStorage persistence.

## Features

- **Multi-Chronometer Countdown Pipeline** — Centralized `setInterval` loop ticking every 1000ms. Each exam card displays live Days, Hours, Minutes, and Seconds computed against the hardware clock.
- **Nested Milestone Checklists** — Click "Show Tasks" to reveal a per-exam checklist. Checking/unchecking items instantly recalculates the progress bar width and `X% Complete` label.
- **Defensive Input Validation** — Modal form validates subject is non-empty, strips `<script>` tags (XSS prevention), and rejects past dates with a flashing red alert that locks the Save button.
- **Urgency Detection** — Exams within the final 24-hour window are flagged with crimson borders and red countdown digits via the `.urgent` class.
- **Persistent Storage** — All exam data serialized to `localStorage('exam_countdown_data')`. Three sample exams (Database Management Systems, Universal Human Values, Network Security) are auto-seeded on first boot.
- **Cybernetic Terminal Aesthetic** — `#05070c` backdrop, glassmorphic cards, neon cyan accents, monospace counters.

## Usage

Open `index.html` in any modern browser. Click **+ Create Exam Tracker** to add a new exam with milestones, or interact with existing cards to track progress.

## Data Structure

Each exam stores: `id`, `subject`, `dateCode` (ISO datetime string), and `milestones[]` (array of `{id, text, done}`). Full state persists across sessions.
