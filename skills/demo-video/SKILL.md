---
name: demo-video
description: Record an MP4 demo of a web app feature (the real running app, with captions and highlighted clicks) for a PR, a client or a changelog. Use when the user asks for a demo video, screen recording or walkthrough of a feature.
argument-hint: <feature and what the video should show>
---

# demo-video

Record an MP4 demo of this feature in the running app, as long as the feature needs: $ARGUMENTS

- Drive the real app with Puppeteer (system Chrome is fine), record with `page.screencast()`, convert to H.264 MP4 with ffmpeg.
- Work only in `.demo/` at the project root and add it to `.git/info/exclude`. Never edit app code, never commit videos.
- If the app is not running, start it yourself (and anything it needs, like the database), and stop what you started when done.
- Log in by setting the session cookie or token directly (read the auth code), not through the login form. Prepare data through the API or DB, safe to run twice.
- Learn pages from DOM text, not screenshots; look at a screenshot only when a step fails. Get a clean dry run before recording.
- Make it easy to follow for a non-technical viewer: inject [overlay.js](overlay.js) for captions, title cards, highlight-then-click and visible typing. Pause long enough on each result to read it. One plain sentence per caption about what is on screen.
- Report the video path, its length and one line per scene.
