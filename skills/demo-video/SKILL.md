---
name: demo-video
description: Record a short MP4 demo of a web app feature (headless Chrome drives the real app, with captions and highlighted clicks) for a PR, a client or a changelog. Use when the user asks to make a demo video, screen recording or walkthrough of a feature in any web project.
argument-hint: <feature and what the video should show>
---

# demo-video

Make a 1–5 minute MP4 of a feature in the real running app. You write one scenario file;
the kit in `scripts/` (next to this file, call it `KIT`) does the browser, captions and recording.

Request: $ARGUMENTS

## Rules

- Never edit the app's code. Only write inside `.demo/` at the project root.
- Never commit `.demo/` or videos. On setup, add `.demo/` to `.git/info/exclude`.
- Don't start the app yourself; if it doesn't answer, tell the user the command to run.
- Learn pages with `peek` (text). Open a screenshot only when a step fails (`out/shots/FAIL-*.png`).
- Keep it 1–5 minutes. Captions: one short sentence about what the viewer sees, no tech words.

## Steps

1. **Setup, once per project.** If `.demo/demo.config.js` is missing: if `KIT/node_modules` is missing run
   `npm install --prefix KIT`; copy `KIT/../templates/demo.config.js` to `.demo/`, then fill `app`
   and `signIn` from the project's auth code (set the session cookie or call the login API; never
   type in the login form). Add `api` if data must be prepared. Check: `curl -s -o /dev/null -w '%{http_code}' <app>`.
2. **Plan** 4–7 scenes (who does what, on which page). Write it as a comment at the top of the scenario.
3. **Peek** each page: `node KIT/peek.js <route> [user] [--click="Tab>>Button"]` (run from the project root).
   Use the exact texts it prints.
4. **Write** `.demo/scenarios/<name>.js` from `KIT/../templates/scenario.js`. Make data in `prepare(kit)`,
   safe to run twice.
5. **Dry run**: `node KIT/run.js .demo/scenarios/<name>.js`. On failure read the error and the FAIL shot,
   fix, rerun only that part: `--only=scene --no-prepare`.
6. **Record**: `node KIT/run.js .demo/scenarios/<name>.js --record` → `.demo/out/<output>.mp4`.
7. **Report**: video path, length, one line per scene.

## Inside `kit.step` (runs in the browser, use `const d = window.__d`)

| Helper | Use |
|---|---|
| `d.caption(line, line2?)` | Caption band; `line2` for a translation (RTL detected) |
| `d.card(title, sub?)` / `d.card(null)` | Full-screen title card for intro/outro |
| `d.btn(text, root?)` | Button, link, tab or menu item by its text |
| `d.field(label, root?, nth?)` / `d.combo(label, ...)` | Input / dropdown by label, aria-label or placeholder |
| `d.type(el, text)` / `d.setVal(el, v)` | Type visibly / set at once (dates). Never `el.value = x` |
| `d.pick(combo, option)` | Choose in a native or custom dropdown. Custom ones don't open with `.click()` |
| `d.click(el)` / `d.flash(el)` | Highlight then click / highlight a result |
| `d.until(() => cond)` | Wait for something. Use it instead of fixed waits after an action |
| `d.wait(ms)` | Reading pause: 2500–4500 ms after each important result |
| `d.dialog()` / `d.row(text)` / `d.has(text)` | Open dialog / table row / text on page |
| `d.showImage(dataUrl, line)` | Show a PDF, print or email over the page; get the URL with `kit.imageOf(file)` in Node |

Node side (`kit`): `signInAs(page, user)`, `go(page, route, readyText)`, `step(page, name, fn, ...args)`,
`api(method, route, user, body)`, `imageOf(file)`, `outDir`. The function given to `kit.step` cannot see
outside variables: pass them as extra arguments.
