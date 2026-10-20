#!/bin/sh
# webOS 4.10 starts tvservice early; wait before initializing the root input hook.
(
	sleep 60
	output="$(luna-send -w 10000 -n 1 -f luna://org.webosbrew.inputhook.service/start '{}' 2>&1)"
	case "$output" in
		*'status unknown'*)
			sleep 5
			output="$(luna-send -w 10000 -n 1 -f luna://org.webosbrew.inputhook.service/start '{}' 2>&1)"
			;;
	esac
	printf '%s\n' "$output" >> /tmp/inputhook-startup.log
) </dev/null >/dev/null 2>&1 &
exit 0
