# Install on an LG webOS TV

Choose one of these install paths. Installing the launcher itself does not require root.

## Install a release with Developer Mode (no root)

### 1. Prepare the TV

1. Install the **Developer Mode** app from the LG Content Store and sign in with your LG
   account.
2. In the Developer Mode app, turn on **Dev Mode Status** and **Key Server**.
3. Note the TV's IP address and the passphrase shown in the Developer Mode app. Keep the
   passphrase private; the CLI will prompt for it.

The computer and TV need to be on the same network.

### 2. Install the webOS CLI and pair the TV

Install the [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/cli-installation)
if it is not already installed:

```sh
npm install --global @webos-tools/cli
```

Add the TV as a target, replacing the example IP address:

```sh
ares-setup-device --add myTV \
  -i "host=192.168.1.50" \
  -i "port=9922" \
  -i "username=prisoner"
```

Fetch the TV's development key. Enter the passphrase when prompted; do not put it in a
command, script, or repository file:

```sh
ares-novacom --device myTV --getkey
```

### 3. Install and launch the IPK

Download the latest `.ipk` from
[GitHub Releases](https://github.com/HarshInvader/webos-launcher/releases/latest), then
install it (replace the path with the downloaded file):

```sh
ares-install --device myTV ~/Downloads/works.partridge.webos-launcher_1.0.3_all.ipk
ares-launch --device myTV works.partridge.webos-launcher
```

You can also install an IPK with [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop).

## Install through Homebrew Channel

On a rooted TV with the [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel),
install **Launcher** from a configured Homebrew repository. Use the Homebrew Channel's app
management to update or remove it.

## Build from source

Install Node.js 22.6 or newer, clone this repository, then build and package:

```sh
git clone https://github.com/HarshInvader/webos-launcher.git
cd webos-launcher
npm ci
npm test
npm run check:appinfo
npm run build
npm run package
```

The IPK is written to `build/works.partridge.webos-launcher_<version>_all.ipk`. Install it
with the Developer Mode steps above. The build targets Chromium 53 for older webOS TVs.

## Install or update over SSH on a rooted TV

This repository also provides a one-command deploy for a rooted TV with working root SSH.
Copy the example settings file, then set `TV_HOST` to `root@<tv-ip>` or to an SSH alias that
already works from your computer:

```sh
cp tv.env.example tv.env
```

Edit `tv.env`, then run:

```sh
npm ci
npm run deploy
```

`deploy` builds, packages, copies the IPK to the TV, installs it using webOS's app install
service, and launches the app. `tv.env` is git-ignored; do not commit private keys,
passphrases, or personal TV addresses.

## Optional: map the remote's HOME button

The launcher does not replace LG Home or take over the HOME button by itself. On a rooted
TV, install [LG Input Hook](https://github.com/Simon34545/lginputhook) and map HOME to app
ID `works.partridge.webos-launcher` in the Hook's settings.

On the tested webOS 4.10 TV, `tvservice` starts before the Hook can capture HOME. The
optional helper waits 60 seconds before starting the Hook. It requires root SSH and saves
the existing startup script before replacing it:

```sh
TV_HOST=root@192.168.1.50 \
TV_KEY="$HOME/.ssh/id_ed25519" \
  sh scripts/tv/install-inputhook-start-delayed.sh
```

This delayed start is for the tested older webOS 4.x startup behavior; it is not needed for
ordinary app installation and should not be enabled on other versions without confirming
the same startup issue.

To restore the saved startup script, run this from the computer and reboot the TV:

```sh
ssh -i "$HOME/.ssh/id_ed25519" root@192.168.1.50 \
  'cp /var/lib/webosbrew/inputhook-autostart.original /var/lib/webosbrew/init.d/inputhook && chmod 755 /var/lib/webosbrew/init.d/inputhook'
```

Change the HOME mapping separately in LG Input Hook if you want the button to open LG Home
again. The LG Home tile remains available inside the launcher.

## Uninstall

With Developer Mode CLI, remove the app by its app ID:

```sh
ares-install --device myTV --remove works.partridge.webos-launcher
```

If HOME is mapped through LG Input Hook, change that mapping before uninstalling the
launcher.
