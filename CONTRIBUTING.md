# Contributing to Web Dev Projects

Thank you for taking the time to contribute. This document is the single
source of truth for what an acceptable contribution looks like. PRs that
follow these rules get merged quickly; PRs that ignore them get asked to
revise.

## Before you start

- You are comfortable making a fork, a branch and a pull request. New to
  this? Read [GitHub's contributing flow](https://docs.github.com/en/get-started/quickstart/contributing-to-projects).
- Your project is **static**: HTML, CSS, JavaScript, optional assets.
  No build step, no server, no package manager. It must open by
  double-clicking `index.html`.
- Your project is **original** or properly attributed. Tutorial clones are
  fine **only** if you credit the source in your project README.

## What you can contribute

1. **A new project** under `Projects/` (most common).
2. Improvements to an existing example project (bug fix, accessibility,
   responsiveness).
3. Improvements to the showcase page, workflows or documentation.

Do **not** open PRs that:

- Add only whitespace, rename files for no reason, or "fix" the main README
  by reformatting it.
- Add empty folders, placeholder files or "coming soon" projects.
- Import frameworks (React, Vue, Tailwind via CDN is allowed; bundlers are not).
- Use AI-generated boilerplate without changes — we can tell, and they will
  be closed.

PRs of that shape are considered spam and will be closed. Repeated spam
leads to a block.

## Folder and naming rules

- Create one folder per project under `Projects/`.
- Use **Title Case with real spaces**: `To Do Web App`, not `to-do`,
  `to_do` or `todoWebApp`.
- Folder names must be unique. If your idea exists, improve the existing one
  via a PR instead of duplicating.
- Inside the folder, the following are **required**:

  ```text
  Projects/Your Project Name/
    README.md
    project.json
    index.html
  ```

  Everything else (`style.css`, `script.js`, `assets/`, etc.) is up to you.

## `project.json` schema

Every project folder must contain a `project.json` so the showcase page can
render it. Example:

```json
{
  "title": "To Do Web App",
  "description": "A keyboard-friendly to-do list with localStorage persistence and tag filters.",
  "author": {
    "name": "Your Name",
    "github": "your-github-handle"
  },
  "tags": ["productivity", "localstorage", "vanilla-js"],
  "entry": "index.html",
  "thumbnail": "thumbnail.svg"
}
```

Field rules:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Must match the folder name exactly. |
| `description` | yes | One sentence, under 160 characters. |
| `author.name` | yes | Real name or display name. |
| `author.github` | yes | GitHub username without the `@`. |
| `tags` | yes | 1–6 lowercase tags, hyphen-separated. |
| `entry` | yes | Path to the HTML file that opens the project. |
| `thumbnail` | no | SVG or PNG inside your folder. Falls back to a generated tile. |

If `project.json` is missing or invalid, the action that builds the index
will fail the PR check.

## Your project's `README.md`

At minimum include:

- A one-paragraph description.
- A "Run it" section: usually just *"Open `index.html` in any modern browser."*
- A short "What I learned" or "Features" list.
- Credits, if you followed a tutorial.

Keep it honest and short. Screenshots are welcome but optional.

## Code quality bar

- Indent with 2 spaces. Use semicolons. Use `const`/`let`, never `var`.
- Run your project in the latest Chrome and Firefox before submitting.
- No console errors in normal use.
- Respect `prefers-reduced-motion` if you add animations.
- Provide basic keyboard accessibility for interactive elements.
- Do not add tracking scripts, analytics or third-party iframes.

## Pull request flow

1. Fork the repo and create a branch named after your project, e.g.
   `add-to-do-web-app`.
2. Commit your folder. Keep commits focused.
3. Open a PR using the **New Project** template.
4. A maintainer will review. Expect small revision requests on naming or
   the README — they exist to keep the showcase clean.
5. Once merged, the showcase page rebuilds automatically. Your project
   appears within a minute.

## Reporting a problem

Use the issue templates under [Issues → New issue](../../issues/new/choose).
For security reports, follow [SECURITY.md](./SECURITY.md) instead.

By contributing you agree that your work is licensed under the repository's
[MIT license](./LICENSE) and that you will follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).
