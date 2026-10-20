#!/bin/sh
set -e

SCRIPT_DIR="$(dirname "$0")"
TV_HOST="${TV_HOST:-}"
TV_KEY="${TV_KEY:-$HOME/.ssh/id_ed25519}"

if [ -z "$TV_HOST" ]; then
	echo 'Set TV_HOST=root@<tv-ip> before configuring the Hook.' >&2
	exit 1
fi

if [ ! -f "$TV_KEY" ]; then
	echo "SSH private key not found: $TV_KEY" >&2
	exit 1
fi

ssh -i "$TV_KEY" -o StrictHostKeyChecking=accept-new "$TV_HOST" \
	'if [ ! -f /var/lib/webosbrew/inputhook-autostart.original ]; then cp /var/lib/webosbrew/init.d/inputhook /var/lib/webosbrew/inputhook-autostart.original; fi'

scp -i "$TV_KEY" -o StrictHostKeyChecking=accept-new \
	"$SCRIPT_DIR/inputhook-start-delayed.sh" \
	"$TV_HOST:/var/lib/webosbrew/init.d/inputhook"

ssh -i "$TV_KEY" -o StrictHostKeyChecking=accept-new "$TV_HOST" \
	'chmod 755 /var/lib/webosbrew/init.d/inputhook'

echo "Delayed Input Hook startup configured on $TV_HOST"
