# Apple TV-style home screen design

## Goal

Extend the existing LG webOS launcher with a CleanYourTV-inspired Apple TV home layout, a Portuguese time-aware greeting for Lucas, and a 24-hour clock. Keep the implementation compatible with the TV's webOS 4.10 / Chromium 53 environment.

## Home layout

- Keep the existing dark canvas, focused-app artwork shelf, and wide app tiles.
- Add a header with `Bom dia, Lucas`, `Boa tarde, Lucas`, or `Boa noite, Lucas`, plus the local date and a `HH:mm` clock.
- Use the TV's local time. Greeting ranges: morning 05:00–11:59, afternoon 12:00–17:59, evening 18:00–04:59.
- Show the first four apps in the user's Settings order in a dedicated dock.
- Put remaining apps, input sources, LG Home, and Settings in the lower home content, reached with Down from the dock. Preserve remote navigation and all existing actions.
- Preserve the focused app art shelf and existing launcher focus treatment; do not add video, networking, or expensive visual effects.

## State and behavior

- The dock derives from the existing ordered app selection; no additional persisted preference is needed.
- The lower content derives from the remaining ordered apps and existing source/misc rows.
- Time and greeting refresh on a minute timer and immediately when the app returns to the foreground.
- Settings continues to manage app visibility and ordering; the first four selected apps automatically become dock items.

## Compatibility and validation

- Use APIs and CSS supported by the project's existing webOS 4 / Chromium 53 target.
- Keep navigation remote-first and preserve mouse/pointer behavior.
- Validate with the TypeScript/Vite production build and focused tests for greeting boundaries, 24-hour formatting, and dock partition/navigation behavior.
- Do not overwrite the existing uncommitted worktree changes while implementing this design.
