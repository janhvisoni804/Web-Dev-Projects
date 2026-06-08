# Kanban Task Board

A polished, dark-theme Kanban board built with vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **Native HTML5 Drag & Drop** — full dragstart/dragover/dragleave/drop pipeline with glowing drop-zone cues and visual drag silhouette.
- **Decoupled State Matrix** — single `tasks` array of objects (`id`, `title`, `description`, `priority`, `status`). Every mutation re-renders from data, never from DOM.
- **Modal Task Editor** — create and edit tasks with title, description, and priority (low/medium/high). Input sanitization escapes HTML entities to prevent layout breakage.
- **Persistent localStorage** — board state auto-saves on every add, edit, delete, or drop. Restores on page load.
- **Premium Dark Aesthetic** — `#060713` background, glassmorphic columns with `backdrop-filter`, neon accent dots (blue for To Do, amber for In Progress, emerald for Done), fluid hover-lift transitions.
- **Responsive** — 3-column grid on desktop, single-column vertical stack on mobile.

## Run it

Open `index.html` in any modern browser. No build step required.
