# Pomodoro Timer

A distraction-free Pomodoro timer built with vanilla HTML, CSS and JavaScript. Designed to help you stay focused using the classic 25/5 work-break cycle, with a handful of extras that make it genuinely useful day-to-day.

## Features

- **Three modes** — Pomodoro, Short Break, Long Break with automatic cycling.
- **Animated ring** — SVG progress ring that drains as time counts down.
- **Task list** — Add tasks before you start; the active task automatically earns a 🍅 each completed Pomodoro.
- **Stats dashboard** — Tracks Pomodoros completed today, this week, all-time, and your current daily streak, with a 7-day bar chart.
- **Customisable settings** — Adjust all durations, session count before a long break, auto-start for breaks and Pomodoros, sound alerts, and browser notifications.
- **Light / dark theme** — Persisted across sessions.
- **Tab title countdown** — The remaining time shows in the browser tab so you always know where you are.
- **Keyboard shortcuts** — `Space` to start/pause, `R` to reset.
- Fully offline, no dependencies, no tracking.

## Run it

Open `index.html` in any modern browser. That's it.

## What I learned

- Managing a countdown timer cleanly with `setInterval` and proper cleanup.
- Drawing and animating an SVG ring with `stroke-dashoffset`.
- Using the Web Audio API to generate a soft beep without any audio files.
- Persisting structured data (settings, stats, tasks) in `localStorage`.
- Keeping CSS variables consistent across theme switches and mode changes.
