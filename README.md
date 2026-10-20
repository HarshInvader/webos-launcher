# webOS Launcher — Apple TV style

An Apple TV-inspired home screen for LG webOS TVs. This fork builds on
[partridgeworks/webos-launcher](https://github.com/partridgeworks/webos-launcher), with a
focus on older webOS devices and remote-control navigation.

- **Greeting and clock:** “Bom dia/Boa tarde/Boa noite, Lucas”, the date in Portuguese,
  and local time in 24-hour format. Greeting changes at 05:00, 12:00 and 18:00.
- **Artwork shelf:** artwork and title for the focused app
- **Four-app dock:** the first four apps in Settings order; press ↓ to reach the rest
- **Lower home area:** remaining apps, Live TV, HDMI inputs, LG Home and Settings
- **Remote-first UI:** large focused tiles, visible labels on focus, and animated scrolling
- **Legacy webOS target:** built for Chromium 53, the browser engine used by webOS 4.x

The launcher itself runs as a regular web app and does not require root. Optional features
such as reading the live app list through Homebrew Channel or remapping the remote's HOME
button do require root and are documented separately.

> This fork is a personal project shared as-is. The original's design and most of the
> plumbing (catalogue, inputs, Settings, packaging) are by its authors.

## Using it

| Where | Key | Does |
|---|---|---|
| Home dock | ← → | Move between the four dock apps |
| Home dock | ↓ | Move to the lower home area |
| Lower home area | ↑ | Return to the dock from its first line |
| Lower home area | ↑ ↓ | Move between apps, sources and shortcuts |
| Home | ← → | Move along the focused line |
| Home | OK | Open the focused app, input or shortcut |
| Settings | OK | Add or remove an app/source |
| Settings | Hold OK (or **Re-order** button) | Enter/leave re-order mode |
| Re-order mode | OK, arrows, OK | Pick up a tile, move it, put it down |
| Re-order mode | Back | Cancel the move / leave re-order mode |
| Settings | Back | Return home |

The Magic Remote pointer is hidden when the launcher opens; shake the remote to bring it
back. Clicking works everywhere.

The launcher doesn't take over the HOME button. On a rooted TV you can map a button to it
with [LG Input Hook](https://github.com/Simon34545/lginputhook) (app ID
`works.partridge.webos-launcher`).

## Install

See [Installation](docs/INSTALLATION.md) for the step-by-step guide for Homebrew Channel,
LG Developer Mode, building from source, SSH deployment, and optional HOME-button setup.

## Build

Needs Node.js 22.6 or newer for the build and test commands.

```sh
npm ci
npm test
npm run check:appinfo
npm run build
npm run package
```

The package is written to `build/works.partridge.webos-launcher_<version>_all.ipk`.
For installation instructions, including rooted SSH deployment, see
[Installation](docs/INSTALLATION.md).

`npm run dev` serves the UI in a desktop browser with sample inputs and the whole
catalogue, for layout work without a TV.

## Which apps appear

webOS 6 doesn't let a sideloaded web app list the installed apps or read their icons.
So the launcher ships a catalogue ([src/config/catalog.ts](src/config/catalog.ts)) with
icon copies in [public/icons/apps/](public/icons/apps/), and shows only the entries the TV
reports as installed (`applicationManager/getAppLoadStatus`, which is allowed). Apps
without a bundled icon get a tile with their name. Square icons sit in the middle of the
wide tile, and the sides are filled with the icon's own edge colours, sampled once with a
canvas.

To add your own apps or change the default row **without editing tracked files**, copy
[src/config/catalog.local.example.ts](src/config/catalog.local.example.ts) to
`src/config/catalog.local.ts` (git-ignored) and rebuild.

### Option: live app list via the Homebrew Channel (off by default)

*Settings → Options → Live app list via Homebrew Channel.*

On a rooted TV with the [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel),
turning this on reads the full list of installed apps and their real icons, instead of
the catalogue. It works by asking the Homebrew Channel's service to run
`luna-send ... listLaunchPoints` and to base64-encode each icon file. **Those commands run
as root.** The launcher only sends fixed commands; icon paths are validated and
shell-quoted before use, and app IDs never reach the shell. If the Homebrew Channel isn't
there, the launcher says so and uses the catalogue. Icons are cached in the app's local
storage.

## Developer utilities

- `npm run tv -- info` prints system information for the configured webOS CLI device.
- `TV_DEVICE=<device-name> npm run tv -- open <target>` launches an allowlisted app or
  input. Run `npm run tv --` to see supported targets.
- `scripts/tv-root.sh '<command>'` runs a command through the Homebrew Channel root
  service on the paired `lg-tv` CLI target. This maintainer helper is not needed to build
  or install the launcher.

## Compatibility and testing

The original was tested on an LG OLED C1 (2021) running **webOS 6.5**, rooted, with the
Homebrew Channel 0.7.3. The earlier redesign was tested on an unrooted LG 65" TV in
Developer Mode (Chromium 120). The current build targets Chromium 53 for webOS 4.x; check
the new dock and clock on the target TV after installation. In general:

- Newer webOS (22 and later) should run it, since the build targets an older engine, but
  the Luna calls it relies on haven't been confirmed there.
- webOS 4.x and 5.x are the legacy compatibility target; the External Input Manager call
  (`com.webos.service.eim/getAllInputStatus`) may differ and is not yet confirmed on every
  model.
- webOS 3.x and earlier are outside the current support target.
- Only the UK app IDs in the catalogue were checked on a real TV. The others come from
  public sources and are simply skipped if wrong.

Reports of what works on other models are welcome as issues, though see *no maintainer*
above.

### Notes for developers

- **Chromium 53.** `<script type="module">` won't load from `file://` on older webOS
  versions (no MIME type), and newer syntax such as `?.`/`??` is not safe.
  [vite.config.ts](vite.config.ts) builds one IIFE for `chrome53` and rewrites the script
  tag; CI fails the build if incompatible syntax slips in. The CSS uses Flexbox instead
  of CSS Grid and avoids flex `gap`, `inset` and `aspect-ratio`.
- **Luna calls used** (all in the "public" LS2 group a web app gets):
  `applicationManager/launch`, `applicationManager/getAppLoadStatus`,
  `eim/getAllInputStatus`. Denied to web
  apps on webOS 6: `listLaunchPoints`, `listApps`, `getAppInfo`, `getForegroundAppInfo`.
- **Older-TV fallbacks.** App presence checks run in batches of four. If the External Input
  Manager returns no devices or fails, available HDMI launch apps are used as a fallback;
  canvas blur is applied only when the browser supports it.
- **Pointer.** The pointer is drawn by the system, so CSS `cursor: none` does nothing;
  the app calls `webOSSystem.setCursorHidden(true)` when it comes to the foreground.
- **Remote debugging.** A dev-mode or rooted TV exposes the web inspector on port 9998.
- **Tests.** `npm test` uses Node's built-in test runner and TypeScript type stripping;
  use Node.js 22.6 or newer.

## Project layout

```
src/
  config/      constants (IDs, key codes, Luna URIs) and the app catalogue
  theme/       design tokens (colours, type, layout, motion) and the stylesheet
  lib/         Luna bridge, launching, inputs, app providers, storage, pointer,
               home clock/layout helpers, icon edge colours, top-shelf backdrops
  hooks/       remote keys, OK press/hold
  components/  Grid, Tile, OptionList, Glyph, Toast
  screens/     Home, Settings
  app.tsx      state, data loading and wiring
scripts/       build/package/install helpers, TV inspection, optional root/Hook helpers
tests/         home clock, dock partition and navigation helper tests
docs/          installation guide, design notes and earlier reference screenshots
public/        appinfo.json, app icon, bundled icons, licence texts
.github/       build on push; release (ipk + Homebrew manifest) on tag
```

## Releasing

Bump the matching `version` fields in `public/appinfo.json` and `package.json`, run
`npm run check:appinfo`, commit, then push a matching tag. For example:

```sh
VERSION="$(node -p "require('./public/appinfo.json').version")"
git tag "v$VERSION"
git push origin "v$VERSION"
```

The release workflow builds the ipk, generates the Homebrew Channel manifest
(`works.partridge.webos-launcher.manifest.json`, with the ipk's SHA-256) and attaches both
to a GitHub release. The Homebrew repository reads the manifest from the latest release.

## Licence and credits

Code: [MIT](LICENSE). Bundled Preact (MIT) and the Inter typeface (SIL OFL 1.1): see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

**Third-party icons.** The app and input icons in `public/icons/` belong to their owners
and are not covered by the MIT licence. They're included in good faith, only to show
recognisable tiles for apps already on the user's TV. Rights holders can ask for removal
by opening an issue; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This project is
not affiliated with LG Electronics or any app publisher.

Written with AI assistance (Claude Code), directed, tested and reviewed by a human on a
real TV. The Apple TV redesign likewise. Apple TV and tvOS are trademarks of Apple Inc.;
this project isn't affiliated with Apple.
