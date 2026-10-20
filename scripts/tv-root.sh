#!/bin/sh
# Run a shell command as root on the TV via Homebrew Channel elevated service.
# Usage: scripts/tv-root.sh '<command>'
set -e
cd "$(dirname "$0")/.."
ENC="$(printf '%s' "$1 > /tmp/hb-out 2>&1" | base64 | tr -d '\n')"
./node_modules/.bin/ares-novacom --device lg-tv --run "luna-send-pub -i -w 20000 -f luna://org.webosbrew.hbchannel.service/exec '{\"command\":\"echo $ENC | base64 -d | sh\"}' >/dev/null & p=\$!; sleep ${WAIT:-4}; kill \$p 2>/dev/null; cat /tmp/hb-out" 2>&1 | grep -v '^\[Info\]'
